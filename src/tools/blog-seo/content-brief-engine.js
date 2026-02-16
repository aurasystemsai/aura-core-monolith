const crypto = require('crypto');

const briefStore = new Map();
const briefVersions = new Map();

function createId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function createBrief(payload = {}) {
  const id = payload.id || createId('brief');
  const brief = {
    id,
    title: payload.title || 'Enterprise Blog SEO Brief',
    primaryKeyword: payload.primaryKeyword || 'blog seo',
    secondaryKeywords: payload.secondaryKeywords || ['seo checklist', 'blog optimization'],
    persona: payload.persona || 'Content Lead',
    objective: payload.objective || 'Increase organic traffic and conversions',
    tone: payload.tone || 'Confident and clear',
    status: payload.status || 'draft',
    h1: payload.h1 || 'The Ultimate Blog SEO Guide',
    metaDescription: payload.metaDescription || 'Optimize blogs with SEO research, internal linking, and AI orchestration.',
    outline: payload.outline || [
      { heading: 'Introduction', wordCount: 150 },
      { heading: 'Keyword Strategy', wordCount: 250 },
      { heading: 'On-page Checklist', wordCount: 250 },
      { heading: 'Distribution', wordCount: 200 },
    ],
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    compliance: { claims: 'pending', pii: 'clean', legal: 'pending' },
  };
  briefStore.set(id, brief);
  briefVersions.set(id, [{ versionId: createId('version'), title: brief.title, createdAt: brief.createdAt }]);
  return brief;
}

function getBrief(id) {
  if (!briefStore.has(id)) {
    throw new Error('Brief not found');
  }
  return briefStore.get(id);
}

function listBriefs() {
  return Array.from(briefStore.values());
}

function scoreBrief(id, payload = {}) {
  const brief = getBrief(id);
  const keywordStrength = Math.min(100, (brief.primaryKeyword || '').length * 2 + 60);
  const outlineDepth = Math.min(100, brief.outline.reduce((acc, s) => acc + (s.wordCount || 0), 0) / 20);
  const compliance = brief.compliance?.claims === 'clear' ? 100 : 80;
  const score = Math.round(keywordStrength * 0.4 + outlineDepth * 0.35 + compliance * 0.25);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
  return {
    briefId: id,
    score,
    grade,
    keywordStrength,
    outlineDepth,
    compliance,
    suggestions: payload.suggestions || ['Tighten meta description', 'Add FAQ rich results', 'Expand internal links'],
  };
}

function versionBrief(id, name = 'v2') {
  const brief = getBrief(id);
  const version = { versionId: createId('version'), name, snapshot: { ...brief }, createdAt: new Date().toISOString() };
  const versions = briefVersions.get(id) || [];
  versions.push(version);
  briefVersions.set(id, versions);
  return version;
}

function listVersions(id) {
  return briefVersions.get(id) || [];
}

function getCompliance(id) {
  const brief = getBrief(id);
  const claimsClear = (brief.compliance?.claims || 'pending') === 'clear';
  const status = claimsClear ? 'approved' : 'pending';
  return {
    briefId: id,
    status,
    checks: [
      { name: 'Claims', status: claimsClear ? 'pass' : 'review' },
      { name: 'PII', status: brief.compliance?.pii || 'unknown' },
      { name: 'Tone', status: 'pass' },
    ],
  };
}

function getStats() {
  return {
    totalBriefs: briefStore.size,
    statuses: Array.from(briefStore.values()).reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {}),
  };
}

module.exports = {
  createBrief,
  getBrief,
  listBriefs,
  scoreBrief,
  versionBrief,
  listVersions,
  getCompliance,
  getStats,
};
