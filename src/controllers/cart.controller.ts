import {
  Request,
  Response,
} from "express";

import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

import * as cartService from "../services/cart.service";

const getParam = (
  value:
    | string
    | string[]
    | undefined
): string => {
  if (
    !value ||
    Array.isArray(value)
  ) {
    throw new AppError(
      400,
      "Invalid request parameter"
    );
  }

  return value;
};

const getBuyerId = (
  req: Request
): string => {
  if (!req.auth?.userId) {
    throw new AppError(
      401,
      "Authentication required"
    );
  }

  return req.auth.userId;
};

export const getCart =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const cart =
        await cartService.getCart(
          getBuyerId(req)
        );

      res.status(200).json({
        success: true,
        data: cart,
      });
    }
  );

export const addToCart =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const cart =
        await cartService.addToCart(
          getBuyerId(req),
          req.body.productId,
          req.body.quantity
        );

      res.status(200).json({
        success: true,
        message:
          "Product added to cart successfully",
        data: cart,
      });
    }
  );

export const updateCartItem =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const productId =
        getParam(
          req.params.productId
        );

      const cart =
        await cartService.updateCartItem(
          getBuyerId(req),
          productId,
          req.body.quantity
        );

      res.status(200).json({
        success: true,
        message:
          "Cart item updated successfully",
        data: cart,
      });
    }
  );

export const removeCartItem =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const productId =
        getParam(
          req.params.productId
        );

      const cart =
        await cartService.removeCartItem(
          getBuyerId(req),
          productId
        );

      res.status(200).json({
        success: true,
        message:
          "Product removed from cart successfully",
        data: cart,
      });
    }
  );

export const clearCart =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const cart =
        await cartService.clearCart(
          getBuyerId(req)
        );

      res.status(200).json({
        success: true,
        message:
          "Cart cleared successfully",
        data: cart,
      });
    }
  );