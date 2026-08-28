import crypto from "node:crypto";
import { EventEmitter } from "node:events";

export class BerryOTP extends EventEmitter {
    constructor(client, options = {}) {
        super();

        if (!client) {
            throw new Error("BerryOTP precisa de uma instância de BerryClient.");
        }

        this.client = client;

        this.options = {
            issuer: options.issuer ?? "BerryOTP",
            codeLength: options.codeLength ?? 6,
            ttlMs: options.ttlMs ?? 5 * 60 * 1000,
            footer: options.footer ?? "Este código dura {minutes} minutos.",
            editOnExpire: options.editOnExpire ?? true,
            mode: options.mode ?? "stable",
            maxAttempts: options.maxAttempts ?? 5,
            rateLimitMs: options.rateLimitMs ?? 60 * 1000,
            autoReplyOnDenied: options.autoReplyOnDenied ?? true,
        };

        this.records = new Map();
        this.lastSentByTo = new Map();

        this._bindIncomingMessages();
        this._startCleaner();
    }

    async send(to, input = {}) {
        this._assertTo(to);
        this._checkRateLimit(to);

        const otpId = this._id();
        const ttlMs = input.ttlMs ?? this.options.ttlMs;
        const code = String(input.code ?? this._generateCode(this.options.codeLength));
        const expiresAt = Date.now() + ttlMs;

        const salt = this._id();
        const codeHash = this._hashCode(code, salt);

        const purpose = input.purpose ?? "verificação";
        const footer = this._formatFooter(input.footer ?? this.options.footer, ttlMs);

        const text = [
            "🔐 Código de verificação",
            "",
            `Use o código abaixo para ${purpose}:`,
            "",
            `*${code}*`,
        ].join("\n");

        let sent;

        if (this.options.mode === "experimental-copy-code") {
            sent = await this._sendExperimentalCopyCode(to, {
                otpId,
                text,
                footer,
                code,
            });
        } else {
            sent = await this._sendStableReplyButton(to, {
                otpId,
                text,
                footer,
            });
        }

        const messageId = sent?.id ?? sent?.key?.id ?? sent?.messageId;

        if (!messageId) {
            throw new Error("Não foi possível obter o messageId da mensagem OTP enviada.");
        }

        const record = {
            id: otpId,
            to,
            codeHash,
            salt,
            messageId,
            expiresAt,
            status: "active",
            attempts: 0,
            metadata: input.metadata ?? {},
            createdAt: Date.now(),
        };

        this.records.set(otpId, record);
        this.lastSentByTo.set(to, Date.now());

        setTimeout(() => {
            this._expire(otpId).catch((error) => {
                this.emit("error", error);
            });
        }, ttlMs);

        return {
            id: otpId,
            to,
            code,
            expiresAt: new Date(expiresAt),
            messageId,
            status: "sent",
        };
    }

    async verify(to, code) {
        this._assertTo(to);

        const record = this._findActiveByCode(to, code);

        if (!record) {
            return { valid: false, reason: "not_found" };
        }

        if (record.status !== "active") {
            return { valid: false, reason: record.status };
        }

        if (Date.now() > record.expiresAt) {
            await this._expire(record.id);
            return { valid: false, reason: "expired" };
        }

        if (record.attempts >= this.options.maxAttempts) {
            record.status = "blocked";
            return { valid: false, reason: "too_many_attempts" };
        }

        const ok = this._safeCompare(
            this._hashCode(String(code), record.salt),
            record.codeHash,
        );

        record.attempts += 1;

        if (!ok) {
            return { valid: false, reason: "invalid_code" };
        }

        record.status = "used";
        record.usedAt = Date.now();

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

    async _sendStableReplyButton(to, { otpId, text, footer }) {
        return this.client.sendMessage(to, {
            buttonsMessage: {
                text,
                footer,
                buttons: [
                    {
                        id: `berryotp:not_requested:${otpId}`,
                        title: "Não pedi nenhum código",
                    },
                ],
            },
        });
    }

    async _sendExperimentalCopyCode(to, { otpId, text, footer, code }) {
        return this.client.sendMessage(to, {
            buttonsMessage: {
                text,
                footer,
                buttons: [
                    {
                        id: `berryotp:copy:${otpId}`,
                        title: "Copiar código",
                        kind: "copy_code",
                        code,
                    },
                    {
                        id: `berryotp:not_requested:${otpId}`,
                        title: "Não pedi nenhum código",
                        kind: "quick_reply",
                    },
                ],
            },
        });
    }

    async _expire(otpId) {
        const record = this.records.get(otpId);

        if (!record || record.status !== "active") {
            return;
        }

        if (Date.now() < record.expiresAt) {
            return;
        }

        record.status = "expired";
        record.expiredAt = Date.now();

        this.emit("expired", {
            otpId: record.id,
            to: record.to,
            metadata: record.metadata,
        });

        if (!this.options.editOnExpire) {
            return;
        }

        const expiredText = [
            "🔒 Código expirado",
            "",
            "Este código não é mais válido.",
            "Solicite um novo código para continuar.",
        ].join("\n");

        try {
            await this._editMessage(record.to, record.messageId, expiredText);
        } catch (error) {
            this.emit("warning", {
                type: "edit_failed",
                otpId: record.id,
                error,
            });
        }
    }

    async _editMessage(to, messageId, text) {
        if (typeof this.client.editMessage === "function") {
            return this.client.editMessage(to, messageId, { text });
        }

        return this.client.sendMessage(to, {
            text,
            edit: messageId,
        });
    }

    _bindIncomingMessages() {
        if (typeof this.client.on !== "function") {
            return;
        }

        this.client.on("message.received", async (message) => {
            const buttonId =
                message?.buttonId ??
                message?.selectedButtonId ??
                message?.message?.buttonsResponseMessage?.selectedButtonId;

            if (!buttonId?.startsWith("berryotp:not_requested:")) {
                return;
            }

            const otpId = buttonId.replace("berryotp:not_requested:", "");
            const record = this.records.get(otpId);

            if (!record || record.status !== "active") {
                return;
            }

            record.status = "denied";
            record.deniedAt = Date.now();

            this.emit("denied", {
                otpId,
                to: record.to,
                metadata: record.metadata,
            });

            if (this.options.autoReplyOnDenied) {
                await this.client.sendMessage(record.to, {
                    text: "Entendido. Esse código foi cancelado e não poderá ser usado.",
                });
            }
        });
    }

    _findActiveByCode(to, code) {
        for (const record of this.records.values()) {
            if (record.to !== to || record.status !== "active") {
                continue;
            }

            if (Date.now() > record.expiresAt) {
                continue;
            }

            const hash = this._hashCode(String(code), record.salt);

            if (this._safeCompare(hash, record.codeHash)) {
                return record;
            }
        }

        return null;
    }

    _checkRateLimit(to) {
        const lastSentAt = this.lastSentByTo.get(to);

        if (!lastSentAt) {
            return;
        }

        const elapsed = Date.now() - lastSentAt;

        if (elapsed < this.options.rateLimitMs) {
            const waitMs = this.options.rateLimitMs - elapsed;
            throw new Error(`Aguarde ${Math.ceil(waitMs / 1000)}s antes de enviar outro OTP.`);
        }
    }

    _generateCode(length) {
        let code = "";

        for (let i = 0; i < length; i += 1) {
            code += crypto.randomInt(0, 10).toString();
        }

        return code;
    }

    _hashCode(code, salt) {
        return crypto
            .createHash("sha256")
            .update(`${salt}:${code}`)
            .digest("hex");
    }

    _safeCompare(a, b) {
        const left = Buffer.from(String(a));
        const right = Buffer.from(String(b));

        if (left.length !== right.length) {
            return false;
        }

        return crypto.timingSafeEqual(left, right);
    }

    _formatFooter(template, ttlMs) {
        const minutes = Math.max(1, Math.ceil(ttlMs / 60000));

        return String(template)
            .replaceAll("{minutes}", String(minutes))
            .replaceAll("{seconds}", String(Math.ceil(ttlMs / 1000)));
    }

    _assertTo(to) {
        if (!to || typeof to !== "string") {
            throw new Error("Informe o destino do WhatsApp.");
        }
    }

    _id() {
        return crypto.randomBytes(16).toString("hex");
    }

    _startCleaner() {
        this.cleaner = setInterval(() => {
            const now = Date.now();

            for (const [id, record] of this.records.entries()) {
                const keepUsedForMs = 10 * 60 * 1000;

                if (record.status !== "active" && now - record.createdAt > keepUsedForMs) {
                    this.records.delete(id);
                }
            }
        }, 60 * 1000);

        if (typeof this.cleaner.unref === "function") {
            this.cleaner.unref();
        }
    }
}

export default BerryOTP;