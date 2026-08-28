import type { FastifyReply, FastifyRequest } from "fastify";
import { validateOrThrow } from "../../utils/zod.js";
import { successResponse } from "../../utils/response.js";
import { instanceNameParamsSchema, setWebhookBodySchema } from "./webhook.validators.js";
import type { WebhookService } from "./webhook.service.js";

export class WebhookController {
  constructor(private readonly service: WebhookService) {}

  set = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = validateOrThrow(instanceNameParamsSchema, request.params);
    const body = validateOrThrow(setWebhookBodySchema, request.body);
    const data = await this.service.set(params.instanceName, body);
    reply.send(successResponse("Webhook updated successfully.", data));
  };

  find = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = validateOrThrow(instanceNameParamsSchema, request.params);
    const data = await this.service.find(params.instanceName);
    reply.send(successResponse("Webhook fetched successfully.", data));
  };
}
