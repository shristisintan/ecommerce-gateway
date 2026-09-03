import mongoose, { Types } from "mongoose";

import { Cart } from "../models/cart.model";
import { Product } from "../models/product.model";
import { Order } from "../models/order.model";
import { AppError } from "../utils/AppError";

interface ShippingAddressInput {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  country: string;
}

interface CreateOrderInput {
  shippingAddress: ShippingAddressInput;
}

interface OrderQuery {
  page?: string;
  limit?: string;
}

const validateObjectId = (
  id: string,
  message: string
): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, message);
  }
};

export const createOrder = async (
  buyerId: string,
  input: CreateOrderInput
) => {
  validateObjectId(
    buyerId,
    "Invalid buyer ID"
  );

  const session =
    await mongoose.startSession();

  let createdOrderId:
    | Types.ObjectId
    | undefined;

  try {
    await session.withTransaction(
      async () => {
        const cart =
          await Cart.findOne({
            buyerId,
          }).session(session);

        if (
          !cart ||
          cart.items.length === 0
        ) {
          throw new AppError(
            400,
            "Cart is empty"
          );
        }

        const productIds =
          cart.items.map(
            (item) =>
              item.productId
          );

        const products =
          await Product.find({
            _id: {
              $in: productIds,
            },
            isActive: true,
          }).session(session);

        const productMap =
          new Map(
            products.map(
              (product) => [
                product._id.toString(),
                product,
              ]
            )
          );

        const orderItems =
          cart.items.map(
            (cartItem) => {
              const product =
                productMap.get(
                  cartItem.productId.toString()
                );

              if (!product) {
                throw new AppError(
                  400,
                  "One or more cart products are unavailable"
                );
              }

              if (
                cartItem.quantity >
                product.stock
              ) {
                throw new AppError(
                  400,
                  `Only ${product.stock} item(s) available for ${product.name}`
                );
              }

              const subtotal =
                Number(
                  (
                    product.price *
                    cartItem.quantity
                  ).toFixed(2)
                );

              return {
                productId:
                  product._id,

                tenantId:
                  product.tenantId,

                productName:
                  product.name,

                unitPrice:
                  product.price,

                quantity:
                  cartItem.quantity,

                subtotal,
              };
            }
          );

        const totalAmount =
          Number(
            orderItems
              .reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  item.subtotal,
                0
              )
              .toFixed(2)
          );

        const order =
          new Order({
            buyerId,

            items:
              orderItems,

            shippingAddress:
              input.shippingAddress,

            totalAmount,

            orderStatus:
              "PENDING_PAYMENT",

            paymentStatus:
              "PENDING",
          });

        await order.save({
          session,
        });

        createdOrderId =
          order._id;

        /*
         * Clear cart after
         * successful order creation.
         *
         * Stock is NOT reduced here.
         */
        cart.items = [];

        await cart.save({
          session,
        });
      }
    );

    if (!createdOrderId) {
      throw new AppError(
        500,
        "Order creation failed"
      );
    }

    const order =
      await Order.findById(
        createdOrderId
      )
        .populate(
          "items.productId",
          "name slug images"
        )
        .populate(
          "items.tenantId",
          "name slug"
        );

    if (!order) {
      throw new AppError(
        500,
        "Created order could not be retrieved"
      );
    }

    return order;
  } finally {
    await session.endSession();
  }
};

export const getMyOrders =
  async (
    buyerId: string,
    query: OrderQuery
  ) => {
    validateObjectId(
      buyerId,
      "Invalid buyer ID"
    );

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
      Number.isNaN(
        parsedPage
      ) ||
      parsedPage < 1
        ? 1
        : parsedPage;

    const limit =
      Math.min(
        Number.isNaN(
          parsedLimit
        ) ||
          parsedLimit < 1
          ? 10
          : parsedLimit,
        50
      );

    const skip =
      (page - 1) *
      limit;

    const [
      orders,
      total,
    ] =
      await Promise.all([
        Order.find({
          buyerId,
        })
          .populate(
            "items.tenantId",
            "name slug"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Order.countDocuments({
          buyerId,
        }),
      ]);

    return {
      orders,

      pagination: {
        page,
        limit,
        total,

        totalPages:
          total === 0
            ? 0
            : Math.ceil(
                total /
                  limit
              ),
      },
    };
  };

export const getOrderById =
  async (
    orderId: string,
    buyerId: string
  ) => {
    validateObjectId(
      orderId,
      "Invalid order ID"
    );

    validateObjectId(
      buyerId,
      "Invalid buyer ID"
    );

    const order =
      await Order.findOne({
        _id: orderId,

        /*
         * Buyer can only
         * access own order.
         */
        buyerId,
      })
        .populate(
          "items.productId",
          "name slug images"
        )
        .populate(
          "items.tenantId",
          "name slug"
        );

    if (!order) {
      throw new AppError(
        404,
        "Order not found"
      );
    }

    return order;
  };