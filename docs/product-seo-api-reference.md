# Product SEO Engine - API Reference

**Version:** 2.1  
**Base URL:** `/api/product-seo`  
**Authentication:** Bearer token (OAuth 2.0)  
**Rate Limiting:** 1000 requests/hour per API key

---

## Table of Contents

1. [Authentication](#authentication)
2. [Category 1: Product Optimization](#category-1-product-optimization)
3. [Category 2: AI & ML Orchestration](#category-2-ai--ml-orchestration)
4. [Category 3: Keyword & SERP Analysis](#category-3-keyword--serp-analysis)
5. [Category 4: Multi-Channel Optimization](#category-4-multi-channel-optimization)
6. [Category 5: Schema & Rich Results](#category-5-schema--rich-results)
7. [Category 6: A/B Testing](#category-6-ab-testing)
8. [Category 7: Analytics & Reporting](#category-7-analytics--reporting)
9. [Category 8: Settings & Administration](#category-8-settings--administration)
10. [Error Codes](#error-codes)
11. [Webhooks](#webhooks)
12. [SDK Examples](#sdk-examples)

---

## Authentication

All API requests require a Bearer token in the Authorization header:

```http
Authorization: Bearer YOUR_API_KEY
```

### Get API Key

```http
POST /api-keys
Content-Type: application/json

{
  "name": "My Application",
  "permissions": ["read", "write"]
}
```

**Response:**
```json
{
  "ok": true,
  "apiKey": {
    "id": "key_123",
    "key": "sk_live_abc123...",
    "name": "My Application",
    "permissions": ["read", "write"],
    "createdAt": "2026-02-11T10:00:00Z"
  }
}
```

---

## Category 1: Product Optimization

### 1.1 Create Product

Creates a new product for SEO optimization.

```http
POST /products
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Premium Wireless Headphones",
  "description": "High-quality noise-cancelling wireless headphones",
  "sku": "WH-001",
  "price": 199.99,
  "category": "Electronics",
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "alt": "Front view of headphones"
    }
  ],
  "keywords": ["wireless", "headphones", "noise cancelling"]
}
```

**Response:** `201 Created`
```json
{
  "ok": true,
  "product": {
    "id": "prod_123",
    "title": "Premium Wireless Headphones",
    "description": "High-quality noise-cancelling wireless headphones",
    "sku": "WH-001",
    "price": 199.99,
    "seoScore": 72,
    "createdAt": "2026-02-11T10:00:00Z",
    "updatedAt": "2026-02-11T10:00:00Z"
  }
}
```

### 1.2 List Products

Retrieves paginated list of products with optional filters.

```http
GET /products?page=1&limit=20&category=Electronics&minScore=70
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `category` (string) - Filter by category
- `minScore` (integer, 0-100) - Minimum SEO score
- `search` (string) - Search in title/description

**Response:** `200 OK`
```json
{
  "ok": true,
  "products": [
    {
      "id": "prod_123",
      "title": "Premium Wireless Headphones",
      "seoScore": 72,
      "price": 199.99
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### 1.3 Get Product

Retrieves detailed information about a single product.

```http
GET /products/:id
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "product": {
    "id": "prod_123",
    "title": "Premium Wireless Headphones",
    "description": "High-quality noise-cancelling wireless headphones",
    "sku": "WH-001",
    "price": 199.99,
    "category": "Electronics",
    "seoScore": 72,
    "breakdown": {
      "titleOptimization": 85,
      "descriptionQuality": 70,
      "keywordRelevance": 65,
      "imageAltText": 80
    },
    "keywords": ["wireless", "headphones", "noise cancelling"],
    "createdAt": "2026-02-11T10:00:00Z",
    "updatedAt": "2026-02-11T10:00:00Z"
  }
}
```

### 1.4 Update Product

Updates product information.

```http
PUT /products/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Product Title",
  "price": 179.99,
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "product": {
    "id": "prod_123",
    "title": "Updated Product Title",
    "price": 179.99,
    "updatedAt": "2026-02-11T11:00:00Z"
  }
}
```

### 1.5 Delete Product

Deletes a product (soft delete by default).

```http
DELETE /products/:id?hard=false
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "message": "Product deleted successfully"
}
```

### 1.6 Bulk Create Products

Creates multiple products in a single request.

```http
POST /products/bulk-create
Content-Type: application/json
```

**Request Body:**
```json
{
  "products": [
    {
      "title": "Product 1",
      "price": 50.00
    },
    {
      "title": "Product 2",
      "price": 100.00
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "ok": true,
  "count": 2,
  "products": [
    { "id": "prod_124", "title": "Product 1" },
    { "id": "prod_125", "title": "Product 2" }
  ]
}
```

### 1.7 Get Title Suggestions

AI-powered SEO title suggestions.

```http
GET /products/:id/title-suggestions?model=gpt-4&count=5
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "suggestions": [
    {
      "title": "Premium Wireless Noise-Cancelling Headphones | Studio Quality Sound",
      "score": 94,
      "reasoning": "Includes primary keywords, emphasizes value proposition"
    },
    {
      "title": "Wireless Headphones with Active Noise Cancellation - Premium Audio",
      "score": 91,
      "reasoning": "Strong keyword placement, clear features"
    }
  ],
  "model": "gpt-4",
  "generatedAt": "2026-02-11T10:00:00Z"
}
```

### 1.8 Get Description Suggestions

AI-generated SEO-optimized descriptions.

```http
GET /products/:id/description-suggestions?length=long&tone=professional
```

**Query Parameters:**
- `length` (short|medium|long) - Description length
- `tone` (casual|professional|enthusiastic) - Writing style
- `model` (string) - AI model to use

**Response:** `200 OK`
```json
{
  "ok": true,
  "suggestions": [
    {
      "description": "Experience unparalleled audio quality with our Premium Wireless Headphones...",
      "wordCount": 247,
      "readabilityScore": 68,
      "keywordDensity": {
        "wireless": 3.2,
        "headphones": 4.1,
        "noise cancelling": 2.4
      }
    }
  ]
}
```

### 1.9 Get Meta Tag Suggestions

Generates SEO meta tags (title, description, keywords).

```http
GET /products/:id/meta-suggestions
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "meta": {
    "title": "Premium Wireless Headphones | Noise Cancelling | Brand",
    "description": "Shop premium wireless headphones with active noise cancellation. Studio-quality sound, 30-hour battery, and premium comfort.",
    "keywords": ["wireless headphones", "noise cancelling", "bluetooth headphones"],
    "ogTags": {
      "og:title": "Premium Wireless Headphones",
      "og:description": "High-quality noise-cancelling wireless headphones",
      "og:image": "https://example.com/image1.jpg"
    }
  }
}
```

### 1.10 Get Keyword Density Analysis

Analyzes keyword usage in product content.

```http
GET /products/:id/keyword-density
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "analysis": [
    {
      "keyword": "wireless",
      "count": 8,
      "density": 3.2,
      "placement": ["title", "description", "bullets"],
      "recommendation": "Optimal density"
    },
    {
      "keyword": "headphones",
      "count": 12,
      "density": 4.8,
      "recommendation": "Consider reducing (over-optimized)"
    }
  ]
}
```

### 1.11 Get Readability Score

Calculates Flesch-Kincaid readability score.

```http
GET /products/:id/readability-score
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "score": 68.3,
  "level": "Standard / Average",
  "gradeLevel": "8th-9th grade",
  "metrics": {
    "fleschKincaid": 68.3,
    "averageWordsPerSentence": 15.2,
    "averageSyllablesPerWord": 1.6,
    "totalWords": 247,
    "totalSentences": 16
  },
  "recommendation": "Good readability for general audience"
}
```

### 1.12 Get SEO Score

Comprehensive SEO score with detailed breakdown.

```http
GET /products/:id/score
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "score": 78,
  "breakdown": {
    "titleOptimization": {
      "score": 85,
      "factors": {
        "length": "✓ Optimal (55 chars)",
        "keywords": "✓ Contains primary keywords",
        "readability": "✓ Clear and descriptive"
      }
    },
    "descriptionQuality": {
      "score": 72,
      "factors": {
        "length": "✓ Good (247 words)",
        "keywordDensity": "⚠ Slightly high for 'headphones'",
        "readability": "✓ 68.3 (Standard)"
      }
    },
    "imageOptimization": {
      "score": 90,
      "factors": {
        "altText": "✓ All images have alt text",
        "fileSize": "✓ Optimized",
        "format": "✓ WebP supported"
      }
    },
    "structuredData": {
      "score": 65,
      "factors": {
        "schemaPresent": "✓ Product schema found",
        "validation": "⚠ Missing 'aggregateRating'",
        "richResults": "✓ Eligible for rich snippets"
      }
    }
  },
  "improvementSuggestions": [
    "Add customer reviews for aggregateRating schema",
    "Reduce keyword density for 'headphones' from 4.8% to 3%",
    "Add FAQ schema for better rich results"
  ]
}
```

### 1.13 Get Image Alt Text Suggestions

AI-generated alt text for product images.

```http
GET /products/:id/image-alt-suggestions
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "suggestions": [
    {
      "imageUrl": "https://example.com/image1.jpg",
      "currentAlt": "Front view of headphones",
      "suggestions": [
        "Premium wireless noise-cancelling headphones in matte black finish",
        "Front view of wireless Bluetooth headphones with cushioned ear cups",
        "High-quality over-ear headphones with active noise cancellation"
      ],
      "selectedAlt": "Premium wireless noise-cancelling headphones in matte black finish",
      "confidence": 0.94
    }
  ]
}
```

### 1.14 Export Products

Exports products in various formats.

```http
POST /products/export
Content-Type: application/json
```

**Request Body:**
```json
{
  "format": "csv",
  "filters": {
    "category": "Electronics",
    "minScore": 70
  },
  "fields": ["id", "title", "price", "seoScore"]
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "format": "csv",
  "downloadUrl": "https://example.com/exports/products_20260211.csv",
  "expiresAt": "2026-02-12T10:00:00Z",
  "recordCount": 156
}
```

### 1.15 Import Products

Imports products from CSV/JSON file.

```http
POST /products/import
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (file) - CSV or JSON file
- `overwriteExisting` (boolean, default: false)
- `validateOnly` (boolean, default: false)

**Response:** `200 OK`
```json
{
  "ok": true,
  "imported": 45,
  "skipped": 3,
  "errors": [
    {
      "row": 12,
      "error": "Missing required field: title"
    }
  ]
}
```

---

## Category 2: AI & ML Orchestration

### 2.1 Multi-Model Content Generation

Orchestrates content generation across multiple AI models.

```http
POST /ai/orchestration/generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Generate SEO-optimized product title for wireless headphones",
  "models": ["gpt-4", "claude-3.5-sonnet", "gemini-pro"],
  "strategy": "best-of-n",
  "temperature": 0.7,
  "maxTokens": 200,
  "evaluationCriteria": {
    "seoScore": 0.4,
    "readability": 0.3,
    "creativity": 0.3
  }
}
```

**Strategy Options:**
- `best-of-n` - Generate from all models, return highest-scored result
- `ensemble` - Combine outputs from multiple models
- `cascade` - Try models in order until quality threshold met
- `parallel` - Return all model outputs for comparison

**Response:** `200 OK`
```json
{
  "ok": true,
  "result": {
    "selectedModel": "claude-3.5-sonnet",
    "selectedResponse": "Premium Wireless Noise-Cancelling Headphones | Studio Quality Audio",
    "score": 94.2,
    "responses": [
      {
        "model": "gpt-4",
        "content": "Wireless Headphones with Active Noise Cancellation...",
        "score": 89.1,
        "latency": 1243,
        "cost": 0.006
      },
      {
        "model": "claude-3.5-sonnet",
        "content": "Premium Wireless Noise-Cancelling Headphones | Studio Quality Audio",
        "score": 94.2,
        "latency": 987,
        "cost": 0.004
      }
    ],
    "totalCost": 0.018,
    "totalLatency": 2456,
    "strategy": "best-of-n"
  }
}
```

### 2.2 List Available Models

Returns all AI models available for SEO optimization.

```http
GET /ai/models/available
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "models": [
    {
      "id": "gpt-4",
      "provider": "openai",
      "capabilities": ["text-generation", "reasoning", "analysis"],
      "contextWindow": 128000,
      "costPer1kTokens": 0.03,
      "status": "available",
      "recommended": ["title-optimization", "description-generation"]
    },
    {
      "id": "claude-3.5-sonnet",
      "provider": "anthropic",
      "capabilities": ["text-generation", "reasoning", "analysis"],
      "contextWindow": 200000,
      "costPer1kTokens": 0.015,
      "status": "available",
      "recommended": ["long-form-content", "technical-writing"]
    }
  ]
}
```

### 2.3 Set Model Preferences

Configures preferred models for specific SEO tasks.

```http
POST /ai/models/set-preference
Content-Type: application/json
```

**Request Body:**
```json
{
  "category": "titleOptimization",
  "model": "claude-3.5-sonnet",
  "fallbackModels": ["gpt-4", "gpt-3.5-turbo"]
}
```

**Categories:**
- `titleOptimization`
- `descriptionGeneration`
- `keywordResearch`
- `contentAnalysis`
- `schemaGeneration`

**Response:** `200 OK`
```json
{
  "ok": true,
  "preference": {
    "category": "titleOptimization",
    "primaryModel": "claude-3.5-sonnet",
    "fallbackModels": ["gpt-4", "gpt-3.5-turbo"],
    "updatedAt": "2026-02-11T10:00:00Z"
  }
}
```

### 2.4 Get Model Performance Metrics

Retrieves performance analytics for AI models.

```http
GET /ai/models/performance?period=30d
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "performance": [
    {
      "model": "claude-3.5-sonnet",
      "stats": {
        "totalRequests": 1247,
        "averageLatency": 1024,
        "successRate": 99.8,
        "averageQualityScore": 91.3,
        "totalCost": 18.45,
        "costPerRequest": 0.0148
      },
      "taskBreakdown": {
        "titleOptimization": { "requests": 456, "avgScore": 93.1 },
        "descriptionGeneration": { "requests": 791, "avgScore": 89.7 }
      }
    }
  ]
}
```

### 2.5 Best-of-N Routing

Runs multiple model generations and returns the best result.

```http
POST /ai/routing/best-of-n
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Write SEO product description",
  "n": 5,
  "model": "gpt-4",
  "scoringFunction": "seo-optimized"
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "bestResult": {
    "content": "...",
    "score": 94.2,
    "attemptNumber": 3
  },
  "allResults": [
    { "content": "...", "score": 87.1 },
    { "content": "...", "score": 91.3 },
    { "content": "...", "score": 94.2 }
  ]
}
```

### 2.6 Ensemble Generation

Combines outputs from multiple models into a unified result.

```http
POST /ai/routing/ensemble
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Generate product keywords",
  "models": ["gpt-4", "claude-3.5-sonnet"],
  "mergeStrategy": "union"
}
```

**Merge Strategies:**
- `union` - Combine all unique outputs
- `intersection` - Only items agreed upon by all models
- `weighted` - Weight by model confidence scores

**Response:** `200 OK`
```json
{
  "ok": true,
  "ensemble": {
    "keywords": ["wireless", "headphones", "noise cancelling", "bluetooth"],
    "sources": {
      "gpt-4": ["wireless", "headphones", "bluetooth"],
      "claude-3.5-sonnet": ["wireless", "headphones", "noise cancelling", "bluetooth"]
    },
    "confidence": {
      "wireless": 1.0,
      "headphones": 1.0,
      "bluetooth": 0.8,
      "noise cancelling": 0.5
    }
  }
}
```

### 2.7 Cascade Routing

Tries models in order until quality threshold is met.

```http
POST /ai/routing/cascade
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Optimize product title",
  "models": ["gpt-3.5-turbo", "gpt-4", "claude-3.5-sonnet"],
  "qualityThreshold": 85,
  "maxAttempts": 3
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "result": {
    "content": "...",
    "score": 87.3,
    "modelUsed": "gpt-4",
    "attemptNumber": 2,
    "costSavings": 0.012
  }
}
```

### 2.8 RLHF Feedback

Submits human feedback for reinforcement learning.

```http
POST /ai/rlhf/feedback
Content-Type: application/json
```

**Request Body:**
```json
{
  "requestId": "req_abc123",
  "rating": 4,
  "feedback": "Great title but too long",
  "selectedVariant": "variant_2",
  "improvements": ["shorten", "add-ctawords"]
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "feedbackId": "fb_xyz789",
  "processed": true,
  "modelUpdated": false,
  "message": "Feedback recorded for future training"
}
```

### 2.9 Create Fine-Tuning Job

Initiates custom model fine-tuning.

```http
POST /ai/fine-tune/create
Content-Type: application/json
```

**Request Body:**
```json
{
  "baseModel": "gpt-4",
  "trainingData": [
    {
      "prompt": "Generate title for wireless headphones",
      "completion": "Premium Wireless Headphones | Noise Cancelling"
    }
  ],
  "validationData": [],
  "epochs": 3,
  "learningRate": 0.0001
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "job": {
    "jobId": "ft_job_123",
    "status": "pending",
    "baseModel": "gpt-4",
    "trainingExamples": 500,
    "estimatedDuration": "2-4 hours",
    "createdAt": "2026-02-11T10:00:00Z"
  }
}
```

### 2.10 Batch Process Products

Starts batch AI optimization for multiple products.

```http
POST /ai/batch-process
Content-Type: application/json
```

**Request Body:**
```json
{
  "productIds": [1, 2, 3, 4, 5],
  "operations": ["optimize-title", "generate-description", "generate-schema"],
  "model": "claude-3.5-sonnet",
  "concurrency": 5
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "batch": {
    "batchId": "batch_abc123",
    "status": "processing",
    "totalProducts": 5,
    "completed": 0,
    "estimatedCompletion": "2026-02-11T10:15:00Z",
    "progressUrl": "/ai/batch-process/batch_abc123/status"
  }
}
```

---

## Category 3: Keyword & SERP Analysis

### 3.1 Keyword Research

Generates keyword ideas based on seed keywords.

```http
POST /keywords/research
Content-Type: application/json
```

**Request Body:**
```json
{
  "seed": "wireless headphones",
  "count": 50,
  "includeMetrics": true,
  "location": "US",
  "language": "en"
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "keywords": [
    {
      "keyword": "best wireless headphones 2026",
      "searchVolume": 18100,
      "competition": "medium",
      "cpc": 2.45,
      "difficulty": 68,
      "trend": "rising",
      "intent": "commercial"
    },
    {
      "keyword": "wireless headphones with noise cancelling",
      "searchVolume": 8200,
      "competition": "high",
      "cpc": 3.12,
      "difficulty": 74,
      "trend": "stable",
      "intent": "commercial"
    }
  ],
  "totalFound": 143,
  "source": "ai-powered"
}
```

### 3.2 Analyze Keywords

Analyzes difficulty and opportunity for target keywords.

```http
POST /keywords/analyze
Content-Type: application/json
```

**Request Body:**
```json
{
  "keywords": [
    "wireless headphones",
    "bluetooth earbuds",
    "noise cancelling headphones"
  ]
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "analysis": [
    {
      "keyword": "wireless headphones",
      "difficulty": 78,
      "opportunity": 6.8,
      "searchVolume": 135000,
      "competitorCount": 142000,
      "topRankingDomains": [
        "amazon.com",
        "bestbuy.com",
        "sony.com"
      ],
      "recommendation": "Moderate difficulty - target long-tail variants"
    }
  ]
}
```

### 3.3 Get Keyword Trends

Retrieves historical search volume trends.

```http
GET /keywords/trends?keyword=wireless%20headphones&period=12m
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "keyword": "wireless headphones",
  "trends": [
    { "month": "2025-03", "searchVolume": 125000, "change": 5.2 },
    { "month": "2025-04", "searchVolume": 132000, "change": 5.6 },
    { "month": "2025-05", "searchVolume": 128000, "change": -3.0 }
  ],
  "seasonality": {
    "peak": "November-December",
    "low": "May-June"
  }
}
```

### 3.4 SERP Analysis

Analyzes search engine results page for a keyword.

```http
GET /serp/:keyword?location=US&device=desktop
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "keyword": "wireless headphones",
  "serp": {
    "topResults": [
      {
        "position": 1,
        "url": "https://example.com/best-wireless-headphones",
        "title": "10 Best Wireless Headphones of 2026",
        "domain": "example.com",
        "domainAuthority": 78,
        "wordCount": 2400,
        "backlinks": 324,
        "hasRichResults": true
      }
    ],
    "features": ["people_also_ask", "shopping_results", "videos"],
    "avgWordCount": 1847,
    "difficultyScore": 76
  }
}
```

### 3.5 Get SERP Features

Identifies available SERP features for a keyword.

```http
GET /serp/:keyword/features
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "features": {
    "peopleAlsoAsk": {
      "present": true,
      "questions": [
        "What are the best wireless headphones?",
        "Are wireless headphones worth it?"
      ]
    },
    "shoppingResults": {
      "present": true,
      "productCount": 8
    },
    "richSnippets": {
      "present": true,
      "types": ["product", "review"]
    },
    "localPack": {
      "present": false
    }
  },
  "recommendations": [
    "Target People Also Ask questions in content",
    "Optimize for Product rich snippets",
    "Add review schema for rating stars"
  ]
}
```

### 3.6 Add Competitor

Adds a competitor for tracking.

```http
POST /competitors
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Competitor Inc",
  "domain": "competitor.com",
  "category": "Electronics",
  "trackKeywords": ["wireless headphones", "bluetooth earbuds"]
}
```

**Response:** `201 Created`
```json
{
  "ok": true,
  "competitor": {
    "id": "comp_123",
    "name": "Competitor Inc",
    "domain": "competitor.com",
    "category": "Electronics",
    "trackingStarted": "2026-02-11T10:00:00Z"
  }
}
```

### 3.7 List Competitors

Retrieves all tracked competitors.

```http
GET /competitors/list?category=Electronics
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "competitors": [
    {
      "id": "comp_123",
      "name": "Competitor Inc",
      "domain": "competitor.com",
      "domainAuthority": 68,
      "organicKeywords": 1247,
      "estimatedTraffic": 45000,
      "topKeywords": ["wireless headphones", "bluetooth speakers"]
    }
  ]
}
```

### 3.8 Competitor Gap Analysis

Identifies keyword gaps between your domain and competitors.

```http
POST /competitors/gap-analysis
Content-Type: application/json
```

**Request Body:**
```json
{
  "myDomain": "mystore.com",
  "competitorIds": ["comp_123", "comp_124"],
  "minSearchVolume": 500
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "gaps": [
    {
      "keyword": "best wireless earbuds",
      "searchVolume": 22000,
      "difficulty": 72,
      "myRanking": null,
      "competitorRankings": {
        "comp_123": 3,
        "comp_124": 7
      },
      "opportunity": "high"
    }
  ],
  "totalGaps": 47,
  "highPriority": 12
}
```

### 3.9 Get Rankings Summary

Overview of all keyword rankings.

```http
GET /rankings/summary?period=30d
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "summary": {
    "totalKeywordsTracked": 523,
    "top3": 47,
    "top10": 142,
    "top20": 267,
    "improvements": 32,
    "declines": 18,
    "averagePosition": 15.3,
    "visibilityScore": 67.8
  },
  "topMovers": [
    {
      "keyword": "wireless headphones",
      "currentPosition": 5,
      "previousPosition": 12,
      "change": 7,
      "searchVolume": 135000
    }
  ]
}
```

### 3.10 Find Content Gaps

Identifies missing content opportunities.

```http
GET /content-gap?domain=mystore.com&competitors=comp_123,comp_124
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "gaps": [
    {
      "topic": "How to choose wireless headphones",
      "competitorCoverage": ["comp_123", "comp_124"],
      "estimatedTraffic": 12000,
      "difficulty": 45,
      "priority": "high",
      "suggestedContent": "Buying guide (1500-2000 words)"
    }
  ]
}
```

---

## Category 4: Multi-Channel Optimization

### 4.1 List Supported Channels

Returns all e-commerce channels supported.

```http
GET /channels
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "channels": [
    {
      "id": "amazon",
      "name": "Amazon",
      "algorithm": "A9",
      "features": ["title-optimization", "backend-keywords", "a-plus-content"],
      "titleMaxLength": 200,
      "bulletPoints": 5
    },
    {
      "id": "ebay",
      "name": "eBay",
      "algorithm": "Cassini",
      "features": ["title-optimization", "item-specifics"],
      "titleMaxLength": 80
    },
    {
      "id": "google-shopping",
      "name": "Google Shopping",
      "features": ["feed-optimization", "merchant-center"],
      "requiresGTIN": true
    }
  ]
}
```

### 4.2 Amazon Analysis

Analyzes product optimization for Amazon A9 algorithm.

```http
GET /amazon/:productId/analysis
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "analysis": {
    "a9Score": 73,
    "title": {
      "score": 68,
      "length": 142,
      "keywordPlacement": "good",
      "issues": ["Missing brand at start", "Could include more features"]
    },
    "bulletPoints": {
      "score": 78,
      "count": 5,
      "avgLength": 120,
      "keywordCoverage": 0.85
    },
    "backendKeywords": {
      "score": 65,
      "used": 187,
      "max": 250,
      "suggestions": ["noise cancelling", "wireless bluetooth"]
    },
    "images": {
      "score": 90,
      "count": 7,
      "quality": "high"
    },
    "recommendations": [
      "Add brand name at beginning of title",
      "Utilize remaining 63 characters in backend keywords",
      "Consider A+ Content for enhanced brand story"
    ]
  }
}
```

### 4.3 Optimize Amazon Title

Generates Amazon-optimized product title.

```http
POST /amazon/:productId/optimize-title
Content-Type: application/json
```

**Request Body:**
```json
{
  "emphasize": ["brand", "features", "benefits"],
  "includeSizeColor": true
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "amazonTitle": "Brand Name Premium Wireless Headphones, Noise Cancelling, Bluetooth 5.0, 30H Battery, Over-Ear, Black",
  "length": 128,
  "a9Score": 89,
  "keywordsCovered": ["wireless", "headphones", "noise cancelling", "bluetooth"],
  "currentTitle": "Premium Wireless Headphones"
}
```

### 4.4 eBay Analysis

Analyzes for eBay Cassini algorithm.

```http
GET /ebay/:productId/analysis
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "analysis": {
    "cassiniScore": 71,
    "title": {
      "score": 75,
      "length": 68,
      "maxLength": 80,
      "keywordPlacement": "good"
    },
    "itemSpecifics": {
      "score": 65,
      "filled": 12,
      "recommended": 18,
      "missing": ["Brand", "Model", "Connectivity"]
    },
    "recommendations": [
      "Add missing item specifics",
      "Use remaining 12 characters in title for keywords",
      "Consider promoted listings for better visibility"
    ]
  }
}
```

### 4.5 Google Shopping Feed

Generates Google Shopping product feed.

```http
GET /google-shopping/:productId/feed
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "feed": {
    "id": "prod_123",
    "title": "Premium Wireless Headphones - Noise Cancelling",
    "description": "High-quality wireless headphones with active noise cancellation...",
    "link": "https://mystore.com/products/wireless-headphones",
    "image_link": "https://mystore.com/images/headphones.jpg",
    "price": "199.99 USD",
    "availability": "in stock",
    "brand": "Brand Name",
    "gtin": "1234567890123",
    "product_type": "Electronics > Audio > Headphones",
    "google_product_category": "Electronics > Audio > Headphones",
    "condition": "new"
  },
  "validation": {
    "errors": [],
    "warnings": ["Consider adding 'sale_price' for better visibility"],
    "eligible": true
  }
}
```

### 4.6 Bulk Multi-Channel Optimize

Optimizes products for multiple channels simultaneously.

```http
POST /multi-channel/bulk-optimize
Content-Type: application/json
```

**Request Body:**
```json
{
  "productIds": [1, 2, 3],
  "channels": ["amazon", "ebay", "google-shopping"],
  "operations": ["title", "description", "feed"]
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "batch": {
    "batchId": "batch_mc_123",
    "status": "processing",
    "totalProducts": 3,
    "channels": 3,
    "totalOperations": 9,
    "progressUrl": "/multi-channel/batch/batch_mc_123/status"
  }
}
```

### 4.7 Sync from Shopify

Imports products from Shopify store.

```http
GET /shopify/products?shopDomain=mystore.myshopify.com&limit=100
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "source": "shopify",
  "synced": 47,
  "products": [
    {
      "shopifyId": "12345",
      "title": "Product Name",
      "imported": true,
      "newProductId": "prod_456"
    }
  ]
}
```

### 4.8 Sync from WooCommerce

Imports products from WooCommerce.

```http
GET /woocommerce/products?siteUrl=https://mystore.com&apiKey=wc_key
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "source": "woocommerce",
  "synced": 32,
  "products": [
    {
      "wooId": 789,
      "title": "Product Name",
      "imported": true
    }
  ]
}
```

---

## Category 5: Schema & Rich Results

### 5.1 List Schema Types

Returns supported Schema.org types.

```http
GET /schema/types
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "types": [
    {
      "type": "Product",
      "requiredFields": ["name", "image", "description"],
      "recommendedFields": ["brand", "offers", "aggregateRating"],
      "richResults": ["product_snippet", "review_stars"]
    },
    {
      "type": "Review",
      "requiredFields": ["itemReviewed", "reviewRating", "author"],
      "richResults": ["review_snippet"]
    },
    {
      "type": "FAQPage",
      "requiredFields": ["mainEntity"],
      "richResults": ["faq_rich_result"]
    }
  ]
}
```

### 5.2 Generate Schema

Auto-generates Schema.org structured data.

```http
POST /schema/:productId/generate?type=Product
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "schema": {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Premium Wireless Headphones",
    "image": [
      "https://example.com/image1.jpg"
    ],
    "description": "High-quality noise-cancelling wireless headphones",
    "sku": "WH-001",
    "brand": {
      "@type": "Brand",
      "name": "Brand Name"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://example.com/products/wireless-headphones",
      "priceCurrency": "USD",
      "price": "199.99",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "reviewCount": "89"
    }
  }
}
```

### 5.3 Validate Schema

Validates schema markup against Schema.org specifications.

```http
GET /schema/:productId/validate
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "field": "aggregateRating",
      "message": "Recommended field missing",
      "severity": "warning"
    }
  ],
  "richResultsEligible": true,
  "eligibleTypes": ["product_snippet"]
}
```

### 5.4 Bulk Generate Schemas

Generates schemas for multiple products.

```http
POST /schema/bulk-generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "productIds": [1, 2, 3, 4, 5],
  "type": "Product"
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "results": [
    {
      "productId": 1,
      "success": true,
      "schema": { "@type": "Product", "..." }
    },
    {
      "productId": 2,
      "success": true,
      "schema": { "@type": "Product", "..." }
    }
  ],
  "totalProcessed": 5,
  "successful": 5,
  "failed": 0
}
```

### 5.5 Get Schema Coverage

Reports on schema implementation across products.

```http
GET /schema/coverage
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "report": {
    "totalProducts": 523,
    "withSchema": 412,
    "coverage": 78.8,
    "byType": {
      "Product": 412,
      "Review": 234,
      "FAQPage": 45
    },
    "richResultsEligible": 387,
    "needsImprovement": 111
  }
}
```

### 5.6 Preview Rich Results

Previews how product will appear in search results.

```http
GET /rich-results/:productId/preview
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "preview": {
    "title": "Premium Wireless Headphones - Brand Name",
    "url": "https://example.com/products/wireless-headphones",
    "description": "High-quality noise-cancelling wireless headphones. Free shipping...",
    "price": "$199.99",
    "availability": "In stock",
    "rating": "★★★★★ 4.7 (89 reviews)",
    "image": "https://example.com/image1.jpg",
    "features": ["price", "availability", "rating", "image"]
  }
}
```

### 5.7 Test Rich Results

Tests rich results eligibility.

```http
GET /rich-results/:productId/test
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "testResult": {
    "eligible": true,
    "types": ["product_snippet", "review_stars"],
    "issues": [],
    "mobileEligible": true,
    "desktopEligible": true
  }
}
```

### 5.8 Get Structured Data Recommendations

AI-powered schema recommendations.

```http
GET /structured-data/recommendations?productId=1
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "recommendations": [
    {
      "type": "FAQPage",
      "priority": "high",
      "reasoning": "Product has common customer questions",
      "estimatedImpact": "Increase CTR by 15-25%",
      "implementation": "Add FAQ schema with 5-10 common questions"
    },
    {
      "type": "HowTo",
      "priority": "medium",
      "reasoning": "Product requires setup instructions",
      "estimatedImpact": "Better visibility for 'how to' queries"
    }
  ]
}
```

---

## Category 6: A/B Testing

### 6.1 Create A/B Test

Creates a new A/B test for SEO elements.

```http
POST /ab-tests
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Title Optimization Test",
  "productId": 1,
  "element": "title",
  "variants": [
    {
      "name": "Control (Original)",
      "content": "Premium Wireless Headphones"
    },
    {
      "name": "Variant A (Feature-focused)",
      "content": "Wireless Noise-Cancelling Headphones | 30H Battery"
    },
    {
      "name": "Variant B (Benefit-focused)",
      "content": "Immersive Audio Experience | Premium Wireless Headphones"
    }
  ],
  "metric": "ctr",
  "duration": 14,
  "trafficSplit": [34, 33, 33]
}
```

**Response:** `201 Created`
```json
{
  "ok": true,
  "test": {
    "id": "test_123",
    "name": "Title Optimization Test",
    "status": "draft",
    "variants": 3,
    "createdAt": "2026-02-11T10:00:00Z"
  }
}
```

### 6.2 List A/B Tests

Retrieves all A/B tests with status filters.

```http
GET /ab-tests?status=running&productId=1
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "tests": [
    {
      "id": "test_123",
      "name": "Title Optimization Test",
      "status": "running",
      "startedAt": "2026-02-08T10:00:00Z",
      "progress": 67.3,
      "leader": "Variant A",
      "confidence": 0.85
    }
  ]
}
```

### 6.3 Get A/B Test Details

Retrieves detailed information about a test.

```http
GET /ab-tests/:testId
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "test": {
    "id": "test_123",
    "name": "Title Optimization Test",
    "productId": 1,
    "element": "title",
    "status": "running",
    "variants": [
      {
        "id": "var_1",
        "name": "Control",
        "content": "Premium Wireless Headphones",
        "impressions": 4523,
        "clicks": 136,
        "ctr": 3.01,
        "conversions": 12,
        "conversionRate": 8.82
      },
      {
        "id": "var_2",
        "name": "Variant A",
        "content": "Wireless Noise-Cancelling Headphones | 30H Battery",
        "impressions": 4487,
        "clicks": 178,
        "ctr": 3.97,
        "conversions": 19,
        "conversionRate": 10.67
      }
    ],
    "duration": 14,
    "daysRemaining": 5,
    "significance": 0.92
  }
}
```

### 6.4 Start A/B Test

Activates a draft A/B test.

```http
POST /ab-tests/:testId/start
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "test": {
    "id": "test_123",
    "status": "running",
    "startedAt": "2026-02-11T10:00:00Z",
    "estimatedEndDate": "2026-02-25T10:00:00Z"
  }
}
```

### 6.5 Get A/B Test Results

Retrieves current results and statistics.

```http
GET /ab-tests/:testId/results
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "results": {
    "testId": "test_123",
    "status": "running",
    "metric": "ctr",
    "variants": [
      {
        "name": "Control",
        "value": 3.01,
        "sampleSize": 4523,
        "confidence": "baseline"
      },
      {
        "name": "Variant A",
        "value": 3.97,
        "sampleSize": 4487,
        "improvement": 31.9,
        "confidence": 0.92,
        "winner": true
      }
    ],
    "recommendation": "Variant A shows 31.9% improvement with 92% confidence. Consider declaring winner.",
    "statisticalSignificance": 0.92
  }
}
```

### 6.6 Get Statistical Significance

Calculates p-value and statistical significance.

```http
GET /ab-tests/:testId/statistical-significance
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "analysis": {
    "testId": "test_123",
    "pValue": 0.012,
    "significance": 0.988,
    "significanceLevel": 0.95,
    "isSignificant": true,
    "sampleSize": 9010,
    "minimumSampleReached": true,
    "recommendation": "Results are statistically significant. Safe to declare winner."
  }
}
```

### 6.7 Stop A/B Test

Stops a running test and declares winner.

```http
POST /ab-tests/:testId/stop
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "statistical_significance",
  "declareWinner": true,
  "winningVariantId": "var_2"
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "test": {
    "id": "test_123",
    "status": "completed",
    "winner": "Variant A",
    "improvement": 31.9,
    "stoppedAt": "2026-02-11T10:00:00Z",
    "appliedToLive": true
  }
}
```

### 6.8 Get Test Recommendations

AI-suggested A/B test opportunities.

```http
GET /ab-tests/recommendations?productId=1
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "recommendations": [
    {
      "element": "title",
      "priority": "high",
      "reasoning": "Current title underperforms category average",
      "suggestedVariants": [
        "Add specific features (noise-cancelling, battery life)",
        "Include emotional triggers (immersive, premium)",
        "Add urgency or exclusivity"
      ],
      "estimatedImpact": "15-30% CTR improvement"
    }
  ]
}
```

---

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 400 | Bad Request | Check request parameters and body format |
| 401 | Unauthorized | Verify API key in Authorization header |
| 403 | Forbidden | API key lacks required permissions |
| 404 | Not Found | Resource ID does not exist |
| 429 | Rate Limit Exceeded | Wait before retrying (see Retry-After header) |
| 500 | Internal Server Error | Contact support if persists |
| 503 | Service Unavailable | Temporary outage, retry with exponential backoff |

**Error Response Format:**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: title",
    "field": "title",
    "requestId": "req_abc123"
  }
}
```

---

## Webhooks

Subscribe to real-time events.

### Available Events

- `product.created`
- `product.updated`
- `product.deleted`
- `seo_score.changed`
- `ab_test.completed`
- `batch.completed`
- `ranking.changed`

### Create Webhook

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://example.com/webhooks/product-seo",
  "events": ["product.updated", "seo_score.changed"],
  "secret": "whsec_abc123"
}
```

### Webhook Payload Example

```json
{
  "id": "evt_123",
  "type": "seo_score.changed",
  "timestamp": "2026-02-11T10:00:00Z",
  "data": {
    "productId": "prod_123",
    "oldScore": 68,
    "newScore": 78,
    "improvements": ["title", "schema"]
  }
}
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
const ProductSEO = require('@aura/product-seo-sdk');

const client = new ProductSEO({
  apiKey: 'sk_live_abc123'
});

// Create product
const product = await client.products.create({
  title: 'Wireless Headphones',
  price: 199.99
});

// Get AI title suggestions
const suggestions = await client.products.getTitleSuggestions(product.id, {
  model: 'claude-3.5-sonnet',
  count: 5
});

// Run multi-model orchestration
const result = await client.ai.orchestrate({
  prompt: 'Generate SEO title',
  models: ['gpt-4', 'claude-3.5-sonnet'],
  strategy: 'best-of-n'
});
```

### Python

```python
from aura_product_seo import ProductSEOClient

client = ProductSEOClient(api_key='sk_live_abc123')

# Create product
product = client.products.create(
    title='Wireless Headphones',
    price=199.99
)

# Get keyword research
keywords = client.keywords.research(
    seed='wireless headphones',
    count=50
)

# Create A/B test
test = client.ab_tests.create(
    name='Title Test',
    product_id=product.id,
    variants=[
        {'name': 'Control', 'content': 'Original Title'},
        {'name': 'Variant A', 'content': 'Optimized Title'}
    ]
)
```

---

**API Version:** 2.1  
**Last Updated:** February 11, 2026  
**Total Endpoints:** 200  
**Support:** api-support@aura.com
