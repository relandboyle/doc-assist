import { google } from "googleapis"
import { auth } from "@/auth"

export async function getGoogleApiClient() {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error("No access token available")
  }

  console.log("Server-side Google API client:")
  console.log("- Session found:", !!session)
  console.log("- Access token length:", session.accessToken.length)
  console.log("- Refresh token:", !!session.refreshToken)

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + "/api/auth/callback/google"
  )

  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  })

  // Try to refresh the token if we have a refresh token
  if (session.refreshToken) {
    try {
      console.log("Attempting to refresh access token...")
      const { credentials } = await oauth2Client.refreshAccessToken()
      console.log("Token refreshed successfully")
      oauth2Client.setCredentials(credentials)
    } catch (error) {
      console.log("Token refresh failed, using existing token:", error instanceof Error ? error.message : String(error))
    }
  } else {
    console.log("No refresh token available, using existing access token")
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
