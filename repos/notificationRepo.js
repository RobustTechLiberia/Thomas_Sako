const mapNotification = (row) => ({
  id: row.id,
  contentType: row.content_type,
  contentId: row.content_id,
  title: row.title,
  description: row.description,
  thumbnailUrl: row.thumbnail_url,
  status: row.status,
  totalRecipients: Number(row.total_recipients || 0),
  sentRecipients: Number(row.sent_recipients || 0),
  failedRecipients: Number(row.failed_recipients || 0),
  createdBy: row.created_by,
  createdAt: row.created_at,
});

const mapRecipient = (row) => ({
  id: row.id,
  notificationId: row.notification_id,
  subscriberId: row.subscriber_id,
  email: row.email,
  status: row.status,
  attempts: Number(row.attempts || 0),
  error: row.error,
  sentAt: row.sent_at,
});

export const createNotificationRepo = (db) => {
  return {
    /** Returns the notification that was already created for this content, if any. */
    async getByContent(contentType, contentId) {
      const [rows] = await db.query(
        "SELECT * FROM content_notifications WHERE content_type = ? AND content_id = ? LIMIT 1",
        [contentType, contentId],
      );
      return rows.length ? mapNotification(rows[0]) : null;
    },

    async getById(id) {
      const [rows] = await db.query(
        "SELECT * FROM content_notifications WHERE id = ? LIMIT 1",
        [id],
      );
      return rows.length ? mapNotification(rows[0]) : null;
    },

    /**
     * Stores a notification plus one recipient row per active subscriber
     * (single insert for the notification, one insert per recipient).
     */
    async createNotification({ contentType, contentId, title, description, thumbnailUrl, createdBy = null, recipients = [] }) {
      const [result] = await db.query(
        `INSERT INTO content_notifications
           (content_type, content_id, title, description, thumbnail_url, status, total_recipients, created_by)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
          contentType,
          contentId,
          title,
          description || null,
          thumbnailUrl || null,
          recipients.length,
          createdBy,
        ],
      );
      for (const subscriber of recipients) {
        await db.query(
          `INSERT INTO content_notification_recipients
             (notification_id, subscriber_id, email)
           VALUES (?, ?, ?)`,
          [result.insertId, subscriber.id, subscriber.email],
        ).catch(() => {});
      }
      return this.getById(result.insertId);
    },

    async list({ page = 1, limit = 20, status, contentType } = {}) {
      const where = [];
      const params = [];
      if (status) {
        where.push("status = ?");
        params.push(status);
      }
      if (contentType) {
        where.push("content_type = ?");
        params.push(contentType);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const offset = (page - 1) * limit;

      const [rows] = await db.query(
        `SELECT * FROM content_notifications ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM content_notifications ${whereSql}`,
        params,
      );
      return {
        rows: rows.map(mapNotification),
        total: Number(countRows[0]?.total || 0),
      };
    },

    async listRecipients({ notificationId, status, page = 1, limit = 50 } = {}) {
      const where = ["notification_id = ?"];
      const params = [notificationId];
      if (status) {
        where.push("status = ?");
        params.push(status);
      }
      const whereSql = where.join(" AND ");
      const offset = (page - 1) * limit;

      const [rows] = await db.query(
        `SELECT * FROM content_notification_recipients
         WHERE ${whereSql} ORDER BY id ASC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM content_notification_recipients WHERE ${whereSql}`,
        params,
      );
      return {
        rows: rows.map(mapRecipient),
        total: Number(countRows[0]?.total || 0),
      };
    },

    /** Marks one recipient as sent/failed; bumps attempts on each try. */
    async updateRecipient(id, { status, error = null }) {
      await db.query(
        `UPDATE content_notification_recipients
         SET status = ?, error = ?, attempts = attempts + 1,
             sent_at = ${status === "sent" ? "NOW()" : "sent_at"}
         WHERE id = ?`,
        [status, error, id],
      );
      return true;
    },

    /** Aggregates a notification's totals from its recipient rows. */
    async refreshTotals(notificationId) {
      const [rows] = await db.query(
        `SELECT
           SUM(status = 'sent') AS sent,
           SUM(status = 'failed') AS failed,
           SUM(status IN ('pending','processing')) AS pending
         FROM content_notification_recipients
         WHERE notification_id = ?`,
        [notificationId],
      );
      const sent = Number(rows[0]?.sent || 0);
      const failed = Number(rows[0]?.failed || 0);
      const pending = Number(rows[0]?.pending || 0);
      await db.query(
        `UPDATE content_notifications
         SET sent_recipients = ?, failed_recipients = ?,
             status = ? WHERE id = ?`,
        [
          sent,
          failed,
          pending === 0 ? (failed > 0 && sent === 0 ? "failed" : "sent") : "processing",
          notificationId,
        ],
      );
    },

    /** Failed recipients that have not exhausted their retry budget. */
    async listFailedRecipients(page = 1, limit = 200) {
      const offset = (page - 1) * limit;
      const [rows] = await db.query(
        `SELECT * FROM content_notification_recipients
         WHERE status = 'failed' AND attempts < 5
         ORDER BY id ASC LIMIT ? OFFSET ?`,
        [limit, offset],
      );
      return rows.map(mapRecipient);
    },

    async countStats() {
      const [rows] = await db.query(
        `SELECT status, COUNT(*) AS total FROM content_notifications GROUP BY status`,
      );
      const out = { pending: 0, processing: 0, sent: 0, failed: 0 };
      for (const row of rows) out[row.status] = Number(row.total);
      return out;
    },

    async countRecipientStats() {
      const [rows] = await db.query(
        `SELECT status, COUNT(*) AS total FROM content_notification_recipients GROUP BY status`,
      );
      const out = { pending: 0, sent: 0, failed: 0 };
      for (const row of rows) out[row.status] = Number(row.total);
      return out;
    },
  };
};

export default createNotificationRepo;