import { BerryProtocol } from "../../packages/core/src/index.ts";
import {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto,
} from "../../packages/transport/src/index.ts";
import { interactiveNativeFlowAdditionalNodes } from "../../packages/wa-message/src/index.ts";

const to = process.env.BERRY_TEST_TO;
const imageUrl =
  process.env.BERRY_TEST_IMAGE_URL ??
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80";

if (!to) {
  console.error("Defina BERRY_TEST_TO antes de executar o teste experimental de AI por card.");
  process.exit(1);
}

const client = new BerryProtocol({
  sessionId: "carousel-ai-card-experimental",
});

const botNode = {
  tag: "bot",
  attrs: {
    biz_bot: "1",
  },
};

const buildCard = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sock: any,
  title: string,
  body: string,
  footer: string,
  id: string,
) => {
  const media = await prepareWAMessageMedia(
    {
      image: {
        url: imageUrl,
      },
    },
    {
      upload: sock.waUploadToServer,
    },
  );

  return proto.Message.InteractiveMessage.create({
    header: {
      title,
      hasMediaAttachment: true,
      imageMessage: media.imageMessage,
    },
    body: {
      text: body,
    },
    footer: {
      text: footer,
    },
    nativeFlowMessage: {
      buttons: [
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: "Escolher",
            id,
          }),
        },
      ],
      messageParamsJson: "",
      messageVersion: 1,
    },
    contextInfo: {
      isForwarded: true,
      forwardingScore: 1,
      forwardedAiBotMessageInfo: {
        botName: "Berry AI Card",
        botJid: "berry-ai-card@bot",
        creatorName: "BerrySDK",
      },
    },
  });
};

const sendExperimentalCarousel = async (
  variant: "per-card-only" | "top-level-plus-card",
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const berrySocket = (client as any).socket;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sock = berrySocket?.sock as any;

  if (!sock?.user?.id) {
    throw new Error("Socket interno nao esta pronto para o teste experimental.");
  }

  const cards = await Promise.all([
    buildCard(sock, "Card AI 1", "Tentativa de metadata por card", "BerrySDK", "ai_card_1"),
    buildCard(sock, "Card AI 2", "Segunda variacao experimental", "BerrySDK", "ai_card_2"),
  ]);

  const outerMessageContextInfo: Record<string, unknown> = {
    deviceListMetadata: {},
    deviceListMetadataVersion: 2,
  };

  const additionalNodes = [...interactiveNativeFlowAdditionalNodes()];

  if (variant === "top-level-plus-card") {
    outerMessageContextInfo.supportPayload = "{}";
    additionalNodes.push(botNode);
  }

  const message = generateWAMessageFromContent(
    to,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: outerMessageContextInfo,
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: {
              text:
                variant === "per-card-only"
                  ? "Experimental: metadata de IA somente nos cards"
                  : "Experimental: AI label no topo + metadata nos cards",
            },
            footer: {
              text: "BerryProtocol experimental",
            },
            carouselMessage: {
              cards,
              messageVersion: 1,
            },
          }),
        },
      },
    },
    {
      userJid: sock.user.id,
    },
  );

  await sock.relayMessage(to, message.message, {
    messageId: message.key.id,
    additionalNodes,
  });

  return message.key.id;
};

client.once("connection.open", async () => {
  try {
    const perCardOnly = await sendExperimentalCarousel("per-card-only");
    console.log("EXPERIMENTAL CARD AI ONLY:", perCardOnly);

    const topLevelPlusCard = await sendExperimentalCarousel("top-level-plus-card");
    console.log("EXPERIMENTAL TOP LEVEL + CARD AI:", topLevelPlusCard);
  } catch (error) {
    console.error("Falha no teste experimental de AI por card:", error);
  } finally {
    await client.disconnect().catch(() => undefined);
    process.exit(0);
  }
});

await client.connectWithQr();
