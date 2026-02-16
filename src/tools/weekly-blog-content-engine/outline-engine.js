const crypto = require('crypto');

const outlines = new Map();
const versions = new Map();

function id(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function generateOutline(payload = {}) {
  const outlineId = payload.outlineId || id('outline');
  const outline = {
    outlineId,
    briefId: payload.briefId || id('brief'),
    sections: payload.sections || [
      { heading: 'Hook', notes: 'Frame the tension', wordCount: 120 },
      { heading: 'Insight', notes: 'Share POV + data', wordCount: 200 },
      { heading: 'How-to', notes: 'Steps and visuals', wordCount: 240 },
      { heading: 'CTA', notes: 'Single CTA', wordCount: 80 },
    ],
    owner: payload.owner || 'Content Lead',
    status: payload.status || 'draft',
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  outlines.set(outlineId, outline);
  versions.set(outlineId, [{ versionId: id('ov'), label: 'v1', createdAt: outline.createdAt }]);
  return outline;
}

function getOutline(id) {
  if (!outlines.has(id)) throw new Error('Outline not found');
  return outlines.get(id);
}

function updateOutline(id, payload = {}) {
  const existing = getOutline(id);
  const updated = { ...existing, ...payload, sections: payload.sections || existing.sections, updatedAt: new Date().toISOString() };
  outlines.set(id, updated);
  return updated;
}

function gradeOutline(outline) {
  const sections = outline.sections || [];
  const depth = Math.min(100, Math.round(sections.reduce((acc, s) => acc + (s.wordCount || 0), 0) / 18));
  const coverage = Math.min(100, sections.length * 12 + 40);
  const clarity = 82;
  const score = Math.round(depth * 0.45 + coverage * 0.35 + clarity * 0.2);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
  return { score, grade, coverage, depth, clarity };
}

function versionOutline(id, label = 'v2') {
  const outline = getOutline(id);
  const grade = gradeOutline(outline);
  const version = { versionId: id, label, grade, createdAt: new Date().toISOString() };
  const list = versions.get(id) || [];
  list.push(version);
  versions.set(id, list);
  return version;
}

function listOutlines() {
  return Array.from(outlines.values());
}

function listVersions(id) {
  return versions.get(id) || [];
}

function getStats() {
  return {
    totalOutlines: outlines.size,
    avgSections: outlines.size
      ? Math.round(Array.from(outlines.values()).reduce((acc, o) => acc + (o.sections?.length || 0), 0) / outlines.size)
      : 0,
  };
}

module.exports = {
  generateOutline,
  getOutline,
  updateOutline,
  gradeOutline,
  versionOutline,
  listOutlines,
  listVersions,
  getStats,
};
