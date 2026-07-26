'use strict';
/**
 * Topic Cluster Engine
 * PageRank-style topical authority, cluster mapping, intent classification,
 * seasonal trends, question mining, coverage scoring
 */

const TOPIC_CLUSTERS = [
  {
    id: 'tc1', pillar: 'Sustainable Fashion', authority: 82, coverage: 74, intent: 'informational',
    subtopics: [
      { name: 'Eco-Friendly Fabrics', coverage: 90, volume: 12100, status: 'strong' },
      { name: 'Sustainable Brands Guide', coverage: 65, volume: 9900, status: 'partial' },
      { name: 'Fast Fashion Impact', coverage: 40, volume: 22200, status: 'gap' },
      { name: 'Circular Fashion Economy', coverage: 25, volume: 8100, status: 'gap' },
      { name: 'Second-Hand Fashion', coverage: 55, volume: 14800, status: 'partial' },
    ]
  },
  {
    id: 'tc2', pillar: 'Capsule Wardrobe', authority: 71, coverage: 68, intent: 'commercial',
    subtopics: [
      { name: 'Capsule Wardrobe Basics', coverage: 88, volume: 8100, status: 'strong' },
      { name: 'Seasonal Capsule Wardrobe', coverage: 60, volume: 5400, status: 'partial' },
      { name: 'Minimalist Fashion Tips', coverage: 45, volume: 6600, status: 'gap' },
      { name: 'Capsule Wardrobe on a Budget', coverage: 30, volume: 4400, status: 'gap' },
    ]
  },
  {
    id: 'tc3', pillar: 'Organic & Natural Clothing', authority: 65, coverage: 58, intent: 'transactional',
    subtopics: [
      { name: 'Organic Cotton Products', coverage: 82, volume: 14800, status: 'strong' },
      { name: 'Natural Dye Clothing', coverage: 42, volume: 4400, status: 'gap' },
      { name: 'GOTS Certified Fashion', coverage: 70, volume: 6600, status: 'partial' },
      { name: 'Chemical-Free Fabrics', coverage: 35, volume: 5400, status: 'gap' },
    ]
  },
];

const TOPIC_QUESTIONS = [
  { question: 'What makes clothing sustainable?', volume: 4400, hasPAA: true, hasSnippet: false, cluster: 'tc1' },
  { question: 'How many items in a capsule wardrobe?', volume: 8100, hasPAA: true, hasSnippet: true, cluster: 'tc2' },
  { question: 'Is organic cotton really better for the environment?', volume: 2900, hasPAA: false, hasSnippet: false, cluster: 'tc3' },
  { question: 'What is fast fashion and why is it bad?', volume: 18100, hasPAA: true, hasSnippet: true, cluster: 'tc1' },
  { question: 'How to build a capsule wardrobe on a budget?', volume: 5400, hasPAA: true, hasSnippet: false, cluster: 'tc2' },
];

const SEASONAL_TRENDS = [
  { month: 'Jan', sustainable: 82, capsule: 91, organic: 74 },
  { month: 'Feb', sustainable: 78, capsule: 84, organic: 71 },
  { month: 'Mar', sustainable: 88, capsule: 88, organic: 79 },
  { month: 'Apr', sustainable: 95, capsule: 94, organic: 85 },
  { month: 'May', sustainable: 100, capsule: 98, organic: 92 },
  { month: 'Jun', sustainable: 96, capsule: 96, organic: 88 },
  { month: 'Jul', sustainable: 91, capsule: 89, organic: 84 },
  { month: 'Aug', sustainable: 88, capsule: 91, organic: 82 },
  { month: 'Sep', sustainable: 92, capsule: 96, organic: 86 },
  { month: 'Oct', sustainable: 94, capsule: 100, organic: 88 },
  { month: 'Nov', sustainable: 89, capsule: 93, organic: 84 },
  { month: 'Dec', sustainable: 84, capsule: 87, organic: 78 },
];

class TopicClusterEngine {
  constructor(config = {}) {
    this.config = { minCoverage: 0, topN: 10, ...config };
  }

  getClusters(options = {}) {
    const { minAuthority = 0, intent } = options;
    let clusters = TOPIC_CLUSTERS.filter(c => {
      if (c.authority < minAuthority) return false;
      if (intent && c.intent !== intent) return false;
      return true;
    });
    return clusters.map(c => ({
      ...c,
      gapSubtopics: c.subtopics.filter(s => s.status === 'gap'),
      strongSubtopics: c.subtopics.filter(s => s.status === 'strong'),
      coverageScore: this._calcCoverageScore(c),
      authorityRank: this._calcAuthorityRank(c),
    }));
  }

  _calcCoverageScore(cluster) {
    return Math.round(cluster.subtopics.reduce((s, t) => s + t.coverage, 0) / cluster.subtopics.length);
  }

  _calcAuthorityRank(cluster) {
    return parseFloat((cluster.authority * cluster.coverage / 100).toFixed(1));
  }

  getTopicHierarchy(clusterId) {
    const cluster = TOPIC_CLUSTERS.find(c => c.id === clusterId);
    if (!cluster) return null;
    return {
      pillar: cluster.pillar,
      level1: cluster.subtopics.filter(t => t.coverage >= 70),
      level2: cluster.subtopics.filter(t => t.coverage >= 40 && t.coverage < 70),
      gaps: cluster.subtopics.filter(t => t.coverage < 40),
    };
  }

  getQuestions(clusterId, options = {}) {
    const { hasPAA, hasSnippet } = options;
    let questions = clusterId ? TOPIC_QUESTIONS.filter(q => q.cluster === clusterId) : TOPIC_QUESTIONS;
    if (hasPAA !== undefined) questions = questions.filter(q => q.hasPAA === hasPAA);
    if (hasSnippet !== undefined) questions = questions.filter(q => q.hasSnippet === hasSnippet);
    return questions;
  }

  getSeasonalTrends() { return SEASONAL_TRENDS; }

  calcTopicalAuthority(domain) {
    const clusters = this.getClusters();
    const avgAuthority = Math.round(clusters.reduce((s, c) => s + c.authority, 0) / clusters.length);
    const coverageScore = Math.round(clusters.reduce((s, c) => s + c.coverageScore, 0) / clusters.length);
    return {
      domain,
      topicalAuthorityScore: avgAuthority,
      coverageScore,
      clusterCount: clusters.length,
      strongClusters: clusters.filter(c => c.authority >= 75).length,
      gapClusters: clusters.filter(c => c.authority < 60).length,
      recommendations: this._generateAuthorityRecs(clusters),
    };
  }

  _generateAuthorityRecs(clusters) {
    const recs = [];
    for (const c of clusters) {
      if (c.authority < 70) {
        recs.push({ cluster: c.pillar, action: 'Expand content coverage', priority: 'high', estimatedLift: '+' + Math.floor((70 - c.authority) * 0.8) + ' authority points' });
      }
      for (const gap of c.gapSubtopics) {
        recs.push({ cluster: c.pillar, subtopic: gap.name, action: 'Create pillar content', priority: 'medium', volume: gap.volume });
      }
    }
    return recs.slice(0, 10);
  }

  generateContentPlan(clusters) {
    const plan = [];
    for (const c of clusters) {
      for (const gap of (c.gapSubtopics || [])) {
        plan.push({ topic: gap.name, cluster: c.pillar, priority: gap.volume > 10000 ? 'critical' : gap.volume > 5000 ? 'high' : 'medium', estimatedVolume: gap.volume, contentType: 'pillar-page', wordCount: 2500 });
      }
    }
    return plan.sort((a, b) => b.estimatedVolume - a.estimatedVolume);
  }
}

module.exports = new TopicClusterEngine();
module.exports.TopicClusterEngine = TopicClusterEngine;
