import type { FastifyInstance } from "fastify";
import { createRouteSchema } from "../../docs/schema.js";
import type { InstanceManager } from "../../managers/InstanceManager.js";
import { SettingsController } from "./settings.controller.js";
import { SettingsService } from "./settings.service.js";
import { instanceNameParamsSchema, setSettingsBodySchema } from "./settings.validators.js";

export const registerSettingsRoutes = async (
  app: any,
  manager: InstanceManager,
) => {
  const controller = new SettingsController(new SettingsService(manager));

  app.post("/settings/set/:instanceName", {
    schema: createRouteSchema({
      tags: ["Settings"],
      summary: "Set settings",
      params: instanceNameParamsSchema,
      body: setSettingsBodySchema,
    }),
  }, controller.set);

  app.get("/settings/find/:instanceName", {
    schema: createRouteSchema({
      tags: ["Settings"],
      summary: "Find settings",
      params: instanceNameParamsSchema,
    }),
  }, controller.find);
};
