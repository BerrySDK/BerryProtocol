import fs from "node:fs/promises";
import path from "node:path";

const PLAYBOOK_MATCHERS = [
  {
    id: "first-contact",
    title: "First commercial contact",
    patterns: [
      /\b(oi|olá|ola|hello|hi|hey|bom dia|boa tarde|boa noite)\b/i,
      /\b(quero saber|tenho interesse|preciso de ajuda|gostaria de entender)\b/i,
    ],
  },
  {
    id: "lead-qualification",
    title: "Lead qualification",
    patterns: [
      /\b(orçamento|orcamento|preço|preco|planos|pricing|quanto custa|contratar)\b/i,
      /\b(vendas|suporte|opera[cç][aã]o|neg[oó]cio|empresa)\b/i,
    ],
  },
  {
    id: "technical-support",
    title: "Technical support",
    patterns: [
      /\b(erro|error|bug|falha|failed|não funciona|nao funciona|problem|issue)\b/i,
      /\b(qr|session|sess[aã]o|connect|conectar|message|webhook|api)\b/i,
    ],
  },
  {
    id: "onboarding",
    title: "BerryProtocol onboarding",
    patterns: [
      /\b(como começar|como comecar|get started|quickstart|instala[cç][aã]o|installation|setup)\b/i,
      /\b(berryprotocol|berryapi|berryagent|berryotp)\b/i,
    ],
  },
  {
    id: "cold-recovery",
    title: "Cold conversation recovery",
    patterns: [
      /\b(voltei|retomando|continuando|still there|following up|faz tempo|sumi|desculpa a demora)\b/i,
    ],
  },
];

const cache = new Map();

async function readPlaybook(paths, id) {
  const filePath = path.join(paths.playbooksDir, `${id}.md`);
  if (cache.has(filePath)) {
    return cache.get(filePath);
  }

  try {
    const content = await fs.readFile(filePath, "utf8");
    cache.set(filePath, content);
    return content;
  } catch {
    return "";
  }
}

export function detectPlaybookScenario(text = "", config) {
  if (!config?.playbooks?.enabled) {
    return null;
  }

  if (config.playbooks.autoDetect === false) {
    return null;
  }

  const allowed = new Set(config.playbooks.scenarios || []);
  const normalized = String(text);

  for (const matcher of PLAYBOOK_MATCHERS) {
    if (allowed.size && !allowed.has(matcher.id)) {
      continue;
    }

    const matched = matcher.patterns.every((pattern) => pattern.test(normalized));
    if (matched) {
      return matcher;
    }
  }

  return null;
}

export async function loadOptionalPlaybook(paths, config, text) {
  const scenario = detectPlaybookScenario(text, config);
  if (!scenario) {
    return {
      enabled: false,
      scenarioId: null,
      scenarioTitle: null,
      context: "No optional playbook active.",
    };
  }

  const content = await readPlaybook(paths, scenario.id);
  if (!content) {
    return {
      enabled: false,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      context: "Optional playbook configured, but no content file was found.",
    };
  }

  return {
    enabled: true,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    context: content,
  };
}
