import { env } from "../config/env.js";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_RESULTS = 12;

const toVideoId = (item) => item?.id?.videoId || null;

const mapVideo = (item) => {
  const videoId = toVideoId(item);
  const thumb = item?.snippet?.thumbnails?.high || item?.snippet?.thumbnails?.medium;
  return {
    id: videoId,
    title: item?.snippet?.title || "Untitled",
    description: item?.snippet?.description || "",
    publishedAt: item?.snippet?.publishedAt || null,
    thumbnailUrl: thumb?.url || "",
    watchUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
    embedUrl: videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : "",
  };
};

/**
 * Fetches the latest uploads from the configured YouTube channel via the
 * YouTube Data API v3. Returns an empty array (never throws) when the API
 * key / channel id are not configured or the network call fails; the public
 * pages then fall back to CMS-managed podcasts and playlists.
 */
export const createYoutubeService = () => {
  let cache = { at: 0, items: [] };

  return {
    clearCache() {
      cache = { at: 0, items: [] };
    },

    async latest(limit = MAX_RESULTS) {
      const apiKey = env.youtube.apiKey;
      const channelId = env.youtube.channelId;
      if (!apiKey || !channelId) return [];

      if (Date.now() - cache.at < CACHE_TTL_MS) {
        return cache.items.slice(0, limit);
      }

      try {
        const params = new URLSearchParams({
          part: "snippet",
          channelId,
          type: "video",
          order: "date",
          maxResults: String(MAX_RESULTS),
          key: apiKey,
        });
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?${params}`,
          { signal: AbortSignal.timeout(8000) },
        );
        if (!res.ok) return [];
        const data = await res.json();
        cache = {
          at: Date.now(),
          items: (data?.items || [])
            .filter((item) => toVideoId(item))
            .map(mapVideo),
        };
        return cache.items.slice(0, limit);
      } catch {
        return [];
      }
    },
  };
};

export default createYoutubeService;