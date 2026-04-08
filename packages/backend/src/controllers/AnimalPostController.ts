import { Response } from "express";
import { IAnimalPostRepository } from "../dal/interfaces/IAnimalPostRepository";
import { ICommentRepository } from "../dal/interfaces/ICommentRepository";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  AnimalPost,
  createPostSchema,
  PaginatedResponse,
  updatePostSchema,
} from "../types";
import { AppError, sendError, sendSuccess } from "../utils/errorHandler";
import { buildPostResponse } from "../utils/postUtils";
import { paginationSchema, parseOrThrow } from "../utils/validation";

export class AnimalPostController {
  constructor(
    private readonly postRepo: IAnimalPostRepository,
    private readonly commentRepo: ICommentRepository,
  ) {}

  async createPost(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      }

      const body = parseOrThrow(createPostSchema, req.body);

      const post = await this.postRepo.create({
        ...body,
        createdBy: req.userId,
      });

      sendSuccess(res, buildPostResponse(post, req.userId), 201);
    } catch (error) {
      sendError(res, error);
    }
  }

  async getAllPosts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page, limit } = parseOrThrow(paginationSchema, req.query);

      const { posts, total } = await this.postRepo.findAll({ page, limit });

      const response: PaginatedResponse<AnimalPost> = {
        data: posts.map((post) => buildPostResponse(post, req.userId)),
        page,
        limit,
        total,
        hasMore: (page - 1) * limit + posts.length < total,
      };

      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }

  async getPostById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;

      const post = await this.postRepo.findById(postId);

      if (!post) {
        throw new AppError("Post not found", "POST_NOT_FOUND", 404);
      }

      sendSuccess(res, buildPostResponse(post, req.userId));
    } catch (error) {
      sendError(res, error);
    }
  }

  async updatePost(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      }

      const { postId } = req.params;

      const existing = await this.postRepo.findById(postId);

      if (!existing) {
        throw new AppError("Post not found", "POST_NOT_FOUND", 404);
      }

      if (existing.createdBy._id?.toString() !== req.userId) {
        throw new AppError(
          "You can only edit your own posts",
          "FORBIDDEN",
          403,
        );
      }

      const body = parseOrThrow(updatePostSchema, req.body);

      const updated = await this.postRepo.update(postId, body);

      if (!updated) {
        throw new AppError("Post not found", "POST_NOT_FOUND", 404);
      }

      sendSuccess(res, buildPostResponse(updated, req.userId));
    } catch (error) {
      sendError(res, error);
    }
  }

  async deletePost(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      }

      const { postId } = req.params;

      const post = await this.postRepo.findById(postId);

      if (!post) {
        throw new AppError("Post not found", "POST_NOT_FOUND", 404);
      }

      if (post.createdBy._id?.toString() !== req.userId) {
        throw new AppError(
          "You can only delete your own posts",
          "FORBIDDEN",
          403,
        );
      }

      await this.commentRepo.deleteByPostId(postId);
      await this.postRepo.delete(postId);

      sendSuccess(res, { message: "Post deleted successfully" });
    } catch (error) {
      sendError(res, error);
    }
  }

  async getUserPosts(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      }

      const { userId } = req.params;
      const { page, limit } = parseOrThrow(paginationSchema, req.query);

      const { posts, total } = await this.postRepo.findByUserId(userId, {
        page,
        limit,
      });

      const response: PaginatedResponse<AnimalPost> = {
        data: posts.map((post) => buildPostResponse(post, req.userId)),
        page,
        limit,
        total,
        hasMore: (page - 1) * limit + posts.length < total,
      };

      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }

  async getLikedPosts(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId)
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      const { userId } = req.params;
      const { page, limit } = parseOrThrow(paginationSchema, req.query);
      const { posts, total } = await this.postRepo.findLikedByUser(userId, {
        page,
        limit,
      });
      const response: PaginatedResponse<AnimalPost> = {
        data: posts.map((post) => buildPostResponse(post, req.userId)),
        page,
        limit,
        total,
        hasMore: (page - 1) * limit + posts.length < total,
      };
      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }

  async toggleLike(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      }

      const { postId } = req.params;

      const post = await this.postRepo.findById(postId);

      if (!post) {
        throw new AppError("Post not found", "POST_NOT_FOUND", 404);
      }

      const result = await this.postRepo.toggleLike(postId, req.userId);

      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  }
}
