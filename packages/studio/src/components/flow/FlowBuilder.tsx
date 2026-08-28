import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"
import {
  FileText,
  Maximize2,
  Plus,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  getStudioCapabilities,
  publishStudioFlow,
  updateStudioFlow,
  validateStudioFlow,
  type StudioCapabilities,
  type StudioFlowGraph,
  type StudioFlowTrigger,
} from "@/lib/studio-api"

import { AnalysisView } from "./AnalysisView"
import { BlockMenu } from "./BlockMenu"
import {
  BLOCK_META,
  BlockNode,
  type BlockKind,
  type BlockNodeData,
} from "./BlockNode"
import { ConstructorView } from "./ConstructorView"
import { EditPanel } from "./EditPanel"
import { FlowTestPanel } from "./FlowTestPanel"
import { FlowTriggerPanel } from "./FlowTriggerPanel"
import { Topbar, type FlowTab } from "./Topbar"
import { VariablesView, type FlowVariable } from "./VariablesView"

const nodeTypes = Object.fromEntries(
  (Object.keys(BLOCK_META) as BlockKind[]).map((kind) => [kind, BlockNode]),
)

const normalizeTrigger = (value: unknown): StudioFlowTrigger => {
  const trigger =
    value && typeof value === "object"
      ? (value as Partial<StudioFlowTrigger>)
      : {}
  return {
    enabled: Boolean(trigger.enabled),
    instanceName: String(trigger.instanceName ?? ""),
    keywords: Array.isArray(trigger.keywords)
      ? trigger.keywords.map(String)
      : [],
    matchMode: trigger.matchMode ?? "contains",
    caseSensitive: Boolean(trigger.caseSensitive),
  }
}

const defaultData = (kind: BlockKind): BlockNodeData => {
  switch (kind) {
    case "start":
      return { kind, label: "Início" }
    case "message":
      return {
        kind,
        label: "Mensagem",
        messageType: "sendText",
        capabilityLabel: "Texto",
        payload: { text: "Olá, {{contactName}}! Como posso ajudar?" },
      }
    case "action":
      return {
        kind,
        label: "Ação",
        messageType: "sendReaction",
        capabilityLabel: "Reação",
        payload: { emoji: "👍", targetMessageId: "{{lastMessageId}}" },
      }
    case "input":
      return {
        kind,
        label: "Capturar resposta",
        prompt: "Digite sua resposta:",
        variableName: "resposta",
      }
    case "condition":
      return {
        kind,
        label: "Condição",
        variable: "resposta",
        operator: "equals",
        value: "sim",
      }
    case "setVariable":
      return {
        kind,
        label: "Definir variável",
        key: "segmento",
        value: "novo_lead",
      }
    case "delay":
      return { kind, label: "Aguardar", delayMs: 1000 }
    case "end":
      return { kind, label: "Fim" }
    case "note":
      return { kind, label: "Nota", text: "" }
  }
}

const defaultGraph = (): StudioFlowGraph => {
  const startId = crypto.randomUUID()
  const messageId = crypto.randomUUID()
  const endId = crypto.randomUUID()

  return {
    nodes: [
      { id: startId, type: "start", position: { x: 80, y: 220 }, data: defaultData("start") },
      { id: messageId, type: "message", position: { x: 440, y: 220 }, data: defaultData("message") },
      { id: endId, type: "end", position: { x: 800, y: 220 }, data: defaultData("end") },
    ],
    edges: [
      { id: `edge-${startId}-${messageId}`, source: startId, target: messageId, sourceHandle: "next" },
      { id: `edge-${messageId}-${endId}`, source: messageId, target: endId, sourceHandle: "next" },
    ],
    viewport: {},
  }
}

const migrateLegacyNode = (node: Node): Node => {
  const sourceData = node.data as Record<string, unknown>
  const rawKind = node.type === "block" ? sourceData.kind : node.type
  const kind = (
    typeof rawKind === "string" && rawKind in BLOCK_META ? rawKind : "message"
  ) as BlockKind
  const base = defaultData(kind)

  if (node.type === "block" && kind === "message") {
    return {
      ...node,
      type: "message",
      data: {
        ...base,
        ...sourceData,
        kind: "message",
        messageType: String(sourceData.messageType ?? "sendText"),
        capabilityLabel: String(sourceData.capabilityLabel ?? "Texto"),
        payload:
          sourceData.payload && typeof sourceData.payload === "object"
            ? sourceData.payload
            : { text: String(sourceData.text ?? "") },
      },
    }
  }

  if (node.type === "block" && kind === "input") {
    return {
      ...node,
      type: "input",
      data: {
        ...base,
        ...sourceData,
        kind,
        prompt: String(sourceData.prompt ?? sourceData.text ?? ""),
      },
    }
  }

  return {
    ...node,
    type: kind,
    data: {
      ...base,
      ...sourceData,
      kind,
    },
  }
}

const normalizeGraph = (graph?: StudioFlowGraph) => {
  const source = graph?.nodes?.length ? graph : defaultGraph()
  return {
    nodes: source.nodes.map(migrateLegacyNode),
    edges: source.edges ?? [],
    viewport: source.viewport ?? {},
  }
}

function Canvas({
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodesChange,
  onEdgesChange,
  capabilities,
}: {
  nodes: Node[]
  edges: Edge[]
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  onNodesChange: ReturnType<typeof useNodesState>[2]
  onEdgesChange: ReturnType<typeof useEdgesState>[2]
  capabilities: StudioCapabilities | null
}) {
  const [menu, setMenu] = useState<{
    x: number
    y: number
    sourceId?: string
    sourceHandle?: string
    flowPosition?: { x: number; y: number }
  } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow()

  const onConnect = useCallback(
    (connection: Connection) => {
      const source = nodes.find((node) => node.id === connection.source)
      const target = nodes.find((node) => node.id === connection.target)
      const sourceKind = (source?.data as unknown as BlockNodeData | undefined)?.kind
      const targetKind = (target?.data as unknown as BlockNodeData | undefined)?.kind
      if (sourceKind === "note" || targetKind === "note") return
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: crypto.randomUUID(),
            type: "default",
          },
          current,
        ),
      )
    },
    [nodes, setEdges],
  )

  const addBlock = useCallback(
    (
      kind: BlockKind,
      position: { x: number; y: number },
      sourceId?: string,
      sourceHandle?: string,
    ) => {
      const id = crypto.randomUUID()
      setNodes((current) => [
        ...current,
        {
          id,
          type: kind,
          position,
          data: defaultData(kind),
        },
      ])
      if (sourceId && kind !== "note") {
        setEdges((current) =>
          addEdge(
            {
              id: crypto.randomUUID(),
              source: sourceId,
              target: id,
              sourceHandle: sourceHandle ?? "next",
              type: "default",
            },
            current,
          ),
        )
      }
      if (kind !== "start" && kind !== "end") setEditingId(id)
    },
    [setEdges, setNodes],
  )

  const duplicateNode = useCallback(
    (id: string) => {
      const node = nodes.find((item) => item.id === id)
      if (!node) return
      setNodes((current) => [
        ...current,
        {
          ...node,
          id: crypto.randomUUID(),
          position: { x: node.position.x + 48, y: node.position.y + 48 },
          data: structuredClone(node.data),
          selected: false,
        },
      ])
    },
    [nodes, setNodes],
  )

  const deleteNode = useCallback(
    (id: string) => {
      const node = nodes.find((item) => item.id === id)
      const kind = (node?.data as unknown as BlockNodeData | undefined)?.kind
      if (kind === "start") return
      setNodes((current) => current.filter((item) => item.id !== id))
      setEdges((current) =>
        current.filter((edge) => edge.source !== id && edge.target !== id),
      )
      setEditingId((current) => (current === id ? null : current))
    },
    [nodes, setEdges, setNodes],
  )

  const updateNodeData = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, ...patch } }
            : node,
        ),
      )
    },
    [setNodes],
  )

  const decoratedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onAdd: (id: string, handle?: string) => {
            const source = nodes.find((item) => item.id === id)
            if (!source) return
            setMenu({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
              sourceId: id,
              sourceHandle: handle,
              flowPosition: {
                x: source.position.x + 380,
                y: source.position.y,
              },
            })
          },
          onEdit: setEditingId,
          onDuplicate: duplicateNode,
          onDelete: deleteNode,
        },
      })),
    [deleteNode, duplicateNode, nodes],
  )

  const editingNode = editingId
    ? nodes.find((node) => node.id === editingId) ?? null
    : null

  return (
    <div ref={wrapperRef} className="relative size-full">
      <ReactFlow
        nodes={decoratedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          const kind = (node.data as unknown as BlockNodeData).kind
          if (kind !== "start" && kind !== "end") setEditingId(node.id)
        }}
        onPaneClick={() => {
          setEditingId(null)
          setMenu(null)
        }}
        onPaneContextMenu={(event) => {
          event.preventDefault()
          setMenu({
            x: event.clientX,
            y: event.clientY,
            flowPosition: screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            }),
          })
        }}
        fitView
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "default" }}
        style={{ background: "var(--canvas)" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.4}
          color="var(--canvas-dot)"
        />
      </ReactFlow>

      <Card
        size="sm"
        className="absolute right-4 top-4 flex-row gap-1 p-1 shadow-lg"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Adicionar bloco"
          onClick={(event) =>
            setMenu({
              x: event.clientX,
              y: event.clientY,
              flowPosition: screenToFlowPosition({
                x: event.clientX - 280,
                y: event.clientY + 120,
              }),
            })
          }
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Adicionar nota"
          onClick={() => {
            const rect = wrapperRef.current?.getBoundingClientRect()
            addBlock(
              "note",
              screenToFlowPosition({
                x: (rect?.left ?? 0) + 220,
                y: (rect?.top ?? 0) + 160,
              }),
            )
          }}
        >
          <FileText />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Aumentar zoom" onClick={() => void zoomIn()}>
          <ZoomIn />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Diminuir zoom" onClick={() => void zoomOut()}>
          <ZoomOut />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Enquadrar fluxo"
          onClick={() => void fitView({ padding: 0.18, duration: 300 })}
        >
          <Maximize2 />
        </Button>
      </Card>

      {menu ? (
        <BlockMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onPick={(kind) =>
            addBlock(
              kind,
              menu.flowPosition
                ?? screenToFlowPosition({ x: menu.x, y: menu.y }),
              menu.sourceId,
              menu.sourceHandle,
            )
          }
        />
      ) : null}

      {editingNode ? (
        <EditPanel
          node={editingNode}
          messageCapabilities={capabilities?.messageCapabilities ?? []}
          actionCapabilities={capabilities?.actionCapabilities ?? []}
          conditionOperators={capabilities?.conditionOperators ?? []}
          onClose={() => setEditingId(null)}
          onUpdateNodeData={updateNodeData}
          onDelete={deleteNode}
        />
      ) : null}
    </div>
  )
}

export function FlowBuilder({
  flowId,
  initialName,
  initialGraph,
}: {
  flowId: string
  initialName: string
  initialGraph: StudioFlowGraph
}) {
  const normalizedInitial = useMemo(
    () => normalizeGraph(initialGraph),
    [initialGraph],
  )
  const [nodes, setNodes, onNodesChange] = useNodesState(normalizedInitial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    normalizedInitial.edges,
  )
  const [capabilities, setCapabilities] = useState<StudioCapabilities | null>(null)
  const [tab, setTab] = useState<FlowTab>("fluxo")
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(initialName)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [testOpen, setTestOpen] = useState(false)
  const [triggerOpen, setTriggerOpen] = useState(false)
  const [trigger, setTrigger] = useState<StudioFlowTrigger>(
    normalizeTrigger(normalizedInitial.viewport.trigger),
  )
  const [variables, setVariables] = useState<FlowVariable[]>(
    Array.isArray(normalizedInitial.viewport.variables)
      ? (normalizedInitial.viewport.variables as FlowVariable[])
      : [],
  )

  const past = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([])
  const future = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([])
  const skipHistory = useRef(false)
  const skipDirty = useRef(true)

  useEffect(() => {
    void getStudioCapabilities()
      .then(setCapabilities)
      .catch((error) =>
        setFeedback(
          error instanceof Error
            ? error.message
            : "Falha ao carregar métodos da API.",
        ),
      )
  }, [])

  useEffect(() => {
    const graph = normalizeGraph(initialGraph)
    skipDirty.current = true
    setNodes(graph.nodes)
    setEdges(graph.edges)
    setName(initialName)
    setVariables(
      Array.isArray(graph.viewport.variables)
        ? (graph.viewport.variables as FlowVariable[])
        : [],
    )
    setTrigger(normalizeTrigger(graph.viewport.trigger))
    setSaved(true)
    setFeedback(null)
    past.current = [{ nodes: graph.nodes, edges: graph.edges }]
    future.current = []
  }, [flowId, initialGraph, initialName, setEdges, setNodes])

  useEffect(() => {
    if (skipHistory.current) {
      skipHistory.current = false
      return
    }
    past.current.push({ nodes, edges })
    if (past.current.length > 50) past.current.shift()
    future.current = []
  }, [edges, nodes])

  useEffect(() => {
    if (skipDirty.current) {
      skipDirty.current = false
      return
    }
    setSaved(false)
  }, [edges, name, nodes, trigger, variables])

  const undo = () => {
    if (past.current.length < 2) return
    const current = past.current.pop()
    if (!current) return
    future.current.push(current)
    const previous = past.current[past.current.length - 1]
    skipHistory.current = true
    setNodes(previous.nodes)
    setEdges(previous.edges)
  }

  const redo = () => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(next)
    skipHistory.current = true
    setNodes(next.nodes)
    setEdges(next.edges)
  }

  const graph = useMemo<StudioFlowGraph>(
    () => ({
      nodes: nodes.map((node) => ({
        ...node,
        data: Object.fromEntries(
          Object.entries(node.data).filter(([key]) => !key.startsWith("on")),
        ),
      })),
      edges,
      viewport: { variables, trigger },
    }),
    [edges, nodes, trigger, variables],
  )

  const validate = async () => {
    setFeedback("Validando fluxo…")
    try {
      const result = await validateStudioFlow(graph)
      const detail = result.valid
        ? `${result.warnings.length} aviso(s)`
        : `${result.errors.length} erro(s)`
      setFeedback(result.valid ? `Fluxo válido · ${detail}` : `Fluxo inválido · ${detail}`)
      return result
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha na validação.")
      return null
    }
  }

  const saveDraft = async () => {
    setSaving(true)
    setFeedback("Salvando rascunho…")
    try {
      await updateStudioFlow(flowId, { name: name.trim() || "Fluxo sem nome", graph })
      setSaved(true)
      setFeedback("Rascunho salvo.")
      return true
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao salvar.")
      return false
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    setSaving(true)
    setFeedback("Validando antes de publicar…")
    try {
      const validation = await validateStudioFlow(graph)
      if (!validation.valid) {
        setFeedback(`Corrija ${validation.errors.length} erro(s) antes de publicar.`)
        return
      }
      await updateStudioFlow(flowId, { name: name.trim() || "Fluxo sem nome", graph })
      await publishStudioFlow(flowId)
      setSaved(true)
      setFeedback(
        validation.warnings.length
          ? `Publicado com ${validation.warnings.length} aviso(s).`
          : "Fluxo publicado com sucesso.",
      )
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao publicar.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Topbar
        active={tab}
        onChange={setTab}
        name={name}
        onRename={setName}
        onSave={() => void saveDraft()}
        onPublish={() => void publish()}
        onTest={() => setTestOpen(true)}
        onTrigger={() => setTriggerOpen(true)}
        onValidate={() => void validate()}
        onUndo={undo}
        onRedo={redo}
        saved={saved}
        saving={saving}
        feedback={feedback}
      />

      <div className="relative min-h-0 flex-1">
        {tab === "fluxo" ? (
          <ReactFlowProvider>
            <Canvas
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              capabilities={capabilities}
            />
          </ReactFlowProvider>
        ) : null}

        {tab === "construtor" ? (
          <ConstructorView
            nodes={nodes}
            edges={edges}
            onEdit={(id) => {
              setTab("fluxo")
              window.setTimeout(() => {
                setNodes((current) =>
                  current.map((node) => ({ ...node, selected: node.id === id })),
                )
              }, 0)
            }}
            onDelete={(id) => {
              setNodes((current) => current.filter((node) => node.id !== id))
              setEdges((current) =>
                current.filter((edge) => edge.source !== id && edge.target !== id),
              )
            }}
          />
        ) : null}

        {tab === "variaveis" ? (
          <VariablesView vars={variables} onChange={setVariables} />
        ) : null}
        {tab === "analise" ? (
          <AnalysisView flowId={flowId} flowName={name} />
        ) : null}
      </div>

      <FlowTestPanel
        open={testOpen}
        onOpenChange={setTestOpen}
        flowId={flowId}
        graph={graph}
      />
      <FlowTriggerPanel
        open={triggerOpen}
        onOpenChange={setTriggerOpen}
        trigger={trigger}
        onChange={setTrigger}
      />
    </>
  )
}
