import { Schema, model } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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

categorySchema.index(
  { slug: 1 },
  { unique: true }
);

categorySchema.index({
  isActive: 1,
  name: 1,
});

export const Category = model<ICategory>(
  "Category",
  categorySchema
);