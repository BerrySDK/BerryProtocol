<p align="center">
  <img src=".github/assets/logo.svg" alt="BerryProtocol" width="400" />
</p>

<p align="center">
  <strong>Public TypeScript SDK for WhatsApp Web automation powered by BerrySDK.</strong><br />
  Built for multi-session operation, interactive messaging, QR/pairing authentication, and a clean public npm experience.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/berryprotocol"><img alt="npm version" src="https://img.shields.io/npm/v/berryprotocol?color=CB3837" /></a>
  <a href="https://www.npmjs.com/package/berryprotocol"><img alt="npm package size" src="https://img.shields.io/npm/unpacked-size/berryprotocol?label=package%20size&color=2F855A" /></a>
  <a href="https://github.com/BerrySDK/BerryProtocol"><img alt="github repo" src="https://img.shields.io/badge/github-BerrySDK%2FBerryProtocol-181717?logo=github&logoColor=white" /></a>
  <img alt="node version" src="https://img.shields.io/badge/node-%3E%3D20.0.0-339933" />
  <img alt="language" src="https://img.shields.io/badge/language-TypeScript-3178C6" />
  <img alt="focus" src="https://img.shields.io/badge/focus-public%20sdk%20%2B%20multi--session-6B46C1" />
</p>

## Table of Contents

- [Stability Notice](#stability-notice)
- [What Makes This Project Different](#what-makes-this-project-different)
- [Core Principles](#core-principles)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Minimal Usage](#minimal-usage)
- [Useful Scripts](#useful-scripts)
- [Versioning and Releases](#versioning-and-releases)
- [GitHub Release Notes](#github-release-notes)
- [Package Composition](#package-composition)
- [Support the Project](#support-the-project)
- [Contribution Notes](#contribution-notes)
- [Disclaimer](#disclaimer)

## Stability Notice

> Frequent breaking changes are still possible before the first major release.
> If you run `berryprotocol` in production, pin exact versions and validate upgrades carefully.

## What Makes This Project Different

`berryprotocol` is the public SDK repository for the BerrySDK ecosystem.

- Public npm-first repository for the `berryprotocol` package
- Structured SDK layout inspired by repositories like Baileys
- Multi-session WhatsApp Web automation surface
- Interactive messaging support including buttons, lists, reactions, and rich helpers
- Designed to work alongside the rest of the BerrySDK ecosystem such as `berryotp` and `berryapi`

This repository is intentionally optimized for public package consumption, documentation, onboarding, and community collaboration, while internal and experimental monorepo work remains private under BerrySDK.

## Core Principles

These principles guide the public SDK:

- `public-sdk-first`: keep the repository easy to consume, browse, and document
- `multi-session-first`: optimize the developer experience for multiple WhatsApp sessions
- `interop-first`: make the SDK easy to integrate with tools, APIs, flows, and external automation systems
- `typescript-first`: prioritize strong typing, readable exports, and maintainable contracts

## Architecture at a Glance

### Repository structure

- Public grouped exports in `src/Defaults/`, `src/Socket/`, `src/Utils/`, `src/Types/`, `src/Store/`, `src/Auth/`, `src/Media/`, and `src/Messages/`
- Root entrypoint in `src/index.ts`
- Practical usage examples in `Example/`
- GitHub workflows and templates in `.github/`

### Engineering conventions

- ESM-first package output
- Named grouped exports for SDK discoverability
- TypeScript declaration output via `tsc`
- Public package aggregation built on top of the published BerrySDK packages
- Clear separation between the public repository and the private BerrySDK source monorepo

## Requirements

- Node.js `>= 20.0.0`
- npm

Runtime dependencies:

- `@berrysdk/core`
- `@berrysdk/auth`
- `@berrysdk/events`
- `@berrysdk/media`
- `@berrysdk/messages`
- `@berrysdk/store`
- `pino`

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Build the package locally.

```bash
npm run build
```

3. Try the example application.

```bash
node --import tsx Example/example.ts
```

4. Scan the QR code emitted by `auth.qr`.

## Minimal Usage

```ts
import BerryProtocol, { makeLogger } from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "default",
  logger: makeLogger(),
  reconnectDelayMs: 1_500,
  reconnectMaxAttempts: 12,
  printQrInTerminal: true,
});

client.on("auth.qr", ({ value }) => {
  console.log("qr", value);
});

client.on("connection.open", (state) => {
  console.log("connected", state);
});

client.on("message.received", (message) => {
  console.log("incoming", {
    chatId: message.chatId,
    from: message.from,
    type: message.type,
  });
});

await client.connectWithQr();
```

## Useful Scripts

- `npm run build` - build ESM output and type declarations
- `npm run clean` - remove the `dist` folder
- `npm run prepublishOnly` - build automatically before publishing

## Versioning and Releases

Versioning is manual and intentional for this public SDK repository.

Suggested release flow:

```bash
npm version patch
git push origin main --follow-tags
```

Notes:

- `package.json` is the release source of truth for this public package
- npm publishing is handled by the GitHub release workflow
- exact version pinning is recommended until the first major release

## GitHub Release Notes

Releases can be published directly from GitHub Releases.

- Workflow: `.github/workflows/release.yml`
- CI validation: `.github/workflows/ci.yml`

Trigger example:

```bash
git tag v0.1.10
git push origin v0.1.10
```

## Package Composition

The public `berryprotocol` package is the developer-facing entrypoint.

It is composed on top of the published BerrySDK packages, including:

- `@berrysdk/core`
- `@berrysdk/auth`
- `@berrysdk/events`
- `@berrysdk/media`
- `@berrysdk/messages`
- `@berrysdk/store`

This makes the public repository easy to consume while still allowing BerrySDK to evolve its internal source architecture privately.

## Support the Project

If BerryProtocol is useful in your production or study setup, you can support the ecosystem by:

- starring the repository
- opening issues with clear reproduction details
- contributing documentation and examples
- sharing integrations built with BerryProtocol, BerryOTP, or BerryAPI

## Contribution Notes

Before opening a PR:

- run `npm install`
- run `npm run build`
- keep changes aligned with the public SDK layout
- avoid documentation drift between English and Portuguese guides
- keep the public npm experience simple and predictable

## Disclaimer

This project is an independent implementation and packaging effort for engineering and interoperability purposes.
It is not affiliated with or endorsed by WhatsApp.
