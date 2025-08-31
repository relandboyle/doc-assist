"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, ExternalLink } from "lucide-react"
import { PdfExportButton } from "@/components/pdf-export-button"
import { useTemplateStore } from "@/lib/template-store"

export function DocumentHistory() {
  const { data: session, status } = useSession()
  const { folders } = useTemplateStore()
  const [resumeDocs, setResumeDocs] = useState<any[]>([])
  const [coverLetterDocs, setCoverLetterDocs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchDocs = async () => {
      if (status !== "authenticated") return
      if (!folders.generatedResumeFolderId && !folders.generatedCoverLetterFolderId) return
      setIsLoading(true)
      try {
        const [resumesResp, coversResp] = await Promise.all([
          folders.generatedResumeFolderId
            ? fetch(`/api/templates?folderId=${folders.generatedResumeFolderId}&type=resume`)
            : Promise.resolve(null as unknown as Response),
          folders.generatedCoverLetterFolderId
            ? fetch(`/api/templates?folderId=${folders.generatedCoverLetterFolderId}&type=coverLetter`)
            : Promise.resolve(null as unknown as Response),
        ])

        if (resumesResp && resumesResp.ok) {
          const data = await resumesResp.json()
          setResumeDocs(Array.isArray(data.templates) ? data.templates : [])
        } else {
          setResumeDocs([])
        }

        if (coversResp && coversResp.ok) {
          const data = await coversResp.json()
          setCoverLetterDocs(Array.isArray(data.templates) ? data.templates : [])
        } else {
          setCoverLetterDocs([])
        }
      } catch {
        setResumeDocs([])
        setCoverLetterDocs([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchDocs()
  }, [status, folders.generatedResumeFolderId, folders.generatedCoverLetterFolderId])

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
        <h2 className="text-2xl font-bold text-foreground">Generated Documents</h2>
        <p className="text-muted-foreground mt-1">Files created from your templates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generated Resumes Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Generated Resumes</h3>
            {isLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
          </div>

          {resumeDocs.map((doc) => (
            <Card key={doc.id} className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {doc.name}
                    </CardTitle>
                    {doc.modifiedTime && (
                      <CardDescription className="mt-1">
                        Modified {new Date(doc.modifiedTime).toLocaleDateString()}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">Resume</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{doc.createdTime ? `Created ${new Date(doc.createdTime).toLocaleDateString()}` : "Created recently"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(`https://docs.google.com/document/d/${doc.id}/edit`, "_blank")} className="bg-transparent">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <PdfExportButton documentId={doc.id} documentName={doc.name} variant="outline" size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {resumeDocs.length === 0 && !isLoading && (
            <Card className="border-dashed border-2 border-border bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="text-base font-medium text-card-foreground mb-2">No generated resumes yet</h4>
                <p className="text-muted-foreground text-center text-sm">Generate a resume from a template to see it here.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generated Cover Letters Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Generated Cover Letters</h3>
            {isLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
          </div>

          {coverLetterDocs.map((doc) => (
            <Card key={doc.id} className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {doc.name}
                    </CardTitle>
                    {doc.modifiedTime && (
                      <CardDescription className="mt-1">
                        Modified {new Date(doc.modifiedTime).toLocaleDateString()}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">Cover Letter</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{doc.createdTime ? `Created ${new Date(doc.createdTime).toLocaleDateString()}` : "Created recently"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(`https://docs.google.com/document/d/${doc.id}/edit`, "_blank")} className="bg-transparent">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <PdfExportButton documentId={doc.id} documentName={doc.name} variant="outline" size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {coverLetterDocs.length === 0 && !isLoading && (
            <Card className="border-dashed border-2 border-border bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="text-base font-medium text-card-foreground mb-2">No generated cover letters yet</h4>
                <p className="text-muted-foreground text-center text-sm">Generate a cover letter from a template to see it here.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
