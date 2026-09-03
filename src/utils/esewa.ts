import crypto from "node:crypto";

import { env } from "../config/env";
import { AppError } from "./AppError";

export interface EsewaSuccessPayload {
  [key: string]: unknown;

  status?: string;

  signature?: string;

  transaction_code?: string;

  total_amount?:
    | string
    | number;

  transaction_uuid?: string;

  product_code?: string;

  signed_field_names?: string;
}

export interface EsewaStatusResult {
  status: string;

  productCode:
    | string
    | null;

  transactionUuid:
    | string
    | null;

  totalAmount: number;

  refId:
    | string
    | null;

  raw: Record<
    string,
    unknown
  >;
}

const hmacBase64 = (
  message: string
): string => {
  return crypto
    .createHmac(
      "sha256",
      env.ESEWA_SECRET_KEY
    )
    .update(message)
    .digest("base64");
};

export const formatEsewaAmount = (
  amount: number
): string => {
  return amount.toFixed(2);
};

/*
 * Generate signature for the
 * payment request sent to eSewa.
 */
export const generateEsewaRequestSignature =
  (
    totalAmount: string,
    transactionUuid: string
  ): string => {
    const message =
      `total_amount=${totalAmount},` +
      `transaction_uuid=${transactionUuid},` +
      `product_code=${env.ESEWA_PRODUCT_CODE}`;

    return hmacBase64(
      message
    );
  };

/*
 * Decode Base64 response returned
 * by eSewa after payment.
 */
export const decodeEsewaResponse =
  (
    encodedData: string
  ): EsewaSuccessPayload => {
    try {
      let normalized =
        encodedData.trim();

      /*
       * Handle URL-encoded data
       * if it reaches backend in
       * encoded form.
       */
      if (
        normalized.includes("%")
      ) {
        try {
          normalized =
            decodeURIComponent(
              normalized
            );
        } catch {
          // Keep original value.
        }
      }

      /*
       * Restore Base64 characters.
       *
       * A "+" may sometimes become
       * a space while traveling
       * through a query string.
       */
      normalized = normalized
        .replace(/ /g, "+")
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .replace(/\r?\n/g, "");

      /*
       * Restore missing Base64
       * padding if necessary.
       */
      while (
        normalized.length %
          4 !==
        0
      ) {
        normalized += "=";
      }

      const decoded =
        Buffer.from(
          normalized,
          "base64"
        )
          .toString("utf8")
          .replace(
            /^\uFEFF/,
            ""
          )
          .trim();

      const parsed =
        JSON.parse(decoded);

      if (
        !parsed ||
        typeof parsed !==
          "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          "Decoded response is invalid"
        );
      }

      return parsed as EsewaSuccessPayload;
    } catch {
      throw new AppError(
        400,
        "Invalid eSewa response data"
      );
    }
  };

/*
 * Verify the signature contained
 * inside eSewa's success response.
 */
export const verifyEsewaResponseSignature =
  (
    payload: EsewaSuccessPayload
  ): boolean => {
    if (
      !payload.signature ||
      typeof payload.signature !==
        "string" ||
      !payload.signed_field_names ||
      typeof payload.signed_field_names !==
        "string"
    ) {
      return false;
    }

    const signedFields =
      payload.signed_field_names
        .split(",")
        .map((field) =>
          field.trim()
        )
        .filter(Boolean);

    if (
      signedFields.length === 0
    ) {
      return false;
    }

    const message =
      signedFields
        .map((field) => {
          const value =
            payload[field];

          if (
            value ===
              undefined ||
            value === null
          ) {
            throw new AppError(
              400,
              `Missing signed field: ${field}`
            );
          }

          return `${field}=${String(
            value
          )}`;
        })
        .join(",");

    const expectedSignature =
      hmacBase64(message);

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        payload.signature,
        "utf8"
      );

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );
  };

/*
 * Check transaction directly
 * with eSewa's server.
 */
export const checkEsewaStatus =
  async (
    transactionUuid: string,
    totalAmount: string
  ): Promise<EsewaStatusResult> => {
    try {
      const url =
        new URL(
          env.ESEWA_STATUS_URL
        );

      url.searchParams.set(
        "product_code",
        env.ESEWA_PRODUCT_CODE
      );

      url.searchParams.set(
        "total_amount",
        totalAmount
      );

      url.searchParams.set(
        "transaction_uuid",
        transactionUuid
      );

      const response =
        await fetch(
          url.toString(),
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",
            },
          }
        );

      if (!response.ok) {
        throw new AppError(
          502,
          "Unable to verify payment with eSewa"
        );
      }

      const raw =
        (await response.json()) as Record<
          string,
          unknown
        >;

      const status =
        String(
          raw.status ?? ""
        );

      const productCode =
        raw.product_code ??
        raw.scd ??
        null;

      const transactionUuidValue =
        raw.transaction_uuid ??
        raw.pid ??
        null;

      const amount =
        raw.total_amount ??
        raw.totalAmount ??
        0;

      const refId =
        raw.ref_id ??
        raw.refId ??
        raw.transaction_code ??
        null;

      return {
        status,

        productCode:
          productCode === null
            ? null
            : String(
                productCode
              ),

        transactionUuid:
          transactionUuidValue ===
          null
            ? null
            : String(
                transactionUuidValue
              ),

        totalAmount:
          Number(amount),

        refId:
          refId === null
            ? null
            : String(
                refId
              ),

        raw,
      };
    } catch (error) {
      if (
        error instanceof
        AppError
      ) {
        throw error;
      }

      console.error(
        "eSewa status check error:",
        error
      );

      throw new AppError(
        502,
        "Unable to verify payment with eSewa"
      );
    }
  };