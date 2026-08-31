/* eslint-disable no-undef */
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
const TOKEN_EXPIRY = '24h';

/**
 * Generate JWT token
 */
export const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Express middleware: Check if request has valid JWT
 */
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

/**
 * Express middleware: Check if user is admin
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Express middleware: Check if user is admin or editor
 */
export const requireEditorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    return res.status(403).json({ error: 'Editor or admin access required' });
  }

  next();
};

/**
 * Log audit entry
 */
export const logAudit = async (actorId, action, entityType, entityId, oldValues = null, newValues = null, req = null) => {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req?.headers?.['user-agent'] || '';

    const connection = await pool.getConnection();
    await connection.execute(
      `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [actorId, action, entityType, entityId, JSON.stringify(oldValues), JSON.stringify(newValues), ipAddress, userAgent]
    );
    connection.release();
  } catch (error) {
    console.error('Audit log error:', error);
  }
};
