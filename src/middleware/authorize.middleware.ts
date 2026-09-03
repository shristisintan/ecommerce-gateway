import {
  NextFunction,
  Request,
  Response,
} from "express";

import type { UserRole } from "../models/user.model";

export const authorize =
  (...allowedRoles: UserRole[]) =>
  (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });

      return;
    }

    next();
  };