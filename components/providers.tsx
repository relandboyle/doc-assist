"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

function TokenStatusWatcher() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  useEffect(() => {
    if (status === "authenticated" && (session as any)?.error) {
      toast({
        title: "Session Expired",
        description: "Please sign in again to continue using Google Drive features.",
        variant: "destructive",
      })
    }
  }, [status, session, toast])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={300}
      refetchOnWindowFocus={true}
    >
      {children}
      <TokenStatusWatcher />
      <Toaster />
    </SessionProvider>
  )
}
