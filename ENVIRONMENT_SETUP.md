# 🔧 Production Environment Setup

**Required for:** AURA Systems - SEO Autopilot (Shopify App)  
**Deployment:** Render (https://aura-core-monolith.onrender.com)

---

## 🚨 Critical Environment Variables

### 1. Shopify App Configuration

These come from your Shopify Partner Dashboard app settings:

```bash
# From shopify.app.toml (already configured)
SHOPIFY_CLIENT_ID=98db68ecd4abcd07721d14949514de8a
SHOPIFY_CLIENT_SECRET=<from Shopify Partner Dashboard>

# App URL (already configured in Render)
SHOPIFY_APP_URL=https://aura-core-monolith.onrender.com
APP_URL=https://aura-core-monolith.onrender.com
HOST_URL=https://aura-core-monolith.onrender.com

# API Version (matches shopify.app.toml)
SHOPIFY_API_VERSION=2025-10

# Scopes (matches shopify.app.toml)
SHOPIFY_SCOPES=read_metaobject_definitions,write_metaobject_definitions,read_metaobjects,write_metaobjects,read_products,write_products,read_content,write_content,write_theme_code,read_themes,write_themes
```

### 2. Database Configuration

```bash
# PostgreSQL connection (get from Render Dashboard)
DATABASE_URL=postgresql://user:password@host:5432/database_name
DB_POOL_MAX=20
DB_POOL_MIN=2
```

**Migrations Required:**
```bash
# After DATABASE_URL is set, run these on Render:
psql $DATABASE_URL -f migrations/001_revenue_infrastructure.sql
psql $DATABASE_URL -f migrations/002_shopify_integration.sql
```

### 3. OpenAI API Key

```bash
# Required for AI features (Product SEO, Content Generation, etc.)
OPENAI_API_KEY=sk-proj-xxx
```

Get from: https://platform.openai.com/api-keys

### 4. Session Management

```bash
# Auto-generated strong session secret (already set)
SESSION_SECRET=de711f2a0a2b81610a24e63ceeefc6bd9fc3677296a34cc466679c94da17cabd

# For Render persistent disk
SESSION_DB_PATH=/opt/render/project/data/aura-core-session.sqlite
RENDER_DISK_PATH=/opt/render/project/data
DISABLE_SQLITE=false
```

### 5. Feature Flags

```bash
# Plan gating (currently disabled for testing)
DISABLE_PLAN_CHECKS=true

# Feature flags
FEATURE_MARKETPLACE_ENABLED=true
FEATURE_FINTECH_ENABLED=true
FEATURE_DATA_PRODUCTS_ENABLED=true
FEATURE_VERTICALS_ENABLED=true
FEATURE_WHITE_LABEL_ENABLED=true
FEATURE_ENTERPRISE_ENABLED=true
```

### 6. OAuth Security (already configured)

```bash
# OAuth encryption keys (already generated)
OAUTH_ENCRYPTION_KEY=6ce41c3ac7d93621c632fc5e302150a32a88ea3ef3354dfe3105711c9440c5ad
OAUTH_SIGNATURE_SECRET=h1yt3zeGqE7521Vc6A4I3H7Q8KhC6R3cKJwRgLi1zJcRGb/ZyB7AqRV3xN8OoL040gw+YI2haxbUJWd25nx9qA==
```

---

## ✅ Render Dashboard Setup Checklist

### Step 1: Verify Environment Variables

In Render Dashboard → Your Service → Environment:

- [ ] `SHOPIFY_CLIENT_ID` = `98db68ecd4abcd07721d14949514de8a`
- [ ] `SHOPIFY_CLIENT_SECRET` = (from Shopify Partner Dashboard)
- [ ] `SHOPIFY_APP_URL` = `https://aura-core-monolith.onrender.com`
- [ ] `APP_URL` = `https://aura-core-monolith.onrender.com`
- [ ] `SHOPIFY_API_VERSION` = `2025-10`
- [ ] `DATABASE_URL` = (PostgreSQL connection string)
- [ ] `OPENAI_API_KEY` = (from OpenAI dashboard)
- [ ] `SESSION_SECRET` = `de711f2a0a2b81610a24e63ceeefc6bd9fc3677296a34cc466679c94da17cabd`
- [ ] `DISABLE_PLAN_CHECKS` = `true` (for testing)
- [ ] `NODE_ENV` = `production`

### Step 2: Add PostgreSQL Database

**Option A: Use Render PostgreSQL (Recommended)**

1. Go to Render Dashboard → New → PostgreSQL
2. Create database (starts at $7/month)
3. Copy connection string → Set as `DATABASE_URL` env var
4. Wait for provision (2-3 minutes)
5. Connect to database shell in Render
6. Run migrations:

```bash
# In Render PostgreSQL shell
\i migrations/001_revenue_infrastructure.sql
\i migrations/002_shopify_integration.sql

# Verify tables created (should show 23+ tables)
\dt
```

**Option B: Use External PostgreSQL (Railway, Neon, etc.)**

1. Create database on external provider
2. Copy connection string
3. Set as `DATABASE_URL` in Render env vars
4. Run migrations locally:

```bash
psql postgresql://user:password@host:5432/db -f migrations/001_revenue_infrastructure.sql
psql postgresql://user:password@host:5432/db -f migrations/002_shopify_integration.sql
```

### Step 3: Configure Persistent Disk (for sessions)

In Render Dashboard → Your Service → Disks:

1. Click "Add Disk"
2. Name: `aura-data`
3. Mount Path: `/opt/render/project/data`
4. Size: 1 GB (minimum, $0.25/GB/month)
5. Click "Save"
6. Redeploy service

This ensures session data persists across deployments.

### Step 4: Verify Deployment

After environment variables are set:

1. Go to Render Dashboard → Your Service → Events
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Wait 2-3 minutes for build
4. Check logs for errors
5. Visit app URL: https://aura-core-monolith.onrender.com/health
6. Should see: `{"status":"ok","uptime":123,"timestamp":1708123456}`

---

## 🧪 Testing Environment Setup

### Test 1: Health Check

```bash
curl https://aura-core-monolith.onrender.com/health
# Expected: {"status":"ok","uptime":123,"timestamp":1708123456}
```

### Test 2: Shopify OAuth

1. Go to your dev store admin: `https://yourstore.myshopify.com/admin`
2. Navigate to Apps → Develop apps
3. Click your app or reinstall
4. Should redirect to OAuth approval screen
5. Approve → Should redirect back to app successfully
6. Check Render logs for `[Shopify OAuth] Callback received` messages

### Test 3: Database Connection

```bash
# In Render shell or local with DATABASE_URL set
psql $DATABASE_URL -c "\dt"
# Should show 23+ tables from migrations
```

### Test 4: OpenAI Integration

```bash
# Test from dev store app
# Go to Product SEO tool
# Click "Optimize Product"
# Should generate AI suggestions (not error)
```

### Test 5: Billing Flow

1. In dev store app, go to Billing page
2. Click "Upgrade to Professional"
3. Should redirect to Shopify billing approval
4. Should show test mode banner
5. Approve → Should redirect back with plan upgraded

---

## 🔒 Security Checklist

- [ ] `SHOPIFY_CLIENT_SECRET` is set (never commit to git)
- [ ] `OPENAI_API_KEY` is set (never commit to git)
- [ ] `SESSION_SECRET` is random 32+ characters
- [ ] `OAUTH_ENCRYPTION_KEY` is random 32+ bytes hex
- [ ] `OAUTH_SIGNATURE_SECRET` is random 64+ bytes base64
- [ ] Database uses SSL (Render PostgreSQL has this by default)
- [ ] All HTTP traffic redirected to HTTPS (Render handles this)
- [ ] CORS configured for Shopify origins only (already in server.js)
- [ ] Session cookies use `secure: true` and `sameSite: 'none'` (already configured)

---

## 📊 Monitoring Setup (Post-Launch)

### Render Built-in Monitoring

1. Go to Render Dashboard → Your Service
2. Monitor:
   - **CPU usage** (should be < 50% average)
   - **Memory usage** (should be < 512MB average)
   - **Response time** (should be < 500ms p95)
   - **Error rate** (should be < 1%)

### Shopify Partner Dashboard Monitoring

1. Go to Shopify Partner Dashboard → Your App
2. Monitor:
   - **Install count** (daily growth)
   - **Uninstall rate** (should be < 5%/month)
   - **Active users** (DAU/MAU ratio)
   - **Support tickets** (response time)

### Database Monitoring

1. If using Render PostgreSQL:
   - Dashboard → PostgreSQL → Metrics
   - Monitor connection count, query performance
2. If using external provider:
   - Use provider's monitoring dashboard

### Error Tracking (Optional but Recommended)

**Option A: Sentry**

```bash
npm install @sentry/node
```

Add to server.js:

```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

**Option B: LogTail**

```bash
npm install @logtail/node
```

---

## 🚀 Pre-Launch Verification

Run through this checklist before submitting to Shopify App Store:

### Environment

- [ ] All required env vars set in Render
- [ ] Database migrations run successfully
- [ ] Health check endpoint returns 200 OK
- [ ] No secrets committed to git
- [ ] PostgreSQL database has backups enabled

### OAuth Flow

- [ ] Can install app on dev store
- [ ] OAuth redirects work correctly
- [ ] Session persists across page refreshes
- [ ] Can switch between multiple stores
- [ ] Uninstall/reinstall works

### Billing Flow

- [ ] Free plan works by default
- [ ] Can upgrade to Professional ($99)
- [ ] Can upgrade to Enterprise ($299)
- [ ] Billing approval redirects work
- [ ] Test mode shows warning banner
- [ ] Can cancel subscription

### Tool Functionality

- [ ] At least 10 tools tested and working
- [ ] No 500 errors in logs
- [ ] Loading states show correctly
- [ ] Error messages are user-friendly
- [ ] Mobile responsive (test on phone)

### Performance

- [ ] App loads in < 3 seconds
- [ ] API responses < 500ms average
- [ ] No memory leaks (check Render metrics)
- [ ] Database queries optimized

### Documentation

- [ ] Privacy policy URL set
- [ ] Terms of service URL set
- [ ] Support email configured
- [ ] Help docs accessible

---

## 🎯 Next Steps

1. **Copy this checklist** to Render deployment notes
2. **Verify all env vars** are set correctly
3. **Run database migrations** on production database
4. **Test on dev stores** (you have 2 already installed)
5. **Monitor for 24 hours** before App Store submission
6. **Document any issues** and fix before launch

---

## 📞 Troubleshooting

### Issue: "Shop not connected" error

**Solution:**
1. Check `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` are set
2. Verify `SHOPIFY_APP_URL` matches your Render URL
3. Check OAuth redirect URLs in Shopify Partner Dashboard
4. Reinstall app on dev store

### Issue: "Database connection failed"

**Solution:**
1. Check `DATABASE_URL` is set correctly
2. Verify PostgreSQL is running (Render dashboard)
3. Test connection: `psql $DATABASE_URL -c "SELECT 1;"`
4. Check firewall rules (if using external database)
5. Verify SSL mode is correct

### Issue: "OpenAI API error"

**Solution:**
1. Check `OPENAI_API_KEY` is set
2. Verify key is active at https://platform.openai.com
3. Check OpenAI account has credits
4. Test key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Issue: "Billing flow not working"

**Solution:**
1. Verify app is in test mode in Shopify Partner Dashboard
2. Check billing endpoints are accessible
3. Verify `APP_URL` is set for return URL
4. Check Render logs for billing errors
5. Ensure store is on a paid Shopify plan (dev stores work)

---

**Environment setup complete? Proceed to testing phase in LAUNCH_NOW.md**

