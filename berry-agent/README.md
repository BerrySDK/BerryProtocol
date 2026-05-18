# BerryAgent

BerryAgent is the official AI assistant runtime for BerryProtocol.

## Goals

- answer technical and commercial questions about BerryProtocol
- retrieve information from the local markdown knowledge base
- use OpenAI-compatible providers such as OpenAI or Groq
- respond through WhatsApp with text, buttons, lists, and generated code files

## Features

- separated prompt files
- weighted local retrieval
- optional web search
- action planning with JSON output
- duplicate inbound message protection
- basic lead collection memory

## Local run

```bash
node index.js
```

## Validation mode

```bash
$env:BERRY_AGENT_VALIDATE_ONLY="1"
node index.js
```
