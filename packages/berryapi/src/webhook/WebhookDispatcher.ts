import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import type { ProviderEventPayload } from "../providers/whatsapp/WhatsAppProvider.js";
import type { WebhookConfig } from "../types/index.js";

export class WebhookDispatcher {
  async dispatch(config: WebhookConfig, event: ProviderEventPayload): Promise<void> {
    if (!config.enabled || !config.url) {
      return;
    }

    if (config.events.length && !config.events.includes(event.event)) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.BERRY_WEBHOOK_TIMEOUT_MS);

    try {
      await fetch(config.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(config.headers ?? {}),
        },
        body: JSON.stringify(event),
        signal: controller.signal,
      });
    } catch (error) {
      logger.warn({ err: error, url: config.url, event: event.event }, "webhook dispatch failed");
    } finally {
      clearTimeout(timeout);
    }
  }
}
