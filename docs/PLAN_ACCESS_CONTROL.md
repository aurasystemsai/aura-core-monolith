# Plan-Based Access Control System

## Overview

This system restricts features, tools, and usage based on subscription plans (Free, Professional, Enterprise). It includes backend middleware for API protection and frontend components for UI/UX.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  usePlanAccess Hook                              │   │
│  │  - Checks /api/access/check                      │   │
│  │  - Returns plan, hasAccess, features            │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  UpgradePrompt Components                        │   │
│  │  - ProtectedTool wrapper                         │   │
│  │  - LockedToolBadge                              │   │
│  │  - UsageLimitWarning                            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Backend (Express)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  planAccessControl.js                            │   │
│  │  - requirePlan(planId)                          │   │
│  │  - requireTool(toolId)                          │   │
│  │  - checkLimit(limitType)                        │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Applied to Routes                               │   │
│  │  /api/abandoned-checkout → requireTool(...)     │   │
│  │  /api/ai-support → requireTool(...)             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│          Shopify Billing Service                         │
│  - getSubscription(shop)                                 │
│  - Returns: { plan_id: 'free'|'professional'|'enterprise'│
└─────────────────────────────────────────────────────────┘
```

---

## Plan Features

### Free Plan ($0/month)
- **AI Runs**: 100/month
- **Products**: 50
- **Team Members**: 1
- **Tools**: 
  - blog-seo
  - product-seo
  - keyword-research-basic
- **Features**: 
  - basic_analytics
  - email_support

### Professional Plan ($99/month)
- **AI Runs**: 10,000/month
- **Products**: 10,000
- **Team Members**: 5
- **Tools**: All Free tools plus:
  - keyword-research
  - content-brief-generator
  - blog-draft-engine
  - weekly-blog-content
  - abandoned-checkout
  - reviews-ugc
  - customer-data-platform
  - social-media-analytics
  - on-page-seo
  - technical-seo-auditor
  - email-automation-builder
  - And 15+ more
- **Features**:
  - advanced_analytics
  - priority_support
  - api_access
  - webhooks

### Enterprise Plan ($299/month)
- **AI Runs**: Unlimited
- **Products**: Unlimited
- **Team Members**: Unlimited
- **Tools**: All tools (*)
- **Features**: All features (*)

---

## Backend Implementation

### 1. Middleware

```javascript
const { requireTool, requirePlan, checkLimit } = require('./core/planAccessControl');

// Protect a specific tool
app.use('/api/abandoned-checkout', requireTool('abandoned-checkout'), router);

// Require a plan level
app.use('/api/advanced-features', requirePlan('professional'), router);

// Check usage limits
app.post('/api/ai/run', checkLimit('ai_runs'), async (req, res) => {
  // Process AI request
});
```

### 2. Response Format

**Success (200):**
```json
{
  "ok": true,
  "data": { ... }
}
```

**Access Denied (403):**
```json
{
  "error": "This tool requires professional plan",
  "current_plan": "free",
  "required_plan": "professional",
  "tool_id": "abandoned-checkout",
  "upgrade_url": "/billing",
  "upgrade_required": true
}
```

**Limit Exceeded (429):**
```json
{
  "error": "ai_runs limit exceeded",
  "limit": 100,
  "usage": 100,
  "upgrade_required": true,
  "upgrade_url": "/billing"
}
```

### 3. Tool-to-Plan Mapping

Edit `src/core/planAccessControl.js`:

```javascript
const TOOL_PLAN_REQUIREMENTS = {
  // Free tier
  'blog-seo': 'free',
  'product-seo': 'free',
  
  // Professional tier
  'abandoned-checkout': 'professional',
  'reviews-ugc': 'professional',
  
  // Enterprise tier
  'ai-support-assistant': 'enterprise',
  'white-label-api': 'enterprise'
};
```

---

## Frontend Implementation

### 1. Check Access (Hook)

```jsx
import { usePlanAccess, useToolAccess } from '../hooks/usePlanAccess';

function MyTool() {
  const { canAccess, plan, loading } = useToolAccess('abandoned-checkout');
  
  if (loading) return <div>Loading...</div>;
  if (!canAccess) return <UpgradePrompt />;
  
  return <div>Tool content</div>;
}
```

### 2. Protect Entire Page

```jsx
import { ProtectedTool } from '../components/UpgradePrompt';

function AbandonedCheckoutPage() {
  return (
    <ProtectedTool toolId="abandoned-checkout" toolName="Abandoned Checkout">
      {/* Tool content here */}
      {/* User sees upgrade prompt if not subscribed */}
    </ProtectedTool>
  );
}
```

### 3. Show Locked Tools in Dashboard

```jsx
import { usePlanAccess } from '../hooks/usePlanAccess';
import { LockedToolBadge } from '../components/UpgradePrompt';

function ToolCard({ tool }) {
  const { accessibleTools } = usePlanAccess();
  const isLocked = !accessibleTools.includes(tool.id);
  
  return (
    <div className={`tool-card ${isLocked ? 'locked' : ''}`}>
      <h3>{tool.name}</h3>
      {isLocked && <LockedToolBadge requiredPlan={tool.requiredPlan} />}
    </div>
  );
}
```

### 4. Usage Limits

```jsx
import { useUsageLimits, UsageLimitWarning } from '../hooks/usePlanAccess';

function AIRunButton() {
  const { usage, limits, isLimitReached } = useUsageLimits();
  
  return (
    <>
      <UsageLimitWarning 
        limitType="ai_runs"
        currentUsage={usage.ai_runs}
        limit={limits.ai_runs}
      />
      
      <button 
        disabled={isLimitReached('ai_runs')}
        onClick={runAI}
      >
        {isLimitReached('ai_runs') ? 'Limit Reached' : 'Run AI'}
      </button>
      
      <p>Used {usage.ai_runs} of {limits.ai_runs} AI runs</p>
    </>
  );
}
```

---

## API Endpoints

### GET `/api/access/check`

Check if user has access to a tool or feature.

**Query Parameters:**
- `tool` (optional): Tool ID to check
- `feature` (optional): Feature ID to check

**Response:**
```json
{
  "plan": "professional",
  "has_access": true,
  "accessible_tools": ["blog-seo", "abandoned-checkout", ...],
  "features": {
    "ai_runs_limit": 10000,
    "products_limit": 10000,
    "team_members": 5,
    "tools": [...],
    "features": [...]
  }
}
```

---

## Testing

### 1. Test Free Plan

```bash
# Connect with free shop (no subscription)
# Try accessing /api/abandoned-checkout
# Should receive 403 with upgrade_required: true
```

### 2. Test Professional Plan

```bash
# Upgrade to professional in billing
# Try accessing /api/abandoned-checkout
# Should work normally
# Try accessing /api/ai-support-assistant
# Should receive 403 (requires enterprise)
```

### 3. Test Usage Limits

```bash
# On free plan (100 AI runs)
# Make 100 API calls to /api/ai/run
# 101st call should receive 429 Too Many Requests
```

---

## Adding New Tools

### 1. Add to Plan Features (backend)

Edit `src/core/planAccessControl.js`:

```javascript
const PLAN_FEATURES = {
  professional: {
    tools: [..., 'my-new-tool'],
  }
};

const TOOL_PLAN_REQUIREMENTS = {
  'my-new-tool': 'professional'
};
```

### 2. Apply Middleware (backend)

Edit `src/server.js`:

```javascript
const toolRouters = [
  { 
    path: '/api/my-new-tool', 
    router: require('./tools/my-new-tool/router'),
    middleware: requireTool('my-new-tool')
  }
];
```

### 3. Add to Frontend (if showing in dashboard)

```javascript
const tools = [
  { id: 'my-new-tool', name: 'My New Tool', category: 'professional' }
];
```

---

## Upgrade Flow

1. User tries to access locked tool
2. Backend returns 403 with `upgrade_required: true`
3. Frontend shows `UpgradePrompt` component
4. User clicks "Upgrade"
5. Redirected to `/billing`
6. User selects plan and approves in Shopify
7. Shopify redirects back with subscription active
8. User can now access tool

---

## Security Considerations

1. **Never trust frontend checks** - Always validate on backend
2. **All API routes must use middleware** - Frontend can be bypassed
3. **Rate limiting** - Implement rate limiting separately from usage limits
4. **Session validation** - Verify shop session before checking subscription
5. **Fail closed** - If subscription check fails, deny access (except on errors)

---

## Monitoring

### Track Upgrade Events

```javascript
// In billing.js
router.post('/subscribe', async (req, res) => {
  // ... subscription logic
  
  // Track upgrade event
  console.log('[Upgrade] Shop:', shop, 'Plan:', planId, 'From:', currentPlan);
  // Send to analytics
});
```

### Track Access Denials

```javascript
// In planAccessControl.js
if (!hasAccess) {
  console.log('[Access Denied]', {
    shop,
    tool: toolId,
    current_plan: currentPlan,
    required_plan: requiredPlan
  });
  // Send to analytics to track conversion funnel
}
```

---

## Troubleshooting

### User sees "Upgrade Required" but already subscribed

1. Check subscription in Shopify admin
2. Verify `shopifyBillingService.getSubscription(shop)` returns correct plan
3. Check console logs for subscription fetch errors
4. Clear session and reconnect shop

### Tool accessible when it shouldn't be

1. Verify middleware is applied to route in server.js
2. Check `TOOL_PLAN_REQUIREMENTS` mapping
3. Verify middleware is in correct order (after verifyShopifySession)

### Usage limits not enforcing

1. Implement actual usage tracking (currently returns mock data)
2. Store usage counts in database
3. Increment on each AI run/product creation
4. Reset monthly via cron job

---

## Future Enhancements

1. **Usage Tracking** - Implement real DB-based usage tracking
2. **Grace Period** - Allow 3-day grace period after limit exceeded
3. **Usage Alerts** - Email when approaching 80% of limit
4. **Team Permissions** - Owner vs member access levels
5. **API Keys** - Generate API keys for external access (Enterprise only)
6. **Audit Logs** - Track all access attempts for compliance
7. **Custom Plans** - Support custom pricing for large merchants

---

## Contact & Support

For questions or issues with access control:
- Check logs: `https://dashboard.render.com/` → aura-core-monolith → Logs
- Review subscription: Check Shopify admin billing
- Test locally: `npm run dev` and test with test shop
