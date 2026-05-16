import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import websocket from "@fastify/websocket";
import { env } from "./config/env.js";
import { initDatabase } from "./database/init.js";
import { createRouteSchema } from "./docs/schema.js";
import { InstanceManager } from "./managers/InstanceManager.js";
import { authMiddleware } from "./middlewares/auth.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { RealtimeGateway } from "./realtime/RealtimeGateway.js";
import { logger } from "./utils/logger.js";
import { successResponse } from "./utils/response.js";
import { registerInstanceRoutes } from "./modules/instance/instance.routes.js";
import { registerWebhookRoutes } from "./modules/webhook/webhook.routes.js";
import { registerSettingsRoutes } from "./modules/settings/settings.routes.js";
import { registerMessageRoutes } from "./modules/message/routes/message.routes.js";
import { registerChatRoutes } from "./modules/chat/chat.routes.js";
import { registerProfileRoutes } from "./modules/profile/profile.routes.js";
import { registerGroupRoutes } from "./modules/group/group.routes.js";
import { WebhookDispatcher } from "./webhook/WebhookDispatcher.js";

export const buildApp = async () => {
  await initDatabase();

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
    bodyLimit: 50 * 1024 * 1024,
  });

  const realtime = new RealtimeGateway();
  const webhooks = new WebhookDispatcher();
  const manager = new InstanceManager(realtime, webhooks);
  await manager.bootstrap();

  await app.register(cors, {
    origin: true,
  });
  await app.register(websocket);
  await app.register(swagger, {
    openapi: {
      info: {
        title: "BerryAPI",
        description: "REST API for WhatsApp Web automation powered by BerryProtocol.",
        version: "0.1.0",
      },
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
    },
  });
  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  realtime.register(app);

  app.setErrorHandler(errorHandler);
  app.addHook("onRequest", authMiddleware);

  app.get("/", {
    schema: createRouteSchema({
      tags: ["System"],
      summary: "BerryAPI health entrypoint",
      description: "Quick health response for BerryAPI.",
    }),
  }, async () => successResponse("BerryAPI is running.", {
    name: "BerryAPI",
    provider: "BerryProtocol",
    docs: "/docs",
    websocket: env.BERRY_WS_PATH,
  }));

  app.get("/info", {
    schema: createRouteSchema({
      tags: ["System"],
      summary: "BerryAPI information",
    }),
  }, async () => successResponse("BerryAPI metadata loaded.", {
    name: "BerryAPI",
    version: "0.1.0",
    environment: env.NODE_ENV,
    websocketPath: env.BERRY_WS_PATH,
    database: env.DATABASE_URL,
    authFolder: env.BERRY_AUTH_FOLDER,
    provider: "BerryProtocol",
  }));

  await registerInstanceRoutes(app, manager);
  await registerWebhookRoutes(app, manager);
  await registerSettingsRoutes(app, manager);
  await registerMessageRoutes(app, manager);
  await registerChatRoutes(app, manager);
  await registerProfileRoutes(app, manager);
  await registerGroupRoutes(app, manager);

  return app;
};
