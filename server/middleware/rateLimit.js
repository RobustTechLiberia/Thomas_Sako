/* eslint-disable no-undef */

const rateLimitStore = new Map();

/**
 * Simple in-memory rate limiter
 * key: identifier (ip, email, etc)
 * limit: max requests
 * window: time window in ms
 */
export const rateLimit = (limit, window) => {
  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }

    const requests = rateLimitStore.get(key);
    
    // Clean old requests
    const validRequests = requests.filter(time => now - time < window);
    rateLimitStore.set(key, validRequests);

    if (validRequests.length >= limit) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.' 
      });
    }

    validRequests.push(now);
    next();
  };
};

/**
 * Rate limiter by email (for login attempts)
 */
export const rateLimitByEmail = (limit, window) => {
  return (req, res, next) => {
    const email = req.body?.email || 'unknown';
    const key = `email:${email}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }

    const requests = rateLimitStore.get(key);
    const validRequests = requests.filter(time => now - time < window);
    rateLimitStore.set(key, validRequests);

    if (validRequests.length >= limit) {
      return res.status(429).json({ 
        error: 'Too many login attempts. Please try again later.' 
      });
    }

    validRequests.push(now);
    next();
  };
};

/**
 * Clear old entries periodically (cleanup)
 */
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const [key, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(time => now - time < oneHour);
    
    if (validRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }
}, 60000); // Run every minute
