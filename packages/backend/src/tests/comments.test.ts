import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import initializeApp from "../index";
import { AnimalPost, Comment, User } from "../models";

let app: Express;
let authToken: string;
let postId: string;

const testPost = {
  name: "Buddy",
  type: "dog",
  age: 3,
  gender: "male",
  description: "A friendly and playful golden retriever",
  location: "New York",
  imagePaths: ["/uploads/buddy.jpg"],
};

beforeEach(async () => {
  app = await initializeApp();
  await cleanDatabase();
  const registerRes = await request(app).post("/auth/register").send({
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    passwordConfirm: "password123",
  });
  authToken = registerRes.body.data.token;

  const postRes = await request(app)
    .post("/posts")
    .set("Authorization", `Bearer ${authToken}`)
    .send(testPost);
  postId = postRes.body.data._id;
});

async function cleanDatabase() {
  await User.deleteMany({});
  await AnimalPost.deleteMany({});
  await Comment.deleteMany({});
}

afterAll(async () => {
  try {
    await cleanDatabase();
    await mongoose.disconnect();
  } catch (error) {
    console.error("Cleanup error:", error);
  }
});

describe("Comment Controller", () => {
  describe("POST /comments/:postId", () => {
    it("should add a comment to a post", async () => {
      const response = await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "What a lovely dog!" });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe("What a lovely dog!");
      expect(response.body.data.postId).toBe(postId);

      const actualComment = await Comment.findById(response.body.data._id);
      expect(actualComment).not.toBeNull();
      expect(actualComment?.content).toBe("What a lovely dog!");
      expect(actualComment?.postId.toString()).toBe(postId);
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post(`/comments/${postId}`)
        .send({ content: "What a lovely dog!" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      const actualComments = await Comment.find({});
      expect(actualComments.length).toBe(0);
    });

    it("should fail with empty content", async () => {
      const response = await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "  " });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should fail with missing content", async () => {
      const response = await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /comments/:postId", () => {
    beforeEach(async () => {
      await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Comment one" });

      await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Comment two" });
    });

    it("should get all comments for a post", async () => {
      const response = await request(app).get(`/comments/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBe(2);
    });

    it("should return paginated results", async () => {
      const response = await request(app).get(
        `/comments/${postId}?page=1&limit=1`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBe(1);
      expect(response.body.data).toHaveProperty("hasMore");
      expect(response.body.data.hasMore).toBe(true);
    });

    it("should populate userId with public user info", async () => {
      const response = await request(app).get(`/comments/${postId}`);

      const comment = response.body.data.data[0];
      expect(comment.userId).toHaveProperty("username");
      expect(comment.userId).not.toHaveProperty("password");
    });
  });

  describe("DELETE /comments/:commentId", () => {
    let commentId: string;

    beforeEach(async () => {
      const commentRes = await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "To be deleted" });
      commentId = commentRes.body.data._id;
    });

    it("should delete own comment", async () => {
      const response = await request(app)
        .delete(`/comments/${commentId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const actualComment = await Comment.findById(commentId);
      expect(actualComment).toBeNull();
    });

    it("should fail if user is not the comment owner", async () => {
      const otherRes = await request(app).post("/auth/register").send({
        username: "otheruser",
        email: "other@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });
      const otherToken = otherRes.body.data.token;

      const response = await request(app)
        .delete(`/comments/${commentId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      const actualComment = await Comment.findById(commentId);
      expect(actualComment).not.toBeNull();
    });

    it("should fail without authentication", async () => {
      const response = await request(app).delete(`/comments/${commentId}`);

      expect(response.status).toBe(401);
    });
  });
});
