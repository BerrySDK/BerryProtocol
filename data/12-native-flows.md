# Native Flows

## Goal

This file explains WhatsApp-native interaction patterns and how BerryProtocol models structured interactive payloads.

## Confirmed

The current contracts expose:

- `InteractivePayload`
- `InteractiveHeader`
- `InteractiveBody`
- `InteractiveFooter`
- `InteractiveNativeButton`
- `InteractiveNativeFlowPayload`

The client also exposes:

- `sendMessage(to, { interactiveMessage: payload })`

## When to use

Use native-flow style interactions when:

- you need richer interactive experiences
- the default button/list abstractions are too limited
- your application needs structured parameters for a flow renderer

## Practical example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "native-flow-session",
});

await client.connectWithQr();

await client.sendMessage("5511999999999@s.whatsapp.net", {
  interactiveMessage: {
    header: {
      title: "Berry native flow",
    },
    body: {
      text: "Choose a flow action",
    },
    footer: {
      text: "Interactive demo",
    },
    nativeFlowMessage: {
      buttons: [
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: "Continue",
            id: "continue_flow",
          }),
        },
      ],
    },
  },
});
```

## Best practices

- keep native-flow payload generation centralized
- validate JSON payloads before sending
- document each `name` and parameter schema internally

## Common mistakes

- mixing multiple incompatible button payload shapes
- building `buttonParamsJson` manually without validation
- using native flows where a simple list is enough

## Important notes

### Confirmed

Native-flow payload support is present at the type and client API level.

### Example conceptual

If BerryAgent needs a higher-level builder for native flows, create a domain-specific abstraction above `InteractivePayload` rather than embedding raw JSON across the codebase.
