# Sending Text Messages

## Goal

This file explains how to send plain text and text-centric payloads in BerryProtocol.

## Confirmed

The current public client supports:

- `sendText(to, text)`
- `sendMessage(to, { text })`
- `editMessage(to, messageId, text)`

## When to use

Use this file when:

- sending plain responses
- sending confirmations, alerts, or prompts
- implementing AI assistant replies
- editing a previous text message

## Simple text example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "send-text-session",
});

await client.connectWithQr();
await client.sendText("5511999999999@s.whatsapp.net", "Your order has been confirmed.");
```

## Using sendMessage with text

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "send-message-text",
});

await client.connectWithQr();
await client.sendMessage("5511999999999@s.whatsapp.net", {
  text: "This was sent through sendMessage",
});
```

## Editing a message

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "edit-message-session",
});

await client.connectWithQr();

const sent = await client.sendText("5511999999999@s.whatsapp.net", "Pending...");
await client.editMessage("5511999999999@s.whatsapp.net", sent.id, "Done.");
```

## Best practices

- use `sendText` for the simplest case
- store returned message IDs if future edits are possible
- validate JIDs before sending
- standardize message tone through an application layer

## Common mistakes

- attempting to edit messages without storing the original message ID
- mixing user-facing text generation with transport logic
- assuming every send succeeds immediately

## Important notes

### Confirmed

`sendText` delegates to the general send path but is the clearest API for plain outbound text.

### Example conceptual

If you need advanced quoting or forwarding metadata on text messages, use a wrapper service and mark the logic as transport-specific until a stable high-level public method exists.
