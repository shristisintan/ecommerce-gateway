import { Router } from "express";

import authRoutes from "./auth.routes";
import categoryRoutes from "./category.routes";
import productRoutes from "./product.routes";
import cartRoutes from "./cart.routes";
import orderRoutes from "./order.routes";
import paymentRoutes from "./payment.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "E-Commerce API is running",
  });
});
router.use(
  "/products",
  productRoutes
);

router.use(
  "/cart",
  cartRoutes
);

router.use(
  "/orders",
  orderRoutes
);

router.use(
  "/payments",
  paymentRoutes
);

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);

export default router;