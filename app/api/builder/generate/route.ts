import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { GoogleDocsService } from "@/lib/google-docs"
import { GoogleDriveService } from "@/lib/google-drive"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { templateId, folderId, jobTitle, keywords, bullets, documentName } = body as {
      templateId: string
      folderId?: string
      jobTitle: string
      keywords: string[]
      bullets: string[]
      documentName: string
    }

    if (!templateId || !jobTitle || !Array.isArray(keywords) || !Array.isArray(bullets) || !documentName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const model = google("gemini-2.5-flash")
    const system = "Please review this list of resume bullet points and this list of key words. Look for opportunities to replace words in these bullets with the words from the list. Return a list of the top 12-15 best, most impactful bullet points after the key words are swapped or inserted. Return only the bullets; do not include summaries or commentary, and do not add symbols or punctuation to highlight the changes."

    const prompt = [
      `Job Title: ${jobTitle}`,
      "",
      "Keywords:",
      ...keywords.map((k) => `- ${k}`),
      "",
      "Bullet Point Library:",
      ...bullets.map((b) => `- ${b}`),
    ].join("\n")

    const { text } = await generateText({ model, prompt, system })
    const lines = (text || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+\.)\s*/, "").trim())
      .filter(Boolean)

    const skillsList = lines.join("\n")

    // Replace {{Skills List}} in a copy of the selected template
    const docs = await GoogleDocsService.getDocument(templateId).catch(() => null)
    const drive = await GoogleDriveService.getDrive()
    const meta = await drive.files.get({ fileId: templateId, fields: "id, name, mimeType, parents" })
    const parentId = folderId || (meta.data.parents && meta.data.parents[0]) || undefined

    // Duplicate or convert to Google Doc then replace
    const isGoogleDoc = meta.data.mimeType === "application/vnd.google-apps.document"
    const copied = isGoogleDoc
      ? await GoogleDriveService.copyFile(templateId, documentName, parentId)
      : await GoogleDriveService.convertDocxToGoogleDoc(templateId, documentName, parentId)

    // Perform placeholder replacement for {{Skills List}}
    await GoogleDocsService.updateDocumentContent(copied.id, (await GoogleDocsService.getDocumentText(copied.id)).replace(/\{\{\s*Skills\s+List\s*\}\}/i, skillsList))

    return NextResponse.json({ documentId: copied.id, bullets: lines })
  } catch (e) {
    console.error("Builder generate error:", e)
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 })
  }
}


