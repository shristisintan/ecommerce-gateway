import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { env } from "./config/env";
import router from "./routes";
import { notFoundHandler } from "./middleware/notFound.middleware";
import { globalErrorHandler } from "./middleware/error.middleware";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.use(cookieParser());

app.use("/api/v1", router);

app.use(notFoundHandler);

app.use(globalErrorHandler);

export default app;