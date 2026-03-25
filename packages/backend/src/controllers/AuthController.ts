import { Response } from "express";
import axios from "axios";
import { AuthRequest } from "../middleware/authMiddleware";
import { IUserRepository } from "../dal/interfaces/IUserRepository";
import { hashPassword, comparePassword } from "../utils/passwordUtils";
import {
  createToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenUtils";
import { AppError, sendSuccess, sendError } from "../utils/errorHandler";
import { IUserResponse } from "../types";

export class AuthController {
  constructor(private readonly userRepo: IUserRepository) {}

  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, passwordConfirm } = req.body;

      if (!username || !email || !password) {
        throw new AppError(
          "Username, email, and password are required",
          "INVALID_INPUT",
          400,
        );
      }

      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        throw new AppError("Invalid email format", "INVALID_INPUT", 400);
      }

      if (password !== passwordConfirm) {
        throw new AppError("Passwords do not match", "PASSWORD_MISMATCH", 400);
      }

      const existingUser = await this.userRepo.findByEmailOrUsername(
        email,
        username,
      );
      if (existingUser) {
        throw new AppError(
          "User with this email or username already exists",
          "USER_EXISTS",
          409,
        );
      }

      const hashedPassword = await hashPassword(password);
      const user = await this.userRepo.create({
        username,
        email,
        password: hashedPassword,
      });

      const token = createToken(user._id!, user.email);
      const refreshToken = createRefreshToken(user._id!, user.email);

      await this.userRepo.updateRefreshToken(user._id!, refreshToken);

      const response: IUserResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImagePath: user.profileImagePath,
        token,
        refreshToken,
      };

      sendSuccess(res, response, 201);
    } catch (error) {
      sendError(res, error);
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError(
          "Email and password are required",
          "INVALID_INPUT",
          400,
        );
      }

      const user = await this.userRepo.findByEmailWithPassword(email);

      if (!user) {
        throw new AppError(
          "Invalid email or password",
          "INVALID_CREDENTIALS",
          401,
        );
      }

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        throw new AppError(
          "Invalid email or password",
          "INVALID_CREDENTIALS",
          401,
        );
      }

      const token = createToken(user._id!, user.email);
      const refreshToken = createRefreshToken(user._id!, user.email);

      await this.userRepo.updateRefreshToken(user._id!, refreshToken);

      const response: IUserResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImagePath: user.profileImagePath,
        token,
        refreshToken,
      };

      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }

  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError(
          "Refresh token is required",
          "NO_REFRESH_TOKEN",
          400,
        );
      }

      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        throw new AppError(
          "Invalid refresh token",
          "INVALID_REFRESH_TOKEN",
          401,
        );
      }

      const user = await this.userRepo.findByIdWithRefreshToken(payload.userId);

      if (!user) {
        throw new AppError(
          "Invalid refresh token",
          "INVALID_REFRESH_TOKEN",
          401,
        );
      }

      if (user.refreshToken !== refreshToken) {
        await this.userRepo.updateRefreshToken(user._id!, undefined);
        throw new AppError(
          "Invalid refresh token",
          "INVALID_REFRESH_TOKEN",
          401,
        );
      }

      const newToken = createToken(user._id!, user.email);
      const newRefreshToken = createRefreshToken(user._id!, user.email);

      await this.userRepo.updateRefreshToken(user._id!, newRefreshToken);

      const response: IUserResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImagePath: user.profileImagePath,
        token: newToken,
        refreshToken: newRefreshToken,
      };

      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }

  async googleLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { credential } = req.body;

      if (!credential) {
        throw new AppError(
          "Google credential is required",
          "INVALID_INPUT",
          400,
        );
      }

      let googlePayload: {
        email: string;
        name?: string;
        picture?: string;
        aud?: string;
      };

      try {
        const tokenInfoRes = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
          { timeout: 5000 },
        );
        googlePayload = tokenInfoRes.data;
      } catch {
        throw new AppError(
          "Invalid Google credential",
          "INVALID_CREDENTIALS",
          401,
        );
      }

      const { email, name, picture } = googlePayload;

      if (!email) {
        throw new AppError(
          "Could not retrieve email from Google",
          "INVALID_CREDENTIALS",
          401,
        );
      }

      let user = await this.userRepo.findByEmailOrUsername(email, "");

      if (!user) {
        const baseUsername = name
          ? name.replace(/\s+/g, "_").toLowerCase().slice(0, 20)
          : email.split("@")[0];

        const isTaken = await this.userRepo.isUsernameTakenByOther(
          baseUsername,
          "",
        );
        const username = isTaken
          ? `${baseUsername}_${Date.now()}`
          : baseUsername;

        const randomPassword = await hashPassword(
          Math.random().toString(36) + Date.now(),
        );

        user = await this.userRepo.create({
          username,
          email,
          password: randomPassword,
          profileImagePath: picture,
        });
      }

      const token = createToken(user._id!, user.email);
      const refreshToken = createRefreshToken(user._id!, user.email);

      await this.userRepo.updateRefreshToken(user._id!, refreshToken);

      const response: IUserResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImagePath: user.profileImagePath,
        token,
        refreshToken,
      };

      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      }

      await this.userRepo.updateRefreshToken(req.userId, undefined);

      sendSuccess(res, { message: "Logged out successfully" });
    } catch (error) {
      sendError(res, error);
    }
  }
}
