'use strict';
/**
 * Schema & Structured Data Engine — Technical SEO Auditor
 * Validates JSON-LD, Microdata, and RDFa; checks schema.org types
 * most relevant to Shopify: Product, Article, FAQPage, BreadcrumbList,
 * Organization, WebSite, LocalBusiness.
 */

// ── Shopify-relevant schema types ─────────────────────────────────────────
const SCHEMA_RULES = {
  Product: {
    required: ['name', 'image', 'offers'],
    recommended: ['description', 'brand', 'sku', 'gtin', 'aggregateRating'],
    offerRequired: ['price', 'priceCurrency', 'availability'],
  },
  Article: { required: ['headline', 'author', 'datePublished'], recommended: ['image', 'publisher', 'dateModified', 'description'] },
  BlogPosting: { required: ['headline', 'author', 'datePublished'], recommended: ['image', 'publisher', 'dateModified', 'url'] },
  FAQPage: { required: ['mainEntity'], recommended: [] },
  BreadcrumbList: { required: ['itemListElement'], recommended: [] },
  Organization: { required: ['name', 'url'], recommended: ['logo', 'contactPoint', 'sameAs'] },
  WebSite: { required: ['url', 'name'], recommended: ['potentialAction'] },
  LocalBusiness: { required: ['name', 'address', 'telephone'], recommended: ['geo', 'openingHours', 'image'] },
  SearchAction: { required: ['target', 'query-input'], recommended: [] },
};

// Rich result types Shopify merchants can earn
const RICH_RESULT_TYPES = {
  Product: { feature: 'Product snippet', benefit: 'Shows price, availability, reviews in SERP' },
  FAQPage: { feature: 'FAQ rich result', benefit: 'Expands result with Q&A accordion in SERP' },
  BreadcrumbList: { feature: 'Breadcrumb', benefit: 'Shows navigation path below URL in SERP' },
  Article: { feature: 'Article', benefit: 'Shows headline, date, author image for articles' },
  WebSite: { feature: 'Sitelinks searchbox', benefit: 'Enables internal search in Google SERP' },
};

// ── JSON-LD parser ────────────────────────────────────────────────────────
function extractJsonLd(html) {
  const schemas = [];
  const errors = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  let idx = 0;
  while ((m = re.exec(html)) !== null) {
    idx++;
    try {
      const raw = m[1].trim();
      const parsed = JSON.parse(raw);
      const items = parsed['@graph'] ? parsed['@graph'] : [parsed];
      items.forEach(item => {
        schemas.push({ source: 'json-ld', blockIndex: idx, data: item, type: getType(item) });
      });
    } catch (e) {
      errors.push({ blockIndex: idx, error: `JSON parse error: ${e.message}`, preview: m[1].slice(0, 100) });
    }
  }
  return { schemas, errors };
}

function getType(item) {
  if (Array.isArray(item['@type'])) return item['@type'][0];
  return item['@type'] || 'Unknown';
}

// ── Microdata detection ────────────────────────────────────────────────────
function detectMicrodata(html) {
  const types = [];
  const re = /itemtype=["']https?:\/\/schema\.org\/([A-Za-z]+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) types.push(m[1]);
  return { hasMicrodata: types.length > 0, types: [...new Set(types)] };
}

// ── Schema validation ─────────────────────────────────────────────────────
function validateSchema(item) {
  const type = getType(item);
  const rules = SCHEMA_RULES[type];
  const issues = [];
  const warnings = [];

  if (!item['@context']) issues.push({ severity: 'error', msg: 'Missing @context — should be "https://schema.org"' });
  if (item['@context'] && !item['@context'].includes('schema.org')) {
    issues.push({ severity: 'warning', msg: `@context "${item['@context']}" may not be recognized.` });
  }

  if (!rules) return { type, valid: issues.length === 0, issues, warnings, richResultEligible: false, richResult: null };

  rules.required.forEach(field => {
    if (!item[field]) issues.push({ severity: 'error', msg: `Missing required field: ${field}` });
  });
  rules.recommended.forEach(field => {
    if (!item[field]) warnings.push(`Missing recommended field: ${field}`);
  });

  // Type-specific deep validation
  if (type === 'Product' && item.offers) {
    const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
    offers.forEach((offer, i) => {
      SCHEMA_RULES.Product.offerRequired.forEach(f => {
        if (!offer[f]) issues.push({ severity: 'error', msg: `offers[${i}] missing: ${f}` });
      });
      if (offer.price && isNaN(parseFloat(offer.price))) {
        issues.push({ severity: 'error', msg: `offers[${i}].price "${offer.price}" is not a number.` });
      }
    });
  }

  if (type === 'FAQPage') {
    const qs = item.mainEntity;
    if (!Array.isArray(qs) || qs.length === 0) {
      issues.push({ severity: 'error', msg: 'mainEntity must be a non-empty array of Question objects.' });
    } else {
      qs.forEach((q, i) => {
        if (q['@type'] !== 'Question') warnings.push(`mainEntity[${i}] should have @type: "Question"`);
        if (!q.name) issues.push({ severity: 'error', msg: `mainEntity[${i}] missing: name (question text)` });
        if (!q.acceptedAnswer?.text) issues.push({ severity: 'error', msg: `mainEntity[${i}] missing: acceptedAnswer.text` });
      });
    }
  }

  if (type === 'BreadcrumbList') {
    const items = item.itemListElement;
    if (!Array.isArray(items) || items.length === 0) {
      issues.push({ severity: 'error', msg: 'itemListElement must be a non-empty array.' });
    } else {
      items.forEach((bc, i) => {
        if (!bc.position) issues.push({ severity: 'error', msg: `itemListElement[${i}] missing: position` });
        if (!bc.item?.['@id'] && !bc.item) warnings.push(`itemListElement[${i}] missing item URL`);
        if (!bc.name) warnings.push(`itemListElement[${i}] missing name`);
      });
    }
  }

  const richResult = RICH_RESULT_TYPES[type] || null;
  const richResultEligible = issues.filter(i => i.severity === 'error').length === 0;

  return { type, valid: issues.filter(i => i.severity === 'error').length === 0, issues, warnings, richResultEligible, richResult };
}

// ── Missing schema opportunities ──────────────────────────────────────────
function getMissingSchemaOpportunities(html, existingTypes) {
  const opportunities = [];

  // Product pages
  if (html.includes('data-product-id') || html.includes('/products/')) {
    if (!existingTypes.includes('Product')) {
      opportunities.push({ type: 'Product', benefit: 'Shows price + availability in Google Shopping', priority: 'high' });
    }
  }
  // Blog/Article pages
  if (html.includes('/blogs/') || html.includes('article') || html.includes('blog-post')) {
    if (!existingTypes.some(t => ['Article', 'BlogPosting'].includes(t))) {
      opportunities.push({ type: 'BlogPosting', benefit: 'Enables article rich result with author/date in SERP', priority: 'medium' });
    }
  }
  // All pages — BreadcrumbList
  if (!existingTypes.includes('BreadcrumbList')) {
    opportunities.push({ type: 'BreadcrumbList', benefit: 'Shows navigation path in SERP below URL', priority: 'high' });
  }
  // FAQ detection
  const hasFAQ = html.includes('FAQ') || html.includes('faq') || (html.match(/<h[23][^>]*>[^<]*\?<\/h[23]>/gi) || []).length >= 2;
  if (hasFAQ && !existingTypes.includes('FAQPage')) {
    opportunities.push({ type: 'FAQPage', benefit: 'Q&A accordion in SERP can double click-through rates', priority: 'high' });
  }
  // WebSite (for homepage)
  if (!existingTypes.includes('WebSite')) {
    opportunities.push({ type: 'WebSite', benefit: 'Enables Sitelinks Searchbox in Google', priority: 'low' });
  }

  return opportunities;
}

// ── Full analysis ─────────────────────────────────────────────────────────
function analyzeStructuredData(html) {
  const { schemas, errors: parseErrors } = extractJsonLd(html);
  const microdata = detectMicrodata(html);

  const validations = schemas.map(s => ({ ...validateSchema(s.data), source: s.source, blockIndex: s.blockIndex }));
  const existingTypes = [...new Set(validations.map(v => v.type))];
  const opportunities = getMissingSchemaOpportunities(html, existingTypes);

  const totalIssues = validations.reduce((s, v) => s + v.issues.filter(i => i.severity === 'error').length, 0);
  const richResultEligibleCount = validations.filter(v => v.richResultEligible).length;
  const totalSchemas = schemas.length;

  const score = totalSchemas === 0 ? 20
    : Math.max(20, Math.round(100 - (totalIssues / Math.max(totalSchemas, 1)) * 30 - parseErrors.length * 10));

  return {
    totalSchemas, existingTypes, validations, parseErrors,
    microdata, opportunities,
    richResultEligibleCount, totalIssues, score,
    hasProductSchema: existingTypes.includes('Product'),
    hasBreadcrumb: existingTypes.includes('BreadcrumbList'),
    hasFAQ: existingTypes.includes('FAQPage'),
    summary: totalSchemas === 0
      ? 'No structured data found. Add Product, BreadcrumbList, and FAQPage schemas for rich results.'
      : `${totalSchemas} schema(s) found. ${richResultEligibleCount} eligible for rich results. ${totalIssues} error(s) to fix.`,
  };
}

// ── Schema generator (template outputs) ──────────────────────────────────
function generateProductSchema({ name, description, image, price, currency = 'USD', url, sku, brand }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name, description, image,
    sku, brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    offers: {
      '@type': 'Offer',
      url, price, priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    },
  };
}

function generateBreadcrumbSchema(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };
}

function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

// ── Store ──────────────────────────────────────────────────────────────────
const _store = new Map();
function saveSchemaRecord(shop, record) {
  const k = shop || 'default';
  if (!_store.has(k)) _store.set(k, []);
  const list = _store.get(k);
  list.unshift({ id: Date.now(), createdAt: new Date().toISOString(), ...record });
  if (list.length > 100) list.splice(100);
  return list[0];
}
function listSchemaHistory(shop, limit = 30) {
  return (_store.get(shop || 'default') || []).slice(0, limit);
}

module.exports = {
  extractJsonLd, detectMicrodata, validateSchema,
  getMissingSchemaOpportunities, analyzeStructuredData,
  generateProductSchema, generateBreadcrumbSchema, generateFAQSchema,
  saveSchemaRecord, listSchemaHistory,
  SCHEMA_RULES, RICH_RESULT_TYPES,
};
