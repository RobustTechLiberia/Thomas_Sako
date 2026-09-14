/**
 * Small helpers for turning CMS-supplied YouTube/media URLs into safe
 * embeddable iframe sources and "watch on YouTube" links. Everything stays
 * on the site — YouTube is only an optional external link.
 */

const extractVideoId = (url) => {
  try {
    const parsed = new URL(url, location.origin);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.split("/")[1] || null;
    }
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname.startsWith("/watch")) {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/live/")) {
        const part = parsed.pathname.split("/").pop() || "";
        return /^[\w-]{6,}$/.test(part) ? part : parsed.searchParams.get("v");
      }
}
    } catch {
      /* not a URL we recognize */
    }
    return null;
  };

  const extractPlaylistId = (url) => {
  try {
    const parsed = new URL(url, location.origin);
    if (parsed.hostname.endsWith("youtube.com") && parsed.pathname.startsWith("/playlist")) {
      return parsed.searchParams.get("list");
    }
    if (parsed.hostname.endsWith("youtube.com") && parsed.pathname.startsWith("/embed/videoseries")) {
      return parsed.searchParams.get("list");
    }
    } catch {
      /* not a URL we recognize */
    }
    return null;
  };

/** Converts any YouTube URL to an iframe embed source. */
export const toEmbedUrl = (url) => {
  if (!url) return "";
  const videoId = extractVideoId(url);
  if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0`;
  const playlistId = extractPlaylistId(url);
  if (playlistId) return `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0`;
  return url;
};

/** Converts an embed/media URL to a viewable YouTube page URL. */
export const toWatchUrl = (url) => {
  if (!url) return "";
  const videoId = extractVideoId(url);
  if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
  const playlistId = extractPlaylistId(url);
  if (playlistId) return `https://www.youtube.com/playlist?list=${playlistId}`;
  return url;
};

export default { toEmbedUrl, toWatchUrl };