import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { GoogleDocsService } from "@/lib/google-docs"
import { GoogleDriveService } from "@/lib/google-drive"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const templateId = id
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get("debug") === "1"

    // Determine mimeType; convert .docx to Google Doc for variable extraction
    const drive = await GoogleDriveService.getDrive()
    const meta = await drive.files.get({ fileId: templateId, fields: "id, name, mimeType, parents" })
    const mime = meta.data.mimeType
    const googleDocMime = "application/vnd.google-apps.document"
    const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    let workingId = templateId
    let cleanupId: string | null = null
    if (mime === docxMime) {
      // Convert .docx to Google Doc in the same parent (if available) for parsing
      const parentId = (meta.data.parents && meta.data.parents[0]) || undefined
      const converted = await GoogleDriveService.convertDocxToGoogleDoc(templateId, meta.data.name, parentId)
      workingId = converted.id
      cleanupId = converted.id
    } else if (mime !== googleDocMime) {
      // Unsupported format for variable parsing
      return NextResponse.json({ error: "Unsupported template type for variable parsing" }, { status: 400 })
    }

    try {
      const document = await GoogleDocsService.getDocument(workingId)
      const variables = await GoogleDocsService.getTemplateVariables(workingId)

      if (debug) {
        const text = await GoogleDocsService.getDocumentText(workingId)
        return NextResponse.json({ document, variables, textPreview: text, converted: !!cleanupId })
      }

      return NextResponse.json({ document, variables, converted: !!cleanupId })
    } finally {
      // Clean up temporary converted doc if we created one
      if (cleanupId) {
        try { await GoogleDriveService.deleteFile(cleanupId) } catch {}
      }
    }
  } catch (error) {
    console.error("Error fetching template:", error)
    // If debug mode, include more details to help diagnose
    try {
      const { searchParams } = new URL(request.url)
      const debug = searchParams.get("debug") === "1"
      if (debug) {
        const err: any = error
        const details = err?.errors || err?.response?.data || err?.message || String(err)
        return NextResponse.json({ error: "Failed to fetch template", details }, { status: 500 })
      }
    } catch {}
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id
    await GoogleDriveService.deleteFile(templateId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
