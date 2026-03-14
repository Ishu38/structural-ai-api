/**
 * Billing Controller
 * Handles Stripe integration and usage-based billing
 */
const Stripe = require('stripe');
const { UsageLog, User } = require('../models');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Pricing plans
const PLANS = {
  free: {
    id: 'free',
    name: 'Free Tier',
    price: 0,
    limits: {
      requestsPerMinute: 20,
      requestsPerDay: 1000,
      includedTokens: 10000,
      includedAudioMinutes: 10
    },
    overage: {
      per1000Tokens: 0.002,
      perAudioMinute: 0.05
    }
  },
  pro: {
    id: 'pro',
    id: 'price_pro_placeholder',
    name: 'Pro Tier',
    price: 4900, // $49.00 in cents
    limits: {
      requestsPerMinute: 50,
      requestsPerDay: 10000,
      includedTokens: 500000,
      includedAudioMinutes: 100
    },
    overage: {
      per1000Tokens: 0.0015,
      perAudioMinute: 0.03
    }
  },
  enterprise: {
    id: 'enterprise',
    priceId: 'price_enterprise_placeholder',
    name: 'Enterprise',
    price: 29900, // $299.00 in cents
    limits: {
      requestsPerMinute: 200,
      requestsPerDay: 100000,
      includedTokens: 5000000,
      includedAudioMinutes: 1000
    },
    overage: {
      per1000Tokens: 0.001,
      perAudioMinute: 0.02
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
        price: plan.price / 100
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
        currency: 'USD'
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
 * Get invoice history
 */
exports.getInvoices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.stripeCustomerId) {
      return res.json({
        invoices: [],
        message: 'No billing history available'
      });
    }
    
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 10
    });
    
    res.json({
      invoices: invoices.data.map(inv => ({
        id: inv.id,
        amount: inv.amount_paid / 100,
        currency: inv.currency,
        status: inv.status,
        created: new Date(inv.created * 1000).toISOString(),
        pdfUrl: inv.invoice_pdf,
        hostedInvoiceUrl: inv.hosted_invoice_url
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
 * Create or update subscription
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
          price: 0
        }
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: plan.priceId || 'price_pro_monthly' // Use actual price ID in production
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });
    
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      plan: {
        name: plan.name,
        price: plan.price / 100
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
    
    if (!user.stripeSubscriptionId) {
      return res.json({
        active: false,
        plan: {
          name: req.user.role || 'free',
          price: 0
        }
      });
    }
    
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    res.json({
      active: subscription.status === 'active',
      status: subscription.status,
      plan: {
        name: subscription.items.data[0]?.plan?.nickname || 'Pro',
        price: subscription.items.data[0]?.plan?.amount / 100 || 49
      },
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
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
    
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({
        error: 'No Subscription',
        message: 'No active subscription to cancel'
      });
    }
    
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    
    res.json({
      message: 'Subscription will be cancelled at the end of the billing period',
      cancelledAt: new Date().toISOString(),
      effectiveDate: new Date(subscription.current_period_end * 1000).toISOString()
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
 * Handle Stripe webhooks
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        // Payment succeeded - usage has been billed
        console.log('Invoice payment succeeded:', event.data.object.id);
        break;
        
      case 'invoice.payment_failed':
        // Payment failed - notify user
        console.log('Invoice payment failed:', event.data.object.id);
        // TODO: Send notification to user
        break;
        
      case 'customer.subscription.updated':
        // Subscription updated
        const subscription = event.data.object;
        // TODO: Update user's subscription status
        break;
        
      case 'customer.subscription.deleted':
        // Subscription cancelled
        console.log('Subscription deleted:', event.data.object.id);
        // TODO: Update user's role to free
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
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
