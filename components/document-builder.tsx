"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AnimatePresence, motion } from "framer-motion"
import dynamic from "next/dynamic"
import ApplicantInfoDialog, { readApplicantInfo as readApplicantInfoFromStore } from "@/components/applicant-info-dialog"
import { useTemplateStore } from "@/lib/template-store"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Link as LinkIcon, Building2, FileText, Sparkles, FileDown } from "lucide-react"

interface ExtractedJobData {
  url: string
  company?: string
  title?: string
  description?: string
  hiringTeam?: Array<{ name: string; title?: string }>
}

export function DocumentBuilder() {
  const { toast } = useToast()
  const { folders, initializeFromStorage } = useTemplateStore()
  const [jobUrl, setJobUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [jobData, setJobData] = useState<ExtractedJobData | null>(null)
  const [isKeywordsLoading, setIsKeywordsLoading] = useState(false)
  const [keywords, setKeywords] = useState<string[] | null>(null)
  const [isGenOpen, setIsGenOpen] = useState(false)
  const [isGenLoading, setIsGenLoading] = useState(false)
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [libraryBullets, setLibraryBullets] = useState<string[]>([])
  const [genName, setGenName] = useState<string>("")
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [isCLDialogOpen, setIsCLDialogOpen] = useState(false)
  const [isGeneratingCL, setIsGeneratingCL] = useState(false)
  const [generatedCLId, setGeneratedCLId] = useState<string | null>(null)
  const [resumeOptions, setResumeOptions] = useState<Array<{ id: string; name: string }>>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [clName, setClName] = useState<string>("")
  const [isLoadingResumes, setIsLoadingResumes] = useState(false)
  const [isApplicantDialogOpen, setIsApplicantDialogOpen] = useState(false)
  const [applicantOptedOut, setApplicantOptedOut] = useState(false)
  const [applicantName, setApplicantName] = useState("")
  const [applicantAddress, setApplicantAddress] = useState("")
  const clAbortRef = useRef<AbortController | null>(null)
  const [hiringPerson, setHiringPerson] = useState<{ name: string; title?: string } | null>(null)
  const [addressTo, setAddressTo] = useState<'manager' | 'person'>('manager')
  // Read applicant info from localStorage (client-side only)
  const readApplicant = () => {
    if (typeof window === 'undefined') return { name: '', address: '' }
    try {
      const raw = localStorage.getItem('doc-assist-applicant')
      if (raw === null) return { name: '', address: '' }
      const parsed = JSON.parse(raw)
      if (parsed === null) {
        return { name: '', address: '', optedOut: true } as any
      }
      const data = parsed || {}
      return { name: String(data?.name || ''), address: String(data?.address || ''), optedOut: false } as any
    } catch {
      return { name: '', address: '' }
    }
  }

  // Ensure folder IDs are available when landing directly on Builder
  // Load from localStorage after mount to avoid state updates during render
  useEffect(() => {
    try { initializeFromStorage() } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      // Pick one hiring team member if present (random)
      const ht = Array.isArray(data.job?.hiringTeam) ? data.job.hiringTeam : []
      if (ht.length > 0) {
        const pick = ht[Math.floor(Math.random() * ht.length)]
        if (pick && pick.name) setHiringPerson({ name: pick.name, title: pick.title })
      } else {
        setHiringPerson(null)
      }
      setAddressTo('manager')
      // Volatile only: log for now
      // eslint-disable-next-line no-console
      console.log("Extracted job data:", data.job)
      toast({ title: "Job details extracted", description: "Parsed basic info from the post." })
      // Automatically generate keywords after a successful extract
      await generateKeywordsFor(data.job)
    } catch (err) {
      toast({ title: "Extraction failed", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const generateKeywordsFor = async (job: ExtractedJobData) => {
    try {
      if (!job?.description) {
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
          company: job.company,
          title: job.title,
          description: job.description,
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

  const handleGenerateKeywords = async () => {
    if (!jobData) {
      toast({
        title: "Extract job details first",
        description: "Use Extract to parse the job post, then try again.",
        variant: "destructive",
      })
      return
    }
    await generateKeywordsFor(jobData)
  }

  const openGenerateDialog = async () => {
    try {
      if (!jobData?.title || !keywords || keywords.length === 0) {
        toast({ title: "Complete previous steps", description: "Extract job data and generate keywords first.", variant: "destructive" })
        return
      }
      if (!folders?.mainFolderId) {
        toast({ title: "Select folders first", description: "Use Folder Setup to configure your Drive folders.", variant: "destructive" })
        return
      }
      setIsGenLoading(true)
      setIsGenOpen(true)
      setGenName(`${jobData.title} - Targeted Resume (${new Date().toLocaleDateString()})`)

      // Fetch Library bullets from the main folder
      const libResp = await fetch(`/api/library/bullets?folderId=${folders.mainFolderId}`)
      const libData = await libResp.json().catch(() => ({ bullets: [] }))
      setLibraryBullets(Array.isArray(libData.bullets) ? libData.bullets : [])

      // Fetch resume templates for selection
      if (folders?.resumeFolderId) {
        const tResp = await fetch(`/api/templates?folderId=${folders.resumeFolderId}&type=resume`)
        const tData = await tResp.json().catch(() => ({ templates: [] }))
        const mapped = Array.isArray(tData.templates) ? tData.templates.map((t: any) => ({ id: t.id, name: t.name })) : []
        setTemplates(mapped)
        if (mapped.length > 0) setSelectedTemplateId(mapped[0].id)
      }
    } catch (e) {
      toast({ title: "Setup incomplete", description: "Could not load Library or templates.", variant: "destructive" })
    } finally {
      setIsGenLoading(false)
    }
  }

  const handleGenerateTargetedResume = async () => {
    try {
      if (!selectedTemplateId) {
        toast({ title: "Select a template", description: "Choose a resume template to generate from.", variant: "destructive" })
        return
      }
      if (!jobData?.title || !keywords?.length || !libraryBullets.length) {
        toast({ title: "Missing data", description: "Ensure job title, keywords, and Library bullets are loaded.", variant: "destructive" })
        return
      }
      setIsGeneratingDoc(true)
      const resp = await fetch('/api/builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          folderId: folders.generatedResumeFolderId || folders.resumeFolderId,
          jobTitle: jobData.title,
          keywords,
          bullets: libraryBullets,
          documentName: genName || `${jobData.title} - Targeted Resume`,
        }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Failed to generate document')
      }
      const data = await resp.json()
      toast({ title: 'Document generated', description: 'Opening in Google Docs…' })
      if (data?.documentId) {
        window.open(`https://docs.google.com/document/d/${data.documentId}/edit`, '_blank', 'noopener,noreferrer')
      }
      setIsGenOpen(false)
    } catch (e) {
      toast({ title: 'Generation failed', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setIsGeneratingDoc(false)
    }
  }

  return (
    <div className="container mx-auto px-0 sm:px-2">
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-card-foreground">Document Builder</CardTitle>
          <CardDescription>Build a targeted resume or cover letter for a specific role or job opening.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence initial={false}>
            {keywords && keywords.length > 0 ? (
              <motion.div
                key="keywords-block"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-3"
              >
                <div className="flex flex-wrap gap-2">
                  <Button variant='outline' onClick={openGenerateDialog} className="border-border">
                    <Sparkles className="h-4 w-4 mr-2" /> Generate Targeted Resume
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (!jobData?.title || !jobData?.description) {
                          toast({ title: 'Complete previous steps', description: 'Extract job data first.', variant: 'destructive' })
                          return
                        }
                        // Ensure applicant info exists or opted-out before proceeding
                        const applicant = readApplicant() as any
                        setApplicantOptedOut(!!applicant?.optedOut)
                        setApplicantName(applicant?.name || '')
                        setApplicantAddress(applicant?.address || '')
                        if (!applicant?.optedOut && (!applicant?.name || !applicant?.address)) {
                          // Proceed to open the generate dialog; inline controls there will prompt to add or skip
                        }
                        if (!folders?.generatedResumeFolderId) {
                          toast({ title: 'Select folders first', description: 'Use Folder Setup to configure your Drive folders.', variant: 'destructive' })
                          return
                        }
                        setIsCLDialogOpen(true)
                        setGeneratedCLId(null)
                        setClName(`${jobData.title} - Targeted Cover Letter (${new Date().toLocaleDateString()})`)
                        // load generated resumes for selection
                        setIsLoadingResumes(true)
                        try {
                          const r = await fetch(`/api/templates?folderId=${folders.generatedResumeFolderId}&type=resume`)
                          const d = await r.json().catch(() => ({ templates: [] }))
                          const DOCS = 'application/vnd.google-apps.document'
                          const mapped = Array.isArray(d.templates)
                            ? d.templates
                                .filter((t: any) => t?.mimeType === DOCS)
                                .map((t: any) => ({ id: t.id, name: t.name }))
                            : []
                          setResumeOptions(mapped)
                          if (mapped.length > 0) setSelectedResumeId(mapped[0].id)
                          else setSelectedResumeId("")
                        } finally {
                          setIsLoadingResumes(false)
                        }
                      } catch {
                        toast({ title: 'Could not load resumes', description: 'Try reloading the page.', variant: 'destructive' })
                      }
                    }}
                    className="border-border"
                  >
                    <Sparkles className="h-4 w-4 mr-2" /> Generate Targeted Cover Letter
                  </Button>
                </div>
                <Accordion type="single" collapsible className="rounded-md border border-border bg-background/50">
                  <AccordionItem value="keywords">
                    <AccordionTrigger className="px-3">Suggested Key Words</AccordionTrigger>
                    <AccordionContent className="px-3">
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((kw, idx) => (
                          <Badge key={`${kw}-${idx}`} variant="secondary">{kw}</Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
            ) : null}
          </AnimatePresence>

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
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> Extract
                  </>
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4" />
                  <span>{jobData.company || "Company (detected)"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <FileText className="h-4 w-4" />
                  <span>{jobData.title || "Job Title (detected)"}</span>
                </div>
                {hiringPerson && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="inline-block rounded-sm bg-accent px-1.5 py-0.5">Hiring team</span>
                    <span>{hiringPerson.name}{hiringPerson.title ? ` — ${hiringPerson.title}` : ''}</span>
                  </div>
                )}
                <div className="text-sm whitespace-pre-line">
                  {jobData.description || "Job description preview will appear here."}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isGenOpen} onOpenChange={setIsGenOpen}>
        <DialogContent className="sm:max-w-[580px] bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-popover-foreground">Generate Targeted Resume</DialogTitle>
            <DialogDescription>
              Select a resume template containing {'{{Job 01 Bullets}}'} and {'{{Skills List}}'} placeholders. We’ll insert optimized bullets and a single-line skills list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-popover-foreground">Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={isGenLoading || templates.length === 0}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder={isGenLoading ? 'Loading templates…' : 'Select a template'} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-popover-foreground">Document Name</Label>
              <Input value={genName} onChange={(e) => setGenName(e.target.value)} className="bg-input border-border" />
            </div>

            <div className="text-xs text-muted-foreground">
              {isGenLoading ? 'Loading Library bullets…' : `${libraryBullets.length} bullets found in Library`}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleGenerateTargetedResume} disabled={isGenLoading || isGeneratingDoc || !selectedTemplateId} className="bg-primary text-primary-foreground">
              {isGeneratingDoc ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Cover Letter Dialog */}
      <Dialog open={isCLDialogOpen} onOpenChange={(o) => { setIsCLDialogOpen(o); if (!o) {
        // Abort in-flight cover letter generation when dialog closes
        try { clAbortRef.current?.abort() } catch {}
        setIsGeneratingCL(false)
        setGeneratedCLId(null)
      } }}>
        <DialogContent className="sm:max-w-[580px] bg-popover border-border">
          {!generatedCLId ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-popover-foreground">Generate Targeted Cover Letter</DialogTitle>
                <DialogDescription>
                  Choose a generated resume to ground the model. We’ll create a new cover letter in your Generated Cover Letter folder.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-popover-foreground">Resume (from Generated Resumes)</Label>
                  <div className="text-xs text-muted-foreground">Only Google Docs resumes are supported for cover letter generation.</div>
                  {isLoadingResumes ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading resumes…
                    </div>
                  ) : resumeOptions.length === 0 ? (
                    <div className="flex flex-col gap-3 rounded-md border border-border p-3 bg-background/50">
                      <div className="text-sm text-muted-foreground">No generated Google Docs resumes found.</div>
                      <div>
                        <Button variant="outline" className="border-border" onClick={() => { setIsCLDialogOpen(false); setIsGenOpen(true); }}>
                          <Sparkles className="h-4 w-4 mr-2" /> Generate a Targeted Resume
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder={'Select a resume'} />
                      </SelectTrigger>
                      <SelectContent>
                        {resumeOptions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-popover-foreground">Document Name</Label>
                  <Input value={clName} onChange={(e) => setClName(e.target.value)} className="bg-input border-border" />
                </div>


                <div className="space-y-2">
                  <Label className="text-popover-foreground">Address to</Label>
                  <Select value={addressTo} onValueChange={(v: any) => setAddressTo(v)}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Hiring Manager</SelectItem>
                      {hiringPerson && (
                        <SelectItem value="person">{hiringPerson.name}{hiringPerson.title ? ` — ${hiringPerson.title}` : ''}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>



                {(() => {
                  const a: any = (typeof window !== 'undefined') ? readApplicant() : { name: '', address: '', optedOut: false }
                  const optedOut = !!a?.optedOut
                  const needsInfo = !optedOut && (!a?.name || !a?.address)
                  if (!needsInfo && !optedOut) return null
                  return (
                    <div className="space-y-2 rounded-md border border-border p-3 bg-background/50">
                      <div className="text-xs text-muted-foreground">
                        {optedOut
                          ? 'You chose to skip adding your name and address. They will be omitted from the cover letter.'
                          : 'Your name and mailing address are missing. Add them to prepend to the cover letter, or choose to skip.'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="border-border" onClick={() => setIsApplicantDialogOpen(true)}>Add applicant info</Button>
                        {!optedOut && (
                          <Button variant="outline" className="border-border" onClick={() => { localStorage.setItem('doc-assist-applicant', 'null'); setApplicantOptedOut(true) }}>Skip for now</Button>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCLDialogOpen(false)} className="border-border">Cancel</Button>
                <Button
                  onClick={async () => {
                    try {
                      if (!selectedResumeId) {
                        toast({ title: 'Select a resume', description: 'Pick a resume to ground the cover letter.', variant: 'destructive' })
                        return
                      }
                      if (!folders?.generatedCoverLetterFolderId) {
                        toast({ title: 'Select folders first', description: 'Use Folder Setup to configure your Drive folders.', variant: 'destructive' })
                        return
                      }
                      // Setup abort controller for this generation run
                      const controller = new AbortController()
                      try { clAbortRef.current?.abort() } catch {}
                      clAbortRef.current = controller
                      setIsGeneratingCL(true)
                      // Fetch resume text to include in payload for better grounding
                      let resumeText = ''
                      try {
                        const r = await fetch(`/api/templates/${selectedResumeId}?debug=1`, { signal: controller.signal })
                        const j = await r.json().catch(() => ({} as any))
                        if (typeof j?.textPreview === 'string') resumeText = j.textPreview
                      } catch {}
                      const applicant = readApplicant() as any
                      const applicantHeader = applicant?.optedOut ? '' : [applicant.name, applicant.address].filter(Boolean).join('\n')
                      const resp = await fetch('/api/builder/cover-letter', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          resumeDocumentId: selectedResumeId,
                          targetFolderId: folders.generatedCoverLetterFolderId || folders.coverLetterFolderId,
                          company: jobData?.company,
                          jobTitle: jobData?.title,
                          jobDescription: jobData?.description,
                          documentName: clName,
                          resumeText,
                          addressTo,
                          hiringPersonName: addressTo === 'person' ? hiringPerson?.name : undefined,
                        }),
                        signal: controller.signal,
                      })
                      if (!resp.ok) {
                        const err = await resp.json().catch(() => ({} as any))
                        throw new Error(err?.error || 'Failed to generate cover letter')
                      }
                      const data = await resp.json()
                      // Prepend applicant header client-side by updating the doc content directly
                      try {
                        if (data?.documentId && applicantHeader) {
                          await fetch('/api/documents/prepend-header', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ documentId: data.documentId, headerText: applicantHeader }),
                          })
                        }
                      } catch {}
                      setGeneratedCLId(data.documentId)
                      toast({ title: 'Cover letter generated', description: 'You can open it in Google Docs or download as PDF.' })
                    } catch (e) {
                      if ((e as any)?.name === 'AbortError') {
                        // Silently ignore user-initiated cancel
                      } else {
                        toast({ title: 'Generation failed', description: (e as Error).message, variant: 'destructive' })
                      }
                    } finally {
                      setIsGeneratingCL(false)
                    }
                  }}
                  disabled={(() => {
                    if (isGeneratingCL || !selectedResumeId || resumeOptions.length === 0) return true
                    const a: any = (typeof window !== 'undefined') ? readApplicant() : { name: '', address: '', optedOut: false }
                    const hasInfo = !!(a?.name && a?.address)
                    const canGenerate = !!a?.optedOut || hasInfo
                    return !canGenerate
                  })()}
                  className="bg-primary text-primary-foreground"
                >
                  {isGeneratingCL ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" /> Generate
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-popover-foreground">Cover Letter Ready</DialogTitle>
                <DialogDescription>Your cover letter has been created. You can download it as a PDF.</DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex items-center justify-between gap-2">
                {/* <Button variant="outline" onClick={() => setIsCLDialogOpen(false)} className="border-border">Close</Button> */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="border-border w-full sm:w-auto"
                    onClick={() => {
                      if (generatedCLId) {
                        window.open(`https://docs.google.com/document/d/${generatedCLId}/edit`, '_blank', 'noopener,noreferrer')
                      }
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" /> Open in Google Docs
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border w-full sm:w-auto"
                    onClick={() => {
                      // Link to Document History view
                      window.location.href = "/dashboard/history"
                    }}
                  >
                    View Document History
                  </Button>
                  <Button
                    onClick={() => {
                      const fileName = (clName || 'Cover Letter').replace(/\s+/g, ' ').trim()
                      const url = `/api/export/pdf?documentId=${encodeURIComponent(generatedCLId || '')}&fileName=${encodeURIComponent(fileName)}`
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                    className="bg-primary text-primary-foreground w-full sm:w-auto"
                  >
                    <FileDown className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <ApplicantInfoDialog open={isApplicantDialogOpen} onOpenChange={setIsApplicantDialogOpen} />
    </div>
  )
}


