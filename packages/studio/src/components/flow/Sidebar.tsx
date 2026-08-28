import {
  BarChart3,
  Bell,
  BookOpen,
  CircleHelp,
  Home,
  KeyRound,
  Plug,
  Sparkles,
  Workflow,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { clearStudioApiKey } from "@/lib/studio-api"

const items = [
  { icon: Home, label: "Visão geral", to: "/home" },
  { icon: Workflow, label: "Fluxos", to: "/" },
  { icon: Plug, label: "Conexões", to: "/conexoes" },
  { icon: BarChart3, label: "Analytics", to: "/analytics" },
  { icon: Bell, label: "Notificações", to: "/notificacoes" },
  { icon: BookOpen, label: "Tutoriais", to: "/tutoriais" },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <ShadcnSidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Berry Studio">
              <Link to="/">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">Berry Studio</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Flow orchestration
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.to === "/"
                    ? location.pathname === "/" || location.pathname.startsWith("/flows/")
                    : location.pathname.startsWith(item.to)
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.to}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Ajuda e suporte">
              <CircleHelp />
              <span>Ajuda e suporte</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Trocar chave da API"
              onClick={() => {
                clearStudioApiKey()
                window.location.reload()
              }}
            >
              <KeyRound />
              <span>Trocar chave da API</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                B
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">Berry User</span>
                <span className="truncate text-xs text-muted-foreground">
                  Ambiente local
                </span>
              </span>
              <Badge variant="secondary">Pro</Badge>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  )
}
