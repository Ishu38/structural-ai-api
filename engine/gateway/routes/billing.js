/**
 * Billing Routes
 * Handles Stripe integration and usage tracking
 */
const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');

// All billing routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/billing/usage
 * @desc    Get current billing period usage
 * @access  Private
 */
router.get('/usage', billingController.getUsage);

/**
 * @route   GET /api/billing/invoices
 * @desc    Get user's invoice history
 * @access  Private
 */
router.get('/invoices', billingController.getInvoices);

/**
 * @route   POST /api/billing/subscription
 * @desc    Create or update subscription
 * @access  Private
 * @body    { plan: string }
 */
router.post('/subscription', billingController.createSubscription);

/**
 * @route   GET /api/billing/subscription
 * @desc    Get current subscription details
 * @access  Private
 */
router.get('/subscription', billingController.getSubscription);

/**
 * @route   DELETE /api/billing/subscription
 * @desc    Cancel subscription
 * @access  Private
 */
router.delete('/subscription', billingController.cancelSubscription);

/**
 * @route   POST /api/billing/webhook
 * @desc    Stripe webhook endpoint (no auth required)
 * @access  Public (Stripe only)
 */
router.post('/webhook', billingController.handleWebhook);

/**
 * @route   GET /api/billing/plans
 * @desc    Get available pricing plans
 * @access  Private
 */
router.get('/plans', billingController.getPlans);

module.exports = router;
