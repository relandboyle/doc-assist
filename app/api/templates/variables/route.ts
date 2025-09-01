import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { GoogleDocsService } from "@/lib/google-docs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 })
    }

    const variables = await GoogleDocsService.getTemplateVariables(fileId)
    return NextResponse.json({ variables })
  } catch (error) {
    console.error("Error getting variables:", error)
    return NextResponse.json({ error: "Failed to get variables" }, { status: 500 })
  }
}


