const mapMedia = (row) => ({
  id: row.id,
  publicId: row.cloudinary_public_id,
  url: row.cloudinary_url,
  filename: row.filename,
  fileType: row.file_type,
  fileSize: row.file_size,
  width: row.width,
  height: row.height,
  uploadedBy: row.uploaded_by,
  uploadedAt: row.uploaded_at,
});

export const createMediaRepo = (db) => {
  return {
    async create({ publicId, url, filename, fileType, fileSize, width, height, uploadedBy }) {
      const [result] = await db.query(
        `INSERT INTO media_assets
           (cloudinary_public_id, cloudinary_url, filename, file_type, file_size, width, height, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [publicId, url, filename, fileType, fileSize, width, height, uploadedBy],
      );
      return this.getById(result.insertId);
    },

    async getById(id) {
      const [rows] = await db.query(
        "SELECT * FROM media_assets WHERE id = ? LIMIT 1",
        [id],
      );
      return rows.length ? mapMedia(rows[0]) : null;
    },

    async list({ page = 1, limit = 30, search } = {}) {
      const where = [];
      const params = [];
      if (search) {
        where.push("filename LIKE ?");
        params.push(`%${search}%`);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const offset = (page - 1) * limit;

      const [rows] = await db.query(
        `SELECT * FROM media_assets ${whereSql} ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM media_assets ${whereSql}`,
        params,
      );
      return {
        rows: rows.map(mapMedia),
        total: Number(countRows[0]?.total || 0),
      };
    },

    async remove(id) {
      await db.query("DELETE FROM media_assets WHERE id = ?", [id]);
    },
  };
};

export default createMediaRepo;
