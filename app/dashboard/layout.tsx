import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { FooterWrapper } from "@/components/footer-wrapper"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-background to-muted">
      <DashboardHeader />
      <div className="flex flex-1 gap-4">
        <DashboardSidebar />
        <div className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </div>
      </div>
      <FooterWrapper />
    </div>
  )
}


