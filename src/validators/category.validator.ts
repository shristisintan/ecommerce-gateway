import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100),

    slug: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(
        /^[a-z0-9-]+$/,
        "Slug may contain lowercase letters, numbers and hyphens only"
      ),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    slug: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9-]+$/)
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  }),
});