# BerryProtocol

O BerryProtocol é o pacote público do **BerrySDK** para criar automações com WhatsApp Web em Node.js.

Este repositório foi pensado para ser o repositório público principal do SDK, parecido com a forma como o Baileys é apresentado: uma entrada única no npm, código organizado por áreas, exemplos, documentação e arquivos de comunidade prontos.

## Instalação

```bash
npm install berryprotocol
```

## Exemplo rápido

```ts
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "minha-sessao",
});

client.on("auth.qr", ({ value }) => {
  console.log("Escaneie o QR:", value);
});

client.on("connection.open", () => {
  console.log("Conectado.");
});

await client.connectWithQr();
```

## O que você encontra aqui

- autenticação com QR, link e pairing code
- envio de texto, mídia, botões, listas, reações, localização e contatos
- exports agrupados para auth, socket, store, utils, messages e types
- estrutura mais fácil de navegar
- pacote público preparado para distribuição no npm

## Estrutura do repositório

```text
BerryProtocol/
├── .github/
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

## Escopo

O `berryprotocol` é o pacote público que os desenvolvedores instalam pelo npm.

Os códigos internos e experimentais do monorepo principal ficam no repositório privado do BerrySDK, enquanto este repositório público é otimizado para consumo, onboarding e distribuição.

## Licença

Apache-2.0. Veja [LICENSE](./LICENSE).
