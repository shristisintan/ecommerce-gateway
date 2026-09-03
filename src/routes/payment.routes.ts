import { Router } from "express";

import {
  checkEsewaStatus,
  initiateEsewa,
  verifyEsewa,
} from "../controllers/payment.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { validate } from "../middleware/validate.middleware";

import {
  initiateEsewaSchema,
  verifyEsewaSchema,
} from "../validators/payment.validator";

const router = Router();

/*
 * Buyer starts payment.
 */
router.post(
  "/esewa/initiate",

  authenticate,
  authorize("BUYER"),

  validate(
    initiateEsewaSchema
  ),

  initiateEsewa
);

/*
 * eSewa response verification.
 *
 * Does not trust frontend authentication.
 * Security comes from eSewa's signed response
 * + server-to-server status verification.
 */
router.post(
  "/esewa/verify",

  validate(
    verifyEsewaSchema
  ),

  verifyEsewa
);

/*
 * Used if redirect/callback is missed,
 * pending, or the user returns from
 * failure page.
 */
router.post(
  "/esewa/status/:orderId",

  authenticate,
  authorize("BUYER"),

  checkEsewaStatus
);

export default router;