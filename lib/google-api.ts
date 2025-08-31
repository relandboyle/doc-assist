import { google } from "googleapis"
import { auth } from "@/auth"

export async function getGoogleApiClient() {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error("No access token available")
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    access_token: session.accessToken,
  })

  // Set the API key for additional quota and public data access
  if (process.env.GOOGLE_API_KEY) {
    oauth2Client.apiKey = process.env.GOOGLE_API_KEY
  }

  return oauth2Client
}

export async function getDriveClient() {
  const authClient = await getGoogleApiClient()
  return google.drive({ version: "v3", auth: authClient })
}

export async function getDocsClient() {
  const authClient = await getGoogleApiClient()
  return google.docs({ version: "v1", auth: authClient })
}
