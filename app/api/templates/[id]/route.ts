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
    const document = await GoogleDocsService.getDocument(templateId)
    const variables = await GoogleDocsService.getTemplateVariables(templateId)

    return NextResponse.json({ document, variables })
  } catch (error) {
    console.error("Error fetching template:", error)
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
