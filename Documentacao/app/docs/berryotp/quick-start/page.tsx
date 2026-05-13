import { DocsShell } from "@/components/docs-shell";

export default function BerryOtpQuickStartPage() {
  return (
    <DocsShell
      title="Quick Start"
      description="Send your first OTP using the BerryOTP facade package."
      toc={[
        { title: "Install", url: "#install" },
        { title: "Create the flow", url: "#create-the-flow" },
        { title: "Send code", url: "#send-code" },
      ]}
    >
      <h2 id="install">Install</h2>
      <pre>
        <code>{`npm install berryprotocol berryotp`}</code>
      </pre>
      <h2 id="create-the-flow">Create the flow</h2>
      <pre>
        <code>{`import BerryProtocol from "berryprotocol";
import { BerryOTP } from "berryotp";

const client = new BerryProtocol({
  sessionId: "otp-session",
});

const otp = BerryOTP.createLoginFlow(client, {
  issuer: "BerryProtocol",
  ttlMs: 2 * 60 * 1000,
  mode: "copy-code",
  editOnExpire: true,
});`}</code>
      </pre>
      <h2 id="send-code">Send code</h2>
      <pre>
        <code>{`await client.connectWithQr();

const sent = await otp.sendLoginCode("5511999999999@s.whatsapp.net", {
  userId: "user-001",
  metadata: { source: "docs-example" },
});

console.log(sent);`}</code>
      </pre>
    </DocsShell>
  );
}
