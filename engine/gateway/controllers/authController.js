/**
 * Authentication Controller
 * Handles user registration, login, and API key management
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, APIKey } = require('../models');

/**
 * Register a new user
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email, password, and name are required'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: 'User Exists',
        message: 'An account with this email already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      company
    });
    
    await user.save();
    
    // Generate API key
    const apiKey = new APIKey({
      key: user.apiKey,
      user: user._id
    });
    await apiKey.save();
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        apiKey: user.apiKey
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration Failed',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      });
    }
    
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account Inactive',
        message: 'This account has been deactivated'
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        apiKey: user.apiKey
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login Failed',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
  try {
    // In a stateless API, logout is handled client-side by discarding the token
    // Optionally, you could maintain a blacklist of tokens
    
    res.json({
      message: 'Logout successful',
      hint: 'Please discard your API key and token'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout Failed',
      message: 'An error occurred during logout'
    });
  }
};

/**
 * Get current user info
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        apiKey: user.apiKey,
        apiKeyCreated: user.apiKeyCreated,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
      message: 'An error occurred while fetching user data'
    });
  }
};

/**
 * Regenerate API key
 */
exports.regenerateApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Generate new API key
    const newApiKey = crypto.randomBytes(32).toString('hex');
    
    // Update user
    user.apiKey = newApiKey;
    user.apiKeyCreated = new Date();
    await user.save();
    
    // Update or create API key record
    await APIKey.findOneAndUpdate(
      { user: user._id },
      {
        key: newApiKey,
        lastUsed: new Date(),
        requestCount: 0
      },
      { upsert: true }
    );
    
    res.json({
      message: 'API key regenerated successfully',
      apiKey: newApiKey,
      warning: 'Please store this key securely. It cannot be retrieved later.'
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({
      error: 'Failed to regenerate API key',
      message: 'An error occurred while regenerating your API key'
    });
  }
};

/**
 * Verify API key (for external services)
 */
exports.verifyApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'API key is required'
      });
    }
    
    const apiKeyDoc = await APIKey.findByKey(apiKey);
    
    if (!apiKeyDoc) {
      return res.status(401).json({
        valid: false,
        message: 'Invalid or inactive API key'
      });
    }
    
    const user = await User.findById(apiKeyDoc.user._id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        valid: false,
        message: 'User account is inactive'
      });
    }
    
    res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      rateLimit: apiKeyDoc.rateLimit
    });
  } catch (error) {
    console.error('Verify API key error:', error);
    res.status(500).json({
      error: 'Verification Failed',
      message: 'An error occurred while verifying the API key'
    });
  }
};
