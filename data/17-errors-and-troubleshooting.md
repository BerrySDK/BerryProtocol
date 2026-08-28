# Errors and Troubleshooting

## Goal

This file documents common operational problems and how to debug them in BerryProtocol-based systems.

## When to use

Use this file when dealing with:

- QR issues
- connection failures
- invalid JIDs
- message send failures
- session conflicts
- AI or RAG runtime confusion around transport behavior

## Common error categories

### Invalid JID

Symptom:

- send calls fail before transport delivery

Cause:

- the target identifier is not a valid WhatsApp JID

Fix:

- use full JIDs such as `5511999999999@s.whatsapp.net`
- validate before dispatch

### Connection not open

Symptom:

- send operations fail right after startup

Cause:

- the connection lifecycle is not complete yet

Fix:

- wait for `connection.open`
- queue outbound tasks until ready

### Session conflict

Symptom:

- repeated disconnects
- logs mentioning replacement or conflict

Cause:

- the same session is being used by multiple runtime processes

Fix:

- guarantee single ownership per `sessionId`

### Missing QR behavior

Symptom:

- no visible QR onboarding flow

Possible causes:

- wrong auth method
- QR not being handled in listeners
- session already registered

## Practical example: safe send wrapper

```js
export function assertJid(jid) {
  if (!jid || !jid.includes("@")) {
    throw new Error("Invalid WhatsApp JID");
  }

  return jid;
}
```

## Best practices

- log auth and connection events
- keep structured logs for transport and AI separately
- persist session state durably
- test with a dedicated sandbox session before production rollout

## Common mistakes

- retrying infinitely without classification
- hiding low-level errors from operator logs
- mixing transport failures with model failures

## Important notes

### Confirmed

BerryProtocol exposes protocol and connection-related events that should be monitored in production.

### Suggestion of implementation

BerryAgent should classify errors into:

- connection
- authentication
- validation
- transport send
- AI provider
- retrieval
