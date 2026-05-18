import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "send-buttons-example",
});

await client.connectWithQr();

const to = process.env.BERRY_TEST_TO;

if (!to) {
  throw new Error("Set BERRY_TEST_TO with a valid WhatsApp JID.");
}

await client.sendButtons(to, {
  text: "Choose a path",
  footer: "BerryProtocol button example",
  buttons: [
    { id: "sales", title: "Sales", kind: "reply" },
    { id: "support", title: "Support", kind: "reply" },
  ],
});
