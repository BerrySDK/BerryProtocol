# AI Agent Integration

## Goal

This file explains how BerryProtocol can be used as the transport layer for AI agents, including OpenAI-compatible APIs and Groq-compatible APIs.

## Confirmed

BerryProtocol currently supports:

- inbound events through `message.received`
- text sending
- interactive sending
- AI-labeled message support at the message level

## When to use

Use this file when building:

- autonomous chat agents
- assisted support bots
- AI-powered product recommendation flows
- RAG-enabled WhatsApp assistants

## Example with OpenAI-compatible API

```js
import BerryProtocol from "berryprotocol";
import OpenAI from "openai";

const client = new BerryProtocol({
  sessionId: "berryagent-openai",
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
      {
        role: "system",
        content: "You are BerryAgent, a helpful WhatsApp commerce assistant.",
      },
      {
        role: "user",
        content: message.text,
      },
    ],
  });

  const reply = completion.choices[0]?.message?.content ?? "I could not generate a reply.";

  await client.sendMessage(message.chatId ?? message.from, {
    text: reply,
    ai: true,
  });
});

await client.connectWithQr();
```

## Example with Groq-compatible API

```js
import BerryProtocol from "berryprotocol";
import OpenAI from "openai";

const client = new BerryProtocol({
  sessionId: "berryagent-groq",
});

const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

client.on("message.received", async (message) => {
  if (message.type !== "text" || !message.from) {
    return;
  }

  const completion = await ai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are BerryAgent. Keep answers concise and helpful.",
      },
      {
        role: "user",
        content: message.text,
      },
    ],
  });

  const reply = completion.choices[0]?.message?.content ?? "No answer available.";

  await client.sendText(message.chatId ?? message.from, reply);
});

await client.connectWithQr();
```

## Best practices

- separate AI orchestration from transport
- add guardrails before calling the model
- keep a retriever layer independent from the LLM client
- log model latency and transport latency separately

## Common mistakes

- sending raw prompts directly from transport handlers without normalization
- letting the model choose transport semantics without validation
- mixing RAG retrieval code with WhatsApp send code in one file

## Important notes

### Confirmed

AI label is supported at the message level and can also be applied to supported carousel messages.

### Suggestion of implementation

BerryAgent should use a layered design:

- retriever
- prompt composer
- model client
- policy/guardrails
- action executor
- BerryProtocol transport adapter
