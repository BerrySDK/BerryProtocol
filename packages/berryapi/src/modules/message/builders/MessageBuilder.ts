import { readFile } from "node:fs/promises";
import type { ProviderSendOptions } from "../../../providers/whatsapp/WhatsAppProvider.js";
import type { CommonMessageInput, MediaLikeInput } from "../types/index.js";

type BuiltMessage = {
  content: Record<string, unknown>;
  options?: ProviderSendOptions;
};

const decodeBase64 = async (base64: string): Promise<Buffer> =>
  Buffer.from(base64, "base64");

const mediaToTransportValue = async (input: MediaLikeInput): Promise<Buffer | { url: string }> => {
  if (input.base64) {
    return decodeBase64(input.base64);
  }

  if (input.path) {
    return readFile(input.path);
  }

  if (input.url) {
    return { url: input.url };
  }

  throw new Error("A media payload needs url, path or base64.");
};

export class MessageBuilder {
  buildCommonOptions(input: Partial<CommonMessageInput>): ProviderSendOptions | undefined {
    const contextInfo = {
      ...(input.contextInfo ?? {}),
      ...(typeof input.forwardingScore === "number"
        ? {
            forwardingScore: input.forwardingScore,
            isForwarded: input.forwardingScore > 0,
          }
        : {}),
    };

    const options: ProviderSendOptions = {
      ...(input.quoted ? { quoted: input.quoted } : {}),
      ...(input.mentions ? { mentions: input.mentions } : {}),
      ...(Object.keys(contextInfo).length ? { contextInfo } : {}),
      ...(input.ephemeralExpiration ? { ephemeralExpiration: input.ephemeralExpiration } : {}),
      ...(input.statusJidList ? { statusJidList: input.statusJidList } : {}),
    };

    return Object.keys(options).length ? options : undefined;
  }

  buildText(input: CommonMessageInput & { text: string }): BuiltMessage {
    return {
      content: {
        text: input.text,
      },
      options: this.buildCommonOptions(input),
    };
  }

  async buildImage(input: CommonMessageInput & MediaLikeInput): Promise<BuiltMessage> {
    return {
      content: {
        image: await mediaToTransportValue(input),
        ...(input.caption ? { caption: input.caption } : {}),
        ...(input.mimetype ? { mimetype: input.mimetype } : {}),
        ...(input.fileName ? { fileName: input.fileName } : {}),
      },
      options: this.buildCommonOptions(input),
    };
  }

  async buildVideo(input: CommonMessageInput & MediaLikeInput & { gifPlayback?: boolean; viewOnce?: boolean }): Promise<BuiltMessage> {
    return {
      content: {
        video: await mediaToTransportValue(input),
        ...(input.caption ? { caption: input.caption } : {}),
        ...(input.mimetype ? { mimetype: input.mimetype } : {}),
        ...(input.fileName ? { fileName: input.fileName } : {}),
        ...(input.gifPlayback ? { gifPlayback: true } : {}),
        ...(input.viewOnce ? { viewOnce: true } : {}),
      },
      options: this.buildCommonOptions(input),
    };
  }

  async buildAudio(input: CommonMessageInput & MediaLikeInput & { ptt?: boolean }): Promise<BuiltMessage> {
    return {
      content: {
        audio: await mediaToTransportValue(input),
        ...(input.mimetype ? { mimetype: input.mimetype } : {}),
        ...(input.ptt ? { ptt: true } : {}),
      },
      options: this.buildCommonOptions(input),
    };
  }

  async buildDocument(input: CommonMessageInput & MediaLikeInput): Promise<BuiltMessage> {
    return {
      content: {
        document: await mediaToTransportValue(input),
        ...(input.caption ? { caption: input.caption } : {}),
        ...(input.mimetype ? { mimetype: input.mimetype } : {}),
        ...(input.fileName ? { fileName: input.fileName } : {}),
      },
      options: this.buildCommonOptions(input),
    };
  }

  async buildSticker(input: CommonMessageInput & MediaLikeInput): Promise<BuiltMessage> {
    return {
      content: {
        sticker: await mediaToTransportValue(input),
        ...(input.mimetype ? { mimetype: input.mimetype } : {}),
      },
      options: this.buildCommonOptions(input),
    };
  }

  buildPoll(input: CommonMessageInput & { title: string; options: string[]; selectableCount: number }): BuiltMessage {
    return {
      content: {
        poll: {
          name: input.title,
          values: input.options,
          selectableCount: input.selectableCount,
        },
      },
      options: this.buildCommonOptions(input),
    };
  }

  buildLocation(input: CommonMessageInput & { latitude: number; longitude: number; name?: string; address?: string }): BuiltMessage {
    return {
      content: {
        location: {
          degreesLatitude: input.latitude,
          degreesLongitude: input.longitude,
          name: input.name,
          address: input.address,
        },
      },
      options: this.buildCommonOptions(input),
    };
  }

  buildLiveLocation(input: CommonMessageInput & { latitude: number; longitude: number; name?: string; address?: string; speedInMps?: number; accuracyInMeters?: number; degreesClockwiseFromMagneticNorth?: number }): BuiltMessage {
    return {
      content: {
        liveLocationMessage: {
          degreesLatitude: input.latitude,
          degreesLongitude: input.longitude,
          name: input.name,
          address: input.address,
          speedInMps: input.speedInMps,
          accuracyInMeters: input.accuracyInMeters,
          degreesClockwiseFromMagneticNorth: input.degreesClockwiseFromMagneticNorth,
        },
      },
      options: this.buildCommonOptions(input),
    };
  }

  buildContact(input: CommonMessageInput & { displayName: string; vcard: string }): BuiltMessage {
    return {
      content: {
        contacts: {
          displayName: input.displayName,
          contacts: [
            {
              displayName: input.displayName,
              vcard: input.vcard,
            },
          ],
        },
      },
      options: this.buildCommonOptions(input),
    };
  }

  buildContacts(input: CommonMessageInput & { displayName?: string; contacts: Array<{ displayName: string; vcard: string }> }): BuiltMessage {
    return {
      content: {
        contacts: {
          displayName: input.displayName ?? input.contacts[0]?.displayName ?? "Contacts",
          contacts: input.contacts,
        },
      },
      options: this.buildCommonOptions(input),
    };
  }

  buildButtons(input: CommonMessageInput & { text: string; footer?: string; ai?: boolean; buttons: Array<{ id?: string; title: string; type?: string; url?: string; copyCode?: string; paramsJson?: string }> }): Record<string, unknown> {
    return {
      text: input.text,
      footer: input.footer,
      buttons: input.buttons.map((button, index) => ({
        id: button.id ?? `btn_${index + 1}`,
        title: button.title,
        kind:
          button.type === "cta_url"
            ? "cta_url"
            : button.type === "cta_copy"
              ? "copy_code"
              : button.type === "native_flow"
                ? "reply"
                : "quick_reply",
        ...(button.url ? { url: button.url } : {}),
        ...(button.copyCode ? { code: button.copyCode } : {}),
        ...(button.type === "native_flow" ? { nativeFlowName: "quick_reply", buttonParamsJson: button.paramsJson } : {}),
      })),
      ...(input.ai ? { ai: true } : {}),
    };
  }

  buildList(input: CommonMessageInput & { title?: string; text: string; footer?: string; buttonText: string; sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }> }): Record<string, unknown> {
    return {
      title: input.title,
      text: input.text,
      footer: input.footer,
      buttonText: input.buttonText,
      sections: input.sections,
    };
  }

  buildCarousel(input: CommonMessageInput & {
    text: string;
    footer?: string;
    carouselCardType?: "image" | "video" | "mixed";
    ai?: boolean;
    cards: Array<{
      title?: string;
      body?: string;
      footer?: string;
      image?: MediaLikeInput;
      video?: MediaLikeInput;
      buttons?: Array<{
        id?: string;
        title?: string;
        kind?: "reply" | "quick_reply" | "copy_code" | "cta_url";
        code?: string;
        url?: string;
        nativeFlowName?: string;
        buttonParamsJson?: string;
      }>;
    }>;
  }): Record<string, unknown> {
    return {
      text: input.text,
      footer: input.footer,
      carouselCardType: input.carouselCardType,
      ai: input.ai,
      cards: input.cards.map((card) => ({
        title: card.title,
        body: card.body,
        footer: card.footer,
        image: card.image
          ? {
              url: card.image.url,
              path: card.image.path,
              buffer: card.image.base64 ? Buffer.from(card.image.base64, "base64") : undefined,
              caption: card.image.caption,
              mimetype: card.image.mimetype,
              fileName: card.image.fileName,
            }
          : undefined,
        video: card.video
          ? {
              url: card.video.url,
              path: card.video.path,
              buffer: card.video.base64 ? Buffer.from(card.video.base64, "base64") : undefined,
              caption: card.video.caption,
              mimetype: card.video.mimetype,
              fileName: card.video.fileName,
            }
          : undefined,
        buttons: card.buttons,
      })),
    };
  }

  buildReaction(input: { emoji: string; targetMessageId: string; to: string }) {
    return {
      emoji: input.emoji,
      targetMessageId: input.targetMessageId,
      to: input.to,
    };
  }

  buildEdit(input: { text: string; messageId: string; to: string }) {
    return input;
  }

  buildDelete(input: CommonMessageInput & { messageId: string; fromMe: boolean; participant?: string }): BuiltMessage {
    return {
      content: {
        delete: {
          remoteJid: input.to,
          fromMe: input.fromMe,
          id: input.messageId,
          ...(input.participant ? { participant: input.participant } : {}),
        },
      },
      options: this.buildCommonOptions(input),
    };
  }

  buildForward(input: CommonMessageInput & { message: Record<string, unknown> }): BuiltMessage {
    return {
      content: {
        forward: input.message,
      },
      options: this.buildCommonOptions(input),
    };
  }

  buildStatus(input: CommonMessageInput & { text?: string; media?: MediaLikeInput }): Promise<BuiltMessage> | BuiltMessage {
    if (input.media) {
      return this.buildImage({
        ...input,
        ...input.media,
        statusJidList: input.statusJidList,
      });
    }

    return this.buildText({
      ...input,
      text: input.text ?? "",
    });
  }

  async buildProduct(input: CommonMessageInput & { title: string; description?: string; price?: string; retailerId?: string; productImage?: MediaLikeInput }): Promise<BuiltMessage> {
    return {
      content: {
        productMessage: {
          title: input.title,
          description: input.description,
          priceAmount1000: input.price,
          retailerId: input.retailerId,
          productImage: input.productImage
            ? { image: await mediaToTransportValue(input.productImage) }
            : undefined,
        },
      },
      options: this.buildCommonOptions(input),
    };
  }

  buildCatalog(input: CommonMessageInput & { title: string; businessOwnerJid?: string }): BuiltMessage {
    return {
      content: {
        catalogMessage: {
          title: input.title,
          businessOwnerJid: input.businessOwnerJid,
        },
      },
      options: this.buildCommonOptions(input),
    };
  }

  buildCollection(input: CommonMessageInput & { title: string; businessOwnerJid?: string; collectionId?: string }): BuiltMessage {
    return {
      content: {
        collectionMessage: {
          name: input.title,
          businessOwnerJid: input.businessOwnerJid,
          collectionId: input.collectionId,
        },
      },
      options: this.buildCommonOptions(input),
    };
  }
}
