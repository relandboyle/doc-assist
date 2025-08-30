"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Upload } from "lucide-react"

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateType: "resume" | "coverLetter"
}

export function CreateTemplateDialog({ open, onOpenChange, templateType }: CreateTemplateDialogProps) {
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [creationMethod, setCreationMethod] = useState<"blank" | "upload" | "existing">("blank")

  const handleCreate = () => {
    // TODO: Implement template creation logic
    console.log("Creating template:", {
      name: templateName,
      description: templateDescription,
      type: templateType,
      method: creationMethod,
    })
    onOpenChange(false)
    // Reset form
    setTemplateName("")
    setTemplateDescription("")
    setCreationMethod("blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-popover-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Create New {templateType === "resume" ? "Resume" : "Cover Letter"} Template
          </DialogTitle>
          <DialogDescription>
            Set up a new template that you can customize for different job applications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name" className="text-popover-foreground">
              Template Name
            </Label>
            <Input
              id="template-name"
              placeholder={`e.g., ${templateType === "resume" ? "Software Engineer Resume" : "Tech Company Cover Letter"}`}
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description" className="text-popover-foreground">
              Description
            </Label>
            <Textarea
              id="template-description"
              placeholder="Brief description of when to use this template..."
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              className="bg-input border-border min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-popover-foreground">Creation Method</Label>
            <Select
              value={creationMethod}
              onValueChange={(value: "blank" | "upload" | "existing") => setCreationMethod(value)}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Start with blank template</SelectItem>
                <SelectItem value="upload">Upload existing document</SelectItem>
                <SelectItem value="existing">Copy from existing template</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {creationMethod === "upload" && (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Upload a Word document or Google Doc</p>
              <Button variant="outline" size="sm">
                Choose File
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!templateName.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Create Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
