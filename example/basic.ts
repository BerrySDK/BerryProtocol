import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "minha-sessao",
});

client.on("auth.qr", ({ value }) => {
  console.log("QR recebido:", value.slice(0, 24) + "...");
});

client.on("connection.open", () => {
  console.log("Conectado com sucesso.");
});

async function main() {
  await client.connectWithQr();
}

main().catch((error) => {
  console.error("Falha ao iniciar o BerryProtocol:", error);
});
