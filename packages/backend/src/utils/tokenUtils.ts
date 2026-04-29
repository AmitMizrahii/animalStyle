import jwt from "jwt-simple";
import { TokenPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const REFRESH_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret";

const ACCESS_TOKEN_TTL = 15 * 60;           // 15 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

export const createToken = (userId: string, email: string): string => {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    userId,
    email,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + ACCESS_TOKEN_TTL,
  };
  return jwt.encode(payload, JWT_SECRET);
};

export const createRefreshToken = (userId: string, email: string): string => {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    userId,
    email,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + REFRESH_TOKEN_TTL,
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
