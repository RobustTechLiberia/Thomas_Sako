/* eslint-disable no-undef */
import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import pool from '../../db/pool.js';
import { authenticateJWT, requireEditorOrAdmin, logAudit } from '../../middleware/auth.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/admin/media/upload
 * Upload media to Cloudinary
 */
router.post('/upload', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { file, type = 'image' } = req.body;
    const userId = req.user.userId;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file size (max 10MB for images, 50MB for video)
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({ error: 'File too large' });
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'liberty-cms',
          resource_type: type === 'video' ? 'video' : 'auto',
          quality: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(Buffer.from(file.split(',')[1] || file, 'base64'));
    });

    // Store in database for tracking
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO media_assets (cloudinary_public_id, cloudinary_url, filename, file_type, width, height, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uploadResult.public_id,
        uploadResult.secure_url,
        uploadResult.original_filename || 'uploaded-file',
        uploadResult.resource_type,
        uploadResult.width || null,
        uploadResult.height || null,
        userId,
      ]
    );

    await logAudit(
      userId,
      'upload',
      'media_asset',
      result.insertId,
      null,
      { public_id: uploadResult.public_id, url: uploadResult.secure_url },
      req
    );

    connection.release();

    res.json({
      id: result.insertId,
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      secure_url: uploadResult.secure_url,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

/**
 * GET /api/admin/media
 * List uploaded media assets
 */
router.get('/', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();
    const [assets] = await connection.execute(
      `SELECT id, cloudinary_url, filename, file_type, width, height, uploaded_at
       FROM media_assets
       ORDER BY uploaded_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM media_assets');
    connection.release();

    res.json({
      data: assets,
      total: countResult[0].count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('List media error:', error);
    res.status(500).json({ error: 'Failed to list media' });
  }
});

/**
 * DELETE /api/admin/media/:id
 * Delete media asset from Cloudinary and database
 */
router.delete('/:id', authenticateJWT, requireEditorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const connection = await pool.getConnection();
    const [assets] = await connection.execute(
      'SELECT cloudinary_public_id FROM media_assets WHERE id = ?',
      [id]
    );

    if (assets.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Media not found' });
    }

    const publicId = assets[0].cloudinary_public_id;

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.warn('Cloudinary deletion warning:', error.message);
    }

    // Delete from database
    await connection.execute('DELETE FROM media_assets WHERE id = ?', [id]);

    await logAudit(userId, 'delete', 'media_asset', id, { public_id: publicId }, null, req);

    connection.release();

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
