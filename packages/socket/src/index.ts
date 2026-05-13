/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import makeWASocket, {
  type AnyMessageContent,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBerryWebVersion,
  generateWAMessageFromContent,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  type WAMessage,
  type WASocket,
} from "@berrysdk/transport";
import pino, { type Logger } from "pino";
import {
  type BerryAuthOptions,
  type BerryEventBus,
  type ButtonsPayload,
  type ChatRecord,
  type ContactRecord,
  type GroupRecord,
  type IncomingMessage,
  type InteractivePayload,
  type ListPayload,
  type MessageAck,
  type PresenceRecord,
  type SyncBundle,
} from "@berrysdk/events";
import {
  ackFromWebMessageStatus,
  buttonsPayloadToLegacyButtonsMessageContent,
  buttonsPayloadToNativeFlowInteractiveContent,
  interactivePayloadToMessageContent,
  interactiveNativeFlowAdditionalNodes,
  legacyListAdditionalNodes,
  listToLegacyListMessageContent,
  normalizeIncomingMessage,
} from "@berrysdk/wa-message";

export interface SocketOptions {
  sessionId: string;
  logger?: Logger;
  reconnectMaxAttempts?: number;
  reconnectDelayMs?: number;
  authFolder?: string;
  auth?: BerryAuthOptions;
}

type MessageContent = Record<string, unknown>;
const shouldDebugOutgoingMessages = process.env.BERRY_DEBUG_WA_MESSAGE === "1";

const debugJsonReplacer = (_key: string, value: unknown) => {
  if (Buffer.isBuffer(value)) {
    return `<Buffer ${value.length} bytes>`;
  }

  if (value instanceof Uint8Array) {
    return `<Uint8Array ${value.length} bytes>`;
  }

  return value;
};

const normalizePhoneNumber = (value: string): string => value.replace(/\D/g, "");

const generateNumericPairingCode = (): string =>
  Math.floor(10_000_000 + Math.random() * 90_000_000).toString();

const getStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as {
    output?: { statusCode?: number };
    data?: { attrs?: { code?: string | number } };
    message?: string;
  };

  const directCode = candidate.output?.statusCode;
  if (typeof directCode === "number") {
    return directCode;
  }

  const streamCode = candidate.data?.attrs?.code;
  if (typeof streamCode === "number") {
    return streamCode;
  }

  if (typeof streamCode === "string" && /^\d+$/.test(streamCode)) {
    return Number(streamCode);
  }

  if (typeof candidate.message === "string") {
    if (candidate.message.toLowerCase().includes("restart required")) {
      return DisconnectReason.restartRequired;
    }

    const match = candidate.message.match(/\b(401|408|411|428|440|500|503|515)\b/);
    if (match) {
      return Number(match[1]);
    }
  }

  return undefined;
};

const toChatRecord = (chat: Record<string, unknown>): ChatRecord => ({
  id: String(chat.id ?? ""),
  name: typeof chat.name === "string" ? chat.name : undefined,
  unreadCount: typeof chat.unreadCount === "number" ? chat.unreadCount : undefined,
  lastMessageAt:
    typeof chat.conversationTimestamp === "number"
      ? new Date(chat.conversationTimestamp * 1000).toISOString()
      : undefined,
});

const toContactRecord = (contact: Record<string, unknown>): ContactRecord => ({
  id: String(contact.id ?? ""),
  name: typeof contact.name === "string" ? contact.name : undefined,
  pushName: typeof contact.notify === "string" ? contact.notify : undefined,
  shortName: typeof contact.verifiedName === "string" ? contact.verifiedName : undefined,
});

const toGroupRecord = (group: Record<string, unknown>): GroupRecord => ({
  id: String(group.id ?? ""),
  subject: String(group.subject ?? ""),
  participants: Array.isArray(group.participants)
    ? group.participants
        .map((participant) =>
          typeof participant === "object" && participant && "id" in participant
            ? String((participant as { id?: string }).id ?? "")
            : "",
        )
        .filter(Boolean)
    : [],
});

export class BerrySocket {
  private readonly logger: Logger;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private manualClose = false;
  private sock?: WASocket;
  private connectPromise?: Promise<void>;
  private authFolder?: string;
  private auth: BerryAuthOptions;
  private pairingCodeRequested = false;
  private readonly retryCounterMap = new Map<string, unknown>();
  private readonly msgRetryCounterCache = {
    get: <T>(key: string) => this.retryCounterMap.get(key) as T | undefined,
    set: <T>(key: string, value: T) => {
      this.retryCounterMap.set(key, value);
      return true;
    },
    del: (key: string) => this.retryCounterMap.delete(key),
    flushAll: () => this.retryCounterMap.clear(),
  };
  private readonly sentMessages = new Map<string, WAMessage>();

  constructor(
    private readonly options: SocketOptions,
    private readonly bus: BerryEventBus,
  ) {
    this.logger = options.logger ?? pino({ name: "berry-socket" });
    this.auth = options.auth ?? { method: "link" };
  }

  setAuth(auth: BerryAuthOptions): void {
    const method = auth.method ?? "link";
    const customPairingCode =
      method === "pairing_code"
        ? this.resolvePairingCode(auth.customPairingCode)
        : auth.customPairingCode;

    this.auth = {
      method,
      phoneNumber: auth.phoneNumber ? normalizePhoneNumber(auth.phoneNumber) : undefined,
      customPairingCode,
    };
    this.pairingCodeRequested = false;
  }

  async connect(auth?: BerryAuthOptions): Promise<void> {
    if (auth) {
      this.setAuth(auth);
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.manualClose = false;
    this.pairingCodeRequested = false;
    this.connectPromise = this.connectUntilReady();
    return this.connectPromise.finally(() => {
      this.connectPromise = undefined;
    });
  }

  async disconnect(reason = "manual"): Promise<void> {
    this.manualClose = true;
    clearTimeout(this.reconnectTimer);
    this.sock?.end(new Error(reason));
    this.sock?.ws.close();
    this.sock = undefined;
  }

  async reconnect(): Promise<void> {
    await this.disconnect("reconnect");
    await this.connect();
  }

  async logout(): Promise<void> {
    this.manualClose = true;
    clearTimeout(this.reconnectTimer);
    await this.sock?.logout();
    this.sock = undefined;
  }

  async sendMessage(to: string, content: MessageContent): Promise<WAMessage> {
    if (!this.sock) {
      throw new Error("Socket is not connected.");
    }

    const result = await this.sock.sendMessage(to, content as never);
    if (!result) {
      throw new Error("WhatsApp did not return a message receipt for the send operation.");
    }

    if (result.key.id) {
      this.sentMessages.set(result.key.id, result);
    }

    return result;
  }

  async sendTransportMessage(to: string, content: AnyMessageContent): Promise<WAMessage> {
    return this.sendMessage(to, content as MessageContent);
  }

  async editMessage(to: string, messageId: string, text: string): Promise<WAMessage> {
    return this.sendTransportMessage(to, {
      text,
      edit: {
        remoteJid: to,
        fromMe: true,
        id: messageId,
      },
    });
  }

  async sendLegacyButtonsMessage(to: string, buttons: ButtonsPayload): Promise<WAMessage> {
    if (!this.sock?.user?.id) {
      throw new Error("Socket is not connected.");
    }

    const content = buttonsPayloadToLegacyButtonsMessageContent(buttons);
    const fullMessage = generateWAMessageFromContent(to, content, {
      userJid: this.sock.user.id,
    });
    this.logOutgoingMessage("buttons-legacy", fullMessage);

    await this.sock.relayMessage(to, fullMessage.message!, {
      messageId: fullMessage.key.id!,
    });

    return fullMessage as WAMessage;
  }

  async sendInteractiveMessage(to: string, interactive: InteractivePayload): Promise<WAMessage> {
    if (!this.sock?.user?.id) {
      throw new Error("Socket is not connected.");
    }

    const content = interactivePayloadToMessageContent(interactive);
    const fullMessage = generateWAMessageFromContent(to, content, {
      userJid: this.sock.user.id,
    });
    this.logOutgoingMessage("interactive", fullMessage);

    await this.sock.relayMessage(to, fullMessage.message!, {
      messageId: fullMessage.key.id!,
      additionalNodes: interactiveNativeFlowAdditionalNodes(),
    });

    return fullMessage as WAMessage;
  }

  async sendReplyButtonsMessage(to: string, buttons: ButtonsPayload): Promise<WAMessage> {
    if (!this.sock?.user?.id) {
      throw new Error("Socket is not connected.");
    }

    const content = buttonsPayloadToNativeFlowInteractiveContent(buttons);
    const fullMessage = generateWAMessageFromContent(to, content, {
      userJid: this.sock.user.id,
    });
    this.logOutgoingMessage("buttons", fullMessage);

    await this.sock.relayMessage(to, fullMessage.message!, {
      messageId: fullMessage.key.id!,
      additionalNodes: interactiveNativeFlowAdditionalNodes(),
    });

    return fullMessage as WAMessage;
  }

  async sendListMessage(to: string, list: ListPayload): Promise<WAMessage> {
    if (!this.sock?.user?.id) {
      throw new Error("Socket is not connected.");
    }

    const content = listToLegacyListMessageContent(list);
    const fullMessage = generateWAMessageFromContent(to, content, {
      userJid: this.sock.user.id,
    });
    this.logOutgoingMessage("list", fullMessage);

    await this.sock.relayMessage(to, fullMessage.message!, {
      messageId: fullMessage.key.id!,
      additionalNodes: legacyListAdditionalNodes(),
    });

    return fullMessage as WAMessage;
  }

  async subscribePresence(jid: string): Promise<void> {
    if (!this.sock) {
      throw new Error("Socket is not connected.");
    }

    await this.sock.presenceSubscribe(jid);
  }

  async sendPresenceUpdate(
    status: "available" | "composing" | "recording" | "paused" | "unavailable",
    jid?: string,
  ): Promise<void> {
    if (!this.sock) {
      throw new Error("Socket is not connected.");
    }

    await this.sock.sendPresenceUpdate(status, jid);
  }

  async fetchGroups(): Promise<GroupRecord[]> {
    if (!this.sock) {
      throw new Error("Socket is not connected.");
    }

    const groups = await this.sock.groupFetchAllParticipating();
    return Object.values(groups).map((group) =>
      toGroupRecord(group as unknown as Record<string, unknown>),
    );
  }

  async downloadMedia(message: WAMessage): Promise<Buffer> {
    const data = await downloadMediaMessage(message, "buffer", {});
    return Buffer.isBuffer(data) ? data : Buffer.from(data);
  }

  private async connectUntilReady(): Promise<void> {
    while (true) {
      const outcome = await this.createSocketAndWaitUntilOpen();
      if (outcome === "open") {
        return;
      }

      if (outcome === "restart_required") {
        this.bus.emit("connection.reconnecting", {
          sessionId: this.options.sessionId,
          attempt: this.reconnectAttempts + 1,
          delayMs: 0,
        });
        this.sock = undefined;
        continue;
      }

      return;
    }
  }

  private async createSocketAndWaitUntilOpen(): Promise<"open" | "restart_required"> {
    const sessionDir = await this.ensureAuthDir();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBerryWebVersion();

    return new Promise<"open" | "restart_required">((resolve, reject) => {
      const sock = makeWASocket({
        version,
        logger: this.logger,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, this.logger),
        },
        printQRInTerminal: false,
        syncFullHistory: true,
        markOnlineOnConnect: false,
        emitOwnEvents: true,
        msgRetryCounterCache: this.msgRetryCounterCache,
        getMessage: async (key) => {
          if (!key.id) {
            return undefined;
          }

          return this.sentMessages.get(key.id)?.message ?? undefined;
        },
      });

      this.sock = sock;

      sock.ev.on("creds.update", () => {
        void saveCreds();
      });

      sock.ev.on("connection.update", (update) => {
        if (update.qr) {
          this.bus.emit("qr", update.qr);
          this.bus.emit("auth.link", {
            sessionId: this.options.sessionId,
            value: update.qr,
          });
          this.bus.emit("auth.qr", {
            sessionId: this.options.sessionId,
            value: update.qr,
          });
          void this.maybeRequestPairingCode(sock);
        }

        if (update.connection === "open") {
          this.reconnectAttempts = 0;
          this.bus.emit("connection.open", {
            sessionId: this.options.sessionId,
            connectedAt: new Date().toISOString(),
          });
          resolve("open");
          return;
        }

        if (update.connection === "close") {
          const statusCode = getStatusCode(update.lastDisconnect?.error);
          const reason =
            statusCode === DisconnectReason.loggedOut
              ? "logged_out"
              : statusCode === DisconnectReason.restartRequired
                ? "restart_required"
                : "connection_closed";

          this.bus.emit("connection.close", {
            sessionId: this.options.sessionId,
            disconnectedAt: new Date().toISOString(),
            reason,
          });

          if (statusCode === DisconnectReason.loggedOut) {
            reject(new Error("WhatsApp session logged out."));
            return;
          }

          if (statusCode === DisconnectReason.restartRequired) {
            resolve("restart_required");
            return;
          }

          if (!this.manualClose) {
            this.scheduleReconnect();
          }
        }
      });

      sock.ev.on("messages.upsert", ({ messages, type }) => {
        for (const message of messages) {
          const normalized = normalizeIncomingMessage(message);
          if (!normalized) {
            continue;
          }

          if (!message.key.fromMe && type === "notify") {
            this.bus.emit("message.received", normalized);
          }
        }
      });

      sock.ev.on("messages.update", (updates) => {
        for (const item of updates) {
          const ack: MessageAck = {
            messageId: item.key.id ?? "",
            remoteJid: item.key.remoteJid ?? "",
            ack: ackFromWebMessageStatus(item.update.status),
            updatedAt: new Date().toISOString(),
          };
          this.bus.emit("message.ack", ack);
        }
      });

      sock.ev.on("message-receipt.update", (receipts) => {
        for (const receipt of receipts) {
          this.bus.emit("message.ack", {
            messageId: receipt.key.id ?? "",
            remoteJid: receipt.key.remoteJid ?? "",
            ack: receipt.receipt.readTimestamp ? "read" : "delivered",
            updatedAt: new Date().toISOString(),
          });
        }
      });

      sock.ev.on("presence.update", ({ id, presences }) => {
        for (const presence of Object.values(presences)) {
          const payload: PresenceRecord = {
            id,
            status: (presence.lastKnownPresence as PresenceRecord["status"]) ?? "available",
            lastSeenAt:
              typeof presence.lastSeen === "number"
                ? new Date(presence.lastSeen * 1000).toISOString()
                : undefined,
          };
          this.bus.emit("presence.update", payload);
        }
      });

      sock.ev.on("chats.update", (chats) => {
        this.bus.emit(
          "chats.update",
          chats.map((chat) => toChatRecord(chat as unknown as Record<string, unknown>)),
        );
      });

      sock.ev.on("contacts.upsert", (contacts) => {
        this.bus.emit(
          "sync.contacts",
          contacts.map((contact) => toContactRecord(contact as unknown as Record<string, unknown>)),
        );
      });

      sock.ev.on("groups.upsert", (groups) => {
        this.bus.emit(
          "sync.groups",
          groups.map((group) => toGroupRecord(group as unknown as Record<string, unknown>)),
        );
      });

      sock.ev.on("messaging-history.set", ({ chats, contacts, messages }) => {
        const incomingMessages = messages
          .map((message) => normalizeIncomingMessage(message))
          .filter((message): message is IncomingMessage => !!message);

        const payload: SyncBundle = {
          contacts: contacts.map((contact) =>
            toContactRecord(contact as unknown as Record<string, unknown>),
          ),
          chats: chats.map((chat) => toChatRecord(chat as unknown as Record<string, unknown>)),
          groups: [],
          messages: incomingMessages,
        };

        this.bus.emit("sync.history", payload);
        this.bus.emit("sync.messages", incomingMessages);
      });
    });
  }

  private scheduleReconnect(): void {
    const maxAttempts = this.options.reconnectMaxAttempts ?? 10;
    if (this.reconnectAttempts >= maxAttempts) {
      return;
    }

    this.reconnectAttempts += 1;
    const delayMs = (this.options.reconnectDelayMs ?? 3_000) * this.reconnectAttempts;
    this.bus.emit("connection.reconnecting", {
      sessionId: this.options.sessionId,
      attempt: this.reconnectAttempts,
      delayMs,
    });

    this.reconnectTimer = setTimeout(() => {
      void this.connect().catch((error) => {
        this.bus.emit("protocol.error", {
          sessionId: this.options.sessionId,
          error: (error as Error).message,
        });
      });
    }, delayMs);
  }

  private async ensureAuthDir(): Promise<string> {
    const baseFolder = this.options.authFolder ?? join(process.cwd(), ".berry-sessions");
    const sessionDir = join(baseFolder, this.options.sessionId);
    await mkdir(sessionDir, { recursive: true });
    this.authFolder = sessionDir;
    return sessionDir;
  }

  private async maybeRequestPairingCode(sock: WASocket): Promise<void> {
    if (this.auth.method !== "pairing_code") {
      return;
    }

    if (this.pairingCodeRequested || sock.authState.creds.registered) {
      return;
    }

    if (!this.auth.phoneNumber) {
      this.bus.emit("protocol.error", {
        sessionId: this.options.sessionId,
        error: "phoneNumber is required for pairing_code authentication.",
      });
      return;
    }

    this.pairingCodeRequested = true;

    try {
      const code = await sock.requestPairingCode(
        this.auth.phoneNumber,
        this.auth.customPairingCode,
      );
      this.bus.emit("auth.pairing_code", {
        sessionId: this.options.sessionId,
        phoneNumber: this.auth.phoneNumber,
        code,
      });
    } catch (error) {
      this.pairingCodeRequested = false;
      this.bus.emit("protocol.error", {
        sessionId: this.options.sessionId,
        error: `Unable to request pairing code: ${(error as Error).message}`,
      });
    }
  }

  private resolvePairingCode(customPairingCode?: string): string {
    if (!customPairingCode) {
      return generateNumericPairingCode();
    }

    const normalized = customPairingCode.replace(/\D/g, "");
    if (!/^\d{8}$/.test(normalized)) {
      throw new Error("Pairing code must be exactly 8 numeric digits.");
    }

    return normalized;
  }

  private logOutgoingMessage(kind: string, message: WAMessage): void {
    if (!shouldDebugOutgoingMessages) {
      return;
    }

    this.logger.info(
      {
        kind,
        key: message.key,
        message: JSON.parse(JSON.stringify(message.message, debugJsonReplacer)),
      },
      "berry outgoing message",
    );
  }
}
