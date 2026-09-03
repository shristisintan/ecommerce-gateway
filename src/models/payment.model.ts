import {
  Schema,
  Types,
  model,
} from "mongoose";

export type PaymentProvider =
  "ESEWA";

export type PaymentStatus =
  | "INITIATED"
  | "COMPLETE"
  | "FAILED";

export interface IPayment {
  orderId: Types.ObjectId;
  buyerId: Types.ObjectId;

  provider: PaymentProvider;

  transactionUuid: string;

  amount: number;

  status: PaymentStatus;

  refId?: string | null;

  responseSignature?: string | null;

  failureReason?: string | null;

  verifiedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema =
  new Schema<IPayment>(
    {
      orderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true,
      },

      buyerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      provider: {
        type: String,
        enum: ["ESEWA"],
        required: true,
        default: "ESEWA",
      },

      transactionUuid: {
        type: String,
        required: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      status: {
        type: String,
        enum: [
          "INITIATED",
          "COMPLETE",
          "FAILED",
        ],
        required: true,
        default: "INITIATED",
      },

      refId: {
        type: String,
        default: null,
      },

      responseSignature: {
        type: String,
        default: null,
      },

      failureReason: {
        type: String,
        default: null,
      },

      verifiedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

paymentSchema.index(
  {
    transactionUuid: 1,
  },
  {
    unique: true,
  }
);

paymentSchema.index({
  buyerId: 1,
  createdAt: -1,
});

paymentSchema.index({
  orderId: 1,
  createdAt: -1,
});

/*
 * Only one active payment attempt
 * may exist for an order.
 */
paymentSchema.index(
  {
    orderId: 1,
    status: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      status: "INITIATED",
    },
  }
);

export const Payment =
  model<IPayment>(
    "Payment",
    paymentSchema
  );