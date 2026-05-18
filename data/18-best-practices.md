# Best Practices

## Goal

This file summarizes practical recommendations for building reliable systems on top of BerryProtocol.

## When to use

Consult this file when designing:

- production bots
- AI-powered assistants
- multi-session operators
- integration layers

## Recommended practices

### Session ownership

- use one stable `sessionId` per logical runtime session
- avoid concurrent ownership
- persist auth state outside temporary folders

### Messaging architecture

- wrap transport calls in an application service
- store outbound message IDs
- separate transport payload generation from business decision logic

### AI architecture

- normalize inbound messages before prompting
- use retrieval before generation
- define action policies for high-risk operations
- keep prompts and transport concerns separate

### Observability

- log connection changes
- track send success and ack updates
- measure AI latency separately from WhatsApp transport latency

### Security

- sanitize external inputs before using them in prompts
- protect API keys and session storage
- avoid exposing raw internal errors to end users

## Practical example

```js
export class OutboundMessagingService {
  constructor(client) {
    this.client = client;
  }

  async sendOrderConfirmation(jid, orderNumber) {
    return this.client.sendText(
      jid,
      `Your order ${orderNumber} has been confirmed.`,
    );
  }
}
```

## Common mistakes

- leaking transport details into UI code
- directly embedding huge prompts in event listeners
- forgetting to debounce or rate-limit AI-heavy workflows

## Important notes

### Suggestion of implementation

BerryAgent should treat this file as policy guidance and not only as syntax guidance.
