"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Link as LinkIcon, Building2, FileText } from "lucide-react"

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
  const [isKeywordsLoading, setIsKeywordsLoading] = useState(false)
  const [keywords, setKeywords] = useState<string[] | null>(null)

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

  const handleGenerateKeywords = async () => {
    try {
      if (!jobData?.description) {
        toast({
          title: "Extract job details first",
          description: "Use Extract to parse the job post, then try again.",
          variant: "destructive",
        })
        return
      }
      setIsKeywordsLoading(true)

      const system =
        "Please provide a list of 20-30 key words which occur in this job description and are most likely to be used by this company in ranking resumes submitted for this role. Return one keyword per line, with no extra commentary."

      const resp = await fetch("/api/ai/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: jobData.company,
          title: jobData.title,
          description: jobData.description,
          system,
        }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({} as any))
        throw new Error(err?.error || "Failed to generate keywords")
      }
      const data = (await resp.json()) as { text?: string }
      const text = (data.text || "").trim()
      if (!text) {
        throw new Error("Empty response from model")
      }

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.replace(/^\s*(?:[-*•]|\d+\.)\s*/, "").trim())
        .filter(Boolean)

      setKeywords(lines)
      toast({ title: "Keywords generated", description: `Found ${lines.length} items.` })
    } catch (err) {
      toast({ title: "Generation failed", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsKeywordsLoading(false)
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
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-[2px] bg-[#0A66C2]">
                <svg
                  viewBox="0 0 448 512"
                  className="h-3 w-3 text-white"
                  aria-hidden="true"
                  focusable="false"
                  fill="currentColor"
                >
                  <path d="M100.28 448H7.4V148.9h92.88zM53.64 108.1C24.19 108.1 0 83.71 0 52.64 0 23.43 24.77 0 53.35 0 82.05 0 106 23.43 106 52.64c0 31.07-24.22 55.46-52.36 55.46zM447.9 448h-92.36V302.4c0-34.7-12.4-58.4-43.4-58.4-23.67 0-37.77 15.9-43.9 31.3-2.26 5.4-2.82 13-2.82 20.6V448h-92.4V148.9h88.67v40.8h1.28c12.2-18.8 34-45.7 82.8-45.7 60.4 0 105.8 39.5 105.8 124.3z"/>
                </svg>
              </span>
              <span>Currently supports LinkedIn job post links only.</span>
            </div>
          </div>

          {jobData && (
            <>
              <div className="relative rounded-md border border-border p-4 bg-background/50">
                <div className="absolute top-2 right-2">
                  <Button onClick={handleGenerateKeywords} disabled={isKeywordsLoading} className="bg-primary text-primary-foreground">
                    {isKeywordsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Key Words
                      </>
                    ) : (
                      "Key Words"
                    )}
                  </Button>
                </div>
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
              {keywords && keywords.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Suggested Key Words</Label>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((kw, idx) => (
                      <Badge key={`${kw}-${idx}`} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


