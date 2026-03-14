# Razorpay Setup Guide (India-Focused)

## Why Razorpay over Stripe?

✅ **Better for India:**
- UPI, Paytm, Net Banking, Cards support
- Lower fees (2% vs Stripe's 3-4%)
- Instant settlement to Indian banks
- Easier KYC (Indian business documents)
- INR pricing, no currency conversion
- Local support team

---

## Step 1: Create Razorpay Account

1. Go to https://dashboard.razorpay.com/
2. Sign up with your business email
3. Complete KYC:
   - PAN Card (individual) or GST (business)
   - Bank account details
   - Business address proof

**Approval Time:** 2-3 working days

---

## Step 2: Get API Keys

1. Go to **Settings** → **API Keys**
2. Generate **Test Keys** (for development)
3. Generate **Live Keys** (for production)

Add to your `.env` file:
```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

---

## Step 3: Create Subscription Plans

### Option A: Using Razorpay Dashboard

1. Go to **Products** → **Subscription Plans**
2. Click **Create Plan**
3. Add plan details:
   - **Name**: Pro Plan
   - **Amount**: ₹3,999
   - **Currency**: INR
   - **Billing Frequency**: Monthly
   - **Plan ID**: `plan_pro_inr`

4. Create Enterprise Plan:
   - **Name**: Enterprise
   - **Amount**: ₹24,999
   - **Plan ID**: `plan_enterprise_inr`

### Option B: Using Razorpay API

```bash
curl -X POST https://api.razorpay.com/v1/plans \
  -u rzp_test_key:secret \
  -H "Content-Type: application/json" \
  -d '{
    "period": "monthly",
    "item": {
      "name": "Pro Plan",
      "amount": 399900,
      "currency": "INR",
      "description": "Professional tier"
    }
  }'
```

---

## Step 4: Setup Webhooks

1. Go to **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Enter URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/api/billing/webhook`
   - **Production**: `https://your-domain.com/api/billing/webhook`

4. Select events:
   - `payment.captured`
   - `payment.failed`
   - `subscription.activated`
   - `subscription.cancelled`

5. Copy **Webhook Secret**
6. Add to `.env`:
```
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Step 5: Test Integration

### Using Razorpay Test Mode

```bash
# Enable test mode in dashboard
# Use test cards:

Success: 4111 1111 1111 1111
Decline: 4111 1111 1111 1234
3DS: 5267 3181 2790 5498
```

### Test Webhook Locally

```bash
# Install Razorpay CLI
npm install -g razorpay-cli

# Login
razorpay login

# Listen for webhooks
razorpay listen --port 3000

# Trigger test payment
razorpay trigger payment.captured
```

---

## Step 6: Pricing Tiers (INR)

| Tier | Monthly | Included Tokens | Included Audio | Overage (tokens) | Overage (audio) |
|------|---------|-----------------|----------------|------------------|-----------------|
| **Free** | ₹0 | 10,000 | 10 min | ₹0.15/1K | ₹4/min |
| **Pro** | ₹3,999 | 500,000 | 100 min | ₹0.10/1K | ₹2.50/min |
| **Enterprise** | ₹24,999 | 5,000,000 | 1,000 min | ₹0.08/1K | ₹1.50/min |

---

## Step 7: Go Live

1. Complete KYC verification
2. Switch to **Live Keys**:
   - Update `RAZORPAY_KEY_ID` (starts with `rzp_live_`)
   - Update `RAZORPAY_KEY_SECRET`
   - Update webhook with live secret

3. Create live plans in dashboard
4. Update plan IDs in `billingController.js`

---

## Payment Methods Supported

✅ **UPI** (Google Pay, PhonePe, Paytm, BHIM)  
✅ **Cards** (Visa, Mastercard, RuPay, Amex)  
✅ **Net Banking** (all major banks)  
✅ **Wallets** (Paytm, FreeCharge, Mobikwik)  
✅ **EMI** (available on Pro+ plans)  
✅ **QR Codes**  

---

## Fees Comparison

| Payment Method | Razorpay | Stripe |
|----------------|----------|--------|
| **Domestic Cards** | 2% | 3% |
| **UPI** | 0% (free!) | N/A |
| **Net Banking** | 0.5% | N/A |
| **Wallets** | 1% | N/A |
| **International** | 3% | 3.9% |

**Savings:** ~40% lower fees than Stripe!

---

## Support

- **Email**: support@razorpay.com
- **Phone**: +91-80-6873-6727
- **Docs**: https://razorpay.com/docs/
- **Status**: https://status.razorpay.com/

---

## Quick Integration Checklist

- [ ] Create Razorpay account
- [ ] Complete KYC
- [ ] Get API keys
- [ ] Create subscription plans
- [ ] Setup webhooks
- [ ] Test with test cards
- [ ] Update `.env` with keys
- [ ] Go live!

---

**Razorpay is the best choice for Indian startups!** 🇮🇳
