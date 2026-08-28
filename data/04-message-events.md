# Message Events

## Goal

This file documents the event model that BerryProtocol exposes for real-time message-driven applications.

## Confirmed

The event contracts in the current codebase include:

- `message.received`
- `message.sent`
- `message.ack`
- `presence.update`
- `chats.update`
- `sync.history`
- `sync.contacts`
- `sync.groups`
- `sync.messages`
- `protocol.error`

## When to use

Use this file when you are building:

- event processors
- inbox sync flows
- AI agents reacting to inbound messages
- observability or audit pipelines

## Example: inbound listener

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "events-session",
});

client.on("message.received", (message) => {
  console.log("Incoming message", {
    type: message.type,
    from: message.from,
    chatId: message.chatId,
  });
});

await client.connectWithQr();
```

## Example: acknowledgment listener

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "ack-session",
});

client.on("message.ack", (ack) => {
  console.log("Ack update", ack);
});

await client.connectWithQr();
```

## Best practices

- normalize inbound events before passing them to business logic
- keep raw transport concerns out of your domain services
- persist message IDs if you need edits, reactions, or audits later
- observe both sent events and ack events

## Common mistakes

- assuming all inbound messages are text
- ignoring the difference between sender and chat identifiers
- treating `message.sent` as proof of delivery

## Important notes

### Confirmed

The message contracts include message metadata such as:

- `id`
- `to`
- `from`
- `chatId`
- `remoteJid`
- `timestamp`
- `ack`
- `type`

### Example conceptual

BerryAgent can subscribe to `message.received`, convert inbound payloads into embeddings or structured tasks, and then decide whether to answer directly or route to a flow engine.
