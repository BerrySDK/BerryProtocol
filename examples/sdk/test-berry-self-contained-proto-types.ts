import { randomBytes, randomUUID } from "node:crypto";
import { BerryProtocol } from "../../packages/core/src/index.ts";
import {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto,
  type WAMessage,
} from "../../packages/transport/src/index.ts";

const to = process.env.BERRY_TEST_TO;
const imageUrl =
  process.env.BERRY_TEST_IMAGE_URL ??
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80";

if (!to) {
  console.error("Defina BERRY_TEST_TO antes de executar a suite self-contained.");
  process.exit(1);
}

type InternalSocket = {
  user?: { id?: string };
  waUploadToServer: unknown;
  relayMessage: (
    jid: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any,
  ) => Promise<void>;
};

const client = new BerryProtocol({
  sessionId: "self-contained-proto-types",
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (label: string, status: "OK" | "SKIP" | "FAIL", detail: string) => {
  console.log(`[${status}] ${label}: ${detail}`);
};

const getInternalSock = (): InternalSocket => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const berrySocket = (client as any).socket;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sock = berrySocket?.sock as InternalSocket | undefined;

  if (!sock?.user?.id) {
    throw new Error("Socket interno nao esta pronto.");
  }

  return sock;
};

const sendRaw = async (
  label: string,
  content: Record<string, unknown>,
): Promise<WAMessage> => {
  const sock = getInternalSock();
  const message = generateWAMessageFromContent(
    to,
    content,
    {
      userJid: sock.user!.id!,
    },
  );

  await sock.relayMessage(to, message.message, {
    messageId: message.key.id,
  });

  log(label, "OK", String(message.key.id));
  await wait(450);
  return message;
};

const maybePrepareImage = async () => {
  const sock = getInternalSock();
  return prepareWAMessageMedia(
    {
      image: {
        url: imageUrl,
      },
    },
    {
      upload: sock.waUploadToServer as never,
    },
  );
};

const createPaymentBackground = () =>
  proto.PaymentBackground.create({
    id: "berry-payment-bg",
    type: proto.PaymentBackground.Type.DEFAULT,
    placeholderArgb: 0x1f2937,
    textArgb: 0xffffff,
    subtextArgb: 0xd1d5db,
  });

const createMoney = (value: number) =>
  proto.Money.create({
    value,
    offset: 1000,
    currencyCode: "BRL",
  });

const sendAnchorText = async () =>
  sendRaw("ANCHOR TEXT", {
    conversation: "Mensagem ancora para testes proto self-contained.",
  });

const sendPollCreation = async () =>
  sendRaw("POLL CREATION", {
    pollCreationMessageV5: proto.Message.PollCreationMessage.create({
      encKey: randomBytes(32),
      name: "Qual sabor experimental?",
      options: [
        { optionName: "Calabresa" },
        { optionName: "Frango" },
      ],
      selectableOptionsCount: 1,
      pollType: proto.Message.PollType.POLL,
    }),
  });

const sendPollVote = async () =>
  sendRaw("POLL VOTE", {
    pollVoteMessage: proto.Message.PollVoteMessage.create({
      selectedOptions: [randomBytes(32)],
    }),
  });

const sendPollResultSnapshot = async () =>
  sendRaw("POLL RESULT SNAPSHOT", {
    pollResultSnapshotMessage: proto.Message.PollResultSnapshotMessage.create({
      name: "Parcial self-contained",
      pollVotes: [
        { optionName: "Calabresa", optionVoteCount: 5 },
        { optionName: "Frango", optionVoteCount: 2 },
      ],
      pollType: proto.Message.PollType.POLL,
    }),
  });

const sendEventResponse = async () =>
  sendRaw("EVENT RESPONSE", {
    eventResponseMessage: proto.Message.EventResponseMessage.create({
      response: proto.Message.EventResponseMessage.EventResponseType.GOING,
      timestampMs: Date.now(),
      extraGuestCount: 1,
    }),
  });

const sendCallLogMessage = async () =>
  sendRaw("CALL LOG MESSAGE", {
    callLogMessage: proto.Message.CallLogMessage.create({
      isVideo: true,
      callOutcome: proto.Message.CallLogMessage.CallOutcome.MISSED,
      durationSecs: 0,
      callType: proto.Message.CallLogMessage.CallType.REGULAR,
      participants: [
        {
          jid: to,
          callOutcome: proto.Message.CallLogMessage.CallOutcome.MISSED,
        },
      ],
    }),
  });

const sendPaymentInvite = async () =>
  sendRaw("PAYMENT INVITE", {
    paymentInviteMessage: proto.Message.PaymentInviteMessage.create({
      serviceType: proto.Message.PaymentInviteMessage.ServiceType.UPI,
      expiryTimestamp: Date.now() + 24 * 60 * 60 * 1000,
    }),
  });

const sendInvoiceMessage = async () => {
  const prepared = await maybePrepareImage();

  return sendRaw("INVOICE MESSAGE", {
    invoiceMessage: proto.Message.InvoiceMessage.create({
      note: "Fatura experimental Berry",
      token: randomUUID(),
      attachmentType: proto.Message.InvoiceMessage.AttachmentType.IMAGE,
      attachmentMimetype: "image/jpeg",
      attachmentJpegThumbnail: prepared.imageMessage?.jpegThumbnail,
    }),
  });
};

const sendRequestPayment = async () =>
  sendRaw("REQUEST PAYMENT", {
    requestPaymentMessage: proto.Message.RequestPaymentMessage.create({
      noteMessage: proto.Message.create({
        conversation: "Cobranca experimental Berry",
      }),
      currencyCodeIso4217: "BRL",
      amount1000: 49900,
      requestFrom: to,
      expiryTimestamp: Date.now() + 60 * 60 * 1000,
      amount: createMoney(49900),
      background: createPaymentBackground(),
    }),
  });

const sendSendPayment = async (requestMessage?: WAMessage) => {
  if (!requestMessage?.key?.id) {
    log("SEND PAYMENT", "SKIP", "requestPaymentMessage id ausente");
    return;
  }

  return sendRaw("SEND PAYMENT", {
    sendPaymentMessage: proto.Message.SendPaymentMessage.create({
      noteMessage: proto.Message.create({
        conversation: "Pagamento experimental enviado",
      }),
      requestMessageKey: {
        remoteJid: to,
        fromMe: true,
        id: requestMessage.key.id,
      },
      background: createPaymentBackground(),
      transactionData: JSON.stringify({
        txid: randomUUID(),
        amount1000: 49900,
        currency: "BRL",
      }),
    }),
  });
};

const sendOrderMessage = async () => {
  const prepared = await maybePrepareImage();
  const sellerJid = getInternalSock().user?.id ?? "";

  return sendRaw("ORDER MESSAGE", {
    orderMessage: proto.Message.OrderMessage.create({
      orderId: `berry-order-${Date.now()}`,
      thumbnail: prepared.imageMessage?.jpegThumbnail,
      itemCount: 2,
      status: proto.Message.OrderMessage.OrderStatus.INQUIRY,
      surface: proto.Message.OrderMessage.OrderSurface.CATALOG,
      message: "Pedido experimental Berry",
      orderTitle: "2 pizzas experimentais",
      sellerJid,
      token: randomUUID(),
      totalAmount1000: 79900,
      totalCurrencyCode: "BRL",
      messageVersion: 1,
      catalogType: "native",
    }),
  });
};

const sendStickerPackMessage = async () => {
  const prepared = await maybePrepareImage();

  return sendRaw("STICKER PACK MESSAGE", {
    stickerPackMessage: proto.Message.StickerPackMessage.create({
      stickerPackId: "berry-pack-001",
      name: "Berry Pack Experimental",
      publisher: "BerrySDK",
      stickers: [
        {
          fileName: "pizza-love.webp",
          isAnimated: false,
          emojis: ["🍕", "🔥"],
          mimetype: "image/webp",
        },
      ],
      caption: "Sticker pack experimental",
      packDescription: "Pacote de stickers para validar renderizacao",
      thumbnailSha256: prepared.imageMessage?.fileSha256,
      thumbnailEncSha256: prepared.imageMessage?.fileEncSha256,
      thumbnailDirectPath: prepared.imageMessage?.directPath,
      thumbnailHeight: prepared.imageMessage?.height,
      thumbnailWidth: prepared.imageMessage?.width,
      stickerPackSize: 1,
      stickerPackOrigin: proto.Message.StickerPackMessage.StickerPackOrigin.USER_CREATED,
    }),
  });
};

const sendPinInChat = async (anchor?: WAMessage) => {
  if (!anchor?.key?.id) {
    log("PIN IN CHAT", "SKIP", "anchor message id ausente");
    return;
  }

  return sendRaw("PIN IN CHAT", {
    pinInChatMessage: proto.Message.PinInChatMessage.create({
      key: {
        remoteJid: to,
        fromMe: true,
        id: anchor.key.id,
      },
      type: proto.Message.PinInChatMessage.Type.PIN_FOR_ALL,
      senderTimestampMs: Date.now(),
    }),
  });
};

const sendKeepInChat = async (anchor?: WAMessage) => {
  if (!anchor?.key?.id) {
    log("KEEP IN CHAT", "SKIP", "anchor message id ausente");
    return;
  }

  return sendRaw("KEEP IN CHAT", {
    keepInChatMessage: proto.Message.KeepInChatMessage.create({
      key: {
        remoteJid: to,
        fromMe: true,
        id: anchor.key.id,
      },
      keepType: proto.KeepType.KEEP_FOR_ALL,
      timestampMs: Date.now(),
    }),
  });
};

const attempt = async <T>(
  label: string,
  runner: () => Promise<T>,
): Promise<T | undefined> => {
  try {
    return await runner();
  } catch (error) {
    log(label, "FAIL", error instanceof Error ? error.message : String(error));
    return undefined;
  }
};

client.once("connection.open", async () => {
  try {
    console.log("Running self-contained proto message suite...");

    const anchor = await attempt("ANCHOR TEXT", sendAnchorText);
    await attempt("POLL CREATION", sendPollCreation);
    await attempt("POLL VOTE", sendPollVote);
    await attempt("POLL RESULT SNAPSHOT", sendPollResultSnapshot);
    await attempt("EVENT RESPONSE", sendEventResponse);
    await attempt("CALL LOG MESSAGE", sendCallLogMessage);
    await attempt("PAYMENT INVITE", sendPaymentInvite);
    await attempt("INVOICE MESSAGE", sendInvoiceMessage);
    const requestPayment = await attempt("REQUEST PAYMENT", sendRequestPayment);
    await attempt("SEND PAYMENT", () => sendSendPayment(requestPayment));
    await attempt("ORDER MESSAGE", sendOrderMessage);
    await attempt("STICKER PACK MESSAGE", sendStickerPackMessage);
    await attempt("PIN IN CHAT", () => sendPinInChat(anchor));
    await attempt("KEEP IN CHAT", () => sendKeepInChat(anchor));
  } finally {
    await client.disconnect().catch(() => undefined);
    process.exit(0);
  }
});

await client.connectWithQr();
