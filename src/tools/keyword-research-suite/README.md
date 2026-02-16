# Keyword Research Suite V2

Enterprise-grade keyword research platform with 8 specialized engines, 248 REST API endpoints, and comprehensive SEO intelligence capabilities.

## Overview

The Keyword Research Suite V2 provides complete keyword research workflow automation:
- **Keyword Discovery**: Find 50-100+ keywords from single seeds with volume, difficulty, trends
- **SERP Analysis**: Deep search results intelligence with 8 feature types
- **Competitor Research**: Track competitors, identify gaps and opportunities
- **Search Intent**: 4-way classification with buyer journey mapping
- **Keyword Clustering**: Semantic grouping with content silo automation
- **Opportunity Scoring**: Multi-factor prioritization with quick win identification
- **Rank Tracking**: Position monitoring with forecasting and alerts
- **Content Gap Analysis**: 6-dimensional gap identification with calendar generation

## Architecture

```
┌─────────────────────── KEYWORD RESEARCH SUITE V2 ───────────────────────┐
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│  │   Keyword    │───▶│  SERP        │───▶│  Competitor  │             │
│  │   Discovery  │    │  Analysis    │    │  Research    │             │
│  └──────────────┘    └──────────────┘    └──────────────┘             │
│         │                    │                     │                    │
│         └───────────────┬────┴──────────────┬──────┘                   │
│                         ▼                    ▼                          │
│                  ┌──────────────┐    ┌──────────────┐                 │
│                  │  Search      │    │  Keyword     │                 │
│                  │  Intent      │    │  Clustering  │                 │
│                  └──────────────┘    └──────────────┘                 │
│                         │                    │                          │
│                         └───────┬────────────┘                         │
│                                 ▼                                       │
│                         ┌──────────────┐                               │
│                         │ Opportunity  │                               │
│                         │  Scoring     │                               │
│                         └──────────────┘                               │
│                                 │                                       │
│                     ┌───────────┴───────────┐                         │
│                     ▼                       ▼                          │
│              ┌──────────────┐      ┌──────────────┐                  │
│              │  Rank        │      │  Content     │                  │
│              │  Tracking    │      │  Gap         │                  │
│              └──────────────┘      └──────────────┘                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. **Discovery** → Seeds expand to 50-100+ keywords with metrics
2. **SERP Analysis** → Deep dive into search results, features, content gaps
3. **Competitor Research** → Map competitor landscape, identify gaps
4. **Intent Classification** → Categorize keywords by search intent
5. **Clustering** → Group into semantic clusters, build silos
6. **Scoring** → Multi-factor evaluation, prioritization
7. **Tracking** → Monitor positions, forecast trends
8. **Gap Analysis** → Comprehensive gap identification, calendar generation

## API Reference

### Base URL
```
/api/keyword-research-suite/v2
```

### System & Health Endpoints (8 endpoints)

#### GET /health
Health check with engine status.

**Response:**
```json
{
  "ok": true,
  "service": "keyword-research-suite-v2",
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "engines": {
    "keywordDiscovery": "active",
    "serpAnalysis": "active",
    "competitorResearch": "active",
    "searchIntent": "active",
    "keywordClustering": "active",
    "opportunityScoring": "active",
    "rankTracking": "active",
    "contentGap": "active"
  }
}
```

#### GET /stats
Current usage statistics.

#### GET /metrics
System performance metrics.

#### POST /reset
Reset all data (development only).

#### GET /version
Service version information.

#### GET /capabilities
List of available capabilities.

#### GET /endpoints
Complete endpoint catalog.

#### GET /docs
API documentation link.

### Keyword Discovery Endpoints (30 endpoints)

#### POST /discovery/discover
Expand seed keyword to 50-100+ variants.

**Request:**
```json
{
  "seedKeyword": "SEO tools",
  "country": "US",
  "language": "en",
  "includeRelated": true,
  "includeQuestions": true,
  "includeLongTail": true,
  "maxResults": 100
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "search_1234567890",
    "seedKeyword": "SEO tools",
    "keywords": [
      {
        "keyword": "SEO tools",
        "type": "main",
        "volume": 22000,
        "difficulty": 65,
        "cpc": 12.50,
        "competition": 0.85,
        "wordCount": 2
      },
      {
        "keyword": "best SEO tools",
        "type": "related",
        "volume": 8900,
        "difficulty": 58,
        "cpc": 10.20,
        "competition": 0.79,
        "wordCount": 3
      }
    ],
    "totalKeywords": 85
  }
}
```

#### POST /discovery/volume
Get 12-month search volume with trend analysis.

#### POST /discovery/difficulty
Calculate difficulty score (0-100) with time-to-rank estimate.

#### POST /discovery/trends
Historical trends (5 years) with 6-month forecast.

#### POST /discovery/related
Find related keyword variants.

#### POST /discovery/questions
Extract question-based keywords (what/how/why/etc).

#### POST /discovery/long-tail
Long-tail variants (4+ words).

#### POST /discovery/bulk-analyze
Batch analysis for multiple keywords.

### SERP Analysis Endpoints (28 endpoints)

#### POST /serp/analyze
Analyze top N search results with features.

**Request:**
```json
{
  "keyword": "SEO tools",
  "location": "US",
  "device": "desktop",
  "depth": 20
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "serp_1234567890",
    "keyword": "SEO tools",
    "results": [
      {
        "position": 1,
        "url": "https://example.com/best-seo-tools",
        "domain": "example.com",
        "title": "15 Best SEO Tools for 2024",
        "meta": "Comprehensive guide...",
        "wordCount": 3500,
        "headingCount": 18,
        "imageCount": 22,
        "contentType": "listicle"
      }
    ],
    "features": [
      {
        "type": "featured-snippet",
        "format": "list",
        "domain": "example.com",
        "impact": "high"
      },
      {
        "type": "people-also-ask",
        "questions": ["What are the best free SEO tools?"],
        "impact": "medium"
      }
    ],
    "averages": {
      "wordCount": 2850,
      "titleLength": 62,
      "metaLength": 155
    }
  }
}
```

#### POST /serp/content-gaps
Identify missing topics, questions, and formats.

#### POST /serp/features
Detect 8 SERP feature types.

#### POST /serp/compare-devices
Desktop vs mobile SERP differences.

#### POST /serp/top10
Aggregate metrics from top 10 results.

#### POST /serp/featured-snippet
Featured snippet opportunity analysis.

### Competitor Research Endpoints (32 endpoints)

#### POST /competitor/add
Add competitor for tracking.

**Request:**
```json
{
  "domain": "moz.com",
  "name": "Moz",
  "industry": "SEO",
  "notes": "Major SEO platform"
}
```

#### POST /competitor/:id/analyze-keywords
Discover and categorize competitor keywords.

#### POST /competitor/keyword-overlap
Find common keywords across N competitors.

#### POST /competitor/identify-gaps
Identify keyword gaps (they rank, you don't).

#### POST /competitor/compare-authority
Domain authority comparison.

#### POST /competitor/:id/content-strategy
Analyze publishing patterns and topics.

#### POST /competitor/competitive-report
Comprehensive competitive intelligence report.

### Search Intent Endpoints (28 endpoints)

#### POST /intent/classify
4-way intent classification (informational/navigational/commercial/transactional).

**Request:**
```json
{
  "keyword": "how to do SEO"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "keyword": "how to do SEO",
    "primaryIntent": "informational",
    "confidence": 92,
    "intentScores": {
      "informational": 95,
      "navigational": 10,
      "commercial": 20,
      "transactional": 5
    },
    "recommendations": {
      "contentType": "blog-post",
      "structure": ["Introduction", "Step-by-step guide", "Tips & tricks"],
      "targetWordCount": 1500
    }
  }
}
```

#### POST /intent/bulk-classify
Classify multiple keywords with distribution analysis.

#### POST /intent/buyer-journey
Map keywords to funnel stages (awareness/consideration/decision).

#### POST /intent/distribution
Analyze intent balance across keyword set.

#### POST /intent/match-score
Score alignment between keyword intent and content type.

### Keyword Clustering Endpoints (30 endpoints)

#### POST /cluster/create
Cluster keywords by semantic similarity, topic, or intent.

**Request:**
```json
{
  "keywords": ["SEO tools", "keyword research tool", "backlink checker"],
  "method": "semantic",
  "minClusterSize": 3,
  "maxClusters": 20
}
```

#### POST /cluster/build-silo
Create pillar + supporting content structure.

#### POST /cluster/find-optimal
Determine optimal cluster count (K) using silhouette score.

#### POST /cluster/:id/quality
Analyze cluster cohesion, separation, size, coverage.

#### POST /cluster/silo-calendar
Export content silo to publishing calendar.

### Opportunity Scoring Endpoints (30 endpoints)

#### POST /scoring/score-keyword
Multi-factor scoring (volume 30%, difficulty 25%, relevance 20%, CPC 15%, trend 10%).

**Request:**
```json
{
  "keyword": "SEO tools",
  "metrics": {
    "volume": 22000,
    "difficulty": 65,
    "cpc": 12.50,
    "trend": "growing"
  },
  "businessContext": {
    "industry": "SEO",
    "targetAudience": "marketers",
    "businessGoals": ["lead-generation"]
  }
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "keyword": "SEO tools",
    "components": {
      "volume": 85,
      "difficulty": 35,
      "relevance": 95,
      "cpc": 80,
      "trend": 80
    },
    "overallScore": 72,
    "rating": "good",
    "priority": "high",
    "roi": 145.5,
    "recommendations": ["High commercial value", "Strong volume"]
  }
}
```

#### POST /scoring/score-and-rank
Rank keywords by opportunity score.

#### POST /scoring/quick-wins
Find quick wins (high volume, low difficulty, high relevance).

#### POST /scoring/prioritize-calendar
Distribute keywords across content calendar.

#### PUT /scoring/weights
Customize scoring weights.

### Rank Tracking Endpoints (32 endpoints)

#### POST /tracking/start
Start position tracking for keywords.

**Request:**
```json
{
  "keywords": ["SEO tools", "keyword research"],
  "domain": "mysite.com",
  "location": "US",
  "device": "desktop",
  "frequency": "daily"
}
```

#### POST /tracking/:id/snapshot
Take position snapshot.

#### POST /tracking/:id/history
Get ranking history with trend analysis.

#### POST /tracking/:id/alerts
Get ranking alerts (significant drops/rises/volatility).

#### POST /tracking/:id/forecast
Linear regression position forecasting.

#### POST /tracking/:id/compare-competitors
Compare your positions vs competitors.

### Content Gap Analysis Endpoints (30 endpoints)

#### POST /gap/analyze
Comprehensive gap analysis (keyword/topic/format/intent/seasonal/SERP features).

**Request:**
```json
{
  "yourDomain": "mysite.com",
  "competitorDomains": ["moz.com", "semrush.com"],
  "minVolume": 100,
  "maxDifficulty": 70
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "gap_1234567890",
    "yourDomain": "mysite.com",
    "keywordGaps": [
      {
        "keyword": "SEO audit tool",
        "volume": 5400,
        "difficulty": 58,
        "opportunityScore": 78,
        "competitorsRanking": ["moz.com", "semrush.com"]
      }
    ],
    "topicGaps": [
      {
        "topic": "Technical SEO",
        "keywordCount": 45,
        "totalVolume": 125000
      }
    ],
    "opportunities": [
      {
        "keyword": "free SEO tools",
        "type": "keyword",
        "priority": "high",
        "opportunityScore": 85
      }
    ]
  }
}
```

#### POST /gap/low-competition
Find low-competition opportunities (max difficulty 40, min volume 500).

#### POST /gap/topic-coverage
Analyze topic coverage vs industry benchmarks.

#### POST /gap/seasonal
Identify seasonal keyword gaps.

#### POST /gap/:id/calendar
Generate content calendar from gap analysis.

## Usage Examples

### Discover Keywords for Topic

```javascript
// JavaScript/Node.js
const response = await fetch('/api/keyword-research-suite/v2/discovery/discover', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    seedKeyword: 'SEO tools',
    country: 'US',
    language: 'en',
    includeRelated: true,
    includeQuestions: true,
    includeLongTail: true,
    maxResults: 100
  })
});

const result = await response.json();
console.log(`Found ${result.data.keywords.length} keywords`);
```

```bash
# cURL
curl -X POST https://yourdomain.com/api/keyword-research-suite/v2/discovery/discover \
  -H "Content-Type: application/json" \
  -d '{
    "seedKeyword": "SEO tools",
    "country": "US",
    "language": "en",
    "includeRelated": true,
    "includeQuestions": true,
    "includeLongTail": true,
    "maxResults": 100
  }'
```

```python
# Python
import requests

response = requests.post(
    'https://yourdomain.com/api/keyword-research-suite/v2/discovery/discover',
    json={
        'seedKeyword': 'SEO tools',
        'country': 'US',
        'language': 'en',
        'includeRelated': True,
        'includeQuestions': True,
        'includeLongTail': True,
        'maxResults': 100
    }
)

result = response.json()
print(f"Found {len(result['data']['keywords'])} keywords")
```

### Complete End-to-End Research Workflow

```javascript
// 1. Discover keywords
const discovery = await fetch('/api/keyword-research-suite/v2/discovery/discover', {
  method: 'POST',
  body: JSON.stringify({ seedKeyword: 'SEO tools', maxResults: 100 })
});
const keywords = await discovery.json();

// 2. Analyze SERP for top keywords
const serpAnalysis = await Promise.all(
  keywords.data.keywords.slice(0, 5).map(kw =>
    fetch('/api/keyword-research-suite/v2/serp/analyze', {
      method: 'POST',
      body: JSON.stringify({ keyword: kw.keyword, location: 'US', device: 'desktop' })
    }).then(res => res.json())
  )
);

// 3. Add competitors and find gaps
await fetch('/api/keyword-research-suite/v2/competitor/add', {
  method: 'POST',
  body: JSON.stringify({ domain: 'moz.com', name: 'Moz', industry: 'SEO' })
});

const gaps = await fetch('/api/keyword-research-suite/v2/competitor/identify-gaps', {
  method: 'POST',
  body: JSON.stringify({
    yourDomain: 'mysite.com',
    competitorIds: ['comp_1234567890']
  })
});

// 4. Cluster keywords
const clusters = await fetch('/api/keyword-research-suite/v2/cluster/create', {
  method: 'POST',
  body: JSON.stringify({
    keywords: keywords.data.keywords.map(k => k.keyword),
    method: 'semantic',
    minClusterSize: 3
  })
});

// 5. Score opportunities
const scores = await fetch('/api/keyword-research-suite/v2/scoring/score-and-rank', {
  method: 'POST',
  body: JSON.stringify({
    keywords: keywords.data.keywords.slice(0, 20).map(k => ({
      keyword: k.keyword,
      metrics: { volume: k.volume, difficulty: k.difficulty, cpc: k.cpc, trend: 'stable' }
    }))
  })
});

// 6. Start tracking quick wins
const tracking = await fetch('/api/keyword-research-suite/v2/tracking/start', {
  method: 'POST',
  body: JSON.stringify({
    keywords: scores.data.quickWins.slice(0, 10).map(k => k.keyword),
    domain: 'mysite.com',
    location: 'US',
    frequency: 'daily'
  })
});

// 7. Generate content calendar
const calendar = await fetch('/api/keyword-research-suite/v2/gap/:id/calendar', {
  method: 'POST',
  body: JSON.stringify({
    startDate: new Date().toISOString(),
    frequency: 'weekly',
    maxPieces: 52
  })
});

console.log('✅ Complete research workflow executed');
```

## Deployment Guide

### Environment Variables

```bash
# Required
KEYWORD_DB_URL=postgresql://user:pass@host:5432/keywords
SERP_API_KEY=your_serp_api_key
COMPETITOR_API_KEY=your_competitor_api_key

# Optional
KEYWORD_CACHE_TTL=3600
RANK_CHECK_INTERVAL=86400
MAX_CONCURRENT_REQUESTS=50
```

### Database Setup

```sql
-- Keywords table
CREATE TABLE keywords (
  id VARCHAR(255) PRIMARY KEY,
  keyword VARCHAR(500) NOT NULL,
  volume INTEGER,
  difficulty INTEGER,
  cpc DECIMAL(10, 2),
  competition DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_keyword (keyword),
  INDEX idx_volume (volume),
  INDEX idx_difficulty (difficulty)
);

-- Rankings table
CREATE TABLE rankings (
  id VARCHAR(255) PRIMARY KEY,
  keyword_id VARCHAR(255) REFERENCES keywords(id),
  domain VARCHAR(255) NOT NULL,
  position INTEGER,
  url TEXT,
  snapshot_date TIMESTAMP DEFAULT NOW(),
  INDEX idx_keyword_domain (keyword_id, domain),
  INDEX idx_snapshot_date (snapshot_date)
);

-- Competitors table
CREATE TABLE competitors (
  id VARCHAR(255) PRIMARY KEY,
  domain VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  domain_authority INTEGER,
  estimated_traffic BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_domain (domain)
);
```

### Installation

```bash
# Install dependencies
npm install

# Or with Yarn
yarn install
```

### Scaling Recommendations

**Load Balancer + Multiple Instances:**
```
         ┌─────────────┐
Client──▶│Load Balancer│
         └──────┬──────┘
                │
        ┌───────┼───────┐
        ▼       ▼       ▼
      [Inst1][Inst2][Inst3]
        │       │       │
        └───────┴───────┘
                │
         ┌──────▼──────┐
         │  PostgreSQL │
         └─────────────┘
```

**Redis Caching:**
- Cache keyword data (TTL: 1 hour)
- Cache SERP analyses (TTL: 24 hours)
- Cache competitor metrics (TTL: 7 days)

**CDN for Reports:**
- Static report exports
- Content calendar exports
- Gap analysis PDFs

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

```bash
# Build and run
docker build -t keyword-research-suite .
docker run -p 3000:3000 \
  -e KEYWORD_DB_URL=postgresql://... \
  -e SERP_API_KEY=... \
  keyword-research-suite
```

### Production Considerations

**API Rate Limits:**
- SERP API: 1000 requests/day (consider batching)
- Competitor API: 500 requests/day
- Implement exponential backoff for retries

**Data Freshness:**
- Keyword volume: Update monthly
- SERP results: Update weekly
- Rankings: Daily snapshots
- Competitor metrics: Weekly refresh

## Performance Benchmarks

**Endpoint Latency Targets:**
- Keyword Discovery: < 500ms
- SERP Analysis: < 1s
- Competitor Analysis: < 2s
- Clustering (100 keywords): < 3s
- Forecasting: < 1s
- Gap Analysis: < 2s

**Throughput:**
- 1000 requests/minute per instance
- 50+ concurrent keyword analyses
- Horizontal scaling with load balancer

**Database Query Optimization:**
- Index on keyword, volume, difficulty
- Composite index on (keyword_id, domain, snapshot_date
- Query execution plan analysis with EXPLAIN
- Connection pooling (max 20 connections)

## Troubleshooting

### Common Errors

**SERP API Rate Limit:**
```
Error: SERP API rate limit exceeded
Solution: Implement request queuing with exponential backoff
```

**Competitor Domain Not Found:**
```
Error: Competitor not found: comp_123
Solution: Verify competitor ID or use GET /competitor/list
```

**Insufficient Data for Forecast:**
```
Error: Need at least 7 snapshots for forecasting
Solution: Take more snapshots or reduce forecast period
```

**Cluster Quality Low:**
```
Warning: Silhouette score < 0.5
Solution: Adjust minClusterSize, try different method, or increase keyword similarity
```

### Debug Logging

```javascript
// Enable debug mode
process.env.DEBUG = 'keyword-research:*';

// Logs will show:
// keyword-research:discovery Analyzing seed: SEO tools
// keyword-research:serp Fetching SERP for: SEO tools
// keyword-research:scoring Applying weights: {volume: 0.3, difficulty: 0.25}
```

### Health Check Monitoring

```bash
# Check service health
curl https://yourdomain.com/api/keyword-research-suite/v2/health

# Check stats
curl https://yourdomain.com/api/keyword-research-suite/v2/stats

# Check metrics
curl https://yourdomain.com/api/keyword-research-suite/v2/metrics
```

## Best Practices

### Keyword Research Workflow

**1. Start Broad → Narrow Down:**
- Begin with seed keywords
- Analyze SERP to understand landscape
- Check competitors for gaps
- Cluster related keywords
- Score and prioritize opportunities

**2. Intent Optimization:**
- Match content type to dominant SERP intent
- Balance funnel distribution (awareness: 40%, consideration: 30%, decision: 30%)
- Create content for each intent type

**3. Competitor Research:**
- Track 3-5 direct competitors
- Weekly snapshot frequency recommended
- Focus on gaps in positions 11-20 (page 2)

**4. Clustering Strategy:**
- Use semantic method for content planning
- Optimal K typically 8-12 clusters for 100 keywords
- Merge similar clusters with threshold > 0.7

**5. Opportunity Scoring:**
- Customize weights based on business goals (e.g., more weight on CPC for lead gen)
- Prioritize quick wins for early momentum
- Long-term keywords for authority building

**6. Rank Tracking:**
- Daily tracking for active campaigns
- Weekly tracking for monitoring
- Configure alerts for ±5 position changes
- Forecast with caution (confidence decreases over time)

## License

Proprietary - Aura CDP Platform

## Support

For technical support: support@auracdp.com  
Documentation: https://docs.auracdp.com/keyword-research-suite  
Status: https://status.auracdp.com

---

**Tool #22 - Keyword Research Suite V2**  
Version 2.0.0 | Last Updated: 2024-01-15  
Part of Aura CDP Enterprise Platform
