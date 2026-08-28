import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import type { ProviderEventPayload } from "../providers/whatsapp/WhatsAppProvider.js";
import { logger } from "../utils/logger.js";

type Subscriber = {
  socket: {
    send: (payload: string) => void;
    close: () => void;
    readyState: number;
    OPEN: number;
    on: (event: string, listener: (...args: any[]) => void) => void;
  };
  instanceName?: string;
};

export class RealtimeGateway {
  private readonly subscribers = new Set<Subscriber>();

  register(app: FastifyInstance): void {
    app.get(
      env.BERRY_WS_PATH,
      { websocket: true },
      (socket, request) => {
        const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
        const apiKey =
          url.searchParams.get("apiKey")
          ?? request.headers.authorization?.replace(/^Bearer\s+/i, "").trim();
        if (apiKey !== env.API_KEY) {
          socket.send(
            JSON.stringify({
              success: false,
              message: "Invalid API key for realtime gateway.",
              error: { code: "UNAUTHORIZED" },
            }),
          );
          socket.close();
          return;
        }
        const instanceName = url.searchParams.get("instanceName") ?? undefined;
        const subscriber: Subscriber = {
          socket,
          instanceName,
        };
        this.subscribers.add(subscriber);

        socket.on("close", () => {
          this.subscribers.delete(subscriber);
        });

        socket.on("error", (error: unknown) => {
          logger.warn({ err: error }, "realtime socket error");
          this.subscribers.delete(subscriber);
        });

        socket.send(
          JSON.stringify({
            success: true,
            message: "Connected to BerryAPI realtime gateway.",
            data: { instanceName },
          }),
        );
      },
    );
  }

  broadcast(event: ProviderEventPayload): void {
    const payload = JSON.stringify({
      success: true,
      message: "Realtime event delivered.",
      data: event,
    });

    for (const subscriber of this.subscribers) {
      if (subscriber.instanceName && subscriber.instanceName !== event.instanceName) {
        continue;
      }

      if (subscriber.socket.readyState === subscriber.socket.OPEN) {
        subscriber.socket.send(payload);
      }
    }
  }
}
