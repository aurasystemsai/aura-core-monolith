# Email Automation Builder - API Reference

**Version:** 2.0  
**Last Updated:** February 11, 2026  
**Total Endpoints:** 200  

---

## Table of Contents

1. [Authentication](#authentication)
2. [Campaign Management](#campaign-management) (28 endpoints)
3. [AI Content Generation](#ai-content-generation) (32 endpoints)
4. [Audience & Segmentation](#audience--segmentation) (26 endpoints)
5. [Multi-Channel Orchestration](#multi-channel-orchestration) (24 endpoints)
6. [Automation Workflows](#automation-workflows) (28 endpoints)
7. [Analytics & Performance](#analytics--performance) (30 endpoints)
8. [Testing & Optimization](#testing--optimization) (16 endpoints)
9. [Settings & Administration](#settings--administration) (16 endpoints)
10. [Error Handling](#error-handling)
11. [Rate Limits](#rate-limits)
12. [Webhooks](#webhooks)

---

## Authentication

All API requests require authentication using an API key in the `Authorization` header:

```http
Authorization: Bearer ea_your_api_key_here
```

### Generate API Key

```http
POST /api/email-automation/api-keys
```

**Request Body:**
```json
{
  "name": "Production API Key",
  "permissions": ["read", "write"]
}
```

**Response:**
```json
{
  "ok": true,
  "key": {
    "id": "key_1234567890",
    "name": "Production API Key",
    "key": "ea_abc123xyz789...",
    "permissions": ["read", "write"],
    "createdAt": "2026-02-11T10:30:00Z"
  }
}
```

---

## Campaign Management

### Core Campaign Operations

#### List Campaigns

```http
GET /api/email-automation/campaigns
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 100)
- `status` (string, optional): Filter by status (`draft`, `scheduled`, `sending`, `sent`, `cancelled`)
- `type` (string, optional): Filter by type (`regular`, `ab-test`, `automated`)
- `search` (string, optional): Search by name or subject

**Response:**
```json
{
  "ok": true,
  "campaigns": [
    {
      "id": 1,
      "name": "Summer Sale 2026",
      "subject": "Get 20% off this weekend only!",
      "preheader": "Limited time offer",
      "fromName": "Your Brand",
      "fromEmail": "hello@yourbrand.com",
      "replyTo": "support@yourbrand.com",
      "body": "<html>...</html>",
      "type": "regular",
      "status": "sent",
      "segmentId": 5,
      "listId": 2,
      "createdAt": "2026-02-10T09:00:00Z",
      "updatedAt": "2026-02-10T15:30:00Z",
      "scheduledAt": "2026-02-10T14:00:00Z",
      "sentAt": "2026-02-10T14:00:15Z",
      "stats": {
        "sent": 10000,
        "delivered": 9800,
        "opens": 2450,
        "uniqueOpens": 2100,
        "clicks": 735,
        "uniqueClicks": 650,
        "bounces": 200,
        "unsubscribes": 15,
        "spam": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

#### Create Campaign

```http
POST /api/email-automation/campaigns
```

**Request Body:**
```json
{
  "name": "Summer Sale 2026",
  "subject": "Get 20% off this weekend only!",
  "preheader": "Limited time offer",
  "fromName": "Your Brand",
  "fromEmail": "hello@yourbrand.com",
  "replyTo": "support@yourbrand.com",
  "body": "<html><body><h1>Summer Sale!</h1></body></html>",
  "type": "regular",
  "segmentId": 5,
  "listId": 2
}
```

**Response:**
```json
{
  "ok": true,
  "campaign": {
    "id": 48,
    "name": "Summer Sale 2026",
    "status": "draft",
    "createdAt": "2026-02-11T10:45:00Z",
    "stats": {
      "sent": 0,
      "delivered": 0,
      "opens": 0,
      "uniqueOpens": 0,
      "clicks": 0,
      "uniqueClicks": 0,
      "bounces": 0,
      "unsubscribes": 0,
      "spam": 0
    }
  }
}
```

#### Get Campaign

```http
GET /api/email-automation/campaigns/:id
```

**Response:**
```json
{
  "ok": true,
  "campaign": {
    "id": 1,
    "name": "Summer Sale 2026",
    "subject": "Get 20% off this weekend only!",
    "status": "sent",
    "stats": { ... }
  }
}
```

#### Update Campaign

```http
PUT /api/email-automation/campaigns/:id
```

**Request Body:**
```json
{
  "name": "Updated Campaign Name",
  "subject": "New subject line"
}
```

**Note:** Only draft campaigns can be updated.

#### Delete Campaign

```http
DELETE /api/email-automation/campaigns/:id
```

**Response:**
```json
{
  "ok": true,
  "message": "Campaign deleted"
}
```

#### Clone Campaign

```http
POST /api/email-automation/campaigns/:id/clone
```

**Response:**
```json
{
  "ok": true,
  "campaign": {
    "id": 49,
    "name": "Summer Sale 2026 (Copy)",
    "status": "draft",
    "createdAt": "2026-02-11T10:50:00Z"
  }
}
```

#### Schedule Campaign

```http
POST /api/email-automation/campaigns/:id/schedule
```

**Request Body:**
```json
{
  "scheduledAt": "2026-02-12T14:00:00Z"
}
```

**Response:**
```json
{
  "ok": true,
  "campaign": {
    "id": 1,
    "status": "scheduled",
    "scheduledAt": "2026-02-12T14:00:00Z"
  }
}
```

#### Send Campaign

```http
POST /api/email-automation/campaigns/:id/send
```

**Response:**
```json
{
  "ok": true,
  "campaign": {
    "id": 1,
    "status": "sending",
    "sentAt": "2026-02-11T10:55:00Z"
  },
  "message": "Campaign is being sent"
}
```

#### Pause Campaign

```http
POST /api/email-automation/campaigns/:id/pause
```

**Response:**
```json
{
  "ok": true,
  "campaign": {
    "id": 1,
    "status": "paused"
  }
}
```

#### Resume Campaign

```http
POST /api/email-automation/campaigns/:id/resume
```

#### Cancel Campaign

```http
POST /api/email-automation/campaigns/:id/cancel
```

#### Preview Campaign

```http
GET /api/email-automation/campaigns/:id/preview
```

**Response:**
```json
{
  "ok": true,
  "preview": {
    "subject": "Get 20% off this weekend only!",
    "preheader": "Limited time offer",
    "fromName": "Your Brand",
    "fromEmail": "hello@yourbrand.com",
    "body": "<html>...</html>",
    "rendered": "<!DOCTYPE html><html>...</html>"
  }
}
```

#### Test Send

```http
POST /api/email-automation/campaigns/:id/test-send
```

**Request Body:**
```json
{
  "recipients": ["test1@example.com", "test2@example.com"]
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Test email sent to 2 recipient(s)",
  "recipients": ["test1@example.com", "test2@example.com"]
}
```

### Template Management

#### List Templates

```http
GET /api/email-automation/templates
```

**Query Parameters:**
- `category` (string, optional): Filter by category
- `page` (integer, optional)
- `limit` (integer, optional)

#### Create Template

```http
POST /api/email-automation/templates
```

**Request Body:**
```json
{
  "name": "Summer Newsletter",
  "category": "newsletter",
  "html": "<html>...</html>",
  "json": { "design": "..." },
  "thumbnail": "https://example.com/thumbnail.png"
}
```

#### Get Template

```http
GET /api/email-automation/templates/:id
```

#### Update Template

```http
PUT /api/email-automation/templates/:id
```

#### Delete Template

```http
DELETE /api/email-automation/templates/:id
```

#### Duplicate Template

```http
POST /api/email-automation/templates/:id/duplicate
```

#### List Template Categories

```http
GET /api/email-automation/templates/categories
```

**Response:**
```json
{
  "ok": true,
  "categories": [
    { "id": "promotional", "name": "Promotional", "count": 12 },
    { "id": "transactional", "name": "Transactional", "count": 8 },
    { "id": "newsletter", "name": "Newsletter", "count": 15 }
  ]
}
```

#### Import Template

```http
POST /api/email-automation/templates/import
```

**Request Body:**
```json
{
  "html": "<html>...</html>",
  "name": "Imported Template"
}
```

#### Render Template

```http
GET /api/email-automation/templates/:id/render?data={"firstName":"John"}
```

**Response:**
```json
{
  "ok": true,
  "rendered": "<html>Hello John...</html>"
}
```

### Bulk Operations

#### Bulk Create Campaigns

```http
POST /api/email-automation/campaigns/bulk-create
```

**Request Body:**
```json
{
  "campaigns": [
    {
      "name": "Campaign 1",
      "subject": "Subject 1",
      "body": "Body 1"
    },
    {
      "name": "Campaign 2",
      "subject": "Subject 2",
      "body": "Body 2"
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "count": 2,
  "campaigns": [ ... ]
}
```

#### Bulk Schedule

```http
POST /api/email-automation/campaigns/bulk-schedule
```

**Request Body:**
```json
{
  "campaignIds": [1, 2, 3],
  "scheduledAt": "2026-02-12T14:00:00Z"
}
```

#### Bulk Cancel

```http
POST /api/email-automation/campaigns/bulk-cancel
```

#### Bulk Delete

```http
DELETE /api/email-automation/campaigns/bulk-delete
```

**Request Body:**
```json
{
  "campaignIds": [1, 2, 3]
}
```

#### Export Campaigns

```http
POST /api/email-automation/campaigns/export
```

**Request Body:**
```json
{
  "format": "csv",
  "filters": {
    "status": "sent",
    "type": "regular"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "format": "csv",
  "downloadUrl": "/exports/campaigns-1707651000000.csv",
  "expiresAt": "2026-02-18T10:30:00Z"
}
```

#### Import Campaigns

```http
POST /api/email-automation/campaigns/import
```

**Request Body:**
```json
{
  "data": [ ... ],
  "overwrite": false
}
```

**Response:**
```json
{
  "ok": true,
  "imported": 45,
  "skipped": 2,
  "errors": [
    { "row": 3, "error": "Missing required fields" }
  ]
}
```

### Version Control

#### List Campaign Versions

```http
GET /api/email-automation/campaigns/:id/versions
```

**Response:**
```json
{
  "ok": true,
  "versions": [
    {
      "versionId": 1,
      "createdAt": "2026-02-09T10:00:00Z",
      "createdBy": "user@example.com",
      "changes": "Initial version"
    },
    {
      "versionId": 2,
      "createdAt": "2026-02-10T14:30:00Z",
      "createdBy": "user@example.com",
      "changes": "Updated subject line"
    }
  ]
}
```

#### Create Version

```http
POST /api/email-automation/campaigns/:id/versions
```

#### Get Version

```http
GET /api/email-automation/campaigns/:id/versions/:versionId
```

#### Restore Version

```http
POST /api/email-automation/campaigns/:id/versions/:versionId/restore
```

---

## AI Content Generation

### Multi-Model Orchestration

#### Generate with Multiple Models

```http
POST /api/email-automation/ai/orchestration/generate
```

**Request Body:**
```json
{
  "prompt": "Write a compelling subject line for a summer sale",
  "models": ["gpt-4o-mini", "claude-3.5-sonnet"],
  "strategy": "best-of-n",
  "temperature": 0.7
}
```

**Strategies:**
- `best-of-n`: Run all models, return highest scoring result
- `ensemble`: Combine responses from all models
- `cascade`: Try models in order until threshold met

**Response:**
```json
{
  "ok": true,
  "result": {
    "selectedModel": "claude-3.5-sonnet",
    "content": "🌞 Summer Sale: 20% Off Everything for 48 Hours Only!",
    "score": 0.92,
    "strategy": "best-of-n"
  }
}
```

#### List Available Models

```http
GET /api/email-automation/ai/models/available
```

**Response:**
```json
{
  "ok": true,
  "models": [
    {
      "id": "gpt-4o-mini",
      "provider": "openai",
      "capabilities": ["content-generation", "subject-lines", "personalization"],
      "costPer1kTokens": 0.002,
      "recommended": ["subject-lines", "short-content"]
    },
    {
      "id": "claude-3.5-sonnet",
      "provider": "anthropic",
      "capabilities": ["content-generation", "analysis", "personalization"],
      "costPer1kTokens": 0.015,
      "recommended": ["email-body", "personalization"]
    }
  ]
}
```

#### Set Model Preference

```http
POST /api/email-automation/ai/models/set-preference
```

**Request Body:**
```json
{
  "task": "subject-line-generation",
  "model": "gpt-4o-mini",
  "fallbackModels": ["claude-3.5-sonnet", "gpt-4"]
}
```

#### Get Model Performance

```http
GET /api/email-automation/ai/models/performance?period=30d
```

**Response:**
```json
{
  "ok": true,
  "performance": [
    {
      "model": "gpt-4o-mini",
      "requests": 1247,
      "avgLatency": 856,
      "successRate": 99.2,
      "avgScore": 0.87,
      "totalCost": 2.45
    }
  ],
  "period": "30d"
}
```

#### Best-of-N Routing

```http
POST /api/email-automation/ai/routing/best-of-n
```

**Request Body:**
```json
{
  "prompt": "Write a welcome email",
  "n": 3,
  "model": "gpt-4o-mini"
}
```

**Response:**
```json
{
  "ok": true,
  "bestResult": {
    "content": "Welcome to our community!...",
    "score": 0.94,
    "attemptNumber": 2
  },
  "allResults": [ ... ]
}
```

#### Ensemble Routing

```http
POST /api/email-automation/ai/routing/ensemble
```

#### Cascade Routing

```http
POST /api/email-automation/ai/routing/cascade
```

**Request Body:**
```json
{
  "prompt": "Generate email content",
  "models": ["gpt-4o-mini", "claude-3.5-sonnet", "gpt-4"],
  "threshold": 0.8
}
```

### Subject Line Optimization

#### Generate Subject Lines

```http
POST /api/email-automation/ai/subject-lines/generate
```

**Request Body:**
```json
{
  "campaignGoal": "Promote summer sale",
  "productName": "Outdoor Furniture",
  "offer": "20% off",
  "tone": "professional",
  "count": 5,
  "model": "gpt-4o-mini"
}
```

**Response:**
```json
{
  "ok": true,
  "suggestions": [
    {
      "subject": "🌞 Summer Sale: 20% Off Outdoor Furniture",
      "predictedOpenRate": 0.285,
      "score": 0.92,
      "spamScore": 15
    },
    {
      "subject": "Transform Your Outdoor Space - Save 20% Today",
      "predictedOpenRate": 0.267,
      "score": 0.88,
      "spamScore": 12
    }
  ],
  "model": "gpt-4o-mini"
}
```

#### Analyze Subject Line

```http
POST /api/email-automation/ai/subject-lines/analyze
```

**Request Body:**
```json
{
  "subject": "FREE!!! Win Cash Prize NOW!!!"
}
```

**Response:**
```json
{
  "ok": true,
  "analysis": {
    "length": 32,
    "wordCount": 5,
    "hasEmoji": false,
    "hasNumbers": false,
    "hasQuestion": false,
    "allCaps": true,
    "spamScore": 85,
    "predictedOpenRate": 0.085,
    "recommendations": [
      "Avoid all caps to prevent spam filters",
      "High spam score, remove trigger words",
      "Subject is flagged as likely spam"
    ]
  }
}
```

#### Predict Open Rate

```http
POST /api/email-automation/ai/subject-lines/predict-open-rate
```

**Request Body:**
```json
{
  "subject": "Your exclusive weekend offer inside",
  "senderName": "Brand Name",
  "dayOfWeek": 3,
  "hour": 10
}
```

**Response:**
```json
{
  "ok": true,
  "prediction": {
    "subject": "Your exclusive weekend offer inside",
    "predictedOpenRate": 0.245,
    "confidence": 0.78,
    "factors": {
      "subjectLength": 37,
      "dayOfWeek": 3,
      "hour": 10,
      "senderName": "Brand Name"
    }
  }
}
```

#### Personalize Subject Line

```http
POST /api/email-automation/ai/subject-lines/personalize
```

**Request Body:**
```json
{
  "subject": "Check out our latest products",
  "personalizationFields": ["firstName", "location", "lastPurchase"],
  "model": "gpt-4o-mini"
}
```

**Response:**
```json
{
  "ok": true,
  "original": "Check out our latest products",
  "personalized": "{{firstName}}, new arrivals in {{location}} just for you!",
  "fields": ["firstName", "location"]
}
```

#### Suggest Emojis

```http
POST /api/email-automation/ai/subject-lines/emoji-suggest
```

**Request Body:**
```json
{
  "subject": "Big sale happening now"
}
```

**Response:**
```json
{
  "ok": true,
  "suggestions": [
    {
      "emoji": "🛍️",
      "keyword": "sale",
      "example": "🛍️ Big sale happening now"
    },
    {
      "emoji": "⏰",
      "keyword": "now",
      "example": "⏰ Big sale happening now"
    }
  ]
}
```

#### Get Best Practices

```http
GET /api/email-automation/ai/subject-lines/best-practices
```

### Email Body Generation

#### Generate Email Content

```http
POST /api/email-automation/ai/content/generate
```

**Request Body:**
```json
{
  "topic": "Summer furniture sale",
  "length": "medium",
  "tone": "professional",
  "includeCta": true,
  "model": "claude-3.5-sonnet"
}
```

**Lengths:** `short` (100-150 words), `medium` (200-300 words), `long` (400-600 words)

**Response:**
```json
{
  "ok": true,
  "content": "Dear valued customer,\n\nTransform your outdoor space...",
  "wordCount": 245,
  "readabilityScore": 72.5,
  "model": "claude-3.5-sonnet"
}
```

#### Rewrite Content

```http
POST /api/email-automation/ai/content/rewrite
```

**Request Body:**
```json
{
  "content": "Buy our products now!",
  "tone": "friendly",
  "model": "gpt-4o-mini"
}
```

#### Expand Content

```http
POST /api/email-automation/ai/content/expand
```

**Request Body:**
```json
{
  "content": "Welcome to our store.",
  "targetLength": 300,
  "model": "gpt-4"
}
```

#### Summarize Content

```http
POST /api/email-automation/ai/content/summarize
```

#### Translate Content

```http
POST /api/email-automation/ai/content/translate
```

**Request Body:**
```json
{
  "content": "Welcome to our store!",
  "targetLanguage": "Spanish",
  "model": "gpt-4"
}
```

**Response:**
```json
{
  "ok": true,
  "original": "Welcome to our store!",
  "translated": "¡Bienvenido a nuestra tienda!",
  "targetLanguage": "Spanish"
}
```

#### Personalize Content

```http
POST /api/email-automation/ai/content/personalize
```

**Request Body:**
```json
{
  "content": "Hello, check out these products!",
  "tokens": {
    "firstName": "John",
    "location": "New York",
    "favoriteCategory": "Electronics"
  }
}
```

### Content Quality & Optimization

#### Check Spam Score

```http
POST /api/email-automation/ai/spam-score
```

**Request Body:**
```json
{
  "subject": "LIMITED TIME OFFER!!!",
  "body": "Click here to claim your FREE prize!"
}
```

**Response:**
```json
{
  "ok": true,
  "spamScore": 78,
  "rating": "high",
  "recommendation": "Reduce spam trigger words and avoid excessive punctuation",
  "details": {
    "subjectScore": 45,
    "bodyScore": 33
  }
}
```

#### Calculate Readability Score

```http
POST /api/email-automation/ai/readability-score
```

**Response:**
```json
{
  "ok": true,
  "score": 72.5,
  "level": "Fairly Easy",
  "metrics": {
    "wordCount": 245,
    "sentenceCount": 12,
    "avgWordsPerSentence": "20.4"
  },
  "recommendation": "Readability is good"
}
```

#### Analyze Sentiment

```http
POST /api/email-automation/ai/sentiment-analysis
```

**Response:**
```json
{
  "ok": true,
  "sentiment": "positive",
  "score": 0.75,
  "details": {
    "positiveIndicators": 8,
    "negativeIndicators": 1
  }
}
```

#### Optimize Call-to-Action

```http
POST /api/email-automation/ai/cta-optimization
```

**Request Body:**
```json
{
  "currentCta": "Click here",
  "goal": "increase purchases",
  "model": "gpt-4o-mini"
}
```

**Response:**
```json
{
  "ok": true,
  "original": "Click here",
  "suggestions": [
    "Shop Now and Save 20%",
    "Get Your Discount Today",
    "Start Shopping",
    "Claim Your Offer",
    "Browse Sale Items"
  ]
}
```

#### Generate Image Alt Text

```http
POST /api/email-automation/api/image-alt-text
```

**Request Body:**
```json
{
  "imageUrl": "https://example.com/product.jpg",
  "context": "outdoor furniture",
  "model": "gpt-4-vision"
}
```

#### Get Content Recommendations

```http
GET /api/email-automation/ai/content/recommendations?campaignId=1
```

**Response:**
```json
{
  "ok": true,
  "recommendations": [
    {
      "type": "subject-line",
      "priority": "high",
      "suggestion": "Add personalization token {{firstName}} to subject line",
      "estimatedImpact": "+15% open rate"
    },
    {
      "type": "content-length",
      "priority": "medium",
      "suggestion": "Content is too long (450 words), consider reducing to 250-300 words",
      "estimatedImpact": "Better engagement"
    }
  ]
}
```

### AI Training & Feedback

#### Submit RLHF Feedback

```http
POST /api/email-automation/ai/rlhf/feedback
```

**Request Body:**
```json
{
  "requestId": "req_123",
  "rating": 5,
  "feedback": "Great subject line!",
  "selectedVariant": 2
}
```

**Response:**
```json
{
  "ok": true,
  "feedbackId": "fb_1707651234567",
  "message": "Feedback recorded for model improvement"
}
```

#### Create Fine-Tuning Job

```http
POST /api/email-automation/ai/fine-tune/create
```

**Request Body:**
```json
{
  "baseModel": "gpt-4o-mini",
  "trainingData": [ ... ],
  "validationData": [ ... ],
  "epochs": 3
}
```

**Response:**
```json
{
  "ok": true,
  "job": {
    "jobId": "ft_job_1707651234567",
    "baseModel": "gpt-4o-mini",
    "status": "pending",
    "trainingExamples": 1000,
    "validationExamples": 200,
    "epochs": 3,
    "createdAt": "2026-02-11T11:00:00Z",
    "estimatedCompletion": "2026-02-11T13:00:00Z"
  }
}
```

#### Get Fine-Tuning Status

```http
GET /api/email-automation/ai/fine-tune/:jobId/status
```

#### Get Active Learning Samples

```http
POST /api/email-automation/ai/active-learning/samples
```

**Request Body:**
```json
{
  "model": "gpt-4o-mini",
  "count": 10,
  "confidenceThreshold": 0.6
}
```

#### Batch Process

```http
POST /api/email-automation/ai/batch-process
```

**Request Body:**
```json
{
  "campaignIds": [1, 2, 3, 4, 5],
  "operation": "generate-subject-lines",
  "model": "gpt-4o-mini",
  "concurrency": 5
}
```

**Response:**
```json
{
  "ok": true,
  "batch": {
    "batchId": "batch_1707651234567",
    "operation": "generate-subject-lines",
    "model": "gpt-4o-mini",
    "totalItems": 5,
    "status": "processing",
    "completed": 0,
    "failed": 0,
    "createdAt": "2026-02-11T11:05:00Z",
    "estimatedCompletion": "2026-02-11T11:05:10Z"
  }
}
```

#### Get Batch Status

```http
GET /api/email-automation/ai/batch-process/:batchId/status
```

### AI Usage & Cost Tracking

#### Get Usage Statistics

```http
GET /api/email-automation/ai/usage/stats?period=30d
```

**Response:**
```json
{
  "ok": true,
  "stats": {
    "period": "30d",
    "totalRequests": 2395,
    "byModel": {
      "gpt-4o-mini": 1247,
      "claude-3.5-sonnet": 892,
      "gpt-4": 156,
      "gemini-pro": 100
    },
    "byTask": {
      "subject-line-generation": 845,
      "content-generation": 712,
      "optimization": 438,
      "analysis": 400
    },
    "avgResponseTime": 1024,
    "successRate": 99.4
  }
}
```

#### Get Cost Analysis

```http
GET /api/email-automation/ai/usage/costs?period=30d
```

**Response:**
```json
{
  "ok": true,
  "costs": {
    "period": "30d",
    "totalCost": 28.67,
    "byModel": {
      "gpt-4o-mini": 2.49,
      "claude-3.5-sonnet": 13.38,
      "gpt-4": 12.48,
      "gemini-pro": 0.32
    },
    "avgCostPerRequest": 0.012,
    "budget": 100,
    "percentUsed": 28.67
  }
}
```

#### List Prompt Templates

```http
GET /api/email-automation/ai/prompts
```

#### Create Prompt Template

```http
POST /api/email-automation/ai/prompts
```

**Request Body:**
```json
{
  "name": "Subject Line - Promotional",
  "template": "Generate {{count}} promotional email subject lines for {{product}} with a {{tone}} tone.",
  "category": "subject-line",
  "variables": ["count", "product", "tone"]
}
```

---

## Audience & Segmentation

### Segment Management

#### List Segments

```http
GET /api/email-automation/segments
```

**Query Parameters:**
- `type` (string, optional): Filter by type (`static`, `dynamic`, `behavioral`, `predictive`)
- `page`, `limit`

**Response:**
```json
{
  "ok": true,
  "segments": [
    {
      "id": 1,
      "name": "VIP Customers",
      "type": "dynamic",
      "conditions": {
        "totalPurchases": { "gte": 10 },
        "totalSpent": { "gte": 1000 }
      },
      "contactCount": 1247,
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-02-11T11:00:00Z"
    }
  ]
}
```

#### Create Segment

```http
POST /api/email-automation/segments
```

**Request Body:**
```json
{
  "name": "VIP Customers",
  "type": "dynamic",
  "conditions": {
    "totalPurchases": { "gte": 10 }
  },
  "description": "Customers with 10+ purchases"
}
```

#### Get Segment

```http
GET /api/email-automation/segments/:id
```

#### Update Segment

```http
PUT /api/email-automation/segments/:id
```

#### Delete Segment

```http
DELETE /api/email-automation/segments/:id
```

#### Get Segment Contacts

```http
GET /api/email-automation/segments/:id/contacts?page=1&limit=20
```

#### Get Segment Count

```http
GET /api/email-automation/segments/:id/count
```

**Response:**
```json
{
  "ok": true,
  "count": 1247,
  "segmentId": 1
}
```

#### Refresh Segment

```http
POST /api/email-automation/segments/:id/refresh
```

**Note:** Only dynamic segments can be refreshed.

### Behavioral Targeting

#### Create Behavioral Segment

```http
POST /api/email-automation/segments/behavioral
```

**Request Body:**
```json
{
  "name": "Recent Openers",
  "event": "email_opened",
  "conditions": {
    "timeframe": "last_7_days",
    "count": { "gte": 3 }
  }
}
```

#### List Behavioral Events

```http
GET /api/email-automation/behavioral-events
```

**Response:**
```json
{
  "ok": true,
  "events": [
    { "name": "email_opened", "count": 15234 },
    { "name": "email_clicked", "count": 8456 },
    { "name": "product_viewed", "count": 12367 },
    { "name": "product_purchased", "count": 2341 }
  ]
}
```

#### Track Behavioral Event

```http
POST /api/email-automation/behavioral-events
```

**Request Body:**
```json
{
  "contactId": 123,
  "event": "product_viewed",
  "metadata": {
    "productId": "prod_456",
    "category": "Electronics",
    "price": 299.99
  }
}
```

#### Get Contact Behavior

```http
GET /api/email-automation/contacts/:id/behavior
```

**Response:**
```json
{
  "ok": true,
  "behavior": {
    "contactId": 123,
    "events": [
      {
        "event": "email_opened",
        "count": 45,
        "lastOccurred": "2026-02-11T09:30:00Z"
      },
      {
        "event": "email_clicked",
        "count": 23,
        "lastOccurred": "2026-02-11T08:15:00Z"
      }
    ],
    "engagementScore": 78,
    "lastActive": "2026-02-11T09:30:00Z"
  }
}
```

#### Create Engagement Score Segment

```http
POST /api/email-automation/segments/engagement-score
```

**Request Body:**
```json
{
  "name": "Highly Engaged",
  "minScore": 70,
  "maxScore": 100
}
```

### Predictive Segments

#### Create Churn Prediction Segment

```http
POST /api/email-automation/segments/predictive/churn
```

**Request Body:**
```json
{
  "name": "High Churn Risk",
  "riskLevel": "high",
  "lookbackDays": 30
}
```

**Response:**
```json
{
  "ok": true,
  "segment": {
    "id": 10,
    "name": "High Churn Risk",
    "type": "predictive-churn",
    "riskLevel": "high",
    "lookbackDays": 30,
    "contactCount": 156,
    "accuracy": 0.87,
    "createdAt": "2026-02-11T11:10:00Z"
  }
}
```

#### Create Conversion Prediction Segment

```http
POST /api/email-automation/segments/predictive/conversion
```

**Request Body:**
```json
{
  "name": "Likely to Convert",
  "probabilityThreshold": 0.7
}
```

#### Create LTV Prediction Segment

```http
POST /api/email-automation/segments/predictive/ltv
```

**Request Body:**
```json
{
  "name": "High Value Prospects",
  "minLtv": 500
}
```

#### List Predictive Models

```http
GET /api/email-automation/segments/predictive/models
```

**Response:**
```json
{
  "ok": true,
  "models": [
    {
      "id": "churn-v2",
      "name": "Churn Prediction Model v2",
      "type": "churn",
      "accuracy": 0.87,
      "lastTrained": "2026-02-04T10:00:00Z"
    }
  ]
}
```

#### Train Predictive Model

```http
POST /api/email-automation/segments/predictive/train
```

**Request Body:**
```json
{
  "modelType": "churn",
  "trainingData": [ ... ]
}
```

### Contact Management

#### List Contacts

```http
GET /api/email-automation/contacts?page=1&limit=20&search=john
```

#### Create Contact

```http
POST /api/email-automation/contacts
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "customFields": {
    "company": "Acme Inc",
    "role": "Manager"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "contact": {
    "id": 501,
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "customFields": {
      "company": "Acme Inc",
      "role": "Manager"
    },
    "engagementScore": 50,
    "status": "subscribed",
    "createdAt": "2026-02-11T11:15:00Z",
    "updatedAt": "2026-02-11T11:15:00Z"
  }
}
```

#### Get Contact

```http
GET /api/email-automation/contacts/:id
```

#### Update Contact

```http
PUT /api/email-automation/contacts/:id
```

#### Delete Contact

```http
DELETE /api/email-automation/contacts/:id
```

#### Bulk Import Contacts

```http
POST /api/email-automation/contacts/bulk-import
```

**Request Body:**
```json
{
  "contacts": [
    {
      "email": "user1@example.com",
      "firstName": "User",
      "lastName": "One"
    },
    {
      "email": "user2@example.com",
      "firstName": "User",
      "lastName": "Two"
    }
  ],
  "overwriteExisting": false
}
```

**Response:**
```json
{
  "ok": true,
  "imported": 98,
  "skipped": 2,
  "errors": [
    { "row": 15, "error": "Missing email" },
    { "row": 42, "error": "Invalid email format" }
  ]
}
```

#### Bulk Update Contacts

```http
POST /api/email-automation/contacts/bulk-update
```

**Request Body:**
```json
{
  "contactIds": [1, 2, 3],
  "updates": {
    "status": "unsubscribed"
  }
}
```

#### Calculate Engagement Score

```http
POST /api/email-automation/contacts/:id/score
```

**Response:**
```json
{
  "ok": true,
  "contactId": 123,
  "score": 78,
  "factors": {
    "emailOpens": 0.3,
    "emailClicks": 0.25,
    "purchases": 0.25,
    "recency": 0.2
  }
}
```

### List Management

#### List Lists

```http
GET /api/email-automation/lists
```

#### Create List

```http
POST /api/email-automation/lists
```

**Request Body:**
```json
{
  "name": "Newsletter Subscribers",
  "description": "Main newsletter list"
}
```

#### Get List

```http
GET /api/email-automation/lists/:id
```

#### Update List

```http
PUT /api/email-automation/lists/:id
```

#### Delete List

```http
DELETE /api/email-automation/lists/:id
```

#### Add Contacts to List

```http
POST /api/email-automation/lists/:id/contacts/add
```

**Request Body:**
```json
{
  "contactIds": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "ok": true,
  "list": {
    "id": 2,
    "name": "Newsletter Subscribers",
    "contactCount": 1505
  },
  "added": 5
}
```

#### Remove Contacts from List

```http
POST /api/email-automation/lists/:id/contacts/remove
```

---

## Multi-Channel Orchestration

### Email Delivery (ESP Integration)

#### Send Email

```http
POST /api/email-automation/send/email
```

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Your order confirmation",
  "html": "<html>...</html>",
  "fromName": "Your Brand",
  "fromEmail": "hello@yourbrand.com",
  "esp": "sendgrid"
}
```

**Supported ESPs:** `sendgrid`, `aws-ses`, `mailgun`, `postmark`

**Response:**
```json
{
  "ok": true,
  "delivery": {
    "messageId": "msg_1707651234567",
    "esp": "sendgrid",
    "to": "recipient@example.com",
    "subject": "Your order confirmation",
    "status": "sent",
    "sentAt": "2026-02-11T11:20:00Z",
    "estimatedDelivery": "2026-02-11T11:20:05Z"
  }
}
```

#### Send Batch Email

```http
POST /api/email-automation/send/email/batch
```

**Request Body:**
```json
{
  "recipients": [
    "user1@example.com",
    "user2@example.com",
    "user3@example.com"
  ],
  "subject": "Batch email",
  "html": "<html>...</html>",
  "fromName": "Your Brand",
  "fromEmail": "hello@yourbrand.com",
  "esp": "sendgrid"
}
```

#### Get Delivery Status

```http
GET /api/email-automation/send/status/:messageId
```

**Response:**
```json
{
  "ok": true,
  "status": {
    "messageId": "msg_1707651234567",
    "status": "delivered",
    "deliveredAt": "2026-02-11T11:20:05Z",
    "events": [
      { "event": "sent", "timestamp": "2026-02-11T11:20:00Z" },
      { "event": "delivered", "timestamp": "2026-02-11T11:20:05Z" }
    ]
  }
}
```

#### Send Test Email

```http
POST /api/email-automation/send/test
```

**Request Body:**
```json
{
  "to": "test@example.com",
  "subject": "Test Email",
  "html": "<h1>Test</h1>"
}
```

#### List ESP Integrations

```http
GET /api/email-automation/esp/integrations
```

**Response:**
```json
{
  "ok": true,
  "integrations": [
    {
      "id": "sendgrid",
      "name": "SendGrid",
      "status": "active",
      "apiKeySet": true,
      "dailyQuota": 100000,
      "dailyUsage": 12457
    },
    {
      "id": "aws-ses",
      "name": "AWS SES",
      "status": "active",
      "apiKeySet": true,
      "dailyQuota": 50000,
      "dailyUsage": 5234
    }
  ]
}
```

#### Configure ESP

```http
POST /api/email-automation/esp/configure
```

**Request Body:**
```json
{
  "esp": "sendgrid",
  "apiKey": "SG.xxx...",
  "settings": {
    "region": "us-east-1"
  }
}
```

#### Get ESP Health

```http
GET /api/email-automation/esp/health
```

**Response:**
```json
{
  "ok": true,
  "health": {
    "sendgrid": { "status": "healthy", "latency": 145, "successRate": 99.8 },
    "aws-ses": { "status": "healthy", "latency": 89, "successRate": 99.9 },
    "mailgun": { "status": "inactive", "latency": null, "successRate": null }
  }
}
```

#### ESP Failover

```http
POST /api/email-automation/esp/failover
```

**Request Body:**
```json
{
  "from": "sendgrid",
  "to": "aws-ses"
}
```

### SMS Delivery

#### Send SMS

```http
POST /api/email-automation/send/sms
```

**Request Body:**
```json
{
  "to": "+1234567890",
  "message": "Your verification code is 123456",
  "provider": "twilio"
}
```

**Supported Providers:** `twilio`, `plivo`, `aws-sns`

#### Send Batch SMS

```http
POST /api/email-automation/send/sms/batch
```

#### List SMS Providers

```http
GET /api/email-automation/sms/providers
```

#### Configure SMS Provider

```http
POST /api/email-automation/sms/configure
```

### Push Notifications

#### Send Push Notification

```http
POST /api/email-automation/send/push
```

**Request Body:**
```json
{
  "userId": "user_123",
  "title": "New message",
  "body": "You have a new message from support",
  "data": {
    "action": "open_chat",
    "chatId": "chat_456"
  }
}
```

#### Send Batch Push

```http
POST /api/email-automation/send/push/batch
```

#### Get Push Subscriptions

```http
GET /api/email-automation/push/subscriptions
```

**Response:**
```json
{
  "ok": true,
  "stats": {
    "total": 12456,
    "active": 10234,
    "inactive": 2222,
    "platforms": {
      "ios": 5678,
      "android": 5234,
      "web": 1322
    }
  }
}
```

### WhatsApp Business

#### Send WhatsApp Message

```http
POST /api/email-automation/send/whatsapp
```

**Request Body:**
```json
{
  "to": "+1234567890",
  "message": "Your order has shipped!",
  "templateId": "order-update"
}
```

#### List WhatsApp Templates

```http
GET /api/email-automation/whatsapp/templates
```

### In-App Messages

#### Send In-App Message

```http
POST /api/email-automation/send/in-app
```

**Request Body:**
```json
{
  "userId": "user_123",
  "title": "Special Offer",
  "body": "Get 20% off your next purchase",
  "action": {
    "type": "link",
    "url": "/special-offers"
  }
}
```

#### Get User Messages

```http
GET /api/email-automation/in-app/messages/:userId
```

### Cross-Channel Journeys

#### Create Journey

```http
POST /api/email-automation/journeys
```

**Request Body:**
```json
{
  "name": "Welcome Series",
  "channels": ["email", "sms", "push"],
  "triggers": [
    { "event": "contact_created" }
  ],
  "steps": [
    {
      "id": 1,
      "channel": "email",
      "delay": 0,
      "template": "welcome-1"
    },
    {
      "id": 2,
      "channel": "sms",
      "delay": 86400,
      "message": "Thanks for joining!"
    },
    {
      "id": 3,
      "channel": "push",
      "delay": 259200,
      "template": "push-welcome"
    }
  ]
}
```

#### List Journeys

```http
GET /api/email-automation/journeys
```

#### Get Journey

```http
GET /api/email-automation/journeys/:id
```

#### Activate Journey

```http
POST /api/email-automation/journeys/:id/activate
```

---

## Automation Workflows

### Workflow Management

#### List Workflows

```http
GET /api/email-automation/workflows?status=active&page=1&limit=20
```

**Response:**
```json
{
  "ok": true,
  "workflows": [
    {
      "id": 1,
      "name": "Welcome Series",
      "trigger": {
        "type": "contact_created"
      },
      "actions": [
        {
          "type": "send_email",
          "templateId": "welcome-1",
          "delay": 0
        },
        {
          "type": "wait",
          "duration": 86400
        },
        {
          "type": "send_email",
          "templateId": "welcome-2",
          "delay": 86400
        }
      ],
      "status": "active",
      "executionCount": 1247,
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-02-11T11:00:00Z"
    }
  ]
}
```

#### Create Workflow

```http
POST /api/email-automation/workflows
```

**Request Body:**
```json
{
  "name": "Abandoned Cart Recovery",
  "trigger": {
    "type": "cart_abandoned",
    "delay": 3600
  },
  "actions": [
    {
      "type": "send_email",
      "templateId": "cart-reminder",
      "delay": 0
    },
    {
      "type": "conditional_split",
      "conditions": [
        {
          "field": "cartValue",
          "operator": "gt",
          "value": 100
        }
      ],
      "truePath": [
        {
          "type": "send_email",
          "templateId": "high-value-offer"
        }
      ],
      "falsePath": [
        {
          "type": "send_email",
          "templateId": "standard-offer"
        }
      ]
    }
  ],
  "description": "Recover abandoned carts with targeted emails"
}
```

#### Get Workflow

```http
GET /api/email-automation/workflows/:id
```

#### Update Workflow

```http
PUT /api/email-automation/workflows/:id
```

#### Delete Workflow

```http
DELETE /api/email-automation/workflows/:id
```

#### Activate Workflow

```http
POST /api/email-automation/workflows/:id/activate
```

#### Deactivate Workflow

```http
POST /api/email-automation/workflows/:id/deactivate
```

#### Test Workflow

```http
POST /api/email-automation/workflows/:id/test
```

**Request Body:**
```json
{
  "testData": {
    "contactId": 123,
    "cartValue": 150
  }
}
```

**Response:**
```json
{
  "ok": true,
  "execution": {
    "executionId": "exec_1707651234567",
    "workflowId": 1,
    "mode": "test",
    "status": "completed",
    "steps": [
      {
        "stepId": 1,
        "action": "send_email",
        "status": "completed",
        "duration": 245
      },
      {
        "stepId": 2,
        "action": "conditional_split",
        "status": "completed",
        "duration": 12
      }
    ],
    "startedAt": "2026-02-11T11:25:00Z",
    "completedAt": "2026-02-11T11:25:02Z"
  }
}
```

#### Duplicate Workflow

```http
POST /api/email-automation/workflows/:id/duplicate
```

### Triggers

#### List Available Triggers

```http
GET /api/email-automation/workflows/triggers/available
```

**Response:**
```json
{
  "ok": true,
  "triggers": [
    {
      "id": "contact_created",
      "name": "Contact Created",
      "description": "Triggered when a new contact is added",
      "category": "contacts"
    },
    {
      "id": "email_opened",
      "name": "Email Opened",
      "description": "Triggered when a contact opens an email",
      "category": "engagement"
    },
    {
      "id": "link_clicked",
      "name": "Link Clicked",
      "description": "Triggered when a link is clicked",
      "category": "engagement"
    },
    {
      "id": "purchase_completed",
      "name": "Purchase Completed",
      "description": "Triggered when a purchase is made",
      "category": "ecommerce"
    },
    {
      "id": "cart_abandoned",
      "name": "Cart Abandoned",
      "description": "Triggered when a cart is abandoned",
      "category": "ecommerce"
    }
  ]
}
```

#### Test Trigger

```http
POST /api/email-automation/workflows/triggers/test
```

**Request Body:**
```json
{
  "triggerId": "email_opened",
  "testData": {
    "contactId": 123,
    "campaignId": 1
  }
}
```

### Actions

#### List Available Actions

```http
GET /api/email-automation/workflows/actions/available
```

**Response:**
```json
{
  "ok": true,
  "actions": [
    {
      "id": "send_email",
      "name": "Send Email",
      "description": "Send an email to the contact",
      "category": "messaging",
      "requiredFields": ["templateId", "delay"]
    },
    {
      "id": "send_sms",
      "name": "Send SMS",
      "description": "Send an SMS message",
      "category": "messaging",
      "requiredFields": ["message", "delay"]
    },
    {
      "id": "add_to_segment",
      "name": "Add to Segment",
      "description": "Add contact to a segment",
      "category": "segments",
      "requiredFields": ["segmentId"]
    },
    {
      "id": "wait",
      "name": "Wait",
      "description": "Wait for a specified duration",
      "category": "flow",
      "requiredFields": ["duration"]
    },
    {
      "id": "conditional_split",
      "name": "Conditional Split",
      "description": "Split flow based on conditions",
      "category": "flow",
      "requiredFields": ["conditions"]
    }
  ]
}
```

#### Add Action to Workflow

```http
POST /api/email-automation/workflows/:id/actions/add
```

**Request Body:**
```json
{
  "action": {
    "type": "send_email",
    "templateId": "welcome-1",
    "delay": 0
  }
}
```

#### Remove Action from Workflow

```http
DELETE /api/email-automation/workflows/:id/actions/:actionId
```

### Workflow Execution & Analytics

#### List Workflow Executions

```http
GET /api/email-automation/workflows/:id/executions?page=1&limit=20&status=completed
```

**Response:**
```json
{
  "ok": true,
  "executions": [
    {
      "executionId": "exec_1",
      "workflowId": 1,
      "contactId": 123,
      "status": "completed",
      "startedAt": "2026-02-11T10:00:00Z",
      "completedAt": "2026-02-11T10:05:00Z"
    }
  ]
}
```

#### Get Workflow Analytics

```http
GET /api/email-automation/workflows/:id/analytics
```

**Response:**
```json
{
  "ok": true,
  "analytics": {
    "workflowId": 1,
    "totalExecutions": 1247,
    "successfulExecutions": 1189,
    "failedExecutions": 58,
    "successRate": 95.3,
    "avgDuration": 3420,
    "byDay": [
      {
        "date": "2026-02-11",
        "executions": 178
      },
      {
        "date": "2026-02-10",
        "executions": 156
      }
    ]
  }
}
```

#### Stop Workflow Execution

```http
POST /api/email-automation/workflows/:id/stop-execution
```

**Request Body:**
```json
{
  "executionId": "exec_123"
}
```

### Workflow Templates

#### List Workflow Templates

```http
GET /api/email-automation/workflows/templates
```

**Response:**
```json
{
  "ok": true,
  "templates": [
    {
      "id": "welcome-series",
      "name": "Welcome Series",
      "description": "3-email welcome sequence for new subscribers",
      "category": "onboarding",
      "estimatedSetup": "5 minutes"
    },
    {
      "id": "abandoned-cart",
      "name": "Abandoned Cart Recovery",
      "description": "Multi-channel cart abandonment workflow",
      "category": "ecommerce",
      "estimatedSetup": "10 minutes"
    }
  ]
}
```

#### Get Workflow Template

```http
GET /api/email-automation/workflows/templates/:id
```

#### Use Workflow Template

```http
POST /api/email-automation/workflows/templates/:id/use
```

**Request Body:**
```json
{
  "name": "My Welcome Series"
}
```

### Goals & Conversion Tracking

#### Create Workflow Goal

```http
POST /api/email-automation/workflows/:id/goals
```

**Request Body:**
```json
{
  "goal": "conversion_rate",
  "targetValue": 5
}
```

#### List Workflow Goals

```http
GET /api/email-automation/workflows/:id/goals
```

**Response:**
```json
{
  "ok": true,
  "goals": [
    {
      "id": 1,
      "goal": "email_open_rate",
      "targetValue": 25,
      "currentValue": 22.5,
      "progress": 90
    },
    {
      "id": 2,
      "goal": "conversion_rate",
      "targetValue": 5,
      "currentValue": 4.2,
      "progress": 84
    }
  ]
}
```

#### Track Goal

```http
POST /api/email-automation/workflows/:id/goals/:goalId/track
```

**Request Body:**
```json
{
  "value": 4.5
}
```

### Workflow Versioning

#### List Workflow Versions

```http
GET /api/email-automation/workflows/:id/versions
```

#### Create Workflow Version

```http
POST /api/email-automation/workflows/:id/versions
```

---

## Analytics & Performance

### Campaign Analytics

#### Get Campaign Analytics

```http
GET /api/email-automation/analytics/campaigns/:id
```

**Response:**
```json
{
  "ok": true,
  "analytics": {
    "campaignId": 1,
    "sent": 10000,
    "delivered": 9800,
    "deliveryRate": 98.0,
    "opens": 2450,
    "uniqueOpens": 2100,
    "openRate": 21.4,
    "clicks": 735,
    "uniqueClicks": 650,
    "clickRate": 6.6,
    "clickToOpenRate": 31.0,
    "bounces": 200,
    "bounceRate": 2.0,
    "unsubscribes": 15,
    "unsubscribeRate": 0.15,
    "spam": 5,
    "spamRate": 0.05
  }
}
```

#### Get Engagement Timeline

```http
GET /api/email-automation/analytics/campaigns/:id/engagement-timeline
```

**Response:**
```json
{
  "ok": true,
  "timeline": [
    { "hour": 0, "opens": 120, "clicks": 35 },
    { "hour": 1, "opens": 85, "clicks": 22 },
    { "hour": 2, "opens": 45, "clicks": 12 }
  ]
}
```

#### Get Top Links

```http
GET /api/email-automation/analytics/campaigns/:id/top-links
```

**Response:**
```json
{
  "ok": true,
  "links": [
    {
      "url": "https://example.com/product1",
      "clicks": 245,
      "uniqueClicks": 198
    },
    {
      "url": "https://example.com/product2",
      "clicks": 189,
      "uniqueClicks": 156
    }
  ]
}
```

#### Get Device Breakdown

```http
GET /api/email-automation/analytics/campaigns/:id/devices
```

#### Get Location Breakdown

```http
GET /api/email-automation/analytics/campaigns/:id/locations
```

#### Get Email Client Breakdown

```http
GET /api/email-automation/analytics/campaigns/:id/email-clients
```

### Engagement Metrics

#### Get Engagement Overview

```http
GET /api/email-automation/analytics/engagement/overview?period=30d
```

**Response:**
```json
{
  "ok": true,
  "overview": {
    "period": "30d",
    "totalSent": 125000,
    "avgOpenRate": 22.5,
    "avgClickRate": 6.8,
    "avgBounceRate": 1.8,
    "avgUnsubscribeRate": 0.12,
    "engagementScore": 78
  }
}
```

#### Get Engagement Trends

```http
GET /api/email-automation/analytics/engagement/trends?metric=openRate&period=30d
```

**Response:**
```json
{
  "ok": true,
  "metric": "openRate",
  "trends": [
    { "date": "2026-02-01", "value": 21.5 },
    { "date": "2026-02-02", "value": 22.1 },
    { "date": "2026-02-03", "value": 23.8 }
  ]
}
```

#### Get Engagement Heatmap

```http
GET /api/email-automation/analytics/engagement/heatmap
```

**Response:**
```json
{
  "ok": true,
  "heatmap": [
    {
      "day": "Mon",
      "hours": [
        { "hour": 0, "opens": 45 },
        { "hour": 1, "opens": 23 },
        { "hour": 2, "opens": 12 }
      ]
    }
  ]
}
```

#### Get Top Performing Segments

```http
GET /api/email-automation/analytics/engagement/top-segments
```

### Revenue Attribution

#### Get Campaign Revenue

```http
GET /api/email-automation/analytics/revenue/campaigns/:id
```

**Response:**
```json
{
  "ok": true,
  "revenue": {
    "campaignId": 1,
    "totalRevenue": 15678.50,
    "orders": 347,
    "avgOrderValue": 45.19,
    "revenuePerRecipient": 1.57,
    "roi": 4.5,
    "attributionModel": "last-click"
  }
}
```

#### Get Revenue Overview

```http
GET /api/email-automation/analytics/revenue/overview?period=30d
```

**Response:**
```json
{
  "ok": true,
  "overview": {
    "period": "30d",
    "totalRevenue": 234567.89,
    "orders": 5234,
    "avgOrderValue": 44.82,
    "revenuePerEmail": 1.88,
    "roi": 5.2,
    "topCampaigns": [
      { "id": 1, "name": "Summer Sale", "revenue": 45678.90 },
      { "id": 2, "name": "Product Launch", "revenue": 34567.80 }
    ]
  }
}
```

#### List Attribution Models

```http
GET /api/email-automation/analytics/revenue/attribution-models
```

**Response:**
```json
{
  "ok": true,
  "models": [
    {
      "model": "last-click",
      "name": "Last Click",
      "description": "Full credit to last touchpoint",
      "revenue": 234567.89
    },
    {
      "model": "first-click",
      "name": "First Click",
      "description": "Full credit to first touchpoint",
      "revenue": 189234.56
    },
    {
      "model": "linear",
      "name": "Linear",
      "description": "Equal credit to all touchpoints",
      "revenue": 207891.23
    }
  ]
}
```

#### Custom Attribution

```http
POST /api/email-automation/analytics/revenue/custom-attribution
```

**Request Body:**
```json
{
  "weights": {
    "first-touch": 0.3,
    "mid-touch": 0.2,
    "last-touch": 0.5
  },
  "period": "30d"
}
```

### Predictive Analytics

#### Get Churn Predictions

```http
GET /api/email-automation/analytics/predictive/churn
```

**Response:**
```json
{
  "ok": true,
  "predictions": {
    "totalContacts": 25000,
    "churnRisk": {
      "high": 1250,
      "medium": 3750,
      "low": 20000
    },
    "predictedChurnRate": 5.0,
    "estimatedRevenueLoss": 45678.90,
    "topChurnFactors": [
      {
        "factor": "Low engagement (< 2 opens in 30d)",
        "impact": 0.35
      },
      {
        "factor": "No purchases in 90d",
        "impact": 0.28
      }
    ]
  }
}
```

#### Get LTV Predictions

```http
GET /api/email-automation/analytics/predictive/ltv?segmentId=1
```

**Response:**
```json
{
  "ok": true,
  "ltv": {
    "segmentId": 1,
    "avgPredictedLtv": 456.78,
    "distribution": {
      "low": { "range": "0-100", "count": 5000, "avgLtv": 45.23 },
      "medium": { "range": "100-500", "count": 15000, "avgLtv": 287.45 },
      "high": { "range": "500+", "count": 5000, "avgLtv": 1234.56 }
    },
    "factors": [
      { "factor": "Purchase frequency", "weight": 0.35 },
      { "factor": "Avg order value", "weight": 0.30 }
    ]
  }
}
```

#### Predict Next Purchase

```http
GET /api/email-automation/analytics/predictive/next-purchase?contactId=123
```

**Response:**
```json
{
  "ok": true,
  "prediction": {
    "contactId": 123,
    "probability": 0.78,
    "estimatedDate": "2026-02-25T00:00:00Z",
    "confidence": 0.85,
    "recommendedProducts": [
      { "id": "prod_1", "name": "Product A", "probability": 0.65 },
      { "id": "prod_2", "name": "Product B", "probability": 0.48 }
    ]
  }
}
```

#### Predict Best Channel

```http
GET /api/email-automation/analytics/predictive/best-channel?contactId=123
```

**Response:**
```json
{
  "ok": true,
  "recommendations": {
    "contactId": 123,
    "channels": [
      { "channel": "email", "probability": 0.85, "avgEngagement": 0.72 },
      { "channel": "sms", "probability": 0.62, "avgEngagement": 0.58 }
    ],
    "recommended": "email",
    "confidence": 0.89
  }
}
```

#### Predict Optimal Send Time

```http
GET /api/email-automation/analytics/predictive/send-time?contactId=123
```

**Response:**
```json
{
  "ok": true,
  "optimal": {
    "contactId": 123,
    "optimalDay": "Tuesday",
    "optimalHour": 10,
    "predictedOpenRate": 28.5,
    "confidence": 0.82,
    "alternatives": [
      { "day": "Wednesday", "hour": 14, "predictedOpenRate": 26.7 }
    ]
  }
}
```

### Cohort Analysis

#### List Cohorts

```http
GET /api/email-automation/analytics/cohorts?metric=retention&period=30d
```

**Response:**
```json
{
  "ok": true,
  "metric": "retention",
  "cohorts": [
    {
      "cohort": "2026-01",
      "size": 1250,
      "values": [
        { "period": 0, "value": 100 },
        { "period": 1, "value": 85.2 },
        { "period": 2, "value": 76.8 }
      ]
    }
  ]
}
```

#### Get Cohort Details

```http
GET /api/email-automation/analytics/cohorts/:id
```

#### Create Cohort

```http
POST /api/email-automation/analytics/cohorts/create
```

**Request Body:**
```json
{
  "name": "January 2026 Signups",
  "criteria": {
    "signupMonth": "2026-01"
  },
  "metric": "retention"
}
```

### Real-Time Analytics

#### Get Active Campaigns

```http
GET /api/email-automation/analytics/realtime/active-campaigns
```

**Response:**
```json
{
  "ok": true,
  "campaigns": [
    {
      "id": 1,
      "name": "Flash Sale",
      "sent": 5234,
      "opens": 1247,
      "clicks": 389,
      "openRate": 23.8,
      "clickRate": 7.4
    }
  ],
  "timestamp": "2026-02-11T11:30:00Z"
}
```

#### Get Real-Time Events

```http
GET /api/email-automation/analytics/realtime/events
```

**Response:**
```json
{
  "ok": true,
  "events": [
    {
      "id": "event_1",
      "type": "open",
      "campaignId": 1,
      "timestamp": "2026-02-11T11:30:00Z"
    },
    {
      "id": "event_2",
      "type": "click",
      "campaignId": 1,
      "timestamp": "2026-02-11T11:29:58Z"
    }
  ]
}
```

#### Get Real-Time Stats

```http
GET /api/email-automation/analytics/realtime/stats
```

**Response:**
```json
{
  "ok": true,
  "stats": {
    "last60Seconds": {
      "opens": 47,
      "clicks": 12,
      "bounces": 2
    },
    "last5Minutes": {
      "opens": 234,
      "clicks": 67,
      "bounces": 8
    },
    "timestamp": "2026-02-11T11:30:00Z"
  }
}
```

### Benchmarks & Comparisons

#### Get Industry Benchmarks

```http
GET /api/email-automation/analytics/benchmarks?industry=ecommerce
```

**Response:**
```json
{
  "ok": true,
  "benchmarks": {
    "industry": "ecommerce",
    "openRate": { "industry": 21.5, "yourAverage": 23.2 },
    "clickRate": { "industry": 2.6, "yourAverage": 3.1 },
    "bounceRate": { "industry": 1.8, "yourAverage": 1.5 },
    "unsubscribeRate": { "industry": 0.25, "yourAverage": 0.18 }
  }
}
```

#### Compare Campaigns

```http
GET /api/email-automation/analytics/compare?campaignIds=1,2,3
```

**Response:**
```json
{
  "ok": true,
  "comparison": [
    {
      "campaignId": 1,
      "openRate": 23.8,
      "clickRate": 7.4,
      "conversionRate": 3.2,
      "revenue": 15678.50
    },
    {
      "campaignId": 2,
      "openRate": 21.5,
      "clickRate": 6.1,
      "conversionRate": 2.8,
      "revenue": 12345.00
    }
  ]
}
```

#### Get Summary Report

```http
GET /api/email-automation/analytics/reports/summary?period=30d
```

**Response:**
```json
{
  "ok": true,
  "summary": {
    "period": "30d",
    "campaignsSent": 47,
    "totalEmails": 125000,
    "avgOpenRate": 22.5,
    "avgClickRate": 6.8,
    "totalRevenue": 234567.89,
    "roi": 5.2,
    "topPerformingCampaign": {
      "id": 1,
      "name": "Summer Sale",
      "openRate": 34.2
    },
    "improvementAreas": [
      "Click rate is below benchmark",
      "Mobile open rate could be improved"
    ]
  }
}
```

#### Export Report

```http
POST /api/email-automation/analytics/reports/export
```

**Request Body:**
```json
{
  "reportType": "campaign-performance",
  "format": "pdf",
  "period": "30d"
}
```

**Response:**
```json
{
  "ok": true,
  "report": {
    "reportId": "report_1707651234567",
    "type": "campaign-performance",
    "format": "pdf",
    "period": "30d",
    "status": "generating",
    "downloadUrl": null,
    "expiresAt": "2026-02-18T11:30:00Z"
  }
}
```

#### Get Report Status

```http
GET /api/email-automation/analytics/reports/:reportId/status
```

---

## Testing & Optimization

### A/B Testing

#### Create A/B Test

```http
POST /api/email-automation/ab-tests
```

**Request Body:**
```json
{
  "name": "Subject Line Test",
  "campaignId": 1,
  "variants": [
    {
      "name": "Variant A",
      "subject": "Get 20% off today"
    },
    {
      "name": "Variant B",
      "subject": "Limited time: Save 20%"
    }
  ],
  "testType": "subject",
  "sampleSize": 20,
  "duration": 86400
}
```

**Test Types:** `subject`, `content`, `send-time`, `from-name`

**Response:**
```json
{
  "ok": true,
  "test": {
    "id": 5,
    "name": "Subject Line Test",
    "campaignId": 1,
    "testType": "subject",
    "variants": [
      {
        "id": "variant_0",
        "name": "Variant A",
        "subject": "Get 20% off today",
        "sent": 0,
        "opens": 0,
        "clicks": 0,
        "conversions": 0
      },
      {
        "id": "variant_1",
        "name": "Variant B",
        "subject": "Limited time: Save 20%",
        "sent": 0,
        "opens": 0,
        "clicks": 0,
        "conversions": 0
      }
    ],
    "sampleSize": 20,
    "duration": 86400,
    "status": "draft",
    "createdAt": "2026-02-11T11:35:00Z"
  }
}
```

#### List A/B Tests

```http
GET /api/email-automation/ab-tests?status=running
```

#### Get A/B Test

```http
GET /api/email-automation/ab-tests/:id
```

#### Start A/B Test

```http
POST /api/email-automation/ab-tests/:id/start
```

**Response:**
```json
{
  "ok": true,
  "test": {
    "id": 5,
    "status": "running",
    "startedAt": "2026-02-11T11:40:00Z",
    "estimatedCompletion": "2026-02-12T11:40:00Z"
  }
}
```

#### Stop A/B Test

```http
POST /api/email-automation/ab-tests/:id/stop
```

**Response:**
```json
{
  "ok": true,
  "test": {
    "id": 5,
    "status": "completed",
    "completedAt": "2026-02-11T14:23:00Z"
  },
  "winner": {
    "id": "variant_1",
    "name": "Variant B",
    "openRate": "28.5%",
    "clickRate": "8.2%"
  }
}
```

#### Get A/B Test Results

```http
GET /api/email-automation/ab-tests/:id/results
```

**Response:**
```json
{
  "ok": true,
  "results": {
    "testId": 5,
    "testType": "subject",
    "status": "completed",
    "variants": [
      {
        "id": "variant_0",
        "name": "Variant A",
        "sent": 1000,
        "opens": 245,
        "clicks": 68,
        "conversions": 12,
        "openRate": "24.50",
        "clickRate": "6.80",
        "conversionRate": "1.20"
      },
      {
        "id": "variant_1",
        "name": "Variant B",
        "sent": 1000,
        "opens": 285,
        "clicks": 82,
        "conversions": 15,
        "openRate": "28.50",
        "clickRate": "8.20",
        "conversionRate": "1.50"
      }
    ],
    "winner": "variant_1",
    "confidence": 95.5,
    "uplift": 23.4
  }
}
```

#### Apply Winner

```http
POST /api/email-automation/ab-tests/:id/apply-winner
```

**Response:**
```json
{
  "ok": true,
  "message": "Winner applied to campaign",
  "winnerId": "variant_1",
  "appliedAt": "2026-02-11T14:30:00Z"
}
```

### Multivariate Testing

#### Create Multivariate Test

```http
POST /api/email-automation/multivariate-tests
```

**Request Body:**
```json
{
  "name": "Full Email Test",
  "elements": [
    {
      "element": "subject",
      "variants": ["Subject A", "Subject B"]
    },
    {
      "element": "cta",
      "variants": ["Shop Now", "Get Started"]
    },
    {
      "element": "image",
      "variants": ["image1.jpg", "image2.jpg"]
    }
  ]
}
```

#### Get Multivariate Test Results

```http
GET /api/email-automation/multivariate-tests/:id/results
```

**Response:**
```json
{
  "ok": true,
  "results": {
    "testId": 3,
    "bestCombination": {
      "subject": "Subject B",
      "cta": "Get Started",
      "image": "image1.jpg",
      "openRate": 28.5,
      "clickRate": 8.2
    },
    "allCombinations": [
      { "combination": "A-A-A", "openRate": 24.5, "clickRate": 6.8 },
      { "combination": "B-B-A", "openRate": 28.5, "clickRate": 8.2 }
    ]
  }
}
```

### Send Time Optimization

#### Analyze Send Times

```http
POST /api/email-automation/send-time-optimization/analyze
```

**Request Body:**
```json
{
  "segmentId": 5,
  "lookbackDays": 30
}
```

**Response:**
```json
{
  "ok": true,
  "analysis": {
    "segmentId": 5,
    "optimalSendTimes": [
      {
        "day": "Tuesday",
        "hour": 10,
        "predictedOpenRate": 28.5,
        "confidence": 0.89
      },
      {
        "day": "Wednesday",
        "hour": 14,
        "predictedOpenRate": 26.7,
        "confidence": 0.84
      }
    ],
    "worstSendTimes": [
      { "day": "Saturday", "hour": 23, "predictedOpenRate": 12.3 },
      { "day": "Sunday", "hour": 3, "predictedOpenRate": 10.8 }
    ],
    "lookbackDays": 30
  }
}
```

#### Schedule with Optimal Time

```http
POST /api/email-automation/send-time-optimization/schedule
```

**Request Body:**
```json
{
  "campaignId": 1,
  "useOptimal": true
}
```

### Frequency Capping

#### Create Frequency Cap

```http
POST /api/email-automation/frequency-caps
```

**Request Body:**
```json
{
  "name": "Global Cap",
  "maxEmails": 7,
  "period": "week",
  "segments": []
}
```

**Periods:** `day`, `week`, `month`

**Response:**
```json
{
  "ok": true,
  "cap": {
    "id": "cap_1707651234567",
    "name": "Global Cap",
    "maxEmails": 7,
    "period": "week",
    "segments": [],
    "status": "active",
    "createdAt": "2026-02-11T11:45:00Z"
  }
}
```

#### List Frequency Caps

```http
GET /api/email-automation/frequency-caps
```

#### Check Frequency Cap

```http
GET /api/email-automation/frequency-caps/check/:contactId
```

**Response:**
```json
{
  "ok": true,
  "check": {
    "contactId": 123,
    "currentCount": 3,
    "limit": 7,
    "period": "week",
    "canSend": true,
    "nextResetAt": "2026-02-15T00:00:00Z"
  }
}
```

#### Get Frequency Cap Violations

```http
GET /api/email-automation/frequency-caps/violations
```

**Response:**
```json
{
  "ok": true,
  "violations": [
    {
      "contactId": 123,
      "count": 8,
      "limit": 7,
      "period": "week",
      "lastViolation": "2026-02-11T11:45:00Z"
    }
  ]
}
```

---

## Settings & Administration

### Sender Profiles

#### List Sender Profiles

```http
GET /api/email-automation/sender-profiles
```

**Response:**
```json
{
  "ok": true,
  "profiles": [
    {
      "id": "profile_123",
      "name": "Marketing Team",
      "fromName": "Brand Marketing",
      "fromEmail": "marketing@yourbrand.com",
      "replyTo": "support@yourbrand.com",
      "description": "Primary marketing sender",
      "verified": true,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

#### Create Sender Profile

```http
POST /api/email-automation/sender-profiles
```

**Request Body:**
```json
{
  "name": "Marketing Team",
  "fromName": "Brand Marketing",
  "fromEmail": "marketing@yourbrand.com",
  "replyTo": "support@yourbrand.com",
  "description": "Primary marketing sender"
}
```

#### Get Sender Profile

```http
GET /api/email-automation/sender-profiles/:id
```

#### Update Sender Profile

```http
PUT /api/email-automation/sender-profiles/:id
```

#### Delete Sender Profile

```http
DELETE /api/email-automation/sender-profiles/:id
```

### Domain Authentication

#### List Domains

```http
GET /api/email-automation/domains
```

**Response:**
```json
{
  "ok": true,
  "domains": [
    {
      "id": "domain_123",
      "domain": "yourbrand.com",
      "spfVerified": true,
      "dkimVerified": true,
      "dmarcVerified": false,
      "status": "partial",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

#### Add Domain

```http
POST /api/email-automation/domains
```

**Request Body:**
```json
{
  "domain": "yourbrand.com"
}
```

**Response:**
```json
{
  "ok": true,
  "domain": {
    "id": "domain_456",
    "domain": "yourbrand.com",
    "spfVerified": false,
    "dkimVerified": false,
    "dmarcVerified": false,
    "status": "pending",
    "createdAt": "2026-02-11T11:50:00Z"
  }
}
```

#### Get Domain

```http
GET /api/email-automation/domains/:id
```

#### Verify Domain

```http
POST /api/email-automation/domains/:id/verify
```

**Response:**
```json
{
  "ok": true,
  "domain": {
    "id": "domain_456",
    "domain": "yourbrand.com",
    "spfVerified": true,
    "dkimVerified": true,
    "dmarcVerified": false,
    "status": "partial",
    "verifiedAt": "2026-02-11T11:55:00Z"
  },
  "message": "SPF and DKIM verified, DMARC pending"
}
```

#### Get DNS Records

```http
GET /api/email-automation/domains/:id/dns-records
```

**Response:**
```json
{
  "ok": true,
  "records": {
    "spf": {
      "type": "TXT",
      "host": "@",
      "value": "v=spf1 include:_spf.example.com ~all",
      "verified": true
    },
    "dkim": {
      "type": "TXT",
      "host": "default._domainkey",
      "value": "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...",
      "verified": true
    },
    "dmarc": {
      "type": "TXT",
      "host": "_dmarc",
      "value": "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com",
      "verified": false
    }
  }
}
```

#### Delete Domain

```http
DELETE /api/email-automation/domains/:id
```

### API Keys

#### List API Keys

```http
GET /api/email-automation/api-keys
```

**Response:**
```json
{
  "ok": true,
  "keys": [
    {
      "id": "key_123",
      "name": "Production API Key",
      "key": "ea_abc123...",
      "permissions": ["read", "write"],
      "createdAt": "2026-01-15T10:00:00Z",
      "lastUsed": "2026-02-11T11:30:00Z"
    }
  ]
}
```

#### Create API Key

```http
POST /api/email-automation/api-keys
```

**Request Body:**
```json
{
  "name": "Production API Key",
  "permissions": ["read", "write"]
}
```

**Response:**
```json
{
  "ok": true,
  "key": {
    "id": "key_456",
    "name": "Production API Key",
    "key": "ea_xyz789abc123...",
    "permissions": ["read", "write"],
    "createdAt": "2026-02-11T12:00:00Z",
    "lastUsed": null
  }
}
```

**Note:** The full API key is only shown once during creation.

#### Delete API Key

```http
DELETE /api/email-automation/api-keys/:id
```

#### Rotate API Key

```http
POST /api/email-automation/api-keys/:id/rotate
```

**Response:**
```json
{
  "ok": true,
  "key": {
    "id": "key_456",
    "key": "ea_new_key_here...",
    "rotatedAt": "2026-02-11T12:05:00Z"
  }
}
```

### Webhooks

#### List Webhooks

```http
GET /api/email-automation/webhooks
```

**Response:**
```json
{
  "ok": true,
  "webhooks": [
    {
      "id": "webhook_123",
      "url": "https://yourapp.com/webhooks/email",
      "events": ["email.sent", "email.opened", "email.clicked"],
      "secret": "whsec_...",
      "status": "active",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

#### Create Webhook

```http
POST /api/email-automation/webhooks
```

**Request Body:**
```json
{
  "url": "https://yourapp.com/webhooks/email",
  "events": ["email.sent", "email.opened", "email.clicked"],
  "secret": "your_webhook_secret"
}
```

#### Test Webhook

```http
POST /api/email-automation/webhooks/test
```

**Request Body:**
```json
{
  "url": "https://yourapp.com/webhooks/email",
  "event": "email.opened"
}
```

**Response:**
```json
{
  "ok": true,
  "test": {
    "url": "https://yourapp.com/webhooks/email",
    "event": "email.opened",
    "status": "success",
    "responseCode": 200,
    "responseTime": 145,
    "testedAt": "2026-02-11T12:10:00Z"
  }
}
```

#### Delete Webhook

```http
DELETE /api/email-automation/webhooks/:id
```

#### List Webhook Events

```http
GET /api/email-automation/webhooks/events
```

**Response:**
```json
{
  "ok": true,
  "events": [
    { "name": "email.sent", "description": "Email was sent" },
    { "name": "email.delivered", "description": "Email was delivered" },
    { "name": "email.opened", "description": "Email was opened" },
    { "name": "email.clicked", "description": "Link was clicked" },
    { "name": "email.bounced", "description": "Email bounced" },
    { "name": "email.unsubscribed", "description": "Contact unsubscribed" },
    { "name": "contact.created", "description": "New contact created" },
    { "name": "segment.joined", "description": "Contact joined segment" },
    { "name": "workflow.started", "description": "Workflow execution started" }
  ]
}
```

### Compliance

#### GDPR Export

```http
GET /api/email-automation/compliance/gdpr/export/:contactId
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "contactId": 123,
    "personalData": {
      "email": "contact@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2025-02-11T10:00:00Z"
    },
    "activity": {
      "emailsSent": 47,
      "emailsOpened": 23,
      "linksClicked": 12
    },
    "exportedAt": "2026-02-11T12:15:00Z"
  }
}
```

#### GDPR Delete

```http
POST /api/email-automation/compliance/gdpr/delete/:contactId
```

**Response:**
```json
{
  "ok": true,
  "contactId": 123,
  "message": "Contact data deleted per GDPR request",
  "deletedAt": "2026-02-11T12:20:00Z"
}
```

#### CAN-SPAM Unsubscribe

```http
GET /api/email-automation/compliance/can-spam/unsubscribe/:contactId
```

**Response:**
```json
{
  "ok": true,
  "contactId": 123,
  "status": "unsubscribed",
  "message": "Successfully unsubscribed"
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "ok": false,
  "error": "Error message describing what went wrong",
  "errorCode": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid API key
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Codes

- `INVALID_REQUEST`: Request parameters are invalid
- `UNAUTHORIZED`: Authentication failed
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INSUFFICIENT_CREDITS`: Not enough credits
- `VALIDATION_ERROR`: Input validation failed
- `ESP_ERROR`: ESP integration error
- `AI_MODEL_ERROR`: AI model error

---

## Rate Limits

API requests are subject to rate limits:

- **Default:** 1,000 requests per hour
- **Burst:** 100 requests per minute
- **AI Endpoints:** 100 requests per hour

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1707654600
```

When rate limit is exceeded:

```json
{
  "ok": false,
  "error": "Rate limit exceeded",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

---

## Webhooks

### Webhook Payload Format

```json
{
  "id": "evt_1707651234567",
  "event": "email.opened",
  "timestamp": "2026-02-11T12:25:00Z",
  "data": {
    "messageId": "msg_1707651234567",
    "campaignId": 1,
    "contactId": 123,
    "email": "contact@example.com",
    "openedAt": "2026-02-11T12:25:00Z",
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.0.2.1"
  }
}
```

### Webhook Signature Verification

Webhooks include an `X-Webhook-Signature` header for verification:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

---

## Pagination

List endpoints support pagination:

**Request:**
```http
GET /api/email-automation/campaigns?page=2&limit=50
```

**Response:**
```json
{
  "ok": true,
  "campaigns": [ ... ],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 247,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## Filtering & Sorting

Many list endpoints support filtering and sorting:

**Filtering:**
```http
GET /api/email-automation/campaigns?status=sent&type=regular
```

**Sorting:**
```http
GET /api/email-automation/campaigns?sort=-createdAt
```

Use `-` prefix for descending order.

---

## Versioning

The API uses versioning in the URL path:

```http
GET /api/v2/email-automation/campaigns
```

Current version: **v2**

---

## Support

For API support:
- Email: api-support@aura-core.ai
- Documentation: https://docs.aura-core.ai/email-automation
- Status: https://status.aura-core.ai

---

**Last Updated:** February 11, 2026  
**API Version:** 2.0  
**Total Endpoints:** 200
