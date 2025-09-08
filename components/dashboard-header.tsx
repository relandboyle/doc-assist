"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User, IdCard } from "lucide-react"
import dynamic from "next/dynamic"
const ApplicantInfoDialog = dynamic(() => import("./applicant-info-dialog"), { ssr: false })
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "./theme-toggle"

export function DashboardHeader() {
  const { data: session, status } = useSession()
  const [isApplicantDialogOpen, setIsApplicantDialogOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Don't render the user menu if session is loading or not authenticated
  if (status === "loading" || !session) {
    return (
      <header className="sticky top-0 z-50 w-full border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/icon.png" alt="Doc Tailor" width={42} height={42} className="rounded-md border border-border bg-background" />
            <span className="font-semibold">Doc Tailor</span>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="link" asChild>
              <Link href="/guide">Guide</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image src="/icon.png" alt="Doc Tailor" width={42} height={42} className="rounded-md border border-border bg-background" />
          <span className="font-semibold">Doc Tailor</span>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="link" asChild>
            <Link href="/guide">Guide</Link>
          </Button>
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                  <AvatarFallback>
                    {session?.user?.name ? getUserInitials(session.user.name) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsApplicantDialogOpen(true)}>
                <IdCard className="mr-2 h-4 w-4" />
                <span>Applicant info…</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ApplicantInfoDialog open={!!isApplicantDialogOpen} onOpenChange={setIsApplicantDialogOpen} />
        </div>
      </div>
    </header>
  )
}
