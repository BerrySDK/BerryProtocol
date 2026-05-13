import { DocsShell } from "@/components/docs-shell";

export default function BerryProtocolOverviewPage() {
  return (
    <DocsShell
      title="BerryProtocol"
      description="The main SDK for WhatsApp Web automation, native-flow rendering, rich messaging, and session management."
      toc={[
        { title: "Introduction", url: "#introduction" },
        { title: "Why use it", url: "#why-use-it" },
        { title: "Packages", url: "#packages" },
      ]}
    >
      <h2 id="introduction">Introduction</h2>
      <p>
        BerryProtocol is the main developer-facing SDK from BerrySDK. It wraps the
        WhatsApp Web transport with typed events, persistent sessions, list rendering
        workarounds, native-flow buttons, and a higher-level API designed for production use.
      </p>
      <h2 id="why-use-it">Why use it</h2>
      <ul>
        <li>Connect with QR, link, or pairing code.</li>
        <li>Send text, media, reply buttons, copy-code buttons, and lists.</li>
        <li>Use the experimental AI label path in private chats.</li>
        <li>Build on a modular workspace with Berry-owned wrappers.</li>
      </ul>
      <h2 id="packages">Packages</h2>
      <p>
        You can consume the SDK through <code>berryprotocol</code> or directly through
        <code>@berrysdk/core</code>. Rich rendering paths are powered by
        <code>@berrysdk/socket</code> and <code>@berrysdk/wa-message</code>.
      </p>
    </DocsShell>
  );
}
