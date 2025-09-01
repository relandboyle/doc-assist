import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { TemplateDashboard } from "@/components/template-dashboard"
import { QuickGenerate } from "@/components/quick-generate"
import { DocumentHistory } from "@/components/document-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, CheckSquare, Hammer, Wrench } from "lucide-react"
import { DocumentBuilder } from "@/components/document-builder"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-br from-background to-muted">
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="sticky top-14 z-40 mx-auto w-full max-w-2xl px-0 pb-0 flex gap-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsTrigger
              value="templates"
              className="rounded-t-md rounded-b-none px-4 py-1.5 text-sm font-medium text-muted-foreground border border-border transition -mb-px
                         hover:bg-background/60 hover:text-foreground
                         data-[state=active]:bg-muted-foreground data-[state=active]:text-muted dark:data-[state=active]:bg-muted dark:data-[state=active]:text-muted-foreground data-[state=active]:border-b-transparent"
            >
              <span className="inline-flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manage Templates
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="builder"
              className="rounded-t-md rounded-b-none px-4 py-1.5 text-sm font-medium text-muted-foreground border border-border transition -mb-px
                         hover:bg-background/60 hover:text-foreground
                         data-[state=active]:bg-muted-foreground data-[state=active]:text-muted dark:data-[state=active]:bg-muted dark:data-[state=active]:text-muted-foreground data-[state=active]:border-b-transparent"
            >
              <span className="inline-flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Document Builder
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-t-md rounded-b-none px-4 py-1.5 text-sm font-medium text-muted-foreground border border-border transition -mb-px
                         hover:bg-background/60 hover:text-foreground
                         data-[state=active]:bg-muted-foreground data-[state=active]:text-muted dark:data-[state=active]:bg-muted dark:data-[state=active]:text-muted-foreground data-[state=active]:border-b-transparent"
            >
              <span className="inline-flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Document History
              </span>
            </TabsTrigger>
            {false && (
              <TabsTrigger
                value="generate"
                className="rounded-t-md rounded-b-none px-4 py-1.5 text-sm font-medium text-muted-foreground border border-border transition -mb-px
                           hover:bg-background/60 hover:text-foreground
                           data-[state=active]:bg-muted-foreground data-[state=active]:text-muted dark:data-[state=active]:bg-muted dark:data-[state=active]:text-muted-foreground data-[state=active]:border-b-transparent"
              >
                <span className="inline-flex items-center gap-2">
                  <Hammer className="h-4 w-4" />
                  Generate Documents
                </span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="templates">
            <TemplateDashboard />
          </TabsContent>

          <TabsContent value="builder">
            <DocumentBuilder />
          </TabsContent>

          <TabsContent value="history">
            <DocumentHistory />
          </TabsContent>

          {false && (
            <TabsContent value="generate">
              <QuickGenerate />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
