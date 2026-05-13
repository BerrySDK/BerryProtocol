import { DocsShell } from "@/components/docs-shell";

export default function BerryOtpOverviewPage() {
  return (
    <DocsShell
      title="BerryOTP"
      description="OTP flows for WhatsApp Web with copy-code, deny actions, expiration handling, and secure verification."
      toc={[
        { title: "Introduction", url: "#introduction" },
        { title: "Modes", url: "#modes" },
        { title: "What it solves", url: "#what-it-solves" },
      ]}
    >
      <h2 id="introduction">Introduction</h2>
      <p>
        BerryOTP is the official OTP layer from BerrySDK. It was designed to send pretty,
        interactive verification codes through WhatsApp Web without the official API.
      </p>
      <h2 id="modes">Modes</h2>
      <ul>
        <li><code>stable</code></li>
        <li><code>copy-code</code></li>
        <li><code>experimental-copy-code</code></li>
      </ul>
      <h2 id="what-it-solves">What it solves</h2>
      <ul>
        <li>Login verification</li>
        <li>Password reset</li>
        <li>2FA confirmation</li>
        <li>Deny flow when the user did not request the code</li>
      </ul>
    </DocsShell>
  );
}
