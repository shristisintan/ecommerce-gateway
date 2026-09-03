import {
  ErrorRequestHandler,
} from "express";

import { AppError } from "../utils/AppError";

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
): void => {
  console.error(error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });

    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};