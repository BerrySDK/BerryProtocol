import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  name: "berryapi",
  level: env.LOG_LEVEL,
});
