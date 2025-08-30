import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req: any) => {
  const isLoggedIn = !!req.auth
  if (!isLoggedIn && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  return null
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
