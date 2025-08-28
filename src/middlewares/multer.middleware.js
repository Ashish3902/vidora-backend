// src/middlewares/multer.middleware.js
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ApiError } from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp directory exists
const TEMP_DIR = path.resolve(process.cwd(), "public", "temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Size limits
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed types
export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/avi",
  "video/mov",
  "video/wmv",
  "video/flv",
  "video/webm",
  "video/mkv",
]);

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const name = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

// File filter (type-level validation; size enforced by limits)
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "videoFile") {
    if (!ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
      return cb(
        new ApiError(
          400,
          `Invalid video format. Allowed: ${Array.from(ALLOWED_VIDEO_TYPES)
            .map((t) => t.split("/")[1])
            .join(", ")}`
        )
      );
    }
  } else if (file.fieldname === "thumbnail") {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(
        new ApiError(
          400,
          `Invalid image format. Allowed: ${Array.from(ALLOWED_IMAGE_TYPES)
            .map((t) => t.split("/")[1])
            .join(", ")}`
        )
      );
    }
  }
  cb(null, true);
};

// Generic multi-file uploader (used for create)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    // Multer’s fileSize applies to each file separately.
    // We set the max to video size; thumbnail is validated in controller too.
    fileSize: MAX_VIDEO_SIZE,
    files: 3,
  },
});

// Single-purpose helpers
export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
});

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

// Centralized Multer error handler (use right after multer middleware in routes)
export const handleMulterError = (error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Multer codes: LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, LIMIT_UNEXPECTED_FILE, etc.
    let message = "Upload error.";
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Max 500MB for video and 5MB for images.";
    } else if (error.code === "LIMIT_FILE_COUNT") {
      message = "Too many files. Only videoFile and thumbnail are allowed.";
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message =
        'Unexpected file field. Allowed fields: "videoFile", "thumbnail".';
    }
    return res.status(400).json({ success: false, message, code: error.code });
  }

  if (error instanceof ApiError) {
    return res
      .status(error.statusCode)
      .json({ success: false, message: error.message });
  }

  return next(error);
};
