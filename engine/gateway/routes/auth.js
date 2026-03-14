/**
 * Authentication Routes
 * Handles user registration, login, and API key management
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and get API key
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout and invalidate API key
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/regenerate-key
 * @desc    Regenerate API key
 * @access  Private
 */
router.post('/regenerate-key', authenticate, authController.regenerateApiKey);

/**
 * @route   POST /api/auth/verify-key
 * @desc    Verify API key validity
 * @access  Public (for external services)
 */
router.post('/verify-key', authController.verifyApiKey);

module.exports = router;
