// ================================================================
// MONITORING & CONTROL ENGINE
// ================================================================
// Handles real-time monitoring, price change tracking, alerts,
// anomaly detection, and revenue monitoring
// ================================================================

// In-memory stores
const monitoringData = new Map();
const priceChanges = [];
const alerts = [];
const anomalies = [];
const revenueTracking = new Map();

let alertIdCounter = 1;
let anomalyIdCounter = 1;

// ================================================================
// REAL-TIME DASHBOARD DATA
// ================================================================

function getDashboardMetrics() {
  return {
    overview: {
      totalProducts: 1247,
      activePricingRules: 34,
      avgPrice: 89.50,
      priceChangesToday: 156,
      revenueToday: 125430,
      marginAvg: 34.2
    },
    realtime: {
      currentOrders: 45,
      activeUsers: 128,
      conversionRate: 3.42,
      avgOrderValue: 92.15,
      lastUpdate: new Date().toISOString()
    },
    topProducts: [
      { id: 'P001', name: 'Premium Widget', price: 149.99, sales: 234, revenue: 35098 },
      { id: 'P002', name: 'Standard Kit', price: 79.99, sales: 456, revenue: 36475 },
      { id: 'P003', name: 'Deluxe Bundle', price: 199.99, sales: 189, revenue: 37798 }
    ],
    recentChanges: priceChanges.slice(-10).reverse()
  };
}

function getRealtimeUpdates() {
  return {
    timestamp: new Date().toISOString(),
    updates: [
      { type: 'price_change', productId: 'P' + Math.floor(Math.random() * 1000), oldPrice: 79.99, newPrice: 84.99 },
      { type: 'sale', productId: 'P' + Math.floor(Math.random() * 1000), amount: 125.50 },
      { type: 'competitor_change', competitor: 'Competitor A', change: '-5%' }
    ]
  };
}

// ================================================================
// PRICE CHANGES MONITORING
// ================================================================

function trackPriceChange(changeData) {
  const change = {
    id: priceChanges.length + 1,
    productId: changeData.productId,
    productName: changeData.productName || 'Unknown Product',
    oldPrice: changeData.oldPrice,
    newPrice: changeData.newPrice,
    change: ((changeData.newPrice - changeData.oldPrice) / changeData.oldPrice * 100).toFixed(2) + '%',
    reason: changeData.reason || 'Manual adjustment',
    triggeredBy: changeData.triggeredBy || 'system',
    timestamp: new Date().toISOString(),
    status: 'applied'
  };
  
  priceChanges.push(change);
  
  // Keep only last 1000 changes
  if (priceChanges.length > 1000) {
    priceChanges.shift();
  }
  
  return change;
}

function getPriceChanges(filters = {}) {
  let results = [...priceChanges];
  
  if (filters.productId) {
    results = results.filter(c => c.productId === filters.productId);
  }
  
  if (filters.startDate) {
    results = results.filter(c => new Date(c.timestamp) >= new Date(filters.startDate));
  }
  
  if (filters.endDate) {
    results = results.filter(c => new Date(c.timestamp) <= new Date(filters.endDate));
  }
  
  const limit = Number(filters.limit) || 100;
  return results.slice(-limit).reverse();
}

function getPriceChangeHistory(productId) {
  return {
    productId,
    changes: priceChanges.filter(c => c.productId === productId).slice(-50).reverse(),
    totalChanges: priceChanges.filter(c => c.productId === productId).length,
    avgChange: '+ 2.8%',
    lastChange: priceChanges.find(c => c.productId === productId)
  };
}

function rollbackPriceChange(changeId) {
  const change = priceChanges.find(c => c.id === Number(changeId));
  if (!change) return null;
  
  const rollback = {
    id: priceChanges.length + 1,
    productId: change.productId,
    productName: change.productName,
    oldPrice: change.newPrice,
    newPrice: change.oldPrice,
    change: '-' + change.change,
    reason: 'Rollback of change #' + changeId,
    triggeredBy: 'admin',
    timestamp: new Date().toISOString(),
    status: 'applied'
  };
  
  priceChanges.push(rollback);
  change.status = 'rolled_back';
  
  return rollback;
}

// ================================================================
// PERFORMANCE METRICS
// ================================================================

function getPerformanceMetrics(timeframe = '24h') {
  return {
    timeframe,
    metrics: {
      totalRevenue: 125430,
      revenueChange: '+12.5%',
      ordersCount: 1456,
      ordersChange: '+8.2%',
      avgOrderValue: 92.15,
      aovChange: '+4.1%',
      conversionRate: 3.42,
      conversionChange: '+0.25pp',
      profitMargin: 34.2,
      marginChange: '+2.1pp'
    },
    topPerformers: [
      { productId: 'P001', revenue: 35098, margin: 42.5 },
      { productId: 'P002', revenue: 36475, margin: 38.2 },
      { productId: 'P003', revenue: 37798, margin: 45.1 }
    ],
    underperformers: [
      { productId: 'P234', revenue: 1250, margin: 15.2, issue: 'Low margin' },
      { productId: 'P567', revenue: 890, margin: 28.5, issue: 'Low sales' }
    ],
    generatedAt: new Date().toISOString()
  };
}

function getProductPerformance(productId) {
  return {
    productId,
    metrics: {
      currentPrice: 89.99,
      salesLast7Days: 145,
      revenueLast7Days: 13048,
      conversionRate: 4.2,
      margin: 36.5,
      inventoryTurnover: 8.2
    },
    trends: {
      sales: '+15.2%',
      revenue: '+18.5%',
      margin: '+2.1pp'
    },
    ranking: {
      overall: 23,
      category: 5,
      totalProducts: 1247
    }
  };
}

// ================================================================
// ALERTS & NOTIFICATIONS
// ================================================================

function createAlert(alertData) {
  const alert = {
    id: alertIdCounter++,
    type: alertData.type || 'info', // info, warning, error, critical
    title: alertData.title || 'Alert',
    message: alertData.message,
    productId: alertData.productId || null,
    severity: alertData.severity || 'medium',
    status: 'active',
    createdAt: new Date().toISOString(),
    acknowledgedAt: null,
    acknowledgedBy: null
  };
  
  alerts.push(alert);
  
  // Keep only last 500 alerts
  if (alerts.length > 500) {
    alerts.shift();
  }
  
  return alert;
}

function getAlerts(filters = {}) {
  let results = [...alerts];
  
  if (filters.type) {
    results = results.filter(a => a.type === filters.type);
  }
  
  if (filters.status) {
    results = results.filter(a => a.status === filters.status);
  }
  
  const limit = Number(filters.limit) || 50;
  return results.slice(-limit).reverse();
}

function acknowledgeAlert(id, acknowledgedBy) {
  const alert = alerts.find(a => a.id === Number(id));
  if (!alert) return null;
  
  alert.status = 'acknowledged';
  alert.acknowledgedAt = new Date().toISOString();
  alert.acknowledgedBy = acknowledgedBy || 'admin';
  
  return alert;
}

function dismissAlert(id) {
  const alert = alerts.find(a => a.id === Number(id));
  if (!alert) return null;
  
  alert.status = 'dismissed';
  alert.dismissedAt = new Date().toISOString();
  
  return alert;
}

function getAlertStats() {
  const activeAlerts = alerts.filter(a => a.status === 'active');
  
  return {
    total: alerts.length,
    active: activeAlerts.length,
    byType: {
      info: alerts.filter(a => a.type === 'info').length,
      warning: alerts.filter(a => a.type === 'warning').length,
      error: alerts.filter(a => a.type === 'error').length,
      critical: alerts.filter(a => a.type === 'critical').length
    },
    recent: alerts.slice(-5).reverse()
  };
}

// ================================================================
// ANOMALY DETECTION
// ================================================================

function detectAnomalies(data) {
  // Simulated anomaly detection
  const anomaly = {
    id: anomalyIdCounter++,
    type: data.type || 'price_spike',
    productId: data.productId,
    metric: data.metric || 'price',
    expected: data.expected || 89.99,
    actual: data.actual || 124.99,
    deviation: ((data.actual - data.expected) / data.expected * 100).toFixed(2) + '%',
    severity: Math.abs(data.actual - data.expected) > data.expected * 0.2 ? 'high' : 'medium',
    detectedAt: new Date().toISOString(),
    status: 'detected',
    investigated: false
  };
  
  anomalies.push(anomaly);
  
  // Keep only last 200 anomalies
  if (anomalies.length > 200) {
    anomalies.shift();
  }
  
  // Auto-create alert for high severity anomalies
  if (anomaly.severity === 'high') {
    createAlert({
      type: 'warning',
      title: 'Anomaly Detected',
      message: `${anomaly.type} detected for product ${anomaly.productId}`,
      productId: anomaly.productId,
      severity: 'high'
    });
  }
  
  return anomaly;
}

function getAnomalies(filters = {}) {
  let results = [...anomalies];
  
  if (filters.productId) {
    results = results.filter(a => a.productId === filters.productId);
  }
  
  if (filters.severity) {
    results = results.filter(a => a.severity === filters.severity);
  }
  
  if (filters.investigated !== undefined) {
    const investigated = filters.investigated === 'true' || filters.investigated === true;
    results = results.filter(a => a.investigated === investigated);
  }
  
  const limit = Number(filters.limit) || 50;
  return results.slice(-limit).reverse();
}

function investigateAnomaly(id, notes) {
  const anomaly = anomalies.find(a => a.id === Number(id));
  if (!anomaly) return null;
  
  anomaly.investigated = true;
  anomaly.investigatedAt = new Date().toISOString();
  anomaly.investigationNotes = notes || '';
  anomaly.status = 'resolved';
  
  return anomaly;
}

// ================================================================
// REVENUE TRACKING
// ================================================================

function trackRevenue(data) {
  const key = data.date || new Date().toISOString().split('T')[0];
  
  const existing = revenueTracking.get(key) || {
    date: key,
    revenue: 0,
    orders: 0,
    avgOrderValue: 0
  };
  
  existing.revenue += data.amount || 0;
  existing.orders += 1;
  existing.avgOrderValue = existing.revenue / existing.orders;
  
  revenueTracking.set(key, existing);
  return existing;
}

function getRevenueData(timeframe = '7d') {
  const days = parseInt(timeframe) || 7;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    
    const dayData = revenueTracking.get(key) || {
      date: key,
      revenue: Math.random() * 50000 + 75000,
      orders: Math.floor(Math.random() * 500) + 700,
      avgOrderValue: 0
    };
    
    dayData.avgOrderValue = dayData.revenue / dayData.orders;
    data.push(dayData);
  }
  
  return {
    timeframe,
    data,
    totals: {
      revenue: data.reduce((sum, d) => sum + d.revenue, 0),
      orders: data.reduce((sum, d) => sum + d.orders, 0),
      avgOrderValue: data.reduce((sum, d) => sum + d.avgOrderValue, 0) / data.length
    }
  };
}

function getRevenueByProduct(filters = {}) {
  return {
    timeframe: filters.timeframe || '7d',
    products: [
      { productId: 'P001', revenue: 35098, orders: 234, margin: 14850 },
      { productId: 'P002', revenue: 36475, orders: 456, margin: 13942 },
      { productId: 'P003', revenue: 37798, orders: 189, margin: 17050 },
      { productId: 'P004', revenue: 28456, orders: 312, margin: 10982 },
      { productId: 'P005', revenue: 25789, orders: 287, margin: 9532 }
    ]
  };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Dashboard
  getDashboardMetrics,
  getRealtimeUpdates,
  
  // Price Changes
  trackPriceChange,
  getPriceChanges,
  getPriceChangeHistory,
  rollbackPriceChange,
  
  // Performance
  getPerformanceMetrics,
  getProductPerformance,
  
  // Alerts
  createAlert,
  getAlerts,
  acknowledgeAlert,
  dismissAlert,
  getAlertStats,
  
  // Anomalies
  detectAnomalies,
  getAnomalies,
  investigateAnomaly,
  
  // Revenue Tracking
  trackRevenue,
  getRevenueData,
  getRevenueByProduct
};
