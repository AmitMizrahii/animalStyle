import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const isDevelopment = process.env.NODE_ENV !== "production";

const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
  const base = `${ts} [${level}]: ${message}`;
  return stack ? `${base}\n${stack}` : base;
});

const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: isDevelopment ? "debug" : "info",
  format: combine(timestamp(), errors({ stack: true })),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "HH:mm:ss" }),
        consoleFormat,
      ),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: fileFormat,
    }),
  ],
});

export default logger;
