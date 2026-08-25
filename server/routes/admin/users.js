/* eslint-disable no-undef */
import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../../db/pool.js';
import { authenticateJWT, requireAdmin, logAudit } from '../../middleware/auth.js';
import { rateLimit } from '../../middleware/rateLimit.js';

const router = express.Router();

/**
 * POST /api/admin/users
 * Create new admin user (admin only)
 */
router.post('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!['admin', 'editor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        'INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, ?)',
        [email, passwordHash, role]
      );

      await logAudit(req.user.userId, 'create', 'admin_user', result.insertId, null, { email, role }, req);

      res.status(201).json({
        id: result.insertId,
        email,
        role,
        message: 'User created successfully',
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * GET /api/admin/users
 * List all admin users (admin only)
 */
router.get('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, email, role, created_at, last_login, is_active FROM admin_users ORDER BY created_at DESC'
    );
    connection.release();

    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user details (admin only)
 */
router.get('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, email, role, created_at, last_login, is_active FROM admin_users WHERE id = ?',
      [id]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user (admin only)
 */
router.patch('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, is_active } = req.body;

    if (id === String(req.user.userId) && is_active === false) {
      return res.status(400).json({ error: 'Cannot deactivate yourself' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT email, role, is_active FROM admin_users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const oldValues = users[0];
    const updates = [];
    const values = [];

    if (email && email !== oldValues.email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (role && role !== oldValues.role) {
      updates.push('role = ?');
      values.push(role);
    }

    if (typeof is_active === 'boolean' && is_active !== oldValues.is_active) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const newValues = { ...oldValues };
      if (email) newValues.email = email;
      if (role) newValues.role = role;
      if (typeof is_active === 'boolean') newValues.is_active = is_active;

      await logAudit(req.user.userId, 'update', 'admin_user', id, oldValues, newValues, req);
    }

    connection.release();

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Soft delete user (admin only)
 */
router.delete('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === String(req.user.userId)) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT * FROM admin_users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    await connection.execute(
      'UPDATE admin_users SET is_active = FALSE WHERE id = ?',
      [id]
    );

    await logAudit(req.user.userId, 'delete', 'admin_user', id, users[0], null, req);

    connection.release();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
