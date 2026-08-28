import type { FastifyInstance } from "fastify";
import { createRouteSchema } from "../../docs/schema.js";
import type { InstanceManager } from "../../managers/InstanceManager.js";
import { ChatController } from "./chat.controller.js";
import { ChatService } from "./chat.service.js";
import {
  base64BodySchema,
  blockStatusBodySchema,
  findContactsBodySchema,
  instanceNameParamsSchema,
  jidBodySchema,
  messageKeyBodySchema,
  presenceBodySchema,
  updateMessageBodySchema,
} from "./chat.validators.js";

export const registerChatRoutes = async (app: any, manager: InstanceManager) => {
  const controller = new ChatController(new ChatService(manager));

  const post = (
    path: string,
    summary: string,
    body: object,
    handler: any,
  ) => app.post(path, {
    schema: createRouteSchema({
      tags: ["Chat"],
      summary,
      params: instanceNameParamsSchema,
      body: body as never,
    }),
  }, handler);

  post("/chat/checkWhatsApp/:instanceName", "Check if JID looks like a WhatsApp identifier", jidBodySchema, controller.checkWhatsApp);
  post("/chat/markRead/:instanceName", "Mark chat as read", jidBodySchema, controller.markRead);
  post("/chat/markUnread/:instanceName", "Mark chat as unread", jidBodySchema, controller.markUnread);
  post("/chat/archive/:instanceName", "Archive chat", jidBodySchema, controller.archive);
  app.delete("/chat/deleteMessageForEveryone/:instanceName", {
    schema: createRouteSchema({
      tags: ["Chat"],
      summary: "Delete message for everyone",
      params: instanceNameParamsSchema,
      body: messageKeyBodySchema,
    }),
  }, controller.deleteMessageForEveryone);
  post("/chat/updateMessage/:instanceName", "Update chat message", updateMessageBodySchema, controller.updateMessage);
  post("/chat/sendPresence/:instanceName", "Send chat presence", presenceBodySchema, controller.sendPresence);
  post("/chat/updateBlockStatus/:instanceName", "Update block status", blockStatusBodySchema, controller.updateBlockStatus);
  post("/chat/fetchProfilePictureUrl/:instanceName", "Fetch profile picture URL", jidBodySchema, controller.fetchProfilePictureUrl);
  post("/chat/getBase64/:instanceName", "Convert file or URL to base64", base64BodySchema, controller.getBase64);
  post("/chat/findContacts/:instanceName", "Find contacts", findContactsBodySchema, controller.findContacts);
  post("/chat/findMessages/:instanceName", "Find messages", findContactsBodySchema, controller.findMessages);
  post("/chat/findStatusMessage/:instanceName", "Find status messages", findContactsBodySchema, controller.findStatusMessage);
  post("/chat/findChats/:instanceName", "Find chats", findContactsBodySchema, controller.findChats);
};
