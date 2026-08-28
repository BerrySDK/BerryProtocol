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

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS flows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      draft_version_id TEXT,
      published_version_id TEXT,
      canvas_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS flow_versions (
      id TEXT PRIMARY KEY,
      flow_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      graph_json TEXT NOT NULL,
      snapshot_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS flow_runs (
      id TEXT PRIMARY KEY,
      flow_id TEXT NOT NULL,
      flow_version_id TEXT,
      status TEXT NOT NULL DEFAULT 'idle',
      current_node_id TEXT,
      variables_json TEXT NOT NULL DEFAULT '{}',
      history_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
};
