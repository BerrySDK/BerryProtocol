import { z } from "zod";

const jsonRecordSchema = z.record(z.string(), z.unknown());

const flowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: jsonRecordSchema.default({}),
});

const flowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const flowGraphSchema = z.object({
  nodes: z.array(flowNodeSchema).default([]),
  edges: z.array(flowEdgeSchema).default([]),
  viewport: jsonRecordSchema.optional(),
});

export const createFlowBodySchema = z.object({
  name: z.string().min(1),
  graph: flowGraphSchema.optional(),
});

export const updateFlowBodySchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  graph: flowGraphSchema,
});

export const updateFlowStatusBodySchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});

export const flowIdParamsSchema = z.object({
  flowId: z.string().min(1),
});

export const simulateStartBodySchema = z.object({
  flowId: z.string().min(1).optional(),
  flow: flowGraphSchema,
  variables: jsonRecordSchema.optional(),
  contact: z.object({
    jid: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
});

export const simulateContinueBodySchema = z.object({
  flowId: z.string().min(1).optional(),
  flow: flowGraphSchema,
  state: z.object({
    status: z.enum(["running", "waiting_input", "completed", "failed"]),
    currentNodeId: z.string().nullable(),
    waitingNodeId: z.string().nullable().optional(),
    runId: z.string().nullable().optional(),
    variables: jsonRecordSchema.default({}),
    transcript: z.array(jsonRecordSchema).default([]),
    logs: z.array(z.string()).default([]),
  }),
  inputText: z.string(),
});

export const studioInstanceBodySchema = z.object({
  instanceName: z.string().min(1),
  authMethod: z.enum(["qr", "pairing_code", "link"]).default("qr"),
  phoneNumber: z.string().optional(),
  settings: z.object({
    rejectCall: z.boolean().optional(),
    readMessages: z.boolean().optional(),
    syncFullHistory: z.boolean().optional(),
  }).optional(),
});

export const instanceNameOnlyParamsSchema = z.object({
  instanceName: z.string().min(1),
});

export const validateFlowBodySchema = z.object({
  flow: flowGraphSchema,
});

export const executeStartBodySchema = simulateStartBodySchema.extend({
  instanceName: z.string().min(1),
});

export const executeContinueBodySchema = simulateContinueBodySchema.extend({
  instanceName: z.string().min(1),
});
