import { InstanceManager } from "../../managers/InstanceManager.js";
import { notImplementedYet } from "../shared/todo.js";

type GroupRecord = {
  id?: string;
  subject?: string;
  participants?: unknown[];
  [key: string]: unknown;
};

const findGroup = async (manager: InstanceManager, instanceName: string, jid: string): Promise<GroupRecord | null> => {
  const groups = await manager.fetchGroups(instanceName) as GroupRecord[];
  return groups.find((group) => group.id === jid) ?? null;
};

export class GroupService {
  constructor(private readonly manager: InstanceManager) {}

  async create(_instanceName: string, _input: { subject: string; participants: string[] }) {
    notImplementedYet("group creation is not exposed by BerryProtocol yet.");
  }

  async updatePicture(_instanceName: string, _input: { jid: string; url?: string; path?: string; base64?: string }) {
    notImplementedYet("group picture update is not exposed by BerryProtocol yet.");
  }

  async updateSubject(_instanceName: string, _input: { jid: string; subject: string }) {
    notImplementedYet("group subject update is not exposed by BerryProtocol yet.");
  }

  async updateDescription(_instanceName: string, _input: { jid: string; description?: string }) {
    notImplementedYet("group description update is not exposed by BerryProtocol yet.");
  }

  async inviteCode(_instanceName: string) {
    notImplementedYet("group invite code lookup is not exposed by BerryProtocol yet.");
  }

  async revokeInviteCode(_instanceName: string, _input: { jid: string }) {
    notImplementedYet("group invite code revoke is not exposed by BerryProtocol yet.");
  }

  async sendInvite(_instanceName: string, _input: { jid: string; inviteCode?: string; inviteExpiration?: number; groupName?: string; caption?: string }) {
    notImplementedYet("group invite sending is not exposed by BerryProtocol yet.");
  }

  async findByInviteCode(_instanceName: string, _input: { inviteCode: string }) {
    notImplementedYet("find group by invite code is not exposed by BerryProtocol yet.");
  }

  async findByJid(instanceName: string, input: { jid: string }) {
    const group = await findGroup(this.manager, instanceName, input.jid);
    return group ?? {};
  }

  async fetchAll(instanceName: string) {
    return this.manager.fetchGroups(instanceName);
  }

  async members(instanceName: string, input: { jid: string }) {
    const group = await findGroup(this.manager, instanceName, input.jid);
    return {
      jid: input.jid,
      participants: Array.isArray(group?.participants) ? group.participants : [],
    };
  }

  async updateMembers(_instanceName: string, _input: { jid: string; participants: string[]; action: string }) {
    notImplementedYet("group membership updates are not exposed by BerryProtocol yet.");
  }

  async updateSetting(_instanceName: string, _input: { jid: string; setting: string }) {
    notImplementedYet("group setting updates are not exposed by BerryProtocol yet.");
  }

  async toggleEphemeral(_instanceName: string, _input: { jid: string; expiration: number }) {
    notImplementedYet("group ephemeral updates are not exposed by BerryProtocol yet.");
  }

  async leave(_instanceName: string, _input: { jid: string }) {
    notImplementedYet("group leave is not exposed by BerryProtocol yet.");
  }
}
