import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "send-text-example",
});

await client.connectWithQr();

const to = process.env.BERRY_TEST_TO;

if (!to) {
  throw new Error("Set BERRY_TEST_TO with a valid WhatsApp JID.");
}

await client.sendText(to, "Hello from BerryProtocol send-text example.");
