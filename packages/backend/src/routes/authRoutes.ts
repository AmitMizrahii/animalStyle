import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { IUserRepository } from "../dal/interfaces/IUserRepository";
import { authMiddleware } from "../middleware/authMiddleware";

export function createAuthRoutes(userRepo: IUserRepository): Router {
  const router = Router();
  const authController = new AuthController(userRepo);

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               passwordConfirm:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   */
  router.post("/register", (req, res) => authController.register(req, res));

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: User logged in successfully
   */
  router.post("/login", (req, res) => authController.login(req, res));

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   */
  router.post("/refresh", (req, res) => authController.refreshToken(req, res));

  /**
   * @swagger
   * /auth/google:
   *   post:
   *     summary: Login or register with Google OAuth
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               credential:
   *                 type: string
   *                 description: Google ID token from Google Identity Services
   *     responses:
   *       200:
   *         description: Logged in / registered via Google successfully
   *       401:
   *         description: Invalid Google credential
   */
  router.post("/google", (req, res) => authController.googleLogin(req, res));

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Authentication]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: User logged out successfully
   */
  router.post("/logout", (req, res) =>
    authMiddleware(req, res, () => authController.logout(req, res)),
  );

  return router;
}
