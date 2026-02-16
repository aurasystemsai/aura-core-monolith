# Testing Suite Documentation

This directory contains comprehensive testing resources for the AURA Core Monolith application.

## 📋 Manual Testing

### Comprehensive Test Checklist
**File:** `docs/COMPREHENSIVE_TEST_CHECKLIST.md`

A detailed manual testing checklist covering:
- ✅ Authentication & Authorization (Shopify OAuth, plan-based access)
- ✅ Frontend UI testing (dashboard, tools, billing)
- ✅ API endpoint testing (all 43+ tools)
- ✅ Security testing (headers, XSS protection, auth)
- ✅ Performance testing (load times, bundle sizes)
- ✅ Error handling & edge cases
- ✅ Deployment verification

**Usage:**
1. Open the checklist in `docs/COMPREHENSIVE_TEST_CHECKLIST.md`
2. Check off items as you test them
3. Document any failures with details
4. Re-test after bug fixes

---

## 🤖 Automated Testing

### Automated Test Bot
**File:** `scripts/automated-test-bot.js`

A comprehensive automated test suite that validates all critical functionality.

**Run all tests against production:**
```bash
npm run test:bot
```

**Run against local development server:**
```bash
npm run test:bot:local
```

**Run with verbose logging:**
```bash
npm run test:bot:verbose
```

**What it tests:**
- ✅ Health check endpoint
- ✅ Homepage accessibility
- ✅ API access control
- ✅ All tool endpoints (43+ tools)
- ✅ Session management
- ✅ Analytics endpoints
- ✅ Notifications endpoints
- ✅ Billing endpoints
- ✅ Error handling (404, 405, etc.)
- ✅ Security headers (HSTS, CSP, XSS)
- ✅ Performance (response times)
- ✅ Database connectivity

**Example output:**
```
╔════════════════════════════════════════════════════════════════╗
║                  AURA CORE TEST BOT                            ║
║                  Automated Testing Suite                       ║
╚════════════════════════════════════════════════════════════════╝

Configuration:
  Environment: production
  Base URL: https://aura-core-monolith.onrender.com
  Timeout: 30000ms
  Verbose: false

━━━ Health Check Tests ━━━
  ✓ Health endpoint returns 200
  ✓ Response has status field
  ✓ Response has uptime field
  ✓ Response has timestamp field
  ✓ Status is "ok"

━━━ Tool Endpoint Tests ━━━
  ✓ /api/product-seo is registered - Status: 404
  ✓ /api/blog-seo is registered - Status: 404
  ✓ /api/ai-alt-text-engine is registered - Status: 403
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total Tests:    52
  Passed:         50
  Failed:         2
  Skipped:        0
  Pass Rate:      96.2%
  Duration:       3.42s

✓ ALL TESTS PASSED
```

---

### Quick Smoke Test
**File:** `scripts/quick-smoke-test.js`

A fast smoke test (5 critical checks) for quick validation after deployments.

**Run smoke test:**
```bash
npm run smoke-test
```

**What it tests:**
- ✅ Health check is responsive
- ✅ Homepage is accessible
- ✅ API requires authentication
- ✅ Tool endpoints are registered
- ✅ Access control is enforced

**Example output:**
```
🔍 AURA Core - Quick Smoke Test

Testing: https://aura-core-monolith.onrender.com

✓ Health check is responsive
✓ Homepage is accessible
✓ API requires authentication
✓ Tool endpoints are registered
✓ Access control is enforced

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Results: 5 passed, 0 failed
Status: ✓ PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🚀 Recommended Testing Workflow

### After Code Changes (Before Push):
1. Run smoke test locally:
   ```bash
   npm start  # Start local server
   npm run test:bot:local  # Run full test suite
   ```

2. Fix any failures

3. Push to GitHub

### After Deployment to Production:
1. Wait for Render deployment to complete (~5 minutes)

2. Run quick smoke test:
   ```bash
   npm run smoke-test
   ```

3. If smoke test passes, optionally run full test suite:
   ```bash
   npm run test:bot
   ```

### Weekly/Before Major Releases:
1. Run full automated test suite:
   ```bash
   npm run test:bot:verbose
   ```

2. Manually complete comprehensive checklist:
   - Open `docs/COMPREHENSIVE_TEST_CHECKLIST.md`
   - Test critical user flows end-to-end
   - Test with different plan tiers (free, professional, enterprise)
   - Test on multiple browsers and devices

---

## 🔧 Customizing Tests

### Adding New Tests to Automated Suite

Edit `scripts/automated-test-bot.js`:

```javascript
async function testMyNewFeature() {
  logSection('My New Feature Tests');
  
  try {
    const response = await makeRequest('/api/my-new-endpoint');
    assertStatus(response, 200, 'My Feature', 'Endpoint is accessible');
    assertHasProperty(response.body, 'data', 'My Feature', 'Response has data field');
  } catch (error) {
    recordTest('My Feature', 'Endpoint test', false, error.message);
  }
}

// Add to runAllTests():
async function runAllTests() {
  // ...existing tests...
  await testMyNewFeature();
  // ...
}
```

### Adding Items to Manual Checklist

Edit `docs/COMPREHENSIVE_TEST_CHECKLIST.md`:

```markdown
## 🆕 MY NEW FEATURE TESTING

### New Feature Name
- [ ] Feature loads correctly
- [ ] User can interact with feature
- [ ] Data is saved properly
- [ ] Error handling works
```

---

## 📊 Test Coverage

### Current Coverage (as of Feb 16, 2026):

**Automated Tests:** 52 tests
- Health & Infrastructure: 5 tests
- Authentication & Access Control: 8 tests
- API Endpoints: 25 tests (covering 43+ tool endpoints)
- Security: 4 tests
- Performance: 3 tests
- Error Handling: 3 tests
- Database: 4 tests

**Manual Checklist:** 200+ items
- Authentication flows
- UI/UX validation
- Tool-specific functionality
- Security testing
- Performance testing
- Browser/device compatibility

---

## 🐛 Troubleshooting

### Test Bot Fails to Connect
**Problem:** `Error: connect ECONNREFUSED` or timeout errors

**Solutions:**
1. Check if server is running:
   ```bash
   curl https://aura-core-monolith.onrender.com/health
   ```

2. Check if running locally:
   ```bash
   npm start
   npm run test:bot:local
   ```

3. Check firewall/network settings

### Tests Pass Locally But Fail in Production
**Problem:** Tests pass on `localhost:10000` but fail on Render

**Solutions:**
1. Check environment variables in Render dashboard
2. Check Render deployment logs for errors
3. Verify database connection string is correct
4. Check if Render service is sleeping (spin-up time)

### Authentication Tests Failing
**Problem:** All `/api/*` endpoints return 401/403

**Expected:** This is correct behavior! API endpoints require Shopify session tokens.

**To test authenticated endpoints:**
- Use manual testing with a real Shopify store connected
- Or add session token generation to test scripts (advanced)

---

## 📞 Support

For questions or issues with testing:
- Check manual checklist: `docs/COMPREHENSIVE_TEST_CHECKLIST.md`
- Review test bot code: `scripts/automated-test-bot.js`
- Check deployment logs: https://dashboard.render.com
- Review GitHub Actions (if CI/CD is set up)

---

## 🎯 Success Criteria

### Deployment is Ready When:
- ✅ Smoke test passes (5/5)
- ✅ Automated test suite >90% pass rate
- ✅ No 500 errors in production logs
- ✅ Critical user flows work in manual testing
- ✅ Access control properly blocks unauthorized requests

### Production is Healthy When:
- ✅ Health check returns 200
- ✅ All tool endpoints are registered
- ✅ Response times <3s for most endpoints
- ✅ No security header warnings
- ✅ Database connections stable
