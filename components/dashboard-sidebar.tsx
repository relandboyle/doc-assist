"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Settings, Wrench, CheckSquare, ChevronsLeft, ChevronsRight } from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/templates", label: "Manage Templates", icon: Settings },
  { href: "/dashboard/builder", label: "Document Builder", icon: Wrench },
  { href: "/dashboard/history", label: "Document History", icon: CheckSquare },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<boolean>(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard.sidebar.collapsed")
      if (raw) setCollapsed(raw === "1")
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("dashboard.sidebar.collapsed", collapsed ? "1" : "0")
    } catch {}
  }, [collapsed])

  const widthClass = collapsed ? "w-14" : "w-56"

  return (
    <aside className={`border-r border-border bg-card/50 ${widthClass} transition-[width] duration-300 ease-in-out shrink-0 relative`}>
      <div className="flex items-center justify-between p-2">
        {!collapsed && <div className="text-sm font-medium text-muted-foreground px-1">Navigation</div>}
        <Button variant="ghost" size="icon" aria-label="Toggle sidebar" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="px-1 py-2 space-y-1">
        <TooltipProvider>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href)
            return (
              <Tooltip key={href} delayDuration={200}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className={`w-full flex items-center rounded-md py-2 text-sm transition-all duration-200
                    ${collapsed ? "justify-center px-0 gap-0" : "justify-start px-2 gap-2"}
                    ${active ? "bg-muted-foreground text-muted dark:bg-muted dark:text-muted-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span
                      className={`truncate overflow-hidden transition-all duration-200
                      ${collapsed ? "opacity-0 w-0 max-w-0" : "opacity-100 w-auto max-w-[12rem]"}`}
                    >
                      {label}
                    </span>
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </nav>
    </aside>
  )
}


