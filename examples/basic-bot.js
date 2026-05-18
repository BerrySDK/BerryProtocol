import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "basic-bot-example",
});

client.on("auth.qr", ({ value }) => {
  console.log("Scan this QR code:", value);
});

client.on("message.received", async (message) => {
  if (message.type !== "text" || !message.from) {
    return;
  }

  const chatId = message.chatId ?? message.from;
  const text = message.text.trim().toLowerCase();

  if (text === "ping") {
    await client.sendText(chatId, "pong");
  }
});

await client.connectWithQr();
