import { Schema, model } from "mongoose";

const tenantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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

tenantSchema.index({ slug: 1 }, { unique: true });

export const Tenant = model("Tenant", tenantSchema);