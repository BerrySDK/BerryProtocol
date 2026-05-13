import { DocsShell } from "@/components/docs-shell";

export default function BerryOtpFlowsPage() {
  return (
    <DocsShell
      title="Flows"
      description="Use prebuilt helpers for login, password reset, and two-factor authentication."
      toc={[
        { title: "Login", url: "#login" },
        { title: "Password reset", url: "#password-reset" },
        { title: "2FA", url: "#two-factor-authentication" },
      ]}
    >
      <h2 id="login">Login</h2>
      <pre>
        <code>{`const loginOtp = BerryOTP.createLoginFlow(client);
await loginOtp.sendLoginCode(to, { userId: "abc" });
await loginOtp.verifyLoginCode(to, code);`}</code>
      </pre>
      <h2 id="password-reset">Password reset</h2>
      <pre>
        <code>{`const resetOtp = BerryOTP.createPasswordResetFlow(client);
await resetOtp.sendPasswordResetCode(to, { userId: "abc" });
await resetOtp.verifyPasswordResetCode(to, code);`}</code>
      </pre>
      <h2 id="two-factor-authentication">2FA</h2>
      <pre>
        <code>{`const twoFAOtp = BerryOTP.create2FAFlow(client);
await twoFAOtp.send2FACode(to, { userId: "abc" });
await twoFAOtp.verify2FACode(to, code);`}</code>
      </pre>
    </DocsShell>
  );
}
