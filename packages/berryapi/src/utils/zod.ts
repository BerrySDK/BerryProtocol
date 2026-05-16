import type { ZodTypeAny } from "zod";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { HttpError } from "./http-error.js";

export const validateOrThrow = <T extends ZodTypeAny>(schema: T, payload: unknown): z.infer<T> => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new HttpError(400, "Validation failed", result.error.flatten());
  }

  return result.data;
};

export const toOpenApiSchema = (schema: ZodTypeAny, name: string) =>
  zodToJsonSchema(schema as any, {
    name,
    target: "openApi3",
    $refStrategy: "none",
  });
