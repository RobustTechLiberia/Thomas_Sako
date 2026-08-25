/* eslint-disable no-undef */
import express from 'express';
import pool from '../../db/pool.js';
import { authenticateJWT, requireEditorOrAdmin, logAudit } from '../../middleware/auth.js';

const router = express.Router();

const VALID_SECTIONS = ['meetups', 'watch', 'interviews', 'news'];

/**
 * POST /api/admin/mingle-posts
 * Create new Mingle post
 */
router.post('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { section, title, body, media_url, status } = req.body;
    const userId = req.user.userId;

    if (!VALID_SECTIONS.includes(section)) {
      return res.status(400).json({ error: 'Invalid section' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO mingle_posts (section, title, body, media_url, status, created_by, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [section, title, body, media_url, status, userId, status === 'published' ? new Date() : null]
    );

    await logAudit(userId, 'create', 'mingle_post', result.insertId, null, { section, title, status }, req);

    connection.release();

    res.status(201).json({
      id: result.insertId,
      section,
      title,
      body,
      media_url,
      status,
    });
  } catch (error) {
    console.error('Create Mingle post error:', error);
    res.status(500).json({ error: 'Failed to create Mingle post' });
  }
});

/**
 * GET /api/admin/mingle-posts
 * List Mingle posts (admin)
 */
router.get('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { section, status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM mingle_posts WHERE 1=1';
    const params = [];

    if (section && VALID_SECTIONS.includes(section)) {
      query += ' AND section = ?';
      params.push(section);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (title LIKE ? OR body LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const connection = await pool.getConnection();
    const [posts] = await connection.execute(query, params);

    let countQuery = 'SELECT COUNT(*) as count FROM mingle_posts WHERE 1=1';
    const countParams = [];

    if (section && VALID_SECTIONS.includes(section)) {
      countQuery += ' AND section = ?';
      countParams.push(section);
    }

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (title LIKE ? OR body LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await connection.execute(countQuery, countParams);
    connection.release();

    res.json({
      data: posts,
      total: countResult[0].count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('List Mingle posts error:', error);
    res.status(500).json({ error: 'Failed to list Mingle posts' });
  }
});

/**
 * GET /api/admin/mingle-posts/:id
 * Get single Mingle post (admin)
 */
router.get('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [posts] = await connection.execute(
      `SELECT m.*, u.email as created_by_email
       FROM mingle_posts m
       LEFT JOIN admin_users u ON m.created_by = u.id
       WHERE m.id = ?`,
      [id]
    );

    connection.release();

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Mingle post not found' });
    }

    res.json(posts[0]);
  } catch (error) {
    console.error('Get Mingle post error:', error);
    res.status(500).json({ error: 'Failed to get Mingle post' });
  }
});

/**
 * PATCH /api/admin/mingle-posts/:id
 * Update Mingle post
 */
router.patch('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { section, title, body, media_url, status } = req.body;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    const [current] = await connection.execute('SELECT * FROM mingle_posts WHERE id = ?', [id]);

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Mingle post not found' });
    }

    const oldValues = current[0];
    const updates = [];
    const values = [];

    if (section && VALID_SECTIONS.includes(section) && section !== oldValues.section) {
      updates.push('section = ?');
      values.push(section);
    }

    if (title && title !== oldValues.title) {
      updates.push('title = ?');
      values.push(title);
    }

    if (body !== undefined && body !== oldValues.body) {
      updates.push('body = ?');
      values.push(body);
    }

    if (media_url !== undefined && media_url !== oldValues.media_url) {
      updates.push('media_url = ?');
      values.push(media_url);
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
        `UPDATE mingle_posts SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const newValues = { ...oldValues };
      if (section) newValues.section = section;
      if (title) newValues.title = title;
      if (body !== undefined) newValues.body = body;
      if (media_url !== undefined) newValues.media_url = media_url;
      if (status) newValues.status = status;

      await logAudit(userId, 'update', 'mingle_post', id, oldValues, newValues, req);
    }

    connection.release();
    res.json({ message: 'Mingle post updated successfully' });
  } catch (error) {
    console.error('Update Mingle post error:', error);
    res.status(500).json({ error: 'Failed to update Mingle post' });
  }
});

/**
 * DELETE /api/admin/mingle-posts/:id
 * Archive Mingle post
 */
router.delete('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    const [current] = await connection.execute('SELECT * FROM mingle_posts WHERE id = ?', [id]);

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Mingle post not found' });
    }

    await connection.execute(
      'UPDATE mingle_posts SET status = ? WHERE id = ?',
      ['archived', id]
    );

    await logAudit(userId, 'delete', 'mingle_post', id, current[0], null, req);

    connection.release();
    res.json({ message: 'Mingle post archived successfully' });
  } catch (error) {
    console.error('Delete Mingle post error:', error);
    res.status(500).json({ error: 'Failed to delete Mingle post' });
  }
});

export default router;
