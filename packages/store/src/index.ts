/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import Database from "better-sqlite3";
import {
  AuthStateSnapshot,
  ChatRecord,
  ContactRecord,
  GroupRecord,
  IncomingMessage,
  MessageAck,
} from "@berrysdk/events";

export class SQLiteStore {
  readonly db: Database.Database;

  constructor(path = process.env.BERRY_SQLITE_PATH ?? "berrysdk.db") {
    this.db = new Database(path);
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        session_id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chats (
        id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (id, session_id)
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (id, session_id)
      );

      CREATE TABLE IF NOT EXISTS groups (
        id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (id, session_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        remote_jid TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (id, session_id)
      );

      CREATE TABLE IF NOT EXISTS message_acks (
        message_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (message_id, session_id)
      );
    `);
  }

  saveSession(sessionId: string, snapshot: AuthStateSnapshot): void {
    this.db
      .prepare(
        `
          INSERT INTO auth_sessions(session_id, payload, updated_at)
          VALUES (@session_id, @payload, @updated_at)
          ON CONFLICT(session_id) DO UPDATE SET
            payload = excluded.payload,
            updated_at = excluded.updated_at
        `,
      )
      .run({
        session_id: sessionId,
        payload: JSON.stringify(snapshot),
        updated_at: new Date().toISOString(),
      });
  }

  getSession(sessionId: string): AuthStateSnapshot | null {
    const row = this.db
      .prepare(`SELECT payload FROM auth_sessions WHERE session_id = ?`)
      .get(sessionId) as { payload: string } | undefined;

    return row ? (JSON.parse(row.payload) as AuthStateSnapshot) : null;
  }

  deleteSession(sessionId: string): void {
    this.db.prepare(`DELETE FROM auth_sessions WHERE session_id = ?`).run(sessionId);
  }

  upsertChats(sessionId: string, chats: ChatRecord[]): void {
    const statement = this.db.prepare(`
      INSERT INTO chats(id, session_id, payload)
      VALUES (@id, @session_id, @payload)
      ON CONFLICT(id, session_id) DO UPDATE SET payload = excluded.payload
    `);
    const transaction = this.db.transaction((items: ChatRecord[]) => {
      for (const chat of items) {
        statement.run({
          id: chat.id,
          session_id: sessionId,
          payload: JSON.stringify(chat),
        });
      }
    });
    transaction(chats);
  }

  upsertContacts(sessionId: string, contacts: ContactRecord[]): void {
    const statement = this.db.prepare(`
      INSERT INTO contacts(id, session_id, payload)
      VALUES (@id, @session_id, @payload)
      ON CONFLICT(id, session_id) DO UPDATE SET payload = excluded.payload
    `);
    const transaction = this.db.transaction((items: ContactRecord[]) => {
      for (const contact of items) {
        statement.run({
          id: contact.id,
          session_id: sessionId,
          payload: JSON.stringify(contact),
        });
      }
    });
    transaction(contacts);
  }

  upsertGroups(sessionId: string, groups: GroupRecord[]): void {
    const statement = this.db.prepare(`
      INSERT INTO groups(id, session_id, payload)
      VALUES (@id, @session_id, @payload)
      ON CONFLICT(id, session_id) DO UPDATE SET payload = excluded.payload
    `);
    const transaction = this.db.transaction((items: GroupRecord[]) => {
      for (const group of items) {
        statement.run({
          id: group.id,
          session_id: sessionId,
          payload: JSON.stringify(group),
        });
      }
    });
    transaction(groups);
  }

  upsertMessages(sessionId: string, messages: IncomingMessage[]): void {
    const statement = this.db.prepare(`
      INSERT INTO messages(id, session_id, remote_jid, payload)
      VALUES (@id, @session_id, @remote_jid, @payload)
      ON CONFLICT(id, session_id) DO UPDATE SET payload = excluded.payload
    `);
    const transaction = this.db.transaction((items: IncomingMessage[]) => {
      for (const message of items) {
        statement.run({
          id: message.id,
          session_id: sessionId,
          remote_jid: message.chatId ?? message.remoteJid ?? message.to ?? message.from ?? "",
          payload: JSON.stringify(message),
        });
      }
    });
    transaction(messages);
  }

  upsertAck(sessionId: string, ack: MessageAck): void {
    this.db
      .prepare(`
        INSERT INTO message_acks(message_id, session_id, payload)
        VALUES (@message_id, @session_id, @payload)
        ON CONFLICT(message_id, session_id) DO UPDATE SET payload = excluded.payload
      `)
      .run({
        message_id: ack.messageId,
        session_id: sessionId,
        payload: JSON.stringify(ack),
      });
  }
}
