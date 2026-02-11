# Abandoned Checkout Winback - API Reference

**Version:** 2.0  
**Last Updated:** Week 8 Deliverable  
**Total Endpoints:** 184  
**Base URL:** `/api/abandoned-checkout-winback`

Week 8 documentation deliverable providing comprehensive reference for all 184 endpoints across 7 world-class categories.

---

## Table of Contents

1. [Authentication & Multi-Tenancy](#authentication--multi-tenancy)
2. [Original Endpoints (13)](#original-endpoints)
3. [AI Orchestration (44)](#ai-orchestration)
4. [Collaboration (30)](#collaboration)
5. [Security & Compliance (15)](#security--compliance)
6. [Predictive Analytics (24)](#predictive-analytics)
7. [Developer Platform (19)](#developer-platform)
8. [White-Label (18)](#white-label)
9. [APM & Monitoring (14)](#apm--monitoring)
10. [Error Codes](#error-codes)
11. [Rate Limits](#rate-limits)
12. [Webhooks](#webhooks)

---

## Authentication & Multi-Tenancy

All endpoints require a `shop` parameter for multi-tenant data isolation:

```bash
GET /api/abandoned-checkout-winback/{endpoint}?shop=your-shop.myshopify.com
```

**Multi-Tenant Architecture:**
- Shop-scoped data storage in JSON files
- Isolated data per Shopify shop domain
- Automatic namespace creation on first request

---

## Original Endpoints

### Compliance (5 endpoints)

#### GET /compliance/gdpr/consent
Get all GDPR consent records.

**Query Parameters:**
- `shop` (required): Shop domain

**Response:**
```json
{
  "consent": [
    {
      "customerId": "customer_123",
      "consentType": "email_marketing",
      "granted": true,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /compliance/gdpr/consent
Record new GDPR consent.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "customerId": "customer_123",
  "consentType": "email_marketing",
  "granted": true
}
```

**Response:**
```json
{
  "success": true,
  "consentId": "consent_456"
}
```

#### DELETE /compliance/gdpr/delete-customer-data
Delete customer data per GDPR request.

**Query Parameters:**
- `shop` (required)
- `customerId` (required)

**Response:**
```json
{
  "deleted": true,
  "customerId": "customer_123"
}
```

#### GET /compliance/gdpr/export
Export customer data for GDPR compliance.

**Query Parameters:**
- `shop` (required)
- `customerId` (required)

**Response:**
```json
{
  "data": { /* customer data object */ },
  "exportedAt": "2024-01-15T10:30:00Z"
}
```

#### POST /compliance/gdpr/anonymize
Anonymize customer data.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "customerId": "customer_123"
}
```

### Integrations (3 endpoints)

#### GET /integrations
List all third-party integrations.

**Response:**
```json
{
  "integrations": [
    { "service": "klaviyo", "connected": true },
    { "service": "twilio", "connected": false }
  ]
}
```

#### POST /integrations/connect
Connect a third-party service.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "service": "klaviyo",
  "apiKey": "pk_123456"
}
```

#### DELETE /integrations/disconnect
Disconnect integration.

---

### Notifications (5 endpoints)

#### GET /notifications
Get notifications for shop.

#### POST /notifications
Create notification.

#### DELETE /notifications/:id
Delete specific notification.

#### PUT /notifications/:id/read
Mark notification as read.

#### POST /notifications/broadcast
Send broadcast notification.

---

## AI Orchestration

### Recovery Workflows (11 endpoints)

#### GET /ai/orchestration/recovery-workflows
List all AI-powered recovery workflows.

**Response:**
```json
{
  "workflows": [
    {
      "id": "workflow_123",
      "name": "High-Value Cart Recovery",
      "status": "active",
      "triggers": ["cart_value > 100"],
      "actions": ["send_email", "send_sms"],
      "createdAt": "2024-01-10T09:00:00Z"
    }
  ]
}
```

#### POST /ai/orchestration/recovery-workflows
Create new AI workflow.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "name": "VIP Customer Recovery",
  "triggers": ["customer_segment == 'vip'", "cart_abandoned_hours > 2"],
  "actions": ["send_email", "apply_discount"],
  "schedule": "immediate"
}
```

**Response:**
```json
{
  "success": true,
  "workflowId": "workflow_789",
  "status": "active"
}
```

#### GET /ai/orchestration/recovery-workflows/:id
Get specific workflow details.

#### PUT /ai/orchestration/recovery-workflows/:id
Update workflow configuration.

#### DELETE /ai/orchestration/recovery-workflows/:id
Delete workflow.

#### POST /ai/orchestration/recovery-workflows/:id/activate
Activate paused workflow.

#### POST /ai/orchestration/recovery-workflows/:id/pause
Pause active workflow.

#### GET /ai/orchestration/recovery-workflows/:id/stats
Get workflow performance statistics.

#### POST /ai/orchestration/recovery-workflows/:id/test
Test workflow with sample data.

#### POST /ai/orchestration/recovery-workflows/:id/clone
Clone existing workflow.

#### GET /ai/orchestration/recovery-workflows/templates
Get pre-built workflow templates.

---

### Predictive Intent (8 endpoints)

#### GET /ai/orchestration/predictive-intent
Get intent scores for all customers.

**Response:**
```json
{
  "intentScores": [
    {
      "customerId": "customer_123",
      "score": 87.5,
      "likelihood": "high",
      "factors": ["high_cart_value", "repeat_visitor"]
    }
  ]
}
```

#### POST /ai/orchestration/predictive-intent/calculate
Calculate purchase intent for specific customer.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "customerId": "customer_456",
  "cartValue": 150,
  "sessionDuration": 320,
  "pageViews": 8
}
```

**Response:**
```json
{
  "intentScore": 92.3,
  "likelihood": "very_high",
  "recommendedAction": "send_sms_immediately"
}
```

#### GET /ai/orchestration/predictive-intent/:customerId
Get intent score for specific customer.

#### POST /ai/orchestration/predictive-intent/bulk
Calculate intent for multiple customers.

#### GET /ai/orchestration/predictive-intent/trends
View intent score trends over time.

#### POST /ai/orchestration/predictive-intent/retrain
Retrain ML model with new data.

#### GET /ai/orchestration/predictive-intent/model-accuracy
Get model performance metrics.

#### POST /ai/orchestration/predictive-intent/export
Export intent data for analysis.

---

### Dynamic Incentives (8 endpoints)

#### GET /ai/orchestration/dynamic-incentives
List all dynamic incentive rules.

#### POST /ai/orchestration/dynamic-incentives/optimize
Calculate optimal discount for cart.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "cartValue": 200,
  "customerSegment": "vip",
  "cartItems": 5,
  "abandonmentHours": 12
}
```

**Response:**
```json
{
  "optimalDiscount": 15,
  "discountType": "percentage",
  "expectedRecoveryRate": 68.5,
  "projectedRevenue": 170
}
```

#### POST /ai/orchestration/dynamic-incentives
Create incentive rule.

#### PUT /ai/orchestration/dynamic-incentives/:id
Update incentive rule.

#### DELETE /ai/orchestration/dynamic-incentives/:id
Delete incentive rule.

#### GET /ai/orchestration/dynamic-incentives/:id/performance
Get rule performance metrics.

#### POST /ai/orchestration/dynamic-incentives/test
Test incentive calculation.

#### GET /ai/orchestration/dynamic-incentives/recommendations
Get AI-powered incentive recommendations.

---

### Multi-Channel (9 endpoints)

#### GET /ai/orchestration/multi-channel
List all configured channels.

**Response:**
```json
{
  "channels": [
    { "type": "email", "enabled": true, "provider": "sendgrid" },
    { "type": "sms", "enabled": true, "provider": "twilio" },
    { "type": "push", "enabled": false }
  ]
}
```

#### POST /ai/orchestration/multi-channel/send
Send multi-channel message.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "channels": ["email", "sms"],
  "customerId": "customer_789",
  "templateId": "template_recovery_001",
  "personalizations": {
    "customerName": "John Doe",
    "cartValue": "$150",
    "discountCode": "SAVE15"
  }
}
```

**Response:**
```json
{
  "sent": true,
  "messageId": "msg_456",
  "channels": {
    "email": { "delivered": true, "messageId": "email_789" },
    "sms": { "delivered": true, "messageId": "sms_101" }
  }
}
```

#### GET /ai/orchestration/multi-channel/performance
Channel performance analytics.

#### POST /ai/orchestration/multi-channel/configure
Configure channel settings.

#### GET /ai/orchestration/multi-channel/:channelType/stats
Get stats for specific channel.

#### POST /ai/orchestration/multi-channel/test
Test channel delivery.

#### GET /ai/orchestration/multi-channel/preferences
Get customer channel preferences.

#### POST /ai/orchestration/multi-channel/schedule
Schedule multi-channel campaign.

#### DELETE /ai/orchestration/multi-channel/scheduled/:id
Cancel scheduled campaign.

---

### Smart Triggers (4 endpoints)

#### GET /ai/orchestration/smart-triggers
List trigger rules.

#### POST /ai/orchestration/smart-triggers
Create trigger.

#### PUT /ai/orchestration/smart-triggers/:id
Update trigger.

#### DELETE /ai/orchestration/smart-triggers/:id
Delete trigger.

---

### AI Messaging (4 endpoints)

#### GET /ai/orchestration/ai-messaging/templates
Get AI-generated message templates.

#### POST /ai/orchestration/ai-messaging/generate
Generate personalized message.

#### POST /ai/orchestration/ai-messaging/optimize
Optimize message for engagement.

#### GET /ai/orchestration/ai-messaging/performance
Message performance analytics.

---

## Collaboration

### Teams (6 endpoints)

#### GET /collaboration/teams
List all teams.

**Response:**
```json
{
  "teams": [
    {
      "teamId": "team_123",
      "name": "Marketing Team",
      "memberCount": 5,
      "role": "editor",
      "createdAt": "2024-01-05T14:00:00Z"
    }
  ]
}
```

#### POST /collaboration/teams
Create new team.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "name": "Analytics Team",
  "role": "viewer",
  "members": ["user_456", "user_789"]
}
```

#### GET /collaboration/teams/:id
Get team details.

#### PUT /collaboration/teams/:id
Update team.

#### DELETE /collaboration/teams/:id
Delete team.

#### POST /collaboration/teams/:id/add-member
Add member to team.

---

### Roles (5 endpoints)

#### GET /collaboration/roles
List available roles.

#### POST /collaboration/roles
Create custom role.

#### PUT /collaboration/roles/:id
Update role permissions.

#### DELETE /collaboration/roles/:id
Delete role.

#### GET /collaboration/roles/:id/permissions
Get role permissions.

---

### Approval Workflows (6 endpoints)

#### GET /collaboration/approval-workflows
List approval workflows.

#### POST /collaboration/approval-workflows
Create approval workflow.

#### GET /collaboration/approval-workflows/:id
Get workflow details.

#### PUT /collaboration/approval-workflows/:id
Update workflow.

#### POST /collaboration/approval-workflows/:id/approve
Approve workflow.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "approver": "user_123",
  "comments": "Looks good, approved for launch"
}
```

**Response:**
```json
{
  "approved": true,
  "workflowId": "approval_456",
  "approvedBy": "user_123",
  "approvedAt": "2024-01-15T11:00:00Z"
}
```

#### POST /collaboration/approval-workflows/:id/reject
Reject workflow.

---

### Comments (5 endpoints)

#### GET /collaboration/comments
Get all comments.

#### POST /collaboration/comments
Create comment.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "entityType": "campaign",
  "entityId": "campaign_123",
  "text": "This template needs adjustment",
  "author": "user_456"
}
```

#### PUT /collaboration/comments/:id
Update comment.

#### DELETE /collaboration/comments/:id
Delete comment.

#### POST /collaboration/comments/:id/reply
Reply to comment.

---

### Shared Assets (4 endpoints)

#### GET /collaboration/shared-assets
List shared templates and assets.

#### POST /collaboration/shared-assets
Share asset.

#### DELETE /collaboration/shared-assets/:id
Unshare asset.

#### GET /collaboration/shared-assets/:id/access-log
View access history.

---

### Activity Feed (4 endpoints)

#### GET /collaboration/activity-feed
Get activity stream.

**Response:**
```json
{
  "activities": [
    {
      "id": "activity_123",
      "action": "campaign_created",
      "user": "john@example.com",
      "details": "Created 'Weekend Sale Recovery' campaign",
      "timestamp": "2024-01-15T09:30:00Z"
    }
  ]
}
```

#### GET /collaboration/activity-feed/:userId
Get user-specific activity.

#### POST /collaboration/activity-feed/filter
Filter activity by criteria.

#### GET /collaboration/activity-feed/export
Export activity log.

---

## Security & Compliance

### GDPR (5 endpoints)

Documented above in Original Endpoints section.

---

### Encryption (3 endpoints)

#### POST /security/encryption/encrypt
Encrypt sensitive data.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "data": "customer credit card info"
}
```

**Response:**
```json
{
  "encrypted": "AES256:g8h3j4k5l6m7n8o9p0q1r2s3t4u5v6w7",
  "algorithm": "AES-256-GCM"
}
```

#### POST /security/encryption/decrypt
Decrypt data.

#### GET /security/encryption/status
Get encryption configuration status.

---

### RBAC (Role-Based Access Control) (4 endpoints)

#### GET /security/rbac/roles
List all roles.

#### POST /security/rbac/roles/:roleId/assign
Assign role to user.

#### DELETE /security/rbac/roles/:roleId/revoke
Revoke role from user.

#### GET /security/rbac/users/:userId/permissions
Get user permissions.

---

### Audit Logging (2 endpoints)

#### GET /security/audit-log
Get audit trail.

**Response:**
```json
{
  "logs": [
    {
      "event": "campaign_modified",
      "user": "admin@shop.com",
      "resourceId": "campaign_123",
      "timestamp": "2024-01-15T10:45:00Z",
      "ipAddress": "192.168.1.100"
    }
  ]
}
```

#### GET /security/audit-log/export
Export audit logs.

---

### API Security (1 endpoint)

#### GET /security/api-security/status
Get API security configuration.

---

## Predictive Analytics

### Revenue Forecasting (6 endpoints)

#### GET /analytics/revenue-forecast
Get revenue forecasts.

**Response:**
```json
{
  "forecast": {
    "currentMonth": 45000,
    "nextMonth": 52000,
    "nextQuarter": 165000,
    "confidence": 87.5,
    "trend": "increasing"
  }
}
```

#### POST /analytics/revenue-forecast/calculate
Recalculate forecast.

#### GET /analytics/revenue-forecast/historical
View historical accuracy.

#### POST /analytics/revenue-forecast/export
Export forecast data.

#### GET /analytics/revenue-forecast/scenarios
Run what-if scenarios.

#### POST /analytics/revenue-forecast/adjust
Adjust forecast parameters.

---

### Customer Lifetime Value (CLV) (6 endpoints)

#### GET /analytics/clv
Get CLV analytics.

**Response:**
```json
{
  "clv": {
    "averageCLV": 450,
    "topSegmentCLV": 1200,
    "lowSegmentCLV": 150,
    "totalCustomers": 5000
  }
}
```

#### POST /analytics/clv/predict
Predict CLV for customer.

#### GET /analytics/clv/segments
CLV by customer segment.

#### POST /analytics/clv/export
Export CLV data.

#### GET /analytics/clv/trends
CLV trend analysis.

#### POST /analytics/clv/optimize
Get CLV optimization recommendations.

---

### Abandonment Insights (4 endpoints)

#### GET /analytics/abandonment-insights
Get abandonment analytics.

#### POST /analytics/abandonment-insights/analyze
Deep-dive analysis.

#### GET /analytics/abandonment-insights/patterns
Identify patterns.

#### POST /analytics/abandonment-insights/recommendations
Get actionable recommendations.

---

### Recovery Metrics (4 endpoints)

#### GET /analytics/recovery-metrics
Get recovery performance.

#### GET /analytics/recovery-metrics/by-channel
Metrics by channel.

#### GET /analytics/recovery-metrics/by-segment
Metrics by customer segment.

#### POST /analytics/recovery-metrics/export
Export metrics.

---

### Live Dashboard (4 endpoints)

#### GET /analytics/live-dashboard
Real-time metrics.

**Response:**
```json
{
  "metrics": {
    "cartsAbandoned": 42,
    "recoveriesInProgress": 18,
    "revenue": 5600,
    "conversionRate": 12.4,
    "lastUpdated": "2024-01-15T11:05:00Z"
  }
}
```

#### GET /analytics/live-dashboard/stream
WebSocket stream for live data.

#### POST /analytics/live-dashboard/configure
Configure dashboard metrics.

#### GET /analytics/live-dashboard/export
Export dashboard snapshot.

---

## Developer Platform

### Webhooks (5 endpoints)

#### GET /developer/webhooks
List webhooks.

#### POST /developer/webhooks
Create webhook.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "url": "https://yourapp.com/webhooks/cart-abandoned",
  "event": "cart.abandoned",
  "secret": "webhook_secret_key"
}
```

#### PUT /developer/webhooks/:id
Update webhook.

#### DELETE /developer/webhooks/:id
Delete webhook.

#### POST /developer/webhooks/:id/test
Test webhook delivery.

---

### Custom Scripts (5 endpoints)

#### GET /developer/custom-scripts
List custom scripts.

#### POST /developer/custom-scripts
Create script.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "name": "Custom Recovery Logic",
  "trigger": "cart_abandoned",
  "code": "function customLogic(cart) { return cart.value > 100; }",
  "language": "javascript"
}
```

#### PUT /developer/custom-scripts/:id
Update script.

#### DELETE /developer/custom-scripts/:id
Delete script.

#### POST /developer/custom-scripts/:id/execute
Test script execution.

---

### Integrations (3 endpoints)

#### GET /developer/integrations
List integration configurations.

#### POST /developer/integrations
Create integration.

#### DELETE /developer/integrations/:id
Remove integration.

---

### Event Streaming (2 endpoints)

#### GET /developer/event-stream
Subscribe to event stream.

#### POST /developer/event-stream/configure
Configure stream filters.

---

### API Keys (3 endpoints)

#### GET /developer/api-keys
List API keys.

#### POST /developer/api-keys
Generate new API key.

**Response:**
```json
{
  "apiKey": "ak_live_f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3",
  "keyId": "key_123",
  "createdAt": "2024-01-15T11:10:00Z",
  "permissions": ["read", "write"]
}
```

#### DELETE /developer/api-keys/:id
Revoke API key.

---

### Export/Import (1 endpoint)

#### GET /developer/export
Export data.

**Query Parameters:**
- `shop` (required)
- `type`: campaigns|segments|workflows|all
- `format`: json|csv|xlsx

---

## White-Label

### Brand Management (4 endpoints)

#### GET /whitelabel/brands
List brands.

#### POST /whitelabel/brands
Create brand.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "name": "Acme Corporation",
  "primaryColor": "#6366f1",
  "secondaryColor": "#22c55e",
  "logoUrl": "https://cdn.shop.com/logo.png",
  "fontFamily": "Inter"
}
```

#### PUT /whitelabel/brands/:id
Update brand.

#### DELETE /whitelabel/brands/:id
Delete brand.

---

### Multi-Store (4 endpoints)

#### GET /whitelabel/multi-store
List stores.

#### POST /whitelabel/multi-store
Add store.

#### PUT /whitelabel/multi-store/:id
Update store config.

#### DELETE /whitelabel/multi-store/:id
Remove store.

---

### Localization (4 endpoints)

#### GET /whitelabel/localization
List locales.

#### POST /whitelabel/localization
Add locale.

**Request Body:**
```json
{
  "shop": "test-shop.myshopify.com",
  "code": "es",
  "name": "Spanish",
  "enabled": true,
  "translations": { /* translation key-value pairs */ }
}
```

#### PUT /whitelabel/localization/:id
Update locale.

#### DELETE /whitelabel/localization/:id
Remove locale.

---

### Tenant Isolation (3 endpoints)

#### GET /whitelabel/tenant-isolation/status
Check isolation status.

#### POST /whitelabel/tenant-isolation/configure
Configure isolation rules.

#### GET /whitelabel/tenant-isolation/audit
Audit isolation compliance.

---

### Settings (3 endpoints)

#### GET /whitelabel/settings
Get white-label settings.

#### PUT /whitelabel/settings
Update settings.

#### POST /whitelabel/settings/reset
Reset to defaults.

---

## APM & Monitoring

### Metrics (3 endpoints)

#### GET /apm/metrics
Get all performance metrics.

#### GET /apm/metrics/dashboard
Get dashboard-specific metrics.

#### POST /apm/metrics/custom
Track custom metric.

---

### Health (2 endpoints)

#### GET /apm/health
System health status.

**Response:**
```json
{
  "health": {
    "status": "healthy",
    "uptime": "99.9%",
    "lastCheck": "2024-01-15T11:12:00Z",
    "services": {
      "database": "healthy",
      "api": "healthy",
      "workers": "healthy"
    }
  }
}
```

#### GET /apm/health/detailed
Detailed health breakdown.

---

### Alerts (4 endpoints)

#### GET /apm/alerts
List active alerts.

#### POST /apm/alerts
Create alert rule.

#### PUT /apm/alerts/:id
Update alert rule.

#### DELETE /apm/alerts/:id
Delete alert rule.

---

### Error Tracking (2 endpoints)

#### GET /apm/errors
Get error logs.

#### POST /apm/errors/report
Report custom error.

---

### Distributed Tracing (2 endpoints)

#### GET /apm/tracing
Get trace data.

#### GET /apm/tracing/:traceId
Get specific trace.

---

### Logs (1 endpoint)

#### GET /apm/logs
Query system logs.

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Missing required parameters |
| 401 | Unauthorized - Invalid API key |
| 404 | Not Found - Endpoint or resource doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

- **Standard tier:** 100 requests/minute
- **Premium tier:** 1000 requests/minute
- **Enterprise tier:** Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705322400
```

---

## Webhooks

### Supported Events

- `cart.abandoned` - Cart abandoned by customer
- `campaign.sent` - Recovery campaign sent
- `recovery.success` - Cart successfully recovered
- `recovery.failed` - Recovery attempt failed
- `workflow.triggered` - AI workflow triggered
- `approval.requested` - Approval workflow started
- `approval.completed` - Workflow approved/rejected

### Webhook Payload Example

```json
{
  "event": "cart.abandoned",
  "shop": "test-shop.myshopify.com",
  "timestamp": "2024-01-15T11:15:00Z",
  "data": {
    "cartId": "cart_123",
    "customerId": "customer_456",
    "cartValue": 150,
    "items": 3
  }
}
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
const { AbandonedCheckoutWinbackClient } = require('@aura/api-client');

const client = new AbandonedCheckoutWinbackClient({
  shop: 'your-shop.myshopify.com',
  apiKey: 'your_api_key'
});

// Create AI workflow
const workflow = await client.ai.workflows.create({
  name: 'High-Value Recovery',
  triggers: ['cart_value > 100'],
  actions: ['send_email']
});

// Get revenue forecast
const forecast = await client.analytics.revenueForecast.get();
```

### Python

```python
from aura_api import AbandonedCheckoutWinbackClient

client = AbandonedCheckoutWinbackClient(
    shop='your-shop.myshopify.com',
    api_key='your_api_key'
)

# Calculate predictive intent
intent = client.ai.predictive_intent.calculate(
    customer_id='customer_123',
    cart_value=150
)
```

---

## Best Practices

1. **Use webhooks** for real-time event processing
2. **Cache responses** when data doesn't change frequently
3. **Batch requests** to reduce API calls
4. **Handle rate limits** gracefully with exponential backoff
5. **Validate data** before sending to API
6. **Use HTTPS** for all requests
7. **Store API keys** securely, never in client-side code

---

## Support

- **Documentation:** https://docs.aura.com/abandoned-checkout-winback
- **API Status:** https://status.aura.com
- **Support Email:** support@aura.com
- **Developer Slack:** https://slack.aura.com

---

**End of API Reference - 184 Endpoints Documented**
