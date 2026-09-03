import { z } from "zod";

export const buyerRegisterSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(120),

    email: z
      .string()
      .trim()
      .email()
      .toLowerCase(),

    password: z
      .string()
      .min(8)
      .max(72),
  }),
});

export const merchantRegisterSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(120),

    email: z
      .string()
      .trim()
      .email()
      .toLowerCase(),

    password: z
      .string()
      .min(8)
      .max(72),

    storeName: z
      .string()
      .trim()
      .min(2)
      .max(120),

    storeSlug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(
        /^[a-z0-9-]+$/,
        "Store slug may contain lowercase letters, numbers and hyphens only"
      ),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email()
      .toLowerCase(),

    password: z
      .string()
      .min(1),
  }),
});