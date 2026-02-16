const crypto = require('crypto');

function id(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

// Ideation & research
function createIdea(payload = {}) {
  const topic = payload.topic || 'Evergreen blog strategy';
  return {
    ideaId: id('idea'),
    topic,
    angle: payload.angle || 'Playbook',
    audience: payload.audience || 'Content & Growth',
    primaryKeyword: payload.primaryKeyword || 'blog draft',
    summary: payload.summary || 'Deterministic idea generated',
    createdAt: new Date().toISOString(),
  };
}

function intentScore(payload = {}) {
  const alignment = 88;
  const depth = 86;
  const authority = 84;
  const score = Math.round(alignment * 0.4 + depth * 0.35 + authority * 0.25);
  const grade = score >= 90 ? 'A' : 'B';
  return { topic: payload.topic || 'blog draft', score, grade, alignment, depth, authority };
}

// Briefs & outlines
function createBrief(payload = {}) {
  return {
    briefId: id('brief'),
    title: payload.title || 'Enterprise blog draft brief',
    primaryKeyword: payload.primaryKeyword || 'blog draft',
    sections: payload.sections || ['Hook', 'Framework', 'Proof', 'CTA'],
    compliance: { pii: 'clean', claims: 'pending', tone: 'on-brand' },
    createdAt: new Date().toISOString(),
  };
}

function createOutline(payload = {}) {
  const outlineId = id('outline');
  const sections = payload.sections || [
    { heading: 'Hook', notes: 'Lead with tension', words: 120 },
    { heading: 'Framework', notes: 'Explain the approach', words: 220 },
    { heading: 'Proof', notes: 'Add data and quotes', words: 180 },
    { heading: 'CTA', notes: 'One clear CTA', words: 80 },
  ];
  return { outlineId, briefId: payload.briefId || id('brief'), sections, status: 'draft', createdAt: new Date().toISOString() };
}

function gradeOutline(outline) {
  const sections = outline.sections || [];
  const depth = Math.min(100, Math.round(sections.reduce((acc, s) => acc + (s.words || 0), 0) / 18));
  const coverage = Math.min(100, sections.length * 12 + 40);
  const clarity = 82;
  const score = Math.round(depth * 0.45 + coverage * 0.35 + clarity * 0.2);
  const grade = score >= 90 ? 'A' : 'B';
  return { score, grade, coverage, depth, clarity };
}

// Drafting
function generateDraft(payload = {}) {
  const title = payload.title || 'How to scale blog drafting without chaos';
  const primaryKeyword = payload.primaryKeyword || 'blog drafting at scale';
  const sections = payload.sections || [
    { heading: 'Introduction', body: 'Why cadence and quality both matter.', words: 120 },
    { heading: 'Research', body: 'Anchor to ICP and SERP intent.', words: 200 },
    { heading: 'Outline', body: 'Lock structure before writing.', words: 180 },
    { heading: 'Draft', body: 'Keep sentences short and clear.', words: 220 },
    { heading: 'SEO polish', body: 'Metadata, schema, links.', words: 140 },
    { heading: 'QA & Ship', body: 'Checks, approvals, distribution.', words: 160 },
  ];
  const metaDescription = `${title} — practical guide for ${payload.audience || 'content teams'} to ship consistent drafts.`.slice(0, 150);
  const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  const estimatedWordCount = sections.reduce((acc, s) => acc + (s.words || 0), 0);
  return { draftId: id('draft'), title, metaDescription, slug, primaryKeyword, sections, cta: 'Ship with one clear CTA.', estimatedWordCount };
}

// SEO optimizer
function seoScore(draft) {
  const titleLen = draft.title.length;
  const metaLen = draft.metaDescription.length;
  const keyword = draft.primaryKeyword || 'blog drafting';
  const keywordCoverage = keyword.length ? 92 : 70;
  const titleScore = titleLen >= 45 && titleLen <= 60 ? 100 : Math.max(70, 100 - Math.abs(52 - titleLen));
  const metaScore = metaLen >= 130 && metaLen <= 155 ? 100 : Math.max(70, 100 - Math.abs(145 - metaLen));
  const score = Math.round(titleScore * 0.45 + metaScore * 0.35 + keywordCoverage * 0.2);
  const grade = score >= 90 ? 'A' : 'B';
  return { score, grade, titleLen, metaLen, keywordCoverage };
}

// Distribution
function distributionPlan(payload = {}) {
  const channels = payload.channels || [
    { channel: 'Blog', status: 'ready' },
    { channel: 'Email', status: 'qa' },
    { channel: 'LinkedIn', status: 'queued' },
    { channel: 'Partners', status: 'draft' },
    { channel: 'Ads', status: 'pending' },
  ];
  const ready = channels.filter((c) => c.status === 'ready').length;
  const pct = Math.round((ready / channels.length) * 100);
  return { planId: id('plan'), channels, readyPercent: pct };
}

// Collaboration
function createTask(payload = {}) {
  return { taskId: id('task'), title: payload.title || 'Add CTA variants', status: payload.status || 'open', owner: payload.owner || 'Content' };
}

function listActivities() {
  return [
    { id: id('act'), text: 'Outline approved', ts: Date.now() },
    { id: id('act'), text: 'Legal review pending', ts: Date.now() - 2000 },
  ];
}

// Performance
function performanceSnapshot(payload = {}) {
  return {
    contentId: payload.contentId || id('content'),
    views: 12400,
    engagement: 0.44,
    conversions: 0.091,
    forecastLift: 0.24,
  };
}

// AI orchestration
function orchestrateRun(payload = {}) {
  const providers = ['gpt-4', 'claude-3', 'gemini-pro'];
  const route = providers.slice(0, 2);
  return {
    id: id('run'),
    strategy: payload.strategy || 'best-of-n',
    route,
    qualityScore: 94,
    primaryKeyword: payload.primaryKeyword || 'blog draft',
    createdAt: new Date().toISOString(),
  };
}

function runEnsemble(payload = {}) {
  const base = orchestrateRun(payload);
  return { ...base, strategy: 'ensemble', qualityScore: 96 };
}

function statsSnapshot() {
  return {
    ideas: 12,
    briefs: 8,
    outlines: 6,
    drafts: 18,
    seo: { avgScore: 91 },
    distribution: { readyPercent: 68 },
    collaboration: { tasks: 6 },
    performance: { avgViews: 12400 },
    ai: { runs: 3 },
  };
}

module.exports = {
  createIdea,
  intentScore,
  createBrief,
  createOutline,
  gradeOutline,
  generateDraft,
  seoScore,
  distributionPlan,
  createTask,
  listActivities,
  performanceSnapshot,
  orchestrateRun,
  runEnsemble,
  statsSnapshot,
};
