import mongoose from "mongoose";

import { connectDatabase } from "../config/db";
import { env } from "../config/env";
import { User } from "../models/user.model";

const seedAdmin = async (): Promise<void> => {
  try {
    if (
      !env.ADMIN_NAME ||
      !env.ADMIN_EMAIL ||
      !env.ADMIN_PASSWORD
    ) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required"
      );
    }

    await connectDatabase();

    const existingAdmin = await User.findOne({
      email: env.ADMIN_EMAIL,
    });

    if (existingAdmin) {
      console.log("Admin user already exists.");
      return;
    }

    await User.create({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      role: "ADMIN",
      tenantId: null,
      isActive: true,
    });

    console.log("Admin user created successfully.");
  } catch (error) {
    console.error("Admin seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void seedAdmin();