const mapPage = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  body: typeof row.body === "string" ? JSON.parse(row.body) : row.body,
  status: row.status,
  updatedBy: row.updated_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createPageRepo = (db) => {
  return {
    async getBySlug(slug, status = null) {
      const params = [slug];
      let statusSql = "";
      if (status) {
        statusSql = " AND status = ?";
        params.push(status);
      }
      const [rows] = await db.query(
        `SELECT * FROM pages WHERE slug = ?${statusSql} LIMIT 1`,
        params,
      );
      return rows.length ? mapPage(rows[0]) : null;
    },

    async getById(id) {
      const [rows] = await db.query("SELECT * FROM pages WHERE id = ? LIMIT 1", [id]);
      return rows.length ? mapPage(rows[0]) : null;
    },

    async list({ page = 1, limit = 20, search, status } = {}) {
      const where = [];
      const params = [];
      if (search) {
        where.push("(title LIKE ? OR slug LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      }
      if (status) {
        where.push("status = ?");
        params.push(status);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const offset = (page - 1) * limit;

      const [rows] = await db.query(
        `SELECT * FROM pages ${whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM pages ${whereSql}`,
        params,
      );
      return {
        rows: rows.map(mapPage),
        total: Number(countRows[0]?.total || 0),
      };
    },

    async create({ slug, title, description, body, status, updatedBy }) {
      const [result] = await db.query(
        `INSERT INTO pages (slug, title, description, body, status, updated_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [slug, title, description, JSON.stringify(body || []), status, updatedBy],
      );
      return this.getById(result.insertId);
    },

    async update(id, fields) {
      const map = {
        slug: "slug",
        title: "title",
        description: "description",
        body: "body",
        status: "status",
        updatedBy: "updated_by",
      };
      const entries = Object.entries(fields).filter(
        ([key]) => key in map && fields[key] !== undefined,
      );
      if (!entries.length) return this.getById(id);
      const sets = entries.map(([key]) => `${map[key]} = ?`);
      const params = entries.map(([key, value]) =>
        key === "body" ? JSON.stringify(value) : value,
      );
      await db.query(
        `UPDATE pages SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ?`,
        [...params, id],
      );
      return this.getById(id);
    },

    async remove(id) {
      await db.query("DELETE FROM pages WHERE id = ?", [id]);
    },

    async findBySlugExcluding(slug, excludeId) {
      const [rows] = await db.query(
        "SELECT id FROM pages WHERE slug = ? AND id != ? LIMIT 1",
        [slug, excludeId],
      );
      return rows.length ? rows[0].id : null;
    },
  };
};

export default createPageRepo;
