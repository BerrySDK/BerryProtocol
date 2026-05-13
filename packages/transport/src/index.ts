/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
export {
  default,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  makeCacheableSignalKeyStore,
  proto,
  useMultiFileAuthState,
} from "baileys";

export type {
  AnyMessageContent,
  BinaryNode,
  WAMessage,
  WASocket,
} from "baileys";
