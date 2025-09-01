import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { GoogleDriveService } from "@/lib/google-drive"
import { GoogleDocsService } from "@/lib/google-docs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const type = searchParams.get("type") as "resume" | "coverLetter" | null

    if (!folderId) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 })
    }

    // Get all files in the folder
    const files = await GoogleDriveService.listFiles(folderId)

    // Show Google Docs and Office .docx in lists (docx will show Convert action in UI)
    const DOCS = "application/vnd.google-apps.document"
    const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    const templates = files
      .filter((file) => file.mimeType === DOCS || file.mimeType === DOCX)
      .map((file) => ({
        id: file.id,
        name: file.name,
        type: type || "resume", // Default to resume if not specified
        folderId,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        mimeType: file.mimeType,
      }))

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type, folderId, content } = body

    if (!name || !type || !folderId) {
      return NextResponse.json({ error: "Name, type, and folder ID are required" }, { status: 400 })
    }

    // Prevent duplicate names within the same folder (case-insensitive, trimmed)
    const existingFiles = await GoogleDriveService.listFiles(folderId)
    const normalizedNewName = String(name).trim().toLowerCase()
    const hasDuplicate = existingFiles.some((f) => String(f.name).trim().toLowerCase() === normalizedNewName)
    if (hasDuplicate) {
      return NextResponse.json(
        { error: `A file named "${name}" already exists in this folder.` },
        { status: 409 },
      )
    }

    // Create the template
    const template = await GoogleDocsService.createTemplate(name, type, folderId, content)

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
