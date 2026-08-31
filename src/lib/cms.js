const CMS_API = import.meta.env.VITE_STRAPI_URL || "/api";

/**
 * Fetch published CMS records through Strapi. In development `/api` is proxied
 * by Vite; production can set VITE_STRAPI_URL to the CMS origin.
 */
export async function getCmsCollection(contentType, query = "") {
  const response = await fetch(`${CMS_API}/${contentType}${query}`);

  if (!response.ok) {
    throw new Error(`CMS request failed (${response.status})`);
  }

  return response.json();
}
