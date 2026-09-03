import {
  Request,
  Response,
} from "express";

import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

import * as productService from "../services/product.service";

const getParam = (
  value: string | string[] | undefined
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
  return typeof value === "string"
    ? value
    : undefined;
};

export const createProduct =
  asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.auth?.tenantId) {
        throw new AppError(
          403,
          "Merchant tenant is required"
        );
      }

      const product =
        await productService.createProduct(
          req.auth.tenantId,
          req.body
        );

      res.status(201).json({
        success: true,
        message:
          "Product created successfully",
        data: product,
      });
    }
  );

export const getPublicProducts =
  asyncHandler(
    async (req, res) => {
      const result =
        await productService.getPublicProducts(
          {
            page: queryValue(req.query.page),
            limit: queryValue(req.query.limit),
            search: queryValue(
              req.query.search
            ),
            categoryId: queryValue(
              req.query.categoryId
            ),
            minPrice: queryValue(
              req.query.minPrice
            ),
            maxPrice: queryValue(
              req.query.maxPrice
            ),
            sort: queryValue(req.query.sort),
          }
        );

      res.status(200).json({
        success: true,
        data: result.products,
        pagination:
          result.pagination,
      });
    }
  );

export const getProductById =
  asyncHandler(
    async (req, res) => {
      const id = getParam(
        req.params.id
      );

      const product =
        await productService.getProductById(
          id
        );

      res.status(200).json({
        success: true,
        data: product,
      });
    }
  );

export const getMerchantProducts =
  asyncHandler(
    async (req, res) => {
      if (!req.auth?.tenantId) {
        throw new AppError(
          403,
          "Merchant tenant is required"
        );
      }

      const result =
        await productService.getMerchantProducts(
          req.auth.tenantId,
          {
            page: queryValue(req.query.page),
            limit: queryValue(
              req.query.limit
            ),
            search: queryValue(
              req.query.search
            ),
            categoryId: queryValue(
              req.query.categoryId
            ),
          }
        );

      res.status(200).json({
        success: true,
        data: result.products,
        pagination:
          result.pagination,
      });
    }
  );

export const updateProduct =
  asyncHandler(
    async (req, res) => {
      if (!req.auth?.tenantId) {
        throw new AppError(
          403,
          "Merchant tenant is required"
        );
      }

      const id = getParam(
        req.params.id
      );

      const product =
        await productService.updateProduct(
          id,
          req.auth.tenantId,
          req.body
        );

      res.status(200).json({
        success: true,
        message:
          "Product updated successfully",
        data: product,
      });
    }
  );

export const deleteProduct =
  asyncHandler(
    async (req, res) => {
      if (!req.auth?.tenantId) {
        throw new AppError(
          403,
          "Merchant tenant is required"
        );
      }

      const id = getParam(
        req.params.id
      );

      const product =
        await productService.deleteProduct(
          id,
          req.auth.tenantId
        );

      res.status(200).json({
        success: true,
        message:
          "Product deleted successfully",
        data: product,
      });
    }
  );