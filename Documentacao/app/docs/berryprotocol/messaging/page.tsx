import { DocsShell } from "@/components/docs-shell";

export default function BerryProtocolMessagingPage() {
  return (
    <DocsShell
      title="Messaging"
      description="Use the rendering-safe paths validated on WhatsApp Web and mobile."
      toc={[
        { title: "Text", url: "#text" },
        { title: "List", url: "#list" },
        { title: "Native buttons", url: "#native-buttons" },
      ]}
    >
      <h2 id="text">Text</h2>
      <pre>
        <code>{`await client.sendText("5511999999999@s.whatsapp.net", "Hello from BerryProtocol");`}</code>
      </pre>
      <h2 id="list">List</h2>
      <p>
        BerryProtocol uses the legacy list path with <code>listType: SINGLE_SELECT</code> and
        extra business nodes because that was the validated rendering path in real tests.
      </p>
      <pre>
        <code>{`await client.sendList("5511999999999@s.whatsapp.net", {
  title: "Menu",
  text: "Choose an option",
  footer: "BerrySDK",
  buttonText: "Open list",
  sections: [
    {
      title: "Options",
      rows: [{ id: "one", title: "Option 1" }],
    },
  ],
});`}</code>
      </pre>
      <h2 id="native-buttons">Native buttons</h2>
      <pre>
        <code>{`await client.sendMessage("5511999999999@s.whatsapp.net", {
  buttonsMessage: {
    text: "Choose a flow",
    footer: "BerrySDK",
    buttons: [
      { id: "reply:1", title: "Quick reply", kind: "quick_reply" },
      { id: "copy:1", title: "Copy code", kind: "copy_code", code: "BERRY10" },
      { id: "url:1", title: "Open site", kind: "cta_url", url: "https://github.com/BerrySDK" },
    ],
  },
});`}</code>
      </pre>
    </DocsShell>
  );
}
