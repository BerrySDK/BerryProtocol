import { InstanceManager } from "../../managers/InstanceManager.js";
import { notImplementedYet } from "../shared/todo.js";

export class ProfileService {
  constructor(private readonly manager: InstanceManager) {}

  async fetchBusinessProfile(instanceName: string, input: { jid?: string }) {
    const state = await this.manager.getConnectionState(instanceName);
    return {
      instanceName,
      jid: input.jid,
      provider: "berryprotocol",
      state,
      note: "Business profile details are not exposed by BerryProtocol yet.",
    };
  }

  async fetchProfile(instanceName: string, input: { jid?: string }) {
    const state = await this.manager.getConnectionState(instanceName);
    const instance = await this.manager.getInstance(instanceName);
    return {
      instanceName,
      jid: input.jid,
      phoneNumber: instance.phoneNumber,
      connectionState: state,
    };
  }

  async updateName(_instanceName: string, _input: { name: string }) {
    notImplementedYet("profile name updates are not exposed by BerryProtocol yet.");
  }

  async updateStatus(_instanceName: string, _input: { status: string }) {
    notImplementedYet("profile status updates are not exposed by BerryProtocol yet.");
  }

  async updatePicture(_instanceName: string, _input: { url?: string; path?: string; base64?: string }) {
    notImplementedYet("profile picture updates are not exposed by BerryProtocol yet.");
  }

  async removePicture(_instanceName: string) {
    notImplementedYet("profile picture removal is not exposed by BerryProtocol yet.");
  }

  async privacySettings(instanceName: string) {
    const settings = await this.manager.getSettings(instanceName);
    return settings.privacy ?? {};
  }

  async updatePrivacySettings(instanceName: string, input: Record<string, unknown>) {
    const instance = await this.manager.setSettings(instanceName, {
      privacy: input,
    });
    return instance.settings.privacy ?? {};
  }
}
