/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import express from "express";
import pino from "pino";
import { BerryClient, type BerryAuthMethod, type ListPayload, type MediaPayload } from "@berrysdk/core";

const logger = pino({ name: "berry-gateway" });
const app = express();
app.use(express.json({ limit: "25mb" }));

type InstanceAuthState = {
  link?: string;
  qr?: string;
  pairingCode?: string;
};

const clients = new Map<string, BerryClient>();
const authStates = new Map<string, InstanceAuthState>();

const getClient = (id: string, method: BerryAuthMethod = "link", phoneNumber?: string): BerryClient => {
  const existing = clients.get(id);
  if (existing) {
    return existing;
  }

  const client = new BerryClient({
    sessionId: id,
    databasePath: process.env.BERRY_SQLITE_PATH,
    authFolder: process.env.BERRY_AUTH_FOLDER,
    auth: {
      method,
      phoneNumber,
    },
  });

  client.on("auth.link", ({ value }) => {
    authStates.set(id, { ...authStates.get(id), link: value });
  });

  client.on("auth.qr", ({ value }) => {
    authStates.set(id, { ...authStates.get(id), qr: value });
  });

  client.on("auth.pairing_code", ({ code }) => {
    authStates.set(id, { ...authStates.get(id), pairingCode: code });
  });

  clients.set(id, client);
  return client;
};

app.post("/instances", async (req, res) => {
  const sessionId = req.body.sessionId as string | undefined;
  const authMethod = (req.body.authMethod as BerryAuthMethod | undefined) ?? "link";
  const phoneNumber = req.body.phoneNumber as string | undefined;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  if (authMethod === "pairing_code" && !phoneNumber) {
    res.status(400).json({ error: "phoneNumber is required for pairing_code auth" });
    return;
  }

  const client = getClient(sessionId, authMethod, phoneNumber);
  await client.connect({
    method: authMethod,
    phoneNumber,
  });
  res.status(201).json({ sessionId, status: "connecting", authMethod });
});

app.get("/instances/:id/link", async (req, res) => {
  const auth = authStates.get(req.params.id);
  if (!auth?.link) {
    res.status(404).json({ error: "Link auth value not available" });
    return;
  }

  res.json({ sessionId: req.params.id, link: auth.link });
});

app.get("/instances/:id/qr", async (req, res) => {
  const auth = authStates.get(req.params.id);
  if (!auth?.qr) {
    res.status(404).json({ error: "QR code not available" });
    return;
  }

  res.json({ sessionId: req.params.id, qr: auth.qr });
});

app.get("/instances/:id/pairing-code", async (req, res) => {
  const auth = authStates.get(req.params.id);
  if (!auth?.pairingCode) {
    res.status(404).json({ error: "Pairing code not available" });
    return;
  }

  res.json({ sessionId: req.params.id, pairingCode: auth.pairingCode });
});

app.post("/instances/:id/send-text", async (req, res) => {
  const client = getClient(req.params.id);
  const result = await client.sendText(req.body.to, req.body.text);
  res.json(result);
});

app.post("/instances/:id/send-image", async (req, res) => {
  const client = getClient(req.params.id);
  const media = req.body.media as MediaPayload;
  const result = await client.sendImage(req.body.to, media);
  res.json(result);
});

app.post("/instances/:id/send-list", async (req, res) => {
  const client = getClient(req.params.id);
  const list = req.body.list as ListPayload;
  const result = await client.sendList(req.body.to, list);
  res.json(result);
});

app.delete("/instances/:id/logout", async (req, res) => {
  const client = getClient(req.params.id);
  await client.logout();
  clients.delete(req.params.id);
  authStates.delete(req.params.id);
  res.status(204).send();
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err: error }, "request failed");
  res.status(500).json({ error: error.message });
});

const port = Number(process.env.BERRY_HTTP_PORT ?? 3000);
const host = process.env.BERRY_HTTP_HOST ?? "0.0.0.0";

app.listen(port, host, () => {
  logger.info({ host, port }, "BerryProtocol gateway listening");
});
