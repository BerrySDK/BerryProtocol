import type { z } from "zod";
import type { InstanceManager } from "../../managers/InstanceManager.js";
import type { setSettingsBodySchema } from "./settings.validators.js";

export class SettingsService {
  constructor(private readonly manager: InstanceManager) {}

  set(instanceName: string, input: z.infer<typeof setSettingsBodySchema>) {
    return this.manager.setSettings(instanceName, input);
  }

  find(instanceName: string) {
    return this.manager.getSettings(instanceName);
  }
}
