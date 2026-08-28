import { z } from "zod";
import { instanceNameParamsSchema } from "../instance/instance.validators.js";

export { instanceNameParamsSchema };

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

export const setWebhookBodySchema = z.object({
  enabled: z.boolean().default(true),
  url: z.string().url(),
  events: z.array(eventNameSchema).default([]),
  headers: z.record(z.string(), z.string()).optional(),
});
