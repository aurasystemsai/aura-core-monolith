'use strict';
/**
 * Returns & RMA Intelligence Engine
 * Fraud detection, propensity scoring, disposition rules, exchange-first
 */

const RETURN_REASONS = [
  { id: 'r1', category: 'size', label: 'Wrong size / fit', count: 284, pct: 0.34, fraudRisk: 0.04, revenue: 8420, avgDays: 8.2 },
  { id: 'r2', category: 'quality', label: 'Quality not as expected', count: 142, pct: 0.17, fraudRisk: 0.08, revenue: 4810, avgDays: 11.4 },
  { id: 'r3', category: 'expectation', label: 'Not as described / pictured', count: 117, pct: 0.14, fraudRisk: 0.06, revenue: 3940, avgDays: 9.8 },
  { id: 'r4', category: 'changed-mind', label: 'Changed my mind', count: 98, pct: 0.12, fraudRisk: 0.18, revenue: 3210, avgDays: 12.1 },
  { id: 'r5', category: 'damage', label: 'Damaged / defective', count: 76, pct: 0.09, fraudRisk: 0.02, revenue: 2680, avgDays: 6.4 },
  { id: 'r6', category: 'fraud', label: 'Suspected fraud / wardrobing', count: 41, pct: 0.05, fraudRisk: 0.94, revenue: 1540, avgDays: 18.6 },
  { id: 'r7', category: 'other', label: 'Other', count: 75, pct: 0.09, fraudRisk: 0.12, revenue: 2290, avgDays: 10.2 },
];

const FRAUD_FLAGS = [
  { customerId: 'C-8841', name: 'Customer A', returnRate: 0.78, avgReturnDays: 24.1, totalOrders: 9, totalReturns: 7, fraudScore: 0.89, flag: 'serial-returner' },
  { customerId: 'C-3319', name: 'Customer B', returnRate: 0.60, avgReturnDays: 16.8, totalOrders: 5, totalReturns: 3, fraudScore: 0.71, flag: 'wardrobing' },
  { customerId: 'C-1102', name: 'Customer C', returnRate: 0.50, avgReturnDays: 28.3, totalOrders: 4, totalReturns: 2, fraudScore: 0.63, flag: 'high-value-pattern' },
];

const DISPOSITIONS = [
  { id: 'd1', condition: 'Like New', action: 'restock', pct: 0.52, avgRecovery: 0.92 },
  { id: 'd2', condition: 'Minor Defects', action: 'refurbish', pct: 0.21, avgRecovery: 0.68 },
  { id: 'd3', condition: 'Significant Damage', action: 'liquidate', pct: 0.14, avgRecovery: 0.24 },
  { id: 'd4', condition: 'Unsaleable', action: 'donate', pct: 0.08, avgRecovery: 0 },
  { id: 'd5', condition: 'Hazardous', action: 'destroy', pct: 0.05, avgRecovery: 0 },
];

class ReturnsEngine {
  getReturnsOverview() {
    const totalReturns = RETURN_REASONS.reduce((s, r) => s + r.count, 0);
    const totalRevenue = RETURN_REASONS.reduce((s, r) => s + r.revenue, 0);
    return { totalReturns, returnRate: 0.128, totalRevenueLost: totalRevenue, avgReturnDays: 10.3, fraudFlagged: FRAUD_FLAGS.length, netMerchandiseRecoveryRate: 0.71, exchangeConversionRate: 0.34, topReasons: RETURN_REASONS.slice(0, 3) };
  }

  getReturnReasons() { return RETURN_REASONS; }

  getFraudFlags() { return FRAUD_FLAGS; }

  scoreReturnPropensity(customerId, productId) {
    const baseRate = 0.128;
    const random = (Math.sin(customerId.length * productId.length) + 1) / 2;
    const score = Math.min(0.95, baseRate + random * 0.3);
    return { customerId, productId, propensityScore: parseFloat(score.toFixed(3)), risk: score > 0.4 ? 'high' : score > 0.25 ? 'medium' : 'low', recommendation: score > 0.4 ? 'Show size guide + reviews' : 'Standard checkout' };
  }

  getDispositions() { return DISPOSITIONS; }

  suggestExchange(returnReason, originalProduct) {
    const suggestions = reason => reason === 'size' ? [{ type: 'size-exchange', incentive: 'Free exchange + 10% off next order', conversionProb: 0.62 }] :
      reason === 'expectation' ? [{ type: 'alternative-product', incentive: 'Free return + $10 store credit if keep alternative', conversionProb: 0.38 }] :
      [{ type: 'store-credit', incentive: '110% store credit vs refund', conversionProb: 0.29 }];
    return { returnReason, originalProduct, suggestions: suggestions(returnReason), estimatedRevenueSaved: Math.floor(Math.random() * 60) + 20 };
  }

  getKpis() {
    return {
      returnRate: { value: '12.8%', trend: '-0.4%', status: 'improving' },
      nmrr: { value: '71%', trend: '+3%', status: 'improving', label: 'Net Merchandise Recovery Rate' },
      exchangeRate: { value: '34%', trend: '+5%', status: 'improving' },
      fraudRate: { value: '4.9%', trend: '+1.2%', status: 'watch' },
      avgProcessingDays: { value: '3.2', trend: '-0.8', status: 'improving' },
    };
  }
}
module.exports = new ReturnsEngine();
module.exports.ReturnsEngine = ReturnsEngine;
