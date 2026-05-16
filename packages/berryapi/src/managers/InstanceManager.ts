import { and, eq } from "drizzle-orm";
import { db } from "../database/client.js";
import { instancesTable, type InstanceRow } from "../database/schema.js";
import type { BerryApiEventName, InstanceRecord, InstanceSettings, WebhookConfig } from "../types/index.js";
import { HttpError } from "../utils/http-error.js";
import { BerryProtocolProvider } from "../providers/whatsapp/BerryProtocolProvider.js";
import type { ProviderEventPayload, ProviderSendOptions, WhatsAppProvider } from "../providers/whatsapp/WhatsAppProvider.js";
import { WebhookDispatcher } from "../webhook/WebhookDispatcher.js";
import { RealtimeGateway } from "../realtime/RealtimeGateway.js";

type CreateInstanceInput = {
  instanceName: string;
  authMethod?: InstanceRecord["authMethod"];
  phoneNumber?: string;
  webhook?: Partial<WebhookConfig>;
  settings?: Partial<InstanceSettings>;
};

type UpdateInstanceStateInput = Partial<Pick<InstanceRecord, "status" | "connectionState" | "qrCode" | "pairingCode">>;

const nowIso = () => new Date().toISOString();

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const rowToInstance = (row: InstanceRow): InstanceRecord => ({
  instanceName: row.name,
  provider: "berryprotocol",
  status: row.status as InstanceRecord["status"],
  connectionState: row.connectionState,
  authMethod: row.authMethod as InstanceRecord["authMethod"],
  phoneNumber: row.phoneNumber ?? undefined,
  qrCode: row.qrCode ?? undefined,
  pairingCode: row.pairingCode ?? undefined,
  webhook: {
    enabled: !!row.webhookUrl,
    url: row.webhookUrl ?? undefined,
    events: parseJson<BerryApiEventName[]>(row.webhookEvents, []),
  },
  settings: parseJson<InstanceSettings>(row.settingsJson, {}),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class InstanceManager {
  private readonly providers = new Map<string, WhatsAppProvider>();

  constructor(
    private readonly realtime: RealtimeGateway,
    private readonly webhooks: WebhookDispatcher,
  ) {}

  async bootstrap(): Promise<void> {
    const rows = await db.select().from(instancesTable);
    for (const row of rows) {
      this.ensureProvider(rowToInstance(row));
    }
  }

  async createInstance(input: CreateInstanceInput): Promise<InstanceRecord> {
    const instanceName = input.instanceName.trim();
    if (!instanceName) {
      throw new HttpError(400, "instanceName is required.");
    }

    const existing = await this.findInstance(instanceName);
    if (existing) {
      throw new HttpError(409, "Instance already exists.");
    }

    const webhookEvents = input.webhook?.events ?? [];
    const settings = input.settings ?? {};
    const createdAt = nowIso();

    await db.insert(instancesTable).values({
      name: instanceName,
      provider: "berryprotocol",
      status: "created",
      connectionState: "disconnected",
      authMethod: input.authMethod ?? "qr",
      phoneNumber: input.phoneNumber,
      webhookUrl: input.webhook?.url,
      webhookEvents: JSON.stringify(webhookEvents),
      settingsJson: JSON.stringify(settings),
      metadataJson: JSON.stringify({}),
      createdAt,
      updatedAt: createdAt,
    });

    const instance = await this.getInstance(instanceName);
    this.ensureProvider(instance);
    return instance;
  }

  async fetchInstances(): Promise<InstanceRecord[]> {
    const rows = await db.select().from(instancesTable);
    return rows.map(rowToInstance);
  }

  async getInstance(instanceName: string): Promise<InstanceRecord> {
    const found = await this.findInstance(instanceName);
    if (!found) {
      throw new HttpError(404, "Instance not found.");
    }

    return found;
  }

  async connectInstance(instanceName: string): Promise<InstanceRecord> {
    const instance = await this.getInstance(instanceName);
    const provider = this.ensureProvider(instance);
    await this.updateInstanceState(instanceName, {
      status: "connecting",
      connectionState: "connecting",
    });
    await provider.connect({
      authMethod: instance.authMethod,
      phoneNumber: instance.phoneNumber,
    });
    return this.getInstance(instanceName);
  }

  async restartInstance(instanceName: string): Promise<InstanceRecord> {
    const instance = await this.getInstance(instanceName);
    const provider = this.ensureProvider(instance);
    await this.updateInstanceState(instanceName, {
      status: "restarting",
      connectionState: "reconnecting",
    });
    await provider.reconnect();
    return this.getInstance(instanceName);
  }

  async getConnectionState(instanceName: string): Promise<Record<string, unknown>> {
    const instance = await this.getInstance(instanceName);
    const provider = this.ensureProvider(instance);
    const runtimeState = await provider.getConnectionState();
    return {
      instanceName,
      ...runtimeState,
    };
  }

  async logoutInstance(instanceName: string): Promise<InstanceRecord> {
    const provider = this.providers.get(instanceName);
    if (provider) {
      await provider.logout();
    }
    await this.updateInstanceState(instanceName, {
      status: "logged_out",
      connectionState: "logged_out",
      qrCode: undefined,
      pairingCode: undefined,
    });
    return this.getInstance(instanceName);
  }

  async deleteInstance(instanceName: string): Promise<void> {
    const provider = this.providers.get(instanceName);
    if (provider) {
      await provider.logout().catch(() => undefined);
      this.providers.delete(instanceName);
    }

    await db.delete(instancesTable).where(eq(instancesTable.name, instanceName));
  }

  async setPresence(
    instanceName: string,
    presence: "available" | "composing" | "recording" | "paused" | "unavailable",
    jid?: string,
  ): Promise<void> {
    const provider = this.ensureProvider(await this.getInstance(instanceName));
    await provider.setPresence(presence, jid);
  }

  async sendRawMessage(
    instanceName: string,
    to: string,
    content: Record<string, unknown>,
    options?: ProviderSendOptions,
  ): Promise<unknown> {
    const provider = this.ensureProvider(await this.getInstance(instanceName));
    return provider.sendRaw(to, content, options);
  }

  async sendText(instanceName: string, to: string, text: string): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).sendText(to, text);
  }

  async sendImage(instanceName: string, to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).sendImage(to, payload);
  }

  async sendAudio(instanceName: string, to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).sendAudio(to, payload);
  }

  async sendDocument(instanceName: string, to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).sendDocument(to, payload);
  }

  async sendButtons(instanceName: string, to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).sendButtons(to, payload);
  }

  async sendList(instanceName: string, to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).sendList(to, payload);
  }

  async sendCarousel(instanceName: string, to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).sendCarousel(to, payload);
  }

  async sendReaction(instanceName: string, to: string, emoji: string, targetMessageId: string): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).sendReaction(to, emoji, targetMessageId);
  }

  async sendLocation(instanceName: string, to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).sendLocation(to, payload);
  }

  async sendContact(instanceName: string, to: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).sendContact(to, payload);
  }

  async editMessage(instanceName: string, to: string, messageId: string, text: string): Promise<unknown> {
    return this.ensureProvider(await this.getInstance(instanceName)).editMessage(to, messageId, text);
  }

  async fetchGroups(instanceName: string): Promise<unknown[]> {
    const provider = this.ensureProvider(await this.getInstance(instanceName));
    return provider.fetchGroups();
  }

  async setWebhook(instanceName: string, input: Partial<WebhookConfig>): Promise<InstanceRecord> {
    const instance = await this.getInstance(instanceName);
    const webhook: WebhookConfig = {
      enabled: input.enabled ?? true,
      url: input.url ?? instance.webhook.url,
      events: input.events ?? instance.webhook.events,
      headers: input.headers ?? instance.webhook.headers,
    };

    await db
      .update(instancesTable)
      .set({
        webhookUrl: webhook.url ?? null,
        webhookEvents: JSON.stringify(webhook.events),
        updatedAt: nowIso(),
      })
      .where(eq(instancesTable.name, instanceName));

    return this.getInstance(instanceName);
  }

  async getWebhook(instanceName: string): Promise<WebhookConfig> {
    const instance = await this.getInstance(instanceName);
    return instance.webhook;
  }

  async setSettings(instanceName: string, input: Partial<InstanceSettings>): Promise<InstanceRecord> {
    const instance = await this.getInstance(instanceName);
    const settings = {
      ...instance.settings,
      ...input,
    };

    await db
      .update(instancesTable)
      .set({
        settingsJson: JSON.stringify(settings),
        updatedAt: nowIso(),
      })
      .where(eq(instancesTable.name, instanceName));

    return this.getInstance(instanceName);
  }

  async getSettings(instanceName: string): Promise<InstanceSettings> {
    const instance = await this.getInstance(instanceName);
    return instance.settings;
  }

  private async findInstance(instanceName: string): Promise<InstanceRecord | null> {
    const row = await db.query.instancesTable.findFirst({
      where: eq(instancesTable.name, instanceName),
    });
    return row ? rowToInstance(row) : null;
  }

  private ensureProvider(instance: InstanceRecord): WhatsAppProvider {
    const existing = this.providers.get(instance.instanceName);
    if (existing) {
      return existing;
    }

    const provider = new BerryProtocolProvider(instance);
    provider.onEvent((event) => {
      void this.handleProviderEvent(instance.instanceName, event);
    });
    this.providers.set(instance.instanceName, provider);
    return provider;
  }

  private async handleProviderEvent(
    instanceName: string,
    event: ProviderEventPayload,
  ): Promise<void> {
    if (event.event === "connection.update") {
      const payload = event.payload as Record<string, unknown>;
      await this.updateInstanceState(instanceName, {
        status:
          payload.connectedAt
            ? "connected"
            : payload.reason === "logged_out"
              ? "logged_out"
              : payload.reason === "restart_required"
                ? "restarting"
                : "disconnected",
        connectionState: String(payload.reason ?? (payload.connectedAt ? "open" : "disconnected")),
      });
    }

    if (event.event === "qrcode.updated") {
      const payload = event.payload as Record<string, unknown>;
      await this.updateInstanceState(instanceName, {
        status: "qr_pending",
        connectionState: payload.code ? "pairing_code" : "qr",
        qrCode: typeof payload.value === "string" ? payload.value : undefined,
        pairingCode: typeof payload.code === "string" ? payload.code : undefined,
      });
    }

    this.realtime.broadcast(event);
    const instance = await this.getInstance(instanceName).catch(() => null);
    if (instance) {
      await this.webhooks.dispatch(instance.webhook, event);
    }
  }

  private async updateInstanceState(
    instanceName: string,
    update: UpdateInstanceStateInput,
  ): Promise<void> {
    const current = await this.getInstance(instanceName);
    await db
      .update(instancesTable)
      .set({
        status: update.status ?? current.status,
        connectionState: update.connectionState ?? current.connectionState,
        qrCode: update.qrCode === undefined ? current.qrCode ?? null : update.qrCode,
        pairingCode: update.pairingCode === undefined ? current.pairingCode ?? null : update.pairingCode,
        updatedAt: nowIso(),
      })
      .where(eq(instancesTable.name, instanceName));
  }
}
