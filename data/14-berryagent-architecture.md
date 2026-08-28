# BerryAgent Architecture

## Goal

This file proposes a production-ready architecture for BerryAgent as the official AI agent built on top of BerryProtocol.

## When to use

Use this file when designing:

- local RAG execution
- multi-session AI orchestration
- tool calling around WhatsApp operations
- support and sales automation

## Confirmed

Confirmed BerryProtocol building blocks that BerryAgent can rely on:

- session-scoped clients
- incoming message events
- outbound text and interactive messaging
- session reconnection and auth flows

## Implementation suggestion

Recommended architecture:

- `SessionRegistry`
  - creates and owns BerryProtocol clients
- `InboundNormalizer`
  - converts BerryProtocol events into agent-friendly tasks
- `Retriever`
  - reads markdown knowledge from `/data`
- `PromptBuilder`
  - assembles system, context, and user content
- `LLMAdapter`
  - wraps OpenAI-compatible providers
- `PolicyEngine`
  - enforces tool and response constraints
- `ActionExecutor`
  - decides whether to reply with text, list, buttons, or carousel
- `MemoryStore`
  - stores conversation summaries and recent turns

## Example conceptual

```js
class BerryAgentRuntime {
  constructor({ sessionRegistry, retriever, llm, actionExecutor }) {
    this.sessionRegistry = sessionRegistry;
    this.retriever = retriever;
    this.llm = llm;
    this.actionExecutor = actionExecutor;
  }

  async handleInboundMessage(event) {
    const context = await this.retriever.search(event.text);
    const answer = await this.llm.respond({
      userInput: event.text,
      context,
    });

    await this.actionExecutor.sendText(event.chatId, answer);
  }
}
```

## Best practices

- use retrieval before generation
- maintain explicit conversation state per chat
- do not expose raw model output directly when business actions are involved
- gate high-risk actions behind confirmation steps

## Common mistakes

- treating the transport client as the whole agent
- overloading a single prompt with unrelated documentation
- skipping observability for retrieval quality

## Important notes

The `/data` directory requested for BerryAgent should be treated as first-class retrieval content, not as generic notes.
