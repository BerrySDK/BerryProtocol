import BerryProtocol, { makeLogger } from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "public-example",
  logger: makeLogger(),
});

client.on("auth.qr", ({ value }) => {
  console.log("QR received:", value);
});

client.on("connection.open", () => {
  console.log("BerryProtocol connected.");
});

async function main() {
  await client.connectWithQr();
}

main().catch((error) => {
  console.error("Failed to start BerryProtocol:", error);
});
