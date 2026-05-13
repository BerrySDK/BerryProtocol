import { BerryProtocol } from "../../packages/core/src/index.ts";
import { BerryOTP } from "../../packages/berry-otp/src/index.ts";
import {
  buttonsPayloadToNativeFlowInteractiveContent,
  carouselPayloadToMessageContent,
  listToLegacyListMessageContent,
  normalizeIncomingMessage,
} from "../../packages/wa-message/src/index.ts";

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80";
const DEFAULT_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const section = (title: string, rows: Array<{ id: string; title: string; description?: string }>) => ({
  title,
  rows,
});

const runLocalMatrix = () => {
  console.log("Running local compatibility matrix...");

  const buttonsPayload = buttonsPayloadToNativeFlowInteractiveContent({
    text: "Escolha uma opcao",
    footer: "BerryProtocol",
    buttons: [
      { id: "reply_1", title: "Opcao 1", kind: "quick_reply" },
      { id: "coupon", title: "Copiar cupom", kind: "copy_code", code: "BERRY10" },
      { title: "Abrir site", kind: "cta_url", url: "https://example.com" },
    ],
  });

  const interactiveButtons =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (buttonsPayload as any).interactiveMessage?.nativeFlowMessage?.buttons ?? [];
  assert(interactiveButtons.length === 3, "buttons matrix should generate three native flow buttons");
  assert(interactiveButtons[0]?.name === "quick_reply", "first button should be quick_reply");
  assert(interactiveButtons[1]?.name === "cta_copy", "second button should be cta_copy");
  assert(interactiveButtons[2]?.name === "cta_url", "third button should be cta_url");

  const listPayload = listToLegacyListMessageContent({
    title: "Menu",
    text: "Escolha uma categoria",
    footer: "BerryProtocol",
    buttonText: "Abrir lista",
    sections: [
      section("Pizzas", [{ id: "calabresa", title: "Calabresa" }]),
      section("Bebidas", [{ id: "cola", title: "Coca-Cola" }]),
    ],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listMessage = (listPayload as any).listMessage;
  assert(listMessage?.sections?.length === 2, "legacy list should preserve two sections");
  assert(listMessage?.buttonText === "Abrir lista", "legacy list should preserve button text");

  const carouselPayload = carouselPayloadToMessageContent({
    text: "Confira nossas pizzas",
    footer: "Deslize para ver mais",
    cards: [
      {
        header: {
          title: "Pizza Calabresa",
          hasMediaAttachment: true,
          imageMessage: {},
        },
        body: { text: "Calabresa premium" },
        footer: { text: "R$ 39,90" },
        nativeFlowMessage: {
          buttons: [
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "Escolher",
                id: "pizza_calabresa",
              }),
            },
          ],
          messageParamsJson: "",
          messageVersion: 1,
        },
      },
    ],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const carouselMessage = (carouselPayload as any).viewOnceMessage?.message?.interactiveMessage?.carouselMessage;
  assert(carouselMessage?.cards?.length === 1, "carousel wrapper should preserve one card");
  assert(carouselMessage?.messageVersion === 1, "carousel should use messageVersion 1");

  const normalized = normalizeIncomingMessage({
    key: {
      id: "abc123",
      remoteJid: "5511999999999@s.whatsapp.net",
      fromMe: false,
    },
    messageTimestamp: 1,
    status: 1,
    message: {
      interactiveResponseMessage: {
        nativeFlowResponseMessage: {
          paramsJson: JSON.stringify({
            id: "pizza_calabresa",
          }),
        },
      },
    },
  } as never);
  assert(normalized?.chatId === "5511999999999@s.whatsapp.net", "incoming message should expose chatId");
  assert(normalized?.buttonId === "pizza_calabresa", "incoming message should parse interactive button id");

  console.log("Local compatibility matrix passed.");
};

const waitForOpen = (client: BerryProtocol) =>
  new Promise<void>((resolve) => {
    client.once("connection.open", () => resolve());
  });

const runLiveMatrix = async () => {
  const to = process.env.BERRY_TEST_TO;
  if (!to) {
    console.log("BERRY_TEST_TO not set. Skipping live compatibility matrix.");
    return;
  }

  console.log("Running live compatibility matrix...");

  const client = new BerryProtocol({
    sessionId: "carousel-example",
  });

  const ackLog = new Map<string, string[]>();

  client.on("message.ack", (ack) => {
    const previous = ackLog.get(ack.messageId) ?? [];
    previous.push(ack.ack);
    ackLog.set(ack.messageId, previous);
    console.log("ACK:", ack.messageId, ack.ack, ack.remoteJid);
  });

  const opened = waitForOpen(client);
  await client.connectWithQr();
  await opened;

  const sentText = await client.sendText(to, "BerryProtocol compatibility matrix");
  console.log("TEXT:", sentText.id);

  const edited = await client.editMessage(
    to,
    sentText.id,
    "BerryProtocol compatibility matrix (edited)",
  );
  console.log("EDIT:", edited.id);

  const aiText = await client.sendMessage(to, {
    text: "Mensagem com AI label",
    ai: true,
  });
  console.log("AI:", aiText.id);

  const list = await client.sendList(to, {
    title: "Menu completo",
    text: "Escolha uma categoria",
    footer: "BerryProtocol",
    buttonText: "Abrir menu",
    sections: [
      section("Pizzas", [
        { id: "calabresa", title: "Calabresa" },
        { id: "marguerita", title: "Marguerita" },
      ]),
      section("Bebidas", [{ id: "cola", title: "Coca-Cola" }]),
    ],
  });
  console.log("LIST:", list.id);

  const buttons = await client.sendButtons(to, {
    text: "Acoes rapidas",
    footer: "BerryProtocol",
    buttons: [
      { id: "reply_1", title: "Escolher", kind: "quick_reply" },
      { title: "Copiar cupom", kind: "copy_code", code: "BERRY10" },
      { title: "Abrir site", kind: "cta_url", url: "https://example.com" },
    ],
  });
  console.log("BUTTONS:", buttons.id);

  const carousel = await client.sendCarousel(to, {
    text: "Carousel image matrix",
    footer: "BerryProtocol",
    carouselCardType: "image",
    cards: [
      {
        title: "Pizza Calabresa",
        body: "Calabresa premium",
        footer: "R$ 39,90",
        image: { url: process.env.BERRY_TEST_IMAGE_URL ?? DEFAULT_IMAGE_URL },
        buttons: [{ id: "pizza_calabresa", title: "Escolher", kind: "quick_reply" }],
      },
      {
        title: "Pizza Frango",
        body: "Frango com catupiry",
        footer: "R$ 42,90",
        image: { url: process.env.BERRY_TEST_IMAGE_URL ?? DEFAULT_IMAGE_URL },
        buttons: [{ title: "Abrir site", kind: "cta_url", url: "https://example.com/cardapio" }],
      },
    ],
  });
  console.log("CAROUSEL IMAGE:", carousel.id);

  const aiCarousel = await client.sendCarousel(to, {
    text: "Carousel com AI label",
    footer: "BerryProtocol AI",
    ai: true,
    carouselCardType: "image",
    cards: [
      {
        title: "Pizza AI Calabresa",
        body: "Card com selo de IA",
        footer: "R$ 39,90",
        image: { url: process.env.BERRY_TEST_IMAGE_URL ?? DEFAULT_IMAGE_URL },
        buttons: [{ id: "pizza_ai_calabresa", title: "Escolher", kind: "quick_reply" }],
      },
    ],
  });
  console.log("CAROUSEL AI:", aiCarousel.id);

  const mixedCarousel = await client.sendCarousel(to, {
    text: "Carousel mixed matrix",
    footer: "BerryProtocol",
    carouselCardType: "mixed",
    cards: [
      {
        title: "Combo familia",
        body: "Imagem do combo",
        footer: "R$ 74,90",
        image: { url: process.env.BERRY_TEST_IMAGE_URL ?? DEFAULT_IMAGE_URL },
        buttons: [{ title: "Copiar cupom", kind: "copy_code", code: "FAMILIA10" }],
      },
      {
        title: "Teaser forno",
        body: "Video da cozinha",
        footer: "Video",
        video: {
          url: process.env.BERRY_TEST_VIDEO_URL ?? DEFAULT_VIDEO_URL,
          mimetype: "video/mp4",
        },
        buttons: [{ id: "pedido_agora", title: "Pedir agora", kind: "quick_reply" }],
      },
    ],
  });
  console.log("CAROUSEL MIXED:", mixedCarousel.id);

  await client.sendLocation(to, {
    latitude: -22.9068,
    longitude: -43.1729,
    name: "Berry HQ",
    address: "Rio de Janeiro",
  });
  console.log("LOCATION: ok");

  await client.sendContact(to, {
    displayName: "Berry Suporte",
    vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:Berry Suporte\nTEL;type=CELL;type=VOICE;waid=5511999999999:+55 11 99999-9999\nEND:VCARD",
  });
  console.log("CONTACT: ok");

  await client.sendReaction(to, "🍕", sentText.id);
  console.log("REACTION: ok");

  const otp = BerryOTP.createLoginFlow(client, {
    issuer: "BerryProtocol",
    ttlMs: 2 * 60 * 1000,
    mode: "copy-code",
    editOnExpire: true,
  });

  const otpSent = await otp.sendLoginCode(to, {
    userId: "compat-matrix-user",
    metadata: { source: "compat-matrix" },
  });
  console.log("OTP:", otpSent.messageId);

  console.log("Live compatibility matrix finished.");
};

runLocalMatrix();
await runLiveMatrix();
