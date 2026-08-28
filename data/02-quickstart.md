# Quick Start

## Goal

This file provides a fast path from installation to a working connection and a first message send.

## Confirmed

BerryProtocol currently exposes:

- `connectWithQr()`
- `connectWithLink()`
- `connectWithPairingCode()`
- `sendText()`
- event listeners through `.on(...)`

## When to use

Use this file when you need the minimum working setup for:

- local testing
- demos
- first agent connection
- onboarding new developers

## Minimal connection flow

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "quickstart-session",
});

client.on("auth.qr", ({ value }) => {
  console.log("Scan this QR code:", value);
});

client.on("connection.open", () => {
  console.log("Connected");
});

await client.connectWithQr();
```

## Minimal send flow

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "quickstart-send",
});

await client.connectWithQr();
await client.sendText("5511999999999@s.whatsapp.net", "Hello from BerryProtocol");
```

## Best practices

- keep quickstart examples isolated from production orchestration
- verify the target JID format before sending
- log both `auth.qr` and `connection.open` during onboarding

## Common mistakes

- calling `sendText` before the connection is established
- forgetting to persist the same `sessionId`
- assuming the QR code remains valid indefinitely

## Important notes

### Confirmed

Incoming event names observed in the codebase include:

- `auth.qr`
- `connection.open`
- `connection.close`
- `message.received`
- `message.ack`

### Example conceptual

If you want a fast local agent bootstrap, BerryAgent can wrap the client in a service object and expose a `start()` method that internally calls `connectWithQr()`.
