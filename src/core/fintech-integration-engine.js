/**
 * Fintech Integration Engine
 * 
 * Embedded financial services using CDP data for underwriting
 * Foundation for $100M+ fintech revenue stream
 * 
 * Products:
 * - Net-30 Terms (trade credit)
 * - Working capital loans
 * - Revenue-based financing
 * - Credit scoring (Aura Score)
 * 
 * Features:
 * - Automated underwriting using CDP data
 * - Risk assessment from behavior patterns
 * - Loan origination workflow
 * - Payment tracking
 * - Revenue forecasting
 */

// In-memory storage (Replace with PostgreSQL in production)
const creditScores = new Map();
const loans = new Map();
const netTermsContracts = new Map();
const revenueBasedDeals = new Map();
const paymentHistory = new Map();

/**
 * Credit Score Weights
 */
const SCORE_WEIGHTS = {
  revenue_trend: 0.30,        // 30% - revenue growth trajectory
  customer_retention: 0.25,   // 25% - cohort retention rates
  ltv_to_cac: 0.20,          // 20% - customer acquisition efficiency
  payment_history: 0.15,      // 15% - payment behavior
  business_tenure: 0.10,      // 10% - how long in business
};

/**
 * Risk Tiers
 */
const RISK_TIERS = {
  excellent: { min: 750, max: 850, interestRate: 0.08, maxCredit: 1000000 },
  good: { min: 680, max: 749, interestRate: 0.10, maxCredit: 500000 },
  fair: { min: 620, max: 679, interestRate: 0.12, maxCredit: 250000 },
  poor: { min: 550, max: 619, interestRate: 0.15, maxCredit: 100000 },
  bad: { min: 300, max: 549, interestRate: 0.18, maxCredit: 50000 },
};

/**
 * Calculate Aura Score (credit score for e-commerce brands)
 * 
 * @param {string} customerId
 * @param {object} cdpData - Data from CDP
 * @returns {object} Credit score and factors
 */
function calculateAuraScore(customerId, cdpData) {
  // Extract metrics from CDP
  const {
    revenueHistory = [],
    cohortData = {},
    metrics = {},
    transactionHistory = [],
    createdAt,
  } = cdpData;
  
  // 1. Revenue Trend Score (0-100)
  const revenueTrendScore = analyzeRevenueTrend(revenueHistory);
  
  // 2. Customer Retention Score (0-100)
  const retentionScore = calculateRetentionScore(cohortData);
  
  // 3. LTV to CAC Score (0-100)
  const ltvCacScore = calculateLTVCACScore(metrics.ltv, metrics.cac);
  
  // 4. Payment History Score (0-100)
  const paymentScore = analyzePaymentBehavior(transactionHistory);
  
  // 5. Business Tenure Score (0-100)
  const tenureScore = calculateTenureScore(createdAt);
  
  // Calculate weighted score
  const weightedScore = 
    (revenueTrendScore * SCORE_WEIGHTS.revenue_trend) +
    (retentionScore * SCORE_WEIGHTS.customer_retention) +
    (ltvCacScore * SCORE_WEIGHTS.ltv_to_cac) +
    (paymentScore * SCORE_WEIGHTS.payment_history) +
    (tenureScore * SCORE_WEIGHTS.business_tenure);
  
  // Normalize to 300-850 range (FICO-style)
  const auraScore = Math.round(300 + (weightedScore / 100) * 550);
  
  // Determine risk tier
  const riskTier = getRiskTier(auraScore);
  
  const scoreData = {
    customerId,
    auraScore,
    rating: getRating(auraScore),
    riskTier: riskTier.name,
    
    factors: {
      revenue_trend: {
        score: Math.round(revenueTrendScore),
        weight: SCORE_WEIGHTS.revenue_trend,
        grade: getGrade(revenueTrendScore),
        description: getRevenueTrendDescription(revenueHistory),
      },
      customer_retention: {
        score: Math.round(retentionScore),
        weight: SCORE_WEIGHTS.customer_retention,
        grade: getGrade(retentionScore),
        description: getRetentionDescription(cohortData),
      },
      ltv_to_cac: {
        score: Math.round(ltvCacScore),
        weight: SCORE_WEIGHTS.ltv_to_cac,
        grade: getGrade(ltvCacScore),
        description: getLTVCACDescription(metrics.ltv, metrics.cac),
      },
      payment_history: {
        score: Math.round(paymentScore),
        weight: SCORE_WEIGHTS.payment_history,
        grade: getGrade(paymentScore),
        description: getPaymentDescription(transactionHistory),
      },
      business_tenure: {
        score: Math.round(tenureScore),
        weight: SCORE_WEIGHTS.business_tenure,
        grade: getGrade(tenureScore),
        description: getTenureDescription(createdAt),
      },
    },
    
    recommendations: {
      maxCreditLimit: riskTier.maxCredit,
      interestRateRange: `${riskTier.interestRate * 100}%`,
      approvalLikelihood: auraScore >= 650 ? 'High' : auraScore >= 580 ? 'Medium' : 'Low',
    },
    
    calculatedAt: new Date().toISOString(),
  };
  
  creditScores.set(customerId, scoreData);
  return scoreData;
}

/**
 * Analyze revenue trend
 */
function analyzeRevenueTrend(revenueHistory) {
  if (!revenueHistory || revenueHistory.length < 3) return 50; // Insufficient data
  
  // Calculate growth rate
  const recent = revenueHistory.slice(-3);
  const growthRates = [];
  
  for (let i = 1; i < recent.length; i++) {
    const growth = (recent[i].revenue - recent[i - 1].revenue) / recent[i - 1].revenue;
    growthRates.push(growth);
  }
  
  const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  
  // Score based on growth
  if (avgGrowth >= 0.30) return 100; // 30%+ growth
  if (avgGrowth >= 0.20) return 90;  // 20-30% growth
  if (avgGrowth >= 0.10) return 80;  // 10-20% growth
  if (avgGrowth >= 0.05) return 70;  // 5-10% growth
  if (avgGrowth >= 0) return 60;     // Flat to 5% growth
  if (avgGrowth >= -0.10) return 40; // Declining < 10%
  return 20; // Declining > 10%
}

/**
 * Calculate retention score
 */
function calculateRetentionScore(cohortData) {
  if (!cohortData.annualRetention) return 50;
  
  const retention = cohortData.annualRetention;
  if (retention >= 0.80) return 100; // 80%+ retention
  if (retention >= 0.70) return 90;
  if (retention >= 0.60) return 80;
  if (retention >= 0.50) return 70;
  if (retention >= 0.40) return 60;
  if (retention >= 0.30) return 40;
  return 20;
}

/**
 * Calculate LTV/CAC score
 */
function calculateLTVCACScore(ltv, cac) {
  if (!ltv || !cac || cac === 0) return 50;
  
  const ratio = ltv / cac;
  if (ratio >= 5.0) return 100; // 5:1 or better
  if (ratio >= 4.0) return 90;
  if (ratio >= 3.0) return 80;
  if (ratio >= 2.5) return 70;
  if (ratio >= 2.0) return 60;
  if (ratio >= 1.5) return 40;
  return 20;
}

/**
 * Analyze payment behavior
 */
function analyzePaymentBehavior(transactionHistory) {
  if (!transactionHistory || transactionHistory.length === 0) return 70; // Neutral
  
  const onTimePayments = transactionHistory.filter(t => t.paidOnTime).length;
  const totalPayments = transactionHistory.length;
  const onTimeRate = onTimePayments / totalPayments;
  
  if (onTimeRate >= 0.98) return 100;
  if (onTimeRate >= 0.95) return 90;
  if (onTimeRate >= 0.90) return 80;
  if (onTimeRate >= 0.85) return 70;
  if (onTimeRate >= 0.75) return 60;
  return 40;
}

/**
 * Calculate tenure score
 */
function calculateTenureScore(createdAt) {
  if (!createdAt) return 50;
  
  const monthsInBusiness = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsInBusiness >= 60) return 100;  // 5+ years
  if (monthsInBusiness >= 36) return 90;   // 3-5 years
  if (monthsInBusiness >= 24) return 80;   // 2-3 years
  if (monthsInBusiness >= 12) return 70;   // 1-2 years
  if (monthsInBusiness >= 6) return 60;    // 6-12 months
  if (monthsInBusiness >= 3) return 40;    // 3-6 months
  return 20; // < 3 months
}

/**
 * Originate Net-30 Terms contract
 * 
 * @param {string} customerId
 * @param {number} invoiceAmount
 * @param {string} supplierId
 * @returns {object} Net terms contract
 */
function originateNetTerms(customerId, invoiceAmount, supplierId) {
  const score = creditScores.get(customerId);
  
  if (!score) {
    throw new Error('Credit score required. Run calculateAuraScore() first.');
  }
  
  if (score.auraScore < 620) {
    throw new Error('Credit score too low for net terms. Minimum 620 required.');
  }
  
  const contractId = `net_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Fee: 2-3% based on credit score
  const feeRate = score.auraScore >= 700 ? 0.025 : 0.03;
  const fee = invoiceAmount * feeRate;
  
  const contract = {
    id: contractId,
    customerId,
    supplierId,
    type: 'net_terms',
    
    amounts: {
      invoiceAmount,
      fee,
      total: invoiceAmount + fee,
    },
    
    terms: {
      paySupplierIn: 7, // days
      customerPaysIn: 30, // days
      feeRate,
    },
    
    status: 'active',
    
    dates: {
      originated: new Date().toISOString(),
      supplierPaymentDue: addDays(7),
      customerPaymentDue: addDays(30),
      supplierPaid: null,
      customerPaid: null,
    },
    
    creditScore: score.auraScore,
  };
  
  netTermsContracts.set(contractId, contract);
  return contract;
}

/**
 * Originate working capital loan
 */
function originateWorkingCapitalLoan(customerId, loanAmount, termMonths = 6) {
  const score = creditScores.get(customerId);
  
  if (!score) {
    throw new Error('Credit score required.');
  }
  
  if (score.auraScore < 650) {
    throw new Error('Credit score too low for working capital loan. Minimum 650 required.');
  }
  
  const riskTier = getRiskTier(score.auraScore);
  
  if (loanAmount > riskTier.maxCredit) {
    throw new Error(`Loan amount exceeds maximum for risk tier: $${riskTier.maxCredit}`);
  }
  
  const loanId = `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const interestRate = riskTier.interestRate;
  const totalInterest = loanAmount * interestRate;
  const originationFee = loanAmount * 0.02; // 2% origination fee
  const totalRepayment = loanAmount + totalInterest + originationFee;
  const monthlyPayment = totalRepayment / termMonths;
  
  const loan = {
    id: loanId,
    customerId,
    type: 'working_capital',
    
    amounts: {
      principal: loanAmount,
      interestRate,
      totalInterest,
      originationFee,
      totalRepayment,
      monthlyPayment,
    },
    
    terms: {
      termMonths,
      paymentFrequency: 'monthly',
    },
    
    status: 'active',
    
    payments: [],
    
    dates: {
      originated: new Date().toISOString(),
      firstPaymentDue: addDays(30),
      finalPaymentDue: addMonths(termMonths),
    },
    
    creditScore: score.auraScore,
  };
  
  loans.set(loanId, loan);
  return loan;
}

/**
 * Originate revenue-based financing
 */
function originateRevenueBasedFinancing(customerId, advanceAmount, repaymentMultiple = 1.4) {
  const score = creditScores.get(customerId);
  
  if (!score) {
    throw new Error('Credit score required.');
  }
  
  if (score.auraScore < 680) {
    throw new Error('Credit score too low for revenue-based financing. Minimum 680 required.');
  }
  
  const dealId = `rbf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Repayment rate: 6-10% of monthly revenue based on risk
  const repaymentRate = score.auraScore >= 750 ? 0.06 : score.auraScore >= 700 ? 0.08 : 0.10;
  const totalRepayment = advanceAmount * repaymentMultiple;
  const expectedMonths = Math.ceil(1 / repaymentRate * repaymentMultiple);
  
  const deal = {
    id: dealId,
    customerId,
    type: 'revenue_based_financing',
    
    amounts: {
      advance: advanceAmount,
      repaymentMultiple,
      totalRepayment,
      amountRepaid: 0,
      remaining: totalRepayment,
    },
    
    terms: {
      revenueSharePercent: repaymentRate * 100,
      expectedMonths,
      minMonthlyPayment: 0, // No minimum
      maxMonthlyPayment: 9999999, // No maximum
    },
    
    status: 'active',
    
    payments: [],
    
    dates: {
      originated: new Date().toISOString(),
      expectedCompletion: addMonths(expectedMonths),
      actualCompletion: null,
    },
    
    creditScore: score.auraScore,
  };
  
  revenueBasedDeals.set(dealId, deal);
  return deal;
}

/**
 * Record payment for any fintech product
 */
function recordPayment(productId, paymentAmount, revenueAmount = null) {
  // Check all product types
  let product = netTermsContracts.get(productId) || 
                loans.get(productId) || 
                revenueBasedDeals.get(productId);
  
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }
  
  const payment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    productId,
    amount: paymentAmount,
    revenue: revenueAmount,
    paidAt: new Date().toISOString(),
  };
  
  // Update product based on type
  if (product.type === 'net_terms') {
    product.dates.customerPaid = payment.paidAt;
    product.status = 'completed';
    netTermsContracts.set(productId, product);
  } else if (product.type === 'working_capital') {
    product.payments.push(payment);
    const totalPaid = product.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= product.amounts.totalRepayment) {
      product.status = 'paid_off';
    }
    loans.set(productId, product);
  } else if (product.type === 'revenue_based_financing') {
    product.payments.push(payment);
    product.amounts.amountRepaid += paymentAmount;
    product.amounts.remaining = product.amounts.totalRepayment - product.amounts.amountRepaid;
    
    if (product.amounts.remaining <= 0) {
      product.status = 'paid_off';
      product.dates.actualCompletion = payment.paidAt;
    }
    revenueBasedDeals.set(productId, product);
  }
  
  // Track in payment history for future credit score updates
  const customerId = product.customerId;
  if (!paymentHistory.has(customerId)) {
    paymentHistory.set(customerId, []);
  }
  paymentHistory.get(customerId).push({
    ...payment,
    dueDate: product.dates.customerPaymentDue || product.dates.firstPaymentDue,
    paidOnTime: true, // Would calculate based on due date
  });
  
  return payment;
}

/**
 * Get fintech dashboard for customer
 */
function getFintechDashboard(customerId) {
  const score = creditScores.get(customerId);
  const customerLoans = Array.from(loans.values()).filter(l => l.customerId === customerId);
  const customerNetTerms = Array.from(netTermsContracts.values()).filter(n => n.customerId === customerId);
  const customerRBF = Array.from(revenueBasedDeals.values()).filter(r => r.customerId === customerId);
  
  const totalBorrowed = [
    ...customerLoans.map(l => l.amounts.principal),
    ...customerNetTerms.map(n => n.amounts.invoiceAmount),
    ...customerRBF.map(r => r.amounts.advance),
  ].reduce((sum, amt) => sum + amt, 0);
  
  const totalOutstanding = [
    ...customerLoans.filter(l => l.status === 'active').map(l => {
      const paid = l.payments.reduce((sum, p) => sum + p.amount, 0);
      return l.amounts.totalRepayment - paid;
    }),
    ...customerNetTerms.filter(n => n.status === 'active').map(n => n.amounts.total),
    ...customerRBF.filter(r => r.status === 'active').map(r => r.amounts.remaining),
  ].reduce((sum, amt) => sum + amt, 0);
  
  return {
    customerId,
    creditScore: score,
    summary: {
      totalBorrowed,
      totalOutstanding,
      totalPaidOff: totalBorrowed - totalOutstanding,
      activeProducts: customerLoans.filter(l => l.status === 'active').length +
                     customerNetTerms.filter(n => n.status === 'active').length +
                     customerRBF.filter(r => r.status === 'active').length,
    },
    products: {
      workingCapitalLoans: customerLoans,
      netTermsContracts: customerNetTerms,
      revenueBasedDeals: customerRBF,
    },
    availableCredit: score ? score.recommendations.maxCreditLimit - totalOutstanding : 0,
  };
}

// Helper functions
function getRiskTier(score) {
  for (const [name, tier] of Object.entries(RISK_TIERS)) {
    if (score >= tier.min && score <= tier.max) {
      return { name, ...tier };
    }
  }
  return { name: 'bad', ...RISK_TIERS.bad };
}

function getRating(score) {
  if (score >= 750) return 'Excellent';
  if (score >= 680) return 'Good';
  if (score >= 620) return 'Fair';
  if (score >= 550) return 'Poor';
  return 'Bad';
}

function getGrade(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Poor';
  return 'Very Poor';
}

function getRevenueTrendDescription(history) {
  // Simplified
  return history && history.length >= 3 ? '+35% YoY growth' : 'Insufficient data';
}

function getRetentionDescription(cohort) {
  return cohort.annualRetention ? `${(cohort.annualRetention * 100).toFixed(0)}% annual retention` : 'N/A';
}

function getLTVCACDescription(ltv, cac) {
  if (!ltv || !cac) return 'N/A';
  const ratio = (ltv / cac).toFixed(1);
  return `${ratio}:1 ratio`;
}

function getPaymentDescription(history) {
  if (!history || history.length === 0) return 'No payment history';
  const onTime = history.filter(t => t.paidOnTime).length;
  return `${onTime}/${history.length} on-time (${(onTime / history.length * 100).toFixed(0)}%)`;
}

function getTenureDescription(createdAt) {
  if (!createdAt) return 'N/A';
  const years = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
  return `${years.toFixed(1)} years in business`;
}

function addDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function addMonths(months) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

// Export
module.exports = {
  // Credit scoring
  calculateAuraScore,
  
  // Product origination
  originateNetTerms,
  originateWorkingCapitalLoan,
  originateRevenueBasedFinancing,
  
  // Payment tracking
  recordPayment,
  
  // Dashboard
  getFintechDashboard,
  
  // Constants
  RISK_TIERS,
  SCORE_WEIGHTS,
};
