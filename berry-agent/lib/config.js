import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_CONFIG = {
  company: {
    name: "BerryProtocol",
    assistantName: "BerryAgent",
    themeName: "purple",
    primaryEmojis: ["💜", "🟣", "⚡", "🚀", "✨"],
    forbiddenThemeEmojis: ["💚", "🟢", "🍀"],
    description:
      "BerryProtocol is a WhatsApp Web automation technology for AI agents, advanced messages, and intelligent commercial flows.",
    products: ["BerryProtocol", "BerryAgent", "BerryStudio", "BerryAPI"],
  },
  models: {
    default: "llama-3.3-70b-versatile",
    code: "openai/gpt-oss-120b",
    fallback: "llama-3.3-70b-versatile",
  },
  behavior: {
    collectLeadFirst: true,
    askOneQuestionAtTime: true,
    preferInteractiveMessages: true,
    useButtonsMore: true,
    useListsMore: true,
    sendCodeAsFile: true,
    ignoreGroups: true,
    historyWindow: 12,
    maxRetrievedChunks: 6,
  },
  leadFields: ["name", "email", "goal"],
  style: {
    useWhatsappMarkdown: true,
    boldSymbol: "*",
    italicSymbol: "_",
    neverUseDoubleAsterisk: true,
    emojiFrequency: "medium",
    maxEmojisPerMessage: 2,
    tone: "professional, human, consultative, technical",
  },
  interactiveRules: {
    buttonsWhenOptionsUpTo: 3,
    listWhenOptionsAbove: 3,
    forceButtonsForLeadChoices: true,
    forceListForFeatureMenus: true,
  },
  retrieval: {
    preferConfirmedSections: true,
    sectionWeight: 3,
    fileNameWeight: 2,
    keywordWeight: 1,
  },
};

function mergeDeep(target, source) {
  if (!source || typeof source !== "object") {
    return target;
  }

  const output = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      output[key] = mergeDeep(target[key], value);
    } else {
      output[key] = value;
    }
  }

  return output;
}

export async function loadAgentConfig(baseDir) {
  const configPath = path.join(baseDir, "agent.config.json");

  try {
    const raw = await fs.readFile(configPath, "utf8");
    return mergeDeep(DEFAULT_CONFIG, JSON.parse(raw));
  } catch {
    return DEFAULT_CONFIG;
  }
}
