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
      // If a folder with the same name already exists under the selected parent, reuse it
      const existingMain = await GoogleDriveService.findFolderByName(folderName, existingFolderId)
      const mainFolder = existingMain ?? await GoogleDriveService.createFolder(folderName, existingFolderId)

      // Create subfolders inside the main folder (only if missing)
      const existingResume = await GoogleDriveService.findFolderByName("Resume Templates", mainFolder.id)
      const existingCover = await GoogleDriveService.findFolderByName("Cover Letter Templates", mainFolder.id)
      const existingGenResume = await GoogleDriveService.findFolderByName("Generated Resumes", mainFolder.id)
      const existingGenCover = await GoogleDriveService.findFolderByName("Generated Cover Letters", mainFolder.id)

      const resumeFolder = existingResume ?? await GoogleDriveService.createFolder("Resume Templates", mainFolder.id)
      const coverLetterFolder = existingCover ?? await GoogleDriveService.createFolder("Cover Letter Templates", mainFolder.id)
      const generatedResumeFolder = existingGenResume ?? await GoogleDriveService.createFolder("Generated Resumes", mainFolder.id)
      const generatedCoverLetterFolder = existingGenCover ?? await GoogleDriveService.createFolder("Generated Cover Letters", mainFolder.id)

      folders = {
        mainFolder,
        resumeFolder,
        coverLetterFolder,
        generatedResumeFolder,
        generatedCoverLetterFolder,
        parentFolder: { id: existingFolderId, name: parentFolderName || "Selected Folder" },
      }
    } else if (method === "existing") {
      if (!existingFolderId) {
        return NextResponse.json({ error: "Existing folder ID is required" }, { status: 400 })
      }

      // Look up the selected existing folder to get its real name and parent
      const mainFolder = await GoogleDriveService.getFolder(existingFolderId)

      // Reuse existing subfolders if present; create only if missing
      const existingResume = await GoogleDriveService.findFolderByName("Resume Templates", existingFolderId)
      const existingCover = await GoogleDriveService.findFolderByName("Cover Letter Templates", existingFolderId)
      const existingGenResume = await GoogleDriveService.findFolderByName("Generated Resumes", existingFolderId)
      const existingGenCover = await GoogleDriveService.findFolderByName("Generated Cover Letters", existingFolderId)

      const resumeFolder = existingResume ?? await GoogleDriveService.createFolder("Resume Templates", existingFolderId)
      const coverLetterFolder = existingCover ?? await GoogleDriveService.createFolder("Cover Letter Templates", existingFolderId)
      const generatedResumeFolder = existingGenResume ?? await GoogleDriveService.createFolder("Generated Resumes", existingFolderId)
      const generatedCoverLetterFolder = existingGenCover ?? await GoogleDriveService.createFolder("Generated Cover Letters", existingFolderId)

      // Try to resolve the parent folder of the existing main folder (if any)
      let parentFolder: { id: string; name: string } | undefined = undefined
      if (mainFolder.parents && mainFolder.parents.length > 0) {
        const parent = await GoogleDriveService.getFolder(mainFolder.parents[0])
        parentFolder = { id: parent.id, name: parent.name }
      }

      folders = {
        mainFolder,
        resumeFolder,
        coverLetterFolder,
        generatedResumeFolder,
        generatedCoverLetterFolder,
        parentFolder,
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
