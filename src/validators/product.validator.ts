import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    categoryId: z
      .string()
      .min(1, "Category is required"),

    name: z
      .string()
      .trim()
      .min(2)
      .max(180),

    slug: z
      .string()
      .trim()
      .min(2)
      .max(180)
      .regex(
        /^[a-z0-9-]+$/,
        "Slug may contain lowercase letters, numbers and hyphens only"
      ),

    description: z
      .string()
      .trim()
      .min(5)
      .max(5000),

    price: z.coerce
      .number()
      .min(0),

    stock: z.coerce
      .number()
      .int()
      .min(0),

    images: z
      .array(z.string().url())
      .default([]),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    categoryId: z
      .string()
      .min(1)
      .optional(),

    name: z
      .string()
      .trim()
      .min(2)
      .max(180)
      .optional(),

    slug: z
      .string()
      .trim()
      .min(2)
      .max(180)
      .regex(/^[a-z0-9-]+$/)
      .optional(),

    description: z
      .string()
      .trim()
      .min(5)
      .max(5000)
      .optional(),

    price: z.coerce
      .number()
      .min(0)
      .optional(),

    stock: z.coerce
      .number()
      .int()
      .min(0)
      .optional(),

    images: z
      .array(z.string().url())
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  }),
});