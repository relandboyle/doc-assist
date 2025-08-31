"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { useTemplateStore } from "@/lib/template-store"
import { Loader2 } from "lucide-react"

interface FolderStatusProps {
  onManageFolders: () => void
}

export function FolderStatus({ onManageFolders }: FolderStatusProps) {
  const { data: session, status } = useSession()
  const { folders, isLoading } = useTemplateStore()

  // Don't render anything if session is loading or not authenticated
  if (status === "loading") {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-3">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === "unauthenticated") {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-3">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Please sign in to view folder status.</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isSetup = folders.mainFolderId && folders.mainFolderName

  const getGoogleDriveUrl = (folderId: string) => {
    return `https://drive.google.com/drive/folders/${folderId}`
  }

  if (!isSetup) {
    return (
      <Card className="border-dashed border-2 border-border bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Google Drive Not Configured
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Set up your Google Drive folder structure to start creating templates.
            </p>
            <Button onClick={onManageFolders} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Setting up...
                </span>
              ) : (
                <>
                  <FolderOpen className="h-3 w-3 mr-1" />
                  Setup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact view when folders are configured
  return (
    <Card className="border-border bg-card py-1">
      <CardContent className="py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">Folders:</span>

            {/* Parent folder link (if exists) */}
            {folders.parentFolderId && folders.parentFolderName && (
              <>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.open(getGoogleDriveUrl(folders.parentFolderId!), "_blank")}
                  className="h-auto p-0 text-foreground hover:text-primary"
                >
                  {folders.parentFolderName}
                </Button>
                <span className="text-muted-foreground">/</span>
              </>
            )}

            {/* Main folder link */}
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open(getGoogleDriveUrl(folders.mainFolderId!), "_blank")}
              className="h-auto p-0 text-foreground hover:text-primary"
            >
              {folders.mainFolderName}
            </Button>
          </div>
          <Button onClick={onManageFolders} variant="ghost" size="sm" disabled={isLoading}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Working...
              </span>
            ) : (
              <>
                <FolderOpen className="h-3 w-3 mr-1" />
                Manage
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
