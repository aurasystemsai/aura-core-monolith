// ================================================================
// PRICING STRATEGY ENGINE
// ================================================================
// Handles pricing strategies, competitor analysis, market research,
// and strategic pricing decisions
// ================================================================

const db = require('./db');

// In-memory stores
const strategies = new Map();
const competitorData = new Map();
const marketAnalysis = new Map();
const priceTests = new Map();

let strategyIdCounter = 1;
let competitorIdCounter = 1;
let analysisIdCounter = 1;
let testIdCounter = 1;

// ================================================================
// PRICING STRATEGIES
// ================================================================

function createStrategy(data) {
  const strategy = {
    id: strategyIdCounter++,
    name: data.name || 'New Strategy',
    type: data.type || 'dynamic', // dynamic, competitive, value-based, cost-plus, penetration, skimming
    description: data.description || '',
    objectives: data.objectives || [],
    targetMargin: data.targetMargin || 0,
    priceRange: data.priceRange || { min: 0, max: 0 },
    rules: data.rules || [],
    active: data.active || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: data.createdBy || 'system'
  };
  
  strategies.set(strategy.id, strategy);
  return strategy;
}

function getStrategy(id) {
  return strategies.get(Number(id)) || null;
}

function listStrategies(filters = {}) {
  let results = Array.from(strategies.values());
  
  if (filters.type) {
    results = results.filter(s => s.type === filters.type);
  }
  
  if (filters.active !== undefined) {
    results = results.filter(s => s.active === (filters.active === 'true' || filters.active === true));
  }
  
  return results;
}

function updateStrategy(id, updates) {
  const strategy = strategies.get(Number(id));
  if (!strategy) return null;
  
  Object.assign(strategy, updates, { updatedAt: new Date().toISOString() });
  return strategy;
}

function deleteStrategy(id) {
  return strategies.delete(Number(id));
}

function activateStrategy(id) {
  const strategy = strategies.get(Number(id));
  if (!strategy) return null;
  
  strategy.active = true;
  strategy.activatedAt = new Date().toISOString();
  strategy.updatedAt = new Date().toISOString();
  return strategy;
}

function deactivateStrategy(id) {
  const strategy = strategies.get(Number(id));
  if (!strategy) return null;
  
  strategy.active = false;
  strategy.deactivatedAt = new Date().toISOString();
  strategy.updatedAt = new Date().toISOString();
  return strategy;
}

// ================================================================
// PRICE OPTIMIZATION
// ================================================================

function optimizePrice(productData) {
  const {
    currentPrice,
    cost,
    demand,
    competition,
    inventory,
    targetMargin
  } = productData;
  
  // Simple optimization algorithm (placeholder for ML model)
  let optimizedPrice = currentPrice;
  
  // Demand-based adjustment
  if (demand > 80) {
    optimizedPrice *= 1.15; // High demand, increase price
  } else if (demand < 30) {
    optimizedPrice *= 0.90; // Low demand, decrease price
  }
  
  // Inventory-based adjustment
  if (inventory < 20) {
    optimizedPrice *= 1.10; // Low stock, increase price
  } else if (inventory > 100) {
    optimizedPrice *= 0.95; // Excess stock, decrease price
  }
  
  // Competition-based adjustment
  if (competition?.avgPrice) {
    const competitiveDiff = (optimizedPrice - competition.avgPrice) / competition.avgPrice;
    if (competitiveDiff > 0.20) {
      optimizedPrice *= 0.97; // Too expensive, reduce slightly
    }
  }
  
  // Apply margin constraints
  if (cost && targetMargin) {
    const minPrice = cost * (1 + targetMargin / 100);
    if (optimizedPrice < minPrice) {
      optimizedPrice = minPrice;
    }
  }
  
  return {
    originalPrice: currentPrice,
    optimizedPrice: Math.round(optimizedPrice * 100) / 100,
    change: ((optimizedPrice - currentPrice) / currentPrice * 100).toFixed(2) + '%',
    confidence: 0.85,
    factors: {
      demand,
      inventory,
      competition: competition?.avgPrice || 'N/A',
      targetMargin
    },
    recommendation: optimizedPrice > currentPrice ? 'increase' : optimizedPrice < currentPrice ? 'decrease' : 'maintain'
  };
}

function batchOptimize(products) {
  return products.map(p => ({
    productId: p.id,
    ...optimizePrice(p)
  }));
}

// ================================================================
// COMPETITOR PRICING
// ================================================================

function addCompetitor(data) {
  const competitor = {
    id: competitorIdCounter++,
    name: data.name || 'Unknown Competitor',
    url: data.url || '',
    products: data.products || [],
    lastScraped: null,
    active: data.active || true,
    createdAt: new Date().toISOString()
  };
  
  competitorData.set(competitor.id, competitor);
  return competitor;
}

function getCompetitor(id) {
  return competitorData.get(Number(id)) || null;
}

function listCompetitors(filters = {}) {
  let results = Array.from(competitorData.values());
  
  if (filters.active !== undefined) {
    results = results.filter(c => c.active === (filters.active === 'true' || filters.active === true));
  }
  
  return results;
}

function updateCompetitor(id, updates) {
  const competitor = competitorData.get(Number(id));
  if (!competitor) return null;
  
  Object.assign(competitor, updates, { updatedAt: new Date().toISOString() });
  return competitor;
}

function deleteCompetitor(id) {
  return competitorData.delete(Number(id));
}

function scrapeCompetitorPrices(competitorId) {
  const competitor = competitorData.get(Number(competitorId));
  if (!competitor) return null;
  
  // Simulated scraping results
  const scrapedData = {
    competitorId,
    scrapedAt: new Date().toISOString(),
    productsFound: Math.floor(Math.random() * 50) + 10,
    avgPrice: Math.floor(Math.random() * 100) + 50,
    minPrice: Math.floor(Math.random() * 30) + 20,
    maxPrice: Math.floor(Math.random() * 200) + 100,
    products: []
  };
  
  competitor.lastScraped = scrapedData.scrapedAt;
  competitor.latestData = scrapedData;
  
  return scrapedData;
}

function compareWithCompetitors(productId) {
  const competitors = Array.from(competitorData.values()).filter(c => c.active);
  
  return {
    productId,
    competitorCount: competitors.length,
    comparisons: competitors.map(c => ({
      id: c.id,
      name: c.name,
      price: c.latestData?.avgPrice || 'N/A',
      difference: c.latestData?.avgPrice ? 'N/A' : 'N/A',
      lastUpdated: c.lastScraped
    })),
    avgCompetitorPrice: competitors.reduce((sum, c) => sum + (c.latestData?.avgPrice || 0), 0) / competitors.length || 0,
    recommendation: 'Competitive analysis complete'
  };
}

// ================================================================
// MARKET ANALYSIS
// ================================================================

function createMarketAnalysis(data) {
  const analysis = {
    id: analysisIdCounter++,
    market: data.market || 'general',
    category: data.category || '',
    timeframe: data.timeframe || '30d',
    metrics: data.metrics || {
      marketSize: 0,
      growth: 0,
      avgPrice: 0,
      priceElasticity: 0
    },
    trends: data.trends || [],
    insights: data.insights || [],
    createdAt: new Date().toISOString()
  };
  
  marketAnalysis.set(analysis.id, analysis);
  return analysis;
}

function getMarketAnalysis(id) {
  return marketAnalysis.get(Number(id)) || null;
}

function listMarketAnalysis(filters = {}) {
  let results = Array.from(marketAnalysis.values());
  
  if (filters.market) {
    results = results.filter(a => a.market === filters.market);
  }
  
  if (filters.category) {
    results = results.filter(a => a.category === filters.category);
  }
  
  return results;
}

function getMarketTrends(timeframe = '30d') {
  return {
    timeframe,
    trends: [
      { metric: 'Average Price', change: '+5.2%', direction: 'up' },
      { metric: 'Demand', change: '+12.8%', direction: 'up' },
      { metric: 'Competition', change: '+3.1%', direction: 'up' },
      { metric: 'Market Size', change: '+8.5%', direction: 'up' }
    ],
    generatedAt: new Date().toISOString()
  };
}

// ================================================================
// PRICE TESTING
// ================================================================

function createPriceTest(data) {
  const test = {
    id: testIdCounter++,
    name: data.name || 'New Price Test',
    productId: data.productId || null,
    testType: data.testType || 'ab', // ab, multivariate, sequential
    variants: data.variants || [],
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    status: 'draft',
    results: null,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy || 'system'
  };
  
  priceTests.set(test.id, test);
  return test;
}

function getPriceTest(id) {
  return priceTests.get(Number(id)) || null;
}

function listPriceTests(filters = {}) {
  let results = Array.from(priceTests.values());
  
  if (filters.status) {
    results = results.filter(t => t.status === filters.status);
  }
  
  if (filters.productId) {
    results = results.filter(t => t.productId === filters.productId);
  }
  
  return results;
}

function startPriceTest(id) {
  const test = priceTests.get(Number(id));
  if (!test) return null;
  
  test.status = 'running';
  test.startedAt = new Date().toISOString();
  return test;
}

function stopPriceTest(id) {
  const test = priceTests.get(Number(id));
  if (!test) return null;
  
  test.status = 'stopped';
  test.stoppedAt = new Date().toISOString();
  
  // Generate simulated results
  test.results = {
    winner: test.variants[0]?.id || 'variant-1',
    confidence: 0.92,
    conversions: test.variants.map(v => ({
      variantId: v.id,
      conversions: Math.floor(Math.random() * 500) + 100,
      revenue: Math.floor(Math.random() * 10000) + 2000
    }))
  };
  
  return test;
}

function deletePriceTest(id) {
  return priceTests.delete(Number(id));
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Strategies
  createStrategy,
  getStrategy,
  listStrategies,
  updateStrategy,
  deleteStrategy,
  activateStrategy,
  deactivateStrategy,
  
  // Optimization
  optimizePrice,
  batchOptimize,
  
  // Competitors
  addCompetitor,
  getCompetitor,
  listCompetitors,
  updateCompetitor,
  deleteCompetitor,
  scrapeCompetitorPrices,
  compareWithCompetitors,
  
  // Market Analysis
  createMarketAnalysis,
  getMarketAnalysis,
  listMarketAnalysis,
  getMarketTrends,
  
  // Price Testing
  createPriceTest,
  getPriceTest,
  listPriceTests,
  startPriceTest,
  stopPriceTest,
  deletePriceTest
};
