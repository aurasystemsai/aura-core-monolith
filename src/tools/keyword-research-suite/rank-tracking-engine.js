/**
 * Rank Tracking Engine
 * Monitors keyword rankings over time, tracks SERP position changes, and provides ranking insights
 */

class RankTrackingEngine {
  constructor() {
    this.trackings = new Map(); // Map<trackingId, tracking>
    this.snapshots = new Map(); // Map<snapshotId, snapshot>
    this.rankings = new Map(); // Map<rankingId, ranking>
  }

  /**
   * Start tracking keyword rankings
   */
  async startTracking(params) {
    const {
      keywords,
      domain,
      location = 'US',
      device = 'desktop',
      frequency = 'daily' // daily, weekly, monthly
    } = params;

    const trackingId = `tracking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const tracking = {
      id: trackingId,
      keywords: keywords.map(kw => ({
        keyword: kw,
        currentPosition: null,
        previousPosition: null,
        bestPosition: null,
        worstPosition: null,
        avgPosition: null,
        snapshots: []
      })),
      domain,
      location,
      device,
      frequency,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastCheck: null,
      nextCheck: this._calculateNextCheck(frequency)
    };

    this.trackings.set(trackingId, tracking);
    return tracking;
  }

  /**
   * Take ranking snapshot
   */
  async takeSnapshot(trackingId) {
    const tracking = this.trackings.get(trackingId);
    if (!tracking) {
      throw new Error('Tracking not found');
    }

    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const snapshot = {
      id: snapshotId,
      trackingId,
      timestamp: new Date().toISOString(),
      rankings: []
    };

    // Get current rankings for all keywords
    for (const kw of tracking.keywords) {
      const ranking = await this._checkRanking(kw.keyword, tracking.domain, tracking.location, tracking.device);
      
      snapshot.rankings.push({
        keyword: kw.keyword,
        position: ranking.position,
        url: ranking.url,
        title: ranking.title,
        snippet: ranking.snippet,
        features: ranking.features
      });

      // Update tracking data
      kw.previousPosition = kw.currentPosition;
      kw.currentPosition = ranking.position;
      kw.snapshots.push({
        timestamp: snapshot.timestamp,
        position: ranking.position
      });

      // Update best/worst/avg
      if (kw.bestPosition === null || ranking.position < kw.bestPosition) {
        kw.bestPosition = ranking.position;
      }
      if (kw.worstPosition === null || ranking.position > kw.worstPosition) {
        kw.worstPosition = ranking.position;
      }
      
      const positions = kw.snapshots.map(s => s.position);
      kw.avgPosition = Math.round(positions.reduce((sum, p) => sum + p, 0) / positions.length);
    }

    tracking.lastCheck = snapshot.timestamp;
    tracking.nextCheck = this._calculateNextCheck(tracking.frequency, new Date(snapshot.timestamp));

    this.snapshots.set(snapshotId, snapshot);
    return snapshot;
  }

  /**
   * Get ranking history for keyword
   */
  async getRankingHistory(trackingId, keyword, params = {}) {
    const {
      startDate,
      endDate = new Date().toISOString(),
      granularity = 'daily' // daily, weekly, monthly
    } = params;

    const tracking = this.trackings.get(trackingId);
    if (!tracking) {
      throw new Error('Tracking not found');
    }

    const keywordData = tracking.keywords.find(k => k.keyword === keyword);
    if (!keywordData) {
      throw new Error('Keyword not found in tracking');
    }

    const history = {
      trackingId,
      keyword,
      domain: tracking.domain,
      timeRange: { startDate, endDate },
      dataPoints: [],
      statistics: {
        currentPosition: keywordData.currentPosition,
        bestPosition: keywordData.bestPosition,
        worstPosition: keywordData.worstPosition,
        avgPosition: keywordData.avgPosition,
        totalMovement: 0,
        volatility: 0
      },
      trend: '',
      timestamp: new Date().toISOString()
    };

    // Filter snapshots by date range
    let snapshots = keywordData.snapshots;
    if (startDate) {
      snapshots = snapshots.filter(s => s.timestamp >= startDate && s.timestamp <= endDate);
    }

    // Apply granularity
    if (granularity === 'weekly') {
      snapshots = this._aggregateByWeek(snapshots);
    } else if (granularity === 'monthly') {
      snapshots = this._aggregateByMonth(snapshots);
    }

    history.dataPoints = snapshots;

    // Calculate statistics
    if (snapshots.length > 1) {
      history.statistics.totalMovement = Math.abs(
        snapshots[0].position - snapshots[snapshots.length - 1].position
      );

      history.statistics.volatility = this._calculateVolatility(snapshots.map(s => s.position));

      // Determine trend
      const firstPos = snapshots[0].position;
      const lastPos = snapshots[snapshots.length - 1].position;
      
      if (lastPos < firstPos - 3) history.trend = 'improving';
      else if (lastPos > firstPos + 3) history.trend = 'declining';
      else history.trend = 'stable';
    }

    return history;
  }

  /**
   * Compare rankings across time periods
   */
  async compareTimePeriods(trackingId, period1, period2) {
    const tracking = this.trackings.get(trackingId);
    if (!tracking) {
      throw new Error('Tracking not found');
    }

    const comparison = {
      trackingId,
      period1,
      period2,
      keywords: [],
      summary: {
        improved: 0,
        declined: 0,
        stable: 0,
        avgChange: 0
      },
      timestamp: new Date().toISOString()
    };

    for (const kw of tracking.keywords) {
      const p1Snapshots = kw.snapshots.filter(s => 
        s.timestamp >= period1.start && s.timestamp <= period1.end
      );
      const p2Snapshots = kw.snapshots.filter(s => 
        s.timestamp >= period2.start && s.timestamp <= period2.end
      );

      if (p1Snapshots.length === 0 || p2Snapshots.length === 0) continue;

      const p1Avg = p1Snapshots.reduce((sum, s) => sum + s.position, 0) / p1Snapshots.length;
      const p2Avg = p2Snapshots.reduce((sum, s) => sum + s.position, 0) / p2Snapshots.length;
      const change = p1Avg - p2Avg; // Positive = improved

      const result = {
        keyword: kw.keyword,
        period1Avg: Math.round(p1Avg),
        period2Avg: Math.round(p2Avg),
        change: Math.round(change),
        changePercent: ((change / p1Avg) * 100).toFixed(1)
      };

      comparison.keywords.push(result);

      if (change > 1) comparison.summary.improved++;
      else if (change < -1) comparison.summary.declined++;
      else comparison.summary.stable++;
    }

    if (comparison.keywords.length > 0) {
      comparison.summary.avgChange = Math.round(
        comparison.keywords.reduce((sum, k) => sum + k.change, 0) / comparison.keywords.length
      );
    }

    return comparison;
  }

  /**
   * Get ranking alerts
   */
  async getRankingAlerts(trackingId, alertConfig = {}) {
    const {
      significantDrop = 5, // Positions
      significantRise = 5,
      checkPeriod = 7 // Days
    } = alertConfig;

    const tracking = this.trackings.get(trackingId);
    if (!tracking) {
      throw new Error('Tracking not found');
    }

    const alerts = {
      trackingId,
      generated: new Date().toISOString(),
      alerts: [],
      summary: {
        critical: 0,
        warning: 0,
        positive: 0
      }
    };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - checkPeriod);

    for (const kw of tracking.keywords) {
      const recentSnapshots = kw.snapshots.filter(s => 
        new Date(s.timestamp) >= cutoffDate
      );

      if (recentSnapshots.length < 2) continue;

      const oldPos = recentSnapshots[0].position;
      const newPos = recentSnapshots[recentSnapshots.length - 1].position;
      const change = oldPos - newPos;

      // Check for significant drops
      if (change < -significantDrop) {
        alerts.alerts.push({
          type: 'significant-drop',
          severity: 'critical',
          keyword: kw.keyword,
          message: `Dropped ${Math.abs(change)} positions in last ${checkPeriod} days`,
          oldPosition: oldPos,
          newPosition: newPos,
          change
        });
        alerts.summary.critical++;
      }

      // Check for significant rises
      else if (change > significantRise) {
        alerts.alerts.push({
          type: 'significant-rise',
          severity: 'positive',
          keyword: kw.keyword,
          message: `Improved ${change} positions in last ${checkPeriod} days`,
          oldPosition: oldPos,
          newPosition: newPos,
          change
        });
        alerts.summary.positive++;
      }

      // Check for volatility
      const positions = recentSnapshots.map(s => s.position);
      const volatility = this._calculateVolatility(positions);
      if (volatility > 5) {
        alerts.alerts.push({
          type: 'high-volatility',
          severity: 'warning',
          keyword: kw.keyword,
          message: `High ranking volatility detected (${volatility.toFixed(1)})`,
          volatility
        });
        alerts.summary.warning++;
      }
    }

    return alerts;
  }

  /**
   * Forecast future rankings
   */
  async forecastRankings(trackingId, keyword, periods = 30) {
    const tracking = this.trackings.get(trackingId);
    if (!tracking) {
      throw new Error('Tracking not found');
    }

    const keywordData = tracking.keywords.find(k => k.keyword === keyword);
    if (!keywordData) {
      throw new Error('Keyword not found');
    }

    const forecast = {
      keyword,
      periods,
      predictions: [],
      confidence: 0,
      trend: '',
      method: 'linear-regression',
      timestamp: new Date().toISOString()
    };

    const positions = keywordData.snapshots.map(s => s.position);
    
    if (positions.length < 5) {
      forecast.confidence = 0;
      forecast.predictions = [];
      return forecast;
    }

    // Simple linear regression
    const n = positions.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = positions;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions
    for (let i = 0; i < periods; i++) {
      const futureX = n + i;
      const predictedPosition = Math.max(1, Math.round(slope * futureX + intercept));
      
      forecast.predictions.push({
        period: i + 1,
        position: predictedPosition,
        confidence: Math.max(50, 95 - (i * 1.5)) // Confidence decreases over time
      });
    }

    // Overall confidence based on historical consistency
    forecast.confidence = Math.max(50, 100 - this._calculateVolatility(positions) * 5);

    // Determine trend
    if (slope < -0.1) forecast.trend = 'improving';
    else if (slope > 0.1) forecast.trend = 'declining';
    else forecast.trend = 'stable';

    return forecast;
  }

  /**
   * Get competitor ranking comparison
   */
  async compareWithCompetitors(trackingId, competitorDomains) {
    const tracking = this.trackings.get(trackingId);
    if (!tracking) {
      throw new Error('Tracking not found');
    }

    const comparison = {
      yourDomain: tracking.domain,
      competitors: competitorDomains,
      keywords: [],
      summary: {
        youWinning: 0,
        competitive: 0,
        youLosing: 0
      },
      timestamp: new Date().toISOString()
    };

    for (const kw of tracking.keywords) {
      const competitorRankings = await this._getCompetitorRankings(
        kw.keyword,
        competitorDomains,
        tracking.location,
        tracking.device
      );

      const yourPos = kw.currentPosition || 100;
      const bestCompetitorPos = Math.min(...competitorRankings.map(r => r.position));

      const keywordComparison = {
        keyword: kw.keyword,
        yourPosition: yourPos,
        competitorPositions: competitorRankings,
        bestCompetitorPosition: bestCompetitorPos,
        gap: yourPos - bestCompetitorPos,
        status: ''
      };

      if (yourPos < bestCompetitorPos) {
        keywordComparison.status = 'winning';
        comparison.summary.youWinning++;
      } else if (yourPos - bestCompetitorPos <= 5) {
        keywordComparison.status = 'competitive';
        comparison.summary.competitive++;
      } else {
        keywordComparison.status = 'losing';
        comparison.summary.youLosing++;
      }

      comparison.keywords.push(keywordComparison);
    }

    return comparison;
  }

  /**
   * Export ranking report
   */
  async exportReport(trackingId, format = 'summary') {
    const tracking = this.trackings.get(trackingId);
    if (!tracking) {
      throw new Error('Tracking not found');
    }

    const report = {
      trackingId,
      domain: tracking.domain,
      generatedAt: new Date().toISOString(),
      period: {
        start: tracking.createdAt,
        end: tracking.lastCheck
      },
      keywords: tracking.keywords.length,
      summary: {
        avgPosition: 0,
        improved: 0,
        declined: 0,
        stable: 0,
        topPerformers: [],
        concerningKeywords: []
      },
      details: []
    };

    // Calculate summary statistics
    let totalMovement = 0;
    let improved = 0, declined = 0, stable = 0;

    tracking.keywords.forEach(kw => {
      if (kw.snapshots.length < 2) return;

      const firstPos = kw.snapshots[0].position;
      const lastPos = kw.snapshots[kw.snapshots.length - 1].position;
      const change = firstPos - lastPos;

      totalMovement += Math.abs(change);

      if (change > 3) improved++;
      else if (change < -3) declined++;
      else stable++;

      // Top performers
      if (kw.currentPosition <= 3) {
        report.summary.topPerformers.push({
          keyword: kw.keyword,
          position: kw.currentPosition
        });
      }

      // Concerning keywords
      if (change < -5) {
        report.summary.concerningKeywords.push({
          keyword: kw.keyword,
          drop: Math.abs(change)
        });
      }

      // Add details
      if (format === 'detailed') {
        report.details.push({
          keyword: kw.keyword,
          currentPosition: kw.currentPosition,
          previousPosition: kw.previousPosition,
          bestPosition: kw.bestPosition,
          avgPosition: kw.avgPosition,
          change,
          snapshots: kw.snapshots.length
        });
      }
    });

    report.summary.improved = improved;
    report.summary.declined = declined;
    report.summary.stable = stable;

    const positions = tracking.keywords.map(kw => kw.currentPosition).filter(p => p !== null);
    report.summary.avgPosition = positions.length > 0
      ? Math.round(positions.reduce((sum, p) => sum + p, 0) / positions.length)
      : 0;

    return report;
  }

  // === Helper Methods ===

  async _checkRanking(keyword, domain, location, device) {
    // Simulate ranking check (production would use real SERP API)
    const position = Math.floor(Math.random() * 50) + 1;
    
    return {
      keyword,
      domain,
      position,
      url: `https://${domain}/page-${keyword.replace(/\s+/g, '-')}`,
      title: `${keyword} - ${domain}`,
      snippet: `Learn about ${keyword} on our website...`,
      features: []
    };
  }

  _calculateNextCheck(frequency, fromDate = new Date()) {
    const next = new Date(fromDate);
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next.toISOString();
  }

  _aggregateByWeek(snapshots) {
    // Group snapshots by week and average positions
    const weeks = {};
    
    snapshots.forEach(snapshot => {
      const date = new Date(snapshot.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { positions: [], timestamp: weekKey };
      }
      weeks[weekKey].positions.push(snapshot.position);
    });

    return Object.values(weeks).map(week => ({
      timestamp: week.timestamp,
      position: Math.round(week.positions.reduce((sum, p) => sum + p, 0) / week.positions.length)
    }));
  }

  _aggregateByMonth(snapshots) {
    // Group snapshots by month and average positions
    const months = {};
    
    snapshots.forEach(snapshot => {
      const date = new Date(snapshot.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { positions: [], timestamp: `${monthKey}-01` };
      }
      months[monthKey].positions.push(snapshot.position);
    });

    return Object.values(months).map(month => ({
      timestamp: month.timestamp,
      position: Math.round(month.positions.reduce((sum, p) => sum + p, 0) / month.positions.length)
    }));
  }

  _calculateVolatility(positions) {
    if (positions.length < 2) return 0;

    const avg = positions.reduce((sum, p) => sum + p, 0) / positions.length;
    const variance = positions.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / positions.length;
    
    return Math.sqrt(variance);
  }

  async _getCompetitorRankings(keyword, competitors, location, device) {
    // Simulate competitor ranking checks
    return competitors.map(domain => ({
      domain,
      position: Math.floor(Math.random() * 30) + 1
    }));
  }
}

module.exports = RankTrackingEngine;
