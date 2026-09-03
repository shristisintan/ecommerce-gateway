import {
  Schema,
  Types,
  model,
} from "mongoose";

export interface IProduct {
  tenantId: Types.ObjectId;
  categoryId: Types.ObjectId;

  name: string;
  slug: string;
  description: string;

  price: number;
  stock: number;

  images: string[];

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    images: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Same slug can exist in different stores,
// but never twice inside one merchant's store.
productSchema.index(
  {
    tenantId: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

// Merchant product table
productSchema.index({
  tenantId: 1,
  createdAt: -1,
});

// Category filtering
productSchema.index({
  categoryId: 1,
  isActive: 1,
});

// Search
productSchema.index({
  name: "text",
  description: "text",
});

export const Product = model<IProduct>(
  "Product",
  productSchema
);