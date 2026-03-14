/**
 * Authentication Middleware
 * Verifies API keys and attaches user to request
 */
const APIKey = require('../models/APIKey');
const User = require('../models/User');

/**
 * Authenticate request using API key
 * Looks for API key in Authorization header or x-api-key header
 */
const authenticate = async (req, res, next) => {
  try {
    // Get API key from headers
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    
    let apiKeyValue;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKeyValue = authHeader.substring(7);
    } else if (apiKeyHeader) {
      apiKeyValue = apiKeyHeader;
    } else {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide an API key in the Authorization header (Bearer <key>) or x-api-key header'
      });
    }
    
    // Validate API key
    const apiKey = await APIKey.findByKey(apiKeyValue);
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or inactive'
      });
    }
    
    // Check if user is active
    const user = await User.findById(apiKey.user._id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'This account has been deactivated'
      });
    }
    
    // Attach user and API key to request
    req.user = user;
    req.apiKey = apiKey;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred while validating your API key'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no API key
 * Useful for public endpoints with optional rate limiting
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    
    let apiKeyValue;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKeyValue = authHeader.substring(7);
    } else if (apiKeyHeader) {
      apiKeyValue = apiKeyHeader;
    }
    
    if (apiKeyValue) {
      const apiKey = await APIKey.findByKey(apiKeyValue);
      if (apiKey) {
        const user = await User.findById(apiKey.user._id);
        if (user && user.isActive) {
          req.user = user;
          req.apiKey = apiKey;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Admin-only authentication
 */
const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  
  next();
};

/**
 * Enterprise-only authentication
 */
const requireEnterprise = async (req, res, next) => {
  if (!req.user || (req.user.role !== 'enterprise' && req.user.role !== 'admin')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Enterprise access required'
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireEnterprise
};
