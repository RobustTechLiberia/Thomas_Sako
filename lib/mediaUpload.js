import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import { AppError } from "./errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname || "").toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt || ".bin"}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new AppError(400, `Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

/**
 * Multer middleware for a single image field. Returns the local file URL
 * (served from /uploads) plus dimensions where available.
 */
export const uploadSingleImage = upload.single("file");

export const localFileUrl = (filename) => `/uploads/${filename}`;

export default uploadSingleImage;
