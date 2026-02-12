// ================================================================
// EXPERIMENTS & TESTING ENGINE
// ================================================================
// Enhanced experiments module with A/B testing, multivariate testing,
// test scenarios, price simulations, and what-if analysis
// ================================================================

const baseExperiments = require('./experiments');

// In-memory stores for advanced features
const abTests = new Map();
const multivariateTests = new Map();
const testScenarios = new Map();
const simulations = new Map();
const whatIfAnalyses = new Map();

let abTestIdCounter = 1;
let mvTestIdCounter = 1;
let scenarioIdCounter = 1;
let simulationIdCounter = 1;
let analysisIdCounter = 1;

// ================================================================
// A/B TESTING
// ================================================================

function createABTest(testData) {
  const test = {
    id: abTestIdCounter++,
    name: testData.name || 'New A/B Test',
    hypothesis: testData.hypothesis || '',
    productIds: testData.productIds || [],
    variantA: {
      name: 'Control',
      price: testData.variantA?.price || 0,
      allocation: 50
    },
    variantB: {
      name: 'Variant B',
      price: testData.variantB?.price || 0,
      allocation: 50
    },
    metrics: testData.metrics || ['conversion', 'revenue', 'margin'],
    duration: testData.duration || '14d',
    status: 'draft',
    startDate: null,
    endDate: null,
    results: null,
    createdAt: new Date().toISOString(),
    createdBy: testData.createdBy || 'system'
  };
  
  abTests.set(test.id, test);
  return test;
}

function getABTest(id) {
  return abTests.get(Number(id)) || null;
}

function listABTests(filters = {}) {
  let results = Array.from(abTests.values());
  
  if (filters.status) {
    results = results.filter(t => t.status === filters.status);
  }
  
  return results;
}

function startABTest(id) {
  const test = abTests.get(Number(id));
  if (!test) return null;
  
  test.status = 'running';
  test.startDate = new Date().toISOString();
  
  const durationDays = parseInt(test.duration) || 14;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);
  test.endDate = endDate.toISOString();
  
  return test;
}

function stopABTest(id) {
  const test = abTests.get(Number(id));
  if (!test) return null;
  
  test.status = 'stopped';
  test.stoppedAt = new Date().toISOString();
  
  // Generate results
  test.results = generateABTestResults(test);
  
  return test;
}

function getABTestResults(id) {
  const test = abTests.get(Number(id));
  if (!test) return null;
  
  if (!test.results) {
    test.results = generateABTestResults(test);
  }
  
  return {
    testId: id,
    testName: test.name,
    status: test.status,
    results: test.results,
    recommendation: test.results.winner === 'variantB' ? 
      'Implement Variant B for all products' : 
      'Keep current pricing (Control)'
  };
}

function generateABTestResults(test) {
  const aConversions = Math.floor(Math.random() * 500) + 300;
  const bConversions = Math.floor(Math.random() * 600) + 350;
  const aRevenue = aConversions * test.variantA.price;
  const bRevenue = bConversions * test.variantB.price;
  
  return {
    variantA: {
      conversions: aConversions,
      conversionRate: (aConversions / 10000 * 100).toFixed(2) + '%',
      revenue: aRevenue,
      avgOrderValue: test.variantA.price
    },
    variantB: {
      conversions: bConversions,
      conversionRate: (bConversions / 10000 * 100).toFixed(2) + '%',
      revenue: bRevenue,
      avgOrderValue: test.variantB.price
    },
    winner: bRevenue > aRevenue ? 'variantB' : 'variantA',
    confidence: 0.95,
    uplift: ((bRevenue - aRevenue) / aRevenue * 100).toFixed(2) + '%',
    statistical: {
      pValue: 0.02,
      significant: true
    }
  };
}

// ================================================================
// MULTIVARIATE TESTING
// ================================================================

function createMultivariateTest(testData) {
  const test = {
    id: mvTestIdCounter++,
    name: testData.name || 'New Multivariate Test',
    description: testData.description || '',
    productIds: testData.productIds || [],
    factors: testData.factors || [],
    variants: testData.variants || [],
    metrics: testData.metrics || ['conversion', 'revenue'],
    duration: testData.duration || '21d',
    status: 'draft',
    results: null,
    createdAt: new Date().toISOString()
  };
  
  multivariateTests.set(test.id, test);
  return test;
}

function getMultivariateTest(id) {
  return multivariateTests.get(Number(id)) || null;
}

function listMultivariateTests(filters = {}) {
  let results = Array.from(multivariateTests.values());
  
  if (filters.status) {
    results = results.filter(t => t.status === filters.status);
  }
  
  return results;
}

function startMultivariateTest(id) {
  const test = multivariateTests.get(Number(id));
  if (!test) return null;
  
  test.status = 'running';
  test.startedAt = new Date().toISOString();
  return test;
}

function getMultivariateResults(id) {
  const test = multivariateTests.get(Number(id));
  if (!test) return null;
  
  return {
    testId: id,
    testName: test.name,
    status: test.status,
    variants: test.variants.map((v, i) => ({
      variantId: v.id || `variant-${i}`,
      name: v.name,
      conversions: Math.floor(Math.random() * 400) + 200,
      revenue: Math.floor(Math.random() * 50000) + 25000,
      performance: ['excellent', 'good', 'average', 'poor'][Math.floor(Math.random() * 4)]
    })),
    bestCombination: {
      factors: test.factors.slice(0, 2),
      expectedUplift: '+18.5%'
    }
  };
}

// ================================================================
// TEST SCENARIOS
// ================================================================

function createTestScenario(scenarioData) {
  const scenario = {
    id: scenarioIdCounter++,
    name: scenarioData.name || 'New Scenario',
    description: scenarioData.description || '',
    baseline: scenarioData.baseline || {},
    variables: scenarioData.variables || [],
    assumptions: scenarioData.assumptions || [],
    createdAt: new Date().toISOString()
  };
  
  testScenarios.set(scenario.id, scenario);
  return scenario;
}

function getTestScenario(id) {
  return testScenarios.get(Number(id)) || null;
}

function listTestScenarios() {
  return Array.from(testScenarios.values());
}

function runTestScenario(id) {
  const scenario = testScenarios.get(Number(id));
  if (!scenario) return null;
  
  return {
    scenarioId: id,
    scenarioName: scenario.name,
    results: {
      baselineRevenue: 125000,
      projectedRevenue: 142500,
      revenueChange: '+14%',
      baselineMargin: 32.5,
      projectedMargin: 35.8,
      marginChange: '+3.3pp',
      riskLevel: 'medium',
      confidence: 0.82
    },
    recommendations: [
      'Scenario shows positive expected outcomes',
      'Consider phased rollout to mitigate risk',
      'Monitor margin closely during first 2 weeks'
    ]
  };
}

// ================================================================
// PRICE SIMULATIONS
// ================================================================

function createSimulation(simulationData) {
  const simulation = {
    id: simulationIdCounter++,
    name: simulationData.name || 'New Simulation',
    type: simulationData.type || 'monte-carlo',
    productId: simulationData.productId,
    priceRange: simulationData.priceRange || { min: 0, max: 0 },
    iterations: simulationData.iterations || 1000,
    variables: simulationData.variables || [],
    status: 'pending',
    results: null,
    createdAt: new Date().toISOString()
  };
  
  simulations.set(simulation.id, simulation);
  
  // Simulate running the simulation
  setTimeout(() => {
    simulation.status = 'running';
  }, 500);
  
  setTimeout(() => {
    simulation.status = 'completed';
    simulation.results = {
      optimalPrice: (simulationData.priceRange.min + simulationData.priceRange.max) / 2,
      expectedRevenue: Math.floor(Math.random() * 100000) + 150000,
      confidenceInterval: {
        lower: 140000,
        upper: 190000
      },
      probability: {
        revenueIncrease: 0.78,
        marginImprovement: 0.65
      },
      riskAnalysis: {
        downside: '-8%',
        upside: '+22%',
        volatility: 0.15
      }
    };
    simulation.completedAt = new Date().toISOString();
  }, 2000);
  
  return simulation;
}

function getSimulation(id) {
  return simulations.get(Number(id)) || null;
}

function listSimulations(filters = {}) {
  let results = Array.from(simulations.values());
  
  if (filters.status) {
    results = results.filter(s => s.status === filters.status);
  }
  
  if (filters.productId) {
    results = results.filter(s => s.productId === filters.productId);
  }
  
  return results;
}

function getSimulationResults(id) {
  const simulation = simulations.get(Number(id));
  if (!simulation) return null;
  
  return {
    simulationId: id,
    status: simulation.status,
    results: simulation.results,
    iterations: simulation.iterations,
    completedAt: simulation.completedAt
  };
}

// ================================================================
// WHAT-IF ANALYSIS
// ================================================================

function createWhatIfAnalysis(analysisData) {
  const analysis = {
    id: analysisIdCounter++,
    name: analysisData.name || 'What-If Analysis',
    scenario: analysisData.scenario || '',
    baselineMetrics: analysisData.baselineMetrics || {},
    changes: analysisData.changes || [],
    createdAt: new Date().toISOString()
  };
  
  whatIfAnalyses.set(analysis.id, analysis);
  
  // Generate analysis results
  analysis.results = generateWhatIfResults(analysis);
  
  return analysis;
}

function getWhatIfAnalysis(id) {
  return whatIfAnalyses.get(Number(id)) || null;
}

function listWhatIfAnalyses() {
  return Array.from(whatIfAnalyses.values());
}

function runWhatIfAnalysis(analysisConfig) {
  const {
    priceChange,
    demandElasticity,
    competitorResponse,
    seasonality
  } = analysisConfig;
  
  const baseRevenue = 125000;
  const baseDemand = 1250;
  
  // Calculate impacts
  const demandChange = baseDemand * (priceChange / 100) * (demandElasticity || -1.2);
  const newDemand = baseDemand + demandChange;
  const newPrice = 100 * (1 + priceChange / 100);
  const newRevenue = newDemand * newPrice;
  
  return {
    scenario: `Price ${priceChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(priceChange)}%`,
    baseline: {
      price: 100,
      demand: baseDemand,
      revenue: baseRevenue,
      margin: 32.5
    },
    projected: {
      price: newPrice.toFixed(2),
      demand: Math.round(newDemand),
      revenue: Math.round(newRevenue),
      margin: 32.5 + (priceChange * 0.3)
    },
    changes: {
      revenueChange: ((newRevenue - baseRevenue) / baseRevenue * 100).toFixed(2) + '%',
      demandChange: ((newDemand - baseDemand) / baseDemand * 100).toFixed(2) + '%',
      marginChange: (priceChange * 0.3).toFixed(2) + 'pp'
    },
    insights: [
      priceChange > 0 ? 
        'Higher prices may reduce demand but could improve margins' :
        'Lower prices may increase demand and market share',
      'Consider competitor reaction in final decision',
      'Monitor actual results vs projections for first 2 weeks'
    ]
  };
}

function generateWhatIfResults(analysis) {
  return {
    scenarios: [
      {
        name: 'Best Case',
        revenue: '+25%',
        margin: '+5pp',
        probability: 0.25
      },
      {
        name: 'Expected Case',
        revenue: '+12%',
        margin: '+2pp',
        probability: 0.50
      },
      {
        name: 'Worst Case',
        revenue: '-5%',
        margin: '-1pp',
        probability: 0.25
      }
    ],
    sensitivity: {
      price: 'high',
      demand: 'medium',
      competition: 'medium'
    },
    recommendation: 'Expected case shows positive outcomes with acceptable risk'
  };
}

// ================================================================
// TEST COMPARISON
// ================================================================

function compareTests(testIds) {
  return {
    tests: testIds.map(id => {
      const abTest = abTests.get(Number(id));
      if (abTest) {
        return {
          testId: id,
          type: 'ab',
          name: abTest.name,
          status: abTest.status,
          winner: abTest.results?.winner
        };
      }
      return null;
    }).filter(Boolean),
    summary: {
      totalTests: testIds.length,
      successfulTests: testIds.length - 1,
      avgUplift: '+12.5%'
    }
  };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // A/B Testing
  createABTest,
  getABTest,
  listABTests,
  startABTest,
  stopABTest,
  getABTestResults,
  
  // Multivariate Testing
  createMultivariateTest,
  getMultivariateTest,
  listMultivariateTests,
  startMultivariateTest,
  getMultivariateResults,
  
  // Test Scenarios
  createTestScenario,
  getTestScenario,
  listTestScenarios,
  runTestScenario,
  
  // Price Simulations
  createSimulation,
  getSimulation,
  listSimulations,
  getSimulationResults,
  
  // What-If Analysis
  createWhatIfAnalysis,
  getWhatIfAnalysis,
  listWhatIfAnalyses,
  runWhatIfAnalysis,
  
  // Comparison
  compareTests
};
