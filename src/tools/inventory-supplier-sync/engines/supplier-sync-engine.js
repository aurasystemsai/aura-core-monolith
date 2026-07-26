'use strict';
/**
 * Supplier Intelligence Engine
 * Scorecards, lead time prediction, risk monitoring, EDI, VMI
 */

const SUPPLIERS = [
  { id: 's1', name: 'EcoFabrics Ltd', country: 'Portugal', categories: ['Tops','Dresses'], leadTimeDays: 14, leadTimeStdDev: 2.1, onTimeRate: 0.94, qualityRate: 0.98, priceCompetitiveness: 0.82, sustainability: 0.91, financialHealth: 0.88, riskScore: 0.12, overallScore: 91, status: 'preferred', annualSpend: 142000, priceTrend: -0.02 },
  { id: 's2', name: 'GlobalTextile Co', country: 'Bangladesh', categories: ['Tops','Bottoms'], leadTimeDays: 28, leadTimeStdDev: 6.4, onTimeRate: 0.78, qualityRate: 0.91, priceCompetitiveness: 0.95, sustainability: 0.52, financialHealth: 0.71, riskScore: 0.38, overallScore: 74, status: 'active', annualSpend: 89000, priceTrend: 0.04 },
  { id: 's3', name: 'OrganicSource GmbH', country: 'Germany', categories: ['Accessories'], leadTimeDays: 10, leadTimeStdDev: 1.4, onTimeRate: 0.97, qualityRate: 0.99, priceCompetitiveness: 0.68, sustainability: 0.97, financialHealth: 0.94, riskScore: 0.06, overallScore: 95, status: 'preferred', annualSpend: 38000, priceTrend: 0.01 },
  { id: 's4', name: 'FastMake Inc', country: 'China', categories: ['Bottoms','Dresses'], leadTimeDays: 35, leadTimeStdDev: 9.2, onTimeRate: 0.71, qualityRate: 0.87, priceCompetitiveness: 0.98, sustainability: 0.41, financialHealth: 0.65, riskScore: 0.51, overallScore: 62, status: 'watch', annualSpend: 61000, priceTrend: -0.06 },
];

const DISRUPTION_ALERTS = [
  { id: 'da1', type: 'geopolitical', severity: 'medium', supplier: 's2', message: 'Port congestion at Chittagong — expect 5-7 day delays', affectedOrders: 3, created: '2026-07-20' },
  { id: 'da2', type: 'financial', severity: 'high', supplier: 's4', message: 'FastMake credit rating downgraded — review payment terms', affectedOrders: 1, created: '2026-07-22' },
];

class SupplierSyncEngine {
  getSuppliers(options = {}) {
    let suppliers = SUPPLIERS;
    if (options.status) suppliers = suppliers.filter(s => s.status === options.status);
    if (options.minScore) suppliers = suppliers.filter(s => s.overallScore >= options.minScore);
    return suppliers.map(s => ({ ...s, daysUntilLeadTimeRisk: Math.round((s.leadTimeDays + s.leadTimeStdDev * 2) - s.leadTimeDays) }));
  }

  getScorecard(supplierId) {
    const supplier = SUPPLIERS.find(s => s.id === supplierId);
    if (!supplier) return { error: 'Supplier not found' };
    return {
      ...supplier,
      breakdown: {
        onTime: { score: Math.round(supplier.onTimeRate * 100), weight: 0.30, label: 'On-Time Delivery' },
        quality: { score: Math.round(supplier.qualityRate * 100), weight: 0.25, label: 'Quality Rate' },
        price: { score: Math.round(supplier.priceCompetitiveness * 100), weight: 0.20, label: 'Price Competitiveness' },
        sustainability: { score: Math.round(supplier.sustainability * 100), weight: 0.15, label: 'Sustainability' },
        financial: { score: Math.round(supplier.financialHealth * 100), weight: 0.10, label: 'Financial Health' },
      },
      trend: supplier.priceTrend < 0 ? 'decreasing' : 'increasing',
      recommendation: supplier.overallScore >= 85 ? 'Increase allocation' : supplier.overallScore >= 70 ? 'Maintain allocation' : 'Reduce allocation / find alternative',
    };
  }

  getLeadTimePrediction(supplierId) {
    const s = SUPPLIERS.find(sup => sup.id === supplierId);
    if (!s) return { error: 'Not found' };
    return {
      supplier: s.name,
      expectedDays: s.leadTimeDays,
      p10: Math.round(s.leadTimeDays - s.leadTimeStdDev * 1.28),
      p50: s.leadTimeDays,
      p90: Math.round(s.leadTimeDays + s.leadTimeStdDev * 1.28),
      p99: Math.round(s.leadTimeDays + s.leadTimeStdDev * 2.33),
      distribution: 'log-normal',
      confidence: 0.92,
    };
  }

  getDisruptionAlerts() { return DISRUPTION_ALERTS; }

  getAlternativeSuppliers(category) {
    return SUPPLIERS.filter(s => s.categories.includes(category)).sort((a, b) => b.overallScore - a.overallScore);
  }

  getCarbonFootprint() {
    return SUPPLIERS.map(s => ({ id: s.id, name: s.name, country: s.country, sustainabilityScore: s.sustainability, estimatedCO2PerKg: s.country === 'Germany' ? 2.1 : s.country === 'Portugal' ? 3.4 : s.country === 'Bangladesh' ? 8.2 : 9.6, annualTonnage: Math.round(s.annualSpend / 180 * 0.8 / 1000 * 10) / 10 }));
  }

  getBenchmarks() {
    return {
      avgOnTimeRate: parseFloat((SUPPLIERS.reduce((sum, s) => sum + s.onTimeRate, 0) / SUPPLIERS.length).toFixed(2)),
      avgQualityRate: parseFloat((SUPPLIERS.reduce((sum, s) => sum + s.qualityRate, 0) / SUPPLIERS.length).toFixed(2)),
      avgLeadTimeDays: Math.round(SUPPLIERS.reduce((sum, s) => sum + s.leadTimeDays, 0) / SUPPLIERS.length),
      industryOnTimeRate: 0.88, industryQualityRate: 0.94, industryLeadTime: 21,
    };
  }
}
module.exports = new SupplierSyncEngine();
module.exports.SupplierSyncEngine = SupplierSyncEngine;
