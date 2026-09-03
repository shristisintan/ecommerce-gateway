import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env";

export const connectDatabase = async (): Promise<void> => {
  try {
    // Optional DNS fix for networks that block MongoDB Atlas SRV lookups
    if (env.DNS_SERVERS) {
      const servers = env.DNS_SERVERS
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean);

      if (servers.length > 0) {
        dns.setServers(servers);
      }
    }

    await mongoose.connect(env.MONGODB_URI);

    console.log(
      `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};