import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const replaceAllInFile = async (relativePath, replacements) => {
  const filePath = resolve(relativePath);
  const source = await readFile(filePath, "utf8");
  let next = source;

  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to);
  }

  if (next !== source) {
    await writeFile(filePath, next, "utf8");
  }
};

const patchWithSnippet = async (relativePath, mutator) => {
  const filePath = resolve(relativePath);
  const source = await readFile(filePath, "utf8");
  const next = mutator(source);

  if (next !== source) {
    await writeFile(filePath, next, "utf8");
  }
};

const esmImportFixes = [
  ["_reference_baileys2/lib/Signal/libsignal.js", "libsignal/src/protobufs", "libsignal/src/protobufs.js"],
  ["_reference_baileys2/lib/Utils/crypto.js", "libsignal/src/curve", "libsignal/src/curve.js"],
  ["_reference_baileys2/lib/Signal/Group/group_cipher.js", "libsignal/src/crypto", "libsignal/src/crypto.js"],
  ["_reference_baileys2/lib/Signal/Group/keyhelper.js", "libsignal/src/curve", "libsignal/src/curve.js"],
  ["_reference_baileys2/lib/Signal/Group/sender-chain-key.js", "libsignal/src/crypto", "libsignal/src/crypto.js"],
  ["_reference_baileys2/lib/Signal/Group/sender-key-message.js", "libsignal/src/curve", "libsignal/src/curve.js"],
  ["_reference_baileys2/lib/Signal/Group/sender-message-key.js", "libsignal/src/crypto", "libsignal/src/crypto.js"],
];

for (const [relativePath, from, to] of esmImportFixes) {
  await replaceAllInFile(relativePath, [[from, to]]);
}

await patchWithSnippet("node_modules/baileys/lib/Types/Message.d.ts", (source) => {
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

  return source.includes("ai?: boolean;")
    ? source
    : source.replace(original, patched);
});

await patchWithSnippet("node_modules/baileys/lib/Socket/messages-send.js", (source) => {
  let next = source;

  if (!next.includes("const BIZ_BOT_SUPPORT_PAYLOAD = '{}'")) {
    next = next.replace(
      "import { makeNewsletterSocket } from './newsletter.js';",
      "import { makeNewsletterSocket } from './newsletter.js';\nconst BIZ_BOT_SUPPORT_PAYLOAD = '{}';",
    );
  }

  const originalSendBlock = `                const fullMsg = await generateWAMessage(jid, content, {
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
                const isPollMessage = 'poll' in content && !!content.poll;`;

  const patchedSendBlock = `                const messageContent = typeof content === 'object' && content
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
                const isPollMessage = typeof messageContent === 'object' && !!messageContent && 'poll' in messageContent && !!messageContent.poll;`;

  if (!next.includes("const isAiMsg = typeof messageContent === 'object'")) {
    next = next.replace(originalSendBlock, patchedSendBlock);
  }

  if (next.includes("if (isJidGroup(content.delete?.remoteJid) && !content.delete?.fromMe)")) {
    next = next.replaceAll(
      "if (isJidGroup(content.delete?.remoteJid) && !content.delete?.fromMe)",
      "if (isJidGroup(messageContent.delete?.remoteJid) && !messageContent.delete?.fromMe)",
    );
  }

  const originalEventBlock = `                else if (isEventMsg) {
                    additionalNodes.push({
                        tag: 'meta',
                        attrs: {
                            event_type: 'creation'
                        }
                    });
                }`;

  const patchedEventBlock = `                else if (isEventMsg) {
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
                }`;

  if (!next.includes("AI labeled messages are only allowed in private chat")) {
    next = next.replace(originalEventBlock, patchedEventBlock);
  }

  return next;
});

console.log("Patched Baileys ESM imports and AI label support.");
