import { Types } from "mongoose";

import { Product } from "../models/product.model";
import { Category } from "../models/category.model";
import { AppError } from "../utils/AppError";

interface CreateProductInput {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  images?: string[];
}

interface UpdateProductInput {
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  images?: string[];
  isActive?: boolean;
}

interface ProductQuery {
  page?: string;
  limit?: string;
  search?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

/**
 * Custom filter type used instead of Mongoose FilterQuery.
 * This avoids compatibility issues with the installed Mongoose version.
 */
type ProductFilter = {
  isActive?: boolean;

  tenantId?: string | Types.ObjectId;

  categoryId?: string | Types.ObjectId;

  $text?: {
    $search: string;
  };

  price?: {
    $gte?: number;
    $lte?: number;
  };
};

/**
 * Ensure supplied category exists and is active.
 */
const validateCategory = async (
  categoryId: string
): Promise<void> => {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new AppError(
      400,
      "Invalid category ID"
    );
  }

  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  });

  if (!category) {
    throw new AppError(
      404,
      "Active category not found"
    );
  }
};

/**
 * CREATE PRODUCT
 *
 * Merchant only.
 * tenantId comes from authenticated merchant,
 * never from req.body.
 */
export const createProduct = async (
  tenantId: string,
  input: CreateProductInput
) => {
  if (!Types.ObjectId.isValid(tenantId)) {
    throw new AppError(
      400,
      "Invalid tenant ID"
    );
  }

  await validateCategory(input.categoryId);

  const existingProduct =
    await Product.findOne({
      tenantId,
      slug: input.slug,
    });

  if (existingProduct) {
    throw new AppError(
      409,
      "A product with this slug already exists in your store"
    );
  }

  const product = await Product.create({
    tenantId,
    categoryId: input.categoryId,
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    stock: input.stock,
    images: input.images ?? [],
    isActive: true,
  });

  return product;
};

/**
 * PUBLIC PRODUCT LIST
 *
 * Supports:
 * - pagination
 * - search
 * - category filter
 * - min price
 * - max price
 * - price sorting
 */
export const getPublicProducts = async (
  query: ProductQuery
) => {
  const parsedPage = Number.parseInt(
    query.page ?? "1",
    10
  );

  const parsedLimit = Number.parseInt(
    query.limit ?? "12",
    10
  );

  const page =
    Number.isNaN(parsedPage) || parsedPage < 1
      ? 1
      : parsedPage;

  const limit = Math.min(
    Number.isNaN(parsedLimit) ||
      parsedLimit < 1
      ? 12
      : parsedLimit,
    50
  );

  const filter: ProductFilter = {
    isActive: true,
  };

  /**
   * Category filtering
   */
  if (query.categoryId) {
    if (
      !Types.ObjectId.isValid(
        query.categoryId
      )
    ) {
      throw new AppError(
        400,
        "Invalid category ID"
      );
    }

    filter.categoryId =
      query.categoryId;
  }

  /**
   * Text search
   *
   * Uses the text index on:
   * name + description
   */
  if (query.search?.trim()) {
    filter.$text = {
      $search: query.search.trim(),
    };
  }

  /**
   * Price filters
   */
  const minPrice =
    query.minPrice !== undefined
      ? Number(query.minPrice)
      : undefined;

  const maxPrice =
    query.maxPrice !== undefined
      ? Number(query.maxPrice)
      : undefined;

  if (
    minPrice !== undefined &&
    (Number.isNaN(minPrice) ||
      minPrice < 0)
  ) {
    throw new AppError(
      400,
      "minPrice must be a valid positive number"
    );
  }

  if (
    maxPrice !== undefined &&
    (Number.isNaN(maxPrice) ||
      maxPrice < 0)
  ) {
    throw new AppError(
      400,
      "maxPrice must be a valid positive number"
    );
  }

  if (
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice
  ) {
    throw new AppError(
      400,
      "minPrice cannot be greater than maxPrice"
    );
  }

  if (
    minPrice !== undefined ||
    maxPrice !== undefined
  ) {
    filter.price = {};

    if (minPrice !== undefined) {
      filter.price.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      filter.price.$lte = maxPrice;
    }
  }

  /**
   * Sorting
   */
  let sort: Record<
    string,
    1 | -1
  > = {
    createdAt: -1,
  };

  if (query.sort === "price_asc") {
    sort = {
      price: 1,
    };
  } else if (
    query.sort === "price_desc"
  ) {
    sort = {
      price: -1,
    };
  }

  const skip =
    (page - 1) * limit;

  const [products, total] =
    await Promise.all([
      Product.find(filter)
        .populate(
          "categoryId",
          "name slug"
        )
        .populate(
          "tenantId",
          "name slug"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(
        filter
      ),
    ]);

  return {
    products,

    pagination: {
      page,
      limit,
      total,

      totalPages:
        total === 0
          ? 0
          : Math.ceil(
              total / limit
            ),
    },
  };
};

/**
 * PUBLIC PRODUCT DETAILS
 */
export const getProductById =
  async (id: string) => {
    if (
      !Types.ObjectId.isValid(id)
    ) {
      throw new AppError(
        400,
        "Invalid product ID"
      );
    }

    const product =
      await Product.findOne({
        _id: id,
        isActive: true,
      })
        .populate(
          "categoryId",
          "name slug"
        )
        .populate(
          "tenantId",
          "name slug"
        );

    if (!product) {
      throw new AppError(
        404,
        "Product not found"
      );
    }

    return product;
  };

/**
 * MERCHANT PRODUCT LIST
 *
 * Only products belonging to the
 * logged-in merchant's tenant.
 */
export const getMerchantProducts =
  async (
    tenantId: string,
    query: ProductQuery
  ) => {
    if (
      !Types.ObjectId.isValid(
        tenantId
      )
    ) {
      throw new AppError(
        400,
        "Invalid tenant ID"
      );
    }

    const parsedPage =
      Number.parseInt(
        query.page ?? "1",
        10
      );

    const parsedLimit =
      Number.parseInt(
        query.limit ?? "10",
        10
      );

    const page =
      Number.isNaN(parsedPage) ||
      parsedPage < 1
        ? 1
        : parsedPage;

    const limit = Math.min(
      Number.isNaN(parsedLimit) ||
        parsedLimit < 1
        ? 10
        : parsedLimit,
      50
    );

    /**
     * tenantId is mandatory here.
     *
     * This provides tenant isolation.
     */
    const filter: ProductFilter = {
      tenantId,
    };

    /**
     * Category filtering
     */
    if (query.categoryId) {
      if (
        !Types.ObjectId.isValid(
          query.categoryId
        )
      ) {
        throw new AppError(
          400,
          "Invalid category ID"
        );
      }

      filter.categoryId =
        query.categoryId;
    }

    /**
     * Search
     */
    if (query.search?.trim()) {
      filter.$text = {
        $search:
          query.search.trim(),
      };
    }

    const skip =
      (page - 1) * limit;

    const [products, total] =
      await Promise.all([
        Product.find(filter)
          .populate(
            "categoryId",
            "name slug"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Product.countDocuments(
          filter
        ),
      ]);

    return {
      products,

      pagination: {
        page,
        limit,
        total,

        totalPages:
          total === 0
            ? 0
            : Math.ceil(
                total / limit
              ),
      },
    };
  };

/**
 * UPDATE PRODUCT
 *
 * Security:
 * productId AND tenantId must match.
 *
 * Merchant A therefore cannot update
 * Merchant B's products.
 */
export const updateProduct = async (
  productId: string,
  tenantId: string,
  input: UpdateProductInput
) => {
  if (
    !Types.ObjectId.isValid(
      productId
    )
  ) {
    throw new AppError(
      400,
      "Invalid product ID"
    );
  }

  if (
    !Types.ObjectId.isValid(
      tenantId
    )
  ) {
    throw new AppError(
      400,
      "Invalid tenant ID"
    );
  }

  /**
   * Validate category if merchant
   * attempts to change it.
   */
  if (input.categoryId) {
    await validateCategory(
      input.categoryId
    );
  }

  /**
   * Slug must remain unique
   * inside this tenant.
   */
  if (input.slug) {
    const duplicate =
      await Product.findOne({
        tenantId,
        slug: input.slug,

        _id: {
          $ne: productId,
        },
      });

    if (duplicate) {
      throw new AppError(
        409,
        "A product with this slug already exists in your store"
      );
    }
  }

  const product =
    await Product.findOneAndUpdate(
      {
        _id: productId,

        // Critical tenant isolation
        tenantId,
      },

      {
        $set: input,
      },

      {
        new: true,
        runValidators: true,
      }
    );

  if (!product) {
    throw new AppError(
      404,
      "Product not found in your store"
    );
  }

  return product;
};

/**
 * DELETE PRODUCT
 *
 * We use soft delete instead
 * of physically deleting it.
 */
export const deleteProduct = async (
  productId: string,
  tenantId: string
) => {
  if (
    !Types.ObjectId.isValid(
      productId
    )
  ) {
    throw new AppError(
      400,
      "Invalid product ID"
    );
  }

  if (
    !Types.ObjectId.isValid(
      tenantId
    )
  ) {
    throw new AppError(
      400,
      "Invalid tenant ID"
    );
  }

  const product =
    await Product.findOneAndUpdate(
      {
        _id: productId,

        // Critical tenant isolation
        tenantId,
      },

      {
        $set: {
          isActive: false,
        },
      },

      {
        new: true,
      }
    );

  if (!product) {
    throw new AppError(
      404,
      "Product not found in your store"
    );
  }

  return product;
};