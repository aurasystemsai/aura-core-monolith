# Deploy Shopify OAuth to Render

Your production URL: **https://aura-core-monolith.onrender.com**

## Step 1: Add Environment Variables to Render (5 minutes)

Go to your Render dashboard → **aura-core-monolith** service → **Environment** tab

Add these variables (if not already present):

```env
# Shopify OAuth - REQUIRED
SHOPIFY_API_KEY=                  # Get from Shopify Partner Dashboard (Client ID)
SHOPIFY_API_SECRET=               # Get from Shopify Partner Dashboard (Client secret)
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory
SHOPIFY_API_VERSION=2024-01
APP_URL=https://aura-core-monolith.onrender.com

# Session - REQUIRED
SESSION_SECRET=de711f2a0a2b81610a24e63ceeefc6bd9fc3677296a34cc466679c94da17cabd

# Session storage (optional)
SESSION_DB_PATH=./data/aura-core-session.sqlite
DISABLE_SQLITE=false

# OpenAI - REQUIRED (you may already have this)
OPENAI_API_KEY=                   # Your existing OpenAI key
```

**Variables you probably already have on Render:**
- ✅ DATABASE_URL (PostgreSQL connection)
- ✅ STRIPE_SECRET_KEY
- ✅ OPENAI_API_KEY (maybe?)

Click **Save Changes** → Render will auto-redeploy

---

## Step 2: Update Shopify Partner App (10 minutes)

### If you don't have a Shopify Partner App yet:

1. Go to https://partners.shopify.com/
2. Sign up / Log in
3. **Apps** → **Create app** → **Create app manually**
4. Fill in:
   - **App name**: `Aura Platform`
   - **App URL**: `https://aura-core-monolith.onrender.com`
   - **Allowed redirection URL(s)**: `https://aura-core-monolith.onrender.com/shopify/callback`

5. **Configuration** → **App setup**:
   - Select scopes: `read_products`, `write_products`, `read_orders`, `write_orders`, `read_customers`, `write_customers`, `read_inventory`, `write_inventory`

6. **Overview**:
   - Copy **Client ID** → Add to Render as `SHOPIFY_API_KEY`
   - Copy **Client secret** → Add to Render as `SHOPIFY_API_SECRET`

7. **Test store** (optional for testing):
   - **Stores** → **Add store** → Create development store

### If you already have a Shopify Partner App:

1. Go to https://partners.shopify.com/
2. Find your existing app
3. **App setup** → **URLs**:
   - Update **App URL**: `https://aura-core-monolith.onrender.com`
   - Update **Allowed redirection URL(s)**: `https://aura-core-monolith.onrender.com/shopify/callback`
4. Copy credentials to Render (if not already there)

---

## Step 3: Run Database Migration on Render (2 minutes)

You need to create 4 new tables in your Render PostgreSQL database.

### Option A: Using Render Shell (Easiest)

1. Render Dashboard → Your service → **Shell** tab
2. Run:
```bash
psql $DATABASE_URL -f migrations/002_shopify_integration.sql
```

### Option B: Connect from Local PostgreSQL Client

1. Get your DATABASE_URL from Render environment variables
2. Copy it (looks like: `postgresql://user:pass@hostname/dbname`)
3. Run locally:
```bash
psql "YOUR_DATABASE_URL_FROM_RENDER" -f migrations/002_shopify_integration.sql
```

### Option C: Using pgAdmin or TablePlus

1. Connect to your Render PostgreSQL using DATABASE_URL credentials
2. Open SQL editor
3. Copy contents of `migrations/002_shopify_integration.sql`
4. Execute

### Verify Migration Worked:

```sql
-- Should show 4 tables
SELECT tablename FROM pg_tables WHERE tablename LIKE 'shopify%';

-- Expected output:
-- shopify_stores
-- shopify_sync_logs
-- shopify_webhooks
-- shops
```

---

## Step 4: Test OAuth Flow (5 minutes)

1. Open: https://aura-core-monolith.onrender.com
2. Click **Settings** in navigation
3. Go to **Shopify Integration** tab
4. Enter your shop domain: `your-store.myshopify.com`
5. Click **Connect to Shopify**
6. Should redirect to Shopify → Click **Install app**
7. Redirected back → Should show ✅ **Connected** with shop details

---

## Troubleshooting

### Error: "Invalid redirect_uri"

**Fix**: Check Shopify Partner App settings
- App URL must be: `https://aura-core-monolith.onrender.com` (no trailing slash)
- Redirect URL must be: `https://aura-core-monolith.onrender.com/shopify/callback`
- APP_URL in Render environment must match exactly

### Error: "Missing SHOPIFY_API_KEY"

**Fix**: 
1. Check Render environment variables → `SHOPIFY_API_KEY` exists
2. After adding, click **Save Changes** to trigger redeploy
3. Wait for deployment to complete (~2 minutes)
4. Check deploy logs for errors

### Error: "relation 'shopify_stores' does not exist"

**Fix**: Migration not run yet
1. Use Render Shell or local psql to run migration
2. Verify with: `psql $DATABASE_URL -c "\dt shopify*"`

### Error: HMAC verification failed

**Fix**: 
1. Check `SHOPIFY_API_SECRET` in Render matches Partner Dashboard exactly
2. No extra spaces, quotes, or characters
3. Copy directly from Shopify Partner Dashboard

### OAuth works but shows "Unknown error"

**Fix**: Check Render logs
1. Render Dashboard → **Logs** tab
2. Look for errors during `/shopify/callback` request
3. Common issues: database connection, missing columns, encryption errors

---

## Verification Checklist

After deployment, verify:

- [ ] Render environment has all required variables (SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SESSION_SECRET, APP_URL)
- [ ] Shopify Partner App URLs point to `https://aura-core-monolith.onrender.com`
- [ ] Database migration created 4 tables (shopify_stores, shops, shopify_sync_logs, shopify_webhooks)
- [ ] Render deployment completed successfully (check Logs tab)
- [ ] OAuth flow works: Settings → Connect Shopify → Redirects to Shopify → Redirects back → Shows connected status
- [ ] Database has shop record: `SELECT * FROM shopify_stores;`
- [ ] Billing page loads (even if showing Free plan)
- [ ] Onboarding wizard appears for new users

---

## Production Best Practices

Once working:

1. **Webhooks**: Register in Shopify Partner Dashboard
   - App URL: `https://aura-core-monolith.onrender.com/shopify/webhooks/app/uninstalled`
   - Topic: `app/uninstalled`

2. **Monitoring**: Set up log alerts in Render for OAuth failures

3. **Backup**: Enable automated backups on your Render PostgreSQL database

4. **Security**: 
   - Don't commit .env files to git
   - Rotate SESSION_SECRET periodically
   - Use Stripe live keys (not test keys) for real payments

5. **Performance**: Enable Render's CDN/caching if needed

---

## Quick Reference

**Your URLs:**
- Production: https://aura-core-monolith.onrender.com
- OAuth callback: https://aura-core-monolith.onrender.com/shopify/callback
- Settings page: https://aura-core-monolith.onrender.com (click Settings)

**Shopify Partner Dashboard:** https://partners.shopify.com/

**Render Dashboard:** https://dashboard.render.com/

**Need help?** Check Render logs for detailed error messages.
