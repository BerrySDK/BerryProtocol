import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { HttpError } from "../utils/http-error.js";
import { errorResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (
  error: FastifyError | HttpError,
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const details = error instanceof HttpError ? error.details : { name: error.name };

  logger.error({ err: error, statusCode }, "request failed");
  reply.status(statusCode).send(errorResponse(error.message, details));
};
