"use client"

import { usePathname } from "next/navigation"
import { Footer } from "./footer"

export function FooterWrapper() {
  const pathname = usePathname()

  // Don't show footer on login page
  if (pathname === "/login") {
    return null
  }

  return <Footer />
}
