# Klaviyo Flow Automation - API Reference

**Version:** 2.0  
**Base URL:** `/api/klaviyo-flow-automation`  
**Authentication:** Bearer token  
**Rate Limit:** 1000 requests/hour  
**Response Format:** JSON

---

## Table of Contents

1. [Core CRUD Operations](#core-crud-operations)
2. [AI Orchestration](#ai-orchestration)
3. [Advanced Collaboration](#advanced-collaboration)
4. [Security Dashboard](#security-dashboard)
5. [Predictive BI](#predictive-bi)
6. [Developer Platform](#developer-platform)
7. [White-Label](#white-label)
8. [APM Monitoring](#apm-monitoring)
9. [Additional Features](#additional-features)

---

## Core CRUD Operations

### List All Flows
```http
GET /flows
```

**Response:**
```json
{
  "ok": true,
  "flows": [
    {
      "id": "flow-123",
      "name": "Welcome Flow",
      "trigger": "signup",
      "status": "active",
      "created": "2026-02-01T00:00:00Z"
    }
  ]
}
```

### Get Flow by ID
```http
GET /flows/:id
```

**Response:**
```json
{
  "ok": true,
  "flow": {
    "id": "flow-123",
    "name": "Welcome Flow",
    "trigger": "signup",
    "status": "active",
    "nodes": [...],
    "created": "2026-02-01T00:00:00Z"
  }
}
```

### Create Flow
```http
POST /flows
Content-Type: application/json

{
  "name": "New Flow",
  "trigger": "abandoned_cart",
  "nodes": []
}
```

**Response:**
```json
{
  "ok": true,
  "flow": {
    "id": "flow-456",
    "name": "New Flow",
    "trigger": "abandoned_cart",
    "status": "draft",
    "created": "2026-02-11T00:00:00Z"
  }
}
```

### Update Flow
```http
PUT /flows/:id
Content-Type: application/json

{
  "name": "Updated Flow Name",
  "status": "active"
}
```

### Delete Flow
```http
DELETE /flows/:id
```

---

## AI Orchestration

### List AI Agents
```http
GET /ai-orchestration/agents
```

**Response:**
```json
{
  "ok": true,
  "agents": [
    {
      "id": "content-gen",
      "name": "Content Generator",
      "status": "active",
      "models": ["gpt-4", "claude-3"]
    }
  ]
}
```

### Create AI Agent
```http
POST /ai-orchestration/agents
Content-Type: application/json

{
  "name": "Custom Agent",
  "models": ["gpt-4"],
  "task": "subject line optimization"
}
```

### Get Model Routing Configuration
```http
GET /ai-orchestration/model-routing
```

**Response:**
```json
{
  "ok": true,
  "routing": {
    "gpt-4": { "priority": 1, "cost": 0.03, "latency": 1200 },
    "gpt-3.5-turbo": { "priority": 2, "cost": 0.002, "latency": 600 },
    "claude-3": { "priority": 3, "cost": 0.025, "latency": 1100 }
  }
}
```

### Update Model Routing
```http
PUT /ai-orchestration/model-routing
Content-Type: application/json

{
  "routing": {
    "gpt-4": { "priority": 1, "cost": 0.03 }
  }
}
```

### Batch Process Tasks
```http
POST /ai-orchestration/batch-process
Content-Type: application/json

{
  "tasks": [
    { "id": 1, "prompt": "Generate subject line for abandoned cart" },
    { "id": 2, "prompt": "Optimize email body copy" }
  ],
  "model": "gpt-4"
}
```

**Response:**
```json
{
  "ok": true,
  "results": [
    { "id": 1, "result": "Don't forget your items!", "status": "completed" },
    { "id": 2, "result": "Optimized copy...", "status": "completed" }
  ]
}
```

### Get Quality Scores
```http
GET /ai-orchestration/quality-scores
```

### Set Fallback Chain
```http
POST /ai-orchestration/fallback-chain
Content-Type: application/json

{
  "chain": ["gpt-4", "claude-3", "gpt-3.5-turbo"]
}
```

### Get Cost Optimization
```http
GET /ai-orchestration/cost-optimization
```

**Response:**
```json
{
  "ok": true,
  "optimization": {
    "totalSpent": 247.82,
    "savings": 64.12,
    "recommendations": [
      "Route simple tasks to GPT-3.5-turbo",
      "Enable batch processing for flow analysis"
    ]
  }
}
```

### List Prompt Templates
```http
GET /ai-orchestration/prompt-templates
```

### Create Prompt Template
```http
POST /ai-orchestration/prompt-templates
Content-Type: application/json

{
  "name": "Email Subject Generator",
  "template": "Generate 5 email subject lines for {product} campaign",
  "category": "email"
}
```

---

## Advanced Collaboration

### List Teams
```http
GET /collaboration/teams
```

**Response:**
```json
{
  "ok": true,
  "teams": [
    { "id": "marketing", "name": "Marketing Team", "members": 8, "flows": 24 }
  ]
}
```

### Create Team
```http
POST /collaboration/teams
Content-Type: application/json

{
  "name": "Growth Team",
  "members": ["user1@example.com", "user2@example.com"]
}
```

### Get Permissions
```http
GET /collaboration/permissions
```

### Update Team Permissions
```http
PUT /collaboration/permissions/:team
Content-Type: application/json

{
  "permissions": {
    "flows": ["read", "write"],
    "analytics": ["read"]
  }
}
```

### Get Activity Feed
```http
GET /collaboration/activity-feed
```

**Response:**
```json
{
  "ok": true,
  "activities": [
    {
      "id": 1,
      "user": "alice@co.com",
      "action": "Updated Welcome Flow",
      "timestamp": "2026-02-11T10:00:00Z"
    }
  ]
}
```

### Add Comment
```http
POST /collaboration/comments
Content-Type: application/json

{
  "flowId": "flow-123",
  "userId": "user@example.com",
  "comment": "Consider A/B testing the subject line"
}
```

### Get Flow Comments
```http
GET /collaboration/comments/:flowId
```

### Share Flow
```http
POST /collaboration/share-flow
Content-Type: application/json

{
  "flowId": "flow-123",
  "recipients": ["colleague@example.com"],
  "message": "Please review this flow"
}
```

---

## Security Dashboard

### Get Audit Logs
```http
GET /security/audit-log
```

**Response:**
```json
{
  "ok": true,
  "logs": [
    {
      "id": 1,
      "user": "admin@co.com",
      "action": "Updated permissions",
      "resource": "team-marketing",
      "timestamp": "2026-02-11T09:00:00Z"
    }
  ]
}
```

### Get Access Patterns
```http
GET /security/access-patterns
```

**Response:**
```json
{
  "ok": true,
  "patterns": {
    "admin@co.com": {
      "logins": 42,
      "failedLogins": 0,
      "lastLogin": "2026-02-11T08:00:00Z"
    }
  }
}
```

### Get Threat Detection
```http
GET /security/threat-detection
```

### Encrypt Data
```http
POST /security/encrypt-data
Content-Type: application/json

{
  "data": "sensitive customer information"
}
```

**Response:**
```json
{
  "ok": true,
  "encrypted": "ZW5jcnlwdGVkIGRhdGE="
}
```

### Decrypt Data
```http
POST /security/decrypt-data
Content-Type: application/json

{
  "encrypted": "ZW5jcnlwdGVkIGRhdGE="
}
```

### Get Compliance Status
```http
GET /security/compliance-status
```

**Response:**
```json
{
  "ok": true,
  "compliance": {
    "gdpr": { "status": "compliant", "lastAudit": "2024-01-15", "score": 98 },
    "ccpa": { "status": "compliant", "lastAudit": "2024-01-15", "score": 96 },
    "soc2": { "status": "in-progress", "lastAudit": "2023-12-01", "score": 88 }
  }
}
```

### Revoke Access
```http
POST /security/revoke-access
Content-Type: application/json

{
  "userId": "user@example.com",
  "reason": "Account compromise detected"
}
```

### List API Keys
```http
GET /security/api-keys
```

---

## Predictive BI

### Get Revenue Forecast
```http
GET /predictive-bi/revenue-forecast
```

**Response:**
```json
{
  "ok": true,
  "forecast": [
    { "month": "2026-03", "predicted": 158000, "confidence": 88 },
    { "month": "2026-04", "predicted": 162000, "confidence": 85 }
  ]
}
```

### Get Churn Prediction
```http
GET /predictive-bi/churn-prediction
```

**Response:**
```json
{
  "ok": true,
  "churn": {
    "overall": 4.2,
    "bySegment": [
      { "segment": "vip", "churnRate": 1.8, "atRisk": 24 },
      { "segment": "regulars", "churnRate": 5.1, "atRisk": 156 }
    ]
  }
}
```

### Get LTV Analysis
```http
GET /predictive-bi/ltv-analysis
```

**Response:**
```json
{
  "ok": true,
  "ltv": {
    "average": 487.50,
    "bySegment": [
      { "segment": "vip", "ltv": 1240.00, "count": 450 },
      { "segment": "regulars", "ltv": 620.00, "count": 2100 }
    ]
  }
}
```

### Get Anomaly Detection
```http
GET /predictive-bi/anomaly-detection
```

### Get Cohort Retention
```http
GET /predictive-bi/cohort-retention
```

### Create Custom ML Model
```http
POST /predictive-bi/custom-model
Content-Type: application/json

{
  "modelType": "regression",
  "features": ["engagement_score", "revenue"],
  "target": "churn_probability"
}
```

---

## Developer Platform

### Get API Documentation
```http
GET /dev/api-docs
```

**Response:**
```json
{
  "ok": true,
  "docs": {
    "version": "2.0",
    "baseUrl": "https://api.aura.ai/klaviyo",
    "endpoints": 200,
    "authentication": "Bearer token",
    "rateLimit": "1000/hour"
  }
}
```

### Register Webhook
```http
POST /dev/webhooks/register
Content-Type: application/json

{
  "url": "https://example.com/webhooks/klaviyo",
  "events": ["flow.created", "flow.updated", "flow.published"]
}
```

**Response:**
```json
{
  "ok": true,
  "webhook": {
    "id": "webhook-789",
    "url": "https://example.com/webhooks/klaviyo",
    "events": ["flow.created", "flow.updated", "flow.published"],
    "status": "active",
    "created": "2026-02-11T00:00:00Z"
  }
}
```

### List Webhooks
```http
GET /dev/webhooks
```

### Test Code in Sandbox
```http
POST /dev/sandbox/test
Content-Type: application/json

{
  "code": "return flow.nodes.length > 5",
  "context": {
    "flow": { "nodes": [...] }
  }
}
```

### Get SDK Downloads
```http
GET /dev/sdk-downloads
```

**Response:**
```json
{
  "ok": true,
  "sdks": [
    { "language": "javascript", "version": "2.1.0", "downloads": 1240 },
    { "language": "python", "version": "2.0.5", "downloads": 840 }
  ]
}
```

---

## White-Label

### List Themes
```http
GET /white-label/themes
```

### Create Theme
```http
POST /white-label/themes
Content-Type: application/json

{
  "name": "Corporate Brand",
  "colors": {
    "primary": "#003366",
    "secondary": "#ff6600"
  }
}
```

### Update Branding
```http
PUT /white-label/branding
Content-Type: application/json

{
  "logo": "https://cdn.example.com/logo.png",
  "companyName": "Acme Corp",
  "primaryColor": "#003366"
}
```

### List Custom Domains
```http
GET /white-label/domains
```

---

## APM Monitoring

### Get Performance Metrics
```http
GET /apm/metrics
```

**Response:**
```json
{
  "ok": true,
  "metrics": {
    "avgResponseTime": 142,
    "p95ResponseTime": 380,
    "p99ResponseTime": 720,
    "requestsPerMinute": 1240,
    "errorRate": 0.12
  }
}
```

### Get Traces
```http
GET /apm/traces
```

**Response:**
```json
{
  "ok": true,
  "traces": [
    {
      "id": "trace-1",
      "endpoint": "/flows",
      "duration": 124,
      "timestamp": "2026-02-11T10:30:00Z",
      "spans": 4
    }
  ]
}
```

### Get Health Status
```http
GET /apm/health
```

**Response:**
```json
{
  "ok": true,
  "health": {
    "status": "healthy",
    "uptime": 99.97,
    "services": {
      "api": "healthy",
      "database": "healthy",
      "ai": "healthy",
      "cache": "healthy"
    }
  }
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "ok": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## Rate Limiting

- **Limit:** 1000 requests per hour
- **Headers:**
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 847`
  - `X-RateLimit-Reset: 1644602400`

---

## Webhooks

### Event Types

- `flow.created` - New flow created
- `flow.updated` - Flow modified
- `flow.deleted` - Flow removed
- `flow.published` - Flow activated
- `flow.paused` - Flow deactivated
- `segment.updated` - Segment modified
- `experiment.completed` - A/B test finished

### Webhook Payload

```json
{
  "event": "flow.created",
  "timestamp": "2026-02-11T10:00:00Z",
  "data": {
    "flowId": "flow-123",
    "name": "New Welcome Flow",
    "trigger": "signup"
  }
}
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
const AuraKlaviyo = require('@aura/klaviyo-sdk');

const client = new AuraKlaviyo({ apiKey: 'your-api-key' });

// List flows
const flows = await client.flows.list();

// Create flow
const newFlow = await client.flows.create({
  name: 'Abandoned Cart Recovery',
  trigger: 'abandoned_cart'
});

// AI generation
const content = await client.ai.generate({
  prompt: 'Generate welcome email subject line',
  model: 'gpt-4'
});
```

### Python

```python
from aura_klaviyo import KlaviyoClient

client = KlaviyoClient(api_key='your-api-key')

# List flows
flows = client.flows.list()

# Create flow
new_flow = client.flows.create(
    name='Abandoned Cart Recovery',
    trigger='abandoned_cart'
)

# Predictive BI
forecast = client.predictive_bi.revenue_forecast()
```

---

## Support

- **Documentation:** https://docs.aura.ai/klaviyo
- **API Status:** https://status.aura.ai
- **Support:** support@aura.ai
- **GitHub:** https://github.com/aurasystemsai/aura-core-monolith
