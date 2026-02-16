# Quick Start Guide - New Features

## 🚀 What's New (February 2026)

### 1. Shopify OAuth Authentication
Users can now connect their Shopify stores with **one click** - no more manual token configuration!

### 2. Settings Page
Centralized settings management for:
- Shopify integration
- Billing & subscriptions
- API keys
- Team management

### 3. Billing & Subscription Management
Full Stripe integration with:
- Free, Pro ($99/mo), Enterprise ($299/mo) plans
- Usage tracking
- Invoice history
- Payment method management

### 4. Onboarding Wizard
3-step guided setup for new users

---

## 📦 Installation

### 1. Clone & Install Dependencies

```bash
git clone <your-repo>
cd aura-core-monolith-main

# Install backend dependencies
npm install

# Install frontend dependencies
cd aura-console
npm install
cd ..
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required variables** (minimum to run):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/aura
SHOPIFY_API_KEY=<from Shopify Partner Dashboard>
SHOPIFY_API_SECRET=<from Shopify Partner Dashboard>
APP_URL=http://localhost:10000
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
SESSION_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

### 3. Create Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a new app
3. Configure:
   - **App URL**: `http://localhost:10000` (dev) or `https://your-domain.com` (prod)
   - **Redirect URLs**: 
     - `http://localhost:10000/shopify/callback` (dev)
     - `https://your-domain.com/shopify/callback` (prod)
   - **Scopes**: read_products, write_products, read_orders, write_orders, read_customers, write_customers
4. Copy **API key** → `SHOPIFY_API_KEY` in .env
5. Copy **API secret** → `SHOPIFY_API_SECRET` in .env

### 4. Setup Stripe

1. Create account at [Stripe](https://stripe.com/)
2. Create products:
   - **Pro**: $99/month (product ID: `pro`)
   - **Enterprise**: $299/month (product ID: `enterprise`)
3. Copy **Secret key** → `STRIPE_SECRET_KEY` in .env
4. Configure webhook:
   - URL: `https://your-domain.com/api/billing/webhook`
   - Events: `customer.subscription.*`, `invoice.*`
   - Copy **Webhook secret** → `STRIPE_WEBHOOK_SECRET` in .env

### 5. Run Database Migrations

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run migrations
\i migrations/001_initial_schema.sql
\i migrations/002_shopify_integration.sql

# Verify tables created
\dt shopify*
```

### 6. Start Development Server

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd aura-console
npm run dev
```

Visit: http://localhost:10000

---

## 🧪 Testing

### Test Shopify OAuth

1. Navigate to **Settings** → **Shopify Integration**
2. Enter shop domain: `yourstore.myshopify.com`
3. Click **Connect to Shopify**
4. Authorize on Shopify admin page
5. Redirected back → should show "Connected" status

### Test Billing

1. Navigate to **Billing**
2. Click **Change Plan**
3. Select **Pro** ($99/month)
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete payment
6. Verify subscription shows as active

### Test Onboarding

1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Onboarding wizard should appear
4. Complete all 3 steps
5. Verify dashboard loads

---

## 🔧 Common Issues

### "Invalid redirect_uri" error
- Make sure `APP_URL` in .env matches exactly what's in Shopify Partner Dashboard
- Include protocol (`http://` or `https://`)
- No trailing slash

### OAuth callback fails
- Check `SHOPIFY_API_SECRET` is correct
- Verify HMAC verification is working (check logs)
- Ensure database migration ran successfully

### Billing page shows "Not authenticated"
- Check `SESSION_SECRET` is set
- Verify session middleware is running
- Check browser cookies are enabled

### Database connection fails
- Verify PostgreSQL is running: `psql $DATABASE_URL -c "SELECT 1"`
- Check connection string format
- Ensure database exists

---

## 📁 Project Structure

```
aura-core-monolith-main/
├── src/
│   ├── routes/
│   │   ├── shopify-auth.js          # NEW: OAuth authentication
│   │   └── billing.js                # NEW: Billing API
│   ├── core/
│   │   ├── shopifyApi.js             # Existing: API client
│   │   └── stripeRevenueService.js   # Existing: Stripe integration
│   └── server.js                     # Main server (updated)
├── aura-console/
│   └── src/
│       ├── components/
│       │   ├── Settings.jsx          # NEW: Settings page
│       │   ├── Billing.jsx           # NEW: Billing UI
│       │   └── OnboardingWizard.jsx  # NEW: Setup wizard
│       └── App.jsx                   # Updated: routing
├── migrations/
│   ├── 001_initial_schema.sql
│   └── 002_shopify_integration.sql   # NEW: OAuth tables
├── .env.example                      # NEW: Environment template
└── package.json
```

---

## 🚢 Deployment

### Deploy to Render.com

1. **Create Web Service**:
   - Connect GitHub repo
   - Build command: `npm install && cd aura-console && npm install && npm run build && cd ..`
   - Start command: `npm start`
   - Add environment variables from .env.example

2. **Create PostgreSQL Database**:
   - Add PostgreSQL addon
   - Copy DATABASE_URL to environment variables

3. **Run Migrations**:
   ```bash
   # In Render shell
   psql $DATABASE_URL -f migrations/001_initial_schema.sql
   psql $DATABASE_URL -f migrations/002_shopify_integration.sql
   ```

4. **Update Shopify App**:
   - Change App URL to your Render URL
   - Update redirect URL to `https://your-app.onrender.com/shopify/callback`

5. **Configure Stripe Webhook**:
   - Point to `https://your-app.onrender.com/api/billing/webhook`

### Deploy to Heroku

```bash
# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set SHOPIFY_API_KEY=...
heroku config:set SHOPIFY_API_SECRET=...
heroku config:set APP_URL=https://your-app-name.herokuapp.com
# ... set all other env vars

# Deploy
git push heroku main

# Run migrations
heroku run bash
psql $DATABASE_URL -f migrations/001_initial_schema.sql
psql $DATABASE_URL -f migrations/002_shopify_integration.sql
```

---

## 📊 API Endpoints

### Shopify OAuth
```
GET  /shopify/auth?shop=store.myshopify.com
GET  /shopify/callback?code=xxx&hmac=xxx&shop=xxx&state=xxx
POST /shopify/disconnect
GET  /shopify/status?shop=store.myshopify.com
```

### Billing
```
GET  /api/billing/subscription
GET  /api/billing/payment-method
GET  /api/billing/invoices
GET  /api/billing/usage
POST /api/billing/subscribe
POST /api/billing/cancel
GET  /api/billing/invoices/:id/pdf
```

---

## 🔐 Security

- ✅ OAuth CSRF protection (state parameter)
- ✅ HMAC signature verification
- ✅ Encrypted token storage
- ✅ Webhook signature verification
- ✅ Session-based authentication
- ✅ HTTPS required in production

**Production checklist**:
- [ ] Use HTTPS (never HTTP)
- [ ] Rotate SESSION_SECRET regularly
- [ ] Keep SHOPIFY_API_SECRET secure
- [ ] Use Stripe live keys only in production
- [ ] Enable rate limiting
- [ ] Set up error monitoring (Sentry)

---

## 📚 Documentation

- [SHOPIFY_INTEGRATION_COMPLETE.md](SHOPIFY_INTEGRATION_COMPLETE.md) - Full implementation details
- [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md) - Launch readiness checklist
- [FIXES_SUMMARY.md](FIXES_SUMMARY.md) - What was fixed

---

## 🆘 Support

**Issue**: OAuth not working
- Check Shopify Partner Dashboard settings
- Verify APP_URL matches exactly
- Review logs for HMAC verification failures

**Issue**: Payments failing
- Verify STRIPE_SECRET_KEY is correct (test vs live)
- Check Stripe dashboard for error details
- Ensure products exist with correct IDs

**Issue**: Database errors
- Run migrations again
- Check PostgreSQL logs
- Verify DATABASE_URL is correct

---

## 🎉 You're Ready!

Start the servers and test:
1. OAuth connection → Settings page
2. Plan selection → Billing page
3. Onboarding → First-time user experience

**Happy building!** 🚀
