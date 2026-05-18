import fs from "node:fs/promises";
import { normalizeWhatsAppMarkdown } from "./utils.js";

export async function sendText(client, to, text) {
  const normalized = normalizeWhatsAppMarkdown(text);

  if (typeof client.sendText === "function") {
    return client.sendText(to, normalized);
  }

  if (typeof client.sendMessage === "function") {
    return client.sendMessage(to, { text: normalized });
  }

  throw new Error("No text send method available on BerryProtocol client.");
}

export async function sendFile(client, to, filePath, fileName) {
  if (typeof client.sendDocument === "function") {
    try {
      await client.sendDocument(to, {
        path: filePath,
        fileName,
        mimetype: "application/javascript",
      });
      return true;
    } catch {}
  }

  if (typeof client.sendMessage === "function") {
    try {
      const buffer = await fs.readFile(filePath);
      await client.sendMessage(to, {
        document: buffer,
        fileName,
        mimetype: "application/javascript",
      });
      return true;
    } catch {}
  }

  return false;
}

export async function sendButtons(client, to, action) {
  const normalizedButtons = (action.buttons || []).map((button, index) => ({
    id: button.id || `btn_${index + 1}`,
    title: button.text || button.title || `Option ${index + 1}`,
    kind: button.kind || "reply",
    code: button.code,
    url: button.url,
  }));

  const fallback = `${action.text}\n\n${normalizedButtons
    .map((button, index) => `*${index + 1}.* ${button.title}`)
    .join("\n")}`;

  if (typeof client.sendButtons === "function") {
    try {
      await client.sendButtons(to, {
        text: action.text,
        footer: action.footer,
        buttons: normalizedButtons,
      });
      return true;
    } catch {}
  }

  await sendText(client, to, fallback);
  return false;
}

export async function sendList(client, to, action) {
  const fallback = `${action.text}\n\n${(action.sections || [])
    .map(
      (section) =>
        `*${section.title}*\n${(section.rows || [])
          .map((row, index) => `*${index + 1}.* ${row.title}${row.description ? `\n_${row.description}_` : ""}`)
          .join("\n")}`,
    )
    .join("\n\n")}`;

  if (typeof client.sendList === "function") {
    try {
      await client.sendList(to, {
        text: action.text,
        title: action.title || "Options",
        footer: action.footer,
        buttonText: action.buttonText || "See options",
        sections: action.sections || [],
      });
      return true;
    } catch {}
  }

  await sendText(client, to, fallback);
  return false;
}
