import { BerryProtocol } from "../../packages/core/src/index.ts";

function waitForOpen(client: BerryProtocol) {
  return new Promise((resolve) => {
    client.once("connection.open", resolve);
  });
}

async function main(): Promise<void> {
  const to = process.env.BERRY_TEST_TO;
  if (!to) {
    throw new Error('Set BERRY_TEST_TO, for example: $env:BERRY_TEST_TO="5511999999999@s.whatsapp.net"');
  }

  const client = new BerryProtocol({
    sessionId: "test-session-qr",
  });

  client.on("message.ack", (ack) => {
    console.log("MESSAGE ACK:", ack);
  });

  const opened = waitForOpen(client);
  await client.connectWithQr();
  await opened;

  const sent = await client.sendMessage(to, {
    text: "Ola! Essa mensagem deve aparecer com label de AI.",
    ai: true,
  });

  console.log("AI LABEL SENT:", sent);
}

void main();
