import fs from "fs";
import http from "http";
import https from "https";
import initializeApp from "./index";
import logger from "./utils/logger";

const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

initializeApp()
  .then((app) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("DEVELOPMENT MODE: Starting HTTP server");
      http.createServer(app).listen(PORT, () => {
        logger.info(`HTTP Server running on http://localhost:${PORT}`);
      });

      const sslOptions = {
        key: fs.readFileSync("../client-key.pem"),
        cert: fs.readFileSync("../client-cert.pem"),
      };
      https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
        logger.info(`Server running on http://localhost:${HTTPS_PORT}`);
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
