export type BerryApiEventName =
  | "connection.update"
  | "qrcode.updated"
  | "messages.upsert"
  | "messages.update"
  | "messages.delete"
  | "chats.update"
  | "contacts.update"
  | "groups.update"
  | "presence.update"
  | "send.message";

export type InstanceStatus =
  | "created"
  | "connecting"
  | "connected"
  | "disconnected"
  | "qr_pending"
  | "restarting"
  | "logged_out";

export interface InstanceSettings {
  rejectCall?: boolean;
  msgRetryCounterCache?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  syncFullHistory?: boolean;
  webhookByEvents?: boolean;
  events?: BerryApiEventName[];
  privacy?: Record<string, unknown>;
}

export interface WebhookConfig {
  enabled: boolean;
  url?: string;
  events: BerryApiEventName[];
  headers?: Record<string, string>;
}

export interface InstanceRecord {
  instanceName: string;
  provider: "berryprotocol";
  status: InstanceStatus;
  connectionState: string;
  authMethod: "qr" | "pairing_code" | "link";
  phoneNumber?: string;
  qrCode?: string;
  pairingCode?: string;
  webhook: WebhookConfig;
  settings: InstanceSettings;
  createdAt: string;
  updatedAt: string;
}
