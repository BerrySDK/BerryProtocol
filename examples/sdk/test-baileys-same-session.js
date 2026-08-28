import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import pino from "pino";
import qrcode from "qrcode-terminal";
import makeWASocket, {
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  makeCacheableSignalKeyStore,
  proto,
  useMultiFileAuthState,
} from "baileys";

const sessionId = process.env.BAILEYS_TEST_SESSION_ID ?? "baileys-test-session";
const recipient = process.env.BAILEYS_TEST_TO ?? process.env.BERRY_TEST_TO ?? "55199991466943@s.whatsapp.net";
const authBaseFolder =
  process.env.BAILEYS_AUTH_FOLDER ?? join(process.cwd(), ".baileys-sessions");
const sessionDir = join(authBaseFolder, sessionId);
const logger = pino({ level: "silent" });
const shouldDebugGeneratedMessage = process.env.BAILEYS_DEBUG_WA_MESSAGE === "1";

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
  return sock;
}

async function safeSend(name, fn) {
  try {
    console.log(`\nTesting: ${name}`);
    const result = await fn();
    console.log(`OK: ${name}`, result?.key?.id ?? "");
  } catch (error) {
    console.error(`ERROR in ${name}:`, error instanceof Error ? error.message : error);
  }
}

async function relayProtoContent(sock, content) {
  const fullMessage = generateWAMessageFromContent(recipient, content, {
    userJid: sock.user.id,
  });

  if (shouldDebugGeneratedMessage) {
    console.log("\nBAILEYS GENERATED MESSAGE:");
    console.log(JSON.stringify(fullMessage.message, null, 2));
  }

  await sock.relayMessage(recipient, fullMessage.message, {
    messageId: fullMessage.key.id,
  });

  return fullMessage;
}

async function sendText(sock) {
  const result = await sock.sendMessage(recipient, {
    text: "Baileys text delivery probe",
  });

  if (shouldDebugGeneratedMessage) {
    console.log("\nBAILEYS GENERATED TEXT MESSAGE:");
    console.log(JSON.stringify(result.message, null, 2));
  }

  return result;
}

async function sendList(sock) {
  return relayProtoContent(sock, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
        },
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
          header: {
            title: "Menu Baileys",
            hasMediaAttachment: false,
          },
          body: {
            text: "Escolha uma opcao na lista",
          },
          footer: {
            text: "Baileys direto",
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "Abrir lista",
                  sections: [
                    {
                      title: "Lanches",
                      rows: [
                        {
                          id: "xburger",
                          title: "X-Burger",
                          description: "Pao, carne e queijo",
                        },
                        {
                          id: "xbacon",
                          title: "X-Bacon",
                          description: "Com bacon crocante",
                        },
                      ],
                    },
                  ],
                }),
              },
            ],
            messageParamsJson: "",
            messageVersion: 1,
          },
        }),
      },
    },
  });
}

async function sendHydratedQuickReplyButtons(sock) {
  return relayProtoContent(sock, {
    templateMessage: {
      hydratedTemplate: {
        hydratedContentText: "Quick reply buttons",
        hydratedFooterText: "Baileys direto",
        hydratedButtons: [
          {
            index: 0,
            quickReplyButton: {
              displayText: "Opcao 1",
              id: "reply_1",
            },
          },
          {
            index: 1,
            quickReplyButton: {
              displayText: "Opcao 2",
              id: "reply_2",
            },
          },
        ],
      },
    },
  });
}

async function sendHydratedUrlButton(sock) {
  return relayProtoContent(sock, {
    templateMessage: {
      hydratedTemplate: {
        hydratedContentText: "URL button",
        hydratedFooterText: "Baileys direto",
        hydratedButtons: [
          {
            index: 0,
            urlButton: {
              displayText: "Abrir site",
              url: "https://example.com",
            },
          },
        ],
      },
    },
  });
}

async function sendHydratedCallButton(sock) {
  return relayProtoContent(sock, {
    templateMessage: {
      hydratedTemplate: {
        hydratedContentText: "Call button",
        hydratedFooterText: "Baileys direto",
        hydratedButtons: [
          {
            index: 0,
            callButton: {
              displayText: "Ligar agora",
              phoneNumber: "+5511999999999",
            },
          },
        ],
      },
    },
  });
}

async function sendHydratedMixedButtons(sock) {
  return relayProtoContent(sock, {
    templateMessage: {
      hydratedTemplate: {
        hydratedContentText: "Mixed buttons",
        hydratedFooterText: "Baileys direto",
        hydratedButtons: [
          {
            index: 0,
            quickReplyButton: {
              displayText: "Resposta",
              id: "mixed_reply_1",
            },
          },
          {
            index: 1,
            urlButton: {
              displayText: "Site",
              url: "https://example.com",
            },
          },
          {
            index: 2,
            callButton: {
              displayText: "Ligar",
              phoneNumber: "+5511999999999",
            },
          },
        ],
      },
    },
  });
}

async function sendLegacyButtonsMessage(sock) {
  return relayProtoContent(sock, {
    buttonsMessage: proto.Message.ButtonsMessage.fromObject({
      contentText: "Legacy buttonsMessage",
      footerText: "Baileys direto",
      headerType: proto.Message.ButtonsMessage.HeaderType.EMPTY,
      buttons: [
        {
          buttonId: "legacy_1",
          buttonText: { displayText: "Opcao 1" },
          type: proto.Message.ButtonsMessage.Button.Type.RESPONSE,
        },
        {
          buttonId: "legacy_2",
          buttonText: { displayText: "Opcao 2" },
          type: proto.Message.ButtonsMessage.Button.Type.RESPONSE,
        },
      ],
    }),
  });
}

async function sendLegacyListMessage(sock) {
  return relayProtoContent(sock, {
    listMessage: proto.Message.ListMessage.fromObject({
      title: "Legacy listMessage",
      description: "Escolha uma opcao na lista",
      buttonText: "Abrir lista",
      footerText: "Baileys direto",
      sections: [
        {
          title: "Lanches",
          rows: [
            {
              rowId: "xburger",
              title: "X-Burger",
              description: "Pao, carne e queijo",
            },
            {
              rowId: "xbacon",
              title: "X-Bacon",
              description: "Com bacon crocante",
            },
          ],
        },
      ],
    }),
  });
}

async function sendButtonsMessageNativeFlow(sock) {
  return relayProtoContent(sock, {
    buttonsMessage: proto.Message.ButtonsMessage.fromObject({
      contentText: "ButtonsMessage native flow",
      footerText: "Baileys direto",
      headerType: proto.Message.ButtonsMessage.HeaderType.EMPTY,
      buttons: [
        {
          buttonId: "native_url_1",
          buttonText: { displayText: "Abrir site" },
          type: proto.Message.ButtonsMessage.Button.Type.NATIVE_FLOW,
          nativeFlowInfo: {
            name: "cta_url",
            paramsJson: JSON.stringify({
              display_text: "Abrir site",
              url: "https://example.com",
            }),
          },
        },
      ],
    }),
  });
}

async function main() {
  console.log(`Usando sessao do Baileys: ${sessionId}`);
  console.log(`Pasta da sessao do Baileys: ${sessionDir}`);
  console.log(`Destino: ${recipient}`);
  console.log("Este teste usa uma sessao separada do BerryProtocol.\n");

  const sock = await createSocket();
  await waitForOpen(sock);

  await safeSend("baileys text", () => sendText(sock));
  await safeSend("baileys list", () => sendList(sock));
  await safeSend("hydrated quick reply buttons", () => sendHydratedQuickReplyButtons(sock));
  await safeSend("hydrated url button", () => sendHydratedUrlButton(sock));
  await safeSend("hydrated call button", () => sendHydratedCallButton(sock));
  await safeSend("hydrated mixed buttons", () => sendHydratedMixedButtons(sock));
  await safeSend("legacy listMessage", () => sendLegacyListMessage(sock));
  await safeSend("legacy buttonsMessage", () => sendLegacyButtonsMessage(sock));
  await safeSend("buttonsMessage native flow", () => sendButtonsMessageNativeFlow(sock));

  console.log("\nDone.");
  sock.end(new Error("done"));
  sock.ws.close();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
