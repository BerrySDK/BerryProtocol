<p align="center">
  <img src=".github/assets/banner.png" alt="BerryProtocol" width="220" />
</p>

<h1 align="center">BerryProtocol</h1>

<p align="center">
  Native WhatsApp interactive messaging SDK for TypeScript.
</p>

<p align="center">
  Build modern WhatsApp experiences with native lists, buttons, carousels,
  OTP flows, realtime events, and multi-session automation.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/berryprotocol">
    <img alt="npm version" src="https://img.shields.io/npm/v/berryprotocol?color=7C3AED" />
  </a>

  <a href="https://www.npmjs.com/package/berryprotocol">
    <img alt="npm downloads" src="https://img.shields.io/npm/dm/berryprotocol?color=A855F7" />
  </a>

  <a href="https://github.com/BerrySDK/BerryProtocol">
    <img alt="github repo" src="https://img.shields.io/badge/github-BerrySDK%2FBerryProtocol-18181B?logo=github&logoColor=white" />
  </a>

  <img alt="node version" src="https://img.shields.io/badge/node-%3E%3D20.0.0-22C55E" />

  <img alt="typescript" src="https://img.shields.io/badge/language-TypeScript-3178C6" />

  <img alt="focus" src="https://img.shields.io/badge/focus-interactive%20messaging%20%2B%20automation-9333EA" />
</p>

---

## Why BerryProtocol

BerryProtocol is a modern developer-first SDK built for creating rich WhatsApp experiences using TypeScript.

Instead of focusing only on low-level protocol internals, BerryProtocol focuses on:

- interactive messaging
- realtime communication
- multi-session scalability
- developer experience
- automation workflows
- clean npm integration

The project is part of the BerrySDK ecosystem and powers modern WhatsApp automation flows with a simple and scalable API.

---

# Features

## Native Interactive Messages

BerryProtocol includes native support for:

- Lists
- Reply Buttons
- CTA Buttons
- Copy Buttons
- OTP Messages
- Carousels
- Polls
- Reactions
- Presence
- Rich Media
- Realtime Events

---

## Multi-Session Architecture

Designed for scalable applications.

- Multiple WhatsApp sessions
- Independent auth states
- QR authentication
- Pairing code flows
- Session recovery
- Automatic reconnects

Perfect for:

- SaaS platforms
- automation systems
- support tools
- chatbot platforms
- WhatsApp integrations
- API services

---

## Developer Experience

BerryProtocol was designed to feel simple, modern, and production-ready.

### Highlights

- TypeScript-first API
- ESM-first package
- clean public exports
- grouped SDK modules
- strongly typed events
- lightweight integration flow
- npm-first distribution

---

# Installation

```bash
npm install berryprotocol
````

---

# Quick Start

```ts
import BerryProtocol, { makeLogger } from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "default",
  logger: makeLogger(),
  reconnectDelayMs: 1500,
  reconnectMaxAttempts: 12,
  printQrInTerminal: true,
});

client.on("auth.qr", ({ value }) => {
  console.log("qr", value);
});

client.on("connection.open", () => {
  console.log("connected");
});

client.on("message.received", (message) => {
  console.log("incoming", {
    from: message.from,
    type: message.type,
  });
});

await client.connectWithQr();
```

---

# Interactive Message Examples

## Reply Buttons

```ts
await client.sendButtons(chatId, {
  text: "Choose an option",
  buttons: [
    {
      id: "buy",
      text: "Buy now",
    },
    {
      id: "support",
      text: "Support",
    },
  ],
});
```

---

## Lists

```ts
await client.sendList(chatId, {
  title: "Menu",
  buttonText: "Open",
  sections: [
    {
      title: "Pizzas",
      rows: [
        {
          id: "calabresa",
          title: "Pizza Calabresa",
        },
      ],
    },
  ],
});
```

---

## Copy Buttons

```ts
await client.sendCopyButton(chatId, {
  text: "Your verification code",
  code: "458921",
});
```

---

## Carousel Messages

```ts
await client.sendCarousel(chatId, {
  text: "Featured products",
  cards: [
    {
      title: "Berry Burger",
      body: "Special burger",
      footer: "BerryProtocol",
    },
  ],
});
```

---

# Realtime Events

BerryProtocol exposes typed realtime events for modern automation systems.

```ts
client.on("message.received", console.log);

client.on("message.updated", console.log);

client.on("message.reaction", console.log);

client.on("presence.update", console.log);

client.on("connection.update", console.log);
```

---

# Media Support

Supported media flows include:

* images
* videos
* audio
* voice notes
* stickers
* documents
* GIFs

Example:

```ts
await client.sendImage(chatId, {
  url: "./image.png",
  caption: "BerryProtocol",
});
```

---

# Ecosystem

BerryProtocol is part of the BerrySDK ecosystem.

## Packages

* `berryprotocol`
* `berryotp`
* `berryapi`

## Future Tools

* BerryStudio
* visual message builder
* realtime flow editor
* webhook inspector
* automation designer

---

# Repository Structure

```txt
src/
 ├── Auth/
 ├── Defaults/
 ├── Media/
 ├── Messages/
 ├── Socket/
 ├── Store/
 ├── Types/
 ├── Utils/
 └── index.ts
```

---

# Requirements

* Node.js >= 20
* npm

---

# Useful Scripts

```bash
npm run build
npm run clean
npm run prepublishOnly
```

---

# Versioning

BerryProtocol uses manual semantic versioning.

Recommended release flow:

```bash
npm version patch
git push origin main --follow-tags
```

---

# Contributing

Before opening a PR:

* run `npm install`
* run `npm run build`
* keep typings stable
* avoid breaking public exports
* keep documentation updated
* validate interactive message flows

---

# Roadmap

* Native Flow Messages
* WhatsApp Forms
* Advanced Carousel Builder
* Better Media Pipeline
* Embedded AI Helpers
* BerryStudio integration
* Flow visual editor
* Webhook replay tools
* Session dashboard

---

# Support

If BerryProtocol helps your project:

* star the repository
* contribute examples
* open issues
* share integrations
* help improve documentation

---

# Disclaimer

BerryProtocol is an independent engineering project for interoperability and automation purposes.

It is not affiliated with or endorsed by WhatsApp.
