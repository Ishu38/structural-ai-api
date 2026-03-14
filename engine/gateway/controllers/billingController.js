/**
 * Billing Controller
 * Handles Razorpay integration and usage-based billing
 * Razorpay: Better for India - UPI, lower fees, easier KYC
 */
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { UsageLog, User } = require('../models');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

// Pricing plans (INR for Indian market)
const PLANS = {
  free: {
    id: 'free',
    name: 'Free Tier',
    price: 0,
    currency: 'INR',
    limits: {
      requestsPerMinute: 20,
      requestsPerDay: 1000,
      includedTokens: 10000,
      includedAudioMinutes: 10
    },
    overage: {
      per1000Tokens: 0.15,  // ₹0.15 per 1K tokens
      perAudioMinute: 4     // ₹4 per audio minute
    }
  },
  pro: {
    id: 'pro',
    razorpayPlanId: 'plan_pro_inr',
    name: 'Pro Tier',
    price: 399900,  // ₹3,999 in paise
    currency: 'INR',
    limits: {
      requestsPerMinute: 50,
      requestsPerDay: 10000,
      includedTokens: 500000,
      includedAudioMinutes: 100
    },
    overage: {
      per1000Tokens: 0.10,
      perAudioMinute: 2.50
    }
  },
  enterprise: {
    id: 'enterprise',
    razorpayPlanId: 'plan_enterprise_inr',
    name: 'Enterprise',
    price: 2499900,  // ₹24,999 in paise
    currency: 'INR',
    limits: {
      requestsPerMinute: 200,
      requestsPerDay: 100000,
      includedTokens: 5000000,
      includedAudioMinutes: 1000
    },
    overage: {
      per1000Tokens: 0.08,
      perAudioMinute: 1.50
    }
  }
};

/**
 * Get current usage
 */
exports.getUsage = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get usage summary
    const usageSummary = await UsageLog.getUsageSummary(
      req.user._id,
      monthStart,
      monthEnd
    );
    
    // Calculate totals
    let totalTokens = 0;
    let totalAudioSeconds = 0;
    let totalRequests = 0;
    
    usageSummary.forEach(item => {
      totalRequests += item.totalRequests;
      totalTokens += item.totalTokens || 0;
      totalAudioSeconds += item.totalAudioSeconds || 0;
    });
    
    // Get user's plan
    const userPlan = req.user.role || 'free';
    const plan = PLANS[userPlan];
    
    // Calculate overage
    const tokenOverage = Math.max(0, totalTokens - plan.limits.includedTokens);
    const audioOverageMinutes = Math.max(0, (totalAudioSeconds / 60) - plan.limits.includedAudioMinutes);
    
    const tokenOverageCost = (tokenOverage / 1000) * plan.overage.per1000Tokens;
    const audioOverageCost = audioOverageMinutes * plan.overage.perAudioMinute;
    const totalOverage = tokenOverageCost + audioOverageCost;
    
    res.json({
      period: {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString()
      },
      plan: {
        name: plan.name,
        price: plan.price / 100,
        currency: plan.currency
      },
      usage: {
        totalRequests,
        totalTokens,
        totalAudioSeconds,
        totalAudioMinutes: Math.round(totalAudioSeconds / 60)
      },
      limits: {
        includedTokens: plan.limits.includedTokens,
        includedAudioMinutes: plan.limits.includedAudioMinutes,
        tokenOverage: Math.round(tokenOverage),
        audioOverageMinutes: Math.round(audioOverageMinutes)
      },
      billing: {
        basePrice: plan.price / 100,
        overageCost: totalOverage.toFixed(2),
        estimatedTotal: (plan.price / 100 + totalOverage).toFixed(2),
        currency: plan.currency || 'INR'
      },
      breakdown: usageSummary
    });
    
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      error: 'Failed to get usage',
      message: 'An error occurred while fetching usage data'
    });
  }
};

/**
 * Get invoice history (Razorpay payments)
 */
exports.getInvoices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.razorpayCustomerId) {
      return res.json({
        invoices: [],
        message: 'No billing history available'
      });
    }
    
    // Fetch Razorpay payments
    const payments = await razorpay.payments.all({
      customer_id: user.razorpayCustomerId,
      count: 10
    });
    
    res.json({
      invoices: payments.items.map(payment => ({
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        created: new Date(payment.created_at * 1000).toISOString(),
        method: payment.method || 'card'
      }))
    });
    
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      error: 'Failed to get invoices',
      message: 'An error occurred while fetching invoices'
    });
  }
};

/**
 * Create Razorpay subscription
 */
exports.createSubscription = async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;
    
    const plan = PLANS[planId] || PLANS.pro;
    
    if (plan.price === 0) {
      // Free plan - just update user role
      req.user.role = 'free';
      await req.user.save();
      
      return res.json({
        message: 'Subscription updated to Free plan',
        plan: {
          name: plan.name,
          price: 0,
          currency: 'INR'
        }
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Create or get Razorpay customer
    let customerId = user.razorpayCustomerId;
    
    if (!customerId) {
      const customer = await razorpay.customers.create({
        email: user.email,
        name: user.name,
        notes: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.razorpayCustomerId = customerId;
      await user.save();
    }
    
    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId || 'plan_pro_monthly',
      customer_notify: 1,
      total_count: 12,
      customer_id: customerId
    });
    
    res.json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,  // Razorpay payment page
      plan: {
        name: plan.name,
        price: plan.price / 100,
        currency: plan.currency
      }
    });
    
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      error: 'Subscription Failed',
      message: error.message || 'An error occurred while creating subscription'
    });
  }
};

/**
 * Get current subscription
 */
exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.razorpaySubscriptionId) {
      return res.json({
        active: false,
        plan: {
          name: req.user.role || 'free',
          price: 0,
          currency: 'INR'
        }
      });
    }
    
    const subscription = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
    
    res.json({
      active: subscription.status === 'active',
      status: subscription.status,
      plan: {
        name: 'Pro',
        price: subscription.plan_amount / 100 || 3999,
        currency: 'INR'
      },
      currentPeriodStart: new Date(subscription.start_at * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.end_at * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
    
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      error: 'Failed to get subscription',
      message: 'An error occurred while fetching subscription details'
    });
  }
};

/**
 * Cancel subscription
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.razorpaySubscriptionId) {
      return res.status(400).json({
        error: 'No Subscription',
        message: 'No active subscription to cancel'
      });
    }
    
    await razorpay.subscriptions.cancel(user.razorpaySubscriptionId);
    
    res.json({
      message: 'Subscription cancelled successfully',
      cancelledAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      error: 'Cancellation Failed',
      message: 'An error occurred while cancelling subscription'
    });
  }
};

/**
 * Handle Razorpay webhooks
 */
exports.handleWebhook = async (req, res) => {
  const razorpaySignature = req.headers['x-razorpay-signature'];
  
  try {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (expectedSignature !== razorpaySignature) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    const event = req.body;
    
    // Handle the event
    switch (event.event) {
      case 'payment.captured':
        // Payment succeeded
        console.log('Payment captured:', event.payload.payment.entity.id);
        break;
        
      case 'payment.failed':
        // Payment failed
        console.log('Payment failed:', event.payload.payment.entity.id);
        break;
        
      case 'subscription.activated':
        // Subscription activated
        console.log('Subscription activated:', event.payload.subscription.entity.id);
        break;
        
      case 'subscription.cancelled':
        // Subscription cancelled
        console.log('Subscription cancelled:', event.payload.subscription.entity.id);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({
      error: 'Webhook Error',
      message: error.message
    });
  }
};

/**
 * Get available pricing plans
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = Object.values(PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price / 100,
      currency: 'USD',
      billing: 'monthly',
      limits: plan.limits,
      overage: plan.overage
    }));
    
    res.json({ plans });
    
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      error: 'Failed to get plans',
      message: 'An error occurred while fetching pricing plans'
    });
  }
};
