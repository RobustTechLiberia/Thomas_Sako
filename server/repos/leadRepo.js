const mapLead = (row) => ({
  id: row.id,
  source: row.source,
  name: row.name,
  email: row.email,
  phone: row.phone,
  organization: row.organization,
  eventDate: row.event_date,
  eventTime: row.event_time,
  eventType: row.event_type,
  eventLocation: row.event_location,
  message: row.message,
  status: row.status,
  assignedTo: row.assigned_to,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const VALID_STATUSES = [
  "new",
  "contacted",
  "resolved",
  "declined",
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

export const createLeadRepo = (db) => {
  return {
    async create(data) {
      const [result] = await db.query(
        `INSERT INTO leads (source, name, email, phone, organization, event_date, event_time, event_type, event_location, message, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
        [
          data.source || "booking",
          data.name,
          data.email,
          data.phone || null,
          data.organization || null,
          data.eventDate || null,
          data.eventTime || null,
          data.eventType || null,
          data.eventLocation || null,
          data.message || null,
        ],
      );
      return this.getById(result.insertId);
    },

    async getById(id) {
      const [rows] = await db.query("SELECT * FROM leads WHERE id = ? LIMIT 1", [id]);
      return rows.length ? mapLead(rows[0]) : null;
    },

    async list({ page = 1, limit = 20, source, status, search } = {}) {
      const where = [];
      const params = [];
      if (source) {
        where.push("source = ?");
        params.push(source);
      }
      if (status) {
        where.push("status = ?");
        params.push(status);
      }
      if (search) {
        where.push("(name LIKE ? OR email LIKE ? OR organization LIKE ?)");
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const offset = (page - 1) * limit;

      const [rows] = await db.query(
        `SELECT * FROM leads ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM leads ${whereSql}`,
        params,
      );
      return {
        rows: rows.map(mapLead),
        total: Number(countRows[0]?.total || 0),
      };
    },

    async countByStatus() {
      const [rows] = await db.query(
        `SELECT status, COUNT(*) AS total FROM leads GROUP BY status`,
      );
      const out = {
      new: 0,
      contacted: 0,
      resolved: 0,
      declined: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    };
      for (const row of rows) out[row.status] = Number(row.total);
      return out;
    },

    async setStatus(id, status) {
      if (!VALID_STATUSES.includes(status)) {
        throw new Error(`Invalid lead status: ${status}`);
      }
      await db.query("UPDATE leads SET status = ? WHERE id = ?", [status, id]);
      return this.getById(id);
    },

    async remove(id) {
      await db.query("DELETE FROM leads WHERE id = ?", [id]);
    },
  };
};

export default createLeadRepo;