/* eslint-disable no-undef */
import express from 'express';
import pool from '../../db/pool.js';
import { authenticateJWT, requireEditorOrAdmin, logAudit } from '../../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/admin/cartoons
 * Create new cartoon
 */
router.post('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { image_url, caption, status } = req.body;
    const userId = req.user.userId;

    if (!image_url) {
      return res.status(400).json({ error: 'Image URL required' });
    }

    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO cartoons (image_url, caption, status, created_by, published_at)
       VALUES (?, ?, ?, ?, ?)`,
      [image_url, caption, status, userId, status === 'published' ? new Date() : null]
    );

    await logAudit(userId, 'create', 'cartoon', result.insertId, null, { caption, status }, req);

    connection.release();

    res.status(201).json({
      id: result.insertId,
      image_url,
      caption,
      status,
    });
  } catch (error) {
    console.error('Create cartoon error:', error);
    res.status(500).json({ error: 'Failed to create cartoon' });
  }
});

/**
 * GET /api/admin/cartoons
 * List all cartoons (admin)
 */
router.get('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM cartoons WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const connection = await pool.getConnection();
    const [cartoons] = await connection.execute(query, params);

    let countQuery = 'SELECT COUNT(*) as count FROM cartoons WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await connection.execute(countQuery, countParams);
    connection.release();

    res.json({
      data: cartoons,
      total: countResult[0].count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('List cartoons error:', error);
    res.status(500).json({ error: 'Failed to list cartoons' });
  }
});

/**
 * GET /api/admin/cartoons/:id
 * Get single cartoon (admin)
 */
router.get('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [cartoons] = await connection.execute(
      `SELECT c.*, u.email as created_by_email
       FROM cartoons c
       LEFT JOIN admin_users u ON c.created_by = u.id
       WHERE c.id = ?`,
      [id]
    );

    connection.release();

    if (cartoons.length === 0) {
      return res.status(404).json({ error: 'Cartoon not found' });
    }

    res.json(cartoons[0]);
  } catch (error) {
    console.error('Get cartoon error:', error);
    res.status(500).json({ error: 'Failed to get cartoon' });
  }
});

/**
 * PATCH /api/admin/cartoons/:id
 * Update cartoon
 */
router.patch('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, caption, status } = req.body;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    const [current] = await connection.execute('SELECT * FROM cartoons WHERE id = ?', [id]);

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Cartoon not found' });
    }

    const oldValues = current[0];
    const updates = [];
    const values = [];

    if (image_url && image_url !== oldValues.image_url) {
      updates.push('image_url = ?');
      values.push(image_url);
    }

    if (caption !== undefined && caption !== oldValues.caption) {
      updates.push('caption = ?');
      values.push(caption);
    }

    if (status && status !== oldValues.status) {
      updates.push('status = ?');
      values.push(status);
      if (status === 'published') {
        updates.push('published_at = ?');
        values.push(new Date());
      }
    }

    if (updates.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE cartoons SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const newValues = { ...oldValues };
      if (image_url) newValues.image_url = image_url;
      if (caption !== undefined) newValues.caption = caption;
      if (status) newValues.status = status;

      await logAudit(userId, 'update', 'cartoon', id, oldValues, newValues, req);
    }

    connection.release();
    res.json({ message: 'Cartoon updated successfully' });
  } catch (error) {
    console.error('Update cartoon error:', error);
    res.status(500).json({ error: 'Failed to update cartoon' });
  }
});

/**
 * DELETE /api/admin/cartoons/:id
 * Archive cartoon
 */
router.delete('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    const [current] = await connection.execute('SELECT * FROM cartoons WHERE id = ?', [id]);

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Cartoon not found' });
    }

    await connection.execute(
      'UPDATE cartoons SET status = ? WHERE id = ?',
      ['archived', id]
    );

    await logAudit(userId, 'delete', 'cartoon', id, current[0], null, req);

    connection.release();
    res.json({ message: 'Cartoon archived successfully' });
  } catch (error) {
    console.error('Delete cartoon error:', error);
    res.status(500).json({ error: 'Failed to delete cartoon' });
  }
});

export default router;
