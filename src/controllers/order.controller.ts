import {
  Request,
  Response,
} from "express";

import {
  AppError,
} from "../utils/AppError";

import {
  asyncHandler,
} from "../utils/asyncHandler";

import * as orderService from "../services/order.service";

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

const getMerchantTenantId = (
  req: Request
): string => {
  if (!req.auth?.tenantId) {
    throw new AppError(
      403,
      "Merchant tenant is required"
    );
  }

  return req.auth.tenantId;
};

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

const queryValue = (
  value: unknown
): string | undefined => {
  return typeof value ===
    "string"
    ? value
    : undefined;
};

/* =====================================================
   CREATE ORDER
===================================================== */

export const createOrder =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const order =
        await orderService.createOrder(
          getBuyerId(req),
          req.body
        );

      res.status(201).json({
        success: true,

        message:
          "Order created successfully",

        data:
          order,
      });
    }
  );

/* =====================================================
   BUYER ORDERS
===================================================== */

export const getMyOrders =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await orderService.getMyOrders(
          getBuyerId(req),
          {
            page:
              queryValue(
                req.query.page
              ),

            limit:
              queryValue(
                req.query.limit
              ),
          }
        );

      res.status(200).json({
        success: true,

        data:
          result.orders,

        pagination:
          result.pagination,
      });
    }
  );

/* =====================================================
   MERCHANT ORDERS
===================================================== */

export const getMerchantOrders =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await orderService
          .getMerchantOrders(
            getMerchantTenantId(
              req
            ),
            {
              page:
                queryValue(
                  req.query.page
                ),

              limit:
                queryValue(
                  req.query.limit
                ),

              orderStatus:
                queryValue(
                  req.query
                    .orderStatus
                ),

              paymentStatus:
                queryValue(
                  req.query
                    .paymentStatus
                ),
            }
          );

      res.status(200).json({
        success: true,

        data:
          result.orders,

        pagination:
          result.pagination,
      });
    }
  );

/* =====================================================
   BUYER ORDER DETAILS
===================================================== */

export const getOrderById =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const orderId =
        getParam(
          req.params.id
        );

      const order =
        await orderService
          .getOrderById(
            orderId,
            getBuyerId(req)
          );

      res.status(200).json({
        success: true,
        data: order,
      });
    }
  );