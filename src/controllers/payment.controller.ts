import {
  Request,
  Response,
} from "express";

import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";
import * as paymentService from "../services/payment.service";

const getBuyerId = (
  req: Request
): string => {
  if (!req.auth?.userId) {
    throw new AppError(
      401,
      "Authentication required"
    );
  }

  return req.auth.userId;
};

const getParam = (
  value:
    | string
    | string[]
    | undefined
): string => {
  if (
    !value ||
    Array.isArray(value)
  ) {
    throw new AppError(
      400,
      "Invalid request parameter"
    );
  }

  return value;
};

export const initiateEsewa =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await paymentService
          .initiateEsewaPayment(
            getBuyerId(req),
            req.body.orderId
          );

      res.status(200).json({
        success: true,

        message:
          result.reused
            ? "Existing eSewa payment attempt returned"
            : "eSewa payment initiated successfully",

        data:
          result,
      });
    }
  );

export const verifyEsewa =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await paymentService
          .verifyEsewaPayment(
            req.body.data
          );

      res.status(200).json({
        success: true,
        message:
          "Payment verified successfully",
        data:
          result,
      });
    }
  );

export const checkEsewaStatus =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const orderId =
        getParam(
          req.params.orderId
        );

      const result =
        await paymentService
          .checkOrderPaymentStatus(
            getBuyerId(req),
            orderId
          );

      res.status(200).json({
        success: true,
        data:
          result,
      });
    }
  );

  export const esewaCallback =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const data =
        typeof req.query.data ===
        "string"
          ? req.query.data
          : null;

      if (!data) {
        return res.redirect(
          `${env.CLIENT_URL}/payment/failure?reason=missing_payment_data`
        );
      }

      await paymentService
        .verifyEsewaPayment(
          data
        );

      return res.redirect(
        `${env.CLIENT_URL}/payment/success?verified=true`
      );
    } catch (error) {
      console.error(
        "eSewa callback error:",
        error
      );

      return res.redirect(
        `${env.CLIENT_URL}/payment/failure?reason=verification_failed`
      );
    }
  };