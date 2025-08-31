import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { google } from "googleapis"

export async function GET() {
  try {
    console.log("Session API called")
    const session = await auth()

    console.log("Session result:", {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      userEmail: session?.user?.email
    })

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    // If we have a refresh token, try to refresh the access token
    if (session.refreshToken) {
      try {
        console.log("Attempting to refresh access token...")
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.NEXTAUTH_URL + "/api/auth/callback/google"
        )

        oauth2Client.setCredentials({
          access_token: session.accessToken,
          refresh_token: session.refreshToken,
        })

        const { credentials } = await oauth2Client.refreshAccessToken()
        console.log("Token refreshed successfully")

        return NextResponse.json({
          authenticated: true,
          accessToken: credentials.access_token,
          user: session.user
        })
      } catch (error) {
        console.log("Token refresh failed, using existing token:", error instanceof Error ? error.message : String(error))
        // Fall back to existing token
      }
    }

    return NextResponse.json({
      authenticated: true,
      accessToken: session.accessToken,
      user: session.user
    })
  } catch (error) {
    console.error("Session API error:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}
