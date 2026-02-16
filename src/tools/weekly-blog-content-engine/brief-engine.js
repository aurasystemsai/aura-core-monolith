const crypto = require('crypto');

const briefs = new Map();
const versions = new Map();

function id(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function createBrief(payload = {}) {
  const briefId = payload.briefId || id('brief');
  const brief = {
    briefId,
    title: payload.title || 'Weekly Blog Content Brief',
    theme: payload.theme || 'Awareness',
    primaryKeyword: payload.primaryKeyword || 'weekly blog content',
    personas: payload.personas || ['Content Lead', 'Demand Gen'],
    cadence: payload.cadence || 'weekly',
    status: payload.status || 'draft',
    compliance: { pii: 'clean', claims: 'pending', tone: 'on-brand', ...payload.compliance },
    outline: payload.outline || [
      { heading: 'Hook', notes: 'Lead with tension', wordCount: 120 },
      { heading: 'Framework', notes: 'Explain approach', wordCount: 200 },
      { heading: 'Proof', notes: 'Add data and quotes', wordCount: 160 },
      { heading: 'CTA', notes: 'One clear CTA', wordCount: 80 },
    ],
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  briefs.set(briefId, brief);
  versions.set(briefId, [{ versionId: id('ver'), label: 'v1', createdAt: brief.createdAt }]);
  return brief;
}

function getBrief(briefId) {
  if (!briefs.has(briefId)) throw new Error('Brief not found');
  return briefs.get(briefId);
}

function listBriefs() {
  return Array.from(briefs.values());
}

function scoreBrief(briefId) {
  const brief = getBrief(briefId);
  const keywordStrength = Math.min(100, (brief.primaryKeyword || '').length * 2 + 60);
  const outlineDepth = Math.min(100, brief.outline.reduce((acc, s) => acc + (s.wordCount || 0), 0) / 20);
  const compliance = brief.compliance?.claims === 'clear' ? 100 : 82;
  const score = Math.round(keywordStrength * 0.4 + outlineDepth * 0.35 + compliance * 0.25);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
  return { briefId, score, grade, keywordStrength, outlineDepth, compliance };
}

function versionBrief(briefId, label = 'v2') {
  const brief = getBrief(briefId);
  const version = { versionId: id('ver'), label, snapshot: { ...brief }, createdAt: new Date().toISOString() };
  const list = versions.get(briefId) || [];
  list.push(version);
  versions.set(briefId, list);
  return version;
}

function listVersions(briefId) {
  return versions.get(briefId) || [];
}

function complianceStatus(briefId) {
  const brief = getBrief(briefId);
  const claims = brief.compliance?.claims === 'clear' ? 'pass' : 'review';
  return {
    briefId,
    status: claims === 'pass' ? 'approved' : 'pending',
    checks: [
      { name: 'Claims', status: claims },
      { name: 'PII', status: brief.compliance?.pii || 'unknown' },
      { name: 'Tone', status: 'pass' },
    ],
  };
}

function getStats() {
  return {
    totalBriefs: briefs.size,
    statuses: Array.from(briefs.values()).reduce((acc, b) => {
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
  complianceStatus,
  getStats,
};
