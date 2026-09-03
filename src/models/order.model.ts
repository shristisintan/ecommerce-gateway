import {
  Schema,
  Types,
  model,
} from "mongoose";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED";

export interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  country: string;
}

export interface IOrderItem {
  productId: Types.ObjectId;
  tenantId: Types.ObjectId;

  productName: string;

  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface IOrder {
  buyerId: Types.ObjectId;

  items: IOrderItem[];

  shippingAddress: IShippingAddress;

  totalAmount: number;

  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;

  createdAt: Date;
  updatedAt: Date;
}

const shippingAddressSchema =
  new Schema<IShippingAddress>(
    {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      addressLine: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      country: {
        type: String,
        required: true,
        trim: true,
        default: "Nepal",
      },
    },
    {
      _id: false,
    }
  );

const orderItemSchema =
  new Schema<IOrderItem>(
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },

      tenantId: {
        type: Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
      },

      productName: {
        type: String,
        required: true,
      },

      unitPrice: {
        type: Number,
        required: true,
        min: 0,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },

      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      _id: false,
    }
  );

const orderSchema = new Schema<IOrder>(
  {
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (
          items: IOrderItem[]
        ) => items.length > 0,
        message:
          "Order must contain at least one item",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    orderStatus: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "PAID",
        "PROCESSING",
        "COMPLETED",
        "CANCELLED",
        "PAYMENT_FAILED",
      ],
      default: "PENDING_PAYMENT",
    },

    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
      ],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  buyerId: 1,
  createdAt: -1,
});

orderSchema.index({
  "items.tenantId": 1,
  createdAt: -1,
});

orderSchema.index({
  paymentStatus: 1,
});

export const Order = model<IOrder>(
  "Order",
  orderSchema
);