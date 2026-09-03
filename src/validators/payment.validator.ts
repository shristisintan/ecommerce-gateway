import { z } from "zod";

export const initiateEsewaSchema =
  z.object({
    body: z.object({
      orderId: z
        .string()
        .min(
          1,
          "Order ID is required"
        ),
    }),
  });

export const verifyEsewaSchema =
  z.object({
    body: z.object({
      data: z
        .string()
        .min(
          1,
          "eSewa response data is required"
        ),
    }),
  });