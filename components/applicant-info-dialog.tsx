"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type ApplicantInfo = { name: string; address: string }

const STORAGE_KEY = "doc-assist-applicant"

export function readApplicantInfo(): ApplicantInfo | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const name = typeof parsed?.name === "string" ? parsed.name : ""
    const address = typeof parsed?.address === "string" ? parsed.address : ""
    if (!name && !address) return null
    return { name, address }
  } catch {
    return null
  }
}

export function writeApplicantInfo(info: ApplicantInfo) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
}

export default function ApplicantInfoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")

  useEffect(() => {
    if (open) {
      const existing = readApplicantInfo()
      if (existing) {
        setName(existing.name || "")
        setAddress(existing.address || "")
      }
    }
  }, [open])

  const handleSave = () => {
    const trimmedName = name.trim()
    const trimmedAddress = address.trim()
    writeApplicantInfo({ name: trimmedName, address: trimmedAddress })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">Applicant Information</DialogTitle>
          <DialogDescription>
            Store your preferred display name and mailing address. We’ll prepend these to your cover letters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-popover-foreground" htmlFor="applicant-name">Full name</Label>
            <Input id="applicant-name" value={name} onChange={(e) => setName(e.target.value)} className="bg-input border-border" placeholder="First Last" />
          </div>

          <div className="space-y-2">
            <Label className="text-popover-foreground" htmlFor="applicant-address">Mailing address</Label>
            <Textarea id="applicant-address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-input border-border min-h-24" placeholder={"123 Main St\nCity, ST 12345"} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


