# BerryProtocol

BerryProtocol is the public **BerrySDK** package for building WhatsApp Web automations in Node.js.

This repository is designed to be the public-facing SDK repository, similar in spirit to how developers consume Baileys: a single package entrypoint, a structured source tree, examples, GitHub community files, and a clean npm installation story.

## Installation

```bash
npm install berryprotocol
```

## Quick start

```ts
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "my-session",
});

client.on("auth.qr", ({ value }) => {
  console.log("Scan this QR code:", value);
});

client.on("connection.open", () => {
  console.log("Connected.");
});

await client.connectWithQr();
```

## What you get

- QR, link, and pairing-code authentication
- text, media, buttons, lists, reactions, location, and contacts
- grouped exports for auth, socket, store, utils, messages, and types
- a repository layout that is easier to browse and document
- a public package entrypoint backed by the BerrySDK ecosystem

## Repository structure

```text
BerryProtocol/
├── .github/
│   ├── workflows/
│   └── ISSUE_TEMPLATE/
├── src/
│   ├── Defaults/
│   ├── Socket/
│   ├── Utils/
│   ├── Types/
│   ├── Store/
│   ├── Auth/
│   ├── Media/
│   ├── Messages/
│   ├── index.ts
│   └── Utils.ts
├── Example/
│   └── example.ts
├── package.json
├── README.md
├── README_PORTUGUESE.md
└── LICENSE
```

## Scripts

```bash
npm install
npm run build
```

## Package scope

`berryprotocol` is the public package developers install from npm.

Internal and experimental monorepo code lives in the private BerrySDK repository, while this repository is optimized for public consumption, onboarding, and package distribution.

## Community

- Issues: [github.com/BerrySDK/BerryProtocol/issues](https://github.com/BerrySDK/BerryProtocol/issues)
- Security: see [SECURITY.md](./SECURITY.md)
- Contributions: see [CONTRIBUTING.md](./CONTRIBUTING.md)
- Portuguese guide: see [README_PORTUGUESE.md](./README_PORTUGUESE.md)

## License

Apache-2.0. See [LICENSE](./LICENSE).
