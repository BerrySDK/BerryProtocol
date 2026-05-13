import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const BIZ_BOT_SUPPORT_PAYLOAD = "{}";

const patchFile = async (filePath, mutator) => {
  const source = await readFile(filePath, "utf8");
  const next = mutator(source);

  if (next !== source) {
    await writeFile(filePath, next, "utf8");
    return true;
  }

  return false;
};

const resolveBaileysRoot = () => {
  const packageJsonPath = require.resolve("baileys/package.json");
  return dirname(packageJsonPath);
};

const patchMessageTypes = async (baileysRoot) =>
  patchFile(join(baileysRoot, "lib", "Types", "Message.d.ts"), (source) => {
    if (source.includes("ai?: boolean;")) {
      return source;
    }

    const original = `export type AnyMessageContent = AnyRegularMessageContent | {
    forward: WAMessage;
    force?: boolean;
} | {
    /** Delete your message or anyone's message in a group (admin required) */
    delete: WAMessageKey;
} | {
    disappearingMessagesInChat: boolean | number;
} | {
    limitSharing: boolean;
};`;

    const patched = `export type AnyMessageContent = (AnyRegularMessageContent | {
    forward: WAMessage;
    force?: boolean;
} | {
    /** Delete your message or anyone's message in a group (admin required) */
    delete: WAMessageKey;
} | {
    disappearingMessagesInChat: boolean | number;
} | {
    limitSharing: boolean;
}) & {
    ai?: boolean;
};`;

    return source.replace(original, patched);
  });

const patchMessageSend = async (baileysRoot) =>
  patchFile(join(baileysRoot, "lib", "Socket", "messages-send.js"), (source) => {
    let next = source;

    if (!next.includes("const BIZ_BOT_SUPPORT_PAYLOAD = '{}'")) {
      next = next.replace(
        "import { makeNewsletterSocket } from './newsletter.js';",
        `import { makeNewsletterSocket } from './newsletter.js';\nconst BIZ_BOT_SUPPORT_PAYLOAD = '${BIZ_BOT_SUPPORT_PAYLOAD}';`,
      );
    }

    if (!next.includes("const isAiMsg = typeof messageContent === 'object'")) {
      next = next.replace(
        `                const fullMsg = await generateWAMessage(jid, content, {
                    logger,
                    userJid,
                    getUrlInfo: text => getUrlInfo(text, {
                        thumbnailWidth: linkPreviewImageThumbnailWidth,
                        fetchOpts: {
                            timeout: 3000,
                            ...(httpRequestOptions || {})
                        },
                        logger,
                        uploadImage: generateHighQualityLinkPreview ? waUploadToServer : undefined
                    }),
                    //TODO: CACHE
                    getProfilePicUrl: sock.profilePictureUrl,
                    getCallLink: sock.createCallLink,
                    upload: waUploadToServer,
                    mediaCache: config.mediaCache,
                    options: config.options,
                    messageId: generateMessageIDV2(sock.user?.id),
                    ...options
                });
                const isEventMsg = 'event' in content && !!content.event;
                const isDeleteMsg = 'delete' in content && !!content.delete;
                const isEditMsg = 'edit' in content && !!content.edit;
                const isPinMsg = 'pin' in content && !!content.pin;
                const isPollMessage = 'poll' in content && !!content.poll;`,
        `                const messageContent = typeof content === 'object' && content
                    ? { ...content }
                    : content;
                const isAiMsg = typeof messageContent === 'object'
                    && !!messageContent
                    && 'ai' in messageContent
                    && !!messageContent.ai;
                if (isAiMsg) {
                    delete messageContent.ai;
                }
                const fullMsg = await generateWAMessage(jid, messageContent, {
                    logger,
                    userJid,
                    getUrlInfo: text => getUrlInfo(text, {
                        thumbnailWidth: linkPreviewImageThumbnailWidth,
                        fetchOpts: {
                            timeout: 3000,
                            ...(httpRequestOptions || {})
                        },
                        logger,
                        uploadImage: generateHighQualityLinkPreview ? waUploadToServer : undefined
                    }),
                    //TODO: CACHE
                    getProfilePicUrl: sock.profilePictureUrl,
                    getCallLink: sock.createCallLink,
                    upload: waUploadToServer,
                    mediaCache: config.mediaCache,
                    options: config.options,
                    messageId: generateMessageIDV2(sock.user?.id),
                    ...options
                });
                const isEventMsg = typeof messageContent === 'object' && !!messageContent && 'event' in messageContent && !!messageContent.event;
                const isDeleteMsg = typeof messageContent === 'object' && !!messageContent && 'delete' in messageContent && !!messageContent.delete;
                const isEditMsg = typeof messageContent === 'object' && !!messageContent && 'edit' in messageContent && !!messageContent.edit;
                const isPinMsg = typeof messageContent === 'object' && !!messageContent && 'pin' in messageContent && !!messageContent.pin;
                const isPollMessage = typeof messageContent === 'object' && !!messageContent && 'poll' in messageContent && !!messageContent.poll;`,
      );
    }

    next = next.replaceAll(
      "if (isJidGroup(content.delete?.remoteJid) && !content.delete?.fromMe)",
      "if (isJidGroup(messageContent.delete?.remoteJid) && !messageContent.delete?.fromMe)",
    );

    if (!next.includes("AI labeled messages are only allowed in private chat")) {
      next = next.replace(
        `                else if (isEventMsg) {
                    additionalNodes.push({
                        tag: 'meta',
                        attrs: {
                            event_type: 'creation'
                        }
                    });
                }`,
        `                else if (isEventMsg) {
                    additionalNodes.push({
                        tag: 'meta',
                        attrs: {
                            event_type: 'creation'
                        }
                    });
                }
                else if (isAiMsg) {
                    if (!(isPnUser(jid) || isLidUser(jid))) {
                        throw new Boom('AI labeled messages are only allowed in private chat', {
                            statusCode: 400
                        });
                    }
                    fullMsg.message.messageContextInfo ||= {};
                    fullMsg.message.messageContextInfo.supportPayload = BIZ_BOT_SUPPORT_PAYLOAD;
                    additionalNodes.push({
                        tag: 'bot',
                        attrs: {
                            biz_bot: '1'
                        },
                        content: undefined
                    });
                }`,
      );
    }

    return next;
  });

try {
  const baileysRoot = resolveBaileysRoot();
  const results = await Promise.all([
    patchMessageTypes(baileysRoot),
    patchMessageSend(baileysRoot),
  ]);

  if (results.some(Boolean)) {
    console.log("Berry SDK patched installed Baileys with AI label support.");
  }
} catch (error) {
  console.warn("Berry SDK could not patch installed Baileys:", error instanceof Error ? error.message : error);
}
