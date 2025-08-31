"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Sparkles } from "lucide-react"
import { PdfExportButton } from "@/components/pdf-export-button"
import { useToast } from "@/hooks/use-toast"

interface TemplateVariable {
  placeholder: string
  description: string
  required: boolean
}

interface GenerateDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: {
    id: string
    name: string
    description?: string
    type: "resume" | "coverLetter"
  } | null
}

export function GenerateDocumentDialog({ open, onOpenChange, template }: GenerateDocumentDialogProps) {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [documentName, setDocumentName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDocumentId, setGeneratedDocumentId] = useState<string | null>(null)

  // Close dialog if user is not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && open) {
      onOpenChange(false)
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate documents.",
        variant: "destructive",
      })
    }
  }, [status, open, onOpenChange, toast])

  // Load template variables when dialog opens
  useEffect(() => {
    if (open && template && status === "authenticated") {
      loadTemplateVariables()
      setDocumentName(`${template.name} - ${new Date().toLocaleDateString()}`)
    }
  }, [open, template, status])

  const loadTemplateVariables = async () => {
    if (!template || status !== "authenticated") return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/templates/${template.id}`)
      if (!response.ok) throw new Error("Failed to load template")

      const data = await response.json()
      setVariables(data.variables || [])

      // Initialize form data with empty values
      const initialFormData: Record<string, string> = {}
      data.variables?.forEach((variable: TemplateVariable) => {
        initialFormData[variable.placeholder] = ""
      })
      setFormData(initialFormData)
    } catch (error) {
      console.error("Error loading template variables:", error)
      toast({
        title: "Error",
        description: "Failed to load template variables.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (placeholder: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [placeholder]: value,
    }))
  }

  const handleGenerate = async () => {
    if (!template || status !== "authenticated") {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate documents.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          variables: formData,
          documentName,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate document")

      const data = await response.json()
      setGeneratedDocumentId(data.documentId)
    } catch (error) {
      console.error("Error generating document:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state
    setVariables([])
    setFormData({})
    setDocumentName("")
    setGeneratedDocumentId(null)
  }

  const isFormValid = () => {
    return (
      documentName.trim() &&
      variables.filter((v) => v.required).every((variable) => formData[variable.placeholder]?.trim())
    )
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-popover-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Document from Template
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to generate a customized document from "{template?.name}".
          </DialogDescription>
        </DialogHeader>

        {generatedDocumentId ? (
          // Success state
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-popover-foreground">Document Generated Successfully!</h3>
              <p className="text-muted-foreground mt-1">Your customized document is ready.</p>
            </div>
            <div className="flex flex-col gap-3 items-center">
              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    window.open(`https://docs.google.com/document/d/${generatedDocumentId}/edit`, "_blank")
                  }
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Open in Google Docs
                </Button>
                <Button variant="outline" onClick={handleClose} className="border-border bg-transparent">
                  Generate Another
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Export as PDF:</span>
                <PdfExportButton
                  documentId={generatedDocumentId}
                  documentName={documentName}
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          </div>
        ) : (
          // Form state
          <div className="space-y-6 py-4">
            {/* Template Info */}
            <Card className="border-border bg-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-card-foreground">{template.name}</CardTitle>
                  <Badge variant="secondary">{template.type === "resume" ? "Resume" : "Cover Letter"}</Badge>
                </div>
                {template.description && <CardDescription className="text-sm">{template.description}</CardDescription>}
              </CardHeader>
            </Card>

            {/* Document Name */}
            <div className="space-y-2">
              <Label htmlFor="document-name" className="text-popover-foreground">
                Document Name
              </Label>
              <Input
                id="document-name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter a name for your generated document"
                className="bg-input border-border"
              />
            </div>

            {/* Variables Form */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading template variables...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-popover-foreground">Fill in Template Variables</h3>
                  <Badge variant="outline" className="text-xs">
                    {variables.filter((v) => v.required).length} required fields
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variables.map((variable) => (
                    <div key={variable.placeholder} className="space-y-2">
                      <Label className="text-popover-foreground flex items-center gap-1">
                        {variable.description}
                        {variable.required && <span className="text-destructive">*</span>}
                      </Label>
                      {variable.placeholder.includes("PARAGRAPH") ||
                      variable.placeholder.includes("SUMMARY") ||
                      variable.placeholder.includes("DESCRIPTION") ? (
                        <Textarea
                          value={formData[variable.placeholder] || ""}
                          onChange={(e) => handleInputChange(variable.placeholder, e.target.value)}
                          placeholder={`Enter ${variable.description.toLowerCase()}`}
                          className="bg-input border-border min-h-[80px]"
                          required={variable.required}
                        />
                      ) : (
                        <Input
                          value={formData[variable.placeholder] || ""}
                          onChange={(e) => handleInputChange(variable.placeholder, e.target.value)}
                          placeholder={`Enter ${variable.description.toLowerCase()}`}
                          className="bg-input border-border"
                          required={variable.required}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {variables.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No variables found in this template.</p>
                    <p className="text-sm">You can still generate the document as-is.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!generatedDocumentId && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} className="border-border bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!isFormValid() || isGenerating || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Document
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
