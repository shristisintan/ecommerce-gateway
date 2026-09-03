import bcrypt from "bcrypt";
import {
  HydratedDocument,
  Model,
  Schema,
  Types,
  model,
} from "mongoose";

import { env } from "../config/env";

export type UserRole = "ADMIN" | "MERCHANT" | "BUYER";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  tenantId?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["ADMIN", "MERCHANT", "BUYER"],
      required: true,
      default: "BUYER",
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
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

userSchema.index({ email: 1 }, { unique: true });

userSchema.index({
  tenantId: 1,
  role: 1,
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(
    this.password,
    env.BCRYPT_SALT_ROUNDS
  );
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export type UserDocument = HydratedDocument<
  IUser,
  IUserMethods
>;

export const User = model<IUser, UserModel>(
  "User",
  userSchema
);