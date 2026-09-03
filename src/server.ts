import mongoose from "mongoose";

import app from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    console.log(
      `Server running on http://localhost:${env.PORT}`
    );

    console.log(`Environment: ${env.NODE_ENV}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received. Shutting down...`);

    server.close(async () => {
      await mongoose.disconnect();

      console.log("HTTP server and MongoDB connection closed.");

      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};

void startServer();