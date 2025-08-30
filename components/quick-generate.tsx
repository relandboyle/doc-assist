"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Briefcase, FileText, ArrowRight } from "lucide-react"
import { GenerateDocumentDialog } from "@/components/generate-document-dialog"
import { useTemplateStore } from "@/lib/template-store"

export function QuickGenerate() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [quickFormData, setQuickFormData] = useState({
    companyName: "",
    jobTitle: "",
    templateType: "resume" as "resume" | "coverLetter",
  })

  const { templates } = useTemplateStore()

  const handleQuickGenerate = () => {
    // Find a suitable template based on type
    const availableTemplates = templates.filter((t) => t.type === quickFormData.templateType)

    if (availableTemplates.length > 0) {
      setSelectedTemplate(availableTemplates[0]) // Use first available template
      setShowGenerateDialog(true)
    }
  }

  const resumeTemplates = templates.filter((t) => t.type === "resume")
  const coverLetterTemplates = templates.filter((t) => t.type === "coverLetter")

  return (
    <div className="space-y-6">
      {/* Quick Generate Card */}
      <Card className="border-border bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Generate
          </CardTitle>
          <CardDescription>Generate a document quickly by filling in basic job details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-card-foreground">
                Company Name
              </Label>
              <Input
                id="company-name"
                placeholder="e.g., Google"
                value={quickFormData.companyName}
                onChange={(e) => setQuickFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-title" className="text-card-foreground">
                Job Title
              </Label>
              <Input
                id="job-title"
                placeholder="e.g., Software Engineer"
                value={quickFormData.jobTitle}
                onChange={(e) => setQuickFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-card-foreground">Document Type</Label>
              <Select
                value={quickFormData.templateType}
                onValueChange={(value: "resume" | "coverLetter") =>
                  setQuickFormData((prev) => ({ ...prev, templateType: value }))
                }
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resume">Resume</SelectItem>
                  <SelectItem value="coverLetter">Cover Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleQuickGenerate}
            disabled={!quickFormData.companyName || !quickFormData.jobTitle}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Quick Generate {quickFormData.templateType === "resume" ? "Resume" : "Cover Letter"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Recent Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Briefcase className="h-4 w-4 text-primary" />
              Recent Resume Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumeTemplates.slice(0, 3).map((template) => (
              <div key={template.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium text-card-foreground text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Modified {template.modifiedTime ? new Date(template.modifiedTime).toLocaleDateString() : "Recently"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template)
                    setShowGenerateDialog(true)
                  }}
                  className="bg-transparent"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Use
                </Button>
              </div>
            ))}

            {resumeTemplates.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                No resume templates yet. Create one to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <FileText className="h-4 w-4 text-secondary" />
              Recent Cover Letter Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {coverLetterTemplates.slice(0, 3).map((template) => (
              <div key={template.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium text-card-foreground text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Modified {template.modifiedTime ? new Date(template.modifiedTime).toLocaleDateString() : "Recently"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template)
                    setShowGenerateDialog(true)
                  }}
                  className="bg-transparent"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Use
                </Button>
              </div>
            ))}

            {coverLetterTemplates.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                No cover letter templates yet. Create one to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate Dialog */}
      <GenerateDocumentDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        template={selectedTemplate}
      />
    </div>
  )
}
