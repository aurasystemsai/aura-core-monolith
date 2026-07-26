'use strict';
/**
 * Inventory Forecasting Engine
 * ABC-XYZ matrix, safety stock, EOQ, stockout risk, demand signals
 */

const SAMPLE_SKUS = [
  { sku: 'SKU-001', name: 'Classic White Tee', category: 'Tops', avgDailySales: 14.2, stdDev: 3.1, leadTimeDays: 7, reorderPoint: 145, safetyStock: 32, eoq: 280, stockLevel: 210, abcClass: 'A', xyzClass: 'X', stockoutRisk7d: 0.08, stockoutRisk30d: 0.31, forecastAccuracy: 0.89 },
  { sku: 'SKU-002', name: 'Organic Cotton Hoodie', category: 'Tops', avgDailySales: 8.7, stdDev: 4.2, leadTimeDays: 10, reorderPoint: 140, safetyStock: 55, eoq: 190, stockLevel: 95, abcClass: 'A', xyzClass: 'Y', stockoutRisk7d: 0.34, stockoutRisk30d: 0.72, forecastAccuracy: 0.81 },
  { sku: 'SKU-003', name: 'Slim Fit Jeans', category: 'Bottoms', avgDailySales: 5.4, stdDev: 1.8, leadTimeDays: 14, reorderPoint: 110, safetyStock: 28, eoq: 145, stockLevel: 320, abcClass: 'B', xyzClass: 'X', stockoutRisk7d: 0.02, stockoutRisk30d: 0.05, forecastAccuracy: 0.93 },
  { sku: 'SKU-004', name: 'Linen Summer Dress', category: 'Dresses', avgDailySales: 11.3, stdDev: 6.8, leadTimeDays: 21, reorderPoint: 380, safetyStock: 148, eoq: 240, stockLevel: 180, abcClass: 'A', xyzClass: 'Z', stockoutRisk7d: 0.61, stockoutRisk30d: 0.89, forecastAccuracy: 0.71 },
  { sku: 'SKU-005', name: 'Canvas Tote Bag', category: 'Accessories', avgDailySales: 2.1, stdDev: 0.8, leadTimeDays: 5, reorderPoint: 25, safetyStock: 12, eoq: 80, stockLevel: 440, abcClass: 'C', xyzClass: 'X', stockoutRisk7d: 0.01, stockoutRisk30d: 0.02, forecastAccuracy: 0.96 },
];

const FORECAST_DATA = [
  { period: 'Week 1', actual: 98, forecast: 102, lower: 88, upper: 116 },
  { period: 'Week 2', actual: 111, forecast: 108, lower: 94, upper: 122 },
  { period: 'Week 3', actual: 89, forecast: 95, lower: 81, upper: 109 },
  { period: 'Week 4', actual: 124, forecast: 118, lower: 104, upper: 132 },
  { period: 'Week 5', actual: null, forecast: 131, lower: 115, upper: 147 },
  { period: 'Week 6', actual: null, forecast: 128, lower: 112, upper: 144 },
  { period: 'Week 7', actual: null, forecast: 136, lower: 118, upper: 154 },
  { period: 'Week 8', actual: null, forecast: 142, lower: 124, upper: 160 },
];

const SEASONAL_INDEX = [
  { month: 'Jan', index: 0.72 }, { month: 'Feb', index: 0.78 }, { month: 'Mar', index: 0.91 },
  { month: 'Apr', index: 1.05 }, { month: 'May', index: 1.18 }, { month: 'Jun', index: 1.24 },
  { month: 'Jul', index: 1.19 }, { month: 'Aug', index: 1.11 }, { month: 'Sep', index: 1.08 },
  { month: 'Oct', index: 1.14 }, { month: 'Nov', index: 1.38 }, { month: 'Dec', index: 1.22 },
];

class InventoryForecastingEngine {
  getSkus(options = {}) {
    let skus = SAMPLE_SKUS;
    if (options.abcClass) skus = skus.filter(s => s.abcClass === options.abcClass);
    if (options.highRisk) skus = skus.filter(s => s.stockoutRisk30d > 0.5);
    return skus.map(s => ({ ...s, reorderNeeded: s.stockLevel <= s.reorderPoint, coverageDays: Math.floor(s.stockLevel / s.avgDailySales) }));
  }

  getForecast(sku) {
    return { sku, model: 'Prophet+XGBoost Ensemble', forecast: FORECAST_DATA, mape: 0.087, r2: 0.94, confidence: 0.95 };
  }

  getAbcXyzMatrix() {
    const matrix = {};
    for (const cls of ['A','B','C']) for (const xcls of ['X','Y','Z']) {
      matrix[cls + xcls] = SAMPLE_SKUS.filter(s => s.abcClass === cls && s.xyzClass === xcls).map(s => s.name);
    }
    return { matrix, policy: { AX: 'Tight control, frequent ordering', AY: 'Regular review, safety buffer', AZ: 'High safety stock, dual sourcing', BX: 'Standard reorder', BY: 'Moderate buffer', BZ: 'Safety stock + supplier risk', CX: 'Min order + JIT', CY: 'Low stock OK', CZ: 'Consignment/dropship' } };
  }

  calcSafetyStock(sku, serviceLevel = 0.95) {
    const zScore = serviceLevel >= 0.99 ? 2.576 : serviceLevel >= 0.975 ? 1.96 : serviceLevel >= 0.95 ? 1.645 : 1.282;
    const safetyStock = Math.round(zScore * sku.stdDev * Math.sqrt(sku.leadTimeDays));
    return { sku: sku.sku, serviceLevel, zScore, safetyStock, currentSafetyStock: sku.safetyStock, delta: safetyStock - sku.safetyStock };
  }

  calcEoq(sku, annualHoldingCostPct = 0.25, orderCost = 50) {
    const annualDemand = sku.avgDailySales * 365;
    const unitCost = 25; // assumed
    const eoq = Math.round(Math.sqrt((2 * annualDemand * orderCost) / (annualHoldingCostPct * unitCost)));
    return { sku: sku.sku, annualDemand: Math.round(annualDemand), orderCost, holdingCostPct: annualHoldingCostPct, eoq, ordersPerYear: Math.round(annualDemand / eoq), totalCost: Math.round((annualDemand / eoq) * orderCost + (eoq / 2) * unitCost * annualHoldingCostPct) };
  }

  getStockoutRisks() {
    return SAMPLE_SKUS.filter(s => s.stockoutRisk7d > 0.2 || s.stockoutRisk30d > 0.5).map(s => ({ sku: s.sku, name: s.name, risk7d: s.stockoutRisk7d, risk30d: s.stockoutRisk30d, stockLevel: s.stockLevel, reorderPoint: s.reorderPoint, urgency: s.stockoutRisk7d > 0.5 ? 'critical' : 'high' }));
  }

  getSeasonalIndex() { return SEASONAL_INDEX; }

  generatePurchaseOrder(sku) {
    const qty = Math.max(sku.eoq, sku.reorderPoint - sku.stockLevel + sku.safetyStock);
    return { sku: sku.sku, name: sku.name, orderQty: qty, estimatedArrival: new Date(Date.now() + sku.leadTimeDays * 86400000).toISOString().split('T')[0], supplier: 'Primary Supplier', estimatedCost: qty * 18, status: 'draft' };
  }

  whatIfScenario(demandMultiplier, leadTimeMultiplier) {
    return SAMPLE_SKUS.map(s => ({
      sku: s.sku,
      name: s.name,
      newDailySales: parseFloat((s.avgDailySales * demandMultiplier).toFixed(1)),
      newLeadTime: Math.round(s.leadTimeDays * leadTimeMultiplier),
      newSafetyStock: Math.round(s.safetyStock * demandMultiplier * leadTimeMultiplier),
      stockoutRiskChange: parseFloat(((s.stockoutRisk30d * demandMultiplier * leadTimeMultiplier) - s.stockoutRisk30d).toFixed(2)),
    }));
  }
}
module.exports = new InventoryForecastingEngine();
module.exports.InventoryForecastingEngine = InventoryForecastingEngine;
