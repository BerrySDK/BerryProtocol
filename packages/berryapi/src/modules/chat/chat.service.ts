import { readFile } from "node:fs/promises";
import { InstanceManager } from "../../managers/InstanceManager.js";
import { notImplementedYet } from "../shared/todo.js";

const whatsappRegex = /^\d+@(?:s\.whatsapp\.net|lid|g\.us|newsletter)$/;

export class ChatService {
  constructor(private readonly manager: InstanceManager) {}

  async checkWhatsApp(_instanceName: string, input: { jid: string }) {
    return {
      jid: input.jid,
      exists: whatsappRegex.test(input.jid),
    };
  }

  async markRead(_instanceName: string, _input: { jid: string }) {
    notImplementedYet("markRead is not exposed by BerryProtocol yet.");
  }

  async markUnread(_instanceName: string, _input: { jid: string }) {
    notImplementedYet("markUnread is not exposed by BerryProtocol yet.");
  }

  async archive(_instanceName: string, _input: { jid: string }) {
    notImplementedYet("archive chat is not exposed by BerryProtocol yet.");
  }

  async deleteMessageForEveryone(instanceName: string, input: { remoteJid: string; messageId: string; fromMe: boolean; participant?: string }) {
    return this.manager.sendRawMessage(instanceName, input.remoteJid, {
      delete: {
        remoteJid: input.remoteJid,
        id: input.messageId,
        fromMe: input.fromMe,
        participant: input.participant,
      },
    });
  }

  async updateMessage(instanceName: string, input: { jid: string; messageId: string; text: string }) {
    return this.manager.editMessage(instanceName, input.jid, input.messageId, input.text);
  }

  async sendPresence(instanceName: string, input: { presence: "available" | "composing" | "recording" | "paused" | "unavailable"; jid?: string }) {
    await this.manager.setPresence(instanceName, input.presence, input.jid);
    return { jid: input.jid, presence: input.presence };
  }

  async updateBlockStatus(_instanceName: string, _input: { jid: string; action: "block" | "unblock" }) {
    notImplementedYet("block and unblock operations are not exposed by BerryProtocol yet.");
  }

  async fetchProfilePictureUrl(_instanceName: string, _input: { jid: string }) {
    notImplementedYet("fetchProfilePictureUrl is not exposed by BerryProtocol yet.");
  }

  async getBase64(_instanceName: string, input: { url?: string; path?: string }) {
    if (input.url) {
      const response = await fetch(input.url);
      const arrayBuffer = await response.arrayBuffer();
      return {
        source: input.url,
        base64: Buffer.from(arrayBuffer).toString("base64"),
      };
    }

    const file = await readFile(String(input.path));
    return {
      source: input.path,
      base64: file.toString("base64"),
    };
  }

  async findContacts(_instanceName: string, _input: { query?: string }) {
    notImplementedYet("contact search is not exposed by BerryProtocol store yet.");
  }

  async findMessages(_instanceName: string, _input: { query?: string }) {
    notImplementedYet("message search is not exposed by BerryProtocol store yet.");
  }

  async findStatusMessage(_instanceName: string, _input: { query?: string }) {
    notImplementedYet("status search is not exposed by BerryProtocol store yet.");
  }

  async findChats(_instanceName: string, _input: { query?: string }) {
    notImplementedYet("chat search is not exposed by BerryProtocol store yet.");
  }
}
