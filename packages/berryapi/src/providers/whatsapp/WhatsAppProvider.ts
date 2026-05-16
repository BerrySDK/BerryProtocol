import type { BerryApiEventName, InstanceRecord } from "../../types/index.js";

export interface ProviderSendOptions {
  quoted?: unknown;
  mentions?: string[];
  contextInfo?: Record<string, unknown>;
  ephemeralExpiration?: number;
  forwardingScore?: number;
  statusJidList?: string[];
  [key: string]: unknown;
}

export interface ProviderConnectOptions {
  authMethod: InstanceRecord["authMethod"];
  phoneNumber?: string;
}

export interface ProviderEventPayload {
  event: BerryApiEventName;
  instanceName: string;
  payload: unknown;
  timestamp: string;
}

export interface WhatsAppProvider {
  readonly instanceName: string;
  connect(options: ProviderConnectOptions): Promise<void>;
  reconnect(): Promise<void>;
  disconnect(): Promise<void>;
  logout(): Promise<void>;
  getConnectionState(): Promise<Record<string, unknown>>;
  setPresence(presence: "available" | "composing" | "recording" | "paused" | "unavailable", jid?: string): Promise<void>;
  sendText(to: string, text: string): Promise<unknown>;
  sendImage(to: string, payload: Record<string, unknown>): Promise<unknown>;
  sendAudio(to: string, payload: Record<string, unknown>): Promise<unknown>;
  sendDocument(to: string, payload: Record<string, unknown>): Promise<unknown>;
  sendButtons(to: string, payload: Record<string, unknown>): Promise<unknown>;
  sendList(to: string, payload: Record<string, unknown>): Promise<unknown>;
  sendCarousel(to: string, payload: Record<string, unknown>): Promise<unknown>;
  sendReaction(to: string, emoji: string, targetMessageId: string): Promise<unknown>;
  sendLocation(to: string, payload: Record<string, unknown>): Promise<unknown>;
  sendContact(to: string, payload: Record<string, unknown>): Promise<unknown>;
  editMessage(to: string, messageId: string, text: string): Promise<unknown>;
  sendRaw(to: string, content: Record<string, unknown>, options?: ProviderSendOptions): Promise<unknown>;
  fetchGroups(): Promise<unknown[]>;
  onEvent(listener: (event: ProviderEventPayload) => void): void;
}
