import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const instancesTable = sqliteTable("instances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  provider: text("provider").notNull().default("berryprotocol"),
  status: text("status").notNull().default("created"),
  connectionState: text("connection_state").notNull().default("disconnected"),
  authMethod: text("auth_method").notNull().default("qr"),
  phoneNumber: text("phone_number"),
  qrCode: text("qr_code"),
  pairingCode: text("pairing_code"),
  webhookUrl: text("webhook_url"),
  webhookEvents: text("webhook_events").notNull().default("[]"),
  settingsJson: text("settings_json").notNull().default("{}"),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const flowsTable = sqliteTable("flows", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  draftVersionId: text("draft_version_id"),
  publishedVersionId: text("published_version_id"),
  canvasJson: text("canvas_json").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const flowVersionsTable = sqliteTable("flow_versions", {
  id: text("id").primaryKey(),
  flowId: text("flow_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  graphJson: text("graph_json").notNull(),
  snapshotJson: text("snapshot_json").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
});

export const flowRunsTable = sqliteTable("flow_runs", {
  id: text("id").primaryKey(),
  flowId: text("flow_id").notNull(),
  flowVersionId: text("flow_version_id"),
  status: text("status").notNull().default("idle"),
  currentNodeId: text("current_node_id"),
  variablesJson: text("variables_json").notNull().default("{}"),
  historyJson: text("history_json").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type InstanceRow = typeof instancesTable.$inferSelect;
export type NewInstanceRow = typeof instancesTable.$inferInsert;
export type FlowRow = typeof flowsTable.$inferSelect;
export type FlowVersionRow = typeof flowVersionsTable.$inferSelect;
export type FlowRunRow = typeof flowRunsTable.$inferSelect;
