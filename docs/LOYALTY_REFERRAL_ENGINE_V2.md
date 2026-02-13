# Loyalty & Referral Program V2

Enterprise-grade loyalty program platform with points management, tier progression, referral tracking, gamification mechanics, campaign automation, member portal, advanced analytics, and platform integrations.

## Table of Contents

- [Architecture](#architecture)
- [Installation](#installation)
- [Features](#features)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Deployment](#deployment)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)

## Architecture

The Loyalty & Referral Program V2 is built with a modular 8-engine architecture:

### Backend Engines

1. **Points & Rewards Engine** (`points-rewards-engine.js`)
   - Points earning rules with conditions and multipliers
   - Reward catalog with stock management
   - Redemption workflow (pending/fulfilled/cancelled)
   - Points transfer between customers
   - Expiration tracking

2. **Tier & VIP Management Engine** (`tier-vip-engine.js`)
   - 5-tier system (Bronze → Silver → Gold → Platinum → Diamond)
   - Automated tier progression
   - Tier-specific benefits
   - VIP segment management
   - Upgrade/downgrade history

3. **Referral Program Engine** (`referral-program-engine.js`)
   - Unique referral code generation
   - Click/signup/conversion tracking
   - Dual rewards (referrer + referred)
   - Campaign types (standard/tiered/milestone)
   - Social share link generation

4. **Gamification & Challenges Engine** (`gamification-challenges-engine.js`)
   - Badge system with unlock mechanics
   - Daily/weekly/monthly challenges
   - Achievement tracking
   - Streak counters
   - Leaderboards

5. **Campaign Automation Engine** (`campaign-automation-engine.js`)
   - Welcome/birthday/anniversary campaigns
   - Event triggers
   - Multi-step workflows
   - Scheduled actions

6. **Member Portal Engine** (`member-portal-engine.js`)
   - Customer dashboard
   - Activity feed
   - Notification preferences
   - Saved rewards management

7. **Analytics & Reporting Engine** (`analytics-reporting-engine.js`)
   - Metrics tracking
   - Scheduled reports
   - Custom dashboards
   - AI-generated insights
   - Cohort analysis
   - ROI calculation

8. **Integration Engine** (`integration-engine.js`)
   - Shopify order/customer sync
   - Email platform integrations (Klaviyo, Mailchimp)
   - CRM connections (Salesforce, HubSpot)
   - Webhook management
   - Data import/export

### Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React + Shopify Polaris
- **Data Storage**: In-memory Maps (production: PostgreSQL/MongoDB)
- **Testing**: Jest + Supertest
- **API**: RESTful with 248 endpoints

## Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Update .env with your settings
# SHOPIFY_API_KEY=your_key
# KLAVIYO_API_KEY=your_key
# etc.

# Start development server
npm run dev
```

## Features

### Points Economy
- **Earning Rules**: Purchase, signup, review, referral, birthday, social share, custom
- **Conditions**: Minimum order value, product categories, customer segments
- **Multipliers**: Percentage-based or fixed points
- **Expiration**: Configurable point expiry dates
- **Transfers**: Customer-to-customer point transfers

### Tier System
- **5 Levels**: Bronze, Silver, Gold, Platinum, Diamond
- **Progression**: Points, spending, or order-based
- **Auto-Upgrade**: Automatic tier promotion when thresholds met
- **Benefits**: Discounts, free shipping, early access, exclusive products, priority support, bonus points, birthday gifts
- **VIP Segments**: Custom high-value customer groups

### Referral Program
- **Unique Codes**: 8-character codes with custom prefixes
- **Tracking**: Click → Signup → Purchase → Conversion
- **Dual Rewards**: Incentives for both referrer and referred
- **Campaigns**: Standard, tiered (escalating), milestone (bonus thresholds)
- **Share Tools**: Email, Facebook, Twitter, WhatsApp, LinkedIn, copy link

### Gamification
- **Badges**: Unlockable achievements with categories and tiers
- **Challenges**: Daily/weekly/monthly goals with progress tracking
- **Achievements**: Milestone-based accomplishments
- **Streaks**: Consecutive activity tracking with bonuses
- **Leaderboards**: Rankings by points, activity, or custom metrics

### Automation
- **Campaign Types**: Welcome, birthday, anniversary, point expiry, tier upgrade, inactivity
- **Triggers**: Customer events (signup, purchase, tier change, etc.)
- **Workflows**: Multi-step sequences with conditions and delays
- **Scheduling**: Future-dated actions

### Member Portal
- **Dashboard**: Overview of points, tier, streaks, badges
- **Activity Feed**: Real-time updates on program activity
- **Preferences**: Email, push, SMS notification settings
- **Saved Rewards**: Favorite rewards for quick access

### Analytics
- **Metrics**: Points flow, tier distribution, referral conversion, engagement
- **Reports**: Executive summary, financial, engagement, customer lifetime value
- **Dashboards**: Customizable widget layouts
- **Insights**: AI-powered recommendations
- **Cohort Analysis**: Segment-based performance comparison
- **ROI Calculation**: Program cost vs. revenue analysis

### Integrations
- **Shopify**: Order sync, customer data, product catalog
- **Email**: Klaviyo, Mailchimp campaign automation
- **CRM**: Salesforce, HubSpot data synchronization
- **Payments**: Stripe, PayPal transaction handling
- **Webhooks**: Real-time event notifications
- **Import/Export**: CSV, JSON data transfer

## API Reference

### Points & Rewards (32 endpoints)

#### Create Points Rule
```http
POST /api/loyalty-referral/points/rules
Content-Type: application/json

{
  "name": "Purchase Points",
  "type": "purchase",
  "points": 0,
  "multiplier": 0.1,
  "conditions": {
    "minOrderValue": 50,
    "category": "electronics"
  },
  "enabled": true
}
```

#### Award Points
```http
POST /api/loyalty-referral/points/award
Content-Type: application/json

{
  "customerId": "customer_123",
  "points": 100,
  "reason": "Purchase reward",
  "metadata": {
    "orderId": "order_456"
  }
}
```

#### Get Points Balance
```http
GET /api/loyalty-referral/points/balance/customer_123
```

Response:
```json
{
  "success": true,
  "balance": {
    "customerId": "customer_123",
    "pointsBalance": 2500,
    "lifetimePoints": 5000,
    "totalRedeemed": 2500,
    "tier": "gold"
  }
}
```

#### Redeem Reward
```http
POST /api/loyalty-referral/rewards/reward_789/redeem
Content-Type: application/json

{
  "customerId": "customer_123",
  "quantity": 1
}
```

### Tier Management (28 endpoints)

#### Create Tier
```http
POST /api/loyalty-referral/tiers
Content-Type: application/json

{
  "name": "Gold",
  "level": 3,
  "color": "#ffd700",
  "icon": "⭐",
  "requirements": {
    "type": "points",
    "threshold": 5000,
    "period": "lifetime"
  },
  "pointsMultiplier": 1.5,
  "welcomeMessage": "Welcome to Gold tier!"
}
```

#### Calculate Tier Progress
```http
GET /api/loyalty-referral/customers/customer_123/tier-progress
Content-Type: application/json

{
  "customerData": {
    "lifetimePoints": 3500,
    "currentTier": "silver"
  }
}
```

Response:
```json
{
  "success": true,
  "progress": {
    "customerId": "customer_123",
    "currentTier": {
      "name": "Silver",
      "level": 2
    },
    "nextTier": {
      "name": "Gold",
      "level": 3,
      "requiredValue": 5000
    },
    "currentValue": 3500,
    "progress": 70,
    "remaining": 1500
  }
}
```

### Referral Program (30 endpoints)

#### Create Referral Code
```http
POST /api/loyalty-referral/referrals/codes
Content-Type: application/json

{
  "customerId": "customer_123",
  "code": "JOHN2024",
  "maxUses": 50,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### Generate Share Links
```http
POST /api/loyalty-referral/referrals/share-links
Content-Type: application/json

{
  "referralCode": "JOHN2024",
  "baseUrl": "https://mystore.com",
  "customMessage": "Join me and get 10% off!"
}
```

Response:
```json
{
  "success": true,
  "links": {
    "direct": "https://mystore.com?ref=JOHN2024",
    "email": "mailto:?subject=...",
    "facebook": "https://facebook.com/sharer/...",
    "twitter": "https://twitter.com/intent/tweet?...",
    "whatsapp": "https://wa.me/?text=...",
    "linkedin": "https://linkedin.com/sharing/share-offsite/...",
    "copy": "https://mystore.com?ref=JOHN2024"
  }
}
```

### Gamification (32 endpoints)

#### Create Challenge
```http
POST /api/loyalty-referral/challenges
Content-Type: application/json

{
  "name": "Weekly Warrior",
  "description": "Make 5 purchases this week",
  "type": "weekly",
  "goal": {
    "action": "purchase",
    "target": 5
  },
  "rewards": {
    "points": 500,
    "badge": "badge_weekly_warrior"
  },
  "difficulty": "medium"
}
```

#### Award Badge
```http
POST /api/loyalty-referral/customers/customer_123/award-badge
Content-Type: application/json

{
  "badgeId": "badge_first_purchase"
}
```

### Automation (28 endpoints)

#### Create Campaign
```http
POST /api/loyalty-referral/automation/campaigns
Content-Type: application/json

{
  "name": "Welcome Series",
  "type": "welcome",
  "trigger": "customer.signup",
  "actions": [
    {
      "type": "award_points",
      "config": {
        "points": 100,
        "reason": "Welcome bonus"
      }
    },
    {
      "type": "send_email",
      "config": {
        "template": "welcome_email",
        "subject": "Welcome to our loyalty program!"
      }
    }
  ]
}
```

### Member Portal (30 endpoints)

#### Get Customer Dashboard
```http
GET /api/loyalty-referral/portal/customer_123/dashboard
```

Response:
```json
{
  "success": true,
  "dashboard": {
    "overview": {
      "pointsBalance": 2500,
      "lifetimePoints": 5000,
      "tier": {
        "name": "Gold",
        "level": 3,
        "progress": 70
      },
      "activeStreaks": 7,
      "unlockedBadges": 12,
      "activeReferrals": 5
    },
    "quickActions": [...],
    "recentActivity": [...],
    "upcomingRewards": [...]
  }
}
```

### Analytics (32 endpoints)

#### Generate Report
```http
POST /api/loyalty-referral/analytics/reports/report_123/generate
```

#### Calculate ROI
```http
POST /api/loyalty-referral/analytics/roi-calculation
Content-Type: application/json

{
  "programCosts": 15000,
  "revenue": 75000,
  "period": "2024-Q1"
}
```

Response:
```json
{
  "success": true,
  "roi": {
    "period": "2024-Q1",
    "programCosts": 15000,
    "revenue": 75000,
    "profit": 60000,
    "roi": 400.00
  }
}
```

### Integrations (34 endpoints)

#### Connect Shopify
```http
POST /api/loyalty-referral/integrations/connect
Content-Type: application/json

{
  "platform": "shopify",
  "credentials": {
    "apiKey": "your_shopify_api_key",
    "accessToken": "your_access_token",
    "shopDomain": "yourstore.myshopify.com"
  }
}
```

#### Create Webhook
```http
POST /api/loyalty-referral/integrations/webhooks
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": [
    "points.earned",
    "tier.upgraded",
    "referral.qualified"
  ]
}
```

## Usage Examples

### Complete Loyalty Program Setup

```javascript
// 1. Create tier structure
const tiers = [
  { name: 'Bronze', level: 1, threshold: 0 },
  { name: 'Silver', level: 2, threshold: 1000 },
  { name: 'Gold', level: 3, threshold: 5000 },
  { name: 'Platinum', level: 4, threshold: 15000 },
  { name: 'Diamond', level: 5, threshold: 30000 }
];

for (const tier of tiers) {
  await fetch('/api/loyalty-referral/tiers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tier)
  });
}

// 2. Configure earning rules
await fetch('/api/loyalty-referral/points/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Purchase Points',
    type: 'purchase',
    multiplier: 0.1, // 10% of order value
    enabled: true
  })
});

await fetch('/api/loyalty-referral/points/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Signup Bonus',
    type: 'signup',
    points: 100,
    enabled: true
  })
});

// 3. Set up reward catalog
const rewards = [
  { name: '10% Off', type: 'discount', pointsCost: 500, value: 10 },
  { name: 'Free Shipping', type: 'free_shipping', pointsCost: 750 },
  { name: '$20 Gift Card', type: 'gift_card', pointsCost: 2000, value: 20 }
];

for (const reward of rewards) {
  await fetch('/api/loyalty-referral/rewards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reward)
  });
}

// 4. Enable referral program
await fetch('/api/loyalty-referral/referral-campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Friend Referral',
    type: 'standard',
    rewards: {
      referrer: { type: 'points', value: 500 },
      referred: { type: 'discount', value: 10 }
    },
    qualificationRules: {
      requirePurchase: true,
      minPurchaseAmount: 50
    }
  })
});

// 5. Configure gamification
await fetch('/api/loyalty-referral/challenges', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'First Week Challenge',
    type: 'weekly',
    goal: { action: 'purchase', target: 3 },
    rewards: { points: 300, badge: 'badge_weekly_warrior' }
  })
});

// 6. Set up automation
await fetch('/api/loyalty-referral/automation/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Welcome Campaign',
    type: 'welcome',
    trigger: 'customer.signup',
    actions: [
      { type: 'award_points', config: { points: 100 } },
      { type: 'send_email', config: { template: 'welcome' } }
    ]
  })
});

// 7. Connect integrations
await fetch('/api/loyalty-referral/integrations/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'shopify',
    credentials: { apiKey: process.env.SHOPIFY_API_KEY }
  })
});

// 8. Set up analytics dashboards
await fetch('/api/loyalty-referral/analytics/dashboards', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Executive Dashboard',
    widgets: [
      { type: 'points_flow' },
      { type: 'tier_distribution' },
      { type: 'referral_funnel' },
      { type: 'reward_popularity' }
    ]
  })
});
```

## Testing

The platform includes 48 comprehensive tests covering all engines plus E2E workflows.

```bash
# Run all tests
npm test

# Run loyalty referral tests specifically
npm test -- loyalty-referral-engine-v2-comprehensive.test.js

# Run with coverage
npm test -- --coverage
```

### Test Coverage

- **Points & Rewards**: 6 tests
- **Tier Management**: 5 tests
- **Referral Program**: 5 tests
- **Gamification**: 6 tests
- **Automation**: 5 tests
- **Member Portal**: 6 tests
- **Analytics**: 6 tests
- **Integrations**: 6 tests
- **System**: 2 tests
- **E2E Journey**: 1 comprehensive test

## Deployment

### Database Configuration

The production deployment requires a persistent database. Recommended options:

**PostgreSQL Schema:**
```sql
CREATE TABLE customers (
  id VARCHAR(255) PRIMARY KEY,
  points_balance INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  tier VARCHAR(50),
  joined_at TIMESTAMP,
  last_activity TIMESTAMP
);

CREATE TABLE points_transactions (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255),
  type VARCHAR(50),
  points INTEGER,
  balance_before INTEGER,
  balance_after INTEGER,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP
);

CREATE TABLE rewards (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  type VARCHAR(50),
  points_cost INTEGER,
  value DECIMAL(10,2),
  stock_limit INTEGER,
  stock_available INTEGER,
  enabled BOOLEAN,
  created_at TIMESTAMP
);

-- Additional tables for tiers, referrals, badges, challenges, etc.
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/loyalty

# Redis Cache
REDIS_URL=redis://localhost:6379

# Job Queue
RABBITMQ_URL=amqp://localhost:5672

# Email
KLAVIYO_API_KEY=your_key
SENDGRID_API_KEY=your_key

# Integrations
SHOPIFY_API_KEY=your_key
SALESFORCE_CLIENT_ID=your_id

# Security
JWT_SECRET=your_secret
WEBHOOK_SECRET=your_webhook_secret
```

### Scaling Considerations

**Caching Strategy:**
```javascript
// Use Redis for frequently accessed data
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

// Cache points balance
const CACHE_TTL = 300; // 5 minutes
async function getPointsBalance(customerId) {
  const cacheKey = `points:${customerId}`;
  const cached = await client.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const balance = await db.query('SELECT * FROM customers WHERE id = $1', [customerId]);
  await client.setex(cacheKey, CACHE_TTL, JSON.stringify(balance));
  
  return balance;
}
```

**Job Queue for Async Processing:**
```javascript
const Queue = require('bull');
const pointsQueue = new Queue('points-processing', process.env.REDIS_URL);

// Queue points award
pointsQueue.add('award-points', {
  customerId: 'customer_123',
  points: 100,
  reason: 'Purchase'
});

// Process jobs
pointsQueue.process('award-points', async (job) => {
  const { customerId, points, reason } = job.data;
  await awardPoints(customerId, points, reason);
});
```

## Performance

### Optimization Strategies

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_customer_points ON customers(points_balance);
   CREATE INDEX idx_transactions_customer ON points_transactions(customer_id, created_at);
   CREATE INDEX idx_referrals_code ON referral_codes(code);
   ```

2. **Query Optimization**
   - Use database views for complex aggregations
   - Implement pagination for large datasets
   - Pre-calculate statistics daily via cron

3. **Caching Patterns**
   - Points balances (5 min TTL)
   - Tier calculations (15 min TTL)
   - Reward catalog (1 hour TTL)
   - Statistics (24 hour TTL)

4. **Analytics Pre-aggregation**
   ```javascript
   // Daily aggregation job
   cron.schedule('0 0 * * *', async () => {
     await aggregatePointsStatistics();
     await aggregateTierDistribution();
     await aggregateReferralMetrics();
   });
   ```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

---

**Support:** For questions or issues, please open a GitHub issue or contact support@example.com

**Version:** 2.0.0  
**Last Updated:** February 13, 2026
