import { randomBytes } from "node:crypto";
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
  console.error("Defina BERRY_TEST_TO antes de executar a suite de proto types avancados.");
  process.exit(1);
}

type InternalSocket = {
  user?: { id?: string };
  waUploadToServer: unknown;
  groupInviteCode?: (jid: string) => Promise<string | undefined>;
  newsletterMetadata?: (
    type: "invite" | "jid",
    key: string,
  ) => Promise<
    | {
        id?: string;
        name?: string;
        invite?: string;
      }
    | null
  >;
  relayMessage: (
    jid: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any,
  ) => Promise<void>;
};

const client = new BerryProtocol({
  sessionId: "advanced-proto-types",
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
  await wait(500);
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

const sendPollCreation = async () => {
  const poll = proto.Message.PollCreationMessage.create({
    encKey: randomBytes(32),
    name: "Qual pizza voce quer hoje?",
    options: [
      { optionName: "Calabresa" },
      { optionName: "Frango com catupiry" },
      { optionName: "Marguerita" },
    ],
    selectableOptionsCount: 1,
    pollType: proto.Message.PollType.POLL,
  });

  return sendRaw("POLL CREATION", {
    pollCreationMessageV5: poll,
  });
};

const sendPollResultSnapshot = async () => {
  const snapshot = proto.Message.PollResultSnapshotMessage.create({
    name: "Parcial da enquete",
    pollVotes: [
      { optionName: "Calabresa", optionVoteCount: 7 },
      { optionName: "Frango com catupiry", optionVoteCount: 3 },
    ],
    pollType: proto.Message.PollType.POLL,
  });

  return sendRaw("POLL RESULT SNAPSHOT", {
    pollResultSnapshotMessage: snapshot,
  });
};

const sendPollUpdateProbe = async (pollMessageId?: string) => {
  if (!pollMessageId) {
    log("POLL UPDATE", "SKIP", "pollCreationMessage id ausente");
    return;
  }

  const update = proto.Message.PollUpdateMessage.create({
    pollCreationMessageKey: {
      remoteJid: to,
      fromMe: true,
      id: pollMessageId,
    },
    vote: {
      encPayload: randomBytes(24),
      encIv: randomBytes(12),
    },
    senderTimestampMs: Date.now(),
  });

  return sendRaw("POLL UPDATE", {
    pollUpdateMessage: update,
  });
};

const sendEventMessage = async () => {
  const now = Date.now();
  const eventMessage = proto.Message.EventMessage.create({
    name: "Noite da Pizza Berry",
    description: "Evento teste do protocolo",
    startTime: now + 60 * 60 * 1000,
    endTime: now + 2 * 60 * 60 * 1000,
    extraGuestsAllowed: true,
    hasReminder: true,
    reminderOffsetSec: 30 * 60,
    location: {
      degreesLatitude: -22.9068,
      degreesLongitude: -43.1729,
      name: "Berry HQ",
      address: "Rio de Janeiro",
    },
  });

  return sendRaw("EVENT MESSAGE", {
    eventMessage,
  });
};

const sendScheduledCallCreation = async () => {
  const scheduled = proto.Message.ScheduledCallCreationMessage.create({
    scheduledTimestampMs: Date.now() + 30 * 60 * 1000,
    callType: proto.Message.ScheduledCallCreationMessage.CallType.VIDEO,
    title: "Chamada agendada Berry",
  });

  return sendRaw("SCHEDULED CALL CREATION", {
    scheduledCallCreationMessage: scheduled,
  });
};

const sendScheduledCallCancel = async (messageId?: string) => {
  if (!messageId) {
    log("SCHEDULED CALL CANCEL", "SKIP", "scheduledCallCreationMessage id ausente");
    return;
  }

  const cancel = proto.Message.ScheduledCallEditMessage.create({
    key: {
      remoteJid: to,
      fromMe: true,
      id: messageId,
    },
    editType: proto.Message.ScheduledCallEditMessage.EditType.CANCEL,
  });

  return sendRaw("SCHEDULED CALL CANCEL", {
    scheduledCallEditMessage: cancel,
  });
};

const sendGroupInvite = async () => {
  const groupJid = process.env.BERRY_TEST_GROUP_JID;
  const inviteCode = process.env.BERRY_TEST_GROUP_INVITE_CODE;

  if (!groupJid) {
    log("GROUP INVITE", "SKIP", "defina pelo menos BERRY_TEST_GROUP_JID");
    return;
  }

  const sock = getInternalSock();
  const resolvedInviteCode = inviteCode ?? (await sock.groupInviteCode?.(groupJid));

  if (!resolvedInviteCode) {
    log("GROUP INVITE", "SKIP", "nao foi possivel resolver invite code do grupo");
    return;
  }

  const invite = proto.Message.GroupInviteMessage.create({
    groupJid,
    inviteCode: resolvedInviteCode,
    inviteExpiration:
      Number(process.env.BERRY_TEST_GROUP_INVITE_EXPIRATION) ||
      Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    groupName: process.env.BERRY_TEST_GROUP_NAME ?? "Grupo Berry",
    caption: "Convite de grupo experimental",
  });

  return sendRaw("GROUP INVITE", {
    groupInviteMessage: invite,
  });
};

const sendRequestPhoneNumber = async () =>
  sendRaw("REQUEST PHONE NUMBER", {
    requestPhoneNumberMessage: proto.Message.RequestPhoneNumberMessage.create({}),
  });

const sendProductMessage = async () => {
  const prepared = await maybePrepareImage();
  const ownerJid = process.env.BERRY_TEST_BIZ_OWNER_JID ?? getInternalSock().user?.id ?? "";

  const productMessage = proto.Message.ProductMessage.create({
    businessOwnerJid: ownerJid,
    body: "Produto experimental Berry",
    footer: "BerrySDK product probe",
    product: {
      productImage: prepared.imageMessage,
      productId: process.env.BERRY_TEST_PRODUCT_ID ?? "berry-product-001",
      title: "Pizza Experimental",
      description: "Produto de teste do protocolo",
      currencyCode: "BRL",
      priceAmount1000: 39900,
      retailerId: "berry-retailer-001",
      url: "https://example.com/produto",
      productImageCount: 1,
      firstImageId: "berry-image-001",
    },
    catalog: {
      catalogImage: prepared.imageMessage,
      title: "Catalogo Berry",
      description: "Probe de ProductMessage",
    },
  });

  return sendRaw("PRODUCT MESSAGE", {
    productMessage,
  });
};

const sendCollectionMessage = async () => {
  const bizJid = process.env.BERRY_TEST_COLLECTION_BIZ_JID;
  const id = process.env.BERRY_TEST_COLLECTION_ID;

  if (!bizJid || !id) {
    log("COLLECTION MESSAGE", "SKIP", "defina BERRY_TEST_COLLECTION_BIZ_JID e BERRY_TEST_COLLECTION_ID");
    return;
  }

  return sendRaw("COLLECTION MESSAGE", {
    viewOnceMessage: {
      message: {
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: {
            text: "Collection experimental",
          },
          footer: {
            text: "BerrySDK collection probe",
          },
          collectionMessage: {
            bizJid,
            id,
            messageVersion: 1,
          },
        }),
      },
    },
  });
};

const sendShopStorefrontMessage = async () => {
  const id = process.env.BERRY_TEST_SHOP_ID;

  if (!id) {
    log("SHOP STOREFRONT", "SKIP", "defina BERRY_TEST_SHOP_ID");
    return;
  }

  return sendRaw("SHOP STOREFRONT", {
    viewOnceMessage: {
      message: {
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: {
            text: "Shop storefront experimental",
          },
          footer: {
            text: "BerrySDK shop probe",
          },
          shopStorefrontMessage: {
            id,
            surface: proto.Message.InteractiveMessage.ShopMessage.Surface.WA,
            messageVersion: 1,
          },
        }),
      },
    },
  });
};

const sendNewsletterAdminInvite = async () => {
  const newsletterJid = process.env.BERRY_TEST_NEWSLETTER_JID;
  const newsletterInvite = process.env.BERRY_TEST_NEWSLETTER_INVITE;

  if (!newsletterJid && !newsletterInvite) {
    log("NEWSLETTER ADMIN INVITE", "SKIP", "defina BERRY_TEST_NEWSLETTER_JID ou BERRY_TEST_NEWSLETTER_INVITE");
    return;
  }

  const sock = getInternalSock();
  const metadata =
    (newsletterJid
      ? await sock.newsletterMetadata?.("jid", newsletterJid)
      : newsletterInvite
        ? await sock.newsletterMetadata?.("invite", newsletterInvite)
        : null) ?? null;
  const resolvedNewsletterJid = newsletterJid ?? metadata?.id;

  if (!resolvedNewsletterJid) {
    log("NEWSLETTER ADMIN INVITE", "SKIP", "nao foi possivel resolver o newsletterJid");
    return;
  }

  const prepared = await maybePrepareImage();
  return sendRaw("NEWSLETTER ADMIN INVITE", {
    newsletterAdminInviteMessage: proto.Message.NewsletterAdminInviteMessage.create({
      newsletterJid: resolvedNewsletterJid,
      newsletterName: process.env.BERRY_TEST_NEWSLETTER_NAME ?? metadata?.name ?? "Newsletter Berry",
      jpegThumbnail: prepared.imageMessage?.jpegThumbnail,
      caption: "Convite admin experimental",
      inviteExpiration:
        Number(process.env.BERRY_TEST_NEWSLETTER_INVITE_EXPIRATION) || Date.now() + 24 * 60 * 60 * 1000,
    }),
  });
};

const sendNewsletterFollowerInvite = async () => {
  const newsletterJid = process.env.BERRY_TEST_NEWSLETTER_JID;
  const newsletterInvite = process.env.BERRY_TEST_NEWSLETTER_INVITE;

  if (!newsletterJid && !newsletterInvite) {
    log("NEWSLETTER FOLLOWER INVITE", "SKIP", "defina BERRY_TEST_NEWSLETTER_JID ou BERRY_TEST_NEWSLETTER_INVITE");
    return;
  }

  const sock = getInternalSock();
  const metadata =
    (newsletterJid
      ? await sock.newsletterMetadata?.("jid", newsletterJid)
      : newsletterInvite
        ? await sock.newsletterMetadata?.("invite", newsletterInvite)
        : null) ?? null;
  const resolvedNewsletterJid = newsletterJid ?? metadata?.id;

  if (!resolvedNewsletterJid) {
    log("NEWSLETTER FOLLOWER INVITE", "SKIP", "nao foi possivel resolver o newsletterJid");
    return;
  }

  const prepared = await maybePrepareImage();
  return sendRaw("NEWSLETTER FOLLOWER INVITE", {
    newsletterFollowerInviteMessageV2: proto.Message.NewsletterFollowerInviteMessage.create({
      newsletterJid: resolvedNewsletterJid,
      newsletterName: process.env.BERRY_TEST_NEWSLETTER_NAME ?? metadata?.name ?? "Newsletter Berry",
      jpegThumbnail: prepared.imageMessage?.jpegThumbnail,
      caption: "Convite follower experimental",
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
    console.log("Running advanced proto message suite...");

    const poll = await attempt("POLL CREATION", sendPollCreation);
    await attempt("POLL RESULT SNAPSHOT", sendPollResultSnapshot);
    await attempt("POLL UPDATE", () => sendPollUpdateProbe(poll?.key?.id));

    await attempt("EVENT MESSAGE", sendEventMessage);

    const scheduled = await attempt("SCHEDULED CALL CREATION", sendScheduledCallCreation);
    await attempt("SCHEDULED CALL CANCEL", () => sendScheduledCallCancel(scheduled?.key?.id));

    await attempt("GROUP INVITE", sendGroupInvite);
    await attempt("REQUEST PHONE NUMBER", sendRequestPhoneNumber);
    await attempt("PRODUCT MESSAGE", sendProductMessage);
    await attempt("COLLECTION MESSAGE", sendCollectionMessage);
    await attempt("SHOP STOREFRONT", sendShopStorefrontMessage);
    await attempt("NEWSLETTER ADMIN INVITE", sendNewsletterAdminInvite);
    await attempt("NEWSLETTER FOLLOWER INVITE", sendNewsletterFollowerInvite);
  } finally {
    await client.disconnect().catch(() => undefined);
    process.exit(0);
  }
});

await client.connectWithQr();
