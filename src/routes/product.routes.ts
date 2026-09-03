import { Router } from "express";

import {
  createProduct,
  deleteProduct,
  getMerchantProducts,
  getProductById,
  getPublicProducts,
  updateProduct,
} from "../controllers/product.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { validate } from "../middleware/validate.middleware";

import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validator";

const router = Router();

// Public product catalog
router.get(
  "/",
  getPublicProducts
);

// Merchant dashboard
router.get(
  "/merchant/mine",
  authenticate,
  authorize("MERCHANT"),
  getMerchantProducts
);

// Merchant creates product
router.post(
  "/",
  authenticate,
  authorize("MERCHANT"),
  validate(createProductSchema),
  createProduct
);

// Public product detail
router.get(
  "/:id",
  getProductById
);

// Merchant updates own product
router.patch(
  "/:id",
  authenticate,
  authorize("MERCHANT"),
  validate(updateProductSchema),
  updateProduct
);

// Merchant soft-deletes own product
router.delete(
  "/:id",
  authenticate,
  authorize("MERCHANT"),
  deleteProduct
);

export default router;