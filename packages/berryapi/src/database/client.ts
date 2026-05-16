import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { dirname, isAbsolute, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

const normalizeSqlitePath = (value: string): string => {
  if (value.startsWith("file:")) {
    const raw = value.slice(5);
    return isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
  }

  return isAbsolute(value) ? value : resolve(process.cwd(), value);
};

const dbPath = normalizeSqlitePath(env.DATABASE_URL);
mkdirSync(dirname(dbPath), { recursive: true });

export const sqlite: any = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
