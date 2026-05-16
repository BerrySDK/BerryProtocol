import type { FastifyInstance } from "fastify";
import { createRouteSchema } from "../../docs/schema.js";
import type { InstanceManager } from "../../managers/InstanceManager.js";
import { ProfileController } from "./profile.controller.js";
import { ProfileService } from "./profile.service.js";
import {
  instanceNameParamsSchema,
  profileJidBodySchema,
  updateNameBodySchema,
  updatePictureBodySchema,
  updatePrivacySettingsBodySchema,
  updateStatusBodySchema,
} from "./profile.validators.js";

export const registerProfileRoutes = async (app: any, manager: InstanceManager) => {
  const controller = new ProfileController(new ProfileService(manager));

  const post = (
    path: string,
    summary: string,
    body: object,
    handler: any,
  ) => app.post(path, {
    schema: createRouteSchema({
      tags: ["Profile"],
      summary,
      params: instanceNameParamsSchema,
      body: body as never,
    }),
  }, handler);

  post("/profile/fetchBusinessProfile/:instanceName", "Fetch business profile", profileJidBodySchema, controller.fetchBusinessProfile);
  post("/profile/fetchProfile/:instanceName", "Fetch profile", profileJidBodySchema, controller.fetchProfile);
  post("/profile/updateName/:instanceName", "Update profile name", updateNameBodySchema, controller.updateName);
  post("/profile/updateStatus/:instanceName", "Update profile status", updateStatusBodySchema, controller.updateStatus);
  post("/profile/updatePicture/:instanceName", "Update profile picture", updatePictureBodySchema, controller.updatePicture);
  app.delete("/profile/removePicture/:instanceName", {
    schema: createRouteSchema({
      tags: ["Profile"],
      summary: "Remove profile picture",
      params: instanceNameParamsSchema,
    }),
  }, controller.removePicture);
  app.get("/profile/privacySettings/:instanceName", {
    schema: createRouteSchema({
      tags: ["Profile"],
      summary: "Fetch privacy settings",
      params: instanceNameParamsSchema,
    }),
  }, controller.privacySettings);
  post("/profile/updatePrivacySettings/:instanceName", "Update privacy settings", updatePrivacySettingsBodySchema, controller.updatePrivacySettings);
};
