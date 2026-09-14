import { env } from "../config/env.js";
import { getPool } from "../db/pool.js";
import { createHub } from "../lib/realtime.js";
import { sendSubscriptionEmail, createMailer } from "../lib/mailer.js";
import { createPollRepo } from "../repos/pollRepo.js";
import { createSubscriberRepo } from "../repos/subscriberRepo.js";
import { createAdminRepo } from "../repos/adminRepo.js";
import { createPageRepo } from "../repos/pageRepo.js";
import { createSettingsRepo } from "../repos/settingsRepo.js";
import { createMediaRepo } from "../repos/mediaRepo.js";
import { createAuditRepo } from "../repos/auditRepo.js";
import { createLeadRepo } from "../repos/leadRepo.js";
import { createPodcastRepo } from "../repos/podcastRepo.js";
import { createPlaylistRepo } from "../repos/playlistRepo.js";
import { createNotificationRepo } from "../repos/notificationRepo.js";
import { createPollService } from "./pollService.js";
import { createSubscribeService } from "./subscribeService.js";
import { createContentService } from "./contentService.js";
import { createMediaService } from "./mediaService.js";
import { createNotifyService } from "./notifyService.js";
import { createBookingService } from "./bookingService.js";
import { createPodcastService } from "./podcastService.js";
import { createPlaylistService } from "./playlistService.js";
import { createYoutubeService } from "./youtubeService.js";

/**
 * Assembles all repositories and services against the shared connection
 * pool. Each importable concern gets its own repo so modules stay focused.
 * Exported so the main app can wire routes and tests can inject fakes.
 */
export const buildServices = () => {
  const db = getPool();
  const hub = createHub();

  const adminRepo = createAdminRepo(db);
  const pollRepo = createPollRepo(db);
  const subscriberRepo = createSubscriberRepo(db);
  const pageRepo = createPageRepo(db);
  const settingsRepo = createSettingsRepo(db);
  const mediaRepo = createMediaRepo(db);
  const auditRepo = createAuditRepo(db);
  const notificationRepo = createNotificationRepo(db);
  const leadRepo = createLeadRepo(db);
  const podcastRepo = createPodcastRepo(db);
  const playlistRepo = createPlaylistRepo(db);

  const mailer = createMailer();
  const sendEmail = mailer
    ? ({ email, token }) => sendSubscriptionEmail(mailer, { email, token })
    : null;

  const subscribeService = createSubscribeService({ subscriberRepo, mailer, sendEmail });
  const contentService = createContentService({
    pageRepo,
    settingsRepo,
    socialDefaults: env.social,
  });
  const mediaService = createMediaService({ mediaRepo });
  const notifyService = createNotifyService({ subscriberRepo, notificationRepo, mailer });
  const bookingService = createBookingService({ leadRepo, mailer });
  const podcastService = createPodcastService({ podcastRepo, notifyService });
  const playlistService = createPlaylistService({ playlistRepo, notifyService });
  const youtubeService = createYoutubeService();

  const pollService = createPollService({ pollRepo, hub, notifyService });

  return {
    db,
    hub,
    adminRepo,
    pollRepo,
    subscriberRepo,
    pageRepo,
    settingsRepo,
    mediaRepo,
    auditRepo,
    leadRepo,
    podcastRepo,
    playlistRepo,
    pollService,
    subscribeService,
    contentService,
    mediaService,
    notifyService,
    bookingService,
    podcastService,
    playlistService,
    youtubeService,
    sendEmail,
  };
};

let singleton;
export const getServices = () => {
  if (!singleton) singleton = buildServices();
  return singleton;
};

export default {
  buildServices,
  getServices,
};
