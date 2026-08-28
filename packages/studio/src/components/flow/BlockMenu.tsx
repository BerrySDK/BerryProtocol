import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { BLOCK_META, type BlockKind } from "./BlockNode"

const ORDER: BlockKind[] = [
  "message",
  "action",
  "input",
  "condition",
  "setVariable",
  "delay",
  "note",
  "end",
]

export function BlockMenu({
  x,
  y,
  onPick,
  onClose,
}: {
  x: number
  y: number
  onPick: (kind: BlockKind) => void
  onClose: () => void
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Fechar menu de blocos"
        className="fixed inset-0"
        onClick={onClose}
      />
      <Card
        size="sm"
        className="fixed w-72 shadow-2xl"
        style={{ left: Math.min(x, window.innerWidth - 304), top: Math.min(y, window.innerHeight - 470) }}
      >
        <CardHeader>
          <CardTitle>Adicionar bloco</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {ORDER.map((kind) => {
            const meta = BLOCK_META[kind]
            const Icon = meta.icon

            return (
              <Button
                key={kind}
                variant="ghost"
                className="h-auto justify-start py-2 text-left"
                onClick={() => {
                  onPick(kind)
                  onClose()
                }}
              >
                <Icon data-icon="inline-start" />
                <span className="flex min-w-0 flex-col items-start">
                  <span>{meta.label}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {meta.description}
                  </span>
                </span>
              </Button>
            )
          })}
        </CardContent>
      </Card>
    </>
  )
}
