import BerryProtocol, { type BerrySendRawOptions } from "@berrysdk/core";
import type { BerryApiEventName, InstanceRecord } from "../../types/index.js";
import type {
  ProviderConnectOptions,
  ProviderEventPayload,
  ProviderSendOptions,
  WhatsAppProvider,
} from "./WhatsAppProvider.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const toEventPayload = (
  event: BerryApiEventName,
  instanceName: string,
  payload: unknown,
): ProviderEventPayload => ({
  event,
  instanceName,
  payload,
  timestamp: new Date().toISOString(),
});

export class BerryProtocolProvider implements WhatsAppProvider {
  public readonly instanceName: string;
  private readonly client: BerryProtocol;
  private listeners = new Set<(event: ProviderEventPayload) => void>();
  private state: Record<string, unknown> = {
    status: "created",
    connectionState: "disconnected",
  };

  constructor(instance: Pick<InstanceRecord, "instanceName">) {
    this.instanceName = instance.instanceName;
    this.client = new BerryProtocol({
      sessionId: instance.instanceName,
      databasePath: env.BERRY_SQLITE_PATH,
      authFolder: env.BERRY_AUTH_FOLDER,
      printQrInTerminal: false,
      logger: logger.child({ module: "provider", instanceName: instance.instanceName }),
    });
    this.bindEvents();
  }

  async connect(options: ProviderConnectOptions): Promise<void> {
    this.state = {
      ...this.state,
      status: "connecting",
      connectionState: "connecting",
    };

    if (options.authMethod === "pairing_code") {
      if (!options.phoneNumber) {
        throw new Error("phoneNumber is required for pairing_code authentication.");
      }
      await this.client.connectWithPairingCode(options.phoneNumber);
      return;
    }

    if (options.authMethod === "link") {
      await this.client.connectWithLink();
      return;
    }

    await this.client.connectWithQr();
  }

  async reconnect(): Promise<void> {
    await this.client.reconnect();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
    this.state = {
      ...this.state,
      status: "disconnected",
      connectionState: "disconnected",
    };
  }

  async logout(): Promise<void> {
    await this.client.logout();
    this.state = {
      ...this.state,
      status: "logged_out",
      connectionState: "logged_out",
    };
  }

  async getConnectionState(): Promise<Record<string, unknown>> {
    return {
      ...this.state,
      qrCode: this.client.getQrCode(),
    };
  }

  async setPresence(
    presence: "available" | "composing" | "recording" | "paused" | "unavailable",
    jid?: string,
  ): Promise<void> {
    await this.client.sendPresence(presence, jid);
  }

  async sendText(to: string, text: string): Promise<unknown> {
    return this.client.sendText(to, text);
  }

  async sendImage(to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.client.sendImage(to, payload as never);
  }

  async sendAudio(to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.client.sendAudio(to, payload as never);
  }

  async sendDocument(to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.client.sendDocument(to, payload as never);
  }

  async sendButtons(to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.client.sendButtons(to, payload as never);
  }

  async sendList(to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.client.sendList(to, payload as never);
  }

  async sendCarousel(to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCarousel(to, payload as never);
  }

  async sendReaction(to: string, emoji: string, targetMessageId: string): Promise<unknown> {
    return this.client.sendReaction(to, emoji, targetMessageId);
  }

  async sendLocation(to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.client.sendLocation(to, payload as never);
  }

  async sendContact(to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.client.sendContact(to, payload as never);
  }

  async editMessage(to: string, messageId: string, text: string): Promise<unknown> {
    return this.client.editMessage(to, messageId, text);
  }

  async sendRaw(
    to: string,
    content: Record<string, unknown>,
    options?: ProviderSendOptions,
  ): Promise<unknown> {
    return this.client.sendRaw(to, content, options as BerrySendRawOptions | undefined);
  }

  async fetchGroups(): Promise<unknown[]> {
    return this.client.fetchGroups();
  }

  onEvent(listener: (event: ProviderEventPayload) => void): void {
    this.listeners.add(listener);
  }

  private emit(event: BerryApiEventName, payload: unknown): void {
    const envelope = toEventPayload(event, this.instanceName, payload);
    for (const listener of this.listeners) {
      listener(envelope);
    }
  }

  private bindEvents(): void {
    this.client.on("connection.open", (payload) => {
      this.state = {
        ...this.state,
        status: "connected",
        connectionState: "open",
      };
      this.emit("connection.update", payload);
    });

    this.client.on("connection.close", (payload) => {
      this.state = {
        ...this.state,
        status: "disconnected",
        connectionState: "closed",
      };
      this.emit("connection.update", payload);
    });

    this.client.on("connection.reconnecting", (payload) => {
      this.state = {
        ...this.state,
        status: "restarting",
        connectionState: "reconnecting",
      };
      this.emit("connection.update", payload);
    });

    this.client.on("auth.qr", (payload) => {
      this.state = {
        ...this.state,
        status: "qr_pending",
        connectionState: "qr",
        qrCode: payload.value,
      };
      this.emit("qrcode.updated", payload);
    });

    this.client.on("auth.pairing_code", (payload) => {
      this.state = {
        ...this.state,
        status: "qr_pending",
        connectionState: "pairing_code",
        pairingCode: payload.code,
      };
      this.emit("qrcode.updated", payload);
    });

    this.client.on("message.received", (payload) => this.emit("messages.upsert", payload));
    this.client.on("message.ack", (payload) => this.emit("messages.update", payload));
    this.client.on("chats.update", (payload) => this.emit("chats.update", payload));
    this.client.on("sync.contacts", (payload) => this.emit("contacts.update", payload));
    this.client.on("sync.groups", (payload) => this.emit("groups.update", payload));
    this.client.on("presence.update", (payload) => this.emit("presence.update", payload));
    this.client.on("message.sent", (payload) => this.emit("send.message", payload));
  }
}
