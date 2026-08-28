import { useEffect, useMemo, useState } from "react"
import {
  Bot,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  MessageSquare,
  Play,
  Send,
  Smartphone,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  continueStudioExecution,
  continueStudioSimulation,
  listStudioInstances,
  startStudioExecution,
  startStudioSimulation,
  validateStudioFlow,
  type FlowRunnerState,
  type StudioFlowGraph,
  type StudioInstance,
} from "@/lib/studio-api"

type RunnerMode = "simulate" | "execute"

const normalizeJid = (value: string) => {
  const trimmed = value.trim()
  if (trimmed.includes("@")) return trimmed
  const digits = trimmed.replace(/\D/g, "")
  return digits ? `${digits}@s.whatsapp.net` : ""
}

const parseVariables = (value: string) => {
  if (!value.trim()) return {}
  const parsed = JSON.parse(value) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("As variáveis devem ser um objeto JSON.")
  }
  return parsed as Record<string, unknown>
}

export function FlowTestPanel({
  open,
  onOpenChange,
  flowId,
  graph,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  flowId: string
  graph: StudioFlowGraph
}) {
  const [mode, setMode] = useState<RunnerMode>("simulate")
  const [instances, setInstances] = useState<StudioInstance[]>([])
  const [instanceName, setInstanceName] = useState("")
  const [contactJid, setContactJid] = useState("5511999999999")
  const [contactName, setContactName] = useState("Cliente Berry")
  const [variablesJson, setVariablesJson] = useState("{}")
  const [runnerState, setRunnerState] = useState<FlowRunnerState | null>(null)
  const [inputText, setInputText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    void listStudioInstances()
      .then((items) => {
        setInstances(items)
        setInstanceName((current) => current || items[0]?.instanceName || "")
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar as instâncias.",
        )
      })
  }, [open])

  const connectedInstances = useMemo(
    () =>
      instances.filter(
        (instance) =>
          instance.status === "connected" || instance.connectionState === "open",
      ),
    [instances],
  )

  const start = async () => {
    setBusy(true)
    setError(null)
    setRunnerState(null)
    try {
      const validation = await validateStudioFlow(graph)
      if (!validation.valid) {
        throw new Error(validation.errors.join(" "))
      }

      const variables = parseVariables(variablesJson)
      const contact = {
        jid: normalizeJid(contactJid),
        name: contactName.trim() || "Cliente",
      }
      const nextState =
        mode === "execute"
          ? await startStudioExecution({
              flowId,
              flow: graph,
              instanceName,
              variables,
              contact,
            })
          : await startStudioSimulation({
              flowId,
              flow: graph,
              variables,
              contact,
            })
      setRunnerState(nextState)
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : "Falha ao executar o fluxo.",
      )
    } finally {
      setBusy(false)
    }
  }

  const continueRun = async () => {
    if (!runnerState || !inputText.trim()) return
    setBusy(true)
    setError(null)
    try {
      const nextState =
        mode === "execute"
          ? await continueStudioExecution({
              flowId,
              flow: graph,
              instanceName,
              state: runnerState,
              inputText: inputText.trim(),
            })
          : await continueStudioSimulation({
              flowId,
              flow: graph,
              state: runnerState,
              inputText: inputText.trim(),
            })
      setRunnerState(nextState)
      setInputText("")
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : "Falha ao continuar o fluxo.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Laboratório do fluxo</SheetTitle>
          <SheetDescription>
            Simule sem enviar ou execute de verdade em uma instância conectada.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value as RunnerMode)
              setRunnerState(null)
              setError(null)
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="simulate" className="flex-1">
                <Bot />
                Simulação
              </TabsTrigger>
              <TabsTrigger value="execute" className="flex-1">
                <Smartphone />
                WhatsApp real
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Contexto do teste</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {mode === "execute" ? (
                  <Field data-invalid={!instanceName}>
                    <FieldLabel>Instância</FieldLabel>
                    <Select value={instanceName} onValueChange={setInstanceName}>
                      <SelectTrigger className="w-full" aria-invalid={!instanceName}>
                        <SelectValue placeholder="Selecione uma conexão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(connectedInstances.length
                            ? connectedInstances
                            : instances
                          ).map((instance) => (
                            <SelectItem
                              key={instance.instanceName}
                              value={instance.instanceName}
                            >
                              {instance.instanceName} · {instance.status}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {!connectedInstances.length ? (
                      <FieldDescription>
                        Nenhuma instância está conectada; conecte uma antes do envio
                        real.
                      </FieldDescription>
                    ) : null}
                  </Field>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="test-contact">WhatsApp do contato</FieldLabel>
                    <Input
                      id="test-contact"
                      value={contactJid}
                      placeholder="5511999999999"
                      onChange={(event) => setContactJid(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="test-contact-name">Nome do contato</FieldLabel>
                    <Input
                      id="test-contact-name"
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="test-variables">Variáveis iniciais</FieldLabel>
                  <Textarea
                    id="test-variables"
                    rows={3}
                    value={variablesJson}
                    onChange={(event) => setVariablesJson(event.target.value)}
                    placeholder='{"origem":"campanha"}'
                  />
                </Field>

                <Button
                  onClick={() => void start()}
                  disabled={
                    busy
                    || !contactJid.trim()
                    || (mode === "execute" && !instanceName)
                  }
                >
                  {busy ? (
                    <LoaderCircle data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Play data-icon="inline-start" />
                  )}
                  {mode === "execute" ? "Executar no WhatsApp" : "Iniciar simulação"}
                </Button>
              </FieldGroup>
            </CardContent>
          </Card>

          {error ? (
            <Card size="sm" className="ring-destructive/40">
              <CardContent className="flex items-start gap-2 text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </CardContent>
            </Card>
          ) : null}

          {runnerState ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">Conversa</h3>
                  <p className="text-xs text-muted-foreground">
                    {runnerState.transcript.length} eventos processados
                  </p>
                </div>
                <RunnerStatus status={runnerState.status} />
              </div>

              <div className="flex min-h-56 flex-col gap-3 rounded-xl border bg-muted/30 p-4">
                {runnerState.transcript.length ? (
                  runnerState.transcript.map((item, index) => (
                    <TranscriptItem key={`${String(item.type)}-${index}`} item={item} />
                  ))
                ) : (
                  <p className="m-auto text-sm text-muted-foreground">
                    O fluxo terminou sem produzir mensagens.
                  </p>
                )}
              </div>

              {runnerState.status === "waiting_input" ? (
                <Field>
                  <FieldLabel htmlFor="runner-input">Resposta do contato</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id="runner-input"
                      value={inputText}
                      placeholder="Digite a resposta…"
                      onChange={(event) => setInputText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void continueRun()
                      }}
                    />
                    <Button
                      onClick={() => void continueRun()}
                      disabled={busy || !inputText.trim()}
                    >
                      <Send data-icon="inline-start" />
                      Enviar
                    </Button>
                  </div>
                </Field>
              ) : null}

              <Separator />
              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  Logs e variáveis
                </summary>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <pre className="max-h-56 overflow-auto rounded-lg bg-muted p-3 text-xs">
                    {runnerState.logs.join("\n")}
                  </pre>
                  <pre className="max-h-56 overflow-auto rounded-lg bg-muted p-3 text-xs">
                    {JSON.stringify(runnerState.variables, null, 2)}
                  </pre>
                </div>
              </details>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function RunnerStatus({ status }: { status: FlowRunnerState["status"] }) {
  if (status === "completed") {
    return (
      <Badge>
        <CheckCircle2 />
        Concluído
      </Badge>
    )
  }
  if (status === "failed") {
    return <Badge variant="destructive">Falhou</Badge>
  }
  return <Badge variant="secondary">{status === "waiting_input" ? "Aguardando resposta" : "Executando"}</Badge>
}

function TranscriptItem({ item }: { item: Record<string, unknown> }) {
  const role = String(item.role ?? "system")
  const payload =
    item.payload && typeof item.payload === "object"
      ? (item.payload as Record<string, unknown>)
      : item
  const buttons = Array.isArray(payload.buttons) ? payload.buttons : []
  const sections = Array.isArray(payload.sections) ? payload.sections : []
  const cards = Array.isArray(payload.cards) ? payload.cards : []
  const text = String(
    payload.text
      ?? payload.caption
      ?? payload.title
      ?? item.eventName
      ?? item.type
      ?? "Evento",
  )

  return (
    <div
      className={
        role === "user"
          ? "ml-auto max-w-[85%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
          : "mr-auto max-w-[85%] rounded-xl bg-card px-3 py-2 text-sm shadow-sm ring-1 ring-foreground/10"
      }
    >
      <div className="mb-1 flex items-center gap-1 text-xs opacity-70">
        {role === "user" ? <UserRound className="size-3" /> : <MessageSquare className="size-3" />}
        {String(item.type ?? "mensagem")}
      </div>
      <p className="whitespace-pre-wrap">{text}</p>
      {buttons.length ? (
        <div className="mt-2 flex flex-col gap-1">
          {buttons.map((button, index) => (
            <span key={index} className="rounded-md border px-2 py-1 text-center text-xs">
              {String((button as Record<string, unknown>).title ?? `Botão ${index + 1}`)}
            </span>
          ))}
        </div>
      ) : null}
      {sections.length ? (
        <p className="mt-2 text-xs opacity-70">{sections.length} seções na lista</p>
      ) : null}
      {cards.length ? (
        <p className="mt-2 text-xs opacity-70">{cards.length} cards no carrossel</p>
      ) : null}
    </div>
  )
}
