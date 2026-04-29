import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/tokenUtils";
import { AppError } from "../utils/errorHandler";

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError("No authorization header", "NO_AUTH_HEADER", 401);
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      throw new AppError("Token not provided", "NO_TOKEN", 401);
    }

    try {
      const payload = verifyToken(token);
      req.userId = payload.userId;
      req.email = payload.email;
      next();
    } catch (tokenError) {
      throw new AppError("Invalid or expired token", "INVALID_TOKEN", 401);
    }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Authentication failed",
        code: "AUTH_FAILED",
      });
    }
  }
};
