import crypto from "node:crypto";
import jwt, {
  JwtPayload,
  SignOptions,
} from "jsonwebtoken";

import { env } from "../config/env";
import type { AuthUser } from "../types/auth";

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export const generateAccessToken = (
  payload: AuthUser
): string => {
  const options: SignOptions = {
    expiresIn:
      env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(
    payload,
    env.JWT_ACCESS_SECRET,
    options
  );
};

export const generateRefreshToken = (
  payload: RefreshTokenPayload
): string => {
  const options: SignOptions = {
    expiresIn:
      env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(
    payload,
    env.JWT_REFRESH_SECRET,
    options
  );
};

export const verifyAccessToken = (
  token: string
): AuthUser & JwtPayload => {
  const decoded = jwt.verify(
    token,
    env.JWT_ACCESS_SECRET
  );

  if (
    typeof decoded === "string" ||
    !decoded.userId ||
    !decoded.role
  ) {
    throw new Error("Invalid access token");
  }

  return decoded as AuthUser & JwtPayload;
};

export const verifyRefreshToken = (
  token: string
): RefreshTokenPayload & JwtPayload => {
  const decoded = jwt.verify(
    token,
    env.JWT_REFRESH_SECRET
  );

  if (
    typeof decoded === "string" ||
    !decoded.userId ||
    !decoded.tokenId
  ) {
    throw new Error("Invalid refresh token");
  }

  return decoded as RefreshTokenPayload & JwtPayload;
};

export const hashToken = (
  token: string
): string => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

export const generateTokenId = (): string => {
  return crypto.randomUUID();
};

export const getTokenExpiry = (
  token: string
): Date => {
  const decoded = jwt.decode(token);

  if (
    !decoded ||
    typeof decoded === "string" ||
    !decoded.exp
  ) {
    throw new Error("Token expiration unavailable");
  }

  return new Date(decoded.exp * 1000);
};