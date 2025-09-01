import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { google } from "@ai-sdk/google"
import { generateText, streamText, type ProviderMetadata } from "ai"

export const runtime = "nodejs"

// Prefer explicit server-side env var. Do NOT expose this to the client.
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY

function getModel() {
  if (!GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_API_KEY in env")
  }
  return google("gemini-2.5-flash")
}

export async function POST(req: NextRequest) {
  console.log({req})
  console.log('BODY: ', req.body);
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const isStream = url.searchParams.get("stream") === "true"
    const body = await req.json().catch(() => ({})) as {
      prompt?: string
      company?: string
      title?: string
      description?: string
      system?: string
    }

    // Build prompt from structured fields if prompt not directly supplied
    let { prompt, system } = body
    if (!prompt) {
      const parts: string[] = []
      if (body.company) parts.push(`Company: ${body.company}`)
      if (body.title) parts.push(`Job Title: ${body.title}`)
      if (body.description) {
        parts.push("Job Description:")
        parts.push(body.description)
      }
      prompt = parts.length ? parts.join("\n") : undefined
    }

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "'prompt' or job fields (company/title/description) required" }, { status: 400 })
    }

    const model = getModel()

    if (isStream) {
      const result = streamText({
        model,
        prompt,
        system,
      })

      // Return a text stream response compatible with AI SDK clients
      return result.toTextStreamResponse()
    }

    const { text, warnings, providerMetadata } = await generateText({
      model,
      prompt,
      system,
    })

    const usage = getUsageFromMetadata(providerMetadata)
    return NextResponse.json({ text, usage, warnings: warnings?.length ? warnings : undefined })
  } catch (err) {
    console.error("Gemini endpoint error:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

function getUsageFromMetadata(metadata: ProviderMetadata | null | undefined) {
  // Provider usage details vary; expose a minimal shape if present
  try {
    const m = metadata as any
    const usage = m?.google?.usage || m?.usage
    if (!usage) return undefined
    return usage
  } catch {
    return undefined
  }
}


