# BerryAPI

BerryAPI is a REST API and realtime platform for WhatsApp Web automation built by BerrySDK on top of BerryProtocol.

It is designed for:
- automation tools like `n8n`
- chat builders like `Typebot`
- internal SaaS panels
- webhook-first WhatsApp integrations

BerryAPI ships with:
- multi-instance session management
- API key authentication
- Swagger/OpenAPI docs at `/docs`
- realtime event streaming over WebSocket
- webhook dispatch per instance
- modern WhatsApp message endpoints
- SQLite by default, prepared for future PostgreSQL migration

## Stack

- Node.js
- TypeScript
- Fastify
- Drizzle ORM
- better-sqlite3
- Zod
- Pino
- Swagger/OpenAPI
- WebSocket

## Project Structure

```text
src/
  app.ts
  server.ts
  config/
  database/
  docs/
  managers/
  middlewares/
  modules/
    chat/
    group/
    instance/
    message/
    profile/
    settings/
    webhook/
  providers/
    whatsapp/
  realtime/
  types/
  utils/
  webhook/
```

## Install

```bash
npm install
```

## Run In Development

```bash
cp .env.example .env
npm run dev
```

BerryAPI starts on:

- `GET http://localhost:3000`
- `GET http://localhost:3000/info`
- `GET http://localhost:3000/docs`

## Authentication

Use an API key with every protected request:

```http
Authorization: Bearer berryapi_dev_key
```

Change the key in `.env`.

## Create An Instance

```bash
curl -X POST http://localhost:3000/instance/create \
  -H "Authorization: Bearer berryapi_dev_key" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "store-01",
    "authMethod": "qr"
  }'
```

## Connect With QR Code

```bash
curl -X GET http://localhost:3000/instance/connect/store-01 \
  -H "Authorization: Bearer berryapi_dev_key"
```

Then fetch the connection state:

```bash
curl -X GET http://localhost:3000/instance/connectionState/store-01 \
  -H "Authorization: Bearer berryapi_dev_key"
```

The response contains `qrCode` or `pairingCode` when needed.

## Send A Message

```bash
curl -X POST http://localhost:3000/message/sendText/store-01 \
  -H "Authorization: Bearer berryapi_dev_key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999@s.whatsapp.net",
    "text": "Hello from BerryAPI"
  }'
```

## Configure A Webhook

```bash
curl -X POST http://localhost:3000/webhook/set/store-01 \
  -H "Authorization: Bearer berryapi_dev_key" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "url": "https://example.com/webhooks/berryapi",
    "events": ["connection.update", "messages.upsert", "send.message"]
  }'
```

## Realtime WebSocket

Connect to:

```text
ws://localhost:3000/ws?apiKey=berryapi_dev_key
```

Or scope to one instance:

```text
ws://localhost:3000/ws?apiKey=berryapi_dev_key&instanceName=store-01
```

Realtime events include:
- `connection.update`
- `qrcode.updated`
- `messages.upsert`
- `messages.update`
- `messages.delete`
- `chats.update`
- `contacts.update`
- `groups.update`
- `presence.update`
- `send.message`

## Docker

```bash
docker compose up --build
```

The API will be available on `http://localhost:3000`.

## Message Endpoints

BerryAPI includes modern WhatsApp Web message support such as:

- text and extended text
- reply, forward, delete, edit, react
- image, video, audio, document, sticker, gif
- buttons, template buttons, CTA buttons, copy buttons
- carousel, lists and polls
- contacts and locations
- status and view once media
- product, catalog and collection payloads
- AI labeled text and carousel routes

Dedicated modern routes include:

- `POST /message/sendCarousel/:instanceName`
- `POST /message/sendTemplateButtons/:instanceName`
- `POST /message/sendCopyButton/:instanceName`
- `POST /message/sendAiText/:instanceName`
- `POST /message/sendAiCarousel/:instanceName`

See Swagger docs at `/docs` for request bodies and examples.

## Notes

- Some chat/profile/group operations are registered already but return `501` until BerryProtocol exposes the required runtime hooks.
- The API architecture isolates WhatsApp access behind `WhatsAppProvider`, so BerryProtocol can be swapped later without rewriting controllers.
