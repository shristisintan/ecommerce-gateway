import {
  Schema,
  Types,
  model,
} from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
}

export interface ICart {
  buyerId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema =
  new Schema<ICartItem>(
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
    {
      _id: false,
    }
  );

const cartSchema = new Schema<ICart>(
  {
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Cart = model<ICart>(
  "Cart",
  cartSchema
);