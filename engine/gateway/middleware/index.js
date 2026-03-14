/**
 * Middleware index
 * Exports all middleware
 */
const { authenticate, optionalAuth, requireAdmin, requireEnterprise } = require('./auth');
const { rateLimitMiddleware, createRateLimiter, applyTierLimit, TIER_LIMITS } = require('./rateLimiter');
const errorHandler = require('./errorHandler');
const requestLogger = require('./requestLogger');

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireEnterprise,
  rateLimit: rateLimitMiddleware,
  createRateLimiter,
  applyTierLimit,
  TIER_LIMITS,
  errorHandler,
  requestLogger
};
