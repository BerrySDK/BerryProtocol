import type { InstanceManager } from "../../../managers/InstanceManager.js";
import { MessageBuilder } from "../builders/MessageBuilder.js";

export class MessageService {
  constructor(
    private readonly manager: InstanceManager,
    private readonly builder = new MessageBuilder(),
  ) {}

  async sendText(instanceName: string, input: { to: string; text: string; [key: string]: unknown }) {
    const built = this.builder.buildText(input);
    return this.manager.sendRawMessage(instanceName, input.to, built.content, built.options);
  }

  async sendExtendedText(instanceName: string, input: { to: string; text: string; [key: string]: unknown }) {
    return this.sendText(instanceName, input);
  }

  async sendReply(instanceName: string, input: { to: string; text: string; quoted: unknown; [key: string]: unknown }) {
    const built = this.builder.buildText(input as never);
    return this.manager.sendRawMessage(instanceName, input.to, built.content, built.options);
  }

  async sendForward(instanceName: string, input: { to: string; message: Record<string, unknown>; [key: string]: unknown }) {
    const built = this.builder.buildForward(input);
    return this.manager.sendRawMessage(instanceName, input.to, built.content, built.options);
  }

  async deleteMessage(instanceName: string, input: { to: string; messageId: string; fromMe: boolean; participant?: string; [key: string]: unknown }) {
    const built = this.builder.buildDelete(input);
    return this.manager.sendRawMessage(instanceName, input.to, built.content, built.options);
  }

  async editMessage(instanceName: string, input: { to: string; messageId: string; text: string }) {
    return this.manager.editMessage(instanceName, input.to, input.messageId, input.text);
  }

  async sendReaction(instanceName: string, input: { to: string; emoji: string; targetMessageId: string }) {
    return this.manager.sendReaction(instanceName, input.to, input.emoji, input.targetMessageId);
  }

  async sendImage(instanceName: string, input: Record<string, unknown>) {
    const built = await this.builder.buildImage(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendVideo(instanceName: string, input: Record<string, unknown>) {
    const built = await this.builder.buildVideo(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendAudio(instanceName: string, input: Record<string, unknown>) {
    const built = await this.builder.buildAudio(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendDocument(instanceName: string, input: Record<string, unknown>) {
    const built = await this.builder.buildDocument(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendSticker(instanceName: string, input: Record<string, unknown>) {
    const built = await this.builder.buildSticker(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendGif(instanceName: string, input: Record<string, unknown>) {
    const built = await this.builder.buildVideo({ ...input, gifPlayback: true } as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendViewOnceImage(instanceName: string, input: Record<string, unknown>) {
    const built = await this.builder.buildImage(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), { ...built.content, viewOnce: true }, built.options);
  }

  async sendViewOnceVideo(instanceName: string, input: Record<string, unknown>) {
    const built = await this.builder.buildVideo({ ...input, viewOnce: true } as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendButtons(instanceName: string, input: Record<string, unknown>) {
    const payload = this.builder.buildButtons(input as never);
    return this.manager.sendButtons(instanceName, String(input.to), payload);
  }

  async sendTemplateButtons(instanceName: string, input: Record<string, unknown>) {
    const payload = this.builder.buildButtons(input as never);
    return this.manager.sendButtons(instanceName, String(input.to), payload);
  }

  async sendCTAButton(instanceName: string, input: Record<string, unknown>) {
    return this.sendButtons(instanceName, input);
  }

  async sendCopyButton(instanceName: string, input: Record<string, unknown>) {
    const payload = this.builder.buildButtons({
      ...input,
      buttons: [
        {
          id: String(input.buttonId ?? "copy_button"),
          title: String(input.buttonText ?? "Copy code"),
          type: "cta_copy",
          copyCode: String(input.copyCode ?? ""),
        },
      ],
    } as never);
    return this.manager.sendButtons(instanceName, String(input.to), payload);
  }

  async sendList(instanceName: string, input: Record<string, unknown>) {
    const payload = this.builder.buildList(input as never);
    return this.manager.sendList(instanceName, String(input.to), payload);
  }

  async sendCarousel(instanceName: string, input: Record<string, unknown>) {
    const payload = this.builder.buildCarousel(input as never);
    return this.manager.sendCarousel(instanceName, String(input.to), payload);
  }

  async sendAiText(instanceName: string, input: Record<string, unknown>) {
    return this.manager.sendRawMessage(instanceName, String(input.to), {
      text: String(input.text),
      ai: true,
    }, this.builder.buildCommonOptions(input as never));
  }

  async sendAiCarousel(instanceName: string, input: Record<string, unknown>) {
    const payload = this.builder.buildCarousel({
      ...input,
      ai: true,
    } as never);
    return this.manager.sendCarousel(instanceName, String(input.to), payload);
  }

  async sendPoll(instanceName: string, input: Record<string, unknown>) {
    const built = this.builder.buildPoll(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendLocation(instanceName: string, input: Record<string, unknown>) {
    const built = this.builder.buildLocation(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendLiveLocation(instanceName: string, input: Record<string, unknown>) {
    const built = this.builder.buildLiveLocation(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendContact(instanceName: string, input: Record<string, unknown>) {
    const built = this.builder.buildContact(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendContacts(instanceName: string, input: Record<string, unknown>) {
    const built = this.builder.buildContacts(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendStatus(instanceName: string, input: Record<string, unknown>) {
    const built = await this.builder.buildStatus(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendProduct(instanceName: string, input: Record<string, unknown>) {
    const built = await this.builder.buildProduct(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendCatalog(instanceName: string, input: Record<string, unknown>) {
    const built = this.builder.buildCatalog(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }

  async sendCollection(instanceName: string, input: Record<string, unknown>) {
    const built = this.builder.buildCollection(input as never);
    return this.manager.sendRawMessage(instanceName, String(input.to), built.content, built.options);
  }
}
