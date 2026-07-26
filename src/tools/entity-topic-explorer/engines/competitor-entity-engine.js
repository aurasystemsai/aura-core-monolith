'use strict';
/**
 * Competitor Entity Intelligence Engine
 * SOV, topical authority comparison, featured snippet ownership, SWOT
 */

const COMPETITORS = [
  { id: 'comp1', name: 'EcoFashionCo', domain: 'ecofashionco.com', topicalAuthority: 84, entityCount: 142, knowledgePanels: 3, entities: ['sustainable-materials','recycled-fabrics','carbon-neutral-fashion','eco-dyes','fair-wages'], snippets: ['what is sustainable fashion','how to recycle clothing'], sovScore: 84 },
  { id: 'comp2', name: 'GreenThread', domain: 'greenthread.com', topicalAuthority: 71, entityCount: 108, knowledgePanels: 1, entities: ['organic-linen','fair-trade','b-corp-certified','regenerative-cotton'], snippets: ['organic linen vs cotton'], sovScore: 71 },
  { id: 'comp3', name: 'EarthWear', domain: 'earthwear.co', topicalAuthority: 78, entityCount: 126, knowledgePanels: 2, entities: ['upcycled-fashion','zero-waste-clothing','circular-economy','deadstock-fabric'], snippets: ['what is upcycled fashion','zero waste wardrobe guide'], sovScore: 78 },
];

const MY_SOV = { topicalAuthority: 66, entityCount: 94, knowledgePanels: 0, sovScore: 66 };

const FEATURED_SNIPPETS = [
  { query: 'what is sustainable fashion', owner: 'EcoFashionCo', ownedByMe: false, volume: 22200 },
  { query: 'how to build a capsule wardrobe', owner: 'Me', ownedByMe: true, volume: 8100 },
  { query: 'organic cotton vs conventional', owner: 'EcoFashionCo', ownedByMe: false, volume: 5400 },
  { query: 'best sustainable clothing brands', owner: 'GreenThread', ownedByMe: false, volume: 18100 },
  { query: 'capsule wardrobe essentials', owner: 'Me', ownedByMe: true, volume: 6600 },
];

class CompetitorEntityEngine {
  constructor(config = {}) {
    this.config = { trackCompetitors: 5, updateFrequency: 'weekly', ...config };
  }

  getCompetitorOverview() {
    return {
      competitors: COMPETITORS,
      myMetrics: MY_SOV,
      sovGap: COMPETITORS[0].sovScore - MY_SOV.sovScore,
      avgCompetitorAuthority: Math.round(COMPETITORS.reduce((s, c) => s + c.topicalAuthority, 0) / COMPETITORS.length),
      leaderboard: [{ name: 'EcoFashionCo', score: 84 }, { name: 'EarthWear', score: 78 }, { name: 'GreenThread', score: 71 }, { name: 'You', score: 66 }],
    };
  }

  getEntityGaps() {
    const myEntities = new Set(['sustainable-fashion','organic-cotton','capsule-wardrobe','eco-clothing']);
    const gaps = [];
    for (const comp of COMPETITORS) {
      for (const entity of comp.entities) {
        if (!myEntities.has(entity)) {
          gaps.push({ entity, ownedBy: comp.name, estimatedVolume: Math.floor(Math.random() * 8000) + 1000, priority: comp.sovScore > 75 ? 'critical' : 'high', action: 'Create content around this entity' });
        }
      }
    }
    return { gaps, totalGaps: gaps.length, criticalGaps: gaps.filter(g => g.priority === 'critical').length };
  }

  getFeaturedSnippets() {
    const mine = FEATURED_SNIPPETS.filter(s => s.ownedByMe);
    const lost = FEATURED_SNIPPETS.filter(s => !s.ownedByMe);
    return { owned: mine, lost, ownershipRate: Math.round(mine.length / FEATURED_SNIPPETS.length * 100), lostTraffic: lost.reduce((s, f) => s + f.volume, 0), topOpportunity: lost.sort((a, b) => b.volume - a.volume)[0] };
  }

  getSwotAnalysis() {
    return {
      strengths: [{ point: 'Strong capsule wardrobe topic cluster (71 authority)', impact: 'Medium' }, { point: 'Own 2 high-value featured snippets', impact: 'High' }],
      weaknesses: [{ point: 'No Knowledge Panel or Entity Card', impact: 'High' }, { point: '28 entity gaps vs top competitor', impact: 'High' }],
      opportunities: [{ point: 'Circular economy topic cluster unclaimed (12% coverage)', impact: 'Critical', traffic: 8100 }, { point: 'Wikidata entity creation for brand', impact: 'High' }],
      threats: [{ point: 'EcoFashionCo expanding into capsule wardrobe cluster', impact: 'Medium' }],
    };
  }

  getBenchmarks() {
    return {
      entityCount: { me: MY_SOV.entityCount, avg: Math.round(COMPETITORS.reduce((s, c) => s + c.entityCount, 0) / COMPETITORS.length), leader: COMPETITORS[0].entityCount },
      topicalAuthority: { me: MY_SOV.topicalAuthority, avg: Math.round(COMPETITORS.reduce((s, c) => s + c.topicalAuthority, 0) / COMPETITORS.length), leader: COMPETITORS[0].topicalAuthority },
      knowledgePanels: { me: MY_SOV.knowledgePanels, avg: Math.round(COMPETITORS.reduce((s, c) => s + c.knowledgePanels, 0) / COMPETITORS.length * 10) / 10, leader: COMPETITORS[0].knowledgePanels },
      snippets: { me: FEATURED_SNIPPETS.filter(s => s.ownedByMe).length, total: FEATURED_SNIPPETS.length },
    };
  }

  getCompetitors() { return COMPETITORS; }
}

module.exports = new CompetitorEntityEngine();
module.exports.CompetitorEntityEngine = CompetitorEntityEngine;
