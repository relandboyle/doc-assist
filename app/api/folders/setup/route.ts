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
    const { method, folderName, existingFolderId, parentFolderName } = body

    let folders

    if (method === "new") {
      if (!folderName) {
        return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
      }
      if (!existingFolderId) {
        return NextResponse.json({ error: "Parent folder ID is required" }, { status: 400 })
      }
      // Create the main folder in the selected parent folder
      const mainFolder = await GoogleDriveService.createFolder(folderName, existingFolderId)

      // Create subfolders inside the main folder
      const resumeFolder = await GoogleDriveService.createFolder("Resume Templates", mainFolder.id)
      const coverLetterFolder = await GoogleDriveService.createFolder("Cover Letter Templates", mainFolder.id)

      folders = {
        mainFolder,
        resumeFolder,
        coverLetterFolder,
        parentFolder: { id: existingFolderId, name: parentFolderName || "Selected Folder" },
      }
    } else if (method === "existing") {
      if (!existingFolderId) {
        return NextResponse.json({ error: "Existing folder ID is required" }, { status: 400 })
      }

      // Create subfolders in existing folder
      const resumeFolder = await GoogleDriveService.createFolder("Resume Templates", existingFolderId)
      const coverLetterFolder = await GoogleDriveService.createFolder("Cover Letter Templates", existingFolderId)

      folders = {
        mainFolder: { id: existingFolderId, name: "Existing Folder" },
        resumeFolder,
        coverLetterFolder,
        parentFolder: { id: existingFolderId, name: parentFolderName || "Existing Folder" },
      }
    } else {
      return NextResponse.json({ error: "Invalid setup method" }, { status: 400 })
    }

    return NextResponse.json({ folders }, { status: 201 })
  } catch (error) {
    console.error("Error setting up folders:", error)
    return NextResponse.json({ error: "Failed to setup folders" }, { status: 500 })
  }
}
