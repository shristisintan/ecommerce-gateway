import {
  Request,
  Response,
} from "express";

import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

import * as authService from "../services/auth.service";

const setRefreshCookie = (
  res: Response,
  token: string,
  expiresAt: Date
): void => {
  res.cookie(
    "refreshToken",
    token,
    {
      httpOnly: true,
      secure:
        env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/api/v1/auth",
    }
  );
};

const authResponse = (
  res: Response,
  statusCode: number,
  message: string,
  result: Awaited<
    ReturnType<typeof authService.login>
  >
): void => {
  setRefreshCookie(
    res,
    result.refreshToken,
    result.refreshTokenExpiresAt
  );

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
};

export const registerBuyer = asyncHandler(
  async (req, res) => {
    const result =
      await authService.registerBuyer(
        req.body
      );

    authResponse(
      res,
      201,
      "Buyer registered successfully",
      result
    );
  }
);

export const registerMerchant = asyncHandler(
  async (req, res) => {
    const result =
      await authService.registerMerchant(
        req.body
      );

    authResponse(
      res,
      201,
      "Merchant registered successfully",
      result
    );
  }
);

export const login = asyncHandler(
  async (req, res) => {
    const result =
      await authService.login(req.body);

    authResponse(
      res,
      200,
      "Login successful",
      result
    );
  }
);

export const refresh = asyncHandler(
  async (req, res) => {
    const refreshToken =
      req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new AppError(
        401,
        "Refresh token is required"
      );
    }

    const result =
      await authService.rotateRefreshToken(
        refreshToken
      );

    authResponse(
      res,
      200,
      "Token refreshed successfully",
      result
    );
  }
);

export const logout = asyncHandler(
  async (req, res) => {
    const refreshToken =
      req.cookies?.refreshToken;

    await authService.logout(
      refreshToken
    );

    res.clearCookie(
      "refreshToken",
      {
        httpOnly: true,
        secure:
          env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/v1/auth",
      }
    );

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }
);

export const me = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) {
      throw new AppError(
        401,
        "Authentication required"
      );
    }

    const user =
      await authService.getCurrentUser(
        req.auth.userId
      );

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);