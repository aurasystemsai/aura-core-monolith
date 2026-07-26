'use strict';
/**
 * Knowledge Graph Engine
 * KG Panel detection, schema.org, E-E-A-T signals, rich result eligibility
 */

const KG_PRESENCE = [
  { entity: 'Brand Name', hasKnowledgePanel: false, hasEntityCard: false, wikidataQid: null, schemaType: 'Organization', eeatScore: 62 },
];

const SCHEMA_TEMPLATES = {
  Organization: { '@context': 'https://schema.org', '@type': 'Organization', name: '', url: '', logo: '', sameAs: [] },
  Product: { '@context': 'https://schema.org', '@type': 'Product', name: '', description: '', brand: {}, offers: {} },
  Person: { '@context': 'https://schema.org', '@type': 'Person', name: '', jobTitle: '', affiliation: {}, knowsAbout: [] },
  FAQPage: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] },
  BreadcrumbList: { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [] },
  Article: { '@context': 'https://schema.org', '@type': 'Article', headline: '', author: {}, datePublished: '', dateModified: '' },
};

const RICH_RESULT_ELIGIBILITY = [
  { type: 'FAQ Rich Result', eligible: true, reason: 'FAQPage schema present on 3 pages', impact: '+28% CTR' },
  { type: 'Product Rich Result', eligible: true, reason: 'Product + Offer schema with price', impact: '+42% CTR' },
  { type: 'Review Snippet', eligible: false, reason: 'Missing aggregateRating property', impact: '+35% CTR' },
  { type: 'Breadcrumb', eligible: true, reason: 'BreadcrumbList schema on all pages', impact: '+12% CTR' },
  { type: 'Sitelinks Searchbox', eligible: false, reason: 'WebSite schema with potentialAction missing', impact: '+15% CTR' },
  { type: 'Article Rich Result', eligible: false, reason: 'Author entity not linked to Wikidata', impact: '+18% CTR' },
];

const EEAT_FACTORS = {
  experience: { score: 62, signals: ['product reviews', 'customer photos'], missing: ['video demos', 'expert testing'] },
  expertise: { score: 74, signals: ['about page', 'team bios', 'certifications'], missing: ['author bylines', 'cited research'] },
  authoritativeness: { score: 58, signals: ['GOTS certification badge', 'press mentions'], missing: ['Wikipedia entry', 'Wikidata entity'] },
  trustworthiness: { score: 81, signals: ['SSL', 'privacy policy', 'contact page', 'reviews'], missing: ['BBB accreditation', 'trust badges'] },
};

class KnowledgeGraphEngine {
  constructor(config = {}) {
    this.config = { enableSchemaValidation: true, enrichFromWikidata: true, ...config };
  }

  getKgPresence(domain) {
    return {
      domain,
      entities: KG_PRESENCE,
      summary: {
        entitiesWithPanel: KG_PRESENCE.filter(e => e.hasKnowledgePanel).length,
        entitiesWithCard: KG_PRESENCE.filter(e => e.hasEntityCard).length,
        wikidataLinked: KG_PRESENCE.filter(e => e.wikidataQid).length,
        avgEeatScore: Math.round(KG_PRESENCE.reduce((s, e) => s + e.eeatScore, 0) / KG_PRESENCE.length),
      },
      recommendations: this._kgRecommendations(KG_PRESENCE),
    };
  }

  _kgRecommendations(entities) {
    const recs = [];
    for (const e of entities) {
      if (!e.wikidataQid) recs.push({ entity: e.entity, action: 'Create Wikidata entry', priority: 'high', impact: 'Enables Knowledge Panel eligibility' });
      if (!e.hasKnowledgePanel) recs.push({ entity: e.entity, action: 'Build E-E-A-T signals', priority: 'high', impact: 'Required for Knowledge Panel' });
    }
    return recs;
  }

  getRichResultEligibility() {
    const eligible = RICH_RESULT_ELIGIBILITY.filter(r => r.eligible);
    const ineligible = RICH_RESULT_ELIGIBILITY.filter(r => !r.eligible);
    return { eligible, ineligible, eligibilityRate: Math.round(eligible.length / RICH_RESULT_ELIGIBILITY.length * 100) };
  }

  getEeatAnalysis() {
    const overall = Math.round(Object.values(EEAT_FACTORS).reduce((s, f) => s + f.score, 0) / Object.keys(EEAT_FACTORS).length);
    return {
      overall,
      grade: overall >= 80 ? 'A' : overall >= 70 ? 'B+' : overall >= 60 ? 'B' : 'C',
      factors: EEAT_FACTORS,
      topPriorities: this._getEeatPriorities(),
      estimatedRankingImpact: overall < 70 ? 'High negative impact' : 'Moderate impact',
    };
  }

  _getEeatPriorities() {
    return Object.entries(EEAT_FACTORS)
      .sort(([,a], [,b]) => a.score - b.score)
      .map(([factor, data]) => ({
        factor,
        score: data.score,
        quickWins: data.missing.slice(0, 2),
        estimatedLift: '+' + Math.floor((100 - data.score) * 0.3) + ' points',
      }));
  }

  generateSchema(type, data = {}) {
    const template = SCHEMA_TEMPLATES[type];
    if (!template) return { error: 'Unknown schema type: ' + type };
    return { ...template, ...data, generatedAt: new Date().toISOString() };
  }

  getSchemaTypes() { return Object.keys(SCHEMA_TEMPLATES); }

  validateSchema(schemaJson) {
    try {
      const schema = typeof schemaJson === 'string' ? JSON.parse(schemaJson) : schemaJson;
      const errors = [];
      if (!schema['@context']) errors.push('Missing @context');
      if (!schema['@type']) errors.push('Missing @type');
      if (schema['@type'] === 'Organization' && !schema.url) errors.push('Organization requires url');
      return { valid: errors.length === 0, errors, schema };
    } catch (e) {
      return { valid: false, errors: ['Invalid JSON: ' + e.message] };
    }
  }

  getStructuredDataAudit(url) {
    return {
      url,
      schemasFound: ['Organization', 'BreadcrumbList', 'Product'],
      schemasValid: 2,
      schemasInvalid: 1,
      richResultsEligible: ['FAQ Rich Result', 'Product Rich Result'],
      errors: [{ schema: 'Product', error: 'Missing aggregateRating for Review Snippet eligibility' }],
      score: 68,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new KnowledgeGraphEngine();
module.exports.KnowledgeGraphEngine = KnowledgeGraphEngine;
