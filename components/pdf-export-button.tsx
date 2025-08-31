"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PdfExportButtonProps {
  documentId: string
  documentName: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  showText?: boolean
}

export function PdfExportButton({
  documentId,
  documentName,
  variant = "outline",
  size = "default",
  showText = true,
}: PdfExportButtonProps) {
  const { data: session, status } = useSession()
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExportPdf = async () => {
    if (status !== "authenticated") {
      toast({
        title: "Authentication Required",
        description: "Please sign in to export PDFs.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          fileName: documentName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to export PDF")
      }

      // Create a blob from the response and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${documentName}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "PDF Downloaded",
        description: `${documentName}.pdf has been downloaded successfully.`,
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleOpenPdfInBrowser = async () => {
    if (status !== "authenticated") {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view PDFs.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/export/pdf?documentId=${documentId}`)
      if (!response.ok) throw new Error("Failed to get PDF export URL")

      const data = await response.json()
      window.open(data.exportUrl, "_blank")
    } catch (error) {
      console.error("Error opening PDF:", error)
      toast({
        title: "Failed to Open PDF",
        description: "Could not open PDF in browser. Please try downloading instead.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button onClick={handleExportPdf} disabled={isExporting} variant={variant} size={size} className="bg-transparent">
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {showText && <span className="ml-2">{isExporting ? "Exporting..." : "Download PDF"}</span>}
      </Button>

      <Button
        onClick={handleOpenPdfInBrowser}
        variant="ghost"
        size={size === "sm" ? "sm" : "default"}
        className="px-2"
        title="Open PDF in browser"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  )
}
