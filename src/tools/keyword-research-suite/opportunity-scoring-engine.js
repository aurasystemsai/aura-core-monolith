/**
 * Opportunity Scoring Engine
 * Scores keyword opportunities using weighted algorithms combining volume, difficulty, relevance, and business value
 */

class OpportunityScoringEngine {
  constructor() {
    this.scores = new Map(); // Map<scoreId, score>
    this.config = {
      weights: {
        volume: 0.30,
        difficulty: 0.25,
        relevance: 0.20,
        cpc: 0.15,
        trend: 0.10 
      },
      thresholds: {
        quickWin: 75,
        goodOpportunity: 60,
        consider: 45
      }
    };
  }

  /**
   * Score keyword opportunity
   */
  async scoreKeyword(keyword, metrics, businessContext = {}) {
    const scoreId = `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const score = {
      id: scoreId,
      keyword,
      overallScore: 0,
      components: {
        volume: 0,
        difficulty: 0,
        relevance: 0,
        cpc: 0,
        trend: 0
      },
      rating: '',
      priority: '',
      roi: 0,
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Score each component (0-100)
    score.components.volume = this._scoreVolume(metrics.volume || 0);
    score.components.difficulty = this._scoreDifficulty(metrics.difficulty || 50);
    score.components.relevance = this._scoreRelevance(keyword, businessContext);
    score.components.cpc = this._scoreCPC(metrics.cpc || 0);
    score.components.trend = this._scoreTrend(metrics.trend || 'stable');

    // Calculate weighted overall score
    score.overallScore = Math.round(
      score.components.volume * this.config.weights.volume +
      score.components.difficulty * this.config.weights.difficulty +
      score.components.relevance * this.config.weights.relevance +
      score.components.cpc * this.config.weights.cpc +
      score.components.trend * this.config.weights.trend
    );

    // Determine rating and priority
    score.rating = this._getRating(score.overallScore);
    score.priority = this._getPriority(score.overallScore, score.components);

    // Calculate estimated ROI
    score.roi = this._calculateROI(metrics, score.overallScore);

    // Generate recommendations
    score.recommendations = this._generateScoringRecommendations(score);

    this.scores.set(scoreId, score);
    return score;
  }

  /**
   * Score multiple keywords and rank them
   */
  async scoreAndRank(keywords, businessContext = {}) {
    const results = {
      total: keywords.length,
      scored: [],
      ranking: [],
      quickWins: [],
      longTerm: [],
      avoid: [],
      timestamp: new Date().toISOString()
    };

    // Score each keyword
    for (const kw of keywords) {
      const score = await this.scoreKeyword(kw.keyword, kw, businessContext);
      results.scored.push(score);
    }

    // Rank by overall score
    results.ranking = [...results.scored].sort((a, b) => b.overallScore - a.overallScore);

    // Categorize
    results.quickWins = results.scored.filter(s => 
      s.overallScore >= this.config.thresholds.quickWin
    );
    results.longTerm = results.scored.filter(s => 
      s.overallScore >= this.config.thresholds.consider &&
      s.overallScore < this.config.thresholds.quickWin
    );
    results.avoid = results.scored.filter(s => 
      s.overallScore < this.config.thresholds.consider
    );

    return results;
  }

  /**
   * Find quick win opportunities
   */
  async findQuickWins(keywords, businessContext = {}) {
    const quickWins = {
      keywords: [],
      criteria: {
        minVolume: 500,
        maxDifficulty: 40,
        minRelevance: 70
      },
      estimatedEffort: {},
      estimatedReturn: {},
      timestamp: new Date().toISOString()
    };

    for (const kw of keywords) {
      const score = await this.scoreKeyword(kw.keyword, kw, businessContext);

      // Check quick win criteria
      if (
        (kw.volume || 0) >= quickWins.criteria.minVolume &&
        (kw.difficulty || 100) <= quickWins.criteria.maxDifficulty &&
        score.components.relevance >= quickWins.criteria.minRelevance
      ) {
        quickWins.keywords.push({
          ...score,
          keyword: kw.keyword,
          volume: kw.volume,
          difficulty: kw.difficulty,
          estimatedTimeToRank: this._estimateTimeToRank(kw.difficulty || 40)
        });
      }
    }

    // Sort by ROI
    quickWins.keywords.sort((a, b) => b.roi - a.roi);

    // Calculate totals
    quickWins.estimatedEffort = {
      totalKeywords: quickWins.keywords.length,
      avgTimeToRank: quickWins.keywords.reduce((sum, k) => 
        sum + k.estimatedTimeToRank, 0) / (quickWins.keywords.length || 1),
      contentPieces: quickWins.keywords.length
    };

    quickWins.estimatedReturn = {
      totalVolume: quickWins.keywords.reduce((sum, k) => sum + k.volume, 0),
      estimatedTraffic: quickWins.keywords.reduce((sum, k) => 
        sum + (k.volume * 0.3), 0), // Assume 30% CTR
      potentialValue: quickWins.keywords.reduce((sum, k) => sum + k.roi, 0)
    };

    return quickWins;
  }

  /**
   * Prioritize keywords for content calendar
   */
  async prioritizeForCalendar(keywords, params = {}) {
    const {
      contentBudget = 10, // Pieces per month
      timeHorizon = 6, // Months
      businessGoals = [] // ['traffic', 'conversions', 'brand']
    } = params;

    const prioritization = {
      timeline: [],
      byMonth: {},
      totalKeywords: 0,
      estimatedResults: {},
      timestamp: new Date().toISOString()
    };

    // Score and rank all keywords
    const ranked = await this.scoreAndRank(keywords, { goals: businessGoals });

    // Distribute across timeline
    const keywordsPerMonth = Math.min(contentBudget, Math.ceil(ranked.ranking.length / timeHorizon));
    
    for (let month = 1; month <= timeHorizon; month++) {
      const startIdx = (month - 1) * keywordsPerMonth;
      const endIdx = month * keywordsPerMonth;
      const monthKeywords = ranked.ranking.slice(startIdx, endIdx);

      prioritization.byMonth[`month${month}`] = {
        keywords: monthKeywords.map(k => k.keyword),
        totalScore: monthKeywords.reduce((sum, k) => sum + k.overallScore, 0),
        estimatedTraffic: monthKeywords.reduce((sum, k) => sum + k.roi, 0)
      };

      prioritization.timeline.push({
        month,
        keywords: monthKeywords.length,
        focus: this._determineMonthFocus(monthKeywords)
      });
    }

    prioritization.totalKeywords = Object.values(prioritization.byMonth)
      .reduce((sum, m) => sum + m.keywords.length, 0);

    prioritization.estimatedResults = {
      totalScore: Object.values(prioritization.byMonth)
        .reduce((sum, m) => sum + m.totalScore, 0),
      totalTraffic: Object.values(prioritization.byMonth)
        .reduce((sum, m) => sum + m.estimatedTraffic, 0)
    };

    return prioritization;
  }

  /**
   * Calculate competitive opportunity score
   */
  async scoreCompetitiveOpportunity(keyword, competitorData) {
    const competitive = {
      keyword,
      competitiveScore: 0,
      factors: {
        gapSize: 0,
        competitorWeakness: 0,
        marketDemand: 0,
        barriers: 0
      },
      opportunity: '',
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Score gap size (how big is the opportunity)
    const yourRank = competitorData.yourPosition || 100;
    const topCompetitorRank = competitorData.topCompetitorPosition || 1;
    competitive.factors.gapSize = Math.max(0, 100 - (yourRank - topCompetitorRank) * 2);

    // Score competitor weakness
    const competitorScore = competitorData.competitorContentQuality || 50;
    competitive.factors.competitorWeakness = 100 - competitorScore;

    // Score market demand
    competitive.factors.marketDemand = this._scoreVolume(competitorData.volume || 0);

    // Score barriers (inverse of difficulty)
    competitive.factors.barriers = 100 - (competitorData.difficulty || 50);

    // Calculate competitive score
    competitive.competitiveScore = Math.round(
      competitive.factors.gapSize * 0.3 +
      competitive.factors.competitorWeakness * 0.25 +
      competitive.factors.marketDemand * 0.25 +
      competitive.factors.barriers * 0.2
    );

    // Determine opportunity level
    if (competitive.competitiveScore >= 75) {
      competitive.opportunity = 'high';
      competitive.recommendations.push({
        type: 'priority',
        message: 'Strong competitive opportunity - prioritize',
        action: 'Create superior content immediately'
      });
    } else if (competitive.competitiveScore >= 50) {
      competitive.opportunity = 'medium';
      competitive.recommendations.push({
        type: 'worthwhile',
        message: 'Good opportunity with effort',
        action: 'Include in content plan'
      });
    } else {
      competitive.opportunity = 'low';
      competitive.recommendations.push({
        type: 'reconsider',
        message: 'Limited competitive opportunity',
        action: 'Focus on easier targets first'
      });
    }

    return competitive;
  }

  /**
   * Score by business value
   */
  async scoreBusinessValue(keyword, businessMetrics) {
    const {
      avgOrderValue = 0,
      conversionRate = 0,
      customerLifetimeValue = 0,
      brandRelevance = 50
    } = businessMetrics;

    const value = {
      keyword,
      businessScore: 0,
      components: {
        revenue: 0,
        brand: 0,
        strategic: 0
      },
      estimatedValue: 0,
      priority: '',
      timestamp: new Date().toISOString()
    };

    // Score revenue potential
    if (avgOrderValue && conversionRate) {
      const revenue = avgOrderValue * (conversionRate / 100);
      value.components.revenue = Math.min(100, (revenue / 100) * 10);
    }

    // Score brand value
    value.components.brand = brandRelevance;

    // Score strategic value (based on LTV)
    if (customerLifetimeValue) {
      value.components.strategic = Math.min(100, (customerLifetimeValue / 1000) * 10);
    }

    // Calculate overall business score
    value.businessScore = Math.round(
      value.components.revenue * 0.5 +
      value.components.brand * 0.3 +
      value.components.strategic * 0.2
    );

    // Estimate total value
    value.estimatedValue = avgOrderValue * (conversionRate / 100) * customerLifetimeValue;

    // Determine priority
    value.priority = value.businessScore >= 70 ? 'high' : 
                     value.businessScore >= 50 ? 'medium' : 'low';

    return value;
  }

  /**
   * Customize scoring weights
   */
  setWeights(weights) {
    // Validate weights sum to 1.0
    const sum = Object.values(weights).reduce((s, w) => s + w, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      throw new Error('Weights must sum to 1.0');
    }

    this.config.weights = { ...this.config.weights, ...weights };
    return this.config.weights;
  }

  /**
   * Get scoring insights
   */
  async getScoringInsights(scoredKeywords) {
    const insights = {
      total: scoredKeywords.length,
      distribution: {
        high: 0,
        medium: 0,
        low: 0
      },
      averages: {
        score: 0,
        volume: 0,
        difficulty: 0
      },
      correlations: {},
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Calculate distribution
    scoredKeywords.forEach(kw => {
      if (kw.overallScore >= 70) insights.distribution.high++;
      else if (kw.overallScore >= 50) insights.distribution.medium++;
      else insights.distribution.low++;
    });

    // Calculate averages
    if (scoredKeywords.length > 0) {
      insights.averages.score = scoredKeywords.reduce((sum, k) => sum + k.overallScore, 0) / scoredKeywords.length;
    }

    // Analyze correlations
    insights.correlations = {
      volumeDifficulty: this._calculateCorrelation(
        scoredKeywords.map(k => k.components.volume),
        scoredKeywords.map(k => k.components.difficulty)
      ),
      scoreROI: this._calculateCorrelation(
        scoredKeywords.map(k => k.overallScore),
        scoredKeywords.map(k => k.roi || 0)
      )
    };

    // Generate insights
    if (insights.distribution.high < scoredKeywords.length * 0.2) {
      insights.recommendations.push({
        type: 'opportunity',
        message: 'Few high-scoring opportunities found',
        action: 'Expand keyword research or adjust targeting criteria'
      });
    }

    return insights;
  }

  // === Helper Methods ===

  _scoreVolume(volume) {
    // Log scale scoring for volume
    if (volume === 0) return 0;
    if (volume < 100) return 20;
    if (volume < 500) return 40;
    if (volume < 1000) return 55;
    if (volume < 5000) return 70;
    if (volume < 10000) return 85;
    return 100;
  }

  _scoreDifficulty(difficulty) {
    // Inverse scoring - lower difficulty = higher score
    return 100 - difficulty;
  }

  _scoreRelevance(keyword, businessContext) {
    const { industry, targetAudience, goals = [] } = businessContext;
    
    let score = 50; // Base score

    // Boost for industry keywords
    if (industry && keyword.toLowerCase().includes(industry.toLowerCase())) {
      score += 20;
    }

    // Boost for audience keywords
    if (targetAudience && keyword.toLowerCase().includes(targetAudience.toLowerCase())) {
      score += 15;
    }

    // Boost for goal alignment
    if (goals.includes('conversions') && (keyword.includes('buy') || keyword.includes('price'))) {
      score += 15;
    }
    if (goals.includes('traffic') && (keyword.includes('how') || keyword.includes('guide'))) {
      score += 10;
    }

    return Math.min(100, score);
  }

  _scoreCPC(cpc) {
    // Higher CPC suggests commercial value
    if (cpc === 0) return 0;
    if (cpc < 0.5) return 30;
    if (cpc < 2) return 50;
    if (cpc < 5) return 70;
    if (cpc < 10) return 85;
    return 100;
  }

  _scoreTrend(trend) {
    const trendScores = {
      'rapidly-growing': 100,
      'growing': 80,
      'stable': 60,
      'declining': 30,
      'rapidly-declining': 10
    };
    return trendScores[trend] || 60;
  }

  _getRating(score) {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 35) return 'poor';
    return 'very-poor';
  }

  _getPriority(score, components) {
    if (score >= 75 && components.difficulty >= 60) return 'quick-win';
    if (score >= 65) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 35) return 'low';
    return 'ignore';
  }

  _calculateROI(metrics, score) {
    const volume = metrics.volume || 0;
    const cpc = metrics.cpc || 0;
    const ctr = 0.3; // Assume 30% CTR
    const difficulty = metrics.difficulty || 50;

    // Estimated traffic value
    const trafficValue = volume * ctr * cpc;
    
    // Adjust for difficulty (higher difficulty = more effort/cost)
    const effortCost = difficulty * 10;
    
    // ROI = (value - cost) / cost
    const roi = ((trafficValue - effortCost) / effortCost) * 100;
    
    return Math.max(0, Math.round(roi));
  }

  _generateScoringRecommendations(score) {
    const recommendations = [];

    if (score.priority === 'quick-win') {
      recommendations.push({
        type: 'action',
        message: 'Quick win opportunity',
        priority: 'high',
        action: 'Create content immediately'
      });
    }

    if (score.components.relevance < 50) {
      recommendations.push({
        type: 'relevance',
        message: 'Low relevance to business',
        priority: 'low',
        action: 'Consider if strategically important'
      });
    }

    if (score.components.trend < 50) {
      recommendations.push({
        type: 'trend',
        message: 'Declining trend detected',
        priority: 'medium',
        action: 'Monitor trend before heavy investment'
      });
    }

    return recommendations;
  }

  _estimateTimeToRank(difficulty) {
    if (difficulty < 20) return 1; // 1 month
    if (difficulty < 40) return 3; // 3 months
    if (difficulty < 60) return 6; // 6 months
    if (difficulty < 80) return 12; // 12 months
    return 18; // 18+ months
  }

  _determineMonthFocus(keywords) {
    const avgDifficulty = keywords.reduce((sum, k) => 
      sum + (k.components.difficulty || 50), 0) / (keywords.length || 1);
    
    if (avgDifficulty > 70) return 'Quick wins';
    if (avgDifficulty > 40) return 'Mixed opportunities';
    return 'Competitive targets';
  }

  _calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

module.exports = OpportunityScoringEngine;
