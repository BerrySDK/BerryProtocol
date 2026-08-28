import type { Node } from "@xyflow/react"
import { Braces, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type {
  StudioCapability,
  StudioFieldDefinition,
} from "@/lib/studio-api"

import { BLOCK_META, type BlockKind, type BlockNodeData } from "./BlockNode"

const payloadInputValue = (value: unknown, field: StudioFieldDefinition) => {
  if (field.type === "json" && value !== undefined && typeof value !== "string") {
    return JSON.stringify(value, null, 2)
  }
  return value == null ? "" : String(value)
}

const defaultPayload = (capability: StudioCapability) =>
  Object.fromEntries(
    capability.fields.map((field) => [
      field.key,
      field.defaultValue ?? (field.type === "checkbox" ? false : ""),
    ]),
  )

export function EditPanel({
  node,
  messageCapabilities,
  actionCapabilities,
  conditionOperators,
  onClose,
  onUpdateNodeData,
  onDelete,
}: {
  node: Node
  messageCapabilities: StudioCapability[]
  actionCapabilities: StudioCapability[]
  conditionOperators: Array<{ label: string; value: string }>
  onClose: () => void
  onUpdateNodeData: (id: string, patch: Record<string, unknown>) => void
  onDelete: (id: string) => void
}) {
  const data = node.data as unknown as BlockNodeData
  const kind = (data.kind || node.type || "message") as BlockKind
  const meta = BLOCK_META[kind] ?? BLOCK_META.message
  const capabilities = kind === "action" ? actionCapabilities : messageCapabilities
  const selectedCapability = capabilities.find(
    (capability) => capability.id === data.messageType,
  )
  const payload = data.payload ?? {}

  const updatePayload = (key: string, value: unknown) => {
    onUpdateNodeData(node.id, {
      payload: {
        ...payload,
        [key]: value,
      },
    })
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <meta.icon className="size-4 text-primary" />
            {meta.label}
          </SheetTitle>
          <SheetDescription>
            Configure o comportamento deste bloco. Use {"{{variavel}}"} em textos
            e estruturas JSON.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`label-${node.id}`}>Nome do bloco</FieldLabel>
              <Input
                id={`label-${node.id}`}
                value={data.label ?? ""}
                placeholder={meta.label}
                onChange={(event) =>
                  onUpdateNodeData(node.id, { label: event.target.value })
                }
              />
            </Field>

            {kind === "message" || kind === "action" ? (
              <>
                <Field>
                  <FieldLabel>Método do BerryProtocol</FieldLabel>
                  <Select
                    value={data.messageType}
                    onValueChange={(value) => {
                      const capability = capabilities.find(
                        (item) => item.id === value,
                      )
                      if (!capability) return
                      onUpdateNodeData(node.id, {
                        messageType: capability.id,
                        capabilityLabel: capability.label,
                        payload: defaultPayload(capability),
                      })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um método" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectGroup>
                        {capabilities.map((capability) => (
                          <SelectItem key={capability.id} value={capability.id}>
                            {capability.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {selectedCapability ? (
                    <FieldDescription>
                      {selectedCapability.description}
                    </FieldDescription>
                  ) : null}
                </Field>

                {selectedCapability?.fields.map((field) => (
                  <CapabilityField
                    key={field.key}
                    field={field}
                    value={payload[field.key]}
                    onChange={(value) => updatePayload(field.key, value)}
                  />
                ))}
              </>
            ) : null}

            {kind === "input" ? (
              <>
                <Field>
                  <FieldLabel htmlFor={`prompt-${node.id}`}>
                    Mensagem de pergunta
                  </FieldLabel>
                  <Textarea
                    id={`prompt-${node.id}`}
                    value={data.prompt ?? ""}
                    placeholder="Como posso ajudar?"
                    onChange={(event) =>
                      onUpdateNodeData(node.id, { prompt: event.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`variable-${node.id}`}>
                    Salvar resposta em
                  </FieldLabel>
                  <Input
                    id={`variable-${node.id}`}
                    value={data.variableName ?? ""}
                    placeholder="resposta_cliente"
                    onChange={(event) =>
                      onUpdateNodeData(node.id, {
                        variableName: event.target.value,
                      })
                    }
                  />
                </Field>
              </>
            ) : null}

            {kind === "condition" ? (
              <>
                <Field>
                  <FieldLabel htmlFor={`condition-variable-${node.id}`}>
                    Variável
                  </FieldLabel>
                  <Input
                    id={`condition-variable-${node.id}`}
                    value={data.variable ?? ""}
                    placeholder="lastInput"
                    onChange={(event) =>
                      onUpdateNodeData(node.id, {
                        variable: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Operador</FieldLabel>
                  <Select
                    value={data.operator ?? "equals"}
                    onValueChange={(value) =>
                      onUpdateNodeData(node.id, { operator: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {conditionOperators.map((operator) => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`condition-value-${node.id}`}>
                    Valor de comparação
                  </FieldLabel>
                  <Input
                    id={`condition-value-${node.id}`}
                    value={data.value ?? ""}
                    placeholder="vendas"
                    onChange={(event) =>
                      onUpdateNodeData(node.id, { value: event.target.value })
                    }
                  />
                </Field>
              </>
            ) : null}

            {kind === "setVariable" ? (
              <>
                <Field>
                  <FieldLabel htmlFor={`key-${node.id}`}>Nome da variável</FieldLabel>
                  <Input
                    id={`key-${node.id}`}
                    value={data.key ?? ""}
                    placeholder="segmento"
                    onChange={(event) =>
                      onUpdateNodeData(node.id, { key: event.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`value-${node.id}`}>Valor</FieldLabel>
                  <Textarea
                    id={`value-${node.id}`}
                    value={data.value ?? ""}
                    placeholder='vip ou {"plano":"pro"}'
                    onChange={(event) =>
                      onUpdateNodeData(node.id, { value: event.target.value })
                    }
                  />
                  <FieldDescription className="flex items-center gap-1">
                    <Braces className="size-3" />
                    JSON válido é convertido automaticamente.
                  </FieldDescription>
                </Field>
              </>
            ) : null}

            {kind === "delay" ? (
              <Field>
                <FieldLabel htmlFor={`delay-${node.id}`}>
                  Duração em milissegundos
                </FieldLabel>
                <Input
                  id={`delay-${node.id}`}
                  type="number"
                  min={0}
                  max={60000}
                  value={data.delayMs ?? 1000}
                  onChange={(event) =>
                    onUpdateNodeData(node.id, {
                      delayMs: Number(event.target.value),
                    })
                  }
                />
                <FieldDescription>
                  Execuções reais aguardam no máximo 60 segundos por bloco.
                </FieldDescription>
              </Field>
            ) : null}

            {kind === "note" ? (
              <Field>
                <FieldLabel htmlFor={`note-${node.id}`}>Nota interna</FieldLabel>
                <Textarea
                  id={`note-${node.id}`}
                  rows={8}
                  value={data.text ?? ""}
                  placeholder="Documente uma decisão deste fluxo…"
                  onChange={(event) =>
                    onUpdateNodeData(node.id, { text: event.target.value })
                  }
                />
              </Field>
            ) : null}
          </FieldGroup>
        </div>

        {kind !== "start" ? (
          <SheetFooter>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(node.id)
                onClose()
              }}
            >
              <Trash2 data-icon="inline-start" />
              Excluir bloco
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function CapabilityField({
  field,
  value,
  onChange,
}: {
  field: StudioFieldDefinition
  value: unknown
  onChange: (value: unknown) => void
}) {
  const id = `capability-${field.key}`

  if (field.type === "checkbox") {
    return (
      <Field>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
            {field.description ? (
              <FieldDescription>{field.description}</FieldDescription>
            ) : null}
          </div>
          <Switch
            id={id}
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
        </div>
      </Field>
    )
  }

  if (field.type === "select") {
    return (
      <Field>
        <FieldLabel>
          {field.label}
          {field.required ? <Badge variant="outline">Obrigatório</Badge> : null}
        </FieldLabel>
        <Select
          value={String(value ?? field.defaultValue ?? "")}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(field.options ?? []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    )
  }

  const Control = field.type === "textarea" || field.type === "json"
    ? Textarea
    : Input

  return (
    <Field>
      <FieldLabel htmlFor={id} className="flex items-center gap-2">
        {field.label}
        {field.required ? <Badge variant="outline">Obrigatório</Badge> : null}
      </FieldLabel>
      <Control
        id={id}
        type={field.type === "number" ? "number" : undefined}
        rows={field.type === "json" ? 6 : undefined}
        value={payloadInputValue(value, field)}
        placeholder={field.placeholder}
        onChange={(event) => {
          if (field.type === "number") {
            onChange(event.target.value === "" ? "" : Number(event.target.value))
            return
          }
          onChange(event.target.value)
        }}
      />
      {field.description ? (
        <FieldDescription>{field.description}</FieldDescription>
      ) : null}
    </Field>
  )
}
