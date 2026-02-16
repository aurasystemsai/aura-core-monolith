const metricsStore = new Map();

function recordPerformance(payload = {}) {
  const id = payload.contentId || `content-${Date.now()}`;
  const record = {
    contentId: id,
    views: payload.views || 1200,
    engagement: payload.engagement || 42,
    conversions: payload.conversions || 85,
    ctr: payload.ctr || 4.2,
    period: payload.period || '30d',
    capturedAt: new Date().toISOString(),
  };
  metricsStore.set(id, record);
  return record;
}

function getPerformance(id) {
  if (!metricsStore.has(id)) {
    throw new Error('Performance not found');
  }
  return metricsStore.get(id);
}

function forecastPerformance(payload = {}) {
  const current = payload.current || recordPerformance({ contentId: payload.contentId });
  const uplift = 0.22;
  return {
    contentId: current.contentId,
    forecastHorizon: payload.horizon || '30d',
    uplift,
    views: Math.round((current.views || 1000) * (1 + uplift)),
    conversions: Math.round((current.conversions || 80) * (1 + uplift)),
  };
}

function comparePeriods(payload = {}) {
  const current = payload.current || { views: 1200, conversions: 90 };
  const previous = payload.previous || { views: 950, conversions: 70 };
  return {
    current,
    previous,
    deltaViews: current.views - previous.views,
    deltaConversions: current.conversions - previous.conversions,
    lift: Math.round(((current.views - previous.views) / Math.max(previous.views, 1)) * 100),
  };
}

function getStats() {
  return {
    tracked: metricsStore.size,
    avgViews: metricsStore.size
      ? Math.round(Array.from(metricsStore.values()).reduce((acc, m) => acc + (m.views || 0), 0) / metricsStore.size)
      : 0,
  };
}

module.exports = {
  recordPerformance,
  getPerformance,
  forecastPerformance,
  comparePeriods,
  getStats,
};
