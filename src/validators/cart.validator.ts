import { z } from "zod";

export const addToCartSchema = z.object({
  body: z.object({
    productId: z
      .string()
      .min(1, "Product is required"),

    quantity: z.coerce
      .number()
      .int()
      .min(1)
      .max(100),
  }),
});

export const updateCartItemSchema =
  z.object({
    body: z.object({
      quantity: z.coerce
        .number()
        .int()
        .min(1)
        .max(100),
    }),
  });