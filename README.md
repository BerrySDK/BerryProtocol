# BerryProtocol

SDK principal do **BerrySDK** para automação com WhatsApp Web.

O `berryprotocol` é o pacote público que desenvolvedores instalam no npm para criar bots, integrações, fluxos, autenticação com QR Code, mensagens interativas, OTP e automações construídas em cima do ecossistema BerrySDK.

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

## O que você pode fazer

- conectar sessões com `QR Code`, `link` ou `pairing code`
- enviar `text`, `image`, `audio`, `document` e `reaction`
- enviar mensagens interativas como `buttons`, `list` e `carousel`
- usar recursos modernos como `AI label`
- integrar com módulos como `BerryOTP`

## Estrutura do projeto

Este repositório público representa o pacote npm `berryprotocol`.

- `src/`: código-fonte do pacote público
- `example/`: exemplos rápidos de uso
- `.github/`: workflows, templates de issue e PR

Os códigos internos e experimentais do monorepo principal ficam no repositório privado do BerrySDK.

## Scripts

```bash
npm install
npm run build
```

## Compatibilidade

- Node.js `>= 20`
- ESM nativo

## NPM

- pacote público: [`berryprotocol`](https://www.npmjs.com/package/berryprotocol)

## Comunidade

- Issues: [github.com/BerrySDK/BerryProtocol/issues](https://github.com/BerrySDK/BerryProtocol/issues)
- Segurança: veja [SECURITY.md](./SECURITY.md)
- Contribuição: veja [CONTRIBUTING.md](./CONTRIBUTING.md)

## Licença

Apache-2.0. Veja [LICENSE](./LICENSE).
