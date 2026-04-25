import initializeApp from "./index";
import logger from "./utils/logger";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

initializeApp()
  .then((app) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("DEVELOPMENT MODE: Starting HTTP server");
      http.createServer(app).listen(PORT, () => {
        logger.info(`HTTP Server running on http://localhost:${PORT}`);
      });
    } else {
      console.log("here we are: HTTPS server started");
      const key = fs.readFileSync(
        path.resolve(process.env.HOME!, "client-key.pem"),
      );
      const cert = fs.readFileSync(
        path.resolve(process.env.HOME!, "client-cert.pem"),
      );
      const sslOptions = {
        key,
        cert,
      };
      https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
        logger.info(`Server running on https://localhost:${HTTPS_PORT}`);
      });
    }
  })
  .catch((error: Error) => {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
