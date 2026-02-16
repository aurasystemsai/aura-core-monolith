/**
 * SERP Analysis Engine
 * Analyzes search engine results pages, identifies SERP features, content gaps, and ranking opportunities
 */

class SERPAnalysisEngine {
  constructor() {
    this.analyses = new Map(); // Map<analysisId, analysis>
    this.serpFeatures = new Map(); // Map<featureId, feature>
    this.competitors = new Map(); // Map<competitorId, competitor>
  }

  /**
   * Analyze SERP for a keyword
   */
  async analyzeSERP(keyword, params = {}) {
    const {
      location = 'US',
      device = 'desktop', // desktop, mobile, tablet
      depth = 20 // Number of results to analyze
    } = params;

    const analysisId = `serp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate SERP analysis (production would use Google Search API, DataForSEO, etc.)
    const analysis = {
      id: analysisId,
      keyword,
      location,
      device,
      timestamp: new Date().toISOString(),
      results: this._generateSERPResults(keyword, depth),
      features: this._detectSERPFeatures(keyword),
      topDomains: [],
      avgWordCount: 0,
      avgTitleLength: 0,
      avgMetaLength: 0,
      contentTypes: {},
      insights: []
    };

    // Calculate averages
    analysis.avgWordCount = Math.round(
      analysis.results.reduce((sum, r) => sum + r.wordCount, 0) / analysis.results.length
    );
    analysis.avgTitleLength = Math.round(
      analysis.results.reduce((sum, r) => sum + r.title.length, 0) / analysis.results.length
    );
    analysis.avgMetaLength = Math.round(
      analysis.results.reduce((sum, r) => sum + r.metaDescription.length, 0) / analysis.results.length
    );

    // Count content types
    analysis.contentTypes = analysis.results.reduce((types, r) => {
      types[r.contentType] = (types[r.contentType] || 0) + 1;
      return types;
    }, {});

    // Extract top domains
    const domainCounts = {};
    analysis.results.forEach(r => {
      domainCounts[r.domain] = (domainCounts[r.domain] || 0) + 1;
    });
    analysis.topDomains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));

    // Generate insights
    analysis.insights = this._generateSERPInsights(analysis);

    this.analyses.set(analysisId, analysis);
    return analysis;
  }

  /**
   * Identify content gaps in SERP
   */
  async identifyContentGaps(keyword) {
    const analysis = await this.analyzeSERP(keyword);
    
    const gaps = {
      keyword,
      missingTopics: [],
      underservedQuestions: [],
      missingFormats: [],
      opportunityScore: 0,
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Analyze what's missing from top results
    const commonTopics = this._extractCommonTopics(analysis.results);
    const allTopics = this._extractAllPossibleTopics(keyword);
    
    gaps.missingTopics = allTopics.filter(topic => 
      !commonTopics.some(ct => ct.toLowerCase().includes(topic.toLowerCase()))
    );

    // Check for underserved question types
    gaps.underservedQuestions = this._findUnderservedQuestions(analysis);

    // Identify missing content formats
    const currentFormats = Object.keys(analysis.contentTypes);
    const allFormats = ['article', 'listicle', 'how-to', 'comparison', 'review', 'video', 'infographic'];
    gaps.missingFormats = allFormats.filter(f => !currentFormats.includes(f));

    // Calculate opportunity score (0-100)
    gaps.opportunityScore = this._calculateOpportunityScore(gaps, analysis);

    // Generate recommendations
    gaps.recommendations = this._generateGapRecommendations(gaps, analysis);

    return gaps;
  }

  /**
   * Analyze SERP features present
   */
  async analyzeSERPFeatures(keyword) {
    const features = this._detectSERPFeatures(keyword);
    
    const analysis = {
      keyword,
      features,
      totalFeatures: features.length,
      byType: {},
      opportunities: [],
      timestamp: new Date().toISOString()
    };

    // Group by type
    features.forEach(f => {
      analysis.byType[f.type] = (analysis.byType[f.type] || 0) + 1;
    });

    // Identify opportunities
    analysis.opportunities = this._identifyFeatureOpportunities(features);

    return analysis;
  }

  /**
   * Compare SERP across devices
   */
  async compareDevices(keyword) {
    const desktop = await this.analyzeSERP(keyword, { device: 'desktop' });
    const mobile = await this.analyzeSERP(keyword, { device: 'mobile' });

    const comparison = {
      keyword,
      desktop: {
        features: desktop.features.map(f => f.type),
        avgPosition: this._calculateAvgPosition(desktop.results),
        topDomain: desktop.topDomains[0]?.domain
      },
      mobile: {
        features: mobile.features.map(f => f.type),
        avgPosition: this._calculateAvgPosition(mobile.results),
        topDomain: mobile.topDomains[0]?.domain
      },
      differences: [],
      timestamp: new Date().toISOString()
    };

    // Find differences
    if (desktop.topDomains[0]?.domain !== mobile.topDomains[0]?.domain) {
      comparison.differences.push({
        type: 'top-domain',
        message: 'Different top domains on desktop vs mobile'
      });
    }

    const uniqueDesktopFeatures = desktop.features.filter(f => 
      !mobile.features.some(mf => mf.type === f.type)
    );
    const uniqueMobileFeatures = mobile.features.filter(f => 
      !desktop.features.some(df => df.type === f.type)
    );

    if (uniqueDesktopFeatures.length > 0) {
      comparison.differences.push({
        type: 'desktop-only-features',
        features: uniqueDesktopFeatures.map(f => f.type)
      });
    }

    if (uniqueMobileFeatures.length > 0) {
      comparison.differences.push({
        type: 'mobile-only-features',
        features: uniqueMobileFeatures.map(f => f.type)
      });
    }

    return comparison;
  }

  /**
   * Track SERP changes over time
   */
  async trackSERPChanges(keyword, previousAnalysisId) {
    const current = await this.analyzeSERP(keyword);
    const previous = this.analyses.get(previousAnalysisId);

    if (!previous) {
      return { error: 'Previous analysis not found' };
    }

    const changes = {
      keyword,
      timespan: {
        from: previous.timestamp,
        to: current.timestamp
      },
      newResults: [],
      droppedResults: [],
      positionChanges: [],
      featureChanges: [],
      summary: '',
      timestamp: new Date().toISOString()
    };

    // Compare results
    const previousDomains = previous.results.map(r => r.domain);
    const currentDomains = current.results.map(r => r.domain);

    changes.newResults = currentDomains.filter(d => !previousDomains.includes(d));
    changes.droppedResults = previousDomains.filter(d => !currentDomains.includes(d));

    // Track position changes
    previousDomains.forEach((domain, oldPos) => {
      const newPos = currentDomains.indexOf(domain);
      if (newPos !== -1 && newPos !== oldPos) {
        changes.positionChanges.push({
          domain,
          previousPosition: oldPos + 1,
          currentPosition: newPos + 1,
          change: oldPos - newPos
        });
      }
    });

    // Track feature changes
    const previousFeatures = previous.features.map(f => f.type);
    const currentFeatures = current.features.map(f => f.type);
    const addedFeatures = currentFeatures.filter(f => !previousFeatures.includes(f));
    const removedFeatures = previousFeatures.filter(f => !currentFeatures.includes(f));

    if (addedFeatures.length > 0) {
      changes.featureChanges.push({ type: 'added', features: addedFeatures });
    }
    if (removedFeatures.length > 0) {
      changes.featureChanges.push({ type: 'removed', features: removedFeatures });
    }

    // Generate summary
    changes.summary = this._generateChangesSummary(changes);

    return changes;
  }

  /**
   * Analyze top 10 results in detail
   */
  async analyzeTop10(keyword) {
    const serp = await this.analyzeSERP(keyword, { depth: 10 });

    const analysis = {
      keyword,
      results: serp.results,
      aggregateMetrics: {
        avgWordCount: serp.avgWordCount,
        avgTitleLength: serp.avgTitleLength,
        avgMetaLength: serp.avgMetaLength,
        avgHeadingCount: Math.round(
          serp.results.reduce((sum, r) => sum + r.headingCount, 0) / 10
        ),
        avgImageCount: Math.round(
          serp.results.reduce((sum, r) => sum + r.imageCount, 0) / 10
        ),
        avgLinkCount: Math.round(
          serp.results.reduce((sum, r) => sum + r.linkCount, 0) / 10
        )
      },
      commonPatterns: this._identifyCommonPatterns(serp.results),
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Generate content recommendations
    analysis.recommendations = [
      {
        metric: 'word-count',
        recommendation: `Target ${analysis.aggregateMetrics.avgWordCount} words (average of top 10)`,
        priority: 'high'
      },
      {
        metric: 'title-length',
        recommendation: `Use ~${analysis.aggregateMetrics.avgTitleLength} character titles`,
        priority: 'medium'
      },
      {
        metric: 'headings',
        recommendation: `Include ${analysis.aggregateMetrics.avgHeadingCount}+ headings`,
        priority: 'medium'
      },
      {
        metric: 'images',
        recommendation: `Add ${analysis.aggregateMetrics.avgImageCount}+ images`,
        priority: 'low'
      }
    ];

    return analysis;
  }

  /**
   * Get featured snippet opportunities
   */
  async getFeaturedSnippetOpportunities(keyword) {
    const serp = await this.analyzeSERP(keyword);
    const hasSnippet = serp.features.some(f => f.type === 'featured-snippet');

    const opportunities = {
      keyword,
      hasCurrentSnippet: hasSnippet,
      currentHolder: hasSnippet ? serp.results[0].domain : null,
      opportunityScore: 0,
      snippetType: hasSnippet ? 'paragraph' : null, // paragraph, list, table, video
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Calculate opportunity score
    if (!hasSnippet) {
      opportunities.opportunityScore = 85; // High opportunity if no snippet exists
      opportunities.recommendations.push({
        type: 'create-snippet',
        message: 'No featured snippet currently - high opportunity to capture',
        actions: ['Format content as concise paragraph', 'Use clear question-answer structure', 'Add schema markup']
      });
    } else {
      opportunities.opportunityScore = 45; // Medium opportunity to replace existing
      opportunities.recommendations.push({
        type: 'replace-snippet',
        message: `Featured snippet held by ${opportunities.currentHolder}`,
        actions: ['Provide more comprehensive answer', 'Use better formatting', 'Improve content clarity']
      });
    }

    return opportunities;
  }

  // === Helper Methods ===

  _generateSERPResults(keyword, depth) {
    const results = [];
    const domains = ['example.com', 'competitor.com', 'authority.org', 'blog.net', 'guide.io'];
    const contentTypes = ['article', 'listicle', 'how-to', 'comparison', 'review'];

    for (let i = 0; i < depth; i++) {
      results.push({
        position: i + 1,
        url: `https://${domains[i % domains.length]}/page-${i}`,
        domain: domains[i % domains.length],
        title: `${keyword} - ${contentTypes[i % contentTypes.length]} ${i + 1}`,
        metaDescription: `Learn about ${keyword} with this comprehensive ${contentTypes[i % contentTypes.length]}...`,
        wordCount: Math.floor(Math.random() * 2000) + 500,
        headingCount: Math.floor(Math.random() * 10) + 3,
        imageCount: Math.floor(Math.random() * 15) + 2,
        linkCount: Math.floor(Math.random() * 30) + 5,
        contentType: contentTypes[i % contentTypes.length],
        lastUpdated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return results;
  }

  _detectSERPFeatures(keyword) {
    const allFeatures = [
      { type: 'featured-snippet', description: 'Position 0 snippet', impact: 'high' },
      { type: 'people-also-ask', description: 'Related questions', impact: 'medium' },
      { type: 'local-pack', description: 'Map with local results', impact: 'high' },
      { type: 'knowledge-panel', description: 'Right-side info box', impact: 'medium' },
      { type: 'image-pack', description: 'Image carousel', impact: 'low' },
      { type: 'video-carousel', description: 'Video results', impact: 'medium' },
      { type: 'shopping-results', description: 'Product listings', impact: 'high' },
      { type: 'top-stories', description: 'News articles', impact: 'medium' }
    ];

    // Randomly select 2-4 features present
    const featureCount = Math.floor(Math.random() * 3) + 2;
    const shuffled = allFeatures.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, featureCount);
  }

  _generateSERPInsights(analysis) {
    const insights = [];

    // Content length insight
    if (analysis.avgWordCount > 2000) {
      insights.push({
        type: 'content-length',
        message: 'Top results favor long-form content',
        recommendation: `Target ${analysis.avgWordCount}+ words`
      });
    }

    // Content type insight
    const dominantType = Object.entries(analysis.contentTypes)
      .sort((a, b) => b[1] - a[1])[0];
    if (dominantType && dominantType[1] > analysis.results.length / 2) {
      insights.push({
        type: 'content-type',
        message: `${dominantType[0]} format dominates SERP`,
        recommendation: `Consider creating ${dominantType[0]} content`
      });
    }

    // Domain diversity insight
    if (analysis.topDomains[0]?.count > 3) {
      insights.push({
        type: 'domain-dominance',
        message: `${analysis.topDomains[0].domain} holds multiple positions`,
        recommendation: 'Major competitor to analyze'
      });
    }

    return insights;
  }

  _extractCommonTopics(results) {
    // Simplified topic extraction from titles
    return results.map(r => r.title);
  }

  _extractAllPossibleTopics(keyword) {
    // Generate possible topics for the keyword
    return [
      `${keyword} basics`,
      `${keyword} advanced`,
      `${keyword} pricing`,
      `${keyword} alternatives`,
      `${keyword} comparison`
    ];
  }

  _findUnderservedQuestions(analysis) {
    const hasPAA = analysis.features.some(f => f.type === 'people-also-ask');
    if (hasPAA) return [];

    return [
      `What is ${analysis.keyword}?`,
      `How does ${analysis.keyword} work?`,
      `Why use ${analysis.keyword}?`
    ];
  }

  _calculateOpportunityScore(gaps, analysis) {
    let score = 0;
    score += gaps.missingTopics.length * 10;
    score += gaps.underservedQuestions.length * 15;
    score += gaps.missingFormats.length * 8;
    return Math.min(100, score);
  }

  _generateGapRecommendations(gaps, analysis) {
    const recommendations = [];

    if (gaps.missingTopics.length > 0) {
      recommendations.push({
        type: 'topics',
        message: `Cover ${gaps.missingTopics.length} under-addressed topics`,
        topics: gaps.missingTopics
      });
    }

    if (gaps.missingFormats.length > 0) {
      recommendations.push({
        type: 'formats',
        message: `Create content in ${gaps.missingFormats[0]} format`,
        formats: gaps.missingFormats
      });
    }

    return recommendations;
  }

  _identifyFeatureOpportunities(features) {
    return features.map(f => ({
      feature: f.type,
      opportunity: `Optimize for ${f.type}`,
      impact: f.impact
    }));
  }

  _calculateAvgPosition(results) {
    return results.reduce((sum, r, idx) => sum + (idx + 1), 0) / results.length;
  }

  _identifyCommonPatterns(results) {
    return {
      mostCommonContentType: this._getMostCommon(results.map(r => r.contentType)),
      avgRecency: this._calculateAvgRecency(results),
      structurePatterns: ['Clear headings', 'Multiple sections', 'FAQ section']
    };
  }

  _getMostCommon(arr) {
    const counts = {};
    arr.forEach(item => counts[item] = (counts[item] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  _calculateAvgRecency(results) {
    const now = Date.now();
    const avgAge = results.reduce((sum, r) => {
      const age = now - new Date(r.lastUpdated).getTime();
      return sum + age;
    }, 0) / results.length;

    const days = Math.floor(avgAge / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }

  _generateChangesSummary(changes) {
    const parts = [];
    if (changes.newResults.length > 0) {
      parts.push(`${changes.newResults.length} new results`);
    }
    if (changes.droppedResults.length > 0) {
      parts.push(`${changes.droppedResults.length} dropped`);
    }
    if (changes.positionChanges.length > 0) {
      parts.push(`${changes.positionChanges.length} position changes`);
    }
    return parts.join(', ') || 'No significant changes';
  }
}

module.exports = SERPAnalysisEngine;
