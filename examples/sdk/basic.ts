import { BerryClient } from "@berrysdk/core";

async function main(): Promise<void> {
  const client = new BerryClient({
    sessionId: "store-001",
  });

  client.on("qr", (qr) => console.log(qr));
  client.on("message.received", (message) => console.log(message));

  await client.connect();

  await client.sendText("5516999999999@s.whatsapp.net", "Olá pelo BerryProtocol!");
}

void main();
