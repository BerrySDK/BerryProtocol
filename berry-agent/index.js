import "dotenv/config";
import { BerryProtocol } from "berryprotocol";
import { loadAgentConfig } from "./lib/config.js";
import { createPaths } from "./lib/paths.js";
import { createConversationMemory } from "./lib/history.js";
import { createModelGateway } from "./lib/openai-client.js";
import { createDeduper, extractInboundMessage } from "./lib/message-parser.js";
import { createAgentRuntime } from "./lib/agent-runtime.js";

const baseDir = process.cwd();
const paths = createPaths(baseDir);
const config = await loadAgentConfig(baseDir);
const memory = createConversationMemory();
const modelGateway = createModelGateway(config);
const deduper = createDeduper();

const client = new BerryProtocol({
  sessionId: process.env.BERRY_TEST_SESSION || "berry-agent-test",
  authFolder: `${baseDir}\\.berry-sessions`,
  databasePath: `${baseDir}\\berrysdk.db`,
});

const runtime = createAgentRuntime({
  config,
  paths,
  memory,
  modelGateway,
  client,
});

function logClientMethods() {
  console.log("BerryAgent client methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
}

async function handleRawMessage(rawMessage) {
  const inbound = extractInboundMessage(rawMessage);
  if (!inbound) {
    return;
  }

  if (config.behavior.ignoreGroups && inbound.isGroup) {
    console.log("Skipping group message:", inbound.remoteJid);
    return;
  }

  if (deduper.has(inbound.id)) {
    console.log("Skipping duplicated message:", inbound.id);
    return;
  }

  deduper.add(inbound.id);

  console.log("Inbound message:", {
    id: inbound.id,
    from: inbound.from,
    chatId: inbound.chatId,
    text: inbound.text,
  });

  try {
    await runtime.handleInbound({
      userId: inbound.remoteJid,
      chatId: inbound.chatId,
      text: inbound.text,
    });
  } catch (error) {
    console.error("BerryAgent failed to process message:", error);
  }
}

client.once("connection.open", () => {
  console.log("BerryAgent connected to WhatsApp.");
});

client.on("auth.qr", ({ value }) => {
  console.log("QR updated:", value);
});

client.on("messages.upsert", async (payload) => {
  for (const message of payload.messages || []) {
    await handleRawMessage(message);
  }
});

client.on("message.received", async (message) => {
  await handleRawMessage(message);
});

if (process.env.BERRY_AGENT_VALIDATE_ONLY === "1") {
  logClientMethods();
  console.log("BerryAgent validation mode completed successfully.");
  process.exit(0);
}

logClientMethods();
await client.connectWithQr();
