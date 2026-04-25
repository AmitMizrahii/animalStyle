import dotenv from "dotenv";
import express, { Express } from "express";
import mongoose from "mongoose";
import path from "path";
import { commentRepository, postRepository, userRepository } from "./container";
import { errorHandler } from "./middleware/errorMiddleware";
import requestLogger from "./middleware/requestLogger";
import { createAuthRoutes } from "./routes/authRoutes";
import { createCommentRoutes } from "./routes/commentRoutes";
import multerRoute from "./routes/multerRoutes";
import { createPostRoutes } from "./routes/postRoutes";
import { createSearchRoutes } from "./routes/searchRoutes";
import { createUserRoutes } from "./routes/userRoutes";
import { specs, swaggerUi } from "./swagger";
import logger from "./utils/logger";

dotenv.config();

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

    app.use("/public", express.static("./public"));

    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(specs, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle:
          "AnimalStyle - Animal Adoption Platform API Documentation",
      }),
    );

    app.get("/api-docs.json", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(specs);
    });

    app.use("/upload", multerRoute);

    app.use("/auth", createAuthRoutes(userRepository));
    app.use("/users", createUserRoutes(userRepository));

    app.use("/posts", createPostRoutes(postRepository, commentRepository));
    app.use(
      "/comments",
      createCommentRoutes(commentRepository, postRepository),
    );
    app.use("/search", createSearchRoutes(postRepository));

    app.get("/health", (_req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    const clientBuildPath = path.join(__dirname, "../public/frontend/build");
    app.use(express.static(clientBuildPath));

    app.use("/api", (_req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
        code: "NOT_FOUND",
      });
    });

    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });
    app.use(errorHandler);

    const dbUri =
      process.env.MONGODB_PREFIX +
      "://" +
      process.env.MONGODB_USERNAME +
      ":" +
      process.env.MONGODB_PASSWORD +
      "@" +
      process.env.MONGODB_CLUSTER +
      "/" +
      process.env.MONGODB_DB_NAME;

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
