import { sendUpdateNotification } from "../lib/mailer.js";
import { env } from "../config/env.js";

const CONCURRENCY = 8;

/**
 * Broadcasts "new content" notifications to all active newsletter
 * subscribers with deduplication and delivery tracking.
 *
 * A notification is created once per content item (unique on
 * content_type + content_id). Email delivery runs in the background so the
 * publishing action never blocks on SMTP; failures are recorded per
 * subscriber and can be re-sent from the CMS (or on server restart).
 */
export const createNotifyService = ({ subscriberRepo, notificationRepo, mailer }) => {
  const flush = async (notificationId) => {
    let page = 1;
    while (true) {
      const { rows } = await notificationRepo.listRecipients({
        notificationId,
        status: "pending",
        page,
        limit: 200,
      });
      if (!rows.length) break;

      let cursor = 0;
      const runNext = async () => {
        while (cursor < rows.length) {
          const recipient = rows[cursor++];
          await sendToRecipient(recipient, notificationId);
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, rows.length) }, runNext));

      await notificationRepo.refreshTotals(notificationId);
      page += 1;
    }
  };

  const sendToRecipient = async (recipient, notificationId, { notification } = {}) => {
    const meta = notification || (await notificationRepo.getById(notificationId));
    let ok = false;
    let error = null;
    try {
      ok = await sendUpdateNotification(mailer, {
        email: recipient.email,
        item: {
          type: meta.contentType,
          title: meta.title,
          description: meta.description,
          thumbnailUrl: meta.thumbnailUrl,
          url: itemUrl(meta),
        },
      });
    } catch (err) {
      error = String(err?.message || err);
    }
    await notificationRepo.updateRecipient(recipient.id, {
      status: ok ? "sent" : "failed",
      error: ok ? null : error || "Email send failed",
    });
    return ok;
  };

  /** Builds the target URL for each content type. */
  const itemUrl = (notification) => {
    const base = env.clientUrl;
    if (notification.contentType === "poll") return `${base}/#poll`;
    return `${base}/${notification.contentType}`;
  };

  return {
    /**
     * Queues a "new content" notification. Idempotent per
     * (type, contentId): only the first call produces emails.
     *
     * @param {object} item { type: 'podcast'|'playlist'|'poll', contentId, title, description, thumbnailUrl, url }
     * @returns {Promise<{queued:number, deduplicated:boolean}>}
     */
    async sendUpdate(item) {
      if (!mailer || !item?.title || !item?.contentId) {
        return { queued: 0, sent: 0, deduplicated: false };
      }
      const existing = await notificationRepo.getByContent(item.type, item.contentId);
      if (existing) {
        return { queued: 0, sent: 0, deduplicated: true, notification: existing };
      }

      const { rows } = await subscriberRepo.list({
        page: 1,
        limit: 100000,
        status: "subscribed",
      });

      let notification;
      try {
        notification = await notificationRepo.createNotification({
          contentType: item.type,
          contentId: item.contentId,
          title: item.title,
          description: item.description,
          thumbnailUrl: item.thumbnailUrl,
          createdBy: item.createdBy || null,
          recipients: rows,
        });
      } catch (err) {
        if (err?.code === "ER_DUP_ENTRY" || String(err?.message || "").includes("Duplicate")) {
          const dup = await notificationRepo.getByContent(item.type, item.contentId);
          return { queued: 0, sent: 0, deduplicated: true, notification: dup };
        }
        throw err;
      }

      // Fire-and-forget the fan-out; failures are tracked for retry.
      flush(notification.id).catch((err) => {
        console.error("[notify] fan-out failed:", err?.message || err);
      });

      return { queued: rows.length, sent: 0, deduplicated: false, notification };
    },

    /** Re-sends failed recipients (bounded retries). Returns done count. */
    async retryFailed() {
      const failed = await notificationRepo.listFailedRecipients();
      let done = 0;
      await Promise.allSettled(
        failed.map(async (recipient) => {
          const ok = await sendToRecipient(recipient, recipient.notificationId);
          if (ok) done += 1;
          const meta = await notificationRepo.getById(recipient.notificationId);
          if (meta) await notificationRepo.refreshTotals(meta.id);
        }),
      );
      return { attempted: failed.length, sent: done };
    },

    async list(params) {
      return notificationRepo.list(params);
    },

    async listRecipients(params) {
      return notificationRepo.listRecipients(params);
    },

    async stats() {
      const [notifications, recipients] = await Promise.all([
        notificationRepo.countStats(),
        notificationRepo.countRecipientStats(),
      ]);
      return { notifications, recipients };
    },
  };
};

export default createNotifyService;