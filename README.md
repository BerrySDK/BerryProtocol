# BerryProtocol

BerryProtocol is a modular TypeScript SDK for connecting to the real WhatsApp Web stack.

Internally it uses a BerrySDK transport engine, while exposing a BerryProtocol API focused on:

- modular architecture
- typed events
- persistent sessions
- multi-instance usage
- REST gateway
- CLI workflows
- Docker-friendly deployment

## Features

- real WhatsApp Web connection
- three authentication modes:
  - `link`
  - `qr`
  - `pairing_code`
- persistent auth state per session
- reconnect lifecycle
- SQLite persistence for metadata
- text, image, audio, document, buttons, list, reaction, location and contact sending
- presence helpers
- history, chats, contacts and groups sync events
- CLI and REST examples

## Authentication modes

BerryProtocol supports three explicit auth modes:

### 1. `link`

Returns the raw link payload emitted by WhatsApp Web.

Use when you want the same payload style you are currently seeing in the terminal.

### 2. `qr`

Emits the login payload and renders it as a terminal QR in the CLI.

Use when you want a scan-ready terminal experience.

### 3. `pairing_code`

Requests a typed code for device linking.

BerryProtocol now enforces an **8-digit numeric pairing code**.  
If you do not provide one, BerryProtocol generates one automatically.

## Project structure

```text
packages/
  auth/
  berry-otp/
  berryotp/
  berryprotocol/
  cli/
  core/
  events/
  gateway/
  media/
  messages/
  protocol/  # workspace folder for @berrysdk/proto
  socket/
  store/
  transport/
  wa-message/
examples/
  npm-consumer/
  rest/
  sdk/
```

## Packages

### `berryprotocol`

Main public SDK package for consumers.

Usage:

```ts
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "store-001",
});
```

### `berryotp`

Main public OTP package for consumers.

Usage:

```ts
import { BerryOTP } from "berryotp";
```

### `@berrysdk/core`

Internal public engine package used by `berryprotocol`:

- `BerryClient`
- `BerryProtocol`
- auth entrypoints
- queueing
- event bridge
- media send helpers

`BerryProtocol` is an official alias for `BerryClient`, so advanced consumers can also use:

```ts
import { BerryProtocol } from "@berrysdk/core";

const client = new BerryProtocol({
  sessionId: "store-001",
});
```

### `@berrysdk/berry-otp`

Official OTP package:

- login flow helpers
- password reset flow helpers
- 2FA flow helpers
- native-flow copy-code mode
- stable fallback mode
- expiration editing
- deny/cancel handling

### `@berrysdk/socket`

WhatsApp transport adapter:

- BerrySDK transport integration
- auth mode handling
- reconnect handling
- event normalization
- sync bridging

### `@berrysdk/transport`

Internal BerrySDK engine package:

- wraps the WhatsApp Web runtime used by the SDK
- owns the AI label patch/runtime behavior
- isolates the low-level transport from the public `berryprotocol` package

### `@berrysdk/events`

Shared domain types:

- event map
- auth options
- message contracts
- sync models

### `@berrysdk/proto`

Berry-owned proto wrapper:

- exports `proto` / `WAProto`
- wraps the vendored `WPPConnect/WA-Proto`
- keeps protobuf-related code isolated for easier protocol evolution

### `@berrysdk/wa-message`

WhatsApp message helpers owned by Berry:

- builders for `InteractiveMessage`, `TemplateMessage` and button payloads
- validated builders for working WhatsApp Web/mobile rendering paths
- incoming message normalization
- ACK/status normalization

### `@berrysdk/store`

SQLite storage for:

- session metadata
- chats
- contacts
- groups
- messages
- ACKs

### `@berrysdk/gateway`

HTTP API for multi-instance control.

### `@berrysdk/cli`

Developer CLI for connect and send-text flows.

## Installation

```bash
npm install
```

## Installing from npm

To consume the published packages without using this monorepo locally:

```bash
npm install berryprotocol
```

For OTP via facade package:

```bash
npm install berryotp
```

There is also a standalone consumer example in:

- [examples/npm-consumer/test-from-npm.mjs](C:/Users/felip/BerryProtocol/examples/npm-consumer/test-from-npm.mjs)
- [examples/npm-consumer/package.json](C:/Users/felip/BerryProtocol/examples/npm-consumer/package.json)

Run it with:

```bash
cd examples/npm-consumer
npm install
node test-from-npm.mjs
```

Set the destination first:

```powershell
$env:BERRY_TEST_TO="5511999999999@s.whatsapp.net"
```

## Build

```bash
npm run build
```

## Rendering notes

For the WhatsApp Web/mobile rendering workarounds currently used by BerryProtocol, see:

- [docs/whatsapp-rendering-notes.md](C:/Users/felip/BerryProtocol/docs/whatsapp-rendering-notes.md)
- [docs/publishing.md](C:/Users/felip/BerryProtocol/docs/publishing.md)

Currently validated rendering paths include:

- legacy `listMessage`
- native-flow `quick_reply`
- native-flow `cta_copy`
- native-flow `cta_url`

## AI label notes

BerryProtocol now includes an experimental private-chat AI label path through the internal Berry transport engine.

Usage:

```ts
await sock.sendMessage("5511999999999@s.whatsapp.net", {
  text: "Ola! Essa mensagem deve aparecer com label de AI.",
  ai: true,
});
```

Rules:

- only private chats are allowed
- group, newsletter, status, and non-user JIDs are blocked
- Berry transport injects `messageContextInfo.supportPayload`
- Berry transport relays an additional `<bot biz_bot="1" />` node

Local test files:

- [examples/sdk/test-baileys-ai-label.js](C:/Users/felip/BerryProtocol/examples/sdk/test-baileys-ai-label.js)
- [examples/sdk/test-berry-ai-label.ts](C:/Users/felip/BerryProtocol/examples/sdk/test-berry-ai-label.ts)

Current status:

- validated in local private-chat tests
- experimental
- distributed through `@berrysdk/transport`

## BerryOTP notes

`@berrysdk/berry-otp` works without the official WhatsApp API. It uses the same native-flow and `additionalNodes` strategy validated in real tests against WhatsApp Web `2.3000.x`.

Important caveats:

- protocol behavior can change at any time
- `copy-code` is the recommended OTP mode today
- `stable` mode exists as fallback
- `editOnExpire` depends on `client.editMessage(...)`
- successful verification marks the OTP as `used`, so it will not later expire-edit

## SDK quick start

```ts
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "store-001",
});

client.on("auth.link", ({ value }) => console.log("link:", value));
client.on("auth.qr", ({ value }) => console.log("qr payload:", value));
client.on("auth.pairing_code", ({ code }) => console.log("pairing:", code));
client.on("connection.open", (state) => console.log("open", state));
client.on("message.received", (message) => console.log(message));
```

## BerryOTP quick start

```ts
import BerryProtocol from "berryprotocol";
import { BerryOTP } from "berryotp";

const client = new BerryProtocol({
  sessionId: "otp-session",
});

const otp = BerryOTP.createLoginFlow(client, {
  issuer: "BerryProtocol",
  ttlMs: 2 * 60 * 1000,
  mode: "copy-code",
  editOnExpire: true,
});

await client.connectWithQr();

const sent = await otp.sendLoginCode("5511999999999@s.whatsapp.net", {
  userId: "test-user",
  metadata: { source: "sdk-test" },
});
```

## SDK authentication examples

### Link mode

```ts
await client.connectWithLink();
```

### QR mode

```ts
await client.connectWithQr();
```

### Pairing code mode

```ts
await client.connectWithPairingCode("5519997530219");
```

### Pairing code with custom 8-digit code

```ts
await client.connect({
  method: "pairing_code",
  phoneNumber: "5519997530219",
  customPairingCode: "12345678",
});
```

## Sending messages

### Text

```ts
await client.sendText("5516999999999@s.whatsapp.net", "Olá pelo BerryProtocol!");
```

### List

```ts
await client.sendList("5516999999999@s.whatsapp.net", {
  title: "Cardápio",
  text: "Escolha uma opção",
  buttonText: "Ver opções",
  sections: [
    {
      title: "Lanches",
      rows: [
        {
          id: "xburger",
          title: "X-Burger",
          description: "Pão, carne e queijo",
        },
      ],
    },
  ],
});
```

### Low-level `sendMessage`

```ts
await client.sendMessage("5516999999999@s.whatsapp.net", {
  text: "OlÃ¡ no formato do Baileys",
});
```

### Low-level `list`

```ts
await client.sendMessage("5516999999999@s.whatsapp.net", {
  list: {
    title: "CardÃ¡pio",
    text: "Escolha uma opÃ§Ã£o",
    buttonText: "Ver opÃ§Ãµes",
    sections: [
      {
        title: "Lanches",
        rows: [
          {
            id: "xburger",
            title: "X-Burger",
            description: "PÃ£o, carne e queijo",
          },
        ],
      },
    ],
  },
});
```

### Low-level `interactiveMessage`

```ts
await client.sendMessage("5516999999999@s.whatsapp.net", {
  interactiveMessage: {
    body: {
      text: "Escolha uma opÃ§Ã£o",
    },
    footer: {
      text: "BerryProtocol",
    },
    nativeFlowMessage: {
      buttons: [
        {
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: "Ver opÃ§Ãµes",
            sections: [
              {
                title: "Lanches",
                rows: [
                  {
                    id: "xburger",
                    title: "X-Burger",
                    description: "PÃ£o, carne e queijo",
                  },
                ],
              },
            ],
          }),
        },
      ],
    },
  },
});
```

## `BerryClient` API

### Connection

- `connect(authOptions?)`
- `connectWithLink()`
- `connectWithQr()`
- `connectWithPairingCode(phoneNumber, customPairingCode?)`
- `disconnect()`
- `reconnect()`
- `logout()`

### Messaging

- `sendText()`
- `sendMessage()`
- `sendImage()`
- `sendAudio()`
- `sendDocument()`
- `sendButtons()`
- `sendList()`
- `sendReaction()`
- `sendLocation()`
- `sendContact()`

`sendMessage()` accepts low-level compatible payloads for:

- `text`
- `image`
- `audio`
- `document`
- `buttonsMessage`
- `list`
- `listMessage`
- `interactiveMessage`
- `react`
- `location`
- `contacts`

### Presence and sync

- `fetchGroups()`
- `subscribePresence()`
- `sendPresence()`

## Event reference

### Auth events

- `auth.link`
- `auth.qr`
- `auth.pairing_code`
- `auth.success`
- `auth.error`

### Connection events

- `connection.open`
- `connection.close`
- `connection.reconnecting`

### Messaging events

- `message.received`
- `message.sent`
- `message.ack`

### Sync events

- `chats.update`
- `presence.update`
- `sync.history`
- `sync.contacts`
- `sync.groups`
- `sync.messages`
- `protocol.error`

## CLI

### Help

```bash
npm run dev:cli -- --help
```

### Link auth

```bash
npm run dev:cli -- --session store-001 connect
```

### QR auth

```bash
npm run dev:cli -- --session store-001 connect --auth qr
```

### Pairing code auth

```bash
npm run dev:cli -- --session store-002 connect --auth pairing_code --phone 5519997530219
```

### Pairing code auth with custom 8-digit code

```bash
npm run dev:cli -- --session store-003 connect --auth pairing_code --phone 5519997530219 --pairing-code 12345678
```

### Send text

```bash
npm run dev:cli -- --session store-001 send-text --to 5516999999999@s.whatsapp.net --message "Olá"
```

### CLI notes

- For `pairing_code`, prefer a fresh `sessionId`.
- If a session already has previous credentials, logout it first or use a new session.
- The CLI prints a friendly tip when pairing fails.

## REST gateway

### Start

```bash
npm run dev:gateway
```

### Environment variables

- `BERRY_HTTP_HOST`
- `BERRY_HTTP_PORT`
- `BERRY_SQLITE_PATH`
- `BERRY_AUTH_FOLDER`

### Create instance with link auth

```http
POST /instances
Content-Type: application/json

{
  "sessionId": "store-001",
  "authMethod": "link"
}
```

### Create instance with QR auth

```http
POST /instances
Content-Type: application/json

{
  "sessionId": "store-qr",
  "authMethod": "qr"
}
```

### Create instance with pairing code auth

```http
POST /instances
Content-Type: application/json

{
  "sessionId": "store-code",
  "authMethod": "pairing_code",
  "phoneNumber": "5519997530219"
}
```

### Read auth artifacts

```http
GET /instances/store-001/link
GET /instances/store-qr/qr
GET /instances/store-code/pairing-code
```

### Send text

```http
POST /instances/store-001/send-text
Content-Type: application/json

{
  "to": "5516999999999@s.whatsapp.net",
  "text": "Olá pelo BerryProtocol!"
}
```

### Send image

```http
POST /instances/store-001/send-image
Content-Type: application/json

{
  "to": "5516999999999@s.whatsapp.net",
  "media": {
    "url": "https://example.com/banner.jpg",
    "caption": "Banner BerryProtocol"
  }
}
```

### Send list

```http
POST /instances/store-001/send-list
Content-Type: application/json

{
  "to": "5516999999999@s.whatsapp.net",
  "list": {
    "title": "Cardápio",
    "text": "Escolha uma opção",
    "buttonText": "Ver opções",
    "sections": [
      {
        "title": "Lanches",
        "rows": [
          {
            "id": "xburger",
            "title": "X-Burger",
            "description": "Pão, carne e queijo"
          }
        ]
      }
    ]
  }
}
```

### Logout

```http
DELETE /instances/store-001/logout
```

See full request samples in `C:\Users\felip\BerryProtocol\examples\rest\requests.http`.

## Storage

### Auth files

By default:

```text
.berry-sessions/<sessionId>
```

Override with:

- `BERRY_AUTH_FOLDER`

### SQLite database

Default:

```text
berrysdk.db
```

Override with:

- `BERRY_SQLITE_PATH`

## Docker

### Run

```bash
docker compose up --build
```

### Defaults

- `BERRY_HTTP_PORT=3000`
- `BERRY_SQLITE_PATH=/data/berrysdk.db`
- `BERRY_AUTH_FOLDER=/data/auth`

## Troubleshooting

### Pairing code failed with logged out / connection failure

Usually this means the session already has stale or conflicting credentials.

Recommended fixes:

1. use a new `sessionId`
2. or call `logout()` for the old session
3. or remove the old session folder from `.berry-sessions/<sessionId>`

### Pairing code must be 8 digits

BerryProtocol now enforces this automatically.

- auto-generated codes are numeric and 8 digits
- custom codes must also be numeric and 8 digits

### QR does not show in terminal

Use:

```bash
npm run dev:cli -- --session my-session connect --auth qr
```

### Link payload keeps printing

That is expected for `link` auth mode.  
Use `qr` if you want a renderable terminal QR instead.

## Examples

- SDK basic: `C:\Users\felip\BerryProtocol\examples\sdk\basic.ts`
- SDK list: `C:\Users\felip\BerryProtocol\examples\sdk\list.ts`
- REST requests: `C:\Users\felip\BerryProtocol\examples\rest\requests.http`

## Important note

BerryProtocol is operational through the BerrySDK transport layer for WhatsApp Web. The Berry layer focuses on API shape, modularity, persistence, and operational ergonomics on top of that real transport.
