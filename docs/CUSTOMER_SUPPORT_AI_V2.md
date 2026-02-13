# Customer Support AI V2 - Documentation

Enterprise-grade customer support platform with AI-powered operations, advanced quality assurance, team performance tracking, omnichannel messaging, and intelligent automation.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Installation](#installation)
- [Features](#features)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Deployment](#deployment)
- [Performance](#performance)

## Architecture Overview

Customer Support AI V2 consists of 8 specialized engines working together to provide comprehensive support operations:

### 1. Support Operations Engine (`support-operations-engine.js`)
Core ticketing system with intelligent routing and SLA management.
- **Ticket Management**: Create, update, and track support tickets across channels
- **Smart Routing**: Priority-based rule matching with multi-condition support
- **SLA Tracking**: Monitor first response and resolution time targets
- **Escalation Management**: Automatic escalation at 80% SLA threshold
- **Team Assignment**: Round-robin distribution with workload balancing

### 2. Quality Assurance Engine (`quality-assurance-engine.js`)
Comprehensive QA system for agent performance evaluation.
- **QA Templates**: Customizable scoring templates with categories and criteria
- **Review System**: 6-tier rating system (excellent to critical fail)
- **Coaching Workflow**: Automated coaching recommendations based on scores
- **Calibration**: Ensure consistent scoring across reviewers
- **Compliance Tracking**: Monitor QA compliance rates and trends

### 3. Team Performance Engine (`team-performance-engine.js`)
Track and optimize agent productivity with gamification.
- **Agent Metrics**: Track tickets, response times, satisfaction scores
- **Productivity Scoring**: 0-100 weighted score across 5 metrics
- **Goal Management**: Individual and team goals with progress tracking
- **Achievements**: Unlockable badges with rarity levels
- **Leaderboards**: Rankings by multiple performance dimensions

### 4. Satisfaction Tracking Engine (`satisfaction-tracking-engine.js`)
Measure and analyze customer satisfaction.
- **Multi-Type Surveys**: CSAT (1-5), NPS (0-10), CES (1-7), Custom
- **Sentiment Analysis**: AI-powered analysis of customer comments
- **Agent Scoring**: Track satisfaction by individual agent
- **Tag Extraction**: Automatically categorize feedback topics
- **Trend Analysis**: Monitor satisfaction trends over time

### 5. Workflow Automation Engine (`workflow-automation-engine.js`)
Automate repetitive support tasks and responses.
- **Macros**: Reusable action sequences with variable substitution
- **Triggers**: Event-based automation with condition evaluation
- **Automation Rules**: Time-based, event-based, and conditional workflows
- **Auto-Responses**: Instant replies based on triggers and conditions
- **Execution Tracking**: Audit trail of all automated actions

### 6. Knowledge Management Engine (`knowledge-management-engine.js`)
Build and maintain a searchable knowledge base.
- **Article Management**: Version control, multi-status publishing workflow
- **Smart Search**: Relevance-based search with weighted scoring
- **Analytics**: Track views, sources, and helpfulness ratings
- **Recommendations**: AI-powered article suggestions
- **Popular Terms**: Identify content gaps from search behavior

### 7. Omnichannel Engine (`omnichannel-engine.js`)
Unified messaging across multiple channels.
- **7 Channel Types**: Email, Chat, Phone, Facebook, Twitter, Instagram, WhatsApp
- **Unified Inbox**: Single view of all customer conversations
- **Message Templates**: Channel-specific templates with variables
- **Business Hours**: Channel-specific availability configuration
- **Analytics**: Response times and volume by channel

### 8. AI Insights Engine (`ai-insights-engine.js`)
AI-powered predictions and intelligent assistance.
- **Intent Analysis**: Detect customer intent with confidence scoring
- **Agent Assist**: Real-time suggestions for responses and actions
- **Resolution Prediction**: Estimate resolution time by priority and category
- **Trend Detection**: Identify patterns and anomalies
- **Churn Risk**: Predict at-risk customers with multi-factor scoring
- **Recommendations**: Actionable insights to improve operations

## Installation

```bash
# Install dependencies
npm install

# Import engines in your server
const supportOperations = require('./tools/customer-support-ai/support-operations-engine');
const qualityAssurance = require('./tools/customer-support-ai/quality-assurance-engine');
const teamPerformance = require('./tools/customer-support-ai/team-performance-engine');
const satisfactionTracking = require('./tools/customer-support-ai/satisfaction-tracking-engine');
const workflowAutomation = require('./tools/customer-support-ai/workflow-automation-engine');
const knowledgeManagement = require('./tools/customer-support-ai/knowledge-management-engine');
const omnichannel = require('./tools/customer-support-ai/omnichannel-engine');
const aiInsights = require('./tools/customer-support-ai/ai-insights-engine');

# Mount router
const customerSupportRouter = require('./routes/customer-support-ai');
app.use('/api/customer-support-ai', customerSupportRouter);
```

## Features

### Support Operations
- ✅ Multi-channel ticket creation (email, chat, phone, social)
- ✅ Priority-based automatic routing with rule engine
- ✅ SLA monitoring with business hours support
- ✅ Escalation detection at 80% threshold
- ✅ Round-robin assignment with workload balancing
- ✅ Team management with skills and shift tracking

### Quality Assurance
- ✅ Customizable QA scoring templates
- ✅ 6-tier rating system (excellent to critical fail)
- ✅ Automated coaching recommendations
- ✅ Calibration sessions for reviewer alignment
- ✅ Compliance rate tracking (≥80% target)
- ✅ Trend analysis (improving/declining/stable)

### Team Performance
- ✅ Daily agent metrics tracking (15+ metrics)
- ✅ Productivity score 0-100 with weighted formula
- ✅ Individual and team goals with status tracking
- ✅ Achievement system with 4 rarity levels
- ✅ Multi-metric leaderboards
- ✅ Utilization rate calculation

### Customer Satisfaction
- ✅ CSAT, NPS, CES, and custom surveys
- ✅ Multi-channel survey delivery
- ✅ Sentiment analysis with confidence scoring
- ✅ Tag extraction for 5 feedback categories
- ✅ Agent-level satisfaction tracking
- ✅ Top feedback tags identification

### Workflow Automation
- ✅ Macros with 6 action types
- ✅ Variable substitution {{variable}} support
- ✅ Event triggers with 8 condition operators
- ✅ Priority-based trigger execution
- ✅ Auto-responses with delay configuration
- ✅ Execution history tracking

### Knowledge Base
- ✅ Hierarchical category structure
- ✅ Article versioning on update
- ✅ 3 status levels (draft/published/archived)
- ✅ Relevance-based search scoring
- ✅ View tracking with source attribution
- ✅ Helpfulness scoring (0-100)
- ✅ Popular search terms analysis

### Omnichannel
- ✅ 7 channel types with unified inbox
- ✅ Business hours per channel
- ✅ Message templates with variables
- ✅ Conversation management with status
- ✅ Auto-conversation creation
- ✅ Response time analytics

### AI Insights
- ✅ 6 intent types with confidence 0.3-0.95
- ✅ Entity extraction (email, phone, order)
- ✅ Response suggestions for agents
- ✅ Resolution time prediction with multipliers
- ✅ Trend detection with patterns
- ✅ Churn risk scoring with 4 factors

## API Reference

### Support Operations (30 endpoints)

#### Create Ticket
```http
POST /api/customer-support-ai/operations/tickets
Content-Type: application/json

{
  "subject": "Product not working",
  "description": "Detailed issue description",
  "customerId": "customer-123",
  "priority": "high",
  "category": "technical",
  "channel": "email",
  "tags": ["bug", "urgent"]
}
```

Response:
```json
{
  "success": true,
  "ticket": {
    "id": "ticket-123",
    "subject": "Product not working",
    "status": "open",
    "priority": "high",
    "assignedTo": "agent-456",
    "createdAt": "2025-01-19T10:00:00Z"
  }
}
```

#### Route Ticket
```http
POST /api/customer-support-ai/operations/tickets/ticket-123/route
Content-Type: application/json

{
  "ticketId": "ticket-123"
}
```

#### Get SLA Breach Status
```http
GET /api/customer-support-ai/operations/tickets/ticket-123/sla-breach
```

Response:
```json
{
  "success": true,
  "breach": {
    "hasSLA": true,
    "firstResponse": {
      "target": 60,
      "elapsed": 45,
      "remaining": 15,
      "breached": false,
      "percentage": 75
    },
    "resolution": {
      "target": 240,
      "elapsed": 180,
      "remaining": 60,
      "breached": false,
      "percentage": 75
    }
  }
}
```

### Quality Assurance (32 endpoints)

#### Create QA Review
```http
POST /api/customer-support-ai/qa/reviews
Content-Type: application/json

{
  "ticketId": "ticket-123",
  "agentId": "agent-456",
  "templateId": "template-789",
  "scores": [
    { "criteriaId": "greeting", "score": 9 },
    { "criteriaId": "clarity", "score": 14 }
  ],
  "strengths": ["Friendly tone", "Clear explanation"],
  "improvements": ["Could be faster"]
}
```

#### Get Agent QA Summary
```http
GET /api/customer-support-ai/qa/agents/agent-456/summary
```

Response:
```json
{
  "success": true,
  "summary": {
    "averageScore": 87.5,
    "ratingDistribution": {
      "excellent": 5,
      "good": 12,
      "satisfactory": 3
    },
    "trend": "improving",
    "criticalFails": 0,
    "topImprovements": ["Response time", "Empathy"]
  }
}
```

### Team Performance (30 endpoints)

#### Track Agent Metrics
```http
POST /api/customer-support-ai/performance/metrics
Content-Type: application/json

{
  "agentId": "agent-456",
  "date": "2025-01-19",
  "ticketsResolved": 15,
  "ticketsCreated": 2,
  "averageResponseTime": 120,
  "averageResolutionTime": 480,
  "csatScore": 4.5,
  "qaScore": 90,
  "firstContactResolution": 80,
  "customerReplies": 25,
  "activeMinutes": 420,
  "idleMinutes": 60
}
```

#### Get Agent Performance
```http
GET /api/customer-support-ai/performance/agents/agent-456?period=week
```

Response:
```json
{
  "success": true,
  "performance": {
    "period": "week",
    "totalTicketsResolved": 75,
    "averageResponseTime": 115,
    "productivityScore": 85,
    "utilizationRate": 87.5,
    "trend": "improving",
    "goalProgress": [
      {
        "goalId": "goal-123",
        "metric": "tickets_resolved",
        "target": 100,
        "current": 75,
        "status": "on_track"
      }
    ]
  }
}
```

### Satisfaction Tracking (32 endpoints)

#### Create Survey
```http
POST /api/customer-support-ai/satisfaction/surveys
Content-Type: application/json

{
  "type": "csat",
  "trigger": "ticket_resolved",
  "channels": ["email"],
  "delayMinutes": 60,
  "questions": [
    {
      "text": "How satisfied were you?",
      "type": "rating",
      "scale": 5
    }
  ]
}
```

#### Calculate NPS
```http
GET /api/customer-support-ai/satisfaction/nps?surveyId=survey-123
```

Response:
```json
{
  "success": true,
  "nps": {
    "score": 45,
    "promoters": 60,
    "promotersPercentage": 60,
    "passives": 25,
    "passivesPercentage": 25,
    "detractors": 15,
    "detractorsPercentage": 15,
    "totalResponses": 100
  }
}
```

### Workflow Automation (32 endpoints)

#### Execute Macro
```http
POST /api/customer-support-ai/automation/macros/macro-123/execute
Content-Type: application/json

{
  "macroId": "macro-123",
  "ticketId": "ticket-456",
  "context": {
    "customerName": "John Doe",
    "orderId": "12345"
  }
}
```

#### Fire Triggers
```http
POST /api/customer-support-ai/automation/triggers/fire
Content-Type: application/json

{
  "event": "ticket_created",
  "data": {
    "ticketId": "ticket-789",
    "priority": "urgent",
    "category": "billing"
  }
}
```

### Knowledge Management (32 endpoints)

#### Search Articles
```http
GET /api/customer-support-ai/knowledge/search?q=password reset&limit=10
```

Response:
```json
{
  "success": true,
  "results": [
    {
      "id": "article-123",
      "title": "How to Reset Your Password",
      "summary": "Step-by-step password reset guide",
      "relevanceScore": 28,
      "featured": true,
      "helpfulnessScore": 95,
      "views": 1500
    }
  ]
}
```

#### Get Popular Search Terms
```http
GET /api/customer-support-ai/knowledge/search/popular-terms?limit=10
```

### Omnichannel (30 endpoints)

#### Get Unified Inbox
```http
GET /api/customer-support-ai/omnichannel/inbox?status=open&limit=50
```

Response:
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv-123",
      "customerId": "customer-456",
      "channelType": "email",
      "subject": "Order inquiry",
      "status": "open",
      "priority": "medium",
      "messageCount": 5,
      "latestMessage": "When will my order ship...",
      "lastMessageAt": "2025-01-19T10:30:00Z"
    }
  ]
}
```

#### Send Message
```http
POST /api/customer-support-ai/omnichannel/messages/send
Content-Type: application/json

{
  "conversationId": "conv-123",
  "sender": "agent",
  "senderId": "agent-456",
  "content": "Your order will ship in 2 business days.",
  "contentType": "text"
}
```

### AI Insights (30 endpoints)

#### Analyze Intent
```http
POST /api/customer-support-ai/ai/intent/analyze
Content-Type: application/json

{
  "text": "I want to cancel my subscription",
  "ticketId": "ticket-123"
}
```

Response:
```json
{
  "success": true,
  "analysis": {
    "intent": "cancel",
    "confidence": 0.9,
    "entities": {
      "email": null,
      "phone": null,
      "orderNumber": null
    },
    "urgency": "normal",
    "suggestedActions": ["Offer retention discount", "Request cancellation reason"]
  }
}
```

#### Predict Churn Risk
```http
POST /api/customer-support-ai/ai/predict/churn-risk
Content-Type: application/json

{
  "customerId": "customer-789"
}
```

Response:
```json
{
  "success": true,
  "prediction": {
    "riskScore": 65,
    "riskLevel": "high",
    "factors": [
      { "factor": "Recent tickets", "score": 20 },
      { "factor": "Negative sentiment", "score": 30 },
      { "factor": "Cancel queries", "score": 25 }
    ],
    "suggestedActions": ["Immediate manager escalation", "Retention offer"]
  }
}
```

## Usage Examples

### Complete Support Workflow

```javascript
// 1. Customer submits ticket
const ticket = await fetch('/api/customer-support-ai/operations/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'Billing issue',
    description: 'I was charged twice',
    customerId: 'customer-123',
    priority: 'high',
    category: 'billing'
  })
});

// 2. AI analyzes intent
const intent = await fetch('/api/customer-support-ai/ai/intent/analyze', {
  method: 'POST',
  body: JSON.stringify({
    text: 'I was charged twice',
    ticketId: ticket.id
  })
});

// 3. Agent uses macro to respond
const macroExecution = await fetch('/api/customer-support-ai/automation/macros/billing-refund/execute', {
  method: 'POST',
  body: JSON.stringify({
    macroId: 'billing-refund',
    ticketId: ticket.id,
    context: { customerName: 'John', refundAmount: '$49.99' }
  })
});

// 4. QA reviews interaction
const qaReview = await fetch('/api/customer-support-ai/qa/reviews', {
  method: 'POST',
  body: JSON.stringify({
    ticketId: ticket.id,
    agentId: 'agent-456',
    templateId: 'billing-template',
    scores: [{ criteriaId: 'empathy', score: 9 }]
  })
});

// 5. Customer receives survey
const survey = await fetch('/api/customer-support-ai/satisfaction/surveys', {
  method: 'POST',
  body: JSON.stringify({
    type: 'csat',
    trigger: 'ticket_resolved',
    ticketId: ticket.id
  })
});
```

## Testing

### Run Comprehensive Tests

```bash
# Run all Customer Support AI V2 tests
npm test -- customer-support-ai-v2-comprehensive.test.js

# Run specific test suite
npm test -- --grep "Support Operations"
npm test -- --grep "E2E Support Journey"
```

### Test Coverage

- **48 Unit Tests**: Coverage for all 8 engines
- **1 E2E Test**: Complete customer support workflow
- **Success Criteria**: All tests passing, >90% code coverage

## Deployment

### Database Requirements

**PostgreSQL (Recommended)**
- Tickets, conversations, and messages tables
- Indexes on: ticketId, customerId, agentId, status, priority, createdAt
- Partitioning for historical data (>6 months)

**Schema:**
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT,
  customer_id UUID NOT NULL,
  assigned_to UUID,
  priority VARCHAR(20),
  status VARCHAR(20),
  category VARCHAR(50),
  channel VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_customer (customer_id),
  INDEX idx_agent (assigned_to),
  INDEX idx_status_priority (status, priority)
);

CREATE TABLE qa_reviews (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id),
  agent_id UUID NOT NULL,
  template_id UUID,
  total_score INT,
  percentage DECIMAL(5,2),
  rating VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_agent_date (agent_id, created_at)
);

CREATE TABLE surveys (
  id UUID PRIMARY KEY,
  type VARCHAR(20),
  survey_id UUID,
  customer_id UUID,
  score INT,
  sentiment VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_survey (survey_id),
  INDEX idx_customer_date (customer_id, created_at)
);
```

### Caching Strategy

**Redis for Performance:**
```javascript
// Cache SLA calculations (5 min TTL)
const slaKey = `sla:${ticketId}`;
const cached = await redis.get(slaKey);
if (cached) return JSON.parse(cached);

// Cache agent performance (15 min TTL)
const perfKey = `performance:${agentId}:${period}`;
await redis.setex(perfKey, 900, JSON.stringify(performance));

// Cache KB search results (1 hour TTL)
const searchKey = `kb:search:${query}`;
await redis.setex(searchKey, 3600, JSON.stringify(results));
```

### Job Queue

**Bull for Background Processing:**
```javascript
// SLA monitoring (every 5 minutes)
slaQueue.add('check-escalations', {}, {
  repeat: { cron: '*/5 * * * *' }
});

// Survey sending (on ticket resolution)
surveyQueue.add('send-survey', {
  ticketId,
  customerId,
  surveyId
}, { delay: 3600000 }); // 1 hour delay

// Analytics aggregation (daily at midnight)
analyticsQueue.add('daily-aggregation', {}, {
  repeat: { cron: '0 0 * * *' }
});
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/support_db

# Redis
REDIS_URL=redis://localhost:6379

# Email Integration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@company.com
SMTP_PASS=secret

# Webhooks
WEBHOOK_SECRET=your-webhook-secret

# AI Services (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Performance

### Optimization Strategies

1. **Database Indexing:**
   - Composite indexes on (status, priority, createdAt)
   - Partial indexes for open tickets only
   - Text search indexes for article content

2. **Query Optimization:**
   - Limit result sets (default 50, max 1000)
   - Pagination with cursor-based navigation
   - Aggregate statistics pre-computation

3. **Caching Layers:**
   - SLA breach calculations (5 min)
   - Agent performance metrics (15 min)
   - KB search results (1 hour)
   - Dashboard statistics (5 min)

4. **Background Processing:**
   - Async survey delivery
   - Batch sentiment analysis
   - Scheduled statistics aggregation

### Scalability

- **Horizontal Scaling**: Stateless API design supports load balancing
- **Database Sharding**: Partition by customerId or date ranges
- **Read Replicas**: Route analytics queries to replicas
- **CDN**: Cache KB article content at edge

### Monitoring

Key metrics to track:
- Average ticket response time (target: <5 min)
- SLA compliance rate (target: >95%)
- CSAT score (target: >4.5/5)
- NPS score (target: >50)
- Agent productivity score (target: >80)
- QA compliance rate (target: >80%)
- Knowledge base usage (views/searches)
- Channel response times by type

---

**License**: MIT  
**Version**: 2.0.0  
**Last Updated**: January 19, 2025
