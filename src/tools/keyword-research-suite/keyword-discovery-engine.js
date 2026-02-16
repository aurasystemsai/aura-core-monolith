/**
 * Keyword Discovery Engine
 * Discovers keywords, analyzes search volume, difficulty, trends, and provides related keyword suggestions
 */

class KeywordDiscoveryEngine {
  constructor() {
    this.keywords = new Map(); // Map<keywordId, keyword>
    this.searches = new Map(); // Map<searchId, searchResult>
    this.suggestions = new Map(); // Map<suggestionId, suggestion>
  }

  /**
   * Discover keywords based on seed keyword
   */
  async discoverKeywords(params) {
    const {
      seedKeyword,
      country = 'US',
      language = 'en',
      includeRelated = true,
      includeQuestions = true,
      includeLongTail = true,
      maxResults = 100
    } = params;

    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate keyword discovery (production would use SEMrush, Ahrefs, Google Keyword Planner APIs)
    const discovered = {
      seedKeyword,
      mainKeywords: this._generateMainKeywords(seedKeyword, Math.min(20, maxResults)),
      relatedKeywords: includeRelated ? this._generateRelatedKeywords(seedKeyword, 30) : [],
      questionKeywords: includeQuestions ? this._generateQuestionKeywords(seedKeyword, 20) : [],
      longTailKeywords: includeLongTail ? this._generateLongTailKeywords(seedKeyword, 30) : [],
      timestamp: new Date().toISOString()
    };

    const searchResult = {
      id: searchId,
      seedKeyword,
      country,
      language,
      totalKeywords: discovered.mainKeywords.length + discovered.relatedKeywords.length + 
                     discovered.questionKeywords.length + discovered.longTailKeywords.length,
      keywords: [
        ...discovered.mainKeywords,
        ...discovered.relatedKeywords,
        ...discovered.questionKeywords,
        ...discovered.longTailKeywords
      ],
      metadata: {
        country,
        language,
        discoveredAt: discovered.timestamp,
        filters: { includeRelated, includeQuestions, includeLongTail, maxResults }
      }
    };

    this.searches.set(searchId, searchResult);

    // Store individual keywords
    searchResult.keywords.forEach(kw => {
      this.keywords.set(kw.id, kw);
    });

    return searchResult;
  }

  /**
   * Get search volume for keyword
   */
  async getSearchVolume(keyword, timeRange = '12months') {
    const volumeData = {
      keyword,
      timeRange,
      monthlySearches: this._generateMonthlyVolume(),
      averageMonthly: 0,
      trend: 'stable',
      seasonality: this._detectSeasonality(),
      timestamp: new Date().toISOString()
    };

    volumeData.averageMonthly = Math.round(
      volumeData.monthlySearches.reduce((sum, m) => sum + m.volume, 0) / 
      volumeData.monthlySearches.length
    );

    // Detect trend
    const recentAvg = volumeData.monthlySearches.slice(-3).reduce((sum, m) => sum + m.volume, 0) / 3;
    const olderAvg = volumeData.monthlySearches.slice(0, 3).reduce((sum, m) => sum + m.volume, 0) / 3;
    if (recentAvg > olderAvg * 1.2) volumeData.trend = 'growing';
    else if (recentAvg < olderAvg * 0.8) volumeData.trend = 'declining';

    return volumeData;
  }

  /**
   * Calculate keyword difficulty (0-100)
   */
  async getKeywordDifficulty(keyword) {
    // Simulate difficulty analysis (production would analyze SERP, backlinks, domain authority)
    const difficulty = {
      keyword,
      score: Math.floor(Math.random() * 100),
      level: '',
      factors: {
        serpCompetition: Math.floor(Math.random() * 100),
        backlinksRequired: Math.floor(Math.random() * 500) + 10,
        domainAuthorityNeeded: Math.floor(Math.random() * 50) + 30,
        contentQuality: Math.floor(Math.random() * 100)
      },
      timeToRank: '',
      recommendation: '',
      timestamp: new Date().toISOString()
    };

    // Categorize difficulty level
    if (difficulty.score < 30) {
      difficulty.level = 'easy';
      difficulty.timeToRank = '1-3 months';
      difficulty.recommendation = 'Good opportunity for quick wins';
    } else if (difficulty.score < 50) {
      difficulty.level = 'medium';
      difficulty.timeToRank = '3-6 months';
      difficulty.recommendation = 'Achievable with quality content and backlinks';
    } else if (difficulty.score < 70) {
      difficulty.level = 'hard';
      difficulty.timeToRank = '6-12 months';
      difficulty.recommendation = 'Requires significant effort and authority';
    } else {
      difficulty.level = 'very-hard';
      difficulty.timeToRank = '12+ months';
      difficulty.recommendation = 'Focus on easier targets first';
    }

    return difficulty;
  }

  /**
   * Get keyword trends over time
   */
  async getTrends(keyword, period = '5years') {
    const trends = {
      keyword,
      period,
      dataPoints: this._generateTrendData(period),
      peakMonth: null,
      lowestMonth: null,
      volatility: 0,
      forecast: [],
      timestamp: new Date().toISOString()
    };

    // Find peak and lowest
    let maxVolume = 0, minVolume = Infinity;
    trends.dataPoints.forEach(point => {
      if (point.volume > maxVolume) {
        maxVolume = point.volume;
        trends.peakMonth = point.month;
      }
      if (point.volume < minVolume) {
        minVolume = point.volume;
        trends.lowestMonth = point.month;
      }
    });

    // Calculate volatility
    const volumes = trends.dataPoints.map(p => p.volume);
    const avg = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const variance = volumes.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / volumes.length;
    trends.volatility = Math.sqrt(variance) / avg;

    // Generate 6-month forecast
    const lastVolume = volumes[volumes.length - 1];
    const trendSlope = (volumes[volumes.length - 1] - volumes[0]) / volumes.length;
    for (let i = 1; i <= 6; i++) {
      trends.forecast.push({
        month: this._getMonthName(new Date().getMonth() + i),
        predictedVolume: Math.round(lastVolume + (trendSlope * i)),
        confidence: Math.max(50, 95 - (i * 10)) // Confidence decreases over time
      });
    }

    return trends;
  }

  /**
   * Get related keywords
   */
  async getRelatedKeywords(keyword, limit = 50) {
    const related = {
      keyword,
      suggestions: [],
      totalFound: 0,
      timestamp: new Date().toISOString()
    };

    // Generate related keywords
    related.suggestions = this._generateRelatedKeywords(keyword, limit);
    related.totalFound = related.suggestions.length;

    return related;
  }

  /**
   * Get question-based keywords
   */
  async getQuestionKeywords(keyword, limit = 30) {
    const questions = {
      keyword,
      questions: this._generateQuestionKeywords(keyword, limit),
      totalFound: 0,
      byType: {
        what: [],
        how: [],
        why: [],
        where: [],
        when: [],
        who: []
      },
      timestamp: new Date().toISOString()
    };

    // Categorize by question type
    questions.questions.forEach(q => {
      const firstWord = q.keyword.split(' ')[0].toLowerCase();
      if (questions.byType[firstWord]) {
        questions.byType[firstWord].push(q);
      }
    });

    questions.totalFound = questions.questions.length;

    return questions;
  }

  /**
   * Get long-tail keyword variations
   */
  async getLongTailKeywords(keyword, minWords = 4, limit = 40) {
    const longTail = {
      keyword,
      minWords,
      keywords: [],
      totalFound: 0,
      averageWordCount: 0,
      timestamp: new Date().toISOString()
    };

    longTail.keywords = this._generateLongTailKeywords(keyword, limit, minWords);
    longTail.totalFound = longTail.keywords.length;
    
    if (longTail.keywords.length > 0) {
      longTail.averageWordCount = Math.round(
        longTail.keywords.reduce((sum, k) => sum + k.keyword.split(' ').length, 0) / 
        longTail.keywords.length
      );
    }

    return longTail;
  }

  /**
   * Suggest keywords by topic
   */
  async suggestByTopic(topic, params = {}) {
    const {
      maxResults = 100,
      minVolume = 100,
      maxDifficulty = 70,
      includeRelated = true
    } = params;

    const suggestions = {
      topic,
      keywords: [],
      totalFound: 0,
      filters: { minVolume, maxDifficulty },
      timestamp: new Date().toISOString()
    };

    // Generate topic-based suggestions
    const discovered = await this.discoverKeywords({ 
      seedKeyword: topic, 
      maxResults, 
      includeRelated 
    });

    // Filter by volume and difficulty
    suggestions.keywords = discovered.keywords.filter(kw => 
      kw.volume >= minVolume && kw.difficulty <= maxDifficulty
    );

    suggestions.totalFound = suggestions.keywords.length;

    return suggestions;
  }

  /**
   * Bulk keyword analysis
   */
  async bulkAnalyze(keywords, includeVolume = true, includeDifficulty = true, includeTrends = false) {
    const results = {
      keywords: [],
      totalAnalyzed: keywords.length,
      timestamp: new Date().toISOString()
    };

    for (const keyword of keywords) {
      const analysis = {
        keyword,
        volume: null,
        difficulty: null,
        trends: null
      };

      if (includeVolume) {
        analysis.volume = await this.getSearchVolume(keyword);
      }
      if (includeDifficulty) {
        analysis.difficulty = await this.getKeywordDifficulty(keyword);
      }
      if (includeTrends) {
        analysis.trends = await this.getTrends(keyword, '1year');
      }

      results.keywords.push(analysis);
    }

    return results;
  }

  // === Helper Methods ===

  _generateMainKeywords(seed, count) {
    const keywords = [];
    const baseVolume = Math.floor(Math.random() * 50000) + 1000;
    
    for (let i = 0; i < count; i++) {
      const variation = this._generateVariation(seed, i);
      keywords.push({
        id: `kw_${Date.now()}_${i}`,
        keyword: variation,
        volume: Math.max(100, baseVolume - (i * Math.floor(baseVolume / count))),
        difficulty: Math.floor(Math.random() * 100),
        cpc: (Math.random() * 10 + 0.5).toFixed(2),
        competition: Math.random().toFixed(2),
        type: 'main',
        wordCount: variation.split(' ').length
      });
    }
    
    return keywords;
  }

  _generateRelatedKeywords(seed, count) {
    const related = [];
    const modifiers = ['best', 'top', 'free', 'online', 'cheap', 'professional', 'easy', 'simple', 'guide', 'tool'];
    
    for (let i = 0; i < count; i++) {
      const modifier = modifiers[i % modifiers.length];
      const variation = `${modifier} ${seed}`;
      related.push({
        id: `kw_rel_${Date.now()}_${i}`,
        keyword: variation,
        volume: Math.floor(Math.random() * 10000) + 500,
        difficulty: Math.floor(Math.random() * 80),
        cpc: (Math.random() * 8 + 0.3).toFixed(2),
        competition: Math.random().toFixed(2),
        type: 'related',
        wordCount: variation.split(' ').length
      });
    }
    
    return related;
  }

  _generateQuestionKeywords(seed, count) {
    const questions = [];
    const questionWords = ['what is', 'how to', 'why', 'where to', 'when to', 'who', 'which'];
    
    for (let i = 0; i < count; i++) {
      const qWord = questionWords[i % questionWords.length];
      const variation = `${qWord} ${seed}`;
      questions.push({
        id: `kw_q_${Date.now()}_${i}`,
        keyword: variation,
        volume: Math.floor(Math.random() * 5000) + 200,
        difficulty: Math.floor(Math.random() * 60),
        cpc: (Math.random() * 5 + 0.2).toFixed(2),
        competition: Math.random().toFixed(2),
        type: 'question',
        wordCount: variation.split(' ').length
      });
    }
    
    return questions;
  }

  _generateLongTailKeywords(seed, count, minWords = 4) {
    const longTail = [];
    const modifiers = ['best way to', 'how do i', 'step by step guide to', 'complete tutorial on'];
    const suffixes = ['for beginners', 'in 2024', 'online free', 'at home', 'professionally'];
    
    for (let i = 0; i < count; i++) {
      const modifier = modifiers[i % modifiers.length];
      const suffix = suffixes[i % suffixes.length];
      const variation = `${modifier} ${seed} ${suffix}`;
      
      if (variation.split(' ').length >= minWords) {
        longTail.push({
          id: `kw_lt_${Date.now()}_${i}`,
          keyword: variation,
          volume: Math.floor(Math.random() * 2000) + 100,
          difficulty: Math.floor(Math.random() * 40),
          cpc: (Math.random() * 3 + 0.1).toFixed(2),
          competition: (Math.random() * 0.5).toFixed(2),
          type: 'long-tail',
          wordCount: variation.split(' ').length
        });
      }
    }
    
    return longTail;
  }

  _generateVariation(seed, index) {
    const variations = [
      seed,
      `${seed} tool`,
      `${seed} software`,
      `${seed} platform`,
      `${seed} service`,
      `${seed} solution`,
      `${seed} app`,
      `${seed} system`,
      `${seed} program`,
      `${seed} online`
    ];
    return variations[index % variations.length];
  }

  _generateMonthlyVolume() {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      
      months.push({
        month: this._getMonthName(date.getMonth()),
        year: date.getFullYear(),
        volume: Math.floor(Math.random() * 10000) + 1000
      });
    }
    
    return months;
  }

  _generateTrendData(period) {
    const dataPoints = [];
    const months = period === '5years' ? 60 : 12;
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i));
      
      dataPoints.push({
        month: `${this._getMonthName(date.getMonth())} ${date.getFullYear()}`,
        volume: Math.floor(Math.random() * 15000) + 500,
        index: 50 + Math.floor(Math.random() * 50) // Trend index 0-100
      });
    }
    
    return dataPoints;
  }

  _detectSeasonality() {
    // Simplified seasonality detection
    const hasSeasonality = Math.random() > 0.6;
    if (!hasSeasonality) return null;
    
    return {
      detected: true,
      peakMonths: ['December', 'November'],
      lowMonths: ['February', 'March'],
      pattern: 'holiday-driven'
    };
  }

  _getMonthName(monthIndex) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex % 12];
  }
}

module.exports = KeywordDiscoveryEngine;
