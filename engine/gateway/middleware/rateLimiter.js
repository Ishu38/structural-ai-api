/**
 * Rate Limiting Middleware
 * Custom rate limiting based on API key tier
 */
const rateLimit = require('express-rate-limit');
const APIKey = require('../models/APIKey');

// In-memory store for rate limiting (use Redis in production)
const requestStore = new Map();

/**
 * Custom rate limiter based on API key
 */
const rateLimitMiddleware = async (req, res, next) => {
  try {
    if (!req.apiKey) {
      // No API key attached, use default limiting
      return next();
    }
    
    const apiKey = req.apiKey;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    // Get or create store entry for this API key
    const key = `ratelimit:${apiKey.key}`;
    let store = requestStore.get(key);
    
    if (!store || now - store.windowStart > windowMs) {
      // New window
      store = {
        windowStart: now,
        count: 0
      };
      requestStore.set(key, store);
    }
    
    // Increment counter
    store.count++;
    
    // Check against limit
    const limit = apiKey.rateLimit.requestsPerMinute;
    
    if (store.count > limit) {
      const retryAfter = Math.ceil((store.windowStart + windowMs - now) / 1000);
      
      res.set('X-RateLimit-Limit', limit.toString());
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', new Date(store.windowStart + windowMs).toISOString());
      res.set('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${limit} requests per minute.`,
        retryAfter
      });
    }
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', limit.toString());
    res.set('X-RateLimit-Remaining', Math.max(0, limit - store.count).toString());
    res.set('X-RateLimit-Reset', new Date(store.windowStart + windowMs).toISOString());
    
    // Update API key usage in database (async, don't wait)
    apiKey.incrementUsage().catch(err => {
      console.error('Failed to update API key usage:', err);
    });
    
    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    next(); // Continue on error
  }
};

/**
 * Create a standard express-rate-limit instance
 * For use on specific routes
 */
const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000,
    max: options.max || 50,
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.apiKey?.key || req.ip;
    }
  });
};

/**
 * Tier-based rate limits
 */
const TIER_LIMITS = {
  free: {
    requestsPerMinute: 20,
    requestsPerDay: 1000,
    maxTokensPerRequest: 5000
  },
  pro: {
    requestsPerMinute: 50,
    requestsPerDay: 10000,
    maxTokensPerRequest: 50000
  },
  enterprise: {
    requestsPerMinute: 200,
    requestsPerDay: 100000,
    maxTokensPerRequest: 500000
  }
};

/**
 * Apply tier-based rate limits
 */
const applyTierLimit = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  const tier = req.user.role || 'free';
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  
  // Attach limits to request for use in controllers
  req.rateLimits = limits;
  
  next();
};

module.exports = {
  rateLimitMiddleware,
  createRateLimiter,
  applyTierLimit,
  TIER_LIMITS
};
