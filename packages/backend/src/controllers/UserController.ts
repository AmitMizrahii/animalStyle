import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { IUserRepository } from "../dal/interfaces/IUserRepository";
import { sendSuccess, sendError, AppError } from "../utils/errorHandler";
import { updateProfileSchema, User } from "../types";
import { parseOrThrow } from "../utils/validation";

export class UserController {
  constructor(private readonly userRepo: IUserRepository) {}

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      }

      const user = await this.userRepo.findById(req.userId);

      if (!user) {
        throw new AppError("User not found", "USER_NOT_FOUND", 404);
      }

      const response: User = {
        _id: user._id!,
        username: user.username,
        email: user.email,
        profileImagePath: user.profileImagePath,
      };

      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      }

      const { username, profileImagePath } = parseOrThrow(
        updateProfileSchema,
        req.body,
      );

      const user = await this.userRepo.findById(req.userId);

      if (!user) {
        throw new AppError("User not found", "USER_NOT_FOUND", 404);
      }

      if (username && username !== user.username) {
        const isTaken = await this.userRepo.isUsernameTakenByOther(
          username,
          req.userId,
        );
        if (isTaken) {
          throw new AppError(
            "Username is already taken",
            "USERNAME_TAKEN",
            409,
          );
        }
      }

      const updated = await this.userRepo.updateProfile(req.userId, {
        username: username ?? undefined,
        profileImagePath: profileImagePath ?? undefined,
      });

      if (!updated) {
        throw new AppError("User not found", "USER_NOT_FOUND", 404);
      }

      const response: User = {
        _id: updated._id!,
        username: updated.username,
        email: updated.email,
        profileImagePath: updated.profileImagePath,
      };

      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await this.userRepo.findById(userId);

      if (!user) {
        throw new AppError("User not found", "USER_NOT_FOUND", 404);
      }

      const response: User = {
        _id: user._id!,
        username: user.username,
        email: user.email,
        profileImagePath: user.profileImagePath,
      };

      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }
}
