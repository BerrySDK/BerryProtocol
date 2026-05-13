/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
export type BerryOTPMode = "stable" | "copy-code" | "experimental-copy-code";

export type BerryOTPTemplate = "login" | "password_reset" | "2fa" | "generic";

export type BerryOTPStatus = "active" | "used" | "expired" | "denied" | "blocked";

export interface BerryOTPRecord {
  id: string;
  to: string;
  codeHash: string;
  salt: string;
  messageId: string;
  expiresAt: number;
  status: BerryOTPStatus;
  attempts: number;
  metadata?: Record<string, any>;
  createdAt: number;
  usedAt?: number;
  expiredAt?: number;
  deniedAt?: number;
}

export interface BerryOTPPublicRecord {
  id: string;
  to: string;
  messageId: string;
  expiresAt: number;
  status: BerryOTPStatus;
  attempts: number;
  metadata?: Record<string, any>;
  createdAt: number;
  usedAt?: number;
  expiredAt?: number;
  deniedAt?: number;
}

export interface BerryOTPStore {
  create(record: BerryOTPRecord): Promise<void>;
  get(id: string): Promise<BerryOTPRecord | null>;
  findActiveByCode(to: string, codeHash: string): Promise<BerryOTPRecord | null>;
  update(id: string, patch: Partial<BerryOTPRecord>): Promise<void>;
  delete(id: string): Promise<void>;
  cleanup(before: number): Promise<void>;
}

export type BerryOTPOptions = {
  issuer?: string;
  codeLength?: number;
  ttlMs?: number;
  footer?: string;
  editOnExpire?: boolean;
  mode?: BerryOTPMode;
  maxAttempts?: number;
  rateLimitMs?: number;
  autoReplyOnDenied?: boolean;
  store?: BerryOTPStore;
};

export interface BerryOTPSendOptions {
  purpose?: string;
  code?: string;
  ttlMs?: number;
  footer?: string;
  metadata?: Record<string, any>;
  template?: BerryOTPTemplate;
}

export interface BerryOTPSendResult {
  id: string;
  to: string;
  code: string;
  expiresAt: Date;
  messageId: string;
  status: "sent";
}

export interface BerryOTPVerifyResult {
  valid: boolean;
  reason?:
    | "not_found"
    | "expired"
    | "already_used"
    | "invalid_code"
    | "too_many_attempts"
    | "denied";
  metadata?: Record<string, any>;
}

export interface RenderOTPTemplateInput {
  issuer: string;
  code: string;
  purpose?: string;
  ttlMs: number;
  template: BerryOTPTemplate;
}

export interface RenderOTPTemplateResult {
  text: string;
}

export interface BerryOTPEventMap {
  sent: BerryOTPSendResult & { metadata?: Record<string, any> };
  used: { otpId: string; to: string; metadata?: Record<string, any> };
  expired: { otpId: string; to: string; metadata?: Record<string, any> };
  denied: { otpId: string; to: string; metadata?: Record<string, any>; reason?: string };
  warning: { type: string; otpId?: string; error?: unknown; details?: string };
  error: Error;
}
