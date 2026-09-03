import {
  NextFunction,
  Request,
  Response,
} from "express";

import { verifyAccessToken } from "../utils/jwt";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  const token = authorization.substring(7);

  try {
    const payload = verifyAccessToken(token);

    req.auth = {
      userId: payload.userId,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};