# Complete Examples

## Goal

This file contains complete examples for common BerryProtocol and BerryAgent scenarios.

## Example 1: Basic bot

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "basic-bot",
});

client.on("message.received", async (message) => {
  if (message.type !== "text" || !message.from) {
    return;
  }

  const text = message.text.trim().toLowerCase();

  if (text === "ping") {
    await client.sendText(message.chatId ?? message.from, "pong");
  }
});

await client.connectWithQr();
```

## Example 2: Button menu

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "button-menu",
});

await client.connectWithQr();

await client.sendButtons("5511999999999@s.whatsapp.net", {
  text: "Choose a path",
  footer: "BerryProtocol example",
  buttons: [
    { id: "sales", title: "Sales", kind: "reply" },
    { id: "support", title: "Support", kind: "reply" },
  ],
});
```

## Example 3: List menu

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "list-menu",
});

await client.connectWithQr();

await client.sendList("5511999999999@s.whatsapp.net", {
  title: "Departments",
  text: "Select where you want to go",
  footer: "BerryProtocol example",
  buttonText: "Open list",
  sections: [
    {
      title: "General",
      rows: [
        { id: "faq", title: "FAQ" },
        { id: "billing", title: "Billing" },
      ],
    },
  ],
});
```

## Example 4: Carousel

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "carousel-example",
});

await client.connectWithQr();

await client.sendCarousel("5511999999999@s.whatsapp.net", {
  text: "Featured items",
  footer: "Swipe through the cards",
  carouselCardType: "image",
  cards: [
    {
      title: "Product A",
      body: "A short description",
      footer: "R$ 49,90",
      image: { url: "https://example.com/product-a.jpg" },
      buttons: [
        { id: "buy_a", title: "Buy now", kind: "quick_reply" },
      ],
    },
  ],
});
```

## Example 5: AI reply

```js
import BerryProtocol from "berryprotocol";
import OpenAI from "openai";

const client = new BerryProtocol({
  sessionId: "ai-example",
});

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

client.on("message.received", async (message) => {
  if (message.type !== "text" || !message.from) {
    return;
  }

  const completion = await ai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "You are BerryAgent." },
      { role: "user", content: message.text },
    ],
  });

  const answer = completion.choices[0]?.message?.content ?? "No answer available.";

  await client.sendMessage(message.chatId ?? message.from, {
    text: answer,
    ai: true,
  });
});

await client.connectWithQr();
```

## Example 6: AI + retrieval

```js
import fs from "node:fs/promises";
import path from "node:path";
import BerryProtocol from "berryprotocol";
import OpenAI from "openai";

const client = new BerryProtocol({
  sessionId: "rag-example",
});

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function loadKnowledgeBase() {
  const dataDir = path.resolve("./data");
  const names = await fs.readdir(dataDir);
  const markdownFiles = names.filter((name) => name.endsWith(".md"));
  const contents = await Promise.all(
    markdownFiles.map(async (name) => {
      const text = await fs.readFile(path.join(dataDir, name), "utf8");
      return { name, text };
    }),
  );

  return contents;
}

function retrieveDocuments(documents, query) {
  const normalized = query.toLowerCase();

  return documents
    .filter((doc) => doc.text.toLowerCase().includes(normalized))
    .slice(0, 3);
}

const knowledgeBase = await loadKnowledgeBase();

client.on("message.received", async (message) => {
  if (message.type !== "text" || !message.from) {
    return;
  }

  const docs = retrieveDocuments(knowledgeBase, message.text);
  const context = docs.map((doc) => `# ${doc.name}\n${doc.text}`).join("\n\n");

  const completion = await ai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "You are BerryAgent. Answer using the provided BerryProtocol context.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${message.text}`,
      },
    ],
  });

  const answer = completion.choices[0]?.message?.content ?? "No answer available.";

  await client.sendText(message.chatId ?? message.from, answer);
});

await client.connectWithQr();
```

## Best practices

- keep examples isolated by use case
- copy examples into a dedicated app instead of editing them in place
- validate environment variables before boot

## Common mistakes

- using example code as production architecture without adaptation
- mixing secrets directly into examples

## Important notes

Examples in this file aim to be practical, but orchestration details such as storage, retries, and policy enforcement should still be handled in your application layer.
