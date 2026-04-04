import { Router } from "express";
import { CommentController } from "../controllers/CommentController";
import { IAnimalPostRepository } from "../dal/interfaces/IAnimalPostRepository";
import { ICommentRepository } from "../dal/interfaces/ICommentRepository";
import { authMiddleware } from "../middleware/authMiddleware";

export function createCommentRoutes(
  commentRepo: ICommentRepository,
  postRepo: IAnimalPostRepository,
): Router {
  const router = Router();
  const commentController = new CommentController(commentRepo, postRepo);

  router.get("/:postId", (req, res) =>
    commentController.getPostComments(req, res),
  );

  router.post("/:postId", (req, res) =>
    authMiddleware(req, res, () => commentController.addComment(req, res)),
  );

  router.delete("/:commentId", (req, res) =>
    authMiddleware(req, res, () => commentController.deleteComment(req, res)),
  );

  return router;
}
