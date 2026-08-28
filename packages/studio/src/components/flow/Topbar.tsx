import {
  ArrowLeft,
  Braces,
  CheckCircle2,
  GitFork,
  Layers,
  LineChart,
  LoaderCircle,
  Play,
  Radio,
  Redo2,
  Save,
  ShieldCheck,
  Undo2,
  Upload,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type FlowTab = "fluxo" | "construtor" | "variaveis" | "analise"

const tabs: { id: FlowTab; icon: typeof GitFork; label: string }[] = [
  { id: "fluxo", icon: GitFork, label: "Fluxo" },
  { id: "construtor", icon: Layers, label: "Construtor" },
  { id: "variaveis", icon: Braces, label: "Variáveis" },
  { id: "analise", icon: LineChart, label: "Análise" },
]

export function Topbar({
  active,
  onChange,
  name,
  onRename,
  onSave,
  onPublish,
  onTest,
  onTrigger,
  onValidate,
  onUndo,
  onRedo,
  saved,
  saving,
  feedback,
}: {
  active: FlowTab
  onChange: (tab: FlowTab) => void
  name: string
  onRename: (name: string) => void
  onSave: () => void
  onPublish: () => void
  onTest: () => void
  onTrigger: () => void
  onValidate: () => void
  onUndo: () => void
  onRedo: () => void
  saved: boolean
  saving: boolean
  feedback?: string | null
}) {
  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
      <Button variant="ghost" size="icon-sm" asChild>
        <Link to="/" aria-label="Voltar para fluxos">
          <ArrowLeft />
        </Link>
      </Button>

      <Input
        value={name}
        aria-label="Nome do fluxo"
        onChange={(event) => onRename(event.target.value)}
        className="w-40 border-transparent bg-transparent font-medium shadow-none focus-visible:bg-background"
      />

      <Badge variant={saved ? "secondary" : "outline"}>
        {saved ? <CheckCircle2 /> : null}
        {saved ? "Salvo" : "Alterações pendentes"}
      </Badge>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onUndo} aria-label="Desfazer">
          <Undo2 />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onRedo} aria-label="Refazer">
          <Redo2 />
        </Button>
      </div>

      <Tabs
        value={active}
        onValueChange={(value) => onChange(value as FlowTab)}
        className="order-last w-full items-center lg:order-none lg:mx-auto lg:w-auto"
      >
        <TabsList className="w-full lg:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id}>
                <Icon />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {feedback ? (
        <span className="hidden max-w-56 truncate text-xs text-muted-foreground xl:inline">
          {feedback}
        </span>
      ) : null}

      <Button variant="outline" size="sm" onClick={onValidate}>
        <ShieldCheck data-icon="inline-start" />
        <span className="hidden xl:inline">Validar</span>
      </Button>
      <Button variant="outline" size="sm" onClick={onTest}>
        <Play data-icon="inline-start" />
        Testar
      </Button>
      <Button variant="outline" size="sm" onClick={onTrigger}>
        <Radio data-icon="inline-start" />
        <span className="hidden xl:inline">Gatilho</span>
      </Button>
      <Button variant="secondary" size="sm" onClick={onSave} disabled={saving}>
        {saving ? (
          <LoaderCircle data-icon="inline-start" className="animate-spin" />
        ) : (
          <Save data-icon="inline-start" />
        )}
        <span className="hidden xl:inline">Salvar rascunho</span>
        <span className="xl:hidden">Salvar</span>
      </Button>
      <Button size="sm" onClick={onPublish} disabled={saving}>
        <Upload data-icon="inline-start" />
        Publicar
      </Button>
    </header>
  )
}
