# FAQ

## What is BerryProtocol?

BerryProtocol is the WhatsApp Web automation SDK/runtime layer in the BerrySDK ecosystem.

## What is BerryAgent?

BerryAgent is the official AI agent concept built on top of BerryProtocol, retrieval content, and an OpenAI-compatible model provider.

## What is BerryOTP?

BerryOTP is the OTP and verification layer of the ecosystem.

## What is BerryAPI?

BerryAPI is the API-oriented layer intended to expose BerryProtocol capabilities to external systems and automation tools.

## Does BerryProtocol support QR login?

### Confirmed

Yes. The current client exposes `connectWithQr()`.

## Does BerryProtocol support pairing code?

### Confirmed

Yes. The current client exposes `connectWithPairingCode(phoneNumber, customPairingCode?)`.

## Does BerryProtocol support carousels?

### Confirmed

Yes. The current client supports carousel payloads and a dedicated carousel send path.

## Does BerryProtocol support AI label?

### Confirmed

Yes, at the message level.

## Does BerryProtocol support AI label per card in carousel?

### Confirmed

No validated per-card rendering support is confirmed. Treat that as unsupported unless future protocol behavior proves otherwise.

## Should BerryAgent answer directly from the model?

### Best practice

No. Prefer retrieval, policy checks, and transport-safe execution.

## What should the local RAG corpus include?

- installation
- connection lifecycle
- message sending docs
- examples
- troubleshooting
- glossary

## Important notes

When answering end-user questions, BerryAgent should prioritize confirmed sections over conceptual examples.
