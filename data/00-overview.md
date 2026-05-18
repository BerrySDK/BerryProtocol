# BerryProtocol Overview

## Purpose

BerryProtocol is a WhatsApp Web automation SDK and protocol-oriented ecosystem focused on modern messaging, session lifecycle management, and agent-driven commercial automation.

It is designed for developers who need:

- multi-session connectivity
- message sending across different message types
- reconnection and QR-based authentication flows
- support for interactive WhatsApp experiences
- AI-assisted or AI-driven business workflows

## Confirmed

The current codebase confirms support for:

- session-based clients through `BerryProtocol` and `BerryClient`
- QR connection
- link connection
- pairing code connection
- text messages
- image messages
- audio messages
- document messages
- lists
- buttons
- carousel messages
- reactions
- location messages
- contacts
- message editing
- presence updates
- group fetch operations
- event-driven client listeners

## When to use

Use BerryProtocol when you want to build:

- support bots
- notification systems
- lead qualification flows
- AI customer service agents
- OTP verification flows with BerryOTP
- event-based integrations with an API layer such as BerryAPI

## Practical example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "store-main",
});

client.on("connection.open", () => {
  console.log("BerryProtocol is connected");
});

await client.connectWithQr();
```

## Best practices

- treat `sessionId` as a durable identity
- persist session-related data in a stable location
- centralize message sending through your own service layer
- keep observability around connection events and send failures
- isolate AI orchestration from transport concerns

## Common mistakes

- assuming any string is a valid WhatsApp JID
- mixing transport code with business logic
- rebuilding a new client for every message
- ignoring reconnect and auth lifecycle events

## Important notes

- BerryProtocol is best viewed as the messaging runtime layer
- BerryOTP and BerryAPI extend the ecosystem for authentication and external integrations
- BerryAgent should consume this documentation as a foundation for structured answers and retrieval
