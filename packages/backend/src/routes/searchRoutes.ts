import { Router } from "express";
import { SearchController } from "../controllers/SearchController";
import { IAnimalPostRepository } from "../dal/interfaces/IAnimalPostRepository";
import { authMiddleware } from "../middleware/authMiddleware";

export function createSearchRoutes(postRepo: IAnimalPostRepository): Router {
  const router = Router();
  const searchController = new SearchController(postRepo);

  router.post("/", (req, res) =>
    authMiddleware(req, res, () => searchController.search(req, res)),
  );

  return router;
}
