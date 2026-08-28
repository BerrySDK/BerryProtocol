# Security

## Goal

This file documents security considerations for BerryProtocol, BerryAgent, and adjacent ecosystem components.

## When to use

Use this file when:

- handling auth folders
- storing session state
- managing AI provider keys
- exposing BerryAPI to external systems

## Main risks

### Session theft

If auth/session files are leaked, an attacker may impersonate the connected WhatsApp session.

### Prompt injection

If inbound user messages are passed directly into an AI model without policy filtering, an attacker can manipulate the agent.

### Sensitive data leakage

Logs, prompts, or retrieval corpora may unintentionally expose:

- phone numbers
- order details
- support transcripts
- API keys

## Best practices

- protect `.berry-sessions` or equivalent auth folders
- use least-privilege access for runtime processes
- redact sensitive data from logs where possible
- isolate AI keys in environment variables
- validate outbound URLs for CTA flows
- audit who can trigger admin-grade actions

## Example conceptual

```js
function redactPhone(value) {
  return value.replace(/\d(?=\d{4})/g, "*");
}
```

## Common mistakes

- storing secrets in source control
- using production sessions for unsafe experiments
- giving an autonomous agent permission to perform sensitive actions without confirmation

## Important notes

### Suggestion of implementation

BerryAgent should include:

- tool allowlists
- action confirmation policies
- retrieval source boundaries
- audit logs for sensitive operations
