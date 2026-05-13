import { BerryProtocol } from "../../packages/core/src/index.ts";

type InternalSocket = {
  newsletterMetadata?: (
    type: "invite" | "jid",
    key: string,
  ) => Promise<
    | {
        id?: string;
        name?: string;
        invite?: string;
        subscribersCount?: number;
      }
    | null
  >;
};

const client = new BerryProtocol({
  sessionId: "list-berry-jids",
});

const newsletterJid = process.env.BERRY_TEST_NEWSLETTER_JID?.trim();
const newsletterInvite = process.env.BERRY_TEST_NEWSLETTER_INVITE?.trim();

const getInternalSock = (): InternalSocket | undefined => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const berrySocket = (client as any).socket;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return berrySocket?.sock as InternalSocket | undefined;
};

const printGroups = async () => {
  const groups = await client.fetchGroups();

  console.log("");
  console.log("=== GRUPOS ===");

  if (!groups.length) {
    console.log("Nenhum grupo encontrado nessa sessao.");
    return;
  }

  for (const group of groups.sort((a, b) => a.subject.localeCompare(b.subject))) {
    console.log(`${group.subject} => ${group.id}`);
  }
};

const printNewsletter = async () => {
  const sock = getInternalSock();

  if (!sock?.newsletterMetadata) {
    console.log("");
    console.log("=== NEWSLETTER ===");
    console.log("O runtime atual nao expoe newsletterMetadata nessa sessao.");
    return;
  }

  if (!newsletterJid && !newsletterInvite) {
    console.log("");
    console.log("=== NEWSLETTER ===");
    console.log(
      "Para resolver JID de newsletter, defina BERRY_TEST_NEWSLETTER_JID ou BERRY_TEST_NEWSLETTER_INVITE.",
    );
    return;
  }

  const metadata = newsletterJid
    ? await sock.newsletterMetadata("jid", newsletterJid)
    : await sock.newsletterMetadata("invite", newsletterInvite!);

  console.log("");
  console.log("=== NEWSLETTER ===");

  if (!metadata) {
    console.log("Nao foi possivel resolver a newsletter informada.");
    return;
  }

  console.log(`Nome: ${metadata.name ?? "(sem nome)"}`);
  console.log(`JID: ${metadata.id ?? "(nao retornado)"}`);
  console.log(`Invite: ${metadata.invite ?? "(nao retornado)"}`);
  if (typeof metadata.subscribersCount === "number") {
    console.log(`Inscritos: ${metadata.subscribersCount}`);
  }
};

client.once("connection.open", async () => {
  try {
    await printGroups();
    await printNewsletter();
  } finally {
    await client.disconnect().catch(() => undefined);
    process.exit(0);
  }
});

await client.connectWithQr();
