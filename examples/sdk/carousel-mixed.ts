import { BerryProtocol } from "../../packages/core/src/index.ts";

const to = process.env.BERRY_TEST_TO;

if (!to) {
  console.log("Set BERRY_TEST_TO before running this example.");
  process.exit(0);
}

const client = new BerryProtocol({
  sessionId: "carousel-example",
});

client.once("connection.open", async () => {
  await client.sendCarousel(to, {
    text: "Cards mistos com imagem, video e botoes nativos",
    footer: "BerryProtocol carousel",
    carouselCardType: "mixed",
    cards: [
      {
        title: "Combo familia",
        body: "Imagem do combo com refrigerante",
        footer: "R$ 74,90",
        image: {
          url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
        },
        buttons: [
          {
            kind: "copy_code",
            title: "Copiar cupom",
            code: "FAMILIA10",
          },
        ],
      },
      {
        title: "Teaser forno",
        body: "Video dos bastidores",
        footer: "Veja agora",
        video: {
          url: "https://www.w3schools.com/html/movie.mp4",
          mimetype: "video/mp4",
        },
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "Pedir agora",
              id: "pedido_agora",
            }),
          },
          {
            kind: "cta_url",
            title: "Ver cardapio",
            url: "https://example.com/menu",
          },
        ],
      },
    ],
  });

  console.log("Carousel misto enviado.");
});

await client.connectWithQr();
