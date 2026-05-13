import BerryProtocol from "berryprotocol";
import { BerryOTP } from "berryotp";

const recipient = process.env.BERRY_TEST_TO;

if (!recipient) {
  console.error("Set BERRY_TEST_TO before running this example.");
  console.error('Example: $env:BERRY_TEST_TO="5511999999999@s.whatsapp.net"');
  process.exit(1);
}

const client = new BerryProtocol({
  sessionId: "npm-consumer-session",
});

client.on("auth.qr", ({ value }) => {
  console.log("\nQR payload received:\n");
  console.log(value);
});

client.on("connection.open", (state) => {
  console.log("CONNECTED:", state);
});

client.on("auth.success", (session) => {
  console.log("AUTH SUCCESS:", session);
});

client.on("message.ack", (ack) => {
  console.log("MESSAGE ACK:", ack);
});

async function main() {
  await client.connectWithQr();

  const sent = await client.sendText(recipient, "Hello from berryprotocol on npm");
  console.log("TEXT SENT:", sent);

  const listSent = await client.sendList(recipient, {
    title: "Menu Berry SDK",
    text: "Escolha uma opcao",
    footer: "via npm",
    buttonText: "Abrir lista",
    sections: [
      {
        title: "Opcoes",
        rows: [
          {
            id: "opcao_1",
            title: "Opcao 1",
            description: "Primeira opcao",
          },
          {
            id: "opcao_2",
            title: "Opcao 2",
            description: "Segunda opcao",
          },
        ],
      },
    ],
  });

  console.log("LIST SENT:", listSent);

  const otp = BerryOTP.createLoginFlow(client, {
    issuer: "BerryProtocol",
    ttlMs: 2 * 60 * 1000,
    mode: "copy-code",
  });

  const otpSent = await otp.sendLoginCode(recipient, {
    userId: "npm-consumer-user",
    metadata: { source: "npm-consumer" },
  });

  console.log("OTP SENT:", otpSent);
}

main().catch((error) => {
  console.error("NPM consumer example failed:", error);
  process.exitCode = 1;
});
