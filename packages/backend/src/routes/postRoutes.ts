import { Router } from "express";
import { AnimalPostController } from "../controllers/AnimalPostController";
import { IAnimalPostRepository } from "../dal/interfaces/IAnimalPostRepository";
import { ICommentRepository } from "../dal/interfaces/ICommentRepository";
import { authMiddleware } from "../middleware/authMiddleware";

export function createPostRoutes(
  postRepo: IAnimalPostRepository,
  commentRepo: ICommentRepository,
): Router {
  const router = Router();
  const postController = new AnimalPostController(postRepo, commentRepo);

  /**
   * @swagger
   * /posts:
   *   get:
   *     summary: Get all posts with pagination
   *     tags: [Posts]
   *     parameters:
   *       - name: page
   *         in: query
   *         type: integer
   *       - name: limit
   *         in: query
   *         type: integer
   *     responses:
   *       200:
   *         description: List of posts
   */
  router.get("/", (req, res) =>
    authMiddleware(req, res, () => postController.getAllPosts(req, res)),
  );

  /**
   * @swagger
   * /posts/user/{userId}:
   *   get:
   *     summary: Get posts by user ID
   *     tags: [Posts]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: User's posts
   */
  router.get("/user/:userId", (req, res) =>
    authMiddleware(req, res, () => postController.getUserPosts(req, res)),
  );

  /**
   * @swagger
   * /posts/liked/{userId}:
   *   get:
   *     summary: Get posts liked by a user
   *     tags: [Posts]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Liked posts
   */
  router.get("/liked/:userId", (req, res) =>
    authMiddleware(req, res, () => postController.getLikedPosts(req, res)),
  );

  /**
   * @swagger
   * /posts:
   *   post:
   *     summary: Create new animal post
   *     tags: [Posts]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               type:
   *                 type: string
   *               age:
   *                 type: number
   *               gender:
   *                 type: string
   *               description:
   *                 type: string
   *               location:
   *                 type: string
   *               imagePath:
   *                 type: string
   *     responses:
   *       201:
   *         description: Post created successfully
   */
  router.post("/", (req, res) =>
    authMiddleware(req, res, () => postController.createPost(req, res)),
  );

  /**
   * @swagger
   * /posts/{postId}:
   *   get:
   *     summary: Get post by ID
   *     tags: [Posts]
   *     parameters:
   *       - name: postId
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Post details
   */
  router.get("/:postId", (req, res) =>
    authMiddleware(req, res, () => postController.getPostById(req, res)),
  );

  /**
   * @swagger
   * /posts/{postId}:
   *   put:
   *     summary: Update animal post
   *     tags: [Posts]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - name: postId
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Post updated successfully
   */
  router.put("/:postId", (req, res) =>
    authMiddleware(req, res, () => postController.updatePost(req, res)),
  );

  /**
   * @swagger
   * /posts/{postId}:
   *   delete:
   *     summary: Delete animal post
   *     tags: [Posts]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - name: postId
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Post deleted successfully
   */
  router.delete("/:postId", (req, res) =>
    authMiddleware(req, res, () => postController.deletePost(req, res)),
  );

  /**
   * @swagger
   * /posts/{postId}/like:
   *   post:
   *     summary: Like/Unlike post
   *     tags: [Posts]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - name: postId
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Like status toggled
   */
  router.post("/:postId/like", (req, res) =>
    authMiddleware(req, res, () => postController.toggleLike(req, res)),
  );

  return router;
}
