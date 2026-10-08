'use strict';

const CONTEXT = 'https://schema.org';

const clean = (o) => {
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && !v.length) continue;
    out[k] = v;
  }
  return out;
};

const plain = (s, max = 5000) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

function buildProductSchema(p, { currency, url }) {
  const v = (p.variants && p.variants.nodes && p.variants.nodes[0]) || {};
  const images = [p.featuredImage && p.featuredImage.url, ...((p.images && p.images.nodes) || []).map(i => i.url)].filter(Boolean);
  return clean({
    '@context': CONTEXT,
    '@type': 'Product',
    name: p.title,
    description: plain(p.description, 500),
    image: [...new Set(images)].slice(0, 6),
    sku: v.sku,
    gtin: v.barcode,
    brand: p.vendor ? { '@type': 'Brand', name: p.vendor } : undefined,
    url,
    offers: v.price !== undefined ? clean({
      '@type': 'Offer',
      url,
      price: String(v.price),
      priceCurrency: currency,
      availability: v.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    }) : undefined,
  });
}

function buildArticleSchema(a, { url, publisherName, publisherLogo }) {
  return clean({
    '@context': CONTEXT,
    '@type': 'Article',
    headline: String(a.title || '').slice(0, 110),
    description: plain(a.summary || a.body, 300),
    image: a.image && a.image.url ? [a.image.url] : undefined,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt || a.publishedAt,
    author: a.author && a.author.name ? { '@type': 'Person', name: a.author.name } : undefined,
    publisher: publisherName ? clean({ '@type': 'Organization', name: publisherName, logo: publisherLogo ? { '@type': 'ImageObject', url: publisherLogo } : undefined }) : undefined,
    mainEntityOfPage: url ? { '@type': 'WebPage', '@id': url } : undefined,
  });
}

function buildOrganizationSchema({ name, url, logo, sameAs = [] }) {
  return clean({ '@context': CONTEXT, '@type': 'Organization', name, url, logo, sameAs: sameAs.filter(Boolean) });
}

function buildBreadcrumbSchema(items) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => clean({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

function buildFaqSchema(questions) {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: String(q.question).trim(),
      acceptedAnswer: { '@type': 'Answer', text: String(q.answer).trim() },
    })),
  };
}

const issue = (level, message) => ({ level, message });

const asArray = (v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]);

/** Checks required (error) and recommended (warning) properties against Google's rich result docs. */
function validateSchema(input) {
  let data = input;
  if (typeof input === 'string') {
    const m = /<script[^>]*>([\s\S]*?)<\/script>/i.exec(input);
    try {
      data = JSON.parse((m ? m[1] : input).trim());
    } catch (e) {
      return { valid: false, types: [], issues: [issue('error', `Not valid JSON: ${e.message}`)] };
    }
  }
  const nodes = [];
  const collect = (n) => {
    if (Array.isArray(n)) return n.forEach(collect);
    if (n && typeof n === 'object') {
      if (n['@graph']) collect(n['@graph']);
      else nodes.push(n);
    }
  };
  collect(data);
  if (!nodes.length) return { valid: false, types: [], issues: [issue('error', 'No structured data object found')] };

  const issues = [];
  const types = [];
  for (const n of nodes) {
    const type = asArray(n['@type'])[0];
    if (!type) { issues.push(issue('error', 'Missing @type')); continue; }
    types.push(type);
    const need = (k, lvl = 'error') => { if (n[k] === undefined || n[k] === '' || (Array.isArray(n[k]) && !n[k].length)) issues.push(issue(lvl, `${type}: missing "${k}"`)); };
    if (!n['@context']) issues.push(issue('warning', `${type}: missing @context`));
    if (type === 'Product') {
      need('name');
      if (!n.offers && !n.review && !n.aggregateRating) issues.push(issue('error', 'Product: needs offers, review or aggregateRating'));
      ['image', 'description', 'sku', 'brand'].forEach(k => need(k, 'warning'));
      for (const o of asArray(n.offers)) {
        if (o.price === undefined) issues.push(issue('error', 'Product offer: missing "price"'));
        if (!o.priceCurrency) issues.push(issue('error', 'Product offer: missing "priceCurrency"'));
        if (!o.availability) issues.push(issue('warning', 'Product offer: missing "availability"'));
      }
    } else if (/^(Article|BlogPosting|NewsArticle)$/.test(type)) {
      need('headline'); ['image', 'datePublished', 'author'].forEach(k => need(k, 'warning'));
      if (n.headline && String(n.headline).length > 110) issues.push(issue('warning', 'Article: headline longer than 110 characters'));
    } else if (type === 'Organization') {
      need('name'); need('url', 'warning'); need('logo', 'warning');
    } else if (type === 'BreadcrumbList') {
      const list = asArray(n.itemListElement);
      if (!list.length) issues.push(issue('error', 'BreadcrumbList: no itemListElement'));
      list.forEach((it, i) => { if (it.position === undefined || !it.name) issues.push(issue('error', `BreadcrumbList: item ${i + 1} needs position and name`)); });
    } else if (type === 'FAQPage') {
      const list = asArray(n.mainEntity);
      if (!list.length) issues.push(issue('error', 'FAQPage: no mainEntity questions'));
      list.forEach((q, i) => { if (!q.name || !(q.acceptedAnswer && q.acceptedAnswer.text)) issues.push(issue('error', `FAQPage: question ${i + 1} needs name and acceptedAnswer.text`)); });
    }
  }
  return { valid: !issues.some(i => i.level === 'error'), types, issues };
}

function toScriptTag(schema) {
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2).replace(/</g, '\\u003c')}\n</script>`;
}

module.exports = {
  buildProductSchema, buildArticleSchema, buildOrganizationSchema, buildBreadcrumbSchema, buildFaqSchema,
  validateSchema, toScriptTag,
};
