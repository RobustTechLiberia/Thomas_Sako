/* eslint-disable no-undef */
import express from 'express';
import pool from '../../db/pool.js';
import { authenticateJWT, requireEditorOrAdmin, logAudit } from '../../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/admin/podcasts
 * Create new podcast episode
 */
router.post('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { title, description, media_url, thumbnail_url, status } = req.body;
    const userId = req.user.userId;

    if (!title || !media_url) {
      return res.status(400).json({ error: 'Title and media URL required' });
    }

    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO podcasts (title, description, media_url, thumbnail_url, status, created_by, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, media_url, thumbnail_url, status, userId, status === 'published' ? new Date() : null]
    );

    await logAudit(userId, 'create', 'podcast', result.insertId, null, { title, status }, req);

    connection.release();

    res.status(201).json({
      id: result.insertId,
      title,
      description,
      media_url,
      thumbnail_url,
      status,
    });
  } catch (error) {
    console.error('Create podcast error:', error);
    res.status(500).json({ error: 'Failed to create podcast' });
  }
});

/**
 * GET /api/admin/podcasts
 * List all podcasts (admin)
 */
router.get('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM podcasts WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const connection = await pool.getConnection();
    const [podcasts] = await connection.execute(query, params);

    let countQuery = 'SELECT COUNT(*) as count FROM podcasts WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (title LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await connection.execute(countQuery, countParams);
    connection.release();

    res.json({
      data: podcasts,
      total: countResult[0].count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('List podcasts error:', error);
    res.status(500).json({ error: 'Failed to list podcasts' });
  }
});

/**
 * GET /api/admin/podcasts/:id
 * Get single podcast (admin)
 */
router.get('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [podcasts] = await connection.execute(
      `SELECT p.*, u.email as created_by_email
       FROM podcasts p
       LEFT JOIN admin_users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );

    connection.release();

    if (podcasts.length === 0) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    res.json(podcasts[0]);
  } catch (error) {
    console.error('Get podcast error:', error);
    res.status(500).json({ error: 'Failed to get podcast' });
  }
});

/**
 * PATCH /api/admin/podcasts/:id
 * Update podcast
 */
router.patch('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, media_url, thumbnail_url, status } = req.body;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    const [current] = await connection.execute('SELECT * FROM podcasts WHERE id = ?', [id]);

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Podcast not found' });
    }

    const oldValues = current[0];
    const updates = [];
    const values = [];

    if (title && title !== oldValues.title) {
      updates.push('title = ?');
      values.push(title);
    }

    if (description !== undefined && description !== oldValues.description) {
      updates.push('description = ?');
      values.push(description);
    }

    if (media_url && media_url !== oldValues.media_url) {
      updates.push('media_url = ?');
      values.push(media_url);
    }

    if (thumbnail_url !== undefined && thumbnail_url !== oldValues.thumbnail_url) {
      updates.push('thumbnail_url = ?');
      values.push(thumbnail_url);
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
        `UPDATE podcasts SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const newValues = { ...oldValues };
      if (title) newValues.title = title;
      if (description !== undefined) newValues.description = description;
      if (media_url) newValues.media_url = media_url;
      if (thumbnail_url !== undefined) newValues.thumbnail_url = thumbnail_url;
      if (status) newValues.status = status;

      await logAudit(userId, 'update', 'podcast', id, oldValues, newValues, req);
    }

    connection.release();
    res.json({ message: 'Podcast updated successfully' });
  } catch (error) {
    console.error('Update podcast error:', error);
    res.status(500).json({ error: 'Failed to update podcast' });
  }
});

/**
 * DELETE /api/admin/podcasts/:id
 * Archive podcast
 */
router.delete('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    const [current] = await connection.execute('SELECT * FROM podcasts WHERE id = ?', [id]);

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Podcast not found' });
    }

    await connection.execute(
      'UPDATE podcasts SET status = ? WHERE id = ?',
      ['archived', id]
    );

    await logAudit(userId, 'delete', 'podcast', id, current[0], null, req);

    connection.release();
    res.json({ message: 'Podcast archived successfully' });
  } catch (error) {
    console.error('Delete podcast error:', error);
    res.status(500).json({ error: 'Failed to delete podcast' });
  }
});

export default router;
