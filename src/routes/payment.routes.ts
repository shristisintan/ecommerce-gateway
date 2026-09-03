import { Router } from "express";

import {
  checkEsewaStatus,
  esewaCallback,
  initiateEsewa,
  verifyEsewa,
} from "../controllers/payment.controller";

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
  initiateEsewaSchema,
  verifyEsewaSchema,
} from "../validators/payment.validator";

const router = Router();

/*
 * ============================================
 * INITIATE ESEWA PAYMENT
 * ============================================
 *
 * Buyer starts payment for an existing order.
 */
router.post(
  "/esewa/initiate",

  authenticate,

  authorize(
    "BUYER"
  ),

  validate(
    initiateEsewaSchema
  ),

  initiateEsewa
);

/*
 * ============================================
 * VERIFY ESEWA PAYMENT
 * ============================================
 *
 * Used when frontend sends eSewa's
 * signed response to backend.
 *
 * No buyer authentication is required
 * because security comes from:
 *
 * 1. eSewa response signature
 * 2. server-to-server eSewa verification
 */
router.post(
  "/esewa/verify",

  validate(
    verifyEsewaSchema
  ),

  verifyEsewa
);

/*
 * ============================================
 * ESEWA CALLBACK
 * ============================================
 *
 * eSewa redirects here automatically
 * after successful payment.
 *
 * DO NOT add authenticate middleware here.
 *
 * The backend verifies the signed response
 * and checks the transaction directly
 * with eSewa.
 */
router.get(
  "/esewa/callback",

  esewaCallback
);

/*
 * ============================================
 * PAYMENT STATUS RECOVERY
 * ============================================
 *
 * Used when:
 *
 * - callback was missed
 * - browser was closed
 * - redirect failed
 * - payment status needs recovery
 */
router.post(
  "/esewa/status/:orderId",

  authenticate,

  authorize(
    "BUYER"
  ),

  checkEsewaStatus
);

export default router;