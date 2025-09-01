import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { GoogleDriveService } from "@/lib/google-drive"
import { GoogleDocsService } from "@/lib/google-docs"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const folderId = url.searchParams.get("folderId")
    if (!folderId) return NextResponse.json({ error: "folderId is required" }, { status: 400 })

    // Find a Google Doc named "Library" in the given folder
    const files = await GoogleDriveService.listFiles(folderId)
    const googleDocMime = "application/vnd.google-apps.document"
    const library = files.find((f) => f.mimeType === googleDocMime && f.name.trim().toLowerCase() === "library")
    if (!library) {
      return NextResponse.json({ bullets: [], message: "Library doc not found" }, { status: 200 })
    }

    const text = await GoogleDocsService.getDocumentText(library.id)
    // Extract bullet-like lines
    const bullets = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .filter((l) => /^([\u2022\-\*]|\d+\.|•)\s+/.test(l) || /\w/.test(l))
      .map((l) => l.replace(/^\s*(?:[\u2022\-\*]|\d+\.|•)\s+/, "").trim())

    return NextResponse.json({ bullets })
  } catch (e) {
    console.error("Error fetching library bullets:", e)
    return NextResponse.json({ error: "Failed to load Library bullets" }, { status: 500 })
  }
}


