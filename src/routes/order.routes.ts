import { Router } from "express";

import {
  createOrder,
  getMyOrders,
  getOrderById,
} from "../controllers/order.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { validate } from "../middleware/validate.middleware";

import {
  createOrderSchema,
} from "../validators/order.validator";

const router = Router();

/*
 * All routes below are Buyer only.
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