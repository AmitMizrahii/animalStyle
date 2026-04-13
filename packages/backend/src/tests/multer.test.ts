import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { Express } from "express";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import request from "supertest";
import initializeApp from "../index";

let app: Express;

beforeEach(async () => {
  app = await initializeApp();
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error("Cleanup error:", error);
  }
});

describe("Multer Upload Routes", () => {
  describe("POST /upload (single file)", () => {
    it("should upload a single file successfully", async () => {
      const response = await request(app)
        .post("/upload")
        .attach("file", Buffer.from("fake image content"), "test-image.jpg");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("path");
      expect(response.body.data).toHaveProperty("filename");
      expect(response.body.data.path).toMatch(/^\/public\/uploads\//);

      const uploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(uploadDir, response.body.data.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    it("should return 400 when no file is provided", async () => {
      const response = await request(app).post("/upload");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("No file uploaded");
    });

    it("should sanitize filename by replacing spaces with dashes", async () => {
      const response = await request(app)
        .post("/upload")
        .attach("file", Buffer.from("content"), "my file name.png");

      expect(response.status).toBe(201);
      expect(response.body.data.filename).not.toContain(" ");
      expect(response.body.data.filename).toMatch(/my-file-name-\d+\.png/);

      const uploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(uploadDir, response.body.data.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    it("should preserve the file extension", async () => {
      const response = await request(app)
        .post("/upload")
        .attach("file", Buffer.from("content"), "photo.jpeg");

      expect(response.status).toBe(201);
      expect(response.body.data.filename).toMatch(/\.jpeg$/);

      const uploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(uploadDir, response.body.data.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    it("should reject a file exceeding the size limit", async () => {
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || "5242880", 10);
      const oversizedBuffer = Buffer.alloc(maxSize + 1, "x");

      const response = await request(app)
        .post("/upload")
        .attach("file", oversizedBuffer, "big-file.jpg");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject non-image files", async () => {
      const response = await request(app)
        .post("/upload")
        .attach("file", Buffer.from("not an image"), {
          filename: "document.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Only image files are allowed");
    });
  });

  describe("POST /upload/multiple (multiple files)", () => {
    it("should upload multiple files successfully", async () => {
      const response = await request(app)
        .post("/upload/multiple")
        .attach("files", Buffer.from("content1"), "file1.jpg")
        .attach("files", Buffer.from("content2"), "file2.jpg");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("paths");
      expect(response.body.data.paths).toHaveLength(2);
      expect(response.body.data.paths[0]).toMatch(/^\/public\/uploads\//);

      const uploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
      for (const filePath of response.body.data.paths) {
        const filename = path.basename(filePath);
        const fullPath = path.join(uploadDir, filename);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    });

    it("should return 400 when no files are provided", async () => {
      const response = await request(app).post("/upload/multiple");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("No files uploaded");
    });

    it("should upload up to 10 files", async () => {
      const req = request(app).post("/upload/multiple");
      for (let i = 1; i <= 10; i++) {
        req.attach("files", Buffer.from(`content${i}`), `file${i}.jpg`);
      }

      const response = await req;

      expect(response.status).toBe(201);
      expect(response.body.data.paths).toHaveLength(10);

      const uploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
      for (const filePath of response.body.data.paths) {
        const filename = path.basename(filePath);
        const fullPath = path.join(uploadDir, filename);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    });

    it("should reject non-image files", async () => {
      const response = await request(app)
        .post("/upload/multiple")
        .attach("files", Buffer.from("not an image"), {
          filename: "script.js",
          contentType: "application/javascript",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Only image files are allowed");
    });

    it("should upload a single file via the multiple endpoint", async () => {
      const response = await request(app)
        .post("/upload/multiple")
        .attach("files", Buffer.from("only one"), "solo.png");

      expect(response.status).toBe(201);
      expect(response.body.data.paths).toHaveLength(1);

      const uploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
      const filename = path.basename(response.body.data.paths[0]);
      const fullPath = path.join(uploadDir, filename);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });
  });
});
