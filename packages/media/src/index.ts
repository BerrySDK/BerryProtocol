/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import { createReadStream, promises as fs } from "node:fs";
import { Readable } from "node:stream";
import { MediaPayload } from "@berrysdk/events";

export interface MediaDescriptor {
  fileName?: string;
  mimetype?: string;
  byteLength: number;
}

export class MediaManager {
  async load(payload: MediaPayload): Promise<{ buffer: Buffer; metadata: MediaDescriptor }> {
    if (payload.buffer) {
      return {
        buffer: payload.buffer,
        metadata: {
          fileName: payload.fileName,
          mimetype: payload.mimetype,
          byteLength: payload.buffer.byteLength,
        },
      };
    }

    if (payload.path) {
      const buffer = await fs.readFile(payload.path);
      return {
        buffer,
        metadata: {
          fileName: payload.fileName ?? payload.path.split(/[\\/]/).at(-1),
          mimetype: payload.mimetype,
          byteLength: buffer.byteLength,
        },
      };
    }

    if (payload.url) {
      const response = await fetch(payload.url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return {
        buffer,
        metadata: {
          fileName: payload.fileName,
          mimetype: payload.mimetype ?? response.headers.get("content-type") ?? undefined,
          byteLength: buffer.byteLength,
        },
      };
    }

    throw new Error("Media payload requires buffer, path or url.");
  }

  async download(url: string): Promise<Buffer> {
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
  }

  stream(path: string): Readable {
    return createReadStream(path);
  }
}
