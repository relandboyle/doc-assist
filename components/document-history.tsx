"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, ExternalLink } from "lucide-react"
import { PdfExportButton } from "@/components/pdf-export-button"

interface GeneratedDocument {
  id: string
  name: string
  templateName: string
  type: "resume" | "coverLetter"
  generatedDate: string
  companyName?: string
  jobTitle?: string
}

// Mock data - in real app, this would come from a database or API
const mockGeneratedDocuments: GeneratedDocument[] = [
  {
    id: "doc1",
    name: "Software Engineer Resume - Google",
    templateName: "Software Engineer Resume",
    type: "resume",
    generatedDate: "2024-01-15T10:30:00Z",
    companyName: "Google",
    jobTitle: "Software Engineer",
  },
  {
    id: "doc2",
    name: "Cover Letter - Microsoft",
    templateName: "Tech Company Cover Letter",
    type: "coverLetter",
    generatedDate: "2024-01-14T14:20:00Z",
    companyName: "Microsoft",
    jobTitle: "Senior Developer",
  },
]

export function DocumentHistory() {
  const { data: session, status } = useSession()
  const [documents] = useState<GeneratedDocument[]>(mockGeneratedDocuments)

  // Don't render anything if session is loading or not authenticated
  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Please sign in to view document history.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Recent Documents</h2>
        <p className="text-muted-foreground mt-1">Your recently generated documents</p>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {doc.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Generated from "{doc.templateName}" template
                    {doc.companyName && doc.jobTitle && (
                      <span>
                        {" "}
                        • {doc.jobTitle} at {doc.companyName}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {doc.type === "resume" ? "Resume" : "Cover Letter"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Generated {new Date(doc.generatedDate).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://docs.google.com/document/d/${doc.id}/edit`, "_blank")}
                    className="bg-transparent"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>

                  <PdfExportButton documentId={doc.id} documentName={doc.name} variant="outline" size="sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {documents.length === 0 && (
          <Card className="border-dashed border-2 border-border bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No documents generated yet</h3>
              <p className="text-muted-foreground text-center">
                Generate your first document from a template to see it here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
