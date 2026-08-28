import { Radio, Smartphone, Zap } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  listStudioInstances,
  type StudioFlowTrigger,
  type StudioInstance,
} from "@/lib/studio-api"

export function FlowTriggerPanel({
  open,
  onOpenChange,
  trigger,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: StudioFlowTrigger
  onChange: (trigger: StudioFlowTrigger) => void
}) {
  const [instances, setInstances] = useState<StudioInstance[]>([])

  useEffect(() => {
    if (!open) return
    void listStudioInstances().then(setInstances).catch(() => setInstances([]))
  }, [open])

  const update = (patch: Partial<StudioFlowTrigger>) =>
    onChange({ ...trigger, ...patch })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            Gatilho do WhatsApp
          </SheetTitle>
          <SheetDescription>
            Inicie o fluxo automaticamente quando uma mensagem recebida combinar
            com estas regras.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          <FieldGroup>
            <Field>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-4">
                <div>
                  <FieldLabel htmlFor="trigger-enabled">
                    Automação publicada
                  </FieldLabel>
                  <FieldDescription>
                    Só fluxos publicados recebem eventos.
                  </FieldDescription>
                </div>
                <Switch
                  id="trigger-enabled"
                  checked={trigger.enabled}
                  onCheckedChange={(enabled) => update({ enabled })}
                />
              </div>
            </Field>

            <Field data-disabled={!trigger.enabled}>
              <FieldLabel>Instância</FieldLabel>
              <Select
                disabled={!trigger.enabled}
                value={trigger.instanceName}
                onValueChange={(instanceName) => update({ instanceName })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a conexão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {instances.map((instance) => (
                      <SelectItem
                        key={instance.instanceName}
                        value={instance.instanceName}
                      >
                        <span className="flex items-center gap-2">
                          <Smartphone className="size-3" />
                          {instance.instanceName}
                          <Badge variant="outline">{instance.status}</Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {!instances.length ? (
                <FieldDescription>
                  Crie uma conexão antes de ativar o gatilho.
                </FieldDescription>
              ) : null}
            </Field>

            <Field data-disabled={!trigger.enabled}>
              <FieldLabel>Como combinar</FieldLabel>
              <Select
                disabled={!trigger.enabled}
                value={trigger.matchMode}
                onValueChange={(matchMode) =>
                  update({
                    matchMode: matchMode as StudioFlowTrigger["matchMode"],
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="contains">Contém uma palavra-chave</SelectItem>
                    <SelectItem value="exact">É exatamente igual</SelectItem>
                    <SelectItem value="startsWith">Começa com</SelectItem>
                    <SelectItem value="any">Qualquer mensagem</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {trigger.matchMode !== "any" ? (
              <Field data-disabled={!trigger.enabled}>
                <FieldLabel htmlFor="trigger-keywords">
                  Palavras-chave
                </FieldLabel>
                <Textarea
                  id="trigger-keywords"
                  disabled={!trigger.enabled}
                  rows={5}
                  value={trigger.keywords.join("\n")}
                  placeholder={"oi\nmenu\natendimento"}
                  onChange={(event) =>
                    update({
                      keywords: event.target.value
                        .split(/[\n,]/)
                        .map((keyword) => keyword.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <FieldDescription>
                  Uma por linha. A primeira regra publicada que combinar será
                  executada.
                </FieldDescription>
              </Field>
            ) : null}

            <Field data-disabled={!trigger.enabled}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <FieldLabel htmlFor="trigger-case-sensitive">
                    Diferenciar maiúsculas
                  </FieldLabel>
                  <FieldDescription>
                    Normalmente “Oi” e “oi” são equivalentes.
                  </FieldDescription>
                </div>
                <Switch
                  id="trigger-case-sensitive"
                  disabled={!trigger.enabled}
                  checked={trigger.caseSensitive}
                  onCheckedChange={(caseSensitive) => update({ caseSensitive })}
                />
              </div>
            </Field>

            <div className="flex items-start gap-2 rounded-xl border p-4 text-sm text-muted-foreground">
              <Radio className="mt-0.5 size-4 shrink-0 text-primary" />
              Se já houver uma execução aguardando resposta para o mesmo contato,
              a mensagem continua essa execução antes de procurar um novo gatilho.
            </div>
          </FieldGroup>
        </div>
      </SheetContent>
    </Sheet>
  )
}
