import { DocsShell } from "@/components/docs-shell";

export default function BerryOtpSecurityPage() {
  return (
    <DocsShell
      title="Security"
      description="Understand the safety model behind BerryOTP."
      toc={[
        { title: "Storage", url: "#storage" },
        { title: "Verification", url: "#verification" },
        { title: "Expiration", url: "#expiration" },
      ]}
    >
      <h2 id="storage">Storage</h2>
      <p>
        BerryOTP does not store the raw OTP code. It generates a salt and stores only the
        SHA-256 hash.
      </p>
      <h2 id="verification">Verification</h2>
      <p>
        Verification uses timing-safe comparison and tracks attempts. When the maximum number
        of attempts is reached, the OTP becomes blocked.
      </p>
      <h2 id="expiration">Expiration</h2>
      <p>
        When an OTP expires, BerryOTP can edit the original message through
        <code>client.editMessage(...)</code> and mark it as no longer valid.
      </p>
    </DocsShell>
  );
}
