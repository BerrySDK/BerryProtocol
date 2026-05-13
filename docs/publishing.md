/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
# Publishing Guide

This repository is organized so the public Berry Protocol packages can be published without relying on local `file:` dependencies.

## What changed

- public packages use npm semver dependencies instead of local `file:` references
- workspace packages include `exports`, `files`, `type`, `license`, `author`, and `publishConfig`
- local test, session, database, and vendor folders are ignored from Git
- the repo now includes an Apache-2.0 `LICENSE`

## Public packages

- `@berrysdk/auth`
- `@berrysdk/cli`
- `@berrysdk/core`
- `@berrysdk/events`
- `@berrysdk/gateway`
- `@berrysdk/media`
- `@berrysdk/messages`
- `@berrysdk/proto`
- `@berrysdk/socket`
- `@berrysdk/store`
- `@berrysdk/wa-message`

## Before publishing

Run:

```bash
npm install
npm run prepare:publish
npm run pack:check
```

## GitHub checklist

1. Create a fresh Berry Protocol repository.
2. Copy only Berry-owned source, docs, scripts, and package metadata.
3. Do not commit:
   - `.baileys-sessions`
   - `.berry-sessions`
   - `berrysdk.db`
   - `_reference_baileys2`
   - `_vendor_whatsapp_proto`
   - `_vendor_wppconnect_wa_proto`
4. Push the cleaned repository.

## npm checklist

1. Log in with `npm login`.
2. Make sure the `@berrysdk` scope exists and is public.
3. Publish packages in dependency order.

Suggested order:

1. `@berrysdk/events`
2. `@berrysdk/store`
3. `@berrysdk/auth`
4. `@berrysdk/media`
5. `@berrysdk/messages`
6. `@berrysdk/proto`
7. `@berrysdk/wa-message`
8. `@berrysdk/socket`
9. `@berrysdk/core`
10. `@berrysdk/gateway`
11. `@berrysdk/cli`

Example:

```bash
npm publish --workspace packages/events --access public
```

Repeat for each package in order.

## Upstream dependency note

Berry Protocol no longer needs local vendored folders to be publishable.

The public packages depend on:

- `baileys`
- `@wppconnect/wa-proto`

through normal npm versions, which keeps the public Berry repository clean and avoids shipping cloned repositories as part of the package source tree.
