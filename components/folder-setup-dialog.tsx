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
  const [selectedParentFolder, setSelectedParentFolder] = useState<{ id: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pickerActive, setPickerActive] = useState(false)
  const [switchedToExisting, setSwitchedToExisting] = useState(false)
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

    // Activate Google Picker for both methods
    setPickerActive(true)
  }

  const handleFolderSelect = (folderId: string, folderName: string) => {
    setSelectedParentFolder({ id: folderId, name: folderName })
    setPickerActive(false)

    if (setupMethod === "new") {
      // For new method, check if folder already exists before proceeding
      checkAndSetupFolders(folderId, folderName)
    } else {
      // For existing method, keep dialog open to show selected folder
      // User can then click "Setup Folders" to proceed
    }
  }

  const handlePickerCancel = () => {
    setPickerActive(false)
    setIsLoading(false)
  }

  const checkAndSetupFolders = async (parentFolderId: string, parentFolderName?: string) => {
    setIsLoading(true)
    try {
      // First, check if a folder with the same name already exists in the parent folder
      const response = await fetch(`/api/folders/check?parentId=${parentFolderId}&folderName=${encodeURIComponent(folderName)}`)

      if (response.ok) {
        const data = await response.json()

        if (data.exists) {
          // Folder already exists, treat it as existing folder selection
          toast({
            title: "Existing Folder Found",
            description: `A folder named "${folderName}" already exists in the selected location. Using the existing folder.`,
          })

          // Switch to existing folder mode and use the found folder
          setSetupMethod("existing")
          setSelectedParentFolder({ id: data.folderId, name: data.folderName })
          setSwitchedToExisting(true)
          setIsLoading(false)
          return
        }
      }

      // Folder doesn't exist, proceed with normal setup
      await setupFolders(parentFolderId, parentFolderName)
    } catch (error) {
      console.error("Error checking folders:", error)
      // If check fails, proceed with normal setup
      await setupFolders(parentFolderId, parentFolderName)
    }
  }

  const setupFolders = async (parentFolderId: string, parentFolderName?: string) => {
    try {
      const { setupFolders: storeSetupFolders } = useTemplateStore.getState()

      await storeSetupFolders(setupMethod, folderName, parentFolderId, parentFolderName)

      // Show success toast
      toast({
        title: "Folder Structure Created",
        description: "Your templates will now be saved to Google Drive.",
      })

      // Trigger a state update to reflect the new setup
      if (onSetupComplete) {
        onSetupComplete()
      }

      // Close dialog after successful setup
      onOpenChange(false)
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
               onClick={() => {
                 setSetupMethod("new")
                 setSwitchedToExisting(false)
                 setSelectedParentFolder(null)
               }}
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
               onClick={() => {
                 setSetupMethod("existing")
                 setSwitchedToExisting(false)
                 setSelectedParentFolder(null)
               }}
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
                <Button
                  variant="outline"
                  onClick={() => setPickerActive(true)}
                  className="w-full justify-start text-left"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {selectedParentFolder ? selectedParentFolder.name : "Click to select folder from Google Drive"}
                </Button>
              </div>

              {selectedParentFolder && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Selected Folder:</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Folder className="h-4 w-4" />
                    <span>{selectedParentFolder.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    We'll create "Resume Templates" and "Cover Letter Templates" subfolders inside this folder.
                  </p>
                </div>
              )}

              {!selectedParentFolder && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Select an existing folder from your Google Drive. We'll create "Resume Templates" and "Cover Letter Templates" subfolders inside it.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Show info when switched from new to existing mode */}
          {setupMethod === "existing" && selectedParentFolder && switchedToExisting && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Using Existing Folder
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    A folder with the same name was found. We'll use the existing folder instead of creating a new one.
                  </p>
                </div>
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
              onClick={setupMethod === "existing" && selectedParentFolder ?
                () => setupFolders(selectedParentFolder.id, selectedParentFolder.name) :
                handleSetup
              }
              disabled={
                setupMethod === "new" ? !folderName.trim() || isLoading :
                setupMethod === "existing" ? !selectedParentFolder || isLoading :
                false
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              {isLoading ? "Setting up folders..." :
               setupMethod === "new" ? "Select Parent Folder" :
               setupMethod === "existing" ? (selectedParentFolder ? "Setup Folders" : "Select Folder") :
               "Setup Folders"
              }
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
