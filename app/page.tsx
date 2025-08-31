import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Zap, Shield, Download } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function HomePage() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col flex-1 content-center items-center w-full bg-gradient-to-br from-background to-muted">
      <header className="sticky top-0 z-50 border-b w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-semibold">Doc Tailor</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Professional Document Templates Made Simple
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty">
            Create, manage, and generate customized resumes and cover letters with Google Docs integration. Perfect for
            job seekers who want professional results fast.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-accent" />
                    <CardTitle>Quick Generation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Fill in company details and generate customized documents in seconds
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-accent" />
                    <CardTitle>Google Integration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Seamlessly sync with Google Docs and Drive for secure template storage
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Download className="h-5 w-5 text-accent" />
                    <CardTitle>PDF Export</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Export your generated documents as professional PDFs ready to send</CardDescription>
                </CardContent>
              </Card>
            </div>
          </dl>
        </div>
      </main>
    </div>
  )
}
