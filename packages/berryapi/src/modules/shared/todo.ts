import { HttpError } from "../../utils/http-error.js";

export const notImplementedYet = (message: string, details?: Record<string, unknown>): never => {
  throw new HttpError(501, message, {
    todo: true,
    ...details,
  });
};
