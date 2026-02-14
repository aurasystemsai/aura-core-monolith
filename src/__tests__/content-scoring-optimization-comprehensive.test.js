/**
 * Content Scoring & Optimization - Comprehensive Test Suite
 * 
 * Tests all 8 engines + system health + E2E journey
 * Total: 49 tests (48 unit tests + 1 E2E test)
 */

const request = require('supertest');
const express = require('express');
const contentScoringRouter = require('../tools/content-scoring-optimization/content-scoring-optimization');

const app = express();
app.use(express.json());
app.use('/api/content-scoring', contentScoringRouter);

describe('Content Scoring & Optimization - Comprehensive Test Suite', () => {

  // ============================================================================
  // CONTENT ANALYSIS ENGINE TESTS (6 tests)
  // ============================================================================

  describe('Content Analysis Engine', () => {
    let contentId;

    test('should analyze content structure', async () => {
      const response = await request(app)
        .post('/api/content-scoring/content-analysis/analyze')
        .send({
          contentId: 'blog-post-123',
          contentType: 'blog_post',
          title: 'The Ultimate Guide to Modern Web Development',
          content: 'Web development has evolved significantly over the past decade. This comprehensive guide covers everything you need to know about modern web development practices, from frontend frameworks to backend architectures.',
          url: 'https://example.com/blog/web-development-guide',
          metadata: {
            author: 'John Developer',
            category: 'Technology',
            tags: ['web development', 'programming', 'frontend', 'backend']
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contentId');
      expect(response.body.data.structure).toHaveProperty('wordCount');
      expect(response.body.data.structure.wordCount).toBeGreaterThan(0);
      expect(response.body.data.structure).toHaveProperty('paragraphCount');
      expect(response.body.data.readability).toHaveProperty('fleschReadingEase');
      expect(response.body.data.keywords).toBeInstanceOf(Array);
      
      contentId = response.body.data.contentId;
    });

    test('should get content analysis by ID', async () => {
      const response = await request(app)
        .get(`/api/content-scoring/content-analysis/${contentId || 'blog-post-123'}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contentId');
      expect(response.body.data).toHaveProperty('structure');
    });

    test('should extract keywords from content', async () => {
      const response = await request(app)
        .post('/api/content-scoring/content-analysis/extract-keywords')
        .send({
          content: 'Artificial intelligence and machine learning are transforming how we build software. AI-powered tools help developers write better code faster.',
          maxKeywords: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.keywords).toBeInstanceOf(Array);
      expect(response.body.data.keywords.length).toBeLessThanOrEqual(5);
      expect(response.body.data.keywords[0]).toHaveProperty('keyword');
      expect(response.body.data.keywords[0]).toHaveProperty('score');
    });

    test('should analyze content structure metrics', async () => {
      const response = await request(app)
        .post('/api/content-scoring/content-analysis/structure')
        .send({
          content: 'This is a test paragraph.\n\nThis is another paragraph with more content.\n\nAnd a third one here.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('wordCount');
      expect(response.body.data).toHaveProperty('paragraphCount');
      expect(response.body.data).toHaveProperty('sentenceCount');
      expect(response.body.data.paragraphCount).toBe(3);
    });

    test('should calculate readability scores', async () => {
      const response = await request(app)
        .post('/api/content-scoring/content-analysis/readability')
        .send({
          content: 'The quick brown fox jumps over the lazy dog. This is a simple sentence for testing readability.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('fleschReadingEase');
      expect(response.body.data).toHaveProperty('fleschKincaidGrade');
      expect(response.body.data).toHaveProperty('difficulty');
      expect(['easy', 'medium', 'hard', 'very_hard']).toContain(response.body.data.difficulty);
    });

    test('should get analysis statistics', async () => {
      const response = await request(app)
        .get('/api/content-scoring/content-analysis/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalAnalyses');
      expect(response.body.data).toHaveProperty('byContentType');
      expect(response.body.data).toHaveProperty('averageWordCount');
    });
  });

  // ============================================================================
  // SEO SCORING ENGINE TESTS (6 tests)
  // ============================================================================

  describe('SEO Scoring Engine', () => {
    let seoScoreId;

    test('should calculate SEO score', async () => {
      const response = await request(app)
        .post('/api/content-scoring/seo/score')
        .send({
          contentId: 'blog-post-123',
          url: 'https://example.com/blog/seo-guide',
          title: 'The Complete SEO Guide for 2024',
          metaDescription: 'Learn everything about SEO in 2024 with our comprehensive guide covering keywords, backlinks, and technical SEO.',
          headings: {
            h1: ['The Complete SEO Guide for 2024'],
            h2: ['Understanding SEO Basics', 'Keyword Research', 'Link Building'],
            h3: ['On-Page SEO', 'Off-Page SEO']
          },
          content: 'SEO is essential for online visibility. This guide covers SEO fundamentals and advanced techniques.',
          images: [
            { alt: 'SEO infographic', src: '/images/seo.jpg' },
            { alt: 'Keyword research tool', src: '/images/keywords.jpg' }
          ],
          internalLinks: 5,
          externalLinks: 3,
          keywords: ['SEO', 'search engine optimization', 'keywords']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data.score).toBeGreaterThanOrEqual(0);
      expect(response.body.data.score).toBeLessThanOrEqual(100);
      expect(response.body.data).toHaveProperty('grade');
      expect(response.body.data.breakdown).toHaveProperty('keywords');
      expect(response.body.data.breakdown).toHaveProperty('meta');
      expect(response.body.data.breakdown).toHaveProperty('headings');
      expect(response.body.data.breakdown).toHaveProperty('links');
      
      seoScoreId = response.body.data.contentId;
    });

    test('should get SEO score by ID', async () => {
      const response = await request(app)
        .get(`/api/content-scoring/seo/${seoScoreId || 'blog-post-123'}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('grade');
    });

    test('should analyze keywords for SEO', async () => {
      const response = await request(app)
        .post('/api/content-scoring/seo/keywords')
        .send({
          primaryKeyword: 'content marketing',
          content: 'Content marketing is a strategic approach focused on creating valuable content. Effective content marketing helps businesses attract customers.',
          targetDensity: 2.0
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('primaryKeyword');
      expect(response.body.data).toHaveProperty('density');
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('status');
    });

    test('should validate meta tags', async () => {
      const response = await request(app)
        .post('/api/content-scoring/seo/meta')
        .send({
          title: 'Best Practices for SEO in 2024',
          description: 'Discover the latest SEO best practices for 2024 and improve your search rankings.',
          keywords: 'SEO, search optimization, rankings'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toHaveProperty('status');
      expect(response.body.data.description).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('score');
    });

    test('should analyze heading structure', async () => {
      const response = await request(app)
        .post('/api/content-scoring/seo/headings')
        .send({
          headings: {
            h1: ['Main Title'],
            h2: ['Section 1', 'Section 2', 'Section 3'],
            h3: ['Subsection 1.1', 'Subsection 1.2']
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('h1Count');
      expect(response.body.data).toHaveProperty('properHierarchy');
      expect(response.body.data).toHaveProperty('score');
    });

    test('should get SEO statistics', async () => {
      const response = await request(app)
        .get('/api/content-scoring/seo/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalScores');
      expect(response.body.data).toHaveProperty('averageScore');
      expect(response.body.data).toHaveProperty('byGrade');
    });
  });

  // ============================================================================
  // READABILITY & ENGAGEMENT ENGINE TESTS (6 tests)
  // ============================================================================

  describe('Readability & Engagement Engine', () => {
    let readabilityId;

    test('should analyze readability', async () => {
      const response = await request(app)
        .post('/api/content-scoring/readability/analyze')
        .send({
          contentId: 'article-456',
          content: 'Writing clear and engaging content is essential. Short sentences help readers understand your message. Use simple words when possible. Break up long paragraphs for better readability.',
          targetAudience: 'general'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contentId');
      expect(response.body.data.scores).toHaveProperty('fleschReadingEase');
      expect(response.body.data.scores).toHaveProperty('fleschKincaidGrade');
      expect(response.body.data.scores).toHaveProperty('gunningFog');
      expect(response.body.data.scores).toHaveProperty('smog');
      expect(response.body.data).toHaveProperty('difficulty');
      expect(response.body.data).toHaveProperty('audienceMatch');
      
      readabilityId = response.body.data.contentId;
    });

    test('should get readability score by ID', async () => {
      const response = await request(app)
        .get(`/api/content-scoring/readability/${readabilityId || 'article-456'}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('scores');
      expect(response.body.data).toHaveProperty('difficulty');
    });

    test('should calculate engagement score', async () => {
      const response = await request(app)
        .post('/api/content-scoring/readability/engagement')
        .send({
          content: 'Are you ready to transform your business? Discover the secrets to success! Learn from industry experts.',
          hasImages: true,
          hasVideos: false,
          hasLists: true,
          hasQuestions: true,
          wordCount: 500
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data.score).toBeGreaterThanOrEqual(0);
      expect(response.body.data.score).toBeLessThanOrEqual(100);
      expect(response.body.data.factors).toHaveProperty('multimedia');
      expect(response.body.data.factors).toHaveProperty('formatting');
      expect(response.body.data.factors).toHaveProperty('interactivity');
    });

    test('should predict performance', async () => {
      const response = await request(app)
        .post('/api/content-scoring/readability/predict')
        .send({
          readabilityScore: 70,
          engagementScore: 65,
          seoScore: 80,
          contentType: 'blog_post',
          wordCount: 1200
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('predictedViews');
      expect(response.body.data).toHaveProperty('predictedEngagementRate');
      expect(response.body.data).toHaveProperty('predictedShareRate');
      expect(response.body.data).toHaveProperty('confidence');
    });

    test('should suggest readability improvements', async () => {
      const response = await request(app)
        .post('/api/content-scoring/readability/suggestions')
        .send({
          content: 'This is an extraordinarily complicated sentence that utilizes an excessive amount of multisyllabic words which makes it extremely difficult for the average reader to comprehend the underlying meaning.',
          targetDifficulty: 'medium'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('currentDifficulty');
      expect(response.body.data).toHaveProperty('targetDifficulty');
    });

    test('should get readability statistics', async () => {
      const response = await request(app)
        .get('/api/content-scoring/readability/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalAnalyses');
      expect(response.body.data).toHaveProperty('averageReadabilityScore');
      expect(response.body.data).toHaveProperty('byDifficulty');
    });
  });

  // ============================================================================
  // COMPETITOR ANALYSIS ENGINE TESTS (6 tests)
  // ============================================================================

  describe('Competitor Analysis Engine', () => {
    let analysisId;

    test('should analyze competitor content', async () => {
      const response = await request(app)
        .post('/api/content-scoring/competitor/analyze')
        .send({
          keyword: 'content marketing',
          competitorUrls: [
            'https://competitor1.com/content-marketing',
            'https://competitor2.com/marketing-guide',
            'https://competitor3.com/content-strategy'
          ],
          includeMetrics: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysisId');
      expect(response.body.data).toHaveProperty('keyword');
      expect(response.body.data.competitors).toBeInstanceOf(Array);
      expect(response.body.data.competitors.length).toBeGreaterThan(0);
      expect(response.body.data.competitors[0]).toHaveProperty('url');
      expect(response.body.data.competitors[0]).toHaveProperty('score');
      expect(response.body.data.competitors[0]).toHaveProperty('wordCount');
      
      analysisId = response.body.data.analysisId;
    });

    test('should get competitor analysis by ID', async () => {
      const response = await request(app)
        .get(`/api/content-scoring/competitor/${analysisId || 'analysis-123'}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysisId');
      expect(response.body.data).toHaveProperty('competitors');
    });

    test('should identify content gaps', async () => {
      const response = await request(app)
        .post('/api/content-scoring/competitor/gaps')
        .send({
          yourContent: 'Basic introduction to email marketing and strategies.',
          competitorContents: [
            'Comprehensive email marketing guide with automation, segmentation, and A/B testing.',
            'Advanced email strategies including personalization and behavioral triggers.'
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.gaps).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('missingTopics');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    test('should compare content metrics', async () => {
      const response = await request(app)
        .post('/api/content-scoring/competitor/compare')
        .send({
          yourUrl: 'https://example.com/my-article',
          competitorUrls: [
            'https://competitor1.com/article',
            'https://competitor2.com/post'
          ],
          metrics: ['wordCount', 'readability', 'seo', 'engagement']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('yourMetrics');
      expect(response.body.data).toHaveProperty('competitorMetrics');
      expect(response.body.data).toHaveProperty('comparison');
      expect(response.body.data.comparison).toHaveProperty('rank');
    });

    test('should get SERP analysis', async () => {
      const response = await request(app)
        .post('/api/content-scoring/competitor/serp')
        .send({
          keyword: 'digital marketing trends',
          location: 'US',
          topN: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('keyword');
      expect(response.body.data.results).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('averageWordCount');
      expect(response.body.data).toHaveProperty('averageScore');
      expect(response.body.data).toHaveProperty('commonTopics');
    });

    test('should get competitor statistics', async () => {
      const response = await request(app)
        .get('/api/content-scoring/competitor/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalAnalyses');
      expect(response.body.data).toHaveProperty('totalCompetitorsTracked');
      expect(response.body.data).toHaveProperty('averageCompetitorScore');
    });
  });

  // ============================================================================
  // OPTIMIZATION RECOMMENDATIONS ENGINE TESTS (6 tests)
  // ============================================================================

  describe('Optimization Recommendations Engine', () => {
    let recommendationId;

    test('should generate recommendations', async () => {
      const response = await request(app)
        .post('/api/content-scoring/recommendations/generate')
        .send({
          contentId: 'blog-post-789',
          contentAnalysis: {
            wordCount: 500,
            readabilityScore: 55,
            seoScore: 60
          },
          targetGoals: {
            readability: 70,
            seo: 80,
            engagement: 75
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contentId');
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
      expect(response.body.data.recommendations.length).toBeGreaterThan(0);
      expect(response.body.data.recommendations[0]).toHaveProperty('type');
      expect(response.body.data.recommendations[0]).toHaveProperty('priority');
      expect(response.body.data.recommendations[0]).toHaveProperty('suggestion');
      expect(response.body.data.recommendations[0]).toHaveProperty('expectedImpact');
      
      recommendationId = response.body.data.contentId;
    });

    test('should get recommendations by ID', async () => {
      const response = await request(app)
        .get(`/api/content-scoring/recommendations/${recommendationId || 'blog-post-789'}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recommendations');
    });

    test('should apply recommendation', async () => {
      const response = await request(app)
        .post('/api/content-scoring/recommendations/apply')
        .send({
          contentId: 'blog-post-789',
          recommendationId: 'rec-1',
          applied: true,
          feedback: 'Improved readability significantly'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.status).toBe('applied');
    });

    test('should prioritize recommendations', async () => {
      const response = await request(app)
        .post('/api/content-scoring/recommendations/prioritize')
        .send({
          recommendations: [
            { type: 'seo', currentScore: 50, targetScore: 80 },
            { type: 'readability', currentScore: 60, targetScore: 70 },
            { type: 'engagement', currentScore: 55, targetScore: 75 }
          ],
          optimizeFor: 'impact'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prioritized).toBeInstanceOf(Array);
      expect(response.body.data.prioritized[0]).toHaveProperty('rank');
      expect(response.body.data.prioritized[0]).toHaveProperty('score');
    });

    test('should get quick wins', async () => {
      const response = await request(app)
        .post('/api/content-scoring/recommendations/quick-wins')
        .send({
          contentId: 'blog-post-789',
          maxEffort: 'low',
          minImpact: 'medium'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quickWins).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('estimatedTime');
      expect(response.body.data).toHaveProperty('potentialImpact');
    });

    test('should get recommendation statistics', async () => {
      const response = await request(app)
        .get('/api/content-scoring/recommendations/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRecommendations');
      expect(response.body.data).toHaveProperty('appliedCount');
      expect(response.body.data).toHaveProperty('averageImpact');
    });
  });

  // ============================================================================
  // CONTENT TEMPLATES ENGINE TESTS (6 tests)
  // ============================================================================

  describe('Content Templates Engine', () => {
    let templateId;

    test('should create content template', async () => {
      const response = await request(app)
        .post('/api/content-scoring/templates/create')
        .send({
          name: 'Blog Post Template',
          category: 'blog',
          structure: {
            sections: [
              { type: 'introduction', minWords: 100, maxWords: 200 },
              { type: 'body', minWords: 500, maxWords: 1000 },
              { type: 'conclusion', minWords: 100, maxWords: 150 }
            ],
            requiredElements: ['h1', 'h2', 'images', 'cta']
          },
          seoGuidelines: {
            minWordCount: 800,
            keywordDensity: { min: 1.0, max: 2.5 },
            headingStructure: true
          },
          targetMetrics: {
            readability: 70,
            seo: 85,
            engagement: 75
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('templateId');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data.structure).toHaveProperty('sections');
      
      templateId = response.body.data.templateId;
    });

    test('should get template by ID', async () => {
      const response = await request(app)
        .get(`/api/content-scoring/templates/${templateId || 'template-123'}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('templateId');
      expect(response.body.data).toHaveProperty('structure');
    });

    test('should list templates by category', async () => {
      const response = await request(app)
        .get('/api/content-scoring/templates/list')
        .query({ category: 'blog', sortBy: 'usage' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toBeInstanceOf(Array);
    });

    test('should validate content against template', async () => {
      const response = await request(app)
        .post('/api/content-scoring/templates/validate')
        .send({
          templateId: templateId || 'template-123',
          content: 'This is a test blog post with introduction, body, and conclusion sections.',
          metadata: {
            title: 'Test Article',
            headings: ['Introduction', 'Main Content', 'Conclusion']
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isValid');
      expect(response.body.data).toHaveProperty('compliance');
      expect(response.body.data).toHaveProperty('violations');
    });

    test('should clone template', async () => {
      const response = await request(app)
        .post('/api/content-scoring/templates/clone')
        .send({
          sourceTemplateId: templateId || 'template-123',
          newName: 'Cloned Blog Template',
          modifications: {
            targetMetrics: { seo: 90 }
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('templateId');
      expect(response.body.data.name).toContain('Cloned');
    });

    test('should get template statistics', async () => {
      const response = await request(app)
        .get('/api/content-scoring/templates/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTemplates');
      expect(response.body.data).toHaveProperty('byCategory');
      expect(response.body.data).toHaveProperty('mostUsed');
    });
  });

  // ============================================================================
  // PERFORMANCE TRACKING ENGINE TESTS (6 tests)
  // ============================================================================

  describe('Performance Tracking Engine', () => {
    let trackingId;

    test('should track content performance', async () => {
      const response = await request(app)
        .post('/api/content-scoring/performance/track')
        .send({
          contentId: 'article-999',
          url: 'https://example.com/article-999',
          metrics: {
            views: 1500,
            uniqueVisitors: 1200,
            avgTimeOnPage: 180,
            bounceRate: 45,
            shares: 25,
            comments: 10
          },
          scores: {
            readability: 75,
            seo: 82,
            engagement: 70
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contentId');
      expect(response.body.data).toHaveProperty('performanceScore');
      expect(response.body.data.performanceScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.performanceScore).toBeLessThanOrEqual(100);
      
      trackingId = response.body.data.contentId;
    });

    test('should get performance data by ID', async () => {
      const response = await request(app)
        .get(`/api/content-scoring/performance/${trackingId || 'article-999'}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contentId');
      expect(response.body.data).toHaveProperty('performanceScore');
    });

    test('should get performance trends', async () => {
      const response = await request(app)
        .post('/api/content-scoring/performance/trends')
        .send({
          contentId: 'article-999',
          timeRange: 'last_30_days',
          metrics: ['views', 'engagement', 'seo']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contentId');
      expect(response.body.data.trends).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('overallTrend');
    });

    test('should compare time periods', async () => {
      const response = await request(app)
        .post('/api/content-scoring/performance/compare')
        .send({
          contentId: 'article-999',
          period1: { start: '2024-01-01', end: '2024-01-31' },
          period2: { start: '2024-02-01', end: '2024-02-28' }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period1');
      expect(response.body.data).toHaveProperty('period2');
      expect(response.body.data).toHaveProperty('changes');
      expect(response.body.data.changes).toHaveProperty('views');
    });

    test('should create A/B test', async () => {
      const response = await request(app)
        .post('/api/content-scoring/performance/ab-test')
        .send({
          name: 'Headline Test',
          variantA: {
            contentId: 'article-999-a',
            headline: 'Original Headline'
          },
          variantB: {
            contentId: 'article-999-b',
            headline: 'New Headline'
          },
          metric: 'engagement_rate',
          duration: 14
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('testId');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.status).toBe('active');
    });

    test('should get performance statistics', async () => {
      const response = await request(app)
        .get('/api/content-scoring/performance/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTracked');
      expect(response.body.data).toHaveProperty('averagePerformance');
      expect(response.body.data).toHaveProperty('topPerformers');
    });
  });

  // ============================================================================
  // AI ENHANCEMENT ENGINE TESTS (6 tests)
  // ============================================================================

  describe('AI Enhancement Engine', () => {
    let enhancementId;

    test('should enhance content with AI', async () => {
      const response = await request(app)
        .post('/api/content-scoring/ai/enhance')
        .send({
          contentId: 'draft-555',
          content: 'This is a basic article about content marketing.',
          enhancements: ['improve_readability', 'add_transitions', 'enhance_vocabulary'],
          tone: 'professional',
          targetAudience: 'business'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contentId');
      expect(response.body.data).toHaveProperty('enhanced');
      expect(response.body.data.enhanced).toHaveProperty('content');
      expect(response.body.data).toHaveProperty('improvements');
      
      enhancementId = response.body.data.contentId;
    });

    test('should rewrite content section', async () => {
      const response = await request(app)
        .post('/api/content-scoring/ai/rewrite')
        .send({
          content: 'The product is good and does what it should do.',
          style: 'engaging',
          length: 'expand'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('original');
      expect(response.body.data).toHaveProperty('rewritten');
      expect(response.body.data.rewritten.length).toBeGreaterThan(response.body.data.original.length);
    });

    test('should generate content variations', async () => {
      const response = await request(app)
        .post('/api/content-scoring/ai/variations')
        .send({
          headline: 'How to Improve Your Content Marketing',
          count: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.variations).toBeInstanceOf(Array);
      expect(response.body.data.variations.length).toBe(5);
      expect(response.body.data.variations[0]).toHaveProperty('text');
      expect(response.body.data.variations[0]).toHaveProperty('score');
    });

    test('should suggest content improvements', async () => {
      const response = await request(app)
        .post('/api/content-scoring/ai/suggestions')
        .send({
          content: 'Content marketing helps businesses grow.',
          context: 'blog_introduction',
          goals: ['increase_engagement', 'improve_seo']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toBeInstanceOf(Array);
      expect(response.body.data.suggestions.length).toBeGreaterThan(0);
      expect(response.body.data.suggestions[0]).toHaveProperty('type');
      expect(response.body.data.suggestions[0]).toHaveProperty('suggestion');
    });

    test('should optimize for tone', async () => {
      const response = await request(app)
        .post('/api/content-scoring/ai/tone')
        .send({
          content: 'You need to buy this product right now!',
          targetTone: 'friendly',
          currentTone: 'aggressive'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('optimized');
      expect(response.body.data).toHaveProperty('toneScore');
      expect(response.body.data.toneScore.target).toBe('friendly');
    });

    test('should get AI enhancement statistics', async () => {
      const response = await request(app)
        .get('/api/content-scoring/ai/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalEnhancements');
      expect(response.body.data).toHaveProperty('averageImprovement');
      expect(response.body.data).toHaveProperty('byEnhancementType');
    });
  });

  // ============================================================================
  // SYSTEM HEALTH & STATISTICS (2 tests)
  // ============================================================================

  describe('System Health & Statistics', () => {
    test('should check system health', async () => {
      const response = await request(app)
        .get('/api/content-scoring/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.status).toBe('operational');
      expect(response.body.data.services).toHaveProperty('contentAnalysis');
      expect(response.body.data.services).toHaveProperty('seoScoring');
      expect(response.body.data.services).toHaveProperty('readability');
      expect(response.body.data.services).toHaveProperty('competitorAnalysis');
      expect(response.body.data.services).toHaveProperty('recommendations');
      expect(response.body.data.services).toHaveProperty('templates');
      expect(response.body.data.services).toHaveProperty('performanceTracking');
      expect(response.body.data.services).toHaveProperty('aiEnhancement');
      
      Object.values(response.body.data.services).forEach(service => {
        expect(service).toBe('up');
      });
    });

    test('should get aggregated statistics', async () => {
      const response = await request(app)
        .get('/api/content-scoring/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contentAnalysis');
      expect(response.body.data).toHaveProperty('seoScoring');
      expect(response.body.data).toHaveProperty('readability');
      expect(response.body.data).toHaveProperty('competitorAnalysis');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('templates');
      expect(response.body.data).toHaveProperty('performanceTracking');
      expect(response.body.data).toHaveProperty('aiEnhancement');
    });
  });

  // ============================================================================
  // E2E JOURNEY TEST (1 comprehensive test)
  // ============================================================================

  describe('E2E Journey: Complete Content Optimization Workflow', () => {
    test('should complete full content optimization journey', async () => {
      // Step 1: Analyze new content
      const analysisResponse = await request(app)
        .post('/api/content-scoring/content-analysis/analyze')
        .send({
          contentId: 'e2e-test-content',
          contentType: 'blog_post',
          title: 'Complete Guide to Content Optimization',
          content: 'Content optimization is essential for digital success. This guide covers everything.',
          url: 'https://example.com/optimization-guide'
        });
      expect(analysisResponse.status).toBe(201);
      const contentId = analysisResponse.body.data.contentId;

      // Step 2: Calculate SEO score
      const seoResponse = await request(app)
        .post('/api/content-scoring/seo/score')
        .send({
          contentId,
          url: 'https://example.com/optimization-guide',
          title: 'Complete Guide to Content Optimization',
          metaDescription: 'Learn content optimization strategies',
          content: 'Content optimization is essential for digital success.',
          headings: { h1: ['Complete Guide'], h2: ['Introduction', 'Strategies'] }
        });
      expect(seoResponse.status).toBe(201);
      const seoScore = seoResponse.body.data.score;

      // Step 3: Analyze readability
      const readabilityResponse = await request(app)
        .post('/api/content-scoring/readability/analyze')
        .send({
          contentId,
          content: 'Content optimization is essential for digital success. This guide covers everything.',
          targetAudience: 'general'
        });
      expect(readabilityResponse.status).toBe(201);

      // Step 4: Analyze competitors
      const competitorResponse = await request(app)
        .post('/api/content-scoring/competitor/analyze')
        .send({
          keyword: 'content optimization',
          competitorUrls: ['https://competitor.com/guide'],
          includeMetrics: true
        });
      expect(competitorResponse.status).toBe(201);

      // Step 5: Generate recommendations
      const recommendationsResponse = await request(app)
        .post('/api/content-scoring/recommendations/generate')
        .send({
          contentId,
          contentAnalysis: { wordCount: 100, readabilityScore: 60, seoScore },
          targetGoals: { readability: 75, seo: 85, engagement: 80 }
        });
      expect(recommendationsResponse.status).toBe(201);
      expect(recommendationsResponse.body.data.recommendations.length).toBeGreaterThan(0);

      // Step 6: Enhance with AI
      const enhancementResponse = await request(app)
        .post('/api/content-scoring/ai/enhance')
        .send({
          contentId,
          content: 'Content optimization is essential for digital success.',
          enhancements: ['improve_readability', 'enhance_vocabulary'],
          tone: 'professional'
        });
      expect(enhancementResponse.status).toBe(201);

      // Step 7: Create template from successful content
      const templateResponse = await request(app)
        .post('/api/content-scoring/templates/create')
        .send({
          name: 'Optimization Guide Template',
          category: 'guide',
          structure: { sections: [{ type: 'intro', minWords: 50 }] },
          targetMetrics: { readability: 75, seo: 85 }
        });
      expect(templateResponse.status).toBe(201);

      // Step 8: Track performance
      const performanceResponse = await request(app)
        .post('/api/content-scoring/performance/track')
        .send({
          contentId,
          url: 'https://example.com/optimization-guide',
          metrics: { views: 500, uniqueVisitors: 400, shares: 10 },
          scores: { readability: 75, seo: 85, engagement: 80 }
        });
      expect(performanceResponse.status).toBe(201);

      // Step 9: Check system health
      const healthResponse = await request(app)
        .get('/api/content-scoring/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.data.status).toBe('operational');

      // Step 10: Get aggregated statistics
      const statsResponse = await request(app)
        .get('/api/content-scoring/statistics');
      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
    });
  });

});
