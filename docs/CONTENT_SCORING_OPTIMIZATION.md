# Content Scoring & Optimization

Enterprise content quality analysis and SEO optimization platform with AI-powered enhancements.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [API Reference](#api-reference)
- [Features](#features)
- [Testing](#testing)
- [Deployment](#deployment)
- [Performance Optimization](#performance-optimization)

## Overview

The Content Scoring & Optimization tool provides comprehensive content analysis, scoring, and optimization capabilities. It combines traditional SEO metrics with AI-powered insights to help content creators produce high-quality, engaging, and search-optimized content.

### Key Capabilities

- **Content Analysis**: Deep analysis of structure, keywords, and readability
- **SEO Scoring**: Multi-factor SEO evaluation with actionable recommendations
- **Readability Assessment**: Multiple readability formulas (Flesch, Gunning Fog, SMOG, etc.)
- **Competitor Analysis**: SERP analysis and content gap identification
- **AI Enhancement**: Content rewriting, tone optimization, and variations
- **Template Library**: Pre-built templates for consistent quality
- **Performance Tracking**: Historical monitoring and A/B testing
- **Recommendations Engine**: Prioritized optimization suggestions

## Architecture

### Backend Engines

#### 1. Content Analysis Engine
**Location**: `src/tools/content-scoring-optimization/content-analysis-engine.js`

Analyzes content structure, extracts keywords, and calculates readability metrics.

**Key Functions**:
- `analyzeContent(data)` - Complete content analysis
- `extractKeywords(content, maxKeywords)` - TF-IDF keyword extraction
- `calculateReadability(content)` - Multiple readability scores
- `analyzeStructure(content)` - Word/paragraph/sentence counts
- `getContentAnalysis(contentId)` - Retrieve analysis by ID
- `getStatistics()` - Aggregated analytics

#### 2. SEO Scoring Engine
**Location**: `src/tools/content-scoring-optimization/seo-scoring-engine.js`

Multi-factor SEO evaluation including keywords, meta tags, headings, and links.

**Key Functions**:
- `calculateSEOScore(data)` - Comprehensive SEO scoring (0-100)
- `analyzeKeywords(primaryKeyword, content, targetDensity)` - Keyword density analysis
- `validateMetaTags(title, description, keywords)` - Meta tag validation
- `analyzeHeadings(headings)` - Heading structure evaluation
- `analyzeLinkStructure(internalLinks, externalLinks)` - Link analysis
- `getSEOScore(contentId)` - Retrieve SEO score by ID

**Scoring Breakdown**:
- Keywords (30 points): Density, placement, variations
- Meta Tags (25 points): Title length, description quality
- Headings (20 points): H1 presence, hierarchy
- Links (15 points): Internal/external balance
- Images (10 points): Alt text presence

#### 3. Readability & Engagement Engine
**Location**: `src/tools/content-scoring-optimization/readability-engagement-engine.js`

Calculates readability scores and predicts engagement potential.

**Key Functions**:
- `analyzeReadability(data)` - Multiple readability formulas
- `calculateEngagementScore(data)` - Engagement potential scoring
- `predictPerformance(data)` - Performance predictions
- `suggestImprovements(content, targetDifficulty)` - Readability suggestions
- `getReadabilityAnalysis(contentId)` - Retrieve readability by ID

**Readability Formulas**:
- Flesch Reading Ease (0-100 scale)
- Flesch-Kincaid Grade Level
- Gunning Fog Index
- SMOG Index

**Engagement Factors**:
- Multimedia presence (30 points)
- Formatting quality (25 points)
- Interactivity (25 points)
- Content length (20 points)

#### 4. Competitor Analysis Engine
**Location**: `src/tools/content-scoring-optimization/competitor-analysis-engine.js`

SERP analysis, content gap identification, and competitive benchmarking.

**Key Functions**:
- `analyzeCompetitors(keyword, competitorUrls, includeMetrics)` - Competitor content analysis
- `identifyContentGaps(yourContent, competitorContents)` - Gap analysis
- `compareMetrics(yourUrl, competitorUrls, metrics)` - Metric comparison
- `getSERPAnalysis(keyword, location, topN)` - Top ranking content analysis
- `getCompetitorAnalysis(analysisId)` - Retrieve analysis by ID

#### 5. Optimization Recommendations Engine
**Location**: `src/tools/content-scoring-optimization/optimization-recommendations-engine.js`

AI-powered recommendation generation with impact prioritization.

**Key Functions**:
- `generateRecommendations(data)` - Create optimization recommendations
- `applyRecommendation(contentId, recommendationId, applied, feedback)` - Track applied recommendations
- `prioritizeRecommendations(recommendations, optimizeFor)` - Prioritization algorithm
- `getQuickWins(contentId, maxEffort, minImpact)` - Identify quick wins
- `getRecommendations(contentId)` - Retrieve recommendations by ID

**Recommendation Types**:
- SEO improvements
- Readability enhancements
- Engagement optimizations
- Structure refinements

**Priority Levels**:
- Critical: High impact, urgent action
- High: Significant impact, important
- Medium: Moderate impact, recommended
- Low: Minor impact, optional

#### 6. Content Templates Engine
**Location**: `src/tools/content-scoring-optimization/content-templates-engine.js`

Template library for consistent content quality.

**Key Functions**:
- `createTemplate(data)` - Create new template
- `getTemplate(templateId)` - Retrieve template by ID
- `listTemplates(category, sortBy)` - List templates with filters
- `validateContent(templateId, content, metadata)` - Template validation
- `cloneTemplate(sourceTemplateId, newName, modifications)` - Template cloning
- `updateTemplate(templateId, updates)` - Update existing template

**Template Components**:
- Structure sections with word count ranges
- Required elements (headings, images, CTAs)
- SEO guidelines (keyword density, meta requirements)
- Target metrics (readability, SEO, engagement scores)

#### 7. Performance Tracking Engine
**Location**: `src/tools/content-scoring-optimization/performance-tracking-engine.js`

Historical performance monitoring and A/B testing.

**Key Functions**:
- `trackPerformance(data)` - Record performance metrics
- `getPerformance(contentId)` - Retrieve performance data
- `getPerformanceTrends(contentId, timeRange, metrics)` - Trend analysis
- `compareTimePeriods(contentId, period1, period2)` - Period comparison
- `createABTest(data)` - Create A/B test
- `updateABTest(testId, results)` - Update test results

**Tracked Metrics**:
- Views and unique visitors
- Time on page
- Bounce rate
- Social shares and comments
- Engagement rate
- Conversion rate

#### 8. AI Enhancement Engine
**Location**: `src/tools/content-scoring-optimization/ai-enhancement-engine.js`

AI-powered content improvement and rewriting.

**Key Functions**:
- `enhanceContent(data)` - Comprehensive content enhancement
- `rewriteContent(content, style, length)` - Content rewriting
- `generateVariations(headline, count)` - Headline variations
- `suggestImprovements(content, context, goals)` - Contextual suggestions
- `optimizeTone(content, targetTone, currentTone)` - Tone optimization
- `getEnhancement(contentId)` - Retrieve enhancement by ID

**Enhancement Types**:
- Improve readability
- Add transitions
- Enhance vocabulary
- Strengthen CTAs
- Optimize structure

## Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+

### Setup

```bash
# Clone repository
git clone https://github.com/aurasystemsai/aura-core-monolith.git
cd aura-core-monolith

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and API credentials

# Start server
npm start
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/aura
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
PORT=3000
```

## API Reference

### Content Analysis

#### Analyze Content
```http
POST /api/content-scoring/content-analysis/analyze
Content-Type: application/json

{
  "contentId": "blog-post-123",
  "contentType": "blog_post",
  "title": "Article Title",
  "content": "Article content...",
  "url": "https://example.com/article",
  "metadata": {
    "author": "John Doe",
    "category": "Technology"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "contentId": "blog-post-123",
    "structure": {
      "wordCount": 1250,
      "paragraphCount": 15,
      "sentenceCount": 68,
      "avgWordsPerSentence": 18.4,
      "avgSentencesPerParagraph": 4.5
    },
    "readability": {
      "fleschReadingEase": 68.5,
      "fleschKincaidGrade": 8.2,
      "difficulty": "medium"
    },
    "keywords": [
      { "keyword": "content marketing", "score": 8.5 },
      { "keyword": "digital strategy", "score": 7.2 }
    ]
  }
}
```

#### Extract Keywords
```http
POST /api/content-scoring/content-analysis/extract-keywords

{
  "content": "Your content here...",
  "maxKeywords": 10
}
```

### SEO Scoring

#### Calculate SEO Score
```http
POST /api/content-scoring/seo/score

{
  "contentId": "blog-post-123",
  "url": "https://example.com/article",
  "title": "Article Title",
  "metaDescription": "Meta description...",
  "headings": {
    "h1": ["Main Heading"],
    "h2": ["Section 1", "Section 2"],
    "h3": ["Subsection 1.1", "Subsection 1.2"]
  },
  "content": "Article content...",
  "images": [
    { "alt": "Image description", "src": "/image.jpg" }
  ],
  "internalLinks": 5,
  "externalLinks": 3,
  "keywords": ["primary keyword", "secondary keyword"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "contentId": "blog-post-123",
    "score": 82,
    "grade": "B",
    "breakdown": {
      "keywords": { "score": 25, "max": 30 },
      "meta": { "score": 22, "max": 25 },
      "headings": { "score": 18, "max": 20 },
      "links": { "score": 12, "max": 15 },
      "images": { "score": 8, "max": 10 }
    },
    "recommendations": [
      "Increase keyword density to 1.5-2.0%",
      "Add 2-3 more internal links"
    ]
  }
}
```

### Readability & Engagement

#### Analyze Readability
```http
POST /api/content-scoring/readability/analyze

{
  "contentId": "article-456",
  "content": "Your content...",
  "targetAudience": "general"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "contentId": "article-456",
    "scores": {
      "fleschReadingEase": 70.5,
      "fleschKincaidGrade": 7.8,
      "gunningFog": 9.2,
      "smog": 8.5
    },
    "difficulty": "medium",
    "audienceMatch": "good"
  }
}
```

#### Calculate Engagement Score
```http
POST /api/content-scoring/readability/engagement

{
  "content": "Your content...",
  "hasImages": true,
  "hasVideos": false,
  "hasLists": true,
  "hasQuestions": true,
  "wordCount": 1200
}
```

### Competitor Analysis

#### Analyze Competitors
```http
POST /api/content-scoring/competitor/analyze

{
  "keyword": "content marketing",
  "competitorUrls": [
    "https://competitor1.com/article",
    "https://competitor2.com/guide"
  ],
  "includeMetrics": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "analysisId": "comp-analysis-123",
    "keyword": "content marketing",
    "competitors": [
      {
        "url": "https://competitor1.com/article",
        "rank": 1,
        "score": 88,
        "wordCount": 2500,
        "readability": 72,
        "seo": 85
      }
    ],
    "averages": {
      "wordCount": 2200,
      "score": 84,
      "readability": 70
    }
  }
}
```

### Optimization Recommendations

#### Generate Recommendations
```http
POST /api/content-scoring/recommendations/generate

{
  "contentId": "blog-post-789",
  "contentAnalysis": {
    "wordCount": 800,
    "readabilityScore": 55,
    "seoScore": 65
  },
  "targetGoals": {
    "readability": 70,
    "seo": 80,
    "engagement": 75
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "contentId": "blog-post-789",
    "recommendations": [
      {
        "id": "rec-1",
        "type": "readability",
        "priority": "high",
        "category": "sentence_structure",
        "suggestion": "Reduce average sentence length from 28 to 20 words",
        "expectedImpact": "+15 readability score",
        "effort": "medium"
      },
      {
        "id": "rec-2",
        "type": "seo",
        "priority": "critical",
        "category": "keywords",
        "suggestion": "Increase keyword density to 1.8%",
        "expectedImpact": "+10 SEO score",
        "effort": "low"
      }
    ]
  }
}
```

### Content Templates

#### Create Template
```http
POST /api/content-scoring/templates/create

{
  "name": "Blog Post Template",
  "category": "blog",
  "structure": {
    "sections": [
      { "type": "introduction", "minWords": 100, "maxWords": 200 },
      { "type": "body", "minWords": 800, "maxWords": 1500 },
      { "type": "conclusion", "minWords": 100, "maxWords": 150 }
    ],
    "requiredElements": ["h1", "h2", "images", "cta"]
  },
  "seoGuidelines": {
    "minWordCount": 1000,
    "keywordDensity": { "min": 1.0, "max": 2.5 }
  },
  "targetMetrics": {
    "readability": 70,
    "seo": 85,
    "engagement": 75
  }
}
```

### Performance Tracking

#### Track Performance
```http
POST /api/content-scoring/performance/track

{
  "contentId": "article-999",
  "url": "https://example.com/article",
  "metrics": {
    "views": 1500,
    "uniqueVisitors": 1200,
    "avgTimeOnPage": 180,
    "bounceRate": 45,
    "shares": 25,
    "comments": 10
  },
  "scores": {
    "readability": 75,
    "seo": 82,
    "engagement": 70
  }
}
```

### AI Enhancement

#### Enhance Content
```http
POST /api/content-scoring/ai/enhance

{
  "contentId": "draft-555",
  "content": "Your content...",
  "enhancements": [
    "improve_readability",
    "add_transitions",
    "enhance_vocabulary"
  ],
  "tone": "professional",
  "targetAudience": "business"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "contentId": "draft-555",
    "enhanced": {
      "content": "Enhanced content...",
      "changes": 15
    },
    "improvements": {
      "readability": "+12 points",
      "engagement": "+8 points"
    }
  }
}
```

## Features

### Multi-Factor Content Analysis
- Structure analysis (word count, paragraphs, sentences)
- Keyword extraction using TF-IDF algorithm
- Readability scoring (4+ formulas)
- Sentiment analysis
- Topic modeling

### Comprehensive SEO Scoring
- Keyword optimization (density, placement, variations)
- Meta tag validation (title, description, keywords)
- Heading structure analysis (H1-H6 hierarchy)
- Link analysis (internal/external balance)
- Image optimization (alt text, file names)

### Readability Assessment
- Multiple formulas: Flesch Reading Ease, Flesch-Kincaid, Gunning Fog, SMOG
- Audience matching
- Difficulty levels: Easy, Medium, Hard, Very Hard
- Grade level estimation

### Competitive Intelligence
- SERP analysis for target keywords
- Content gap identification
- Competitor benchmarking
- Market position analysis

### AI-Powered Enhancements
- Content rewriting and expansion
- Tone optimization
- Headline generation (A/B variants)
- Contextual suggestions
- Vocabulary enhancement

### Template Library
- Pre-built templates for common content types
- Custom template creation
- Template validation
- Performance-based template optimization

### Performance Tracking
- Historical metrics tracking
- Trend analysis
- Time period comparison
- A/B testing framework

## Testing

### Run All Tests
```bash
npm test
```

### Test Coverage

- **Content Analysis**: 6 tests (analyze, keywords, structure, readability, statistics)
- **SEO Scoring**: 6 tests (score calculation, keywords, meta, headings, links, statistics)
- **Readability**: 6 tests (analyze, engagement, prediction, suggestions, statistics)
- **Competitor Analysis**: 6 tests (analyze, gaps, compare, SERP, statistics)
- **Recommendations**: 6 tests (generate, apply, prioritize, quick wins, statistics)
- **Templates**: 6 tests (create, get, list, validate, clone, statistics)
- **Performance**: 6 tests (track, trends, compare, A/B test, statistics)
- **AI Enhancement**: 6 tests (enhance, rewrite, variations, suggestions, tone, statistics)
- **System**: 2 tests (health check, aggregated statistics)
- **E2E**: 1 comprehensive journey test

**Total**: 49 tests covering 248 endpoints

### Example Test
```javascript
test('should calculate SEO score', async () => {
  const response = await request(app)
    .post('/api/content-scoring/seo/score')
    .send({
      contentId: 'test-123',
      title: 'SEO Guide',
      content: 'Content...',
      keywords: ['SEO']
    });

  expect(response.status).toBe(201);
  expect(response.body.data.score).toBeGreaterThanOrEqual(0);
  expect(response.body.data.score).toBeLessThanOrEqual(100);
});
```

## Deployment

### Database Schema

```sql
-- Content analyses
CREATE TABLE content_analyses (
  id SERIAL PRIMARY KEY,
  content_id VARCHAR(100) UNIQUE NOT NULL,
  content_type VARCHAR(50),
  word_count INTEGER,
  readability_score DECIMAL(5,2),
  keywords JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SEO scores
CREATE TABLE seo_scores (
  id SERIAL PRIMARY KEY,
  content_id VARCHAR(100) UNIQUE NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  grade VARCHAR(2),
  breakdown JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance tracking
CREATE TABLE performance_metrics (
  id SERIAL PRIMARY KEY,
  content_id VARCHAR(100) NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  tracked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_analyses_content_id ON content_analyses(content_id);
CREATE INDEX idx_seo_scores_content_id ON seo_scores(content_id);
CREATE INDEX idx_performance_content_id ON performance_metrics(content_id);
CREATE INDEX idx_performance_tracked_at ON performance_metrics(tracked_at);
```

### Redis Caching Strategy

```javascript
// Cache SEO scores for 1 hour
SETEX content:seo:${contentId} 3600 ${JSON.stringify(seoData)}

// Cache competitor analyses for 24 hours
SETEX competitor:analysis:${keyword} 86400 ${JSON.stringify(analysis)}

// Cache templates for 7 days
SETEX template:${templateId} 604800 ${JSON.stringify(template)}
```

### Environment Configuration

**Production**:
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod-user:password@prod-db:5432/aura_prod
REDIS_URL=redis://prod-redis:6379
OPENAI_API_KEY=sk-prod-...
LOG_LEVEL=warn
RATE_LIMIT_MAX=100
```

**Staging**:
```env
NODE_ENV=staging
DATABASE_URL=postgresql://staging-user:password@staging-db:5432/aura_staging
REDIS_URL=redis://staging-redis:6379
LOG_LEVEL=info
```

## Performance Optimization

### Indexing Strategy
- B-tree indexes on `content_id` fields
- GIN indexes on JSONB columns (keywords, breakdown)
- Partial indexes on frequently queried statuses

### Caching Layers
- Redis for frequently accessed data (SEO scores, templates)
- TTL-based expiration (1 hour to 7 days)
- Cache invalidation on updates

### Query Optimization
- Batch keyword extraction
- Pagination for large result sets
- Lazy loading of competitor data

### API Rate Limiting
- 100 requests per minute per API key
- Burst allowance: 200 requests
- Exponential backoff for retry logic

### Monitoring & Logging

```javascript
// API performance metrics
{
  endpoint: '/api/content-scoring/seo/score',
  avgResponseTime: 145, // ms
  requestsPerMinute: 42,
  errorRate: 0.2 // %
}

// Content analysis metrics
{
  totalAnalyses: 15420,
  avgWordCount: 1250,
  avgReadabilityScore: 68.5,
  avgSEOScore: 72.3
}
```

---

**Version**: 1.0.0  
**Last Updated**: February 14, 2026  
**Maintainer**: Aura Systems AI Team
