import { z } from "zod";
import { instanceNameParamsSchema } from "../message/validators/message.validators.js";

export { instanceNameParamsSchema };

export const jidBodySchema = z.object({
  jid: z.string().min(1),
});

export const messageKeyBodySchema = z.object({
  remoteJid: z.string().min(1),
  messageId: z.string().min(1),
  fromMe: z.boolean().default(true),
  participant: z.string().optional(),
});

export const updateMessageBodySchema = z.object({
  jid: z.string().min(1),
  messageId: z.string().min(1),
  text: z.string().min(1),
});

export const presenceBodySchema = z.object({
  jid: z.string().optional(),
  presence: z.enum(["available", "composing", "recording", "paused", "unavailable"]),
});

export const blockStatusBodySchema = z.object({
  jid: z.string().min(1),
  action: z.enum(["block", "unblock"]),
});

export const findContactsBodySchema = z.object({
  query: z.string().optional(),
});

export const base64BodySchema = z.object({
  url: z.string().url().optional(),
  path: z.string().optional(),
}).refine((value) => value.url || value.path, "url or path is required.");
