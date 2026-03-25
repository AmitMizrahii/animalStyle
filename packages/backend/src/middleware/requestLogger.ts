import morgan, { StreamOptions } from "morgan";
import logger from "../utils/logger";

const stream: StreamOptions = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

const requestLogger = morgan(
  ":method :url :status :res[content-length] bytes - :response-time ms",
  { stream },
);

export default requestLogger;
