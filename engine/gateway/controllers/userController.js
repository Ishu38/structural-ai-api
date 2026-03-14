/**
 * User Controller
 * Handles user profile and settings
 */
const { User, AnalysisResult, UsageLog } = require('../models');

/**
 * Get user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        apiKey: user.apiKey,
        apiKeyCreated: user.apiKeyCreated
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'An error occurred while fetching profile'
    });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, company } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (company) user.company = company;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Update Failed',
      message: 'An error occurred while updating profile'
    });
  }
};

/**
 * Get user settings
 */
exports.getSettings = async (req, res) => {
  try {
    // For now, return default settings
    // In production, store settings in a separate model or user document
    res.json({
      settings: {
        notifications: {
          email: {
            usageAlerts: true,
            billingAlerts: true,
            newsletter: false
          }
        },
        preferences: {
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD'
        },
        api: {
          defaultModel: 'base',
          includeMetadata: true,
          responseFormat: 'json'
        }
      }
    });
    
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      error: 'Failed to get settings',
      message: 'An error occurred while fetching settings'
    });
  }
};

/**
 * Update user settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const { notifications, preferences, api } = req.body;
    
    // Validate and merge settings
    // In production, save to database
    
    res.json({
      message: 'Settings updated successfully',
      settings: {
        notifications: notifications || {},
        preferences: preferences || {},
        api: api || {}
      }
    });
    
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      error: 'Update Failed',
      message: 'An error occurred while updating settings'
    });
  }
};

/**
 * Get user statistics
 */
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    // Get analysis stats
    const [totalAnalyses, weekAnalyses, monthAnalyses] = await Promise.all([
      AnalysisResult.countDocuments({ user: req.user._id }),
      AnalysisResult.countDocuments({ user: req.user._id, createdAt: { $gte: weekAgo } }),
      AnalysisResult.countDocuments({ user: req.user._id, createdAt: { $gte: monthAgo } })
    ]);
    
    // Get usage stats
    const [totalUsage, monthUsage] = await Promise.all([
      UsageLog.countDocuments({ user: req.user._id, status: 'success' }),
      UsageLog.countDocuments({ user: req.user._id, status: 'success', createdAt: { $gte: monthAgo } })
    ]);
    
    // Get breakdown by type
    const typeBreakdown = await AnalysisResult.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$inputType', count: { $sum: 1 } } }
    ]);
    
    res.json({
      stats: {
        analyses: {
          total: totalAnalyses,
          thisWeek: weekAnalyses,
          thisMonth: monthAnalyses
        },
        usage: {
          total: totalUsage,
          thisMonth: monthUsage
        },
        breakdown: typeBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: 'An error occurred while fetching statistics'
    });
  }
};

/**
 * Delete user account
 */
exports.deleteAccount = async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== true) {
      return res.status(400).json({
        error: 'Confirmation Required',
        message: 'Please confirm account deletion by setting confirm: true'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Cancel Stripe subscription if exists
    if (user.stripeSubscriptionId) {
      try {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      } catch (stripeError) {
        console.error('Failed to cancel Stripe subscription:', stripeError);
      }
    }
    
    // Delete user data (soft delete or hard delete based on requirements)
    await User.findByIdAndDelete(req.user._id);
    
    // Optionally delete related data
    // await AnalysisResult.deleteMany({ user: req.user._id });
    // await UsageLog.deleteMany({ user: req.user._id });
    
    res.json({
      message: 'Account deleted successfully',
      deletedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Deletion Failed',
      message: 'An error occurred while deleting account'
    });
  }
};
