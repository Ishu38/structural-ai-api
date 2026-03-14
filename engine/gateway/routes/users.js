/**
 * User Routes
 * Handles user profile and settings
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 * @body    { name?, email?, company? }
 */
router.put('/profile', userController.updateProfile);

/**
 * @route   GET /api/users/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/settings', userController.getSettings);

/**
 * @route   PUT /api/users/settings
 * @desc    Update user settings
 * @access  Private
 * @body    { notifications?, preferences? }
 */
router.put('/settings', userController.updateSettings);

/**
 * @route   GET /api/users/stats
 * @desc    Get user usage statistics
 * @access  Private
 */
router.get('/stats', userController.getStats);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', userController.deleteAccount);

module.exports = router;
