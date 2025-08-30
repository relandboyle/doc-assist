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
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen, Plus, ExternalLink } from "lucide-react"

interface FolderSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FolderSetupDialog({ open, onOpenChange }: FolderSetupDialogProps) {
  const [setupMethod, setSetupMethod] = useState<"new" | "existing">("new")
  const [folderName, setFolderName] = useState("DocuTemplate Pro Templates")
  const [existingFolderId, setExistingFolderId] = useState("")

  const handleSetup = () => {
    // TODO: Implement folder setup logic with Google Drive API
    console.log("Setting up folders:", {
      method: setupMethod,
      folderName: setupMethod === "new" ? folderName : undefined,
      existingFolderId: setupMethod === "existing" ? existingFolderId : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-popover-foreground">
            <FolderOpen className="h-5 w-5 text-primary" />
            Google Drive Folder Setup
          </DialogTitle>
          <DialogDescription>Configure where your templates will be stored in Google Drive.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={`cursor-pointer border-2 transition-colors ${
                setupMethod === "new" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSetupMethod("new")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Folder
                </CardTitle>
                <CardDescription className="text-sm">
                  Create a new folder structure in your Google Drive
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className={`cursor-pointer border-2 transition-colors ${
                setupMethod === "existing" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSetupMethod("existing")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Use Existing Folder
                </CardTitle>
                <CardDescription className="text-sm">Select an existing folder from your Google Drive</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {setupMethod === "new" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name" className="text-popover-foreground">
                  Main Folder Name
                </Label>
                <Input
                  id="folder-name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Folder Structure Preview:</h4>
                <div className="text-sm text-muted-foreground space-y-1 ml-4">
                  <div>📁 {folderName}</div>
                  <div className="ml-4">📁 Resume Templates</div>
                  <div className="ml-4">📁 Cover Letter Templates</div>
                </div>
              </div>
            </div>
          )}

          {setupMethod === "existing" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-popover-foreground">Select Existing Folder</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste Google Drive folder URL or ID"
                    value={existingFolderId}
                    onChange={(e) => setExistingFolderId(e.target.value)}
                    className="bg-input border-border"
                  />
                  <Button variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  We'll create "Resume Templates" and "Cover Letter Templates" subfolders inside your selected folder.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSetup}
            disabled={setupMethod === "new" ? !folderName.trim() : !existingFolderId.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Setup Folders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
