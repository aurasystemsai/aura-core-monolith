/**
 * Competitor Research Engine
 * Analyzes competitor keywords, content strategies, and identifies competitive opportunities
 */

class CompetitorResearchEngine {
  constructor() {
    this.competitors = new Map(); // Map<competitorId, competitor>
    this.analyses = new Map(); // Map<analysisId, analysis>
    this.gaps = new Map(); // Map<gapId, gap>
  }

  /**
   * Add competitor for tracking
   */
  async addCompetitor(params) {
    const { domain, name, industry, notes = '' } = params;

    const competitorId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const competitor = {
      id: competitorId,
      domain,
      name: name || domain,
      industry,
      notes,
      addedAt: new Date().toISOString(),
      metrics: {
        estimatedTraffic: 0,
        topKeywords: [],
        contentCount: 0,
        domainAuthority: 0
      },
      lastAnalyzed: null
    };

    // Initial analysis
    await this._analyzeCompetitorMetrics(competitor);

    this.competitors.set(competitorId, competitor);
    return competitor;
  }

  /**
   * Analyze competitor's keyword strategy
   */
  async analyzeCompetitorKeywords(competitorId, params = {}) {
    const competitor = this.competitors.get(competitorId);
    if (!competitor) {
      throw new Error('Competitor not found');
    }

    const { limit = 100, minVolume = 0, minPosition = 100 } = params;

    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate competitor keyword analysis (production uses SEMrush, Ahrefs APIs)
    const analysis = {
      id: analysisId,
      competitorId,
      domain: competitor.domain,
      timestamp: new Date().toISOString(),
      totalKeywords: 0,
      keywords: [],
      categories: {},
      topPerformers: [],
      insights: []
    };

    // Generate competitor keywords
    analysis.keywords = this._generateCompetitorKeywords(competitor.domain, limit, minVolume, minPosition);
    analysis.totalKeywords = analysis.keywords.length;

    // Categorize keywords
    analysis.categories = this._categorizeKeywords(analysis.keywords);

    // Identify top performers
    analysis.topPerformers = analysis.keywords
      .sort((a, b) => {
        const scoreA = a.volume * (100 - a.position);
        const scoreB = b.volume * (100 - b.position);
        return scoreB - scoreA;
      })
      .slice(0, 20);

    // Generate insights
    analysis.insights = this._generateCompetitorInsights(analysis);

    this.analyses.set(analysisId, analysis);
    competitor.lastAnalyzed = new Date().toISOString();

    return analysis;
  }

  /**
   * Find keyword overlap between competitors
   */
  async findKeywordOverlap(competitorIds) {
    if (competitorIds.length < 2) {
      throw new Error('Need at least 2 competitors to compare');
    }

    const overlap = {
      competitors: [],
      commonKeywords: [],
      uniqueKeywords: {},
      overlapPercentage: 0,
      timestamp: new Date().toISOString()
    };

    // Get all competitor keyword sets
    const competitorKeywords = {};
    for (const compId of competitorIds) {
      const comp = this.competitors.get(compId);
      if (!comp) continue;

      overlap.competitors.push({ id: compId, domain: comp.domain });
      
      // Get or analyze keywords
      const analysis = await this.analyzeCompetitorKeywords(compId);
      competitorKeywords[compId] = new Set(analysis.keywords.map(k => k.keyword));
    }

    // Find common keywords (in ALL competitors)
    const allKeywordSets = Object.values(competitorKeywords);
    const firstSet = allKeywordSets[0];
    
    firstSet.forEach(keyword => {
      const inAllSets = allKeywordSets.every(set => set.has(keyword));
      if (inAllSets) {
        overlap.commonKeywords.push(keyword);
      }
    });

    // Find unique keywords per competitor
    Object.entries(competitorKeywords).forEach(([compId, keywords]) => {
      const unique = [];
      keywords.forEach(kw => {
        const inOthers = Object.entries(competitorKeywords)
          .filter(([id]) => id !== compId)
          .some(([,otherSet]) => otherSet.has(kw));
        
        if (!inOthers) {
          unique.push(kw);
        }
      });
      overlap.uniqueKeywords[compId] = unique;
    });

    // Calculate overlap percentage
    const totalUnique = new Set();
    Object.values(competitorKeywords).forEach(set => {
      set.forEach(kw => totalUnique.add(kw));
    });
    overlap.overlapPercentage = (overlap.commonKeywords.length / totalUnique.size) * 100;

    return overlap;
  }

  /**
   * Identify competitive gaps
   */
  async identifyGaps(yourDomain, competitorIds) {
    const gapId = `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const gaps = {
      id: gapId,
      yourDomain,
      competitors: [],
      keywordGaps: [],
      contentGaps: [],
      opportunityScore: 0,
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Simulate your current keywords (production would analyze your actual site)
    const yourKeywords = new Set(this._generateYourKeywords(yourDomain, 50));

    // Analyze each competitor
    for (const compId of competitorIds) {
      const comp = this.competitors.get(compId);
      if (!comp) continue;

      gaps.competitors.push({ id: compId, domain: comp.domain });

      const analysis = await this.analyzeCompetitorKeywords(compId, { limit: 200 });
      
      // Find keywords they rank for that you don't
      analysis.keywords.forEach(kw => {
        if (!yourKeywords.has(kw.keyword) && kw.position <= 20) {
          gaps.keywordGaps.push({
            keyword: kw.keyword,
            competitorDomain: comp.domain,
            competitorPosition: kw.position,
            volume: kw.volume,
            difficulty: kw.difficulty,
            opportunityScore: this._calculateKeywordOpportunity(kw)
          });
        }
      });
    }

    // Sort by opportunity score
    gaps.keywordGaps.sort((a, b) => b.opportunityScore - a.opportunityScore);

    // Remove duplicates (keep highest opportunity)
    const seen = new Set();
    gaps.keywordGaps = gaps.keywordGaps.filter(gap => {
      if (seen.has(gap.keyword)) return false;
      seen.add(gap.keyword);
      return true;
    });

    // Identify content gaps
    gaps.contentGaps = this._identifyContentGaps(gaps.keywordGaps);

    // Calculate overall opportunity score
    gaps.opportunityScore = this._calculateGapOpportunityScore(gaps);

    // Generate recommendations
    gaps.recommendations = this._generateGapRecommendations(gaps);

    this.gaps.set(gapId, gaps);
    return gaps;
  }

  /**
   * Compare domain authorities
   */
  async compareDomainAuthority(competitorIds) {
    const comparison = {
      competitors: [],
      highest: null,
      lowest: null,
      average: 0,
      yourPosition: null,
      timestamp: new Date().toISOString()
    };

    const authorities = [];

    for (const compId of competitorIds) {
      const comp = this.competitors.get(compId);
      if (!comp) continue;

      const da = comp.metrics.domainAuthority || Math.floor(Math.random() * 100);
      
      authorities.push({
        competitorId: compId,
        domain: comp.domain,
        domainAuthority: da
      });
    }

    authorities.sort((a, b) => b.domainAuthority - a.domainAuthority);

    comparison.competitors = authorities;
    comparison.highest = authorities[0];
    comparison.lowest = authorities[authorities.length - 1];
    comparison.average = Math.round(
      authorities.reduce((sum, a) => sum + a.domainAuthority, 0) / authorities.length
    );

    return comparison;
  }

  /**
   * Analyze competitor's content strategy
   */
  async analyzeContentStrategy(competitorId) {
    const comp = this.competitors.get(competitorId);
    if (!comp) {
      throw new Error('Competitor not found');
    }

    const strategy = {
      competitorId,
      domain: comp.domain,
      contentTypes: {},
      publishingFrequency: {},
      topicClusters: [],
      averageWordCount: 0,
      contentQuality: 0,
      insights: [],
      timestamp: new Date().toISOString()
    };

    // Simulate content analysis
    strategy.contentTypes = {
      'blog-posts': 120,
      'guides': 45,
      'case-studies': 30,
      'videos': 25,
      'infographics': 15
    };

    strategy.publishingFrequency = {
      daily: 0,
      weekly: 3,
      monthly: 12,
      quarterly: 4
    };

    strategy.topicClusters = this._identifyTopicClusters(comp.domain);
    strategy.averageWordCount = Math.floor(Math.random() * 1500) + 1000;
    strategy.contentQuality = Math.floor(Math.random() * 40) + 60; // 60-100

    // Generate insights
    strategy.insights = [
      {
        type: 'publishing-frequency',
        message: `Publishes ${strategy.publishingFrequency.weekly} posts per week`,
        impact: 'medium'
      },
      {
        type: 'content-depth',
        message: `Average content length: ${strategy.averageWordCount} words`,
        impact: 'high'
      },
      {
        type: 'topic-focus',
        message: `Focuses on ${strategy.topicClusters.length} main topic clusters`,
        impact: 'medium'
      }
    ];

    return strategy;
  }

  /**
   * Track competitor rankings over time
   */
  async trackRankings(competitorId, keywords, startDate, endDate) {
    const comp = this.competitors.get(competitorId);
    if (!comp) {
      throw new Error('Competitor not found');
    }

    const tracking = {
      competitorId,
      domain: comp.domain,
      keywords: [],
      timeRange: { startDate, endDate },
      summary: {
        improvements: 0,
        declines: 0,
        stable: 0
      },
      timestamp: new Date().toISOString()
    };

    // Simulate ranking history for each keyword
    keywords.forEach(keyword => {
      const history = this._generateRankingHistory(keyword, startDate, endDate);
      const firstPosition = history[0].position;
      const lastPosition = history[history.length - 1].position;
      
      let trend = 'stable';
      if (lastPosition < firstPosition - 3) trend = 'improving';
      else if (lastPosition > firstPosition + 3) trend = 'declining';

      if (trend === 'improving') tracking.summary.improvements++;
      else if (trend === 'declining') tracking.summary.declines++;
      else tracking.summary.stable++;

      tracking.keywords.push({
        keyword,
        history,
        trend,
        positionChange: firstPosition - lastPosition
      });
    });

    return tracking;
  }

  /**
   * Get competitive intelligence report
   */
  async getCompetitiveReport(competitorIds, yourDomain) {
    const report = {
      generatedAt: new Date().toISOString(),
      yourDomain,
      competitors: [],
      keywordGaps: null,
      contentGaps: null,
      strengthsWeaknesses: {},
      recommendations: []
    };

    // Compile competitor data
    for (const compId of competitorIds) {
      const comp = this.competitors.get(compId);
      if (!comp) continue;

      const keywords = await this.analyzeCompetitorKeywords(compId, { limit: 50 });
      const contentStrategy = await this.analyzeContentStrategy(compId);

      report.competitors.push({
        domain: comp.domain,
        metrics: comp.metrics,
        topKeywords: keywords.topPerformers.slice(0, 10),
        contentStrategy: {
          avgWordCount: contentStrategy.averageWordCount,
          publishingFrequency: contentStrategy.publishingFrequency,
          contentQuality: contentStrategy.contentQuality
        }
      });
    }

    // Identify gaps
    const gaps = await this.identifyGaps(yourDomain, competitorIds);
    report.keywordGaps = gaps.keywordGaps.slice(0, 20);
    report.contentGaps = gaps.contentGaps.slice(0, 10);

    // Analyze strengths and weaknesses
    report.strengthsWeaknesses = this._analyzeStrengthsWeaknesses(report.competitors);

    // Generate strategic recommendations
    report.recommendations = this._generateStrategicRecommendations(report);

    return report;
  }

  // === Helper Methods ===

  async _analyzeCompetitorMetrics(competitor) {
    // Simulate metric collection
    competitor.metrics = {
      estimatedTraffic: Math.floor(Math.random() * 500000) + 10000,
      topKeywords: [],
      contentCount: Math.floor(Math.random() * 500) + 50,
      domainAuthority: Math.floor(Math.random() * 60) + 30
    };
  }

  _generateCompetitorKeywords(domain, limit, minVolume, minPosition) {
    const keywords = [];
    const bases = ['software', 'tool', 'platform', 'solution', 'app', 'service'];

    for (let i = 0; i < limit; i++) {
      const base = bases[i % bases.length];
      const volume = Math.floor(Math.random() * 10000) + minVolume;
      const position = Math.floor(Math.random() * minPosition) + 1;

      keywords.push({
        keyword: `${base} ${i + 1}`,
        volume,
        position,
        difficulty: Math.floor(Math.random() * 100),
        traffic: Math.floor(volume * (100 - position) / 100),
        url: `https://${domain}/page-${i}`
      });
    }

    return keywords;
  }

  _categorizeKeywords(keywords) {
    const categories = {
      'branded': 0,
      'product': 0,
      'informational': 0,
      'commercial': 0,
      'navigational': 0
    };

    keywords.forEach(kw => {
      // Simple categorization based on keyword patterns
      if (kw.keyword.includes('best') || kw.keyword.includes('vs')) {
        categories.commercial++;
      } else if (kw.keyword.includes('how') || kw.keyword.includes('what')) {
        categories.informational++;
      } else if (kw.keyword.includes('login') || kw.keyword.includes('pricing')) {
        categories.navigational++;
      } else {
        categories.product++;
      }
    });

    return categories;
  }

  _generateCompetitorInsights(analysis) {
    const insights = [];

    // Traffic concentration insight
    const topTraffic = analysis.topPerformers.slice(0, 10)
      .reduce((sum, k) => sum + k.traffic, 0);
    const totalTraffic = analysis.keywords.reduce((sum, k) => sum + k.traffic, 0);
    const concentration = (topTraffic / totalTraffic) * 100;

    insights.push({
      type: 'traffic-concentration',
      message: `Top 10 keywords drive ${concentration.toFixed(1)}% of traffic`,
      severity: concentration > 70 ? 'high' : 'medium'
    });

    // Category distribution
    const dominantCategory = Object.entries(analysis.categories)
      .sort((a, b) => b[1] - a[1])[0];
    
    insights.push({
      type: 'category-focus',
      message: `Primary focus on ${dominantCategory[0]} keywords`,
      count: dominantCategory[1]
    });

    return insights;
  }

  _generateYourKeywords(domain, count) {
    const keywords = [];
    for (let i = 0; i < count; i++) {
      keywords.push(`your keyword ${i}`);
    }
    return keywords;
  }

  _calculateKeywordOpportunity(kw) {
    // Higher volume + lower difficulty + better position = higher score
    const volumeScore = Math.min(kw.volume / 100, 50);
    const difficultyScore = (100 - kw.difficulty) / 2;
    const positionScore = (20 - kw.position) * 2;

    return Math.round(volumeScore + difficultyScore + positionScore);
  }

  _identifyContentGaps(keywordGaps) {
    // Group keywords into content themes
    const themes = {};
    
    keywordGaps.forEach(gap => {
      const words = gap.keyword.split(' ');
      const theme = words[0]; // Simplified theme extraction
      
      if (!themes[theme]) {
        themes[theme] = {
          theme,
          keywords: [],
          totalVolume: 0,
          avgDifficulty: 0
        };
      }
      
      themes[theme].keywords.push(gap.keyword);
      themes[theme].totalVolume += gap.volume;
    });

    // Calculate averages and convert to array
    return Object.values(themes).map(theme => {
      theme.avgDifficulty = Math.round(
        keywordGaps
          .filter(k => k.keyword.startsWith(theme.theme))
          .reduce((sum, k) => sum + k.difficulty, 0) / theme.keywords.length
      );
      return theme;
    }).sort((a, b) => b.totalVolume - a.totalVolume);
  }

  _calculateGapOpportunityScore(gaps) {
    if (gaps.keywordGaps.length === 0) return 0;

    const topGaps = gaps.keywordGaps.slice(0, 20);
    const avgOpportunity = topGaps.reduce((sum, g) => sum + g.opportunityScore, 0) / topGaps.length;
    
    return Math.round(avgOpportunity);
  }

  _generateGapRecommendations(gaps) {
    const recommendations = [];

    if (gaps.keywordGaps.length > 0) {
      const topGap = gaps.keywordGaps[0];
      recommendations.push({
        type: 'quick-win',
        priority: 'high',
        message: `Target "${topGap.keyword}" - High volume (${topGap.volume}), ranked by ${topGap.competitorDomain}`,
        action: 'Create content targeting this keyword'
      });
    }

    if (gaps.contentGaps.length > 0) {
      const topTheme = gaps.contentGaps[0];
      recommendations.push({
        type: 'content-theme',
        priority: 'medium',
        message: `Create content cluster around "${topTheme.theme}" (${topTheme.keywords.length} keywords, ${topTheme.totalVolume} total volume)`,
        action: 'Develop comprehensive topic cluster'
      });
    }

    return recommendations;
  }

  _identifyTopicClusters(domain) {
    // Simulate topic cluster identification
    return [
      { topic: 'Product Features', keywordCount: 45, avgPosition: 12 },
      { topic: 'How-To Guides', keywordCount: 38, avgPosition: 15 },
      { topic: 'Comparisons', keywordCount: 25, avgPosition: 18 },
      { topic: 'Industry Trends', keywordCount: 20, avgPosition: 22 }
    ];
  }

  _generateRankingHistory(keyword, startDate, endDate) {
    const history = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    let position = Math.floor(Math.random() * 30) + 1;
    
    for (let i = 0; i <= days; i += 7) { // Weekly snapshots
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      // Simulate position changes
      position += Math.floor(Math.random() * 6) - 3; // -3 to +3
      position = Math.max(1, Math.min(100, position));
      
      history.push({
        date: date.toISOString().split('T')[0],
        position
      });
    }
    
    return history;
  }

  _analyzeStrengthsWeaknesses(competitors) {
    return {
      yourStrengths: ['Fast publishing', 'Strong DA'],
      yourWeaknesses: ['Lower content volume', 'Fewer topic clusters'],
      competitorStrengths: ['High content volume', 'Diverse content types'],
      competitorWeaknesses: ['Slower publishing', 'Less frequent updates']
    };
  }

  _generateStrategicRecommendations(report) {
    return [
      {
        category: 'Content',
        recommendation: 'Increase publishing frequency to match top competitors',
        priority: 'high',
        estimatedImpact: 'Traffic increase of 30-50%'
      },
      {
        category: 'Keywords',
        recommendation: `Target ${report.keywordGaps.length} identified keyword gaps`,
        priority: 'high',
        estimatedImpact: `Potential ${report.keywordGaps.slice(0, 10).reduce((sum, k) => sum + k.volume, 0)} monthly searches`
      }
    ];
  }
}

module.exports = CompetitorResearchEngine;
