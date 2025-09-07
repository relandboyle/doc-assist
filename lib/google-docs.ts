import { getDocsClient } from "./google-api"
import { GoogleDriveService } from "./google-drive"

export interface DocumentTemplate {
  id: string
  name: string
  description?: string
  type: "resume" | "coverLetter"
  folderId: string
  createdTime?: string
  modifiedTime?: string
}

export interface TemplateVariable {
  placeholder: string
  description: string
  required: boolean
}

export class GoogleDocsService {
  private static async getDocs() {
    return await getDocsClient()
  }

  // Create a new blank document
  static async createDocument(title: string, folderId?: string): Promise<string> {
    const docs = await this.getDocs()

    const response = await docs.documents.create({
      requestBody: {
        title,
      },
    })

    const documentId = response.data.documentId!

    // Move to specified folder if provided
    if (folderId) {
      const drive = await GoogleDriveService.getDrive()
      await drive.files.update({
        fileId: documentId,
        addParents: folderId,
        fields: "id, parents",
      })
    }

    return documentId
  }

  // Get document content
  static async getDocument(documentId: string) {
    const docs = await this.getDocs()

    const response = await docs.documents.get({
      documentId,
    })

    return response.data
  }

  // Create a template with placeholder variables
  static async createTemplate(
    name: string,
    type: "resume" | "coverLetter",
    folderId: string,
    content?: string,
  ): Promise<DocumentTemplate> {
    try {
      // Create the document
      const documentId = await this.createDocument(name, folderId)

      // Add initial content if provided
      if (content) {
        await this.updateDocumentContent(documentId, content)
      } else {
        // Add default template content with placeholders
        const defaultContent = this.getDefaultTemplateContent(type)
        await this.updateDocumentContent(documentId, defaultContent)
      }

      // Get file metadata
      const drive = await GoogleDriveService.getDrive()
      const fileResponse = await drive.files.get({
        fileId: documentId,
        fields: "createdTime, modifiedTime",
      })

      return {
        id: documentId,
        name,
        type,
        folderId,
        createdTime: fileResponse.data.createdTime || undefined,
        modifiedTime: fileResponse.data.modifiedTime || undefined,
      }
    } catch (error) {
      console.error("Error creating template:", error)
      throw error
    }
  }

  // Update document content
  static async updateDocumentContent(documentId: string, content: string): Promise<void> {
    const docs = await this.getDocs()

    // First, get the current document to know its length
    const doc = await docs.documents.get({ documentId })
    const endIndex = doc.data.body?.content?.[doc.data.body.content.length - 1]?.endIndex || 1

    // Build requests: only delete existing content if there's something to delete
    const requests: any[] = []
    // Only delete when the computed range is non-empty.
    // For brand-new docs, endIndex is often 1 or 2. Deleting 1..1 is invalid (empty range).
    const deleteStart = 1
    const deleteEnd = Math.max(1, (endIndex || 1) - 1)
    if (deleteEnd > deleteStart) {
      requests.push({
        deleteContentRange: {
          range: {
            startIndex: deleteStart,
            endIndex: deleteEnd,
          },
        },
      })
    }
    requests.push({
      insertText: {
        location: { index: 1 },
        text: content,
      },
    })

    await docs.documents.batchUpdate({ documentId, requestBody: { requests } })
  }

  // Generate document from template with variable substitution (preserves formatting)
  static async generateFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    newName: string,
    targetFolderId?: string,
  ): Promise<string> {
    try {
      // Detect if source is a Google Doc or an Office docx and copy/convert accordingly
      const drive = await GoogleDriveService.getDrive()
      const srcMeta = await drive.files.get({ fileId: templateId, fields: "id, name, mimeType" })
      const isGoogleDoc = srcMeta.data.mimeType === "application/vnd.google-apps.document"

      // If .docx, convert to Google Doc via copy with target mimeType; else regular copy
      const copiedFile = isGoogleDoc
        ? await GoogleDriveService.copyFile(templateId, newName, targetFolderId)
        : await GoogleDriveService.convertDocxToGoogleDoc(templateId, newName, targetFolderId)

      // Build replaceAllText requests for both {{KEY}} and [KEY] placeholder styles
      const requests: any[] = []
      for (const [rawKey, value] of Object.entries(variables)) {
        const key = String(rawKey)
        const replacements = [`{{${key}}}`, `[${key}]`]
        for (const findText of replacements) {
          requests.push({
            replaceAllText: {
              containsText: {
                text: findText,
                matchCase: false,
              },
              replaceText: value ?? "",
            },
          })
        }
      }

      if (requests.length > 0) {
        const docs = await this.getDocs()
        await docs.documents.batchUpdate({
          documentId: copiedFile.id,
          requestBody: { requests },
        })
      }

      return copiedFile.id
    } catch (error) {
      console.error("Error generating document from template:", error)
      throw error
    }
  }

  // Extract text content from document (body, tables, headers, footers)
  private static extractTextFromDocument(doc: any): string {
    let collectedText: string[] = []

    const pushText = (t?: string) => {
      if (t) collectedText.push(t)
    }

    const traverseElements = (elements: any[]) => {
      if (!Array.isArray(elements)) return
      for (const element of elements) {
        // Paragraphs
        if (element.paragraph?.elements) {
          for (const pe of element.paragraph.elements) {
            if (pe.textRun?.content) {
              pushText(pe.textRun.content)
            }
          }
        }

        // Tables
        if (element.table?.tableRows) {
          for (const row of element.table.tableRows) {
            for (const cell of row.tableCells || []) {
              if (Array.isArray(cell.content)) {
                traverseElements(cell.content)
              }
            }
          }
        }

        // Table of contents
        if (element.tableOfContents?.content) {
          traverseElements(element.tableOfContents.content)
        }
      }
    }

    // Body
    if (doc.body?.content) {
      traverseElements(doc.body.content)
    }

    // Headers
    if (doc.headers) {
      for (const key of Object.keys(doc.headers)) {
        const header = doc.headers[key]
        if (header?.content) traverseElements(header.content)
      }
    }

    // Footers
    if (doc.footers) {
      for (const key of Object.keys(doc.footers)) {
        const footer = doc.footers[key]
        if (footer?.content) traverseElements(footer.content)
      }
    }

    return collectedText.join("")
  }

  // Get default template content based on type
  private static getDefaultTemplateContent(type: "resume" | "coverLetter"): string {
    if (type === "resume") {
      return `{{FULL_NAME}}
{{EMAIL}} | {{PHONE}} | {{LOCATION}}
{{LINKEDIN_URL}}

PROFESSIONAL SUMMARY
{{PROFESSIONAL_SUMMARY}}

EXPERIENCE
{{COMPANY_NAME}} - {{JOB_TITLE}}
{{START_DATE}} - {{END_DATE}}
{{JOB_DESCRIPTION}}

EDUCATION
{{DEGREE}} in {{FIELD_OF_STUDY}}
{{UNIVERSITY_NAME}}, {{GRADUATION_YEAR}}

SKILLS
{{TECHNICAL_SKILLS}}

PROJECTS
{{PROJECT_NAME}}
{{PROJECT_DESCRIPTION}}
`
    } else {
      return `{{DATE}}

{{HIRING_MANAGER_NAME}}
{{COMPANY_NAME}}
{{COMPANY_ADDRESS}}

Dear {{HIRING_MANAGER_NAME}},

{{OPENING_PARAGRAPH}}

{{BODY_PARAGRAPH_1}}

{{BODY_PARAGRAPH_2}}

{{CLOSING_PARAGRAPH}}

Sincerely,
{{YOUR_NAME}}
`
    }
  }

  // Extract template variables from document
  static async getTemplateVariables(documentId: string): Promise<TemplateVariable[]> {
    const doc = await this.getDocument(documentId)
    const content = this.extractTextFromDocument(doc)

    // Find placeholders in either {{KEY}} or [KEY] formats
    const curlyRegex = /\{\{([^}]+)\}\}/g
    const bracketRegex = /\[([^\]]+)\]/g
    const placeholders = new Set<string>()

    let match
    while ((match = curlyRegex.exec(content)) !== null) {
      placeholders.add(match[1].trim())
    }
    while ((match = bracketRegex.exec(content)) !== null) {
      placeholders.add(match[1].trim())
    }

    // Convert to template variables with descriptions
    return Array.from(placeholders).map((placeholder) => ({
      placeholder,
      description: this.getVariableDescription(placeholder),
      required: true,
    }))
  }

  // Debug/helper: return the plain text extracted from the Google Doc
  static async getDocumentText(documentId: string): Promise<string> {
    const doc = await this.getDocument(documentId)
    return this.extractTextFromDocument(doc)
  }

  // Get human-readable description for variables
  private static getVariableDescription(variable: string): string {
    const descriptions: Record<string, string> = {
      FULL_NAME: "Your full name",
      EMAIL: "Your email address",
      PHONE: "Your phone number",
      LOCATION: "Your city and state",
      LINKEDIN_URL: "Your LinkedIn profile URL",
      PROFESSIONAL_SUMMARY: "Brief professional summary",
      COMPANY_NAME: "Target company name",
      JOB_TITLE: "Job title you are applying for",
      START_DATE: "Employment start date",
      END_DATE: "Employment end date",
      JOB_DESCRIPTION: "Job responsibilities and achievements",
      DEGREE: "Your degree type",
      FIELD_OF_STUDY: "Your field of study",
      UNIVERSITY_NAME: "University name",
      GRADUATION_YEAR: "Year of graduation",
      TECHNICAL_SKILLS: "List of technical skills",
      PROJECT_NAME: "Project name",
      PROJECT_DESCRIPTION: "Project description",
      DATE: "Current date",
      HIRING_MANAGER_NAME: "Hiring manager name",
      COMPANY_ADDRESS: "Company address",
      OPENING_PARAGRAPH: "Opening paragraph of cover letter",
      BODY_PARAGRAPH_1: "First body paragraph",
      BODY_PARAGRAPH_2: "Second body paragraph",
      CLOSING_PARAGRAPH: "Closing paragraph",
      YOUR_NAME: "Your name for signature",
    }

    return descriptions[variable] || `Value for ${variable.toLowerCase().replace(/_/g, " ")}`
  }
}
