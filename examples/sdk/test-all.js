import { BerryClient } from "../../packages/core/dist/index.js";
import qrcode from "qrcode-terminal";

const sessionId = process.env.BERRY_TEST_SESSION_ID ?? "test-session-qr";
const recipient = process.env.BERRY_TEST_TO ?? "55199991466943@s.whatsapp.net";
const authMethod = process.env.BERRY_TEST_AUTH ?? "qr";
const pairingPhone = process.env.BERRY_TEST_PHONE;

function waitForOpen(client) {
  return new Promise((resolve) => {
    client.once("connection.open", (state) => {
      console.log("🟢 CONECTADO:", state);
      resolve(state);
    });
  });
}

async function safeTest(name, fn) {
  try {
    console.log(`\n🧪 Testando: ${name}`);
    const result = await fn();
    console.log(`✅ OK: ${name}`, result ?? "");
  } catch (error) {
    console.log(`❌ ERRO em ${name}:`, error instanceof Error ? error.message : error);
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
    console.log("\n🔗 Link gerado:");
    console.log(value);
  });

  client.on("auth.qr", ({ value }) => {
    console.log("\n📱 Escaneie este QR Code:");
    qrcode.generate(value, { small: true });
  });

  client.on("auth.pairing_code", ({ code }) => {
    console.log(`\n🔢 Pairing code: ${code}`);
  });

  client.on("auth.success", (data) => {
    console.log("✅ AUTH SUCCESS:", data);
  });

  client.on("auth.error", (error) => {
    console.log("❌ AUTH ERROR:", error);
  });

  client.on("connection.close", (state) => {
    console.log("🔴 DESCONECTADO:", state);
  });

  client.on("message.received", (message) => {
    console.log("📩 MESSAGE RECEIVED:", message);
  });

  console.log(`🚀 Conectando com auth=${authMethod}...`);
  const opened = waitForOpen(client);
  await connectClient(client);
  await opened;

  await safeTest("sendText", () =>
    client.sendText(recipient, "🚀 Teste de texto BerryProtocol"),
  );

  await safeTest("sendImage", () =>
    client.sendImage(recipient, {
      url: "https://picsum.photos/600/400",
      caption: "🖼 Teste de imagem BerryProtocol",
    }),
  );

  await safeTest("sendAudio", () =>
    client.sendAudio(recipient, {
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      mimetype: "audio/mpeg",
    }),
  );

  await safeTest("sendDocument", () =>
    client.sendDocument(recipient, {
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileName: "teste.pdf",
      mimetype: "application/pdf",
      caption: "📄 Teste de documento BerryProtocol",
    }),
  );

  await safeTest("sendButtons", () =>
    client.sendButtons(recipient, {
      text: "Escolha uma opção",
      footer: "BerryProtocol",
      buttons: [
        { id: "btn_1", title: "Opção 1" },
        { id: "btn_2", title: "Opção 2" },
      ],
    }),
  );

  await safeTest("sendList", () =>
    client.sendList(recipient, {
      title: "🍔 Cardápio",
      text: "Escolha um lanche",
      footer: "BerryProtocol",
      buttonText: "Abrir lista",
      sections: [
        {
          title: "Lanches",
          rows: [
            {
              id: "xburger",
              title: "X-Burger",
              description: "Pão, carne e queijo",
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
  );

  await safeTest("sendLocation", () =>
    client.sendLocation(recipient, {
      latitude: -21.7104,
      longitude: -47.478,
      name: "BerryProtocol HQ",
      address: "Santa Rita do Passa Quatro - SP",
    }),
  );

  await safeTest("sendContact", () =>
    client.sendContact(recipient, {
      displayName: "BerryProtocol",
      vcard: [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "FN:BerryProtocol",
        "TEL;type=CELL;type=VOICE;waid=5511999999999:+55 11 99999-9999",
        "END:VCARD",
      ].join("\n"),
    }),
  );

  await safeTest("subscribePresence", () => client.subscribePresence(recipient));
  await safeTest("sendPresence", () => client.sendPresence("composing", recipient));
  await safeTest("fetchGroups", () => client.fetchGroups());

  console.log("\n✅ Todos os testes executados.");
}

main().catch((error) => {
  console.error("❌ Falha fatal:", error);
  process.exitCode = 1;
});
