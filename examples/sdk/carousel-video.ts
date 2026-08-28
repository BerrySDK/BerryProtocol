import { BerryProtocol } from "../../packages/core/src/index.ts";

const to = process.env.BERRY_TEST_TO;

if (!to) {
  console.log("Set BERRY_TEST_TO before running this example.");
  process.exit(0);
}

const client = new BerryProtocol({
  sessionId: "carousel-video-example",
});

client.once("connection.open", async () => {
  await client.sendCarousel(to, {
    text: "Confira nossos videos promocionais",
    footer: "Cada card pode ter video nativo",
    carouselCardType: "video",
    cards: [
      {
        title: "Promo da casa",
        body: "Video teaser da pizzaria",
        footer: "Toque para ver",
        video: {
          url: "https://www.w3schools.com/html/mov_bbb.mp4",
          mimetype: "video/mp4",
        },
        buttons: [
          {
            kind: "quick_reply",
            id: "promo_casa",
            title: "Quero essa promo",
          },
        ],
      },
    ],
  });

  console.log("Carousel de video enviado.");
});

await client.connectWithQr();
