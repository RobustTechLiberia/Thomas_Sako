/* eslint-disable no-undef */
import express from 'express';
import pool from '../../db/pool.js';
import { authenticateJWT, requireAdmin, logAudit } from '../../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/admin/settings
 * Get all site settings
 */
router.get('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [settings] = await connection.execute('SELECT `key`, `value` FROM site_settings');
    connection.release();

    const result = {};
    settings.forEach(setting => {
      result[setting.key] = JSON.parse(setting.value);
    });

    res.json(result);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

/**
 * GET /api/settings (public)
 * Get public site settings
 */
router.get('/public/config', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [settings] = await connection.execute(
      'SELECT `key`, `value` FROM site_settings WHERE `key` IN (?, ?, ?, ?, ?)',
      ['hero_title', 'hero_video', 'station_badges', 'social_links', 'sponsor_banner']
    );
    connection.release();

    const result = {};
    settings.forEach(setting => {
      result[setting.key] = JSON.parse(setting.value);
    });

    res.json(result);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

/**
 * PATCH /api/admin/settings/:key
 * Update a specific setting
 */
router.patch('/:key', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user.userId;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value required' });
    }

    const connection = await pool.getConnection();

    // Get old value
    const [existing] = await connection.execute(
      'SELECT `value` FROM site_settings WHERE `key` = ?',
      [key]
    );

    const oldValue = existing.length > 0 ? JSON.parse(existing[0].value) : null;

    // Upsert
    await connection.execute(
      'INSERT INTO site_settings (`key`, `value`, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, updated_by = ?, updated_at = NOW()',
      [key, JSON.stringify(value), userId, JSON.stringify(value), userId]
    );

    await logAudit(userId, 'update', 'site_setting', null, { key: oldValue }, { key: value }, req);

    connection.release();

    res.json({
      key,
      value,
      message: 'Setting updated successfully',
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

/**
 * PATCH /api/admin/settings
 * Update multiple settings at once
 */
router.patch('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.userId;
    const connection = await pool.getConnection();

    const updated = [];

    for (const [key, value] of Object.entries(req.body)) {
      await connection.execute(
        'INSERT INTO site_settings (`key`, `value`, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, updated_by = ?, updated_at = NOW()',
        [key, JSON.stringify(value), userId, JSON.stringify(value), userId]
      );

      updated.push(key);
      await logAudit(userId, 'update', 'site_setting', null, null, { key, value }, req);
    }

    connection.release();

    res.json({
      updated,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
