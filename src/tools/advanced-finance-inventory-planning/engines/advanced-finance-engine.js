'use strict';
/**
 * Advanced Finance & Inventory Planning Engine
 * 13-week cash flow, P&L, OTB, Monte Carlo, multi-currency
 */

const CASH_FLOW_13W = Array.from({ length: 13 }, (_, i) => ({
  week: i + 1,
  label: 'Wk ' + (i + 1),
  inflows: Math.round(48000 + Math.sin(i * 0.7) * 12000 + Math.random() * 5000),
  outflows: Math.round(31000 + Math.sin(i * 0.5 + 1) * 8000 + Math.random() * 3000),
  get netCashFlow() { return this.inflows - this.outflows; },
  optimistic: Math.round(55000 + i * 800),
  base: Math.round(48000 + i * 400),
  pessimistic: Math.round(41000 + i * 100),
}));

const PNL = {
  revenue: 284000, cogs: 108000, grossProfit: 176000, grossMarginPct: 0.619,
  opex: { marketing: 28400, salaries: 42000, tech: 8500, shipping: 14200, returns: 9100, other: 6800 },
  ebitda: 67000, ebitdaPct: 0.236,
  priorPeriod: { revenue: 241000, grossProfit: 148000, ebitda: 52000 },
};

const OTB = {
  plannedSales: 96000, beginningStock: 142000, endingStock: 85000,
  get otb() { return this.plannedSales + this.endingStock - this.beginningStock; },
  committed: 38000, get open() { return this.otb - this.committed; },
  categories: [
    { name: 'Tops', plannedSales: 38000, otb: 22000, used: 14000 },
    { name: 'Bottoms', plannedSales: 24000, otb: 15000, used: 8000 },
    { name: 'Dresses', plannedSales: 21000, otb: 13000, used: 10000 },
    { name: 'Accessories', plannedSales: 13000, otb: 7000, used: 6000 },
  ],
};

class AdvancedFinanceEngine {
  getCashFlow() {
    const weeks = CASH_FLOW_13W.map(w => ({ ...w, netCashFlow: w.inflows - w.outflows }));
    return { weeks, totalInflows: weeks.reduce((s, w) => s + w.inflows, 0), totalOutflows: weeks.reduce((s, w) => s + w.outflows, 0), netCashFlow: weeks.reduce((s, w) => s + w.netCashFlow, 0), lowCashWeek: weeks.sort((a, b) => a.netCashFlow - b.netCashFlow)[0] };
  }

  getPnl() {
    const totalOpex = Object.values(PNL.opex).reduce((s, v) => s + v, 0);
    return { ...PNL, totalOpex, netIncome: PNL.ebitda - totalOpex * 0.1, yoyRevenueGrowth: parseFloat(((PNL.revenue / PNL.priorPeriod.revenue - 1) * 100).toFixed(1)), yoyEbitdaGrowth: parseFloat(((PNL.ebitda / PNL.priorPeriod.ebitda - 1) * 100).toFixed(1)) };
  }

  getOtb() {
    return { ...OTB, otb: OTB.plannedSales + OTB.endingStock - OTB.beginningStock, open: OTB.plannedSales + OTB.endingStock - OTB.beginningStock - OTB.committed, utilizationRate: OTB.committed / (OTB.plannedSales + OTB.endingStock - OTB.beginningStock) };
  }

  runMonteCarlo(simulations = 1000) {
    const results = Array.from({ length: simulations }, () => {
      const revenueVar = 1 + (Math.random() - 0.5) * 0.4;
      const cogVar = 1 + (Math.random() - 0.5) * 0.2;
      return PNL.revenue * revenueVar - PNL.cogs * cogVar;
    }).sort((a, b) => a - b);
    return { simulations, p5: Math.round(results[Math.floor(simulations * 0.05)]), p25: Math.round(results[Math.floor(simulations * 0.25)]), p50: Math.round(results[Math.floor(simulations * 0.5)]), p75: Math.round(results[Math.floor(simulations * 0.75)]), p95: Math.round(results[Math.floor(simulations * 0.95)]), mean: Math.round(results.reduce((s, v) => s + v, 0) / simulations) };
  }

  getCccAnalysis() {
    return { dso: 0, dpo: 28, dio: 42, ccc: 42 - 28, interpretation: 'Cash tied in inventory for 14 days on average', opportunities: [{ action: 'Extend supplier payment terms to 45 days', impact: '-$18,000 working capital required' }, { action: 'Reduce inventory days by 5 via better forecasting', impact: '-$12,000 working capital required' }] };
  }

  getBudgetVsActuals() {
    return [
      { metric: 'Revenue', budget: 270000, actual: PNL.revenue, variance: PNL.revenue - 270000, variancePct: parseFloat(((PNL.revenue / 270000 - 1) * 100).toFixed(1)) },
      { metric: 'COGS', budget: 115000, actual: PNL.cogs, variance: PNL.cogs - 115000, variancePct: parseFloat(((PNL.cogs / 115000 - 1) * 100).toFixed(1)) },
      { metric: 'Gross Profit', budget: 155000, actual: PNL.grossProfit, variance: PNL.grossProfit - 155000, variancePct: parseFloat(((PNL.grossProfit / 155000 - 1) * 100).toFixed(1)) },
      { metric: 'EBITDA', budget: 58000, actual: PNL.ebitda, variance: PNL.ebitda - 58000, variancePct: parseFloat(((PNL.ebitda / 58000 - 1) * 100).toFixed(1)) },
    ];
  }
}
module.exports = new AdvancedFinanceEngine();
module.exports.AdvancedFinanceEngine = AdvancedFinanceEngine;
