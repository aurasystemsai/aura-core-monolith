/**
 * Keyword Clustering Engine
 * Deterministic keyword clustering based on token similarity. No random or
 * invented metrics: volume/difficulty are only reported when supplied by the caller.
 */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'my', 'your'
]);
const MAX_KEYWORDS = 500;
const VALID_METHODS = ['semantic', 'topic', 'intent'];

const INTENT_PATTERNS = [
  ['transactional', /\b(buy|purchase|order|shop|discount|coupon|deal|cheap|price|pricing|sale|for sale)\b/],
  ['commercial', /\b(best|top|review|reviews|vs|versus|compare|comparison|alternative|alternatives)\b/],
  ['informational', /\b(how|what|why|when|who|guide|tutorial|tips|ideas|learn|examples?)\b/]
];

function stem(word) {
  return word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

function tokenize(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w && !STOP_WORDS.has(w))
      .map(stem)
  );
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  a.forEach(t => { if (b.has(t)) shared++; });
  return shared / (a.size + b.size - shared);
}

function classifyIntent(keyword) {
  const text = String(keyword).toLowerCase();
  for (const [intent, pattern] of INTENT_PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  return 'navigational';
}

function normalizeKeywords(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('keywords must be a non-empty array');
  }
  const seen = new Map();
  input.forEach(item => {
    const obj = item && typeof item === 'object' ? item : { keyword: item };
    const keyword = typeof obj.keyword === 'string' ? obj.keyword.trim().replace(/\s+/g, ' ') : '';
    if (!keyword) return;
    const key = keyword.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, {
        keyword,
        tokens: tokenize(keyword),
        volume: Number.isFinite(obj.volume) ? obj.volume : null,
        difficulty: Number.isFinite(obj.difficulty) ? obj.difficulty : null
      });
    }
  });
  const items = Array.from(seen.values());
  if (items.length === 0) throw new Error('keywords must contain at least one non-empty string');
  if (items.length > MAX_KEYWORDS) throw new Error(`A maximum of ${MAX_KEYWORDS} keywords can be clustered at once`);
  return items;
}

function sum(values) {
  return values.length ? values.reduce((total, v) => total + v, 0) : null;
}

function positiveInt(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

class KeywordClusteringEngine {
  constructor() {
    this.clusters = new Map(); // individual clusters by id
    this.clusterings = new Map(); // clustering runs by id
    this.silos = new Map();
    this._counter = 0;
  }

  _id(prefix) {
    this._counter += 1;
    return `${prefix}_${Date.now().toString(36)}_${this._counter}`;
  }

  /**
   * clusterKeywords(keywords, method, minClusterSize, maxClusters)
   * or clusterKeywords(keywords, { method, minClusterSize, maxClusters })
   */
  async clusterKeywords(keywords, methodOrParams = 'semantic', minSizeArg, maxClustersArg) {
    const params = methodOrParams && typeof methodOrParams === 'object'
      ? methodOrParams
      : { method: methodOrParams, minClusterSize: minSizeArg, maxClusters: maxClustersArg };
    const method = params.method || 'semantic';
    if (!VALID_METHODS.includes(method)) {
      throw new Error(`Unknown clustering method "${method}". Use one of: ${VALID_METHODS.join(', ')}`);
    }
    const minClusterSize = positiveInt(params.minClusterSize, 3);
    const maxClusters = positiveInt(params.maxClusters, 20);
    const items = normalizeKeywords(keywords);

    let groups;
    if (method === 'semantic') groups = this._groupBySimilarity(items, { maxClusters, threshold: 0.3 });
    else if (method === 'topic') groups = this._groupByTopic(items, minClusterSize);
    else groups = this._groupByIntent(items);

    const valid = groups.filter(g => g.length >= minClusterSize);
    const unclustered = groups.filter(g => g.length < minClusterSize).flatMap(g => g.map(i => i.keyword));
    const silhouetteScore = this._silhouette(valid);

    const id = this._id('clustering');
    const clusters = valid
      .sort((a, b) => b.length - a.length)
      .slice(0, maxClusters)
      .map((group, index) => this._buildCluster(`${id}_c${index}`, id, group, method));
    const clusteredKeywords = clusters.reduce((total, c) => total + c.keywords.length, 0);

    clusters.forEach(c => this.clusters.set(c.id, c));
    const clustering = {
      id,
      method,
      totalKeywords: items.length,
      clusters,
      unclustered,
      silhouetteScore,
      metrics: {
        avgClusterSize: clusters.length ? clusteredKeywords / clusters.length : 0,
        silhouetteScore,
        coverage: items.length ? (clusteredKeywords / items.length) * 100 : 0
      },
      timestamp: new Date().toISOString()
    };
    this.clusterings.set(id, clustering);
    return clustering;
  }

  async buildContentSilo(clusterIds) {
    if (!Array.isArray(clusterIds) || clusterIds.length === 0) {
      throw new Error('clusterIds must be a non-empty array');
    }
    const resolved = this._resolveClusters(clusterIds);
    if (resolved.length === 0) throw new Error('No matching clusters found');

    const id = this._id('silo');
    const silo = {
      id,
      pillarPages: [],
      supportingContent: [],
      structure: {},
      internalLinks: [],
      estimatedContent: { pillarPages: 0, supportingPages: 0, totalPages: 0 },
      timestamp: new Date().toISOString()
    };

    resolved.forEach((cluster, index) => {
      const pillar = {
        id: `pillar_${id}_${index}`,
        topic: cluster.primaryTopic,
        cluster: cluster.name,
        targetKeywords: cluster.keywords.slice(0, 3),
        targetWordCount: 3000 + cluster.keywords.length * 100,
        priority: cluster.volume !== null ? (cluster.volume > 10000 ? 'high' : 'medium') : (cluster.keywords.length >= 8 ? 'high' : 'medium')
      };
      silo.pillarPages.push(pillar);

      cluster.keywords.slice(3).forEach((keyword, kwIndex) => {
        const support = {
          id: `support_${id}_${index}_${kwIndex}`,
          keyword,
          pillarPageId: pillar.id,
          targetWordCount: 1500,
          priority: 'medium'
        };
        silo.supportingContent.push(support);
        silo.internalLinks.push({
          from: support.id,
          to: pillar.id,
          anchorText: `Learn more about ${cluster.primaryTopic}`,
          type: 'support-to-pillar'
        });
        silo.internalLinks.push({
          from: pillar.id,
          to: support.id,
          anchorText: keyword,
          type: 'pillar-to-support'
        });
      });
    });

    silo.internalLinkingPlan = silo.internalLinks;
    silo.structure = {
      levels: { pillar: silo.pillarPages.length, supporting: silo.supportingContent.length },
      hierarchy: Object.fromEntries(silo.pillarPages.map(p => [p.id, {
        title: p.topic,
        children: silo.supportingContent.filter(s => s.pillarPageId === p.id).map(s => s.id)
      }]))
    };
    silo.estimatedContent = {
      pillarPages: silo.pillarPages.length,
      supportingPages: silo.supportingContent.length,
      totalPages: silo.pillarPages.length + silo.supportingContent.length
    };

    this.silos.set(id, silo);
    return silo;
  }

  async findOptimalClusters(keywords, maxK = 15) {
    const items = normalizeKeywords(keywords);
    const upper = Math.min(positiveInt(maxK, 15), Math.floor(items.length / 3));
    const evaluations = [];
    let best = null;

    for (let k = Math.min(3, upper); k <= upper; k++) {
      const groups = this._groupBySimilarity(items, { maxClusters: k, threshold: Infinity });
      const silhouette = this._silhouette(groups);
      evaluations.push({ k, clusters: groups.length, avgSize: items.length / groups.length, silhouette });
      if (!best || silhouette > best.silhouette) best = evaluations[evaluations.length - 1];
    }

    if (!best) {
      return {
        keywords: items.length,
        optimalK: 0,
        optimalScore: 0,
        evaluations,
        tested: evaluations,
        recommendation: 'Not enough keywords to evaluate cluster counts (need at least 3).',
        timestamp: new Date().toISOString()
      };
    }
    return {
      keywords: items.length,
      optimalK: best.k,
      optimalScore: best.silhouette,
      evaluations,
      tested: evaluations,
      recommendation: `Use ${best.k} clusters (silhouette score: ${best.silhouette.toFixed(3)})`,
      timestamp: new Date().toISOString()
    };
  }

  async mergeClusters(clusterIds, threshold = 0.7) {
    if (!Array.isArray(clusterIds) || clusterIds.length === 0) {
      throw new Error('clusterIds must be a non-empty array');
    }
    const limit = typeof threshold === 'number' && threshold >= 0 && threshold <= 1 ? threshold : 0.7;
    const remaining = this._resolveClusters(clusterIds).map(c => ({ ...c }));
    const originalClusters = remaining.length;
    const mergedClusters = [];

    while (remaining.length > 0) {
      const current = remaining.shift();
      const group = [current];
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (this._clusterSimilarity(current, remaining[i]) >= limit) group.push(remaining.splice(i, 1)[0]);
      }
      if (group.length === 1) {
        mergedClusters.push(current);
        continue;
      }
      const keywords = Array.from(new Set(group.flatMap(c => c.keywords)));
      const volumes = group.map(c => c.volume).filter(v => v !== null);
      mergedClusters.push({
        ...current,
        id: this._id('merged'),
        keywords,
        volume: volumes.length ? sum(volumes) : null,
        mergedFrom: group.map(c => c.id)
      });
    }

    mergedClusters.filter(c => c.mergedFrom).forEach(c => this.clusters.set(c.id, c));
    return {
      originalClusters,
      mergedClusters,
      reductions: originalClusters - mergedClusters.length,
      timestamp: new Date().toISOString()
    };
  }

  async suggestClusterNames(cluster) {
    if (!cluster || !Array.isArray(cluster.keywords) || cluster.keywords.length === 0) {
      throw new Error('cluster with keywords is required');
    }
    const frequency = new Map();
    cluster.keywords.forEach(kw => tokenize(kw).forEach(t => frequency.set(t, (frequency.get(t) || 0) + 1)));
    const top = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([word]) => word);
    const lead = top[0] || cluster.primaryTopic || 'topic';

    const suggestions = [
      { name: top.join(' ') || lead, type: 'word-frequency', score: 90 },
      { name: cluster.primaryTopic || lead, type: 'primary-topic', score: 85 },
      { name: `${lead} resources`, type: 'descriptive', score: 75 },
      { name: `Complete ${lead} guide`, type: 'content-angle', score: 70 }
    ];
    return {
      clusterId: cluster.id,
      suggestions,
      recommended: suggestions[0].name,
      timestamp: new Date().toISOString()
    };
  }

  async analyzeClusterQuality(clusterId) {
    const cluster = this.clusters.get(clusterId);
    const clustering = cluster ? this.clusterings.get(cluster.clusteringId) : this.clusterings.get(clusterId);
    if (!cluster && !clustering) throw new Error('Cluster not found');

    const siblings = clustering ? clustering.clusters : [cluster];
    const target = cluster || null;
    const targets = target ? [target] : siblings;

    const cohesion = (targets.reduce((total, c) => total + this._cohesion(c), 0) / targets.length) * 100;
    const separation = this._separation(targets, siblings) * 100;
    const sizes = siblings.map(c => c.keywords.length);
    const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const variance = sizes.reduce((a, s) => a + (s - mean) ** 2, 0) / sizes.length;
    const sizeBalance = mean > 0 ? Math.max(0, 100 - (Math.sqrt(variance) / mean) * 50) : 0;
    const coverage = clustering ? clustering.metrics.coverage : 100;
    const overallQuality = cohesion * 0.3 + separation * 0.2 + sizeBalance * 0.2 + coverage * 0.3;

    const issues = [];
    if (cohesion < 30) issues.push({ type: 'low-cohesion', message: 'Keywords in this cluster share few terms' });
    if (coverage < 80) issues.push({ type: 'low-coverage', message: `${clustering.unclustered.length} keywords were left unclustered` });
    const recommendations = issues.length
      ? [{ action: 'Adjust clustering parameters', priority: 'medium', details: 'Try a different method, lower the minimum cluster size, or add more related keywords' }]
      : [];

    return {
      clusterId,
      cohesion,
      separation,
      sizeBalance,
      coverage,
      overallQuality,
      overallScore: overallQuality,
      metrics: { cohesion, separation, size: sizeBalance, coverage },
      issues,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  async exportToContentCalendar(siloId, startDate, publishingFrequency = 'weekly') {
    const silo = this.silos.get(siloId);
    if (!silo) throw new Error('Silo not found');
    const start = new Date(startDate || Date.now());
    if (Number.isNaN(start.getTime())) throw new Error('startDate is not a valid date');
    const increments = { daily: 1, weekly: 7, monthly: 30 };
    const step = increments[publishingFrequency];
    if (!step) throw new Error('publishingFrequency must be daily, weekly or monthly');

    const timeline = [];
    const cursor = new Date(start);
    const push = entry => {
      timeline.push({ date: cursor.toISOString().split('T')[0], ...entry });
      cursor.setDate(cursor.getDate() + step);
    };
    silo.pillarPages.forEach(p => push({
      type: 'pillar', contentId: p.id, topic: p.topic, keywords: p.targetKeywords,
      targetWordCount: p.targetWordCount, priority: p.priority
    }));
    silo.supportingContent.forEach(s => push({
      type: 'supporting', contentId: s.id, keyword: s.keyword, pillarPageId: s.pillarPageId,
      targetWordCount: s.targetWordCount, priority: s.priority
    }));

    return {
      siloId,
      publishingFrequency,
      timeline,
      entries: timeline,
      estimatedCompletion: timeline.length ? timeline[timeline.length - 1].date : start.toISOString().split('T')[0],
      totalWeeks: Math.ceil((cursor - start) / (1000 * 60 * 60 * 24 * 7)),
      timestamp: new Date().toISOString()
    };
  }

  // === Helpers ===

  _resolveClusters(ids) {
    const out = [];
    ids.forEach(id => {
      const clustering = this.clusterings.get(id);
      if (clustering) out.push(...clustering.clusters);
      else if (this.clusters.has(id)) out.push(this.clusters.get(id));
    });
    return out;
  }

  _buildCluster(id, clusteringId, group, method) {
    const frequency = new Map();
    group.forEach(item => item.tokens.forEach(t => frequency.set(t, (frequency.get(t) || 0) + 1)));
    const topWord = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const intents = {};
    group.forEach(item => { const i = classifyIntent(item.keyword); intents[i] = (intents[i] || 0) + 1; });
    const intent = Object.entries(intents).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    const primaryTopic = method === 'intent' ? intent : (topWord ? topWord[0] : group[0].keyword);
    const volumes = group.map(i => i.volume).filter(v => v !== null);
    const difficulties = group.map(i => i.difficulty).filter(v => v !== null);

    return {
      id,
      clusteringId,
      name: `${primaryTopic} cluster`,
      primaryTopic,
      intent,
      keywords: group.map(i => i.keyword),
      volume: volumes.length ? sum(volumes) : null,
      avgDifficulty: difficulties.length ? sum(difficulties) / difficulties.length : null
    };
  }

  // Average-linkage agglomerative clustering on Jaccard similarity.
  _groupBySimilarity(items, { maxClusters, threshold }) {
    let groups = items.map((item, index) => ({ members: [index] }));
    const sim = items.map(a => items.map(b => jaccard(a.tokens, b.tokens)));
    const linkage = (a, b) => {
      let total = 0;
      a.members.forEach(i => b.members.forEach(j => { total += sim[i][j]; }));
      return total / (a.members.length * b.members.length);
    };

    while (groups.length > 1) {
      let best = { score: -1, i: 0, j: 1 };
      for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const score = linkage(groups[i], groups[j]);
          if (score > best.score) best = { score, i, j };
        }
      }
      if (groups.length <= maxClusters && best.score < threshold) break;
      groups[best.i] = { members: groups[best.i].members.concat(groups[best.j].members) };
      groups.splice(best.j, 1);
    }
    return groups.map(g => g.members.sort((a, b) => a - b).map(i => items[i]));
  }

  _groupByTopic(items, minClusterSize) {
    const df = new Map();
    items.forEach(item => item.tokens.forEach(t => df.set(t, (df.get(t) || 0) + 1)));
    const buckets = new Map();
    items.forEach(item => {
      const candidates = Array.from(item.tokens).filter(t => df.get(t) >= minClusterSize);
      candidates.sort((a, b) => df.get(b) - df.get(a) || a.localeCompare(b));
      const key = candidates[0] || `__single:${item.keyword.toLowerCase()}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(item);
    });
    return Array.from(buckets.values());
  }

  _groupByIntent(items) {
    const buckets = new Map();
    items.forEach(item => {
      const intent = classifyIntent(item.keyword);
      if (!buckets.has(intent)) buckets.set(intent, []);
      buckets.get(intent).push(item);
    });
    return Array.from(buckets.values());
  }

  // Mean silhouette using Jaccard distance, clamped to [0, 1].
  _silhouette(groups) {
    if (groups.length < 2) return 0;
    const dist = (a, b) => 1 - jaccard(a.tokens, b.tokens);
    const avgDist = (item, group, skipSelf) => {
      const others = skipSelf ? group.filter(o => o !== item) : group;
      return others.length ? others.reduce((t, o) => t + dist(item, o), 0) / others.length : 0;
    };
    let total = 0;
    let count = 0;
    groups.forEach((group, gi) => {
      group.forEach(item => {
        count++;
        if (group.length < 2) return;
        const a = avgDist(item, group, true);
        const b = Math.min(...groups.filter((_, i) => i !== gi).map(g => avgDist(item, g, false)));
        const denom = Math.max(a, b);
        total += denom === 0 ? 0 : (b - a) / denom;
      });
    });
    return Math.min(1, Math.max(0, count ? total / count : 0));
  }

  _cohesion(cluster) {
    const sets = cluster.keywords.map(k => tokenize(k));
    if (sets.length < 2) return 1;
    let total = 0;
    let pairs = 0;
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) { total += jaccard(sets[i], sets[j]); pairs++; }
    }
    return total / pairs;
  }

  _separation(targets, all) {
    if (all.length < 2) return 1;
    let worst = 0;
    targets.forEach(t => all.forEach(o => {
      if (o !== t) worst = Math.max(worst, this._clusterSimilarity(t, o));
    }));
    return 1 - worst;
  }

  _clusterSimilarity(a, b) {
    return jaccard(
      new Set(a.keywords.flatMap(k => Array.from(tokenize(k)))),
      new Set(b.keywords.flatMap(k => Array.from(tokenize(k))))
    );
  }
}

module.exports = KeywordClusteringEngine;
