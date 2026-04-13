import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const uploadDir =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    const name = `${base}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || "5242880", 10);

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
});

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  const relativePath = path
    .join("/public/uploads", req.file.filename)
    .replace(/\\/g, "/");

  return res.status(201).json({
    success: true,
    data: { path: relativePath, filename: req.file.filename },
  });
});

router.post("/multiple", upload.array("files", 10), (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) {
    return res
      .status(400)
      .json({ success: false, message: "No files uploaded" });
  }

  const paths = files.map((f) =>
    path.join("/public/uploads", f.filename).replace(/\\/g, "/"),
  );

  return res.status(201).json({
    success: true,
    data: { paths },
  });
});

export default router;
