import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "send-list-example",
});

await client.connectWithQr();

const to = process.env.BERRY_TEST_TO;

if (!to) {
  throw new Error("Set BERRY_TEST_TO with a valid WhatsApp JID.");
}

await client.sendList(to, {
  title: "Departments",
  text: "Pick one department",
  footer: "BerryProtocol list example",
  buttonText: "Open menu",
  sections: [
    {
      title: "Main",
      rows: [
        { id: "billing", title: "Billing" },
        { id: "orders", title: "Orders" },
      ],
    },
  ],
});
