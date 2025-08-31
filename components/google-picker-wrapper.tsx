"use client"

import { useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"

interface GooglePickerWrapperProps {
  onFolderSelect: (folderId: string, folderName: string) => void
  onCancel: () => void
  isActive: boolean
}

declare global {
  interface Window {
    gapi: any
    google: any
  }
}

export function GooglePickerWrapper({ onFolderSelect, onCancel, isActive }: GooglePickerWrapperProps) {
  const accessTokenRef = useRef<string | null>(null)
  const pickerInitedRef = useRef(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isActive) {
      initializeGooglePicker()
    }
  }, [isActive])

  const initializeGooglePicker = async () => {
    try {
      await loadGoogleAPI()
      await createPicker()
    } catch (err) {
      console.error("Error initializing Google Picker:", err)
      handleError(err)
    }
  }

  const loadGoogleAPI = () => {
    return new Promise<void>((resolve, reject) => {
      const script1 = document.createElement("script")
      script1.src = "https://apis.google.com/js/api.js"
      script1.onload = () => {
        window.gapi.load('picker', onPickerApiLoad)
        resolve()
      }
      script1.onerror = reject
      document.head.appendChild(script1)
    })
  }

  const onPickerApiLoad = () => {
    pickerInitedRef.current = true
  }

  const createPicker = async () => {
    try {
      console.log("Fetching session...")
      const response = await fetch('/api/auth/session')

      if (!response.ok) {
        console.error("Session API error:", response.status, response.statusText)
        if (response.status === 401) {
          throw new Error("Authentication required. Please sign in again.")
        } else if (response.status === 403) {
          throw new Error("Access denied. Your session may have expired.")
        } else {
          throw new Error(`Session API error: ${response.status}`)
        }
      }

      const session = await response.json()
      console.log("Session response:", { hasAccessToken: !!session.accessToken, user: session.user?.email })

      if (!session.accessToken) {
        throw new Error("No access token available. Please sign in again.")
      }

      accessTokenRef.current = session.accessToken

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
      if (!apiKey) {
        throw new Error("Google API key not configured")
      }

      console.log("Creating picker with token and API key...")
      const picker = new window.google.picker.PickerBuilder()
        .addView(new window.google.picker.DocsView()
          .setIncludeFolders(true)
          .setSelectFolderEnabled(true)
          .setMimeTypes("application/vnd.google-apps.folder"))
        .setOAuthToken(accessTokenRef.current!)
        .setDeveloperKey(apiKey)
        .setCallback(pickerCallback)
        .build()

      picker.setVisible(true)
    } catch (error) {
      console.error("Error creating picker:", error)
      handleError(error)
    }
  }

  const handleError = (error: any) => {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

    toast({
      title: "Google Picker Error",
      description: errorMessage,
      variant: "destructive",
    })

    onCancel()
  }

  const pickerCallback = (data: any) => {
    if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
      const doc = data[window.google.picker.Response.DOCUMENTS][0]
      const folderId = doc[window.google.picker.Document.ID]
      const folderName = doc[window.google.picker.Document.NAME]
      onFolderSelect(folderId, folderName)
    } else if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.CANCEL) {
      onCancel()
    }
  }

  // This component doesn't render anything visible
  return null
}
