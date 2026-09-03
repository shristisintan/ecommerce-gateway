import { Types } from "mongoose";

import { Cart } from "../models/cart.model";
import { Product } from "../models/product.model";
import { AppError } from "../utils/AppError";

const validateObjectId = (
  id: string,
  message: string
): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, message);
  }
};

const getActiveProduct = async (
  productId: string
) => {
  validateObjectId(
    productId,
    "Invalid product ID"
  );

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new AppError(
      404,
      "Product not found"
    );
  }

  return product;
};

export const getCart = async (
  buyerId: string
) => {
  validateObjectId(
    buyerId,
    "Invalid buyer ID"
  );

  let cart = await Cart.findOne({
    buyerId,
  }).populate({
    path: "items.productId",
    select:
      "name slug price stock images isActive tenantId",
  });

  if (!cart) {
    cart = await Cart.create({
      buyerId,
      items: [],
    });

    await cart.populate({
      path: "items.productId",
      select:
        "name slug price stock images isActive tenantId",
    });
  }

  return cart;
};

export const addToCart = async (
  buyerId: string,
  productId: string,
  quantity: number
) => {
  validateObjectId(
    buyerId,
    "Invalid buyer ID"
  );

  const product =
    await getActiveProduct(productId);

  if (product.stock <= 0) {
    throw new AppError(
      400,
      "Product is out of stock"
    );
  }

  let cart = await Cart.findOne({
    buyerId,
  });

  if (!cart) {
    cart = new Cart({
      buyerId,
      items: [],
    });
  }

  const existingItem =
    cart.items.find(
      (item) =>
        item.productId.toString() ===
        productId
    );

  if (existingItem) {
    const newQuantity =
      existingItem.quantity + quantity;

    if (newQuantity > product.stock) {
      throw new AppError(
        400,
        `Only ${product.stock} item(s) available in stock`
      );
    }

    existingItem.quantity =
      newQuantity;
  } else {
    if (quantity > product.stock) {
      throw new AppError(
        400,
        `Only ${product.stock} item(s) available in stock`
      );
    }

    cart.items.push({
      productId:
        new Types.ObjectId(
          productId
        ),
      quantity,
    });
  }

  await cart.save();

  return getCart(buyerId);
};

export const updateCartItem = async (
  buyerId: string,
  productId: string,
  quantity: number
) => {
  validateObjectId(
    buyerId,
    "Invalid buyer ID"
  );

  const product =
    await getActiveProduct(productId);

  if (quantity > product.stock) {
    throw new AppError(
      400,
      `Only ${product.stock} item(s) available in stock`
    );
  }

  const cart = await Cart.findOne({
    buyerId,
  });

  if (!cart) {
    throw new AppError(
      404,
      "Cart not found"
    );
  }

  const item = cart.items.find(
    (cartItem) =>
      cartItem.productId.toString() ===
      productId
  );

  if (!item) {
    throw new AppError(
      404,
      "Product not found in cart"
    );
  }

  item.quantity = quantity;

  await cart.save();

  return getCart(buyerId);
};

export const removeCartItem = async (
  buyerId: string,
  productId: string
) => {
  validateObjectId(
    buyerId,
    "Invalid buyer ID"
  );

  validateObjectId(
    productId,
    "Invalid product ID"
  );

  const cart = await Cart.findOne({
    buyerId,
  });

  if (!cart) {
    throw new AppError(
      404,
      "Cart not found"
    );
  }

  const itemExists =
    cart.items.some(
      (item) =>
        item.productId.toString() ===
        productId
    );

  if (!itemExists) {
    throw new AppError(
      404,
      "Product not found in cart"
    );
  }

  cart.items = cart.items.filter(
    (item) =>
      item.productId.toString() !==
      productId
  );

  await cart.save();

  return getCart(buyerId);
};

export const clearCart = async (
  buyerId: string
) => {
  validateObjectId(
    buyerId,
    "Invalid buyer ID"
  );

  const cart = await Cart.findOne({
    buyerId,
  });

  if (!cart) {
    throw new AppError(
      404,
      "Cart not found"
    );
  }

  cart.items = [];

  await cart.save();

  return cart;
};