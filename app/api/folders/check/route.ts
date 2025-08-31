import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { GoogleDriveService } from "@/lib/google-drive"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const folderName = searchParams.get('folderName')

    if (!parentId || !folderName) {
      return NextResponse.json({ error: "Parent ID and folder name are required" }, { status: 400 })
    }

    // Check if a folder with the same name already exists in the parent folder
    const existingFolder = await GoogleDriveService.findFolderByName(folderName, parentId)

    if (existingFolder) {
      return NextResponse.json({
        exists: true,
        folderId: existingFolder.id,
        folderName: existingFolder.name
      })
    } else {
      return NextResponse.json({
        exists: false
      })
    }
  } catch (error) {
    console.error("Error checking folder existence:", error)
    return NextResponse.json({ error: "Failed to check folder existence" }, { status: 500 })
  }
}
