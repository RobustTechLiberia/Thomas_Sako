/** Simple in-memory sliding-window rate limiter. */
export class RateLimiter {
  constructor({ max, windowMs }) {
    this.max = max;
    this.windowMs = windowMs;
    this.hits = new Map(); // key -> number[] (timestamps)
  }

  hit(key) {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const timestamps = (this.hits.get(key) || []).filter((t) => t > cutoff);

    if (timestamps.length >= this.max) {
      const retryAfterMs = cutoff - (timestamps[0] || now) + this.windowMs;
      this.hits.set(key, timestamps);
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    return { allowed: true };
  }
}

/** Express middleware factory: 429 when the window is exceeded. */
export const rateLimit =
  ({ max, windowMs, key = (req) => req.ip, message = "Too many requests" }) =>
  (req, res, next) => {
    const app = req.app;
    if (!app.locals.limiters) {
      app.locals.limiters = new Map();
    }
    const cacheKey = `${max}:${windowMs}`;
    let limiter = app.locals.limiters.get(cacheKey);
    if (!limiter) {
      limiter = new RateLimiter({ max, windowMs });
      app.locals.limiters.set(cacheKey, limiter);
    }

    const result = limiter.hit(`${key(req)}:${req.path}`);
    if (!result.allowed) {
      res.setHeader("Retry-After", Math.ceil(result.retryAfterMs / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };

export default RateLimiter;
