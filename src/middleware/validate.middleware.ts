import {
  NextFunction,
  Request,
  Response,
} from "express";
import { ZodType } from "zod";

export const validate =
  (schema: ZodType) =>
  (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const result = schema.safeParse({
      body: req.body,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });

      return;
    }

    const data = result.data as {
      body?: unknown;
    };

    if (data.body) {
      req.body = data.body;
    }

    next();
  };