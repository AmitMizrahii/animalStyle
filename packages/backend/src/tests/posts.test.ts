import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { Express } from "express";
import mongoose from "mongoose";
import { afterEach } from "node:test";
import request from "supertest";
import initializeApp from "../index";
import { AnimalPost, Comment, User } from "../models";

let app: Express;
let authToken: string;

beforeEach(async () => {
  app = await initializeApp();
  await cleanDatabase();
  const user = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    passwordConfirm: "password123",
  };
  const registerResponse = await request(app).post("/auth/register").send(user);

  authToken = registerResponse.body.data.token;
});

async function cleanDatabase() {
  await User.deleteMany({});
  await AnimalPost.deleteMany({});
  await Comment.deleteMany({});
}

afterEach(async () => {
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

describe("Animal Post Controller", () => {
  describe("POST /posts", () => {
    const post = {
      name: "Buddy",
      type: "dog",
      age: 3,
      gender: "male",
      description: "A friendly and playful golden retriever",
      location: "New York",
      imagePaths: ["/uploads/buddy.jpg"],
    };

    it("should create a post with filter fields", async () => {
      const richPost = {
        ...post,
        size: "medium",
        vaccinated: true,
        neutered: true,
        goodWithKids: true,
        goodWithOtherAnimals: false,
        adoptionStatus: "available",
      };

      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(richPost);

      expect(response.status).toBe(201);
      expect(response.body.data.size).toBe("medium");
      expect(response.body.data.vaccinated).toBe(true);
      expect(response.body.data.neutered).toBe(true);
      expect(response.body.data.goodWithKids).toBe(true);
      expect(response.body.data.goodWithOtherAnimals).toBe(false);
      expect(response.body.data.adoptionStatus).toBe("available");

      const saved = await AnimalPost.findById(response.body.data._id);
      expect(saved?.size).toBe("medium");
      expect(saved?.vaccinated).toBe(true);
      expect(saved?.neutered).toBe(true);
      expect(saved?.goodWithKids).toBe(true);
      expect(saved?.goodWithOtherAnimals).toBe(false);
      expect(saved?.adoptionStatus).toBe("available");
    });

    it("should default adoptionStatus to available and booleans to false", async () => {
      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(post);

      expect(response.status).toBe(201);
      expect(response.body.data.adoptionStatus).toBe("available");
      expect(response.body.data.vaccinated).toBe(false);
      expect(response.body.data.neutered).toBe(false);
      expect(response.body.data.goodWithKids).toBe(false);
      expect(response.body.data.goodWithOtherAnimals).toBe(false);
    });

    it("should update adoptionStatus", async () => {
      const createRes = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(post);
      const postId = createRes.body.data._id;

      const updateRes = await request(app)
        .put(`/posts/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ adoptionStatus: "adopted" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.adoptionStatus).toBe("adopted");
    });

    it("should fail with invalid size value", async () => {
      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ...post, size: "giant" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should fail with invalid adoptionStatus value", async () => {
      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ...post, adoptionStatus: "sold" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should create a new post successfully", async () => {
      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(post);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(post.name);
      expect(response.body.data.type).toBe(post.type);

      const actualPost = await AnimalPost.findById(response.body.data._id);
      expect(actualPost).not.toBeNull();
      expect(actualPost?.name).toBe(post.name);
      expect(actualPost?.type).toBe(post.type);
      expect(actualPost?.age).toBe(post.age);
      expect(actualPost?.gender).toBe(post.gender);
      expect(actualPost?.description).toBe(post.description);
      expect(actualPost?.location).toBe(post.location);
      expect(actualPost?.imagePaths).toEqual(post.imagePaths);
    });

    it("should create a post with multiple images", async () => {
      const multiPost = {
        ...post,
        imagePaths: [
          "/uploads/buddy1.jpg",
          "/uploads/buddy2.jpg",
          "/uploads/buddy3.jpg",
        ],
      };

      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(multiPost);

      expect(response.status).toBe(201);
      expect(response.body.data.imagePaths).toHaveLength(3);
      expect(response.body.data.imagePaths).toEqual(multiPost.imagePaths);

      const actualPost = await AnimalPost.findById(response.body.data._id);
      expect(actualPost?.imagePaths).toEqual(multiPost.imagePaths);
    });

    it("should fail without authentication", async () => {
      const response = await request(app).post("/posts").send(post);

      expect(response.status).toBe(401);
    });

    it("should fail with invalid post type", async () => {
      const invalidPost = {
        ...post,
        type: "invalid",
      };

      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidPost);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      const actualPosts = await AnimalPost.find({});
      expect(actualPosts.length).toBe(0);
    });

    it("should fail with missing required fields", async () => {
      const post = {
        name: "Buddy",
        type: "dog",
      };

      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(post);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should fail with empty imagePaths array", async () => {
      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ...post, imagePaths: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /posts", () => {
    beforeEach(async () => {
      for (let i = 0; i < 15; i++) {
        const post = {
          name: `Animal${i}`,
          type: i % 2 === 0 ? "dog" : "cat",
          age: Math.floor(Math.random() * 10),
          gender: i % 2 === 0 ? "male" : "female",
          description: "Test description",
          location: "Test Location",
          imagePaths: [`/uploads/animal${i}.jpg`],
        };
        await request(app)
          .post("/posts")
          .set("Authorization", `Bearer ${authToken}`)
          .send(post);
      }
    });

    it("should get all posts with pagination", async () => {
      const response = await request(app).get("/posts?page=1&limit=10");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBeLessThanOrEqual(10);
      expect(response.body.data).toHaveProperty("page");
      expect(response.body.data).toHaveProperty("limit");
      expect(response.body.data).toHaveProperty("total");
      expect(response.body.data).toHaveProperty("hasMore");
    });

    it("should return correct pagination info", async () => {
      const response = await request(app).get("/posts?page=1&limit=5");

      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.hasMore).toBe(true);
    });
  });

  describe("GET /posts/:postId", () => {
    let postId: string;

    beforeEach(async () => {
      const post = {
        name: "Buddy",
        type: "dog",
        age: 3,
        gender: "male",
        description: "A friendly and playful golden retriever",
        location: "New York",
        imagePaths: ["/uploads/buddy.jpg"],
      };

      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(post);

      postId = response.body.data._id;
    });

    it("should get post by ID", async () => {
      const response = await request(app).get(`/posts/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Buddy");
    });

    it("should fail with invalid post ID", async () => {
      const response = await request(app).get(`/posts/invalid-id`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /posts/:postId", () => {
    let postId: string;

    beforeEach(async () => {
      const post = {
        name: "Buddy",
        type: "dog",
        age: 3,
        gender: "male",
        description: "A friendly and playful golden retriever",
        location: "New York",
        imagePaths: ["/uploads/buddy.jpg"],
      };

      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(post);

      postId = response.body.data._id;
    });

    it("should update post successfully", async () => {
      const update = {
        name: "Buddy Updated",
        age: 4,
      };

      const response = await request(app)
        .put(`/posts/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Buddy Updated");
      expect(response.body.data.age).toBe(4);

      const actualPost = await AnimalPost.findById(postId);
      expect(actualPost).not.toBeNull();
      expect(actualPost?.name).toBe("Buddy Updated");
      expect(actualPost?.age).toBe(4);
    });

    it("should update imagePaths successfully", async () => {
      const newPaths = ["/uploads/new1.jpg", "/uploads/new2.jpg"];

      const response = await request(app)
        .put(`/posts/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ imagePaths: newPaths });

      expect(response.status).toBe(200);
      expect(response.body.data.imagePaths).toEqual(newPaths);

      const actualPost = await AnimalPost.findById(postId);
      expect(actualPost?.imagePaths).toEqual(newPaths);
    });

    it("should fail if user is not post creator", async () => {
      const otherUser = {
        username: "otheruser",
        email: "other@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };

      const registerResponse = await request(app)
        .post("/auth/register")
        .send(otherUser);

      const otherToken = registerResponse.body.data.token;

      const response = await request(app)
        .put(`/posts/${postId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ name: "Hacked" });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /posts/:postId", () => {
    let postId: string;

    beforeEach(async () => {
      const post = {
        name: "Buddy",
        type: "dog",
        age: 3,
        gender: "male",
        description: "A friendly and playful golden retriever",
        location: "New York",
        imagePaths: ["/uploads/buddy.jpg"],
      };

      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(post);

      postId = response.body.data._id;
    });

    it("should delete post successfully", async () => {
      const response = await request(app)
        .delete(`/posts/${postId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const getResponse = await request(app).get(`/posts/${postId}`);
      expect(getResponse.status).toBe(404);
    });
  });

  describe("GET /posts/user/:userId", () => {
    it("should return posts belonging to the requested user", async () => {
      const regA = await request(app).post("/auth/register").send({
        username: "userA",
        email: "a@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });
      const tokenA = regA.body.data.token;
      const userAId = regA.body.data._id;

      const regB = await request(app).post("/auth/register").send({
        username: "userB",
        email: "b@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });
      const tokenB = regB.body.data.token;

      await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: "A's Dog",
          type: "dog",
          age: 2,
          gender: "male",
          description: "Belongs to user A",
          location: "Tel Aviv",
          imagePaths: ["/uploads/adog.jpg"],
        });

      const response = await request(app)
        .get(`/posts/user/${userAId}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const posts = response.body.data.data;
      expect(posts.length).toBe(1);
      expect(posts[0].name).toBe("A's Dog");
    });

    it("should return empty list for a user with no posts", async () => {
      const reg = await request(app).post("/auth/register").send({
        username: "empty_user",
        email: "empty@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });
      const token = reg.body.data.token;
      const userId = reg.body.data._id;

      const response = await request(app)
        .get(`/posts/user/${userId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it("should require authentication", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/posts/user/${fakeId}`);
      expect(response.status).toBe(401);
    });
  });

  describe("commentsCount", () => {
    let postId: string;

    beforeEach(async () => {
      const postRes = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Buddy",
          type: "dog",
          age: 3,
          gender: "male",
          description: "A friendly and playful golden retriever",
          location: "New York",
          imagePaths: ["/uploads/buddy.jpg"],
        });
      postId = postRes.body.data._id;
    });

    it("should be 0 on a fresh post", async () => {
      const response = await request(app).get(`/posts/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.commentsCount).toBe(0);
    });

    it("should reflect the number of comments after adding", async () => {
      await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "First comment" });

      await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Second comment" });

      const response = await request(app).get(`/posts/${postId}`);
      expect(response.body.data.commentsCount).toBe(2);
    });

    it("should reflect the number of comments after deleting", async () => {
      await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "First comment" });

      const secondRes = await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Second comment" });

      await request(app)
        .delete(`/comments/${secondRes.body.data._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      const response = await request(app).get(`/posts/${postId}`);
      expect(response.body.data.commentsCount).toBe(1);
    });

    it("should be correct across all posts in GET /posts", async () => {
      const secondPostRes = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Whiskers",
          type: "cat",
          age: 2,
          gender: "female",
          description: "A calm and quiet house cat",
          location: "Tel Aviv",
          imagePaths: ["/uploads/whiskers.jpg"],
        });
      const secondPostId = secondPostRes.body.data._id;

      await request(app)
        .post(`/comments/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Comment on first post" })
        .expect(201);

      const response = await request(app).get("/posts?page=1&limit=10");
      const posts: Array<{ _id: string; commentsCount: number }> =
        response.body.data.data;

      const first = posts.find((p) => p._id === postId);
      const second = posts.find((p) => p._id === secondPostId);

      expect(first?.commentsCount).toBe(1);
      expect(second?.commentsCount).toBe(0);
    });
  });

  describe("POST /posts/:postId/like", () => {
    let postId: string;

    beforeEach(async () => {
      const post = {
        name: "Buddy",
        type: "dog",
        age: 3,
        gender: "male",
        description: "A friendly and playful golden retriever",
        location: "New York",
        imagePaths: ["/uploads/buddy.jpg"],
      };

      const response = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(post);

      postId = response.body.data._id;
    });

    it("should like a post", async () => {
      const response = await request(app)
        .post(`/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isLiked).toBe(true);
    });

    it("should unlike a post", async () => {
      await request(app)
        .post(`/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`);

      const response = await request(app)
        .post(`/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isLiked).toBe(false);
    });
  });

  describe("GET /posts/liked/:userId", () => {
    let postId: string;
    let viewerToken: string;
    let viewerId: string;

    beforeEach(async () => {
      const postRes = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Liked Dog",
          type: "dog",
          age: 2,
          gender: "male",
          description: "A post that will be liked",
          location: "Tel Aviv",
          imagePaths: ["/uploads/liked.jpg"],
        });
      postId = postRes.body.data._id;

      // Register a second user who will like the post
      const regRes = await request(app).post("/auth/register").send({
        username: "viewer",
        email: "viewer@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });
      viewerToken = regRes.body.data.token;
      viewerId = regRes.body.data._id;
    });

    it("should return posts liked by a user", async () => {
      await request(app)
        .post(`/posts/${postId}/like`)
        .set("Authorization", `Bearer ${viewerToken}`);

      const response = await request(app)
        .get(`/posts/liked/${viewerId}`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const likedPosts = response.body.data.data;
      expect(likedPosts.length).toBe(1);
      expect(likedPosts[0]._id).toBe(postId);
      expect(likedPosts[0].isLiked).toBe(true);
    });

    it("should return empty list when user has not liked any posts", async () => {
      const response = await request(app)
        .get(`/posts/liked/${viewerId}`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it("should not include posts that were liked then unliked", async () => {
      await request(app)
        .post(`/posts/${postId}/like`)
        .set("Authorization", `Bearer ${viewerToken}`);
      await request(app)
        .post(`/posts/${postId}/like`)
        .set("Authorization", `Bearer ${viewerToken}`);

      const response = await request(app)
        .get(`/posts/liked/${viewerId}`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(0);
    });

    it("should require authentication", async () => {
      const response = await request(app).get(`/posts/liked/${viewerId}`);
      expect(response.status).toBe(401);
    });

    it("should support pagination", async () => {
      await request(app)
        .post(`/posts/${postId}/like`)
        .set("Authorization", `Bearer ${viewerToken}`);

      const response = await request(app)
        .get(`/posts/liked/${viewerId}?page=1&limit=5`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("page", 1);
      expect(response.body.data).toHaveProperty("limit", 5);
      expect(response.body.data).toHaveProperty("total", 1);
      expect(response.body.data).toHaveProperty("hasMore", false);
    });
  });
});
