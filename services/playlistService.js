import { AppError } from "../lib/errors.js";
import { sanitizeText } from "../lib/validate.js";
import { env } from "../config/env.js";

export const createPlaylistService = ({ playlistRepo, notifyService }) => {
  const validatePayload = (body) => {
    const title = sanitizeText(body.title, 255);
    if (!title) throw new AppError(400, "Title is required");
    const embedUrl = sanitizeText(body.embedUrl ?? body.embed_url, 500) || "";
    if (embedUrl && !/^https?:\/\//i.test(embedUrl)) {
      throw new AppError(400, "Embed URL must be a full URL (http/https)");
    }
    const status = body.status === "published" ? "published" : "draft";
    return { title, embedUrl, status };
  };

  const notifyIfPublishing = async (before, after) => {
    if (before?.status !== "published" && after.status === "published") {
      await notifyService.sendUpdate({
        type: "playlist",
        contentId: after.id,
        title: after.title,
        url: `${env.publicUrl}/playlist`,
      });
    }
  };

  return {
    async listPublic() {
      return playlistRepo.list({ status: "published", limit: 100 });
    },

    async list(params) {
      return playlistRepo.list(params);
    },

    async getById(id) {
      return playlistRepo.getById(id);
    },

    async create(raw, actorId) {
      const data = validatePayload(raw || {});
      const playlist = await playlistRepo.create({
        ...data,
        createdBy: actorId,
      });
      await notifyIfPublishing(null, playlist);
      return playlist;
    },

    async update(id, raw, actorId) {
      const existing = await playlistRepo.getById(id);
      if (!existing) throw new AppError(404, "Playlist not found");
      const cleaned = validatePayload(raw || {});
      const playlist = await playlistRepo.update(id, {
        ...cleaned,
        updatedBy: actorId,
      });
      await notifyIfPublishing(existing, playlist);
      return playlist;
    },

    async setStatus(id, status) {
      if (!["draft", "published", "archived"].includes(status)) {
        throw new AppError(400, "Invalid status");
      }
      const existing = await playlistRepo.getById(id);
      if (!existing) throw new AppError(404, "Playlist not found");
      const playlist = await playlistRepo.setStatus(id, status);
      await notifyIfPublishing(existing, playlist);
      return playlist;
    },

    async remove(id) {
      const existing = await playlistRepo.getById(id);
      if (!existing) throw new AppError(404, "Playlist not found");
      await playlistRepo.remove(id);
      return existing;
    },
  };
};

export default createPlaylistService;