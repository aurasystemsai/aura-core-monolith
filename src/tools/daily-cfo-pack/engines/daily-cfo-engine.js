'use strict';
/**
 * Daily CFO Pack Engine
 * AI briefings, adaptive KPIs, NLP query, board pack, revenue ticker
 */

const TODAY_KPIS = {
  revenue: { value: 18420, target: 17000, trend: '+8.4%', status: 'above', prior: 16990 },
  orders: { value: 41, target: 38, trend: '+7.9%', status: 'above', prior: 38 },
  aov: { value: 449, target: 440, trend: '+2.0%', status: 'above', prior: 440 },
  grossMargin: { value: 0.621, target: 0.600, trend: '+2.1pp', status: 'above', prior: 0.600 },
  returns: { value: 0.114, target: 0.120, trend: '-0.6pp', status: 'above', prior: 0.120 },
  cac: { value: 41.2, target: 38.0, trend: '+8.4%', status: 'below', prior: 38.0 },
  conversionRate: { value: 0.038, target: 0.040, trend: '-0.2pp', status: 'below', prior: 0.040 },
};

const BRIEFING = {
  date: new Date().toISOString().split('T')[0],
  headline: 'Strong revenue day, CAC pressure warrants attention',
  topPerformers: ['Organic Cotton Hoodie (+34% DoD)', 'Sustainable Summer Collection', 'Email campaign "Eco Essentials" (12.4% CTR)'],
  risks: ['CAC increased to £41.20 (target £38) — Google CPC up 14% week-over-week', 'Linen Summer Dress — stockout risk 89% in 30 days', 'FastMake supplier credit downgrade — review payment terms'],
  opportunities: ['Capsule Wardrobe category trending +22% search volume — expand inventory', 'Q3 seasonal peak begins in 6 weeks — OTB £53,000 open to deploy', 'Review Snippet eligibility for 3 SKUs — could add +35% CTR'],
  keyDecision: 'Do we deploy £18,000 OTB toward Linen Dresses ahead of summer peak, or hold cash given CAC pressure?',
};

const REVENUE_TICKER = {
  todayRevenue: 18420,
  todayOrders: 41,
  liveRevenue: 18420 + Math.floor(Math.random() * 500),
  currentHourRevenue: Math.floor(Math.random() * 1800) + 400,
  lastOrderMinutes: Math.floor(Math.random() * 8) + 1,
};

class DailyCfoEngine {
  getBriefing() { return BRIEFING; }
  getKpis() { return TODAY_KPIS; }
  getRevenueTicker() { return { ...REVENUE_TICKER, liveRevenue: REVENUE_TICKER.todayRevenue + Math.floor(Math.random() * 1200), timestamp: new Date().toISOString() }; }

  answerNlpQuery(query) {
    const lq = query.toLowerCase();
    if (lq.includes('revenue') && lq.includes('decline')) return { query, answer: 'Revenue declined last Tuesday by 14% vs Monday, driven by a £4,200 drop in Tops category. Root cause: Klaviyo campaign delayed by 6 hours reducing peak-hour traffic.', confidence: 0.84, dataPoints: ['Revenue: £12,840 vs £14,900', 'Session drop: -22%', 'AOV stable at £447'] };
    if (lq.includes('cac') || lq.includes('acquisition')) return { query, answer: 'CAC increased to £41.20 this week (+8.4% vs target). Primary driver: Google CPC increased 14% due to competitor bid increases on "sustainable fashion" keyword cluster.', confidence: 0.91, dataPoints: ['Google CPC: £1.84 vs £1.61', 'Competitor spend up ~22%', 'Conversion rate stable'] };
    return { query, answer: 'Based on your KPIs: revenue is £18,420 (+8.4% vs target), AOV is £449, gross margin is 62.1%. Key watch item: CAC pressure and Linen Dress stockout risk.', confidence: 0.78, dataPoints: ['Dashboard KPIs as of ' + new Date().toISOString().split('T')[0]] };
  }

  generateBoardPack() {
    return {
      title: 'Board Pack — ' + new Date().toISOString().split('T')[0],
      sections: [
        { title: 'Executive Summary', content: 'Q3 revenue tracking 8.4% above budget driven by spring sustainable fashion trend. Gross margin improvement to 62.1% reflects premium product mix shift. CAC pressure requires monitoring.' },
        { title: 'Financial Performance', kpis: TODAY_KPIS, yoyGrowth: '+18.4%' },
        { title: 'Key Risks', items: BRIEFING.risks },
        { title: 'Strategic Opportunities', items: BRIEFING.opportunities },
        { title: 'Decision Required', content: BRIEFING.keyDecision },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  getAdaptiveThresholds() {
    return Object.entries(TODAY_KPIS).map(([metric, data]) => ({
      metric,
      currentValue: data.value,
      target: data.target,
      alertLow: typeof data.target === 'number' ? parseFloat((data.target * 0.85).toFixed(3)) : null,
      alertHigh: typeof data.target === 'number' ? parseFloat((data.target * 1.20).toFixed(3)) : null,
      status: data.status,
    }));
  }

  getCompetitiveBenchmarks() {
    return [
      { metric: 'Gross Margin', you: '62.1%', industryMedian: '52%', percentile: 78 },
      { metric: 'Return Rate', you: '11.4%', industryMedian: '18%', percentile: 82 },
      { metric: 'AOV', you: '£449', industryMedian: '£280', percentile: 91 },
      { metric: 'CAC', you: '£41', industryMedian: '£38', percentile: 44 },
      { metric: 'LTV:CAC', you: '3.8x', industryMedian: '3.0x', percentile: 68 },
    ];
  }
}
module.exports = new DailyCfoEngine();
module.exports.DailyCfoEngine = DailyCfoEngine;
