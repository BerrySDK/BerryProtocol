import { randomUUID } from "node:crypto";
import { sqlite } from "../../database/client.js";
import type { InstanceManager } from "../../managers/InstanceManager.js";
import type { ProviderEventPayload } from "../../providers/whatsapp/WhatsAppProvider.js";
import { MessageService } from "../message/services/message.service.js";
import {
  studioConditionOperators,
  studioMessageCapabilities,
  studioNodeTypes,
} from "./flow.catalog.js";

type FlowGraph = {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  viewport?: Record<string, unknown>;
};

type SimulatorState = {
  status: "running" | "waiting_input" | "completed" | "failed";
  currentNodeId: string | null;
  waitingNodeId?: string | null;
  runId?: string | null;
  variables: Record<string, unknown>;
  transcript: Array<Record<string, unknown>>;
  logs: string[];
};

type StudioNotification = {
  id: string;
  type: "flow" | "connection" | "alert";
  title: string;
  body: string;
  createdAt: number;
};

type FlowStatsSummary = {
  conversas: number;
  leads: number;
  conversao: number;
  blocos: number;
  runs: number;
  completed: number;
  failed: number;
};

type StudioFlowListItem = {
  id: string;
  name: string;
  status: string;
  draft_version_id: string | null;
  published_version_id: string | null;
  created_at: string;
  updated_at: string;
  stats: FlowStatsSummary;
};

type FlowValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

type DispatchContext = {
  instanceName: string;
};

type FlowTrigger = {
  enabled?: boolean;
  instanceName?: string;
  keywords?: string[];
  matchMode?: "contains" | "exact" | "startsWith" | "any";
  caseSensitive?: boolean;
};

type IncomingFlowEvent = {
  instanceName: string;
  contactJid: string;
  contactName: string;
  inputText: string;
};

type FlowRecord = {
  id: string;
  name: string;
  status: string;
  draft_version_id: string | null;
  published_version_id: string | null;
  canvas_json: string;
  created_at: string;
  updated_at: string;
};

const now = () => new Date().toISOString();

const emptyGraph = (): FlowGraph => ({
  nodes: [
    {
      id: "start-1",
      type: "start",
      position: { x: 120, y: 160 },
      data: {
        label: "Start",
      },
    },
    {
      id: "end-1",
      type: "end",
      position: { x: 440, y: 160 },
      data: {
        label: "End",
      },
    },
  ],
  edges: [
    {
      id: "edge-start-end",
      source: "start-1",
      target: "end-1",
    },
  ],
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
});

const safeJsonParse = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const renderTemplate = (value: string, variables: Record<string, unknown>): string =>
  value.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
    const resolved = variables[key.trim()];
    return resolved == null ? "" : String(resolved);
  });

const parseStructuredValue = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
    || (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
};

const getNodeKind = (node: FlowGraph["nodes"][number]) => {
  if (node.type === "block") {
    const rawKind = node.data.kind;
    return typeof rawKind === "string" ? rawKind : "message";
  }

  return node.type;
};

const renderPayloadValue = (
  value: unknown,
  variables: Record<string, unknown>,
): unknown => {
  if (typeof value === "string") {
    return parseStructuredValue(renderTemplate(value, variables));
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderPayloadValue(item, variables));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        renderPayloadValue(item, variables),
      ]),
    );
  }

  return value;
};

const normalizePayload = (
  payload: Record<string, unknown>,
  variables: Record<string, unknown>,
): Record<string, unknown> =>
  renderPayloadValue(payload, variables) as Record<string, unknown>;

export class FlowService {
  private readonly messageService?: MessageService;

  constructor(private readonly manager?: InstanceManager) {
    this.messageService = manager ? new MessageService(manager) : undefined;
    if (manager && typeof manager.onProviderEvent === "function") {
      manager.onProviderEvent((event) => this.handleProviderEvent(event));
    }
  }

  getCapabilities() {
    return {
      nodeTypes: studioNodeTypes,
      conditionOperators: studioConditionOperators,
      messageCapabilities: studioMessageCapabilities,
      actionCapabilities: studioMessageCapabilities.filter((capability) =>
        ["sendReply", "sendForward", "delete", "edit", "sendReaction"].includes(capability.id)
      ),
      defaultGraph: emptyGraph(),
    };
  }

  async listInstances() {
    if (!this.manager) {
      return [];
    }

    return (await this.manager.fetchInstances()).map((instance) => ({
      instanceName: instance.instanceName,
      status: instance.status,
      connectionState: instance.connectionState,
      authMethod: instance.authMethod,
      phoneNumber: instance.phoneNumber ?? null,
      qrCode: instance.qrCode ?? null,
      pairingCode: instance.pairingCode ?? null,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
    }));
  }

  async createInstance(input: {
    instanceName: string;
    authMethod?: "qr" | "pairing_code" | "link";
    phoneNumber?: string;
    settings?: Record<string, unknown>;
  }) {
    if (!this.manager) {
      throw new Error("Instance manager is not available.");
    }

    return this.manager.createInstance(input);
  }

  async connectInstance(instanceName: string) {
    if (!this.manager) {
      throw new Error("Instance manager is not available.");
    }

    return this.manager.connectInstance(instanceName);
  }

  async restartInstance(instanceName: string) {
    if (!this.manager) {
      throw new Error("Instance manager is not available.");
    }

    return this.manager.restartInstance(instanceName);
  }

  async logoutInstance(instanceName: string) {
    if (!this.manager) {
      throw new Error("Instance manager is not available.");
    }

    return this.manager.logoutInstance(instanceName);
  }

  async deleteInstance(instanceName: string) {
    if (!this.manager) {
      throw new Error("Instance manager is not available.");
    }

    await this.manager.deleteInstance(instanceName);
  }

  listFlows(): StudioFlowListItem[] {
    const statement = sqlite.prepare(`
      SELECT id, name, status, draft_version_id, published_version_id, created_at, updated_at
      FROM flows
      ORDER BY updated_at DESC
    `);

    return (statement.all() as Array<Record<string, unknown>>).map((flow) => ({
      ...flow,
      stats: this.getFlowStats(String(flow.id)),
    })) as StudioFlowListItem[];
  }

  createFlow(input: { name: string; graph?: FlowGraph }) {
    const timestamp = now();
    const flowId = randomUUID();
    const versionId = randomUUID();
    const graph = input.graph ?? emptyGraph();

    sqlite.prepare(`
      INSERT INTO flows (id, name, status, draft_version_id, published_version_id, canvas_json, created_at, updated_at)
      VALUES (?, ?, 'draft', ?, NULL, ?, ?, ?)
    `).run(flowId, input.name, versionId, JSON.stringify(graph), timestamp, timestamp);

    sqlite.prepare(`
      INSERT INTO flow_versions (id, flow_id, version_number, graph_json, snapshot_json, created_at)
      VALUES (?, ?, 1, ?, ?, ?)
    `).run(versionId, flowId, JSON.stringify(graph), JSON.stringify({ name: input.name, status: "draft" }), timestamp);

    return this.getFlow(flowId);
  }

  getFlow(flowId: string) {
    const flow = sqlite.prepare(`
      SELECT id, name, status, draft_version_id, published_version_id, canvas_json, created_at, updated_at
      FROM flows
      WHERE id = ?
    `).get(flowId) as FlowRecord | undefined;

    if (!flow) {
      return null;
    }

    const versions = sqlite.prepare(`
      SELECT id, flow_id, version_number, created_at
      FROM flow_versions
      WHERE flow_id = ?
      ORDER BY version_number DESC
    `).all(flowId);

    return {
      ...flow,
      graph: safeJsonParse(flow.canvas_json, emptyGraph()),
      versions,
      stats: this.getFlowStats(flowId),
    };
  }

  updateFlow(flowId: string, input: { name?: string; status?: string; graph: FlowGraph }) {
    const existing = this.getFlow(flowId);
    if (!existing) {
      return null;
    }

    const versionCount = sqlite.prepare(`
      SELECT COUNT(*) as count
      FROM flow_versions
      WHERE flow_id = ?
    `).get(flowId) as { count: number };

    const versionId = randomUUID();
    const timestamp = now();
    const nextVersion = (versionCount?.count ?? 0) + 1;
    const name = input.name ?? String(existing.name);
    const status = input.status ?? String(existing.status);

    sqlite.prepare(`
      UPDATE flows
      SET name = ?, status = ?, draft_version_id = ?, canvas_json = ?, updated_at = ?
      WHERE id = ?
    `).run(name, status, versionId, JSON.stringify(input.graph), timestamp, flowId);

    sqlite.prepare(`
      INSERT INTO flow_versions (id, flow_id, version_number, graph_json, snapshot_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(versionId, flowId, nextVersion, JSON.stringify(input.graph), JSON.stringify({ name, status }), timestamp);

    return this.getFlow(flowId);
  }

  publishFlow(flowId: string) {
    const existing = this.getFlow(flowId);
    if (!existing) {
      return null;
    }

    const timestamp = now();
    sqlite.prepare(`
      UPDATE flows
      SET status = 'published', published_version_id = draft_version_id, updated_at = ?
      WHERE id = ?
    `).run(timestamp, flowId);

    return this.getFlow(flowId);
  }

  updateFlowStatus(flowId: string, status: "draft" | "published" | "archived") {
    const existing = this.getFlow(flowId);
    if (!existing) {
      return null;
    }

    sqlite.prepare(`
      UPDATE flows
      SET status = ?, published_version_id = CASE WHEN ? = 'published' THEN draft_version_id ELSE published_version_id END, updated_at = ?
      WHERE id = ?
    `).run(status, status, now(), flowId);

    return this.getFlow(flowId);
  }

  deleteFlow(flowId: string) {
    sqlite.prepare(`DELETE FROM flow_runs WHERE flow_id = ?`).run(flowId);
    sqlite.prepare(`DELETE FROM flow_versions WHERE flow_id = ?`).run(flowId);
    sqlite.prepare(`DELETE FROM flows WHERE id = ?`).run(flowId);
  }

  duplicateFlow(flowId: string) {
    const existing = this.getFlow(flowId);
    if (!existing) {
      return null;
    }

    return this.createFlow({
      name: `${String(existing.name)} (copy)`,
      graph: existing.graph as FlowGraph,
    });
  }

  getAnalytics(flowId?: string, days = 14) {
    const normalizedDays = Number.isFinite(days) && days > 0 ? Math.min(Math.max(days, 1), 90) : 14;
    const cutoff = new Date(Date.now() - normalizedDays * 24 * 60 * 60 * 1000).toISOString();
    const runs = (
      flowId
        ? sqlite.prepare(`
            SELECT id, flow_id, status, created_at
            FROM flow_runs
            WHERE flow_id = ? AND created_at >= ?
            ORDER BY created_at DESC
          `).all(flowId, cutoff)
        : sqlite.prepare(`
            SELECT id, flow_id, status, created_at
            FROM flow_runs
            WHERE created_at >= ?
            ORDER BY created_at DESC
          `).all(cutoff)
    ) as Array<{ id: string; flow_id: string; status: string; created_at: string }>;

    const flowOptions = this.listFlows().map((flow) => ({
      id: String(flow.id),
      name: String(flow.name),
    }));

    const totals = {
      visitors: runs.length,
      conversations: runs.length,
      started: runs.length,
      leads: runs.filter((run) => run.status === "waiting_input" || run.status === "completed").length,
      conversions: runs.filter((run) => run.status === "completed").length,
      failures: runs.filter((run) => run.status === "failed").length,
    };

    const startRate = totals.visitors ? Math.round((totals.started / totals.visitors) * 100) : 0;
    const conversionRate = totals.conversations ? Math.round((totals.conversions / totals.conversations) * 100) : 0;
    const labels = Array.from({ length: normalizedDays }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (normalizedDays - index - 1));
      return date.toISOString().slice(0, 10);
    });
    const activity = labels.map((label) => ({
      label,
      value: runs.filter((run) => run.created_at.slice(0, 10) === label).length,
    }));

    const perFlow = this.listFlows().map((flow) => ({
      id: String(flow.id),
      name: String(flow.name),
      status: String(flow.status),
      stats: this.getFlowStats(String(flow.id)),
    }));

    return {
      flowOptions,
      periodDays: normalizedDays,
      selectedFlowId: flowId ?? "all",
      totals: {
        ...totals,
        startRate,
        conversionRate,
      },
      activity,
      perFlow,
    };
  }

  resetAnalytics(flowId?: string) {
    if (flowId) {
      const info = sqlite.prepare(`DELETE FROM flow_runs WHERE flow_id = ?`).run(flowId);
      return { flowId, deletedRuns: info.changes };
    }

    const info = sqlite.prepare(`DELETE FROM flow_runs`).run();
    return { flowId: null, deletedRuns: info.changes };
  }

  async listNotifications(): Promise<StudioNotification[]> {
    const flows = this.listFlows();
    const instances = await this.listInstances();
    const recentFailedRuns = sqlite.prepare(`
      SELECT id, flow_id, status, created_at
      FROM flow_runs
      WHERE status = 'failed'
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 10
    `).all() as Array<{ id: string; flow_id: string; status: string; created_at: string }>;

    const notifications: StudioNotification[] = [
      ...instances.map((instance): StudioNotification => ({
        id: `instance:${instance.instanceName}`,
        type: instance.connectionState === "open" || instance.status === "connected" ? "connection" : "alert",
        title: `Instance ${instance.instanceName}`,
        body:
          instance.status === "connected"
            ? "Instance connected and ready to run flows."
            : `Current state: ${instance.connectionState}.`,
        createdAt: Date.parse(String(instance.updatedAt ?? now())),
      })),
      ...flows.slice(0, 10).map((flow) => ({
        id: `flow:${String(flow.id)}`,
        type: "flow" as const,
        title: String(flow.name),
        body: `Flow is currently ${String(flow.status)}.`,
        createdAt: Date.parse(String(flow.updated_at ?? now())),
      })),
      ...recentFailedRuns.map((run) => ({
        id: `run:${run.id}`,
        type: "alert" as const,
        title: "Flow execution failed",
        body: `A recent execution for flow ${run.flow_id} ended with failure.`,
        createdAt: Date.parse(run.created_at),
      })),
    ];

    return notifications.sort((left, right) => right.createdAt - left.createdAt).slice(0, 30);
  }

  validateFlow(flow: FlowGraph): FlowValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const knownNodeTypes = new Set(studioNodeTypes.map((node) => node.id));
    const knownCapabilities = new Map(studioMessageCapabilities.map((capability) => [capability.id, capability]));
    const nodeIds = new Set<string>();
    const startNodes = flow.nodes.filter((node) => {
      const kind = getNodeKind(node);
      return kind === "start" || node.data.isStart === true;
    });
    const endNodes = flow.nodes.filter((node) => getNodeKind(node) === "end");

    if (!startNodes.length) {
      errors.push("The flow must contain at least one start node.");
    }

    if (startNodes.length > 1) {
      warnings.push("More than one start node was found. Only the first start node will be used.");
    }

    if (!endNodes.length) {
      warnings.push("The flow does not contain an end node.");
    }

    const trigger = flow.viewport?.trigger as FlowTrigger | undefined;
    if (trigger?.enabled && !trigger.instanceName?.trim()) {
      errors.push("An enabled WhatsApp trigger needs an instance.");
    }

    if (
      trigger?.enabled
      && trigger.matchMode !== "any"
      && (!Array.isArray(trigger.keywords) || !trigger.keywords.some((keyword) => keyword.trim()))
    ) {
      warnings.push("The trigger has no keywords and will match every incoming message.");
    }

    for (const node of flow.nodes) {
      if (nodeIds.has(node.id)) {
        errors.push(`Node id '${node.id}' is duplicated.`);
      }
      nodeIds.add(node.id);

      const nodeKind = getNodeKind(node);

      if (!knownNodeTypes.has(nodeKind) && !["message", "media", "choice", "input", "delay", "pixel", "tags", "condition", "note", "end"].includes(nodeKind)) {
        errors.push(`Node '${node.id}' uses unknown type '${nodeKind}'.`);
        continue;
      }

      if ((nodeKind === "message" || nodeKind === "action") && node.type !== "block") {
        const messageType = String(node.data.messageType ?? "");
        const capability = knownCapabilities.get(messageType);
        if (!capability) {
          errors.push(`Node '${node.id}' uses unknown message capability '${messageType}'.`);
          continue;
        }

        for (const field of capability.fields.filter((field) => field.required)) {
          const value = (node.data.payload as Record<string, unknown> | undefined)?.[field.key];
          if (value === undefined || value === null || value === "") {
            errors.push(`Node '${node.id}' is missing required field '${field.label}'.`);
          }
        }
      }

      if (nodeKind === "message" && node.type === "block" && !String(node.data.text ?? "").trim()) {
        warnings.push(`Message block '${node.id}' is empty.`);
      }

      if (nodeKind === "choice") {
        const responses = Array.isArray(node.data.responses) ? node.data.responses : [];
        const choiceBlock = responses.find((response) => (response as Record<string, unknown>).kind === "choice") as Record<string, unknown> | undefined;
        const options = Array.isArray(choiceBlock?.options) ? choiceBlock.options : [];
        if (!options.length) {
          warnings.push(`Choice block '${node.id}' does not define any options.`);
        }
      }

      if (nodeKind === "input" && !node.data.variableName) {
        warnings.push(`Input node '${node.id}' does not define a variable name. It will default to lastInput.`);
      }

      if (nodeKind === "condition") {
        const hasTrue = flow.edges.some((edge) => edge.source === node.id && edge.sourceHandle === "true");
        const hasFalse = flow.edges.some((edge) => edge.source === node.id && edge.sourceHandle === "false");

        if (!hasTrue) {
          warnings.push(`Condition node '${node.id}' does not have a true branch.`);
        }

        if (!hasFalse) {
          warnings.push(`Condition node '${node.id}' does not have a false branch.`);
        }
      }
    }

    for (const edge of flow.edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge '${edge.id}' references missing source node '${edge.source}'.`);
      }

      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge '${edge.id}' references missing target node '${edge.target}'.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async simulateStart(
    flow: FlowGraph,
    variables?: Record<string, unknown>,
    contact?: { jid?: string; name?: string },
    flowId?: string,
  ) {
    const initialState: SimulatorState = {
      status: "running",
      currentNodeId: this.findStartNode(flow)?.id ?? null,
      waitingNodeId: null,
      runId: null,
      variables: {
        contactJid: contact?.jid ?? "5511999999999@s.whatsapp.net",
        contactName: contact?.name ?? "Cliente",
        flowId: flowId ?? null,
        ...(variables ?? {}),
      },
      transcript: [],
      logs: [],
    };

    return this.advance(flow, initialState);
  }

  async executeStart(
    flow: FlowGraph,
    instanceName: string,
    variables?: Record<string, unknown>,
    contact?: { jid?: string; name?: string },
    flowId?: string,
  ) {
    const validation = this.validateFlow(flow);
    if (!validation.valid) {
      return {
        status: "failed",
        currentNodeId: null,
        waitingNodeId: null,
        runId: null,
        variables: variables ?? {},
        transcript: [],
        logs: ["Flow validation failed before execution.", ...validation.errors],
        validation,
      };
    }

    const executionVariables: Record<string, unknown> = {
      contactJid: contact?.jid ?? "5511999999999@s.whatsapp.net",
      contactName: contact?.name ?? "Berry Contact",
      flowId: flowId ?? null,
      instanceName,
      ...(variables ?? {}),
    };
    const initialState: SimulatorState = {
      status: "running",
      currentNodeId: this.findStartNode(flow)?.id ?? null,
      waitingNodeId: null,
      runId: flowId ? this.createRun(flowId, "running", executionVariables) : null,
      variables: executionVariables,
      transcript: [],
      logs: [`Executing flow with instance '${instanceName}'.`],
    };

    const state = await this.advance(flow, initialState, {
      instanceName,
    });

    this.updateRun(initialState.runId, state);

    return {
      ...state,
      validation,
    };
  }

  async simulateContinue(flow: FlowGraph, state: SimulatorState, inputText: string, flowId?: string) {
    if (state.status !== "waiting_input" || !state.waitingNodeId) {
      return {
        ...state,
        logs: [...state.logs, "No pending input node to continue."],
      };
    }

    const waitingNode = this.findNode(flow, state.waitingNodeId);
    if (!waitingNode) {
      return {
        ...state,
        status: "failed",
        runId: state.runId ?? null,
        logs: [...state.logs, `Input node ${state.waitingNodeId} not found.`],
      };
    }

    const variableName = String(state.variables.waitingVariableName ?? waitingNode.data.variableName ?? "lastInput");
    const transcript = [
      ...state.transcript,
      {
        role: "user",
        type: "text",
        text: inputText,
      },
    ];

    const nextState = await this.advance(flow, {
      ...state,
      status: "running",
      currentNodeId: this.getNextNodeId(flow, waitingNode.id),
      waitingNodeId: null,
      variables: {
        ...state.variables,
        lastInput: inputText,
        [variableName]: inputText,
        flowId: flowId ?? state.variables.flowId,
      },
      transcript,
      logs: [...state.logs, `Captured input for ${variableName}.`],
    });
    this.updateRun(state.runId, nextState);
    return nextState;
  }

  async executeContinue(flow: FlowGraph, state: SimulatorState, inputText: string, instanceName: string, flowId?: string) {
    if (state.status !== "waiting_input" || !state.waitingNodeId) {
      return {
        ...state,
        logs: [...state.logs, "No pending input node to continue."],
      };
    }

    const waitingNode = this.findNode(flow, state.waitingNodeId);
    if (!waitingNode) {
      return {
        ...state,
        status: "failed",
        runId: state.runId ?? null,
        logs: [...state.logs, `Input node ${state.waitingNodeId} not found.`],
      };
    }

    const variableName = String(state.variables.waitingVariableName ?? waitingNode.data.variableName ?? "lastInput");
    const transcript = [
      ...state.transcript,
      {
        role: "user",
        type: "text",
        text: inputText,
      },
    ];

    const nextState = await this.advance(flow, {
      ...state,
      status: "running",
      currentNodeId: this.getNextNodeId(flow, waitingNode.id),
      waitingNodeId: null,
      variables: {
        ...state.variables,
        lastInput: inputText,
        [variableName]: inputText,
        flowId: flowId ?? state.variables.flowId,
      },
      transcript,
      logs: [...state.logs, `Captured input for ${variableName}.`],
    }, {
      instanceName,
    });
    this.updateRun(state.runId, nextState);
    return nextState;
  }

  private async advance(
    flow: FlowGraph,
    state: SimulatorState,
    dispatchContext?: DispatchContext,
  ): Promise<SimulatorState> {
    let cursor = state.currentNodeId;
    const transcript = [...state.transcript];
    const logs = [...state.logs];
    const variables = { ...state.variables };
    let guard = 0;

    while (cursor && guard < 100) {
      guard += 1;
      const node = this.findNode(flow, cursor);

      if (!node) {
        return {
          status: "failed",
          currentNodeId: null,
          waitingNodeId: null,
          variables,
          transcript,
          logs: [...logs, `Node ${cursor} not found.`],
        };
      }

      const nodeKind = getNodeKind(node);

      if (nodeKind === "start") {
        logs.push("Flow started.");
        cursor = this.getNextNodeId(flow, node.id);
        continue;
      }

      if (nodeKind === "note") {
        logs.push(`Note block ${node.id} skipped.`);
        cursor = this.getNextNodeId(flow, node.id);
        continue;
      }

      if (node.type === "message" || node.type === "action" || ["message", "media", "choice"].includes(nodeKind)) {
        const executable = node.type === "block"
          ? this.buildStudioBlockMessage(node, variables)
          : {
              messageType: String(node.data.messageType ?? "sendText"),
              payload: normalizePayload(
                (node.data.payload as Record<string, unknown>) ?? {},
                variables,
              ),
              previewKind: studioMessageCapabilities.find((item) => item.id === String(node.data.messageType ?? "sendText"))?.previewKind ?? "text",
              waitForInput: false,
              variableName: null,
            };

        const { messageType, payload, previewKind } = executable;
        const payloadRecord = payload as Record<string, unknown>;

        if (dispatchContext) {
          try {
            const dispatchPayload = {
              to: String(payloadRecord.to ?? variables.contactJid ?? ""),
              ...payloadRecord,
            };
            const response = await this.dispatchMessageAction(
              dispatchContext.instanceName,
              messageType,
              dispatchPayload,
            );

            if (response && typeof response === "object" && "messageId" in (response as Record<string, unknown>)) {
              variables.lastMessageId = (response as Record<string, unknown>).messageId;
            }
          } catch (error) {
            return {
              status: "failed",
              currentNodeId: node.id,
              waitingNodeId: null,
              variables,
              transcript,
              logs: [
                ...logs,
                `Failed to execute ${messageType} on node ${node.id}: ${
                  error instanceof Error ? error.message : "unknown error"
                }`,
              ],
            };
          }
        }

        transcript.push({
          role: "assistant",
          type: messageType,
          previewKind,
          payload: payloadRecord,
        });
        logs.push(`Executed ${messageType}.`);

        if (executable.waitForInput) {
          logs.push(`Waiting for input on node ${node.id}.`);
          return {
            status: "waiting_input",
            currentNodeId: node.id,
            waitingNodeId: node.id,
            runId: state.runId ?? null,
            variables: {
              ...variables,
              waitingVariableName: executable.variableName ?? "lastInput",
            },
            transcript,
            logs,
          };
        }

        cursor = this.getNextNodeId(flow, node.id);
        continue;
      }

      if (nodeKind === "setVariable") {
        const key = String(node.data.key ?? "variable");
        const value = renderTemplate(String(node.data.value ?? ""), variables);
        variables[key] = parseStructuredValue(value);
        logs.push(`Variable ${key} updated.`);
        cursor = this.getNextNodeId(flow, node.id);
        continue;
      }

      if (nodeKind === "tags") {
        const rawTags = Array.isArray(node.data.tags)
          ? node.data.tags
          : String(node.data.text ?? "")
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean);
        variables.tags = rawTags;
        logs.push(`Tags updated with ${rawTags.length} item(s).`);
        cursor = this.getNextNodeId(flow, node.id);
        continue;
      }

      if (nodeKind === "pixel") {
        const eventName = String(node.data.eventName ?? node.data.text ?? "pixel_event");
        variables.lastPixelEvent = eventName;
        transcript.push({
          role: "system",
          type: "pixel",
          eventName,
        });
        logs.push(`Pixel event '${eventName}' registered.`);
        cursor = this.getNextNodeId(flow, node.id);
        continue;
      }

      if (nodeKind === "delay") {
        const requestedDelayMs = Number(node.data.delayMs ?? node.data.seconds ?? 1000);
        const delayMs = Number.isFinite(requestedDelayMs)
          ? Math.min(Math.max(requestedDelayMs, 0), 60_000)
          : 1000;
        transcript.push({
          role: "system",
          type: "delay",
          delayMs,
        });
        if (dispatchContext && delayMs > 0) {
          logs.push(`Waiting ${delayMs}ms before the next node.`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          logs.push(`Delay marker ${delayMs}ms.`);
        }
        cursor = this.getNextNodeId(flow, node.id);
        continue;
      }

      if (nodeKind === "input") {
        const prompt = renderTemplate(
          String(node.data.prompt ?? node.data.text ?? "Waiting for user input"),
          variables,
        );
        const variableName = String(node.data.variableName ?? "lastInput");
        if (prompt) {
          if (dispatchContext) {
            try {
              await this.dispatchMessageAction(
                dispatchContext.instanceName,
                "sendText",
                {
                  to: String(variables.contactJid ?? ""),
                  text: prompt,
                },
              );
            } catch (error) {
              return {
                status: "failed",
                currentNodeId: node.id,
                waitingNodeId: null,
                runId: state.runId ?? null,
                variables,
                transcript,
                logs: [
                  ...logs,
                  `Failed to send input prompt on node ${node.id}: ${
                    error instanceof Error ? error.message : "unknown error"
                  }`,
                ],
              };
            }
          }

          transcript.push({
            role: "assistant",
            type: "input_prompt",
            previewKind: "text",
            payload: {
              text: prompt,
            },
          });
        }

        logs.push(`Waiting for input on node ${node.id}.`);
        return {
          status: "waiting_input",
          currentNodeId: node.id,
          waitingNodeId: node.id,
          runId: state.runId ?? null,
          variables: {
            ...variables,
            waitingVariableName: variableName,
          },
          transcript,
          logs: [...logs, `Input will be stored in ${variableName}.`],
        };
      }

      if (nodeKind === "condition") {
        const result = this.evaluateCondition(node.data, variables);
        logs.push(`Condition ${node.id} resolved to ${result ? "true" : "false"}.`);
        cursor = this.getNextNodeId(flow, node.id, result ? "true" : "false")
          ?? this.getNextNodeId(flow, node.id);
        continue;
      }

      if (nodeKind === "end") {
        logs.push("Flow completed.");
        return {
          status: "completed",
          currentNodeId: node.id,
          waitingNodeId: null,
          runId: state.runId ?? null,
          variables,
          transcript,
          logs,
        };
      }

      logs.push(`Unknown node type ${nodeKind}, skipping.`);
      cursor = this.getNextNodeId(flow, node.id);
    }

    if (guard >= 100) {
      logs.push("Execution stopped after reaching the safety limit.");
    }

    return {
      status: cursor ? "failed" : "completed",
      currentNodeId: cursor,
      waitingNodeId: null,
      runId: state.runId ?? null,
      variables,
      transcript,
      logs,
    };
  }

  private async handleProviderEvent(event: ProviderEventPayload): Promise<void> {
    if (event.event !== "messages.upsert") {
      return;
    }

    const incoming = this.extractIncomingFlowEvent(event);
    if (!incoming) {
      return;
    }

    const resumed = await this.resumeWaitingRun(incoming);
    if (!resumed) {
      await this.startTriggeredFlow(incoming);
    }
  }

  private extractIncomingFlowEvent(
    event: ProviderEventPayload,
  ): IncomingFlowEvent | null {
    const rawPayload = Array.isArray(event.payload)
      ? event.payload[0]
      : event.payload;
    if (!rawPayload || typeof rawPayload !== "object") {
      return null;
    }

    const envelope = rawPayload as Record<string, unknown>;
    const rawMessage =
      envelope.message && typeof envelope.message === "object"
        ? envelope.message as Record<string, unknown>
        : envelope;
    const key =
      rawMessage.key && typeof rawMessage.key === "object"
        ? rawMessage.key as Record<string, unknown>
        : envelope.key && typeof envelope.key === "object"
          ? envelope.key as Record<string, unknown>
          : {};
    const nestedContent =
      rawMessage.message && typeof rawMessage.message === "object"
        ? rawMessage.message as Record<string, unknown>
        : {};
    const extendedText =
      nestedContent.extendedTextMessage
      && typeof nestedContent.extendedTextMessage === "object"
        ? nestedContent.extendedTextMessage as Record<string, unknown>
        : {};
    const fromMe = Boolean(
      rawMessage.fromMe
      ?? envelope.fromMe
      ?? key.fromMe,
    );
    if (fromMe) {
      return null;
    }

    const firstString = (...values: unknown[]) =>
      values.find((value): value is string =>
        typeof value === "string" && value.trim().length > 0
      )?.trim();

    const contactJid = firstString(
      rawMessage.from,
      rawMessage.chatId,
      rawMessage.remoteJid,
      envelope.from,
      envelope.chatId,
      envelope.remoteJid,
      key.remoteJid,
    );
    const inputText = firstString(
      rawMessage.buttonId,
      rawMessage.selectedId,
      rawMessage.listRowId,
      rawMessage.text,
      rawMessage.body,
      envelope.buttonId,
      envelope.selectedId,
      envelope.text,
      envelope.body,
      nestedContent.conversation,
      extendedText.text,
    );

    if (!contactJid || !inputText || contactJid === "status@broadcast") {
      return null;
    }

    return {
      instanceName: event.instanceName,
      contactJid,
      contactName: firstString(
        rawMessage.pushName,
        rawMessage.senderName,
        envelope.pushName,
        envelope.senderName,
      ) ?? "Contato WhatsApp",
      inputText,
    };
  }

  private async resumeWaitingRun(
    incoming: IncomingFlowEvent,
  ): Promise<boolean> {
    const waitingRuns = sqlite.prepare(`
      SELECT id, flow_id, flow_version_id, current_node_id, variables_json, history_json
      FROM flow_runs
      WHERE status = 'waiting_input'
      ORDER BY updated_at DESC
      LIMIT 200
    `).all() as Array<{
      id: string;
      flow_id: string;
      flow_version_id: string | null;
      current_node_id: string | null;
      variables_json: string;
      history_json: string;
    }>;

    const waitingRun = waitingRuns.find((run) => {
      const variables = safeJsonParse<Record<string, unknown>>(
        run.variables_json,
        {},
      );
      return variables.instanceName === incoming.instanceName
        && variables.contactJid === incoming.contactJid;
    });

    if (!waitingRun) {
      return false;
    }

    const variables = safeJsonParse<Record<string, unknown>>(
      waitingRun.variables_json,
      {},
    );
    const graph = this.loadRunGraph(
      waitingRun.flow_id,
      waitingRun.flow_version_id,
    );
    if (!graph) {
      return false;
    }

    await this.executeContinue(
      graph,
      {
        status: "waiting_input",
        currentNodeId: waitingRun.current_node_id,
        waitingNodeId: waitingRun.current_node_id,
        runId: waitingRun.id,
        variables,
        transcript: safeJsonParse<Array<Record<string, unknown>>>(
          waitingRun.history_json,
          [],
        ),
        logs: ["Flow resumed from an incoming WhatsApp message."],
      },
      incoming.inputText,
      incoming.instanceName,
      waitingRun.flow_id,
    );

    return true;
  }

  private async startTriggeredFlow(
    incoming: IncomingFlowEvent,
  ): Promise<boolean> {
    const publishedFlows = sqlite.prepare(`
      SELECT id, published_version_id, canvas_json
      FROM flows
      WHERE status = 'published'
      ORDER BY updated_at DESC
    `).all() as Array<{
      id: string;
      published_version_id: string | null;
      canvas_json: string;
    }>;

    for (const flow of publishedFlows) {
      const graph = this.loadRunGraph(flow.id, flow.published_version_id)
        ?? safeJsonParse<FlowGraph>(flow.canvas_json, emptyGraph());
      const trigger = graph.viewport?.trigger as FlowTrigger | undefined;
      if (!this.triggerMatches(trigger, incoming)) {
        continue;
      }

      await this.executeStart(
        graph,
        incoming.instanceName,
        {
          lastInput: incoming.inputText,
          triggerText: incoming.inputText,
          instanceName: incoming.instanceName,
        },
        {
          jid: incoming.contactJid,
          name: incoming.contactName,
        },
        flow.id,
      );
      return true;
    }

    return false;
  }

  private triggerMatches(
    trigger: FlowTrigger | undefined,
    incoming: IncomingFlowEvent,
  ): boolean {
    if (
      !trigger?.enabled
      || !trigger.instanceName
      || trigger.instanceName !== incoming.instanceName
    ) {
      return false;
    }

    const keywords = Array.isArray(trigger.keywords)
      ? trigger.keywords.map((keyword) => keyword.trim()).filter(Boolean)
      : [];
    if (trigger.matchMode === "any" || !keywords.length) {
      return true;
    }

    const normalize = (value: string) =>
      trigger.caseSensitive ? value : value.toLocaleLowerCase();
    const input = normalize(incoming.inputText);

    return keywords.some((keyword) => {
      const expected = normalize(keyword);
      if (trigger.matchMode === "exact") {
        return input === expected;
      }
      if (trigger.matchMode === "startsWith") {
        return input.startsWith(expected);
      }
      return input.includes(expected);
    });
  }

  private loadRunGraph(
    flowId: string,
    flowVersionId: string | null,
  ): FlowGraph | null {
    if (flowVersionId) {
      const version = sqlite.prepare(`
        SELECT graph_json
        FROM flow_versions
        WHERE id = ? AND flow_id = ?
      `).get(flowVersionId, flowId) as { graph_json: string } | undefined;
      if (version) {
        return safeJsonParse<FlowGraph>(version.graph_json, emptyGraph());
      }
    }

    const flow = sqlite.prepare(`
      SELECT canvas_json
      FROM flows
      WHERE id = ?
    `).get(flowId) as { canvas_json: string } | undefined;
    return flow
      ? safeJsonParse<FlowGraph>(flow.canvas_json, emptyGraph())
      : null;
  }

  private evaluateCondition(nodeData: Record<string, unknown>, variables: Record<string, unknown>): boolean {
    const variableKey = String(nodeData.variable ?? "lastInput");
    const operator = String(nodeData.operator ?? "equals");
    const expectedRaw = renderTemplate(String(nodeData.value ?? ""), variables);
    const actual = variables[variableKey];
    const actualString = actual == null ? "" : String(actual);

    switch (operator) {
      case "equals":
        return actualString === expectedRaw;
      case "notEquals":
        return actualString !== expectedRaw;
      case "contains":
        return actualString.includes(expectedRaw);
      case "startsWith":
        return actualString.startsWith(expectedRaw);
      case "endsWith":
        return actualString.endsWith(expectedRaw);
      case "regex":
        return new RegExp(expectedRaw).test(actualString);
      case "exists":
        return actual !== undefined && actual !== null && actualString.length > 0;
      case "gt":
        return Number(actual) > Number(expectedRaw);
      case "lt":
        return Number(actual) < Number(expectedRaw);
      default:
        return false;
    }
  }

  private findStartNode(flow: FlowGraph) {
    return flow.nodes.find((node) => getNodeKind(node) === "start" || node.data.isStart === true) ?? flow.nodes[0];
  }

  private findNode(flow: FlowGraph, nodeId: string) {
    return flow.nodes.find((node) => node.id === nodeId);
  }

  private getNextNodeId(flow: FlowGraph, nodeId: string, handle?: string) {
    if (handle) {
      const handledEdge = flow.edges.find((edge) => edge.source === nodeId && edge.sourceHandle === handle);
      if (handledEdge) {
        return handledEdge.target;
      }
    }

    return flow.edges.find((edge) => edge.source === nodeId)?.target ?? null;
  }

  private buildStudioBlockMessage(node: FlowGraph["nodes"][number], variables: Record<string, unknown>) {
    const nodeKind = getNodeKind(node);
    const renderedText = renderTemplate(String(node.data.text ?? ""), variables);

    if (nodeKind === "choice") {
      const responses = Array.isArray(node.data.responses) ? node.data.responses : [];
      const choiceBlock = responses.find((response) => (response as Record<string, unknown>).kind === "choice") as Record<string, unknown> | undefined;
      const options = Array.isArray(choiceBlock?.options) ? choiceBlock.options as Array<Record<string, unknown>> : [];

      return {
        messageType: "sendButtons",
        previewKind: "buttons",
        payload: {
          text: renderedText || "Choose one option",
          buttons: options.map((option, index) => ({
            id: String(option.id ?? `option-${index + 1}`),
            title: String(option.label ?? `Option ${index + 1}`),
            type: "reply",
          })),
        },
        waitForInput: true,
        variableName: String(node.data.variableName ?? "lastChoice"),
      };
    }

    if (nodeKind === "media") {
      const payload = normalizePayload((node.data.payload as Record<string, unknown>) ?? {}, variables);
      const mediaType = String(node.data.mediaType ?? payload.mediaType ?? "sendImage");
      return {
        messageType: mediaType,
        previewKind: mediaType.includes("Video") ? "video" : mediaType.includes("Audio") ? "audio" : "image",
        payload: {
          caption: renderedText || payload.caption,
          ...payload,
        },
        waitForInput: false,
        variableName: null,
      };
    }

    return {
      messageType: "sendText",
      previewKind: "text",
      payload: {
        text: renderedText,
      },
      waitForInput: false,
      variableName: null,
    };
  }

  private getFlowStats(flowId: string): FlowStatsSummary {
    const flow = sqlite.prepare(`
      SELECT canvas_json
      FROM flows
      WHERE id = ?
    `).get(flowId) as { canvas_json: string } | undefined;

    const graph = safeJsonParse(flow?.canvas_json, emptyGraph());
    const runs = sqlite.prepare(`
      SELECT status
      FROM flow_runs
      WHERE flow_id = ?
    `).all(flowId) as Array<{ status: string }>;
    const conversations = runs.length;
    const leads = runs.filter((run) => run.status === "waiting_input" || run.status === "completed").length;
    const conversions = runs.filter((run) => run.status === "completed").length;

    return {
      conversas: conversations,
      leads,
      conversao: conversations ? Math.round((conversions / conversations) * 100) : 0,
      blocos: graph.nodes.length,
      runs: conversations,
      completed: conversions,
      failed: runs.filter((run) => run.status === "failed").length,
    };
  }

  private createRun(flowId: string, status: string, variables: Record<string, unknown>) {
    const runId = randomUUID();
    const timestamp = now();
    const flow = sqlite.prepare(`
      SELECT published_version_id, draft_version_id
      FROM flows
      WHERE id = ?
    `).get(flowId) as {
      published_version_id: string | null;
      draft_version_id: string | null;
    } | undefined;
    const flowVersionId = flow?.published_version_id ?? flow?.draft_version_id ?? null;
    sqlite.prepare(`
      INSERT INTO flow_runs (id, flow_id, flow_version_id, status, current_node_id, variables_json, history_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, NULL, ?, '[]', ?, ?)
    `).run(
      runId,
      flowId,
      flowVersionId,
      status,
      JSON.stringify(variables),
      timestamp,
      timestamp,
    );
    return runId;
  }

  private updateRun(
    runId: string | null | undefined,
    state: Pick<SimulatorState, "status" | "currentNodeId" | "variables" | "transcript">,
  ) {
    if (!runId) {
      return;
    }

    sqlite.prepare(`
      UPDATE flow_runs
      SET status = ?, current_node_id = ?, variables_json = ?, history_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      state.status,
      state.currentNodeId,
      JSON.stringify(state.variables),
      JSON.stringify(state.transcript),
      now(),
      runId,
    );
  }

  private async dispatchMessageAction(
    instanceName: string,
    messageType: string,
    payload: Record<string, unknown>,
  ) {
    if (!this.messageService) {
      throw new Error("Message service is not available.");
    }

    const messageMethodMap: Record<string, keyof MessageService> = {
      sendText: "sendText",
      sendExtendedText: "sendExtendedText",
      sendReply: "sendReply",
      sendForward: "sendForward",
      delete: "deleteMessage",
      edit: "editMessage",
      sendReaction: "sendReaction",
      sendImage: "sendImage",
      sendVideo: "sendVideo",
      sendAudio: "sendAudio",
      sendWhatsAppAudio: "sendAudio",
      sendDocument: "sendDocument",
      sendSticker: "sendSticker",
      sendGif: "sendGif",
      sendMedia: "sendImage",
      sendButtons: "sendButtons",
      sendTemplateButtons: "sendTemplateButtons",
      sendCTAButton: "sendCTAButton",
      sendCopyButton: "sendCopyButton",
      sendList: "sendList",
      sendCarousel: "sendCarousel",
      sendAiText: "sendAiText",
      sendAiCarousel: "sendAiCarousel",
      sendPoll: "sendPoll",
      sendLocation: "sendLocation",
      sendLiveLocation: "sendLiveLocation",
      sendContact: "sendContact",
      sendContacts: "sendContacts",
      sendStatus: "sendStatus",
      sendViewOnceImage: "sendViewOnceImage",
      sendViewOnceVideo: "sendViewOnceVideo",
      sendProduct: "sendProduct",
      sendCatalog: "sendCatalog",
      sendCollection: "sendCollection",
    };

    const methodName = messageMethodMap[messageType];
    if (!methodName) {
      throw new Error(`Unsupported message capability '${messageType}'.`);
    }

    const method = (this.messageService as unknown as Record<string, unknown>)[String(methodName)];
    if (typeof method !== "function") {
      throw new Error(`Mapped service method '${String(methodName)}' is not available.`);
    }

    return Reflect.apply(
      method as (...args: unknown[]) => Promise<unknown>,
      this.messageService,
      [instanceName, payload],
    );
  }
}
