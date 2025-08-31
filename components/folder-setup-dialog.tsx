"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"

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
import { FolderOpen, Plus, ExternalLink, Folder } from "lucide-react"
import { GooglePickerWrapper } from "@/components/google-picker-wrapper"
import { useToast } from "@/hooks/use-toast"
import { useTemplateStore } from "@/lib/template-store"

interface FolderSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSetupComplete?: () => void
}

export function FolderSetupDialog({ open, onOpenChange, onSetupComplete }: FolderSetupDialogProps) {
  const { data: session, status } = useSession()
  const [setupMethod, setSetupMethod] = useState<"new" | "existing">("new")
  const [folderName, setFolderName] = useState("DocTailor Templates")
  const [existingFolderId, setExistingFolderId] = useState("")
  const [selectedParentFolder, setSelectedParentFolder] = useState<{ id: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pickerActive, setPickerActive] = useState(false)
  const { toast } = useToast()

  // Close dialog if user is not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && open) {
      onOpenChange(false)
      toast({
        title: "Authentication Required",
        description: "Please sign in to set up folders.",
        variant: "destructive",
      })
    }
  }, [status, open, onOpenChange, toast])

  const handleSetup = () => {
    if (status !== "authenticated") {
      toast({
        title: "Authentication Required",
        description: "Please sign in to set up folders.",
        variant: "destructive",
      })
      return
    }

    if (setupMethod === "new") {
      // Activate Google Picker to select parent folder
      setPickerActive(true)
    } else {
      // Use existing folder ID directly
      setupFolders(existingFolderId)
    }
  }

  const handleFolderSelect = (folderId: string, folderName: string) => {
    setSelectedParentFolder({ id: folderId, name: folderName })
    setPickerActive(false)
    // Close the dialog immediately after folder selection
    onOpenChange(false)
    setIsLoading(true) // Show loading state while setting up folders
    // Automatically setup folders after selection
    setupFolders(folderId)
  }

  const handlePickerCancel = () => {
    setPickerActive(false)
    setIsLoading(false)
  }

  const setupFolders = async (parentFolderId: string) => {
    try {
      const response = await fetch("/api/folders/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: setupMethod,
          folderName: setupMethod === "new" ? folderName : undefined,
          existingFolderId: parentFolderId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Folders setup successfully:", data)

        // Show success toast
        toast({
          title: "Folder Structure Created",
          description: "Your templates will now be saved to Google Drive.",
        })

        // Trigger a state update to reflect the new setup
        if (onSetupComplete) {
          onSetupComplete()
        }

        // Also initialize from storage to ensure the UI updates
        const { initializeFromStorage } = useTemplateStore.getState()
        initializeFromStorage()
      } else {
        console.error("Failed to setup folders")
        toast({
          title: "Setup Failed",
          description: "Failed to create folder structure. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error setting up folders:", error)
      toast({
        title: "Setup Error",
        description: "An error occurred while setting up folders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <>
      <Dialog open={open && !pickerActive} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
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

              {selectedParentFolder && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Selected Parent Folder:</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Folder className="h-4 w-4" />
                    <span>{selectedParentFolder.name}</span>
                  </div>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Folder Structure Preview:</h4>
                <div className="text-sm text-muted-foreground space-y-1 ml-4">
                  <div>📁 {selectedParentFolder?.name || "Selected Folder"}</div>
                  <div className="ml-4">📁 {folderName}</div>
                  <div className="ml-8">📁 Resume Templates</div>
                  <div className="ml-8">📁 Cover Letter Templates</div>
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
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetup}
              disabled={setupMethod === "new" ? !folderName.trim() || isLoading : !existingFolderId.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              {isLoading ? "Setting up folders..." : setupMethod === "new" ? "Select Parent Folder" : "Setup Folders"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GooglePickerWrapper
        isActive={pickerActive}
        onFolderSelect={handleFolderSelect}
        onCancel={handlePickerCancel}
      />
    </>
  )
}
