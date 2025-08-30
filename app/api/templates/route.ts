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

    // Filter Google Docs files only
    const templates = files
      .filter((file) => file.mimeType === "application/vnd.google-apps.document")
      .map((file) => ({
        id: file.id,
        name: file.name,
        type: type || "resume", // Default to resume if not specified
        folderId,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
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

    // Create the template
    const template = await GoogleDocsService.createTemplate(name, type, folderId, content)

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
