/**
 * Revenue Share Consolidation Engine
 * 
 * Aggregate and manage payouts across all partner revenue streams:
 * - White-label agencies (15-25% revenue share)
 * - Marketplace app developers (75% of sales)
 * - Affiliate partners (20-30% commission)
 * - Resellers (30-40% margin)
 * - Revenue share platforms
 * 
 * Handles monthly invoicing, payment scheduling, tax forms, reconciliation
 */

// In-memory storage
const partners = new Map();
const revenueEvents = new Map();
const payouts = new Map();
const disputes = new Map();

/**
 * Partner Types
 */
const PARTNER_TYPES = {
  whitelabel: {
    name: 'White-Label Agency',
    defaultSharePercent: 20,
    paymentTerms: 'NET30',
    minPayout: 100,
  },
  
  marketplace_developer: {
    name: 'Marketplace App Developer',
    defaultSharePercent: 75, // Developer gets 75%, platform keeps 25%
    paymentTerms: 'NET30',
    minPayout: 250,
  },
  
  affiliate: {
    name: 'Affiliate Partner',
    defaultSharePercent: 25,
    paymentTerms: 'NET15',
    minPayout: 50,
  },
  
  reseller: {
    name: 'Reseller',
    defaultSharePercent: 35,
    paymentTerms: 'NET30',
    minPayout: 500,
  },
  
  revenue_share: {
    name: 'Revenue Share Platform',
    defaultSharePercent: 10,
    paymentTerms: 'NET30',
    minPayout: 1000,
  },
};

/**
 * Register a new revenue-sharing partner
 */
function registerPartner(partnerType, partnerData) {
  if (!PARTNER_TYPES[partnerType]) {
    throw new Error(`Invalid partner type: ${partnerType}`);
  }
  
  const partnerId = `partner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const partner = {
    id: partnerId,
    type: partnerType,
    
    companyName: partnerData.companyName,
    contactName: partnerData.contactName,
    email: partnerData.email,
    
    // Revenue share configuration
    sharePercent: partnerData.sharePercent || PARTNER_TYPES[partnerType].defaultSharePercent,
    paymentTerms: partnerData.paymentTerms || PARTNER_TYPES[partnerType].paymentTerms,
    minPayout: partnerData.minPayout || PARTNER_TYPES[partnerType].minPayout,
    
    // Payment details
    paymentMethod: partnerData.paymentMethod || 'ach', // ach, wire, paypal
    bankAccount: partnerData.bankAccount || null,
    paypalEmail: partnerData.paypalEmail || null,
    
    // Tax information
    taxId: partnerData.taxId || null,
    taxCountry: partnerData.taxCountry || 'US',
    w9OnFile: partnerData.w9OnFile || false,
    
    // Metrics
    totalRevenue: 0,
    totalPayouts: 0,
    outstandingBalance: 0,
    
    status: 'active',
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  partners.set(partnerId, partner);
  return partner;
}

/**
 * Track revenue event that generates partner payout
 * 
 * @param {string} partnerId
 * @param {object} eventData - { amount, description, customerId, metadata }
 */
function trackRevenueEvent(partnerId, eventData) {
  const partner = partners.get(partnerId);
  if (!partner) {
    throw new Error('Partner not found');
  }
  
  const eventId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const revenueEvent = {
    id: eventId,
    partnerId,
    partnerType: partner.type,
    
    grossAmount: eventData.amount,
    sharePercent: partner.sharePercent,
    partnerEarnings: (eventData.amount * partner.sharePercent / 100),
    platformEarnings: (eventData.amount * (100 - partner.sharePercent) / 100),
    
    description: eventData.description,
    customerId: eventData.customerId || null,
    metadata: eventData.metadata || {},
    
    period: getCurrentPeriod(),
    payoutStatus: 'pending', // pending, paid, disputed
    
    createdAt: new Date().toISOString(),
  };
  
  revenueEvents.set(eventId, revenueEvent);
  
  // Update partner totals
  partner.totalRevenue += revenueEvent.grossAmount;
  partner.outstandingBalance += revenueEvent.partnerEarnings;
  partner.updatedAt = new Date().toISOString();
  
  return revenueEvent;
}

/**
 * Generate monthly payout for a partner
 * 
 * Aggregates all pending revenue events for the period
 */
function generateMonthlyPayout(partnerId, period = null) {
  period = period || getCurrentPeriod();
  
  const partner = partners.get(partnerId);
  if (!partner) {
    throw new Error('Partner not found');
  }
  
  // Get all pending revenue events for this partner in this period
  const pendingEvents = Array.from(revenueEvents.values()).filter(
    e => e.partnerId === partnerId && e.period === period && e.payoutStatus === 'pending'
  );
  
  if (pendingEvents.length === 0) {
    throw new Error('No pending revenue events for this period');
  }
  
  const totalEarnings = pendingEvents.reduce((sum, e) => sum + e.partnerEarnings, 0);
  
  // Check minimum payout threshold
  if (totalEarnings < partner.minPayout) {
    return {
      status: 'below_minimum',
      message: `Earnings $${totalEarnings.toFixed(2)} below minimum payout threshold $${partner.minPayout}`,
      willRollover: true,
    };
  }
  
  const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const payout = {
    id: payoutId,
    partnerId,
    period,
    
    partnerName: partner.companyName,
    partnerType: partner.type,
    
    // Earnings breakdown
    eventCount: pendingEvents.length,
    grossRevenue: pendingEvents.reduce((sum, e) => sum + e.grossAmount, 0),
    sharePercent: partner.sharePercent,
    totalEarnings,
    
    // Payment details
    paymentMethod: partner.paymentMethod,
    paymentTerms: partner.paymentTerms,
    dueDate: calculateDueDate(partner.paymentTerms),
    
    // Line items
    lineItems: pendingEvents.map(e => ({
      eventId: e.id,
      description: e.description,
      grossAmount: e.grossAmount,
      yourShare: e.partnerEarnings,
      date: e.createdAt,
    })),
    
    status: 'pending', // pending, scheduled, processing, paid, failed
    
    createdAt: new Date().toISOString(),
    paidAt: null,
  };
  
  payouts.set(payoutId, payout);
  
  // Mark revenue events as included in payout
  for (const event of pendingEvents) {
    event.payoutStatus = 'scheduled';
    event.payoutId = payoutId;
  }
  
  // Update partner outstanding balance
  partner.outstandingBalance -= totalEarnings;
  partner.updatedAt = new Date().toISOString();
  
  return payout;
}

/**
 * Process payout (mark as paid)
 */
function processPayout(payoutId, paymentData) {
  const payout = payouts.get(payoutId);
  if (!payout) {
    throw new Error('Payout not found');
  }
  
  if (payout.status === 'paid') {
    throw new Error('Payout already processed');
  }
  
  payout.status = 'paid';
  payout.paidAt = new Date().toISOString();
  payout.paymentReference = paymentData.reference || null;
  payout.paymentConfirmation = paymentData.confirmation || null;
  
  // Update partner totals
  const partner = partners.get(payout.partnerId);
  if (partner) {
    partner.totalPayouts += payout.totalEarnings;
    partner.updatedAt = new Date().toISOString();
  }
  
  // Mark all revenue events as paid
  const events = Array.from(revenueEvents.values()).filter(e => e.payoutId === payoutId);
  for (const event of events) {
    event.payoutStatus = 'paid';
  }
  
  return payout;
}

/**
 * Get partner earnings dashboard
 */
function getPartnerDashboard(partnerId) {
  const partner = partners.get(partnerId);
  if (!partner) {
    throw new Error('Partner not found');
  }
  
  const allPayouts = Array.from(payouts.values()).filter(p => p.partnerId === partnerId);
  const currentPeriod = getCurrentPeriod();
  const lastPeriod = getPreviousPeriod();
  
  // Current period pending earnings
  const currentPeriodEvents = Array.from(revenueEvents.values()).filter(
    e => e.partnerId === partnerId && e.period === currentPeriod
  );
  const currentPeriodEarnings = currentPeriodEvents.reduce((sum, e) => sum + e.partnerEarnings, 0);
  
  // Last period earnings (for comparison)
  const lastPeriodEvents = Array.from(revenueEvents.values()).filter(
    e => e.partnerId === partnerId && e.period === lastPeriod
  );
  const lastPeriodEarnings = lastPeriodEvents.reduce((sum, e) => sum + e.partnerEarnings, 0);
  
  const momGrowth = lastPeriodEarnings > 0
    ? ((currentPeriodEarnings - lastPeriodEarnings) / lastPeriodEarnings * 100).toFixed(1)
    : 'N/A';
  
  return {
    partner: {
      id: partner.id,
      companyName: partner.companyName,
      type: partner.type,
      sharePercent: partner.sharePercent,
    },
    
    totals: {
      totalRevenue: partner.totalRevenue,
      totalPayouts: partner.totalPayouts,
      outstandingBalance: partner.outstandingBalance,
    },
    
    currentPeriod: {
      period: currentPeriod,
      earnings: currentPeriodEarnings,
      eventCount: currentPeriodEvents.length,
      momGrowth: momGrowth + '%',
    },
    
    recentPayouts: allPayouts
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10),
  };
}

/**
 * Get all partners revenue analytics (admin view)
 */
function getAllPartnersAnalytics() {
  const period = getCurrentPeriod();
  const allPartners = Array.from(partners.values());
  
  const analytics = {
    period,
    totalPartners: allPartners.length,
    byType: {},
    totalRevenue: 0,
    totalPayouts: 0,
    outstandingPayouts: 0,
  };
  
  for (const partner of allPartners) {
    if (!analytics.byType[partner.type]) {
      analytics.byType[partner.type] = {
        name: PARTNER_TYPES[partner.type].name,
        count: 0,
        revenue: 0,
        payouts: 0,
      };
    }
    
    analytics.byType[partner.type].count++;
    analytics.byType[partner.type].revenue += partner.totalRevenue;
    analytics.byType[partner.type].payouts += partner.totalPayouts;
    
    analytics.totalRevenue += partner.totalRevenue;
    analytics.totalPayouts += partner.totalPayouts;
    analytics.outstandingPayouts += partner.outstandingBalance;
  }
  
  return analytics;
}

/**
 * Generate 1099-MISC forms for US partners
 * 
 * Required for partners paid >$600 in calendar year
 */
function generate1099Forms(year) {
  const forms = [];
  
  for (const partner of partners.values()) {
    if (partner.taxCountry !== 'US') continue;
    if (!partner.w9OnFile) continue;
    
    // Sum all payouts for this calendar year
    const yearPayouts = Array.from(payouts.values()).filter(
      p => p.partnerId === partner.id &&
           p.status === 'paid' &&
           new Date(p.paidAt).getFullYear() === year
    );
    
    const totalPaid = yearPayouts.reduce((sum, p) => sum + p.totalEarnings, 0);
    
    // Only generate if >$600
    if (totalPaid > 600) {
      forms.push({
        partnerId: partner.id,
        companyName: partner.companyName,
        taxId: partner.taxId,
        year,
        totalNonemployeeCompensation: totalPaid,
        formUrl: `/tax-forms/1099-MISC-${year}-${partner.id}.pdf`, // Would generate actual PDF
      });
    }
  }
  
  return forms;
}

/**
 * Create payout dispute
 */
function createDispute(payoutId, reason, description) {
  const payout = payouts.get(payoutId);
  if (!payout) {
    throw new Error('Payout not found');
  }
  
  const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const dispute = {
    id: disputeId,
    payoutId,
    partnerId: payout.partnerId,
    
    reason, // discrepancy, missing_revenue, calculation_error, other
    description,
    
    status: 'open', // open, investigating, resolved, rejected
    
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolution: null,
  };
  
  disputes.set(disputeId, dispute);
  
  // Mark payout as disputed
  payout.disputed = true;
  
  return dispute;
}

/**
 * Resolve dispute
 */
function resolveDispute(disputeId, resolution, adjustmentAmount = 0) {
  const dispute = disputes.get(disputeId);
  if (!dispute) {
    throw new Error('Dispute not found');
  }
  
  dispute.status = 'resolved';
  dispute.resolvedAt = new Date().toISOString();
  dispute.resolution = resolution;
  dispute.adjustmentAmount = adjustmentAmount;
  
  // If adjustment needed, create adjustment payout
  if (adjustmentAmount !== 0) {
    const payout = payouts.get(dispute.payoutId);
    const partner = partners.get(dispute.partnerId);
    
    const adjustmentPayoutId = `payout_adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const adjustmentPayout = {
      id: adjustmentPayoutId,
      partnerId: dispute.partnerId,
      period: getCurrentPeriod(),
      
      partnerName: partner.companyName,
      partnerType: partner.type,
      
      eventCount: 1,
      grossRevenue: adjustmentAmount,
      sharePercent: 100,
      totalEarnings: adjustmentAmount,
      
      paymentMethod: partner.paymentMethod,
      paymentTerms: 'NET7', // Fast-track dispute adjustments
      dueDate: calculateDueDate('NET7'),
      
      lineItems: [{
        eventId: dispute.id,
        description: `Dispute adjustment for payout ${payout.id}`,
        grossAmount: adjustmentAmount,
        yourShare: adjustmentAmount,
        date: new Date().toISOString(),
      }],
      
      status: 'pending',
      isAdjustment: true,
      originalPayoutId: dispute.payoutId,
      
      createdAt: new Date().toISOString(),
      paidAt: null,
    };
    
    payouts.set(adjustmentPayoutId, adjustmentPayout);
  }
  
  return dispute;
}

// Helper functions
function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousPeriod() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function calculateDueDate(paymentTerms) {
  const now = new Date();
  const days = parseInt(paymentTerms.replace('NET', ''));
  now.setDate(now.getDate() + days);
  return now.toISOString().split('T')[0];
}

// Export
module.exports = {
  // Partner management
  registerPartner,
  
  // Revenue tracking
  trackRevenueEvent,
  
  // Payouts
  generateMonthlyPayout,
  processPayout,
  
  // Dashboards
  getPartnerDashboard,
  getAllPartnersAnalytics,
  
  // Tax compliance
  generate1099Forms,
  
  // Disputes
  createDispute,
  resolveDispute,
  
  // Constants
  PARTNER_TYPES,
};
