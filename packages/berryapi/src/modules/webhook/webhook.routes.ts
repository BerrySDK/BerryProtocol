import type { FastifyInstance } from "fastify";
import { createRouteSchema } from "../../docs/schema.js";
import type { InstanceManager } from "../../managers/InstanceManager.js";
import { WebhookController } from "./webhook.controller.js";
import { WebhookService } from "./webhook.service.js";
import { instanceNameParamsSchema, setWebhookBodySchema } from "./webhook.validators.js";

export const registerWebhookRoutes = async (
  app: any,
  manager: InstanceManager,
) => {
  const controller = new WebhookController(new WebhookService(manager));

  app.post("/webhook/set/:instanceName", {
    schema: createRouteSchema({
      tags: ["Webhook"],
      summary: "Set webhook",
      params: instanceNameParamsSchema,
      body: setWebhookBodySchema,
      example: {
        enabled: true,
        url: "https://example.com/webhook",
        events: ["messages.upsert", "connection.update"],
      },
    }),
  }, controller.set);

  app.get("/webhook/find/:instanceName", {
    schema: createRouteSchema({
      tags: ["Webhook"],
      summary: "Find webhook",
      params: instanceNameParamsSchema,
    }),
  }, controller.find);
};
