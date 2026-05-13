/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import pino, { type Logger } from "pino";
import qrcode from "qrcode-terminal";
import { randomUUID } from "node:crypto";
import { type URL } from "node:url";
import { SessionManager, SQLiteSessionStore } from "@berrysdk/auth";
import {
  type BerryAuthOptions,
  BerryEventBus,
  type BerryEventMap,
  type ButtonsPayload,
  type ContactPayload,
  type IncomingMessage,
  type InteractivePayload,
  type ListPayload,
  type LocationPayload,
  type MediaPayload,
  type MessageAck,
  type OutgoingMessage,
  type PresenceRecord,
} from "@berrysdk/events";
import { MediaManager } from "@berrysdk/media";
import {
  createContactMessage,
  createLocationMessage,
  createReactionMessage,
  createTextMessage,
} from "@berrysdk/messages";
import { BerrySocket } from "@berrysdk/socket";
import { SQLiteStore } from "@berrysdk/store";

export interface BerryClientOptions {
  sessionId: string;
  databasePath?: string;
  authFolder?: string;
  auth?: BerryAuthOptions;
  logger?: Logger;
  reconnectMaxAttempts?: number;
  reconnectDelayMs?: number;
  printQrInTerminal?: boolean;
  qrSmall?: boolean;
}

type BerryMediaSource = Buffer | { url: string | URL };

export interface BerrySendMessageContent {
  ai?: boolean;
  text?: string;
  image?: BerryMediaSource;
  audio?: BerryMediaSource;
  document?: BerryMediaSource;
  caption?: string;
  mimetype?: string;
  fileName?: string;
  ptt?: boolean;
  footer?: string;
  buttons?: Array<{
    buttonId?: string;
    buttonText?: { displayText?: string };
    type?: number;
  }>;
  headerType?: number;
  react?: {
    text?: string;
    key?: {
      id?: string;
      remoteJid?: string;
    };
  };
  location?: {
    degreesLatitude?: number;
    degreesLongitude?: number;
    name?: string;
    address?: string;
  };
  contacts?: {
    displayName?: string;
    contacts: Array<{
      displayName?: string;
      vcard?: string;
    }>;
  };
  list?: ListPayload;
  listMessage?: ListPayload;
  buttonsMessage?: ButtonsPayload;
  interactiveMessage?: InteractivePayload;
  [key: string]: unknown;
}

class MessageQueue {
  private tail = Promise.resolve();

  enqueue<T>(job: () => Promise<T>): Promise<T> {
    const next = this.tail.then(job, job);
    this.tail = next.then(() => undefined, () => undefined);
    return next;
  }
}

export class BerryClient {
  private readonly logger: Logger;
  private readonly store: SQLiteStore;
  private readonly sessions: SessionManager;
  private readonly media = new MediaManager();
  private readonly bus = new BerryEventBus();
  private readonly queue = new MessageQueue();
  private readonly socket: BerrySocket;
  private lastQr?: string;

  constructor(private readonly options: BerryClientOptions) {
    this.logger = options.logger ?? pino({ name: "berry-client" });
    this.store = new SQLiteStore(options.databasePath);
    this.sessions = new SessionManager(new SQLiteSessionStore(this.store));
    this.socket = new BerrySocket(
      {
        sessionId: options.sessionId,
        logger: this.logger,
        reconnectDelayMs: options.reconnectDelayMs,
        reconnectMaxAttempts: options.reconnectMaxAttempts,
        authFolder: options.authFolder,
        auth: options.auth,
      },
      this.bus,
    );
    this.bindInternals();
  }

  on<EventName extends keyof BerryEventMap>(
    event: EventName,
    listener: (payload: BerryEventMap[EventName]) => void,
  ): this {
    this.bus.on(event, listener);
    return this;
  }

  once<EventName extends keyof BerryEventMap>(
    event: EventName,
    listener: (payload: BerryEventMap[EventName]) => void,
  ): this {
    this.bus.once(event, listener);
    return this;
  }

  off<EventName extends keyof BerryEventMap>(
    event: EventName,
    listener: (payload: BerryEventMap[EventName]) => void,
  ): this {
    this.bus.off(event, listener);
    return this;
  }

  async connect(auth?: BerryAuthOptions): Promise<void> {
    await this.sessions.get(this.options.sessionId);
    await this.socket.connect(auth);
  }

  async connectWithLink(): Promise<void> {
    await this.connect({ method: "link" });
  }

  async connectWithQr(): Promise<void> {
    await this.connect({ method: "qr" });
  }

  async connectWithPairingCode(
    phoneNumber: string,
    customPairingCode?: string,
  ): Promise<void> {
    await this.connect({
      method: "pairing_code",
      phoneNumber,
      customPairingCode,
    });
  }

  async disconnect(): Promise<void> {
    await this.socket.disconnect();
  }

  async reconnect(): Promise<void> {
    await this.socket.reconnect();
  }

  async logout(): Promise<void> {
    await this.socket.logout();
    await this.sessions.clear(this.options.sessionId);
  }

  getQrCode(): string | undefined {
    return this.lastQr;
  }

  async sendText(to: string, text: string): Promise<OutgoingMessage> {
    return this.sendMessage(to, { text });
  }

  async sendImage(to: string, media: MediaPayload): Promise<OutgoingMessage> {
    const loaded = await this.media.load(media);
    return this.sendMessage(to, {
      image: loaded.buffer,
      caption: media.caption,
      mimetype: media.mimetype ?? loaded.metadata.mimetype,
      fileName: media.fileName ?? loaded.metadata.fileName,
    });
  }

  async sendAudio(to: string, media: MediaPayload): Promise<OutgoingMessage> {
    const loaded = await this.media.load(media);
    return this.sendMessage(to, {
      audio: loaded.buffer,
      mimetype: media.mimetype ?? loaded.metadata.mimetype,
      ptt: false,
    });
  }

  async sendDocument(to: string, media: MediaPayload): Promise<OutgoingMessage> {
    const loaded = await this.media.load(media);
    return this.sendMessage(to, {
      document: loaded.buffer,
      mimetype: media.mimetype ?? loaded.metadata.mimetype ?? "application/octet-stream",
      fileName: media.fileName ?? loaded.metadata.fileName,
      caption: media.caption,
    });
  }

  async sendButtons(to: string, payload: ButtonsPayload): Promise<OutgoingMessage> {
    return this.sendMessage(to, { buttonsMessage: payload });
  }

  async sendList(to: string, list: ListPayload): Promise<OutgoingMessage> {
    return this.sendMessage(to, { list });
  }

  async sendLegacyButtons(to: string, payload: ButtonsPayload): Promise<OutgoingMessage> {
    return this.queue.enqueue(async () => {
      const message: OutgoingMessage = {
        id: randomUUID(),
        to,
        timestamp: new Date().toISOString(),
        ack: "pending",
        type: "buttons",
        buttons: payload,
      };

      const result = await this.socket.sendLegacyButtonsMessage(to, payload);
      const sent = {
        ...message,
        id: result.key.id ?? message.id,
        ack: "sent" as const,
      };
      this.bus.emit("message.sent", sent);
      return sent;
    });
  }

  async sendReaction(
    to: string,
    emoji: string,
    targetMessageId: string,
  ): Promise<OutgoingMessage> {
    return this.sendMessage(to, {
      react: {
        text: emoji,
        key: {
          id: targetMessageId,
          remoteJid: to,
        },
      },
    });
  }

  async sendLocation(to: string, location: LocationPayload): Promise<OutgoingMessage> {
    return this.sendMessage(to, {
      location: {
        degreesLatitude: location.latitude,
        degreesLongitude: location.longitude,
        name: location.name,
        address: location.address,
      },
    });
  }

  async sendContact(to: string, contact: ContactPayload): Promise<OutgoingMessage> {
    return this.sendMessage(to, {
      contacts: {
        displayName: contact.displayName,
        contacts: [
          {
            displayName: contact.displayName,
            vcard: contact.vcard,
          },
        ],
      },
    });
  }

  async editMessage(to: string, messageId: string, text: string): Promise<OutgoingMessage> {
    return this.queue.enqueue(async () => {
      const message = createTextMessage(to, text);
      const result = await this.socket.editMessage(to, messageId, text);
      const sent = {
        ...message,
        id: result.key.id ?? message.id,
        ack: "sent" as const,
      };
      this.bus.emit("message.sent", sent);
      return sent;
    });
  }

  async fetchGroups() {
    return this.socket.fetchGroups();
  }

  async subscribePresence(jid: string): Promise<void> {
    await this.socket.subscribePresence(jid);
  }

  async sendPresence(
    status: "available" | "composing" | "recording" | "paused" | "unavailable",
    jid?: string,
  ): Promise<void> {
    await this.socket.sendPresenceUpdate(status, jid);
  }

  async sendMessage(
    to: string,
    content: BerrySendMessageContent,
  ): Promise<OutgoingMessage> {
    return this.queue.enqueue(async () => {
      const normalized = await this.normalizeOutgoingMessage(to, content);
      const result = await normalized.dispatch();
      const sent = {
        ...normalized.message,
        id: result.key.id ?? normalized.message.id,
        ack: "sent" as const,
      };
      this.bus.emit("message.sent", sent);
      return sent;
    });
  }

  private async normalizeOutgoingMessage(
    to: string,
    content: BerrySendMessageContent,
  ): Promise<{
    message: OutgoingMessage;
    dispatch: () => Promise<{ key: { id?: string | null } }>;
  }> {
    if (typeof content.text === "string") {
      const text = content.text;
      const message = createTextMessage(to, text);
      return {
        message,
        dispatch: () =>
          this.socket.sendTransportMessage(to, { text, ...(content.ai ? { ai: true } : {}) }),
      };
    }

    if (content.image) {
      const media = await this.loadMediaPayload(content.image, {
        caption: content.caption,
        mimetype: content.mimetype,
        fileName: content.fileName,
      });
      return {
        message: {
          id: randomUUID(),
          to,
          timestamp: new Date().toISOString(),
          ack: "pending",
          type: "image",
          media,
        },
        dispatch: () =>
          this.socket.sendTransportMessage(to, {
            ...content,
            image: media.buffer!,
            caption: media.caption,
            mimetype: media.mimetype,
            fileName: media.fileName,
          }),
      };
    }

    if (content.audio) {
      const media = await this.loadMediaPayload(content.audio, {
        caption: undefined,
        mimetype: content.mimetype,
        fileName: content.fileName,
      });
      return {
        message: {
          id: randomUUID(),
          to,
          timestamp: new Date().toISOString(),
          ack: "pending",
          type: "audio",
          media,
        },
        dispatch: () =>
          this.socket.sendTransportMessage(to, {
            ...content,
            audio: media.buffer!,
            mimetype: media.mimetype,
          }),
      };
    }

    if (content.document) {
      const media = await this.loadMediaPayload(content.document, {
        caption: content.caption,
        mimetype: content.mimetype,
        fileName: content.fileName,
      });
      return {
        message: {
          id: randomUUID(),
          to,
          timestamp: new Date().toISOString(),
          ack: "pending",
          type: "document",
          media,
        },
        dispatch: () =>
          this.socket.sendTransportMessage(to, {
            ...content,
            document: media.buffer!,
            caption: media.caption,
            mimetype: media.mimetype ?? "application/octet-stream",
            fileName: media.fileName,
          }),
      };
    }

    if (content.buttonsMessage) {
      const message: OutgoingMessage = {
        id: randomUUID(),
        to,
        timestamp: new Date().toISOString(),
        ack: "pending",
        type: "buttons",
        buttons: content.buttonsMessage,
      };

      return {
        message,
        dispatch: () => this.socket.sendReplyButtonsMessage(to, content.buttonsMessage!),
      };
    }

    const list = content.list ?? content.listMessage;
    if (list) {
      const message: OutgoingMessage = {
        id: randomUUID(),
        to,
        timestamp: new Date().toISOString(),
        ack: "pending",
        type: "list",
        list,
      };

      return {
        message,
        dispatch: () => this.socket.sendListMessage(to, list),
      };
    }

    if (content.interactiveMessage) {
      const message: OutgoingMessage = {
        id: randomUUID(),
        to,
        timestamp: new Date().toISOString(),
        ack: "pending",
        type: "interactive",
        interactive: content.interactiveMessage,
      };

      return {
        message,
        dispatch: () => this.socket.sendInteractiveMessage(to, content.interactiveMessage!),
      };
    }

    if (content.react) {
      const message = createReactionMessage(
        to,
        content.react.text ?? "",
        content.react.key?.id ?? "",
      );
      return {
        message,
        dispatch: () =>
          this.socket.sendTransportMessage(to, {
            react: content.react!,
            ...(content.ai ? { ai: true } : {}),
          }),
      };
    }

    if (content.location) {
      const location = {
        latitude: content.location.degreesLatitude ?? 0,
        longitude: content.location.degreesLongitude ?? 0,
        name: content.location.name ?? undefined,
        address: content.location.address ?? undefined,
      };
      return {
        message: createLocationMessage(to, location),
        dispatch: () =>
          this.socket.sendTransportMessage(to, {
            location: content.location!,
            ...(content.ai ? { ai: true } : {}),
          }),
      };
    }

    if (content.contacts?.contacts?.[0]) {
      const contact = {
        displayName: content.contacts.displayName ?? content.contacts.contacts[0].displayName ?? "",
        vcard: content.contacts.contacts[0].vcard ?? "",
      };
      return {
        message: createContactMessage(to, contact),
        dispatch: () =>
          this.socket.sendTransportMessage(to, {
            contacts: content.contacts!,
            ...(content.ai ? { ai: true } : {}),
          }),
      };
    }

    throw new Error(
      "Unsupported message content. Use text, image, audio, document, buttonsMessage, list/listMessage, interactiveMessage, react, location or contacts.",
    );
  }

  private async loadMediaPayload(
    source: BerryMediaSource,
    extras: Pick<MediaPayload, "caption" | "mimetype" | "fileName">,
  ): Promise<MediaPayload> {
    if (Buffer.isBuffer(source)) {
      return {
        ...extras,
        buffer: source,
      };
    }

    if (typeof source === "object" && source && "url" in source) {
      const loaded = await this.media.load({
        url: String(source.url),
        ...extras,
      });
      return {
        ...extras,
        buffer: loaded.buffer,
        mimetype: extras.mimetype ?? loaded.metadata.mimetype,
        fileName: extras.fileName ?? loaded.metadata.fileName,
      };
    }

    throw new Error("Only Buffer or { url } media inputs are supported for BerryProtocol-compatible sends.");
  }

  private bindInternals(): void {
    this.bus.on("qr", async (qr) => {
      this.lastQr = qr;
      await this.sessions.update(this.options.sessionId, { qr });
    });

    this.bus.on("auth.link", async ({ value }) => {
      await this.sessions.update(this.options.sessionId, {
        authMethod: "link",
        linkCode: value,
      });
    });

    this.bus.on("auth.qr", async ({ value }) => {
      await this.sessions.update(this.options.sessionId, {
        authMethod: "qr",
        qr: value,
      });

      if (this.options.printQrInTerminal !== false) {
        qrcode.generate(value, {
          small: this.options.qrSmall ?? true,
        });
      }
    });

    this.bus.on("auth.pairing_code", async ({ code }) => {
      await this.sessions.update(this.options.sessionId, {
        authMethod: "pairing_code",
        pairingCode: code,
      });
    });

    this.bus.on("connection.open", async () => {
      const session = await this.sessions.update(this.options.sessionId, { registered: true });
      this.bus.emit("auth.success", session);
    });

    this.bus.on("protocol.error", async ({ error }) => {
      this.bus.emit("auth.error", {
        sessionId: this.options.sessionId,
        error,
      });
    });

    this.bus.on("message.received", (message: IncomingMessage) => {
      this.store.upsertMessages(this.options.sessionId, [message]);
    });

    this.bus.on("message.ack", (ack: MessageAck) => {
      this.store.upsertAck(this.options.sessionId, ack);
    });

    this.bus.on("presence.update", (_presence: PresenceRecord) => undefined);
    this.bus.on("chats.update", (chats) => {
      this.store.upsertChats(this.options.sessionId, chats);
    });
    this.bus.on("sync.contacts", (contacts) => {
      this.store.upsertContacts(this.options.sessionId, contacts);
    });
    this.bus.on("sync.groups", (groups) => {
      this.store.upsertGroups(this.options.sessionId, groups);
    });
  }
}

export class BerryProtocol extends BerryClient {}

export default BerryProtocol;

export * from "@berrysdk/events";
