import { BerryClient } from "../../packages/core/dist/index.js";
import {
  buttonsPayloadToLegacyButtonsMessageContent,
  buttonsPayloadToNativeFlowInteractiveContent,
  buttonsPayloadToTemplateMessageContent,
  interactivePayloadToMessageContent,
  listToLegacyListMessageContent,
  listToInteractiveMessageContent,
  listToInteractivePayload,
} from "../../packages/wa-message/dist/index.js";
import qrcode from "qrcode-terminal";

const sessionId = process.env.BERRY_TEST_SESSION_ID ?? "test-session-qr";
const recipient = process.env.BERRY_TEST_TO;
const authMethod = process.env.BERRY_TEST_AUTH ?? "qr";
const pairingPhone = process.env.BERRY_TEST_PHONE;

const sampleList = {
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
};

const sampleButtons = {
  text: "Escolha uma opcao",
  footer: "BerryProtocol",
  buttons: [
    { id: "reply_1", title: "Opcao 1" },
    { id: "reply_2", title: "Opcao 2" },
  ],
};

const sampleCopyCodeButtons = {
  text: "Use este cupom",
  footer: "BerryProtocol",
  buttons: [
    { id: "copy_code_1", title: "Copiar cupom", kind: "copy_code", code: "BERRY10" },
  ],
};

const sampleUrlButtons = {
  text: "Acesse nosso site",
  footer: "BerryProtocol",
  buttons: [
    {
      id: "cta_url_1",
      title: "Abrir site",
      kind: "cta_url",
      url: "https://example.com",
    },
  ],
};

function waitForOpen(client) {
  return new Promise((resolve) => {
    client.once("connection.open", (state) => {
      console.log("CONNECTED:", state);
      resolve(state);
    });
  });
}

function waitForAck(client, messageId, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      settled = true;
      reject(new Error(`Timeout esperando ACK final para ${messageId}`));
    }, timeoutMs);

    const listener = (ack) => {
      if (settled) {
        return;
      }

      if (ack.messageId !== messageId) {
        return;
      }

      if (ack.ack === "delivered" || ack.ack === "read") {
        settled = true;
        clearTimeout(timeout);
        resolve(ack);
      }
    };

    client.on("message.ack", listener);
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

function printPreview(label, value) {
  console.log(`\nPreview: ${label}`);
  console.log(JSON.stringify(value, null, 2));
}

async function main() {
  if (!recipient) {
    throw new Error(
      "Define BERRY_TEST_TO com outro numero de teste. Exemplo: 5511999999999@s.whatsapp.net",
    );
  }

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

  client.on("message.ack", (ack) => {
    console.log("MESSAGE ACK:", ack);
  });

  await safeTest("wa-message listToInteractivePayload", async () => {
    const payload = listToInteractivePayload(sampleList);
    printPreview("interactive payload from list", payload);
    return "payload generated";
  });

  await safeTest("wa-message listToInteractiveMessageContent", async () => {
    const content = listToInteractiveMessageContent(sampleList);
    printPreview("interactive message content from list", content);
    return "content generated";
  });

  await safeTest("wa-message listToLegacyListMessageContent", async () => {
    const content = listToLegacyListMessageContent(sampleList);
    printPreview("legacy list message content from list", content);
    return "content generated";
  });

  await safeTest("wa-message buttonsPayloadToTemplateMessageContent", async () => {
    const content = buttonsPayloadToTemplateMessageContent(sampleButtons);
    printPreview("template message content from buttons", content);
    return "content generated";
  });

  await safeTest("wa-message buttonsPayloadToLegacyButtonsMessageContent", async () => {
    const content = buttonsPayloadToLegacyButtonsMessageContent(sampleButtons);
    printPreview("legacy buttons message content from buttons", content);
    return "content generated";
  });

  await safeTest("wa-message buttonsPayloadToNativeFlowInteractiveContent", async () => {
    const content = buttonsPayloadToNativeFlowInteractiveContent(sampleCopyCodeButtons);
    printPreview("native flow interactive content from buttons", content);
    return "content generated";
  });

  await safeTest("wa-message buttonsPayloadToNativeFlowInteractiveContent cta_url", async () => {
    const content = buttonsPayloadToNativeFlowInteractiveContent(sampleUrlButtons);
    printPreview("native flow interactive content from url buttons", content);
    return "content generated";
  });

  await safeTest("wa-message interactivePayloadToMessageContent", async () => {
    const interactivePayload = {
      body: {
        text: "Escolha uma opcao",
      },
      footer: {
        text: "BerryProtocol",
      },
      nativeFlowMessage: {
        buttons: [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Abrir lista",
              sections: sampleList.sections,
            }),
          },
        ],
      },
    };
    const content = interactivePayloadToMessageContent(interactivePayload);
    printPreview("interactive message content", content);
    return "content generated";
  });

  console.log(`\nConnecting with auth=${authMethod}...`);
  console.log(`Recipient under test: ${recipient}`);
  const opened = waitForOpen(client);
  await connectClient(client);
  await opened;

  await safeTest("BerryClient sendText with delivered/read wait", async () => {
    const sent = await client.sendText(recipient, "BerryProtocol text delivery probe");
    const ack = await waitForAck(client, sent.id, 20000);
    return { sent, ack };
  });

  await safeTest("BerryClient sendMessage(list)", () =>
    client.sendMessage(recipient, {
      list: sampleList,
    }),
  );

  await safeTest("BerryClient sendMessage(listMessage)", () =>
    client.sendMessage(recipient, {
      listMessage: sampleList,
    }),
  );

  await safeTest("BerryClient sendMessage(buttonsMessage)", () =>
    client.sendMessage(recipient, {
      buttonsMessage: sampleButtons,
    }),
  );

  await safeTest("BerryClient sendMessage(interactiveMessage)", () =>
    client.sendMessage(recipient, {
      interactiveMessage: listToInteractivePayload(sampleList),
    }),
  );

  await safeTest("BerryClient sendMessage(buttonsMessage copy_code)", () =>
    client.sendMessage(recipient, {
      buttonsMessage: sampleCopyCodeButtons,
    }),
  );

  await safeTest("BerryClient sendMessage(buttonsMessage cta_url)", () =>
    client.sendMessage(recipient, {
      buttonsMessage: sampleUrlButtons,
    }),
  );

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
