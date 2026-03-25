import jwt from "jwt-simple";
import { TokenPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const REFRESH_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret";

export const createToken = (userId: string, email: string): string => {
  const payload: TokenPayload = {
    userId,
    email,
    jti: crypto.randomUUID(),
  };
  return jwt.encode(payload, JWT_SECRET);
};

export const createRefreshToken = (userId: string, email: string): string => {
  const payload: TokenPayload = {
    userId,
    email,
    jti: crypto.randomUUID(),
  };
  return jwt.encode(payload, REFRESH_SECRET);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.decode(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.decode(token, REFRESH_SECRET);
    return decoded as TokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};
