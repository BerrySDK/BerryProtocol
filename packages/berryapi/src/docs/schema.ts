import type { ZodTypeAny } from "zod";
import { toOpenApiSchema } from "../utils/zod.js";

export const envelopeSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data: { type: "object", additionalProperties: true },
  },
};

export const errorEnvelopeSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", enum: [false] },
    message: { type: "string" },
    error: { type: "object", additionalProperties: true },
  },
};

export const createRouteSchema = ({
  tags,
  summary,
  description,
  params,
  body,
  querystring,
  example,
}: {
  tags: string[];
  summary: string;
  description?: string;
  params?: ZodTypeAny;
  body?: ZodTypeAny;
  querystring?: ZodTypeAny;
  example?: unknown;
}) => ({
  tags,
  summary,
  description,
  ...(params ? { params: toOpenApiSchema(params, `${summary}Params`) } : {}),
  ...(body ? { body: { ...toOpenApiSchema(body, `${summary}Body`), ...(example ? { examples: [example] } : {}) } } : {}),
  ...(querystring ? { querystring: toOpenApiSchema(querystring, `${summary}Query`) } : {}),
  response: {
    200: envelopeSchema,
    201: envelopeSchema,
    400: errorEnvelopeSchema,
    401: errorEnvelopeSchema,
    404: errorEnvelopeSchema,
    500: errorEnvelopeSchema,
  },
});
