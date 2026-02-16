const crypto = require('crypto');

const outlineStore = new Map();
const outlineVersions = new Map();

function createId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function generateOutline(payload = {}) {
  const id = payload.id || createId('outline');
  const outline = {
    outlineId: id,
    briefId: payload.briefId || createId('brief'),
    sections:
      payload.sections || [
        { heading: 'Hook', notes: 'Set context and intent', wordCount: 120 },
        { heading: 'Keyword Strategy', notes: 'Clusters and SERP', wordCount: 220 },
        { heading: 'On-page Checklist', notes: 'Metadata, schema, links', wordCount: 260 },
        { heading: 'Distribution', notes: 'Channels and timing', wordCount: 200 },
      ],
    owner: payload.owner || 'Content Lead',
    status: payload.status || 'draft',
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  outlineStore.set(id, outline);
  outlineVersions.set(id, [{ versionId: createId('ov'), createdAt: outline.createdAt, label: 'v1' }]);
  return outline;
}

function getOutline(id) {
  if (!outlineStore.has(id)) {
    throw new Error('Outline not found');
  }
  return outlineStore.get(id);
}

function updateOutline(id, payload = {}) {
  const current = getOutline(id);
  const updated = {
    ...current,
    ...payload,
    sections: payload.sections || current.sections,
    updatedAt: new Date().toISOString(),
  };
  outlineStore.set(id, updated);
  return updated;
}

function gradeOutline(outline) {
  const sections = outline.sections || [];
  const depth = Math.min(100, Math.round(sections.reduce((acc, s) => acc + (s.wordCount || 0), 0) / 20));
  const coverage = Math.min(100, sections.length * 12 + 40);
  const clarity = 80;
  const score = Math.round(depth * 0.4 + coverage * 0.35 + clarity * 0.25);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
  return { score, grade, coverage, depth, clarity };
}

function versionOutline(id, label = 'v2') {
  const outline = getOutline(id);
  const grade = gradeOutline(outline);
  const version = { versionId: createId('ov'), label, grade, createdAt: new Date().toISOString() };
  const versions = outlineVersions.get(id) || [];
  versions.push(version);
  outlineVersions.set(id, versions);
  return version;
}

function listOutlines() {
  return Array.from(outlineStore.values());
}

function listVersions(id) {
  return outlineVersions.get(id) || [];
}

function getStats() {
  return {
    totalOutlines: outlineStore.size,
    avgSections: outlineStore.size
      ? Math.round(
          Array.from(outlineStore.values()).reduce((acc, o) => acc + (o.sections?.length || 0), 0) /
            outlineStore.size
        )
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
