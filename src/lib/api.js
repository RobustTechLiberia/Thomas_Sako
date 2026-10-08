const configuredApiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();

const apiBase = configuredApiBase.replace(/\/+\$/, "");

export const apiUrl = (pathname) => {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${apiBase}${normalizedPath}`;
};

export const getApiError = (errorData, fallback) => {
  if (!errorData) return fallback;

  if (typeof errorData === "object") {
    return errorData.error || errorData.message || fallback;
  }

  return errorData || fallback;
};
