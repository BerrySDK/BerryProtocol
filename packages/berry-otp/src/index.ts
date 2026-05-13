/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import crypto, { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { renderOTPTemplate } from "./templates.js";
import { MemoryOTPStore } from "./store.js";
import type {
  BerryOTPEventMap,
  BerryOTPOptions,
  BerryOTPPublicRecord,
  BerryOTPRecord,
  BerryOTPSendOptions,
  BerryOTPSendResult,
  BerryOTPStatus,
  BerryOTPStore,
  BerryOTPTemplate,
  BerryOTPVerifyResult,
} from "./types.js";

export interface BerryOTPClient {
  on(event: "message.received", listener: (message: BerryOTPIncomingMessage) => void): unknown;
  off(event: "message.received", listener: (message: BerryOTPIncomingMessage) => void): unknown;
  sendMessage(to: string, content: Record<string, unknown>): Promise<{ id: string }>;
  sendLegacyButtons(
    to: string,
    payload: {
      text: string;
      footer?: string;
      buttons: Array<{ id: string; title: string; kind?: "reply" | "quick_reply" | "copy_code" | "cta_url"; code?: string; url?: string }>;
    },
  ): Promise<{ id: string }>;
  sendText(to: string, text: string): Promise<{ id: string }>;
  editMessage(to: string, messageId: string, text: string): Promise<{ id: string }>;
}

export interface BerryOTPIncomingMessage {
  buttonId?: string;
  selectedButtonId?: string;
  rawButtonParamsJson?: string;
}

type FlowDefaults = {
  template: BerryOTPTemplate;
  purpose: string;
  issuer: string;
  ttlMs: number;
};

const DEFAULTS: Required<Omit<BerryOTPOptions, "store">> = {
  issuer: "BerryOTP",
  codeLength: 6,
  ttlMs: 5 * 60 * 1000,
  footer: "Este código dura {minutes} minutos.",
  editOnExpire: true,
  mode: "copy-code",
  maxAttempts: 5,
  rateLimitMs: 60 * 1000,
  autoReplyOnDenied: true,
};

const EXPIRED_TEXT = [
  "🔒 Código expirado",
  "",
  "Este código não é mais válido.",
  "Solicite um novo código para continuar.",
].join("\n");

const DENIED_REPLY_TEXT = "Entendido. Esse código foi cancelado e não poderá ser usado.";

export class BerryOTP extends EventEmitter {
  private readonly options: Required<Omit<BerryOTPOptions, "store">> & { store: BerryOTPStore };
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly recipientIndex = new Map<string, Set<string>>();
  private readonly lastSentByRecipient = new Map<string, number>();
  private readonly flowDefaults: FlowDefaults;
  private readonly boundIncomingListener: (message: BerryOTPIncomingMessage) => void;
  private readonly cleaner: NodeJS.Timeout;

  constructor(
    private readonly client: BerryOTPClient,
    options: BerryOTPOptions = {},
    flowDefaults?: Partial<FlowDefaults>,
  ) {
    super();

    if (!client) {
      throw new Error("BerryOTP requires a BerryClient instance.");
    }

    this.options = {
      ...DEFAULTS,
      ...options,
      store: options.store ?? new MemoryOTPStore(),
    };
    this.flowDefaults = {
      template: flowDefaults?.template ?? "generic",
      purpose: flowDefaults?.purpose ?? "continuar",
      issuer: flowDefaults?.issuer ?? this.options.issuer,
      ttlMs: flowDefaults?.ttlMs ?? this.options.ttlMs,
    };
    this.boundIncomingListener = (message) => {
      void this.handleIncomingMessage(message);
    };

    this.client.on("message.received", this.boundIncomingListener);
    this.cleaner = setInterval(() => {
      void this.cleanup().catch((error) => this.emit("error", error as Error));
    }, 60 * 1000);
    this.cleaner.unref?.();
  }

  static createLoginFlow(client: BerryOTPClient, options: BerryOTPOptions = {}): BerryOTP {
    return new BerryOTP(client, {
      ...options,
      issuer: options.issuer ?? "Berry Login",
      ttlMs: options.ttlMs ?? 5 * 60 * 1000,
    }, {
      template: "login",
      purpose: "entrar na conta",
      issuer: options.issuer ?? "Berry Login",
      ttlMs: options.ttlMs ?? 5 * 60 * 1000,
    });
  }

  static createPasswordResetFlow(client: BerryOTPClient, options: BerryOTPOptions = {}): BerryOTP {
    return new BerryOTP(client, {
      ...options,
      issuer: options.issuer ?? "Berry Password Reset",
      ttlMs: options.ttlMs ?? 10 * 60 * 1000,
    }, {
      template: "password_reset",
      purpose: "redefinir sua senha",
      issuer: options.issuer ?? "Berry Password Reset",
      ttlMs: options.ttlMs ?? 10 * 60 * 1000,
    });
  }

  static create2FAFlow(client: BerryOTPClient, options: BerryOTPOptions = {}): BerryOTP {
    return new BerryOTP(client, {
      ...options,
      issuer: options.issuer ?? "Berry 2FA",
      ttlMs: options.ttlMs ?? 3 * 60 * 1000,
    }, {
      template: "2fa",
      purpose: "confirmar sua autenticação em duas etapas",
      issuer: options.issuer ?? "Berry 2FA",
      ttlMs: options.ttlMs ?? 3 * 60 * 1000,
    });
  }

  on<EventName extends keyof BerryOTPEventMap>(
    event: EventName,
    listener: (payload: BerryOTPEventMap[EventName]) => void,
  ): this {
    return super.on(event, listener);
  }

  once<EventName extends keyof BerryOTPEventMap>(
    event: EventName,
    listener: (payload: BerryOTPEventMap[EventName]) => void,
  ): this {
    return super.once(event, listener);
  }

  async send(to: string, options: BerryOTPSendOptions = {}): Promise<BerryOTPSendResult> {
    this.assertRecipient(to);
    this.assertRateLimit(to);

    const id = randomUUID();
    const ttlMs = options.ttlMs ?? this.flowDefaults.ttlMs ?? this.options.ttlMs;
    const code = options.code ?? this.generateCode(this.options.codeLength);
    const expiresAt = Date.now() + ttlMs;
    const salt = randomUUID();
    const codeHash = this.hashCode(code, salt);
    const template = options.template ?? this.flowDefaults.template;
    const issuer = this.flowDefaults.issuer ?? this.options.issuer;
    const purpose = options.purpose ?? this.flowDefaults.purpose;
    const footer = this.formatFooter(options.footer ?? this.options.footer, ttlMs);
    const { text } = renderOTPTemplate({
      issuer,
      code,
      purpose,
      ttlMs,
      template,
    });

    const sentMessage =
      this.options.mode === "stable"
        ? await this.client.sendLegacyButtons(to, {
            text,
            footer,
            buttons: [
              {
                id: `berryotp:not_requested:${id}`,
                title: "Não pedi nenhum código",
              },
            ],
          })
        : await this.client.sendMessage(to, {
            buttonsMessage: {
              text,
              footer,
              buttons: [
                {
                  id: `berryotp:copy:${id}`,
                  title: "Copiar código",
                  kind: "copy_code",
                  code,
                },
                {
                  id: `berryotp:not_requested:${id}`,
                  title: "Não pedi nenhum código",
                  kind: "quick_reply",
                },
              ],
            },
          });

    const record: BerryOTPRecord = {
      id,
      to,
      codeHash,
      salt,
      messageId: sentMessage.id,
      expiresAt,
      status: "active",
      attempts: 0,
      metadata: options.metadata,
      createdAt: Date.now(),
    };

    await this.options.store.create(record);
    this.addRecipientRecord(to, id);
    this.lastSentByRecipient.set(to, Date.now());
    this.scheduleExpiration(record);

    const result: BerryOTPSendResult = {
      id,
      to,
      code,
      expiresAt: new Date(expiresAt),
      messageId: sentMessage.id,
      status: "sent",
    };

    this.emit("sent", {
      ...result,
      metadata: options.metadata,
    });

    return result;
  }

  async verify(to: string, code: string): Promise<BerryOTPVerifyResult> {
    this.assertRecipient(to);
    const activeRecords = await this.getRecipientRecords(to);
    const latest = activeRecords[0];

    if (!latest) {
      return { valid: false, reason: "not_found" };
    }

    if (latest.status === "used") {
      return { valid: false, reason: "already_used", metadata: latest.metadata };
    }

    if (latest.status === "denied") {
      return { valid: false, reason: "denied", metadata: latest.metadata };
    }

    if (latest.status === "blocked" || latest.attempts >= this.options.maxAttempts) {
      await this.options.store.update(latest.id, { status: "blocked" });
      return { valid: false, reason: "too_many_attempts", metadata: latest.metadata };
    }

    if (Date.now() > latest.expiresAt) {
      await this.expireRecord(latest.id, latest);
      return { valid: false, reason: "expired", metadata: latest.metadata };
    }

    for (const record of activeRecords.filter((candidate) => candidate.status === "active")) {
      if (Date.now() > record.expiresAt) {
        await this.expireRecord(record.id, record);
        continue;
      }

      const candidateHash = this.hashCode(code, record.salt);
      if (this.safeCompare(candidateHash, record.codeHash)) {
        const usedAt = Date.now();
        await this.options.store.update(record.id, {
          status: "used",
          usedAt,
        });
        this.clearTimer(record.id);
        this.emit("used", {
          otpId: record.id,
          to: record.to,
          metadata: record.metadata,
        });
        return {
          valid: true,
          metadata: record.metadata,
        };
      }
    }

    const attempts = latest.attempts + 1;
    const nextStatus: BerryOTPStatus =
      attempts >= this.options.maxAttempts ? "blocked" : latest.status;

    await this.options.store.update(latest.id, {
      attempts,
      status: nextStatus,
    });

    return {
      valid: false,
      reason: attempts >= this.options.maxAttempts ? "too_many_attempts" : "invalid_code",
      metadata: latest.metadata,
    };
  }

  async cancel(id: string, reason = "cancelled"): Promise<void> {
    const record = await this.options.store.get(id);
    if (!record || record.status !== "active") {
      return;
    }

    await this.options.store.update(id, {
      status: "denied",
      deniedAt: Date.now(),
    });
    this.clearTimer(id);
    this.emit("denied", {
      otpId: id,
      to: record.to,
      metadata: record.metadata,
      reason,
    });
  }

  async get(id: string): Promise<BerryOTPPublicRecord | null> {
    const record = await this.options.store.get(id);
    return record ? this.toPublicRecord(record) : null;
  }

  async cleanup(): Promise<void> {
    const before = Date.now() - 10 * 60 * 1000;
    await this.options.store.cleanup(before);

    for (const [to, ids] of this.recipientIndex.entries()) {
      for (const id of [...ids]) {
        const record = await this.options.store.get(id);
        if (!record) {
          ids.delete(id);
          this.clearTimer(id);
        }
      }

      if (ids.size === 0) {
        this.recipientIndex.delete(to);
      }
    }
  }

  dispose(): void {
    this.client.off("message.received", this.boundIncomingListener);
    clearInterval(this.cleaner);
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  async sendLoginCode(
    to: string,
    options: Omit<BerryOTPSendOptions, "template" | "purpose"> & { userId?: string } = {},
  ): Promise<BerryOTPSendResult> {
    return this.send(to, {
      ...options,
      template: "login",
      purpose: "entrar na conta",
      metadata: {
        userId: options.userId,
        ...options.metadata,
      },
    });
  }

  async verifyLoginCode(to: string, code: string): Promise<BerryOTPVerifyResult> {
    return this.verify(to, code);
  }

  async sendPasswordResetCode(
    to: string,
    options: Omit<BerryOTPSendOptions, "template" | "purpose"> & { userId?: string } = {},
  ): Promise<BerryOTPSendResult> {
    return this.send(to, {
      ...options,
      template: "password_reset",
      purpose: "redefinir sua senha",
      metadata: {
        userId: options.userId,
        ...options.metadata,
      },
    });
  }

  async verifyPasswordResetCode(to: string, code: string): Promise<BerryOTPVerifyResult> {
    return this.verify(to, code);
  }

  async send2FACode(
    to: string,
    options: Omit<BerryOTPSendOptions, "template" | "purpose"> & { userId?: string } = {},
  ): Promise<BerryOTPSendResult> {
    return this.send(to, {
      ...options,
      template: "2fa",
      purpose: "confirmar sua autenticação em duas etapas",
      metadata: {
        userId: options.userId,
        ...options.metadata,
      },
    });
  }

  async verify2FACode(to: string, code: string): Promise<BerryOTPVerifyResult> {
    return this.verify(to, code);
  }

  private async handleIncomingMessage(message: BerryOTPIncomingMessage): Promise<void> {
    const buttonId =
      message.buttonId ??
      message.selectedButtonId ??
      this.extractButtonIdFromParams(message.rawButtonParamsJson);

    if (!buttonId?.startsWith("berryotp:not_requested:")) {
      return;
    }

    const otpId = buttonId.replace("berryotp:not_requested:", "");
    const record = await this.options.store.get(otpId);
    if (!record || record.status !== "active") {
      return;
    }

    await this.options.store.update(otpId, {
      status: "denied",
      deniedAt: Date.now(),
    });
    this.clearTimer(otpId);
    this.emit("denied", {
      otpId,
      to: record.to,
      metadata: record.metadata,
      reason: "not_requested",
    });

    if (this.options.autoReplyOnDenied) {
      await this.client.sendText(record.to, DENIED_REPLY_TEXT);
    }
  }

  private extractButtonIdFromParams(paramsJson?: string): string | undefined {
    if (!paramsJson) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(paramsJson) as Record<string, unknown>;
      const candidate = [parsed.id, parsed.button_id, parsed.selected_id].find(
        (value) => typeof value === "string" && value.length > 0,
      );
      return candidate as string | undefined;
    } catch {
      return undefined;
    }
  }

  private scheduleExpiration(record: BerryOTPRecord): void {
    const delay = Math.max(0, record.expiresAt - Date.now());
    const timer = setTimeout(() => {
      void this.expireById(record.id).catch((error) => this.emit("error", error as Error));
    }, delay);
    timer.unref?.();
    this.timers.set(record.id, timer);
  }

  private async expireById(id: string): Promise<void> {
    const record = await this.options.store.get(id);
    if (!record) {
      return;
    }

    await this.expireRecord(id, record);
  }

  private async expireRecord(id: string, record: BerryOTPRecord): Promise<void> {
    if (record.status !== "active" || Date.now() < record.expiresAt) {
      return;
    }

    await this.options.store.update(id, {
      status: "expired",
      expiredAt: Date.now(),
    });
    this.clearTimer(id);
    this.emit("expired", {
      otpId: id,
      to: record.to,
      metadata: record.metadata,
    });

    if (this.options.editOnExpire) {
      try {
        await this.client.editMessage(record.to, record.messageId, EXPIRED_TEXT);
      } catch (error) {
        this.emit("warning", {
          type: "edit_failed",
          otpId: id,
          error,
        });
      }
    }
  }

  private async getRecipientRecords(to: string): Promise<BerryOTPRecord[]> {
    const ids = [...(this.recipientIndex.get(to) ?? new Set<string>())];
    const records = await Promise.all(ids.map((id) => this.options.store.get(id)));
    return records
      .filter((record): record is BerryOTPRecord => !!record)
      .sort((left, right) => right.createdAt - left.createdAt);
  }

  private addRecipientRecord(to: string, id: string): void {
    const current = this.recipientIndex.get(to) ?? new Set<string>();
    current.add(id);
    this.recipientIndex.set(to, current);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  private toPublicRecord(record: BerryOTPRecord): BerryOTPPublicRecord {
    return {
      id: record.id,
      to: record.to,
      messageId: record.messageId,
      expiresAt: record.expiresAt,
      status: record.status,
      attempts: record.attempts,
      metadata: record.metadata,
      createdAt: record.createdAt,
      usedAt: record.usedAt,
      expiredAt: record.expiredAt,
      deniedAt: record.deniedAt,
    };
  }

  private generateCode(length: number): string {
    let result = "";

    for (let index = 0; index < length; index += 1) {
      result += crypto.randomInt(0, 10).toString();
    }

    return result;
  }

  private hashCode(code: string, salt: string): string {
    return crypto.createHash("sha256").update(`${salt}:${code}`).digest("hex");
  }

  private safeCompare(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
  }

  private formatFooter(template: string, ttlMs: number): string {
    const minutes = Math.max(1, Math.ceil(ttlMs / 60_000));
    return template
      .replaceAll("{minutes}", String(minutes))
      .replaceAll("{seconds}", String(Math.ceil(ttlMs / 1_000)));
  }

  private assertRecipient(to: string): void {
    if (!to || typeof to !== "string") {
      throw new Error("A valid WhatsApp destination is required.");
    }
  }

  private assertRateLimit(to: string): void {
    const lastSentAt = this.lastSentByRecipient.get(to);
    if (!lastSentAt) {
      return;
    }

    const elapsed = Date.now() - lastSentAt;
    if (elapsed >= this.options.rateLimitMs) {
      return;
    }

    throw new Error(
      `Please wait ${Math.ceil((this.options.rateLimitMs - elapsed) / 1000)} seconds before sending another OTP.`,
    );
  }
}

export default BerryOTP;
export { MemoryOTPStore, renderOTPTemplate };
export type * from "./types.js";
