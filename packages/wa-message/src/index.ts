/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import { randomUUID } from "node:crypto";
import {
  type ButtonsPayload,
  type CarouselButton,
  type CarouselMessagePayload,
  type IncomingMessage,
  type InteractivePayload,
  type ListPayload,
  type MessageAck,
} from "@berrysdk/events";
import { proto, type BinaryNode, type WAMessage } from "@berrysdk/transport";

type NativeFlowCapableButton = {
  id?: string;
  title?: string;
  kind?: "reply" | "quick_reply" | "copy_code" | "cta_url";
  code?: string;
  url?: string;
  nativeFlowName?: string;
  buttonParamsJson?: string;
  name?: string;
};

type CarouselInteractiveCard = proto.Message.IInteractiveMessage;

const parseJsonObject = (value?: string | null): Record<string, unknown> | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const extractButtonSelection = (
  message: NonNullable<WAMessage["message"]>,
): {
  buttonId?: string;
  selectedButtonId?: string;
  rawButtonParamsJson?: string;
} => {
  const buttonsResponseId = message.buttonsResponseMessage?.selectedButtonId;
  if (buttonsResponseId) {
    return {
      buttonId: buttonsResponseId,
      selectedButtonId: buttonsResponseId,
    };
  }

  const templateButtonId = message.templateButtonReplyMessage?.selectedId;
  if (templateButtonId) {
    return {
      buttonId: templateButtonId,
      selectedButtonId: templateButtonId,
    };
  }

  const listRowId = message.listResponseMessage?.singleSelectReply?.selectedRowId;
  if (listRowId) {
    return {
      buttonId: listRowId,
      selectedButtonId: listRowId,
    };
  }

  const paramsJson = message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
  const parsedParams = parseJsonObject(paramsJson);
  if (parsedParams) {
    const selectedId = [parsedParams.id, parsedParams.button_id, parsedParams.selected_id].find(
      (candidate) => typeof candidate === "string" && candidate.length > 0,
    ) as string | undefined;

    return {
      buttonId: selectedId,
      selectedButtonId: selectedId,
      rawButtonParamsJson: paramsJson ?? undefined,
    };
  }

  return {};
};

export const ackFromWebMessageStatus = (status?: number | null): MessageAck["ack"] => {
  switch (status) {
    case proto.WebMessageInfo.Status.SERVER_ACK:
      return "sent";
    case proto.WebMessageInfo.Status.DELIVERY_ACK:
      return "delivered";
    case proto.WebMessageInfo.Status.READ:
    case proto.WebMessageInfo.Status.PLAYED:
      return "read";
    case proto.WebMessageInfo.Status.ERROR:
      return "failed";
    default:
      return "pending";
  }
};

export const normalizeMessageText = (message: WAMessage["message"]): string | undefined =>
  message?.conversation ??
  message?.extendedTextMessage?.text ??
  message?.imageMessage?.caption ??
  message?.videoMessage?.caption ??
  message?.documentMessage?.caption ??
  undefined;

export const listToInteractivePayload = (list: ListPayload): InteractivePayload => ({
  header: list.title
    ? {
        title: list.title,
        hasMediaAttachment: false,
      }
    : undefined,
  body: {
    text: list.text,
  },
  footer: list.footer
    ? {
        text: list.footer,
      }
    : undefined,
  nativeFlowMessage: {
    buttons: [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: list.buttonText,
          sections: list.sections.map((section) => ({
            title: section.title,
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description ?? "",
            })),
          })),
        }),
      },
    ],
    messageParamsJson: "",
    messageVersion: 1,
  },
});

export const interactivePayloadToMessageContent = (
  interactive: InteractivePayload,
): Record<string, unknown> => {
  const payload = proto.Message.InteractiveMessage.create({
    header: interactive.header,
    body: interactive.body,
    footer: interactive.footer,
    nativeFlowMessage: interactive.nativeFlowMessage
      ? {
          buttons: interactive.nativeFlowMessage.buttons,
          messageParamsJson: interactive.nativeFlowMessage.messageParamsJson ?? "",
          messageVersion: interactive.nativeFlowMessage.messageVersion ?? 1,
        }
      : undefined,
  });

  return {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
    },
    interactiveMessage: payload,
  };
};

export const interactiveNativeFlowAdditionalNodes = (): BinaryNode[] => [
  {
    tag: "biz",
    attrs: {},
    content: [
      {
        tag: "interactive",
        attrs: {
          type: "native_flow",
          v: "1",
        },
        content: [
          {
            tag: "native_flow",
            attrs: {
              v: "9",
              name: "mixed",
            },
          },
        ],
      },
    ],
  },
];

export const buttonsPayloadToTemplateMessageContent = (
  buttons: ButtonsPayload,
): Record<string, unknown> => ({
  templateMessage: {
    hydratedTemplate: {
      hydratedContentText: buttons.text,
      hydratedFooterText: buttons.footer ?? "",
      hydratedButtons: buttons.buttons.map((button, index) => ({
        index,
        quickReplyButton: {
          displayText: button.title,
          id: button.id,
        },
      })),
    },
  },
});

export const carouselButtonToNativeFlowButton = (
  button: NativeFlowCapableButton,
  fallbackIndex = 0,
): { name: string; buttonParamsJson: string } => {
  if (button.nativeFlowName && button.buttonParamsJson) {
    return {
      name: button.nativeFlowName,
      buttonParamsJson: button.buttonParamsJson,
    };
  }

  if (button.name && button.buttonParamsJson) {
    return {
      name: button.name,
      buttonParamsJson: button.buttonParamsJson,
    };
  }

  if (button.kind === "copy_code") {
    return {
      name: "cta_copy",
      buttonParamsJson: JSON.stringify({
        display_text: button.title ?? `Copiar ${fallbackIndex + 1}`,
        copy_code: button.code ?? button.id ?? "",
      }),
    };
  }

  if (button.kind === "cta_url") {
    const url = button.url ?? "";
    return {
      name: "cta_url",
      buttonParamsJson: JSON.stringify({
        display_text: button.title ?? `Abrir ${fallbackIndex + 1}`,
        url,
        merchant_url: url,
      }),
    };
  }

  return {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: button.title ?? `Opcao ${fallbackIndex + 1}`,
      id: button.id ?? `quick_${fallbackIndex + 1}`,
    }),
  };
};

export const buttonsPayloadToNativeFlowInteractiveContent = (
  buttons: ButtonsPayload,
): Record<string, unknown> =>
  interactivePayloadToMessageContent({
    body: {
      text: buttons.text,
    },
    footer: buttons.footer
      ? {
          text: buttons.footer,
        }
      : undefined,
    nativeFlowMessage: {
      buttons: buttons.buttons.map((button, index) => carouselButtonToNativeFlowButton(button, index)),
      messageParamsJson: "",
      messageVersion: 1,
    },
  });

export const carouselPayloadToMessageContent = (
  carousel: Pick<CarouselMessagePayload, "text" | "footer"> & {
    cards: CarouselInteractiveCard[];
  },
): Record<string, unknown> => ({
  viewOnceMessage: {
    message: {
      messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
      },
      interactiveMessage: proto.Message.InteractiveMessage.create({
        body: {
          text: carousel.text,
        },
        footer: carousel.footer
          ? {
              text: carousel.footer,
            }
          : undefined,
        carouselMessage: {
          cards: carousel.cards,
          messageVersion: 1,
        },
      }),
    },
  },
});

export const buttonsPayloadToLegacyButtonsMessageContent = (
  buttons: ButtonsPayload,
): Record<string, unknown> => ({
  buttonsMessage: proto.Message.ButtonsMessage.fromObject({
    contentText: buttons.text,
    footerText: buttons.footer ?? "",
    buttons: buttons.buttons.map((button) => ({
      buttonId: button.id,
      buttonText: {
        displayText: button.title,
      },
      type: proto.Message.ButtonsMessage.Button.Type.RESPONSE,
    })),
    headerType: proto.Message.ButtonsMessage.HeaderType.EMPTY,
  }),
});

export const listToLegacyListMessageContent = (list: ListPayload): Record<string, unknown> => ({
  listMessage: proto.Message.ListMessage.fromObject({
    title: list.title ?? "",
    description: list.text,
    buttonText: list.buttonText,
    listType: proto.Message.ListMessage.ListType.SINGLE_SELECT,
    footerText: list.footer ?? "",
    sections: list.sections.map((section) => ({
      title: section.title,
      rows: section.rows.map((row) => ({
        rowId: row.id,
        title: row.title,
        description: row.description ?? "",
      })),
    })),
  }),
});

export const legacyListAdditionalNodes = (): BinaryNode[] => [
  {
    tag: "biz",
    attrs: {},
    content: [
      {
        tag: "list",
        attrs: {
          type: "product_list",
          v: "2",
        },
      },
    ],
  },
];

export const listToInteractiveMessageContent = (list: ListPayload): Record<string, unknown> =>
  interactivePayloadToMessageContent(listToInteractivePayload(list));

export const extractInteractivePayload = (
  message: NonNullable<WAMessage["message"]>,
): InteractivePayload | null => {
  const interactive = message.interactiveMessage;
  if (!interactive) {
    return null;
  }

  return {
    header: interactive.header
      ? {
          title: interactive.header.title ?? undefined,
          subtitle: interactive.header.subtitle ?? undefined,
          hasMediaAttachment: interactive.header.hasMediaAttachment ?? undefined,
        }
      : undefined,
    body: {
      text: interactive.body?.text ?? "",
    },
    footer: interactive.footer
      ? {
          text: interactive.footer.text ?? undefined,
        }
      : undefined,
    nativeFlowMessage: interactive.nativeFlowMessage
      ? {
          buttons:
            interactive.nativeFlowMessage.buttons?.map((button) => ({
              name: button.name ?? "",
              buttonParamsJson: button.buttonParamsJson ?? "",
            })) ?? [],
          messageParamsJson: interactive.nativeFlowMessage.messageParamsJson ?? undefined,
          messageVersion: interactive.nativeFlowMessage.messageVersion ?? undefined,
        }
      : undefined,
  };
};

export const extractCarouselPayload = (
  message: NonNullable<WAMessage["message"]>,
): CarouselMessagePayload | null => {
  const interactive = message.interactiveMessage;
  const carousel = interactive?.carouselMessage;
  if (!interactive || !carousel) {
    return null;
  }

  return {
    text: interactive.body?.text ?? "",
    footer: interactive.footer?.text ?? undefined,
    cards:
      carousel.cards?.map((card) => ({
        title: card.header?.title ?? undefined,
        body: card.body?.text ?? undefined,
        footer: card.footer?.text ?? undefined,
        image: card.header?.imageMessage ? {} : undefined,
        video: card.header?.videoMessage ? {} : undefined,
        buttons:
          card.nativeFlowMessage?.buttons?.map(
            (button): CarouselButton => ({
              name: button.name ?? undefined,
              buttonParamsJson: button.buttonParamsJson ?? undefined,
            }),
          ) ?? [],
      })) ?? [],
    carouselCardType: "mixed",
  };
};

export const extractButtonsPayload = (
  message: NonNullable<WAMessage["message"]>,
): ButtonsPayload | null => {
  if (message.buttonsMessage) {
    return {
      text: message.buttonsMessage.contentText ?? "",
      footer: message.buttonsMessage.footerText ?? undefined,
      buttons:
        message.buttonsMessage.buttons?.map((button, index) => ({
          id: button.buttonId ?? `button-${index}`,
          title: button.buttonText?.displayText ?? button.buttonId ?? `Button ${index + 1}`,
        })) ?? [],
    };
  }

  const hydratedTemplate = message.templateMessage?.hydratedTemplate;
  if (!hydratedTemplate) {
    return null;
  }

  return {
    text: hydratedTemplate.hydratedContentText ?? "",
    footer: hydratedTemplate.hydratedFooterText ?? undefined,
    buttons:
      hydratedTemplate.hydratedButtons?.map((button, index) => ({
        id: button.quickReplyButton?.id ?? `button-${index}`,
        title:
          button.quickReplyButton?.displayText ??
          button.urlButton?.displayText ??
          button.callButton?.displayText ??
          `Button ${index + 1}`,
      })) ?? [],
  };
};

export const normalizeIncomingMessage = (waMessage: WAMessage): IncomingMessage | null => {
  const key = waMessage.key;
  const message = waMessage.message;
  if (!message) {
    return null;
  }

  const selection = extractButtonSelection(message);
  const remoteJid = key.remoteJid ?? "";
  const base = {
    id: key.id ?? randomUUID(),
    to: remoteJid,
    chatId: remoteJid,
    remoteJid,
    from: key.participant ?? remoteJid,
    timestamp: new Date(Number(waMessage.messageTimestamp ?? Date.now()) * 1000).toISOString(),
    ack: ackFromWebMessageStatus(waMessage.status),
    ...selection,
  } as const;

  if (message.conversation || message.extendedTextMessage?.text) {
    return {
      ...base,
      type: "text",
      text: normalizeMessageText(message) ?? "",
    };
  }

  if (message.imageMessage) {
    return {
      ...base,
      type: "image",
      media: {
        mimetype: message.imageMessage.mimetype ?? undefined,
        caption: message.imageMessage.caption ?? undefined,
      },
    };
  }

  if (message.audioMessage) {
    return {
      ...base,
      type: "audio",
      media: {
        mimetype: message.audioMessage.mimetype ?? undefined,
      },
    };
  }

  if (message.documentMessage) {
    return {
      ...base,
      type: "document",
      media: {
        mimetype: message.documentMessage.mimetype ?? undefined,
        fileName: message.documentMessage.fileName ?? undefined,
        caption: message.documentMessage.caption ?? undefined,
      },
    };
  }

  const buttons = extractButtonsPayload(message);
  if (buttons) {
    return {
      ...base,
      type: "buttons",
      buttons,
    };
  }

  if (message.listMessage) {
    return {
      ...base,
      type: "list",
      list: {
        title: message.listMessage.title ?? undefined,
        text: message.listMessage.description ?? "",
        footer: message.listMessage.footerText ?? undefined,
        buttonText: message.listMessage.buttonText ?? "",
        sections:
          message.listMessage.sections?.map((section) => ({
            title: section.title ?? "",
            rows:
              section.rows?.map((row) => ({
                id: row.rowId ?? "",
                title: row.title ?? "",
                description: row.description ?? undefined,
              })) ?? [],
          })) ?? [],
      },
    };
  }

  const carousel = extractCarouselPayload(message);
  if (carousel) {
    return {
      ...base,
      type: "carousel",
      carousel,
    };
  }

  const interactive = extractInteractivePayload(message);
  if (interactive) {
    return {
      ...base,
      type: "interactive",
      interactive,
    };
  }

  if (message.reactionMessage) {
    return {
      ...base,
      type: "reaction",
      emoji: message.reactionMessage.text ?? "",
      targetMessageId: message.reactionMessage.key?.id ?? "",
    };
  }

  if (message.locationMessage) {
    return {
      ...base,
      type: "location",
      location: {
        latitude: message.locationMessage.degreesLatitude ?? 0,
        longitude: message.locationMessage.degreesLongitude ?? 0,
        name: message.locationMessage.name ?? undefined,
        address: message.locationMessage.address ?? undefined,
      },
    };
  }

  if (message.contactMessage) {
    return {
      ...base,
      type: "contact",
      contact: {
        displayName: message.contactMessage.displayName ?? "",
        vcard: message.contactMessage.vcard ?? "",
      },
    };
  }

  return {
    ...base,
    type: "text",
    text: normalizeMessageText(message) ?? "[unsupported message]",
  };
};
