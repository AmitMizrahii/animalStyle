import dotenv from "dotenv";
import express, { Express } from "express";
import mongoose from "mongoose";
import { userRepository } from "./container";
import { errorHandler } from "./middleware/errorMiddleware";
import requestLogger from "./middleware/requestLogger";
import { createAuthRoutes } from "./routes/authRoutes";
import logger from "./utils/logger";

dotenv.config({ path: ".env.dev" });

const initializeApp = (): Promise<Express> => {
  return new Promise<Express>((resolve, reject) => {
    const app = express();

    app.use(requestLogger);
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      );
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );

      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }

      return next();
    });

    app.use("/auth", createAuthRoutes(userRepository));

    app.get("/health", (_req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    app.use((_req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
        code: "NOT_FOUND",
      });
    });

    app.use(errorHandler);

    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      logger.error("MONGODB_URI is not defined in environment variables.");
      reject(new Error("MONGODB_URI is not defined"));
      return;
    }

    mongoose
      .connect(dbUri)
      .then(() => {
        logger.info("Connected to MongoDB");
        resolve(app);
      })
      .catch((error: Error) => {
        logger.error("Failed to connect to MongoDB", { error: error.message });
        reject(error);
      });
  });
};

export default initializeApp;
