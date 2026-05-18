import crypto from "node:crypto";
import fs from "node:fs/promises";

export function normalizeWhatsAppMarkdown(text) {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, "*$1*")
    .replace(/__(.*?)__/g, "_$1_")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function shouldIgnoreText(text) {
  if (!text) return true;
  if (text === "[unsupported message]") return true;
  return false;
}

export function shortId() {
  return crypto.randomBytes(4).toString("hex");
}

export function sanitizeFileName(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function wantsCode(text) {
  return /\b(codigo|código|script|example|exemplo|file|arquivo|index\.js|javascript|typescript|node|api|integration|integração|integracao|sdk|snippet|function|função|funcao)\b/i.test(
    text,
  );
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}
