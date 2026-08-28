# Sending Media

## Goal

This file explains how BerryProtocol sends image, audio, and document payloads, and how media loading is normalized.

## Confirmed

The current public client supports:

- `sendImage(to, mediaPayload)`
- `sendAudio(to, mediaPayload)`
- `sendDocument(to, mediaPayload)`

Media payloads can include:

- `url`
- `path`
- `buffer`
- `fileName`
- `mimetype`
- `caption`

## When to use

Use this file when sending:

- product images
- voice/audio assets
- invoices or PDFs
- onboarding documents

## Send image example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "send-image-session",
});

await client.connectWithQr();
await client.sendImage("5511999999999@s.whatsapp.net", {
  url: "https://example.com/catalog/pizza.jpg",
  caption: "Today special",
});
```

## Send audio example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "send-audio-session",
});

await client.connectWithQr();
await client.sendAudio("5511999999999@s.whatsapp.net", {
  path: "./media/instructions.ogg",
  mimetype: "audio/ogg",
});
```

## Send document example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "send-document-session",
});

await client.connectWithQr();
await client.sendDocument("5511999999999@s.whatsapp.net", {
  path: "./media/invoice.pdf",
  fileName: "invoice.pdf",
  mimetype: "application/pdf",
  caption: "Invoice attached",
});
```

## Best practices

- always provide `mimetype` when known
- set `fileName` for documents
- isolate remote media downloads from message orchestration
- prefer reusable media helper services in production

## Common mistakes

- sending documents without a stable MIME type
- assuming remote URLs never fail
- storing large buffers unnecessarily

## Important notes

### Confirmed

BerryProtocol uses a media manager internally to normalize `url`, `path`, and `buffer` inputs before transport send.

### Example conceptual

If you need video, GIF, or view-once wrappers and the exact high-level method is not yet stabilized, implement them behind your own message adapter and document them as transport extensions.
