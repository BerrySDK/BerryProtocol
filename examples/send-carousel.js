import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "send-carousel-example",
});

await client.connectWithQr();

const to = process.env.BERRY_TEST_TO;

if (!to) {
  throw new Error("Set BERRY_TEST_TO with a valid WhatsApp JID.");
}

await client.sendCarousel(to, {
  text: "Featured products",
  footer: "Swipe to browse",
  carouselCardType: "image",
  cards: [
    {
      title: "Product A",
      body: "A short description",
      footer: "R$ 49,90",
      image: {
        url: process.env.BERRY_TEST_IMAGE_URL ?? "https://picsum.photos/640/480",
      },
      buttons: [
        { id: "buy_product_a", title: "Buy", kind: "quick_reply" },
      ],
    },
  ],
});
