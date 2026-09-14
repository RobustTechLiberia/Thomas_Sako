let token = localStorage.getItem("admin_token") || "";

const REQUEST_TIMEOUT_MS = 12000;

export const getToken = () => token;

export const setToken = (value) => {
  token = value || "";
  if (value) localStorage.setItem("admin_token", value);
  else localStorage.removeItem("admin_token");
};

/**
 * fetch() that aborts after REQUEST_TIMEOUT_MS so a dead proxy or hung
 * request can never leave the UI spinning on "Checking session…" etc.
 */
const fetchWithTimeout = (url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
};

const readBody = async (res) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

/**
 * Resolves a path to a full admin URL. Accepts both "bare" paths used by the
 * CMS ("/polls") and fully-qualified ones from older pages ("/admin/users").
 */
const resolvePath = (path) => {
  if (path.startsWith("/api/")) return path;
  if (path.startsWith("/admin")) return `/api${path}`;
  return `/api/admin${path}`;
};

/**
 * Authenticated JSON helper for admin endpoints. Returns the parsed body
 * directly (e.g. { rows, total }). On 401 it clears the session so the app
 * can route back to login.
 */
export const api = async (path, { method = "GET", body } = {}) => {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;

  let res;
  try {
    res = await fetchWithTimeout(resolvePath(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      const abortErr = new Error("Request timed out. Please check your connection and try again.");
      abortErr.status = 408;
      abortErr.data = null;
      throw abortErr;
    }
    throw err;
  }
  const data = await readBody(res);

  if (res.status === 401 && path !== "/auth/login") {
    setToken("");
    window.dispatchEvent(new Event("admin:unauthorized"));
  }
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

export const auth = {
  async login(email, password) {
    let res;
    try {
      res = await fetchWithTimeout("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      if (err?.name === "AbortError") {
        throw new Error("Request timed out. Please check your connection and try again.");
      }
      throw err;
    }
    const data = await readBody(res);
    if (!res.ok) throw new Error(data?.error || "Login failed");
    setToken(data.token);
    return data.user;
  },
  async me() {
    const data = await api("/auth/me");
    return data.user;
  },
  logout() {
    setToken("");
  },
};

export default api;