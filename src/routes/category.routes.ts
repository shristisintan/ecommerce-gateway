import {
  Router,
} from "express";

import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  getCategories,
  updateCategory,
} from "../controllers/category.controller";

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
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator";

const router =
  Router();

/* =====================================================
   PUBLIC
===================================================== */

/*
 * Only active categories.
 */
router.get(
  "/",
  getCategories
);

/* =====================================================
   ADMIN
===================================================== */

/*
 * All categories including inactive.
 */
router.get(
  "/admin/all",
  authenticate,
  authorize(
    "ADMIN"
  ),
  getAdminCategories
);

router.post(
  "/",
  authenticate,
  authorize(
    "ADMIN"
  ),
  validate(
    createCategorySchema
  ),
  createCategory
);

router.patch(
  "/:id",
  authenticate,
  authorize(
    "ADMIN"
  ),
  validate(
    updateCategorySchema
  ),
  updateCategory
);

router.delete(
  "/:id",
  authenticate,
  authorize(
    "ADMIN"
  ),
  deleteCategory
);

export default router;