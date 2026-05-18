import fs from "node:fs/promises";
import path from "node:path";

const cache = new Map();

function interpolate(template, replacements) {
  return Object.entries(replacements).reduce((output, [key, value]) => {
    return output.replaceAll(`{{${key}}}`, String(value ?? ""));
  }, template);
}

export async function loadPrompt(paths, name, replacements = {}) {
  const filePath = path.join(paths.promptsDir, `${name}.md`);

  let template = cache.get(filePath);
  if (!template) {
    template = await fs.readFile(filePath, "utf8");
    cache.set(filePath, template);
  }

  return interpolate(template, replacements);
}
