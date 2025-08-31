import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { GoogleDocsService } from "@/lib/google-docs"
import { GoogleDriveService } from "@/lib/google-drive"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get("debug") === "1"

    const document = await GoogleDocsService.getDocument(templateId)
    const variables = await GoogleDocsService.getTemplateVariables(templateId)

    if (debug) {
      const text = await GoogleDocsService.getDocumentText(templateId)
      return NextResponse.json({ document, variables, textPreview: text })
    }

    return NextResponse.json({ document, variables })
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
