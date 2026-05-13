/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import { type BerryOTPRecord, type BerryOTPStore } from "./types.js";

export class MemoryOTPStore implements BerryOTPStore {
  private readonly records = new Map<string, BerryOTPRecord>();

  async create(record: BerryOTPRecord): Promise<void> {
    this.records.set(record.id, { ...record });
  }

  async get(id: string): Promise<BerryOTPRecord | null> {
    const record = this.records.get(id);
    return record ? { ...record } : null;
  }

  async findActiveByCode(to: string, codeHash: string): Promise<BerryOTPRecord | null> {
    for (const record of this.records.values()) {
      if (record.to !== to || record.status !== "active") {
        continue;
      }

      if (record.codeHash === codeHash) {
        return { ...record };
      }
    }

    return null;
  }

  async update(id: string, patch: Partial<BerryOTPRecord>): Promise<void> {
    const current = this.records.get(id);
    if (!current) {
      return;
    }

    this.records.set(id, {
      ...current,
      ...patch,
    });
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  async cleanup(before: number): Promise<void> {
    for (const [id, record] of this.records.entries()) {
      const terminalAt =
        record.expiredAt ?? record.usedAt ?? record.deniedAt ?? record.createdAt;

      if (record.status !== "active" && terminalAt < before) {
        this.records.delete(id);
      }
    }
  }
}
