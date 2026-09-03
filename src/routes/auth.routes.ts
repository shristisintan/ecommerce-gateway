import { Router } from "express";

import {
  login,
  logout,
  me,
  refresh,
  registerBuyer,
  registerMerchant,
} from "../controllers/auth.controller";

import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

import {
  buyerRegisterSchema,
  loginSchema,
  merchantRegisterSchema,
} from "../validators/auth.validator";

const router = Router();

router.post(
  "/register/buyer",
  validate(buyerRegisterSchema),
  registerBuyer
);

router.post(
  "/register/merchant",
  validate(merchantRegisterSchema),
  registerMerchant
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.post(
  "/refresh",
  refresh
);

router.post(
  "/logout",
  logout
);

router.get(
  "/me",
  authenticate,
  me
);

export default router;