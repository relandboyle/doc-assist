"use client"

import { useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TemplatePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId?: string
  templateName?: string
  mimeType?: string
}

export function TemplatePreviewDialog({ open, onOpenChange, templateId, templateName, mimeType }: TemplatePreviewDialogProps) {
  const src = useMemo(() => {
    if (!templateId) return ""
    const googleDocs = "application/vnd.google-apps.document"
    // Prefer Google Docs embed if available, else Drive preview
    return mimeType === googleDocs
      ? `https://docs.google.com/document/d/${templateId}/preview`
      : `https://drive.google.com/file/d/${templateId}/preview`
  }, [templateId, mimeType])

  useEffect(() => {
    // no-op; reserved for future loading states
  }, [src])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[85vh] p-0 overflow-hidden bg-popover border-border">
        <DialogHeader className="px-6 py-4 bg-muted border-b border-border">
          <DialogTitle className="text-foreground">{templateName || "Preview"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            View-only preview. Use Edit to open in Google Docs.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full h-[calc(85vh-92px)]">
          {src ? (
            <iframe
              title="Template Preview"
              src={src}
              className="w-full h-full border-0"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No preview available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


