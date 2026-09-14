import { AppError } from "../lib/errors.js";
import { sanitizeText, sanitizeLongText } from "../lib/validate.js";
import { env } from "../config/env.js";

export const createPodcastService = ({ podcastRepo, notifyService }) => {
  const validatePayload = (body) => {
    const title = sanitizeText(body.title, 255);
    if (!title) throw new AppError(400, "Title is required");
    const mediaUrl = sanitizeText(body.mediaUrl ?? body.media_url, 500) || "";
    if (mediaUrl && !/^https?:\/\//i.test(mediaUrl)) {
      throw new AppError(400, "Media URL must be a full URL (http/https)");
    }
    const status = body.status === "published" ? "published" : "draft";
    return {
      title,
      description: sanitizeLongText(body.description, 10000) || "",
      mediaUrl,
      thumbnailUrl: sanitizeText(body.thumbnailUrl ?? body.thumbnail_url, 500) || "",
      status,
    };
  };

  const notifyIfPublishing = async (before, after) => {
    if (before?.status !== "published" && after.status === "published") {
      await notifyService.sendUpdate({
        type: "podcast",
        contentId: after.id,
        title: after.title,
        description: after.description,
        thumbnailUrl: after.thumbnailUrl,
        url: `${env.publicUrl}/podcast`,
      });
    }
  };

  return {
    async listPublic() {
      return podcastRepo.list({ status: "published", limit: 100 });
    },

    async list(params) {
      return podcastRepo.list(params);
    },

    async getById(id) {
      return podcastRepo.getById(id);
    },

    async create(raw, actorId) {
      const data = validatePayload(raw || {});
      const podcast = await podcastRepo.create({
        ...data,
        createdBy: actorId,
      });
      await notifyIfPublishing(null, podcast);
      return podcast;
    },

    async update(id, raw, actorId) {
      const existing = await podcastRepo.getById(id);
      if (!existing) throw new AppError(404, "Podcast not found");
      const cleaned = validatePayload(raw || {});
      const podcast = await podcastRepo.update(id, {
        ...cleaned,
        updatedBy: actorId,
      });
      await notifyIfPublishing(existing, podcast);
      return podcast;
    },

    async setStatus(id, status) {
      if (!["draft", "published", "archived"].includes(status)) {
        throw new AppError(400, "Invalid status");
      }
      const existing = await podcastRepo.getById(id);
      if (!existing) throw new AppError(404, "Podcast not found");
      const podcast = await podcastRepo.setStatus(id, status);
      await notifyIfPublishing(existing, podcast);
      return podcast;
    },

    async remove(id) {
      const existing = await podcastRepo.getById(id);
      if (!existing) throw new AppError(404, "Podcast not found");
      await podcastRepo.remove(id);
      return existing;
    },
  };
};

export default createPodcastService;