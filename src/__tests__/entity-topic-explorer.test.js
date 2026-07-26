'use strict';
/**
 * Entity & Topic Explorer Test Suite
 * 48+ tests across all 8 engines + integration + E2E journey
 */

const request = require('supertest');
const express = require('express');

jest.mock('../../middleware/verifyShopifySession', () => (req, res, next) => {
  req.headers['x-shopify-shop-domain'] = 'test-shop.myshopify.com';
  next();
});

jest.mock('../../core/creditMiddleware', () => ({
  requireCreditsOnMutation: () => (req, res, next) => next(),
  requireCredits: () => (req, res, next) => next(),
}));

const { EntityDiscoveryEngine } = require('../../tools/entity-topic-explorer/engines/entity-discovery-engine');
const { TopicClusterEngine } = require('../../tools/entity-topic-explorer/engines/topic-cluster-engine');
const { KnowledgeGraphEngine } = require('../../tools/entity-topic-explorer/engines/knowledge-graph-engine');
const { ContentAnalysisEngine } = require('../../tools/entity-topic-explorer/engines/content-analysis-engine');
const { CompetitorEntityEngine } = require('../../tools/entity-topic-explorer/engines/competitor-entity-engine');
const { OptimizationEngine } = require('../../tools/entity-topic-explorer/engines/optimization-engine');
const { EeatScoringEngine } = require('../../tools/entity-topic-explorer/engines/eeat-scoring-engine');
const { AiOrchestrationEngine } = require('../../tools/entity-topic-explorer/engines/ai-orchestration-engine');
const router = require('../../tools/entity-topic-explorer/router');

const app = express();
app.use(express.json());
app.use('/api/entity-topic-explorer', router);

describe('EntityDiscoveryEngine', () => {
  let engine;
  beforeEach(() => { engine = new EntityDiscoveryEngine(); });

  test('discovers entities for a domain', () => {
    const result = engine.discoverEntities('test.myshopify.com');
    expect(result).toHaveProperty('entities');
    expect(result).toHaveProperty('total');
    expect(result.entities.length).toBeGreaterThan(0);
  });

  test('filters entities by category', () => {
    const result = engine.discoverEntities('test.myshopify.com', { category: 'concept' });
    expect(result.entities.every(e => e.category === 'concept')).toBe(true);
  });

  test('enriches entities with opportunity score', () => {
    const result = engine.discoverEntities('test.myshopify.com');
    expect(result.entities[0]).toHaveProperty('opportunityScore');
    expect(result.entities[0].opportunityScore).toBeGreaterThanOrEqual(0);
  });

  test('analyzes entity co-occurrences', () => {
    const result = engine.analyzeCoOccurrences('Sustainable Fashion');
    expect(result).toHaveProperty('coOccurrences');
    expect(result.coOccurrences.length).toBeGreaterThan(0);
    expect(result.coOccurrences[0]).toHaveProperty('pmi');
  });

  test('matches entities to wikidata', () => {
    const entities = engine.getSampleEntities();
    const matched = engine.matchWikidataEntities(entities);
    const withQid = matched.filter(e => e.wikidataQid);
    expect(withQid[0]).toHaveProperty('wikidataMatch');
  });

  test('identifies entity gaps', () => {
    const own = engine.getSampleEntities();
    const competitor = engine.getCompetitorEntities();
    const gaps = engine.getEntityGaps(own, competitor);
    expect(Array.isArray(gaps)).toBe(true);
  });

  test('generates entity report with summary', () => {
    const report = engine.generateEntityReport('test.myshopify.com');
    expect(report).toHaveProperty('summary');
    expect(report.summary).toHaveProperty('totalEntities');
    expect(report.summary).toHaveProperty('avgEeatScore');
  });

  test('returns schema types list', () => {
    const types = engine.getSchemaTypes();
    expect(types).toContain('Organization');
    expect(types).toContain('Product');
  });
});

describe('TopicClusterEngine', () => {
  let engine;
  beforeEach(() => { engine = new TopicClusterEngine(); });

  test('returns topic clusters', () => {
    const clusters = engine.getClusters();
    expect(clusters.length).toBeGreaterThan(0);
    expect(clusters[0]).toHaveProperty('pillar');
    expect(clusters[0]).toHaveProperty('authority');
  });

  test('filters clusters by intent', () => {
    const clusters = engine.getClusters({ intent: 'informational' });
    expect(clusters.every(c => c.intent === 'informational')).toBe(true);
  });

  test('calculates coverage score', () => {
    const clusters = engine.getClusters();
    expect(clusters[0]).toHaveProperty('coverageScore');
    expect(clusters[0].coverageScore).toBeGreaterThanOrEqual(0);
    expect(clusters[0].coverageScore).toBeLessThanOrEqual(100);
  });

  test('returns topic hierarchy', () => {
    const hierarchy = engine.getTopicHierarchy('tc1');
    expect(hierarchy).toHaveProperty('pillar');
    expect(hierarchy).toHaveProperty('level1');
    expect(hierarchy).toHaveProperty('gaps');
  });

  test('returns null for invalid cluster id', () => {
    expect(engine.getTopicHierarchy('invalid-id')).toBeNull();
  });

  test('returns 12 months of seasonal trends', () => {
    const trends = engine.getSeasonalTrends();
    expect(trends.length).toBe(12);
    expect(trends[0]).toHaveProperty('month');
  });

  test('calculates topical authority with recommendations', () => {
    const authority = engine.calcTopicalAuthority('test.com');
    expect(authority).toHaveProperty('topicalAuthorityScore');
    expect(authority).toHaveProperty('recommendations');
  });
});

describe('KnowledgeGraphEngine', () => {
  let engine;
  beforeEach(() => { engine = new KnowledgeGraphEngine(); });

  test('returns KG presence with summary', () => {
    const result = engine.getKgPresence('test.com');
    expect(result).toHaveProperty('entities');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('recommendations');
  });

  test('returns rich result eligibility', () => {
    const result = engine.getRichResultEligibility();
    expect(result).toHaveProperty('eligible');
    expect(result).toHaveProperty('ineligible');
    expect(result.eligibilityRate).toBeGreaterThanOrEqual(0);
  });

  test('returns EEAT analysis with grade', () => {
    const result = engine.getEeatAnalysis();
    expect(result).toHaveProperty('overall');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('factors');
  });

  test('generates schema markup', () => {
    const schema = engine.generateSchema('Organization', { name: 'Test Brand', url: 'https://test.com' });
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Organization');
  });

  test('validates valid schema', () => {
    const result = engine.validateSchema({ '@context': 'https://schema.org', '@type': 'Organization', url: 'https://test.com' });
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('validates invalid schema', () => {
    const result = engine.validateSchema({ name: 'No context or type' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('returns structured data audit', () => {
    const result = engine.getStructuredDataAudit('https://test.com');
    expect(result).toHaveProperty('schemasFound');
    expect(result).toHaveProperty('score');
  });
});

describe('ContentAnalysisEngine', () => {
  let engine;
  beforeEach(() => { engine = new ContentAnalysisEngine(); });

  test('analyzes content with full report', () => {
    const result = engine.analyzeContent('https://test.com/page', 'Sustainable fashion content');
    expect(result).toHaveProperty('nlp');
    expect(result).toHaveProperty('entityProfile');
    expect(result).toHaveProperty('recommendations');
  });

  test('returns NLP scan with named entities', () => {
    const result = engine.getNlpScan('https://test.com/page');
    expect(result).toHaveProperty('namedEntities');
    expect(result.namedEntities.length).toBeGreaterThan(0);
  });

  test('returns semantic triples', () => {
    const result = engine.getSemanticTriples('https://test.com/page');
    expect(result).toHaveProperty('triples');
    expect(result.triples.length).toBeGreaterThan(0);
    expect(result.triples[0]).toHaveProperty('subject');
    expect(result.triples[0]).toHaveProperty('predicate');
    expect(result.triples[0]).toHaveProperty('object');
  });

  test('returns content freshness data', () => {
    const freshness = engine.getContentFreshness();
    expect(freshness.length).toBeGreaterThan(0);
    expect(freshness[0]).toHaveProperty('url');
    expect(freshness[0]).toHaveProperty('needsUpdate');
  });

  test('calculates entity density', () => {
    const result = engine.calcEntityDensity('Content about sustainable fashion and organic cotton.');
    expect(result).toHaveProperty('density');
    expect(result).toHaveProperty('optimal');
  });

  test('bulk analyzes multiple URLs', () => {
    const results = engine.bulkAnalyze(['/page1', '/page2', '/page3']);
    expect(results.length).toBe(3);
    expect(results[0]).toHaveProperty('entityCount');
  });
});

describe('CompetitorEntityEngine', () => {
  let engine;
  beforeEach(() => { engine = new CompetitorEntityEngine(); });

  test('returns competitor overview with leaderboard', () => {
    const result = engine.getCompetitorOverview();
    expect(result).toHaveProperty('competitors');
    expect(result).toHaveProperty('leaderboard');
    expect(result).toHaveProperty('sovGap');
  });

  test('returns entity gaps', () => {
    const result = engine.getEntityGaps();
    expect(result).toHaveProperty('gaps');
    expect(result).toHaveProperty('totalGaps');
    expect(result.totalGaps).toBeGreaterThan(0);
  });

  test('returns featured snippet data', () => {
    const result = engine.getFeaturedSnippets();
    expect(result).toHaveProperty('owned');
    expect(result).toHaveProperty('lost');
    expect(result.ownershipRate).toBeGreaterThanOrEqual(0);
    expect(result.ownershipRate).toBeLessThanOrEqual(100);
  });

  test('returns SWOT analysis with all quadrants', () => {
    const result = engine.getSwotAnalysis();
    expect(result).toHaveProperty('strengths');
    expect(result).toHaveProperty('weaknesses');
    expect(result).toHaveProperty('opportunities');
    expect(result).toHaveProperty('threats');
  });

  test('returns benchmarks', () => {
    const result = engine.getBenchmarks();
    expect(result).toHaveProperty('entityCount');
    expect(result).toHaveProperty('topicalAuthority');
    expect(result.entityCount).toHaveProperty('me');
    expect(result.entityCount).toHaveProperty('leader');
  });
});

describe('OptimizationEngine', () => {
  let engine;
  beforeEach(() => { engine = new OptimizationEngine(); });

  test('returns optimization priorities with summary', () => {
    const result = engine.getPriorities();
    expect(result).toHaveProperty('priorities');
    expect(result.priorities.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('summary');
  });

  test('filters priorities by impact level', () => {
    const result = engine.getPriorities({ impact: 'critical' });
    expect(result.priorities.every(p => p.impact === 'critical')).toBe(true);
  });

  test('returns internal linking opportunities', () => {
    const result = engine.getInternalLinkingSprint();
    expect(result).toHaveProperty('opportunities');
    expect(result).toHaveProperty('critical');
    expect(result).toHaveProperty('sprintDuration');
  });

  test('generates 3-phase entity strategy', () => {
    const result = engine.generateEntityStrategy('test.com', []);
    expect(result).toHaveProperty('phase1');
    expect(result).toHaveProperty('phase2');
    expect(result).toHaveProperty('phase3');
  });

  test('generates AI writer prompts', () => {
    const result = engine.generateAiWriterPrompts('Circular Economy');
    expect(result).toHaveProperty('prompts');
    expect(result.prompts.length).toBeGreaterThan(0);
    expect(result.prompts[0]).toHaveProperty('type');
    expect(result.prompts[0]).toHaveProperty('prompt');
  });

  test('completes an action successfully', () => {
    const result = engine.completeAction('op1');
    expect(result.ok).toBe(true);
    expect(result.action.completionPct).toBe(100);
  });

  test('returns error for invalid action', () => {
    const result = engine.completeAction('invalid-id');
    expect(result.ok).toBe(false);
  });
});

describe('EeatScoringEngine', () => {
  let engine;
  beforeEach(() => { engine = new EeatScoringEngine(); });

  test('returns full EEAT analysis', () => {
    const result = engine.getFullAnalysis('test.com');
    expect(result).toHaveProperty('overall');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('scores');
    expect(result).toHaveProperty('topQuickWins');
    expect(result).toHaveProperty('improvementRoadmap');
  });

  test('overall score is within 0-100', () => {
    const result = engine.getFullAnalysis('test.com');
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  test('grade is a valid grade string', () => {
    const result = engine.getFullAnalysis('test.com');
    expect(['A+','A','B+','B','C','D']).toContain(result.grade);
  });

  test('returns quick wins array', () => {
    const result = engine.getFullAnalysis('test.com');
    expect(Array.isArray(result.topQuickWins)).toBe(true);
  });

  test('updates signal state successfully', () => {
    const result = engine.updateSignal('exp2', true, 'Added 10 product demo videos');
    expect(result.ok).toBe(true);
    expect(result.signal.present).toBe(true);
    expect(result.signal.evidence).toBe('Added 10 product demo videos');
  });

  test('returns error for invalid signal ID', () => {
    const result = engine.updateSignal('invalid-signal-xyz', true, 'test');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not found');
  });
});

describe('AiOrchestrationEngine', () => {
  let engine;
  beforeEach(() => { engine = new AiOrchestrationEngine(); });

  test('routes task to appropriate model', () => {
    const result = engine.routeTask('entity-discovery');
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('provider');
    expect(result).toHaveProperty('routing');
  });

  test('routes task with cost optimization', () => {
    const result = engine.routeTask('entity-discovery', { costOptimize: true });
    expect(result.routing).toBe('cost-optimized');
  });

  test('forces specific model when requested', () => {
    const result = engine.routeTask('entity-discovery', { forceModel: 'gpt-4o-mini' });
    expect(result.model).toBe('gpt-4o-mini');
  });

  test('records feedback and returns feedback ID', () => {
    const result = engine.recordFeedback('task-123', 5, 'Excellent entity analysis');
    expect(result.ok).toBe(true);
    expect(result.feedbackId).toMatch(/^fb_/);
  });

  test('returns feedback stats after recording', () => {
    engine.recordFeedback('t1', 5);
    engine.recordFeedback('t2', 3);
    const stats = engine.getFeedbackStats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.avgRating).toBeGreaterThan(0);
  });

  test('builds prompt from template', () => {
    const result = engine.buildPrompt('entity-discovery', { domain: 'test.com' });
    expect(result).toHaveProperty('prompt');
    expect(result.prompt).toContain('test.com');
  });

  test('returns all available models', () => {
    const models = engine.getModels();
    expect(models).toHaveProperty('gpt-4o');
    expect(models).toHaveProperty('claude-3-5-sonnet');
    expect(models).toHaveProperty('gemini-1-5-pro');
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
describe('Router: System', () => {
  test('GET /health returns 200 with version', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/health').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.version).toBe('2.0.0');
  });

  test('GET /stats returns engine count', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/stats').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.engines).toBe(8);
  });

  test('GET /dashboard returns overview', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/dashboard').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.overview).toHaveProperty('topicalAuthority');
    expect(res.body.overview).toHaveProperty('eeatScore');
  });
});

describe('Router: Entities', () => {
  test('GET /entities returns entity list', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/entities').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.entities).toBeDefined();
  });

  test('POST /entities/discover requires domain', async () => {
    const res = await request(app).post('/api/entity-topic-explorer/entities/discover').set('x-shopify-shop-domain', 'test.myshopify.com').send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test('POST /entities/discover with domain succeeds', async () => {
    const res = await request(app).post('/api/entity-topic-explorer/entities/discover').set('x-shopify-shop-domain', 'test.myshopify.com').send({ domain: 'test.com' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('GET /entities/report returns full report', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/entities/report').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
  });
});

describe('Router: Topics', () => {
  test('GET /topics/clusters returns clusters', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/topics/clusters').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.clusters.length).toBeGreaterThan(0);
  });

  test('GET /topics/authority returns authority score', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/topics/authority').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.topicalAuthorityScore).toBeDefined();
  });
});

describe('Router: Knowledge Graph', () => {
  test('GET /kg/presence returns presence data', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/kg/presence').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
  });

  test('POST /kg/schema/validate validates correctly', async () => {
    const res = await request(app).post('/api/entity-topic-explorer/kg/schema/validate').set('x-shopify-shop-domain', 'test.myshopify.com').send({ schema: { '@context': 'https://schema.org', '@type': 'Organization', url: 'https://test.com' } });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});

describe('Router: E-E-A-T', () => {
  test('GET /eeat returns full analysis', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/eeat').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.overall).toBeDefined();
    expect(res.body.grade).toBeDefined();
  });
});

describe('Router: Competitors', () => {
  test('GET /competitors returns overview', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/competitors').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.competitors).toBeDefined();
  });

  test('GET /competitors/swot returns all quadrants', async () => {
    const res = await request(app).get('/api/entity-topic-explorer/competitors/swot').set('x-shopify-shop-domain', 'test.myshopify.com');
    expect(res.status).toBe(200);
    expect(res.body.strengths).toBeDefined();
    expect(res.body.weaknesses).toBeDefined();
  });
});

describe('E2E: Entity Strategy Journey', () => {
  test('Complete entity strategy workflow', async () => {
    const h = { 'x-shopify-shop-domain': 'test.myshopify.com' };

    const entities = await request(app).post('/api/entity-topic-explorer/entities/discover').set(h).send({ domain: 'test.com' });
    expect(entities.body.ok).toBe(true);

    const authority = await request(app).get('/api/entity-topic-explorer/topics/authority').set(h);
    expect(authority.body.topicalAuthorityScore).toBeGreaterThan(0);

    const eeat = await request(app).get('/api/entity-topic-explorer/eeat').set(h);
    expect(eeat.body.overall).toBeGreaterThan(0);

    const gaps = await request(app).get('/api/entity-topic-explorer/competitors/entity-gaps').set(h);
    expect(gaps.body.gaps).toBeDefined();

    const priorities = await request(app).get('/api/entity-topic-explorer/optimize/priorities').set(h);
    expect(priorities.body.priorities.length).toBeGreaterThan(0);

    const dashboard = await request(app).get('/api/entity-topic-explorer/dashboard').set(h);
    expect(dashboard.body.overview).toBeDefined();
    expect(dashboard.body.overview.eeatScore).toBeGreaterThan(0);
  });
});
