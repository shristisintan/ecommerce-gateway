import mongoose, {
  ClientSession,
} from "mongoose";

import { Tenant } from "../models/tenant.model";
import {
  User,
  UserDocument,
} from "../models/user.model";
import { RefreshToken } from "../models/refreshToken.model";

import { AppError } from "../utils/AppError";

import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenId,
  getTokenExpiry,
  hashToken,
  verifyRefreshToken,
} from "../utils/jwt";

interface BuyerRegisterInput {
  name: string;
  email: string;
  password: string;
}

interface MerchantRegisterInput {
  name: string;
  email: string;
  password: string;
  storeName: string;
  storeSlug: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const publicUser = (user: UserDocument) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  tenantId: user.tenantId?.toString() ?? null,
  isActive: user.isActive,
});

const createTokenPair = (
  user: UserDocument
) => {
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
    tenantId:
      user.tenantId?.toString() ?? null,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    tokenId: generateTokenId(),
  });

  return {
    accessToken,
    refreshToken,
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiresAt:
      getTokenExpiry(refreshToken),
  };
};

const saveRefreshToken = async (
  userId: mongoose.Types.ObjectId,
  tokenHash: string,
  expiresAt: Date,
  session?: ClientSession
): Promise<void> => {
  const refreshToken = new RefreshToken({
    userId,
    tokenHash,
    expiresAt,
  });

  await refreshToken.save({
    session,
  });
};

export const registerBuyer = async (
  input: BuyerRegisterInput
) => {
  const existingUser = await User.findOne({
    email: input.email,
  });

  if (existingUser) {
    throw new AppError(
      409,
      "An account with this email already exists"
    );
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    role: "BUYER",
    tenantId: null,
  });

  const tokens = createTokenPair(user);

  await saveRefreshToken(
    user._id,
    tokens.refreshTokenHash,
    tokens.refreshTokenExpiresAt
  );

  return {
    user: publicUser(user),
    ...tokens,
  };
};

export const registerMerchant = async (
  input: MerchantRegisterInput
) => {
  const session = await mongoose.startSession();

  let result:
    | {
        user: ReturnType<typeof publicUser>;
        accessToken: string;
        refreshToken: string;
        refreshTokenHash: string;
        refreshTokenExpiresAt: Date;
      }
    | undefined;

  try {
    await session.withTransaction(async () => {
      const existingUser = await User.findOne({
        email: input.email,
      }).session(session);

      if (existingUser) {
        throw new AppError(
          409,
          "An account with this email already exists"
        );
      }

      const existingTenant = await Tenant.findOne({
        slug: input.storeSlug,
      }).session(session);

      if (existingTenant) {
        throw new AppError(
          409,
          "This store slug is already in use"
        );
      }

      const tenant = new Tenant({
        name: input.storeName,
        slug: input.storeSlug,
        isActive: true,
      });

      await tenant.save({ session });

      const user = new User({
        name: input.name,
        email: input.email,
        password: input.password,
        role: "MERCHANT",
        tenantId: tenant._id,
      });

      await user.save({ session });

      const tokens = createTokenPair(user);

      await saveRefreshToken(
        user._id,
        tokens.refreshTokenHash,
        tokens.refreshTokenExpiresAt,
        session
      );

      result = {
        user: publicUser(user),
        ...tokens,
      };
    });

    if (!result) {
      throw new AppError(
        500,
        "Merchant registration failed"
      );
    }

    return result;
  } finally {
    await session.endSession();
  }
};

export const login = async (
  input: LoginInput
) => {
  const user = await User.findOne({
    email: input.email,
  }).select("+password");

  if (!user) {
    throw new AppError(
      401,
      "Invalid email or password"
    );
  }

  if (!user.isActive) {
    throw new AppError(
      403,
      "This account is inactive"
    );
  }

  const validPassword =
    await user.comparePassword(input.password);

  if (!validPassword) {
    throw new AppError(
      401,
      "Invalid email or password"
    );
  }

  const tokens = createTokenPair(user);

  await saveRefreshToken(
    user._id,
    tokens.refreshTokenHash,
    tokens.refreshTokenExpiresAt
  );

  return {
    user: publicUser(user),
    ...tokens,
  };
};

export const rotateRefreshToken = async (
  rawRefreshToken: string
) => {
  let payload;

  try {
    payload =
      verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AppError(
      401,
      "Invalid or expired refresh token"
    );
  }

  const currentHash =
    hashToken(rawRefreshToken);

  const storedToken =
    await RefreshToken.findOne({
      tokenHash: currentHash,
    });

  if (!storedToken) {
    throw new AppError(
      401,
      "Refresh token not recognized"
    );
  }

  // Detect reuse of an already rotated/revoked token.
  if (storedToken.revokedAt) {
    await RefreshToken.updateMany(
      {
        userId: storedToken.userId,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      }
    );

    throw new AppError(
      401,
      "Refresh token reuse detected. Please login again."
    );
  }

  if (storedToken.expiresAt <= new Date()) {
    throw new AppError(
      401,
      "Refresh token has expired"
    );
  }

  if (
    storedToken.userId.toString() !==
    payload.userId
  ) {
    throw new AppError(
      401,
      "Invalid refresh token"
    );
  }

  const user =
    await User.findById(storedToken.userId);

  if (!user || !user.isActive) {
    throw new AppError(
      401,
      "User account is unavailable"
    );
  }

  const newTokens = createTokenPair(user);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await saveRefreshToken(
        user._id,
        newTokens.refreshTokenHash,
        newTokens.refreshTokenExpiresAt,
        session
      );

      const updateResult =
        await RefreshToken.updateOne(
          {
            _id: storedToken._id,
            revokedAt: null,
          },
          {
            $set: {
              revokedAt: new Date(),
              replacedByTokenHash:
                newTokens.refreshTokenHash,
            },
          },
          {
            session,
          }
        );

      if (updateResult.modifiedCount !== 1) {
        throw new AppError(
          401,
          "Refresh token has already been used"
        );
      }
    });
  } finally {
    await session.endSession();
  }

  return {
    user: publicUser(user),
    ...newTokens,
  };
};

export const logout = async (
  rawRefreshToken?: string
): Promise<void> => {
  if (!rawRefreshToken) {
    return;
  }

  const tokenHash =
    hashToken(rawRefreshToken);

  await RefreshToken.updateOne(
    {
      tokenHash,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    }
  );
};

export const getCurrentUser = async (
  userId: string
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(
      404,
      "User not found"
    );
  }

  return publicUser(user);
};