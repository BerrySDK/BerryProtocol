import { DocsShell } from "@/components/docs-shell";

export default function BerryProtocolGettingStartedPage() {
  return (
    <DocsShell
      title="Getting Started"
      description="Install BerryProtocol and connect your first WhatsApp session."
      toc={[
        { title: "Install", url: "#install" },
        { title: "Create a client", url: "#create-a-client" },
        { title: "Connect", url: "#connect" },
      ]}
    >
      <h2 id="install">Install</h2>
      <pre>
        <code>{`npm install berryprotocol`}</code>
      </pre>
      <h2 id="create-a-client">Create a client</h2>
      <pre>
        <code>{`import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "store-001",
});`}</code>
      </pre>
      <h2 id="connect">Connect</h2>
      <pre>
        <code>{`await client.connectWithQr();

client.on("connection.open", (state) => {
  console.log("connected", state);
});`}</code>
      </pre>
    </DocsShell>
  );
}
