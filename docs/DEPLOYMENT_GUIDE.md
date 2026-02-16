# Revenue Infrastructure Deployment Guide

## Quick Start (15 minutes to production)

This guide walks you through deploying the complete revenue infrastructure from scratch.

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ (or Docker)
- Redis 7+ (or Docker)
- Stripe account (test or live)
- Git repository access

---

## Step 1: Environment Setup (5 minutes)

### 1.1 Clone and Install

```bash
cd aura-core-monolith-main
npm install
cd aura-console && npm install && cd ..
```

### 1.2 Configure Environment

```bash
# Copy environment template
cp .env.revenue .env

# Generate OAuth secrets
node -e "console.log('OAUTH_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
node -e "console.log('OAUTH_SIGNATURE_SECRET=' + require('crypto').randomBytes(64).toString('base64'))" >> .env
```

### 1.3 Add Stripe Keys

Get your Stripe keys from: https://dashboard.stripe.com/apikeys

```bash
# Add to .env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

---

## Step 2: Database Setup (3 minutes)

### Option A: Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be healthy
docker-compose ps

# Run database migrations
npm run migrate
```

### Option B: Local Installation

```bash
# Install PostgreSQL
# Mac: brew install postgresql@15
# Ubuntu: sudo apt install postgresql-15
# Windows: Download from postgresql.org

# Install Redis
# Mac: brew install redis
# Ubuntu: sudo apt install redis
# Windows: Download from redis.io

# Start services
pg_ctl start
redis-server

# Create database
createdb aura_cdp

# Update .env with your connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/aura_cdp
REDIS_URL=redis://localhost:6379

# Run migrations
node scripts/run-migrations.js
```

### Verify Database

```bash
# Check migration status
node scripts/run-migrations.js --status

# You should see:
# ✅ 001_revenue_infrastructure (applied)
```

---

## Step 3: Stripe Configuration (3 minutes)

### 3.1 Create Products and Prices

```bash
node scripts/setup-stripe.js
```

This creates:
- 4 subscription products (Starter, Growth, Pro, Enterprise)
- 8 prices (monthly + annual for each tier)
- Usage-based billing meters
- Webhook endpoint

### 3.2 Add Price IDs to .env

Copy the output from the setup script to your `.env` file:

```bash
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_GROWTH_MONTHLY=price_...
STRIPE_PRICE_GROWTH_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_...
```

### 3.3 Configure Webhooks

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your URL: `https://your-domain.com/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.deleted`
5. Copy the signing secret to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Step 4: Start Application (2 minutes)

### Development Mode

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd aura-console && npm run dev
```

### Production Mode (Docker)

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Check health
curl http://localhost:3000/health
```

---

## Step 5: Verify Installation (2 minutes)

### 5.1 Test Database Connection

```bash
curl http://localhost:3000/api/admin/revenue/summary
```

Expected response:
```json
{
  "mrr": 0,
  "arr": 0,
  "total_customers": 0,
  "paying_customers": 0
}
```

### 5.2 Test Stripe Integration

```bash
# Create test customer
curl -X POST http://localhost:3000/api/customers/test_001/subscription \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "growth",
    "billingCycle": "monthly",
    "email": "test@example.com",
    "companyName": "Test Company"
  }'
```

### 5.3 Access Revenue Dashboard

Open: http://localhost:5173/admin/revenue

You should see:
- MRR/ARR metrics
- Revenue by stream charts
- Customer analytics
- Growth projections

---

## Step 6: Production Deployment

### 6.1 Set Environment Variables

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/aura_cdp
REDIS_URL=redis://prod-redis:6379
STRIPE_SECRET_KEY=sk_live_...  # Use LIVE keys
API_BASE_URL=https://api.auracdp.com
FRONTEND_URL=https://app.auracdp.com
```

### 6.2 Deploy to Cloud

**Option A: Docker (AWS/GCP/Azure)**

```bash
# Build production images
docker build -t aura-backend:latest .
docker build -t aura-frontend:latest ./aura-console

# Push to container registry
docker tag aura-backend:latest your-registry/aura-backend:latest
docker push your-registry/aura-backend:latest

# Deploy via Kubernetes/ECS/Cloud Run
kubectl apply -f k8s/deployment.yaml
```

**Option B: Platform as a Service (Heroku/Render)**

```bash
# Heroku
heroku create aura-cdp-api
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
git push heroku main

# Render (render.yaml)
render deploy
```

### 6.3 Run Production Migrations

```bash
# SSH into production server
ssh production-server

# Run migrations
NODE_ENV=production node scripts/run-migrations.js
```

### 6.4 Verify Production

```bash
# Health check
curl https://api.auracdp.com/health

# Stripe webhook test
stripe trigger invoice.paid --forward-to https://api.auracdp.com/webhooks/stripe
```

---

## Testing the Revenue Flows

### Test 1: Customer Signup → Billing

```bash
# 1. Create customer
curl -X POST http://localhost:3000/api/customers/cust_001/subscription \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "growth",
    "billingCycle": "monthly",
    "email": "customer@example.com",
    "companyName": "Acme Inc"
  }'

# 2. Track usage
curl -X POST http://localhost:3000/api/customers/cust_001/usage \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "event.tracked",
    "eventData": {"type": "page_view"}
  }'

# 3. Generate invoice
curl http://localhost:3000/api/customers/cust_001/invoice?period=2026-02

# Expected: Invoice with subscription + usage charges
```

### Test 2: White-Label Partner

```bash
# 1. Create partner
curl -X POST http://localhost:3000/api/partners \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "professional",
    "companyName": "Agency XYZ",
    "email": "partner@agency.com",
    "sharePercent": 20
  }'

# 2. Create client under partner
curl -X POST http://localhost:3000/api/partners/partner_001/clients \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Client Brand",
    "email": "client@brand.com",
    "tier": "growth"
  }'

# 3. Check partner dashboard
curl http://localhost:3000/api/partners/partner_001/dashboard

# Expected: Partner earnings, client list, revenue split
```

### Test 3: Marketplace App

```bash
# 1. Register developer
curl -X POST http://localhost:3000/api/marketplace/developers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Developer",
    "email": "john@devshop.com",
    "company": "DevShop Inc"
  }'

# 2. Create app
curl -X POST http://localhost:3000/api/marketplace/apps \
  -H "Content-Type: application/json" \
  -d '{
    "developerId": "dev_001",
    "name": "Email Booster",
    "category": "email_marketing",
    "pricingModel": "paid",
    "monthlyPrice": 49
  }'

# 3. Install app
curl -X POST http://localhost:3000/api/customers/cust_001/marketplace/app_001/install \
  -H "Content-Type: application/json" \
  -d '{"scopes": ["profiles:read", "events:write"]}'

# Expected: App installed, OAuth tokens generated
```

---

## Monitoring

### Key Metrics to Track

```sql
-- MRR
SELECT calculate_mrr(CURRENT_DATE);

-- Churn rate (last 30 days)
SELECT calculate_churn_rate(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);

-- Active subscriptions by tier
SELECT tier, COUNT(*) 
FROM active_subscriptions 
GROUP BY tier;

-- Monthly revenue
SELECT * FROM monthly_revenue_summary 
ORDER BY month DESC 
LIMIT 12;
```

### Health Checks

```bash
# Database
curl http://localhost:3000/api/health/db

# Redis
curl http://localhost:3000/api/health/redis

# Stripe
curl http://localhost:3000/api/health/stripe
```

---

## Troubleshooting

### Database Connection Errors

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check connection
psql $DATABASE_URL -c "SELECT NOW()"

# View logs
docker-compose logs postgres
```

### Stripe Webhook Failures

```bash
# View webhook logs in Stripe Dashboard
https://dashboard.stripe.com/webhooks

# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe
stripe trigger invoice.paid
```

### Redis Connection Errors

```bash
# Check Redis
docker-compose ps redis

# Test connection
redis-cli -u $REDIS_URL ping

# View keys
redis-cli -u $REDIS_URL keys '*'
```

---

## Next Steps

1. **Enable Feature Flags** - Turn on revenue streams in .env
2. **Load Test** - Test with 1,000 concurrent users
3. **Set Up Monitoring** - DataDog, New Relic, or Sentry
4. **Create Backups** - Daily database backups to S3
5. **Launch Beta** - 10 friendly customers
6. **Enable Freemium** - Add free tier for acquisition
7. **Open Marketplace** - Recruit first 10 app developers

---

## Support

- **Documentation**: docs/REVENUE_INFRASTRUCTURE_COMPLETE.md
- **Integration Guide**: docs/REVENUE_INTEGRATION_GUIDE.md
- **Launch Plan**: docs/LAUNCH_PLAN.md
- **API Reference**: http://localhost:3000/api/docs

---

## Production Checklist

- [ ] Database migrated successfully
- [ ] Stripe configured with live keys
- [ ] Webhook endpoint verified
- [ ] Environment variables set
- [ ] SSL/TLS certificates installed
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] DNS configured
- [ ] CDN set up for frontend
- [ ] Error tracking enabled
- [ ] Rate limiting configured
- [ ] CORS settings verified
- [ ] First test customer onboarded

**Time to $100K MRR: 90 days**

**Let's ship! 🚀**
