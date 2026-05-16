import { sqlite } from "./client.js";

export const initDatabase = async (): Promise<void> => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS instances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      provider TEXT NOT NULL DEFAULT 'berryprotocol',
      status TEXT NOT NULL DEFAULT 'created',
      connection_state TEXT NOT NULL DEFAULT 'disconnected',
      auth_method TEXT NOT NULL DEFAULT 'qr',
      phone_number TEXT,
      qr_code TEXT,
      pairing_code TEXT,
      webhook_url TEXT,
      webhook_events TEXT NOT NULL DEFAULT '[]',
      settings_json TEXT NOT NULL DEFAULT '{}',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
};
