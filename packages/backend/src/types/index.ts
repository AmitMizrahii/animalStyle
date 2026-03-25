export type { User, UserWithToken, ApiError } from "shared";

export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  profileImagePath?: string;
  refreshToken?: string;
  createdAt?: Date;
}

export interface IUserResponse extends Omit<
  IUser,
  "password" | "refreshToken"
> {
  token: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
  jti: string;
}
