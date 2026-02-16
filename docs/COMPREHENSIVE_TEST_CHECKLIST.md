# COMPREHENSIVE TEST CHECKLIST - AURA Core Monolith

**Last Updated:** February 16, 2026  
**Production URL:** https://aura-core-monolith.onrender.com  
**Test Environments:** Production, Local Development

---

## 🚀 PRE-DEPLOYMENT CHECKS

### Build & Compilation
- [ ] `npm install` completes without errors (root)
- [ ] `npm install --prefix aura-console` completes without errors
- [ ] `npm run build:console` completes successfully
- [ ] No TypeScript/ESLint errors in build output
- [ ] Bundle sizes are reasonable (<2MB for main chunks)
- [ ] All environment variables are set in Render dashboard

### Code Quality
- [ ] No syntax errors in any .js files
- [ ] All `require()` statements resolve correctly
- [ ] No duplicate property names in objects
- [ ] All middleware functions are properly registered
- [ ] All tool routers exist and export valid Express routers

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Shopify OAuth Flow
- [ ] Navigate to app installation URL
- [ ] Shopify OAuth redirect works correctly
- [ ] App installation completes successfully
- [ ] Shop token is persisted to database
- [ ] Session is created with shop domain
- [ ] User is redirected to dashboard after install

### Session Management
- [ ] Session persists across page refreshes
- [ ] Session expires after correct timeout (7 days)
- [ ] Multiple shops can be installed simultaneously
- [ ] Shop switching works correctly
- [ ] Logout clears session properly

### Plan-Based Access Control
- [ ] **Free Plan User:**
  - [ ] Can access product-seo tool
  - [ ] Can access blog-seo tool
  - [ ] Cannot access ai-alt-text-engine (returns 403)
  - [ ] Cannot access abandoned-checkout-winback (returns 403)
  - [ ] Cannot access any professional tools
  - [ ] Cannot access any enterprise tools
  - [ ] Sees upgrade prompts on locked tools
  
- [ ] **Professional Plan User:**
  - [ ] Can access all free tools
  - [ ] Can access ai-alt-text-engine
  - [ ] Can access ai-content-brief-generator
  - [ ] Can access abandoned-checkout-winback
  - [ ] Can access all 19 professional tools
  - [ ] Cannot access enterprise-only tools (returns 403)
  - [ ] Sees upgrade prompts on enterprise tools
  
- [ ] **Enterprise Plan User:**
  - [ ] Can access all free tools
  - [ ] Can access all professional tools
  - [ ] Can access ai-support-assistant
  - [ ] Can access advanced-analytics-attribution
  - [ ] Can access all 19 enterprise tools
  - [ ] No upgrade prompts shown

### API Access Check Endpoint
- [ ] `GET /api/access/check` returns current plan
- [ ] `GET /api/access/check?tool=abandoned-checkout-winback` returns correct access status
- [ ] `GET /api/access/check?feature=ai_runs` returns usage limits
- [ ] Returns 200 with JSON payload
- [ ] Response includes: `{ plan, has_access, accessible_tools, limits }`

---

## 🏠 FRONTEND UI TESTING

### Dashboard Page (`/`)
- [ ] Dashboard loads without errors
- [ ] Analytics widgets display correctly
- [ ] Revenue chart renders with data
- [ ] Orders chart renders with data
- [ ] Conversion rate displays
- [ ] Quick actions cards are visible
- [ ] Tool listing shows correct tools for plan tier
- [ ] No console errors in browser DevTools

### Tools Listing Page (`/tools`)
- [ ] All 43 tools are displayed (count manually)
- [ ] Tools are organized by tier (Free: 2, Pro: 19, Enterprise: 19, Suites: 2)
- [ ] Tool cards show correct icons
- [ ] Tool cards show correct descriptions
- [ ] Locked tools show lock icon 🔒
- [ ] Clicking a tool navigates to correct route
- [ ] Clicking a locked tool shows upgrade prompt
- [ ] Search/filter functionality works

### Tool Detail Pages
Test a sample from each tier:

**Free Tools:**
- [ ] `/tools/product-seo` loads correctly
- [ ] `/tools/blog-seo` loads correctly
- [ ] Form fields are functional
- [ ] "Run Analysis" button works
- [ ] Results display after submission
- [ ] No access restrictions shown

**Professional Tools:**
- [ ] `/tools/ai-alt-text-engine` loads (or shows upgrade prompt)
- [ ] `/tools/abandoned-checkout-winback` loads (or shows upgrade prompt)
- [ ] Form submission works for paid users
- [ ] Upgrade prompt displays for free users

**Enterprise Tools:**
- [ ] `/tools/ai-support-assistant` loads (or shows upgrade prompt)
- [ ] `/tools/advanced-analytics-attribution` loads (or shows upgrade prompt)
- [ ] Upgrade prompt displays for non-enterprise users

### Upgrade Prompts & Modals
- [ ] `<UpgradePrompt>` modal displays correctly
- [ ] Shows current plan badge
- [ ] Shows required plan tier
- [ ] Lists feature benefits
- [ ] "Upgrade Now" button navigates to `/billing`
- [ ] "Maybe Later" closes modal
- [ ] Modal styling is correct (no layout breaks)

### Billing Page (`/billing`)
- [ ] Current plan is displayed correctly
- [ ] Plan comparison table shows all tiers
- [ ] Feature list matches plan definitions
- [ ] "Upgrade" buttons are functional
- [ ] Shopify billing confirmation flow works
- [ ] After upgrade, plan updates immediately

### Settings & Account
- [ ] Settings page loads
- [ ] Shop information displays correctly
- [ ] API keys are masked/hidden appropriately
- [ ] Team members list shows (if applicable)
- [ ] Profile updates save correctly

---

## 🛠️ TOOL-SPECIFIC TESTING

### Product SEO Tool (Free)
- [ ] Navigate to `/tools/product-seo`
- [ ] Enter product URL or paste product data
- [ ] Click "Analyze SEO"
- [ ] Results show: title analysis, description analysis, keyword density
- [ ] Recommendations are generated
- [ ] Export/copy functionality works

### AI Alt Text Engine (Professional)
- [ ] Navigate to `/tools/ai-alt-text-engine`
- [ ] Upload image or provide image URL
- [ ] Click "Generate Alt Text"
- [ ] Alt text is generated using AI
- [ ] Can edit alt text before applying
- [ ] "Apply to Shopify" button updates product
- [ ] Batch processing works for multiple images

### Abandoned Checkout Winback (Professional)
- [ ] Navigate to `/tools/abandoned-checkout-winback`
- [ ] View list of abandoned checkouts from Shopify
- [ ] Click "Create Campaign"
- [ ] Email template editor loads
- [ ] Can customize email content
- [ ] Preview email works
- [ ] Schedule or send immediately
- [ ] Campaign status updates after send

### Weekly Blog Content Engine (Professional)
- [ ] Navigate to `/tools/weekly-blog-content-engine`
- [ ] View suggested blog topics
- [ ] Select topic and click "Generate Outline"
- [ ] Outline is generated with headings
- [ ] Click "Generate Full Draft"
- [ ] Full blog post is generated
- [ ] Can edit content in editor
- [ ] Export as Markdown or HTML

### AI Support Assistant (Enterprise)
- [ ] Navigate to `/tools/ai-support-assistant`
- [ ] Chat interface loads
- [ ] Type customer support question
- [ ] AI responds with relevant answer
- [ ] Can access knowledge base
- [ ] Can create support ticket
- [ ] Response quality is appropriate

### Advanced Analytics Attribution (Enterprise)
- [ ] Navigate to `/tools/advanced-analytics-attribution`
- [ ] Dashboard loads with attribution data
- [ ] Multi-channel attribution model displays
- [ ] Can filter by date range
- [ ] Can filter by channel
- [ ] Conversion path visualization works
- [ ] Export reports functionality

---

## 📊 API ENDPOINT TESTING

### Core APIs

#### Health Check (Public)
- [ ] `GET /health`
- [ ] Returns 200 OK
- [ ] Response: `{ status: 'ok', uptime: <number>, timestamp: <number> }`

#### Session API
- [ ] `GET /api/session`
- [ ] Returns current shop and project context
- [ ] Response includes: `{ shop, token, project, user }`

#### Analytics API
- [ ] `GET /api/analytics/overview`
- [ ] Returns dashboard metrics
- [ ] Response includes: `{ revenue, orders, conversion_rate, visitors }`
- [ ] `GET /api/analytics/timeline?metric=revenue&days=30`
- [ ] Returns time-series data

#### Notifications API
- [ ] `GET /api/notifications`
- [ ] Returns list of notifications
- [ ] `POST /api/notifications/mark-read`
- [ ] Marks notification as read
- [ ] `DELETE /api/notifications/:id`
- [ ] Deletes notification

### Tool APIs (Sample Testing)

#### Product SEO API
- [ ] `POST /api/product-seo/analyze`
- [ ] Request: `{ productUrl: '...' }` or `{ productData: {...} }`
- [ ] Returns SEO analysis results
- [ ] Response includes: `{ title_score, description_score, recommendations }`

#### AI Alt Text API
- [ ] `POST /api/ai-alt-text-engine/generate`
- [ ] Request: `{ imageUrl: '...' }` or `{ imageBase64: '...' }`
- [ ] Returns generated alt text
- [ ] Response: `{ alt_text, confidence, keywords }`

#### Abandoned Checkout API
- [ ] `GET /api/abandoned-checkout-winback/checkouts`
- [ ] Returns list of abandoned checkouts
- [ ] `POST /api/abandoned-checkout-winback/campaign`
- [ ] Creates email campaign
- [ ] Request: `{ checkout_id, email_template, schedule }`

### Access Control Middleware Testing
- [ ] Protected endpoint without auth returns 403
- [ ] Protected endpoint with free plan accessing pro tool returns 403
- [ ] Response includes: `{ upgrade_required: true, required_plan: 'professional' }`
- [ ] Protected endpoint with correct plan returns 200

---

## 🔄 WORKFLOW TESTING

### New User Onboarding Flow
1. [ ] User installs app from Shopify App Store
2. [ ] OAuth consent screen appears
3. [ ] User grants permissions
4. [ ] Redirect to app dashboard
5. [ ] Welcome modal or onboarding wizard appears
6. [ ] User completes setup steps
7. [ ] User is shown free tools available
8. [ ] User sees upgrade prompts for premium tools

### Subscription Upgrade Flow
1. [ ] User on free plan clicks locked tool
2. [ ] Upgrade prompt modal appears
3. [ ] User clicks "Upgrade to Professional"
4. [ ] Redirects to `/billing`
5. [ ] User selects Professional plan
6. [ ] Shopify billing confirmation appears
7. [ ] User confirms charge
8. [ ] Redirect back to app
9. [ ] Plan updates to Professional
10. [ ] Previously locked tools are now accessible
11. [ ] No upgrade prompts on professional tools

### Tool Usage Flow (AI Alt Text Example)
1. [ ] User navigates to AI Alt Text Engine
2. [ ] Uploads product image
3. [ ] Clicks "Generate Alt Text"
4. [ ] Loading spinner appears
5. [ ] Alt text is generated and displayed
6. [ ] User edits alt text (optional)
7. [ ] User clicks "Apply to Product"
8. [ ] Confirms product selection
9. [ ] API call to Shopify updates product
10. [ ] Success message displays
11. [ ] Alt text is verified in Shopify admin

### Content Generation Flow (Blog Engine Example)
1. [ ] User navigates to Weekly Blog Content Engine
2. [ ] Views suggested topics based on store data
3. [ ] Selects topic: "10 Ways to Style Denim Jackets"
4. [ ] Clicks "Generate Outline"
5. [ ] Outline appears with H2/H3 structure
6. [ ] User reviews and approves outline
7. [ ] Clicks "Generate Full Draft"
8. [ ] Full 1500-word blog post is generated
9. [ ] User edits content in rich text editor
10. [ ] Clicks "Publish to Shopify Blog"
11. [ ] Blog post is created in Shopify
12. [ ] Confirmation with link to live post

---

## 🧪 ERROR HANDLING & EDGE CASES

### Network Errors
- [ ] API timeout handling (>30s)
- [ ] Network offline graceful degradation
- [ ] Retry logic for failed requests
- [ ] User-friendly error messages

### Invalid Inputs
- [ ] Empty form submission shows validation errors
- [ ] Invalid URLs are caught and rejected
- [ ] Image uploads > 10MB are rejected
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are sanitized

### Rate Limiting
- [ ] Excessive API calls return 429 Too Many Requests
- [ ] Rate limit error message is clear
- [ ] Rate limits reset correctly after window

### Database Errors
- [ ] Database connection failure handled gracefully
- [ ] Query timeout shows user-friendly message
- [ ] Transaction rollback works on error

### Shopify API Errors
- [ ] Invalid shop domain shows error
- [ ] Expired access token triggers re-auth
- [ ] Shopify API rate limit (40 calls/sec) is respected
- [ ] Product not found error handled

### Usage Limit Exceeded
- [ ] Free user hitting 100 AI runs/month sees limit warning
- [ ] Usage limit modal displays at 100% usage
- [ ] User can upgrade from limit modal
- [ ] Usage resets on 1st of month

---

## 📱 RESPONSIVE & BROWSER TESTING

### Desktop Browsers
- [ ] Chrome (latest) - all features work
- [ ] Firefox (latest) - all features work
- [ ] Safari (latest) - all features work
- [ ] Edge (latest) - all features work

### Mobile Browsers
- [ ] iOS Safari - responsive layout
- [ ] Android Chrome - responsive layout
- [ ] Mobile navigation works
- [ ] Touch interactions work

### Screen Sizes
- [ ] 1920x1080 (Desktop) - optimal layout
- [ ] 1366x768 (Laptop) - responsive
- [ ] 768x1024 (Tablet) - responsive
- [ ] 375x667 (Mobile) - responsive

### Accessibility
- [ ] Keyboard navigation works throughout app
- [ ] Tab order is logical
- [ ] Screen reader labels are present
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible

---

## 🔒 SECURITY TESTING

### Authentication & Authorization
- [ ] Cannot access `/api/*` without valid session token
- [ ] Cannot access other shop's data
- [ ] Session token expires after inactivity
- [ ] CSRF protection is enabled
- [ ] SQL injection attempts are blocked

### Data Protection
- [ ] Passwords/secrets are not logged
- [ ] API keys are encrypted in database
- [ ] Sensitive data is not exposed in responses
- [ ] File uploads are scanned for malware
- [ ] User input is sanitized

### HTTPS & Headers
- [ ] All API calls use HTTPS
- [ ] HSTS header is present
- [ ] CSP header restricts inline scripts
- [ ] X-Frame-Options prevents clickjacking
- [ ] X-Content-Type-Options is set

---

## ⚡ PERFORMANCE TESTING

### Load Times
- [ ] Homepage loads <2s
- [ ] Dashboard loads <3s
- [ ] Tool pages load <3s
- [ ] API responses <500ms (simple queries)
- [ ] API responses <5s (AI generation)

### Bundle Sizes
- [ ] Main JS bundle <500KB (gzipped)
- [ ] Vendor bundle <200KB (gzipped)
- [ ] CSS bundle <100KB (gzipped)
- [ ] Total page weight <2MB

### Database Performance
- [ ] Simple queries <100ms
- [ ] Complex queries <500ms
- [ ] No N+1 query problems
- [ ] Proper indexes on foreign keys

### Concurrent Users
- [ ] 10 simultaneous users - no degradation
- [ ] 50 simultaneous users - acceptable performance
- [ ] 100+ users - monitor for bottlenecks

---

## 🔄 DATA INTEGRITY TESTING

### Database Operations
- [ ] Create operations persist correctly
- [ ] Update operations modify correct records
- [ ] Delete operations remove only target records
- [ ] Transactions rollback on error
- [ ] Foreign key constraints enforced

### Shopify Sync
- [ ] Product updates sync from Shopify
- [ ] Order updates sync from Shopify
- [ ] Customer data syncs correctly
- [ ] Webhook delivery is reliable
- [ ] Sync conflicts are resolved correctly

### File Uploads
- [ ] Images upload correctly
- [ ] File metadata is stored
- [ ] Files are stored in correct location
- [ ] Duplicate uploads are handled
- [ ] File cleanup on delete

---

## 📊 MONITORING & LOGGING

### Application Logs
- [ ] Errors are logged to console/file
- [ ] Request logs include method, path, status, time
- [ ] Database queries are logged (dev only)
- [ ] No sensitive data in logs

### Error Tracking
- [ ] Sentry/error tracking is configured
- [ ] Errors include stack traces
- [ ] Errors include user context
- [ ] Errors are grouped correctly

### Performance Monitoring
- [ ] API response times are tracked
- [ ] Database query times are tracked
- [ ] Memory usage is monitored
- [ ] CPU usage is monitored

---

## ✅ DEPLOYMENT VERIFICATION

### Post-Deploy Checks
- [ ] Health check endpoint returns 200
- [ ] Dashboard loads without errors
- [ ] At least 3 tools load successfully
- [ ] Database connection successful
- [ ] No 500 errors in Render logs
- [ ] SSL certificate is valid
- [ ] DNS resolves correctly

### Rollback Plan
- [ ] Previous deploy commit hash documented
- [ ] Can rollback via Render dashboard
- [ ] Database migrations are reversible
- [ ] Backup data is available

---

## 📝 REGRESSION TESTING

Run after any code changes:

### Critical Paths
- [ ] User can install app
- [ ] User can access free tools
- [ ] User can upgrade plan
- [ ] User can use AI tools after upgrade
- [ ] User can generate content
- [ ] User can sync data to Shopify

### Known Bug Fixes
Document each bug fix and add regression test:
- [ ] Bug #1: Syntax error in ai-content-brief-generator (fixed 2026-02-16)
- [ ] Bug #2: Syntax error in blog-draft-engine (fixed 2026-02-16)
- [ ] Add more as bugs are discovered and fixed

---

## 🎯 SUCCESS CRITERIA

### Must-Pass Criteria (Deployment Blockers)
- ✅ All build steps complete without errors
- ✅ No JavaScript syntax errors
- ✅ Server starts and responds on port 10000
- ✅ Health check endpoint returns 200
- ✅ At least one free tool works end-to-end
- ✅ Access control blocks unauthorized requests

### Should-Pass Criteria (Fix Before Next Release)
- All tools load without errors
- Upgrade prompts display correctly
- Billing integration works
- Analytics display correctly
- Mobile responsive works on all pages

### Nice-to-Have Criteria (Future Improvements)
- Performance optimizations (<2s load times)
- Accessibility score >90
- SEO optimization
- Offline support
- Progressive Web App features

---

## 📞 CONTACTS & RESOURCES

**Production URL:** https://aura-core-monolith.onrender.com  
**GitHub Repo:** https://github.com/aurasystemsai/aura-core-monolith  
**Render Dashboard:** https://dashboard.render.com/  
**Shopify Partner Dashboard:** https://partners.shopify.com/  

**Documentation:**
- [Plan Access Control](./PLAN_ACCESS_CONTROL.md)
- [Access Control Quickstart](./ACCESS_CONTROL_QUICKSTART.md)
- [Tools Audit Report](./TOOLS_AUDIT_REPORT.md)
- [API Documentation](./API.md)

---

**Testing Notes:**
- Update this checklist as new features are added
- Mark items with ✅ when verified
- Document any failures with details
- Re-test after bug fixes
