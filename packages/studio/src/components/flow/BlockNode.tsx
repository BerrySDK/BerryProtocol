import { Handle, Position, type NodeProps } from "@xyflow/react"
import {
  Braces,
  CircleStop,
  Clock3,
  Copy,
  Flag,
  GitBranch,
  MessageSquare,
  MousePointerClick,
  Pencil,
  Play,
  Plus,
  StickyNote,
  TextCursorInput,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type BlockKind =
  | "start"
  | "message"
  | "action"
  | "input"
  | "condition"
  | "setVariable"
  | "delay"
  | "end"
  | "note"

export const BLOCK_META: Record<
  BlockKind,
  { label: string; icon: typeof MessageSquare; description: string }
> = {
  start: { label: "Início", icon: Play, description: "Ponto de entrada" },
  message: { label: "Mensagem", icon: MessageSquare, description: "Método BerryProtocol" },
  action: { label: "Ação", icon: MousePointerClick, description: "Editar, reagir ou apagar" },
  input: { label: "Capturar resposta", icon: TextCursorInput, description: "Salva uma resposta" },
  condition: { label: "Condição", icon: GitBranch, description: "Cria dois caminhos" },
  setVariable: { label: "Definir variável", icon: Braces, description: "Atualiza o contexto" },
  delay: { label: "Aguardar", icon: Clock3, description: "Pausa a execução" },
  end: { label: "Fim", icon: CircleStop, description: "Encerra o fluxo" },
  note: { label: "Nota", icon: StickyNote, description: "Visível só no editor" },
}

export type BlockNodeData = {
  kind: BlockKind
  label?: string
  text?: string
  messageType?: string
  capabilityLabel?: string
  payload?: Record<string, unknown>
  prompt?: string
  variableName?: string
  variable?: string
  operator?: string
  value?: string
  key?: string
  delayMs?: number
  onAdd?: (id: string, handle?: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
}

const getSummary = (data: BlockNodeData) => {
  if (data.kind === "message" || data.kind === "action") {
    const payload = data.payload ?? {}
    return String(
      payload.text
        ?? payload.caption
        ?? payload.title
        ?? data.capabilityLabel
        ?? data.messageType
        ?? "Configure o método",
    )
  }

  if (data.kind === "input") {
    return data.prompt || `Salvar em {{${data.variableName || "lastInput"}}}`
  }

  if (data.kind === "condition") {
    return `${data.variable || "lastInput"} ${data.operator || "equals"} ${data.value || "…"}`
  }

  if (data.kind === "setVariable") {
    return `${data.key || "variavel"} = ${data.value || "…"}`
  }

  if (data.kind === "delay") {
    return `${data.delayMs ?? 1000} ms`
  }

  return data.text || BLOCK_META[data.kind].description
}

export function BlockNode({ id, data, selected }: NodeProps) {
  const block = data as unknown as BlockNodeData
  const meta = BLOCK_META[block.kind] ?? BLOCK_META.message
  const Icon = meta.icon
  const isStart = block.kind === "start"
  const isEnd = block.kind === "end"
  const isCondition = block.kind === "condition"
  const isNote = block.kind === "note"

  return (
    <div className="group relative">
      {!isStart && !isNote ? (
        <Handle type="target" position={Position.Left} />
      ) : null}

      <Card
        size="sm"
        className={cn(
          "w-72 cursor-pointer bg-card/95 shadow-lg backdrop-blur",
          selected && "ring-2 ring-primary",
          isNote && "border-dashed bg-muted",
        )}
        onDoubleClick={() => block.onEdit?.(id)}
      >
        <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <CardTitle className="truncate">{block.label || meta.label}</CardTitle>
            <p className="truncate text-xs text-muted-foreground">
              {block.capabilityLabel || meta.description}
            </p>
          </div>
          {isStart ? <Badge>Entrada</Badge> : null}
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {getSummary(block)}
          </p>
          {isCondition ? (
            <div className="mt-3 flex items-center justify-between text-xs">
              <Badge variant="secondary">Verdadeiro</Badge>
              <Badge variant="outline">Falso</Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="absolute -top-10 right-0 hidden items-center gap-1 group-hover:flex">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Editar bloco"
          onClick={() => block.onEdit?.(id)}
        >
          <Pencil />
        </Button>
        {!isStart ? (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Duplicar bloco"
            onClick={() => block.onDuplicate?.(id)}
          >
            <Copy />
          </Button>
        ) : null}
        {!isStart ? (
          <Button
            variant="destructive"
            size="icon-sm"
            aria-label="Excluir bloco"
            onClick={() => block.onDelete?.(id)}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>

      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "42%" }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "72%" }}
          />
        </>
      ) : !isEnd && !isNote ? (
        <Handle type="source" position={Position.Right} id="next" />
      ) : null}

      {!isEnd && !isNote ? (
        <Button
          size="icon-sm"
          className="absolute -right-11 top-1/2 -translate-y-1/2 opacity-0 shadow-md group-hover:opacity-100"
          aria-label="Adicionar próximo bloco"
          onClick={() => block.onAdd?.(id, isCondition ? "true" : "next")}
        >
          <Plus />
        </Button>
      ) : null}

      {isStart ? (
        <Flag className="absolute -left-7 top-1/2 size-4 -translate-y-1/2 text-primary" />
      ) : null}
    </div>
  )
}
