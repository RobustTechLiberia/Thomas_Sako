import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load server/.env relative to this file so it works from any cwd.
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const bool = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const required = (name, fallback) => {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") return fallback;
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT || 8080),
  publicUrl: required("PUBLIC_URL", "http://localhost:8080"),
  clientUrl: required("CLIENT_URL", "http://localhost:5173"),

  db: {
    host: required("DB_HOST", "localhost"),
    port: Number(process.env.DB_PORT || 3306),
    user: required("DB_USER", "root"),
    password: required("DB_PASSWORD", ""),
    database: required("DB_NAME", "db_poll"),
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    // Require an encrypted connection. Managed MySQL hosts (Aiven, Oracle
    // Cloud, RDS) are TLS-only — set DB_SSL=1 for those.
    ssl: bool(process.env.DB_SSL, false),
    // Path (inside the container/host) to a PEM CA bundle. Optional — when
    // unset, Node's trusted root CAs are used.
    sslCaPath: required("DB_SSL_CA_PATH", ""),
    // Set DB_SSL_VERIFY=0 only if the host's certificate chain cannot be
    // verified (not recommended for production).
    sslRejectUnauthorized: bool(process.env.DB_SSL_VERIFY, true),
  },

  jwt: {
    secret: required("JWT_SECRET", "dev-only-secret-change-me-in-production"),
    expiresIn: required("JWT_EXPIRES_IN", "24h"),
  },

  initialAdmin: {
    email: required("ADMIN_INITIAL_EMAIL", "admin@liberty.local"),
    password: required("ADMIN_INITIAL_PASSWORD", ""),
    name: required("ADMIN_INITIAL_NAME", "Administrator"),
    role: required("ADMIN_INITIAL_ROLE", "admin"),
    // When true, re-apply the env password/role on every boot (see seed.js).
    // Default false: the admin is only created if missing, so credentials
    // changed from the CMS survive restarts.
    resetOnBoot: bool(process.env.ADMIN_FORCE_RESET, false),
  },

  email: {
    host: required("EMAIL_HOST", "smtp.gmail.com"),
    port: Number(process.env.EMAIL_PORT || 587),
    secure: bool(process.env.EMAIL_SECURE, false),
    user: required("EMAIL_USER", ""),
    pass: required("EMAIL_PASS", ""),
    // Where internal notifications (new bookings, new content) are sent.
    // Defaults to EMAIL_USER when not provided.
    notifyTo: required("EMAIL_NOTIFY_TO", process.env.EMAIL_USER || ""),
  },

  social: {
    youtube: required("YOUTUBE_CHANNEL_URL", ""),
    facebook: required("FACEBOOK_PAGE_URL", ""),
    x: required("X_PAGE_URL", ""),
    instagram: required("INSTAGRAM_PAGE_URL", ""),
    whatsapp: required("WHATSAPP_ACCOUNT", ""),
    tiktok: required("TIKTOK_PAGE_URL", ""),
    gmail: required("GMAIL_ACCOUNT", ""),
  },

  youtube: {
    // Optional. When absent, the public podcast/playlist pages fall back to
    // CMS-managed podcasts/playlists instead of fetching live YouTube data.
    apiKey: required("YOUTUBE_API_KEY", ""),
    channelId: required("YOUTUBE_CHANNEL_ID", ""),
    channelUrl: required("YOUTUBE_CHANNEL_URL", ""),
  },
};

export default env;
