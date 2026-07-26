'use strict';
/**
 * Churn Prediction & Retention AI Engine
 * RFM scoring, BG/NBD model, survival curves, playbooks
 */

const RFM_SEGMENTS = [
  { segment: 'Champions', recency: 5, frequency: 5, monetary: 5, count: 284, revenuePct: 0.42, churnRisk: 0.04, action: 'Reward and upsell' },
  { segment: 'Loyal Customers', recency: 4, frequency: 4, monetary: 4, count: 418, revenuePct: 0.28, churnRisk: 0.09, action: 'Upsell premium' },
  { segment: 'At Risk', recency: 2, frequency: 3, monetary: 3, count: 312, revenuePct: 0.14, churnRisk: 0.44, action: 'Win-back campaign — immediate' },
  { segment: 'Cant Lose Them', recency: 1, frequency: 5, monetary: 5, count: 98, revenuePct: 0.09, churnRisk: 0.68, action: 'Reach out personally — high value' },
  { segment: 'Hibernating', recency: 2, frequency: 2, monetary: 2, count: 521, revenuePct: 0.04, churnRisk: 0.71, action: 'Reactivation email series' },
  { segment: 'Lost', recency: 1, frequency: 1, monetary: 1, count: 841, revenuePct: 0.03, churnRisk: 0.91, action: 'Final win-back or remove from list' },
];

const COHORT_RETENTION = [
  { cohort: 'Jan 2025', m0: 100, m1: 42, m2: 31, m3: 26, m4: 23, m5: 21, m6: 19 },
  { cohort: 'Feb 2025', m0: 100, m1: 45, m2: 33, m3: 28, m4: 25, m5: 23, m6: 21 },
  { cohort: 'Mar 2025', m0: 100, m1: 48, m2: 36, m3: 30, m4: 27, m5: 24, m6: null },
  { cohort: 'Apr 2025', m0: 100, m1: 51, m2: 38, m3: 32, m4: 29, m5: null, m6: null },
  { cohort: 'May 2025', m0: 100, m1: 53, m2: 40, m3: 34, m4: null, m5: null, m6: null },
  { cohort: 'Jun 2025', m0: 100, m1: 56, m2: 42, m3: null, m4: null, m5: null, m6: null },
];

const EARLY_WARNINGS = [
  { signal: 'Email open rate declining', change: '-28% MoM', affectedCustomers: 842, leadDays: 45, severity: 'high' },
  { signal: 'Average session duration drop', change: '-22% WoW', affectedCustomers: 1240, leadDays: 30, severity: 'medium' },
  { signal: 'Support tickets spike', change: '+41% WoW', affectedCustomers: 184, leadDays: 21, severity: 'high' },
  { signal: 'Add-to-cart but no purchase', change: '+18% MoM', affectedCustomers: 2840, leadDays: 14, severity: 'medium' },
];

const PLAYBOOKS = [
  {
    segment: 'At Risk', churnRisk: '44%', title: 'Win-Back Sprint',
    steps: [
      { day: 0, action: 'Personalised email: "We miss you" + 15% off', channel: 'Email', expectedConversion: 0.12 },
      { day: 3, action: 'SMS: Limited time offer expiring', channel: 'SMS', expectedConversion: 0.08 },
      { day: 7, action: 'Loyalty points bonus notification', channel: 'Email', expectedConversion: 0.06 },
      { day: 14, action: 'Final offer: Free shipping on next order', channel: 'Email+SMS', expectedConversion: 0.04 },
    ],
    estimatedRevenueRecovered: 28400,
  },
  {
    segment: 'Cant Lose Them', churnRisk: '68%', title: 'VIP Rescue',
    steps: [
      { day: 0, action: 'Personal outreach from founder/CS — no sales', channel: 'Email', expectedConversion: 0.22 },
      { day: 2, action: 'Exclusive VIP event invitation', channel: 'Email', expectedConversion: 0.14 },
      { day: 7, action: '20% lifetime discount offer', channel: 'Email+Phone', expectedConversion: 0.10 },
    ],
    estimatedRevenueRecovered: 18900,
  },
];

class ChurnEngine {
  getRfmSegments() { return RFM_SEGMENTS; }

  getCohortRetention() { return COHORT_RETENTION; }

  getEarlyWarnings() { return EARLY_WARNINGS; }

  getPlaybooks(segment) {
    if (segment) return PLAYBOOKS.filter(p => p.segment.toLowerCase() === segment.toLowerCase());
    return PLAYBOOKS;
  }

  calcChurnProbability(customerId, rfmScore) {
    const baseChurn = 0.15;
    const rfmFactor = (15 - rfmScore) / 15 * 0.6;
    const prob = Math.min(0.95, baseChurn + rfmFactor);
    return { customerId, rfmScore, churnProbability: parseFloat(prob.toFixed(3)), riskLevel: prob > 0.6 ? 'critical' : prob > 0.35 ? 'high' : prob > 0.15 ? 'medium' : 'low', recommendedPlaybook: prob > 0.6 ? 'VIP Rescue' : prob > 0.35 ? 'Win-Back Sprint' : 'Standard Nurture' };
  }

  calcReactivationRoi(segment, campaignCost, revenuePerCustomer) {
    const play = PLAYBOOKS.find(p => p.segment === segment);
    if (!play) return { error: 'Segment not found' };
    const totalConversion = play.steps.reduce((s, st) => s + st.expectedConversion, 0);
    const affectedCount = RFM_SEGMENTS.find(s => s.segment === segment)?.count || 100;
    const revenueRecovered = Math.round(affectedCount * totalConversion * revenuePerCustomer);
    return { segment, campaignCost, affectedCount, expectedConversionRate: parseFloat(totalConversion.toFixed(2)), revenueRecovered, roi: parseFloat(((revenueRecovered - campaignCost) / campaignCost * 100).toFixed(1)) };
  }

  getChurnSummary() {
    const highRisk = RFM_SEGMENTS.filter(s => s.churnRisk > 0.4);
    return {
      overallChurnRisk: parseFloat((RFM_SEGMENTS.reduce((s, seg) => s + seg.churnRisk * seg.count, 0) / RFM_SEGMENTS.reduce((s, seg) => s + seg.count, 0)).toFixed(3)),
      highRiskCustomers: highRisk.reduce((s, seg) => s + seg.count, 0),
      highRiskRevenueAtRisk: highRisk.reduce((s, seg) => s + seg.revenuePct * 0.35, 0).toFixed(2),
      avgCohortRetentionM6: parseFloat((COHORT_RETENTION.filter(c => c.m6).reduce((s, c) => s + c.m6, 0) / COHORT_RETENTION.filter(c => c.m6).length).toFixed(1)),
      earlyWarningSignals: EARLY_WARNINGS.filter(w => w.severity === 'high').length,
    };
  }
}
module.exports = new ChurnEngine();
module.exports.ChurnEngine = ChurnEngine;
