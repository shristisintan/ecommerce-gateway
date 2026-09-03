import { Router } from "express";

import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cart.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { validate } from "../middleware/validate.middleware";

import {
  addToCartSchema,
  updateCartItemSchema,
} from "../validators/cart.validator";

const router = Router();

router.use(
  authenticate,
  authorize("BUYER")
);

router.get(
  "/",
  getCart
);

router.post(
  "/items",
  validate(addToCartSchema),
  addToCart
);

router.patch(
  "/items/:productId",
  validate(updateCartItemSchema),
  updateCartItem
);

router.delete(
  "/items/:productId",
  removeCartItem
);

router.delete(
  "/",
  clearCart
);

export default router;