# Installation

## Goal

This file explains how to install BerryProtocol and prepare a modern Node.js environment for local development and production-style testing.

## Confirmed

The repository currently uses:

- Node.js modern ESM
- npm workspaces in the monorepo
- `berryprotocol` as the public package entrypoint

## When to use

Consult this file when you need:

- first-time setup
- local workspace bootstrapping
- npm-based installation guidance
- environment compatibility notes

## Install from npm

```bash
npm install berryprotocol
```

## Install in the monorepo

```bash
npm install
```

## Basic environment expectations

- Node.js 20 or newer is strongly recommended
- ESM imports should be used
- a persistent filesystem path should be available for auth/session storage

## Practical example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "install-check",
});

console.log(typeof client.connectWithQr === "function");
```

## Best practices

- use exact version pinning for production until APIs stabilize
- commit a `.env.example`, not a real `.env`
- define a dedicated session storage folder for each environment

## Common mistakes

- using CommonJS snippets in an ESM project without adaptation
- deleting auth folders accidentally between runs
- confusing the public package repo with the private/internal monorepo source

## Important notes

### Implementation suggestion

If BerryAgent is deployed in a separate app, define these environment variables:

- `BERRY_SESSION_ID`
- `BERRY_AUTH_FOLDER`
- `BERRY_DATABASE_PATH`
- `OPENAI_API_KEY` or equivalent for AI integration
