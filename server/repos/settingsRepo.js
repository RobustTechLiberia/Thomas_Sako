const parseValue = (value) => {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return value;
  }
};

const mapSetting = (row) => ({
  id: row.id,
  key: row.key,
  value: parseValue(row.value),
  updatedBy: row.updated_by,
  updatedAt: row.updated_at,
});

export const createSettingsRepo = (db) => {
  return {
    async get(key) {
      const [rows] = await db.query(
        "SELECT * FROM site_settings WHERE `key` = ? LIMIT 1",
        [key],
      );
      return rows.length ? mapSetting(rows[0]) : null;
    },

    async set(key, value, updatedBy = null) {
      const [existing] = await db.query(
        "SELECT id FROM site_settings WHERE `key` = ? LIMIT 1",
        [key],
      );
      const json = JSON.stringify(value);
      if (existing.length) {
        await db.query(
          "UPDATE site_settings SET `value` = ?, updated_by = ?, updated_at = NOW() WHERE `key` = ?",
          [json, updatedBy, key],
        );
      } else {
        await db.query(
          "INSERT INTO site_settings (`key`, `value`, updated_by) VALUES (?, ?, ?)",
          [key, json, updatedBy],
        );
      }
      return this.get(key);
    },

    async list() {
      const [rows] = await db.query("SELECT * FROM site_settings ORDER BY `key` ASC");
      return rows.map(mapSetting);
    },
  };
};

export default createSettingsRepo;
