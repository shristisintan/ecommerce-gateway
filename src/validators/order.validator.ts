import { z } from "zod";

export const createOrderSchema =
  z.object({
    body: z.object({
      shippingAddress: z.object({
        fullName: z
          .string()
          .trim()
          .min(2)
          .max(120),

        phone: z
          .string()
          .trim()
          .min(7)
          .max(20),

        addressLine: z
          .string()
          .trim()
          .min(3)
          .max(250),

        city: z
          .string()
          .trim()
          .min(2)
          .max(100),

        country: z
          .string()
          .trim()
          .min(2)
          .max(100)
          .default("Nepal"),
      }),
    }),
  });