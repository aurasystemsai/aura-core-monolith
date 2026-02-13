# Reviews & UGC Engine V2

Enterprise-grade review management and user-generated content collection platform with AI-powered sentiment analysis, automated moderation, social proof optimization, and comprehensive analytics.

## Architecture Overview

The Reviews & UGC Engine V2 is built on a modular 8-engine architecture, providing complete functionality for the entire review and UGC lifecycle:

### 1. Review Management Engine (`review-management-engine.js`)
- **Core Functionality**: CRUD operations for reviews with comprehensive metadata
- **Features**: 
  - 5-star ratings with photo/video support
  - Verified purchase badges
  - Pros/cons lists and recommendation flags
  - Moderation workflow (pending/approved/rejected/flagged)
  - Helpful voting system with vote tracking
  - Merchant responses with role-based access
  - Real-time rating aggregation and distribution
  - Advanced search with filters (status, rating, verified, sortBy)
- **Key Functions**: `createReview`, `moderateReview`, `voteReview`, `updateProductRating`, `getProductRatingSummary`

### 2. UGC Collection Engine (`ugc-collection-engine.js`)
- **Core Functionality**: Multi-channel review collection and request tracking
- **Features**:
  - Campaign management (post-purchase, ongoing, targeted)
  - Multi-channel support (email, SMS, widget, API)
  - Automated post-purchase requests with configurable delay
  - Reminder workflows with frequency limits
  - Incentive support (discounts, points, entries)
  - Collection widgets (inline, popup, sidebar, badge)
  - Email template management with variable interpolation
  - Interaction tracking (sent/opened/clicked/submitted)
  - Conversion rate analytics
- **Key Functions**: `createCampaign`, `send ReviewRequest`, `trackInteraction`, `createWidget`, `getCollectionStatistics`

### 3. Moderation & Filtering Engine (`moderation-engine.js`)
- **Core Functionality**: Automated content moderation with manual queue fallback
- **Features**:
  - Configurable moderation rules (auto_approve, auto_reject, flag_for_review)
  - Profanity detection with custom blocklists
  - Spam filtering (URLs, emails, phones, repetitive chars, excessive punctuation)
  - Content scoring (0-100) with flag severity levels
  - Priority-based moderation queue (urgent/high/medium/low)
  - Manual review workflow with moderation history
  - Blocklists for words, emails, and IPs
  - Approval rate tracking and statistics
- **Key Functions**: `createModerationRule`, `moderateContent`, `checkProfanity`, `checkSpam`, `getModerationQueue`

### 4. Sentiment & AI Analysis Engine (`sentiment-ai-engine.js`)
- **Core Functionality**: AI-powered sentiment analysis and review insights
- **Features**:
  - Sentiment classification (positive/negative/neutral/mixed) with scores (-1 to 1)
  - Emotion detection (joy, satisfaction, disappointment, anger, surprise, trust)
  - Topic extraction (quality, price, shipping, sizing, design, service, functionality, packaging)
  - Key phrase extraction from review content
  - Batch processing for multiple reviews
  - Trend detection (30-day comparison with improving/declining/stable status)
  - Insights generation (common topics, emotional profile, recommendations)
  - Product strengths and weaknesses identification
  - Natural language review summaries
- **Key Functions**: `analyzeSentiment`, `detectEmotions`, `extractTopics`, `generateInsights`, `detectTrends`

### 5. Social Proof Optimization Engine (`social-proof-engine.js`)
- **Core Functionality**: Review display optimization and conversion enhancement
- **Features**:
  - Priority-based display rules matching page context
  - Three display strategies: showcase_excellence (4.5+ rating), balanced (3.5-4.5), credibility_focus (<3.5)
  - Trust badge system with criteria qualification
  - Badge types: verified_reviews, top_rated, customer_favorite, award
  - Social proof elements (recent_review, trending, customer_count, rating_highlight)
  - Trigger-based element display (pageView, timeOnPage, scrollDepth)
  - A/B testing framework with variant tracking
  - Conversion insights with actionable recommendations
  - Trust score calculation (0-100) based on rating, volume, verification, recency
- **Key Functions**: `createDisplayRule`, `optimizeReviewDisplay`, `createTrustBadge`, `createABTest`, `calculateTrustScore`

### 6. Display & Widget Engine (`display-widget-engine.js`)
- **Core Functionality**: Customizable review widgets, carousels, and embeds
- **Features**:
  - Widget types: standard, compact, detailed, grid, list
  - Customizable layout (columns, pagination, itemsPerPage)
  - Display toggles (rating, date, verified badge, photos, videos, helpful votes)
  - Filters (minRating, verified, withPhotos, sortBy: recent/helpful/rating_high)
  - Review carousels with autoplay, arrows, dots, responsive settings
  - Embed code generation with JavaScript snippets
  - Theme system with customizable colors, typography, spacing, borders, shadows
  - Widget preview with sample data
  - Analytics tracking (views, interactions, helpful votes, photo clicks)
- **Key Functions**: `createReviewWidget`, `generateWidgetEmbedCode`, `createReviewCarousel`, `createTheme`, `generateWidgetPreview`

### 7. Analytics & Insights Engine (`analytics-insights-engine.js`)
- **Core Functionality**: Comprehensive analytics, reporting, and performance tracking
- **Features**:
  - Event tracking for all platform actions
  - Review metrics (total, approved, rejected, flagged, approval rate, avg moderation time)
  - Collection performance (requests sent/opened/clicked/submitted, conversion rate)
  - Widget performance (views, interactions, conversions, rates)
  - Sentiment trends (daily breakdown over 30-day timeframe)
  - Rating distribution with counts and percentages
  - Top reviewers leaderboard
  - Product comparison across multiple products
  - Scheduled reports (daily/weekly/monthly) in multiple formats (JSON/CSV/PDF)
  - Custom dashboards with metric widgets and auto-refresh
  - Threshold-based alerts with multi-channel delivery (email/SMS/Slack)
- **Key Functions**: `trackEvent`, `getReviewMetrics`, `getCollectionPerformance`, `createReport`, `createDashboard`, `createAlert`

### 8. Integration Engine (`integration-engine.js`)
- **Core Functionality**: External platform integrations and data import/export
- **Features**:
  - Pre-configured integrations: Shopify, Google Shopping, Yotpo, Trustpilot, Klaviyo
  - Connect/disconnect workflow with credential management
  - Asynchronous import/export jobs with progress tracking
  - Shopify product and order synchronization
  - Google Shopping review submission with product mappings
  - Webhook system with event subscriptions and delivery tracking
  - Retry logic with exponential backoff
  - CSV import/export with field mapping
  - Sync logging with integration-specific activity tracking
  - Webhook delivery statistics (total deliveries, success rate)
- **Key Functions**: `connectIntegration`, `importReviews`, `syncShopifyOrders`, `createWebhook`, `triggerWebhook`

## Installation

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL or MongoDB (production)
- Redis (for caching, production)

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## API Reference

### Review Management Endpoints (32 endpoints)

#### Create Review
```
POST /api/reviews-ugc-engine/reviews
Content-Type: application/json

{
  "productId": "prod_001",
  "customerId": "cust_001",
  "customerName": "John Doe",
  "rating": 5,
  "title": "Excellent product!",
  "content": "This product exceeded my expectations.",
  "verified": true,
  "photos": ["https://example.com/photo1.jpg"],
  "pros": ["Great quality", "Fast shipping"],
  "cons": [],
  "recommendProduct": true
}

Response: 201 Created
{
  "id": "review_123",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z",
  ...
}
```

#### Get Product Reviews
```
GET /api/reviews-ugc-engine/products/prod_001/reviews?status=approved&sortBy=recent&limit=10&rating=5&verified=true

Response: 200 OK
{
  "reviews": [...],
  "total": 150,
  "hasMore": true
}
```

#### Moderate Review
```
POST /api/reviews-ugc-engine/reviews/review_123/moderate
{
  "status": "approved",
  "moderatorId": "mod_001",
  "notes": "Review looks legitimate"
}

Response: 200 OK
```

#### Vote on Review
```
POST /api/reviews-ugc-engine/reviews/review_123/vote
{
  "voterId": "user_002",
  "helpful": true
}

Response: 200 OK
{
  "success": true,
  "helpfulCount": 15,
  "notHelpfulCount": 2
}
```

#### Get Product Rating Summary
```
GET /api/reviews-ugc-engine/products/prod_001/rating-summary

Response: 200 OK
{
  "productId": "prod_001",
  "averageRating": 4.7,
  "totalReviews": 150,
  "ratingDistribution": { "1": 2, "2": 5, "3": 15, "4": 48, "5": 80 },
  "verifiedReviews": 95,
  "recommendationRate": 92
}
```

### UGC Collection Endpoints (30 endpoints)

#### Create Campaign
```
POST /api/reviews-ugc-engine/campaigns
{
  "name": "Post-Purchase Review Requests",
  "type": "post_purchase",
  "channels": ["email", "sms"],
  "triggers": {
    "event": "order_delivered",
    "delay": 7
  },
  "products": ["all"],
  "emailTemplate": "template_001",
  "reminderSettings": {
    "enabled": true,
    "delayDays": 3,
    "maxReminders": 2
  },
  "incentives": {
    "type": "discount",
    "value": "10%"
  }
}

Response: 201 Created
```

#### Send Review Request
```
POST /api/reviews-ugc-engine/campaigns/send-request
{
  "campaignId": "camp_001",
  "customerId": "cust_002",
  "customerEmail": "customer@example.com",
  "productId": "prod_001",
  "orderId": "order_001",
  "channel": "email"
}

Response: 201 Created
{
  "submissionId": "sub_001",
  "status": "sent",
  "token": "unique_token_123"
}
```

### Moderation Endpoints (28 endpoints)

#### Create Moderation Rule
```
POST /api/reviews-ugc-engine/moderation/rules
{
  "name": "Auto-approve verified reviews",
  "type": "auto_approve",
  "conditions": {
    "rating": 4,
    "verified": true
  },
  "action": "approve",
  "priority": 1
}

Response: 201 Created
```

#### Moderate Content
```
POST /api/reviews-ugc-engine/moderation/moderate
{
  "content": "Great product!",
  "rating": 5
}

Response: 200 OK
{
  "status": "approved",
  "score": 95,
  "appliedRules": ["rule_001"],
  "flags": [],
  "recommendations": ["approve"]
}
```

### Integration Endpoints (34 endpoints)

#### Connect Shopify
```
POST /api/reviews-ugc-engine/integrations/shopify/connect
{
  "apiKey": "your_api_key",
  "shopDomain": "your-shop.myshopify.com"
}

Response: 200 OK
{
  "status": "connected",
  "connectedAt": "2024-01-15T10:30:00Z"
}
```

#### Sync Shopify Orders
```
POST /api/reviews-ugc-engine/integrations/shopify/sync-orders
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "status": "fulfilled"
}

Response: 200 OK
{
  "orders": [...],
  "syncedCount": 150
}
```

## Usage Examples

### Complete Review Collection and Display Workflow

```javascript
// 1. Sync Shopify orders
const ordersResponse = await fetch('/api/reviews-ugc-engine/integrations/shopify/sync-orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ startDate: '2024-01-01', status: 'fulfilled' })
});
const orders = await ordersResponse.json();

// 2. Create post-purchase campaign
const campaignResponse = await fetch('/api/reviews-ugc-engine/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Post-Purchase Campaign',
    type: 'post_purchase',
    channels: ['email'],
    triggers: { event: 'order_delivered', delay: 7 }
  })
});
const campaign = await campaignResponse.json();

// 3. Send review requests
for (const order of orders.orders) {
  await fetch('/api/reviews-ugc-engine/campaigns/send-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaignId: campaign.id,
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      productId: order.items[0].productId,
      orderId: order.id,
      channel: 'email'
    })
  });
}

// 4. Customer submits review (tracked automatically)

// 5. Moderate with automated rules
const moderationResponse = await fetch('/api/reviews-ugc-engine/moderation/moderate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: reviewContent, rating: 5 })
});
const moderation = await moderationResponse.json();

// 6. Analyze sentiment
const sentimentResponse = await fetch('/api/reviews-ugc-engine/sentiment/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reviewId: 'review_001', content: reviewContent, rating: 5 })
});
const sentiment = await sentimentResponse.json();

// 7. Optimize display
const optimizeResponse = await fetch('/api/reviews-ugc-engine/social-proof/optimize-display', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId: 'prod_001', reviews: [...], performanceData: {...} })
});
const optimization = await optimizeResponse.json();

// 8. Create widget
const widgetResponse = await fetch('/api/reviews-ugc-engine/widgets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Product Page Widget',
    type: 'standard',
    productId: 'prod_001',
    layout: { columns: 2, maxReviews: 10 }
  })
});
const widget = await widgetResponse.json();

// 9. Track analytics
await fetch(`/api/reviews-ugc-engine/widgets/${widget.id}/analytics`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventType: 'view' })
});

// 10. Export to Google Shopping
await fetch('/api/reviews-ugc-engine/integrations/google-shopping/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reviewIds: ['review_001'],
    productMappings: { review_001: 'gtin_12345' }
  })
});
```

## Features

### Review Management
- ✅ 5-star ratings with decimal precision
- ✅ Photo and video reviews
- ✅ Verified purchase badges
- ✅ Pros/cons lists
- ✅ Recommendation flags
- ✅ Merchant responses
- ✅ Helpful voting system
- ✅ Real-time rating aggregation

### UGC Collection
- ✅ Multi-channel campaigns (email, SMS, widget, API)
- ✅ Automated post-purchase requests
- ✅ Reminder workflows
- ✅ Incentive support
- ✅ Collection widgets
- ✅ Email templates
- ✅ Interaction tracking

### Moderation
- ✅ Automated moderation rules
- ✅ Profanity detection
- ✅ Spam filtering
- ✅ Content scoring
- ✅ Priority-based queue
- ✅ Manual review workflow
- ✅ Blocklists

### Sentiment AI
- ✅ Sentiment analysis
- ✅ Emotion detection
- ✅ Topic extraction
- ✅ Trend detection
- ✅ Insights generation
- ✅ Review summarization

### Social Proof
- ✅ Display optimization
- ✅ Trust badges
- ✅ Social proof elements
- ✅ A/B testing
- ✅ Conversion insights
- ✅ Trust score calculation

### Display & Widgets
- ✅ Multiple widget types
- ✅ Carousels
- ✅ Embeds
- ✅ Theme customization
- ✅ Widget preview
- ✅ Analytics tracking

### Analytics
- ✅ Event tracking
- ✅ Review metrics
- ✅ Collection performance
- ✅ Widget performance
- ✅ Sentiment trends
- ✅ Scheduled reports
- ✅ Custom dashboards
- ✅ Threshold alerts

### Integrations
- ✅ Shopify (orders, products, customers)
- ✅ Google Shopping (product/seller ratings)
- ✅ Yotpo (review import/sync)
- ✅ Trustpilot (review import)
- ✅ Klaviyo (email campaigns)
- ✅ Webhooks with retry logic
- ✅ CSV import/export

## Testing

The platform includes 48 comprehensive tests covering all engines and E2E workflows:

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- reviews-ugc-engine-v2-comprehensive.test.js

# Run with coverage
npm test -- --coverage
```

### Test Coverage
- ✅ 6 Review Management tests
- ✅ 5 UGC Collection tests
- ✅ 6 Moderation tests
- ✅ 5 Sentiment AI tests
- ✅ 5 Social Proof tests
- ✅ 6 Display Widget tests
- ✅ 6 Analytics tests
- ✅ 6 Integration tests
- ✅ 2 System tests
- ✅ 1 E2E workflow test

## Deployment

### Production Considerations

#### Database
- Use PostgreSQL or MongoDB for persistent storage
- Implement proper indexing on productId, customerId, createdAt
- Set up read replicas for analytics queries

#### Caching
- Use Redis for frequently accessed data (rating summaries, statistics)
- Cache product reviews with 5-minute TTL
- Cache widget configurations with 1-hour TTL

#### Media Files
- Use CDN for photo/video storage and delivery
- Implement image optimization (compression, resizing)
- Set up signed URLs for secure media access

#### Webhooks
- Implement webhook signing for security
- Use message queue (RabbitMQ/SQS) for reliable delivery
- Implement retry logic with exponential backoff

#### Real-time Updates
- Use WebSockets for live moderation queue updates
- Implement server-sent events for dashboard metrics
- Real-time rating updates via Socket.IO

### Performance Optimization

#### Review Queries
- Index on (productId, status, createdAt)
- Paginate large result sets
- Use database views for rating aggregations

#### Image Processing
- Async processing using background jobs
- Generate multiple sizes (thumbnail, medium, full)
- Implement lazy loading in widgets

#### Caching Strategies
- Cache rating summaries (5 min TTL)
- Cache sentiment analyses (permanent)
- Cache widget configurations (1 hour TTL)

#### Analytics Aggregation
- Use materialized views for metrics
- Pre-aggregate daily statistics
- Batch process analytics events

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details
