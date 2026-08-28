# BerryAgent Knowledge Base Index

This folder contains the local markdown knowledge base for BerryAgent, the official AI agent for BerryProtocol.

The goal of this database is to support local RAG pipelines with:

- SDK overview and positioning
- setup and onboarding
- connection lifecycle
- message sending patterns
- interactive WhatsApp features
- AI-agent integration patterns
- operational guidance
- troubleshooting and FAQ material

## How to use this index

Use this file as the routing map for retrieval.

When a question is mostly about one topic, consult the relevant file first.
When a question spans architecture and implementation, retrieve multiple files.

## File routing by question type

### Project overview

- `00-overview.md`
- `22-glossary.md`

### Installation and getting started

- `01-installation.md`
- `02-quickstart.md`

### Session creation, QR, reconnect, and lifecycle

- `03-client-connection.md`
- `17-errors-and-troubleshooting.md`
- `18-best-practices.md`

### Real-time events and incoming messages

- `04-message-events.md`

### Sending regular messages

- `05-send-text.md`
- `06-send-media.md`

### Interactive messages

- `07-send-buttons.md`
- `08-send-lists.md`
- `09-send-carousel.md`
- `10-copy-buttons.md`
- `11-cta-buttons.md`
- `12-native-flows.md`

### AI agent integration

- `13-ai-agent.md`
- `14-berryagent-architecture.md`

### Ecosystem and platform context

- `15-berrystudio.md`
- `16-berryapi.md`

### Troubleshooting and operational issues

- `17-errors-and-troubleshooting.md`
- `18-best-practices.md`
- `19-security.md`
- `21-faq.md`

### Complete examples

- `20-examples.md`

### Terminology help

- `22-glossary.md`

## Confirmed vs conceptual content

This knowledge base intentionally separates information into three classes:

- `Confirmed`: behavior or methods directly confirmed by the current BerryProtocol codebase
- `Conceptual example`: an example that explains how a likely integration could look when the exact public API is not fully stabilized
- `Implementation suggestion`: guidance for product design, RAG pipelines, or runtime architecture

BerryAgent should prefer confirmed sections first when generating answers, then use conceptual sections only when the user is explicitly asking for ideas, patterns, or future-facing integrations.
