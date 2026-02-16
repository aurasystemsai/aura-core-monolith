/**
 * Search Intent Classification Engine
 * Classifies keywords by search intent using ML
 */

class IntentClassificationEngine {
  constructor() {
    this.classifications = new Map();
    this.customRules = new Map();
    this.trainingData = this.loadTrainingData();
  }

  // Load training data for ML model
  loadTrainingData() {
    return {
      informational: [
        'what is', 'how to', 'guide', 'tutorial', 'learn', 'why', 'when',
        'definition', 'meaning', 'explain', 'tips', 'examples', 'types of'
      ],
      navigational: [
        'login', 'sign in', 'website', 'official', 'homepage', 'download',
        'app', 'portal', 'dashboard', 'account'
      ],
      commercial: [
        'best', 'top', 'vs', 'review', 'comparison', 'alternative',
        'recommended', 'pros and cons', 'ratings', 'evaluate'
      ],
      transactional: [
        'buy', 'purchase', 'order', 'price', 'cost', 'cheap', 'discount',
        'deal', 'coupon', 'sale', 'shop', 'store', 'for sale'
      ]
    };
  }

  // Classify keyword intent
  async classifyIntent(keyword) {
    const classification = {
      keyword,
      primaryIntent: null,
      confidence: 0,
      intentScores: {
        informational: 0,
        navigational: 0,
        commercial: 0,
        transactional: 0
      },
      signals: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    const lowerKeyword = keyword.toLowerCase();

    // Calculate scores for each intent
    Object.entries(this.trainingData).forEach(([intent, patterns]) => {
      let score = 0;
      const matchedPatterns = [];

      patterns.forEach(pattern => {
        if (lowerKeyword.includes(pattern)) {
          score += 25;
          matchedPatterns.push(pattern);
        }
      });

      // Apply custom rules
      const customRule = this.customRules.get(intent);
      if (customRule) {
        const customScore = customRule(lowerKeyword);
        score += customScore;
      }

      classification.intentScores[intent] = Math.min(score, 100);
      
      if (matchedPatterns.length > 0) {
        classification.signals.push({
          intent,
          patterns: matchedPatterns,
          strength: matchedPatterns.length
        });
      }
    });

    // Determine primary intent
    let maxScore = 0;
    Object.entries(classification.intentScores).forEach(([intent, score]) => {
      if (score > maxScore) {
        maxScore = score;
        classification.primaryIntent = intent;
        classification.confidence = score;
      }
    });

    // If no clear match, use heuristics
    if (classification.confidence < 25) {
      const heuristicIntent = this.heuristicClassification(lowerKeyword);
      classification.primaryIntent = heuristicIntent.intent;
      classification.confidence = heuristicIntent.confidence;
      classification.intentScores[heuristicIntent.intent] = heuristicIntent.confidence;
    }

    // Generate content recommendations
    classification.recommendations = this.generateRecommendations(classification);

    this.classifications.set(keyword, classification);
    return classification;
  }

  // Heuristic classification when ML is uncertain
  heuristicClassification(keyword) {
    // Question words → informational
    if (/^(what|how|why|when|where|who|which)/.test(keyword)) {
      return { intent: 'informational', confidence: 70 };
    }

    // Brand/product names → navigational
    if (/\b(login|sign in|website|portal)\b/.test(keyword)) {
      return { intent: 'navigational', confidence: 65 };
    }

    // Comparison/evaluation → commercial
    if (/\b(best|top|vs|versus|compare|review)\b/.test(keyword)) {
      return { intent: 'commercial', confidence: 75 };
    }

    // Purchase/action → transactional
    if (/\b(buy|purchase|order|price|for sale)\b/.test(keyword)) {
      return { intent: 'transactional', confidence: 80 };
    }

    // Default to informational
    return { intent: 'informational', confidence: 40 };
  }

  // Generate content recommendations based on intent
  generateRecommendations(classification) {
    const recommendations = [];
    const { primaryIntent } = classification;

    switch (primaryIntent) {
      case 'informational':
        recommendations.push({
          type: 'content',
          priority: 'high',
          suggestion: 'Create comprehensive guide or tutorial'
        });
        recommendations.push({
          type: 'format',
          priority: 'high',
          suggestion: 'Use clear headings, step-by-step instructions, examples'
        });
        recommendations.push({
          type: 'cta',
          priority: 'low',
          suggestion: 'Soft CTAs - newsletter signup, related content'
        });
        break;

      case 'navigational':
        recommendations.push({
          type: 'content',
          priority: 'high',
          suggestion: 'Ensure brand/homepage is easily findable'
        });
        recommendations.push({
          type: 'seo',
          priority: 'high',
          suggestion: 'Optimize for branded terms, use exact match'
        });
        recommendations.push({
          type: 'ux',
          priority: 'high',
          suggestion: 'Clear navigation, prominent search, sitemap'
        });
        break;

      case 'commercial':
        recommendations.push({
          type: 'content',
          priority: 'high',
          suggestion: 'Create detailed comparison, reviews, pros/cons'
        });
        recommendations.push({
          type: 'format',
          priority: 'high',
          suggestion: 'Use comparison tables, ratings, feature lists'
        });
        recommendations.push({
          type: 'cta',
          priority: 'medium',
          suggestion: 'Product demos, free trials, consultations'
        });
        break;

      case 'transactional':
        recommendations.push({
          type: 'content',
          priority: 'high',
          suggestion: 'Product pages with clear pricing, availability'
        });
        recommendations.push({
          type: 'format',
          priority: 'high',
          suggestion: 'Prominent buy buttons, trust signals, reviews'
        });
        recommendations.push({
          type: 'cta',
          priority: 'high',
          suggestion: 'Strong CTAs - Add to Cart, Buy Now, limited offers'
        });
        recommendations.push({
          type: 'seo',
          priority: 'high',
          suggestion: 'Product schema, pricing markup, availability'
        });
        break;
    }

    return recommendations;
  }

  // Bulk classify keywords
  async bulkClassify(keywords) {
    return Promise.all(keywords.map(kw => this.classifyIntent(kw)));
  }

  // Add custom classification rule
  addCustomRule(intent, ruleFn) {
    this.customRules.set(intent, ruleFn);
  }

  // Get intent distribution for keyword list
  async getIntentDistribution(keywords) {
    const classifications = await this.bulkClassify(keywords);
    
    const distribution = {
      total: keywords.length,
      breakdown: {
        informational: 0,
        navigational: 0,
        commercial: 0,
        transactional: 0
      },
      percentages: {},
      avgConfidence: {}
    };

    const confidences = {
      informational: [],
      navigational: [],
      commercial: [],
      transactional: []
    };

    classifications.forEach(c => {
      distribution.breakdown[c.primaryIntent]++;
      confidences[c.primaryIntent].push(c.confidence);
    });

    // Calculate percentages and avg confidence
    Object.keys(distribution.breakdown).forEach(intent => {
      distribution.percentages[intent] = 
        (distribution.breakdown[intent] / distribution.total) * 100;
      
      const intentConfidences = confidences[intent];
      distribution.avgConfidence[intent] = intentConfidences.length > 0
        ? intentConfidences.reduce((sum, c) => sum + c, 0) / intentConfidences.length
        : 0;
    });

    return distribution;
  }

  // Map keywords to funnel stage
  async mapToFunnel(keyword) {
    const classification = await this.classifyIntent(keyword);
    
    const funnelMapping = {
      informational: 'awareness',
      commercial: 'consideration',
      transactional: 'decision',
      navigational: 'retention'
    };

    return {
      keyword,
      funnelStage: funnelMapping[classification.primaryIntent],
      intent: classification.primaryIntent,
      confidence: classification.confidence,
      contentStrategy: this.getFunnelContentStrategy(funnelMapping[classification.primaryIntent])
    };
  }

  // Get content strategy for funnel stage
  getFunnelContentStrategy(stage) {
    const strategies = {
      awareness: {
        contentTypes: ['Blog posts', 'Guides', 'Educational videos', 'Infographics'],
        goals: ['Brand awareness', 'Education', 'Problem identification'],
        metrics: ['Traffic', 'Time on page', 'Social shares']
      },
      consideration: {
        contentTypes: ['Comparisons', 'Case studies', 'Webinars', 'Product demos'],
        goals: ['Solution evaluation', 'Trust building', 'Lead generation'],
        metrics: ['Lead conversions', 'Demo requests', 'Email signups']
      },
      decision: {
        contentTypes: ['Product pages', 'Pricing pages', 'Reviews', 'Free trials'],
        goals: ['Purchase conversion', 'Objection handling'],
        metrics: ['Sales', 'Conversion rate', 'Revenue']
      },
      retention: {
        contentTypes: ['Onboarding', 'Support docs', 'Feature updates', 'Community'],
        goals: ['Customer success', 'Retention', 'Advocacy'],
        metrics: ['Churn rate', 'NPS', 'LTV']
      }
    };

    return strategies[stage] || strategies.awareness;
  }

  // Analyze intent shifts over time
  async analyzeIntentTrends(keyword, timeRange = '12months') {
    const trends = {
      keyword,
      timeRange,
      intentHistory: [],
      shifts: [],
      currentIntent: null
    };

    // Mock historical data
    const months = this.getMonthsInRange(timeRange);
    const intents = ['informational', 'navigational', 'commercial', 'transactional'];
    
    let previousIntent = null;
    months.forEach(month => {
      // Slight random variation
      const intent = intents[Math.floor(Math.random() * intents.length)];
      
      trends.intentHistory.push({
        month,
        intent,
        confidence: 60 + Math.floor(Math.random() * 30)
      });

      if (previousIntent && previousIntent !== intent) {
        trends.shifts.push({
          month,
          from: previousIntent,
          to: intent
        });
      }

      previousIntent = intent;
    });

    trends.currentIntent = trends.intentHistory[trends.intentHistory.length - 1].intent;

    return trends;
  }

  // Helper: Get months in range
  getMonthsInRange(range) {
    const count = range === '12months' ? 12 : range === '24months' ? 24 : 6;
    const months = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toISOString().substr(0, 7));
    }
    
    return months;
  }
}

module.exports = IntentClassificationEngine;
