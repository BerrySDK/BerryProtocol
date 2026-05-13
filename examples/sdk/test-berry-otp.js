import { createRequire } from "node:module";
import BerryOTP from "./berryotp.js";

const require = createRequire(import.meta.url);
import { BerryClient } from "../../packages/core/src/index.ts";

const client = new BerryClient({
  sessionId: "test-session-qr",
});

client.on("auth.qr", ({ value }) => {
  console.log("QR:", value);
});

client.on("connection.open", () => {
  console.log("Conectado!");
});

await client.connectWithQr();

// cria o BerryOTP
const otp = new BerryOTP(client, {
  issuer: "BerryProtocol",
  ttlMs: 2 * 60 * 1000,
  mode: "experimental-copy-code",
});

// eventos
otp.on("expired", (data) => {
  console.log("OTP expirou:", data);
});

otp.on("used", (data) => {
  console.log("OTP usado:", data);
});

otp.on("denied", (data) => {
  console.log("Usuário clicou em NÃO PEDI:", data);
});

// número
const to = "5519997530219@s.whatsapp.net";

// envia OTP
const sent = await otp.send(to, {
  purpose: "entrar na conta",
});

console.log("OTP enviado:");
console.log(sent);

/*
Retorno:

{
  id,
  to,
  code,
  expiresAt,
  messageId,
  status: "sent"
}
*/

// verificar código depois
const result = await otp.verify(to, sent.code);

console.log("VERIFY:");
console.log(result);