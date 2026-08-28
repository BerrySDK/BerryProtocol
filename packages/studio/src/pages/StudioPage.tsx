import {
  BarChart3,
  Copy,
  Download,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  Workflow,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AppShell } from "@/components/flow/AppShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  createStudioFlow,
  deleteStudioFlow,
  duplicateStudioFlow,
  getStudioFlow,
  listStudioFlows,
  setStudioFlowStatus,
  updateStudioFlow,
  type StudioFlowMeta,
} from "@/lib/studio-api"

type StatusFilter = "all" | "published" | "draft" | "archived"

export default function StudioPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<StudioFlowMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await listStudioFlows())
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar os fluxos.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(
    () =>
      items.filter((flow) => {
        const matchesName = flow.name
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR"))
        const matchesStatus = status === "all" || flow.status === status
        return matchesName && matchesStatus
      }),
    [items, search, status],
  )

  const activeFlows = items.filter((flow) => flow.active).length
  const conversations = items.reduce(
    (total, flow) => total + flow.stats.conversas,
    0,
  )
  const leads = items.reduce((total, flow) => total + flow.stats.leads, 0)

  const create = async () => {
    if (!newName.trim()) return
    setBusy(true)
    try {
      const flow = await createStudioFlow(newName.trim())
      setCreateOpen(false)
      setNewName("")
      navigate(`/flows/${flow.id}`)
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Não foi possível criar o fluxo.",
      )
    } finally {
      setBusy(false)
    }
  }

  const rename = async (flowId: string) => {
    const name = window.prompt("Novo nome do fluxo:")
    if (!name?.trim()) return
    const flow = await getStudioFlow(flowId)
    await updateStudioFlow(flowId, {
      name: name.trim(),
      status: flow.status,
      graph: flow.graph,
    })
    await load()
  }

  const duplicate = async (flowId: string) => {
    await duplicateStudioFlow(flowId)
    await load()
  }

  const togglePublished = async (flow: StudioFlowMeta) => {
    await setStudioFlowStatus(flow.id, flow.active ? "draft" : "published")
    await load()
  }

  const remove = async (flowId: string) => {
    if (!window.confirm("Excluir este fluxo e todo o seu histórico?")) return
    await deleteStudioFlow(flowId)
    await load()
  }

  const exportFlow = async (flow: StudioFlowMeta) => {
    const fullFlow = await getStudioFlow(flow.id)
    const blob = new Blob([JSON.stringify(fullFlow, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${flow.name}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="secondary">BerryProtocol Flow Studio</Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                Automações de WhatsApp
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Modele, valide, simule e publique conversas avançadas com todos os
                métodos disponíveis na BerryAPI.
              </p>
            </div>
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Novo fluxo
            </Button>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Workflow}
              label="Fluxos"
              value={items.length}
              detail={`${activeFlows} publicados`}
            />
            <MetricCard
              icon={MessageSquare}
              label="Conversas"
              value={conversations}
              detail="Execuções registradas"
            />
            <MetricCard
              icon={Users}
              label="Leads"
              value={leads}
              detail="Aguardaram ou concluíram"
            />
            <MetricCard
              icon={BarChart3}
              label="Conversão média"
              value={
                items.length
                  ? `${Math.round(
                      items.reduce(
                        (total, flow) => total + flow.stats.conversao,
                        0,
                      ) / items.length,
                    )}%`
                  : "0%"
              }
              detail="Fluxos concluídos"
            />
          </section>

          <Card size="sm">
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Field className="flex-1">
                <FieldLabel htmlFor="flow-search" className="sr-only">
                  Buscar fluxo
                </FieldLabel>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="flow-search"
                    value={search}
                    className="pl-9"
                    placeholder="Buscar por nome…"
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel className="sr-only">Filtrar por status</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as StatusFilter)}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="published">Publicados</SelectItem>
                      <SelectItem value="draft">Rascunhos</SelectItem>
                      <SelectItem value="archived">Arquivados</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          {error ? (
            <Card size="sm" className="ring-destructive/40">
              <CardContent className="text-destructive">{error}</CardContent>
            </Card>
          ) : null}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Workflow />
                </EmptyMedia>
                <EmptyTitle>
                  {items.length ? "Nenhum fluxo encontrado" : "Crie seu primeiro fluxo"}
                </EmptyTitle>
                <EmptyDescription>
                  {items.length
                    ? "Ajuste a busca ou o filtro de status."
                    : "Comece com texto, botões, listas, mídia, condições e variáveis."}
                </EmptyDescription>
              </EmptyHeader>
              {!items.length ? (
                <EmptyContent>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Novo fluxo
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((flow) => (
                <Card key={flow.id}>
                  <CardHeader>
                    <CardTitle className="truncate">{flow.name}</CardTitle>
                    <CardDescription>
                      Atualizado {timeAgo(flow.updatedAt)}
                    </CardDescription>
                    <CardAction>
                      <Badge variant={flow.active ? "default" : "secondary"}>
                        {flow.active ? "Publicado" : flow.status}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3">
                    <FlowStat label="Conversas" value={flow.stats.conversas} />
                    <FlowStat label="Leads" value={flow.stats.leads} />
                    <FlowStat label="Conversão" value={`${flow.stats.conversao}%`} />
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-1">
                    <Button size="sm" asChild>
                      <Link to={`/flows/${flow.id}`}>
                        <Pencil data-icon="inline-start" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void togglePublished(flow)}
                    >
                      <Upload data-icon="inline-start" />
                      {flow.active ? "Despublicar" : "Publicar"}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Renomear fluxo"
                      onClick={() => void rename(flow.id)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Duplicar fluxo"
                      onClick={() => void duplicate(flow.id)}
                    >
                      <Copy />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Exportar fluxo"
                      onClick={() => void exportFlow(flow)}
                    >
                      <Download />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      aria-label="Excluir fluxo"
                      onClick={() => void remove(flow.id)}
                    >
                      <Trash2 />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </section>
          )}
        </div>
      </main>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Novo fluxo</SheetTitle>
            <SheetDescription>
              Crie um rascunho e abra o editor visual.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-flow-name">Nome</FieldLabel>
                <Input
                  id="new-flow-name"
                  autoFocus
                  value={newName}
                  placeholder="Ex.: Qualificação de leads"
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void create()
                  }}
                />
              </Field>
            </FieldGroup>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void create()} disabled={busy || !newName.trim()}>
              <Plus data-icon="inline-start" />
              {busy ? "Criando…" : "Criar fluxo"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Workflow
  label: string
  value: string | number
  detail: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-4" />
          <CardDescription>{label}</CardDescription>
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{detail}</CardContent>
    </Card>
  )
}

function FlowStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-lg bg-muted p-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  )
}

function timeAgo(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return "agora"
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)} h`
  return `há ${Math.floor(seconds / 86400)} d`
}
