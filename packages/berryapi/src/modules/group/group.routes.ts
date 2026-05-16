import type { FastifyInstance } from "fastify";
import { createRouteSchema } from "../../docs/schema.js";
import type { InstanceManager } from "../../managers/InstanceManager.js";
import { GroupController } from "./group.controller.js";
import { GroupService } from "./group.service.js";
import {
  createGroupBodySchema,
  groupInviteBodySchema,
  groupJidQuerySchema,
  instanceNameParamsSchema,
  inviteCodeQuerySchema,
  toggleEphemeralBodySchema,
  updateDescriptionBodySchema,
  updateMembersBodySchema,
  updatePictureBodySchema,
  updateSettingBodySchema,
  updateSubjectBodySchema,
} from "./group.validators.js";

export const registerGroupRoutes = async (app: any, manager: InstanceManager) => {
  const controller = new GroupController(new GroupService(manager));

  const post = (
    path: string,
    summary: string,
    body: object,
    handler: any,
  ) => app.post(path, {
    schema: createRouteSchema({
      tags: ["Group"],
      summary,
      params: instanceNameParamsSchema,
      body: body as never,
    }),
  }, handler);

  const get = (
    path: string,
    summary: string,
    querystring: object | undefined,
    handler: any,
  ) => app.get(path, {
    schema: createRouteSchema({
      tags: ["Group"],
      summary,
      params: instanceNameParamsSchema,
      ...(querystring ? { querystring: querystring as never } : {}),
    }),
  }, handler);

  post("/group/create/:instanceName", "Create group", createGroupBodySchema, controller.create);
  post("/group/updatePicture/:instanceName", "Update group picture", updatePictureBodySchema, controller.updatePicture);
  post("/group/updateSubject/:instanceName", "Update group subject", updateSubjectBodySchema, controller.updateSubject);
  post("/group/updateDescription/:instanceName", "Update group description", updateDescriptionBodySchema, controller.updateDescription);
  get("/group/inviteCode/:instanceName", "Fetch group invite code", groupJidQuerySchema, controller.inviteCode);
  post("/group/revokeInviteCode/:instanceName", "Revoke group invite code", groupJidQuerySchema, controller.revokeInviteCode);
  post("/group/sendInvite/:instanceName", "Send group invite", groupInviteBodySchema, controller.sendInvite);
  get("/group/findByInviteCode/:instanceName", "Find group by invite code", inviteCodeQuerySchema, controller.findByInviteCode);
  get("/group/findByJid/:instanceName", "Find group by JID", groupJidQuerySchema, controller.findByJid);
  get("/group/fetchAll/:instanceName", "Fetch all groups", undefined, controller.fetchAll);
  get("/group/members/:instanceName", "Fetch group members", groupJidQuerySchema, controller.members);
  post("/group/updateMembers/:instanceName", "Update group members", updateMembersBodySchema, controller.updateMembers);
  post("/group/updateSetting/:instanceName", "Update group setting", updateSettingBodySchema, controller.updateSetting);
  post("/group/toggleEphemeral/:instanceName", "Toggle group ephemeral setting", toggleEphemeralBodySchema, controller.toggleEphemeral);
  app.delete("/group/leave/:instanceName", {
    schema: createRouteSchema({
      tags: ["Group"],
      summary: "Leave group",
      params: instanceNameParamsSchema,
      body: groupJidQuerySchema,
    }),
  }, controller.leave);
};
