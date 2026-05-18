import fs from "node:fs/promises";
import path from "node:path";
import BerryProtocol from "berryprotocol";
import OpenAI from "openai";

const client = new BerryProtocol({
  sessionId: "rag-agent-example",
});

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

async function loadKnowledgeBase() {
  const dataDir = path.resolve("./data");
  const files = await fs.readdir(dataDir);
  const markdownFiles = files.filter((name) => name.endsWith(".md"));

  return Promise.all(
    markdownFiles.map(async (name) => ({
      name,
      content: await fs.readFile(path.join(dataDir, name), "utf8"),
    })),
  );
}

function retrieveTopMatches(documents, query) {
  const lowered = query.toLowerCase();

  return documents
    .map((doc) => {
      const score = lowered
        .split(/\s+/)
        .filter(Boolean)
        .reduce((acc, token) => acc + (doc.content.toLowerCase().includes(token) ? 1 : 0), 0);

      return { ...doc, score };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

const knowledgeBase = await loadKnowledgeBase();

client.on("message.received", async (message) => {
  if (message.type !== "text" || !message.from) {
    return;
  }

  const chatId = message.chatId ?? message.from;
  const matches = retrieveTopMatches(knowledgeBase, message.text);
  const context = matches.map((doc) => `File: ${doc.name}\n${doc.content}`).join("\n\n---\n\n");

  const completion = await ai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "You are BerryAgent. Answer only from the provided BerryProtocol knowledge base when possible.",
      },
      {
        role: "user",
        content: `Knowledge base context:\n${context}\n\nQuestion:\n${message.text}`,
      },
    ],
  });

  const answer = completion.choices[0]?.message?.content ?? "No answer available.";

  await client.sendMessage(chatId, {
    text: answer,
    ai: true,
  });
});

await client.connectWithQr();
