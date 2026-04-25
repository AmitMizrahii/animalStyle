import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { IUserRepository } from "../dal/interfaces/IUserRepository";
import { authMiddleware } from "../middleware/authMiddleware";

export function createUserRoutes(userRepo: IUserRepository): Router {
  const router = Router();
  const userController = new UserController(userRepo);

  /**
   * @swagger
   * /users/me:
   *   get:
   *     summary: Get current user profile
   *     tags: [Users]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Current user profile
   */
  router.get("/me", (req, res) =>
    authMiddleware(req, res, () => userController.getCurrentUser(req, res)),
  );

  /**
   * @swagger
   * /users/update:
   *   put:
   *     summary: Update user profile
   *     tags: [Users]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               profileImagePath:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile updated successfully
   */
  router.put("/update", (req, res) =>
    authMiddleware(req, res, () => userController.updateProfile(req, res)),
  );

  /**
   * @swagger
   * /users/{userId}:
   *   get:
   *     summary: Get a user by ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user to retrieve
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 _id:
   *                   type: string
   *                 username:
   *                   type: string
   *                 email:
   *                   type: string
   *                 profileImagePath:
   *                   type: string
   *       404:
   *         description: User not found
   */
  router.get("/:userId", (req, res) => userController.getUserById(req, res));

  return router;
}
