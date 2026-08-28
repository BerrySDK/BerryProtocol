const USER_SUFFIX = "@s.whatsapp.net";
const GROUP_SUFFIX = "@g.us";
const NEWSLETTER_SUFFIX = "@newsletter";
const STATUS_SUFFIX = "status@broadcast";

export const normalizeJid = (jid: string): string => jid.trim();

export const isUserJid = (jid: string): boolean =>
  normalizeJid(jid).endsWith(USER_SUFFIX);

export const isGroupJid = (jid: string): boolean =>
  normalizeJid(jid).endsWith(GROUP_SUFFIX);

export const isNewsletterJid = (jid: string): boolean =>
  normalizeJid(jid).endsWith(NEWSLETTER_SUFFIX);

export const isStatusJid = (jid: string): boolean =>
  normalizeJid(jid) === STATUS_SUFFIX;
