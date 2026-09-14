const mapPodcast = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  mediaUrl: row.media_url,
  thumbnailUrl: row.thumbnail_url,
  status: row.status,
  createdBy: row.created_by,
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createPodcastRepo = (db) => {
  return {
    async create(data) {
      const [result] = await db.query(
        `INSERT INTO podcasts (title, description, media_url, thumbnail_url, status, created_by, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ${data.status === "published" ? "NOW()" : "NULL"})`,
        [
          data.title,
          data.description || null,
          data.mediaUrl || null,
          data.thumbnailUrl || null,
          data.status || "draft",
          data.createdBy || null,
        ],
      );
      return this.getById(result.insertId);
    },

    async getById(id) {
      const [rows] = await db.query("SELECT * FROM podcasts WHERE id = ? LIMIT 1", [id]);
      return rows.length ? mapPodcast(rows[0]) : null;
    },

    async list({ page = 1, limit = 50, status, search } = {}) {
      const where = [];
      const params = [];
      if (status) {
        where.push("status = ?");
        params.push(status);
      }
      if (search) {
        where.push("title LIKE ?");
        params.push(`%${search}%`);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const offset = (page - 1) * limit;

      const [rows] = await db.query(
        `SELECT * FROM podcasts ${whereSql} ORDER BY COALESCE(published_at, created_at) DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM podcasts ${whereSql}`,
        params,
      );
      return {
        rows: rows.map(mapPodcast),
        total: Number(countRows[0]?.total || 0),
      };
    },

    async update(id, fields) {
      const map = {
        title: "title",
        description: "description",
        mediaUrl: "media_url",
        thumbnailUrl: "thumbnail_url",
        status: "status",
        publishedAt: "published_at",
      };
      const entries = Object.entries(fields).filter(
        ([key]) => key in map && fields[key] !== undefined,
      );
      if (!entries.length) return this.getById(id);
      const sets = entries.map(([key]) => `${map[key]} = ?`);
      const params = entries.map(([, value]) => value);
      await db.query(
        `UPDATE podcasts SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ?`,
        [...params, id],
      );
      return this.getById(id);
    },

    async setStatus(id, status) {
      await db.query(
        `UPDATE podcasts
         SET status = ?, published_at = ${status === "published" ? "NOW()" : "NULL"}, updated_at = NOW()
         WHERE id = ?`,
        [status, id],
      );
      return this.getById(id);
    },

    async remove(id) {
      await db.query("DELETE FROM podcasts WHERE id = ?", [id]);
    },
  };
};

export default createPodcastRepo;