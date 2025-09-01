"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Link as LinkIcon, Building2, FileText, Linkedin } from "lucide-react"

interface ExtractedJobData {
  url: string
  company?: string
  title?: string
  description?: string
}

export function DocumentBuilder() {
  const { toast } = useToast()
  const [jobUrl, setJobUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [jobData, setJobData] = useState<ExtractedJobData | null>(null)

  const handleExtract = async () => {
    try {
      const trimmed = jobUrl.trim()
      if (!trimmed) {
        toast({
          title: "Enter a job post URL",
          description: "Paste a link to a job posting to extract details.",
          variant: "destructive",
        })
        return
      }
      try {
        // Validate URL shape
        // eslint-disable-next-line no-new
        new URL(trimmed)
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please provide a valid URL (including https://).",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      const resp = await fetch("/api/job/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      })
      if (!resp.ok) {
        throw new Error("Failed to extract job details")
      }
      const data = (await resp.json()) as { job: ExtractedJobData }
      setJobData(data.job)
      // Volatile only: log for now
      // eslint-disable-next-line no-console
      console.log("Extracted job data:", data.job)
      toast({ title: "Job details extracted", description: "Parsed basic info from the post." })
    } catch (err) {
      toast({ title: "Extraction failed", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-0 sm:px-2">
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-card-foreground">Document Builder</CardTitle>
          <CardDescription>Build a targeted resume for a specific role or job opening.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job-url" className="text-popover-foreground flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Job posting URL
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="job-url"
                placeholder="https://www.linkedin.com/jobs/view/..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="bg-input border-border"
              />
              <Button onClick={handleExtract} disabled={isLoading} className="bg-primary text-primary-foreground">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting
                  </>
                ) : (
                  "Extract"
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Linkedin className="h-3.5 w-3.5" />
              <span>Currently supports LinkedIn job post links only.</span>
            </div>
          </div>

          {jobData && (
            <div className="rounded-md border border-border p-4 bg-background/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Building2 className="h-4 w-4" />
                <span>{jobData.company || "Company (detected)"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                <span>{jobData.title || "Job Title (detected)"}</span>
              </div>
              <div className="text-sm whitespace-pre-line">
                {jobData.description || "Job description preview will appear here."}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


