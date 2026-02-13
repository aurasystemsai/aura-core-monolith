# Brand Mention Tracker V2

Enterprise-grade brand monitoring platform with AI-powered sentiment analysis, competitor tracking, influencer discovery, and crisis detection across all digital channels.

## Architecture Overview

Brand Mention Tracker V2 is built on 8 specialized engines working in concert to provide comprehensive brand monitoring:

### 1. **Mention Monitoring Engine**
Multi-source mention capture with intelligent deduplication and credibility scoring.

**Features:**
- 10 source types (web, Twitter, Facebook, Instagram, LinkedIn, news, forums, blogs, podcasts, YouTube)
- Duplicate detection using 85% Jaccard similarity threshold
- Language detection (en/es/fr/de)
- Keyword extraction with stopword filtering
- Source credibility scoring (0-100)
- Saved search queries
- Real-time monitoring sessions with configurable poll intervals

### 2. **Sentiment Analysis Engine**
AI-powered sentiment scoring with context awareness and emotion detection.

**Features:**
- Sentiment score from -1.0 to 1.0
- Context detection (sarcasm, negation, questions) with score adjustments
- 5-tier sentiment labels (very positive to very negative)
- Confidence scoring based on content length
- Emotion detection (joy, anger, fear, sadness, surprise)
- Tone analysis (formal, casual, promotional, critical, informative)
- Trend direction tracking (improving/declining/stable)

### 3. **Competitor Tracking Engine**
Multi-competitor monitoring with share of voice and market positioning analysis.

**Features:**
- Competitor management with aliases
- Share of voice calculation by period (day/week/month/quarter)
- Competitive comparison by metrics (mentions, reach, engagement, sentiment)
- Sentiment comparison across competitors
- Feature mention tracking
- Competitive positioning score (0-100) with market categories
- Category-based competitor grouping

### 4. **Influencer Discovery Engine**
Authority-based influencer identification and relationship management.

**Features:**
- Authority scoring (0-100) based on followers, engagement rate, verification, and reach
- Minimum authority threshold (30) for tracking
- Engagement rate calculation
- Relationship status tracking (advocate/neutral/critic)
- Engagement opportunity detection with priority levels
- Demographics and topic tracking
- Multi-platform support

### 5. **Crisis Detection Engine**
Real-time crisis detection with multi-factor triggers and auto-escalation.

**Features:**
- Volume spike detection (3x baseline threshold)
- Negative sentiment spike detection (>60% negative)
- Viral spread detection (>1M reach with 50% growth)
- Severity scoring (0-100) with 4 levels (critical/high/medium/low)
- Auto-escalation for critical crises
- Crisis lifecycle management (active/monitoring/resolved)
- Custom detection rules
- Timeline tracking

### 6. **Analytics & Reporting Engine**
Dashboard metrics, trend analysis, and custom report generation.

**Features:**
- Comprehensive dashboard with period-based metrics
- Trend analysis with granular time intervals
- Geographic distribution analysis
- Source breakdown by type and name
- Custom report generation with templates
- Scheduled reports (daily/weekly/monthly)
- Multi-format exports (CSV, PDF, JSON)
- Custom dashboards with widget layouts

### 7. **Alert Management Engine**
Custom alert rules with multi-channel notifications and quiet hours.

**Features:**
- Alert rules with multiple trigger types
- Multi-channel delivery (email, SMS, Slack, webhooks)
- Priority levels (urgent/high/medium/low)
- Quiet hours configuration by day and timezone
- Notification templates with variable substitution
- Alert history tracking
- Delivery success monitoring
- Frequency limiting

### 8. **Response Management Engine**
Team collaboration workflows with performance tracking.

**Features:**
- Response templates by mention type
- Team assignment with priority
- Response time tracking
- Collaboration notes with @mentions
- Automated response suggestions based on sentiment and keywords
- Status tracking (pending/assigned/responded/ignored/escalated)
- Performance metrics (avg response time, resolution rate, quality scores)
- Template usage analytics

## Installation

```bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure data sources
# Edit .env with your API keys for social media platforms

# Start the application
npm start
```

## API Reference

### Mention Monitoring (30 endpoints)

#### Capture Mention
```
POST /api/brand-mention-tracker/mentions
```

**Request:**
```json
{
  "content": "Great experience with Aura!",
  "sourceType": "twitter",
  "author": {
    "username": "user123",
    "displayName": "John Doe",
    "profileUrl": "https://twitter.com/user123"
  },
  "url": "https://twitter.com/user123/status/123",
  "publishedAt": "2024-01-15T10:30:00Z",
  "reach": 5000,
  "engagement": {
    "likes": 50,
    "shares": 10,
    "comments": 5
  },
  "location": "New York, NY"
}
```

**Response:**
```json
{
  "success": true,
  "mention": {
    "id": "mention_123",
    "content": "Great experience with Aura!",
    "sourceType": "twitter",
    "credibilityScore": 75,
    "language": "en",
    "keywords": ["great", "experience", "aura"],
    "isDuplicate": false,
    "sentiment": 0.85,
    "sentimentLabel": "very positive"
  }
}
```

#### Get Mentions
```
GET /api/brand-mention-tracker/mentions?sourceType=twitter&limit=20
```

#### Create Search Query
```
POST /api/brand-mention-tracker/search-queries
```

#### Start Monitoring Session
```
POST /api/brand-mention-tracker/monitoring-sessions
```

### Sentiment Analysis (32 endpoints)

#### Analyze Sentiment
```
POST /api/brand-mention-tracker/sentiment/analyze
```

**Request:**
```json
{
  "text": "This product is absolutely amazing! Best purchase ever!",
  "mentionId": "mention_123"
}
```

**Response:**
```json
{
  "success": true,
  "sentiment": {
    "score": 0.92,
    "label": "very positive",
    "confidence": 0.88,
    "keywords": {
      "positive": ["amazing", "best"],
      "negative": [],
      "neutral": ["product", "purchase"]
    },
    "context": {
      "hasSarcasm": false,
      "hasNegation": false,
      "isQuestion": false
    }
  }
}
```

#### Detect Emotions
```
POST /api/brand-mention-tracker/sentiment/emotions
```

#### Analyze Tone
```
POST /api/brand-mention-tracker/sentiment/tone
```

#### Get Sentiment by Date Range
```
GET /api/brand-mention-tracker/sentiment/date-range?startDate=2024-01-01&endDate=2024-01-15
```

### Competitor Tracking (30 endpoints)

#### Add Competitor
```
POST /api/brand-mention-tracker/competitors
```

**Request:**
```json
{
  "name": "Competitor A",
  "aliases": ["CompA", "Competitor_A"],
  "website": "https://competitora.com",
  "category": "technology",
  "socialProfiles": {
    "twitter": "@competitora",
    "linkedin": "competitora"
  },
  "trackingEnabled": true
}
```

#### Calculate Share of Voice
```
POST /api/brand-mention-tracker/competitors/share-of-voice
```

#### Compare Competitors
```
POST /api/brand-mention-tracker/competitors/compare
```

### Influencer Discovery (32 endpoints)

#### Identify Influencer
```
POST /api/brand-mention-tracker/influencers/identify
```

**Request:**
```json
{
  "username": "techinfluencer",
  "displayName": "Tech Influencer",
  "platform": "twitter",
  "followers": 250000,
  "following": 1500,
  "totalPosts": 5000,
  "engagement": {
    "likes": 10000,
    "shares": 2000,
    "comments": 500
  },
  "isVerified": true,
  "reach": 500000
}
```

**Response:**
```json
{
  "success": true,
  "influencer": {
    "id": "inf_123",
    "authorityScore": 85,
    "engagementRate": 5.2,
    "relationshipStatus": "neutral",
    "demographics": {},
    "topics": []
  }
}
```

#### Detect Engagement Opportunities
```
GET /api/brand-mention-tracker/influencers/opportunities?minAuthority=50
```

### Crisis Detection (30 endpoints)

#### Detect Crisis
```
POST /api/brand-mention-tracker/crisis/detect
```

#### Create Crisis
```
POST /api/brand-mention-tracker/crisis
```

#### Escalate Crisis
```
POST /api/brand-mention-tracker/crisis/:id/escalate
```

#### Get Active Crises
```
GET /api/brand-mention-tracker/crisis/active?severity=critical
```

### Analytics & Reporting (32 endpoints)

#### Get Dashboard Metrics
```
GET /api/brand-mention-tracker/analytics/dashboard?period=week
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "period": "week",
    "periodStart": "2024-01-08T00:00:00Z",
    "periodEnd": "2024-01-15T00:00:00Z",
    "mentions": {
      "total": 1250,
      "growth": 15.3,
      "bySource": {},
      "byDay": {}
    },
    "sentiment": {
      "average": 0.42,
      "positive": 750,
      "neutral": 350,
      "negative": 150,
      "trend": "improving"
    },
    "reach": {
      "total": 5000000,
      "average": 4000
    },
    "engagement": {
      "total": 25000,
      "average": 20,
      "rate": 0.5
    }
  }
}
```

#### Generate Report
```
POST /api/brand-mention-tracker/analytics/reports
```

#### Export Data
```
POST /api/brand-mention-tracker/analytics/export
```

### Alert Management (32 endpoints)

#### Create Alert Rule
```
POST /api/brand-mention-tracker/alerts/rules
```

**Request:**
```json
{
  "name": "Negative Sentiment Alert",
  "description": "Alert when negative sentiment detected",
  "triggers": {
    "keywords": ["complaint", "issue"],
    "sentimentThreshold": -0.5,
    "sourceTypes": ["twitter", "facebook"]
  },
  "actions": {
    "notify": true,
    "channels": ["email", "slack"],
    "recipients": ["alerts@company.com"],
    "priority": "high"
  },
  "frequency": {
    "type": "immediate",
    "maxPerDay": 50
  }
}
```

#### Set Quiet Hours
```
POST /api/brand-mention-tracker/alerts/quiet-hours
```

### Response Management (30 endpoints)

#### Create Response Template
```
POST /api/brand-mention-tracker/responses/templates
```

#### Assign Response
```
POST /api/brand-mention-tracker/responses/assign
```

#### Track Response
```
POST /api/brand-mention-tracker/responses
```

#### Get Response Suggestions
```
GET /api/brand-mention-tracker/responses/suggestions/:mentionId
```

### System (2 endpoints)

#### Health Check
```
GET /api/brand-mention-tracker/health
```

#### Aggregated Statistics
```
GET /api/brand-mention-tracker/statistics
```

## Usage Examples

### Complete Brand Monitoring Workflow

```javascript
// 1. Set up monitoring session
const session = await fetch('/api/brand-mention-tracker/monitoring-sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brands: ['Aura'],
    keywords: ['customer service', 'product quality'],
    sourceTypes: ['twitter', 'facebook', 'news'],
    pollInterval: 300000 // 5 minutes
  })
});

// 2. Create alert rules
const alert = await fetch('/api/brand-mention-tracker/alerts/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Crisis Alert',
    triggers: {
      sentimentThreshold: -0.7,
      volumeThreshold: 50
    },
    actions: {
      channels: ['email', 'slack'],
      recipients: ['crisis-team@company.com'],
      priority: 'urgent'
    }
  })
});

// 3. Monitor dashboard
const dashboard = await fetch('/api/brand-mention-tracker/analytics/dashboard?period=day');
const metrics = await dashboard.json();

// 4. Check for crises
const crises = await fetch('/api/brand-mention-tracker/crisis/active');
const activeCrises = await crises.json();

// 5. Get influencer opportunities
const opportunities = await fetch('/api/brand-mention-tracker/influencers/opportunities');
const engagements = await opportunities.json();

// 6. Generate weekly report
const report = await fetch('/api/brand-mention-tracker/analytics/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Weekly Brand Report',
    type: 'standard',
    period: 'week',
    sections: ['overview', 'mentions', 'sentiment', 'competitors', 'influencers'],
    format: 'pdf'
  })
});
```

## Features

- **Real-time Monitoring**: Capture mentions from 10+ sources in real-time
- **AI Sentiment Analysis**: Advanced NLP with context awareness
- **Competitor Intelligence**: Share of voice and positioning analysis
- **Influencer Tracking**: Authority scoring and relationship management
- **Crisis Detection**: Multi-factor triggers with auto-escalation
- **Analytics & Reporting**: Comprehensive dashboards and custom reports
- **Smart Alerts**: Multi-channel notifications with quiet hours
- **Team Collaboration**: Response workflows with performance tracking

## Testing

Run the comprehensive test suite:

```bash
# All tests
npm test

# Specific test file
npm test brand-mention-tracker-v2-comprehensive

# With coverage
npm test -- --coverage
```

**Test Coverage:**
- 48 unit tests across 8 engines
- 1 E2E brand monitoring journey test
- Tests for all 248 API endpoints
- Edge case coverage for sentiment analysis and crisis detection

## Deployment

### Database Setup

```sql
-- PostgreSQL recommended for production
CREATE TABLE mentions (
  id VARCHAR(255) PRIMARY KEY,
  content TEXT,
  source_type VARCHAR(50),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mentions_published ON mentions(published_at);
CREATE INDEX idx_mentions_source ON mentions(source_type);

-- Partition by date for performance
CREATE TABLE mentions_2024_01 PARTITION OF mentions
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Caching Strategy

```javascript
// Redis configuration
const cacheConfig = {
  sentimentScores: '5m',      // 5 minutes
  dashboardStats: '5m',
  searchResults: '1h',
  competitorData: '15m',
  influencerProfiles: '30m'
};
```

### Job Queue

```javascript
// Bull queue for background jobs
const jobs = {
  monitoringSessions: { poll: '*/5 * * * *' },  // Every 5 minutes
  alertDelivery: { immediate: true },
  reportGeneration: { cron: '0 9 * * 1' }      // Weekly Monday 9am
};
```

## Performance Optimization

### Indexing Strategy
- Index mention `publishedAt` for time-based queries
- Index `sourceType` for filtering
- Index `brands` array for brand-specific queries
- Composite index on `(sentiment, publishedAt)` for trend queries

### Caching Layers
- Redis for frequently accessed sentiment scores
- In-memory cache for dashboard statistics
- CDN for static assets and exports

### Batch Processing
- Batch sentiment analysis for bulk imports
- Pre-aggregate analytics data for dashboard performance
- Queue-based processing for alerts and notifications

## Monitoring

Track these key metrics:

- **Mention Capture Rate**: Mentions/minute by source
- **Sentiment Analysis Latency**: Average processing time
- **Crisis Detection Speed**: Time from spike to alert
- **Alert Delivery Success**: Percentage by channel
- **Response Time Metrics**: Average time to respond

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## License

See [LICENSE](../LICENSE) for details.

---

**Version:** 2.0.0  
**Last Updated:** January 2024  
**Maintained by:** Aura Platform Team
