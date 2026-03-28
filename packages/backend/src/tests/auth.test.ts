import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import initializeApp from "../index";
import { User } from "../models";

let app: Express;

beforeEach(async () => {
  app = await initializeApp();
  await cleanDatabase();
});

async function cleanDatabase() {
  try {
    await User.deleteMany({});
  } catch (error) {
    console.error("Error cleaning database:", error);
  }
}
afterAll(async () => {
  await cleanDatabase();
  await mongoose.disconnect();
});

describe("Authentication Controller", () => {
  describe("POST /auth/register", () => {
    const newUser = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      passwordConfirm: "password123",
    };

    it("should register a new user successfully", async () => {
      const response = await request(app).post("/auth/register").send(newUser);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data).toHaveProperty("refreshToken");
      expect(response.body.data.username).toBe(newUser.username);
      expect(response.body.data.email).toBe(newUser.email);

      const dbUser = await User.findOne({ email: newUser.email }).select(
        "+refreshToken",
      );
      expect(dbUser).not.toBeNull();
      expect(dbUser?.username).toBe(newUser.username);
      expect(dbUser?.refreshToken).toBe(response.body.data.refreshToken);
    });

    it("should fail if username already exists", async () => {
      await request(app).post("/auth/register").send(newUser);
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...newUser,
          passwordConfirm: "password123",
          password: "password123",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      const actualUsers = await User.find({});
      expect(actualUsers.length).toBe(1);
    });

    it("should fail if passwords don't match", async () => {
      const user = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        passwordConfirm: "password456",
      };

      const response = await request(app).post("/auth/register").send(user);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("PASSWORD_MISMATCH");
    });

    it("should fail if email is invalid", async () => {
      const user = {
        username: "testuser",
        email: "invalid-email",
        password: "password123",
        passwordConfirm: "password123",
      };

      const response = await request(app).post("/auth/register").send(user);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should fail if required fields are missing", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      const user = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };
      await request(app).post("/auth/register").send(user);
    });

    it("should login user with correct credentials", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data).toHaveProperty("refreshToken");
    });

    it("should fail with incorrect password", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should fail with non-existent email", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should fail if email is missing", async () => {
      const response = await request(app).post("/auth/login").send({
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/refresh", () => {
    let refreshToken: string;
    const userEmail = "test@example.com";
    beforeEach(async () => {
      const user = {
        username: "testuser",
        email: userEmail,
        password: "password123",
        passwordConfirm: "password123",
      };
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(user);
      refreshToken = registerResponse.body.data.refreshToken;
    });

    it("should refresh token with valid refresh token", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data).toHaveProperty("refreshToken");

      const dbUser = await User.findOne({ email: userEmail }).select(
        "+refreshToken",
      );
      expect(dbUser).not.toBeNull();
      expect(dbUser?.refreshToken).toBe(response.body.data.refreshToken);
    });

    it("should fail with invalid refresh token", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should fail if refresh token is missing", async () => {
      const response = await request(app).post("/auth/refresh").send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("test double use of refresh token", async () => {
      const refreshResponse1 = await request(app).post("/auth/refresh").send({
        refreshToken,
      });
      expect(refreshResponse1.statusCode).toBe(200);
      expect(refreshResponse1.body.data).toHaveProperty("token");
      expect(refreshResponse1.body.data).toHaveProperty("refreshToken");
      const firstNewRefreshToken = refreshResponse1.body.data.refreshToken;

      const refreshResponse2 = await request(app).post("/auth/refresh").send({
        refreshToken: refreshToken,
      });
      expect(refreshResponse2.statusCode).toBe(401);
      expect(refreshResponse2.body.data).toHaveProperty("error");

      const refreshResponse3 = await request(app).post("/auth/refresh").send({
        refreshToken: firstNewRefreshToken,
      });
      expect(refreshResponse3.statusCode).toBe(401);
      expect(refreshResponse3.body.data).toHaveProperty("error");
    });
  });

  describe("POST /auth/logout", () => {
    let token: string;
    const email: string = "test@example.com";
    beforeEach(async () => {
      const reg = await request(app).post("/auth/register").send({
        username: "testuser",
        email: email,
        password: "password123",
        passwordConfirm: "password123",
      });
      token = reg.body.data.token;
    });

    it("should logout successfully with valid token", async () => {
      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe("Logged out successfully");

      const dbUser = await User.findOne({ email: email }).select(
        "+refreshToken",
      );
      expect(dbUser).not.toBeNull();
      expect(dbUser?.refreshToken).toBeNull();
    });

    it("should fail without authentication", async () => {
      const response = await request(app).post("/auth/logout");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
