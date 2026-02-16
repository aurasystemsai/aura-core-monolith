/**
 * Keyword Research Suite V2 - Comprehensive Test Suite
 * 48+ tests covering all 8 engines + E2E journey
 */

const KeywordDiscoveryEngine = require('./keyword-discovery-engine');
const SERPAnalysisEngine = require('./serp-analysis-engine');
const CompetitorResearchEngine = require('./competitor-research-engine');
const SearchIntentEngine = require('./search-intent-engine');
const KeywordClusteringEngine = require('./keyword-clustering-engine');
const OpportunityScoringEngine = require('./opportunity-scoring-engine');
const RankTrackingEngine = require('./rank-tracking-engine');
const ContentGapEngine = require('./content-gap-engine');

describe('Keyword Research Suite V2', () => {
  // ==================== KEYWORD DISCOVERY ENGINE (8 tests) ====================
  describe('Keyword Discovery Engine', () => {
    let engine;

    beforeEach(() => {
      engine = new KeywordDiscoveryEngine();
    });

    test('discoverKeywords returns main, related, question, and long-tail keywords', async () => {
      const result = await engine.discoverKeywords({
        seedKeyword: 'SEO tools',
        country: 'US',
        language: 'en',
        includeRelated: true,
        includeQuestions: true,
        includeLongTail: true,
        maxResults: 100
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('seedKeyword', 'SEO tools');
      expect(result.keywords).toBeInstanceOf(Array);
      expect(result.keywords.length).toBeGreaterThan(0);

      const types = result.keywords.map(k => k.type);
      expect(types).toContain('main');
      expect(types).toContain('related');
      expect(types).toContain('question');
      expect(types).toContain('long-tail');
    });

    test('getSearchVolume returns 12-month data with trend detection', async () => {
      const result = await engine.getSearchVolume('SEO tools', '12months');

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('monthlySearches');
      expect(result.monthlySearches).toHaveLength(12);
      expect(result).toHaveProperty('averageMonthly');
      expect(result.averageMonthly).toBeGreaterThan(0);
      expect(result).toHaveProperty('trend');
      expect(['growing', 'declining', 'stable']).toContain(result.trend);
    });

    test('getKeywordDifficulty scores 0-100 with level categorization', async () => {
      const result = await engine.getKeywordDifficulty('SEO tools');

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('difficulty');
      expect(result.difficulty).toBeGreaterThanOrEqual(0);
      expect(result.difficulty).toBeLessThanOrEqual(100);
      expect(result).toHaveProperty('level');
      expect(['easy', 'medium', 'hard', 'very-hard']).toContain(result.level);
      expect(result).toHaveProperty('timeToRank');
      expect(result.timeToRank).toMatch(/^\d+-\d+ months$/);
    });

    test('getTrends generates historical data with forecast', async () => {
      const result = await engine.getTrends('SEO tools', '5years');

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('period', '5years');
      expect(result).toHaveProperty('data');
      expect(result.data.length).toBe(60); // 60 months for 5 years
      expect(result).toHaveProperty('forecast');
      expect(result.forecast).toBeInstanceOf(Array);
      expect(result.forecast.length).toBeGreaterThan(0);
    });

    test('getRelatedKeywords returns variants with modifiers', async () => {
      const result = await engine.getRelatedKeywords('SEO tools', 50);

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('relatedKeywords');
      expect(result.relatedKeywords).toBeInstanceOf(Array);
      expect(result.relatedKeywords.length).toBeLessThanOrEqual(50);

      const hasModifiers = result.relatedKeywords.some(kw =>
        kw.keyword.includes('best') || kw.keyword.includes('top') || kw.keyword.includes('free')
      );
      expect(hasModifiers).toBe(true);
    });

    test('getQuestionKeywords groups by type', async () => {
      const result = await engine.getQuestionKeywords('SEO', 30);

      expect(result).toHaveProperty('keyword', 'SEO');
      expect(result).toHaveProperty('questionKeywords');
      expect(result.questionKeywords).toBeInstanceOf(Array);

      const types = result.questionKeywords.map(q => q.type);
      expect(types.some(t => ['what', 'how', 'why', 'where', 'when', 'who', 'which'].includes(t))).toBe(true);
    });

    test('getLongTailKeywords filters by word count', async () => {
      const result = await engine.getLongTailKeywords('SEO', 4, 40);

      expect(result).toHaveProperty('keyword', 'SEO');
      expect(result).toHaveProperty('longTailKeywords');
      expect(result.longTailKeywords).toBeInstanceOf(Array);

      result.longTailKeywords.forEach(kw => {
        const wordCount = kw.keyword.split(' ').length;
        expect(wordCount).toBeGreaterThanOrEqual(4);
      });

      expect(result).toHaveProperty('avgWordCount');
      expect(result.avgWordCount).toBeGreaterThanOrEqual(4);
    });

    test('bulkAnalyze processes multiple keywords', async () => {
      const keywords = ['SEO tools', 'keyword research', 'backlink checker'];
      const result = await engine.bulkAnalyze(keywords, true, true, true);

      expect(result).toHaveProperty('keywords');
      expect(result.keywords).toHaveLength(3);

      result.keywords.forEach(kw => {
        expect(kw).toHaveProperty('keyword');
        expect(kw).toHaveProperty('volume');
        expect(kw).toHaveProperty('difficulty');
        expect(kw).toHaveProperty('trends');
      });
    });
  });

  // ==================== SERP ANALYSIS ENGINE (6 tests) ====================
  describe('SERP Analysis Engine', () => {
    let engine;

    beforeEach(() => {
      engine = new SERPAnalysisEngine();
    });

    test('analyzeSERP returns top N with features', async () => {
      const result = await engine.analyzeSERP('SEO tools', { location: 'US', device: 'desktop', depth: 20 });

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('results');
      expect(result.results.length).toBeLessThanOrEqual(20);
      expect(result).toHaveProperty('features');
      expect(result.features).toBeInstanceOf(Array);

      result.results.forEach(r => {
        expect(r).toHaveProperty('position');
        expect(r).toHaveProperty('url');
        expect(r).toHaveProperty('domain');
        expect(r).toHaveProperty('title');
      });
    });

    test('identifyContentGaps finds missing topics, questions, and formats', async () => {
      const result = await engine.identifyContentGaps('SEO tools');

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('missingTopics');
      expect(result).toHaveProperty('underservedQuestions');
      expect(result).toHaveProperty('missingFormats');
      expect(result).toHaveProperty('opportunityScore');
      expect(result.opportunityScore).toBeGreaterThanOrEqual(0);
    });

    test('analyzeSERPFeatures detects 8 feature types', async () => {
      const result = await engine.analyzeSERPFeatures('SEO tools');

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('features');

      const featureTypes = result.features.map(f => f.type);
      const validTypes = [
        'featured-snippet', 'people-also-ask', 'local-pack', 'knowledge-panel',
        'image-pack', 'video-carousel', 'shopping-results', 'top-stories'
      ];

      featureTypes.forEach(type => {
        expect(validTypes).toContain(type);
      });
    });

    test('compareDevices shows desktop vs mobile differences', async () => {
      const result = await engine.compareDevices('SEO tools');

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('desktop');
      expect(result).toHaveProperty('mobile');
      expect(result).toHaveProperty('differences');
    });

    test('trackSERPChanges identifies position changes', async () => {
      // First analysis
      const first = await engine.analyzeSERP('SEO tools');

      // Second analysis
      const result = await engine.trackSERPChanges('SEO tools', first.id);

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('changes');
      expect(result.changes).toHaveProperty('newResults');
      expect(result.changes).toHaveProperty('droppedResults');
      expect(result.changes).toHaveProperty('positionChanges');
    });

    test('getFeaturedSnippetOpportunities scores correctly', async () => {
      const result = await engine.getFeaturedSnippetOpportunities('SEO tools');

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('hasSnippet');
      expect(result).toHaveProperty('opportunityScore');
      expect(result.opportunityScore).toBeGreaterThanOrEqual(0);
      expect(result.opportunityScore).toBeLessThanOrEqual(100);
    });
  });

  // ==================== COMPETITOR RESEARCH ENGINE (7 tests) ====================
  describe('Competitor Research Engine', () => {
    let engine;

    beforeEach(() => {
      engine = new CompetitorResearchEngine();
    });

    test('addCompetitor creates with metrics', async () => {
      const result = await engine.addCompetitor({
        domain: 'moz.com',
        name: 'Moz',
        industry: 'SEO',
        notes: 'Major SEO platform'
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('domain', 'moz.com');
      expect(result).toHaveProperty('metrics');
      expect(result.metrics).toHaveProperty('estimatedTraffic');
      expect(result.metrics).toHaveProperty('domainAuthority');
    });

    test('analyzeCompetitorKeywords categorizes correctly', async () => {
      const competitor = await engine.addCompetitor({ domain: 'moz.com', name: 'Moz', industry: 'SEO' });
      const result = await engine.analyzeCompetitorKeywords(competitor.id, { limit: 100 });

      expect(result).toHaveProperty('competitorId', competitor.id);
      expect(result).toHaveProperty('keywords');
      expect(result.keywords.length).toBeLessThanOrEqual(100);
      expect(result).toHaveProperty('categories');

      const validCategories = ['branded', 'product', 'informational', 'commercial', 'navigational'];
      Object.keys(result.categories).forEach(cat => {
        expect(validCategories).toContain(cat);
      });
    });

    test('findKeywordOverlap calculates percentage', async () => {
      const comp1 = await engine.addCompetitor({ domain: 'moz.com', name: 'Moz', industry: 'SEO' });
      const comp2 = await engine.addCompetitor({ domain: 'semrush.com', name: 'SEMrush', industry: 'SEO' });

      const result = await engine.findKeywordOverlap([comp1.id, comp2.id]);

      expect(result).toHaveProperty('competitorIds');
      expect(result).toHaveProperty('commonKeywords');
      expect(result).toHaveProperty('uniqueKeywords');
      expect(result).toHaveProperty('overlapPercentage');
      expect(result.overlapPercentage).toBeGreaterThanOrEqual(0);
      expect(result.overlapPercentage).toBeLessThanOrEqual(100);
    });

    test('identifyGaps finds keyword gaps with scores', async () => {
      const comp1 = await engine.addCompetitor({ domain: 'moz.com', name: 'Moz', industry: 'SEO' });
      const result = await engine.identifyGaps('mysite.com', [comp1.id]);

      expect(result).toHaveProperty('yourDomain', 'mysite.com');
      expect(result).toHaveProperty('keywordGaps');
      expect(result).toHaveProperty('contentThemes');

      result.keywordGaps.forEach(gap => {
        expect(gap).toHaveProperty('keyword');
        expect(gap).toHaveProperty('volume');
        expect(gap).toHaveProperty('difficulty');
        expect(gap).toHaveProperty('opportunityScore');
      });
    });

    test('compareDomainAuthority ranks competitors', async () => {
      const comp1 = await engine.addCompetitor({ domain: 'moz.com', name: 'Moz', industry: 'SEO' });
      const comp2 = await engine.addCompetitor({ domain: 'semrush.com', name: 'SEMrush', industry: 'SEO' });

      const result = await engine.compareDomainAuthority([comp1.id, comp2.id]);

      expect(result).toHaveProperty('competitors');
      expect(result.competitors).toHaveLength(2);
      expect(result).toHaveProperty('highest');
      expect(result).toHaveProperty('lowest');
      expect(result).toHaveProperty('average');
    });

    test('analyzeContentStrategy returns publishing data', async () => {
      const competitor = await engine.addCompetitor({ domain: 'moz.com', name: 'Moz', industry: 'SEO' });
      const result = await engine.analyzeContentStrategy(competitor.id);

      expect(result).toHaveProperty('competitorId', competitor.id);
      expect(result).toHaveProperty('contentTypes');
      expect(result).toHaveProperty('publishingFrequency');
      expect(result).toHaveProperty('topicClusters');
      expect(result).toHaveProperty('avgWordCount');
      expect(result.avgWordCount).toBeGreaterThan(0);
    });

    test('getCompetitiveReport generates comprehensive report', async () => {
      const comp1 = await engine.addCompetitor({ domain: 'moz.com', name: 'Moz', industry: 'SEO' });
      const result = await engine.getCompetitiveReport([comp1.id], 'mysite.com');

      expect(result).toHaveProperty('yourDomain', 'mysite.com');
      expect(result).toHaveProperty('competitors');
      expect(result).toHaveProperty('keywordGaps');
      expect(result).toHaveProperty('contentGaps');
      expect(result).toHaveProperty('recommendations');
    });
  });

  // ==================== SEARCH INTENT ENGINE (6 tests) ====================
  describe('Search Intent Engine', () => {
    let engine;

    beforeEach(() => {
      engine = new SearchIntentEngine();
    });

    test('classifyIntent returns primary intent with confidence', async () => {
      const result = await engine.classifyIntent('how to do SEO');

      expect(result).toHaveProperty('keyword', 'how to do SEO');
      expect(result).toHaveProperty('primaryIntent');
      expect(['informational', 'navigational', 'commercial', 'transactional']).toContain(result.primaryIntent);
      expect(result).toHaveProperty('confidence');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    test('bulkClassify calculates distribution percentages', async () => {
      const keywords = [
        'how to do SEO',
        'buy SEO tools',
        'best SEO software',
        'SEMrush login'
      ];
      const result = await engine.bulkClassify(keywords);

      expect(result).toHaveProperty('keywords');
      expect(result.keywords).toHaveLength(4);
      expect(result).toHaveProperty('byIntent');
      expect(result).toHaveProperty('distribution');

      const totalPercentage = Object.values(result.distribution).reduce((sum, val) => sum + val, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });

    test('getContentRecommendations provides intent-specific structure', async () => {
      const result = await engine.getContentRecommendations('how to do SEO', 'informational');

      expect(result).toHaveProperty('keyword', 'how to do SEO');
      expect(result).toHaveProperty('intent', 'informational');
      expect(result).toHaveProperty('contentType');
      expect(result).toHaveProperty('structure');
      expect(result.structure).toBeInstanceOf(Array);
      expect(result).toHaveProperty('targetWordCount');
      expect(result.targetWordCount).toBeGreaterThan(0);
    });

    test('mapToBuyerJourney assigns funnel stages', async () => {
      const keywords = [
        'what is SEO',
        'best SEO tools',
        'buy SEMrush subscription'
      ];
      const result = await engine.mapToBuyerJourney(keywords);

      expect(result).toHaveProperty('mappedKeywords');
      expect(result.mappedKeywords).toHaveLength(3);
      expect(result).toHaveProperty('funnelDistribution');

      result.mappedKeywords.forEach(kw => {
        expect(kw).toHaveProperty('funnelStage');
        expect(['awareness', 'consideration', 'decision']).toContain(kw.funnelStage);
      });
    });

    test('analyzeIntentDistribution checks balance', async () => {
      const keywords = Array(100).fill(null).map((_, i) => `keyword ${i}`);
      const result = await engine.analyzeIntentDistribution(keywords);

      expect(result).toHaveProperty('distribution');
      expect(result).toHaveProperty('isBalanced');
      expect(result).toHaveProperty('recommendations');
    });

    test('scoreIntentMatch calculates alignment score', async () => {
      const result = await engine.scoreIntentMatch('how to do SEO', 'blog-post');

      expect(result).toHaveProperty('keyword', 'how to do SEO');
      expect(result).toHaveProperty('contentType', 'blog-post');
      expect(result).toHaveProperty('matchScore');
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(100);
    });
  });

  // ==================== KEYWORD CLUSTERING ENGINE (6 tests) ====================
  describe('Keyword Clustering Engine', () => {
    let engine;
    const sampleKeywords = Array(30).fill(null).map((_, i) => `keyword ${i}`);

    beforeEach(() => {
      engine = new KeywordClusteringEngine();
    });

    test('clusterKeywords groups by method with silhouette score', async () => {
      const result = await engine.clusterKeywords(sampleKeywords, 'semantic', 3, 20);

      expect(result).toHaveProperty('method', 'semantic');
      expect(result).toHaveProperty('clusters');
      expect(result.clusters).toBeInstanceOf(Array);
      expect(result).toHaveProperty('silhouetteScore');
      expect(result.silhouetteScore).toBeGreaterThanOrEqual(0);
      expect(result.silhouetteScore).toBeLessThanOrEqual(1);
    });

    test('buildContentSilo creates pillar + supporting structure', async () => {
      const clustered = await engine.clusterKeywords(sampleKeywords, 'semantic');
      const clusterIds = clustered.clusters.map(c => c.id);

      const result = await engine.buildContentSilo(clusterIds);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('pillarPages');
      expect(result.pillarPages).toBeInstanceOf(Array);
      expect(result).toHaveProperty('supportingContent');
      expect(result.supportingContent).toBeInstanceOf(Array);
      expect(result).toHaveProperty('internalLinks');

      result.pillarPages.forEach(page => {
        expect(page).toHaveProperty('targetWordCount');
        expect(page.targetWordCount).toBeGreaterThanOrEqual(3000);
      });
    });

    test('findOptimalClusters recommends best K', async () => {
      const result = await engine.findOptimalClusters(sampleKeywords, 15);

      expect(result).toHaveProperty('optimalK');
      expect(result.optimalK).toBeGreaterThanOrEqual(3);
      expect(result.optimalK).toBeLessThanOrEqual(15);
      expect(result).toHaveProperty('evaluations');
    });

    test('analyzeClusterQuality returns cohesion, separation, size, coverage', async () => {
      const clustered = await engine.clusterKeywords(sampleKeywords, 'semantic');
      const clusterId = clustered.clusters[0].id;

      const result = await engine.analyzeClusterQuality(clusterId);

      expect(result).toHaveProperty('clusterId', clusterId);
      expect(result).toHaveProperty('cohesion');
      expect(result).toHaveProperty('separation');
      expect(result).toHaveProperty('sizeBalance');
      expect(result).toHaveProperty('coverage');
      expect(result).toHaveProperty('overallQuality');
    });

    test('suggestClusterNames provides options', async () => {
      const clustered = await engine.clusterKeywords(sampleKeywords, 'semantic');
      const cluster = clustered.clusters[0];

      const result = await engine.suggestClusterNames(cluster);

      expect(result).toHaveProperty('clusterId', cluster.id);
      expect(result).toHaveProperty('suggestions');
      expect(result.suggestions).toHaveLength(4);

      result.suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('name');
        expect(suggestion).toHaveProperty('score');
      });
    });

    test('exportToContentCalendar schedules timeline', async () => {
      const clustered = await engine.clusterKeywords(sampleKeywords, 'semantic');
      const clusterIds = clustered.clusters.map(c => c.id);
      const silo = await engine.buildContentSilo(clusterIds);

      const result = await engine.exportToContentCalendar(silo.id, new Date(), 'weekly');

      expect(result).toHaveProperty('siloId', silo.id);
      expect(result).toHaveProperty('timeline');
      expect(result.timeline).toBeInstanceOf(Array);
      expect(result).toHaveProperty('estimatedCompletion');
    });
  });

  // ==================== OPPORTUNITY SCORING ENGINE (6 tests) ====================
  describe('Opportunity Scoring Engine', () => {
    let engine;

    beforeEach(() => {
      engine = new OpportunityScoringEngine();
    });

    test('scoreKeyword calculates weighted score with components', async () => {
      const metrics = {
        volume: 5000,
        difficulty: 45,
        cpc: 3.50,
        trend: 'growing'
      };
      const context = {
        industry: 'SEO',
        targetAudience: 'marketers',
        businessGoals: ['lead-generation']
      };

      const result = await engine.scoreKeyword('SEO tools', metrics, context);

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('components');
      expect(result.components).toHaveProperty('volume');
      expect(result.components).toHaveProperty('difficulty');
      expect(result.components).toHaveProperty('relevance');
      expect(result).toHaveProperty('overallScore');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    test('scoreAndRank categorizes into quickWins, longTerm, avoid', async () => {
      const keywords = Array(20).fill(null).map((_, i) => ({
        keyword: `keyword ${i}`,
        metrics: {
          volume: Math.random() * 10000,
          difficulty: Math.random() * 100,
          cpc: Math.random() * 10,
          trend: 'stable'
        }
      }));

      const result = await engine.scoreAndRank(keywords);

      expect(result).toHaveProperty('ranked');
      expect(result).toHaveProperty('quickWins');
      expect(result).toHaveProperty('longTerm');
      expect(result).toHaveProperty('avoid');
    });

    test('findQuickWins filters by criteria with estimates', async () => {
      const keywords = Array(50).fill(null).map((_, i) => ({
        keyword: `keyword ${i}`,
        metrics: {
          volume: 500 + Math.random() * 5000,
          difficulty: Math.random() * 60,
          cpc: Math.random() * 8,
          trend: 'growing'
        }
      }));

      const result = await engine.findQuickWins(keywords, 500, 40, 70);

      expect(result).toHaveProperty('quickWins');
      expect(result).toHaveProperty('estimatedEffort');
      expect(result).toHaveProperty('estimatedReturn');
    });

    test('prioritizeForCalendar distributes across months', async () => {
      const keywords = Array(30).fill(null).map((_, i) => ({
        keyword: `keyword ${i}`,
        metrics: {
          volume: Math.random() * 10000,
          difficulty: Math.random() * 100,
          cpc: Math.random() * 10,
          trend: 'stable'
        }
      }));

      const result = await engine.prioritizeForCalendar(keywords, 10, 6, ['traffic', 'conversions']);

      expect(result).toHaveProperty('calendar');
      expect(result.calendar).toHaveLength(6); // 6 months
      expect(result).toHaveProperty('summary');
    });

    test('scoreCompetitiveOpportunity evaluates gap, weakness, demand', async () => {
      const competitorData = {
        yourRank: 15,
        competitorRank: 5,
        competitorContentQuality: 75,
        volume: 8000,
        difficulty: 50
      };

      const result = await engine.scoreCompetitiveOpportunity(competitorData);

      expect(result).toHaveProperty('components');
      expect(result.components).toHaveProperty('gapSize');
      expect(result.components).toHaveProperty('competitorWeakness');
      expect(result.components).toHaveProperty('marketDemand');
      expect(result).toHaveProperty('competitiveScore');
    });

    test('getScoringInsights returns distribution and correlations', async () => {
      const scoredKeywords = Array(50).fill(null).map((_, i) => ({
        keyword: `keyword ${i}`,
        overallScore: Math.random() * 100,
        roi: Math.random() * 200 - 50,
        components: {
          volume: Math.random() * 100,
          difficulty: Math.random() * 100
        }
      }));

      const result = await engine.getScoringInsights(scoredKeywords);

      expect(result).toHaveProperty('distribution');
      expect(result).toHaveProperty('averages');
      expect(result).toHaveProperty('correlations');
      expect(result).toHaveProperty('recommendations');
    });
  });

  // ==================== RANK TRACKING ENGINE (6 tests) ====================
  describe('Rank Tracking Engine', () => {
    let engine;

    beforeEach(() => {
      engine = new RankTrackingEngine();
    });

    test('startTracking creates with frequency', async () => {
      const keywords = ['SEO tools', 'keyword research', 'backlink checker'];
      const result = await engine.startTracking(keywords, 'mysite.com', 'US', 'desktop', 'daily');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('domain', 'mysite.com');
      expect(result).toHaveProperty('frequency', 'daily');
      expect(result).toHaveProperty('keywords');
      expect(Object.keys(result.keywords)).toHaveLength(3);
    });

    test('takeSnapshot records positions and updates stats', async () => {
      const tracking = await engine.startTracking(['SEO tools'], 'mysite.com', 'US', 'desktop', 'daily');
      const result = await engine.takeSnapshot(tracking.id);

      expect(result).toHaveProperty('trackingId', tracking.id);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('snapshots');
    });

    test('getRankingHistory shows trend over time', async () => {
      const tracking = await engine.startTracking(['SEO tools'], 'mysite.com', 'US', 'desktop', 'daily');
      const result = await engine.getRankingHistory(tracking.id, 'SEO tools', null, null, 'daily');

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('statistics');
      expect(result.statistics).toHaveProperty('trend');
    });

    test('getRankingAlerts detects drops, rises, volatility', async () => {
      const tracking = await engine.startTracking(['SEO tools'], 'mysite.com', 'US', 'desktop', 'daily');
      const result = await engine.getRankingAlerts(tracking.id, 5, 5, 7);

      expect(result).toHaveProperty('trackingId', tracking.id);
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('summary');
    });

    test('forecastRankings predicts with linear regression', async () => {
      const tracking = await engine.startTracking(['SEO tools'], 'mysite.com', 'US', 'desktop', 'daily');
      const result = await engine.forecastRankings(tracking.id, 'SEO tools', 30);

      expect(result).toHaveProperty('keyword', 'SEO tools');
      expect(result).toHaveProperty('predictions');
      expect(result.predictions).toHaveLength(30);
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('overallConfidence');
    });

    test('compareWithCompetitors categorizes winning, competitive, losing', async () => {
      const tracking = await engine.startTracking(['SEO tools'], 'mysite.com', 'US', 'desktop', 'daily');
      const competitorDomains = ['moz.com', 'semrush.com'];

      const result = await engine.compareWithCompetitors(tracking.id, competitorDomains);

      expect(result).toHaveProperty('trackingId', tracking.id);
      expect(result).toHaveProperty('comparisons');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('winning');
      expect(result.summary).toHaveProperty('competitive');
      expect(result.summary).toHaveProperty('losing');
    });
  });

  // ==================== CONTENT GAP ANALYSIS ENGINE (7 tests) ====================
  describe('Content Gap Analysis Engine', () => {
    let engine;

    beforeEach(() => {
      engine = new ContentGapAnalysisEngine();
    });

    test('analyzeGaps finds keyword, topic, format, intent gaps', async () => {
      const result = await engine.analyzeGaps(
        'mysite.com',
        ['moz.com', 'semrush.com'],
        100,
        70
      );

      expect(result).toHaveProperty('yourDomain', 'mysite.com');
      expect(result).toHaveProperty('keywordGaps');
      expect(result).toHaveProperty('topicGaps');
      expect(result).toHaveProperty('formatGaps');
      expect(result).toHaveProperty('intentGaps');
      expect(result).toHaveProperty('opportunities');
    });

    test('findLowCompetitionOpportunities filters by difficulty', async () => {
      const result = await engine.findLowCompetitionOpportunities(40, 500);

      expect(result).toHaveProperty('opportunities');
      result.opportunities.forEach(opp => {
        expect(opp.difficulty).toBeLessThanOrEqual(40);
        expect(opp.volume).toBeGreaterThanOrEqual(500);
      });
    });

    test('analyzeTopicCoverage scores industry coverage', async () => {
      const result = await engine.analyzeTopicCoverage('SEO', 'mysite.com', ['moz.com']);

      expect(result).toHaveProperty('industry', 'SEO');
      expect(result).toHaveProperty('topicClusters');
      expect(result).toHaveProperty('missingClusters');
      expect(result).toHaveProperty('coverageScore');
      expect(result.coverageScore).toBeGreaterThanOrEqual(0);
      expect(result.coverageScore).toBeLessThanOrEqual(100);
    });

    test('identifySeasonalGaps groups by season', async () => {
      const keywords = Array(50).fill(null).map((_, i) => `keyword ${i}`);
      const result = await engine.identifySeasonalGaps(keywords, 12);

      expect(result).toHaveProperty('timeframe', 12);
      expect(result).toHaveProperty('gapsBySeason');
      expect(result.gapsBySeason).toHaveProperty('spring');
      expect(result.gapsBySeason).toHaveProperty('summer');
      expect(result.gapsBySeason).toHaveProperty('fall');
      expect(result.gapsBySeason).toHaveProperty('winter');
    });

    test('analyzeSERPFeatureGaps counts features', async () => {
      const keywords = ['SEO tools', 'keyword research'];
      const result = await engine.analyzeSERPFeatureGaps(keywords, 'mysite.com', ['moz.com']);

      expect(result).toHaveProperty('featureGaps');
      result.featureGaps.forEach(feature => {
        expect(feature).toHaveProperty('feature');
        expect(feature).toHaveProperty('yourCount');
        expect(feature).toHaveProperty('competitorCount');
        expect(feature).toHaveProperty('gap');
      });
    });

    test('generateContentCalendar creates timeline', async () => {
      const gapAnalysis = await engine.analyzeGaps('mysite.com', ['moz.com'], 100, 70);
      const result = await engine.generateContentCalendar(gapAnalysis.id, new Date(), 'weekly', 52);

      expect(result).toHaveProperty('gapAnalysisId', gapAnalysis.id);
      expect(result).toHaveProperty('timeline');
      expect(result.timeline).toBeInstanceOf(Array);
      expect(result.timeline.length).toBeLessThanOrEqual(52);
      expect(result).toHaveProperty('summary');
    });

    test('exportReport returns summary with recommendations', async () => {
      const gapAnalysis = await engine.analyzeGaps('mysite.com', ['moz.com'], 100, 70);
      const result = await engine.exportReport(gapAnalysis.id, 'summary');

      expect(result).toHaveProperty('gapAnalysisId', gapAnalysis.id);
      expect(result).toHaveProperty('format', 'summary');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');
    });
  });

  // ==================== E2E JOURNEY TEST (1 comprehensive test) ====================
  describe('E2E Complete Keyword Research Journey', () => {
    test('Complete workflow: discover → analyze → cluster → score → track → gaps', async () => {
      // 1. Discover keywords
      const discovery = new KeywordDiscoveryEngine();
      const keywords = await discovery.discoverKeywords({
        seedKeyword: 'SEO tools',
        country: 'US',
        language: 'en',
        includeRelated: true,
        includeQuestions: true,
        includeLongTail: true,
        maxResults: 100
      });
      expect(keywords.keywords.length).toBeGreaterThan(0);

      // 2. Analyze SERP for top keywords
      const serp = new SERPAnalysisEngine();
      const serpResults = await Promise.all(
        keywords.keywords.slice(0, 5).map(kw => serp.analyzeSERP(kw.keyword))
      );
      expect(serpResults.length).toBe(5);

      // 3. Add competitors and identify gaps
      const competitor = new CompetitorResearchEngine();
      const comp1 = await competitor.addCompetitor({ domain: 'moz.com', name: 'Moz', industry: 'SEO' });
      const comp2 = await competitor.addCompetitor({ domain: 'semrush.com', name: 'SEMrush', industry: 'SEO' });
      const gaps = await competitor.identifyGaps('mysite.com', [comp1.id, comp2.id]);
      expect(gaps.keywordGaps).toBeInstanceOf(Array);

      // 4. Cluster keywords
      const clustering = new KeywordClusteringEngine();
      const keywordList = keywords.keywords.map(k => k.keyword);
      const clusters = await clustering.clusterKeywords(keywordList, 'semantic', 3, 10);
      expect(clusters.clusters.length).toBeGreaterThan(0);

      // 5. Score opportunities
      const scoring = new OpportunityScoringEngine();
      const scored = await scoring.scoreAndRank(
        keywords.keywords.slice(0, 20).map(k => ({
          keyword: k.keyword,
          metrics: {
            volume: k.volume,
            difficulty: k.difficulty,
            cpc: k.cpc,
            trend: 'stable'
          }
        }))
      );
      expect(scored.ranked).toBeInstanceOf(Array);

      // 6. Start rank tracking
      const tracking = new RankTrackingEngine();
      const trackingSetup = await tracking.startTracking(
        scored.quickWins.slice(0, 5).map(k => k.keyword),
        'mysite.com',
        'US',
        'desktop',
        'daily'
      );
      expect(trackingSetup.id).toBeDefined();

      // 7. Content gap analysis
      const gapAnalysis = new ContentGapAnalysisEngine();
      const contentGaps = await gapAnalysis.analyzeGaps(
        'mysite.com',
        [comp1.domain, comp2.domain],
        100,
        70
      );
      expect(contentGaps.opportunities).toBeInstanceOf(Array);

      // 8. Generate content calendar
      const calendar = await gapAnalysis.generateContentCalendar(
        contentGaps.id,
        new Date(),
        'weekly',
        52
      );
      expect(calendar.timeline).toBeInstanceOf(Array);

      // Validation: Complete journey produces actionable data
      expect(keywords.totalKeywords).toBeGreaterThan(0);
      expect(serpResults.every(r => r.results.length > 0)).toBe(true);
      expect(gaps.keywordGaps.length).toBeGreaterThan(0);
      expect(clusters.clusters.length).toBeGreaterThan(0);
      expect(scored.ranked.length).toBeGreaterThan(0);
      expect(Object.keys(trackingSetup.keywords).length).toBeGreaterThan(0);
      expect(contentGaps.opportunities.length).toBeGreaterThan(0);
      expect(calendar.timeline.length).toBeGreaterThan(0);

      console.log('✅ Complete E2E journey passed all validations');
    });
  });
});
