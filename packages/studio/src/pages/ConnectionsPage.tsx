import {
  Link2,
  LoaderCircle,
  LogOut,
  Plus,
  QrCode as QrCodeIcon,
  RefreshCw,
  Smartphone,
  Trash2,
} from "lucide-react"
import QRCode from "qrcode"
import { useEffect, useState } from "react"

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
import { Skeleton } from "@/components/ui/skeleton"
import {
  connectStudioInstance,
  createStudioInstance,
  deleteStudioInstance,
  listStudioInstances,
  logoutStudioInstance,
  restartStudioInstance,
  type StudioInstance,
} from "@/lib/studio-api"

type AuthMethod = "qr" | "pairing_code" | "link"

export default function ConnectionsPage() {
  const [items, setItems] = useState<StudioInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [authMethod, setAuthMethod] = useState<AuthMethod>("qr")
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      setItems(await listStudioInstances())
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar as conexões.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(true)
    const timer = window.setInterval(() => void load(), 5000)
    return () => window.clearInterval(timer)
  }, [])

  const create = async () => {
    if (!name.trim()) return
    setBusyId("creating")
    setError(null)
    try {
      await createStudioInstance({
        instanceName: name.trim(),
        authMethod,
        phoneNumber:
          authMethod === "pairing_code" ? phoneNumber.trim() || undefined : undefined,
      })
      setName("")
      setPhoneNumber("")
      setAuthMethod("qr")
      setCreateOpen(false)
      await load()
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Não foi possível criar a conexão.",
      )
    } finally {
      setBusyId(null)
    }
  }

  const runAction = async (
    instanceName: string,
    action: () => Promise<unknown>,
  ) => {
    setBusyId(instanceName)
    setError(null)
    try {
      await action()
      await load()
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "A operação na conexão falhou.",
      )
    } finally {
      setBusyId(null)
    }
  }

  const connected = items.filter(
    (instance) =>
      instance.status === "connected" || instance.connectionState === "open",
  ).length

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="secondary">BerryProtocol instances</Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                Conexões do WhatsApp
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {items.length} instância(s), {connected} conectada(s).
              </p>
            </div>
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Nova conexão
            </Button>
          </div>

          {error ? (
            <Card size="sm" className="ring-destructive/40">
              <CardContent className="text-destructive">{error}</CardContent>
            </Card>
          ) : null}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Smartphone />
                </EmptyMedia>
                <EmptyTitle>Nenhuma conexão criada</EmptyTitle>
                <EmptyDescription>
                  Crie uma instância, conecte pelo QR code ou código de pareamento e
                  execute seus fluxos.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus data-icon="inline-start" />
                  Criar conexão
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((instance) => {
                const isConnected =
                  instance.status === "connected"
                  || instance.connectionState === "open"
                const isBusy = busyId === instance.instanceName

                return (
                  <Card key={instance.instanceName}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="size-4 text-primary" />
                        {instance.instanceName}
                      </CardTitle>
                      <CardDescription>
                        {instance.phoneNumber || instance.authMethod}
                      </CardDescription>
                      <CardAction>
                        <ConnectionStatus instance={instance} />
                      </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      {instance.qrCode ? (
                        <QrCode value={instance.qrCode} />
                      ) : null}
                      {instance.pairingCode ? (
                        <div className="rounded-xl bg-muted p-4 text-center">
                          <div className="mb-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Link2 className="size-3" />
                            Código de pareamento
                          </div>
                          <div className="font-mono text-2xl font-semibold tracking-[0.25em]">
                            {instance.pairingCode}
                          </div>
                        </div>
                      ) : null}
                      {!instance.qrCode && !instance.pairingCode ? (
                        <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                          {isConnected
                            ? "Instância pronta para executar fluxos."
                            : "Inicie a conexão para gerar as credenciais de acesso."}
                        </div>
                      ) : null}
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-1">
                      {!isConnected ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            void runAction(instance.instanceName, () =>
                              connectStudioInstance(instance.instanceName),
                            )
                          }
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <LoaderCircle
                              data-icon="inline-start"
                              className="animate-spin"
                            />
                          ) : (
                            <QrCodeIcon data-icon="inline-start" />
                          )}
                          Conectar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void runAction(instance.instanceName, () =>
                              restartStudioInstance(instance.instanceName),
                            )
                          }
                          disabled={isBusy}
                        >
                          <RefreshCw data-icon="inline-start" />
                          Reiniciar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void runAction(instance.instanceName, () =>
                            logoutStudioInstance(instance.instanceName),
                          )
                        }
                        disabled={isBusy}
                      >
                        <LogOut data-icon="inline-start" />
                        Sair
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="destructive"
                        aria-label="Excluir conexão"
                        onClick={() => {
                          if (!window.confirm("Excluir esta conexão?")) return
                          void runAction(instance.instanceName, () =>
                            deleteStudioInstance(instance.instanceName),
                          )
                        }}
                        disabled={isBusy}
                      >
                        <Trash2 />
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </section>
          )}
        </div>
      </main>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Nova conexão</SheetTitle>
            <SheetDescription>
              Crie uma instância isolada do BerryProtocol.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="instance-name">Nome da instância</FieldLabel>
                <Input
                  id="instance-name"
                  autoFocus
                  value={name}
                  placeholder="comercial-01"
                  onChange={(event) => setName(event.target.value)}
                />
                <FieldDescription>
                  Use um nome estável, sem dados do número do cliente.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Método de autenticação</FieldLabel>
                <Select
                  value={authMethod}
                  onValueChange={(value) => setAuthMethod(value as AuthMethod)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="qr">QR code</SelectItem>
                      <SelectItem value="pairing_code">Código de pareamento</SelectItem>
                      <SelectItem value="link">Link device</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              {authMethod === "pairing_code" ? (
                <Field>
                  <FieldLabel htmlFor="instance-phone">Telefone</FieldLabel>
                  <Input
                    id="instance-phone"
                    value={phoneNumber}
                    placeholder="5511999999999"
                    onChange={(event) => setPhoneNumber(event.target.value)}
                  />
                </Field>
              ) : null}
            </FieldGroup>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void create()}
              disabled={
                busyId === "creating"
                || !name.trim()
                || (authMethod === "pairing_code" && !phoneNumber.trim())
              }
            >
              <Plus data-icon="inline-start" />
              {busyId === "creating" ? "Criando…" : "Criar instância"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

function ConnectionStatus({ instance }: { instance: StudioInstance }) {
  if (
    instance.status === "connected"
    || instance.connectionState === "open"
  ) {
    return <Badge>Conectada</Badge>
  }
  if (
    instance.status === "connecting"
    || instance.status === "qr_pending"
    || instance.connectionState === "connecting"
  ) {
    return <Badge variant="secondary">Aguardando</Badge>
  }
  return <Badge variant="outline">Desconectada</Badge>
}

function QrCode({ value }: { value: string }) {
  const [source, setSource] = useState("")

  useEffect(() => {
    let active = true
    void QRCode.toDataURL(value, {
      margin: 2,
      width: 280,
      color: {
        dark: "#15111d",
        light: "#ffffff",
      },
    }).then((dataUrl) => {
      if (active) setSource(dataUrl)
    })
    return () => {
      active = false
    }
  }, [value])

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-background p-4 text-center text-foreground">
      {source ? (
        <img
          src={source}
          alt="QR code para conectar o WhatsApp"
          className="aspect-square w-full max-w-56"
        />
      ) : (
        <Skeleton className="aspect-square w-full max-w-56" />
      )}
      <p className="text-xs">WhatsApp › Aparelhos conectados › Conectar aparelho</p>
    </div>
  )
}
