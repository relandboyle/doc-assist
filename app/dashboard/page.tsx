import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { TemplateDashboard } from "@/components/template-dashboard"
import { QuickGenerate } from "@/components/quick-generate"
import { DocumentHistory } from "@/components/document-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-br from-muted to-background">
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="generate" className="data-[state=active]:bg-background">
              Generate Documents
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-background">
              Manage Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-background">
              Document History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <QuickGenerate />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateDashboard />
          </TabsContent>

          <TabsContent value="history">
            <DocumentHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
