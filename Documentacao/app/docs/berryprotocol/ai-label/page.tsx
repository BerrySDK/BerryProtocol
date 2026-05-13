import { DocsShell } from "@/components/docs-shell";

export default function BerryProtocolAiLabelPage() {
  return (
    <DocsShell
      title="AI Label"
      description="Experimental private-chat AI label support distributed through the Berry socket patch."
      toc={[
        { title: "Usage", url: "#usage" },
        { title: "Rules", url: "#rules" },
        { title: "How it works", url: "#how-it-works" },
      ]}
    >
      <h2 id="usage">Usage</h2>
      <pre>
        <code>{`await client.sendMessage("5511999999999@s.whatsapp.net", {
  text: "Hello! This message should show the AI label.",
  ai: true,
});`}</code>
      </pre>
      <h2 id="rules">Rules</h2>
      <ul>
        <li>Only private chats are allowed.</li>
        <li>Groups, newsletters, and status are blocked.</li>
        <li>The feature is experimental and depends on WhatsApp Web behavior.</li>
      </ul>
      <h2 id="how-it-works">How it works</h2>
      <p>
        BerrySDK patches the installed Baileys package during postinstall. The patch adds
        <code>supportPayload</code> to <code>messageContextInfo</code> and injects a
        <code>&lt;bot biz_bot="1" /&gt;</code> node in <code>relayMessage</code>.
      </p>
    </DocsShell>
  );
}
