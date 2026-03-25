import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = (error as any).statusCode || 500;
  const message = error.message || "An unknown error occurred";
  const code = (error as any).code || "INTERNAL_ERROR";

  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} ${code}: ${message}`, {
    stack: error.stack,
    statusCode,
    code,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};
