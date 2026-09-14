import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { notFound, errorHandler } from "./lib/errors.js";
import { getServices } from "./services/index.js";
import { createPublicRouter } from "./routes/public.js";
import { createLegacyRouter } from "./routes/legacy.js";
import { createAuthRouter } from "./routes/admin/auth.js";
import { createPollAdminRouter } from "./routes/admin/polls.js";
import { createPageAdminRouter } from "./routes/admin/pages.js";
import { createSubscriberAdminRouter } from "./routes/admin/subscribers.js";
import { createSettingsAdminRouter } from "./routes/admin/settings.js";
import { createMediaAdminRouter } from "./routes/admin/media.js";
import { createUsersAdminRouter } from "./routes/admin/users.js";
import { createAuditAdminRouter } from "./routes/admin/audit.js";
import { createPodcastAdminRouter } from "./routes/admin/podcasts.js";
import { createPlaylistAdminRouter } from "./routes/admin/playlists.js";
import { createLeadsAdminRouter } from "./routes/admin/leads.js";
import { createNotificationAdminRouter } from "./routes/admin/notifications.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Builds the Express app. Pass `services` to inject fakes in tests. */
export const createApp = ({ services: injected } = {}) => {
  const services = injected || getServices();
  const {
    pollService,
    subscribeService,
    contentService,
    hub,
    adminRepo,
    auditRepo,
    mediaService,
    settingsRepo,
    bookingService,
    podcastService,
    playlistService,
    youtubeService,
    notifyService,
  } = services;

  const app = express();
  app.locals.services = services;

  app.disable("x-powered-by");
  // Trust exactly one reverse proxy hop (e.g. nginx). This keeps req.ip
  // (used by rate limiters and audit logs) correct without trusting
  // arbitrary X-Forwarded-For headers. Adjust if you chain more proxies.
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // The CMS lets editors reference third-party images/embeds (ads,
      // sponsors, YouTube) and the shell loads Flowbite from a CDN, so a
      // pinned Content-Security-Policy would break legitimate content.
      // All other helmet protections (clickjacking, MIME sniffing, HSTS,
      // referrer policy) remain active.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(compression());
  app.use(
    cors({
      origin: [env.clientUrl, env.publicUrl].filter(Boolean),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "5mb" }));

  // Health check.
  app.get("/health", (_req, res) =>
    res.json({ status: "ok", uptime: process.uptime(), at: new Date().toISOString() }),
  );

  // Locally-uploaded media.
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Public / API routes.
  const publicRouter = createPublicRouter({
    pollService,
    subscribeService,
    contentService,
    bookingService,
    podcastService,
    playlistService,
    youtubeService,
    hub,
  });
  app.use("/api", publicRouter);

  const legacyRouter = createLegacyRouter({ pollService, subscribeService, contentService });
  app.use("/", legacyRouter);

  // Admin routes (JWT-protected).
  const adminRouter = express.Router();
  adminRouter.use("/auth", createAuthRouter({ adminRepo, auditRepo }));
  adminRouter.use(
    "/polls",
    createPollAdminRouter({ pollService, auditRepo, notifyService }),
  );
  adminRouter.use("/pages", createPageAdminRouter({ contentService, auditRepo }));
  adminRouter.use(
    "/subscribers",
    createSubscriberAdminRouter({ subscribeService, auditRepo }),
  );
  adminRouter.use(
    "/settings",
    createSettingsAdminRouter({ contentService, settingsRepo, auditRepo }),
  );
  adminRouter.use("/media", createMediaAdminRouter({ mediaService, auditRepo }));
  adminRouter.use("/users", createUsersAdminRouter({ adminRepo, auditRepo }));
  adminRouter.use("/audit", createAuditAdminRouter({ auditRepo }));
  adminRouter.use(
    "/podcasts",
    createPodcastAdminRouter({ podcastService, auditRepo }),
  );
  adminRouter.use(
    "/playlists",
    createPlaylistAdminRouter({ playlistService, auditRepo }),
  );
  adminRouter.use(
    "/bookings",
    createLeadsAdminRouter({ bookingService, auditRepo }),
  );
  adminRouter.use(
    "/notifications",
    createNotificationAdminRouter({ notifyService, auditRepo }),
  );
  app.use("/api/admin", adminRouter);

  // The Express process also serves the built client SPA and the admin CMS,
  // keeping the whole site on a single deploy unit.
  {
    const clientDist = path.join(__dirname, "..", "dist");
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
    }
    const adminDist = path.join(__dirname, "..", "admin", "dist");
    if (fs.existsSync(adminDist)) {
      app.use("/admin", express.static(adminDist));
    }

    // SPA fallback: any GET that is not an API call, upload or health check
    // returns the client entry (or the admin entry under /admin).
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.accepts("html") !== "html") {
        return next();
      }
      const pathSafe = req.path;
      if (pathSafe.startsWith("/api") || pathSafe.startsWith("/uploads") || pathSafe.startsWith("/health")) {
        return next();
      }
      const indexPath = pathSafe.startsWith("/admin")
        ? path.join(adminDist, "index.html")
        : path.join(clientDist, "index.html");
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      next();
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;