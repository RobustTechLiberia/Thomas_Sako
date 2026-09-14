import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError, asyncHandler } from "./errors.js";

/** Signs a JWT for an admin user. */
export const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
};

/** Verifies a JWT and returns the decoded payload or null. */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch {
    return null;
  }
};

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header) {
    return header.startsWith("Bearer ") ? header.slice(7) : header;
  }
  return null;
};

/** Express middleware: requires a valid JWT. */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) {
    throw new AppError(401, "Authentication required");
  }
  req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
  next();
});

/** Express middleware: restricts the current user to the given roles. */
export const requireRole = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, "You do not have permission to perform this action");
    }
    next();
  });

export const PUBLIC_ROLES = ["admin", "editor"];

export default {
  generateToken,
  verifyToken,
  requireAuth,
  requireRole,
  PUBLIC_ROLES,
};
