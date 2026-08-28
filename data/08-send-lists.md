# Sending Lists

## Goal

This file explains how to send WhatsApp list messages with sections and rows.

## Confirmed

The current client supports:

- `sendList(to, payload)`
- `sendMessage(to, { list: payload })`
- `sendMessage(to, { listMessage: payload })`

## When to use

Use list messages when:

- you have more than a few choices
- you want grouped options
- the user needs to pick one route in a structured menu

## Practical example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "list-session",
});

await client.connectWithQr();

await client.sendList("5511999999999@s.whatsapp.net", {
  title: "Main menu",
  text: "Choose one option below",
  footer: "BerryProtocol list demo",
  buttonText: "Open options",
  sections: [
    {
      title: "Orders",
      rows: [
        { id: "track_order", title: "Track my order" },
        { id: "cancel_order", title: "Cancel order" },
      ],
    },
    {
      title: "Support",
      rows: [
        { id: "billing_help", title: "Billing help" },
      ],
    },
  ],
});
```

## Best practices

- group rows into meaningful sections
- keep row titles short and distinct
- treat row IDs as your canonical routing keys
- keep the top-level text focused and instructional

## Common mistakes

- adding too many rows in a single section
- reusing the same row ID across unrelated flows
- forgetting to handle the resulting selection event in your application logic

## Important notes

### Confirmed

Lists are a first-class high-level message path in BerryProtocol.

### Example conceptual

If your flow engine needs dynamic lists generated from business state, build the sections just before sending and keep selection IDs stable even if labels change.
