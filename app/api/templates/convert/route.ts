import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { GoogleDriveService } from "@/lib/google-drive"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { fileId, moveOriginalToArchive, deleteOriginal } = body as { fileId?: string; moveOriginalToArchive?: boolean; deleteOriginal?: boolean }
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 })
    }

    const drive = await GoogleDriveService.getDrive()
    const meta = await drive.files.get({ fileId, fields: "id, name, mimeType, parents" })
    const mime = meta.data.mimeType
    const googleDocMime = "application/vnd.google-apps.document"
    const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    if (mime === googleDocMime) {
      return NextResponse.json({ workingId: fileId, wasConverted: false })
    }

    if (mime === docxMime) {
      const parentId = (meta.data.parents && meta.data.parents[0]) || undefined
      const converted = await GoogleDriveService.convertDocxToGoogleDoc(fileId, meta.data.name, parentId)
      let deleteSucceeded = false

      // Optionally delete the original .docx
      if (deleteOriginal) {
        try {
          await GoogleDriveService.deleteFile(fileId)
          deleteSucceeded = true
        } catch (e) {
          console.warn("Failed to delete original .docx:", (e as Error).message)
        }
      }
      // Or move the original .docx to an Archive folder in the same parent
      else if (moveOriginalToArchive && parentId) {
        try {
          const drive = await GoogleDriveService.getDrive()
          // Find or create archive folder
          const archiveName = "Originals (Archived)"
          const existingArchive = await GoogleDriveService.findFolderByName(archiveName, parentId)
          const archiveFolder = existingArchive ?? await GoogleDriveService.createFolder(archiveName, parentId)
          // Move original file to archive
          await drive.files.update({
            fileId,
            addParents: archiveFolder.id,
            removeParents: parentId,
          })
        } catch (e) {
          console.warn("Failed to move original .docx to archive:", (e as Error).message)
        }
      }

      return NextResponse.json({ workingId: converted.id, wasConverted: true, deletedOriginal: deleteSucceeded })
    }

    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
  } catch (error) {
    console.error("Error converting template:", error)
    return NextResponse.json({ error: "Failed to prepare template" }, { status: 500 })
  }
}


