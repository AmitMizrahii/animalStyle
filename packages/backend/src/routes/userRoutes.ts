import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { IUserRepository } from "../dal/interfaces/IUserRepository";
import { authMiddleware } from "../middleware/authMiddleware";

export function createUserRoutes(userRepo: IUserRepository): Router {
  const router = Router();
  const userController = new UserController(userRepo);

  router.get("/me", (req, res) =>
    authMiddleware(req, res, () => userController.getCurrentUser(req, res)),
  );

  router.put("/update", (req, res) =>
    authMiddleware(req, res, () => userController.updateProfile(req, res)),
  );

  router.get("/:userId", (req, res) => userController.getUserById(req, res));

  return router;
}
