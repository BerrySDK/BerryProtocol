/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import { AuthStateSnapshot } from "@berrysdk/events";
import { SQLiteStore } from "@berrysdk/store";
import { randomUUID } from "node:crypto";

export interface SessionStore {
  load(sessionId: string): Promise<AuthStateSnapshot | null>;
  save(sessionId: string, snapshot: AuthStateSnapshot): Promise<void>;
  remove(sessionId: string): Promise<void>;
}

export class SQLiteSessionStore implements SessionStore {
  constructor(private readonly store: SQLiteStore) {}

  async load(sessionId: string): Promise<AuthStateSnapshot | null> {
    return this.store.getSession(sessionId);
  }

  async save(sessionId: string, snapshot: AuthStateSnapshot): Promise<void> {
    this.store.saveSession(sessionId, snapshot);
  }

  async remove(sessionId: string): Promise<void> {
    this.store.deleteSession(sessionId);
  }
}

export class SessionManager {
  constructor(private readonly sessionStore: SessionStore) {}

  async get(sessionId: string): Promise<AuthStateSnapshot> {
    const snapshot = await this.sessionStore.load(sessionId);
    if (snapshot) {
      return snapshot;
    }

    const created: AuthStateSnapshot = {
      sessionId,
      registered: false,
      clientId: randomUUID(),
    };

    await this.sessionStore.save(sessionId, created);
    return created;
  }

  async update(sessionId: string, partial: Partial<AuthStateSnapshot>): Promise<AuthStateSnapshot> {
    const current = await this.get(sessionId);
    const next = { ...current, ...partial };
    await this.sessionStore.save(sessionId, next);
    return next;
  }

  async clear(sessionId: string): Promise<void> {
    await this.sessionStore.remove(sessionId);
  }
}
