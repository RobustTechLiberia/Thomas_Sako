const mapSubscriber = (row) => ({
  id: row.id,
  email: row.email,
  status: row.is_active ? "subscribed" : "unsubscribed",
  isActive: Boolean(row.is_active),
  subscribedAt: row.subscribed_at,
  unsubscribedAt: row.unsubscribed_at,
  unsubscribeToken: row.unsubscribe_token,
});

export const createSubscriberRepo = (db) => {
  return {
    async create({ email, token }) {
      const [result] = await db.query(
        `INSERT INTO newsletter_subscribers (email, unsubscribe_token, is_active)
         VALUES (?, ?, 1)`,
        [email, token],
      );
      return this.getById(result.insertId);
    },

    async getById(id) {
      const [rows] = await db.query(
        "SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1",
        [id],
      );
      return rows.length ? mapSubscriber(rows[0]) : null;
    },

    async findByEmail(email) {
      const [rows] = await db.query(
        "SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1",
        [email],
      );
      return rows.length ? mapSubscriber(rows[0]) : null;
    },

    async findByToken(token) {
      const [rows] = await db.query(
        "SELECT * FROM newsletter_subscribers WHERE unsubscribe_token = ? LIMIT 1",
        [token],
      );
      return rows.length ? mapSubscriber(rows[0]) : null;
    },

    async list({ page = 1, limit = 20, status, search } = {}) {
      const where = [];
      const params = [];
      if (status) {
        where.push("is_active = ?");
        params.push(status === "subscribed" ? 1 : 0);
      }
      if (search) {
        where.push("email LIKE ?");
        params.push(`%${search}%`);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const offset = (page - 1) * limit;

      const [rows] = await db.query(
        `SELECT * FROM newsletter_subscribers ${whereSql} ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM newsletter_subscribers ${whereSql}`,
        params,
      );
      return {
        rows: rows.map(mapSubscriber),
        total: Number(countRows[0]?.total || 0),
      };
    },

    async setStatus(id, status) {
      const isActive = status === "subscribed";
      await db.query(
        `UPDATE newsletter_subscribers
         SET is_active = ?, unsubscribed_at = ${isActive ? "NULL" : "NOW()"}
         WHERE id = ?`,
        [isActive ? 1 : 0, id],
      );
      return this.getById(id);
    },

    async setStatusByToken(token, status) {
      const subscriber = await this.findByToken(token);
      if (!subscriber) return null;
      return this.setStatus(subscriber.id, status);
    },

    async remove(id) {
      await db.query("DELETE FROM newsletter_subscribers WHERE id = ?", [id]);
    },

    async countByStatus() {
      const [rows] = await db.query(
        `SELECT is_active, COUNT(*) AS total FROM newsletter_subscribers GROUP BY is_active`,
      );
      const out = { subscribed: 0, unsubscribed: 0 };
      for (const row of rows) {
        out[row.is_active ? "subscribed" : "unsubscribed"] = Number(row.total);
      }
      return out;
    },
  };
};

export default createSubscriberRepo;
