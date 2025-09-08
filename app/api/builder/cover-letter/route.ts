import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { GoogleDocsService } from "@/lib/google-docs"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const {
      resumeDocumentId,
      targetFolderId,
      company,
      jobTitle,
      jobDescription,
      documentName,
      resumeText: resumeTextFromClient,
      keywords,
      addressTo,
      hiringPersonName,
    } = body as {
      resumeDocumentId: string
      targetFolderId?: string
      company?: string
      jobTitle?: string
      jobDescription?: string
      documentName?: string
      resumeText?: string
      keywords?: string[]
      addressTo?: 'manager' | 'person'
      hiringPersonName?: string
    }

    if (!resumeDocumentId || !jobTitle || !jobDescription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Pull resume text to ground the model
    let resumeText = typeof resumeTextFromClient === 'string' ? resumeTextFromClient : ""
    if (!resumeText) {
      try {
        resumeText = await GoogleDocsService.getDocumentText(resumeDocumentId)
      } catch {
        // If resume is not a Google Doc or inaccessible, proceed without text
        resumeText = ""
      }
    }

    const model = google("gemini-2.5-flash")
    const system = "You are a meticulous, professional career writer."

    const MAX = 30000
    const jd = (jobDescription || "").slice(0, MAX)
    const resume = (resumeText || "").slice(0, MAX)

    const kw = Array.isArray(keywords) ? keywords.map(k => String(k).trim()).filter(Boolean).slice(0, 50) : []
    const greetingInstruction = (() => {
      if (addressTo === 'person' && typeof hiringPersonName === 'string' && hiringPersonName.trim()) {
        return `Address the greeting to ${hiringPersonName.trim()}.`
      }
      return 'Address the greeting to "Hiring Manager".'
    })()

    const prompt = [
      `Target Company: ${company || "(unspecified)"}`,
      `Target Job Title: ${jobTitle}`,
      "",
      "Job Description:",
      jd,
      "",
      ...(kw.length ? ["Priority Keywords (must be reflected naturally in the letter):", ...kw.map(k => `- ${k}`), ""] : []),
      greetingInstruction,
      "",
      "Candidate Resume (verbatim text, authoritative source — do NOT invent content):",
      resume || "(resume text not available)",
      "",
      "Write a professional cover letter that:",
      "- Contains ONLY candidate-related statements that can be verified from the resume text; do not fabricate skills, titles, or achievements.",
      "- Do NOT copy content verbatim from the resume.",
      "- Tailors tone and content to the target company and role; align wording with the job description and integrate the provided keywords when appropriate and truthful.",
      "- Begin with today's date, then the company name, the address of company's headquarters mailing address (street, city, state, ZIP), then the greeting.",
      "- Use the candidate’s exact name from the resume in the signature line.",
      "- Write a final, ready-to-send letter. If a specific detail (e.g., hiring manager name) is unknown, use a neutral alternative such as 'Hiring Manager' or omit that line entirely.",
      "- Uses concise, results-oriented language and avoids redundancy.",
      "- Is formatted as a conventional business letter with greeting, body paragraphs, and a courteous closing.",
      "- Avoid markdown or code fences; output plain text only.",
    ].join("\n")

    const { text } = await generateText({ model, prompt, system })
    let coverLetterContent = (text || "").trim()
    // Strip markdown fences if present
    coverLetterContent = coverLetterContent.replace(/```[a-z]*\n?|```/gi, "").trim()

    // Helper: extract a probable candidate name from resume text (first clean line without URLs/emails)
    const extractCandidateName = (src: string): string | null => {
      const lines = (src || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      const isLikelyName = (s: string) => {
        if (!s) return false
        if (s.length < 2 || s.length > 80) return false
        if (/https?:\/\//i.test(s)) return false
        if (/@/.test(s)) return false
        if (/[|]/.test(s)) return false
        // allow letters, spaces, hyphens, periods, apostrophes
        if (!/^[A-Za-z][A-Za-z .'-]+$/.test(s)) return false
        // Must contain at least one space (first + last name)
        if (!/\s/.test(s)) return false
        return true
      }
      for (const line of lines.slice(0, 10)) {
        if (isLikelyName(line)) return line
      }
      return null
    }

    const formatToday = (): string => {
      const d = new Date()
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    }

    const candidateName = extractCandidateName(resume) || ""
    const todayDate = formatToday()
    const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")

    // Replace common placeholders if model emitted any
    if (coverLetterContent) {
      // Date placeholders
      coverLetterContent = coverLetterContent
        .replace(/\[\s*Date\s*\]|\{\{\s*DATE\s*\}\}/gi, todayDate)
      // Name placeholders
      if (candidateName) {
        coverLetterContent = coverLetterContent
          .replace(/\[\s*(?:Your\s+Name|Candidate\s+Name|Name)\s*\]|\{\{\s*YOUR_NAME\s*\}\}/gi, candidateName)
      }
      // Company/job placeholders
      if (company) {
        coverLetterContent = coverLetterContent
          .replace(/\[\s*Company\s*Name\s*\]|\{\{\s*Company\s*Name\s*\}\}|\{\{\s*COMPANY_NAME\s*\}\}/gi, company)
      }
      if (jobTitle) {
        coverLetterContent = coverLetterContent
          .replace(/\{\{\s*Job\s*Title\s*\}\}|\{\{\s*JOB_TITLE\s*\}\}/gi, jobTitle)
      }
      // Greeting placeholder → preferred greeting
      if (typeof body?.addressTo === 'string' && body.addressTo === 'person' && typeof body?.hiringPersonName === 'string' && body.hiringPersonName.trim()) {
        const toName = body.hiringPersonName.trim()
        coverLetterContent = coverLetterContent
          .replace(/Dear\s*\[\s*Hiring\s*Manager[’']s\s*Name\s*\]\s*,?/gi, `Dear ${toName},`)
          .replace(/Dear\s*\[\s*Name\s*\]\s*,?/gi, `Dear ${toName},`)
          .replace(/Dear\s+Hiring\s+Manager\s*,/gi, `Dear ${toName},`)
      } else {
        coverLetterContent = coverLetterContent
          .replace(/Dear\s*\[\s*Hiring\s*Manager[’']s\s*Name\s*\]\s*,?/gi, 'Dear Hiring Manager,')
          .replace(/Dear\s*\[\s*Name\s*\]\s*,?/gi, 'Dear Hiring Manager,')
      }
      coverLetterContent = coverLetterContent
        .replace(/Dear\s*\[\s*Hiring\s*Manager[’']s\s*Name\s*\]\s*,?/gi, 'Dear Hiring Manager,')
        .replace(/Dear\s*\[\s*Name\s*\]\s*,?/gi, 'Dear Hiring Manager,')
      // Remove any remaining placeholders
      coverLetterContent = coverLetterContent
        .replace(/\{\{[^}]+\}\}/g, "")
        .replace(/\[[^\]\n]+\]/g, "")
        .replace(/\n{3,}/g, "\n\n")
    }

    // Ensure the letter begins with today's date (overwrite any existing date line)
    if (coverLetterContent) {
      const lines = coverLetterContent.split(/\r?\n/)
      // Find first non-empty line
      let firstIdx = -1
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim()) { firstIdx = i; break }
      }
      const isDateLine = (s: string): boolean => {
        const t = s.trim()
        if (!t) return false
        // Basic checks: contains month name or mm/dd/yyyy-like pattern
        const monthNames = /(January|February|March|April|May|June|July|August|September|October|November|December)/i
        const numericDate = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/
        return monthNames.test(t) || numericDate.test(t)
      }
      if (firstIdx === -1) {
        coverLetterContent = [todayDate, "", coverLetterContent].join("\n").replace(/\n{3,}/g, "\n\n").trim()
      } else if (isDateLine(lines[firstIdx])) {
        lines[firstIdx] = todayDate
        coverLetterContent = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()
      } else {
        coverLetterContent = [todayDate, "", coverLetterContent].join("\n").replace(/\n{3,}/g, "\n\n").trim()
      }
    }

    // Remove any verbatim copies of the first N lines of the resume header from the letter
    if (resume) {
      const headerLines = resume.split(/\r?\n/).slice(0, 10).map(l => l.trim()).filter(l => l.length >= 4 && l.length <= 120)
      for (const line of headerLines) {
        const escaped = escapeRe(line)
        const re = new RegExp(escaped, 'g')
        coverLetterContent = coverLetterContent.replace(re, "")
      }
      coverLetterContent = coverLetterContent.replace(/\n{3,}/g, "\n\n").trim()
    }

    // Do not prepend company/date/address server-side to avoid duplicates/wrong data.
    if (!coverLetterContent) {
      // Provide a minimal professional fallback to avoid blank documents (no placeholders)
      coverLetterContent = [
        todayDate,
        "",
        "Dear Hiring Manager,",
        "",
        `I am writing to express my interest in the ${jobTitle} role${company ? ` at ${company}` : ""}. My background aligns with the position requirements, and I would welcome the opportunity to contribute to your team.`,
        "",
        "Thank you for your time and consideration.",
        "",
        "Sincerely,",
        "",
        candidateName || "",
      ].join("\n").trim()
    }

    // No hard character cap enforced

    const name = documentName || `${jobTitle} - Targeted Cover Letter (${new Date().toLocaleDateString()})`
    const documentId = await GoogleDocsService.createDocument(name, targetFolderId)
    await GoogleDocsService.updateDocumentContent(documentId, coverLetterContent)

    return NextResponse.json({ documentId })
  } catch (e: any) {
    console.error("Cover letter generate error:", e)
    const message = typeof e?.message === 'string' ? e.message : 'Failed to generate cover letter'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


