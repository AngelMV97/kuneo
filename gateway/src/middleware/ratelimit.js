/**
 * RATE LIMITING MIDDLEWARE
 * Prevents API abuse
 */

// Simple in-memory rate limiter
// For production, use Redis-backed solution like express-rate-limit
const requestCounts = new Map();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 minute
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

/**
 * Rate limiter middleware
 */
function rateLimiter(req, res, next) {
  // Skip rate limiting for health checks
  if (req.path === '/health') {
    return next();
  }

  const identifier = req.userId || req.ip; // Use userId if authenticated, else IP
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get or initialize request history
  let requests = requestCounts.get(identifier) || [];

  // Remove old requests outside the window
  requests = requests.filter(timestamp => timestamp > windowStart);

  // Check if limit exceeded
  if (requests.length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((requests[0] + WINDOW_MS - now) / 1000)
    });
  }

  // Add current request
  requests.push(now);
  requestCounts.set(identifier, requests);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - requests.length);
  res.setHeader('X-RateLimit-Reset', new Date(now + WINDOW_MS).toISOString());

  next();
}

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  for (const [identifier, requests] of requestCounts.entries()) {
    const activeRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (activeRequests.length === 0) {
      requestCounts.delete(identifier);
    } else {
      requestCounts.set(identifier, activeRequests);
    }
  }
}, WINDOW_MS);

module.exports = {
  rateLimiter
};
