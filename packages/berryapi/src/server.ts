import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const start = async () => {
  const app = await buildApp();
  await app.listen({
    host: env.HOST,
    port: env.PORT,
  });
  logger.info({ host: env.HOST, port: env.PORT }, "BerryAPI server started");
};

start().catch((error) => {
  logger.error({ err: error }, "failed to start BerryAPI");
  process.exitCode = 1;
});
