'use strict';
/**
 * Finance Autopilot Engine
 * AP/AR automation, bank reconciliation, GL mapping, expense NLP
 */

const INVOICES = [
  { id: 'inv001', vendor: 'EcoFabrics Ltd', amount: 14800, dueDate: '2026-08-10', status: 'pending', poMatch: 'PO-2024', discountAvailable: 296, discountTerms: '2/10 net 30', autoApprove: true },
  { id: 'inv002', vendor: 'GlobalTextile Co', amount: 8240, dueDate: '2026-08-02', status: 'overdue', poMatch: null, discountAvailable: 0, discountTerms: null, autoApprove: false, exception: 'No matching PO found' },
  { id: 'inv003', vendor: 'OrganicSource GmbH', amount: 3100, dueDate: '2026-08-18', status: 'approved', poMatch: 'PO-2028', discountAvailable: 62, discountTerms: '2/10 net 30', autoApprove: true },
  { id: 'inv004', vendor: 'FastMake Inc', amount: 22600, dueDate: '2026-07-28', status: 'exception', poMatch: 'PO-2019', exception: 'Amount exceeds PO by 12%', discountAvailable: 0, autoApprove: false },
];

const BANK_TRANSACTIONS = [
  { id: 'bt1', date: '2026-07-18', description: 'SHOPIFY PAYOUT 23847', amount: 18420, matched: true, matchedTo: 'Shopify Payout #23847', confidence: 0.99 },
  { id: 'bt2', date: '2026-07-19', description: 'ECOFABRICS LTD INV-4812', amount: -14800, matched: true, matchedTo: 'inv001', confidence: 0.97 },
  { id: 'bt3', date: '2026-07-20', description: 'STRIPE PMT FEE', amount: -284, matched: true, matchedTo: 'Stripe Fees July', confidence: 0.95 },
  { id: 'bt4', date: '2026-07-21', description: 'UNKNOWN PMT REF88821', amount: -1640, matched: false, matchedTo: null, confidence: 0 },
  { id: 'bt5', date: '2026-07-22', description: 'SHOPIFY PAYOUT 23901', amount: 21840, matched: true, matchedTo: 'Shopify Payout #23901', confidence: 0.99 },
];

const GL_RULES = [
  { keyword: 'SHOPIFY PAYOUT', account: '4000 - Sales Revenue', confidence: 0.99 },
  { keyword: 'STRIPE', account: '6120 - Payment Processing Fees', confidence: 0.96 },
  { keyword: 'GOOGLE ADS', account: '6200 - Digital Advertising', confidence: 0.98 },
  { keyword: 'ECOFABRICS', account: '5000 - Cost of Goods Sold', confidence: 0.97 },
  { keyword: 'SHOPIFY SUBSCRIPTION', account: '6110 - Software & SaaS', confidence: 0.98 },
];

class FinanceAutopilotEngine {
  getInvoices(options = {}) {
    let invoices = INVOICES;
    if (options.status) invoices = invoices.filter(i => i.status === options.status);
    return invoices.map(i => ({ ...i, earlyPaySavings: i.discountAvailable, npv: i.discountAvailable > 0 ? parseFloat((i.discountAvailable - i.amount * 0.0001 * 20).toFixed(2)) : 0 }));
  }

  getBankReconciliation() {
    const matched = BANK_TRANSACTIONS.filter(t => t.matched);
    const unmatched = BANK_TRANSACTIONS.filter(t => !t.matched);
    return { transactions: BANK_TRANSACTIONS, matchedCount: matched.length, unmatchedCount: unmatched.length, reconciliationRate: parseFloat((matched.length / BANK_TRANSACTIONS.length).toFixed(2)), exceptions: unmatched };
  }

  mapGlAccount(description) {
    const match = GL_RULES.find(r => description.toUpperCase().includes(r.keyword));
    return match ? { description, account: match.account, confidence: match.confidence } : { description, account: '9999 - Unclassified', confidence: 0, needsReview: true };
  }

  getApDashboard() {
    const invoices = this.getInvoices();
    const overdue = invoices.filter(i => i.status === 'overdue');
    const earlyPayOpportunity = invoices.filter(i => i.discountAvailable > 0).reduce((s, i) => s + i.discountAvailable, 0);
    return { totalPayables: invoices.reduce((s, i) => s + i.amount, 0), overdueCount: overdue.length, overdueAmount: overdue.reduce((s, i) => s + i.amount, 0), autoApprovedToday: invoices.filter(i => i.autoApprove).length, earlyPayOpportunity, exceptionCount: invoices.filter(i => i.exception).length };
  }

  detectDuplicates() {
    return [{ suspected: 'inv002 + inv_old_8240', reason: 'Same vendor, same amount, within 30 days', action: 'review', savingIfDuplicate: 8240 }];
  }

  reconcileShopifyPayout(payoutId) {
    return { payoutId, grossAmount: 21840, shopifyFees: 654, netAmount: 21186, orderCount: 41, refunds: 3, disputedAmount: 0, status: 'reconciled', timestamp: new Date().toISOString() };
  }
}
module.exports = new FinanceAutopilotEngine();
module.exports.FinanceAutopilotEngine = FinanceAutopilotEngine;
