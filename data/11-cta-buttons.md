# CTA Buttons

## Goal

This file explains CTA-oriented button patterns, especially URL-driven actions used in business automation.

## Confirmed

The event contracts currently define button kinds that include:

- `cta_url`
- `copy_code`
- `quick_reply`
- `reply`

## When to use

Use CTA buttons when:

- sending payment links
- redirecting to order tracking
- opening forms or support pages
- escalating to self-service portals

## Example conceptual

This is a conceptual example that shows a likely button composition pattern.

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "cta-button-session",
});

await client.connectWithQr();

await client.sendButtons("5511999999999@s.whatsapp.net", {
  text: "Open your billing portal",
  footer: "BerryProtocol CTA example",
  buttons: [
    {
      id: "open_billing",
      title: "Open portal",
      kind: "cta_url",
      url: "https://example.com/billing",
    },
  ],
});
```

## Best practices

- prefer short trusted domains
- clearly describe what happens after click
- keep CTAs aligned with the current conversation stage

## Common mistakes

- mixing too many different intents in one CTA message
- not validating destination URLs before sending
- using CTA where a simple reply action would be better

## Important notes

### Suggestion of implementation

For agent-driven systems, represent CTA buttons with:

- action type
- destination URL
- label
- analytics metadata

This makes downstream reporting easier.
