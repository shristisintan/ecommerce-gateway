import {
  Types,
} from "mongoose";

import {
  Category,
} from "../models/category.model";

import {
  AppError,
} from "../utils/AppError";

interface CreateCategoryInput {
  name: string;
  slug: string;
}

interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  isActive?: boolean;
}

/* =====================================================
   CREATE CATEGORY
===================================================== */

export const createCategory =
  async (
    input: CreateCategoryInput
  ) => {
    const existing =
      await Category.findOne({
        slug: input.slug,
      });

    if (existing) {
      throw new AppError(
        409,
        "A category with this slug already exists"
      );
    }

    return Category.create(
      input
    );
  };

/* =====================================================
   PUBLIC CATEGORIES

   Buyers / merchants only need
   active categories.
===================================================== */

export const getCategories =
  async () => {
    return Category.find({
      isActive: true,
    }).sort({
      name: 1,
    });
  };

/* =====================================================
   ADMIN CATEGORIES

   Admin needs both active
   and inactive categories.
===================================================== */

export const getAdminCategories =
  async () => {
    return Category.find({})
      .sort({
        createdAt: -1,
      });
  };

/* =====================================================
   UPDATE CATEGORY
===================================================== */

export const updateCategory =
  async (
    id: string,
    input: UpdateCategoryInput
  ) => {
    if (
      !Types.ObjectId.isValid(
        id
      )
    ) {
      throw new AppError(
        400,
        "Invalid category ID"
      );
    }

    /*
     * If slug is being changed,
     * make sure another category
     * does not already use it.
     */
    if (input.slug) {
      const existing =
        await Category.findOne({
          slug: input.slug,

          _id: {
            $ne: id,
          },
        });

      if (existing) {
        throw new AppError(
          409,
          "A category with this slug already exists"
        );
      }
    }

    const category =
      await Category
        .findByIdAndUpdate(
          id,
          input,
          {
            new: true,
            runValidators: true,
          }
        );

    if (!category) {
      throw new AppError(
        404,
        "Category not found"
      );
    }

    return category;
  };

/* =====================================================
   DEACTIVATE CATEGORY

   Soft delete only.
===================================================== */

export const deleteCategory =
  async (
    id: string
  ) => {
    if (
      !Types.ObjectId.isValid(
        id
      )
    ) {
      throw new AppError(
        400,
        "Invalid category ID"
      );
    }

    const category =
      await Category
        .findByIdAndUpdate(
          id,
          {
            isActive: false,
          },
          {
            new: true,
          }
        );

    if (!category) {
      throw new AppError(
        404,
        "Category not found"
      );
    }

    return category;
  };