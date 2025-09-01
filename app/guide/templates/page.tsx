import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen, FileText, Sparkles } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"

export default function TemplatesGuidePage() {
  return (
    <div className="flex flex-col flex-1 bg-gradient-to-br from-background to-muted">
      <DashboardHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Template Setup Guide</h1>
            <p className="text-muted-foreground mt-2">How to set up folders, create templates, and where to put files.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <FolderOpen className="h-5 w-5 text-primary" />
              Set up Google Drive folders
            </CardTitle>
            <CardDescription>
              Create or select the main folder; we create subfolders automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Open the dashboard and click <span className="text-foreground font-medium">Setup Folders</span> (or Manage if already set).</li>
              <li>Choose <span className="text-foreground font-medium">Create New Folder</span> or <span className="text-foreground font-medium">Use Existing Folder</span>.</li>
              <li>Select a parent folder from Google Drive. We will create:
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>📁 <span className="text-foreground">Resume Templates</span></li>
                  <li>📁 <span className="text-foreground">Cover Letter Templates</span></li>
                  <li>📁 <span className="text-foreground">Generated Resumes</span></li>
                  <li>📁 <span className="text-foreground">Generated Cover Letters</span></li>
                </ul>
              </li>
            </ol>
            <div className="pt-2">
              <Link href="/dashboard">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
                  Open Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Add your templates
            </CardTitle>
            <CardDescription>
              Place Google Docs into the appropriate subfolder so they show up in the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Put resume templates in <span className="text-foreground font-medium">Resume Templates</span>.</li>
              <li>Put cover letter templates in <span className="text-foreground font-medium">Cover Letter Templates</span>.</li>
              <li>Templates must be Google Docs (not PDFs). You can copy existing Docs or create new ones.</li>
            </ol>
            <p className="text-xs">Tip: Use clear names; they appear as template titles.</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Use placeholders in your Docs
            </CardTitle>
            <CardDescription>
              Variables like <code>{"{{FULL_NAME}}"}</code> or <code>{"[COMPANY_NAME]"}</code> are replaced when generating documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Supported placeholder formats: <span className="text-foreground font-medium">{"{{KEY}}"}</span> or <span className="text-foreground font-medium">{"[KEY]"}</span>. Examples:
            </p>
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-xs text-foreground">
FULL_NAME: Your full name
EMAIL: Email address
PHONE: Phone number
LOCATION: City and state
LINKEDIN_URL: LinkedIn profile URL
COMPANY_NAME: Target company name
JOB_TITLE: Target job title
PROFESSIONAL_SUMMARY, DEGREE, TECHNICAL_SKILLS, PROJECT_NAME, etc.
            </pre>
            <p>
              When you generate a document, the app scans the template for these placeholders and replaces them with your inputs while preserving formatting.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Where generated files go</CardTitle>
            <CardDescription>
              Generated documents are saved to the selected folder; you can choose a specific destination when generating.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              By default, you can target the appropriate folder (e.g., <span className="text-foreground font-medium">Generated Resumes</span> or <span className="text-foreground font-medium">Generated Cover Letters</span>) when generating from a template.
            </p>
          </CardContent>
        </Card>
          </div>
        </div>
      </main>
    </div>
  )
}


