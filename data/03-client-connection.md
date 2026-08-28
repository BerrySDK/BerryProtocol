# Client Connection and Session Lifecycle

## Goal

This file explains how BerryProtocol manages sessions, authentication entrypoints, reconnect behavior, and lifecycle events.

## Confirmed

The current BerryProtocol client supports:

- `connect(auth?)`
- `connectWithLink()`
- `connectWithQr()`
- `connectWithPairingCode(phoneNumber, customPairingCode?)`
- `disconnect()`
- `reconnect()`
- `logout()`
- `getQrCode()`

It also stores session/auth snapshots through the auth/store layers.

## When to use

Use this file when working on:

- connection bootstrapping
- QR-based onboarding
- pairing code flows
- reconnect design
- multi-session orchestration

## QR connection example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "qr-session",
  printQrInTerminal: true,
});

client.on("auth.qr", ({ value }) => {
  console.log("QR updated", value);
});

await client.connectWithQr();
```

## Pairing code example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "pairing-session",
});

await client.connectWithPairingCode("5511999999999");
```

## Best practices

- map one business identity to one `sessionId`
- never destroy auth state on transient transport errors
- keep explicit logging for auth, reconnect, and logout actions
- implement a session supervisor if you run multiple clients

## Common mistakes

- calling `logout()` when the goal is only a soft reconnect
- reusing the same `sessionId` in concurrent processes
- storing auth state in a temporary filesystem path

## Important notes

### Confirmed

BerryProtocol emits auth-related events such as:

- `auth.link`
- `auth.qr`
- `auth.pairing_code`
- `auth.success`
- `auth.error`

### Implementation suggestion

For BerryAgent, keep a `SessionRegistry` that owns:

- active clients
- connection state
- last QR value
- reconnection metrics
- last protocol error
