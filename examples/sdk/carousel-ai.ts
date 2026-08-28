import { BerryProtocol } from "../../packages/core/src/index.ts";

const to = process.env.BERRY_TEST_TO;
const imageUrl =
  process.env.BERRY_TEST_IMAGE_URL ??
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80";

if (!to) {
  console.error("Defina BERRY_TEST_TO antes de executar o exemplo de carousel com AI label.");
  process.exit(1);
}

const client = new BerryProtocol({
  sessionId: "carousel-ai-example",
});

client.once("connection.open", async () => {
  try {
    const sent = await client.sendCarousel(to, {
      text: "Confira nossas pizzas com sugestoes por IA",
      footer: "BerryProtocol AI",
      ai: true,
      carouselCardType: "image",
      cards: [
        {
          title: "Pizza Calabresa",
          body: "Recomendada pela IA",
          footer: "R$ 39,90",
          image: { url: imageUrl },
          buttons: [{ id: "pizza_calabresa", title: "Escolher", kind: "quick_reply" }],
        },
        {
          title: "Pizza Frango",
          body: "Sugestao equilibrada",
          footer: "R$ 42,90",
          image: { url: imageUrl },
          buttons: [{ title: "Abrir site", kind: "cta_url", url: "https://example.com/cardapio" }],
        },
      ],
    });

    console.log("CAROUSEL AI:", sent.id);
  } catch (error) {
    console.error("Falha ao enviar carousel com AI label:", error);
  } finally {
    await client.disconnect().catch(() => undefined);
    process.exit(0);
  }
});

await client.connectWithQr();
