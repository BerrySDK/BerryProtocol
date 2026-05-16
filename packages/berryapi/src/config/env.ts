import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  API_KEY: z.string().default("berryapi_dev_key"),
  LOG_LEVEL: z.string().default("info"),
  DATABASE_URL: z.string().default("file:./berryapi.sqlite"),
  BERRY_SQLITE_PATH: z.string().default("berrysdk.db"),
  BERRY_AUTH_FOLDER: z.string().default(".berry-sessions"),
  BERRY_WEBHOOK_TIMEOUT_MS: z.coerce.number().default(5000),
  BERRY_WS_PATH: z.string().default("/ws"),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
