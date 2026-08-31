/* eslint-disable no-undef */
import express from 'express';
import pool from '../../db/pool.js';
import { authenticateJWT, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/admin/audit-log
 * Get audit log entries (admin only)
 */
router.get('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { action, entity_type, actor_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    if (entity_type) {
      query += ' AND entity_type = ?';
      params.push(entity_type);
    }

    if (actor_id) {
      query += ' AND actor_id = ?';
      params.push(actor_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const connection = await pool.getConnection();
    const [logs] = await connection.execute(query, params);

    let countQuery = 'SELECT COUNT(*) as count FROM audit_log WHERE 1=1';
    const countParams = [];

    if (action) {
      countQuery += ' AND action = ?';
      countParams.push(action);
    }

    if (entity_type) {
      countQuery += ' AND entity_type = ?';
      countParams.push(entity_type);
    }

    if (actor_id) {
      countQuery += ' AND actor_id = ?';
      countParams.push(actor_id);
    }

    const [countResult] = await connection.execute(countQuery, countParams);

    // Get actor details
    const actorIds = [...new Set(logs.map(l => l.actor_id).filter(Boolean))];
    let actors = {};

    if (actorIds.length > 0) {
      const placeholders = actorIds.map(() => '?').join(',');
      const [actorResults] = await connection.execute(
        `SELECT id, email FROM admin_users WHERE id IN (${placeholders})`,
        actorIds
      );
      actors = Object.fromEntries(actorResults.map(a => [a.id, a.email]));
    }

    connection.release();

    // Enrich logs with actor info
    const enrichedLogs = logs.map(log => ({
      ...log,
      actor_email: actors[log.actor_id] || 'system',
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null,
    }));

    res.json({
      data: enrichedLogs,
      total: countResult[0].count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

/**
 * GET /api/admin/audit-log/:id
 * Get single audit log entry
 */
router.get('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [logs] = await connection.execute(
      `SELECT a.*, u.email as actor_email
       FROM audit_log a
       LEFT JOIN admin_users u ON a.actor_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    connection.release();

    if (logs.length === 0) {
      return res.status(404).json({ error: 'Audit log entry not found' });
    }

    const log = logs[0];
    res.json({
      ...log,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null,
    });
  } catch (error) {
    console.error('Get audit log entry error:', error);
    res.status(500).json({ error: 'Failed to get audit log entry' });
  }
});

/**
 * GET /api/admin/audit-log/entity/:entity_type/:entity_id
 * Get audit history for a specific entity
 */
router.get('/entity/:entity_type/:entity_id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const connection = await pool.getConnection();

    const [logs] = await connection.execute(
      `SELECT a.*, u.email as actor_email
       FROM audit_log a
       LEFT JOIN admin_users u ON a.actor_id = u.id
       WHERE a.entity_type = ? AND a.entity_id = ?
       ORDER BY a.created_at DESC`,
      [entity_type, entity_id]
    );

    connection.release();

    const enrichedLogs = logs.map(log => ({
      ...log,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null,
    }));

    res.json(enrichedLogs);
  } catch (error) {
    console.error('Get entity history error:', error);
    res.status(500).json({ error: 'Failed to get entity history' });
  }
});

export default router;
