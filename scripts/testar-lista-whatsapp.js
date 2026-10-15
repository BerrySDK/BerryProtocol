import pino from "pino";
import qrcode from "qrcode-terminal";

import { BerryClient } from "../packages/core/dist/index.js";

const SESSION_ID = "teste-lista-whatsapp";
const PRIVATE_CHAT_SUFFIXES = ["@s.whatsapp.net", "@lid"];
const handledMessages = new Set();

const TEST_LIST = {
  title: "Lista atualizada",
  text: "Escolha uma das opções abaixo para confirmar que a lista está funcionando.",
  footer: "Teste BerryProtocol",
  buttonText: "Abrir opções",
  sections: [
    {
      title: "Opções de teste",
      rows: [
        {
          id: "teste_opcao_1",
          title: "Opção 1",
          description: "Primeira opção da lista atualizada",
        },
        {
          id: "teste_opcao_2",
          title: "Opção 2",
          description: "Segunda opção da lista atualizada",
        },
        {
          id: "teste_opcao_3",
          title: "Opção 3",
          description: "Terceira opção da lista atualizada",
        },
      ],
    },
  ],
};

const client = new BerryClient({
  sessionId: SESSION_ID,
  printQrInTerminal: false,
  logger: pino({ level: "silent" }),
});

const isPrivateChat = (jid) => PRIVATE_CHAT_SUFFIXES.some((suffix) => jid.endsWith(suffix));

const waitForConnection = () =>
  new Promise((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve();
    };

    const onError = ({ error }) => {
      cleanup();
      reject(new Error(error));
    };

    const cleanup = () => {
      client.off("connection.open", onOpen);
      client.off("auth.error", onError);
    };

    client.on("connection.open", onOpen);
    client.on("auth.error", onError);
  });

client.on("auth.qr", ({ value }) => {
  console.clear();
  qrcode.generate(value, { small: true });
  console.log("\nEscaneie o QR code e aguarde a conexão.");
});

client.on("message.received", async (message) => {
  if (message.type !== "text" || handledMessages.has(message.id)) {
    return;
  }

  const chatId = message.chatId ?? message.from;
  if (!chatId || !isPrivateChat(chatId)) {
    return;
  }

  handledMessages.add(message.id);

  try {
    console.log(`\nMensagem recebida de ${chatId}. Enviando a lista...`);
    const sent = await client.sendList(chatId, TEST_LIST);
    console.log(`Lista enviada com sucesso. ID: ${sent.id}`);
  } catch (error) {
    handledMessages.delete(message.id);
    console.error(
      "Falha ao enviar a lista:",
      error instanceof Error ? error.message : String(error),
    );
  }
});

client.on("connection.close", ({ reason }) => {
  console.log(`\nConexão encerrada: ${reason ?? "motivo desconhecido"}.`);
});

let shuttingDown = false;
const shutdown = async () => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log("\nEncerrando o teste...");
  await client.disconnect().catch(() => undefined);
  process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

try {
  const connected = waitForConnection();
  await client.connectWithQr();
  await connected;

  console.clear();
  console.log("WhatsApp conectado.");
  console.log("Envie uma mensagem de texto para esta conta a partir de outro número.");
  console.log("A lista atualizada será enviada automaticamente. Pressione Ctrl+C para sair.");
} catch (error) {
  console.error(
    "Não foi possível conectar ao WhatsApp:",
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
}
