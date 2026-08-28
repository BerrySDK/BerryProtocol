import { BerryClient } from "../../packages/core/src/index.ts";
import { BerryOTP } from "../../packages/berry-otp/src/index.ts";

function waitForOpen(client: BerryClient) {
  return new Promise((resolve) => {
    client.once("connection.open", resolve);
  });
}

async function main(): Promise<void> {
  const to = process.env.BERRY_TEST_TO;
  if (!to) {
    throw new Error('Set BERRY_TEST_TO, for example: $env:BERRY_TEST_TO="5511999999999@s.whatsapp.net"');
  }

  const client = new BerryClient({
    sessionId: "test-session-qr",
  });

  const opened = waitForOpen(client);
  await client.connectWithQr();
  await opened;

  const otp = BerryOTP.createLoginFlow(client, {
    issuer: "BerryProtocol",
    ttlMs: 2 * 60 * 1000,
    mode: "copy-code",
    editOnExpire: true,
  });

  otp.on("sent", console.log);
  otp.on("used", console.log);
  otp.on("expired", console.log);
  otp.on("denied", console.log);
  otp.on("warning", console.log);
  otp.on("error", console.error);

  const sent = await otp.sendLoginCode(to, {
    userId: "test-user",
    metadata: { source: "sdk-test" },
  });

  console.log("OTP enviado:", sent);

  // Para testar verify manualmente, chame:
  // const result = await otp.verifyLoginCode(to, sent.code);
}

void main();
