/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import {
  AudioMessage,
  ButtonsPayload,
  CarouselMessage,
  CarouselMessagePayload,
  ContactPayload,
  ContactMessage,
  DocumentMessage,
  ImageMessage,
  ListPayload,
  ListMessage,
  LocationPayload,
  LocationMessage,
  MediaPayload,
  OutgoingMessage,
  ReactionMessage,
  TextMessage,
} from "@berrysdk/events";
import { randomUUID } from "node:crypto";

const buildBase = <T extends OutgoingMessage["type"]>(type: T, to: string) => ({
  id: randomUUID(),
  to,
  timestamp: new Date().toISOString(),
  ack: "pending" as const,
  type,
});

export const createTextMessage = (to: string, text: string): TextMessage => ({
  ...buildBase("text", to),
  text,
});

export const createImageMessage = (to: string, media: MediaPayload): ImageMessage => ({
  ...buildBase("image", to),
  media,
});

export const createAudioMessage = (to: string, media: MediaPayload): AudioMessage => ({
  ...buildBase("audio", to),
  media,
});

export const createDocumentMessage = (to: string, media: MediaPayload): DocumentMessage => ({
  ...buildBase("document", to),
  media,
});

export const createButtonsMessage = (to: string, buttons: ButtonsPayload): OutgoingMessage => ({
  ...buildBase("buttons", to),
  buttons,
});

export const createListMessage = (to: string, list: ListPayload): ListMessage => ({
  ...buildBase("list", to),
  list,
});

export const createCarouselMessage = (
  to: string,
  carousel: CarouselMessagePayload,
): CarouselMessage => ({
  ...buildBase("carousel", to),
  carousel,
});

export const createReactionMessage = (
  to: string,
  emoji: string,
  targetMessageId: string,
): ReactionMessage => ({
  ...buildBase("reaction", to),
  emoji,
  targetMessageId,
});

export const createLocationMessage = (
  to: string,
  location: LocationPayload,
): LocationMessage => ({
  ...buildBase("location", to),
  location,
});

export const createContactMessage = (to: string, contact: ContactPayload): ContactMessage => ({
  ...buildBase("contact", to),
  contact,
});
