import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { Sidebar } from "./Sidebar"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar />
      <SidebarInset className="min-h-svh overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium">Berry Studio</span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
