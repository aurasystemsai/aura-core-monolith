# Loyalty & Referral Programs - API Reference

**Week 8: Documentation - Part 1**  
**Version:** 1.0.0  
**Last Updated:** February 11, 2026  
**Total Endpoints:** 201  
**Base URL:** `/api/loyalty-referral`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Loyalty Programs API](#loyalty-programs-api) (25 endpoints)
6. [Referral Campaigns API](#referral-campaigns-api) (28 endpoints)
7. [Rewards API](#rewards-api) (24 endpoints)
8. [Tiers API](#tiers-api) (22 endpoints)
9. [Members API](#members-api) (30 endpoints)
10. [Workflows API](#workflows-api) (18 endpoints)
11. [Analytics API](#analytics-api) (26 endpoints)
12. [Settings API](#settings-api) (28 endpoints)
13. [Webhooks](#webhooks)
14. [SDK Examples](#sdk-examples)

---

## Overview

The Loyalty & Referral Programs API provides a comprehensive platform for managing customer loyalty programs, referral campaigns, rewards, tiered membership, automated workflows, and advanced analytics. This world-class API powers 44 frontend tabs across 7 categories with AI-powered optimization, predictive analytics, and real-time monitoring.

### Key Features

- **201 Endpoints** across 8 categories with full CRUD operations
- **AI-Powered Optimization** using Claude 3.5 Sonnet for program recommendations
- **Real-Time Analytics** with <200ms response times for instant insights
- **Predictive Models** for churn prediction, CLV forecasting, and revenue projections
- **Automated Workflows** with multi-step action sequences and trigger-based execution
- **Multi-Tier Systems** with dynamic tier progression and benefit management
- **Referral Tracking** with viral coefficient calculation and conversion analytics
- **Comprehensive Rewards** with inventory management and redemption tracking

---

## Authentication

All API requests require authentication using API keys generated through the Settings API.

### API Key Header

```http
Authorization: Bearer sk_live_your_api_key_here
```

### Generating API Keys

```javascript
POST /api/loyalty-referral/settings/api-keys
Content-Type: application/json

{
  "name": "Production API Key",
  "permissions": ["read", "write"],
  "rateLimit": 1000
}

// Response
{
  "ok": true,
  "apiKey": {
    "id": "key_abc123",
    "key": "sk_live_4f8b2c9d1e6a3f7b",
    "name": "Production API Key",
    "permissions": ["read", "write"],
    "rateLimit": 1000,
    "createdAt": "2026-02-11T10:00:00Z"
  }
}
```

### Permission Levels

- **read**: GET requests only
- **write**: POST, PUT, DELETE requests
- **admin**: Full access including settings management

---

## Rate Limiting

API requests are rate-limited per API key to ensure system stability.

### Default Limits

- **Standard Tier**: 100 requests/minute
- **Professional Tier**: 500 requests/minute
- **Enterprise Tier**: 1,000 requests/minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1707649200
```

### Rate Limit Response (429)

```json
{
  "ok": false,
  "error": "Rate limit exceeded",
  "retryAfter": 30
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages.

### Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "ok": false,
  "error": "Validation error: name is required",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "name",
    "required": true
  }
}
```

---

## Loyalty Programs API

Manage loyalty programs with 25 comprehensive endpoints.

### 1. List All Programs

```http
GET /api/loyalty-referral/loyalty/programs
```

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `paused`, `ended`)
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "ok": true,
  "programs": [
    {
      "id": "prog_abc123",
      "name": "VIP Rewards Program",
      "description": "Exclusive rewards for VIP customers",
      "pointsPerDollar": 10,
      "status": "active",
      "startDate": "2026-01-01",
      "endDate": "2026-12-31",
      "activeMembers": 1247,
      "totalPointsAwarded": 524830,
      "redemptionRate": 0.34,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-02-11T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### 2. Create Program

```http
POST /api/loyalty-referral/loyalty/programs
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Premium Rewards",
  "description": "Earn points on every purchase",
  "pointsPerDollar": 15,
  "status": "active",
  "startDate": "2026-03-01",
  "endDate": "2026-12-31",
  "autoEnroll": true,
  "welcomeBonus": 500
}
```

**Response:**
```json
{
  "ok": true,
  "program": {
    "id": "prog_xyz789",
    "name": "Premium Rewards",
    "description": "Earn points on every purchase",
    "pointsPerDollar": 15,
    "status": "active",
    "startDate": "2026-03-01",
    "endDate": "2026-12-31",
    "autoEnroll": true,
    "welcomeBonus": 500,
    "activeMembers": 0,
    "totalPointsAwarded": 0,
    "redemptionRate": 0,
    "createdAt": "2026-02-11T10:30:00Z",
    "updatedAt": "2026-02-11T10:30:00Z"
  }
}
```

### 3. Get Program by ID

```http
GET /api/loyalty-referral/loyalty/programs/:id
```

**Response:** Returns single program object (same format as list item)

### 4. Update Program

```http
PUT /api/loyalty-referral/loyalty/programs/:id
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Program Name",
  "pointsPerDollar": 20,
  "status": "paused"
}
```

**Response:** Returns updated program object

### 5. Delete Program

```http
DELETE /api/loyalty-referral/loyalty/programs/:id
```

**Response:**
```json
{
  "ok": true,
  "message": "Program deleted successfully"
}
```

### 6. Get Program Analytics

```http
GET /api/loyalty-referral/loyalty/programs/:id/analytics
```

**Query Parameters:**
- `period` (optional): Time period (`7d`, `30d`, `90d`, `1y`, default: `30d`)

**Response:**
```json
{
  "ok": true,
  "analytics": {
    "activeMembers": 1247,
    "totalPoints": 524830,
    "pointsRedeemed": 178522,
    "redemptionRate": 0.34,
    "averagePointsPerMember": 421,
    "engagementRate": 0.67,
    "retentionRate": 0.82,
    "newMembersThisPeriod": 143,
    "churnedMembersThisPeriod": 28,
    "topRewards": [
      {
        "rewardId": "rew_abc",
        "name": "$10 Store Credit",
        "redemptions": 234
      }
    ],
    "pointsAwarded": {
      "total": 524830,
      "bySource": {
        "purchases": 412394,
        "referrals": 67230,
        "bonuses": 45206
      }
    }
  }
}
```

### 7. Get Program Performance

```http
GET /api/loyalty-referral/loyalty/programs/:id/performance
```

**Response:**
```json
{
  "ok": true,
  "performance": {
    "engagementRate": 0.67,
    "retentionRate": 0.82,
    "averageOrderValue": 87.43,
    "repeatPurchaseRate": 0.54,
    "customerLifetimeValue": 1243.56,
    "revenuePerMember": 456.78,
    "roi": 3.2,
    "trends": [
      {
        "date": "2026-02-01",
        "activeMembers": 1204,
        "engagement": 0.65,
        "retention": 0.80
      }
    ]
  }
}
```

### 8. Optimize Program (AI)

```http
POST /api/loyalty-referral/loyalty/programs/:id/optimize
Content-Type: application/json
```

**Request Body:**
```json
{
  "aiModel": "claude-3-5-sonnet",
  "analysisDepth": "comprehensive",
  "focus": ["engagement", "retention", "revenue"]
}
```

**Response:**
```json
{
  "ok": true,
  "optimization": {
    "recommendations": [
      {
        "type": "points_adjustment",
        "suggestion": "Increase pointsPerDollar from 10 to 12",
        "projectedImpact": {
          "engagementIncrease": 0.15,
          "revenueIncrease": 0.08
        },
        "confidence": 0.87,
        "reasoning": "Analysis of 10,000+ similar programs shows 12 points/dollar maximizes engagement without oversaturation"
      },
      {
        "type": "tier_benefit",
        "suggestion": "Add exclusive early access to sales for Gold tier",
        "projectedImpact": {
          "tierUpgrades": 124,
          "retentionIncrease": 0.12
        },
        "confidence": 0.92,
        "reasoning": "Exclusive benefits drive 31% more tier progressions in retail sectors"
      }
    ],
    "overallProjection": {
      "revenueIncrease": "12-18%",
      "memberGrowth": "200-250 new members/month",
      "retentionImprovement": "8-14%"
    }
  }
}
```

### Additional Loyalty Program Endpoints (9-25)

```
9.  GET    /api/loyalty-referral/loyalty/programs/:id/members
10. POST   /api/loyalty-referral/loyalty/programs/:id/members/bulk-enroll
11. GET    /api/loyalty-referral/loyalty/programs/:id/tiers
12. POST   /api/loyalty-referral/loyalty/programs/:id/tiers
13. GET    /api/loyalty-referral/loyalty/programs/:id/rewards
14. POST   /api/loyalty-referral/loyalty/programs/:id/rewards
15. GET    /api/loyalty-referral/loyalty/programs/:id/activity
16. GET    /api/loyalty-referral/loyalty/programs/:id/leaderboard
17. POST   /api/loyalty-referral/loyalty/programs/:id/duplicate
18. POST   /api/loyalty-referral/loyalty/programs/:id/pause
19. POST   /api/loyalty-referral/loyalty/programs/:id/resume
20. POST   /api/loyalty-referral/loyalty/programs/:id/export
21. GET    /api/loyalty-referral/loyalty/programs/:id/roi
22. GET    /api/loyalty-referral/loyalty/programs/:id/trends
23. POST   /api/loyalty-referral/loyalty/programs/:id/ab-test
24. GET    /api/loyalty-referral/loyalty/programs/:id/ab-test/:testId
25. POST   /api/loyalty-referral/loyalty/programs/:id/forecast
```

---

## Referral Campaigns API

Manage referral campaigns with 28 comprehensive endpoints.

### 1. List All Campaigns

```http
GET /api/loyalty-referral/referral/campaigns
```

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `paused`, `ended`)
- `limit` (optional): Results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "ok": true,
  "campaigns": [
    {
      "id": "camp_abc123",
      "name": "Friend Referral Bonus",
      "description": "Refer a friend and both get $10 off",
      "referralCode": "FRIEND10",
      "referrerReward": 1000,
      "refereeReward": 1000,
      "maxReferrals": 10,
      "status": "active",
      "totalReferrals": 847,
      "successfulReferrals": 523,
      "conversionRate": 0.618,
      "totalRevenueGenerated": 26435.20,
      "viralCoefficient": 1.34,
      "createdAt": "2026-01-15T00:00:00Z"
    }
  ]
}
```

### 2. Create Campaign

```http
POST /api/loyalty-referral/referral/campaigns
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "VIP Referral Program",
  "description": "Exclusive referral rewards for VIP members",
  "referrerReward": 2000,
  "refereeReward": 1500,
  "rewardType": "points",
  "maxReferrals": 20,
  "status": "active",
  "startDate": "2026-03-01",
  "endDate": "2026-12-31",
  "requirements": {
    "minPurchaseAmount": 50,
    "validDays": 30
  }
}
```

**Response:**
```json
{
  "ok": true,
  "campaign": {
    "id": "camp_xyz789",
    "name": "VIP Referral Program",
    "description": "Exclusive referral rewards for VIP members",
    "referralCode": "VIP2026",
    "referrerReward": 2000,
    "refereeReward": 1500,
    "rewardType": "points",
    "maxReferrals": 20,
    "status": "active",
    "startDate": "2026-03-01",
    "endDate": "2026-12-31",
    "totalReferrals": 0,
    "successfulReferrals": 0,
    "conversionRate": 0,
    "createdAt": "2026-02-11T11:00:00Z"
  }
}
```

### 3. Get Campaign by ID

```http
GET /api/loyalty-referral/referral/campaigns/:id
```

### 4. Update Campaign

```http
PUT /api/loyalty-referral/referral/campaigns/:id
Content-Type: application/json
```

### 5. Delete Campaign

```http
DELETE /api/loyalty-referral/referral/campaigns/:id
```

### 6. List Campaign Referrals

```http
GET /api/loyalty-referral/referral/campaigns/:id/referrals
```

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `converted`, `expired`)
- `fromDate` (optional): Filter referrals after this date
- `toDate` (optional): Filter referrals before this date

**Response:**
```json
{
  "ok": true,
  "referrals": [
    {
      "id": "ref_abc123",
      "campaignId": "camp_abc123",
      "referralCode": "FRIEND10-USER123",
      "referrerEmail": "referrer@example.com",
      "referrerName": "John Doe",
      "refereeEmail": "referee@example.com",
      "refereeName": "Jane Smith",
      "status": "converted",
      "conversionDate": "2026-02-10T14:30:00Z",
      "orderValue": 125.50,
      "rewardsIssued": true,
      "createdAt": "2026-02-08T10:00:00Z"
    }
  ]
}
```

### 7. Create Referral

```http
POST /api/loyalty-referral/referral/campaigns/:id/referrals
Content-Type: application/json
```

**Request Body:**
```json
{
  "referrerEmail": "john@example.com",
  "refereeEmail": "jane@example.com",
  "refereePhone": "+1234567890",
  "customMessage": "Check out this amazing store!"
}
```

**Response:**
```json
{
  "ok": true,
  "referral": {
    "id": "ref_xyz789",
    "campaignId": "camp_abc123",
    "referralCode": "FRIEND10-XYZ789",
    "referrerEmail": "john@example.com",
    "refereeEmail": "jane@example.com",
    "refereePhone": "+1234567890",
    "status": "pending",
    "referralLink": "https://store.com/r/FRIEND10-XYZ789",
    "expiresAt": "2026-03-13T10:00:00Z",
    "createdAt": "2026-02-11T10:00:00Z"
  }
}
```

### 8. Get Campaign Analytics

```http
GET /api/loyalty-referral/referral/campaigns/:id/analytics
```

**Response:**
```json
{
  "ok": true,
  "analytics": {
    "totalReferrals": 847,
    "successfulReferrals": 523,
    "conversionRate": 0.618,
    "averageOrderValue": 87.32,
    "totalRevenueGenerated": 45647.36,
    "rewardsIssued": {
      "referrer": 523000,
      "referee": 523000
    },
    "viralCoefficient": 1.34,
    "shareRate": 0.42,
    "clickThroughRate": 0.15,
    "topReferrers": [
      {
        "email": "superreferrer@example.com",
        "referrals": 47,
        "conversions": 32,
        "revenue": 2840.50
      }
    ],
    "timeline": [
      {
        "date": "2026-02-01",
        "referrals": 32,
        "conversions": 19
      }
    ]
  }
}
```

### 9. Get Campaign Performance

```http
GET /api/loyalty-referral/referral/campaigns/:id/performance
```

**Response:**
```json
{
  "ok": true,
  "performance": {
    "viralCoefficient": 1.34,
    "shareRate": 0.42,
    "clickThroughRate": 0.15,
    "conversionRate": 0.618,
    "averageTimeToConversion": "2.3 days",
    "customerAcquisitionCost": 23.45,
    "customerLifetimeValue": 456.78,
    "roi": 19.47,
    "referralLoop": {
      "generation1": 847,
      "generation2": 412,
      "generation3": 156
    }
  }
}
```

### 10. Optimize Campaign (AI)

```http
POST /api/loyalty-referral/referral/campaigns/:id/optimize
Content-Type: application/json
```

**Request Body:**
```json
{
  "aiModel": "claude-3-5-sonnet",
  "focus": ["conversion", "viral_coefficient", "roi"]
}
```

**Response:**
```json
{
  "ok": true,
  "optimization": {
    "suggestedRewards": {
      "referrer": 1500,
      "referee": 1200,
      "reasoning": "Asymmetric rewards with higher referrer compensation drive 23% more referrals"
    },
    "projectedROI": 24.3,
    "expectedViralCoefficient": 1.68,
    "recommendations": [
      {
        "type": "timing",
        "suggestion": "Send referral reminder email 3 days after initial share",
        "impact": "+18% conversion rate"
      }
    ]
  }
}
```

### Additional Referral Campaign Endpoints (11-28)

```
11. PUT    /api/loyalty-referral/referral/campaigns/:id/referrals/:refId/convert
12. POST   /api/loyalty-referral/referral/campaigns/:id/referrals/:refId/expire
13. GET    /api/loyalty-referral/referral/campaigns/:id/leaderboard
14. POST   /api/loyalty-referral/referral/campaigns/:id/duplicate
15. GET    /api/loyalty-referral/referral/campaigns/:id/viral-coefficient
16. GET    /api/loyalty-referral/referral/campaigns/:id/funnel
17. POST   /api/loyalty-referral/referral/campaigns/:id/email-reminder
18. GET    /api/loyalty-referral/referral/campaigns/:id/share-metrics
19. POST   /api/loyalty-referral/referral/campaigns/:id/ab-test
20. GET    /api/loyalty-referral/referral/campaigns/:id/fraud-check
21. POST   /api/loyalty-referral/referral/campaigns/:id/pause
22. POST   /api/loyalty-referral/referral/campaigns/:id/resume
23. GET    /api/loyalty-referral/referral/campaigns/:id/network-graph
24. POST   /api/loyalty-referral/referral/campaigns/:id/export
25. GET    /api/loyalty-referral/referral/campaigns/:id/cohort-analysis
26. POST   /api/loyalty-referral/referral/campaigns/:id/bulk-invite
27. GET    /api/loyalty-referral/referral/campaigns/:id/attribution
28. POST   /api/loyalty-referral/referral/campaigns/:id/forecast
```

---

## Rewards API

Manage rewards catalog with 24 comprehensive endpoints.

### 1. List All Rewards

```http
GET /api/loyalty-referral/rewards
```

**Query Parameters:**
- `type` (optional): Filter by type (`store_credit`, `discount`, `product`, `free_shipping`)
- `category` (optional): Filter by category
- `inStock` (optional): Show only available rewards (boolean)
- `limit`, `offset`: Pagination

**Response:**
```json
{
  "ok": true,
  "rewards": [
    {
      "id": "rew_abc123",
      "name": "$10 Store Credit",
      "description": "Redeem for $10 off your next purchase",
      "pointsCost": 1000,
      "type": "store_credit",
      "value": 10,
      "currency": "USD",
      "inventory": 250,
      "redemptions": 1847,
      "imageUrl": "https://cdn.example.com/rewards/credit.png",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Create Reward

```http
POST /api/loyalty-referral/rewards
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Free Premium Shipping",
  "description": "Free shipping on your next order, any size",
  "pointsCost": 500,
  "type": "free_shipping",
  "value": 0,
  "inventory": -1,
  "expirationDays": 30,
  "termsAndConditions": "Valid for 30 days. Cannot be combined with other offers."
}
```

**Response:** Returns created reward object

### 3-5. Get/Update/Delete Reward

Standard CRUD operations

### 6. Redeem Reward

```http
POST /api/loyalty-referral/rewards/:id/redeem
Content-Type: application/json
```

**Request Body:**
```json
{
  "memberId": "mem_abc123",
  "quantity": 1
}
```

**Response:**
```json
{
  "ok": true,
  "redemption": {
    "id": "rdm_xyz789",
    "rewardId": "rew_abc123",
    "memberId": "mem_abc123",
    "code": "REWARD-XYZ789",
    "pointsDeducted": 1000,
    "status": "completed",
    "expiresAt": "2026-03-13T00:00:00Z",
    "createdAt": "2026-02-11T12:00:00Z"
  },
  "member": {
    "pointsBalance": 2400
  }
}
```

### Additional Rewards Endpoints (7-24)

```
7.  GET    /api/loyalty-referral/rewards/redemptions
8.  GET    /api/loyalty-referral/rewards/:id/redemptions
9.  GET    /api/loyalty-referral/rewards/:id/analytics
10. PUT    /api/loyalty-referral/rewards/:id/inventory
11. GET    /api/loyalty-referral/rewards/categories
12. POST   /api/loyalty-referral/rewards/categories
13. GET    /api/loyalty-referral/rewards/:id/reviews
14. POST   /api/loyalty-referral/rewards/:id/reviews
15. POST   /api/loyalty-referral/rewards/:id/duplicate
16. GET    /api/loyalty-referral/rewards/:id/popularity
17. POST   /api/loyalty-referral/rewards/:id/featured
18. POST   /api/loyalty-referral/rewards/:id/discount-optimize
19. GET    /api/loyalty-referral/rewards/:id/demand-forecast
20. POST   /api/loyalty-referral/rewards/bulk-import
21. POST   /api/loyalty-referral/rewards/bulk-update
22. GET    /api/loyalty-referral/rewards/top-performers
23. POST   /api/loyalty-referral/rewards/:id/ab-test
24. GET    /api/loyalty-referral/rewards/:id/roi
```

---

## Tiers API

Manage membership tiers with 22 comprehensive endpoints.

### 1. List All Tiers

```http
GET /api/loyalty-referral/tiers
```

**Response:**
```json
{
  "ok": true,
  "tiers": [
    {
      "id": "tier_bronze",
      "name": "Bronze Tier",
      "description": "Entry-level rewards for new members",
      "pointsThreshold": 0,
      "benefits": ["5% discount", "Birthday bonus"],
      "multiplier": 1.0,
      "color": "#CD7F32",
      "memberCount": 4237,
      "order": 1
    },
    {
      "id": "tier_silver",
      "name": "Silver Tier",
      "description": "Enhanced benefits for active members",
      "pointsThreshold": 2500,
      "benefits": ["10% discount", "Free shipping", "Early access"],
      "multiplier": 1.25,
      "color": "#C0C0C0",
      "memberCount": 1842,
      "order": 2
    }
  ]
}
```

### 2-5. Standard CRUD Operations

Create, Get, Update, Delete tier

### 6. Get Tier Members

```http
GET /api/loyalty-referral/tiers/:id/members
```

### 7. Get Tier Analytics

```http
GET /api/loyalty-referral/tiers/:id/analytics
```

**Response:**
```json
{
  "ok": true,
  "analytics": {
    "memberCount": 1842,
    "engagementRate": 0.73,
    "averageSpend": 234.56,
    "retentionRate": 0.87,
    "upgradeRate": 0.23,
    "downgradeRate": 0.05,
    "revenueContribution": 432180.45,
    "averageLifetimeValue": 1234.67
  }
}
```

### 8. Get Tier Effectiveness

```http
GET /api/loyalty-referral/tiers/effectiveness
```

**Response:** Comparison of all tiers with engagement scores, ROI, and recommendations

### Additional Tier Endpoints (9-22)

```
9.  POST   /api/loyalty-referral/tiers/:id/upgrade-member
10. POST   /api/loyalty-referral/tiers/:id/downgrade-member
11. GET    /api/loyalty-referral/tiers/:id/benefits
12. PUT    /api/loyalty-referral/tiers/:id/benefits
13. GET    /api/loyalty-referral/tiers/:id/progression
14. POST   /api/loyalty-referral/tiers/:id/duplicate
15. GET    /api/loyalty-referral/tiers/:id/churn-analysis
16. POST   /api/loyalty-referral/tiers/:id/optimize
17. GET    /api/loyalty-referral/tiers/comparison
18. POST   /api/loyalty-referral/tiers/bulk-assign
19. GET    /api/loyalty-referral/tiers/:id/engagement-trends
20. POST   /api/loyalty-referral/tiers/:id/welcome-email
21. GET    /api/loyalty-referral/tiers/:id/revenue-analysis
22. POST   /api/loyalty-referral/tiers/:id/forecast
```

---

## Members API

Manage loyalty members with 30 comprehensive endpoints.

### 1. List All Members

```http
GET /api/loyalty-referral/members
```

**Query Parameters:**
- `tier` (optional): Filter by tier ID
- `status` (optional): Filter by status (`active`, `inactive`, `churned`)
- `search` (optional): Search by name or email
- `sortBy` (optional): Sort by field (`pointsBalance`, `joinedAt`, `lifetimeValue`)
- `sortOrder` (optional): `asc` or `desc`
- `limit`, `offset`: Pagination

**Response:**
```json
{
  "ok": true,
  "members": [
    {
      "id": "mem_abc123",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "pointsBalance": 3420,
      "lifetimePoints": 8750,
      "tierId": "tier_gold",
      "tierName": "Gold Tier",
      "status": "active",
      "tags": ["vip", "referrer"],
      "lifetimeValue": 2456.78,
      "totalPurchases": 18,
      "averageOrderValue": 136.49,
      "lastPurchaseDate": "2026-02-08T14:30:00Z",
      "joinedAt": "2025-06-15T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 6847
  }
}
```

### 2. Create Member

```http
POST /api/loyalty-referral/members
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+9876543210",
  "tags": ["newsletter"],
  "source": "website",
  "welcomeBonus": 500
}
```

**Response:**
```json
{
  "ok": true,
  "member": {
    "id": "mem_xyz789",
    "email": "newmember@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+9876543210",
    "pointsBalance": 500,
    "lifetimePoints": 500,
    "tierId": "tier_bronze",
    "tierName": "Bronze Tier",
    "status": "active",
    "tags": ["newsletter"],
    "joinedAt": "2026-02-11T13:00:00Z"
  }
}
```

### 3-5. Get/Update/Delete Member

Standard CRUD operations

### 6. Award Points

```http
POST /api/loyalty-referral/members/:id/points/add
Content-Type: application/json
```

**Request Body:**
```json
{
  "points": 1000,
  "reason": "Purchase reward",
  "orderId": "order_abc123",
  "multiplier": 1.5
}
```

**Response:**
```json
{
  "ok": true,
  "member": {
    "pointsBalance": 4920,
    "lifetimePoints": 10250
  },
  "transaction": {
    "id": "txn_xyz789",
    "type": "earned",
    "points": 1500,
    "reason": "Purchase reward (1.5x multiplier)",
    "createdAt": "2026-02-11T13:30:00Z"
  }
}
```

### 7. Deduct Points

```http
POST /api/loyalty-referral/members/:id/points/deduct
Content-Type: application/json
```

**Request Body:**
```json
{
  "points": 1000,
  "reason": "Reward redemption",
  "rewardId": "rew_abc123"
}
```

### 8. Get Points History

```http
GET /api/loyalty-referral/members/:id/points/history
```

**Query Parameters:**
- `type` (optional): Filter by type (`earned`, `redeemed`, `expired`, `adjusted`)
- `fromDate`, `toDate`: Date range
- `limit`, `offset`: Pagination

**Response:**
```json
{
  "ok": true,
  "transactions": [
    {
      "id": "txn_abc123",
      "type": "earned",
      "points": 500,
      "balance": 3920,
      "reason": "Purchase $50.00",
      "orderId": "order_123",
      "createdAt": "2026-02-10T14:00:00Z"
    },
    {
      "id": "txn_abc124",
      "type": "redeemed",
      "points": -1000,
      "balance": 2920,
      "reason": "Redeemed $10 Store Credit",
      "rewardId": "rew_abc",
      "redemptionId": "rdm_xyz",
      "createdAt": "2026-02-09T11:30:00Z"
    }
  ],
  "summary": {
    "totalEarned": 8750,
    "totalRedeemed": 4330,
    "totalExpired": 500,
    "currentBalance": 3920
  }
}
```

### 9. Get Member Analytics

```http
GET /api/loyalty-referral/members/:id/analytics
```

**Response:**
```json
{
  "ok": true,
  "analytics": {
    "lifetimeValue": 2456.78,
    "predictedLifetimeValue": 4823.45,
    "engagementScore": 87,
    "churnRisk": 0.12,
    "churnRiskLevel": "low",
    "totalPurchases": 18,
    "averageOrderValue": 136.49,
    "daysSinceLastPurchase": 3,
    "purchaseFrequency": "14 days",
    "recommendedActions": [
      {
        "type": "tier_upgrade",
        "action": "Offer Gold tier upgrade",
        "reason": "Member is 200 points away from Gold tier",
        "priority": "high"
      }
    ]
  }
}
```

### 10. Get Member Segments

```http
GET /api/loyalty-referral/members/segments
```

**Response:**
```json
{
  "ok": true,
  "segments": [
    {
      "id": "seg_vip",
      "name": "VIP Customers",
      "memberCount": 347,
      "criteria": {
        "lifetimeValue": { "min": 1000 },
        "purchaseCount": { "min": 10 }
      },
      "averageLifetimeValue": 2847.32,
      "engagementRate": 0.92
    },
    {
      "id": "seg_at_risk",
      "name": "At-Risk Members",
      "memberCount": 524,
      "criteria": {
        "daysSinceLastPurchase": { "min": 60 },
        "churnRisk": { "min": 0.5 }
      },
      "churnRate": 0.34
    }
  ]
}
```

### Additional Member Endpoints (11-30)

```
11. GET    /api/loyalty-referral/members/:id/activity
12. GET    /api/loyalty-referral/members/:id/purchases
13. GET    /api/loyalty-referral/members/:id/referrals
14. GET    /api/loyalty-referral/members/:id/rewards
15. POST   /api/loyalty-referral/members/:id/merge
16. POST   /api/loyalty-referral/members/:id/tags
17. DELETE /api/loyalty-referral/members/:id/tags/:tag
18. POST   /api/loyalty-referral/members/:id/notes
19. GET    /api/loyalty-referral/members/:id/notes
20. POST   /api/loyalty-referral/members/bulk-import
21. POST   /api/loyalty-referral/members/bulk-award-points
22. POST   /api/loyalty-referral/members/bulk-update-tier
23. GET    /api/loyalty-referral/members/:id/churn-prediction
24. POST   /api/loyalty-referral/members/:id/reactivate
25. GET    /api/loyalty-referral/members/cohort-analysis
26. POST   /api/loyalty-referral/members/:id/send-email
27. GET    /api/loyalty-referral/members/:id/recommendations
28. POST   /api/loyalty-referral/members/:id/export
29. GET    /api/loyalty-referral/members/growth-forecast
30. POST   /api/loyalty-referral/members/:id/tier-override
```

---

## Workflows API

Manage automated workflows with 18 comprehensive endpoints.

### 1. List All Workflows

```http
GET /api/loyalty-referral/workflows
```

**Response:**
```json
{
  "ok": true,
  "workflows": [
    {
      "id": "wf_abc123",
      "name": "Welcome Series",
      "description": "Automated welcome emails for new members",
      "trigger": "member_created",
      "status": "active",
      "actions": [
        {
          "type": "send_email",
          "template": "welcome",
          "delay": 0
        },
        {
          "type": "award_points",
          "points": 100,
          "delay": 86400
        }
      ],
      "executions": 1247,
      "successRate": 0.98,
      "lastExecuted": "2026-02-11T12:30:00Z",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Create Workflow

```http
POST /api/loyalty-referral/workflows
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Churn Prevention",
  "description": "Re-engage members at risk of churning",
  "trigger": "inactivity_30_days",
  "conditions": [
    {
      "field": "churnRisk",
      "operator": "greater_than",
      "value": 0.5
    }
  ],
  "actions": [
    {
      "type": "send_email",
      "template": "winback_offer",
      "delay": 0
    },
    {
      "type": "award_points",
      "points": 500,
      "reason": "We miss you bonus",
      "delay": 0
    },
    {
      "type": "send_sms",
      "message": "We have a special offer just for you!",
      "delay": 86400
    }
  ],
  "status": "active"
}
```

**Response:** Returns created workflow object

### 3-5. Get/Update/Delete Workflow

Standard CRUD operations

### 6. Execute Workflow

```http
POST /api/loyalty-referral/workflows/:id/execute
Content-Type: application/json
```

**Request Body:**
```json
{
  "targetMemberId": "mem_abc123",
  "context": {
    "orderId": "order_xyz",
    "customData": "value"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "execution": {
    "id": "exec_xyz789",
    "workflowId": "wf_abc123",
    "memberId": "mem_abc123",
    "status": "running",
    "startedAt": "2026-02-11T14:00:00Z",
    "completedActions": 0,
    "totalActions": 3
  }
}
```

### 7. Get Workflow Analytics

```http
GET /api/loyalty-referral/workflows/:id/analytics
```

**Response:**
```json
{
  "ok": true,
  "analytics": {
    "totalExecutions": 1247,
    "successfulExecutions": 1223,
    "failedExecutions": 24,
    "successRate": 0.981,
    "averageExecutionTime": "2.3 seconds",
    "actionsPerformed": 3741,
    "timeline": [
      {
        "date": "2026-02-01",
        "executions": 42,
        "successes": 41
      }
    ]
  }
}
```

### Additional Workflow Endpoints (8-18)

```
8.  GET    /api/loyalty-referral/workflows/:id/executions
9.  GET    /api/loyalty-referral/workflows/:id/executions/:execId
10. POST   /api/loyalty-referral/workflows/:id/pause
11. POST   /api/loyalty-referral/workflows/:id/resume
12. POST   /api/loyalty-referral/workflows/:id/duplicate
13. GET    /api/loyalty-referral/workflows/:id/performance
14. POST   /api/loyalty-referral/workflows/:id/test
15. GET    /api/loyalty-referral/workflows/triggers
16. POST   /api/loyalty-referral/workflows/bulk-execute
17. GET    /api/loyalty-referral/workflows/:id/roi
18. POST   /api/loyalty-referral/workflows/:id/optimize
```

---

## Analytics API

Access comprehensive analytics with 26 endpoints.

### 1. Dashboard Metrics

```http
GET /api/loyalty-referral/analytics/dashboard
```

**Response:**
```json
{
  "ok": true,
  "dashboard": {
    "activeMembers": 6847,
    "totalPoints": 2847392,
    "redemptionRate": 0.34,
    "referralConversionRate": 0.618,
    "averageLifetimeValue": 456.78,
    "totalRevenue": 3128492.50,
    "revenueFromLoyalty": 1564238.40,
    "revenueFromReferrals": 847329.20,
    "growthMetrics": {
      "newMembers30d": 423,
      "churnedMembers30d": 87,
      "netGrowth": 336,
      "growthRate": 0.051
    }
  }
}
```

### 2. Real-Time Metrics

```http
GET /api/loyalty-referral/analytics/realtime
```

**Response:**
```json
{
  "ok": true,
  "realtime": {
    "requestsPerSecond": 47.3,
    "averageLatency": 142,
    "errorRate": 0.002,
    "activeUsers": 234,
    "recentTransactions": [
      {
        "type": "redemption",
        "memberId": "mem_abc",
        "points": 1000,
        "timestamp": "2026-02-11T14:59:32Z"
      }
    ]
  }
}
```

### 3-26. Additional Analytics Endpoints

```
3.  GET    /api/loyalty-referral/analytics/engagement
4.  GET    /api/loyalty-referral/analytics/engagement/trends
5.  GET    /api/loyalty-referral/analytics/revenue
6.  GET    /api/loyalty-referral/analytics/revenue/forecast
7.  GET    /api/loyalty-referral/analytics/clv
8.  GET    /api/loyalty-referral/analytics/clv/by-tier
9.  GET    /api/loyalty-referral/analytics/churn
10. GET    /api/loyalty-referral/analytics/churn/predictions
11. GET    /api/loyalty-referral/analytics/referral-funnel
12. GET    /api/loyalty-referral/analytics/redemption-trends
13. GET    /api/loyalty-referral/analytics/tier-progression
14. GET    /api/loyalty-referral/analytics/points-economy
15. GET    /api/loyalty-referral/analytics/top-performers
16. GET    /api/loyalty-referral/analytics/cohort-retention
17. GET    /api/loyalty-referral/analytics/attribution
18. GET    /api/loyalty-referral/analytics/program-comparison
19. GET    /api/loyalty-referral/analytics/seasonal-trends
20. GET    /api/loyalty-referral/analytics/geographic
21. POST   /api/loyalty-referral/analytics/custom-report
22. GET    /api/loyalty-referral/analytics/export
23. GET    /api/loyalty-referral/analytics/alerts
24. POST   /api/loyalty-referral/analytics/alerts
25. GET    /api/loyalty-referral/analytics/anomalies
26. POST   /api/loyalty-referral/analytics/forecast
```

---

## Settings API

Manage platform settings with 28 endpoints.

### 1. Get All Settings

```http
GET /api/loyalty-referral/settings
```

**Response:**
```json
{
  "ok": true,
  "settings": {
    "shop": "My Awesome Store",
    "currency": "USD",
    "timezone": "America/New_York",
    "pointsExpiration": 365,
    "autoEnrollNewCustomers": true,
    "emailNotifications": true
  }
}
```

### 2. Update Settings

```http
PUT /api/loyalty-referral/settings
Content-Type: application/json
```

### 3-28. Additional Settings Endpoints

```
3.  GET    /api/loyalty-referral/settings/brands
4.  POST   /api/loyalty-referral/settings/brands
5.  GET    /api/loyalty-referral/settings/brands/:id
6.  PUT    /api/loyalty-referral/settings/brands/:id
7.  DELETE /api/loyalty-referral/settings/brands/:id
8.  GET    /api/loyalty-referral/settings/api-keys
9.  POST   /api/loyalty-referral/settings/api-keys
10. DELETE /api/loyalty-referral/settings/api-keys/:id
11. GET    /api/loyalty-referral/settings/webhooks
12. POST   /api/loyalty-referral/settings/webhooks
13. PUT    /api/loyalty-referral/settings/webhooks/:id
14. DELETE /api/loyalty-referral/settings/webhooks/:id
15. GET    /api/loyalty-referral/settings/integrations
16. POST   /api/loyalty-referral/settings/integrations
17. GET    /api/loyalty-referral/settings/email-templates
18. PUT    /api/loyalty-referral/settings/email-templates/:id
19. GET    /api/loyalty-referral/settings/compliance
20. PUT    /api/loyalty-referral/settings/compliance
21. GET    /api/loyalty-referral/settings/localization
22. PUT    /api/loyalty-referral/settings/localization
23. GET    /api/loyalty-referral/settings/teams
24. POST   /api/loyalty-referral/settings/teams
25. GET    /api/loyalty-referral/settings/permissions
26. PUT    /api/loyalty-referral/settings/permissions
27. POST   /api/loyalty-referral/settings/backup
28. POST   /api/loyalty-referral/settings/restore
```

---

## Webhooks

Configure real-time event notifications.

### Supported Events

- `member.created`
- `member.updated`
- `member.deleted`
- `points.earned`
- `points.redeemed`
- `tier.upgraded`
- `tier.downgraded`
- `reward.redeemed`
- `referral.created`
- `referral.converted`
- `program.created`
- `campaign.created`
- `workflow.executed`

### Webhook Payload Example

```json
{
  "id": "evt_abc123",
  "type": "points.earned",
  "timestamp": "2026-02-11T15:00:00Z",
  "data": {
    "memberId": "mem_abc123",
    "points": 500,
    "balance": 3920,
    "reason": "Purchase $50.00",
    "orderId": "order_123"
  }
}
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.yourstore.com/api/loyalty-referral',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  }
});

// Create a loyalty program
async function createProgram() {
  const response = await client.post('/loyalty/programs', {
    name: 'VIP Rewards',
    pointsPerDollar: 15,
    status: 'active'
  });
  console.log('Program created:', response.data.program);
}

// Award points to a member
async function awardPoints(memberId, points) {
  const response = await client.post(`/members/${memberId}/points/add`, {
    points,
    reason: 'Purchase reward'
  });
  console.log('New balance:', response.data.member.pointsBalance);
}
```

### Python

```python
import requests

class LoyaltyAPI:
    def __init__(self, api_key):
        self.base_url = 'https://api.yourstore.com/api/loyalty-referral'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_referral_campaign(self, name, referrer_reward, referee_reward):
        response = requests.post(
            f'{self.base_url}/referral/campaigns',
            headers=self.headers,
            json={
                'name': name,
                'referrerReward': referrer_reward,
                'refereeReward': referee_reward
            }
        )
        return response.json()
    
    def get_analytics_dashboard(self):
        response = requests.get(
            f'{self.base_url}/analytics/dashboard',
            headers=self.headers
        )
        return response.json()

# Usage
api = LoyaltyAPI('sk_live_your_api_key')
campaign = api.create_referral_campaign('Friend Bonus', 1000, 1000)
dashboard = api.get_analytics_dashboard()
```

---

## Support & Resources

- **API Status:** https://status.yourstore.com
- **Developer Portal:** https://developers.yourstore.com
- **Support Email:** api-support@yourstore.com
- **Slack Community:** https://slack.yourstore.com/developers

---

**API Reference Complete**  
**Total Endpoints Documented:** 201  
**Last Updated:** February 11, 2026  
**Version:** 1.0.0
