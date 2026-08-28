import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeAny } from "zod";
import { successResponse } from "../../utils/response.js";
import { validateOrThrow } from "../../utils/zod.js";
import {
  createGroupBodySchema,
  groupJidQuerySchema,
  instanceNameParamsSchema,
  inviteCodeQuerySchema,
  toggleEphemeralBodySchema,
  updateDescriptionBodySchema,
  updateMembersBodySchema,
  updatePictureBodySchema,
  updateSettingBodySchema,
  updateSubjectBodySchema,
  groupInviteBodySchema,
} from "./group.validators.js";
import type { GroupService } from "./group.service.js";

export class GroupController {
  constructor(private readonly service: GroupService) {}

  private getInstanceName(request: FastifyRequest): string {
    return validateOrThrow(instanceNameParamsSchema, request.params).instanceName;
  }

  private async runBody(
    request: FastifyRequest,
    reply: FastifyReply,
    schema: ZodTypeAny,
    message: string,
    executor: (instanceName: string, input: any) => Promise<unknown>,
  ) {
    const instanceName = this.getInstanceName(request);
    const body = validateOrThrow(schema, request.body) as Record<string, unknown>;
    const data = await executor(instanceName, body);
    reply.send(successResponse(message, data));
  }

  private async runQuery(
    request: FastifyRequest,
    reply: FastifyReply,
    schema: ZodTypeAny,
    message: string,
    executor: (instanceName: string, input: any) => Promise<unknown>,
  ) {
    const instanceName = this.getInstanceName(request);
    const query = validateOrThrow(schema, request.query) as Record<string, unknown>;
    const data = await executor(instanceName, query);
    reply.send(successResponse(message, data));
  }

  create = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runBody(request, reply, createGroupBodySchema, "Group created successfully.", this.service.create.bind(this.service));

  updatePicture = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runBody(request, reply, updatePictureBodySchema, "Group picture updated successfully.", this.service.updatePicture.bind(this.service));

  updateSubject = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runBody(request, reply, updateSubjectBodySchema, "Group subject updated successfully.", this.service.updateSubject.bind(this.service));

  updateDescription = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runBody(request, reply, updateDescriptionBodySchema, "Group description updated successfully.", this.service.updateDescription.bind(this.service));

  revokeInviteCode = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runBody(request, reply, groupJidQuerySchema, "Group invite code revoked successfully.", this.service.revokeInviteCode.bind(this.service));

  sendInvite = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runBody(request, reply, groupInviteBodySchema, "Group invite sent successfully.", this.service.sendInvite.bind(this.service));

  updateMembers = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runBody(request, reply, updateMembersBodySchema, "Group members updated successfully.", this.service.updateMembers.bind(this.service));

  updateSetting = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runBody(request, reply, updateSettingBodySchema, "Group setting updated successfully.", this.service.updateSetting.bind(this.service));

  toggleEphemeral = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runBody(request, reply, toggleEphemeralBodySchema, "Group ephemeral setting updated successfully.", this.service.toggleEphemeral.bind(this.service));

  inviteCode = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runQuery(request, reply, groupJidQuerySchema, "Group invite code fetched successfully.", this.service.inviteCode.bind(this.service));

  findByInviteCode = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runQuery(request, reply, inviteCodeQuerySchema, "Group fetched by invite code successfully.", this.service.findByInviteCode.bind(this.service));

  findByJid = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runQuery(request, reply, groupJidQuerySchema, "Group fetched successfully.", this.service.findByJid.bind(this.service));

  fetchAll = async (request: FastifyRequest, reply: FastifyReply) => {
    const instanceName = this.getInstanceName(request);
    const data = await this.service.fetchAll(instanceName);
    reply.send(successResponse("Groups fetched successfully.", data));
  };

  members = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runQuery(request, reply, groupJidQuerySchema, "Group members fetched successfully.", this.service.members.bind(this.service));

  leave = async (request: FastifyRequest, reply: FastifyReply) =>
    this.runBody(request, reply, groupJidQuerySchema, "Left group successfully.", this.service.leave.bind(this.service));
}
