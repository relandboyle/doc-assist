"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, FolderOpen, Settings, Edit, Copy, Eye, Sparkles } from "lucide-react"
import { CreateTemplateDialog } from "@/components/create-template-dialog"
import { FolderSetupDialog } from "@/components/folder-setup-dialog"
import { GenerateDocumentDialog } from "@/components/generate-document-dialog"
import { PdfExportButton } from "@/components/pdf-export-button"
import { FolderStatus } from "@/components/folder-status"
import { useTemplateStore } from "@/lib/template-store"

export function TemplateDashboard() {
  const { data: session, status } = useSession()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [selectedTemplateType, setSelectedTemplateType] = useState<"resume" | "coverLetter">("resume")

  const { templates, folders, isLoading, fetchTemplates, fetchFolders, initializeFromStorage } = useTemplateStore()

  useEffect(() => {
    // Only initialize from localStorage if user is authenticated
    if (status === "authenticated") {
      console.log('Initializing from localStorage...')
      initializeFromStorage()
    }
  }, [status])

  useEffect(() => {
    // Only fetch templates if user is authenticated and has folder IDs
    if (status === "authenticated" && folders.resumeFolderId) {
      fetchTemplates(folders.resumeFolderId, "resume")
    }
  }, [folders.resumeFolderId, fetchTemplates, status])

  useEffect(() => {
    // Only fetch templates if user is authenticated and has folder IDs
    if (status === "authenticated" && folders.coverLetterFolderId) {
      fetchTemplates(folders.coverLetterFolderId, "coverLetter")
    }
  }, [folders.coverLetterFolderId, fetchTemplates, status])

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

  const handleCreateTemplate = (type: "resume" | "coverLetter") => {
    setSelectedTemplateType(type)
    setShowCreateDialog(true)
  }

  const handleGenerateDocument = (template: any) => {
    setSelectedTemplate(template)
    setShowGenerateDialog(true)
  }

  const resumeTemplates = templates.filter((t) => t.type === "resume")
  const coverLetterTemplates = templates.filter((t) => t.type === "coverLetter")

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
          <Button
            onClick={() => handleCreateTemplate("resume")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
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
            <div className="text-2xl font-bold text-card-foreground">{resumeTemplates.length}</div>
            <p className="text-xs text-muted-foreground">Ready for customization</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Cover Letters</CardTitle>
            <FileText className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{coverLetterTemplates.length}</div>
            <p className="text-xs text-muted-foreground">Professional templates</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Documents</CardTitle>
            <Settings className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {resumeTemplates.length + coverLetterTemplates.length}
            </div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Template Tabs */}
      <Tabs defaultValue="resume" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="resume" className="data-[state=active]:bg-background">
            Resume Templates
          </TabsTrigger>
          <TabsTrigger value="coverLetter" className="data-[state=active]:bg-background">
            Cover Letter Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resume" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Resume Templates</h2>
            <Button
              onClick={() => handleCreateTemplate("resume")}
              variant="outline"
              size="sm"
              className="border-border hover:bg-accent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Resume Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumeTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                type="resume"
                onGenerate={() => handleGenerateDocument(template)}
              />
            ))}

            {/* Empty state for new users */}
            {resumeTemplates.length === 0 && (
              <Card className="border-dashed border-2 border-border bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-card-foreground mb-2">No resume templates yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first resume template to get started
                  </p>
                  <Button
                    onClick={() => handleCreateTemplate("resume")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="coverLetter" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Cover Letter Templates</h2>
            <Button
              onClick={() => handleCreateTemplate("coverLetter")}
              variant="outline"
              size="sm"
              className="border-border hover:bg-accent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Cover Letter Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverLetterTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                type="coverLetter"
                onGenerate={() => handleGenerateDocument(template)}
              />
            ))}

            {/* Empty state for new users */}
            {coverLetterTemplates.length === 0 && (
              <Card className="border-dashed border-2 border-border bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-card-foreground mb-2">No cover letter templates yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first cover letter template to get started
                  </p>
                  <Button
                    onClick={() => handleCreateTemplate("coverLetter")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        templateType={selectedTemplateType}
      />

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
  }
  type: "resume" | "coverLetter"
  onGenerate: () => void
}

function TemplateCard({ template, type, onGenerate }: TemplateCardProps) {
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
          <Button onClick={onGenerate} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Document
          </Button>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button size="sm" variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
            <PdfExportButton
              documentId={template.id}
              documentName={template.name}
              variant="outline"
              size="sm"
              showText={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
