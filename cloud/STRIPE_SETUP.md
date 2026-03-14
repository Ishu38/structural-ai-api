# Stripe Setup Guide for Metered Billing

## Step 1: Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Create your account
3. Verify your email
4. Complete business profile

## Step 2: Get API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the following keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

Add to your `.env` file:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Step 3: Create Products and Prices

### Option A: Using Stripe Dashboard

1. Go to Products → Add Product
2. Create "Structural AI Pro Plan"
   - Name: Pro Plan
   - Description: Professional tier with increased limits
   - Pricing: Recurring, $49/month

3. Create usage-based prices:
   - Go to Products → Add Price
   - Select your product
   - Pricing: Recurring + Usage-based
   - Set $0.0015 per 1000 tokens (overage)
   - Set $0.03 per audio minute (overage)

### Option B: Using Stripe CLI

```bash
# Install Stripe CLI
stripe login

# Create product
stripe products create \
  --name "Pro Plan" \
  --description "Professional tier for Structural AI API"

# Create price
stripe prices create \
  --product=prod_xxx \
  --unit-amount=4900 \
  --currency=usd \
  --recurring=interval=month
```

## Step 4: Set Up Webhooks

1. Go to Developers → Webhooks → Add endpoint
2. Enter your webhook URL:
   - Development: `https://your-ngrok-url.ngrok.io/api/billing/webhook`
   - Production: `https://your-domain.com/api/billing/webhook`

3. Select events to listen to:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

4. Copy the webhook signing secret
5. Add to `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 5: Test Metered Billing

### Using Stripe CLI for Local Testing

```bash
# Listen for webhook events
stripe listen --forward-to localhost:3000/api/billing/webhook

# Simulate a payment
stripe trigger invoice.payment_succeeded

# Create a test customer
stripe customers create \
  --email test@example.com \
  --name "Test User"
```

## Step 6: Configure Usage Reporting

The application automatically tracks:
- Text tokens processed
- Audio seconds transcribed
- API requests made

Usage is aggregated monthly and reported to Stripe.

## Step 7: Go Live

1. Test thoroughly in test mode
2. Switch to live API keys:
   - Update `STRIPE_SECRET_KEY` (starts with `sk_live_`)
   - Update `STRIPE_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - Update webhook endpoint with live secret

3. Create live products and prices
4. Update product/price IDs in `src/api/controllers/billingController.js`

## Pricing Tiers (Example)

| Tier | Monthly Price | Included Tokens | Included Audio | Overage (tokens) | Overage (audio) |
|------|--------------|-----------------|----------------|------------------|-----------------|
| Free | $0 | 10,000 | 10 min | $0.002/1K | $0.05/min |
| Pro | $49 | 500,000 | 100 min | $0.0015/1K | $0.03/min |
| Enterprise | $299 | 5,000,000 | 1,000 min | $0.001/1K | $0.02/min |

## Testing Cards

Use these test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0027 6000 3184

Always use future expiry dates and any 3-digit CVC.
