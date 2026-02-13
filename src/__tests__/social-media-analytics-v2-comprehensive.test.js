/**
 * Social Media Analytics & Listening V2 - Comprehensive Tests
 * 48 unit tests + 1 E2E journey test = 49 total tests
 */

const request = require('supertest');
const express = require('express');
const socialMediaRouter = require('../src/tools/social-media-analytics/social-media-analytics');

const app = express();
app.use(express.json());
app.use('/api/social-media', socialMediaRouter);

describe('Social Media Analytics & Listening V2', () => {
  
  // ========================================================================
  // PLATFORM ANALYTICS TESTS (6 tests)
  // ========================================================================
  
  describe('Platform Analytics Engine', () => {
    let accountId;

    test('should connect platform account', async () => {
      const response = await request(app)
        .post('/api/social-media/platform/accounts/connect')
        .send({
          platform: 'instagram',
          handle: '@testbrand',
          accountType: 'business',
          accessToken: 'test_token_123',
          primaryObjective: 'engagement'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.account).toHaveProperty('id');
      expect(response.body.account.platform).toBe('instagram');
      accountId = response.body.account.id;
    });

    test('should sync platform metrics', async () => {
      const response = await request(app)
        .post(`/api/social-media/platform/accounts/${accountId}/sync`)
        .send({
          period: '30days',
          followers: { total: 125000, gained: 5200, lost: 1100 },
          engagement: { total: 45000, likes: 32000, comments: 8000, shares: 5000 },
          reach: { total: 450000, impressions: 650000 }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toHaveProperty('followers');
      expect(response.body.metrics.followers.netGrowth).toBe(4100);
      expect(response.body.metrics.followers.growthRate).toBeCloseTo(3.36, 1);
    });

    test('should calculate account health', async () => {
      const response = await request(app)
        .get(`/api/social-media/platform/accounts/${accountId}/health`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.health).toHaveProperty('score');
      expect(response.body.health.score).toBeGreaterThanOrEqual(0);
      expect(response.body.health.score).toBeLessThanOrEqual(100);
      expect(response.body.health).toHaveProperty('status');
      expect(['excellent', 'good', 'fair', 'poor']).toContain(response.body.health.status);
    });

    test('should get growth trends', async () => {
      const response = await request(app)
        .get(`/api/social-media/platform/accounts/${accountId}/growth-trends`)
        .query({ days: 7 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.trends).toHaveProperty('direction');
      expect(['increasing', 'decreasing', 'stable']).toContain(response.body.trends.direction);
    });

    test('should generate performance report', async () => {
      const response = await request(app)
        .post(`/api/social-media/platform/accounts/${accountId}/reports`)
        .send({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeComparisons: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report).toHaveProperty('period');
      expect(response.body.report).toHaveProperty('insights');
    });

    test('should get platform statistics', async () => {
      const response = await request(app)
        .get(`/api/social-media/platform/accounts/${accountId}/statistics`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('totalAccounts');
    });
  });

  // ========================================================================
  // CONTENT PERFORMANCE TESTS (6 tests)
  // ========================================================================
  
  describe('Content Performance Engine', () => {
    let postId;
    const testAccountId = 1;

    test('should track content post', async () => {
      const response = await request(app)
        .post('/api/social-media/content/posts')
        .send({
          accountId: testAccountId,
          platform: 'instagram',
          postType: 'feed',
          content: {
            text: 'Check out our new product! #awesome #newlaunch',
            mediaType: 'image',
            hashtags: ['awesome', 'newlaunch'],
            mentions: ['@partner'],
            location: 'New York, NY'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.post).toHaveProperty('id');
      expect(response.body.post.postType).toBe('feed');
      postId = response.body.post.id;
    });

    test('should update post metrics', async () => {
      const response = await request(app)
        .put(`/api/social-media/content/posts/${postId}/metrics`)
        .send({
          likes: 1500,
          comments: 250,
          shares: 80,
          saves: 120,
          reach: 25000,
          impressions: 32000
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.post.metrics.engagementRate).toBeGreaterThan(0);
    });

    test('should calculate content score', async () => {
      const response = await request(app)
        .post(`/api/social-media/content/posts/${postId}/score`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.score).toHaveProperty('totalScore');
      expect(response.body.score.totalScore).toBeGreaterThanOrEqual(0);
      expect(response.body.score.totalScore).toBeLessThanOrEqual(100);
      expect(response.body.score).toHaveProperty('rating');
    });

    test('should analyze best time to post', async () => {
      const response = await request(app)
        .post('/api/social-media/content/analyze/best-time')
        .send({
          accountId: testAccountId,
          platform: 'instagram'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toHaveProperty('bestHours');
      expect(response.body.analysis).toHaveProperty('bestDays');
    });

    test('should get top performing content', async () => {
      const response = await request(app)
        .get('/api/social-media/content/top-performing')
        .query({
          accountId: testAccountId,
          metric: 'engagementRate',
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.content)).toBe(true);
    });

    test('should analyze content type performance', async () => {
      const response = await request(app)
        .post('/api/social-media/content/analyze/type-performance')
        .send({ accountId: testAccountId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toHaveProperty('byType');
    });
  });

  // ========================================================================
  // AUDIENCE ANALYTICS TESTS (6 tests)
  // ========================================================================
  
  describe('Audience Analytics Engine', () => {
    const testAccountId = 1;

    test('should create audience profile', async () => {
      const response = await request(app)
        .post('/api/social-media/audience/profiles')
        .send({
          accountId: testAccountId,
          totalFollowers: 125000,
          activeFollowers: 45000,
          verifiedFollowers: 2500
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile).toHaveProperty('qualityScore');
      expect(response.body.profile.qualityScore).toBeGreaterThanOrEqual(0);
      expect(response.body.profile.qualityScore).toBeLessThanOrEqual(100);
    });

    test('should analyze demographics', async () => {
      const response = await request(app)
        .post('/api/social-media/audience/demographics')
        .send({
          accountId: testAccountId,
          ageGroups: { '25-34': 42, '18-24': 35, '35-44': 15 },
          genderSplit: { male: 48, female: 51, other: 1 },
          topCountries: [{ country: 'US', code: 'US', percentage: 65 }]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.demographic).toHaveProperty('ageGroups');
      expect(response.body.demographic).toHaveProperty('insights');
    });

    test('should analyze audience interests', async () => {
      const response = await request(app)
        .post('/api/social-media/audience/interests')
        .send({
          accountId: testAccountId,
          interests: [
            { category: 'Technology', percentage: 35, engagement: 'high' },
            { category: 'Fashion', percentage: 28, engagement: 'medium' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toHaveProperty('interests');
      expect(response.body.analysis).toHaveProperty('recommendations');
    });

    test('should track behavior patterns', async () => {
      const response = await request(app)
        .post('/api/social-media/audience/behavior')
        .send({
          accountId: testAccountId,
          activeHours: { '18-21': 45, '21-24': 32, '9-12': 18 },
          activeDays: { monday: 12, tuesday: 15, wednesday: 18 }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pattern).toHaveProperty('activeHours');
      expect(response.body.pattern).toHaveProperty('insights');
    });

    test('should segment audience by growth', async () => {
      const response = await request(app)
        .post('/api/social-media/audience/segments/growth')
        .send({
          accountId: testAccountId,
          newFollowers: 5200,
          churnedFollowers: 1100,
          consistentEngagers: 8500
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.segment).toHaveProperty('newFollowers');
      expect(response.body.segment).toHaveProperty('insights');
    });

    test('should compare audience segments', async () => {
      const response = await request(app)
        .post('/api/social-media/audience/segments/compare')
        .send({
          accountId1: testAccountId,
          accountId2: testAccountId + 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comparison).toHaveProperty('differences');
    });
  });

  // ========================================================================
  // ENGAGEMENT OPTIMIZATION TESTS (6 tests)
  // ========================================================================
  
  describe('Engagement Optimization Engine', () => {
    let strategyId, tacticId, testId;
    const testAccountId = 1;

    test('should create engagement strategy', async () => {
      const response = await request(app)
        .post('/api/social-media/engagement/strategies')
        .send({
          accountId: testAccountId,
          name: 'Q1 Engagement Boost',
          objectives: ['increase_comments', 'increase_shares'],
          tactics: [
            { type: 'ask_questions', frequency: 'daily', priority: 'high' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.strategy).toHaveProperty('id');
      expect(response.body.strategy.status).toBe('active');
      strategyId = response.body.strategy.id;
    });

    test('should create response tactic', async () => {
      const response = await request(app)
        .post('/api/social-media/engagement/tactics')
        .send({
          accountId: testAccountId,
          triggerType: 'new_comment',
          responseTemplate: 'Thanks for your comment, {{name}}! 😊',
          priority: 'high',
          autoRespond: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tactic).toHaveProperty('id');
      expect(response.body.tactic.triggerType).toBe('new_comment');
      tacticId = response.body.tactic.id;
    });

    test('should execute response tactic', async () => {
      const response = await request(app)
        .post(`/api/social-media/engagement/tactics/${tacticId}/execute`)
        .send({
          trigger: 'Love this product!',
          userName: 'JohnDoe'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.execution).toHaveProperty('response');
      expect(response.body.execution.response).toContain('JohnDoe');
    });

    test('should create A/B test', async () => {
      const response = await request(app)
        .post('/api/social-media/engagement/ab-tests')
        .send({
          accountId: testAccountId,
          hypothesis: 'Emojis increase engagement',
          variants: {
            A: { name: 'Without Emojis', configuration: { useEmojis: false } },
            B: { name: 'With Emojis', configuration: { useEmojis: true } }
          },
          metric: 'engagement_rate',
          duration: 7
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.test).toHaveProperty('id');
      expect(response.body.test.status).toBe('draft');
      testId = response.body.test.id;
    });

    test('should start A/B test', async () => {
      const response = await request(app)
        .post(`/api/social-media/engagement/ab-tests/${testId}/start`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.test.status).toBe('running');
    });

    test('should track community metrics', async () => {
      const response = await request(app)
        .post('/api/social-media/engagement/community/metrics')
        .send({
          accountId: testAccountId,
          activeMembers: 45000,
          contentCreators: 5500,
          advocates: 1200,
          averageEngagement: 3500
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toHaveProperty('communityHealth');
      expect(response.body.metrics.communityHealth).toBeGreaterThanOrEqual(0);
      expect(response.body.metrics.communityHealth).toBeLessThanOrEqual(100);
    });
  });

  // ========================================================================
  // HASHTAG & TREND TESTS (6 tests)
  // ========================================================================
  
  describe('Hashtag & Trend Engine', () => {
    let hashtagId;
    const testAccountId = 1;

    test('should track hashtag', async () => {
      const response = await request(app)
        .post('/api/social-media/hashtags')
        .send({
          accountId: testAccountId,
          tag: 'awesome',
          category: 'branded',
          isCustom: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.hashtag).toHaveProperty('id');
      expect(response.body.hashtag.tag).toBe('awesome');
      hashtagId = response.body.hashtag.id;
    });

    test('should update hashtag performance', async () => {
      const response = await request(app)
        .put(`/api/social-media/hashtags/${hashtagId}/performance`)
        .send({
          postId: 1,
          reach: 15000,
          engagement: 850,
          impressions: 18000
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.performance).toHaveProperty('performanceScore');
    });

    test('should discover trending topics', async () => {
      const response = await request(app)
        .post('/api/social-media/hashtags/discover')
        .send({
          accountId: testAccountId,
          category: 'technology',
          minVolume: 10000
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.discovery).toHaveProperty('trending');
      expect(Array.isArray(response.body.discovery.trending)).toBe(true);
    });

    test('should analyze trend', async () => {
      const response = await request(app)
        .post('/api/social-media/hashtags/trends/analyze')
        .send({
          accountId: testAccountId,
          keyword: 'AI',
          platform: 'twitter'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.trend) .toHaveProperty('timeline');
      expect(response.body.trend).toHaveProperty('sentiment');
    });

    test('should suggest hashtags', async () => {
      const response = await request(app)
        .post('/api/social-media/hashtags/suggest')
        .send({
          accountId: testAccountId,
          contentText: 'Check out our new AI-powered product launch! Amazing technology.',
          targetReach: 'medium'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.suggestion).toHaveProperty('suggestions');
      expect(response.body.suggestion).toHaveProperty('recommendedMix');
      expect(response.body.suggestion.recommendedMix.length).toBeLessThanOrEqual(10);
    });

    test('should get hashtag leaderboard', async () => {
      const response = await request(app)
        .get('/api/social-media/hashtags/leaderboard')
        .query({
          accountId: testAccountId,
          sortBy: 'performanceScore',
          limit: 20
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.leaderboard)).toBe(true);
    });
  });

  // ========================================================================
  // PUBLISHING & SCHEDULING TESTS (6 tests)
  // ========================================================================
  
  describe('Publishing & Scheduling Engine', () => {
    let scheduledPostId, queueId;
    const testAccountId = 1;

    test('should schedule post', async () => {
      const response = await request(app)
        .post('/api/social-media/publishing/schedule')
        .send({
          accountId: testAccountId,
          platform: 'instagram',
          content: {
            text: 'Scheduled post test',
            mediaUrls: ['https://example.com/image.jpg']
          },
          scheduledFor: new Date(Date.now() + 86400000).toISOString(),
          postType: 'feed'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.post).toHaveProperty('id');
      expect(response.body.post.status).toBe('scheduled');
      scheduledPostId = response.body.post.id;
    });

    test('should cancel scheduled post', async () => {
      const response = await request(app)
        .delete(`/api/social-media/publishing/schedule/${scheduledPostId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.post.status).toBe('cancelled');
    });

    test('should publish scheduled post', async () => {
      // First schedule a new post
      const scheduleResponse = await request(app)
        .post('/api/social-media/publishing/schedule')
        .send({
          accountId: testAccountId,
          platform: 'instagram',
          content: { text: 'Test post' },
          scheduledFor: new Date().toISOString(),
          postType: 'feed'
        });

      const postId = scheduleResponse.body.post.id;

      const response = await request(app)
        .post(`/api/social-media/publishing/schedule/${postId}/publish`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(['published', 'failed']).toContain(response.body.post.status);
    });

    test('should create content queue', async () => {
      const response = await request(app)
        .post('/api/social-media/publishing/queues')
        .send({
          accountId: testAccountId,
          name: 'Daily Posts Queue',
          platforms: ['instagram', 'facebook'],
          autoPost: true,
          schedule: {
            frequency: 'daily',
            times: ['09:00', '15:00', '18:00'],
            timezone: 'America/New_York'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.queue).toHaveProperty('id');
      expect(response.body.queue.isActive).toBe(true);
      queueId = response.body.queue.id;
    });

    test('should add to queue', async () => {
      const response = await request(app)
        .post(`/api/social-media/publishing/queues/${queueId}/posts`)
        .send({
          content: { text: 'Queued post content' },
          mediaUrls: ['https://example.com/image.jpg'],
          postType: 'feed',
          priority: 'normal'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.post).toHaveProperty('id');
      expect(response.body.post.status).toBe('queued');
    });

    test('should get calendar view', async () => {
      const response = await request(app)
        .get('/api/social-media/publishing/calendar')
        .query({
          accountId: testAccountId,
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.calendar).toHaveProperty('eventsByDate');
    });
  });

  // ========================================================================
  // CAMPAIGN ANALYTICS TESTS (6 tests)
  // ========================================================================
  
  describe('Campaign Analytics Engine', () => {
    let campaignId;
    const testAccountId = 1;

    test('should create campaign', async () => {
      const response = await request(app)
        .post('/api/social-media/campaigns')
        .send({
          accountId: testAccountId,
          name: 'Q1 Product Launch',
          type: 'awareness',
          budget: {
            total: 5000,
            currency: 'USD',
            dailyLimit: 200
          },
          schedule: {
            startDate: '2024-01-01',
            endDate: '2024-03-31'
          },
          platforms: ['instagram', 'facebook']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.campaign).toHaveProperty('id');
      expect(response.body.campaign.status).toBe('draft');
      campaignId = response.body.campaign.id;
    });

    test('should launch campaign', async () => {
      const response = await request(app)
        .post(`/api/social-media/campaigns/${campaignId}/launch`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.campaign.status).toBe('active');
    });

    test('should update campaign metrics', async () => {
      const response = await request(app)
        .put(`/api/social-media/campaigns/${campaignId}/metrics`)
        .send({
          impressions: 50000,
          reach: 35000,
          engagement: 2500,
          clicks: 1200,
          conversions: 85,
          revenue: 4250
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metric).toHaveProperty('CTR');
      expect(response.body.metric).toHaveProperty('conversionRate');
    });

    test('should set campaign goal', async () => {
      const response = await request(app)
        .post(`/api/social-media/campaigns/${campaignId}/goals`)
        .send({
          metric: 'conversions',
          target: 500
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.goal).toHaveProperty('progress');
      expect(response.body.goal).toHaveProperty('status');
    });

    test('should track attribution', async () => {
      const response = await request(app)
        .post(`/api/social-media/campaigns/${campaignId}/attribution`)
        .send({
          conversionId: 'conv_123',
          touchpoints: [
            { platform: 'instagram', type: 'impression', timestamp: '2024-01-15T10:00:00Z', value: 50 },
            { platform: 'facebook', type: 'click', timestamp: '2024-01-16T14:00:00Z', value: 50 }
          ],
          attributionModel: 'linear'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.attribution).toHaveProperty('credits');
      expect(response.body.attribution.totalValue).toBe(100);
    });

    test('should analyze ROI', async () => {
      const response = await request(app)
        .post(`/api/social-media/campaigns/${campaignId}/roi`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toHaveProperty('investment');
      expect(response.body.analysis).toHaveProperty('returns');
      expect(response.body.analysis.returns).toHaveProperty('ROI');
      expect(response.body.analysis.returns).toHaveProperty('ROAS');
    });
  });

  // ========================================================================
  // COMPETITOR BENCHMARKING TESTS (6 tests)
  // ========================================================================
  
  describe('Competitor Benchmarking Engine', () => {
    let competitorId;
    const testAccountId = 1;

    test('should add competitor', async () => {
      const response = await request(app)
        .post('/api/social-media/competitors')
        .send({
          accountId: testAccountId,
          name: 'Competitor A',
          handle: '@competitor_a',
          platforms: [
            { platform: 'instagram', handle: '@competitor_a' }
          ],
          industry: 'Ecommerce',
          size: 'medium'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.competitor).toHaveProperty('id');
      expect(response.body.competitor.name).toBe('Competitor A');
      competitorId = response.body.competitor.id;
    });

    test('should track competitor metrics', async () => {
      const response = await request(app)
        .post(`/api/social-media/competitors/${competitorId}/metrics`)
        .send({
          platform: 'instagram',
          followers: 85000,
          following: 1200,
          posts: 450,
          engagement: {
            total: 12000,
            likes: 9000,
            comments: 2000,
            shares: 1000
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metric).toHaveProperty('performanceScore');
      expect(response.body.metric.engagement).toHaveProperty('rate');
    });

    test('should create benchmark', async () => {
      const response = await request(app)
        .post('/api/social-media/competitors/benchmarks')
        .send({
          accountId: testAccountId,
          metric: 'engagementRate',
          yourValue: 4.8,
          competitors: [
            { competitorId: competitorId, value: 3.2 }
          ],
          industryAverage: 3.5,
          industryTop10: 6.2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.benchmark).toHaveProperty('gaps');
      expect(response.body.benchmark).toHaveProperty('status');
      expect(['leading', 'competitive', 'lagging']).toContain(response.body.benchmark.status);
    });

    test('should analyze market position', async () => {
      const response = await request(app)
        .post('/api/social-media/competitors/market-position')
        .send({
          accountId: testAccountId,
          yourMetrics: {
            followers: 125000,
            engagementRate: 4.8,
            growthRate: 3.2,
            contentQuality: 75
          },
          competitors: [
            {
              competitorId: competitorId,
              followers: 85000,
              engagementRate: 3.2,
              growthRate: 2.1,
              contentQuality: 65
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.position).toHaveProperty('quadrant');
      expect(['leader', 'challenger', 'niche_player', 'follower']).toContain(response.body.position.quadrant);
      expect(response.body.position).toHaveProperty('swot');
    });

    test('should generate competitive insights', async () => {
      const response = await request(app)
        .post('/api/social-media/competitors/insights')
        .send({
          accountId: testAccountId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.insight).toHaveProperty('topPerformers');
      expect(response.body.insight).toHaveProperty('trends');
      expect(response.body.insight).toHaveProperty('recommendations');
    });

    test('should get competitor statistics', async () => {
      const response = await request(app)
        .get('/api/social-media/competitors/statistics')
        .query({ accountId: testAccountId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('totalCompetitors');
    });
  });

  // ========================================================================
  // SYSTEM ENDPOINTS TESTS (2 tests)
  // ========================================================================
  
  describe('System Endpoints', () => {
    test('should return health check with all services', async () => {
      const response = await request(app)
        .get('/api/social-media/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('operational');
      expect(response.body.services).toHaveProperty('platformAnalytics');
      expect(response.body.services).toHaveProperty('contentPerformance');
      expect(response.body.services).toHaveProperty('audienceAnalytics');
      expect(response.body.services).toHaveProperty('engagementOptimization');
      expect(response.body.services).toHaveProperty('hashtagTrend');
      expect(response.body.services).toHaveProperty('publishingScheduling');
      expect(response.body.services).toHaveProperty('campaignAnalytics');
      expect(response.body.services).toHaveProperty('competitorBenchmarking');
      expect(response.body.services.platformAnalytics).toBe('up');
    });

    test('should return aggregated statistics from all engines', async () => {
      const response = await request(app)
        .get('/api/social-media/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('platform');
      expect(response.body.statistics).toHaveProperty('content');
      expect(response.body.statistics).toHaveProperty('audience');
      expect(response.body.statistics).toHaveProperty('engagement');
      expect(response.body.statistics).toHaveProperty('hashtags');
      expect(response.body.statistics).toHaveProperty('publishing');
      expect(response.body.statistics).toHaveProperty('campaigns');
      expect(response.body.statistics).toHaveProperty('competitors');
    });
  });

  // ========================================================================
  // E2E JOURNEY TEST (1 test)
  // ========================================================================
  
  describe('E2E Social Media Management Journey', () => {
    test('should complete full social media workflow', async () => {
      // Step 1: Connect platform account
      const accountResponse = await request(app)
        .post('/api/social-media/platform/accounts/connect')
        .send({
          platform: 'instagram',
          handle: '@e2e_test_brand',
          accountType: 'business',
          accessToken: 'e2e_token',
          primaryObjective: 'engagement'
        });
      expect(accountResponse.body.success).toBe(true);
      const accountId = accountResponse.body.account.id;

      // Step 2: Sync platform metrics
      const metricsResponse = await request(app)
        .post(`/api/social-media/platform/accounts/${accountId}/sync`)
        .send({
          period: '30days',
          followers: { total: 50000, gained: 2000, lost: 500 },
          engagement: { total: 15000, likes: 10000, comments: 3000, shares: 2000 }
        });
      expect(metricsResponse.body.success).toBe(true);

      // Step 3: Track content post
      const postResponse = await request(app)
        .post('/api/social-media/content/posts')
        .send({
          accountId,
          platform: 'instagram',
          postType: 'feed',
          content: {
            text: 'E2E test post #awesome',
            mediaType: 'image',
            hashtags: ['awesome']
          }
        });
      expect(postResponse.body.success).toBe(true);
      const postId = postResponse.body.post.id;

      // Step 4: Analyze audience
      const audienceResponse = await request(app)
        .post('/api/social-media/audience/profiles')
        .send({
          accountId,
          totalFollowers: 50000,
          activeFollowers: 20000,
          verifiedFollowers: 500
        });
      expect(audienceResponse.body.success).toBe(true);

      // Step 5: Create engagement strategy
      const strategyResponse = await request(app)
        .post('/api/social-media/engagement/strategies')
        .send({
          accountId,
          name: 'E2E Engagement Test',
          objectives: ['increase_comments'],
          tactics: [{ type: 'ask_questions', frequency: 'daily', priority: 'high' }]
        });
      expect(strategyResponse.body.success).toBe(true);

      // Step 6: Get hashtag suggestions
      const hashtagResponse = await request(app)
        .post('/api/social-media/hashtags/suggest')
        .send({
          accountId,
          contentText: 'E2E test post',
          targetReach: 'medium'
        });
      expect(hashtagResponse.body.success).toBe(true);
      expect(hashtagResponse.body.suggestion.recommendedMix.length).toBeLessThanOrEqual(10);

      // Step 7: Schedule post
      const scheduleResponse = await request(app)
        .post('/api/social-media/publishing/schedule')
        .send({
          accountId,
          platform: 'instagram',
          content: { text: 'Scheduled E2E test' },
          scheduledFor: new Date(Date.now() + 86400000).toISOString(),
          postType: 'feed'
        });
      expect(scheduleResponse.body.success).toBe(true);

      // Step 8: Create campaign
      const campaignResponse = await request(app)
        .post('/api/social-media/campaigns')
        .send({
          accountId,
          name: 'E2E Test Campaign',
          type: 'engagement',
          budget: { total: 1000, currency: 'USD' },
          schedule: { startDate: '2024-01-01', endDate: '2024-01-31' }
        });
      expect(campaignResponse.body.success).toBe(true);
      const campaignId = campaignResponse.body.campaign.id;

      // Step 9: Add competitor
      const competitorResponse = await request(app)
        .post('/api/social-media/competitors')
        .send({
          accountId,
          name: 'E2E Competitor',
          handle: '@competitor_e2e',
          platforms: [{ platform: 'instagram', handle: '@competitor_e2e' }],
          industry: 'Test',
          size: 'small'
        });
      expect(competitorResponse.body.success).toBe(true);

      // Step 10: Verify all statistics
      const statsResponse = await request(app)
        .get('/api/social-media/statistics');
      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.statistics).toHaveProperty('platform');
      expect(statsResponse.body.statistics).toHaveProperty('content');
      expect(statsResponse.body.statistics).toHaveProperty('campaigns');
      expect(statsResponse.body.statistics).toHaveProperty('competitors');

      // E2E journey completed successfully
    });
  });
});
