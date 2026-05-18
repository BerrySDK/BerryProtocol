# Sending Buttons

## Goal

This file explains how to send interactive button-based messages in BerryProtocol.

## Confirmed

The current client supports:

- `sendButtons(to, payload)`
- `sendLegacyButtons(to, payload)`
- `sendMessage(to, { buttonsMessage: payload })`

## When to use

Use buttons when:

- you want a short menu
- you want explicit reply choices
- you need stronger UX than free-text input

## Reply buttons example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "buttons-session",
});

await client.connectWithQr();

await client.sendButtons("5511999999999@s.whatsapp.net", {
  text: "Choose an option",
  footer: "BerryProtocol demo",
  buttons: [
    { id: "order_status", title: "Order status", kind: "reply" },
    { id: "speak_agent", title: "Human agent", kind: "reply" },
  ],
});
```

## Legacy buttons example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "legacy-buttons-session",
});

await client.connectWithQr();

await client.sendLegacyButtons("5511999999999@s.whatsapp.net", {
  text: "Choose an option",
  footer: "Legacy flow",
  buttons: [
    { id: "opt1", title: "Option 1" },
    { id: "opt2", title: "Option 2" },
  ],
});
```

## Best practices

- keep button labels short
- prefer stable IDs over labels for backend routing
- log click IDs rather than display text
- do not overload a single message with too many choices

## Common mistakes

- using display text as the only business identifier
- creating ambiguous button titles
- forgetting to handle incoming `buttonId` or `selectedButtonId`

## Important notes

### Confirmed

Incoming message contracts expose fields that may contain button interaction identifiers, such as:

- `buttonId`
- `selectedButtonId`
- `rawButtonParamsJson`

### Example conceptual

If you need more advanced button flows like mixed CTA and copy actions in a single wrapper, document them as conceptual until the exact stable public abstraction is finalized.
