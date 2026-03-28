import { Response } from "express";
import { ApiError } from "../types";

export class AppError extends Error implements ApiError {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const sendError = (res: Response, error: unknown): Response => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      data: { error: error.message },
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      code: "INTERNAL_ERROR",
      data: { error: error.message },
    });
  }

  return res.status(500).json({
    success: false,
    message: "An unknown error occurred",
    code: "INTERNAL_ERROR",
    data: { error: "An unknown error occurred" },
  });
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};
