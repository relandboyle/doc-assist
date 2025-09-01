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

  // Prefer a per-request refresh using the refresh_token to avoid stale tokens
  if (session.refreshToken) {
    try {
      console.log("Refreshing access token via OAuth endpoint...")
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        grant_type: "refresh_token",
        refresh_token: session.refreshToken as string,
      })
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      })
      if (res.ok) {
        const refreshed = await res.json()
        oauth2Client.setCredentials({
          access_token: refreshed.access_token,
          refresh_token: session.refreshToken,
        })
        console.log("Access token refreshed for this request")
      } else {
        console.warn("Refresh endpoint returned status", res.status, "- falling back to existing token")
        oauth2Client.setCredentials({
          access_token: session.accessToken,
          refresh_token: session.refreshToken,
        })
      }
    } catch (err) {
      console.warn("Refresh via OAuth endpoint failed - using existing token")
      oauth2Client.setCredentials({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
      })
    }
  } else {
    // No refresh token – proceed with the current access token
    oauth2Client.setCredentials({
      access_token: session.accessToken,
    })
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
