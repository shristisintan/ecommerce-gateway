import { asyncHandler } from "../utils/asyncHandler";
import * as categoryService from "../services/category.service";

export const createCategory = asyncHandler(
  async (req, res) => {
    const category =
      await categoryService.createCategory(req.body);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  }
);

export const getCategories = asyncHandler(
  async (_req, res) => {
    const categories =
      await categoryService.getCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  }
);

export const updateCategory = asyncHandler(
  async (req, res) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
      return;
    }

    const category =
      await categoryService.updateCategory(
        id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  }
);

export const deleteCategory = asyncHandler(
  async (req, res) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
      return;
    }

    const category =
      await categoryService.deleteCategory(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  }
);