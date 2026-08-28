import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../../utils/response.js";
import { validateOrThrow } from "../../utils/zod.js";
import {
  createFlowBodySchema,
  executeContinueBodySchema,
  executeStartBodySchema,
  flowIdParamsSchema,
  instanceNameOnlyParamsSchema,
  simulateContinueBodySchema,
  simulateStartBodySchema,
  studioInstanceBodySchema,
  updateFlowBodySchema,
  updateFlowStatusBodySchema,
  validateFlowBodySchema,
} from "./flow.validators.js";
import type { FlowService } from "./flow.service.js";

export class FlowController {
  constructor(private readonly service: FlowService) {}

  getCapabilities = async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send(successResponse("Berry Studio capabilities loaded.", this.service.getCapabilities()));
  };

  listFlows = async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send(successResponse("Berry Studio flows loaded.", this.service.listFlows()));
  };

  listInstances = async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send(successResponse("Berry Studio instances loaded.", await this.service.listInstances()));
  };

  createInstance = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = validateOrThrow(studioInstanceBodySchema, request.body);
    reply.code(201).send(successResponse("Studio instance created successfully.", await this.service.createInstance(body)));
  };

  connectInstance = async (request: FastifyRequest, reply: FastifyReply) => {
    const { instanceName } = validateOrThrow(instanceNameOnlyParamsSchema, request.params);
    reply.send(successResponse("Studio instance connection started.", await this.service.connectInstance(instanceName)));
  };

  createFlow = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = validateOrThrow(createFlowBodySchema, request.body);
    reply.code(201).send(successResponse("Flow created successfully.", this.service.createFlow(body)));
  };

  getFlow = async (request: FastifyRequest, reply: FastifyReply) => {
    const { flowId } = validateOrThrow(flowIdParamsSchema, request.params);
    reply.send(successResponse("Flow loaded successfully.", this.service.getFlow(flowId)));
  };

  updateFlow = async (request: FastifyRequest, reply: FastifyReply) => {
    const { flowId } = validateOrThrow(flowIdParamsSchema, request.params);
    const body = validateOrThrow(updateFlowBodySchema, request.body);
    reply.send(successResponse("Flow saved successfully.", this.service.updateFlow(flowId, body)));
  };

  updateFlowStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    const { flowId } = validateOrThrow(flowIdParamsSchema, request.params);
    const body = validateOrThrow(updateFlowStatusBodySchema, request.body);
    reply.send(successResponse("Flow status updated successfully.", this.service.updateFlowStatus(flowId, body.status)));
  };

  publishFlow = async (request: FastifyRequest, reply: FastifyReply) => {
    const { flowId } = validateOrThrow(flowIdParamsSchema, request.params);
    reply.send(successResponse("Flow published successfully.", this.service.publishFlow(flowId)));
  };

  validateFlow = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = validateOrThrow(validateFlowBodySchema, request.body);
    reply.send(successResponse("Flow validation completed.", this.service.validateFlow(body.flow)));
  };

  simulateStart = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = validateOrThrow(simulateStartBodySchema, request.body);
    reply.send(successResponse("Flow simulation started.", await this.service.simulateStart(body.flow, body.variables, body.contact, body.flowId)));
  };

  simulateContinue = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = validateOrThrow(simulateContinueBodySchema, request.body);
    reply.send(successResponse("Flow simulation advanced.", await this.service.simulateContinue(body.flow, body.state, body.inputText, body.flowId)));
  };

  executeStart = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = validateOrThrow(executeStartBodySchema, request.body);
    reply.send(successResponse("Flow execution started.", await this.service.executeStart(body.flow, body.instanceName, body.variables, body.contact, body.flowId)));
  };

  executeContinue = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = validateOrThrow(executeContinueBodySchema, request.body);
    reply.send(successResponse("Flow execution continued.", await this.service.executeContinue(body.flow, body.state, body.inputText, body.instanceName, body.flowId)));
  };

  deleteFlow = async (request: FastifyRequest, reply: FastifyReply) => {
    const { flowId } = validateOrThrow(flowIdParamsSchema, request.params);
    await this.service.deleteFlow(flowId);
    reply.send(successResponse("Flow deleted successfully.", { flowId }));
  };

  duplicateFlow = async (request: FastifyRequest, reply: FastifyReply) => {
    const { flowId } = validateOrThrow(flowIdParamsSchema, request.params);
    reply.code(201).send(successResponse("Flow duplicated successfully.", this.service.duplicateFlow(flowId)));
  };

  getAnalytics = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = (request.query ?? {}) as { flowId?: string; days?: string };
    const days = query.days ? Number(query.days) : undefined;
    reply.send(successResponse("Studio analytics loaded.", this.service.getAnalytics(query.flowId, days)));
  };

  resetAnalytics = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = (request.body ?? {}) as { flowId?: string };
    reply.send(successResponse("Studio analytics reset.", this.service.resetAnalytics(body.flowId)));
  };

  listNotifications = async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send(successResponse("Studio notifications loaded.", await this.service.listNotifications()));
  };

  restartInstance = async (request: FastifyRequest, reply: FastifyReply) => {
    const { instanceName } = validateOrThrow(instanceNameOnlyParamsSchema, request.params);
    reply.send(successResponse("Studio instance restarted.", await this.service.restartInstance(instanceName)));
  };

  logoutInstance = async (request: FastifyRequest, reply: FastifyReply) => {
    const { instanceName } = validateOrThrow(instanceNameOnlyParamsSchema, request.params);
    reply.send(successResponse("Studio instance logged out.", await this.service.logoutInstance(instanceName)));
  };

  deleteInstance = async (request: FastifyRequest, reply: FastifyReply) => {
    const { instanceName } = validateOrThrow(instanceNameOnlyParamsSchema, request.params);
    await this.service.deleteInstance(instanceName);
    reply.send(successResponse("Studio instance deleted.", { instanceName }));
  };
}
