const configuredApiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();

// Leave this empty on Vercel: the API is served by the same deployment. A
// static-hosted frontend must set it to the public URL of a separate API.
const apiBase = configuredApiBase.replace(/\/+$/, "");

export const apiUrl = (pathname) => {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${apiBase}${normalizedPath}`;
};

export const getApiError = async (response, fallback) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await response.json().catch(() => ({}));
    return body.error || body.message || fallback;
  }

  return fallback;
};
