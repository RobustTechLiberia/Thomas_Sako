/* eslint-disable no-undef */
import express from 'express';
import pool from '../../db/pool.js';
import { authenticateJWT, requireEditorOrAdmin } from '../../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Get active poll
    const [activePoll] = await connection.execute(
      `SELECT p.id, p.question_text, p.options, p.published_at,
              COALESCE(COUNT(DISTINCT v.id), 0) as total_votes
       FROM poll_questions p
       LEFT JOIN poll_votes v ON p.id = v.poll_question_id
       WHERE p.status = 'active'
       GROUP BY p.id
       LIMIT 1`
    );

    // Get vote breakdown for active poll
    let voteBreakdown = [];
    if (activePoll.length > 0) {
      const [votes] = await connection.execute(
        `SELECT answer_text, COUNT(*) as count
         FROM poll_votes
         WHERE poll_question_id = ?
         GROUP BY answer_text`,
        [activePoll[0].id]
      );
      voteBreakdown = votes;
    }

    // Get newsletter subscriber count
    const [subscriberCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM newsletter_subscribers WHERE is_active = TRUE'
    );

    // Get pending leads count
    const [leadsCount] = await connection.execute(
      `SELECT source, COUNT(*) as count
       FROM leads
       WHERE status IN ('new', 'contacted')
       GROUP BY source`
    );

    // Get recent activity (last 10 items)
    const [auditLog] = await connection.execute(
      `SELECT a.id, a.actor_id, a.action, a.entity_type, a.created_at,
              u.email as actor_email
       FROM audit_log a
       LEFT JOIN admin_users u ON a.actor_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 10`
    );

    connection.release();

    res.json({
      activePoll: activePoll.length > 0 ? {
        ...activePoll[0],
        options: JSON.parse(activePoll[0].options),
        voteBreakdown,
      } : null,
      subscribers: subscriberCount[0].count,
      leads: leadsCount.reduce((acc, item) => {
        acc[item.source] = item.count;
        return acc;
      }, {}),
      recentActivity: auditLog,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
