import initializeApp from "./index";
import logger from "./utils/logger";

const PORT = process.env.PORT || 3001;

initializeApp()
  .then((app) => {
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
