/* eslint-disable no-undef */
import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../../db/pool.js';
import { generateToken, authenticateJWT, logAudit } from '../../middleware/auth.js';
import { rateLimitByEmail } from '../../middleware/rateLimit.js';

const router = express.Router();

// Configure email service (SendGrid via Nodemailer)
const transporter = nodemailer.createTransport({
  host: process.env.SENDGRID_HOST || 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY || '',
  },
});

/**
 * POST /api/admin/auth/login
 * Login with email and password
 */
router.post('/login', rateLimitByEmail(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, email, password_hash, role FROM admin_users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    const updateConnection = await pool.getConnection();
    await updateConnection.execute(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    updateConnection.release();

    // Log audit
    await logAudit(user.id, 'login', 'admin_user', user.id, null, null, req);

    const token = generateToken(user.id, user.role);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/admin/auth/logout
 * Logout (invalidate token on client side)
 */
router.post('/logout', authenticateJWT, async (req, res) => {
  try {
    await logAudit(req.user.userId, 'logout', 'admin_user', req.user.userId, null, null, req);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * POST /api/admin/auth/request-reset
 * Request password reset email
 */
router.post('/request-reset', rateLimitByEmail(3, 60 * 60 * 1000), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id FROM admin_users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists
      connection.release();
      return res.json({ message: 'If email exists, reset link has been sent' });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await connection.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );
    connection.release();

    // Send email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/reset-password?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@liberty.local',
      to: email,
      subject: 'Liberty CMS - Password Reset',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });

    res.json({ message: 'If email exists, reset link has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Request failed' });
  }
});

/**
 * POST /api/admin/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const connection = await pool.getConnection();
    const [tokens] = await connection.execute(
      'SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (tokens.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const userId = tokens[0].user_id;
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await connection.execute(
      'UPDATE admin_users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    await connection.execute(
      'DELETE FROM password_reset_tokens WHERE token = ?',
      [token]
    );

    connection.release();

    await logAudit(userId, 'password_reset', 'admin_user', userId, null, null, req);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
});

/**
 * POST /api/admin/auth/change-password
 * Change password (authenticated)
 */
router.post('/change-password', authenticateJWT, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT password_hash FROM admin_users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordValid = await bcrypt.compare(currentPassword, users[0].password_hash);

    if (!passwordValid) {
      connection.release();
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await connection.execute(
      'UPDATE admin_users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    );

    connection.release();

    await logAudit(userId, 'password_changed', 'admin_user', userId, null, null, req);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Change failed' });
  }
});

export default router;
