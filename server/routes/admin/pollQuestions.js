/* eslint-disable no-undef */
import express from 'express';
import pool from '../../db/pool.js';
import { authenticateJWT, requireEditorOrAdmin, requireAdmin, logAudit } from '../../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/admin/poll-questions
 * Create new poll question
 */
router.post('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { question_text, options, status } = req.body;
    const userId = req.user.userId;

    if (!question_text || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options required' });
    }

    if (!['draft', 'active'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();

    try {
      // If publishing, deactivate all other active polls
      if (status === 'active') {
        await connection.execute(
          'UPDATE poll_questions SET status = ? WHERE status = ? AND id != ?',
          ['draft', 'active', null]
        );
      }

      const [result] = await connection.execute(
        `INSERT INTO poll_questions (question_text, options, status, created_by, published_at)
         VALUES (?, ?, ?, ?, ?)`,
        [question_text, JSON.stringify(options), status, userId, status === 'active' ? new Date() : null]
      );

      await logAudit(
        userId,
        'create',
        'poll_question',
        result.insertId,
        null,
        { question_text, options, status },
        req
      );

      res.status(201).json({
        id: result.insertId,
        question_text,
        options,
        status,
        created_by: userId,
        published_at: status === 'active' ? new Date() : null,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create poll question error:', error);
    res.status(500).json({ error: 'Failed to create poll question' });
  }
});

/**
 * GET /api/admin/poll-questions
 * List all poll questions
 */
router.get('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM poll_questions WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND question_text LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const connection = await pool.getConnection();
    const [questions] = await connection.execute(query, params);

    // Get count
    let countQuery = 'SELECT COUNT(*) as count FROM poll_questions WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND question_text LIKE ?';
      countParams.push(`%${search}%`);
    }

    const [countResult] = await connection.execute(countQuery, countParams);
    connection.release();

    // Parse JSON options
    const parsed = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options),
    }));

    res.json({
      data: parsed,
      total: countResult[0].count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('List poll questions error:', error);
    res.status(500).json({ error: 'Failed to list poll questions' });
  }
});

/**
 * GET /api/admin/poll-questions/:id
 * Get single poll question
 */
router.get('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [questions] = await connection.execute(
      `SELECT p.*, 
              COALESCE(COUNT(DISTINCT v.id), 0) as total_votes,
              u.email as created_by_email
       FROM poll_questions p
       LEFT JOIN poll_votes v ON p.id = v.poll_question_id
       LEFT JOIN admin_users u ON p.created_by = u.id
       WHERE p.id = ?
       GROUP BY p.id`,
      [id]
    );

    if (questions.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Poll question not found' });
    }

    // Get vote breakdown
    const [votes] = await connection.execute(
      `SELECT answer_text, COUNT(*) as count
       FROM poll_votes
       WHERE poll_question_id = ?
       GROUP BY answer_text`,
      [id]
    );

    connection.release();

    const question = questions[0];
    res.json({
      ...question,
      options: JSON.parse(question.options),
      votes: votes,
    });
  } catch (error) {
    console.error('Get poll question error:', error);
    res.status(500).json({ error: 'Failed to get poll question' });
  }
});

/**
 * PATCH /api/admin/poll-questions/:id
 * Update poll question
 */
router.patch('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, options, status } = req.body;
    const userId = req.user.userId;

    const connection = await pool.getConnection();

    // Get current poll
    const [current] = await connection.execute(
      'SELECT * FROM poll_questions WHERE id = ?',
      [id]
    );

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Poll question not found' });
    }

    const oldValues = current[0];
    const updates = [];
    const values = [];

    if (question_text && question_text !== oldValues.question_text) {
      updates.push('question_text = ?');
      values.push(question_text);
    }

    if (options && Array.isArray(options)) {
      updates.push('options = ?');
      values.push(JSON.stringify(options));
    }

    if (status && status !== oldValues.status) {
      if (!['draft', 'active', 'archived'].includes(status)) {
        connection.release();
        return res.status(400).json({ error: 'Invalid status' });
      }

      updates.push('status = ?');
      values.push(status);

      // If activating, deactivate others
      if (status === 'active') {
        await connection.execute(
          'UPDATE poll_questions SET status = ? WHERE status = ? AND id != ?',
          ['draft', 'active', id]
        );
        updates.push('published_at = ?');
        values.push(new Date());
      }
    }

    if (updates.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE poll_questions SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const newValues = { ...oldValues };
      if (question_text) newValues.question_text = question_text;
      if (options) newValues.options = JSON.stringify(options);
      if (status) newValues.status = status;

      await logAudit(userId, 'update', 'poll_question', id, oldValues, newValues, req);
    }

    connection.release();

    res.json({ message: 'Poll question updated successfully' });
  } catch (error) {
    console.error('Update poll question error:', error);
    res.status(500).json({ error: 'Failed to update poll question' });
  }
});

/**
 * DELETE /api/admin/poll-questions/:id
 * Soft delete poll question (archive it)
 */
router.delete('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const connection = await pool.getConnection();

    const [current] = await connection.execute(
      'SELECT * FROM poll_questions WHERE id = ?',
      [id]
    );

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Poll question not found' });
    }

    await connection.execute(
      'UPDATE poll_questions SET status = ? WHERE id = ?',
      ['archived', id]
    );

    await logAudit(userId, 'delete', 'poll_question', id, current[0], null, req);

    connection.release();

    res.json({ message: 'Poll question archived successfully' });
  } catch (error) {
    console.error('Delete poll question error:', error);
    res.status(500).json({ error: 'Failed to delete poll question' });
  }
});

/**
 * POST /api/admin/poll-questions/:id/publish
 * Publish a draft poll (set as active, deactivate others)
 */
router.post('/:id/publish', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const connection = await pool.getConnection();

    const [current] = await connection.execute(
      'SELECT * FROM poll_questions WHERE id = ?',
      [id]
    );

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Poll question not found' });
    }

    // Deactivate all other active polls
    await connection.execute(
      'UPDATE poll_questions SET status = ? WHERE status = ? AND id != ?',
      ['draft', 'active', id]
    );

    // Publish this one
    await connection.execute(
      'UPDATE poll_questions SET status = ?, published_at = ? WHERE id = ?',
      ['active', new Date(), id]
    );

    await logAudit(userId, 'publish', 'poll_question', id, current[0], { status: 'active' }, req);

    connection.release();

    res.json({ message: 'Poll question published successfully' });
  } catch (error) {
    console.error('Publish poll question error:', error);
    res.status(500).json({ error: 'Failed to publish poll question' });
  }
});

export default router;
