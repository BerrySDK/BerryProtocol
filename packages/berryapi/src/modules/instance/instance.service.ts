import type { InstanceManager } from "../../managers/InstanceManager.js";
import type { z } from "zod";
import type {
  createInstanceBodySchema,
  instanceNameParamsSchema,
  setPresenceBodySchema,
} from "./instance.validators.js";

export class InstanceService {
  constructor(private readonly manager: InstanceManager) {}

  create(input: z.infer<typeof createInstanceBodySchema>) {
    return this.manager.createInstance(input);
  }

  fetch() {
    return this.manager.fetchInstances();
  }

  connect(instanceName: z.infer<typeof instanceNameParamsSchema>["instanceName"]) {
    return this.manager.connectInstance(instanceName);
  }

  restart(instanceName: string) {
    return this.manager.restartInstance(instanceName);
  }

  connectionState(instanceName: string) {
    return this.manager.getConnectionState(instanceName);
  }

  logout(instanceName: string) {
    return this.manager.logoutInstance(instanceName);
  }

  async delete(instanceName: string) {
    await this.manager.deleteInstance(instanceName);
    return { instanceName };
  }

  setPresence(instanceName: string, input: z.infer<typeof setPresenceBodySchema>) {
    return this.manager.setPresence(instanceName, input.presence, input.jid);
  }
}
