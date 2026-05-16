import { z } from "zod";

export const instanceNameParamsSchema = z.object({
  instanceName: z.string().min(1),
});

export const groupJidQuerySchema = z.object({
  jid: z.string().min(1),
});

export const inviteCodeQuerySchema = z.object({
  inviteCode: z.string().min(1),
});

export const createGroupBodySchema = z.object({
  subject: z.string().min(1),
  participants: z.array(z.string().min(1)).min(1),
});

export const updatePictureBodySchema = z.object({
  jid: z.string().min(1),
  url: z.string().url().optional(),
  path: z.string().optional(),
  base64: z.string().optional(),
}).refine((value) => value.url || value.path || value.base64, "url, path or base64 is required.");

export const updateSubjectBodySchema = z.object({
  jid: z.string().min(1),
  subject: z.string().min(1),
});

export const updateDescriptionBodySchema = z.object({
  jid: z.string().min(1),
  description: z.string().optional(),
});

export const groupInviteBodySchema = z.object({
  jid: z.string().min(1),
  inviteCode: z.string().optional(),
  inviteExpiration: z.number().int().positive().optional(),
  groupName: z.string().optional(),
  caption: z.string().optional(),
});

export const updateMembersBodySchema = z.object({
  jid: z.string().min(1),
  participants: z.array(z.string().min(1)).min(1),
  action: z.enum(["add", "remove", "promote", "demote", "approve", "reject"]),
});

export const updateSettingBodySchema = z.object({
  jid: z.string().min(1),
  setting: z.enum(["announcement", "not_announcement", "locked", "unlocked"]),
});

export const toggleEphemeralBodySchema = z.object({
  jid: z.string().min(1),
  expiration: z.number().int().nonnegative(),
});
