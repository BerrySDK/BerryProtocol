import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeAny } from "zod";
import { successResponse } from "../../utils/response.js";
import { validateOrThrow } from "../../utils/zod.js";
import {
  instanceNameParamsSchema,
  profileJidBodySchema,
  updateNameBodySchema,
  updatePictureBodySchema,
  updatePrivacySettingsBodySchema,
  updateStatusBodySchema,
} from "./profile.validators.js";
import type { ProfileService } from "./profile.service.js";

export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  private getInstanceName(request: FastifyRequest): string {
    return validateOrThrow(instanceNameParamsSchema, request.params).instanceName;
  }

  private async run(
    request: FastifyRequest,
    reply: FastifyReply,
    schema: ZodTypeAny | null,
    message: string,
    executor: (instanceName: string, input: any) => Promise<unknown>,
  ) {
    const instanceName = this.getInstanceName(request);
    const body = schema ? validateOrThrow(schema, request.body) as Record<string, unknown> : {};
    const data = await executor(instanceName, body);
    reply.send(successResponse(message, data));
  }

  fetchBusinessProfile = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, profileJidBodySchema, "Business profile fetched successfully.", this.service.fetchBusinessProfile.bind(this.service));

  fetchProfile = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, profileJidBodySchema, "Profile fetched successfully.", this.service.fetchProfile.bind(this.service));

  updateName = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, updateNameBodySchema, "Profile name updated successfully.", this.service.updateName.bind(this.service));

  updateStatus = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, updateStatusBodySchema, "Profile status updated successfully.", this.service.updateStatus.bind(this.service));

  updatePicture = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, updatePictureBodySchema, "Profile picture updated successfully.", this.service.updatePicture.bind(this.service));

  removePicture = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, null, "Profile picture removed successfully.", this.service.removePicture.bind(this.service));

  privacySettings = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, null, "Privacy settings fetched successfully.", this.service.privacySettings.bind(this.service));

  updatePrivacySettings = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, updatePrivacySettingsBodySchema, "Privacy settings updated successfully.", this.service.updatePrivacySettings.bind(this.service));
}
