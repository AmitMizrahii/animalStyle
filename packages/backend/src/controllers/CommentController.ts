import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { ICommentRepository } from "../dal/interfaces/ICommentRepository";
import { IAnimalPostRepository } from "../dal/interfaces/IAnimalPostRepository";
import { sendSuccess, sendError, AppError } from "../utils/errorHandler";
import { parseOrThrow, paginationSchema } from "../utils/validation";
import { buildCommentResponse } from "../utils/postUtils";
import { Comment, PaginatedResponse } from "../types";

export class CommentController {
  constructor(
    private readonly commentRepo: ICommentRepository,
    private readonly postRepo: IAnimalPostRepository,
  ) {}

  async getPostComments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { page, limit } = parseOrThrow(paginationSchema, req.query);

      const post = await this.postRepo.findById(postId);

      if (!post) {
        throw new AppError("Post not found", "POST_NOT_FOUND", 404);
      }

      const { comments, total } = await this.commentRepo.findByPostId(postId, {
        page,
        limit,
      });

      const response: PaginatedResponse<Comment> = {
        data: comments.map(buildCommentResponse),
        page,
        limit,
        total,
        hasMore: (page - 1) * limit + comments.length < total,
      };

      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }

  async addComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      }

      const { postId } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== "string") {
        throw new AppError("Comment content is required", "INVALID_INPUT", 400);
      }

      if (content.trim().length === 0) {
        throw new AppError("Comment cannot be empty", "EMPTY_COMMENT", 400);
      }

      const post = await this.postRepo.findById(postId);

      if (!post) {
        throw new AppError("Post not found", "POST_NOT_FOUND", 404);
      }

      const comment = await this.commentRepo.create({
        postId,
        userId: req.userId,
        content: content.trim(),
      });

      sendSuccess(res, buildCommentResponse(comment), 201);
    } catch (error) {
      sendError(res, error);
    }
  }

  async deleteComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", "NOT_AUTHENTICATED", 401);
      }

      const { commentId } = req.params;

      const comment = await this.commentRepo.findById(commentId);

      if (!comment) {
        throw new AppError("Comment not found", "COMMENT_NOT_FOUND", 404);
      }

      if (comment.userId.toString() !== req.userId) {
        throw new AppError(
          "You can only delete your own comments",
          "UNAUTHORIZED",
          403,
        );
      }

      await this.commentRepo.delete(commentId);

      sendSuccess(res, { message: "Comment deleted successfully" });
    } catch (error) {
      sendError(res, error);
    }
  }
}
