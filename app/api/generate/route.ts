import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { GoogleDocsService } from "@/lib/google-docs"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, variables, documentName, targetFolderId } = body

    if (!templateId || !variables || !documentName) {
      return NextResponse.json({ error: "Template ID, variables, and document name are required" }, { status: 400 })
    }

    // Generate document from template
    const generatedDocumentId = await GoogleDocsService.generateFromTemplate(
      templateId,
      variables,
      documentName,
      targetFolderId,
    )

    return NextResponse.json({ documentId: generatedDocumentId }, { status: 201 })
  } catch (error) {
    console.error("Error generating document:", error)
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 })
  }
}
