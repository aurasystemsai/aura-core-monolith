# 🧪 Testing Guide - Dev Store Tool Verification

**Date:** February 17, 2026  
**Purpose:** Systematic testing of all 23 production tools  
**Environment:** Your 2 dev stores with app installed  
**Estimated Time:** 6-8 hours total

---

## 🎯 **Testing Strategy**

### Priority Levels
- **P0 (Critical)** - Must work perfectly before launch (5 tools)
- **P1 (High)** - Should work, minor bugs acceptable (8 tools)
- **P2 (Medium)** - Nice to have, can fix post-launch (10 tools)

### Testing Approach
1. Test on **both dev stores** (edge case coverage)
2. **Document bugs** immediately in testing log
3. **Take screenshots** of working features (for App Store listing)
4. **Check browser console** for errors after each test
5. **Test on mobile** after desktop testing complete

---

## 🚨 **PRE-TESTING CHECKLIST**

Before you start testing, verify these are configured:

### Environment Variables Check
```bash
# In Render Dashboard, verify these exist:
- SHOPIFY_CLIENT_ID ✓ (from shopify.app.toml: 98db68ecd4abcd07721d14949514de8a)
- SHOPIFY_CLIENT_SECRET (from Shopify Partner Dashboard)
- SHOPIFY_APP_URL (https://aura-core-monolith.onrender.com)
- DATABASE_URL (PostgreSQL connection string)
- OPENAI_API_KEY (from OpenAI dashboard - REQUIRED for AI tools)
- SESSION_SECRET ✓ (already set)
```

### Quick Health Checks
1. **Server Health**: Visit https://aura-core-monolith.onrender.com/health
   - Expected: `{"status":"ok","uptime":123,"timestamp":1708123456}`
   - If fails: Check Render logs

2. **Database Connection**: 
   ```bash
   # On Render shell or local with DATABASE_URL
   psql $DATABASE_URL -c "SELECT 1;"
   # Expected: Returns "1"
   ```

3. **App Access**: Open one dev store → Apps → AURA Systems
   - Expected: App loads without 500 errors
   - If fails: Check OAuth configuration

---

## ✅ **P0 - CRITICAL TESTS (Must Pass)**

These 5 tools must work perfectly before App Store submission.

### 1. **OAuth & Authentication Flow** ⭐⭐⭐

**Why Critical:** Without OAuth, merchants can't install your app.

**Test Steps:**
1. Go to Shopify Partner Dashboard → Apps → AURA Systems
2. Click "Test on development store"
3. Select one of your dev stores
4. Should redirect to OAuth approval screen
5. Click "Install app"
6. Should redirect back to app successfully
7. Session should persist (refresh page → still logged in)

**Expected Result:**
- ✅ OAuth approval screen shows correct app name
- ✅ Scopes listed match shopify.app.toml
- ✅ After approval, redirects to app dashboard
- ✅ Session persists across page refreshes
- ✅ No errors in browser console

**Common Issues:**
- 403 error → Check `SHOPIFY_CLIENT_SECRET` is set
- Redirect loop → Verify `SHOPIFY_APP_URL` matches Render URL
- Session lost → Check `SESSION_SECRET` is set

**Screenshot:** ✓ Take screenshot of successful app install

---

### 2. **Billing Flow (Free → Professional → Cancel)** ⭐⭐⭐

**Why Critical:** This is how you make money.

**Test Steps:**
1. Open dev store app → Click "Billing" or "Settings" → "Billing" tab
2. Current plan should show "Free ($0/month)"
3. Click "Upgrade to Professional"
4. Should redirect to Shopify billing approval page
5. Should show "Test mode" banner (dev stores only)
6. Amount should show $99.00 USD
7. Click "Approve"
8. Should redirect back to app
9. Plan should now show "Professional ($99/month)"
10. Click "Cancel Subscription"
11. Confirm cancellation
12. Plan should revert to "Free"

**Expected Result:**
- ✅ Free plan shows by default
- ✅ Upgrade redirects to Shopify billing
- ✅ Test mode banner visible (dev stores)
- ✅ Correct pricing shown ($99 for Pro, $299 for Enterprise)
- ✅ Approval redirects back to app
- ✅ Plan updates in UI immediately
- ✅ Cancel subscription works
- ✅ Downgrade to Free works

**Common Issues:**
- No redirect → Check `APP_URL` is set for return URL
- Wrong price → Verify `shopifyBillingService.js` prices
- Can't cancel → Check GraphQL mutation in billing service
- 500 error → Check Render logs for API errors

**Screenshot:** ✓ Take 3 screenshots (Free plan, Upgrade screen, Pro plan active)

---

### 3. **Product SEO Engine** ⭐⭐⭐

**Why Critical:** Core feature, likely highest usage.

**Test Steps:**
1. In dev store, create 3-5 test products with basic titles/descriptions
2. Open AURA app → Navigate to "Product SEO Engine" tool
3. Should load list of products from your store
4. Click on one product to optimize
5. Should show current SEO score and recommendations
6. Click "Generate AI Suggestions" or "Optimize"
7. Should generate improved title, description, meta description
8. Click "Apply to Shopify"
9. Verify changes saved to product in Shopify admin

**Expected Result:**
- ✅ Products load from Shopify store
- ✅ SEO analysis shows scores and issues
- ✅ AI generates improved copy
- ✅ Changes save back to Shopify
- ✅ Loading states show during API calls
- ✅ No 500 errors in console

**Common Issues:**
- No products load → Check OAuth scopes include `read_products`
- AI fails → Verify `OPENAI_API_KEY` is set
- Can't save → Check `write_products` scope enabled
- Slow generation → OpenAI can take 5-10 seconds (expected)

**Screenshot:** ✓ Take screenshot of SEO analysis and AI suggestions

---

### 4. **AI Alt-Text Engine** ⭐⭐

**Why Critical:** Simple, high-value feature.

**Test Steps:**
1. In dev store, add products with images that have no alt text
2. Open AURA app → Navigate to "AI Alt-Text Engine"
3. Should show products with missing alt text
4. Select 3-5 products
5. Click "Generate Alt Text"
6. Should generate descriptive alt text for each image
7. Review generated text (should be descriptive, not generic)
8. Click "Apply to Products"
9. Verify alt text saved in Shopify product images

**Expected Result:**
- ✅ Detects products missing alt text
- ✅ AI generates descriptive, relevant alt text
- ✅ Bulk processing works (multiple products at once)
- ✅ Changes save to Shopify
- ✅ Progress indicator shows during generation

**Common Issues:**
- No images detected → Check product images exist in store
- Generic alt text → OpenAI prompt may need tuning (acceptable for now)
- Can't save → Check `write_products` scope

**Screenshot:** ✓ Take screenshot of generated alt text

---

### 5. **Dashboard & Analytics** ⭐⭐

**Why Critical:** First thing merchants see after install.

**Test Steps:**
1. Open AURA app (should land on Dashboard)
2. Should show overview metrics:
   - Products analyzed
   - AI runs used
   - Current plan
   - Recent activity
3. Panels should load without errors
4. Click through different sections (Analytics, Tools, Settings)
5. Navigation should work smoothly
6. No 404 or 500 errors

**Expected Result:**
- ✅ Dashboard loads in < 3 seconds
- ✅ Metrics display correctly (even if zeros for new store)
- ✅ Navigation works between pages
- ✅ Mobile responsive (test on phone if possible)
- ✅ Clean, professional UI

**Common Issues:**
- Slow loading → Check database queries in Render logs
- Broken panels → Check React errors in browser console
- Navigation fails → Verify React Router configuration

**Screenshot:** ✓ Take screenshot of clean dashboard

---

## ⚡ **P1 - HIGH PRIORITY TESTS (Should Work)**

These 8 tools should work well, but minor bugs are acceptable.

### 6. **Abandoned Checkout Winback**

**Test Steps:**
1. Navigate to tool in app
2. Should show abandoned checkouts from store
3. Create recovery campaign
4. Test email preview
5. Verify campaign can be activated

**Expected Result:**
- ✅ Lists abandoned checkouts
- ✅ Email templates render correctly
- ✅ Campaign activation works
- ⚠️ Actual email sending can be verified post-launch

**Time:** 15 minutes

---

### 7. **Klaviyo Flow Automation**

**Test Steps:**
1. Open tool in app
2. Should show Klaviyo integration option
3. Test connection flow (may require Klaviyo account)
4. Verify UI shows available flows
5. Test creating a basic flow

**Expected Result:**
- ✅ Integration UI loads
- ✅ Connection flow works (if Klaviyo account available)
- ⚠️ Full flow creation can wait for real merchant

**Time:** 20 minutes

---

### 8. **Email Automation Builder**

**Test Steps:**
1. Navigate to tool
2. Create new email campaign
3. Use drag-drop editor (if available)
4. Add text, images, buttons
5. Preview email
6. Save as draft

**Expected Result:**
- ✅ Campaign builder loads
- ✅ Editor works (drag-drop or form-based)
- ✅ Preview renders correctly
- ✅ Saving works

**Time:** 20 minutes

---

### 9. **Dynamic Pricing Engine**

**Test Steps:**
1. Open tool
2. Load products from store
3. Should show pricing recommendations
4. Test bulk pricing rules
5. Verify preview of changes

**Expected Result:**
- ✅ Products load
- ✅ Pricing logic calculates correctly
- ✅ Preview shows before/after prices
- ⚠️ Actual price updates can be tested carefully

**Time:** 15 minutes

---

### 10. **Customer Data Platform**

**Test Steps:**
1. Navigate to CDP tool
2. Should show customer segments
3. View customer profiles (if any exist)
4. Test creating a segment
5. Verify data displays correctly

**Expected Result:**
- ✅ CDP interface loads
- ✅ Segments can be created
- ✅ Customer data displays (if any)
- ⚠️ Full functionality shows with more customer data

**Time:** 15 minutes

---

### 11. **A/B Testing Suite**

**Test Steps:**
1. Open A/B testing tool
2. Create new experiment
3. Define variants (A/B)
4. Set success metric
5. Save experiment

**Expected Result:**
- ✅ Experiment builder loads
- ✅ Can define variants
- ✅ Experiment saves
- ⚠️ Actual testing requires traffic

**Time:** 15 minutes

---

### 12. **Review & UGC Engine**

**Test Steps:**
1. Navigate to Reviews tool
2. Should allow importing reviews
3. Test moderation features
4. Verify display settings

**Expected Result:**
- ✅ Review management UI loads
- ✅ Import/export works
- ✅ Moderation controls function
- ⚠️ Full review collection needs real store

**Time:** 15 minutes

---

### 13. **Personalization & Recommendations**

**Test Steps:**
1. Open personalization tool
2. View recommendation settings
3. Test product recommendation logic
4. Configure personalization rules

**Expected Result:**
- ✅ Settings load correctly
- ✅ Recommendation preview works
- ✅ Rules can be configured
- ⚠️ Actual recommendations need store traffic

**Time:** 15 minutes

---

## 📋 **P2 - MEDIUM PRIORITY TESTS (Can Wait)**

These 10 tools are nice to have. Test if time permits, or after launch.

### Remaining Tools (Quick Smoke Tests)
14. ✓ AI Support Assistant (15 min)
15. ✓ Customer Support AI (15 min)
16. ✓ Loyalty Program V2 (15 min)
17. ✓ Brand Mention Tracker (15 min)
18. ✓ Social Media Analytics (15 min)
19. ✓ Content Scoring & Optimization (15 min)
20. ✓ AI Content Brief Generator (15 min)
21. ✓ Blog SEO Engine (15 min)
22. ✓ Weekly Blog Content Engine (15 min)
23. ✓ Blog Draft Engine (15 min)

**For each tool:**
1. Navigate to tool in app
2. Verify UI loads without errors
3. Test one primary feature
4. Check for console errors
5. Move to next tool

**Total Time:** 2-3 hours

---

## 🐛 **BUG TRACKING TEMPLATE**

Use this format to document any issues:

```markdown
### Bug #1: [Short Description]
- **Tool:** Product SEO Engine
- **Severity:** High/Medium/Low
- **Steps to Reproduce:**
  1. Open Product SEO
  2. Click "Optimize Product"
  3. Error appears
- **Expected:** Should generate AI suggestions
- **Actual:** 500 error in console
- **Error Message:** "OpenAI API key not found"
- **Fix:** Add OPENAI_API_KEY to Render env vars
- **Status:** Fixed / Pending / Won't Fix
```

Create a file: `TESTING_BUGS.md` to track all issues.

---

## ✅ **TESTING CHECKLIST**

### Pre-Testing Setup
- [ ] Render environment variables verified
- [ ] Database migrations run
- [ ] Health check endpoint returns 200 OK
- [ ] App accessible on both dev stores

### P0 - Critical (5 tools)
- [ ] OAuth & Authentication Flow
- [ ] Billing Flow (Free → Pro → Cancel)
- [ ] Product SEO Engine
- [ ] AI Alt-Text Engine
- [ ] Dashboard & Analytics

### P1 - High Priority (8 tools)
- [ ] Abandoned Checkout Winback
- [ ] Klaviyo Flow Automation
- [ ] Email Automation Builder
- [ ] Dynamic Pricing Engine
- [ ] Customer Data Platform
- [ ] A/B Testing Suite
- [ ] Review & UGC Engine
- [ ] Personalization & Recommendations

### P2 - Medium Priority (10 tools)
- [ ] AI Support Assistant
- [ ] Customer Support AI
- [ ] Loyalty Program V2
- [ ] Brand Mention Tracker
- [ ] Social Media Analytics
- [ ] Content Scoring & Optimization
- [ ] AI Content Brief Generator
- [ ] Blog SEO Engine
- [ ] Weekly Blog Content Engine
- [ ] Blog Draft Engine

### Post-Testing
- [ ] All P0 tools working perfectly
- [ ] 80%+ P1 tools working
- [ ] Bugs documented in TESTING_BUGS.md
- [ ] Screenshots captured (5+ for App Store)
- [ ] Mobile testing complete
- [ ] Ready for App Store submission

---

## 📸 **SCREENSHOTS TO CAPTURE**

While testing, capture these for your App Store listing:

1. **Dashboard Overview** (P0)
   - Clean, professional homepage
   - Show metrics and navigation

2. **Product SEO Tool** (P0)
   - SEO analysis in action
   - AI suggestions displayed

3. **Billing Page** (P0)
   - Pricing plans clearly shown
   - Professional design

4. **Tool in Action #1** (P1)
   - Email builder or CDP
   - Show rich functionality

5. **Tool in Action #2** (P1)
   - A/B testing or analytics
   - Show data/insights

6. **Mobile View** (Optional)
   - Responsive design on phone
   - App working on mobile

**Save screenshots to:** `screenshots/` folder for App Store submission

---

## 🚀 **AFTER TESTING**

### If All P0 Tests Pass:
✅ **You're ready for App Store submission!**
- Fix any critical bugs found
- Document known issues (non-critical)
- Proceed to marketing asset creation
- Submit to Shopify for review

### If P0 Tests Fail:
⚠️ **Fix before submitting:**
1. Review error logs in Render dashboard
2. Check environment variables are set
3. Verify database migrations ran
4. Test fixes on dev stores
5. Re-run failing tests

### Testing Timeline:
- **P0 Tests:** 2-3 hours (MUST complete)
- **P1 Tests:** 2-3 hours (SHOULD complete)
- **P2 Tests:** 2-3 hours (OPTIONAL, can do after launch)

**Total Minimum:** 2-3 hours to be launch-ready  
**Total Recommended:** 4-6 hours for thorough testing

---

## 📞 **TESTING SUPPORT**

### Common Issues & Solutions

**"Products not loading"**
- Check OAuth scopes include `read_products`
- Verify Shopify token is valid
- Check network tab for 403/401 errors

**"AI features failing"**
- Verify `OPENAI_API_KEY` is set in Render
- Check OpenAI account has credits
- Test key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

**"Billing not working"**
- Verify app is in test mode
- Check `APP_URL` is set for return URL
- Review Shopify Partner Dashboard settings

**"Session keeps logging out"**
- Check `SESSION_SECRET` is set
- Verify cookies enabled in browser
- Check `sameSite: 'none'` is set in session config

### Where to Find Logs
- **Render Logs:** Dashboard → Your Service → Logs
- **Browser Console:** Chrome DevTools → Console tab
- **Network:** Chrome DevTools → Network tab
- **Shopify Errors:** Partner Dashboard → Apps → Error logs

---

## ✨ **YOU'VE GOT THIS!**

**What you're testing:** 23 enterprise tools, 249,605 lines of code  
**Why it matters:** This is what merchants will pay $99-$299/month for  
**What to focus on:** P0 critical tests must pass, rest can be fixed post-launch  

**Next steps:**
1. Start with P0 critical tests (2-3 hours)
2. Document any bugs found
3. Fix critical issues
4. Capture screenshots
5. Move to App Store submission

**Good luck! 🚀**

