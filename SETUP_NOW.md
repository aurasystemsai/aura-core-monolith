# Setup Guide - Completing Your Launch Configuration

## 🎯 Current Status

**✅ Completed**:
- Shopify OAuth authentication code
- Settings page UI
- Billing & subscription UI  
- Onboarding wizard
- Database schema created
- Backend API routes

**⚠️ Needs Configuration**:
- Environment variables (Shopify OAuth credentials)
- Shopify Partner App setup
- Database migration execution
- OpenAI API key (for AI features)

---

## 📋 Step-by-Step Setup (30 minutes)

### Step 1: Add Required Environment Variables to .env

Your `.env` file currently has revenue infrastructure configured but is **missing** the new Shopify OAuth variables.

**Add these lines to your .env file**:

```bash
# =============================================================================
# SHOPIFY OAUTH (NEW - Required for one-click connection)
# =============================================================================

# Get these from Shopify Partner Dashboard after creating your app
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here

# OAuth scopes (what permissions your app requests)
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory

# API version
SHOPIFY_API_VERSION=2024-01

# Your app URL (localhost for dev, production URL for live)
APP_URL=http://localhost:10000

# =============================================================================
# SESSION MANAGEMENT (Required for authentication)
# =============================================================================

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your_256_bit_random_session_secret_here

# =============================================================================
# OPENAI (Required for AI features)
# =============================================================================

OPENAI_API_KEY=sk-your_openai_api_key_here

# =============================================================================
# LEGACY SHOPIFY (Keep these if you have them - used by shopifyApi.js)
# =============================================================================

SHOPIFY_ACCESS_TOKEN=shpat_your_existing_token_if_you_have_one
SHOPIFY_STORE_URL=yourstore.myshopify.com
```

**Quick command to add them** (PowerShell):
```powershell
# Append to .env
@"

# =============================================================================
# SHOPIFY OAUTH (NEW - Required for one-click connection)
# =============================================================================
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory
SHOPIFY_API_VERSION=2024-01
APP_URL=http://localhost:10000

# =============================================================================
# SESSION MANAGEMENT
# =============================================================================
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# =============================================================================
# OPENAI
# =============================================================================
OPENAI_API_KEY=

"@ | Add-Content .env
```

---

### Step 2: Create Shopify Partner App (15 minutes)

**You MUST do this to enable OAuth**:

1. **Go to Shopify Partners**: https://partners.shopify.com/
   - Sign up if you don't have an account (it's free)

2. **Create a New App**:
   - Click "Apps" in left sidebar
   - Click "Create app"
   - Choose "Create app manually"
   - Name: "Aura Platform" (or your preferred name)

3. **Configure App URLs**:
   - **App URL**: `http://localhost:10000`
   - **Allowed redirection URL(s)**: 
     - `http://localhost:10000/shopify/callback`
   - Click "Save"

4. **Set OAuth Scopes**:
   - Go to "Configuration" → "App setup"
   - Under "Admin API access scopes", select:
     - ✅ `read_products`
     - ✅ `write_products`
     - ✅ `read_orders`
     - ✅ `write_orders`
     - ✅ `read_customers`
     - ✅ `write_customers`
     - ✅ `read_inventory`
     - ✅ `write_inventory`
   - Click "Save"

5. **Copy Credentials**:
   - Go to "Overview" tab
   - Copy **Client ID** → this is your `SHOPIFY_API_KEY`
   - Copy **Client secret** → this is your `SHOPIFY_API_SECRET`
   
6. **Update .env file**:
   ```env
   SHOPIFY_API_KEY=your_actual_client_id_here
   SHOPIFY_API_SECRET=your_actual_client_secret_here
   ```

7. **Create Development Store** (for testing):
   - In Partner Dashboard → "Stores" → "Add store"
   - Choose "Development store"
   - Fill in details and create
   - This is where you'll test OAuth

---

### Step 3: Get OpenAI API Key (5 minutes)

If you don't have one already:

1. Go to https://platform.openai.com/api-keys
2. Sign up / Log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to .env:
   ```env
   OPENAI_API_KEY=sk-your_actual_key_here
   ```

---

### Step 4: Run Database Migration (2 minutes)

The new Shopify OAuth tables need to be created:

**PowerShell command**:
```powershell
# Using psql (install PostgreSQL tools if needed)
$env:PGPASSWORD = "password"
psql -U postgres -d aura_cdp -f migrations/002_shopify_integration.sql

# Or if DATABASE_URL is set:
psql $env:DATABASE_URL -f migrations/002_shopify_integration.sql
```

**Verify tables were created**:
```powershell
psql -U postgres -d aura_cdp -c "\dt shopify*"
```

**Expected output**:
```
             List of relations
 Schema |        Name        | Type  |  Owner   
--------+--------------------+-------+----------
 public | shopify_stores     | table | postgres
 public | shopify_sync_logs  | table | postgres
 public | shopify_webhooks   | table | postgres
 public | shops              | table | postgres
```

---

### Step 5: Install Dependencies (if needed)

```powershell
# Backend dependencies
npm install

# Frontend dependencies
cd aura-console
npm install
cd ..
```

---

### Step 6: Start the Application

**Terminal 1 - Backend**:
```powershell
npm run dev
```

**Terminal 2 - Frontend** (if separate):
```powershell
cd aura-console
npm run dev
```

**Expected output**:
```
Server running on http://localhost:10000
✓ Shopify OAuth routes registered
✓ Billing routes registered
```

---

### Step 7: Test OAuth Flow (5 minutes)

1. **Open browser**: http://localhost:10000

2. **Navigate to Settings**:
   - Click "Settings" in top navigation

3. **Connect Shopify**:
   - Go to "Shopify Integration" tab
   - Enter your development store domain: `your-dev-store.myshopify.com`
   - Click "Connect to Shopify"

4. **Authorize**:
   - You'll be redirected to Shopify
   - Click "Install app"
   - You'll be redirected back to your app

5. **Verify Connection**:
   - Settings page should show "Connected" status
   - Shop name and details should appear
   - Green checkmark badge

**If it fails**:
- Check browser console for errors
- Check backend logs (terminal running `npm run dev`)
- Verify SHOPIFY_API_KEY and SHOPIFY_API_SECRET are correct
- Ensure redirect URL matches exactly: `http://localhost:10000/shopify/callback`

---

### Step 8: Test Billing (Optional - requires Stripe)

1. **Navigate to Billing**: Click "Billing" in top navigation

2. **View current plan**: Should show "Free" by default

3. **Change plan**:
   - Click "Change Plan"
   - Select "Pro"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future date, any CVC

4. **Verify subscription**: Should show "Pro" plan active

---

## 🔧 Troubleshooting

### "Invalid redirect_uri" error
**Fix**: Make sure APP_URL in .env matches Shopify Partner Dashboard exactly
```env
APP_URL=http://localhost:10000  # No trailing slash!
```

### Database connection fails
**Fix**: Check PostgreSQL is running
```powershell
# Check if PostgreSQL service is running
Get-Service postgresql*

# Start if stopped
Start-Service postgresql-x64-14  # Adjust version number
```

### OAuth callback fails with HMAC error
**Fix**: Check SHOPIFY_API_SECRET is correct (no quotes, no spaces)

### "Cannot find module 'node-fetch'" or similar
**Fix**: Install dependencies
```powershell
npm install
```

---

## ✅ Verification Checklist

Before considering setup complete:

- [ ] `.env` file has all required variables filled in (not placeholders)
- [ ] Shopify Partner App created with correct URLs
- [ ] Development store created for testing
- [ ] Database migration ran successfully (4 new tables)
- [ ] Server starts without errors
- [ ] Can navigate to http://localhost:10000
- [ ] Settings page loads
- [ ] Billing page loads
- [ ] OAuth connection works (can connect dev store)
- [ ] Settings shows connected shop details

---

## 📚 Next Steps After Setup

Once everything above is working:

1. **Test all features**:
   - Shopify data sync (products, orders, customers)
   - Billing plan changes
   - Onboarding wizard (clear localStorage and refresh)

2. **Prepare for production**:
   - Get production Stripe keys
   - Create production Shopify app
   - Set up production database
   - Configure production APP_URL

3. **Deploy**:
   - See QUICKSTART.md for deployment instructions
   - Update Shopify app URLs to production domain
   - Run migrations on production database

---

## 🆘 Need Help?

**Check these files**:
- [QUICKSTART.md](QUICKSTART.md) - Installation guide
- [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md) - Full launch checklist
- [SHOPIFY_INTEGRATION_COMPLETE.md](SHOPIFY_INTEGRATION_COMPLETE.md) - Technical details

**Common issues**:
- Missing environment variables → Check .env.example for template
- Database errors → Ensure PostgreSQL running and migration ran
- OAuth fails → Verify Shopify Partner app settings match exactly

---

## 🎉 You're Ready!

Once all checklist items are ✅, you have a **fully functional** platform with:
- ✅ One-click Shopify OAuth
- ✅ Settings management
- ✅ Billing & subscriptions
- ✅ Professional onboarding

**Start with Step 1 above and work through each step!**
