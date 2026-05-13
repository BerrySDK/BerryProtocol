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
    text: "Confira nossas pizzas!",
    footer: "Deslize para ver mais",
    carouselCardType: "image",
    cards: [
      {
        title: "Pizza Calabresa",
        body: "Calabresa premium com cebola roxa",
        footer: "R$ 39,90",
        image: {
          url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
        },
        buttons: [
          {
            kind: "quick_reply",
            id: "pizza_calabresa",
            title: "Escolher",
          },
        ],
      },
      {
        title: "Pizza Margherita",
        body: "Molho artesanal, mussarela e manjericao",
        footer: "R$ 36,90",
        image: {
          url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80",
        },
        buttons: [
          {
            kind: "cta_url",
            title: "Abrir site",
            url: "https://example.com/cardapio",
          },
        ],
      },
    ],
  });

  console.log("Carousel de imagem enviado.");
});

await client.connectWithQr();
