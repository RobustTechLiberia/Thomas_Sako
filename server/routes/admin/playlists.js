/* eslint-disable no-undef */
import express from 'express';
import pool from '../../db/pool.js';
import { authenticateJWT, requireEditorOrAdmin, logAudit } from '../../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/admin/playlists
 * Create new playlist
 */
router.post('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { title, embed_url, status } = req.body;
    const userId = req.user.userId;

    if (!title || !embed_url) {
      return res.status(400).json({ error: 'Title and embed URL required' });
    }

    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO playlists (title, embed_url, status, created_by, published_at)
       VALUES (?, ?, ?, ?, ?)`,
      [title, embed_url, status, userId, status === 'published' ? new Date() : null]
    );

    await logAudit(userId, 'create', 'playlist', result.insertId, null, { title, status }, req);

    connection.release();

    res.status(201).json({
      id: result.insertId,
      title,
      embed_url,
      status,
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

/**
 * GET /api/admin/playlists
 * List all playlists (admin)
 */
router.get('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM playlists WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND title LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const connection = await pool.getConnection();
    const [playlists] = await connection.execute(query, params);

    let countQuery = 'SELECT COUNT(*) as count FROM playlists WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND title LIKE ?';
      countParams.push(`%${search}%`);
    }

    const [countResult] = await connection.execute(countQuery, countParams);
    connection.release();

    res.json({
      data: playlists,
      total: countResult[0].count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('List playlists error:', error);
    res.status(500).json({ error: 'Failed to list playlists' });
  }
});

/**
 * GET /api/admin/playlists/:id
 * Get single playlist (admin)
 */
router.get('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [playlists] = await connection.execute(
      `SELECT p.*, u.email as created_by_email
       FROM playlists p
       LEFT JOIN admin_users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );

    connection.release();

    if (playlists.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(playlists[0]);
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

/**
 * PATCH /api/admin/playlists/:id
 * Update playlist
 */
router.patch('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, embed_url, status } = req.body;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    const [current] = await connection.execute('SELECT * FROM playlists WHERE id = ?', [id]);

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const oldValues = current[0];
    const updates = [];
    const values = [];

    if (title && title !== oldValues.title) {
      updates.push('title = ?');
      values.push(title);
    }

    if (embed_url && embed_url !== oldValues.embed_url) {
      updates.push('embed_url = ?');
      values.push(embed_url);
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
        `UPDATE playlists SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const newValues = { ...oldValues };
      if (title) newValues.title = title;
      if (embed_url) newValues.embed_url = embed_url;
      if (status) newValues.status = status;

      await logAudit(userId, 'update', 'playlist', id, oldValues, newValues, req);
    }

    connection.release();
    res.json({ message: 'Playlist updated successfully' });
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
});

/**
 * DELETE /api/admin/playlists/:id
 * Archive playlist
 */
router.delete('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    const [current] = await connection.execute('SELECT * FROM playlists WHERE id = ?', [id]);

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Playlist not found' });
    }

    await connection.execute(
      'UPDATE playlists SET status = ? WHERE id = ?',
      ['archived', id]
    );

    await logAudit(userId, 'delete', 'playlist', id, current[0], null, req);

    connection.release();
    res.json({ message: 'Playlist archived successfully' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

export default router;
