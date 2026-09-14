const mapRow = (row) => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  role: row.role,
  isActive: Boolean(row.is_active),
  lastLoginAt: row.last_login,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createAdminRepo = (db) => {
  return {
    async findByEmail(email, includeHash = false) {
      const [rows] = await db.query(
        "SELECT * FROM admin_users WHERE email = ? LIMIT 1",
        [email],
      );
      if (!rows.length) return null;
      const row = rows[0];
      return includeHash
        ? { ...mapRow(row), passwordHash: row.password_hash }
        : mapRow(row);
    },

    async getById(id) {
      const [rows] = await db.query(
        "SELECT * FROM admin_users WHERE id = ? LIMIT 1",
        [id],
      );
      return rows.length ? mapRow(rows[0]) : null;
    },

    async create({ email, displayName, passwordHash, role }) {
      const [result] = await db.query(
        `INSERT INTO admin_users (email, password_hash, role, display_name, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [email, passwordHash, role, displayName],
      );
      return this.getById(result.insertId);
    },

    async list() {
      const [rows] = await db.query(
        "SELECT * FROM admin_users ORDER BY id ASC",
      );
      return rows.map(mapRow);
    },

    async count() {
      const [rows] = await db.query("SELECT COUNT(*) AS total FROM admin_users");
      return Number(rows[0]?.total || 0);
    },

    async update(id, fields) {
      const map = {
        email: "email",
        displayName: "display_name",
        role: "role",
        isActive: "is_active",
      };
      const entries = Object.entries(fields).filter(
        ([key]) => key in map && fields[key] !== undefined,
      );
      if (!entries.length) return this.getById(id);
      const sets = entries.map(([key]) =>
        map[key] === "display_name" ? `display_name = ?` : `${map[key]} = ?`,
      );
      const params = entries.map(([key, value]) =>
        key === "isActive" ? (value ? 1 : 0) : value,
      );
      await db.query(
        `UPDATE admin_users SET ${sets.join(", ")} WHERE id = ?`,
        [...params, id],
      );
      return this.getById(id);
    },

    async setPassword(id, passwordHash) {
      await db.query(
        "UPDATE admin_users SET password_hash = ? WHERE id = ?",
        [passwordHash, id],
      );
    },

    async touchLogin(id) {
      await db.query("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [id]);
    },

    async remove(id) {
      await db.query("DELETE FROM admin_users WHERE id = ?", [id]);
    },
  };
};

export default createAdminRepo;
