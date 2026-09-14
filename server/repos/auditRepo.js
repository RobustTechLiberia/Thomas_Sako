export const createAuditRepo = (db) => {
  // old_values / new_values live in MySQL JSON columns, which the mysql2
  // driver auto-parses into JS objects. Only stringify-parse plain strings.
  const parseJson = (value) => {
    if (value == null) return null;
    return typeof value === "string" ? JSON.parse(value) : value;
  };

  return {
    async insert({
      actorId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    }) {
      await db.query(
        `INSERT INTO audit_log
           (actor_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          actorId,
          action,
          entityType,
          entityId,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          ipAddress,
          userAgent,
        ],
      );
    },

    async list({ page = 1, limit = 30, actorId, entityType } = {}) {
      const where = [];
      const params = [];
      if (actorId) {
        where.push("actor_id = ?");
        params.push(actorId);
      }
      if (entityType) {
        where.push("entity_type = ?");
        params.push(entityType);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const offset = (page - 1) * limit;

      const [rows] = await db.query(
        `SELECT * FROM audit_log ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM audit_log ${whereSql}`,
        params,
      );
      return {
        rows: rows.map((row) => ({
          id: row.id,
          actorId: row.actor_id,
          action: row.action,
          entityType: row.entity_type,
          entityId: row.entity_id,
          oldValues: parseJson(row.old_values),
          newValues: parseJson(row.new_values),
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          createdAt: row.created_at,
        })),
        total: Number(countRows[0]?.total || 0),
      };
    },
  };
};

export default createAuditRepo;
