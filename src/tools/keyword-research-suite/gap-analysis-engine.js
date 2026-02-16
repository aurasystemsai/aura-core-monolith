/**
 * Content Gap Analysis Engine
 * Identifies content opportunities by analyzing competitor coverage
 */

class GapAnalysisEngine {
  constructor() {
    this.analyses = new Map();
  }

  // Perform content gap analysis
  async analyzeGaps(params) {
    const {
      targetDomain,
      competitorDomains = [],
      minGapSize = 10
    } = params;

    const analysis = {
      id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      targetDomain,
      competitorDomains,
      timestamp: new Date().toISOString(),
      gaps: [],
      opportunities: [],
      summary: {
        totalGaps: 0,
        highPriorityGaps: 0,
        estimatedTraffic: 0
      }
    };

    // Get keywords for target and competitors
    const targetKeywords = await this.getKeywords(targetDomain);
    const competitorKeywordSets = await Promise.all(
      competitorDomains.map(domain => this.getKeywords(domain))
    );

    // Find keywords competitors rank for but target doesn't
    const targetSet = new Set(targetKeywords.map(k => k.keyword));
    const gapMap = new Map();

    competitorKeywordSets.forEach((compKeywords, idx) => {
      compKeywords.forEach(kw => {
        if (!targetSet.has(kw.keyword)) {
          if (!gapMap.has(kw.keyword)) {
            gapMap.set(kw.keyword, {
              keyword: kw.keyword,
              searchVolume: kw.searchVolume || 0,
              difficulty: kw.difficulty || 50,
              competitorsRanking: [],
              avgCompetitorPosition: 0,
              opportunity: 0
            });
          }

          const gap = gapMap.get(kw.keyword);
          gap.competitorsRanking.push({
            domain: competitorDomains[idx],
            position: kw.position || 50,
            traffic: kw.traffic || 0
          });
        }
      });
    });

    // Calculate metrics for each gap
    gapMap.forEach((gap, keyword) => {
      // Calculate average competitor position
      gap.avgCompetitorPosition = Math.round(
        gap.competitorsRanking.reduce((sum, c) => sum + c.position, 0) / 
        gap.competitorsRanking.length
      );

      // Calculate opportunity score
      gap.opportunity = this.calculateOpportunityScore(gap);

      // Filter by minimum gap size
      if (gap.competitorsRanking.length >= minGapSize) {
        analysis.gaps.push(gap);
      }
    });

    // Sort by opportunity score
    analysis.gaps.sort((a, b) => b.opportunity - a.opportunity);

    // Generate opportunities
    analysis.opportunities = this.generateOpportunities(analysis.gaps);

    // Calculate summary
    analysis.summary.totalGaps = analysis.gaps.length;
    analysis.summary.highPriorityGaps = analysis.gaps.filter(g => g.opportunity >= 70).length;
    analysis.summary.estimatedTraffic = analysis.gaps
      .slice(0, 100)
      .reduce((sum, g) => sum + (g.searchVolume * 0.2), 0); // Estimate 20% CTR

    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  // Get keywords for domain (mock)
  async getKeywords(domain) {
    const keywords = [];
    const count = Math.floor(Math.random() * 1000) + 500;

    for (let i = 0; i < count; i++) {
      keywords.push({
        keyword: `keyword ${domain} ${i}`,
        position: Math.floor(Math.random() * 100) + 1,
        searchVolume: Math.floor(Math.random() * 10000),
        difficulty: Math.floor(Math.random() * 100),
        traffic: Math.floor(Math.random() * 5000)
      });
    }

    return keywords;
  }

  // Calculate opportunity score
  calculateOpportunityScore(gap) {
    // Factors: search volume, competitor success, difficulty
    const volumeScore = Math.min(gap.searchVolume / 100, 100);
    const competitionScore = gap.competitorsRanking.length * 10;
    const positionScore = gap.avgCompetitorPosition <= 10 ? 100 : 50;
    const difficultyScore = 100 - gap.difficulty;

    return Math.round(
      (volumeScore * 0.4) +
      (competitionScore * 0.2) +
      (positionScore * 0.2) +
      (difficultyScore * 0.2)
    );
  }

  // Generate opportunities
  generateOpportunities(gaps) {
    const opportunities = [];

    // Quick wins (low difficulty, high volume)
    const quickWins = gaps.filter(g => 
      g.difficulty < 40 && g.searchVolume > 1000
    ).slice(0, 20);

    if (quickWins.length > 0) {
      opportunities.push({
        type: 'quick_wins',
        title: 'Quick Win Keywords',
        description: 'Low difficulty keywords with good search volume',
        keywords: quickWins,
        priority: 'critical',
        estimatedImpact: 'high'
      });
    }

    // Competitor dominance (all competitors rank well)
    const competitorDominance = gaps.filter(g =>
      g.competitorsRanking.length >= 3 && g.avgCompetitorPosition <= 10
    ).slice(0, 20);

    if (competitorDominance.length > 0) {
      opportunities.push({
        type: 'competitor_dominance',
        title: 'Competitors Dominate',
        description: 'Keywords where multiple competitors rank well',
        keywords: competitorDominance,
        priority: 'high',
        estimatedImpact: 'high'
      });
    }

    // High volume gaps
    const highVolume = gaps.filter(g =>
      g.searchVolume > 5000
    ).slice(0, 15);

    if (highVolume.length > 0) {
      opportunities.push({
        type: 'high_volume',
        title: 'High Volume Opportunities',
        description: 'Keywords with significant search volume',
        keywords: highVolume,
        priority: 'high',
        estimatedImpact: 'very high'
      });
    }

    // Long-tail gaps (4+ words)
    const longTail = gaps.filter(g =>
      g.keyword.split(' ').length >= 4 && g.difficulty < 50
    ).slice(0, 30);

    if (longTail.length > 0) {
      opportunities.push({
        type: 'long_tail',
        title: 'Long-Tail Opportunities',
        description: 'Easier to rank, specific intent',
        keywords: longTail,
        priority: 'medium',
        estimatedImpact: 'medium'
      });
    }

    return opportunities;
  }

  // Analyze topical gaps
  async analyzeTopicalGaps(params) {
    const { targetDomain, competitorDomains } = params;

    const topicalGaps = {
      targetDomain,
      competitorDomains,
      timestamp: new Date().toISOString(),
      topics: [],
      recommendations: []
    };

    // Mock topic extraction
    const allTopics = [
      'Getting Started', 'Best Practices', 'Advanced Techniques',
      'Troubleshooting', 'Case Studies', 'Comparisons',
      'Tutorials', 'Reviews', 'Industry News', 'Tools & Resources'
    ];

    // Target coverage
    const targetTopics = new Set(
      allTopics.filter(() => Math.random() > 0.4)
    );

    // Competitor coverage
    const competitorTopics = competitorDomains.map(domain => ({
      domain,
      topics: new Set(allTopics.filter(() => Math.random() > 0.3))
    }));

    // Find gaps
    allTopics.forEach(topic => {
      const competitorCount = competitorTopics.filter(c => 
        c.topics.has(topic)
      ).length;

      const hasTarget = targetTopics.has(topic);

      if (!hasTarget && competitorCount >= 2) {
        topicalGaps.topics.push({
          topic,
          targetCoverage: false,
          competitorCount,
          competitorPercentage: (competitorCount / competitorDomains.length) * 100,
          priority: competitorCount >= 3 ? 'high' : 'medium'
        });
      }
    });

    // Generate recommendations
    topicalGaps.topics.forEach(topic => {
      topicalGaps.recommendations.push({
        topic: topic.topic,
        action: 'Create comprehensive content',
        priority: topic.priority,
        reason: `${topic.competitorCount} competitors cover this topic`
      });
    });

    return topicalGaps;
  }

  // Analyze SERP feature gaps
  async analyzeSERPFeatureGaps(params) {
    const { keywords, targetDomain } = params;

    const featureGaps = {
      targetDomain,
      totalKeywords: keywords.length,
      features: {},
      opportunities: [],
      timestamp: new Date().toISOString()
    };

    const featureTypes = [
      'featured_snippet',
      'people_also_ask',
      'video_carousel',
      'image_pack',
      'local_pack'
    ];

    // Mock SERP feature analysis
    featureTypes.forEach(feature => {
      const keywordsWithFeature = Math.floor(keywords.length * Math.random());
      const targetOwns = Math.floor(keywordsWithFeature * Math.random() * 0.3);
      const competitorOwns = keywordsWithFeature - targetOwns;

      featureGaps.features[feature] = {
        keywordsWithFeature,
        targetOwns,
        competitorOwns,
        gapPercentage: keywordsWithFeature > 0 
          ? (competitorOwns / keywordsWithFeature) * 100
          : 0
      };

      if (competitorOwns > targetOwns * 2) {
        featureGaps.opportunities.push({
          feature,
          type: 'SERP feature',
          gap: competitorOwns - targetOwns,
          recommendation: `Optimize for ${feature} - competitors own ${competitorOwns} vs your ${targetOwns}`,
          priority: 'high'
        });
      }
    });

    return featureGaps;
  }

  // Get content recommendations
  async getContentRecommendations(analysisId) {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) throw new Error('Analysis not found');

    const recommendations = {
      analysisId,
      recommendations: [],
      priorityActions: [],
      contentPlan: []
    };

    // Top 20 gaps become content recommendations
    analysis.gaps.slice(0, 20).forEach((gap, idx) => {
      recommendations.recommendations.push({
        priority: idx < 5 ? 'critical' : idx < 10 ? 'high' : 'medium',
        keyword: gap.keyword,
        contentType: this.suggestContentType(gap),
        targetWordCount: this.suggestWordCount(gap),
        estimatedTraffic: Math.floor(gap.searchVolume * 0.2),
        competitorBenchmark: {
          avgPosition: gap.avgCompetitorPosition,
          totalCompetitors: gap.competitorsRanking.length
        }
      });
    });

    // Priority actions
    recommendations.priorityActions = [
      'Create content for top 5 quick win keywords',
      'Analyze competitor content structure for high-opportunity gaps',
      'Build topic clusters around high-volume gap keywords',
      'Monitor SERP features for gap keywords'
    ];

    // 90-day content plan
    const weeks = 12;
    for (let week = 1; week <= weeks; week++) {
      const weekGaps = analysis.gaps.slice((week - 1) * 2, week * 2);
      
      recommendations.contentPlan.push({
        week,
        topics: weekGaps.map(g => g.keyword),
        focus: week <= 4 ? 'Quick wins' : week <= 8 ? 'High volume' : 'Long tail',
        estimatedOutput: '2-3 articles'
      });
    }

    return recommendations;
  }

  // Suggest content type
  suggestContentType(gap) {
    if (gap.keyword.includes('how to') || gap.keyword.includes('guide')) {
      return 'Tutorial/Guide';
    }
    if (gap.keyword.includes('best') || gap.keyword.includes('top')) {
      return 'Listicle/Comparison';
    }
    if (gap.keyword.includes('what is') || gap.keyword.includes('definition')) {
      return 'Educational/Explainer';
    }
    if (gap.keyword.includes('vs') || gap.keyword.includes('versus')) {
      return 'Comparison';
    }
    return 'Informational Article';
  }

  // Suggest word count
  suggestWordCount(gap) {
    // Higher difficulty = longer content needed
    if (gap.difficulty > 70) return '2500-3500 words';
    if (gap.difficulty > 50) return '1500-2500 words';
    if (gap.difficulty > 30) return '1000-1500 words';
    return '800-1200 words';
  }
}

module.exports = GapAnalysisEngine;
