import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token ?? token.refreshToken
        // Handle both expires_at (seconds timestamp) and expires_in (seconds)
        const expiresAtSec = (account as any).expires_at as number | undefined
        const expiresInSec = (account as any).expires_in as number | undefined
        const computedExpiryMs = expiresAtSec
          ? expiresAtSec * 1000
          : expiresInSec
            ? Date.now() + expiresInSec * 1000
            : Date.now() + 3600 * 1000
        // Add small skew (60s) to refresh slightly before expiry
        token.accessTokenExpires = computedExpiryMs - 60 * 1000
        return token
      }

      // If we have a valid access token, return it
      if (token.accessToken && token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Try to refresh using the refresh token
      if (token.refreshToken) {
        try {
          const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID as string,
            client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          })
          const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
          })

          if (!res.ok) {
            throw new Error(`Failed to refresh token: ${res.status}`)
          }

          const refreshed = await res.json()
          token.accessToken = refreshed.access_token
          token.accessTokenExpires = Date.now() + ((refreshed.expires_in ?? 3600) * 1000) - 60 * 1000
          // Some providers return a new refresh_token
          if (refreshed.refresh_token) {
            token.refreshToken = refreshed.refresh_token
          }
          token.error = undefined
          return token
        } catch (e) {
          token.error = "RefreshAccessTokenError"
          return token
        }
      }

      // No refresh token available
      token.error = "NoRefreshToken"
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      // @ts-expect-error extend session for client error handling
      session.error = (token as any).error
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
