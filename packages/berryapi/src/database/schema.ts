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

export type InstanceRow = typeof instancesTable.$inferSelect;
export type NewInstanceRow = typeof instancesTable.$inferInsert;
