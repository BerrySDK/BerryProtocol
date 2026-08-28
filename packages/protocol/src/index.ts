/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import protobuf from "protobufjs";
import * as whatsappProto from "@wppconnect/wa-proto";

export interface ProtocolFrame {
  stanza: string;
  attrs: Record<string, string>;
  payload: Buffer;
}

export interface WhatsAppWebConfig {
  webSocketUrl: string;
  origin: string;
  userAgent: string;
}

export class ProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProtocolError";
  }
}

const frameSchema = `
syntax = "proto3";
message WaEnvelope {
  string stanza = 1;
  map<string, string> attrs = 2;
  bytes payload = 3;
}
`;

const root = protobuf.parse(frameSchema).root;
const envelopeType = root.lookupType("WaEnvelope");

export class BinaryFrameCodec {
  encode(frame: ProtocolFrame): Buffer {
    const payload = envelopeType.create({
      stanza: frame.stanza,
      attrs: frame.attrs,
      payload: frame.payload,
    });

    return Buffer.from(envelopeType.encode(payload).finish());
  }

  decode(buffer: Buffer): ProtocolFrame {
    try {
      const decoded = envelopeType.decode(buffer);
      const object = envelopeType.toObject(decoded, {
        bytes: Buffer,
      }) as {
        stanza: string;
        attrs?: Record<string, string>;
        payload?: Buffer;
      };

      return {
        stanza: object.stanza,
        attrs: object.attrs ?? {},
        payload: object.payload ?? Buffer.alloc(0),
      };
    } catch (error) {
      throw new ProtocolError(
        `Unable to decode incoming frame as Berry envelope: ${(error as Error).message}`,
      );
    }
  }
}

export const defaultWhatsAppWebConfig: WhatsAppWebConfig = {
  webSocketUrl: process.env.BERRY_WHATSAPP_WS_URL ?? "wss://web.whatsapp.com/ws/chat",
  origin: "https://web.whatsapp.com",
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
};

export const proto = whatsappProto.waproto;
export const WAProto = proto;
export type WAProtoNamespace = typeof proto;
