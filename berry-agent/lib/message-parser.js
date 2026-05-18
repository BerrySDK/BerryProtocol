import { shouldIgnoreText } from "./utils.js";

export function extractInboundMessage(rawMessage) {
  if (!rawMessage) {
    return null;
  }

  const fromMe = rawMessage.key?.fromMe || rawMessage.fromMe;
  if (fromMe) {
    return null;
  }

  const remoteJid =
    rawMessage.key?.remoteJid ||
    rawMessage.remoteJid ||
    rawMessage.chatId ||
    rawMessage.from;

  const messageId =
    rawMessage.key?.id ||
    rawMessage.id ||
    `${remoteJid}:${rawMessage.timestamp || Date.now()}`;

  const text =
    rawMessage.text ||
    rawMessage.body ||
    rawMessage.message?.conversation ||
    rawMessage.message?.extendedTextMessage?.text ||
    rawMessage.message?.buttonsResponseMessage?.selectedButtonId ||
    rawMessage.message?.buttonsResponseMessage?.selectedDisplayText ||
    rawMessage.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    rawMessage.message?.listResponseMessage?.title ||
    rawMessage.message?.templateButtonReplyMessage?.selectedId ||
    rawMessage.message?.templateButtonReplyMessage?.selectedDisplayText ||
    rawMessage.message?.interactiveResponseMessage?.body?.text ||
    rawMessage.message?.imageMessage?.caption ||
    rawMessage.message?.videoMessage?.caption;

  if (!remoteJid || shouldIgnoreText(text)) {
    return null;
  }

  return {
    id: messageId,
    chatId: rawMessage.chatId || remoteJid,
    remoteJid,
    from: rawMessage.from || remoteJid,
    text,
    raw: rawMessage,
    isGroup: remoteJid.endsWith("@g.us"),
  };
}

export function createDeduper(maxSize = 2000) {
  const seen = new Map();

  function has(id) {
    return seen.has(id);
  }

  function add(id) {
    seen.set(id, Date.now());
    if (seen.size > maxSize) {
      const firstKey = seen.keys().next().value;
      if (firstKey) {
        seen.delete(firstKey);
      }
    }
  }

  return { has, add };
}
