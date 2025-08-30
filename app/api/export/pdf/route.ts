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
    const { documentId, fileName } = body

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    // Export the document as PDF
    const pdfBuffer = await GoogleDriveService.exportAsPdf(documentId, fileName)

    // Return the PDF as a downloadable response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName || "document"}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error exporting PDF:", error)
    return NextResponse.json({ error: "Failed to export PDF" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    // Get PDF export URL
    const exportUrl = await GoogleDriveService.getPdfExportUrl(documentId)

    return NextResponse.json({ exportUrl })
  } catch (error) {
    console.error("Error getting PDF export URL:", error)
    return NextResponse.json({ error: "Failed to get PDF export URL" }, { status: 500 })
  }
}
