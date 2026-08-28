import type { Edge, Node } from "@xyflow/react"
import { Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { BLOCK_META, type BlockNodeData } from "./BlockNode"

export function ConstructorView({
  nodes,
  edges,
  onEdit,
  onDelete,
}: {
  nodes: Node[]
  edges: Edge[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const startNode = nodes.find(
    (node) => (node.data as unknown as BlockNodeData).kind === "start",
  )
  const ordered: Node[] = []
  const seen = new Set<string>()

  const walk = (id: string | undefined) => {
    if (!id || seen.has(id)) return
    const node = nodes.find((item) => item.id === id)
    if (!node) return
    seen.add(id)
    ordered.push(node)
    const outgoing = edges.filter((edge) => edge.source === id)
    outgoing.forEach((edge) => walk(edge.target))
  }

  walk(startNode?.id)
  nodes.forEach((node) => {
    if (!seen.has(node.id)) ordered.push(node)
  })

  return (
    <div className="size-full overflow-y-auto bg-muted/20 px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">Visão linear</h2>
          <p className="text-sm text-muted-foreground">
            Revise a sequência e abra qualquer bloco para editar no canvas.
          </p>
        </div>

        {!ordered.length ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Pencil />
              </EmptyMedia>
              <EmptyTitle>Nenhum bloco no fluxo</EmptyTitle>
              <EmptyDescription>
                Volte ao canvas e adicione o primeiro bloco.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {ordered.map((node, index) => {
          const data = node.data as unknown as BlockNodeData
          const meta = BLOCK_META[data.kind] ?? BLOCK_META.message
          const Icon = meta.icon
          const outgoing = edges.filter((edge) => edge.source === node.id)

          return (
            <Card key={node.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <CardTitle>
                      {index + 1}. {data.label || meta.label}
                    </CardTitle>
                    <CardDescription>
                      {data.capabilityLabel || meta.description}
                    </CardDescription>
                  </div>
                </div>
                <CardAction className="flex items-center gap-1">
                  {data.kind !== "start" && data.kind !== "end" ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar bloco"
                      onClick={() => onEdit(node.id)}
                    >
                      <Pencil />
                    </Button>
                  ) : null}
                  {data.kind !== "start" ? (
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      aria-label="Excluir bloco"
                      onClick={() => onDelete(node.id)}
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{node.type}</Badge>
                {outgoing.length ? (
                  outgoing.map((edge) => (
                    <Badge key={edge.id} variant="secondary">
                      {edge.sourceHandle && edge.sourceHandle !== "next"
                        ? `${edge.sourceHandle} → `
                        : "Próximo → "}
                      {ordered.findIndex((item) => item.id === edge.target) + 1}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Sem próxima etapa
                  </span>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
