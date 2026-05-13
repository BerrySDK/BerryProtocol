import { BerryClient } from "../../packages/core/dist/index.js";
import qrcode from "qrcode-terminal";

const sessionId = process.env.BERRY_TEST_SESSION_ID ?? "test-session-qr";
const recipient = process.env.BERRY_TEST_TO ?? "5519997530219@s.whatsapp.net";
const authMethod = process.env.BERRY_TEST_AUTH ?? "qr";
const pairingPhone = process.env.BERRY_TEST_PHONE;

function waitForOpen(client) {
  return new Promise((resolve) => {
    client.once("connection.open", (state) => {
      console.log("CONNECTED:", state);
      resolve(state);
    });
  });
}

async function safeTest(name, fn) {
  try {
    console.log(`\nTesting: ${name}`);
    const result = await fn();
    console.log(`OK: ${name}`, result ?? "");
  } catch (error) {
    console.log(`ERROR in ${name}:`, error instanceof Error ? error.message : error);
  }
}

function buildClient() {
  return new BerryClient({
    sessionId,
    authFolder: process.env.BERRY_AUTH_FOLDER,
    auth: {
      method: authMethod,
      phoneNumber: pairingPhone,
    },
  });
}

async function connectClient(client) {
  if (authMethod === "pairing_code") {
    if (!pairingPhone) {
      throw new Error("Define BERRY_TEST_PHONE para usar pairing_code.");
    }

    await client.connectWithPairingCode(pairingPhone);
    return;
  }

  if (authMethod === "link") {
    await client.connectWithLink();
    return;
  }

  await client.connectWithQr();
}

async function main() {
  const client = buildClient();

  client.on("auth.link", ({ value }) => {
    console.log("\nLink gerado:");
    console.log(value);
  });

  client.on("auth.qr", ({ value }) => {
    console.log("\nEscaneie este QR Code:");
    qrcode.generate(value, { small: true });
  });

  client.on("auth.pairing_code", ({ code }) => {
    console.log(`\nPairing code: ${code}`);
  });

  client.on("auth.success", (data) => {
    console.log("AUTH SUCCESS:", data);
  });

  client.on("auth.error", (error) => {
    console.log("AUTH ERROR:", error);
  });

  client.on("connection.close", (state) => {
    console.log("DISCONNECTED:", state);
  });

  client.on("message.received", (message) => {
    console.log("MESSAGE RECEIVED:", message);
  });

  console.log(`Connecting with auth=${authMethod}...`);
  const opened = waitForOpen(client);
  await connectClient(client);
  await opened;

  await safeTest("sendMessage(list)", () =>
    client.sendMessage(recipient, {
      list: {
        title: "Menu BerryProtocol",
        text: "Escolha uma opcao na lista",
        footer: "BerryProtocol",
        buttonText: "Abrir lista",
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
      },
    }),
  );

  await safeTest("sendMessage(reply button)", () =>
    client.sendMessage(recipient, {
      buttonsMessage: {
        text: "Escolha uma opcao",
        footer: "BerryProtocol",
        buttons: [
          { id: "reply_1", title: "Opcao 1" },
          { id: "reply_2", title: "Opcao 2" },
        ],
      },
    }),
  );

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
