import type { FastifyInstance } from "fastify";
import type { InstanceManager } from "../../../managers/InstanceManager.js";
import { createRouteSchema } from "../../../docs/schema.js";
import {
  sendAiTextExample,
  sendButtonsExample,
  sendCarouselExample,
  sendCopyButtonExample,
  sendListExample,
  sendMediaExample,
  sendPollExample,
  sendTemplateButtonsExample,
  sendTextExample,
} from "../examples/payload-examples.js";
import { MessageService } from "../services/message.service.js";
import { MessageController } from "../controllers/message.controller.js";
import {
  deleteMessageBodySchema,
  editMessageBodySchema,
  instanceNameParamsSchema,
  sendAiTextBodySchema,
  sendButtonsBodySchema,
  sendCatalogBodySchema,
  sendCarouselBodySchema,
  sendCollectionBodySchema,
  sendContactBodySchema,
  sendContactsBodySchema,
  sendCopyButtonBodySchema,
  sendForwardBodySchema,
  sendListBodySchema,
  sendLiveLocationBodySchema,
  sendLocationBodySchema,
  sendMediaBodySchema,
  sendPollBodySchema,
  sendProductBodySchema,
  sendReactionBodySchema,
  sendStatusBodySchema,
  sendTemplateButtonsBodySchema,
  sendTextBodySchema,
} from "../validators/message.validators.js";

export const registerMessageRoutes = async (
  app: any,
  manager: InstanceManager,
) => {
  const controller = new MessageController(new MessageService(manager));

  const post = (
    path: string,
    summary: string,
    body: object,
    handler: any,
    example?: unknown,
  ) =>
    app.post(
      path,
      {
        schema: createRouteSchema({
          tags: ["Message"],
          summary,
          params: instanceNameParamsSchema,
          body: body as never,
          example,
        }),
      },
      handler,
    );

  post("/message/sendText/:instanceName", "Send text message", sendTextBodySchema, controller.sendText, sendTextExample);
  post("/message/sendExtendedText/:instanceName", "Send extended text message", sendTextBodySchema, controller.sendExtendedText, sendTextExample);
  post("/message/sendReply/:instanceName", "Send reply message", sendTextBodySchema, controller.sendReply, { ...sendTextExample, quoted: { remoteJid: "5511999999999@s.whatsapp.net", id: "MSG_ID" } });
  post("/message/sendForward/:instanceName", "Send forward message", sendForwardBodySchema, controller.sendForward);
  post("/message/delete/:instanceName", "Delete message", deleteMessageBodySchema, controller.deleteMessage);
  post("/message/edit/:instanceName", "Edit message", editMessageBodySchema, controller.editMessage);
  post("/message/sendReaction/:instanceName", "Send reaction", sendReactionBodySchema, controller.sendReaction);
  post("/message/sendImage/:instanceName", "Send image", sendMediaBodySchema, controller.sendImage, sendMediaExample);
  post("/message/sendVideo/:instanceName", "Send video", sendMediaBodySchema, controller.sendVideo);
  post("/message/sendAudio/:instanceName", "Send audio", sendMediaBodySchema, controller.sendAudio);
  post("/message/sendWhatsAppAudio/:instanceName", "Send WhatsApp audio", sendMediaBodySchema, controller.sendAudio);
  post("/message/sendDocument/:instanceName", "Send document", sendMediaBodySchema, controller.sendDocument);
  post("/message/sendSticker/:instanceName", "Send sticker", sendMediaBodySchema, controller.sendSticker);
  post("/message/sendGif/:instanceName", "Send GIF", sendMediaBodySchema, controller.sendGif);
  post("/message/sendMedia/:instanceName", "Send media alias", sendMediaBodySchema, controller.sendImage, sendMediaExample);
  post("/message/sendButtons/:instanceName", "Send buttons", sendButtonsBodySchema, controller.sendButtons, sendButtonsExample);
  post("/message/sendTemplateButtons/:instanceName", "Send template buttons", sendTemplateButtonsBodySchema, controller.sendTemplateButtons, sendTemplateButtonsExample);
  post("/message/sendCTAButton/:instanceName", "Send CTA button", sendButtonsBodySchema, controller.sendCTAButton, sendButtonsExample);
  post("/message/sendCopyButton/:instanceName", "Send copy button", sendCopyButtonBodySchema, controller.sendCopyButton, sendCopyButtonExample);
  post("/message/sendList/:instanceName", "Send list", sendListBodySchema, controller.sendList, sendListExample);
  post("/message/sendCarousel/:instanceName", "Send carousel", sendCarouselBodySchema, controller.sendCarousel, sendCarouselExample);
  post("/message/sendAiText/:instanceName", "Send AI labeled text", sendAiTextBodySchema, controller.sendAiText, sendAiTextExample);
  post("/message/sendAiCarousel/:instanceName", "Send AI labeled carousel", sendCarouselBodySchema, controller.sendAiCarousel, { ...sendCarouselExample, ai: true });
  post("/message/sendPoll/:instanceName", "Send poll", sendPollBodySchema, controller.sendPoll, sendPollExample);
  post("/message/sendLocation/:instanceName", "Send location", sendLocationBodySchema, controller.sendLocation);
  post("/message/sendLiveLocation/:instanceName", "Send live location", sendLiveLocationBodySchema, controller.sendLiveLocation);
  post("/message/sendContact/:instanceName", "Send contact", sendContactBodySchema, controller.sendContact);
  post("/message/sendContacts/:instanceName", "Send contacts", sendContactsBodySchema, controller.sendContacts);
  post("/message/sendStatus/:instanceName", "Send status", sendStatusBodySchema, controller.sendStatus);
  post("/message/sendViewOnceImage/:instanceName", "Send view once image", sendMediaBodySchema, controller.sendViewOnceImage);
  post("/message/sendViewOnceVideo/:instanceName", "Send view once video", sendMediaBodySchema, controller.sendViewOnceVideo);
  post("/message/sendProduct/:instanceName", "Send product", sendProductBodySchema, controller.sendProduct);
  post("/message/sendCatalog/:instanceName", "Send catalog", sendCatalogBodySchema, controller.sendCatalog);
  post("/message/sendCollection/:instanceName", "Send collection", sendCollectionBodySchema, controller.sendCollection);
};
