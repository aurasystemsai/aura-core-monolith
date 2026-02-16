// Blog SEO Engine - Enterprise Edition
// Deterministic, offline-safe orchestration of metadata, slugging, and keyword sets

const keywordEngine = require('./keyword-cluster-engine');
const briefEngine = require('./content-brief-engine');
const onpageEngine = require('./onpage-technical-engine');
const aiEngine = require('./ai-orchestration-engine');

exports.meta = {
  id: 'blog-seo',
  name: 'Blog SEO Engine',
  category: 'SEO',
  description: 'Enterprise blog SEO workspace with research, clusters, briefs, on-page checks, and AI routing.',
  version: 'enterprise-1.0.0',
};

function slugify(input = '') {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

function buildOutline(primaryKeyword) {
  return [
    { heading: 'Introduction', wordCount: 150 },
    { heading: 'Why this matters', wordCount: 200 },
    { heading: `${primaryKeyword} strategy`, wordCount: 260 },
    { heading: 'On-page checklist', wordCount: 220 },
    { heading: 'Internal links', wordCount: 180 },
    { heading: 'Distribution and measurement', wordCount: 200 },
  ];
}

exports.run = async function run(input = {}) {
  const {
    productTitle = '',
    productDescription = '',
    brand = 'Aura',
    tone = 'Confident and clear',
    useCases = [],
  } = input;

  if (!productTitle || !productDescription) {
    throw new Error('productTitle and productDescription are required');
  }

  const primaryKeyword = (useCases[0] || productTitle || 'blog seo').toLowerCase();
  const slug = slugify(productTitle);
  const keywords = Array.isArray(useCases) && useCases.length ? useCases.slice(0, 6) : [primaryKeyword, 'seo checklist'];
  const metaDescription = `${productDescription}`.slice(0, 150);

  const cluster = keywordEngine.createCluster({ primaryKeyword, keywords });
  const brief = briefEngine.createBrief({
    title: productTitle,
    primaryKeyword,
    secondaryKeywords: keywords,
    metaDescription,
    outline: buildOutline(primaryKeyword),
  });
  const metadataScore = onpageEngine.analyzeMetadata(productTitle, metaDescription, keywords);
  const orchestration = aiEngine.orchestrateRun({ primaryKeyword, persona: 'Content Lead', strategy: 'best-of-n' });

  return {
    input,
    output: {
      title: productTitle,
      description: productDescription,
      metaDescription,
      slug,
      keywords,
      outline: brief.outline,
      cluster,
      scores: {
        metadata: metadataScore.score,
        intent: 90,
      },
      orchestration,
    },
    model: 'offline-deterministic',
    brand,
    tone,
  };
};
