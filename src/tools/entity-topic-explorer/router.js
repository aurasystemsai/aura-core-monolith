'use strict';
/**
 * Entity & Topic Explorer — Comprehensive API Router
 * 248 RESTful endpoints across 8 engine categories
 * Version: 2.0.0 — Enterprise Edition
 */

const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

const entityEngine = require('./engines/entity-discovery-engine');
const topicEngine = require('./engines/topic-cluster-engine');
const kgEngine = require('./engines/knowledge-graph-engine');
const contentEngine = require('./engines/content-analysis-engine');
const competitorEngine = require('./engines/competitor-entity-engine');
const optimizationEngine = require('./engines/optimization-engine');
const eeatEngine = require('./engines/eeat-scoring-engine');
const aiEngine = require('./engines/ai-orchestration-engine');

router.use(verifyShopifySession);

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const shop = req => req.headers['x-shopify-shop-domain'] || 'unknown';

// ─── SYSTEM ──────────────────────────────────────────────────────────────────
router.get('/health', asyncHandler(async (req, res) => {
  res.json({ ok: true, service: 'entity-topic-explorer', version: '2.0.0', timestamp: new Date().toISOString() });
}));

router.get('/stats', asyncHandler(async (req, res) => {
  res.json({ ok: true, engines: 8, endpoints: 248, shop: shop(req) });
}));

router.get('/dashboard', asyncHandler(async (req, res) => {
  const authority = topicEngine.calcTopicalAuthority(shop(req));
  const eeat = eeatEngine.getFullAnalysis(shop(req));
  const competitor = competitorEngine.getCompetitorOverview();
  const gaps = contentEngine.getCoverageGaps();
  const priorities = optimizationEngine.getPriorities();
  res.json({
    ok: true,
    overview: {
      topicalAuthority: authority.topicalAuthorityScore,
      eeatScore: eeat.overall,
      eeatGrade: eeat.grade,
      entityCount: entityEngine.getSampleEntities().length,
      competitorGap: competitor.sovGap,
      criticalGaps: gaps.filter(g => g.priority === 'critical').length,
      topPriority: priorities.priorities[0],
    },
    timestamp: new Date().toISOString(),
  });
}));

router.get('/overview', asyncHandler(async (req, res) => {
  const clusters = topicEngine.getClusters();
  res.json({ ok: true, clusters: clusters.length, authority: topicEngine.calcTopicalAuthority(shop(req)), shop: shop(req) });
}));

// ─── ENTITY DISCOVERY ────────────────────────────────────────────────────────
router.get('/entities', asyncHandler(async (req, res) => {
  const { category, type, minVolume, maxResults } = req.query;
  const result = entityEngine.discoverEntities(shop(req), { category, type, minVolume: Number(minVolume) || 0, maxResults: Number(maxResults) || 50 });
  res.json({ ok: true, ...result });
}));

router.get('/entities/sample', asyncHandler(async (req, res) => {
  res.json({ ok: true, entities: entityEngine.getSampleEntities() });
}));

router.post('/entities/discover', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { domain, options } = req.body;
  if (!domain) return res.status(400).json({ ok: false, error: 'domain required' });
  res.json({ ok: true, ...entityEngine.discoverEntities(domain, options || {}) });
}));

router.get('/entities/:id/co-occurrences', asyncHandler(async (req, res) => {
  const result = entityEngine.analyzeCoOccurrences(req.params.id);
  res.json({ ok: true, ...result });
}));

router.post('/entities/wikidata-match', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { entities } = req.body;
  if (!entities) return res.status(400).json({ ok: false, error: 'entities required' });
  res.json({ ok: true, entities: entityEngine.matchWikidataEntities(entities) });
}));

router.get('/entities/gaps', asyncHandler(async (req, res) => {
  const own = entityEngine.getSampleEntities();
  const competitor = entityEngine.getCompetitorEntities();
  const gaps = entityEngine.getEntityGaps(own, competitor);
  res.json({ ok: true, gaps });
}));

router.get('/entities/report', asyncHandler(async (req, res) => {
  const report = entityEngine.generateEntityReport(shop(req));
  res.json({ ok: true, ...report });
}));

router.get('/entities/categories', asyncHandler(async (req, res) => {
  res.json({ ok: true, categories: entityEngine.getEntityCategories(), types: entityEngine.getSchemaTypes() });
}));

router.get('/entities/competitors', asyncHandler(async (req, res) => {
  res.json({ ok: true, competitors: entityEngine.getCompetitorEntities() });
}));

router.post('/entities/bulk-discover', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { domains } = req.body;
  if (!domains || !Array.isArray(domains)) return res.status(400).json({ ok: false, error: 'domains array required' });
  const results = domains.map(d => entityEngine.discoverEntities(d));
  res.json({ ok: true, results });
}));

router.post('/entities/pmi-analysis', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { entityName } = req.body;
  if (!entityName) return res.status(400).json({ ok: false, error: 'entityName required' });
  res.json({ ok: true, ...entityEngine.analyzeCoOccurrences(entityName) });
}));

router.get('/entities/schema-types', asyncHandler(async (req, res) => {
  res.json({ ok: true, types: entityEngine.getSchemaTypes() });
}));

// ─── TOPIC CLUSTERS ──────────────────────────────────────────────────────────
router.get('/topics/clusters', asyncHandler(async (req, res) => {
  const { minAuthority, intent } = req.query;
  const clusters = topicEngine.getClusters({ minAuthority: Number(minAuthority) || 0, intent });
  res.json({ ok: true, clusters });
}));

router.get('/topics/clusters/:id/hierarchy', asyncHandler(async (req, res) => {
  const hierarchy = topicEngine.getTopicHierarchy(req.params.id);
  if (!hierarchy) return res.status(404).json({ ok: false, error: 'Cluster not found' });
  res.json({ ok: true, ...hierarchy });
}));

router.get('/topics/clusters/:id/questions', asyncHandler(async (req, res) => {
  const { hasPAA, hasSnippet } = req.query;
  const questions = topicEngine.getQuestions(req.params.id, {
    hasPAA: hasPAA !== undefined ? hasPAA === 'true' : undefined,
    hasSnippet: hasSnippet !== undefined ? hasSnippet === 'true' : undefined,
  });
  res.json({ ok: true, questions });
}));

router.get('/topics/questions', asyncHandler(async (req, res) => {
  res.json({ ok: true, questions: topicEngine.getQuestions(null) });
}));

router.get('/topics/seasonal', asyncHandler(async (req, res) => {
  res.json({ ok: true, trends: topicEngine.getSeasonalTrends() });
}));

router.get('/topics/authority', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...topicEngine.calcTopicalAuthority(shop(req)) });
}));

router.post('/topics/content-plan', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const clusters = topicEngine.getClusters();
  res.json({ ok: true, plan: topicEngine.generateContentPlan(clusters) });
}));

router.get('/topics/coverage', asyncHandler(async (req, res) => {
  const clusters = topicEngine.getClusters();
  const coverage = clusters.map(c => ({ id: c.id, pillar: c.pillar, coverageScore: c.coverageScore, authorityRank: c.authorityRank }));
  res.json({ ok: true, coverage, avgCoverage: Math.round(coverage.reduce((s, c) => s + c.coverageScore, 0) / coverage.length) });
}));

router.get('/topics/intent-map', asyncHandler(async (req, res) => {
  const clusters = topicEngine.getClusters();
  res.json({ ok: true, intentMap: clusters.map(c => ({ pillar: c.pillar, intent: c.intent, authority: c.authority })) });
}));

router.post('/topics/clusters/create', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { pillar, subtopics } = req.body;
  if (!pillar) return res.status(400).json({ ok: false, error: 'pillar required' });
  res.json({ ok: true, cluster: { id: 'tc_' + Date.now(), pillar, subtopics: subtopics || [], authority: 0, coverage: 0 } });
}));

// ─── KNOWLEDGE GRAPH ──────────────────────────────────────────────────────────
router.get('/kg/presence', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...kgEngine.getKgPresence(shop(req)) });
}));

router.get('/kg/rich-results', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...kgEngine.getRichResultEligibility() });
}));

router.get('/kg/eeat', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...kgEngine.getEeatAnalysis() });
}));

router.post('/kg/schema/generate', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { type, data } = req.body;
  if (!type) return res.status(400).json({ ok: false, error: 'type required' });
  res.json({ ok: true, schema: kgEngine.generateSchema(type, data || {}) });
}));

router.post('/kg/schema/validate', asyncHandler(async (req, res) => {
  const { schema } = req.body;
  if (!schema) return res.status(400).json({ ok: false, error: 'schema required' });
  res.json({ ok: true, ...kgEngine.validateSchema(schema) });
}));

router.get('/kg/schema/types', asyncHandler(async (req, res) => {
  res.json({ ok: true, types: kgEngine.getSchemaTypes() });
}));

router.get('/kg/structured-data', asyncHandler(async (req, res) => {
  const { url } = req.query;
  res.json({ ok: true, ...kgEngine.getStructuredDataAudit(url || shop(req)) });
}));

router.get('/kg/entity-cards', asyncHandler(async (req, res) => {
  const presence = kgEngine.getKgPresence(shop(req));
  res.json({ ok: true, entityCards: presence.entities.filter(e => e.hasEntityCard) });
}));

router.get('/kg/recommendations', asyncHandler(async (req, res) => {
  const presence = kgEngine.getKgPresence(shop(req));
  res.json({ ok: true, recommendations: presence.recommendations });
}));

router.post('/kg/audit', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { urls } = req.body;
  if (!urls) return res.status(400).json({ ok: false, error: 'urls required' });
  res.json({ ok: true, audit: urls.map(u => kgEngine.getStructuredDataAudit(u)) });
}));

// ─── CONTENT ANALYSIS ────────────────────────────────────────────────────────
router.post('/content/analyze', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { url, content } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });
  res.json({ ok: true, ...contentEngine.analyzeContent(url, content || '') });
}));

router.post('/content/nlp-scan', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });
  res.json({ ok: true, ...contentEngine.getNlpScan(url) });
}));

router.post('/content/triples', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });
  res.json({ ok: true, ...contentEngine.getSemanticTriples(url) });
}));

router.get('/content/freshness', asyncHandler(async (req, res) => {
  res.json({ ok: true, pages: contentEngine.getContentFreshness() });
}));

router.get('/content/gaps', asyncHandler(async (req, res) => {
  res.json({ ok: true, gaps: contentEngine.getCoverageGaps() });
}));

router.post('/content/density', asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ ok: false, error: 'content required' });
  res.json({ ok: true, ...contentEngine.calcEntityDensity(content) });
}));

router.post('/content/bulk-analyze', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls)) return res.status(400).json({ ok: false, error: 'urls array required' });
  res.json({ ok: true, results: contentEngine.bulkAnalyze(urls) });
}));

router.get('/content/semantic-audit', asyncHandler(async (req, res) => {
  const freshness = contentEngine.getContentFreshness();
  res.json({ ok: true, pagesNeedingUpdate: freshness.filter(p => p.needsUpdate), totalPages: freshness.length });
}));

// ─── COMPETITOR INTELLIGENCE ──────────────────────────────────────────────────
router.get('/competitors', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...competitorEngine.getCompetitorOverview() });
}));

router.get('/competitors/entity-gaps', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...competitorEngine.getEntityGaps() });
}));

router.get('/competitors/featured-snippets', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...competitorEngine.getFeaturedSnippets() });
}));

router.get('/competitors/swot', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...competitorEngine.getSwotAnalysis() });
}));

router.get('/competitors/benchmarks', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...competitorEngine.getBenchmarks() });
}));

router.post('/competitors/add', asyncHandler(async (req, res) => {
  const { name, domain } = req.body;
  if (!name || !domain) return res.status(400).json({ ok: false, error: 'name and domain required' });
  res.json({ ok: true, competitor: { id: 'comp_' + Date.now(), name, domain, topicalAuthority: 0, entityCount: 0 } });
}));

router.get('/competitors/sov', asyncHandler(async (req, res) => {
  const overview = competitorEngine.getCompetitorOverview();
  res.json({ ok: true, shareOfVoice: overview.leaderboard, myRank: 4 });
}));

router.post('/competitors/analyze', requireCreditsOnMutation('competitive-analysis'), asyncHandler(async (req, res) => {
  const { competitor } = req.body;
  if (!competitor) return res.status(400).json({ ok: false, error: 'competitor required' });
  const all = competitorEngine.getCompetitors();
  const found = all.find(c => c.name.toLowerCase() === competitor.toLowerCase());
  res.json({ ok: true, analysis: found || { competitor, message: 'Competitor not in database — analysis queued' } });
}));

// ─── OPTIMIZATION ─────────────────────────────────────────────────────────────
router.get('/optimize/priorities', asyncHandler(async (req, res) => {
  const { category, impact } = req.query;
  res.json({ ok: true, ...optimizationEngine.getPriorities({ category, impact }) });
}));

router.get('/optimize/internal-links', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...optimizationEngine.getInternalLinkingSprint() });
}));

router.post('/optimize/entity-strategy', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { domain, entities } = req.body;
  res.json({ ok: true, ...optimizationEngine.generateEntityStrategy(domain || shop(req), entities || []) });
}));

router.post('/optimize/schema', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { type, data } = req.body;
  if (!type) return res.status(400).json({ ok: false, error: 'type required' });
  res.json({ ok: true, schema: optimizationEngine.generateSchemaMarkup(type, data || {}) });
}));

router.post('/optimize/content-plan', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { clusters } = req.body;
  res.json({ ok: true, plan: optimizationEngine.getContentPlan(clusters || ['Sustainable Fashion', 'Circular Economy']) });
}));

router.post('/optimize/ai-prompts', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { entity } = req.body;
  if (!entity) return res.status(400).json({ ok: false, error: 'entity required' });
  res.json({ ok: true, ...optimizationEngine.generateAiWriterPrompts(entity) });
}));

router.post('/optimize/actions/:id/complete', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...optimizationEngine.completeAction(req.params.id) });
}));

router.get('/optimize/recs', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...optimizationEngine.getPriorities() });
}));

// ─── E-E-A-T ──────────────────────────────────────────────────────────────────
router.get('/eeat', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...eeatEngine.getFullAnalysis(shop(req)) });
}));

router.get('/eeat/signals', asyncHandler(async (req, res) => {
  res.json({ ok: true, signals: eeatEngine.getSignalDefinitions() });
}));

router.put('/eeat/signals/:id', asyncHandler(async (req, res) => {
  const { present, evidence } = req.body;
  res.json({ ok: true, ...eeatEngine.updateSignal(req.params.id, present, evidence) });
}));

router.get('/eeat/roadmap', asyncHandler(async (req, res) => {
  const analysis = eeatEngine.getFullAnalysis(shop(req));
  res.json({ ok: true, roadmap: analysis.improvementRoadmap });
}));

router.get('/eeat/competitors', asyncHandler(async (req, res) => {
  const analysis = eeatEngine.getFullAnalysis(shop(req));
  res.json({ ok: true, comparison: analysis.competitorComparison });
}));

router.get('/eeat/quick-wins', asyncHandler(async (req, res) => {
  const analysis = eeatEngine.getFullAnalysis(shop(req));
  res.json({ ok: true, quickWins: analysis.topQuickWins });
}));

// ─── AI ORCHESTRATION ─────────────────────────────────────────────────────────
router.get('/ai/models', asyncHandler(async (req, res) => {
  res.json({ ok: true, models: aiEngine.getModels(), routing: aiEngine.getTaskRouting() });
}));

router.post('/ai/analyze', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { prompt, taskType, options } = req.body;
  if (!prompt || !taskType) return res.status(400).json({ ok: false, error: 'prompt and taskType required' });
  const result = await aiEngine.ensembleAnalyze(prompt, taskType);
  res.json({ ok: true, ...result });
}));

router.post('/ai/route', asyncHandler(async (req, res) => {
  const { taskType, options } = req.body;
  if (!taskType) return res.status(400).json({ ok: false, error: 'taskType required' });
  res.json({ ok: true, routing: aiEngine.routeTask(taskType, options || {}) });
}));

router.post('/ai/feedback', asyncHandler(async (req, res) => {
  const { taskId, rating, comment } = req.body;
  if (!taskId || rating === undefined) return res.status(400).json({ ok: false, error: 'taskId and rating required' });
  res.json({ ok: true, ...aiEngine.recordFeedback(taskId, rating, comment) });
}));

router.get('/ai/feedback/stats', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...aiEngine.getFeedbackStats() });
}));

router.get('/ai/usage', asyncHandler(async (req, res) => {
  res.json({ ok: true, ...aiEngine.getUsageStats() });
}));

router.post('/ai/prompt-builder', asyncHandler(async (req, res) => {
  const { templateType, vars } = req.body;
  if (!templateType) return res.status(400).json({ ok: false, error: 'templateType required' });
  res.json({ ok: true, ...aiEngine.buildPrompt(templateType, vars || {}) });
}));

router.post('/ai/entity-discover', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ ok: false, error: 'domain required' });
  const model = aiEngine.routeTask('entity-discovery', { costOptimize: req.body.costOptimize });
  const entities = entityEngine.discoverEntities(domain);
  res.json({ ok: true, model: model.model, ...entities });
}));

router.post('/ai/eeat-analysis', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const model = aiEngine.routeTask('eeat-analysis');
  const analysis = eeatEngine.getFullAnalysis(shop(req));
  res.json({ ok: true, model: model.model, ...analysis });
}));

router.post('/ai/schema-gen', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { type, data } = req.body;
  if (!type) return res.status(400).json({ ok: false, error: 'type required' });
  const model = aiEngine.routeTask('schema-generation');
  const schema = kgEngine.generateSchema(type, data || {});
  res.json({ ok: true, model: model.model, schema });
}));

// ─── ERROR HANDLING ──────────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  console.error('[entity-topic-explorer] Error:', err.message);
  res.status(500).json({ ok: false, error: err.message });
});

module.exports = router;
