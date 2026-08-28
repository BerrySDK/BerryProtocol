import pino, { type Logger, type LoggerOptions } from "pino";

export const makeLogger = (options?: LoggerOptions): Logger =>
  pino({
    name: "berryprotocol",
    level: "info",
    ...options,
  });
