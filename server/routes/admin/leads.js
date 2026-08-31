/* eslint-disable no-undef */
import express from 'express';
import pool from '../../db/pool.js';
import { authenticateJWT, requireEditorOrAdmin, logAudit } from '../../middleware/auth.js';

const router = express.Router();

const VALID_SOURCES = ['booking', 'advertising', 'contact'];
const VALID_STATUSES = ['new', 'contacted', 'resolved', 'declined'];

/**
 * POST /api/public/leads
 * Submit a lead form (public - no auth required)
 */
router.post('/public', async (req, res) => {
  try {
    const { source, name, email, organization, event_date, event_type, message } = req.body;

    if (!VALID_SOURCES.includes(source)) {
      return res.status(400).json({ error: 'Invalid source' });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message required' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO leads (source, name, email, organization, event_date, event_type, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [source, name, email, organization || null, event_date || null, event_type || null, message, 'new']
    );

    await logAudit(null, 'create', 'lead', result.insertId, null, { source, name, email }, req);

    connection.release();

    res.status(201).json({
      id: result.insertId,
      message: 'Thank you for your inquiry. We will be in touch soon.',
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

/**
 * GET /api/admin/leads
 * List all leads (admin/editor)
 */
router.get('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { source, status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (source && VALID_SOURCES.includes(source)) {
      query += ' AND source = ?';
      params.push(source);
    }

    if (status && VALID_STATUSES.includes(status)) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR message LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const connection = await pool.getConnection();
    const [leads] = await connection.execute(query, params);

    let countQuery = 'SELECT COUNT(*) as count FROM leads WHERE 1=1';
    const countParams = [];

    if (source && VALID_SOURCES.includes(source)) {
      countQuery += ' AND source = ?';
      countParams.push(source);
    }

    if (status && VALID_STATUSES.includes(status)) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR message LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await connection.execute(countQuery, countParams);
    connection.release();

    res.json({
      data: leads,
      total: countResult[0].count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('List leads error:', error);
    res.status(500).json({ error: 'Failed to list leads' });
  }
});

/**
 * GET /api/admin/leads/:id
 * Get single lead (admin/editor)
 */
router.get('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [leads] = await connection.execute(
      'SELECT * FROM leads WHERE id = ?',
      [id]
    );

    if (leads.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Get notes for this lead
    const [notes] = await connection.execute(
      `SELECT n.*, u.email as author_email
       FROM lead_notes n
       LEFT JOIN admin_users u ON n.author_id = u.id
       WHERE n.lead_id = ?
       ORDER BY n.created_at DESC`,
      [id]
    );

    connection.release();

    res.json({
      ...leads[0],
      notes,
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Failed to get lead' });
  }
});

/**
 * PATCH /api/admin/leads/:id
 * Update lead status
 */
router.patch('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;
    const userId = req.user.userId;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    const [current] = await connection.execute('SELECT * FROM leads WHERE id = ?', [id]);

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Lead not found' });
    }

    const oldValues = current[0];
    const updates = [];
    const values = [];

    if (status && status !== oldValues.status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (assigned_to !== undefined && assigned_to !== oldValues.assigned_to) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }

    if (updates.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const newValues = { ...oldValues };
      if (status) newValues.status = status;
      if (assigned_to !== undefined) newValues.assigned_to = assigned_to;

      await logAudit(userId, 'update', 'lead', id, oldValues, newValues, req);
    }

    connection.release();
    res.json({ message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

/**
 * POST /api/admin/leads/:id/notes
 * Add note to lead
 */
router.post('/:id/notes', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { note_text } = req.body;
    const userId = req.user.userId;

    if (!note_text) {
      return res.status(400).json({ error: 'Note text required' });
    }

    const connection = await pool.getConnection();

    // Verify lead exists
    const [leads] = await connection.execute('SELECT id FROM leads WHERE id = ?', [id]);
    if (leads.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Insert note
    const [result] = await connection.execute(
      'INSERT INTO lead_notes (lead_id, author_id, note_text) VALUES (?, ?, ?)',
      [id, userId, note_text]
    );

    await logAudit(userId, 'create', 'lead_note', result.insertId, null, { lead_id: id }, req);

    connection.release();

    res.status(201).json({
      id: result.insertId,
      lead_id: id,
      author_id: userId,
      note_text,
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

/**
 * DELETE /api/admin/leads/:id
 * Soft delete lead
 */
router.delete('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    const [current] = await connection.execute('SELECT * FROM leads WHERE id = ?', [id]);

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Lead not found' });
    }

    // For leads, we soft delete by archiving (status = 'declined' or could use a deleted_at)
    // For now, we'll just mark as declined if not already
    await connection.execute(
      'UPDATE leads SET status = ? WHERE id = ?',
      ['declined', id]
    );

    await logAudit(userId, 'delete', 'lead', id, current[0], null, req);

    connection.release();
    res.json({ message: 'Lead archived successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
