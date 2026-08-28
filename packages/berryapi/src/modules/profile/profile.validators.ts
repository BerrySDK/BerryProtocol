import { z } from "zod";

export const instanceNameParamsSchema = z.object({
  instanceName: z.string().min(1),
});

export const profileJidBodySchema = z.object({
  jid: z.string().optional(),
});

export const updateNameBodySchema = z.object({
  name: z.string().min(1),
});

export const updateStatusBodySchema = z.object({
  status: z.string().min(1),
});

export const updatePrivacySettingsBodySchema = z.object({
  readReceipts: z.boolean().optional(),
  lastSeen: z.enum(["everyone", "contacts", "nobody"]).optional(),
  profilePhoto: z.enum(["everyone", "contacts", "nobody"]).optional(),
  online: z.enum(["everyone", "contacts", "nobody"]).optional(),
});

export const updatePictureBodySchema = z.object({
  url: z.string().url().optional(),
  path: z.string().optional(),
  base64: z.string().optional(),
}).refine((value) => value.url || value.path || value.base64, "url, path or base64 is required.");
