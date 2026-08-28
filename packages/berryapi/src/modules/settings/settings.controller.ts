import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../../utils/response.js";
import { validateOrThrow } from "../../utils/zod.js";
import { instanceNameParamsSchema, setSettingsBodySchema } from "./settings.validators.js";
import type { SettingsService } from "./settings.service.js";

export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  set = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = validateOrThrow(instanceNameParamsSchema, request.params);
    const body = validateOrThrow(setSettingsBodySchema, request.body);
    const data = await this.service.set(params.instanceName, body);
    reply.send(successResponse("Settings updated successfully.", data));
  };

  find = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = validateOrThrow(instanceNameParamsSchema, request.params);
    const data = await this.service.find(params.instanceName);
    reply.send(successResponse("Settings fetched successfully.", data));
  };
}
