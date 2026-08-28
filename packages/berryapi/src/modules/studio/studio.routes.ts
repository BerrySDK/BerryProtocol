import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyReply, FastifyRequest } from "fastify";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "..", "..", "..", "..", "..");
const studioAssetsDir = resolve(repoRoot, "packages", "berryapi", "src", "modules", "studio", "assets");
const studioAppDistDir = resolve(repoRoot, "packages", "studio", "dist");
const studioAppAssetsDir = join(studioAppDistDir, "assets");

const assetMimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const getAssetPath = (assetName: string) => {
  const normalized = assetName.replace(/[^a-zA-Z0-9._-]/g, "");
  return join(studioAssetsDir, normalized);
};

const sendFile = async (reply: FastifyReply, filePath: string) => {
  const extension = extname(filePath).toLowerCase();
  const file = await readFile(filePath);
  reply.type(assetMimeTypes[extension] ?? "application/octet-stream").send(file);
};

const sendLegacyAsset = async (reply: FastifyReply, assetName: string) => {
  await sendFile(reply, getAssetPath(assetName));
};

export const registerStudioRoutes = async (app: any) => {
  const sendStudioIndex = async (reply: FastifyReply) => {
    if (existsSync(join(studioAppDistDir, "index.html"))) {
      await sendFile(reply, join(studioAppDistDir, "index.html"));
      return;
    }

    await sendLegacyAsset(reply, "index.html");
  };

  app.get("/studio", async (_request: FastifyRequest, reply: FastifyReply) => {
    await sendStudioIndex(reply);
  });

  app.get("/studio/assets/:assetName", async (request: FastifyRequest<{ Params: { assetName: string } }>, reply: FastifyReply) => {
    const normalized = request.params.assetName.replace(/[^a-zA-Z0-9._-]/g, "");
    const builtAssetPath = join(studioAppAssetsDir, normalized);
    if (existsSync(builtAssetPath)) {
      await sendFile(reply, builtAssetPath);
      return;
    }

    await sendLegacyAsset(reply, normalized);
  });

  app.get("/studio/favicon.svg", async (_request: FastifyRequest, reply: FastifyReply) => {
    const builtAssetPath = join(studioAppDistDir, "favicon.svg");
    if (existsSync(builtAssetPath)) {
      await sendFile(reply, builtAssetPath);
      return;
    }

    await sendLegacyAsset(reply, "favicon.svg");
  });

  app.get("/favicon.ico", async (_request: FastifyRequest, reply: FastifyReply) => {
    const builtAssetPath = join(studioAppDistDir, "favicon.svg");
    if (existsSync(builtAssetPath)) {
      await sendFile(reply, builtAssetPath);
      return;
    }

    await sendLegacyAsset(reply, "favicon.svg");
  });

  app.get("/studio/:assetName", async (request: FastifyRequest<{ Params: { assetName: string } }>, reply: FastifyReply) => {
    const normalized = request.params.assetName.replace(/[^a-zA-Z0-9._-]/g, "");
    const builtAssetPath = join(studioAppDistDir, normalized);
    if (existsSync(builtAssetPath)) {
      await sendFile(reply, builtAssetPath);
      return;
    }

    await sendLegacyAsset(reply, normalized);
  });

  app.get("/studio/*", async (_request: FastifyRequest, reply: FastifyReply) => {
    await sendStudioIndex(reply);
  });
};
