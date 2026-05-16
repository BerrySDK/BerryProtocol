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

export const setSettingsBodySchema = z.object({
  rejectCall: z.boolean().optional(),
  readMessages: z.boolean().optional(),
  syncFullHistory: z.boolean().optional(),
  alwaysOnline: z.boolean().optional(),
  webhookByEvents: z.boolean().optional(),
  events: z.array(eventNameSchema).optional(),
});
