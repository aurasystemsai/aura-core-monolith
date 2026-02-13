/**
 * Brand Mention Tracker V2 - Sentiment Analysis Engine
 * AI-powered sentiment scoring, emotion detection, and tone analysis
 */

const sentimentScores = new Map();
const emotionAnalyses = new Map();
const toneDetections = new Map();
const sentimentTrends = new Map();

/**
 * Analyze sentiment of mention
 */
async function analyzeSentiment(mentionId, content) {
  const analysisId = `sentiment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate sentiment score (-1.0 to 1.0)
  const score = calculateSentimentScore(content);
  
  // Detect context (sarcasm, negation)
  const context = detectContext(content);
  
  // Adjust score based on context
  const adjustedScore = adjustSentimentForContext(score, context);
  
  const analysis = {
    id: analysisId,
    mentionId,
    score: adjustedScore,
    label: getSentimentLabel(adjustedScore),
    confidence: calculateConfidence(content),
    positiveScore: Math.max(0, adjustedScore),
    negativeScore: Math.abs(Math.min(0, adjustedScore)),
    neutralScore: 1 - Math.abs(adjustedScore),
    context: {
      hasSarcasm: context.hasSarcasm,
      hasNegation: context.hasNegation,
      isQuestion: context.isQuestion
    },
    keywords: {
      positive: extractSentimentKeywords(content, 'positive'),
      negative: extractSentimentKeywords(content, 'negative'),
      neutral: extractSentimentKeywords(content, 'neutral')
    },
    analyzedAt: new Date().toISOString()
  };
  
  sentimentScores.set(analysisId, analysis);
  
  // Update trend data
  updateSentimentTrend(adjustedScore);
  
  return analysis;
}

/**
 * Calculate sentiment score
 */
function calculateSentimentScore(content) {
  const positiveWords = [
    'excellent', 'amazing', 'great', 'wonderful', 'fantastic', 'love', 'best',
    'perfect', 'awesome', 'brilliant', 'outstanding', 'superb', 'exceptional',
    'happy', 'pleased', 'satisfied', 'delighted', 'impressed', 'recommend',
    'quality', 'helpful', 'friendly', 'professional', 'fast', 'easy'
  ];
  
  const negativeWords = [
    'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointed', 'bad',
    'poor', 'useless', 'broken', 'failed', 'disappointing', 'frustrating',
    'angry', 'annoyed', 'upset', 'unhappy', 'dissatisfied', 'issues',
    'problem', 'slow', 'difficult', 'confusing', 'expensive', 'waste'
  ];
  
  const intensifiers = ['very', 'extremely', 'really', 'absolutely', 'completely', 'totally'];
  
  const words = content.toLowerCase().split(/\s+/);
  let score = 0;
  let wordCount = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^\w]/g, '');
    const hasIntensifier = i > 0 && intensifiers.includes(words[i - 1]);
    const multiplier = hasIntensifier ? 1.5 : 1.0;
    
    if (positiveWords.includes(word)) {
      score += 0.1 * multiplier;
      wordCount++;
    } else if (negativeWords.includes(word)) {
      score -= 0.1 * multiplier;
      wordCount++;
    }
  }
  
  // Normalize score to -1.0 to 1.0 range
  const normalized = wordCount > 0 ? score / Math.sqrt(wordCount) : 0;
  return Math.max(-1.0, Math.min(1.0, normalized));
}

/**
 * Detect context clues (sarcasm, negation, questions)
 */
function detectContext(content) {
  const sarcasmIndicators = ['yeah right', 'sure', 'totally', 'obviously', '!!!', '...'];
  const negationWords = ['not', 'never', 'no', "don't", "won't", "can't", "isn't", "wasn't"];
  
  return {
    hasSarcasm: sarcasmIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    ),
    hasNegation: negationWords.some(word => 
      content.toLowerCase().split(/\s+/).includes(word)
    ),
    isQuestion: content.includes('?')
  };
}

/**
 * Adjust sentiment based on context
 */
function adjustSentimentForContext(score, context) {
  let adjusted = score;
  
  // Sarcasm often inverts sentiment
  if (context.hasSarcasm && score > 0) {
    adjusted = -Math.abs(score) * 0.8;
  }
  
  // Negation can flip sentiment
  if (context.hasNegation && Math.abs(score) > 0.3) {
    adjusted = -score * 0.7;
  }
  
  // Questions are usually more neutral
  if (context.isQuestion) {
    adjusted = adjusted * 0.5;
  }
  
  return Math.max(-1.0, Math.min(1.0, adjusted));
}

/**
 * Get sentiment label
 */
function getSentimentLabel(score) {
  if (score >= 0.5) return 'very positive';
  if (score >= 0.2) return 'positive';
  if (score >= -0.2) return 'neutral';
  if (score >= -0.5) return 'negative';
  return 'very negative';
}

/**
 * Calculate confidence score
 */
function calculateConfidence(content) {
  const wordCount = content.split(/\s+/).length;
  
  // More words generally means higher confidence
  let confidence = Math.min(0.95, 0.5 + (wordCount / 100));
  
  // Short content less reliable
  if (wordCount < 10) confidence *= 0.7;
  
  return parseFloat(confidence.toFixed(2));
}

/**
 * Extract keywords by sentiment
 */
function extractSentimentKeywords(content, sentiment) {
  const positiveWords = ['excellent', 'amazing', 'great', 'wonderful', 'love', 'best', 'perfect'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'bad', 'poor'];
  const neutralWords = ['okay', 'fine', 'average', 'normal', 'standard'];
  
  const wordList = sentiment === 'positive' ? positiveWords :
                   sentiment === 'negative' ? negativeWords : neutralWords;
  
  const words = content.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
  
  return words.filter(w => wordList.includes(w)).slice(0, 5);
}

/**
 * Detect emotions from content
 */
async function detectEmotions(mentionId, content) {
  const emotionId = `emotion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const emotionKeywords = {
    joy: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'love', 'wonderful', 'amazing'],
    anger: ['angry', 'mad', 'furious', 'outraged', 'frustrated', 'annoyed', 'irritated'],
    fear: ['afraid', 'scared', 'worried', 'concerned', 'anxious', 'nervous'],
    sadness: ['sad', 'disappointed', 'unhappy', 'depressed', 'upset', 'miserable'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected', 'wow']
  };
  
  const words = content.toLowerCase().split(/\s+/);
  const scores = {};
  
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    const matchCount = words.filter(w => keywords.some(kw => w.includes(kw))).length;
    scores[emotion] = Math.min(1.0, matchCount * 0.3);
  }
  
  const dominantEmotion = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0];
  
  const analysis = {
    id: emotionId,
    mentionId,
    scores,
    dominantEmotion: dominantEmotion[1] > 0 ? dominantEmotion[0] : 'neutral',
    dominantScore: dominantEmotion[1],
    analyzedAt: new Date().toISOString()
  };
  
  emotionAnalyses.set(emotionId, analysis);
  return analysis;
}

/**
 * Analyze tone of content
 */
async function analyzeTone(mentionId, content) {
  const toneId = `tone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const tones = {
    formal: calculateFormalityScore(content),
    casual: calculateCasualScore(content),
    promotional: calculatePromotionalScore(content),
    critical: calculateCriticalScore(content),
    informative: calculateInformativeScore(content)
  };
  
  const dominantTone = Object.entries(tones)
    .sort((a, b) => b[1] - a[1])[0];
  
  const analysis = {
    id: toneId,
    mentionId,
    tones,
    dominantTone: dominantTone[0],
    dominantScore: dominantTone[1],
    analyzedAt: new Date().toISOString()
  };
  
  toneDetections.set(toneId, analysis);
  return analysis;
}

/**
 * Calculate formality score
 */
function calculateFormalityScore(content) {
  const formalIndicators = ['therefore', 'furthermore', 'however', 'consequently', 'regarding'];
  const contractionCount = (content.match(/'s|'t|'ll|'ve|'re/g) || []).length;
  
  let score = 0.5;
  
  formalIndicators.forEach(indicator => {
    if (content.toLowerCase().includes(indicator)) score += 0.1;
  });
  
  score -= contractionCount * 0.05;
  
  return Math.max(0, Math.min(1.0, score));
}

/**
 * Calculate casual score
 */
function calculateCasualScore(content) {
  const casualIndicators = ['lol', 'haha', 'omg', 'btw', 'tbh', 'imho', 'gonna', 'wanna'];
  const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  
  let score = 0.3;
  
  casualIndicators.forEach(indicator => {
    if (content.toLowerCase().includes(indicator)) score += 0.15;
  });
  
  score += emojiCount * 0.1;
  
  return Math.max(0, Math.min(1.0, score));
}

/**
 * Calculate promotional score
 */
function calculatePromotionalScore(content) {
  const promotionalWords = ['buy', 'sale', 'discount', 'offer', 'deal', 'free', 'limited', 'exclusive'];
  const hasCallToAction = /click|visit|check|try|get|order/i.test(content);
  
  let score = 0.2;
  
  promotionalWords.forEach(word => {
    if (content.toLowerCase().includes(word)) score += 0.1;
  });
  
  if (hasCallToAction) score += 0.2;
  
  return Math.max(0, Math.min(1.0, score));
}

/**
 * Calculate critical score
 */
function calculateCriticalScore(content) {
  const criticalWords = ['issue', 'problem', 'concern', 'complaint', 'unable', 'failed', 'wrong'];
  
  let score = 0.2;
  
  criticalWords.forEach(word => {
    if (content.toLowerCase().includes(word)) score += 0.12;
  });
  
  return Math.max(0, Math.min(1.0, score));
}

/**
 * Calculate informative score
 */
function calculateInformativeScore(content) {
  const hasNumbers = /\d+/.test(content);
  const hasLinks = /https?:\/\//.test(content);
  const wordCount = content.split(/\s+/).length;
  
  let score = 0.3;
  
  if (hasNumbers) score += 0.2;
  if (hasLinks) score += 0.15;
  if (wordCount > 50) score += 0.2;
  
  return Math.max(0, Math.min(1.0, score));
}

/**
 * Get sentiment by date range
 */
async function getSentimentByDateRange(startDate, endDate, filters = {}) {
  let analyses = Array.from(sentimentScores.values());
  
  if (startDate) {
    analyses = analyses.filter(a => new Date(a.analyzedAt) >= new Date(startDate));
  }
  if (endDate) {
    analyses = analyses.filter(a => new Date(a.analyzedAt) <= new Date(endDate));
  }
  
  // Group by day
  const byDay = {};
  analyses.forEach(a => {
    const day = a.analyzedAt.split('T')[0];
    if (!byDay[day]) {
      byDay[day] = {
        date: day,
        scores: [],
        count: 0
      };
    }
    byDay[day].scores.push(a.score);
    byDay[day].count++;
  });
  
  // Calculate averages
  const trend = Object.values(byDay).map(day => ({
    date: day.date,
    averageScore: day.scores.reduce((sum, s) => sum + s, 0) / day.count,
    count: day.count
  }));
  
  return trend.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Update sentiment trend
 */
function updateSentimentTrend(score) {
  const today = new Date().toISOString().split('T')[0];
  const trend = sentimentTrends.get(today) || {
    date: today,
    scores: [],
    count: 0
  };
  
  trend.scores.push(score);
  trend.count++;
  
  sentimentTrends.set(today, trend);
}

/**
 * Get sentiment statistics
 */
async function getSentimentStatistics() {
  const analyses = Array.from(sentimentScores.values());
  
  if (analyses.length === 0) {
    return {
      totalAnalyses: 0,
      averageScore: 0,
      sentimentDistribution: { veryPositive: 0, positive: 0, neutral: 0, negative: 0, veryNegative: 0 }
    };
  }
  
  const distribution = {
    veryPositive: analyses.filter(a => a.score >= 0.5).length,
    positive: analyses.filter(a => a.score >= 0.2 && a.score < 0.5).length,
    neutral: analyses.filter(a => a.score > -0.2 && a.score < 0.2).length,
    negative: analyses.filter(a => a.score > -0.5 && a.score <= -0.2).length,
    veryNegative: analyses.filter(a => a.score <= -0.5).length
  };
  
  const avgScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
  
  // Emotion distribution
  const emotions = Array.from(emotionAnalyses.values());
  const emotionCounts = {};
  emotions.forEach(e => {
    emotionCounts[e.dominantEmotion] = (emotionCounts[e.dominantEmotion] || 0) + 1;
  });
  
  return {
    totalAnalyses: analyses.length,
    averageScore: parseFloat(avgScore.toFixed(3)),
    sentimentDistribution: distribution,
    emotionDistribution: emotionCounts,
    averageConfidence: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
    trendDirection: calculateTrendDirection()
  };
}

/**
 * Calculate trend direction
 */
function calculateTrendDirection() {
  const trends = Array.from(sentimentTrends.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7); // last 7 days
  
  if (trends.length < 2) return 'stable';
  
  const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
  const secondHalf = trends.slice(Math.floor(trends.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, t) => 
    sum + (t.scores.reduce((s, sc) => s + sc, 0) / t.count), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, t) => 
    sum + (t.scores.reduce((s, sc) => s + sc, 0) / t.count), 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  
  if (change > 0.1) return 'improving';
  if (change < -0.1) return 'declining';
  return 'stable';
}

module.exports = {
  analyzeSentiment,
  detectEmotions,
  analyzeTone,
  getSentimentByDateRange,
  getSentimentStatistics
};
