import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import initializeApp from "../index";
import { AnimalPost, User } from "../models";

let app: Express;

async function cleanDatabase() {
  await User.deleteMany({});
  await AnimalPost.deleteMany({});
}

beforeEach(async () => {
  app = await initializeApp();
  await cleanDatabase();
});

afterAll(async () => {
  try {
    await cleanDatabase();
    await mongoose.disconnect();
  } catch (error) {
    console.error("Cleanup error:", error);
  }
});

describe("User Controller", () => {
  describe("GET /users/me", () => {
    it("should return the current user's profile", async () => {
      const reg = await request(app).post("/auth/register").send({
        username: "me_user",
        email: "me@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });
      const token = reg.body.data.token;

      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe("me_user");
      expect(response.body.data.email).toBe("me@example.com");
      expect(response.body.data).not.toHaveProperty("password");
      expect(response.body.data).not.toHaveProperty("token");
    });

    it("should fail without authentication", async () => {
      const response = await request(app).get("/users/me");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /users/:userId", () => {
    it("should return a user by ID", async () => {
      const reg = await request(app).post("/auth/register").send({
        username: "alice",
        email: "alice@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });
      const userId = reg.body.data._id;

      const response = await request(app).get(`/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe("alice");
      expect(response.body.data).not.toHaveProperty("password");
      expect(response.body.data).not.toHaveProperty("token");
    });

    it("should return 404 for a non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/users/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });

  describe("PUT /users/update", () => {
    it("should update the authenticated user's profile", async () => {
      const reg = await request(app).post("/auth/register").send({
        username: "original",
        email: "orig@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });
      const token = reg.body.data.token;

      const response = await request(app)
        .put("/users/update")
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "updated" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe("updated");
    });

    it("should fail with a duplicate username", async () => {
      await request(app).post("/auth/register").send({
        username: "taken",
        email: "taken@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });

      const reg = await request(app).post("/auth/register").send({
        username: "other",
        email: "other@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });
      const token = reg.body.data.token;

      const response = await request(app)
        .put("/users/update")
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "taken" });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });
});
