const crypto = require('crypto');

const clusterStore = new Map();

function createId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function calculateDifficulty(keyword = '') {
  const base = 45 + Math.min(keyword.length, 20);
  return Math.min(100, Math.max(30, base));
}

function createCluster(payload = {}) {
  const id = payload.id || createId('cluster');
  const keywords = payload.keywords && Array.isArray(payload.keywords) ? payload.keywords : ['blog seo', 'content optimization'];
  const primary = payload.primaryKeyword || keywords[0] || 'blog seo';
  const cluster = {
    id,
    name: payload.name || `Cluster for ${primary}`,
    primaryKeyword: primary,
    keywords,
    difficulty: calculateDifficulty(primary),
    intent: payload.intent || 'informational',
    volume: payload.volume || 1500,
    opportunities: keywords.map((kw, idx) => ({ keyword: kw, difficulty: calculateDifficulty(kw), volume: 800 - idx * 40 })),
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  clusterStore.set(id, cluster);
  return cluster;
}

function getCluster(id) {
  if (!clusterStore.has(id)) {
    throw new Error('Cluster not found');
  }
  return clusterStore.get(id);
}

function listClusters() {
  return Array.from(clusterStore.values());
}

function refreshCluster(id) {
  const existing = getCluster(id);
  const updated = {
    ...existing,
    updatedAt: new Date().toISOString(),
    opportunities: existing.opportunities.map((o) => {
      return { ...o, difficulty: Math.max(25, Math.min(100, o.difficulty + 1)) };
    }),
  };
  clusterStore.set(id, updated);
  return updated;
}

function importKeywords(keywords = []) {
  const sanitized = keywords.filter(Boolean).map((kw) => kw.trim()).filter(Boolean);
  const grouped = sanitized.reduce((acc, kw) => {
    const diff = calculateDifficulty(kw);
    const bucket = diff >= 70 ? 'hard' : diff >= 50 ? 'medium' : 'easy';
    acc[bucket] = acc[bucket] || [];
    acc[bucket].push({ keyword: kw, difficulty: diff });
    return acc;
  }, {});
  return { total: sanitized.length, grouped };
}

function evaluateKeyword(keyword = 'blog seo') {
  return {
    keyword,
    difficulty: calculateDifficulty(keyword),
    intent: 'informational',
    clickPotential: Math.max(25, Math.min(100, 80 - keyword.length)),
    recommendations: ['Add supporting articles', 'Target FAQ rich results', 'Align intent to SERP'],
  };
}

function getStats() {
  const total = clusterStore.size;
  const avgDifficulty = total
    ? Math.round(
        Array.from(clusterStore.values()).reduce((acc, c) => acc + (c.difficulty || 0), 0) / total
      )
    : 0;
  return { totalClusters: total, avgDifficulty };
}

module.exports = {
  createCluster,
  getCluster,
  listClusters,
  refreshCluster,
  importKeywords,
  evaluateKeyword,
  getStats,
};
