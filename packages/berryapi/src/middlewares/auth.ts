import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const publicPrefixes = ["/", "/info", "/docs", "/documentation", "/docs/json", env.BERRY_WS_PATH];

export const authMiddleware = async (request: FastifyRequest, _reply: FastifyReply) => {
  if (publicPrefixes.some((prefix) => request.url === prefix || request.url.startsWith(`${prefix}/`))) {
    return;
  }

  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing bearer token.");
  }

  const token = header.slice("Bearer ".length).trim();
  if (token !== env.API_KEY) {
    throw new HttpError(401, "Invalid API key.");
  }
};
