/**
 * Content Gap Analysis Engine
 * Identifies content opportunities by analyzing gaps between your content and competitors
 */

class ContentGapAnalysisEngine {
  constructor() {
    this.gaps = new Map(); // Map<gapId, gap>
    this.analyses = new Map(); // Map<analysisId, analysis>
  }

  /**
   * Analyze content gaps against competitors
   */
  async analyzeGaps(params) {
    const {
      yourDomain,
      competitorDomains,
      minVolume = 100,
      maxDifficulty = 70
    } = params;

    const analysisId = `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const analysis = {
      id: analysisId,
      yourDomain,
      competitors: competitorDomains,
      timestamp: new Date().toISOString(),
      gaps: {
        keywordGaps: [],
        topicGaps: [],
        formatGaps: [],
        intentGaps: []
      },
      opportunities: [],
      priority: {
        highValue: [],
        mediumValue: [],
        lowValue: []
      }
    };

    // Get your current keywords
    const yourKeywords = new Set(await this._getDomainKeywords(yourDomain));

    // Analyze each competitor
    for (const competitorDomain of competitorDomains) {
      const competitorKeywords = await this._getDomainKeywords(competitorDomain);
      
      // Find keyword gaps
      for (const kw of competitorKeywords) {
        if (!yourKeywords.has(kw.keyword) && 
            kw.volume >= minVolume && 
            kw.difficulty <= maxDifficulty) {
          
          analysis.gaps.keywordGaps.push({
            keyword: kw.keyword,
            competitorDomain,
            volume: kw.volume,
            difficulty: kw.difficulty,
            position: kw.position,
            opportunityScore: this._calculateOpportunityScore(kw)
          });
        }
      }
    }

    // Remove duplicate keywords (keep best opportunity)
    analysis.gaps.keywordGaps = this._deduplicateKeywords(analysis.gaps.keywordGaps);

    // Identify topic gaps
    analysis.gaps.topicGaps = this._identifyTopicGaps(analysis.gaps.keywordGaps);

    // Identify format gaps
    analysis.gaps.formatGaps = await this._identifyFormatGaps(yourDomain, competitorDomains);

    // Identify intent gaps
    analysis.gaps.intentGaps = this._identifyIntentGaps(analysis.gaps.keywordGaps);

    // Generate opportunities
    analysis.opportunities = this._generateOpportunities(analysis.gaps);

    // Prioritize opportunities
    analysis.priority = this._prioritizeOpportunities(analysis.opportunities);

    this.analyses.set(analysisId, analysis);
    return analysis;
  }

  /**
   * Find low-competition opportunities
   */
  async findLowCompetitionOpportunities(params) {
    const {
      yourDomain,
      competitorDomains,
      maxDifficulty = 40,
      minVolume = 500
    } = params;

    const opportunities = {
      yourDomain,
      competitors: competitorDomains.length,
      criteria: { maxDifficulty, minVolume },
      keywords: [],
      estimatedValue: {
        totalVolume: 0,
        avgDifficulty: 0,
        estimatedTraffic: 0
      },
      timestamp: new Date().toISOString()
    };

    // Analyze gaps with strict criteria
    const analysis = await this.analyzeGaps({
      yourDomain,
      competitorDomains,
      minVolume,
      maxDifficulty
    });

    // Filter for low competition
    opportunities.keywords = analysis.gaps.keywordGaps
      .filter(gap => gap.difficulty <= maxDifficulty)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 50);

    // Calculate estimates
    if (opportunities.keywords.length > 0) {
      opportunities.estimatedValue.totalVolume = opportunities.keywords
        .reduce((sum, kw) => sum + kw.volume, 0);
      
      opportunities.estimatedValue.avgDifficulty = Math.round(
        opportunities.keywords.reduce((sum, kw) => sum + kw.difficulty, 0) / 
        opportunities.keywords.length
      );

      // Estimate traffic (assume 30% CTR for ranking in top 5)
      opportunities.estimatedValue.estimatedTraffic = Math.round(
        opportunities.estimatedValue.totalVolume * 0.3
      );
    }

    return opportunities;
  }

  /**
   * Analyze topic coverage gaps
   */
  async analyzeTopicCoverage(params) {
    const {
      yourDomain,
      competitorDomains,
      industry
    } = params;

    const coverage = {
      yourDomain,
      industry,
      topicClusters: [],
      coverageScore: 0,
      missingClusters: [],
      partialClusters: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Get comprehensive topic list for industry
    const industryTopics = this._getIndustryTopics(industry);

    // Analyze your topic coverage
    const yourTopics = await this._getdomainTopics(yourDomain);
    const competitorTopics = await Promise.all(
      competitorDomains.map(d => this._getdomainTopics(d))
    );

    // Compare coverage
    industryTopics.forEach(topic => {
      const yourCoverage = yourTopics.filter(t => t.includes(topic.name)).length;
      const competitorAvgCoverage = competitorTopics
        .reduce((sum, topics) => sum + topics.filter(t => t.includes(topic.name)).length, 0) / 
        competitorDomains.length;

      const cluster = {
        topic: topic.name,
        yourCoverage,
        competitorAvgCoverage,
        gap: competitorAvgCoverage - yourCoverage,
        priority: topic.priority
      };

      coverage.topicClusters.push(cluster);

      if (yourCoverage === 0) {
        coverage.missingClusters.push(cluster);
      } else if (yourCoverage < competitorAvgCoverage * 0.5) {
        coverage.partialClusters.push(cluster);
      }
    });

    // Calculate coverage score
    const totalPossible = industryTopics.length;
    const covered = coverage.topicClusters.filter(c => c.yourCoverage > 0).length;
    coverage.coverageScore = Math.round((covered / totalPossible) * 100);

    // Generate recommendations
    coverage.recommendations = this._generateCoverageRecommendations(coverage);

    return coverage;
  }

  /**
   * Identify seasonal content gaps
   */
  async identifySeasonalGaps(params) {
    const {
      yourDomain,
      competitorDomains,
      timeframe = 12 // months
    } = params;

    const seasonal = {
      yourDomain,
      timeframe,
      seasonalKeywords: [],
      missingSeasons: [],
      plannedCoverage: {},
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Identify seasonal keywords competitors rank for
    for (const competitorDomain of competitorDomains) {
      const keywords = await this._getDomainKeywords(competitorDomain);
      const seasonalKws = keywords.filter(kw => this._isSeasonalKeyword(kw.keyword));
      
      seasonalKws.forEach(kw => {
        const season = this._detectSeason(kw.keyword);
        if (!seasonal.seasonalKeywords.find(s => s.keyword === kw.keyword)) {
          seasonal.seasonalKeywords.push({
            ...kw,
            season,
            competitorDomain
          });
        }
      });
    }

    // Group by season
    const seasons = ['spring', 'summer', 'fall', 'winter', 'holiday', 'back-to-school'];
    seasons.forEach(season => {
      const seasonKeywords = seasonal.seasonalKeywords.filter(k => k.season === season);
      seasonal.plannedCoverage[season] = {
        keywords: seasonKeywords.length,
        topOpportunities: seasonKeywords.slice(0, 5).map(k => k.keyword)
      };
    });

    // Identify missing seasons
    seasonal.missingSeasons = seasons.filter(season => 
      seasonal.plannedCoverage[season].keywords === 0
    );

    // Generate timing recommendations
    seasonal.recommendations = this._generateSeasonalRecommendations(seasonal);

    return seasonal;
  }

  /**
   * Analyze SERP feature gaps
   */
  async analyzeSERPFeatureGaps(params) {
    const {
      yourDomain,
      competitorDomains,
      keywords
    } = params;

    const serpGaps = {
      yourDomain,
      features: {
        'featured-snippet': { yourCount: 0, competitorCount: 0, gap: 0 },
        'people-also-ask': { yourCount: 0, competitorCount: 0, gap: 0 },
        'video-carousel': { yourCount: 0, competitorCount: 0, gap: 0 },
        'image-pack': { yourCount: 0, competitorCount: 0, gap: 0 },
        'local-pack': { yourCount: 0, competitorCount: 0, gap: 0 }
      },
      opportunities: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Analyze SERP features for each keyword
    for (const keyword of keywords) {
      const serpData = await this._analyzeSERPFeatures(keyword);
      
      // Check if you have the feature
      const yourFeatures = serpData.results
        .filter(r => r.domain === yourDomain)
        .flatMap(r => r.features);

      // Check if competitors have features
      const competitorFeatures = serpData.results
        .filter(r => competitorDomains.includes(r.domain))
        .flatMap(r => r.features);

      // Count features
      Object.keys(serpGaps.features).forEach(feature => {
        if (yourFeatures.includes(feature)) {
          serpGaps.features[feature].yourCount++;
        }
        if (competitorFeatures.includes(feature)) {
          serpGaps.features[feature].competitorCount++;
        }
      });
    }

    // Calculate gaps
    Object.keys(serpGaps.features).forEach(feature => {
      serpGaps.features[feature].gap = 
        serpGaps.features[feature].competitorCount - 
        serpGaps.features[feature].yourCount;
    });

    // Generate opportunities
    Object.entries(serpGaps.features).forEach(([feature, data]) => {
      if (data.gap > 0) {
        serpGaps.opportunities.push({
          feature,
          gap: data.gap,
          priority: this._getFeaturePriority(feature),
          action: `Optimize ${data.gap} keywords for ${feature}`
        });
      }
    });

    // Sort by priority
    serpGaps.opportunities.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Generate recommendations
    serpGaps.recommendations = this._generateSERPRecommendations(serpGaps);

    return serpGaps;
  }

  /**
   * Generate content calendar from gaps
   */
  async generateContentCalendar(gapAnalysisId, params = {}) {
    const {
      startDate = new Date().toISOString(),
      frequency = 'weekly', // daily, weekly, bi-weekly, monthly
      maxPieces = 52 // pieces per year
    } = params;

    const analysis = this.analyses.get(gapAnalysisId);
    if (!analysis) {
      throw new Error('Gap analysis not found');
    }

    const calendar = {
      analysisId: gapAnalysisId,
      startDate,
      frequency,
      entries: [],
      summary: {
        totalPieces: 0,
        estimatedTraffic: 0,
        estimatedDuration: ''
      },
      timestamp: new Date().toISOString()
    };

    // Sort opportunities by priority
    const sortedOpportunities = [...analysis.priority.highValue, ...analysis.priority.mediumValue]
      .slice(0, maxPieces);

    // Create calendar entries
    const start = new Date(startDate);
    let currentDate = new Date(start);
    const increment = this._getDateIncrement(frequency);

    sortedOpportunities.forEach((opportunity, index) => {
      calendar.entries.push({
        date: new Date(currentDate).toISOString().split('T')[0],
        keyword: opportunity.keyword || opportunity.topic,
        type: opportunity.type || 'keyword-gap',
        estimatedVolume: opportunity.volume || 0,
        difficulty: opportunity.difficulty || 50,
        priority: opportunity.priority || 'medium',
        week: Math.floor(index / (frequency === 'daily' ? 7 : 1)) + 1
      });

      currentDate.setDate(currentDate.getDate() + increment);
    });

    // Calculate summary
    calendar.summary.totalPieces = calendar.entries.length;
    calendar.summary.estimatedTraffic = calendar.entries
      .reduce((sum, entry) => sum + (entry.estimatedVolume * 0.3), 0);
    
    const endDate = new Date(currentDate);
    const weeks = Math.ceil((endDate - start) / (1000 * 60 * 60 * 24 * 7));
    calendar.summary.estimatedDuration = `${weeks} weeks`;

    return calendar;
  }

  /**
   * Export gap analysis report
   */
  async exportReport(analysisId, format = 'summary') {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }

    const report = {
      analysisId,
      yourDomain: analysis.yourDomain,
      competitors: analysis.competitors,
      generatedAt: new Date().toISOString(),
      summary: {
        totalKeywordGaps: analysis.gaps.keywordGaps.length,
        totalTopicGaps: analysis.gaps.topicGaps.length,
        totalFormatGaps: analysis.gaps.formatGaps.length,
        highPriorityOpportunities: analysis.priority.highValue.length
      },
      details: {}
    };

    if (format === 'detailed') {
      report.details = {
        keywordGaps: analysis.gaps.keywordGaps.slice(0, 50),
        topicGaps: analysis.gaps.topicGaps.slice(0, 20),
        formatGaps: analysis.gaps.formatGaps,
        intentGaps: analysis.gaps.intentGaps
      };
    }

    report.recommendations = this._generateReportRecommendations(analysis);

    return report;
  }

  // === Helper Methods ===

  async _getDomainKeywords(domain) {
    // Simulate getting domain keywords (production would use SEO API)
    const count = Math.floor(Math.random() * 200) + 50;
    const keywords = [];

    for (let i = 0; i < count; i++) {
      keywords.push({
        keyword: `keyword ${i} for ${domain}`,
        volume: Math.floor(Math.random() * 10000) + 100,
        difficulty: Math.floor(Math.random() * 100),
        position: Math.floor(Math.random() * 50) + 1
      });
    }

    return keywords;
  }

  _calculateOpportunityScore(kw) {
    // Score = (volume * position_bonus) / difficulty
    const positionBonus = (100 - kw.position) / 100;
    const score = ((kw.volume * positionBonus) / (kw.difficulty + 1)) * 10;
    return Math.round(Math.min(100, score));
  }

  _deduplicateKeywords(keywords) {
    const seen = new Map();
    
    keywords.forEach(kw => {
      const existing = seen.get(kw.keyword);
      if (!existing || kw.opportunityScore > existing.opportunityScore) {
        seen.set(kw.keyword, kw);
      }
    });

    return Array.from(seen.values()).sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  _identifyTopicGaps(keywordGaps) {
    const topics = {};

    keywordGaps.forEach(gap => {
      const words = gap.keyword.toLowerCase().split(' ');
      const topic = words[0]; // Simplified topic extraction

      if (!topics[topic]) {
        topics[topic] = {
          topic,
          keywords: [],
          totalVolume: 0,
          avgDifficulty: 0,
          opportunityScore: 0
        };
      }

      topics[topic].keywords.push(gap.keyword);
      topics[topic].totalVolume += gap.volume;
    });

    // Calculate averages
    return Object.values(topics).map(topic => {
      const relatedGaps = keywordGaps.filter(g => g.keyword.startsWith(topic.topic));
      topic.avgDifficulty = Math.round(
        relatedGaps.reduce((sum, g) => sum + g.difficulty, 0) / relatedGaps.length
      );
      topic.opportunityScore = Math.round(
        relatedGaps.reduce((sum, g) => sum + g.opportunityScore, 0) / relatedGaps.length
      );
      return topic;
    }).sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  async _identifyFormatGaps(yourDomain, competitorDomains) {
    // Simulate format analysis
    const yourFormats = await this._getDomainFormats(yourDomain);
    const competitorFormats = await Promise.all(
      competitorDomains.map(d => this._getDomainFormats(d))
    );

    const avgCompetitorFormats = {};
    const allFormats = ['article', 'video', 'infographic', 'guide', 'tool', 'calculator'];

    allFormats.forEach(format => {
      const competitorAvg = competitorFormats
        .reduce((sum, formats) => sum + (formats[format] || 0), 0) / competitorDomains.length;
      
      const yourCount = yourFormats[format] || 0;
      
      if (competitorAvg > yourCount) {
        avgCompetitorFormats[format] = {
          format,
          yourCount,
          competitorAvg: Math.round(competitorAvg),
          gap: Math.round(competitorAvg - yourCount)
        };
      }
    });

    return Object.values(avgCompetitorFormats);
  }

  async _getDomainFormats(domain) {
    // Simulate format distribution
    return {
      article: Math.floor(Math.random() * 50),
      video: Math.floor(Math.random() * 20),
      infographic: Math.floor(Math.random() * 10),
      guide: Math.floor(Math.random() * 15),
      tool: Math.floor(Math.random() * 5),
      calculator: Math.floor(Math.random() * 3)
    };
  }

  _identifyIntentGaps(keywordGaps) {
    const intents = { informational: 0, commercial: 0, transactional: 0, navigational: 0 };

    keywordGaps.forEach(gap => {
      const intent = this._detectIntent(gap.keyword);
      intents[intent]++;
    });

    return Object.entries(intents)
      .map(([intent, count]) => ({ intent, count, percentage: 0 }))
      .map(item => {
        item.percentage = (item.count / keywordGaps.length) * 100;
        return item;
      });
  }

  _detectIntent(keyword) {
    const lower = keyword.toLowerCase();
    if (lower.includes('how') || lower.includes('what') || lower.includes('why')) return 'informational';
    if (lower.includes('buy') || lower.includes('price') || lower.includes('order')) return 'transactional';
    if (lower.includes('best') || lower.includes('review') || lower.includes('vs')) return 'commercial';
    return 'navigational';
  }

  _generateOpportunities(gaps) {
    const opportunities = [];

    // Keyword opportunities
    gaps.keywordGaps.slice(0, 20).forEach(gap => {
      opportunities.push({
        type: 'keyword',
        keyword: gap.keyword,
        volume: gap.volume,
        difficulty: gap.difficulty,
        opportunityScore: gap.opportunityScore,
        priority: gap.opportunityScore >= 70 ? 'high' : gap.opportunityScore >= 50 ? 'medium' : 'low'
      });
    });

    // Topic opportunities
    gaps.topicGaps.slice(0, 10).forEach(gap => {
      opportunities.push({
        type: 'topic',
        topic: gap.topic,
        volume: gap.totalVolume,
        difficulty: gap.avgDifficulty,
        opportunityScore: gap.opportunityScore,
        priority: gap.opportunityScore >= 70 ? 'high' : gap.opportunityScore >= 50 ? 'medium' : 'low'
      });
    });

    return opportunities;
  }

  _prioritizeOpportunities(opportunities) {
    return {
      highValue: opportunities.filter(o => o.priority === 'high'),
      mediumValue: opportunities.filter(o => o.priority === 'medium'),
      lowValue: opportunities.filter(o => o.priority === 'low')
    };
  }

  _getIndustryTopics(industry) {
    // Simplified industry topics
    return [
      { name: 'basics', priority: 'high' },
      { name: 'advanced', priority: 'medium' },
      { name: 'tools', priority: 'high' },
      { name: 'comparisons', priority: 'medium' },
      { name: 'best practices', priority: 'high' }
    ];
  }

  async _getdomainTopics(domain) {
    // Simulate topic extraction
    return ['basics', 'tools', 'guides'];
  }

  _generateCoverageRecommendations(coverage) {
    const recommendations = [];

    coverage.missingClusters.forEach(cluster => {
      recommendations.push({
        type: 'missing-topic',
        priority: cluster.priority,
        message: `Create content for "${cluster.topic}" topic cluster`,
        estimatedPieces: cluster.competitorAvgCoverage
      });
    });

    return recommendations;
  }

  _isSeasonalKeyword(keyword) {
    const seasonalTerms = ['summer', 'winter', 'spring', 'fall', 'holiday', 'christmas', 'halloween', 'back to school'];
    return seasonalTerms.some(term => keyword.toLowerCase().includes(term));
  }

  _detectSeason(keyword) {
    const lower = keyword.toLowerCase();
    if (lower.includes('summer')) return 'summer';
    if (lower.includes('winter')) return 'winter';
    if (lower.includes('spring')) return 'spring';
    if (lower.includes('fall')) return 'fall';
    if (lower.includes('holiday') || lower.includes('christmas')) return 'holiday';
    if (lower.includes('back to school')) return 'back-to-school';
    return 'general';
  }

  _generateSeasonalRecommendations(seasonal) {
    const now = new Date();
    const currentMonth = now.getMonth();

    return Object.entries(seasonal.plannedCoverage).map(([season, data]) => {
      const optimalMonth = this._getOptimalPublishMonth(season);
      const monthsUntil = (optimalMonth - currentMonth + 12) % 12;

      return {
        season,
        optimalPublishMonth: optimalMonth,
        monthsUntil,
        keywords: data.keywords,
        action: `Start creating ${season} content ${monthsUntil} months before peak season`
      };
    });
  }

  _getOptimalPublishMonth(season) {
    const seasons = {
      'spring': 1, // Publish in February
      'summer': 4, // Publish in May
      'fall': 7, // Publish in August
      'winter': 10, // Publish in November
      'holiday': 9, // Publish in October
      'back-to-school': 6 // Publish in July
    };
    return seasons[season] || 0;
  }

  async _analyzeSERPFeatures(keyword) {
    // Simulate SERP feature detection
    return {
      keyword,
      results: [
        { domain: 'example.com', features: ['featured-snippet'] },
        { domain: 'competitor1.com', features: ['people-also-ask', 'image-pack'] },
        { domain: 'competitor2.com', features: ['video-carousel'] }
      ]
    };
  }

  _getFeaturePriority(feature) {
    const priorities = {
      'featured-snippet': 'high',
      'people-also-ask': 'high',
      'video-carousel': 'medium',
      'image-pack': 'low',
      'local-pack': 'high'
    };
    return priorities[feature] || 'medium';
  }

  _generateSERPRecommendations(serpGaps) {
    return serpGaps.opportunities.slice(0, 5).map(opp => ({
      feature: opp.feature,
      recommendation: this._getFeatureRecommendation(opp.feature),
      priority: opp.priority
    }));
  }

  _getFeatureRecommendation(feature) {
    const recommendations = {
      'featured-snippet': 'Format content with clear Q&A structure, use tables/lists, add schema markup',
      'people-also-ask': 'Create comprehensive FAQ section, answer related questions',
      'video-carousel': 'Create video content, optimize video titles and descriptions',
      'image-pack': 'Add high-quality images with descriptive alt text',
      'local-pack': 'Optimize Google Business Profile, build local citations'
    };
    return recommendations[feature] || 'Optimize content for this SERP feature';
  }

  _getDateIncrement(frequency) {
    const increments = {
      'daily': 1,
      'weekly': 7,
      'bi-weekly': 14,
      'monthly': 30
    };
    return increments[frequency] || 7;
  }

  _generateReportRecommendations(analysis) {
    const recommendations = [];

    // Quick wins
    const quickWins = analysis.priority.highValue.slice(0, 5);
    if (quickWins.length > 0) {
      recommendations.push({
        category: 'Quick Wins',
        priority: 'high',
        action: `Target ${quickWins.length} high-value keywords immediately`,
        keywords: quickWins.map(o => o.keyword || o.topic)
      });
    }

    // Topic clusters
    if (analysis.gaps.topicGaps.length > 0) {
      recommendations.push({
        category: 'Topic Clusters',
        priority: 'medium',
        action: `Build content clusters around ${analysis.gaps.topicGaps.length} topics`,
        topics: analysis.gaps.topicGaps.slice(0, 5).map(t => t.topic)
      });
    }

    return recommendations;
  }
}

module.exports = ContentGapAnalysisEngine;
