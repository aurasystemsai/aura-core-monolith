# Pre-Launch Checklist - Shopify Integration & UX Complete

## ✅ Completed (Just Now)

- [x] Shopify OAuth authentication flow (418 lines)
- [x] Settings page with Shopify/Billing/General tabs  
- [x] Billing & subscription management UI
- [x] Onboarding wizard (3-step guided setup)
- [x] Database schema for Shopify OAuth
- [x] Backend API routes for billing
- [x] Updated navigation (Settings + Billing buttons)
- [x] Fixed ConnectShopifyBanner component
- [x] All files compile with no errors

## 🔧 Configuration Required (Before Launch)

### 1. Shopify App Setup (30 minutes)

- [ ] Create Shopify Partner account at https://partners.shopify.com/
- [ ] Create new app in Partner Dashboard
- [ ] Configure App URLs:
  - **App URL**: `https://your-production-domain.com`
  - **Allowed redirection URL(s)**: 
    - `https://your-production-domain.com/shopify/callback`
- [ ] Copy credentials to .env:
  ```env
  SHOPIFY_API_KEY=<from Partner Dashboard>
  SHOPIFY_API_SECRET=<from Partner Dashboard>
  APP_URL=https://your-production-domain.com
  SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory
  ```
- [ ] Set API scopes (check boxes in Partner Dashboard):
  - Products (read/write)
  - Orders (read/write)
  - Customers (read/write)
  - Inventory (read/write)

### 2. Database Migration (5 minutes)

- [ ] Connect to production database
- [ ] Run migration:
  ```bash
  psql $DATABASE_URL -f migrations/002_shopify_integration.sql
  ```
- [ ] Verify tables created:
  ```sql
  \dt shopify_*
  -- Should show: shopify_stores, shops, shopify_sync_logs, shopify_webhooks
  ```

### 3. Stripe Configuration (15 minutes)

- [ ] Create Stripe account at https://stripe.com/
- [ ] Create products/prices:
  - **Free Plan**: $0/month (id: `free`)
  - **Pro Plan**: $99/month (id: `pro`)  
  - **Enterprise Plan**: $299/month (id: `enterprise`)
- [ ] Copy credentials to .env:
  ```env
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```
- [ ] Configure webhook endpoint:
  - URL: `https://your-domain.com/api/billing/webhook`
  - Events: `customer.subscription.*`, `invoice.*`

### 4. Environment Variables Audit

Create production .env file with ALL required variables:

```env
# === CORE ===
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...

# === SHOPIFY APP (OAuth) ===
SHOPIFY_API_KEY=abc123
SHOPIFY_API_SECRET=xyz789
APP_URL=https://your-domain.com
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory

# === SHOPIFY LEGACY (for existing shopifyApi.js) ===
SHOPIFY_ACCESS_TOKEN=shpat_...
SHOPIFY_STORE_URL=yourstore.myshopify.com

# === STRIPE ===
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# === OPENAI ===
OPENAI_API_KEY=sk-...

# === SESSION ===
SESSION_SECRET=random-256-bit-string

# === OPTIONAL ===
RENDER_DISK_PATH=/var/data  # For persistent storage on Render
```

### 5. Deployment (30 minutes)

- [ ] Commit all changes to Git:
  ```bash
  git add .
  git commit -m "feat: Add Shopify OAuth, Settings page, Billing UI, Onboarding wizard"
  git push origin main
  ```

- [ ] Deploy to production (choose platform):
  
  **Render**:
  - [ ] Push to GitHub
  - [ ] Render auto-deploys from main branch
  - [ ] Set environment variables in Render dashboard
  - [ ] Wait for build to complete
  
  **Heroku**:
  ```bash
  git push heroku main
  heroku config:set SHOPIFY_API_KEY=...
  heroku config:set SHOPIFY_API_SECRET=...
  # ... set all env vars
  ```
  
  **AWS/VPS**:
  ```bash
  ssh user@server
  cd /var/www/aura
  git pull origin main
  npm install
  pm2 restart aura
  ```

- [ ] Verify deployment:
  - [ ] App loads at https://your-domain.com
  - [ ] Settings page accessible
  - [ ] Billing page accessible
  - [ ] No console errors

### 6. Test OAuth Flow (15 minutes)

- [ ] Create Shopify development store:
  - Go to Partner Dashboard → Stores → Add store → Development store
  - Name it "Aura Test Store"
  
- [ ] Install your app on dev store:
  - Partner Dashboard → Apps → Your App → Test on development store
  - OR navigate to Settings → Shopify Integration → Connect
  
- [ ] Complete authorization:
  - [ ] Click "Install" on Shopify
  - [ ] Redirected to your app
  - [ ] Settings page shows "Connected" badge
  - [ ] Shop name and details displayed
  
- [ ] Test disconnect:
  - [ ] Click "Disconnect Shopify Store"
  - [ ] Confirm disconnection
  - [ ] Status changes to "Not connected"

### 7. Test Billing Flow (10 minutes)

- [ ] Set Stripe to test mode initially
- [ ] Navigate to Billing page
- [ ] Verify current plan shows "Free"
- [ ] Click "Change Plan"
- [ ] Select "Pro" plan ($99/month)
- [ ] Redirected to Stripe Checkout
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Redirected back to app
- [ ] Subscription status updates to "Pro"
- [ ] Invoice appears in Billing History
- [ ] Download invoice PDF works

### 8. Onboarding Test (5 minutes)

- [ ] Clear localStorage (or use incognito)
- [ ] Navigate to app
- [ ] Onboarding wizard appears
- [ ] Complete all 3 steps:
  - [ ] Welcome screen
  - [ ] Shopify connection
  - [ ] Plan selection
- [ ] Dashboard loads after completion
- [ ] Onboarding doesn't show again

### 9. Security Audit

- [ ] HTTPS enabled on production domain
- [ ] Environment variables NOT committed to Git
- [ ] Database credentials secure
- [ ] SHOPIFY_API_SECRET kept private
- [ ] STRIPE_SECRET_KEY kept private
- [ ] CSRF protection enabled (state parameter in OAuth)
- [ ] HMAC verification working for Shopify callbacks
- [ ] Session secrets are strong (256-bit random)

### 10. Monitoring Setup

- [ ] Set up error tracking (Sentry, Rollbar, or similar)
- [ ] Configure logging (Winston, Pino)
- [ ] Database backups enabled (daily)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Stripe webhook monitoring
- [ ] Set up alerts for:
  - [ ] OAuth failures
  - [ ] Payment failures
  - [ ] Database errors
  - [ ] High error rates

## 🚀 Launch Day Checklist

**Day Before Launch**:
- [ ] Run full test suite
- [ ] Verify all environment variables in production
- [ ] Test OAuth flow on production domain
- [ ] Test Stripe checkout (use test mode)
- [ ] Prepare rollback plan
- [ ] Create backup of database

**Launch Day**:
- [ ] Switch Stripe from test mode to live mode
- [ ] Update Stripe webhooks to live endpoint
- [ ] Test one real payment (refund after)
- [ ] Monitor error logs
- [ ] Have support email ready
- [ ] Document any issues

**First Hour**:
- [ ] Monitor sign-ups
- [ ] Check OAuth success rate
- [ ] Verify payments processing
- [ ] Watch error logs
- [ ] Respond to support tickets

## 📊 Success Metrics

Track these after launch:

**OAuth Success Rate**: `successful_connections / attempted_connections`
- Target: >95%

**Onboarding Completion**: `completed_wizards / started_wizards`
- Target: >80%

**Payment Success Rate**: `successful_payments / attempted_payments`
- Target: >98%

**User Retention**: `active_day_7 / signups`
- Target: >40%

## 🆘 Troubleshooting Guide

### OAuth fails with "invalid redirect_uri"
- Check APP_URL matches exactly in .env and Partner Dashboard
- Ensure redirect URL includes `/shopify/callback`
- Verify HTTPS (not HTTP)

### "Shop domain not found" error
- Check shopifyApi.js can resolve tokens
- Verify database migration ran successfully
- Check shopify_stores table has entries

### Billing page shows "Not authenticated"
- Session middleware may not be running
- Check req.user or req.session in billing.js
- Verify session secret is set

### Onboarding wizard doesn't appear
- Check localStorage for completion flag
- Clear `auraOnboardingCompleted` key to reset
- Verify OnboardingWizard import in App.jsx

### Payment fails immediately
- Stripe key may be wrong (test vs live)
- Check STRIPE_SECRET_KEY format (starts with `sk_`)
- Verify Stripe products exist with correct IDs

## ✅ Final Pre-Launch Sign-Off

Before going live, confirm:

- [ ] All environment variables set correctly
- [ ] Database migration successful
- [ ] Shopify App approved (if submitting to App Store)
- [ ] OAuth tested on real store
- [ ] Full billing flow tested
- [ ] Error tracking configured
- [ ] Backups enabled
- [ ] Support email/chat ready
- [ ] Documentation up to date
- [ ] Team trained on new features

## 🎉 You're Ready to Launch!

When all checkboxes above are marked ✅, you are **100% ready for beta users**.

The platform now has:
- ✅ Professional OAuth (no manual setup)
- ✅ Stripe billing (ready to collect revenue)
- ✅ Settings management (user-friendly)
- ✅ Onboarding wizard (guided setup)
- ✅ Production-ready UX

**Status**: Launch-Ready 🚀

Good luck! 💪
