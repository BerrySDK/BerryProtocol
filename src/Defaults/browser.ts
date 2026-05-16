import type { BerryClientOptions } from "@berrysdk/core";

export const DEFAULT_RECONNECT_DELAY_MS = 1_500;
export const DEFAULT_RECONNECT_MAX_ATTEMPTS = 12;

export const defaultClientOptions = (
  sessionId: string,
): Partial<BerryClientOptions> => ({
  sessionId,
  reconnectDelayMs: DEFAULT_RECONNECT_DELAY_MS,
  reconnectMaxAttempts: DEFAULT_RECONNECT_MAX_ATTEMPTS,
  printQrInTerminal: true,
  qrSmall: true,
});
