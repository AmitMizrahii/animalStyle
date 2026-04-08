import { Router } from "express";
import { AnimalPostController } from "../controllers/AnimalPostController";
import { IAnimalPostRepository } from "../dal/interfaces/IAnimalPostRepository";
import { ICommentRepository } from "../dal/interfaces/ICommentRepository";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middleware/authMiddleware";

export function createPostRoutes(
  postRepo: IAnimalPostRepository,
  commentRepo: ICommentRepository,
): Router {
  const router = Router();
  const postController = new AnimalPostController(postRepo, commentRepo);

  router.get("/", (req, res) =>
    optionalAuthMiddleware(req, res, () =>
      postController.getAllPosts(req, res),
    ),
  );

  router.get("/user/:userId", (req, res) =>
    authMiddleware(req, res, () => postController.getUserPosts(req, res)),
  );

  router.get("/liked/:userId", (req, res) =>
    authMiddleware(req, res, () => postController.getLikedPosts(req, res)),
  );

  router.post("/", (req, res) =>
    authMiddleware(req, res, () => postController.createPost(req, res)),
  );

  router.get("/:postId", (req, res) =>
    optionalAuthMiddleware(req, res, () =>
      postController.getPostById(req, res),
    ),
  );

  router.put("/:postId", (req, res) =>
    authMiddleware(req, res, () => postController.updatePost(req, res)),
  );

  router.delete("/:postId", (req, res) =>
    authMiddleware(req, res, () => postController.deletePost(req, res)),
  );

  router.post("/:postId/like", (req, res) =>
    authMiddleware(req, res, () => postController.toggleLike(req, res)),
  );

  return router;
}
