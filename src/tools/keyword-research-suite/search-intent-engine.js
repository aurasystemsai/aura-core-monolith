/**
 * Search Intent Engine  
 * Classifies keywords by search intent using ML patterns and provides intent-based optimization recommendations
 */

class SearchIntentEngine {
  constructor() {
    this.classifications = new Map(); // Map<classificationId, classification>
    this.intents = ['informational', 'navigational', 'commercial', 'transactional'];
    this.patterns = this._loadIntentPatterns();
  }

  /**
   * Classify keyword by search intent
   */
  async classifyIntent(keyword) {
    const classificationId = `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const classification = {
      id: classificationId,
      keyword,
      primaryIntent: null,
      intentScores: {
        informational: 0,
        navigational: 0,
        commercial: 0,
        transactional: 0
      },
      confidence: 0,
      signals: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Analyze keyword patterns
    classification.signals = this._analyzeIntentSignals(keyword);

    // Calculate intent scores
    classification.intentScores = this._calculateIntentScores(keyword, classification.signals);

    // Determine primary intent
    const maxIntent = Object.entries(classification.intentScores)
      .sort((a, b) => b[1] - a[1])[0];
    
    classification.primaryIntent = maxIntent[0];
    classification.confidence = maxIntent[1];

    // Generate recommendations based on intent
    classification.recommendations = this._generateIntentRecommendations(classification);

    this.classifications.set(classificationId, classification);
    return classification;
  }

  /**
   * Bulk classify multiple keywords
   */
  async bulkClassify(keywords) {
    const results = {
      keywords: [],
      byIntent: {
        informational: [],
        navigational: [],
        commercial: [],
        transactional: []
      },
      distribution: {},
      timestamp: new Date().toISOString()
    };

    for (const keyword of keywords) {
      const classification = await this.classifyIntent(keyword);
      results.keywords.push(classification);
      results.byIntent[classification.primaryIntent].push(keyword);
    }

    // Calculate distribution
    results.distribution = {
      informational: (results.byIntent.informational.length / keywords.length) * 100,
      navigational: (results.byIntent.navigational.length / keywords.length) * 100,
      commercial: (results.byIntent.commercial.length / keywords.length) * 100,
      transactional: (results.byIntent.transactional.length / keywords.length) * 100
    };

    return results;
  }

  /**
   * Get intent-specific content recommendations
   */
  async getContentRecommendations(keyword, intent) {
    const recommendations = {
      keyword,
      intent,
      contentType: '',
      structure: [],
      elements: [],
      cta: '',
      wordCountTarget: 0,
      examples: [],
      timestamp: new Date().toISOString()
    };

    switch (intent) {
      case 'informational':
        recommendations.contentType = 'Educational content, guide, or blog post';
        recommendations.structure = [
          'Introduction with clear definition',
          'Comprehensive explanation',
          'Examples and use cases',
          'Visual aids (images, diagrams)',
          'Summary and key takeaways'
        ];
        recommendations.elements = ['FAQ section', 'Related articles', 'Statistics/data', 'Expert quotes'];
        recommendations.cta = 'Learn more, Read related content, Subscribe for updates';
        recommendations.wordCountTarget = 1500;
        recommendations.examples = ['What is...', 'How does...', 'Guide to...'];
        break;

      case 'navigational':
        recommendations.contentType = 'Landing page or homepage';
        recommendations.structure = [
          'Clear brand presence',
          'Navigation menu',
          'Product/service overview',
          'Quick links',
          'Search functionality'
        ];
        recommendations.elements = ['Logo', 'Navigation bar', 'Site search', 'Contact info'];
        recommendations.cta = 'Explore, Browse, Sign in';
        recommendations.wordCountTarget = 500;
        recommendations.examples = ['Brand name', '[Company] login', '[Product] homepage'];
        break;

      case 'commercial':
        recommendations.contentType = 'Comparison page, review, or buying guide';
        recommendations.structure = [
          'Product comparison table',
          'Pros and cons',
          'Feature breakdown',
          'Pricing information',
          'Expert recommendation'
        ];
        recommendations.elements = ['Comparison table', 'Star ratings', 'Price chart', 'User reviews'];
        recommendations.cta = 'Compare prices, Get quote, See plans';
        recommendations.wordCountTarget = 2000;
        recommendations.examples = ['Best...', '[Product] vs [Product]', '[Product] review'];
        break;

      case 'transactional':
        recommendations.contentType = 'Product page or service page';
        recommendations.structure = [
          'Clear product title and price',
          'High-quality images',
          'Key features and benefits',
          'Add to cart / Purchase button',
          'Trust signals (reviews, guarantees)'
        ];
        recommendations.elements = ['Buy button', 'Price', 'Product images', 'Add to cart', 'Reviews', 'Shipping info'];
        recommendations.cta = 'Buy now, Add to cart, Get started, Sign up';
        recommendations.wordCountTarget = 800;
        recommendations.examples = ['Buy...', '[Product] for sale', '[Service] pricing'];
        break;
    }

    return recommendations;
  }

  /**
   * Map keywords to buyer journey stage
   */
  async mapToBuyerJourney(keywords) {
    const mapping = {
      keywords: [],
      byStage: {
        awareness: [],
        consideration: [],
        decision: []
      },
      funnel: {
        top: 0,
        middle: 0,
        bottom: 0
      },
      timestamp: new Date().toISOString()
    };

    for (const keyword of keywords) {
      const classification = await this.classifyIntent(keyword);
      const stage = this._mapIntentToStage(classification.primaryIntent);
      
      mapping.keywords.push({
        keyword,
        intent: classification.primaryIntent,
        stage
      });

      mapping.byStage[stage].push(keyword);
    }

    // Calculate funnel distribution
    mapping.funnel.top = (mapping.byStage.awareness.length / keywords.length) * 100;
    mapping.funnel.middle = (mapping.byStage.consideration.length / keywords.length) * 100;
    mapping.funnel.bottom = (mapping.byStage.decision.length / keywords.length) * 100;

    return mapping;
  }

  /**
   * Analyze intent distribution across keyword set
   */
  async analyzeIntentDistribution(keywords) {
    const analysis = {
      totalKeywords: keywords.length,
      distribution: {},
      recommendations: [],
      balance: '',
      timestamp: new Date().toISOString()
    };

    const classified = await this.bulkClassify(keywords);
    analysis.distribution = classified.distribution;

    // Analyze balance
    const hasInfo = analysis.distribution.informational > 20;
    const hasCommercial = analysis.distribution.commercial > 15;
    const hasTransactional = analysis.distribution.transactional > 10;

    if (hasInfo && hasCommercial && hasTransactional) {
      analysis.balance = 'balanced';
      analysis.recommendations.push({
        type: 'balance',
        message: 'Good intent distribution across funnel',
        action: 'Maintain current strategy'
      });
    } else {
      analysis.balance = 'imbalanced';
      
      if (analysis.distribution.informational < 20) {
        analysis.recommendations.push({
          type: 'add-informational',
          message: 'Low informational content',
          action: 'Add educational content for top-of-funnel traffic'
        });
      }
      
      if (analysis.distribution.transactional < 10) {
        analysis.recommendations.push({
          type: 'add-transactional',
          message: 'Low transactional keywords',
          action: 'Target more bottom-funnel conversion keywords'
        });
      }
    }

    return analysis;
  }

  /**
   * Get SERP intent analysis
   */
  async analyzeSERPIntent(keyword) {
    // Simulate analyzing top 10 SERP results to determine dominant intent
    const serpIntent = {
      keyword,
      topResults: this._simulateSERPResults(keyword),
      dominantIntent: null,
      mixedIntent: false,
      contentTypes: {},
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Count intents across results
    const intentCounts = {};
    serpIntent.topResults.forEach(result => {
      intentCounts[result.intent] = (intentCounts[result.intent] || 0) + 1;
      serpIntent.contentTypes[result.type] = (serpIntent.contentTypes[result.type] || 0) + 1;
    });

    // Determine dominant intent
    const sortedIntents = Object.entries(intentCounts).sort((a, b) => b[1] - a[1]);
    serpIntent.dominantIntent = sortedIntents[0][0];
    
    // Check if mixed intent (>= 2 intents with significant presence)
    const significantIntents = sortedIntents.filter(([, count]) => count >= 3);
    serpIntent.mixedIntent = significantIntents.length >= 2;

    // Generate recommendations
    if (serpIntent.mixedIntent) {
      serpIntent.recommendations.push({
        type: 'mixed-intent',
        message: 'SERP shows mixed intent - create comprehensive content',
        action: 'Cover multiple aspects to satisfy different user needs'
      });
    } else {
      serpIntent.recommendations.push({
        type: 'clear-intent',
        message: `SERP clearly favors ${serpIntent.dominantIntent} content`,
        action: `Optimize specifically for ${serpIntent.dominantIntent} intent`
      });
    }

    return serpIntent;
  }

  /**
   * Score keyword by intent match for your content
   */
  async scoreIntentMatch(keyword, yourContentType) {
    const keywordIntent = await this.classifyIntent(keyword);
    const serpIntent = await this.analyzeSERPIntent(keyword);

    const match = {
      keyword,
      yourContentType,
      keywordIntent: keywordIntent.primaryIntent,
      serpIntent: serpIntent.dominantIntent,
      matchScore: 0,
      isAligned: false,
      recommendation: '',
      timestamp: new Date().toISOString()
    };

    // Map content type to intent
    const contentIntentMap = {
      'blog-post': 'informational',
      'product-page': 'transactional',
      'comparison': 'commercial',
      'landing-page': 'navigational'
    };

    const yourIntent = contentIntentMap[yourContentType] || 'informational';

    // Calculate match score
    if (yourIntent === serpIntent.dominantIntent) {
      match.matchScore = 100;
      match.isAligned = true;
      match.recommendation = 'Perfect alignment with SERP intent';
    } else if (yourIntent === keywordIntent.primaryIntent) {
      match.matchScore = 70;
      match.isAligned = true;
      match.recommendation = 'Matches keyword intent but differs from SERP';
    } else {
      match.matchScore = 40;
      match.isAligned = false;
      match.recommendation = `Misalignment detected. SERP prefers ${serpIntent.dominantIntent} content`;
    }

    return match;
  }

  // === Helper Methods ===

  _loadIntentPatterns() {
    return {
      informational: {
        keywords: ['what', 'how', 'why', 'when', 'where', 'who', 'guide', 'tutorial', 'learn'],
        suffixes: ['meaning', 'definition', 'explained', 'guide', 'tutorial']
      },
      navigational: {
        keywords: ['login', 'sign in', 'homepage', 'official', 'website'],
        patterns: [/^[A-Z]/, /\.(com|net|org)$/] // Brand names, domains
      },
      commercial: {
        keywords: ['best', 'top', 'review', 'compare', 'vs', 'alternative', 'cheap', 'affordable'],
        suffixes: ['reviews', 'comparison', 'alternatives']
      },
      transactional: {
        keywords: ['buy', 'purchase', 'order', 'price', 'cost', 'hire', 'download', 'get'],
        suffixes: ['for sale', 'online', 'near me', 'pricing', 'coupon']
      }
    };
  }

  _analyzeIntentSignals(keyword) {
    const signals = [];
    const lowerKeyword = keyword.toLowerCase();

    // Check for question words
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
    questionWords.forEach(q => {
      if (lowerKeyword.includes(q)) {
        signals.push({ type: 'question-word', value: q, intent: 'informational', weight: 3 });
      }
    });

    // Check for commercial indicators
    const commercialWords = ['best', 'top', 'review', 'vs', 'compare'];
    commercialWords.forEach(c => {
      if (lowerKeyword.includes(c)) {
        signals.push({ type: 'commercial-word', value: c, intent: 'commercial', weight: 3 });
      }
    });

    // Check for transactional indicators
    const transactionalWords = ['buy', 'purchase', 'price', 'order', 'download'];
    transactionalWords.forEach(t => {
      if (lowerKeyword.includes(t)) {
        signals.push({ type: 'transactional-word', value: t, intent: 'transactional', weight: 4 });
      }
    });

    // Check for navigational indicators
    if (lowerKeyword.includes('login') || lowerKeyword.includes('sign in')) {
      signals.push({ type: 'navigational-word', value: 'login/signin', intent: 'navigational', weight: 5 });
    }

    return signals;
  }

  _calculateIntentScores(keyword, signals) {
    const scores = {
      informational: 25, // Base scores
      navigational: 5,
      commercial: 15,
      transactional: 10
    };

    // Add signal weights
    signals.forEach(signal => {
      scores[signal.intent] += signal.weight * 10;
    });

    // Normalize to 0-100
    const total = Object.values(scores).reduce((sum, s) => sum + s, 0);
    Object.keys(scores).forEach(intent => {
      scores[intent] = Math.round((scores[intent] / total) * 100);
    });

    return scores;
  }

  _generateIntentRecommendations(classification) {
    const recommendations = [];
    const intent = classification.primaryIntent;
    const confidence = classification.confidence;

    recommendations.push({
      type: 'content-format',
      message: `Create ${intent} content`,
      priority: confidence > 70 ? 'high' : 'medium'
    });

    if (confidence < 60) {
      recommendations.push({
        type: 'mixed-intent',
        message: 'Low confidence suggests mixed intent',
        priority: 'medium',
        action: 'Consider covering multiple intent types'
      });
    }

    // Intent-specific recommendations
    switch (intent) {
      case 'informational':
        recommendations.push({
          type: 'depth',
          message: 'Provide comprehensive, educational content',
          action: 'Include FAQs, examples, and detailed explanations'
        });
        break;
      case 'commercial':
        recommendations.push({
          type: 'comparison',
          message: 'Include comparison elements',
          action: 'Add comparison tables, pros/cons, pricing info'
        });
        break;
      case 'transactional':
        recommendations.push({
          type: 'conversion',
          message: 'Optimize for conversion',
          action: 'Clear CTA, pricing, trust signals, easy purchase path'
        });
        break;
      case 'navigational':
        recommendations.push({
          type: 'navigation',
          message: 'Ensure easy navigation',
          action: 'Clear site structure, search functionality, menu'
        });
        break;
    }

    return recommendations;
  }

  _mapIntentToStage(intent) {
    const mapping = {
      'informational': 'awareness',
      'navigational': 'awareness',
      'commercial': 'consideration',
      'transactional': 'decision'
    };
    return mapping[intent] || 'awareness';
  }

  _simulateSERPResults(keyword) {
    const results = [];
    const intents = ['informational', 'commercial', 'transactional'];
    const types = ['article', 'product-page', 'comparison', 'guide'];

    for (let i = 0; i < 10; i++) {
      results.push({
        position: i + 1,
        intent: intents[Math.floor(Math.random() * intents.length)],
        type: types[Math.floor(Math.random() * types.length)],
        url: `https://example${i}.com/${keyword.replace(/\s+/g, '-')}`
      });
    }

    return results;
  }
}

module.exports = SearchIntentEngine;
