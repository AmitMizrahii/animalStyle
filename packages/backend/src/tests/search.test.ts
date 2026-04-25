import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { GoogleGenAI } from "@google/genai";
import { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import initializeApp from "../index";
import { AnimalPost, User } from "../models";

jest.mock("@google/genai");

jest.mock("../utils/aiHelper", () => ({
  parseSearchQuery: jest.fn(async (query: string) => {
    const lower = query.toLowerCase();
    const filters: Record<string, unknown> = {};
    if (lower.includes("dog")) filters.type = "dog";
    if (lower.includes("cat")) filters.type = "cat";
    const loc = query.match(/in\s+(\w+)/i);
    if (loc) filters.location = loc[1];
    if (lower.includes("female")) filters.gender = "female";
    else if (lower.includes("male")) filters.gender = "male";
    if (lower.includes("small")) filters.size = "small";
    if (lower.includes("vaccinated")) filters.vaccinated = true;
    if (lower.includes("kids")) filters.goodWithKids = true;
    if (lower.includes("other animals")) filters.goodWithOtherAnimals = true;
    if (lower.includes("adopted")) filters.adoptionStatus = "adopted";
    else if (lower.includes("available")) filters.adoptionStatus = "available";
    if (lower.includes("young")) filters.ageMax = 2;
    if (lower.includes("senior")) filters.ageMin = 7;
    return filters;
  }),
}));

let app: Express;
let authToken: string;

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

  const posts = [
    {
      name: "Buddy",
      type: "dog",
      age: 3,
      gender: "male",
      description: "Friendly golden retriever",
      location: "New York",
      imagePaths: ["/uploads/buddy.jpg"],
    },
    {
      name: "Luna",
      type: "cat",
      age: 2,
      gender: "female",
      description: "Calm indoor cat",
      location: "Tel Aviv",
      imagePaths: ["/uploads/luna.jpg"],
    },
    {
      name: "Max",
      type: "dog",
      age: 5,
      gender: "male",
      description: "Energetic husky mix",
      location: "New York",
      imagePaths: ["/uploads/max.jpg"],
    },
    {
      name: "Mittens",
      type: "cat",
      age: 1,
      gender: "female",
      description: "Playful kitten",
      location: "Haifa",
      imagePaths: ["/uploads/mittens.jpg"],
    },
  ];

  for (const post of posts) {
    await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send(post);
  }
});

async function cleanDatabase() {
  await User.deleteMany({});
  await AnimalPost.deleteMany({});
}

afterAll(async () => {
  try {
    await cleanDatabase();
    await mongoose.disconnect();
  } catch (error) {
    console.error("Cleanup error:", error);
  }
});

describe("Search Controller", () => {
  describe("POST /search", () => {
    it("should return all posts when query has no filters", async () => {
      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "animal" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBe(4);
    });

    it("should filter posts by type (dog)", async () => {
      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "looking for a dog" });

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBe(2);
      response.body.data.data.forEach((post: { type: string }) => {
        expect(post.type).toBe("dog");
      });
    });

    it("should filter posts by type (cat)", async () => {
      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "I want a cat" });

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBe(2);
      response.body.data.data.forEach((post: { type: string }) => {
        expect(post.type).toBe("cat");
      });
    });

    it("should filter posts by location", async () => {
      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "dog in New York" });

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBe(2);
      response.body.data.data.forEach((post: { location: string }) => {
        expect(post.location).toMatch(/New York/i);
      });
    });

    it("should return correct pagination structure", async () => {
      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "animal", page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("page");
      expect(response.body.data).toHaveProperty("limit");
      expect(response.body.data).toHaveProperty("total");
      expect(response.body.data).toHaveProperty("hasMore");
      expect(response.body.data.data.length).toBeLessThanOrEqual(2);
      expect(response.body.data.hasMore).toBe(true);
    });

    it("should include isLiked flag in results", async () => {
      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "dog" });

      expect(response.status).toBe(200);
      response.body.data.data.forEach((post: { isLiked: unknown }) => {
        expect(typeof post.isLiked).toBe("boolean");
      });
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post("/search")
        .send({ query: "dog" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should fail without a query", async () => {
      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INVALID_INPUT");
    });

    it("should return empty array when no posts match", async () => {
      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "dog in Haifa" });

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBe(0);
      expect(response.body.data.total).toBe(0);
    });

    it("should filter by gender (female)", async () => {
      await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Bella",
          type: "cat",
          age: 3,
          gender: "female",
          description: "Calm indoor female cat",
          location: "Tel Aviv",
          imagePaths: ["/uploads/bella.jpg"],
        });

      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "female cat" });

      expect(response.status).toBe(200);
      response.body.data.data.forEach((post: { gender: string }) => {
        expect(post.gender).toBe("female");
      });
    });

    it("should filter by size (small)", async () => {
      await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Tiny",
          type: "dog",
          age: 2,
          gender: "male",
          description: "A tiny small dog",
          location: "Tel Aviv",
          imagePaths: ["/uploads/tiny.jpg"],
          size: "small",
        });

      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "small dog" });

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((post: { size: string }) => {
        expect(post.size).toBe("small");
      });
    });

    it("should filter by vaccinated", async () => {
      await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Shots",
          type: "dog",
          age: 2,
          gender: "male",
          description: "Fully vaccinated healthy dog",
          location: "Tel Aviv",
          imagePaths: ["/uploads/shots.jpg"],
          vaccinated: true,
        });

      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "vaccinated dog" });

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((post: { vaccinated: boolean }) => {
        expect(post.vaccinated).toBe(true);
      });
    });

    it("should filter by goodWithKids", async () => {
      await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Family",
          type: "dog",
          age: 3,
          gender: "male",
          description: "Perfect family dog good with kids",
          location: "Tel Aviv",
          imagePaths: ["/uploads/family.jpg"],
          goodWithKids: true,
        });

      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "dog good with kids" });

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((post: { goodWithKids: boolean }) => {
        expect(post.goodWithKids).toBe(true);
      });
    });

    it("should filter by adoptionStatus (adopted)", async () => {
      await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Gone",
          type: "cat",
          age: 4,
          gender: "female",
          description: "Already found a home",
          location: "Haifa",
          imagePaths: ["/uploads/gone.jpg"],
          adoptionStatus: "adopted",
        });

      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "adopted cat" });

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((post: { adoptionStatus: string }) => {
        expect(post.adoptionStatus).toBe("adopted");
      });
    });

    it("should filter by age range (young → ageMax:2)", async () => {
      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "young cat" });

      expect(response.status).toBe(200);
      response.body.data.data.forEach((post: { age: number }) => {
        expect(post.age).toBeLessThanOrEqual(2);
      });
    });

    it("should filter by age range (senior → ageMin:7)", async () => {
      await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Elder",
          type: "dog",
          age: 9,
          gender: "male",
          description: "A calm old senior dog",
          location: "Tel Aviv",
          imagePaths: ["/uploads/elder.jpg"],
        });

      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ query: "senior dog" });

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((post: { age: number }) => {
        expect(post.age).toBeGreaterThanOrEqual(7);
      });
    });
  });
});

describe("AI Helper", () => {
  const { parseSearchQuery, parseWithGemini, mockAIParser } =
    jest.requireActual(
      "../utils/aiHelper",
    ) as typeof import("../utils/aiHelper");

  const geminiResponse = (text: string) => ({ text });

  const mockGenerateContent =
    jest.fn<() => Promise<ReturnType<typeof geminiResponse>>>();

  beforeEach(() => {
    jest
      .mocked(GoogleGenAI)
      .mockImplementation(
        () => ({ models: { generateContent: mockGenerateContent } }) as any,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("mockAIParser", () => {
    it("extracts dog type", () => {
      expect(mockAIParser("I want a dog")).toEqual({ type: "dog" });
    });

    it("extracts cat from kitten keyword", () => {
      expect(mockAIParser("cute kitten please")).toEqual({
        type: "cat",
        ageMax: 2,
      });
    });

    it("extracts small size", () => {
      expect(mockAIParser("small dog")).toMatchObject({ size: "small" });
    });

    it("extracts friendly flag", () => {
      expect(mockAIParser("friendly dog")).toMatchObject({
        goodWithKids: true,
        type: "dog",
      });
    });

    it("extracts multi-word location like Tel Aviv", () => {
      expect(mockAIParser("cat in Tel Aviv")).toMatchObject({
        location: "Tel Aviv",
      });
    });

    it("returns empty object for unrecognised query", () => {
      expect(mockAIParser("something random")).toEqual({});
    });

    it("combines multiple filters", () => {
      expect(mockAIParser("small friendly dog in New York")).toEqual({
        type: "dog",
        size: "small",
        goodWithKids: true,
        location: "New York",
      });
    });
  });

  describe("parseWithGemini", () => {
    it("returns parsed filters from a well-formed Gemini response", async () => {
      mockGenerateContent.mockResolvedValue(
        geminiResponse('{"type":"dog","location":"Tel Aviv"}'),
      );

      const result = await parseWithGemini("dog in Tel Aviv", "test-key");
      expect(result).toEqual({ type: "dog", location: "Tel Aviv" });
    });

    it("throws when Gemini returns invalid JSON", async () => {
      mockGenerateContent.mockResolvedValue(geminiResponse("not json"));

      await expect(parseWithGemini("dog", "test-key")).rejects.toThrow();
    });

    it("initialises GoogleGenAI with the provided API key", async () => {
      mockGenerateContent.mockResolvedValue(geminiResponse("{}"));

      await parseWithGemini("cat", "my-key-123");
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "my-key-123" });
    });
  });

  describe("parseSearchQuery", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("uses mock parser when GEMINI_API_KEY is not set", async () => {
      delete process.env.GEMINI_API_KEY;
      expect(await parseSearchQuery("dog in Haifa")).toMatchObject({
        type: "dog",
        location: "Haifa",
      });
      expect(GoogleGenAI).not.toHaveBeenCalled();
    });

    it("uses mock parser when GEMINI_API_KEY is the placeholder", async () => {
      process.env.GEMINI_API_KEY = "your-gemini-api-key";
      expect(await parseSearchQuery("dog")).toMatchObject({ type: "dog" });
      expect(GoogleGenAI).not.toHaveBeenCalled();
    });

    it("calls Gemini when a real key is provided", async () => {
      process.env.GEMINI_API_KEY = "real-key-abc";
      mockGenerateContent.mockResolvedValue(geminiResponse('{"type":"dog"}'));

      expect(await parseSearchQuery("dog")).toEqual({ type: "dog" });
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "real-key-abc" });
    });

    it("falls back to mock parser when Gemini throws", async () => {
      process.env.GEMINI_API_KEY = "real-key-abc";
      mockGenerateContent.mockRejectedValue(new Error("network error"));

      expect(await parseSearchQuery("cat")).toMatchObject({ type: "cat" });
    });
  });
});
