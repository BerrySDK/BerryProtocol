import type { Edge, Node } from "@xyflow/react";

export type StudioFlowGraph = {
  nodes: Node[];
  edges: Edge[];
  viewport?: Record<string, unknown>;
};

export type StudioFlowTrigger = {
  enabled: boolean;
  instanceName: string;
  keywords: string[];
  matchMode: "contains" | "exact" | "startsWith" | "any";
  caseSensitive: boolean;
};

export type StudioFieldDefinition = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "select" | "json";
  required?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
};

export type StudioCapability = {
  id: string;
  label: string;
  description: string;
  previewKind: string;
  fields: StudioFieldDefinition[];
};

export type StudioCapabilities = {
  nodeTypes: Array<{ id: string; label: string; description: string }>;
  conditionOperators: Array<{ label: string; value: string }>;
  messageCapabilities: StudioCapability[];
  actionCapabilities: StudioCapability[];
  defaultGraph: StudioFlowGraph;
};

export type FlowValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type FlowRunnerState = {
  status: "running" | "waiting_input" | "completed" | "failed";
  currentNodeId: string | null;
  waitingNodeId?: string | null;
  runId?: string | null;
  variables: Record<string, unknown>;
  transcript: Array<Record<string, unknown>>;
  logs: string[];
  validation?: FlowValidationResult;
};

export type FlowStats = {
  conversas: number;
  leads: number;
  conversao: number;
  blocos?: number;
  runs?: number;
  completed?: number;
  failed?: number;
};

export type StudioFlowMeta = {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  active: boolean;
  createdAt: number;
  updatedAt: number;
  stats: FlowStats;
};

export type StudioFlow = StudioFlowMeta & {
  graph: StudioFlowGraph;
  versions: Array<{ id: string; version_number: number; created_at: string }>;
};

export type StudioInstance = {
  instanceName: string;
  status: string;
  connectionState: string;
  authMethod: "qr" | "pairing_code" | "link";
  phoneNumber: string | null;
  qrCode: string | null;
  pairingCode: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type StudioAnalytics = {
  flowOptions: Array<{ id: string; name: string }>;
  periodDays: number;
  selectedFlowId: string;
  totals: {
    visitors: number;
    conversations: number;
    started: number;
    leads: number;
    conversions: number;
    failures: number;
    startRate: number;
    conversionRate: number;
  };
  activity: Array<{ label: string; value: number }>;
  perFlow: Array<{
    id: string;
    name: string;
    status: string;
    stats: FlowStats;
  }>;
};

export type StudioNotification = {
  id: string;
  type: "flow" | "connection" | "alert";
  title: string;
  body: string;
  createdAt: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

const API_KEY_STORAGE_KEY = "berry-studio-api-key";

export const getStudioApiKey = () =>
  window.localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";

export const setStudioApiKey = (apiKey: string) => {
  window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
};

export const clearStudioApiKey = () => {
  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
};

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const apiKey = getStudioApiKey();
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = (await response.json()) as ApiEnvelope<T> & { error?: unknown };
  if (!response.ok || !payload.success) {
    const message = typeof payload.message === "string" ? payload.message : `Request failed for ${path}`;
    throw new Error(message);
  }

  return payload.data;
};

const normalizeFlow = (raw: Record<string, unknown>): StudioFlow => ({
  id: String(raw.id),
  name: String(raw.name ?? "Untitled flow"),
  status: String(raw.status ?? "draft") as StudioFlow["status"],
  active: String(raw.status ?? "draft") === "published",
  createdAt: Date.parse(String(raw.created_at ?? raw.createdAt ?? new Date().toISOString())),
  updatedAt: Date.parse(String(raw.updated_at ?? raw.updatedAt ?? new Date().toISOString())),
  stats: (raw.stats as FlowStats | undefined) ?? {
    conversas: 0,
    leads: 0,
    conversao: 0,
  },
  graph: (raw.graph as StudioFlowGraph | undefined) ?? { nodes: [], edges: [] },
  versions: (raw.versions as StudioFlow["versions"] | undefined) ?? [],
});

export const listStudioFlows = async (): Promise<StudioFlowMeta[]> => {
  const items = await api<Array<Record<string, unknown>>>("/studio/api/flows");
  return items.map((item) => {
    const normalized = normalizeFlow(item);
    return {
      id: normalized.id,
      name: normalized.name,
      status: normalized.status,
      active: normalized.active,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
      stats: normalized.stats,
    };
  });
};

export const createStudioFlow = async (name: string): Promise<StudioFlow> => {
  const flow = await api<Record<string, unknown>>("/studio/api/flows", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return normalizeFlow(flow);
};

export const getStudioFlow = async (flowId: string): Promise<StudioFlow> => {
  const flow = await api<Record<string, unknown>>(`/studio/api/flows/${flowId}`);
  return normalizeFlow(flow);
};

export const updateStudioFlow = async (
  flowId: string,
  input: { name?: string; status?: "draft" | "published" | "archived"; graph: StudioFlowGraph },
): Promise<StudioFlow> => {
  const flow = await api<Record<string, unknown>>(`/studio/api/flows/${flowId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return normalizeFlow(flow);
};

export const setStudioFlowStatus = async (
  flowId: string,
  status: "draft" | "published" | "archived",
): Promise<StudioFlow> => {
  const flow = await api<Record<string, unknown>>(`/studio/api/flows/${flowId}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
  return normalizeFlow(flow);
};

export const publishStudioFlow = async (flowId: string): Promise<StudioFlow> => {
  const flow = await api<Record<string, unknown>>(`/studio/api/flows/${flowId}/publish`, {
    method: "POST",
  });
  return normalizeFlow(flow);
};

export const deleteStudioFlow = async (flowId: string): Promise<void> => {
  await api(`/studio/api/flows/${flowId}`, {
    method: "DELETE",
  });
};

export const duplicateStudioFlow = async (flowId: string): Promise<StudioFlow> => {
  const flow = await api<Record<string, unknown>>(`/studio/api/flows/${flowId}/duplicate`, {
    method: "POST",
  });
  return normalizeFlow(flow);
};

export const listStudioInstances = async (): Promise<StudioInstance[]> =>
  api<StudioInstance[]>("/studio/api/instances");

export const createStudioInstance = async (input: {
  instanceName: string;
  authMethod: "qr" | "pairing_code" | "link";
  phoneNumber?: string;
}): Promise<StudioInstance> =>
  api<StudioInstance>("/studio/api/instances", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const connectStudioInstance = async (instanceName: string): Promise<StudioInstance> =>
  api<StudioInstance>(`/studio/api/instances/${encodeURIComponent(instanceName)}/connect`, {
    method: "POST",
  });

export const restartStudioInstance = async (instanceName: string): Promise<StudioInstance> =>
  api<StudioInstance>(`/studio/api/instances/${encodeURIComponent(instanceName)}/restart`, {
    method: "POST",
  });

export const logoutStudioInstance = async (instanceName: string): Promise<StudioInstance> =>
  api<StudioInstance>(`/studio/api/instances/${encodeURIComponent(instanceName)}/logout`, {
    method: "POST",
  });

export const deleteStudioInstance = async (instanceName: string): Promise<void> => {
  await api(`/studio/api/instances/${encodeURIComponent(instanceName)}`, {
    method: "DELETE",
  });
};

export const getStudioAnalytics = async (flowId?: string, days?: number): Promise<StudioAnalytics> => {
  const params = new URLSearchParams();
  if (flowId && flowId !== "all") {
    params.set("flowId", flowId);
  }
  if (days) {
    params.set("days", String(days));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return api<StudioAnalytics>(`/studio/api/analytics${suffix}`);
};

export const resetStudioAnalytics = async (flowId?: string) =>
  api<{ flowId: string | null; deletedRuns: number }>("/studio/api/analytics/reset", {
    method: "POST",
    body: JSON.stringify(flowId ? { flowId } : {}),
  });

export const listStudioNotifications = async (): Promise<StudioNotification[]> =>
  api<StudioNotification[]>("/studio/api/notifications");

export const getStudioCapabilities = async (): Promise<StudioCapabilities> =>
  api<StudioCapabilities>("/studio/api/capabilities");

export const validateStudioFlow = async (
  flow: StudioFlowGraph,
): Promise<FlowValidationResult> =>
  api<FlowValidationResult>("/studio/api/flows/validate", {
    method: "POST",
    body: JSON.stringify({ flow }),
  });

export const startStudioSimulation = async (input: {
  flowId: string;
  flow: StudioFlowGraph;
  variables?: Record<string, unknown>;
  contact?: { jid?: string; name?: string };
}): Promise<FlowRunnerState> =>
  api<FlowRunnerState>("/studio/api/simulate/start", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const continueStudioSimulation = async (input: {
  flowId: string;
  flow: StudioFlowGraph;
  state: FlowRunnerState;
  inputText: string;
}): Promise<FlowRunnerState> =>
  api<FlowRunnerState>("/studio/api/simulate/continue", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const startStudioExecution = async (input: {
  flowId: string;
  flow: StudioFlowGraph;
  instanceName: string;
  variables?: Record<string, unknown>;
  contact?: { jid?: string; name?: string };
}): Promise<FlowRunnerState> =>
  api<FlowRunnerState>("/studio/api/execute/start", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const continueStudioExecution = async (input: {
  flowId: string;
  flow: StudioFlowGraph;
  instanceName: string;
  state: FlowRunnerState;
  inputText: string;
}): Promise<FlowRunnerState> =>
  api<FlowRunnerState>("/studio/api/execute/continue", {
    method: "POST",
    body: JSON.stringify(input),
  });
