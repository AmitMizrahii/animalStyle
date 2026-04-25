import { Router } from "express";
import { SearchController } from "../controllers/SearchController";
import { IAnimalPostRepository } from "../dal/interfaces/IAnimalPostRepository";
import { authMiddleware } from "../middleware/authMiddleware";

export function createSearchRoutes(postRepo: IAnimalPostRepository): Router {
  const router = Router();
  const searchController = new SearchController(postRepo);

  /**
   * @swagger
   * /search:
   *   post:
   *     summary: Search posts using natural language
   *     tags: [Search]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               query:
   *                 type: string
   *     responses:
   *       200:
   *         description: Search results
   */
  router.post("/", (req, res) =>
    authMiddleware(req, res, () => searchController.search(req, res)),
  );

  return router;
}
