import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeAny } from "zod";
import { successResponse } from "../../../utils/response.js";
import { validateOrThrow } from "../../../utils/zod.js";
import {
  deleteMessageBodySchema,
  editMessageBodySchema,
  instanceNameParamsSchema,
  sendAiTextBodySchema,
  sendButtonsBodySchema,
  sendContactBodySchema,
  sendContactsBodySchema,
  sendCopyButtonBodySchema,
  sendCarouselBodySchema,
  sendForwardBodySchema,
  sendListBodySchema,
  sendLocationBodySchema,
  sendMediaBodySchema,
  sendPollBodySchema,
  sendProductBodySchema,
  sendReactionBodySchema,
  sendStatusBodySchema,
  sendTemplateButtonsBodySchema,
  sendTextBodySchema,
  sendCollectionBodySchema,
  sendCatalogBodySchema,
  sendLiveLocationBodySchema,
} from "../validators/message.validators.js";
import type { MessageService } from "../services/message.service.js";

export class MessageController {
  constructor(private readonly service: MessageService) {}

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

  sendText = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendTextBodySchema, "Text message sent successfully.", this.service.sendText.bind(this.service));

  sendExtendedText = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendTextBodySchema, "Extended text message sent successfully.", this.service.sendExtendedText.bind(this.service));

  sendReply = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendTextBodySchema, "Reply message sent successfully.", this.service.sendReply.bind(this.service));

  sendForward = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendForwardBodySchema as never, "Forward message sent successfully.", this.service.sendForward.bind(this.service));

  deleteMessage = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, deleteMessageBodySchema as never, "Delete message sent successfully.", this.service.deleteMessage.bind(this.service));

  editMessage = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, editMessageBodySchema as never, "Message edited successfully.", this.service.editMessage.bind(this.service));

  sendReaction = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendReactionBodySchema as never, "Reaction sent successfully.", this.service.sendReaction.bind(this.service));

  sendImage = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendMediaBodySchema as never, "Image message sent successfully.", this.service.sendImage.bind(this.service));

  sendVideo = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendMediaBodySchema as never, "Video message sent successfully.", this.service.sendVideo.bind(this.service));

  sendAudio = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendMediaBodySchema as never, "Audio message sent successfully.", this.service.sendAudio.bind(this.service));

  sendDocument = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendMediaBodySchema as never, "Document message sent successfully.", this.service.sendDocument.bind(this.service));

  sendSticker = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendMediaBodySchema as never, "Sticker message sent successfully.", this.service.sendSticker.bind(this.service));

  sendGif = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendMediaBodySchema as never, "GIF message sent successfully.", this.service.sendGif.bind(this.service));

  sendButtons = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendButtonsBodySchema as never, "Buttons message sent successfully.", this.service.sendButtons.bind(this.service));

  sendTemplateButtons = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendTemplateButtonsBodySchema as never, "Template buttons message sent successfully.", this.service.sendTemplateButtons.bind(this.service));

  sendCTAButton = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendButtonsBodySchema as never, "CTA button message sent successfully.", this.service.sendCTAButton.bind(this.service));

  sendCopyButton = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendCopyButtonBodySchema as never, "Copy button message sent successfully.", this.service.sendCopyButton.bind(this.service));

  sendList = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendListBodySchema as never, "List message sent successfully.", this.service.sendList.bind(this.service));

  sendCarousel = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendCarouselBodySchema as never, "Carousel message sent successfully.", this.service.sendCarousel.bind(this.service));

  sendAiText = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendAiTextBodySchema as never, "AI labeled text message sent successfully.", this.service.sendAiText.bind(this.service));

  sendAiCarousel = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendCarouselBodySchema as never, "AI labeled carousel message sent successfully.", this.service.sendAiCarousel.bind(this.service));

  sendPoll = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendPollBodySchema as never, "Poll message sent successfully.", this.service.sendPoll.bind(this.service));

  sendLocation = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendLocationBodySchema as never, "Location message sent successfully.", this.service.sendLocation.bind(this.service));

  sendLiveLocation = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendLiveLocationBodySchema as never, "Live location message sent successfully.", this.service.sendLiveLocation.bind(this.service));

  sendContact = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendContactBodySchema as never, "Contact message sent successfully.", this.service.sendContact.bind(this.service));

  sendContacts = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendContactsBodySchema as never, "Contacts message sent successfully.", this.service.sendContacts.bind(this.service));

  sendStatus = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendStatusBodySchema as never, "Status message sent successfully.", this.service.sendStatus.bind(this.service));

  sendViewOnceImage = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendMediaBodySchema as never, "View once image sent successfully.", this.service.sendViewOnceImage.bind(this.service));

  sendViewOnceVideo = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendMediaBodySchema as never, "View once video sent successfully.", this.service.sendViewOnceVideo.bind(this.service));

  sendProduct = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendProductBodySchema as never, "Product message sent successfully.", this.service.sendProduct.bind(this.service));

  sendCatalog = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendCatalogBodySchema as never, "Catalog message sent successfully.", this.service.sendCatalog.bind(this.service));

  sendCollection = async (request: FastifyRequest, reply: FastifyReply) =>
    this.run(request, reply, sendCollectionBodySchema as never, "Collection message sent successfully.", this.service.sendCollection.bind(this.service));
}
