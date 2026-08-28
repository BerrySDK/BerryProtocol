import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import pino from "pino";
import qrcode from "qrcode-terminal";
import makeWASocket, {
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from "baileys";

const sessionId = process.env.BAILEYS_TEST_SESSION_ID ?? "baileys-test-session";
const recipient = process.env.BAILEYS_TEST_TO ?? process.env.BERRY_TEST_TO;
const authBaseFolder =
  process.env.BAILEYS_AUTH_FOLDER ?? join(process.cwd(), ".baileys-sessions");
const sessionDir = join(authBaseFolder, sessionId);
const logger = pino({ level: "silent" });

if (!recipient) {
  throw new Error('Set BAILEYS_TEST_TO or BERRY_TEST_TO, for example: $env:BAILEYS_TEST_TO="5511999999999@s.whatsapp.net"');
}

async function ensureSessionDir() {
  await mkdir(sessionDir, { recursive: true });
}

function waitForOpen(sock) {
  return new Promise((resolve, reject) => {
    sock.ev.on("connection.update", (update) => {
      if (update.qr) {
        console.log("\nEscaneie este QR Code:");
        qrcode.generate(update.qr, { small: true });
      }

      if (update.connection === "open") {
        console.log("CONNECTED");
        resolve();
      }

      if (update.connection === "close") {
        reject(update.lastDisconnect?.error ?? new Error("Connection closed"));
      }
    });
  });
}

async function createSocket() {
  await ensureSessionDir();

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    shouldSyncHistoryMessage: () => false,
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("messages.update", (updates) => {
    for (const item of updates) {
      console.log("ACK UPDATE:", {
        id: item.key.id,
        remoteJid: item.key.remoteJid,
        status: item.update.status,
      });
    }
  });

  return sock;
}

async function main() {
  console.log("Sessao do Baileys:", sessionId);
  console.log("Destino:", recipient);

  const sock = await createSocket();
  await waitForOpen(sock);

  const result = await sock.sendMessage(recipient, {
    text: "Ola! Essa mensagem deve aparecer com label de AI.",
    ai: true,
  });

  console.log("AI MESSAGE SENT:", {
    id: result?.key?.id,
    remoteJid: result?.key?.remoteJid,
    message: result?.message,
  });
}

main().catch((error) => {
  console.error("AI label test failed:", error);
  process.exitCode = 1;
});
