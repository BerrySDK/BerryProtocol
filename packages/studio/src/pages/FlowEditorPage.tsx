import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { AppShell } from "@/components/flow/AppShell"
import { FlowBuilder } from "@/components/flow/FlowBuilder"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { getStudioFlow, type StudioFlow } from "@/lib/studio-api"

export default function FlowEditorPage() {
  const navigate = useNavigate()
  const { flowId = "" } = useParams()
  const [flow, setFlow] = useState<StudioFlow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const nextFlow = await getStudioFlow(flowId)
        if (!active) return
        if (!nextFlow) {
          navigate("/")
          return
        }
        setFlow(nextFlow)
      } catch (loadError) {
        if (!active) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar o fluxo.",
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    if (flowId) void load()
    return () => {
      active = false
    }
  }, [flowId, navigate])

  return (
    <AppShell>
      {loading ? (
        <main className="flex min-h-0 flex-1 flex-col gap-3 p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="min-h-0 flex-1 w-full" />
        </main>
      ) : error ? (
        <main className="flex flex-1 items-center justify-center p-6">
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Não foi possível abrir o fluxo</EmptyTitle>
              <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </main>
      ) : flow ? (
        <FlowBuilder
          flowId={flow.id}
          initialName={flow.name}
          initialGraph={flow.graph}
        />
      ) : null}
    </AppShell>
  )
}
