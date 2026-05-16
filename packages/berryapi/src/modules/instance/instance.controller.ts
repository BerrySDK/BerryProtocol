import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../../utils/response.js";
import { validateOrThrow } from "../../utils/zod.js";
import {
  createInstanceBodySchema,
  instanceNameParamsSchema,
  setPresenceBodySchema,
} from "./instance.validators.js";
import type { InstanceService } from "./instance.service.js";

export class InstanceController {
  constructor(private readonly service: InstanceService) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = validateOrThrow(createInstanceBodySchema, request.body);
    const data = await this.service.create(body);
    reply.status(201).send(successResponse("Instance created successfully.", data));
  };

  fetch = async (_request: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.fetch();
    reply.send(successResponse("Instances fetched successfully.", data));
  };

  connect = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = validateOrThrow(instanceNameParamsSchema, request.params);
    const data = await this.service.connect(params.instanceName);
    reply.send(successResponse("Instance connection started.", data));
  };

  restart = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = validateOrThrow(instanceNameParamsSchema, request.params);
    const data = await this.service.restart(params.instanceName);
    reply.send(successResponse("Instance restart started.", data));
  };

  connectionState = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = validateOrThrow(instanceNameParamsSchema, request.params);
    const data = await this.service.connectionState(params.instanceName);
    reply.send(successResponse("Connection state fetched successfully.", data));
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = validateOrThrow(instanceNameParamsSchema, request.params);
    const data = await this.service.logout(params.instanceName);
    reply.send(successResponse("Instance logged out successfully.", data));
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = validateOrThrow(instanceNameParamsSchema, request.params);
    const data = await this.service.delete(params.instanceName);
    reply.send(successResponse("Instance deleted successfully.", data));
  };

  setPresence = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = validateOrThrow(instanceNameParamsSchema, request.params);
    const body = validateOrThrow(setPresenceBodySchema, request.body);
    await this.service.setPresence(params.instanceName, body);
    reply.send(successResponse("Presence updated successfully.", { instanceName: params.instanceName }));
  };
}
