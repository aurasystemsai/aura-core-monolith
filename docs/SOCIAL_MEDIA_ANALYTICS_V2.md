# Social Media Analytics & Listening V2

Enterprise-grade social media management platform with comprehensive analytics, content optimization, audience insights, and competitive intelligence.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Installation](#installation)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Features](#features)
- [Testing](#testing)
- [Deployment](#deployment)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)

## Architecture Overview

Social Media Analytics & Listening V2 is built with 8 specialized engines that work together to provide comprehensive social media management:

### 1. Platform Analytics Engine
**Purpose**: Multi-platform account management and health monitoring

**Features**:
- Connect and manage 7 social platforms (Facebook, Instagram, Twitter, LinkedIn, TikTok, YouTube, Pinterest)
- Real-time metrics syncing with automatic calculations
- Health scoring (0-100) based on 5 key factors
- Growth trend analysis with direction indicators
- Performance reports with period comparisons
- Automated recommendations with priority levels

**Key Functions**: `connectPlatformAccount`, `syncPlatformMetrics`, `calculateAccountHealth`, `getGrowthTrends`, `generatePerformanceReport`

### 2. Content Performance Engine
**Purpose**: Content tracking and performance optimization

**Features**:
- Track 6 post types (feed, story, reel, video, carousel, live)
- Performance scoring 0-100 with viral/excellent/good/fair/poor ratings
- Best time to post analysis with hourly and daily recommendations
- Top performing content by multiple metrics
- Content type performance comparison
- Performance baselines for benchmarking

**Key Functions**: `trackContentPost`, `calculateContentScore`, `analyzeBestTimeToPost`, `getTopPerformingContent`, `analyzeContentTypePerformance`

### 3. Audience Analytics Engine
**Purpose**: Deep audience understanding and segmentation

**Features**:
- Audience quality scoring with activity/verified/size factors
- Demographics analysis (7 age groups, gender, geography, languages, devices)
- Interest and affinity tracking with engagement levels
- Behavior pattern analysis (active hours, days, session duration)
- Growth segmentation (new/churned/consistent/reactivated followers)
- Segment comparison and insights

**Key Functions**: `createAudienceProfile`, `analyzeDemographics`, `analyzeAudienceInterests`, `trackBehaviorPatterns`, `segmentAudienceByGrowth`

### 4. Engagement Optimization Engine
**Purpose**: Automated engagement and community building

**Features**:
- Engagement strategies with objectives and tactics
- Response tactics with 5 trigger types and auto-respond capability
- A/B testing with confidence level calculation and winner determination
- Community health scoring (0-100) with engagement distribution
- Engagement campaigns (contests, challenges, UGC, Q&A, collaborations)
- Performance tracking with success rates

**Key Functions**: `createEngagementStrategy`, `createResponseTactic`, `createABTest`, `trackCommunityMetrics`, `createEngagementCampaign`

### 5. Hashtag & Trend Engine
**Purpose**: Hashtag intelligence and trend discovery

**Features**:
- Hashtag tracking with 5 categories (branded/trending/niche/industry/general)
- Performance scoring with status tracking (active/trending/declining/inactive)
- Trending topic discovery with volume/growth/relevance analysis
- Trend analysis with timeline, sentiment, and influencer tracking
- AI-powered hashtag suggestions with recommended mix (max 10)
- Leaderboard and competition analysis

**Key Functions**: `trackHashtag`, `updateHashtagPerformance`, `discoverTrendingTopics`, `analyzeTrend`, `suggestHashtags`

### 6. Publishing & Scheduling Engine
**Purpose**: Content publishing automation

**Features**:
- Post scheduling with cross-platform support
- Content queues with auto-posting capability
- Publishing rules with 3 condition types and 3 action types
- Calendar view with date-based grouping
- Best posting time recommendations
- Bulk scheduling for multiple posts
- 95% success rate with automatic retry

**Key Functions**: `schedulePost`, `publishScheduledPost`, `createContentQueue`, `createPublishingRule`, `getCalendarView`, `bulkSchedulePosts`

### 7. Campaign Analytics Engine
**Purpose**: Campaign ROI and attribution tracking

**Features**:
- 6 campaign types (awareness/engagement/traffic/conversions/lead_generation/app_installs)
- Budget tracking with daily limits and utilization monitoring
- 5 attribution models (first_click/last_click/linear/time_decay/position_based)
- ROI and ROAS analysis with efficiency metrics (CPM/CPC/CPA/LTV)
- Goal setting with progress tracking and status indicators
- Campaign comparison with best performer identification

**Key Functions**: `createCampaign`, `launchCampaign`, `trackAttribution`, `analyzeROI`, `setCampaignGoal`, `compareCampaigns`

### 8. Competitor Benchmarking Engine
**Purpose**: Competitive intelligence and market positioning

**Features**:
- Competitor tracking across multiple platforms
- Performance scoring (0-100) with metrics analysis
- Benchmarking with industry averages and top 10%
- Market position analysis with BCG matrix quadrants
- SWOT analysis with strengths/weaknesses/opportunities/threats
- Competitive insights with rising/declining competitor identification

**Key Functions**: `addCompetitor`, `trackCompetitorMetrics`, `createBenchmark`, `analyzeMarketPosition`, `generateCompetitiveInsights`

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd aura-core-monolith-main

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

## API Reference

### Platform Analytics (30 endpoints)

#### Connect Platform Account
```http
POST /api/social-media/platform/accounts/connect
```

**Request**:
```json
{
  "platform": "instagram",
  "handle": "@mybrand",
  "accountType": "business",
  "accessToken": "token_123",
  "primaryObjective": "engagement"
}
```

**Response**:
```json
{
  "success": true,
  "account": {
    "id": 1,
    "platform": "instagram",
    "handle": "@mybrand",
    "accountType": "business",
    "primaryObjective": "engagement",
    "connectedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Sync Platform Metrics
```http
POST /api/social-media/platform/accounts/:accountId/sync
```

**Request**:
```json
{
  "period": "30days",
  "followers": {
    "total": 125000,
    "gained": 5200,
    "lost": 1100
  },
  "engagement": {
    "total": 45000,
    "likes": 32000,
    "comments": 8000,
    "shares": 5000
  },
  "reach": {
    "total": 450000,
    "impressions": 650000
  }
}
```

**Response**:
```json
{
  "success": true,
  "metrics": {
    "period": "30days",
    "followers": {
      "total": 125000,
      "gained": 5200,
      "lost": 1100,
      "netGrowth": 4100,
      "growthRate": 3.28
    },
    "engagement": {
      "total": 45000,
      "avgPerPost": 1500,
      "engagementRate": 4.8
    }
  }
}
```

### Content Performance (32 endpoints)

#### Track Content Post
```http
POST /api/social-media/content/posts
```

**Request**:
```json
{
  "accountId": 1,
  "platform": "instagram",
  "postType": "feed",
  "content": {
    "text": "Check out our new product! #awesome",
    "mediaType": "image",
    "hashtags": ["awesome", "newproduct"],
    "mentions": ["@partner"],
    "location": "New York, NY"
  }
}
```

**Response**:
```json
{
  "success": true,
  "post": {
    "id": 1,
    "accountId": 1,
    "platform": "instagram",
    "postType": "feed",
    "metrics": {
      "likes": 0,
      "comments": 0,
      "shares": 0,
      "engagementRate": 0
    },
    "postedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Calculate Content Score
```http
POST /api/social-media/content/posts/:postId/score
```

**Response**:
```json
{
  "success": true,
  "score": {
    "totalScore": 72,
    "rating": "good",
    "breakdown": {
      "engagementRate": 30,
      "reach": 20,
      "contentQuality": 15,
      "saveShare": 7
    }
  }
}
```

### Engagement Optimization (32 endpoints)

#### Create A/B Test
```http
POST /api/social-media/engagement/ab-tests
```

**Request**:
```json
{
  "accountId": 1,
  "hypothesis": "Emojis increase engagement",
  "variants": {
    "A": {
      "name": "Without Emojis",
      "configuration": { "useEmojis": false }
    },
    "B": {
      "name": "With Emojis",
      "configuration": { "useEmojis": true }
    }
  },
  "metric": "engagement_rate",
  "sampleSize": 1000,
  "duration": 7
}
```

**Response**:
```json
{
  "success": true,
  "test": {
    "id": 1,
    "hypothesis": "Emojis increase engagement",
    "status": "draft",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Hashtag & Trends (30 endpoints)

#### Suggest Hashtags
```http
POST /api/social-media/hashtags/suggest
```

**Request**:
```json
{
  "accountId": 1,
  "contentText": "Exciting new AI product launch!",
  "category": "technology",
  "targetReach": "medium"
}
```

**Response**:
```json
{
  "success": true,
  "suggestion": {
    "suggestions": [
      { "tag": "AI", "category": "trending", "estimatedReach": 150000 },
      { "tag": "TechInnovation", "category": "niche", "estimatedReach": 45000 }
    ],
    "recommendedMix": ["AI", "ProductLaunch", "Innovation"],
    "estimatedReach": { "min": 50000, "max": 200000, "avg": 125000 }
  }
}
```

### Campaign Analytics (32 endpoints)

#### Analyze ROI
```http
POST /api/social-media/campaigns/:campaignId/roi
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "investment": {
      "budgetAllocated": 5000,
      "budgetSpent": 3200,
      "utilizationRate": 64
    },
    "returns": {
      "totalRevenue": 12500,
      "netProfit": 9300,
      "ROI": 290.63,
      "ROAS": 3.91
    },
    "efficiency": {
      "CPM": 12.80,
      "CPC": 2.67,
      "CPA": 37.65,
      "LTV": 147.06
    }
  }
}
```

### Competitor Benchmarking (32 endpoints)

#### Analyze Market Position
```http
POST /api/social-media/competitors/market-position
```

**Request**:
```json
{
  "accountId": 1,
  "yourMetrics": {
    "followers": 125000,
    "engagementRate": 4.8,
    "growthRate": 3.2,
    "contentQuality": 75
  },
  "competitors": [
    {
      "competitorId": 1,
      "followers": 85000,
      "engagementRate": 3.2,
      "growthRate": 2.1
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "position": {
    "quadrant": "leader",
    "overallScore": 85,
    "swot": {
      "strengths": ["High engagement rate", "Strong growth"],
      "weaknesses": [],
      "opportunities": ["Increase posting frequency"],
      "threats": ["Emerging competitors in segment"]
    }
  }
}
```

### System (2 endpoints)

#### Health Check
```http
GET /api/social-media/health
```

**Response**:
```json
{
  "success": true,
  "status": "operational",
  "services": {
    "platformAnalytics": "up",
    "contentPerformance": "up",
    "audienceAnalytics": "up",
    "engagementOptimization": "up",
    "hashtagTrend": "up",
    "publishingScheduling": "up",
    "campaignAnalytics": "up",
    "competitorBenchmarking": "up"
  }
}
```

## Usage Examples

### Complete Social Media Management Workflow

```javascript
const axios = require('axios');
const API_BASE = 'http://localhost:3000/api/social-media';

// Step 1: Connect platform account
const connectAccount = async () => {
  const response = await axios.post(`${API_BASE}/platform/accounts/connect`, {
    platform: 'instagram',
    handle: '@mybrand',
    accountType: 'business',
    accessToken: 'your_token',
    primaryObjective: 'engagement'
  });
  return response.data.account.id;
};

// Step 2: Sync metrics
const syncMetrics = async (accountId) => {
  await axios.post(`${API_BASE}/platform/accounts/${accountId}/sync`, {
    period: '30days',
    followers: { total: 125000, gained: 5200, lost: 1100 },
    engagement: { total: 45000, likes: 32000, comments: 8000, shares: 5000 }
  });
};

// Step 3: Track content
const trackContent = async (accountId) => {
  const response = await axios.post(`${API_BASE}/content/posts`, {
    accountId,
    platform: 'instagram',
    postType: 'feed',
    content: {
      text: 'New product launch!',
      mediaType: 'image',
      hashtags: ['product', 'launch']
    }
  });
  return response.data.post.id;
};

// Step 4: Get hashtag suggestions
const getHashtagSuggestions = async (accountId) => {
  const response = await axios.post(`${API_BASE}/hashtags/suggest`, {
    accountId,
    contentText: 'New AI-powered product',
    targetReach: 'high'
  });
  return response.data.suggestion.recommendedMix;
};

// Step 5: Schedule post
const schedulePost = async (accountId, hashtags) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  await axios.post(`${API_BASE}/publishing/schedule`, {
    accountId,
    platform: 'instagram',
    content: {
      text: `New product! ${hashtags.map(h => `#${h}`).join(' ')}`,
      mediaUrls: ['https://example.com/image.jpg']
    },
    scheduledFor: tomorrow.toISOString(),
    postType: 'feed',
    settings: {
      crossPost: ['facebook'],
      trackConversions: true
    }
  });
};

// Step 6: Create campaign
const createCampaign = async (accountId) => {
  const response = await axios.post(`${API_BASE}/campaigns`, {
    accountId,
    name: 'Product Launch Campaign',
    type: 'conversions',
    budget: { total: 5000, currency: 'USD', dailyLimit: 200 },
    schedule: {
      startDate: '2024-01-01',
      endDate: '2024-03-31'
    },
    platforms: ['instagram', 'facebook']
  });
  return response.data.campaign.id;
};

// Run complete workflow
const runWorkflow = async () => {
  try {
    const accountId = await connectAccount();
    await syncMetrics(accountId);
    const postId = await trackContent(accountId);
    const hashtags = await getHashtagSuggestions(accountId);
    await schedulePost(accountId, hashtags);
    const campaignId = await createCampaign(accountId);
    
    console.log('Workflow completed successfully!');
    console.log({ accountId, postId, campaignId });
  } catch (error) {
    console.error('Workflow failed:', error.message);
  }
};

runWorkflow();
```

## Features

- **Multi-Platform Support**: Manage 7 social media platforms from a single interface
- **Real-Time Analytics**: Track performance metrics across all connected accounts
- **AI-Powered Insights**: Get intelligent recommendations and predictions
- **Content Optimization**: Discover best posting times and content types
- **Audience Intelligence**: Deep understanding of demographics, interests, and behaviors
- **Engagement Automation**: Automated responses and community management
- **Hashtag Intelligence**: Trending topic discovery and performance tracking
- **Publishing Automation**: Schedule posts and manage content queues
- **Campaign ROI Tracking**: Multi-attribution modeling and profitability analysis
- **Competitive Intelligence**: Benchmark against competitors and industry standards
- **A/B Testing**: Experiment with different strategies and measure results
- **Comprehensive Reporting**: Detailed performance reports with insights

## Testing

### Run All Tests

```bash
npm test -- social-media-analytics-v2-comprehensive
```

### Test Coverage

- **48 Unit Tests**: Individual engine function testing
- **1 E2E Test**: Complete workflow integration testing
- **248 Endpoints**: Full API coverage

### Test Structure

- Platform Analytics: 6 tests
- Content Performance: 6 tests
- Audience Analytics: 6 tests
- Engagement Optimization: 6 tests
- Hashtag & Trends: 6 tests
- Publishing & Scheduling: 6 tests
- Campaign Analytics: 6 tests
- Competitor Benchmarking: 6 tests
- System Endpoints: 2 tests
- E2E Journey: 1 test

## Deployment

### PostgreSQL Database Setup

```sql
-- Platform accounts table
CREATE TABLE platform_accounts (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  handle VARCHAR(255) NOT NULL,
  account_type VARCHAR(50),
  access_token TEXT,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_platform (platform),
  INDEX idx_handle (handle)
);

-- Content posts table with partitioning by month
CREATE TABLE content_posts (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES platform_accounts(id),
  platform VARCHAR(50),
  post_type VARCHAR(50),
  content JSONB,
  metrics JSONB,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_account_posted (account_id, posted_at),
  INDEX idx_platform_type (platform, post_type)
) PARTITION BY RANGE (posted_at);

-- Hashtag performance table
CREATE TABLE hashtag_performance (
  id SERIAL PRIMARY KEY,
  account_id INTEGER,
  tag VARCHAR(255),
  category VARCHAR(50),
  performance_score INTEGER,
  total_reach BIGINT,
  total_engagement BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_account_tag (account_id, tag),
  INDEX idx_score (performance_score DESC)
);

-- Campaign analytics table
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  account_id INTEGER,
  name VARCHAR(255),
  type VARCHAR(50),
  budget JSONB,
  schedule JSONB,
  performance JSONB,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_account_status (account_id, status)
);
```

### Redis Caching Strategy

```javascript
// Cache configuration
const cacheConfig = {
  // Platform metrics - 5 minute TTL
  'platform:metrics:*': 300,
  
  // Content scores - 15 minute TTL
  'content:scores:*': 900,
  
  // Audience profiles - 1 hour TTL
  'audience:profiles:*': 3600,
  
  // Hashtag trending - 10 minute TTL
  'hashtags:trending': 600,
  
  // Campaign ROI - 30 minute TTL
  'campaign:roi:*': 1800,
  
  // Competitor metrics - 1 hour TTL
  'competitor:metrics:*': 3600
};
```

### Bull Job Queue Configuration

```javascript
const Queue = require('bull');

// Metric sync job queue
const metricSyncQueue = new Queue('metric-sync', {
  redis: { host: 'localhost', port: 6379 }
});

// Schedule periodic metric syncing
metricSyncQueue.add('sync-all-platforms', {}, {
  repeat: { cron: '0 */6 * * *' } // Every 6 hours
});

// Content scoring job queue
const contentScoringQueue = new Queue('content-scoring');
contentScoringQueue.process(async (job) => {
  const { postId } = job.data;
  await calculateContentScore(postId);
});

// Publishing job queue
const publishingQueue = new Queue('publishing');
publishingQueue.add('publish-scheduled', {}, {
  repeat: { cron: '*/5 * * * *' } // Every 5 minutes
});
```

## Performance Optimization

### Database Indexing Strategy

```sql
-- Composite indexes for common queries
CREATE INDEX idx_posts_account_date ON content_posts(account_id, posted_at DESC);
CREATE INDEX idx_posts_score ON content_posts((metrics->>'performanceScore')::int DESC);
CREATE INDEX idx_hashtags_account_score ON hashtag_performance(account_id, performance_score DESC);
CREATE INDEX idx_campaigns_status_date ON campaigns(status, created_at DESC);
```

### Caching Layers

1. **Application Cache**: Redis for frequently accessed data
2. **Query Result Cache**: PostgreSQL query result caching
3. **CDN Cache**: Static content and images

### Batch Processing

```javascript
// Bulk metric updates
const bulkUpdateMetrics = async (updates) => {
  const batch = updates.map(update => ({
    updateOne: {
      filter: { _id: update.id },
      update: { $set: update.metrics }
    }
  }));
  
  await db.collection('metrics').bulkWrite(batch);
};
```

## Monitoring

### Key Metrics to Track

1. **API Performance**
   - Average response time per endpoint
   - Error rate by endpoint
   - Request throughput (requests/second)

2. **Data Processing**
   - Metric sync success rate
   - Content scoring queue length
   - Publishing success rate

3. **Business Metrics**
   - Active platform accounts
   - Total posts tracked
   - Campaign ROI averages
   - Competitor tracking coverage

4. **System Health**
   - Database connection pool utilization
   - Redis memory usage
   - Queue processing lag

### Logging Strategy

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
   new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log important events
logger.info('Platform account connected', { accountId, platform });
logger.warn('Campaign budget 80% utilized', { campaignId, spent, total });
logger.error('Publishing failed', { postId, error: err.message });
```

---

## Version

**v2.0.0** - January 2024

## Support

For issues and questions, please contact the development team.

## License

Proprietary - All rights reserved
