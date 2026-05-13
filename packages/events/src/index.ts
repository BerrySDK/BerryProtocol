/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import { EventEmitter } from "node:events";

export type AckStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export interface ConnectionState {
  sessionId: string;
  connectedAt?: string;
  disconnectedAt?: string;
  reason?: string;
}

export interface AuthStateSnapshot {
  sessionId: string;
  registered: boolean;
  clientId?: string;
  serverToken?: string;
  clientToken?: string;
  qr?: string;
  linkCode?: string;
  pairingCode?: string;
  authMethod?: BerryAuthMethod;
}

export type BerryAuthMethod = "link" | "qr" | "pairing_code";

export interface BerryAuthOptions {
  method?: BerryAuthMethod;
  phoneNumber?: string;
  customPairingCode?: string;
}

export interface ContactRecord {
  id: string;
  name?: string;
  pushName?: string;
  shortName?: string;
}

export interface ChatRecord {
  id: string;
  name?: string;
  unreadCount?: number;
  lastMessageAt?: string;
}

export interface GroupRecord {
  id: string;
  subject: string;
  participants: string[];
}

export interface PresenceRecord {
  id: string;
  status: "available" | "composing" | "recording" | "paused" | "unavailable";
  lastSeenAt?: string;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface ContactPayload {
  displayName: string;
  vcard: string;
}

export interface ButtonRow {
  id: string;
  title: string;
  kind?: "reply" | "copy_code" | "cta_url";
  code?: string;
  url?: string;
  nativeFlowName?: string;
  buttonParamsJson?: string;
}

export interface InteractiveHeader {
  title?: string;
  subtitle?: string;
  hasMediaAttachment?: boolean;
}

export interface InteractiveBody {
  text: string;
}

export interface InteractiveFooter {
  text?: string;
}

export interface InteractiveNativeButton {
  name: string;
  buttonParamsJson: string;
}

export interface InteractiveNativeFlowPayload {
  buttons: InteractiveNativeButton[];
  messageParamsJson?: string;
  messageVersion?: number;
}

export interface InteractivePayload {
  header?: InteractiveHeader;
  body: InteractiveBody;
  footer?: InteractiveFooter;
  nativeFlowMessage?: InteractiveNativeFlowPayload;
}

export interface ButtonsPayload {
  text: string;
  footer?: string;
  buttons: ButtonRow[];
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface ListPayload {
  title?: string;
  text: string;
  footer?: string;
  buttonText: string;
  sections: ListSection[];
}

export interface MediaPayload {
  url?: string;
  path?: string;
  buffer?: Buffer;
  fileName?: string;
  mimetype?: string;
  caption?: string;
}

export interface BaseMessage {
  id: string;
  to: string;
  from?: string;
  timestamp: string;
  ack: AckStatus;
  type:
    | "text"
    | "image"
    | "audio"
    | "document"
    | "buttons"
    | "list"
    | "interactive"
    | "reaction"
    | "location"
    | "contact";
}

export interface TextMessage extends BaseMessage {
  type: "text";
  text: string;
}

export interface ImageMessage extends BaseMessage {
  type: "image";
  media: MediaPayload;
}

export interface AudioMessage extends BaseMessage {
  type: "audio";
  media: MediaPayload;
}

export interface DocumentMessage extends BaseMessage {
  type: "document";
  media: MediaPayload;
}

export interface ButtonsMessage extends BaseMessage {
  type: "buttons";
  buttons: ButtonsPayload;
}

export interface ListMessage extends BaseMessage {
  type: "list";
  list: ListPayload;
}

export interface InteractiveMessage extends BaseMessage {
  type: "interactive";
  interactive: InteractivePayload;
}

export interface ReactionMessage extends BaseMessage {
  type: "reaction";
  emoji: string;
  targetMessageId: string;
}

export interface LocationMessage extends BaseMessage {
  type: "location";
  location: LocationPayload;
}

export interface ContactMessage extends BaseMessage {
  type: "contact";
  contact: ContactPayload;
}

export type OutgoingMessage =
  | TextMessage
  | ImageMessage
  | AudioMessage
  | DocumentMessage
  | ButtonsMessage
  | ListMessage
  | InteractiveMessage
  | ReactionMessage
  | LocationMessage
  | ContactMessage;

export type IncomingMessage = OutgoingMessage & {
  from: string;
};

export interface MessageAck {
  messageId: string;
  remoteJid: string;
  ack: AckStatus;
  updatedAt: string;
}

export interface SyncBundle {
  contacts: ContactRecord[];
  chats: ChatRecord[];
  groups: GroupRecord[];
  messages: IncomingMessage[];
}

export interface BerryEventMap {
  qr: string;
  "auth.link": { sessionId: string; value: string };
  "auth.qr": { sessionId: string; value: string };
  "auth.pairing_code": { sessionId: string; phoneNumber: string; code: string };
  "connection.open": ConnectionState;
  "connection.close": ConnectionState;
  "connection.reconnecting": { sessionId: string; attempt: number; delayMs: number };
  "auth.success": AuthStateSnapshot;
  "auth.error": { sessionId: string; error: string };
  "message.received": IncomingMessage;
  "message.sent": OutgoingMessage;
  "message.ack": MessageAck;
  "presence.update": PresenceRecord;
  "chats.update": ChatRecord[];
  "sync.history": SyncBundle;
  "sync.contacts": ContactRecord[];
  "sync.groups": GroupRecord[];
  "sync.messages": IncomingMessage[];
  "raw.frame": Buffer;
  "protocol.error": { sessionId: string; error: string };
}

export class BerryEventBus {
  private readonly emitter = new EventEmitter();

  on<EventName extends keyof BerryEventMap>(
    event: EventName,
    listener: (payload: BerryEventMap[EventName]) => void,
  ): this {
    this.emitter.on(event, listener);
    return this;
  }

  once<EventName extends keyof BerryEventMap>(
    event: EventName,
    listener: (payload: BerryEventMap[EventName]) => void,
  ): this {
    this.emitter.once(event, listener);
    return this;
  }

  off<EventName extends keyof BerryEventMap>(
    event: EventName,
    listener: (payload: BerryEventMap[EventName]) => void,
  ): this {
    this.emitter.off(event, listener);
    return this;
  }

  emit<EventName extends keyof BerryEventMap>(
    event: EventName,
    payload: BerryEventMap[EventName],
  ): boolean {
    return this.emitter.emit(event, payload);
  }
}
