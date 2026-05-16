import { z } from "zod";

const mediaLikeSchema = z.object({
  url: z.string().url().optional(),
  path: z.string().optional(),
  base64: z.string().optional(),
  mimetype: z.string().optional(),
  fileName: z.string().optional(),
  caption: z.string().optional(),
});

const commonMessageSchema = z.object({
  to: z.string().min(1),
  quoted: z
    .object({
      remoteJid: z.string(),
      id: z.string(),
      fromMe: z.boolean().optional(),
      participant: z.string().optional(),
    })
    .optional(),
  mentions: z.array(z.string()).optional(),
  contextInfo: z.record(z.string(), z.unknown()).optional(),
  forwardingScore: z.number().int().nonnegative().optional(),
  ephemeralExpiration: z.number().int().positive().optional(),
  statusJidList: z.array(z.string()).optional(),
});

export const instanceNameParamsSchema = z.object({
  instanceName: z.string().min(1),
});

export const sendTextBodySchema = commonMessageSchema.extend({
  text: z.string().min(1),
  linkPreview: z.boolean().optional(),
});

export const sendReactionBodySchema = commonMessageSchema.extend({
  emoji: z.string().min(1),
  targetMessageId: z.string().min(1),
});

export const editMessageBodySchema = commonMessageSchema.extend({
  messageId: z.string().min(1),
  text: z.string().min(1),
});

export const deleteMessageBodySchema = commonMessageSchema.extend({
  messageId: z.string().min(1),
  fromMe: z.boolean().default(true),
  participant: z.string().optional(),
});

export const sendMediaBodySchema = commonMessageSchema.extend(mediaLikeSchema.shape).refine(
  (value) => !!value.url || !!value.path || !!value.base64,
  "url, path or base64 is required.",
);

export const sendButtonsBodySchema = commonMessageSchema.extend({
  text: z.string().min(1),
  footer: z.string().optional(),
  ai: z.boolean().optional(),
  buttons: z.array(
    z.object({
      id: z.string().min(1).optional(),
      title: z.string().min(1),
      type: z.enum(["reply", "cta_url", "cta_copy", "native_flow"]).default("reply"),
      url: z.string().url().optional(),
      copyCode: z.string().optional(),
      paramsJson: z.string().optional(),
    }),
  ).min(1),
});

export const sendTemplateButtonsBodySchema = sendButtonsBodySchema.refine(
  (value) => value.buttons.every((button) => button.type === "reply" || button.type === "cta_url" || button.type === "cta_copy"),
  "Template buttons only support reply, cta_url or cta_copy.",
);

export const sendCopyButtonBodySchema = commonMessageSchema.extend({
  text: z.string().min(1),
  footer: z.string().optional(),
  copyCode: z.string().min(1),
  buttonText: z.string().min(1),
  buttonId: z.string().min(1).optional(),
});

export const sendListBodySchema = commonMessageSchema.extend({
  title: z.string().optional(),
  text: z.string().min(1),
  footer: z.string().optional(),
  buttonText: z.string().min(1),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      rows: z.array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          description: z.string().optional(),
        }),
      ).min(1),
    }),
  ).min(1),
});

export const sendPollBodySchema = commonMessageSchema.extend({
  title: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  selectableCount: z.number().int().positive().default(1),
});

const carouselButtonSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  kind: z.enum(["reply", "quick_reply", "copy_code", "cta_url"]).optional(),
  code: z.string().optional(),
  url: z.string().url().optional(),
  nativeFlowName: z.string().optional(),
  buttonParamsJson: z.string().optional(),
});

const carouselCardSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  footer: z.string().optional(),
  image: mediaLikeSchema.optional(),
  video: mediaLikeSchema.optional(),
  buttons: z.array(carouselButtonSchema).optional(),
}).refine((value) => !!value.image || !!value.video, "Each carousel card needs image or video.");

export const sendCarouselBodySchema = commonMessageSchema.extend({
  text: z.string().min(1),
  footer: z.string().optional(),
  carouselCardType: z.enum(["image", "video", "mixed"]).optional(),
  ai: z.boolean().optional(),
  cards: z.array(carouselCardSchema).min(1).max(10),
});

export const sendLocationBodySchema = commonMessageSchema.extend({
  latitude: z.number(),
  longitude: z.number(),
  name: z.string().optional(),
  address: z.string().optional(),
});

export const sendLiveLocationBodySchema = sendLocationBodySchema.extend({
  degreesClockwiseFromMagneticNorth: z.number().optional(),
  speedInMps: z.number().optional(),
  accuracyInMeters: z.number().optional(),
});

export const sendContactBodySchema = commonMessageSchema.extend({
  displayName: z.string().min(1),
  vcard: z.string().min(1),
});

export const sendContactsBodySchema = commonMessageSchema.extend({
  displayName: z.string().optional(),
  contacts: z.array(
    z.object({
      displayName: z.string().min(1),
      vcard: z.string().min(1),
    }),
  ).min(1),
});

export const sendStatusBodySchema = commonMessageSchema.extend({
  text: z.string().optional(),
  media: mediaLikeSchema.optional(),
}).refine((value) => !!value.text || !!value.media, "text or media is required.");

export const sendProductBodySchema = commonMessageSchema.extend({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.string().optional(),
  retailerId: z.string().optional(),
  businessOwnerJid: z.string().optional(),
  productImage: mediaLikeSchema.optional(),
});

export const sendCatalogBodySchema = commonMessageSchema.extend({
  title: z.string().min(1),
  businessOwnerJid: z.string().optional(),
  thumbnail: mediaLikeSchema.optional(),
});

export const sendCollectionBodySchema = commonMessageSchema.extend({
  title: z.string().min(1),
  businessOwnerJid: z.string().optional(),
  collectionId: z.string().optional(),
});

export const sendForwardBodySchema = commonMessageSchema.extend({
  message: z.record(z.string(), z.unknown()),
});

export const sendPresenceBodySchema = commonMessageSchema.extend({
  presence: z.enum(["available", "composing", "recording", "paused", "unavailable"]),
});

export const sendAiTextBodySchema = commonMessageSchema.extend({
  text: z.string().min(1),
});
