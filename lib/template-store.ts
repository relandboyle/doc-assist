"use client"

import { create } from "zustand"
import type { DocumentTemplate } from "./google-docs"

interface TemplateStore {
  templates: DocumentTemplate[]
  folders: {
    resumeFolderId?: string
    coverLetterFolderId?: string
    mainFolderId?: string
    mainFolderName?: string
    resumeFolderName?: string
    coverLetterFolderName?: string
  }
  isLoading: boolean
  error: string | null

  // Actions
  setTemplates: (templates: DocumentTemplate[]) => void
  addTemplate: (template: DocumentTemplate) => void
  removeTemplate: (templateId: string) => void
  setFolders: (folders: {
    resumeFolderId?: string;
    coverLetterFolderId?: string;
    mainFolderId?: string;
    mainFolderName?: string;
    resumeFolderName?: string;
    coverLetterFolderName?: string;
  }) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // API calls
  fetchTemplates: (folderId: string, type: "resume" | "coverLetter") => Promise<void>
  createTemplate: (name: string, description: string, type: "resume" | "coverLetter", folderId: string) => Promise<void>
  deleteTemplate: (templateId: string) => Promise<void>
  setupFolders: (method: "new" | "existing", folderName?: string, existingFolderId?: string) => Promise<void>
  fetchFolders: () => Promise<void>
  initializeFromStorage: () => void
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  folders: {},
  isLoading: false,
  error: null,

  setTemplates: (templates) => set({ templates }),
  addTemplate: (template) => set((state) => ({ templates: [...state.templates, template] })),
  removeTemplate: (templateId) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== templateId),
    })),
  setFolders: (folders) => {
    set({ folders })
    if (typeof window !== 'undefined') {
      localStorage.setItem('doc-assist-folders', JSON.stringify(folders))
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchTemplates: async (folderId, type) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/templates?folderId=${folderId}&type=${type}`)
      if (!response.ok) throw new Error("Failed to fetch templates")

      const data = await response.json()
      set({ templates: data.templates, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createTemplate: async (name, description, type, folderId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, type, folderId }),
      })

      if (!response.ok) throw new Error("Failed to create template")

      const data = await response.json()
      get().addTemplate(data.template)
      set({ isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  deleteTemplate: async (templateId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete template")

      get().removeTemplate(templateId)
      set({ isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  setupFolders: async (method, folderName, existingFolderId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch("/api/folders/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, folderName, existingFolderId }),
      })

      if (!response.ok) throw new Error("Failed to setup folders")

      const data = await response.json()
      const folderData = {
        mainFolderId: data.folders.mainFolder.id,
        mainFolderName: data.folders.mainFolder.name,
        resumeFolderId: data.folders.resumeFolder.id,
        resumeFolderName: data.folders.resumeFolder.name,
        coverLetterFolderId: data.folders.coverLetterFolder.id,
        coverLetterFolderName: data.folders.coverLetterFolder.name,
      }
      get().setFolders(folderData)
      set({ isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchFolders: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch("/api/folders/list")
      if (!response.ok) throw new Error("Failed to fetch folders")

      const data = await response.json()
      if (data.folders.mainFolder) {
        const folderData = {
          mainFolderId: data.folders.mainFolder.id,
          mainFolderName: data.folders.mainFolder.name,
          resumeFolderId: data.folders.resumeFolder.id,
          resumeFolderName: data.folders.resumeFolder.name,
          coverLetterFolderId: data.folders.coverLetterFolder.id,
          coverLetterFolderName: data.folders.coverLetterFolder.name,
        }
        get().setFolders(folderData)
      }
      set({ isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  initializeFromStorage: () => {
    // Only access localStorage if we're in the browser and not on the login page
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      try {
        const stored = localStorage.getItem('doc-assist-folders')
        if (stored) {
          const folderData = JSON.parse(stored)
          set({ folders: folderData })
        }
      } catch (error) {
        console.error('Error parsing stored folders:', error)
        localStorage.removeItem('doc-assist-folders')
      }
    }
  },
}))
