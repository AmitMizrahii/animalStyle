import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { IUserRepository } from "../dal/interfaces/IUserRepository";
import { authMiddleware } from "../middleware/authMiddleware";

export function createAuthRoutes(userRepo: IUserRepository): Router {
  const router = Router();
  const authController = new AuthController(userRepo);

  router.post("/register", (req, res) => authController.register(req, res));

  router.post("/login", (req, res) => authController.login(req, res));

  router.post("/refresh", (req, res) => authController.refreshToken(req, res));

  router.post("/google", (req, res) => authController.googleLogin(req, res));

  router.post("/logout", (req, res) =>
    authMiddleware(req, res, () => authController.logout(req, res)),
  );

  return router;
}
