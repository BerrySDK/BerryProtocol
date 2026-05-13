import { BerryProtocol } from "../../packages/core/src/index.ts";

const assertRejects = async (label: string, fn: () => Promise<unknown>) => {
  try {
    await fn();
    console.error(`FAIL: ${label} should have rejected`);
  } catch (error) {
    console.log(`OK: ${label}`, error instanceof Error ? error.message : error);
  }
};

const runLocalValidationSuite = async () => {
  const client = new BerryProtocol({
    sessionId: "carousel-example",
    printQrInTerminal: false,
  });

  await assertRejects("invalid jid", () =>
    client.sendMessage("invalido", {
      text: "oi",
    }),
  );

  await assertRejects("carousel without media", () =>
    client.sendMessage("5511999999999@s.whatsapp.net", {
      text: "cards",
      cards: [
        {
          title: "Sem midia",
        },
      ],
    }),
  );

  await assertRejects("carousel over limit", () =>
    client.sendMessage("5511999999999@s.whatsapp.net", {
      text: "cards",
      cards: Array.from({ length: 11 }, (_, index) => ({
        title: `Card ${index + 1}`,
        image: {
          url: "https://example.com/image.png",
        },
      })),
    }),
  );

  await assertRejects("carousel type mismatch", () =>
    client.sendMessage("5511999999999@s.whatsapp.net", {
      text: "cards",
      carouselCardType: "image",
      cards: [
        {
          title: "Video em carousel de imagem",
          video: {
            url: "https://www.w3schools.com/html/mov_bbb.mp4",
          },
        },
      ],
    }),
  );
};

const runLiveSuite = async () => {
  const to = process.env.BERRY_TEST_TO;
  if (!to) {
    console.log("BERRY_TEST_TO not set. Skipping live send suite.");
    return;
  }

  const client = new BerryProtocol({
    sessionId: "carousel-example",
  });

  client.on("message.ack", (ack) => {
    console.log("ACK:", ack);
  });

  client.once("connection.open", async () => {
    console.log("Connected. Running live send suite...");

    await client.sendText(to, "BerryProtocol regression suite");

    await client.sendList(to, {
      title: "Menu",
      text: "Escolha uma categoria",
      footer: "BerryProtocol",
      buttonText: "Abrir lista",
      sections: [
        {
          title: "Pizzas",
          rows: [{ id: "calabresa", title: "Calabresa" }],
        },
      ],
    });

    await client.sendButtons(to, {
      text: "Escolha uma acao",
      footer: "BerryProtocol",
      buttons: [
        { id: "reply_1", title: "Opcao 1", kind: "quick_reply" },
        { id: "coupon", title: "Copiar cupom", kind: "copy_code", code: "BERRY10" },
      ],
    });

    await client.sendCarousel(to, {
      text: "Regression carousel",
      footer: "BerryProtocol",
      carouselCardType: "mixed",
      cards: [
        {
          title: "Imagem",
          body: "Card de imagem",
          footer: "R$ 39,90",
          image: {
            url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
          },
          buttons: [{ id: "img_1", title: "Escolher", kind: "quick_reply" }],
        },
        {
          title: "Video",
          body: "Card de video",
          footer: "Promo",
          video: {
            url: "https://www.w3schools.com/html/mov_bbb.mp4",
            mimetype: "video/mp4",
          },
          buttons: [{ title: "Abrir site", kind: "cta_url", url: "https://example.com" }],
        },
      ],
    });

    console.log("Live send suite finished.");
  });

  await client.connectWithQr();
};

await runLocalValidationSuite();
await runLiveSuite();
