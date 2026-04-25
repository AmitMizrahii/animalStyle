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

  /**
   * @swagger
   * /comments/{postId}:
   *   get:
   *     summary: Get comments for a post
   *     tags: [Comments]
   *     parameters:
   *       - name: postId
   *         in: path
   *         required: true
   *         type: string
   *       - name: page
   *         in: query
   *         type: integer
   *       - name: limit
   *         in: query
   *         type: integer
   *     responses:
   *       200:
   *         description: List of comments
   */
  router.get("/:postId", (req, res) =>
    commentController.getPostComments(req, res),
  );

  /**
   * @swagger
   * /comments/{postId}:
   *   post:
   *     summary: Add comment to post
   *     tags: [Comments]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - name: postId
   *         in: path
   *         required: true
   *         type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               content:
   *                 type: string
   *     responses:
   *       201:
   *         description: Comment added successfully
   */
  router.post("/:postId", (req, res) =>
    authMiddleware(req, res, () => commentController.addComment(req, res)),
  );

  /**
   * @swagger
   * /comments/{commentId}:
   *   delete:
   *     summary: Delete comment
   *     tags: [Comments]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - name: commentId
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Comment deleted successfully
   */
  router.delete("/:commentId", (req, res) =>
    authMiddleware(req, res, () => commentController.deleteComment(req, res)),
  );

  return router;
}
