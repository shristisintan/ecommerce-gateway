import { Router } from "express";

import {
  createOrder,
  getMerchantOrders,
  getMyOrders,
  getOrderById,
} from "../controllers/order.controller";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  authorize,
} from "../middleware/authorize.middleware";

import {
  validate,
} from "../middleware/validate.middleware";

import {
  createOrderSchema,
} from "../validators/order.validator";

const router = Router();

/*
 * =====================================================
 * MERCHANT
 * =====================================================
 *
 * IMPORTANT:
 * Keep this route BEFORE the Buyer-only middleware.
 */
router.get(
  "/merchant/mine",
  authenticate,
  authorize("MERCHANT"),
  getMerchantOrders
);

/*
 * =====================================================
 * BUYER
 * =====================================================
 */

router.use(
  authenticate,
  authorize("BUYER")
);

router.post(
  "/",
  validate(
    createOrderSchema
  ),
  createOrder
);

router.get(
  "/mine",
  getMyOrders
);

router.get(
  "/:id",
  getOrderById
);

export default router;