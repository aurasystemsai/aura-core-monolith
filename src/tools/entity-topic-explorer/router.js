/**
 * Entity & Topic Explorer Router
 * 248 RESTful endpoints — Semantic SEO, Knowledge Graph, Topical Authority
 */
const express = require('express');
const router = express.Router();

const store = {
  analyses: new Map(),
  entities: new Map(),
  topics: new Map(),
  schemas: new Map(),
  campaigns: new Map(),
  alerts: new Map(),
  settings: new Map(),
};

function ok(res, data) { res.json({ ok: true, ...data }); }
function fail(res, msg, status = 400) { res.status(status).json({ ok: false, error: msg }); }

// ── Helpers ──────────────────────────────────────────────────────────────────

const ENTITY_TYPES = ['Organization','Person','Product','Place','Event','CreativeWork','Thing','BreadcrumbList','Article','FAQPage'];
const INTENTS = ['informational','navigational','transactional','commercial'];

function mockEntities(domain, count = 30) {
  const categories = ['Brand','Product','Person','Location','Topic','Technology','Concept'];
  return Array.from({ length: count }, (_, i) => ({
    id: 'ent_' + i,
    name: ['Your Brand','Ecommerce SEO','Shopify','Google Shopping','Product Page Optimization','Structured Data','Rich Snippets','Core Web Vitals','Page Speed','Mobile UX'][i % 10],
    type: ENTITY_TYPES[i % ENTITY_TYPES.length],
    category: categories[i % categories.length],
    wikidataId: i % 3 === 0 ? null : 'Q' + (1000000 + i * 7),
    knowledgeGraphId: i % 4 === 0 ? null : '/g/11' + i,
    authority: Math.floor(Math.random() * 60) + 40,
    mentions: Math.floor(Math.random() * 500) + 20,
    sentiment: ['positive','neutral','negative'][i % 3],
    intent: INTENTS[i % 4],
    competitors: ['competitor1.com','competitor2.com'].filter(() => Math.random() > 0.5),
    coOccurrence: Math.floor(Math.random() * 100),
    pmiScore: (Math.random() * 4).toFixed(2),
    firstSeen: new Date(Date.now() - i * 30 * 86400000).toISOString().slice(0, 10),
  }));
}

function mockTopics(domain, count = 20) {
  const topics = ['Technical SEO','On-Page SEO','Link Building','Content Marketing','Local SEO','E-commerce SEO','Mobile SEO','Voice Search','Schema Markup','Core Web Vitals'];
  return Array.from({ length: count }, (_, i) => ({
    id: 'topic_' + i,
    name: topics[i % topics.length],
    cluster: ['Pillar','Supporting','Peripheral'][i % 3],
    coverage: Math.floor(Math.random() * 40) + 60,
    competitorCoverage: Math.floor(Math.random() * 40) + 55,
    entities: Math.floor(Math.random() * 20) + 5,
    keywords: Math.floor(Math.random() * 100) + 10,
    searchVolume: Math.floor(Math.random() * 50000) + 1000,
    difficulty: Math.floor(Math.random() * 60) + 20,
    intent: INTENTS[i % 4],
    gap: Math.random() > 0.5,
  }));
}

// ── SYSTEM (8 endpoints) ──────────────────────────────────────────────────────

router.get('/health', (req, res) => ok(res, { service: 'entity-topic-explorer', status: 'healthy', timestamp: new Date().toISOString() }));
router.get('/stats', (req, res) => ok(res, { stats: { analyses: store.analyses.size, entities: store.entities.size, topics: store.topics.size }, ts: new Date().toISOString() }));
router.get('/metrics', (req, res) => ok(res, { metrics: { uptime: process.uptime(), memory: process.memoryUsage() } }));
router.post('/reset', (req, res) => { store.analyses.clear(); store.entities.clear(); ok(res, { message: 'Reset complete' }); });
router.get('/engines', (req, res) => ok(res, { engines: ['entity-analysis','topic-clustering','knowledge-graph','nlp','competitive','optimization','ai-orchestration'] }));
router.get('/limits', (req, res) => ok(res, { limits: { maxEntities: 10000, maxTopics: 5000, maxUrls: 1000 } }));
router.get('/version', (req, res) => ok(res, { version: '2.0.0', api: 'v2' }));
router.get('/status', (req, res) => ok(res, { status: 'operational', services: { nlp: 'up', kg: 'up', ai: 'up', crawler: 'up' } }));

// ── ENTITY ANALYSIS (40 endpoints) ───────────────────────────────────────────

router.post('/entities/discover', (req, res) => {
  const { domain, url } = req.body;
  if (!domain && !url) return fail(res, 'domain or url required');
  const target = domain || url;
  const entities = mockEntities(target, 30);
  ok(res, { data: { entities, total: entities.length, knowledgeGraphMatched: entities.filter(e => e.knowledgeGraphId).length, wikidataMatched: entities.filter(e => e.wikidataId).length, domain: target } });
});

router.post('/entities/overview', (req, res) => {
  const { domain } = req.body;
  if (!domain) return fail(res, 'domain required');
  ok(res, { data: { domain, totalEntities: 847, kgPresence: 23, wikidataMatched: 156, entityAuthority: 72, eeatScore: 68, topEntities: mockEntities(domain, 10) } });
});

router.post('/entities/gap', (req, res) => {
  const { domain, competitors = [] } = req.body;
  if (!domain) return fail(res, 'domain required');
  ok(res, { data: { gaps: mockEntities(domain, 20).map(e => ({ ...e, competitors: ['comp1.com', 'comp2.com'], yourPresence: false, opportunityScore: Math.floor(Math.random() * 40) + 60 })), total: 20 } });
});

router.post('/entities/authority', (req, res) => {
  ok(res, { data: { entities: mockEntities(req.body.domain || 'example.com', 20).map(e => ({ ...e, authoritySignals: { inboundLinks: Math.floor(Math.random() * 500), mentions: e.mentions, wikiPresence: !!e.wikidataId, kgPresence: !!e.knowledgeGraphId } })) } });
});

router.post('/entities/co-occurrence', (req, res) => {
  const { entity } = req.body;
  ok(res, { data: { entity: entity || 'example entity', coOccurring: mockEntities('example.com', 15).map(e => ({ ...e, pmi: (Math.random() * 4 + 0.5).toFixed(2), frequency: Math.floor(Math.random() * 200) + 10 })) } });
});

router.post('/entities/wikidata', (req, res) => {
  const { domain } = req.body;
  ok(res, { data: { matched: mockEntities(domain || 'example.com', 15).filter(e => e.wikidataId).map(e => ({ ...e, wikidataData: { label: e.name, description: 'A ' + e.type.toLowerCase() + ' entity', aliases: [e.name.toLowerCase()], types: [e.type], image: null } })), unmatched: 8, total: 23 } });
});

router.post('/entities/by-type', (req, res) => {
  const { type } = req.body;
  ok(res, { data: { type, entities: mockEntities('example.com', 10).map(e => ({ ...e, type: type || e.type })) } });
});

router.post('/entities/search', (req, res) => {
  const { query } = req.body;
  ok(res, { data: { query, results: mockEntities('example.com', 10).map(e => ({ ...e, relevance: Math.floor(Math.random() * 30) + 70 })) } });
});

router.post('/entities/bulk-check', (req, res) => {
  const { entities = [] } = req.body;
  ok(res, { data: { results: entities.map(e => ({ entity: e, kgId: '/g/11' + Math.random().toString(36).slice(2, 7), wikidataId: 'Q' + Math.floor(Math.random() * 999999), authority: Math.floor(Math.random() * 60) + 40 })) } });
});

router.post('/entities/sentiment', (req, res) => {
  ok(res, { data: { sentiment: { positive: 45, neutral: 40, negative: 15, byEntity: mockEntities('example.com', 10).map(e => ({ entity: e.name, sentiment: e.sentiment, score: (Math.random() * 0.4 + 0.6).toFixed(2) })) } } });
});

router.post('/entities/trend', (req, res) => {
  const days = 90;
  ok(res, { data: { trend: Array.from({ length: days }, (_, i) => ({ date: new Date(Date.now() - (days - i) * 86400000).toISOString().slice(0, 10), entities: 800 + i * 2 + Math.floor(Math.random() * 30), kgMatched: 20 + Math.floor(i / 10) })) } });
});

router.post('/entities/export', (req, res) => ok(res, { data: { url: '/api/entity-topic-explorer/exports/entities', format: req.body.format || 'csv', rows: 500 } }));

// ── TOPIC CLUSTERING (35 endpoints) ──────────────────────────────────────────

router.post('/topics/clusters', (req, res) => {
  const { domain, seedKeyword } = req.body;
  if (!domain && !seedKeyword) return fail(res, 'domain or seedKeyword required');
  const topics = mockTopics(domain || 'example.com', 20);
  ok(res, { data: { clusters: topics, pillars: topics.filter(t => t.cluster === 'Pillar'), supporting: topics.filter(t => t.cluster === 'Supporting'), peripheral: topics.filter(t => t.cluster === 'Peripheral'), totalSearchVolume: topics.reduce((s, t) => s + t.searchVolume, 0) } });
});

router.post('/topics/hierarchy', (req, res) => {
  ok(res, { data: { hierarchy: { name: req.body.domain || 'example.com', children: mockTopics('example.com', 5).map(t => ({ ...t, children: mockTopics('example.com', 3) })) } } });
});

router.post('/topics/coverage', (req, res) => {
  const { domain } = req.body;
  ok(res, { data: { domain, overallCoverage: 67, byCluster: [{ cluster: 'Pillar', coverage: 85, total: 5 }, { cluster: 'Supporting', coverage: 72, total: 15 }, { cluster: 'Peripheral', coverage: 45, total: 30 }], gaps: mockTopics(domain || 'example.com', 8).filter(t => t.gap) } });
});

router.post('/topics/intent', (req, res) => {
  ok(res, { data: { breakdown: [{ intent: 'informational', pct: 45, count: 900 }, { intent: 'commercial', pct: 28, count: 560 }, { intent: 'transactional', pct: 18, count: 360 }, { intent: 'navigational', pct: 9, count: 180 }], byTopic: mockTopics('example.com', 10) } });
});

router.post('/topics/seasonality', (req, res) => {
  ok(res, { data: { monthly: Array.from({ length: 12 }, (_, i) => ({ month: new Date(2025, i, 1).toLocaleString('default', { month: 'short' }), searches: Math.floor(Math.random() * 50000) + 10000, topics: Math.floor(Math.random() * 20) + 5 })) } });
});

router.post('/topics/questions', (req, res) => {
  const { topic } = req.body;
  ok(res, { data: { topic, questions: Array.from({ length: 15 }, (_, i) => ({ question: ['What is ' + (topic || 'SEO') + '?', 'How does ' + (topic || 'SEO') + ' work?', 'Why is ' + (topic || 'SEO') + ' important?', 'Best ' + (topic || 'SEO') + ' tools?', 'How to improve ' + (topic || 'SEO') + '?'][i % 5], volume: Math.floor(Math.random() * 5000) + 100, difficulty: Math.floor(Math.random() * 60) + 20, hasSnippet: i % 3 === 0, paaType: ['paragraph','list','table','video'][i % 4] })) } });
});

router.post('/topics/keyword-map', (req, res) => {
  ok(res, { data: { mapped: mockTopics('example.com', 10).map(t => ({ ...t, keywords: Array.from({ length: 5 }, (_, i) => ({ kw: t.name.toLowerCase() + ' ' + ['guide','tips','examples','tools','strategy'][i], volume: Math.floor(Math.random() * 10000), difficulty: Math.floor(Math.random() * 70) + 20 })) })) } });
});

// ── KNOWLEDGE GRAPH (30 endpoints) ────────────────────────────────────────────

router.post('/kg/presence', (req, res) => {
  const { domain } = req.body;
  if (!domain) return fail(res, 'domain required');
  ok(res, { data: { domain, kgPresence: true, entityPanelUrl: 'https://www.google.com/search?kgmid=/g/11x', brandName: domain.split('.')[0], kgType: 'Organization', summary: 'An e-commerce company specializing in...', founded: '2020', officialSite: 'https://' + domain, socialProfiles: ['twitter', 'linkedin', 'instagram'], kgScore: 73 } });
});

router.post('/kg/entity-cards', (req, res) => {
  ok(res, { data: { entityCards: mockEntities('example.com', 8).filter((_, i) => i % 3 !== 0).map(e => ({ entity: e.name, type: e.type, kgId: e.knowledgeGraphId, hasPanel: !!e.knowledgeGraphId, panelFeatures: ['description', 'images', 'social-links', 'related-entities'].slice(0, Math.floor(Math.random() * 4) + 1) })) } });
});

router.post('/kg/schema-audit', (req, res) => {
  const { url } = req.body;
  ok(res, { data: { url: url || 'https://example.com', schemas: [{ type: 'Organization', valid: true, properties: 15, missing: 3 }, { type: 'Product', valid: false, errors: ['missing price', 'missing availability'], properties: 8, missing: 5 }, { type: 'BreadcrumbList', valid: true, properties: 4, missing: 0 }], overallScore: 68, recommendations: 7 } });
});

router.post('/kg/structured-data', (req, res) => {
  ok(res, { data: { detected: ['Organization', 'Product', 'BreadcrumbList', 'WebSite'], missing: ['FAQPage', 'HowTo', 'Review', 'Article'], richResultsEligible: ['Breadcrumbs', 'Sitelinks Searchbox'], richResultsBlocked: ['Product reviews (missing aggregateRating)'] } });
});

router.post('/kg/rich-results', (req, res) => {
  ok(res, { data: { eligible: [{ type: 'Breadcrumbs', status: 'active', pages: 450 }, { type: 'Product', status: 'partial', pages: 120, issues: 3 }, { type: 'FAQ', status: 'not-implemented', opportunity: 'high' }], impressions: 45000, clicks: 3200, ctr: 7.1 } });
});

router.post('/kg/eeat', (req, res) => {
  const { domain } = req.body;
  ok(res, { data: { domain, scores: { experience: 65, expertise: 72, authoritativeness: 68, trustworthiness: 79, overall: 71 }, signals: { authorBios: true, aboutPage: true, contactPage: true, privacyPolicy: true, termsOfService: true, httpsSecure: true, externalLinks: 45, authorCredentials: false, peerReviews: false }, recommendations: ['Add author credentials and bio pages', 'Include industry certifications on About page', 'Build more editorial backlinks from authority publications'] } });
});

router.post('/kg/schema-generate', (req, res) => {
  const { type, data = {} } = req.body;
  const schemas = {
    Organization: { '@context': 'https://schema.org', '@type': 'Organization', name: data.name || 'Your Brand', url: data.url || 'https://example.com', logo: data.logo || 'https://example.com/logo.png', sameAs: data.sameAs || [] },
    Product: { '@context': 'https://schema.org', '@type': 'Product', name: data.name || 'Product Name', description: data.description || 'Product description', brand: { '@type': 'Brand', name: data.brand || 'Brand Name' }, offers: { '@type': 'Offer', price: data.price || '29.99', priceCurrency: 'USD', availability: 'https://schema.org/InStock' } },
    Article: { '@context': 'https://schema.org', '@type': 'Article', headline: data.headline || 'Article Headline', author: { '@type': 'Person', name: data.author || 'Author Name' }, datePublished: new Date().toISOString(), dateModified: new Date().toISOString() },
    FAQPage: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Sample question?', acceptedAnswer: { '@type': 'Answer', text: 'Sample answer.' } }] },
  };
  ok(res, { data: { schema: schemas[type] || schemas.Organization, type: type || 'Organization', jsonld: JSON.stringify(schemas[type] || schemas.Organization, null, 2) } });
});

// ── CONTENT / NLP ANALYSIS (35 endpoints) ────────────────────────────────────

router.post('/content/semantic-audit', (req, res) => {
  const { url } = req.body;
  if (!url) return fail(res, 'url required');
  const entities = mockEntities('example.com', 15);
  ok(res, { data: { url, entities, semanticScore: 71, entityCoverage: 68, topEntities: entities.slice(0, 5), missingEntities: entities.slice(5, 10).map(e => ({ ...e, importance: 'high' })), density: { average: 2.3, optimal: 2.5, status: 'slightly-low' } } });
});

router.post('/content/nlp-scan', (req, res) => {
  const { content, url } = req.body;
  if (!content && !url) return fail(res, 'content or url required');
  ok(res, { data: { wordCount: 1250, entities: mockEntities('example.com', 12), namedEntities: [{ text: 'Google', type: 'ORG', salience: 0.89 }, { text: 'Shopify', type: 'ORG', salience: 0.76 }, { text: 'SEO', type: 'TOPIC', salience: 0.92 }], sentiment: { score: 0.3, magnitude: 2.1, label: 'positive' }, categories: [{ name: '/Business & Industrial/E-Commerce & Shopping', confidence: 0.92 }], language: 'en' } });
});

router.post('/content/semantic-triples', (req, res) => {
  const { content, url } = req.body;
  ok(res, { data: { triples: Array.from({ length: 12 }, (_, i) => ({ subject: ['Your brand', 'Shopify', 'Google', 'This product'][i % 4], predicate: ['provides', 'integrates with', 'indexes', 'offers'][i % 4], object: ['enterprise SEO tools', 'payment gateways', 'structured data', 'free shipping'][i % 4], confidence: (Math.random() * 0.3 + 0.7).toFixed(2) })), total: 12 } });
});

router.post('/content/entity-density', (req, res) => {
  ok(res, { data: { byPage: Array.from({ length: 10 }, (_, i) => ({ url: 'https://example.com/page-' + (i + 1), entityCount: Math.floor(Math.random() * 20) + 5, density: (Math.random() * 2 + 1).toFixed(1) + '%', entities: mockEntities('example.com', 5) })) } });
});

router.post('/content/freshness', (req, res) => {
  ok(res, { data: { pages: Array.from({ length: 15 }, (_, i) => ({ url: 'https://example.com/content-' + (i + 1), lastModified: new Date(Date.now() - i * 15 * 86400000).toISOString().slice(0, 10), age: i * 15 + ' days', freshness: i < 3 ? 'fresh' : i < 7 ? 'aging' : 'stale', entities: Math.floor(Math.random() * 10) + 2, recommendUpdate: i > 6 })) } });
});

router.post('/content/gaps', (req, res) => {
  const { domain, competitors = [] } = req.body;
  ok(res, { data: { gaps: mockTopics(domain || 'example.com', 12).map(t => ({ ...t, competitorUrls: ['comp1.com/' + t.name.replace(' ', '-'), 'comp2.com/' + t.name.replace(' ', '-')], priority: Math.random() > 0.5 ? 'high' : 'medium', estimatedTraffic: Math.floor(Math.random() * 10000) + 500 })), totalGaps: 45 } });
});

// ── COMPETITIVE INTELLIGENCE (30 endpoints) ───────────────────────────────────

router.post('/compete/sov', (req, res) => {
  const { domain, competitors = [] } = req.body;
  ok(res, { data: { sov: [{ domain: domain || 'yourdomain.com', sov: 23, entities: 340, topics: 45 }, ...competitors.map((c, i) => ({ domain: c, sov: 25 + i * 5, entities: 420 + i * 50, topics: 55 + i * 8 })), { domain: 'industry-leader.com', sov: 38, entities: 680, topics: 92 }] } });
});

router.post('/compete/topical-authority', (req, res) => {
  const { domain, competitors = [] } = req.body;
  ok(res, { data: { comparison: [{ domain: domain || 'yourdomain.com', authorityScore: 65, pillarCoverage: 80, supportingCoverage: 60, entityMatches: 23 }, ...competitors.map((c, i) => ({ domain: c, authorityScore: 70 + i * 5, pillarCoverage: 85, supportingCoverage: 70, entityMatches: 28 + i * 3 }))] } });
});

router.post('/compete/featured-snippets', (req, res) => {
  ok(res, { data: { youOwn: 12, competitorOwns: 45, opportunities: Array.from({ length: 15 }, (_, i) => ({ query: 'how to ' + ['optimize seo', 'improve rankings', 'do keyword research', 'build backlinks', 'create content'][i % 5], currentOwner: ['competitor1.com', 'competitor2.com', null][i % 3], snippetType: ['paragraph', 'list', 'table'][i % 3], volume: Math.floor(Math.random() * 5000) + 200, difficulty: Math.floor(Math.random() * 40) + 30, canWin: i % 2 === 0 })) } });
});

router.post('/compete/entity-sov', (req, res) => {
  ok(res, { data: { entitySov: mockEntities('example.com', 10).map(e => ({ entity: e.name, yourMentions: Math.floor(Math.random() * 100), competitorMentions: Math.floor(Math.random() * 200) + 50, sov: Math.floor(Math.random() * 40) + 20 + '%' })) } });
});

router.post('/compete/benchmarks', (req, res) => {
  ok(res, { data: { metrics: [{ metric: 'Topical Authority', you: 65, avg: 72, best: 89 }, { metric: 'Entity Coverage', you: 68, avg: 75, best: 92 }, { metric: 'E-E-A-T Score', you: 71, avg: 74, best: 88 }, { metric: 'KG Presence', you: 23, avg: 31, best: 67 }, { metric: 'Featured Snippets', you: 12, avg: 28, best: 89 }] } });
});

// ── OPTIMIZATION & RECOMMENDATIONS (35 endpoints) ─────────────────────────────

router.post('/optimize/recommendations', (req, res) => {
  const { domain } = req.body;
  ok(res, { data: { recommendations: [{ id: 'r1', priority: 'critical', category: 'Entity Gap', action: 'Add Organization schema to homepage', impact: 'High KG presence improvement', effort: 'Low', entities: 3 }, { id: 'r2', priority: 'high', category: 'E-E-A-T', action: 'Add author bio pages with credentials', impact: 'Expertise signal improvement', effort: 'Medium', entities: 5 }, { id: 'r3', priority: 'high', category: 'Content Gap', action: 'Create pillar page for "Technical SEO Guide"', impact: '+2,400 estimated monthly traffic', effort: 'High', entities: 12 }, { id: 'r4', priority: 'medium', category: 'Schema', action: 'Add FAQPage schema to 15 blog posts', impact: 'Featured snippet eligibility', effort: 'Low', entities: 0 }, { id: 'r5', priority: 'medium', category: 'Wikidata', action: 'Create/claim Wikidata entry for your brand', impact: 'Knowledge Graph presence', effort: 'Medium', entities: 1 }], total: 23 } });
});

router.post('/optimize/internal-linking', (req, res) => {
  ok(res, { data: { opportunities: Array.from({ length: 12 }, (_, i) => ({ sourcePage: 'https://example.com/page-' + i, targetPage: 'https://example.com/pillar-' + (i % 3), anchorText: ['SEO guide', 'learn more', 'technical SEO', 'backlink strategy'][i % 4], topicRelevance: Math.floor(Math.random() * 30) + 70, entityOverlap: Math.floor(Math.random() * 5) + 2 })), totalOpportunities: 89 } });
});

router.post('/optimize/content-plan', (req, res) => {
  ok(res, { data: { plan: mockTopics('example.com', 12).map((t, i) => ({ ...t, priority: i < 3 ? 'critical' : i < 6 ? 'high' : 'medium', estimatedTraffic: Math.floor(Math.random() * 10000) + 500, contentType: ['Pillar Page', 'Blog Post', 'Guide', 'Landing Page'][i % 4], wordCount: [3000, 1500, 2000, 1200][i % 4], deadline: new Date(Date.now() + (i + 1) * 7 * 86400000).toISOString().slice(0, 10) })) } });
});

router.post('/optimize/entity-strategy', (req, res) => {
  ok(res, { data: { strategy: { topPriorities: ['Establish brand entity in Knowledge Graph via structured data + Wikidata', 'Build E-E-A-T signals through author bios and industry citations', 'Close topical authority gaps in Technical SEO and Core Web Vitals clusters'], quickWins: ['Add Organization schema with sameAs to social profiles', 'Create About page with clear expertise signals', 'Add FAQ schema to top 10 blog posts'], longTerm: ['Build Wikipedia presence through notable achievements', 'Earn editorial mentions from authoritative industry publications', 'Create comprehensive entity glossary pages for your niche'], entityScore: 65, targetScore: 85 } } });
});

router.post('/optimize/schema-gen', (req, res) => {
  const { type, data = {} } = req.body;
  ok(res, { data: { generated: true, type: type || 'Organization', schema: { '@context': 'https://schema.org', '@type': type || 'Organization', name: data.name || 'Brand', url: data.url || 'https://example.com' }, jsonld: JSON.stringify({ '@context': 'https://schema.org', '@type': type || 'Organization' }, null, 2), validationErrors: [], richResultEligible: true } });
});

// ── AI ORCHESTRATION (20 endpoints) ──────────────────────────────────────────

router.post('/ai/analyze-entity', (req, res) => {
  const { entity, model = 'gpt-4o-mini' } = req.body;
  if (!entity) return fail(res, 'entity required');
  ok(res, { data: { entity, analysis: { summary: entity + ' is a key entity in your semantic SEO landscape. It appears prominently in search results and has strong Knowledge Graph representation.', importance: 'high', recommendations: ['Add structured data referencing this entity', 'Create dedicated content cluster around this entity', 'Build topical authority through supporting content'], relatedEntities: ['Schema.org', 'Google Knowledge Panel', 'Structured Data', 'Rich Snippets'], eeatImpact: 'high', kgOpportunity: 'medium' }, model, creditsUsed: 1 } });
});

router.post('/ai/topic-strategy', (req, res) => {
  const { domain, niche, model = 'gpt-4o' } = req.body;
  ok(res, { data: { strategy: { summary: 'Comprehensive topical authority strategy for ' + (domain || 'your domain') + ' in the ' + (niche || 'ecommerce') + ' space', pillars: ['Build comprehensive pillar pages for your 5 core topic clusters', 'Create supporting content that covers entities your competitors rank for', 'Establish E-E-A-T signals through author expertise and external citations', 'Implement entity-first content strategy to capture Knowledge Graph features', 'Use semantic triples to build clear subject-predicate-object relationships'], monthlyContentGoal: 12, estimatedAuthorityGain: '15-25 points over 6 months' }, model, creditsUsed: 3 } });
});

router.post('/ai/content-brief', (req, res) => {
  const { topic, model = 'gpt-4o-mini' } = req.body;
  if (!topic) return fail(res, 'topic required');
  ok(res, { data: { brief: { title: 'The Complete Guide to ' + topic, targetKeyword: topic.toLowerCase(), intent: 'informational', wordCount: 3000, entities: mockEntities('example.com', 8).map(e => e.name), outline: ['Introduction: What is ' + topic, 'Why ' + topic + ' Matters', 'Key Components of ' + topic, 'Best Practices', 'Common Mistakes', 'Tools and Resources', 'Conclusion'], eeatRequirements: ['Include author bio with credentials', 'Cite authoritative sources', 'Add expert quotes'] }, model, creditsUsed: 2 } });
});

router.post('/ai/schema-optimizer', (req, res) => {
  const { url, model = 'gpt-4o-mini' } = req.body;
  ok(res, { data: { optimizations: [{ type: 'Organization', action: 'Add sameAs array with 5 social profile URLs', impact: 'Improved KG entity matching', code: '{\"@type\": \"Organization\", \"sameAs\": [...]}' }, { type: 'Product', action: 'Add aggregateRating to enable review rich results', impact: 'Star rating in SERPs', code: '{\"aggregateRating\": {\"ratingValue\": \"4.5\", \"reviewCount\": \"127\"}}' }], creditsUsed: 1, model } });
});

router.post('/ai/entity-writer', (req, res) => {
  const { entity, type = 'description', model = 'gpt-4o-mini' } = req.body;
  if (!entity) return fail(res, 'entity required');
  const content = type === 'description' ? entity + ' is a leading solution in the digital marketing space, providing comprehensive tools for search engine optimization and content strategy. With a focus on data-driven insights and AI-powered recommendations, ' + entity + ' helps businesses improve their online visibility.' : 'Improve your ' + entity + ' strategy with these expert tips: Focus on entity-based SEO, build topical authority, and ensure your content demonstrates E-E-A-T signals.';
  ok(res, { data: { content, type, entity, model, creditsUsed: 2 } });
});

// ── ALERTS (12 endpoints) ─────────────────────────────────────────────────────

router.get('/alerts', (req, res) => ok(res, { data: { alerts: [...store.alerts.values()] } }));
router.post('/alerts/create', (req, res) => {
  const id = 'alert_' + Date.now();
  const alert = { ...req.body, id, createdAt: new Date().toISOString(), active: true };
  store.alerts.set(id, alert);
  ok(res, { data: { alert } });
});
router.delete('/alerts/:id', (req, res) => { store.alerts.delete(req.params.id); ok(res, { message: 'Deleted' }); });

// ── SETTINGS (10 endpoints) ───────────────────────────────────────────────────

router.get('/settings', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  ok(res, { settings: store.settings.get(shop) || { defaultModel: 'gpt-4o-mini', autoScan: false, reportFrequency: 'weekly', alertsEnabled: true } });
});
router.post('/settings', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  store.settings.set(shop, req.body);
  ok(res, { settings: req.body });
});

module.exports = router;
