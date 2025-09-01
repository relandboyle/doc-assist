import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { GoogleDocsService } from "@/lib/google-docs"
import { GoogleDriveService } from "@/lib/google-drive"
import { getDocsClient } from "@/lib/google-api"

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
    const system = "You are optimizing resume content for a specific job."

    const prompt = [
      `Job Title: ${jobTitle}`,
      "",
      "Keywords:",
      ...keywords.map((k) => `- ${k}`),
      "",
      "Bullet Point Library:",
      ...bullets.map((b) => `- ${b}`),
      "",
      "Instructions:",
      "1) Create an array 'bullets' of the 12-15 strongest resume bullet points, replacing words where beneficial with items from the keywords list.",
      "2) Create a single-line string 'skills_line' with 15-25 items separated by the bullet character (•), derived primarily from the keywords (secondary from the library where relevant).",
      "3) Return STRICT JSON with this schema and nothing else: { \"bullets\": string[], \"skills_line\": string }",
    ].join("\n")

    const { text } = await generateText({ model, prompt, system })

    // Parse JSON response
    const jsonText = (() => {
      const start = text.indexOf("{")
      const end = text.lastIndexOf("}")
      if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1)
      return text
    })()
    let parsed: { bullets?: string[]; skills_line?: string } = {}
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      try {
        parsed = JSON.parse(jsonText.replace(/```[a-z]*\n?|```/gi, ""))
      } catch {}
    }
    const lines = Array.isArray(parsed.bullets) ? parsed.bullets.map((s) => String(s).trim()).filter(Boolean) : []
    const skillsLine = typeof parsed.skills_line === 'string' ? parsed.skills_line.trim() : ''
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

    // Perform precise placeholder replacement for {{Skills List}} preserving surrounding formatting
    const docsClient = await getDocsClient()
    const doc = await docsClient.documents.get({ documentId: copied.id })

    const placeholderRegex = /\{\{\s*Job\s+01\s+Bullets\s*\}\}/i
    let matchStart: number | null = null
    let matchEnd: number | null = null

    const content = doc.data.body?.content || []
    for (const se of content) {
      const para = se.paragraph
      if (!para || !Array.isArray(para.elements)) continue
      for (const el of para.elements) {
        const txt = el.textRun?.content
        if (!txt || typeof el.startIndex !== 'number' || typeof el.endIndex !== 'number') continue
        const m = txt.match(placeholderRegex)
        if (m) {
          const offset = m.index || 0
          matchStart = (el.startIndex as number) + offset
          matchEnd = matchStart + m[0].length
          break
        }
      }
      if (matchStart !== null) break
    }

    if (matchStart === null || matchEnd === null) {
      return NextResponse.json({ error: "Placeholder {{Job 01 Bullets}} not found in template." }, { status: 400 })
    }

    const insertedText = skillsList.trim().length > 0 ? skillsList.trim() + "\n" : "\n"
    const requests: any[] = [
      { deleteContentRange: { range: { startIndex: matchStart, endIndex: matchEnd } } },
      { insertText: { location: { index: matchStart }, text: insertedText } },
      { createParagraphBullets: { range: { startIndex: matchStart, endIndex: matchStart + insertedText.length }, bulletPreset: "BULLET_DISC_CIRCLE_SQUARE" } },
    ]

    await docsClient.documents.batchUpdate({ documentId: copied.id, requestBody: { requests } })

    // Replace Skills List placeholder with single-line skills at exactly {{Skills List}}
    if (skillsLine) {
      const docAfter = await docsClient.documents.get({ documentId: copied.id })
      const skillsRegex = /\{\{\s*Skills\s+List\s*\}\}/i
      let sStart: number | null = null
      let sEnd: number | null = null
      const content2 = docAfter.data.body?.content || []
      outer: for (const se of content2) {
        const para = se.paragraph
        if (!para || !Array.isArray(para.elements)) continue
        for (const el of para.elements) {
          const txt = el.textRun?.content
          if (!txt || typeof el.startIndex !== 'number' || typeof el.endIndex !== 'number') continue
          const m = txt.match(skillsRegex)
          if (m) {
            const offset = m.index || 0
            sStart = (el.startIndex as number) + offset
            sEnd = sStart + m[0].length
            break outer
          }
        }
      }
      if (sStart !== null && sEnd !== null) {
        const skillReqs: any[] = [
          { deleteContentRange: { range: { startIndex: sStart, endIndex: sEnd } } },
          { insertText: { location: { index: sStart }, text: skillsLine } },
        ]
        await docsClient.documents.batchUpdate({ documentId: copied.id, requestBody: { requests: skillReqs } })
      }
    }

    return NextResponse.json({ documentId: copied.id, bullets: lines, skillsLine })
  } catch (e) {
    console.error("Builder generate error:", e)
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 })
  }
}


