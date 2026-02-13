/**
 * Sentiment & AI Analysis Engine
 * Handles sentiment analysis, AI-powered insights, topic extraction, and trend detection
 */

// In-memory storage
const sentimentAnalyses = new Map();
const topicExtractions = new Map();
const insights = new Map();
const trendData = new Map();

let analysisIdCounter = 1;
let insightIdCounter = 1;

/**
 * Analyze review sentiment
 */
function analyzeSentiment(reviewData) {
  const { reviewId, content, rating } = reviewData;

  // Simulate sentiment analysis (in production, use ML model or API)
  const sentiment = determineSentiment(content, rating);
  const emotions = detectEmotions(content);
  const topics = extractTopics(content);
  const keyPhrases = extractKeyPhrases(content);

  const analysis = {
    id: `analysis_${analysisIdCounter++}`,
    reviewId,
    sentiment: sentiment.type, // positive, negative, neutral, mixed
    sentimentScore: sentiment.score, // -1 to 1
    confidence: sentiment.confidence, // 0 to 1
    emotions,
    topics,
    keyPhrases,
    language: detectLanguage(content),
    analyzedAt: new Date().toISOString(),
  };

  sentimentAnalyses.set(analysis.id, analysis);
  return analysis;
}

/**
 * Determine sentiment from content and rating
 */
function determineSentiment(content, rating) {
  const lowerContent = content.toLowerCase();

  // Positive indicators
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'perfect', 'best', 'fantastic', 'wonderful'];
  const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;

  // Negative indicators
  const negativeWords = ['terrible', 'awful', 'bad', 'worst', 'hate', 'horrible', 'poor', 'disappointed', 'waste'];
  const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

  // Calculate score
  let score = 0;
  let type = 'neutral';
  let confidence = 0.5;

  if (rating >= 4 && positiveCount > negativeCount) {
    score = 0.5 + (positiveCount * 0.1);
    score = Math.min(score, 1);
    type = 'positive';
    confidence = 0.7 + (positiveCount * 0.05);
  } else if (rating <= 2 && negativeCount > positiveCount) {
    score = -0.5 - (negativeCount * 0.1);
    score = Math.max(score, -1);
    type = 'negative';
    confidence = 0.7 + (negativeCount * 0.05);
  } else if (positiveCount > 0 && negativeCount > 0) {
    type = 'mixed';
    score = (positiveCount - negativeCount) * 0.1;
    confidence = 0.6;
  } else {
    score = (rating - 3) * 0.3;
    confidence = 0.5;
  }

  confidence = Math.min(confidence, 1);

  return { type, score, confidence };
}

/**
 * Detect emotions in content
 */
function detectEmotions(content) {
  const lowerContent = content.toLowerCase();
  const emotions = [];

  const emotionPatterns = {
    joy: ['happy', 'love', 'amazing', 'great', 'excited', 'wonderful'],
    satisfaction: ['satisfied', 'pleased', 'content', 'comfortable'],
    disappointment: ['disappointed', 'let down', 'expected more', 'unfortunately'],
    anger: ['angry', 'frustrated', 'terrible', 'horrible', 'unacceptable'],
    surprise: ['surprised', 'unexpected', 'shocked', 'amazing', 'wow'],
    trust: ['reliable', 'trustworthy', 'dependable', 'consistent'],
  };

  for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
    const matches = patterns.filter(pattern => lowerContent.includes(pattern)).length;
    if (matches > 0) {
      emotions.push({
        emotion,
        confidence: Math.min(0.5 + (matches * 0.2), 1),
      });
    }
  }

  return emotions;
}

/**
 * Extract topics from content
 */
function extractTopics(content) {
  const lowerContent = content.toLowerCase();
  const topics = [];

  const topicPatterns = {
    quality: ['quality', 'material', 'build', 'construction', 'durability'],
    price: ['price', 'cost', 'expensive', 'cheap', 'value', 'worth'],
    shipping: ['shipping', 'delivery', 'arrived', 'package', 'fast'],
    sizing: ['size', 'fit', 'too small', 'too large', 'runs small', 'runs big'],
    design: ['design', 'look', 'style', 'color', 'appearance'],
    customer_service: ['service', 'support', 'help', 'response', 'staff'],
    functionality: ['works', 'function', 'performance', 'features', 'use'],
    packaging: ['packaging', 'box', 'wrapped', 'presentation'],
  };

  for (const [topic, patterns] of Object.entries(topicPatterns)) {
    const matches = patterns.filter(pattern => lowerContent.includes(pattern)).length;
    if (matches > 0) {
      topics.push({
        topic,
        relevance: Math.min(0.5 + (matches * 0.15), 1),
        mentions: matches,
      });
    }
  }

  // Sort by relevance
  topics.sort((a, b) => b.relevance - a.relevance);

  return topics;
}

/**
 * Extract key phrases
 */
function extractKeyPhrases(content) {
  // Simple extraction based on common phrase patterns
  const phrases = [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 10 && trimmed.length < 100) {
      phrases.push(trimmed);
    }
  }

  return phrases.slice(0, 5); // Top 5 phrases
}

/**
 * Detect language
 */
function detectLanguage(content) {
  // Simple language detection (in production, use proper library)
  const englishWords = ['the', 'and', 'is', 'to', 'in', 'a', 'of', 'for'];
  const lowerContent = content.toLowerCase();
  
  const englishMatches = englishWords.filter(word => lowerContent.includes(` ${word} `)).length;
  
  if (englishMatches >= 2) {
    return 'en';
  }
  
  return 'unknown';
}

/**
 * Batch analyze reviews
 */
function batchAnalyzeSentiment(reviews) {
  return reviews.map(review => {
    return analyzeSentiment({
      reviewId: review.id,
      content: review.content,
      rating: review.rating,
    });
  });
}

/**
 * Get sentiment analysis
 */
function getSentimentAnalysis(analysisId) {
  return sentimentAnalyses.get(analysisId);
}

/**
 * Get review sentiment by review ID
 */
function getReviewSentiment(reviewId) {
  return Array.from(sentimentAnalyses.values())
    .find(analysis => analysis.reviewId === reviewId);
}

/**
 * Generate insights from reviews
 */
function generateInsights(productId, reviews) {
  const insight = {
    id: `insight_${insightIdCounter++}`,
    productId,
    totalReviews: reviews.length,
    averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
    sentimentBreakdown: calculateSentimentBreakdown(reviews),
    commonTopics: analyzeCommonTopics(reviews),
    emotionalProfile: analyzeEmotionalProfile(reviews),
    recommendations: generateRecommendations(reviews),
    strengths: identifyStrengths(reviews),
    weaknesses: identifyWeaknesses(reviews),
    generatedAt: new Date().toISOString(),
  };

  insights.set(insight.id, insight);
  return insight;
}

/**
 * Calculate sentiment breakdown
 */
function calculateSentimentBreakdown(reviews) {
  const sentiments = { positive: 0, negative: 0, neutral: 0, mixed: 0 };

  reviews.forEach(review => {
    const sentiment = determineSentiment(review.content, review.rating);
    sentiments[sentiment.type] = (sentiments[sentiment.type] || 0) + 1;
  });

  const total = reviews.length;
  return {
    positive: Math.round((sentiments.positive / total) * 100),
    negative: Math.round((sentiments.negative / total) * 100),
    neutral: Math.round((sentiments.neutral / total) * 100),
    mixed: Math.round((sentiments.mixed / total) * 100),
  };
}

/**
 * Analyze common topics
 */
function analyzeCommonTopics(reviews) {
  const topicCounts = {};

  reviews.forEach(review => {
    const topics = extractTopics(review.content);
    topics.forEach(t => {
      if (!topicCounts[t.topic]) {
        topicCounts[t.topic] = { count: 0, totalRelevance: 0 };
      }
      topicCounts[t.topic].count += 1;
      topicCounts[t.topic].totalRelevance += t.relevance;
    });
  });

  return Object.entries(topicCounts)
    .map(([topic, data]) => ({
      topic,
      mentions: data.count,
      averageRelevance: data.totalRelevance / data.count,
      percentage: Math.round((data.count / reviews.length) * 100),
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);
}

/**
 * Analyze emotional profile
 */
function analyzeEmotionalProfile(reviews) {
  const emotionCounts = {};

  reviews.forEach(review => {
    const emotions = detectEmotions(review.content);
    emotions.forEach(e => {
      if (!emotionCounts[e.emotion]) {
        emotionCounts[e.emotion] = 0;
      }
      emotionCounts[e.emotion] += 1;
    });
  });

  return Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion,
      count,
      percentage: Math.round((count / reviews.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Generate recommendations
 */
function generateRecommendations(reviews) {
  const recommendations = [];
  
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const negativeReviews = reviews.filter(r => r.rating <= 2).length;
  const positiveRate = (positiveReviews / reviews.length) * 100;

  if (positiveRate >= 80) {
    recommendations.push({
      type: 'showcase',
      priority: 'high',
      message: 'Excellent reviews! Feature these prominently on product pages.',
    });
  }

  if (negativeReviews > positiveReviews) {
    recommendations.push({
      type: 'product_improvement',
      priority: 'high',
      message: 'High negative sentiment detected. Review common customer concerns.',
    });
  }

  const topics = analyzeCommonTopics(reviews);
  const qualityMentions = topics.find(t => t.topic === 'quality');
  if (qualityMentions && qualityMentions.percentage > 30) {
    recommendations.push({
      type: 'highlight',
      priority: 'medium',
    message: 'Quality is frequently mentioned. Emphasize in marketing materials.',
    });
  }

  return recommendations;
}

/**
 * Identify strengths
 */
function identifyStrengths(reviews) {
  const positiveReviews = reviews.filter(r => r.rating >= 4);
  const topics = analyzeCommonTopics(positiveReviews);
  
  return topics.slice(0, 5).map(topic => ({
    aspect: topic.topic,
    mentions: topic.mentions,
    sentiment: 'positive',
  }));
}

/**
 * Identify weaknesses
 */
function identifyWeaknesses(reviews) {
  const negativeReviews = reviews.filter(r => r.rating <= 2);
  const topics = analyzeCommonTopics(negativeReviews);
  
  return topics.slice(0, 5).map(topic => ({
    aspect: topic.topic,
    mentions: topic.mentions,
    sentiment: 'negative',
  }));
}

/**
 * Detect trends over time
 */
function detectTrends(productId, reviews, timeframe = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframe);

  const recentReviews = reviews.filter(r => new Date(r.createdAt) >= cutoffDate);
  const olderReviews = reviews.filter(r => new Date(r.createdAt) < cutoffDate);

  if (recentReviews.length === 0 || olderReviews.length === 0) {
    return {
      trend: 'insufficient_data',
      message: 'Not enough data to determine trends',
    };
  }

  const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
  const olderAvg = olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length;
  const change = recentAvg - olderAvg;

  let trend = 'stable';
  let message = 'Reviews remain consistent';

  if (change > 0.5) {
    trend = 'improving';
    message = `Average rating improved by ${change.toFixed(1)} stars in last ${timeframe} days`;
  } else if (change < -0.5) {
    trend = 'declining';
    message = `Average rating declined by ${Math.abs(change).toFixed(1)} stars in last ${timeframe} days`;
  }

  const trendAnalysis = {
    productId,
    timeframe,
    trend,
    message,
    recentAverage: Math.round(recentAvg * 10) / 10,
    previousAverage: Math.round(olderAvg * 10) / 10,
    change: Math.round(change * 10) / 10,
    recentReviews: recentReviews.length,
    previousReviews: olderReviews.length,
    analyzedAt: new Date().toISOString(),
  };

  trendData.set(productId, trendAnalysis);
  return trendAnalysis;
}

/**
 * Get AI-powered review summary
 */
function generateReviewSummary(reviews) {
  if (reviews.length === 0) {
    return {
      summary: 'No reviews available yet.',
      highlights: [],
      concerns: [],
    };
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const topics = analyzeCommonTopics(reviews);
  const sentimentBreakdown = calculateSentimentBreakdown(reviews);

  let summary = '';
  if (avgRating >= 4) {
    summary = `Customers love this product! ${sentimentBreakdown.positive}% of reviews are positive.`;
  } else if (avgRating >= 3) {
    summary = `Mixed feedback on this product with ${sentimentBreakdown.positive}% positive reviews.`;
  } else {
    summary = `Product needs improvement with only ${sentimentBreakdown.positive}% positive reviews.`;
  }

  const highlights = topics
    .filter(t => ['quality', 'value', 'design'].includes(t.topic))
    .map(t => `${t.topic}: mentioned in ${t.percentage}% of reviews`)
    .slice(0, 3);

  const concerns = topics
    .filter(t => ['shipping', 'sizing', 'price'].includes(t.topic))
    .map(t => `${t.topic}: ${t.percentage}% of customers mentioned this`)
    .slice(0, 3);

  return {
    summary,
    highlights,
    concerns,
    totalReviews: reviews.length,
    averageRating: Math.round(avgRating * 10) / 10,
  };
}

/**
 * Get sentiment statistics
 */
function getSentimentStatistics() {
  const analyses = Array.from(sentimentAnalyses.values());
  
  const sentimentCounts = {
    positive: analyses.filter(a => a.sentiment === 'positive').length,
    negative: analyses.filter(a => a.sentiment === 'negative').length,
    neutral: analyses.filter(a => a.sentiment === 'neutral').length,
    mixed: analyses.filter(a => a.sentiment === 'mixed').length,
  };

  const avgConfidence = analyses.length > 0
    ? analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
    : 0;

  return {
    totalAnalyses: analyses.length,
    sentimentCounts,
    averageConfidence: Math.round(avgConfidence * 100) / 100,
    insights: insights.size,
  };
}

module.exports = {
  analyzeSentiment,
  batchAnalyzeSentiment,
  getSentimentAnalysis,
  getReviewSentiment,
  generateInsights,
  detectTrends,
  generateReviewSummary,
  getSentimentStatistics,
};
