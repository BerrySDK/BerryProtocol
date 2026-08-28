import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeAny } from "zod";
import { successResponse } from "../../utils/response.js";
import { validateOrThrow } from "../../utils/zod.js";
import {
  base64BodySchema,
  blockStatusBodySchema,
  findContactsBodySchema,
  instanceNameParamsSchema,
  jidBodySchema,
  messageKeyBodySchema,
  presenceBodySchema,
  updateMessageBodySchema,
} from "./chat.validators.js";
import type { ChatService } from "./chat.service.js";

export class ChatController {
  constructor(private readonly service: ChatService) {}

  private getInstanceName(request: FastifyRequest): string {
    return validateOrThrow(instanceNameParamsSchema, request.params).instanceName;
  }

  private async run(
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

  checkWhatsApp = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, jidBodySchema, "WhatsApp availability checked successfully.", this.service.checkWhatsApp.bind(this.service));

  markRead = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, jidBodySchema, "Chat marked as read successfully.", this.service.markRead.bind(this.service));

  markUnread = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, jidBodySchema, "Chat marked as unread successfully.", this.service.markUnread.bind(this.service));

  archive = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, jidBodySchema, "Chat archived successfully.", this.service.archive.bind(this.service));

  deleteMessageForEveryone = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, messageKeyBodySchema, "Delete for everyone dispatched successfully.", this.service.deleteMessageForEveryone.bind(this.service));

  updateMessage = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, updateMessageBodySchema, "Message updated successfully.", this.service.updateMessage.bind(this.service));

  sendPresence = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, presenceBodySchema, "Presence updated successfully.", this.service.sendPresence.bind(this.service));

  updateBlockStatus = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, blockStatusBodySchema, "Block status updated successfully.", this.service.updateBlockStatus.bind(this.service));

  fetchProfilePictureUrl = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, jidBodySchema, "Profile picture URL fetched successfully.", this.service.fetchProfilePictureUrl.bind(this.service));

  getBase64 = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, base64BodySchema, "Base64 generated successfully.", this.service.getBase64.bind(this.service));

  findContacts = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, findContactsBodySchema, "Contacts fetched successfully.", this.service.findContacts.bind(this.service));

  findMessages = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, findContactsBodySchema, "Messages fetched successfully.", this.service.findMessages.bind(this.service));

  findStatusMessage = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, findContactsBodySchema, "Status messages fetched successfully.", this.service.findStatusMessage.bind(this.service));

  findChats = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, findContactsBodySchema, "Chats fetched successfully.", this.service.findChats.bind(this.service));
}
