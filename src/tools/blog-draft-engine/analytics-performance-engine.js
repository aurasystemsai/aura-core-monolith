/**
 * Blog Draft Engine - Analytics & Performance Engine
 * Tracks content performance, engagement metrics, A/B testing, ROI analysis
 */

class AnalyticsPerformanceEngine {
  constructor() {
    this.analytics = new Map();
    this.experiments = new Map();
    this.reports = new Map();
    this.benchmarks = new Map();
  }

  /**
   * Track publication performance
   */
  async trackPerformance(params) {
    const {
      publicationId,
      draftId,
      url,
      metrics = {}
    } = params;

    const key = publicationId || draftId;
    
    let analytics = this.analytics.get(key) || {
      publicationId,
      draftId,
      url,
      traffic: {
        pageviews: 0,
        uniqueVisitors: 0,
        sessions: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        sources: {}
      },
      engagement: {
        avgTimeOnPage: 0,
        scrollDepth: {},
        clicks: {},
        shares: { total: 0, platforms: {} },
        comments: 0,
        reactions: {}
      },
      seo: {
        organicTraffic: 0,
        keywords: [],
        backlinks: 0,
        domainAuthority: 0,
        rankings: {}
      },
      conversion: {
        leads: 0,
        sales: 0,
        revenue: 0,
        conversionRate: 0,
        attributedRevenue: 0
      },
      timeline: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Update metrics
    analytics = this.mergeMetrics(analytics, metrics);
    analytics.timeline.push({
      timestamp: new Date().toISOString(),
      metrics
    });

    this.analytics.set(key, analytics);

    return {
      success: true,
      analytics,
      message: 'Performance tracked'
    };
  }

  /**
   * Get comprehensive analytics report
   */
  async getAnalytics(publicationId, timeRange = '30d') {
    if (!this.analytics.has(publicationId)) {
      return {
        success: false,
        error: 'No analytics data found'
      };
    }

    const analytics = this.analytics.get(publicationId);
    const filteredTimeline = this.filterTimelineByRange(analytics.timeline, timeRange);

    const report = {
      summary: this.calculateSummary(analytics),
      traffic: this.analyzeTraffic(filteredTimeline),
      engagement: this.analyzeEngagement(filteredTimeline),
      seo: this.analyzeSEO(filteredTimeline),
      conversion: this.analyzeConversion(filteredTimeline),
      trends: this.calculateTrends(filteredTimeline),
      insights: this.generateInsights(analytics, filteredTimeline)
    };

    return {
      success: true,
      analytics,
      report,
      timeRange
    };
  }

  /**
   * Create A/B test experiment
   */
  async createExperiment(params) {
    const {
      name,
      draftId,
      variants = [],
      metric = 'conversion_rate', // conversion_rate, engagement, time_on_page
      trafficSplit = {},
      duration = 7, // days
      minSampleSize = 1000
    } = params;

    const experiment = {
      id: this.generateId(),
      name,
      draftId,
      variants: variants.map((variant, index) => ({
        id: `variant_${index}`,
        name: variant.name,
        changes: variant.changes,
        trafficAllocation: trafficSplit[variant.name] || (100 / variants.length),
        metrics: {
          visitors: 0,
          conversions: 0,
          conversionRate: 0,
          engagement: 0,
          timeOnPage: 0,
          bounceRate: 0
        }
      })),
      primaryMetric: metric,
      status: 'running', // running, paused, completed
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      minSampleSize,
      confidence: 0,
      winner: null,
      createdAt: new Date().toISOString()
    };

    this.experiments.set(experiment.id, experiment);

    return {
      success: true,
      experiment,
      message: 'Experiment created and started'
    };
  }

  /**
   * Record experiment results
   */
  async recordExperimentResult(experimentId, variantId, outcome) {
    if (!this.experiments.has(experimentId)) {
      return { success: false, error: 'Experiment not found' };
    }

    const experiment = this.experiments.get(experimentId);
    const variant = experiment.variants.find(v => v.id === variantId);

    if (!variant) {
      return { success: false, error: 'Variant not found' };
    }

    // Update variant metrics
    variant.metrics.visitors++;
    
    if (outcome.converted) {
      variant.metrics.conversions++;
    }
    
    variant.metrics.conversionRate = (variant.metrics.conversions / variant.metrics.visitors) * 100;
    variant.metrics.engagement += outcome.engagement || 0;
    variant.metrics.timeOnPage += outcome.timeOnPage || 0;
    variant.metrics.bounceRate = this.calculateBounceRate(variant);

    // Check if experiment is complete
    const totalVisitors = experiment.variants.reduce((sum, v) => sum + v.metrics.visitors, 0);
    
    if (totalVisitors >= experiment.minSampleSize) {
      this.analyzeExperiment(experiment);
    }

    this.experiments.set(experimentId, experiment);

    return {
      success: true,
      experiment,
      message: 'Result recorded'
    };
  }

  /**
   * Analyze experiment and determine winner
   */
  analyzeExperiment(experiment) {
    const variants = experiment.variants;
    const metric = experiment.primaryMetric;

    // Calculate statistical significance
    const results = this.calculateStatisticalSignificance(variants, metric);
    
    experiment.confidence = results.confidence;
    
    if (results.confidence >= 95) {
      experiment.winner = results.winner;
      experiment.status = 'completed';
      experiment.completedAt = new Date().toISOString();
    }

    return results;
  }

  /**
   * Calculate statistical significance (simplified)
   */
  calculateStatisticalSignificance(variants, metric) {
    // Simplified calculation - in production, use proper statistical tests
    let bestVariant = variants[0];
    let bestValue = 0;

    variants.forEach(variant => {
      const value = variant.metrics[metric] || variant.metrics.conversionRate;
      if (value > bestValue) {
        bestValue = value;
        bestVariant = variant;
      }
    });

    // Simplified confidence calculation
    const totalVisitors = variants.reduce((sum, v) => sum + v.metrics.visitors, 0);
    const confidence = Math.min(95, (totalVisitors / 1000) * 95);

    return {
      winner: bestVariant.id,
      winningValue: bestValue,
      confidence: Math.round(confidence),
      uplift: this.calculateUplift(variants, bestVariant, metric)
    };
  }

  /**
   * Calculate uplift percentage
   */
  calculateUplift(variants, winner, metric) {
    const baselineVariant = variants.find(v => v.id !== winner.id);
    if (!baselineVariant) return 0;

    const winnerValue = winner.metrics[metric] || winner.metrics.conversionRate;
    const baselineValue = baselineVariant.metrics[metric] || baselineVariant.metrics.conversionRate;

    if (baselineValue === 0) return 0;

    return ((winnerValue - baselineValue) / baselineValue) * 100;
  }

  /**
   * Generate performance insights
   */
  generateInsights(analytics, timeline) {
    const insights = [];

    // Traffic insights
    if (analytics.traffic.bounceRate > 70) {
      insights.push({
        type: 'warning',
        category: 'traffic',
        message: `High bounce rate (${analytics.traffic.bounceRate}%). Content may not match visitor expectations.`,
        recommendation: 'Improve content relevance and page load speed.'
      });
    }

    // Engagement insights
    if (analytics.engagement.avgTimeOnPage < 60) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        message: `Low average time on page (${analytics.engagement.avgTimeOnPage}s).`,
        recommendation: 'Add more engaging content, images, or interactive elements.'
      });
    }

    // SEO insights
    if (analytics.seo.organicTraffic < analytics.traffic.pageviews * 0.3) {
      insights.push({
        type: 'opportunity',
        category: 'seo',
        message: 'Organic traffic is less than 30% of total traffic.',
        recommendation: 'Improve SEO optimization and keyword targeting.'
      });
    }

    // Conversion insights
    if (analytics.conversion.conversionRate > 2) {
      insights.push({
        type: 'success',
        category: 'conversion',
        message: `Strong conversion rate (${analytics.conversion.conversionRate}%).`,
        recommendation: 'Consider scaling content promotion for this topic.'
      });
    }

    // Trend insights
    const trend = this.detectTrend(timeline);
    if (trend === 'declining') {
      insights.push({
        type: 'warning',
        category: 'trend',
        message: 'Traffic is declining over time.',
        recommendation: 'Update or refresh content, or create follow-up posts.'
      });
    }

    return insights;
  }

  /**
   * Compare content performance
   */
  async comparePerformance(publicationIds, metric = 'pageviews') {
    const comparisons = [];

    for (const id of publicationIds) {
      if (this.analytics.has(id)) {
        const analytics = this.analytics.get(id);
        comparisons.push({
          publicationId: id,
          url: analytics.url,
          value: this.extractMetricValue(analytics, metric)
        });
      }
    }

    // Sort by metric value
    comparisons.sort((a, b) => b.value - a.value);

    return {
      success: true,
      metric,
      comparisons,
      topPerformer: comparisons[0],
      averageValue: comparisons.reduce((sum, c) => sum + c.value, 0) / comparisons.length
    };
  }

  /**
   * Generate content performance report
   */
  async generateReport(params) {
    const {
      type = 'summary', // summary, detailed, executive
      timeRange = '30d',
      publicationIds = []
    } = params;

    const report = {
      id: this.generateId(),
      type,
      timeRange,
      generatedAt: new Date().toISOString(),
      data: {}
    };

    if (type === 'summary') {
      report.data = await this.generateSummaryReport(publicationIds, timeRange);
    } else if (type === 'detailed') {
      report.data = await this.generateDetailedReport(publicationIds, timeRange);
    } else if (type === 'executive') {
      report.data = await this.generateExecutiveReport(publicationIds, timeRange);
    }

    this.reports.set(report.id, report);

    return {
      success: true,
      report,
      message: 'Report generated'
    };
  }

  /**
   * Helper methods
   */
  mergeMetrics(analytics, newMetrics) {
    // Merge new metrics into existing analytics
    if (newMetrics.traffic) {
      Object.assign(analytics.traffic, newMetrics.traffic);
    }
    if (newMetrics.engagement) {
      Object.assign(analytics.engagement, newMetrics.engagement);
    }
    if (newMetrics.seo) {
      Object.assign(analytics.seo, newMetrics.seo);
    }
    if (newMetrics.conversion) {
      Object.assign(analytics.conversion, newMetrics.conversion);
    }

    analytics.lastUpdated = new Date().toISOString();
    return analytics;
  }

  filterTimelineByRange(timeline, range) {
    const now = new Date();
    const days = parseInt(range.replace('d', ''));
    const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);

    return timeline.filter(entry => new Date(entry.timestamp) >= cutoff);
  }

  calculateSummary(analytics) {
    return {
      totalPageviews: analytics.traffic.pageviews,
      uniqueVisitors: analytics.traffic.uniqueVisitors,
      avgEngagement: analytics.engagement.avgTimeOnPage,
      conversionRate: analytics.conversion.conversionRate,
      totalRevenue: analytics.conversion.revenue
    };
  }

  analyzeTraffic(timeline) {
    // Simplified traffic analysis
    return {
      trend: this.detectTrend(timeline),
      peakDay: this.findPeakDay(timeline),
      sources: this.aggregateSources(timeline)
    };
  }

  analyzeEngagement(timeline) {
    return {
      avgTimeOnPage: this.average(timeline, 'engagement.avgTimeOnPage'),
      avgScrollDepth: this.average(timeline, 'engagement.scrollDepth'),
      totalShares: this.sum(timeline, 'engagement.shares.total')
    };
  }

  analyzeSEO(timeline) {
    return {
      organicGrowth: this.calculateGrowth(timeline, 'seo.organicTraffic'),
      topKeywords: this.aggregateTopKeywords(timeline),
      avgRankings: this.average(timeline, 'seo.rankings')
    };
  }

  analyzeConversion(timeline) {
    return {
      totalConversions: this.sum(timeline, 'conversion.leads'),
      totalRevenue: this.sum(timeline, 'conversion.revenue'),
      avgConversionRate: this.average(timeline, 'conversion.conversionRate')
    };
  }

  calculateTrends(timeline) {
    return {
      traffic: this.detectTrend(timeline),
      engagement: this.detectTrend(timeline),
      conversion: this.detectTrend(timeline)
    };
  }

  detectTrend(timeline) {
    if (timeline.length < 2) return 'stable';
    
    const first = timeline[0];
    const last = timeline[timeline.length - 1];
    
    // Simple trend detection
    const change = ((last.metrics.pageviews || 0) - (first.metrics.pageviews || 0)) / (first.metrics.pageviews || 1);
    
    if (change > 0.1) return 'growing';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  findPeakDay(timeline) {
    let peak = timeline[0];
    timeline.forEach(entry => {
      if ((entry.metrics.pageviews || 0) > (peak.metrics.pageviews || 0)) {
        peak = entry;
      }
    });
    return peak;
  }

  aggregateSources(timeline) {
    const sources = {};
    timeline.forEach(entry => {
      if (entry.metrics.sources) {
        Object.entries(entry.metrics.sources).forEach(([source, count]) => {
          sources[source] = (sources[source] || 0) + count;
        });
      }
    });
    return sources;
  }

  aggregateTopKeywords(timeline) {
    const keywords = {};
    timeline.forEach(entry => {
      if (entry.metrics.keywords) {
        entry.metrics.keywords.forEach(kw => {
          keywords[kw] = (keywords[kw] || 0) + 1;
        });
      }
    });
    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
  }

  average(timeline, path) {
    const values = timeline.map(e => this.getNestedValue(e.metrics, path)).filter(v => v !== undefined);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  sum(timeline, path) {
    return timeline.reduce((sum, e) => sum + (this.getNestedValue(e.metrics, path) || 0), 0);
  }

  calculateGrowth(timeline, path) {
    if (timeline.length < 2) return 0;
    const first = this.getNestedValue(timeline[0].metrics, path) || 0;
    const last = this.getNestedValue(timeline[timeline.length - 1].metrics, path) || 0;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  extractMetricValue(analytics, metric) {
    return this.getNestedValue(analytics, metric) || 0;
  }

  calculateBounceRate(variant) {
    // Simplified bounce rate calculation
    return variant.metrics.visitors > 0 ? (1 - (variant.metrics.engagement / variant.metrics.visitors)) * 100 : 0;
  }

  async generateSummaryReport(publicationIds, timeRange) {
    return { type: 'summary', message: 'Summary report data' };
  }

  async generateDetailedReport(publicationIds, timeRange) {
    return { type: 'detailed', message: 'Detailed report data' };
  }

  async generateExecutiveReport(publicationIds, timeRange) {
    return { type: 'executive', message: 'Executive report data' };
  }

  generateId() {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = AnalyticsPerformanceEngine;
