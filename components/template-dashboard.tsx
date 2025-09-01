"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileText, FolderOpen, Settings, Edit, Copy, Eye, Sparkles, Trash2 } from "lucide-react"
import { FolderSetupDialog } from "@/components/folder-setup-dialog"
import { GenerateDocumentDialog } from "@/components/generate-document-dialog"
import { PdfExportButton } from "@/components/pdf-export-button"
import { TemplatePreviewDialog } from "@/components/template-preview-dialog"
import { FolderStatus } from "@/components/folder-status"
import { useTemplateStore } from "@/lib/template-store"

export function TemplateDashboard() {
  const { data: session, status } = useSession()
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [previewTemplate, setPreviewTemplate] = useState<any>(null)
  const [resumeCount, setResumeCount] = useState(0)
  const [coverCount, setCoverCount] = useState(0)
  const [resumeTemplates, setResumeTemplates] = useState<any[]>([])
  const [coverLetterTemplates, setCoverLetterTemplates] = useState<any[]>([])

  const { folders, isLoading, fetchFolders, initializeFromStorage } = useTemplateStore()

  useEffect(() => {
    // Only initialize from localStorage if user is authenticated
    if (status === "authenticated") {
      console.log('Initializing from localStorage...')
      initializeFromStorage()
    }
  }, [status])

  useEffect(() => {
    // Fetch resume templates into local state
    const run = async () => {
      if (status !== "authenticated" || !folders.resumeFolderId) return
      try {
        const resp = await fetch(`/api/templates?folderId=${folders.resumeFolderId}&type=resume`)
        if (!resp.ok) return setResumeTemplates([])
        const data = await resp.json()
        setResumeTemplates(Array.isArray(data.templates) ? data.templates : [])
      } catch {
        setResumeTemplates([])
      }
    }
    run()
  }, [folders.resumeFolderId, status])

  useEffect(() => {
    // Fetch cover letter templates into local state
    const run = async () => {
      if (status !== "authenticated" || !folders.coverLetterFolderId) return
      try {
        const resp = await fetch(`/api/templates?folderId=${folders.coverLetterFolderId}&type=coverLetter`)
        if (!resp.ok) return setCoverLetterTemplates([])
        const data = await resp.json()
        setCoverLetterTemplates(Array.isArray(data.templates) ? data.templates : [])
      } catch {
        setCoverLetterTemplates([])
      }
    }
    run()
  }, [folders.coverLetterFolderId, status])

  // Fetch accurate counts for each folder independently of the shared templates list
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [resumeResp, coverResp] = await Promise.all([
          folders.resumeFolderId
            ? fetch(`/api/templates?folderId=${folders.resumeFolderId}&type=resume`)
            : Promise.resolve(null as unknown as Response),
          folders.coverLetterFolderId
            ? fetch(`/api/templates?folderId=${folders.coverLetterFolderId}&type=coverLetter`)
            : Promise.resolve(null as unknown as Response),
        ])

        if (resumeResp && resumeResp.ok) {
          const data = await resumeResp.json()
          setResumeCount(Array.isArray(data.templates) ? data.templates.length : 0)
        } else {
          setResumeCount(0)
        }

        if (coverResp && coverResp.ok) {
          const data = await coverResp.json()
          setCoverCount(Array.isArray(data.templates) ? data.templates.length : 0)
        } else {
          setCoverCount(0)
        }
      } catch (err) {
        setResumeCount(0)
        setCoverCount(0)
      }
    }

    if (status === "authenticated" && (folders.resumeFolderId || folders.coverLetterFolderId)) {
      fetchCounts()
    }
  }, [status, folders.resumeFolderId, folders.coverLetterFolderId])

  // Don't render anything if session is loading or not authenticated
  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Please sign in to access templates.</div>
        </div>
      </div>
    )
  }

  const handleGenerateDocument = (template: any) => {
    setSelectedTemplate(template)
    setShowGenerateDialog(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates/${templateId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      // Optimistically remove from local state arrays
      setResumeTemplates((arr) => arr.filter((t) => t.id !== templateId))
      setCoverLetterTemplates((arr) => arr.filter((t) => t.id !== templateId))
    } catch (e) {
      console.error('Failed to delete template:', e)
    }
  }

  // Local state arrays hold templates for each tab (state variables above)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Template Library</h1>
          <p className="text-muted-foreground mt-2">Manage your resume and cover letter templates</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={folders.mainFolderId ? "outline" : "default"}
            onClick={() => setShowFolderDialog(true)}
            className={folders.mainFolderId ? "bg-background border-border hover:bg-accent" : "bg-amber-500 hover:bg-amber-600 text-white"}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            {folders.mainFolderId ? "Manage Folders" : "Setup Folders"}
          </Button>
        </div>
      </div>

      {/* Folder Status */}
      <div className="mb-8">
        <FolderStatus onManageFolders={() => setShowFolderDialog(true)} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Resume Templates</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{resumeCount}</div>
            <p className="text-xs text-muted-foreground">Ready for customization</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Cover Letters</CardTitle>
            <FileText className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{coverCount}</div>
            <p className="text-xs text-muted-foreground">Professional templates</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Documents</CardTitle>
            <Settings className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{resumeCount + coverCount}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Template Tabs */}
      <Tabs defaultValue="resume">
        <TabsList className="sticky top-24 z-40 mx-auto w-full max-w-2xl px-0 pb-0 flex gap-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TabsTrigger
            value="resume"
            className="rounded-t-md rounded-b-none px-4 py-1.5 text-sm font-medium text-muted-foreground border border-border transition -mb-px
                       hover:bg-background/60 hover:text-foreground
                       data-[state=active]:bg-muted-foreground data-[state=active]:text-muted dark:data-[state=active]:bg-muted dark:data-[state=active]:text-muted-foreground data-[state=active]:border-b-transparent"
          >
            <span className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resume Templates
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="coverLetter"
            className="rounded-t-md rounded-b-none px-4 py-1.5 text-sm font-medium text-muted-foreground border border-border transition -mb-px
                       hover:bg-background/60 hover:text-foreground
                       data-[state=active]:bg-muted-foreground data-[state=active]:text-muted dark:data-[state=active]:bg-muted dark:data-[state=active]:text-muted-foreground data-[state=active]:border-b-transparent"
          >
            <span className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Cover Letter Templates
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resume" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Resume Templates</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumeTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                type="resume"
                onGenerate={() => handleGenerateDocument(template)}
                onPreview={() => setPreviewTemplate(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
              />
            ))}

            {resumeTemplates.length === 0 && (
              <Card className="border-dashed border-2 border-border bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-card-foreground mb-2">No resume templates yet</h3>
                  <p className="text-muted-foreground text-center mb-4">Add resume templates to your Google Drive folder to begin.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="coverLetter" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Cover Letter Templates</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverLetterTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                type="coverLetter"
                onGenerate={() => handleGenerateDocument(template)}
                onPreview={() => setPreviewTemplate(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
              />
            ))}

            {coverLetterTemplates.length === 0 && (
              <Card className="border-dashed border-2 border-border bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-card-foreground mb-2">No cover letter templates yet</h3>
                  <p className="text-muted-foreground text-center mb-4">Add cover letter templates to your Google Drive folder to begin.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <FolderSetupDialog
        open={showFolderDialog}
        onOpenChange={setShowFolderDialog}
        onSetupComplete={fetchFolders}
      />

      <GenerateDocumentDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        template={selectedTemplate}
      />

      <TemplatePreviewDialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        templateId={previewTemplate?.id}
        templateName={previewTemplate?.name}
        mimeType={previewTemplate?.mimeType}
      />
    </div>
  )
}

interface TemplateCardProps {
  template: {
    id: string
    name: string
    description?: string
    modifiedTime?: string
    folderId: string
    mimeType?: string
  }
  type: "resume" | "coverLetter"
  onGenerate: () => void
  onPreview: () => void
  onDelete: () => void
}

function TemplateCard({ template, type, onGenerate, onPreview, onDelete }: TemplateCardProps) {
  const isDocx = template.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-card-foreground line-clamp-1">{template.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{template.description}</CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {type === "resume" ? "Resume" : "Cover Letter"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>
            Modified {template.modifiedTime ? new Date(template.modifiedTime).toLocaleDateString() : "Recently"}
          </span>
        </div>

        <div className="space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {!isDocx ? (
                  <Button onClick={onGenerate} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Document
                  </Button>
                ) : (
                  <Button onClick={onGenerate} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Convert & Generate
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent>{!isDocx ? "Generate from template" : "Convert .docx and generate"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-2 w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 min-w-0">
                    <Button size="sm" variant="outline" className="w-full bg-transparent" onClick={onPreview}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Preview</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 min-w-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => {
                        const googleDocs = "application/vnd.google-apps.document"
                        const url = template.mimeType === googleDocs
                          ? `https://docs.google.com/document/d/${template.id}/edit`
                          : `https://drive.google.com/file/d/${template.id}/view`
                        window.open(url, "_blank", "noopener,noreferrer")
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Edit in Google Docs</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {!isDocx && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 min-w-0">
                      <PdfExportButton
                        documentId={template.id}
                        documentName={template.name}
                        variant="outline"
                        size="sm"
                        showText={false}
                        showOpenInBrowser={false}
                        className="w-full"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Export PDF</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 min-w-0">
                    <Button size="sm" variant="outline" className="w-full bg-transparent" onClick={onDelete}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
