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
            <p className="text-muted-foreground mt-2">How to set up folders, manage templates, and use the Document Builder.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <FolderOpen className="h-5 w-5 text-primary" />
              Set up Google Drive folders
            </CardTitle>
            <CardDescription>
              Create or select the main folder; we create subfolders automatically. You can also clear a previous selection.
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
              <li>If you need to reset, use <span className="text-foreground font-medium">Clear Selection</span> in the dialog to remove the saved folder configuration.</li>
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
              Place Google Docs into the appropriate subfolder so they show up in the app. Use the Refresh button to re-sync the list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Put resume templates in <span className="text-foreground font-medium">Resume Templates</span>.</li>
              <li>Put cover letter templates in <span className="text-foreground font-medium">Cover Letter Templates</span>.</li>
              <li>Templates must be Google Docs (not PDFs). You can copy existing Docs or create new ones.</li>
            </ol>
            <p className="text-xs">Tip: Use clear names; they appear as template titles. The header includes a <span className="text-foreground font-medium">Refresh</span> button to reload from Google Drive.</p>
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
            <p className="mt-2">
              Special placeholders used by the Document Builder:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>{'{'}{'{'}Job 01 Bullets{'}'}{'}'}</code> — replaced with a bulleted list of 12–15 optimized bullets.</li>
              <li><code>{'{'}{'{'}Skills List{'}'}{'}'}</code> — replaced with a single line of 15–25 skills separated by the bullet character (•).</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Where generated files go</CardTitle>
            <CardDescription>
              Generated documents are saved to the selected folder; by default we use <span className="text-foreground font-medium">Generated Resumes</span> or <span className="text-foreground font-medium">Generated Cover Letters</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              You can target a specific destination when generating from a template. Converted files and newly generated documents appear instantly in the Template Library after a refresh.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Document Builder workflow</CardTitle>
            <CardDescription>Build a targeted resume from a LinkedIn job post in three steps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal pl-5 space-y-2">
              <li><span className="text-foreground font-medium">Extract</span>: paste a LinkedIn job URL to pull the company, title, and description.</li>
              <li><span className="text-foreground font-medium">Key Words</span>: generate a focused list of keywords for the role.</li>
              <li><span className="text-foreground font-medium">Generate Document</span>: pick a resume template containing <code>{'{'}{'{'}Job 01 Bullets{'}'}{'}'}</code> and <code>{'{'}{'{'}Skills List{'}'}{'}'}</code>. We read your <span className="text-foreground font-medium">Library</span> doc in the selected folder, optimize bullets with the keywords, and insert them while preserving formatting.</li>
            </ol>
            <p className="text-xs">Note: For .docx templates, you’ll be prompted to Delete, Archive, or Keep the original after conversion.</p>
          </CardContent>
        </Card>
          </div>
        </div>
      </main>
    </div>
  )
}


