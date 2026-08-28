import { KeyRound, LoaderCircle, LogIn, ShieldCheck } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  clearStudioApiKey,
  getStudioApiKey,
  getStudioCapabilities,
  setStudioApiKey,
} from "@/lib/studio-api"

function consumeBootstrapApiKey() {
  const params = new URLSearchParams(window.location.search)
  const bootstrapApiKey = params.get("apiKey")?.trim() ?? ""

  if (!bootstrapApiKey) return getStudioApiKey()

  setStudioApiKey(bootstrapApiKey)
  params.delete("apiKey")

  const search = params.toString()
  window.history.replaceState(
    null,
    document.title,
    `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
  )

  return bootstrapApiKey
}

export function StudioAuthGate({ children }: { children: ReactNode }) {
  const [initialApiKey] = useState(consumeBootstrapApiKey)
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(Boolean(initialApiKey))
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialApiKey) return
    void getStudioCapabilities()
      .then(() => setAuthorized(true))
      .catch(() => {
        clearStudioApiKey()
        setError("A chave salva não é mais válida.")
      })
      .finally(() => setChecking(false))
  }, [initialApiKey])

  const connect = async () => {
    if (!apiKey.trim()) return
    setChecking(true)
    setError(null)
    setStudioApiKey(apiKey)
    try {
      await getStudioCapabilities()
      setAuthorized(true)
    } catch (connectError) {
      clearStudioApiKey()
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Não foi possível autenticar.",
      )
    } finally {
      setChecking(false)
    }
  }

  if (authorized) return children

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Badge variant="secondary" className="mb-2">
            <ShieldCheck />
            Acesso protegido
          </Badge>
          <CardTitle className="text-xl">Conectar ao Berry Studio</CardTitle>
          <CardDescription>
            Informe a mesma chave configurada em <code>API_KEY</code> na
            BerryAPI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="studio-api-key">Chave da API</FieldLabel>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="studio-api-key"
                  type="password"
                  value={apiKey}
                  aria-invalid={Boolean(error)}
                  autoFocus
                  className="pl-9"
                  placeholder="berryapi_dev_key"
                  onChange={(event) => setApiKey(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void connect()
                  }}
                />
              </div>
              <FieldDescription className={error ? "text-destructive" : undefined}>
                {error
                  ? error
                  : "A chave fica armazenada somente neste navegador."}
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={() => void connect()} disabled={checking || !apiKey.trim()}>
            {checking ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : (
              <LogIn data-icon="inline-start" />
            )}
            {checking ? "Verificando…" : "Entrar no Studio"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
