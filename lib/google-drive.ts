import { getDriveClient } from "./google-api"

export interface DriveFolder {
  id: string
  name: string
  parents?: string[]
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  parents?: string[]
  createdTime?: string
  modifiedTime?: string
}

export class GoogleDriveService {
  // Changed from private to public since it's used by GoogleDocsService
  public static async getDrive() {
    return await getDriveClient()
  }

  // Create a new folder
  static async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    const drive = await this.getDrive()

    const folderMetadata = {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    }

    const response = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id, name, parents",
    })

    return {
      id: response.data.id!,
      name: response.data.name!,
      parents: response.data.parents || undefined,
    }
  }

  // Setup the main template folder structure
  static async setupTemplateFolders(mainFolderName = "DocTailor Templates") {
    try {
      // Create main folder
      const mainFolder = await this.createFolder(mainFolderName)

      // Create subfolders
      const resumeFolder = await this.createFolder("Resume Templates", mainFolder.id)
      const coverLetterFolder = await this.createFolder("Cover Letter Templates", mainFolder.id)

      return {
        mainFolder,
        resumeFolder,
        coverLetterFolder,
      }
    } catch (error) {
      console.error("Error setting up template folders:", error)
      throw error
    }
  }

  // List files in a folder
  static async listFiles(folderId: string): Promise<DriveFile[]> {
    const drive = await this.getDrive()

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType, parents, createdTime, modifiedTime)",
      orderBy: "modifiedTime desc",
    })

    return (
      response.data.files?.map((file) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        parents: file.parents || undefined,
        createdTime: file.createdTime || undefined,
        modifiedTime: file.modifiedTime || undefined,
      })) || []
    )
  }

  // Get folder by ID
  static async getFolder(folderId: string): Promise<DriveFolder> {
    const drive = await this.getDrive()

    const response = await drive.files.get({
      fileId: folderId,
      fields: "id, name, parents",
    })

    return {
      id: response.data.id!,
      name: response.data.name!,
      parents: response.data.parents || undefined,
    }
  }

  // Search for folders by name
  static async findFolderByName(name: string): Promise<DriveFolder[]> {
    const drive = await this.getDrive()

    const response = await drive.files.list({
      q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name, parents)",
    })

    return (
      response.data.files?.map((file) => ({
        id: file.id!,
        name: file.name!,
        parents: file.parents || undefined,
      })) || []
    )
  }

  // Copy a file
  static async copyFile(fileId: string, newName: string, parentId?: string): Promise<DriveFile> {
    const drive = await this.getDrive()

    const response = await drive.files.copy({
      fileId,
      requestBody: {
        name: newName,
        parents: parentId ? [parentId] : undefined,
      },
      fields: "id, name, mimeType, parents, createdTime, modifiedTime",
    })

    return {
      id: response.data.id!,
      name: response.data.name!,
      mimeType: response.data.mimeType!,
      parents: response.data.parents || undefined,
      createdTime: response.data.createdTime || undefined,
      modifiedTime: response.data.modifiedTime || undefined,
    }
  }

  // Delete a file
  static async deleteFile(fileId: string): Promise<void> {
    const drive = await this.getDrive()
    await drive.files.delete({ fileId })
  }

  // Export a Google Doc as PDF
  static async exportAsPdf(fileId: string, fileName?: string): Promise<Buffer> {
    const drive = await this.getDrive()

    const response = await drive.files.export(
      {
        fileId,
        mimeType: "application/pdf",
      },
      {
        responseType: "arraybuffer",
      },
    )

    return Buffer.from(response.data as ArrayBuffer)
  }

  // Get file metadata including download URL
  static async getFileMetadata(fileId: string) {
    const drive = await this.getDrive()

    const response = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink",
    })

    return response.data
  }

  // Get direct PDF export URL for a Google Doc
  static async getPdfExportUrl(fileId: string): Promise<string> {
    const drive = await this.getDrive()

    // Get the file metadata to ensure it exists and is accessible
    await drive.files.get({ fileId })

    // Return the PDF export URL
    return `https://docs.google.com/document/d/${fileId}/export?format=pdf`
  }
}
