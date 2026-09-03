import mongoose, {
  Types,
} from "mongoose";

import { env } from "../config/env";

import { Order } from "../models/order.model";
import { Payment } from "../models/payment.model";
import { Product } from "../models/product.model";

import { AppError } from "../utils/AppError";

import {
  checkEsewaStatus,
  decodeEsewaResponse,
  formatEsewaAmount,
  generateEsewaRequestSignature,
  verifyEsewaResponseSignature,
} from "../utils/esewa";

const validateId = (
  id: string,
  message: string
): void => {
  if (
    !Types.ObjectId.isValid(
      id
    )
  ) {
    throw new AppError(
      400,
      message
    );
  }
};

const buildPaymentRequest = (
  payment: {
    _id: Types.ObjectId;
    transactionUuid: string;
    amount: number;
  }
) => {
  const totalAmount =
    formatEsewaAmount(
      payment.amount
    );

  const signature =
    generateEsewaRequestSignature(
      totalAmount,
      payment.transactionUuid
    );

  return {
    paymentId:
      payment._id.toString(),

    transactionUuid:
      payment.transactionUuid,

    paymentUrl:
      env.ESEWA_PAYMENT_URL,

    formData: {
      amount:
        totalAmount,

      tax_amount:
        "0",

      total_amount:
        totalAmount,

      transaction_uuid:
        payment.transactionUuid,

      product_code:
        env.ESEWA_PRODUCT_CODE,

      product_service_charge:
        "0",

      product_delivery_charge:
        "0",

      success_url:
        env.ESEWA_SUCCESS_URL,

      failure_url:
        env.ESEWA_FAILURE_URL,

      signed_field_names:
        "total_amount,transaction_uuid,product_code",

      signature,
    },
  };
};

export const initiateEsewaPayment =
  async (
    buyerId: string,
    orderId: string
  ) => {
    validateId(
      buyerId,
      "Invalid buyer ID"
    );

    validateId(
      orderId,
      "Invalid order ID"
    );

    const order =
      await Order.findOne({
        _id: orderId,
        buyerId,
      });

    if (!order) {
      throw new AppError(
        404,
        "Order not found"
      );
    }

    if (
      order.paymentStatus ===
      "PAID"
    ) {
      throw new AppError(
        409,
        "Order has already been paid"
      );
    }

    /*
     * Prevent duplicate active
     * payment attempts.
     */
    const existing =
      await Payment.findOne({
        orderId,
        status:
          "INITIATED",
      }).sort({
        createdAt: -1,
      });

    if (existing) {
      return {
        reused: true,
        ...buildPaymentRequest(
          existing
        ),
      };
    }

    /*
     * Retry after a failed
     * payment is allowed.
     */
    if (
      order.paymentStatus ===
      "FAILED"
    ) {
      order.paymentStatus =
        "PENDING";

      order.orderStatus =
        "PENDING_PAYMENT";

      await order.save();
    }

    const transactionUuid =
      `ESEWA-${order._id.toString()}-${Date.now()}`;

    let payment;

    try {
      payment =
        await Payment.create({
          orderId:
            order._id,

          buyerId:
            order.buyerId,

          provider:
            "ESEWA",

          transactionUuid,

          amount:
            order.totalAmount,

          status:
            "INITIATED",
        });
    } catch (error) {
      /*
       * Covers two simultaneous
       * initiate requests.
       */
      if (
        typeof error ===
          "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        const active =
          await Payment.findOne({
            orderId,
            status:
              "INITIATED",
          });

        if (active) {
          return {
            reused: true,
            ...buildPaymentRequest(
              active
            ),
          };
        }
      }

      throw error;
    }

    return {
      reused: false,

      ...buildPaymentRequest(
        payment
      ),
    };
  };

const completePayment =
  async (
    transactionUuid: string,
    refId: string | null,
    responseSignature:
      | string
      | null
  ) => {
    const session =
      await mongoose.startSession();

    let paymentId:
      | Types.ObjectId
      | undefined;

    let orderId:
      | Types.ObjectId
      | undefined;

    try {
      await session.withTransaction(
        async () => {
          const payment =
            await Payment.findOne({
              transactionUuid,
            }).session(
              session
            );

          if (!payment) {
            throw new AppError(
              404,
              "Payment transaction not found"
            );
          }

          paymentId =
            payment._id;

          orderId =
            payment.orderId;

          /*
           * Idempotency:
           * repeated callback does
           * nothing.
           */
          if (
            payment.status ===
            "COMPLETE"
          ) {
            return;
          }

          const order =
            await Order.findById(
              payment.orderId
            ).session(
              session
            );

          if (!order) {
            throw new AppError(
              404,
              "Order not found"
            );
          }

          if (
            Number(
              order.totalAmount.toFixed(
                2
              )
            ) !==
            Number(
              payment.amount.toFixed(
                2
              )
            )
          ) {
            throw new AppError(
              400,
              "Payment amount does not match order amount"
            );
          }

          if (
            order.paymentStatus ===
            "PAID"
          ) {
            throw new AppError(
              409,
              "Order has already been paid"
            );
          }

          /*
           * Atomic stock deduction.
           *
           * Every update participates
           * in this MongoDB transaction.
           */
          for (
            const item of
            order.items
          ) {
            const result =
              await Product.updateOne(
                {
                  _id:
                    item.productId,

                  isActive:
                    true,

                  stock: {
                    $gte:
                      item.quantity,
                  },
                },

                {
                  $inc: {
                    stock:
                      -item.quantity,
                  },
                },

                {
                  session,
                }
              );

            if (
              result.modifiedCount !==
              1
            ) {
              throw new AppError(
                409,
                `Insufficient stock for ${item.productName}`
              );
            }
          }

          payment.status =
            "COMPLETE";

          payment.refId =
            refId;

          payment.responseSignature =
            responseSignature;

          payment.failureReason =
            null;

          payment.verifiedAt =
            new Date();

          await payment.save({
            session,
          });

          order.paymentStatus =
            "PAID";

          order.orderStatus =
            "PAID";

          await order.save({
            session,
          });
        }
      );

      if (
        !paymentId ||
        !orderId
      ) {
        throw new AppError(
          500,
          "Payment completion failed"
        );
      }

      const [
        payment,
        order,
      ] =
        await Promise.all([
          Payment.findById(
            paymentId
          ),

          Order.findById(
            orderId
          ),
        ]);

      return {
        payment,
        order,
      };
    } finally {
      await session.endSession();
    }
  };

const markPaymentFailed =
  async (
    paymentId: Types.ObjectId,
    reason: string
  ) => {
    const payment =
      await Payment.findOneAndUpdate(
        {
          _id:
            paymentId,

          status:
            "INITIATED",
        },

        {
          $set: {
            status:
              "FAILED",

            failureReason:
              reason,
          },
        },

        {
          new: true,
        }
      );

    if (payment) {
      await Order.updateOne(
        {
          _id:
            payment.orderId,

          paymentStatus: {
            $ne: "PAID",
          },
        },

        {
          $set: {
            paymentStatus:
              "FAILED",

            orderStatus:
              "PAYMENT_FAILED",
          },
        }
      );
    }

    return payment;
  };

export const verifyEsewaPayment =
  async (
    encodedData: string
  ) => {
    const payload =
      decodeEsewaResponse(
        encodedData
      );

    if (
      !verifyEsewaResponseSignature(
        payload
      )
    ) {
      throw new AppError(
        400,
        "Invalid eSewa response signature"
      );
    }

    if (
      payload.status !==
      "COMPLETE"
    ) {
      throw new AppError(
        400,
        "eSewa payment is not complete"
      );
    }

    if (
      payload.product_code !==
      env.ESEWA_PRODUCT_CODE
    ) {
      throw new AppError(
        400,
        "Invalid eSewa product code"
      );
    }

    if (
      typeof payload.transaction_uuid !==
      "string"
    ) {
      throw new AppError(
        400,
        "Missing transaction UUID"
      );
    }

    const payment =
      await Payment.findOne({
        transactionUuid:
          payload.transaction_uuid,
      });

    if (!payment) {
      throw new AppError(
        404,
        "Payment transaction not found"
      );
    }

    const callbackAmount =
      Number(
        payload.total_amount
      );

    if (
      Number.isNaN(
        callbackAmount
      ) ||
      Number(
        callbackAmount.toFixed(
          2
        )
      ) !==
        Number(
          payment.amount.toFixed(
            2
          )
        )
    ) {
      throw new AppError(
        400,
        "Payment amount mismatch"
      );
    }

    /*
     * Do not trust only the
     * browser callback.
     *
     * Ask eSewa server directly.
     */
    const status =
      await checkEsewaStatus(
        payment.transactionUuid,
        formatEsewaAmount(
          payment.amount
        )
      );

    if (
      status.status !==
      "COMPLETE"
    ) {
      throw new AppError(
        400,
        "eSewa could not confirm the payment"
      );
    }

    if (
      status.productCode &&
      status.productCode !==
        env.ESEWA_PRODUCT_CODE
    ) {
      throw new AppError(
        400,
        "eSewa status product code mismatch"
      );
    }

    if (
      status.transactionUuid &&
      status.transactionUuid !==
        payment.transactionUuid
    ) {
      throw new AppError(
        400,
        "eSewa transaction UUID mismatch"
      );
    }

    if (
      Number(
        status.totalAmount.toFixed(
          2
        )
      ) !==
      Number(
        payment.amount.toFixed(
          2
        )
      )
    ) {
      throw new AppError(
        400,
        "eSewa verified amount mismatch"
      );
    }

    return completePayment(
      payment.transactionUuid,

      status.refId ??
        (typeof payload.transaction_code ===
        "string"
          ? payload.transaction_code
          : null),

      typeof payload.signature ===
        "string"
        ? payload.signature
        : null
    );
  };

export const checkOrderPaymentStatus =
  async (
    buyerId: string,
    orderId: string
  ) => {
    validateId(
      buyerId,
      "Invalid buyer ID"
    );

    validateId(
      orderId,
      "Invalid order ID"
    );

    const payment =
      await Payment.findOne({
        orderId,
        buyerId,
      }).sort({
        createdAt: -1,
      });

    if (!payment) {
      throw new AppError(
        404,
        "Payment attempt not found"
      );
    }

    if (
      payment.status ===
      "COMPLETE"
    ) {
      return {
        status:
          "COMPLETE",

        payment,
      };
    }

    const status =
      await checkEsewaStatus(
        payment.transactionUuid,

        formatEsewaAmount(
          payment.amount
        )
      );

    if (
      status.status ===
      "COMPLETE"
    ) {
      return completePayment(
        payment.transactionUuid,
        status.refId,
        null
      );
    }

    if (
      [
        "CANCELED",
        "NOT_FOUND",
        "FAILED",
      ].includes(
        status.status
      )
    ) {
      const failed =
        await markPaymentFailed(
          payment._id,
          status.status
        );

      return {
        status:
          status.status,

        payment:
          failed,
      };
    }

    return {
      status:
        status.status,

      payment,
    };
  };