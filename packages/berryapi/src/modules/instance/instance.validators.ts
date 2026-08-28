import { z } from "zod";

const eventNameSchema = z.enum([
  "connection.update",
  "qrcode.updated",
  "messages.upsert",
  "messages.update",
  "messages.delete",
  "chats.update",
  "contacts.update",
  "groups.update",
  "presence.update",
  "send.message",
]);

export const instanceNameParamsSchema = z.object({
  instanceName: z.string().min(1),
});

export const createInstanceBodySchema = z.object({
  instanceName: z.string().min(1),
  authMethod: z.enum(["qr", "pairing_code", "link"]).default("qr"),
  phoneNumber: z.string().optional(),
  webhook: z
    .object({
      url: z.string().url().optional(),
      events: z.array(eventNameSchema).optional(),
    })
    .optional(),
  settings: z
    .object({
      rejectCall: z.boolean().optional(),
      readMessages: z.boolean().optional(),
      syncFullHistory: z.boolean().optional(),
    })
    .optional(),
});

export const setPresenceBodySchema = z.object({
  presence: z.enum(["available", "composing", "recording", "paused", "unavailable"]),
  jid: z.string().optional(),
});
