import type { InstanceManager } from "../../managers/InstanceManager.js";
import type { z } from "zod";
import type { setWebhookBodySchema } from "./webhook.validators.js";

export class WebhookService {
  constructor(private readonly manager: InstanceManager) {}

  set(instanceName: string, input: z.infer<typeof setWebhookBodySchema>) {
    return this.manager.setWebhook(instanceName, input);
  }

  find(instanceName: string) {
    return this.manager.getWebhook(instanceName);
  }
}
