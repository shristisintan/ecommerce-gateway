import crypto from "node:crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

import { env } from "../config/env";
import { UserRole } from "../models/user.model";

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  tenantId: string | null;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export const generateAccessToken = (
  payload: AccessTokenPayload
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
): JwtPayload => {
  return jwt.verify(
    token,
    env.JWT_ACCESS_SECRET
  ) as JwtPayload;
};

export const verifyRefreshToken = (
  token: string
): JwtPayload => {
  return jwt.verify(
    token,
    env.JWT_REFRESH_SECRET
  ) as JwtPayload;
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