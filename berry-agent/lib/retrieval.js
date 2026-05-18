import fs from "node:fs/promises";
import path from "node:path";

function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function tokenize(text) {
  return normalize(text)
    .split(/[^\p{L}\p{N}_-]+/u)
    .filter((term) => term.length >= 3);
}

function splitIntoSections(file, content) {
  const lines = String(content).split(/\r?\n/);
  const sections = [];
  let currentTitle = "Introduction";
  let currentLines = [];

  function pushSection() {
    const text = currentLines.join("\n").trim();
    if (!text) return;
    sections.push({
      file,
      section: currentTitle,
      content: text,
    });
  }

  for (const line of lines) {
    if (/^#{1,3}\s+/.test(line)) {
      pushSection();
      currentTitle = line.replace(/^#{1,3}\s+/, "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  pushSection();
  return sections;
}

function detectTags(section) {
  const lowered = normalize(section.content);
  const tags = [];
  if (lowered.includes("## confirmed") || lowered.includes("### confirmed")) tags.push("confirmed");
  if (lowered.includes("conceptual example")) tags.push("conceptual");
  if (lowered.includes("implementation suggestion")) tags.push("suggestion");
  return tags;
}

function scoreChunk(queryTerms, chunk, config) {
  const fileText = normalize(chunk.file);
  const sectionText = normalize(chunk.section);
  const contentText = normalize(chunk.content);

  let score = 0;
  for (const term of queryTerms) {
    if (fileText.includes(term)) score += config.retrieval.fileNameWeight;
    if (sectionText.includes(term)) score += config.retrieval.sectionWeight;
    if (contentText.includes(term)) score += config.retrieval.keywordWeight;
  }

  const tags = detectTags(chunk);
  if (config.retrieval.preferConfirmedSections && tags.includes("confirmed")) {
    score += 3;
  }

  return { score, tags };
}

export async function loadKnowledgeBase(paths) {
  const candidateDirs = [paths.localDataDir, paths.rootDataDir];
  const docs = [];

  for (const dir of candidateDirs) {
    try {
      const entries = await fs.readdir(dir);
      const markdownFiles = entries.filter((file) => file.endsWith(".md"));
      for (const file of markdownFiles) {
        const fullPath = path.join(dir, file);
        const content = await fs.readFile(fullPath, "utf8");
        docs.push({
          file,
          content,
          fullPath,
        });
      }
      if (docs.length) break;
    } catch {
      continue;
    }
  }

  const chunks = docs.flatMap((doc) => splitIntoSections(doc.file, doc.content));
  return chunks;
}

export async function searchKnowledgeBase(paths, config, query, limit = 5) {
  const chunks = await loadKnowledgeBase(paths);
  if (!chunks.length) {
    return { found: false, context: "", sources: [], chunks: [] };
  }

  const terms = tokenize(query);
  const ranked = chunks
    .map((chunk) => {
      const { score, tags } = scoreChunk(terms, chunk, config);
      return { ...chunk, score, tags };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (!ranked.length) {
    return { found: false, context: "", sources: [], chunks: [] };
  }

  const context = ranked
    .map((chunk) => {
      const tagSummary = chunk.tags.length ? `Tags: ${chunk.tags.join(", ")}` : "Tags: none";
      return `# Source: ${chunk.file}\n## Section: ${chunk.section}\n${tagSummary}\n${chunk.content.slice(0, 5000)}`;
    })
    .join("\n\n---\n\n");

  const uniqueSources = [...new Set(ranked.map((chunk) => chunk.file))];

  return {
    found: true,
    context,
    sources: uniqueSources,
    chunks: ranked,
  };
}
