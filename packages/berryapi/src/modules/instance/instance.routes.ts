import type { FastifyInstance } from "fastify";
import type { InstanceManager } from "../../managers/InstanceManager.js";
import { InstanceService } from "./instance.service.js";
import { InstanceController } from "./instance.controller.js";
import { createRouteSchema } from "../../docs/schema.js";
import {
  createInstanceBodySchema,
  instanceNameParamsSchema,
  setPresenceBodySchema,
} from "./instance.validators.js";

export const registerInstanceRoutes = async (
  app: any,
  manager: InstanceManager,
) => {
    const controller = new InstanceController(new InstanceService(manager));

    app.post(
      "/instance/create",
      {
        schema: createRouteSchema({
          tags: ["Instances"],
          summary: "Create instance",
          body: createInstanceBodySchema,
          example: {
            instanceName: "store-01",
            authMethod: "qr",
            settings: { rejectCall: true },
          },
        }),
      },
      controller.create,
    );

    app.get("/instance/fetch", {
      schema: createRouteSchema({
        tags: ["Instances"],
        summary: "Fetch instances",
      }),
    }, controller.fetch);

    app.get("/instance/connect/:instanceName", {
      schema: createRouteSchema({
        tags: ["Instances"],
        summary: "Connect instance",
        params: instanceNameParamsSchema,
      }),
    }, controller.connect);

    app.put("/instance/restart/:instanceName", {
      schema: createRouteSchema({
        tags: ["Instances"],
        summary: "Restart instance",
        params: instanceNameParamsSchema,
      }),
    }, controller.restart);

    app.get("/instance/connectionState/:instanceName", {
      schema: createRouteSchema({
        tags: ["Instances"],
        summary: "Get connection state",
        params: instanceNameParamsSchema,
      }),
    }, controller.connectionState);

    app.delete("/instance/logout/:instanceName", {
      schema: createRouteSchema({
        tags: ["Instances"],
        summary: "Logout instance",
        params: instanceNameParamsSchema,
      }),
    }, controller.logout);

    app.delete("/instance/delete/:instanceName", {
      schema: createRouteSchema({
        tags: ["Instances"],
        summary: "Delete instance",
        params: instanceNameParamsSchema,
      }),
    }, controller.delete);

    app.post("/instance/setPresence/:instanceName", {
      schema: createRouteSchema({
        tags: ["Instances"],
        summary: "Set instance presence",
        params: instanceNameParamsSchema,
        body: setPresenceBodySchema,
      }),
    }, controller.setPresence);
};
