import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AppError } from "../lib/errors.js";
import { localFileUrl } from "../lib/mediaUpload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_UPLOADS = path.join(__dirname, "..", "uploads");

const imageSize = (filePath) => {
  try {
    // Minimal best-effort dimension read for local uploads (PNG/JPEG).
    const buf = fs.readFileSync(filePath).subarray(0, 128);
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) { i += 1; continue; }
        const marker = buf[i + 1];
        if (marker >= 0xc0 && marker <= 0xc3) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        const len = buf.readUInt16BE(i + 2);
        i += 2 + len;
      }
    }
  } catch {
    /* dimensions optional */
  }
  return { width: null, height: null };
};

export const createMediaService = ({ mediaRepo }) => {
  return {
    async list(params) {
      return mediaRepo.list(params);
    },

    /**
     * Persists a locally-uploaded file (served from /uploads) as a media
     * asset. Cloudinary integration can be layered on later without
     * changing this contract.
     */
    async saveUploaded(file, uploadedBy) {
      const filename = file.filename || file.originalname;
      const filePath = path.join(ROOT_UPLOADS, file.filename);
      const { width, height } = imageSize(filePath);
      const url = localFileUrl(file.filename);
      return mediaRepo.create({
        publicId: file.filename,
        url,
        filename: file.originalname || filename,
        fileType: file.mimetype,
        fileSize: file.size,
        width,
        height,
        uploadedBy,
      });
    },

    async remove(id) {
      const media = await mediaRepo.getById(id);
      if (!media) throw new AppError(404, "Media not found");
      // Best-effort delete of the local file (only for locally stored media).
      if (media.publicId && media.url.startsWith("/uploads/")) {
        try {
          fs.unlinkSync(path.join(ROOT_UPLOADS, media.publicId));
        } catch {
          /* file already gone */
        }
      }
      await mediaRepo.remove(id);
      return media;
    },
  };
};

export default createMediaService;