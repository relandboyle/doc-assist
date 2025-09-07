import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getDocsClient } from "@/lib/google-api"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { documentId, headerText } = body as { documentId?: string; headerText?: string }
    if (!documentId || !headerText) {
      return NextResponse.json({ error: "documentId and headerText are required" }, { status: 400 })
    }

    const docs = await getDocsClient()
    const text = String(headerText).trim() + "\n\n"
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text,
            },
          },
        ],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Prepend header error:", e)
    return NextResponse.json({ error: "Failed to prepend header" }, { status: 500 })
  }
}


