const crypto = require('crypto');

const suggestions = new Map();
const sprints = new Map();

function createId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function suggestLinks(payload = {}) {
  const id = payload.id || createId('links');
  const links = (payload.links || [
    { source: '/blog/seo-guide', target: '/blog/keyword-clusters', anchor: 'keyword clusters', type: 'internal', status: 200 },
    { source: '/blog/seo-guide', target: '/features/platform', anchor: 'platform', type: 'internal', status: 200 },
  ]).map((link, idx) => ({ ...link, id: `${id}-sugg-${idx + 1}`, status: link.status || 200 }));
  const record = {
    id,
    contentId: payload.contentId || 'blog-seo-guide',
    links,
    approved: false,
    createdAt: new Date().toISOString(),
  };
  suggestions.set(id, record);
  return record;
}

function approveLinks(id) {
  const record = suggestions.get(id);
  if (!record) {
    throw new Error('Suggestion not found');
  }
  const updated = { ...record, approved: true, approvedAt: new Date().toISOString() };
  suggestions.set(id, updated);
  return updated;
}

function createSprint(payload = {}) {
  const id = payload.id || createId('sprint');
  const sprint = {
    id,
    name: payload.name || 'Internal Link Sprint',
    owner: payload.owner || 'SEO Lead',
    links: payload.links || suggestions.values().next().value?.links || [],
    status: payload.status || 'planning',
    createdAt: new Date().toISOString(),
  };
  sprints.set(id, sprint);
  return sprint;
}

function getSprintMap(id) {
  const sprint = sprints.get(id);
  if (!sprint) {
    throw new Error('Sprint not found');
  }
  return sprint;
}

function getStats() {
  return {
    totalSuggestions: suggestions.size,
    totalSprints: sprints.size,
    approved: Array.from(suggestions.values()).filter((s) => s.approved).length,
  };
}

module.exports = {
  suggestLinks,
  approveLinks,
  createSprint,
  getSprintMap,
  getStats,
};
