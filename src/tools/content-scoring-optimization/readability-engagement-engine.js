/**
 * Readability & Engagement Engine
 * Comprehensive readability scoring and engagement predictions
 */

// In-memory storage
const readabilityScores = new Map();
let scoreIdCounter = 1;

/**
 * Analyze content readability
 */
function analyzeReadability(data) {
  const {
    contentId,
    title,
    body,
    targetAudience = 'general', // general, technical, academic, children
    language = 'en'
  } = data;

  const words = countWords(body);
  const sentences = countSentences(body);
  const syllables = countSyllables(body);
  const complexWords = countComplexWords(body);
  const paragraphs = countParagraphs(body);

  const readabilityScore = {
    id: scoreIdCounter++,
    contentId,
    analyzedAt: new Date().toISOString(),
    targetAudience,
    language,
    
    // Basic metrics
    metrics: {
      words,
      sentences,
      syllables,
      paragraphs,
      complexWords,
      averageWordLength: calculateAverageWordLength(body),
      averageSentenceLength: words / Math.max(sentences, 1),
      averageParagraphLength: words / Math.max(paragraphs, 1),
      averageSyllablesPerWord: syllables / Math.max(words, 1)
    },
    
    // Readability scores
    scores: {
      fleschReadingEase: calculateFleschReadingEase(words, sentences, syllables),
      fleschKincaidGrade: calculateFleschKincaidGrade(words, sentences, syllables),
      gunningFog: calculateGunningFog(words, sentences, complexWords),
      smog: calculateSMOG(sentences, complexWords),
      colemanLiau: calculateColemanLiau(body),
      automatedReadabilityIndex: calculateARI(words, sentences, body)
    },
    
    // Sentence analysis
    sentences: {
      total: sentences,
      short: 0, // <15 words
      medium: 0, // 15-25 words
      long: 0, // >25 words
      distribution: {},
      complexity: 'medium'
    },
    
    // Paragraph analysis
    paragraphs: {
      total: paragraphs,
      averageLength: words / Math.max(paragraphs, 1),
      tooLong: 0, // >150 words
      ideal: 0, // 50-150 words
      tooShort: 0 // <50 words
    },
    
    // Engagement predictions
    engagement: {
      readingTime: Math.ceil(words / 200), // Average reading speed: 200 wpm
      scanability: 0,
      emotionalImpact: 0,
      callToAction: detectCallToAction(body),
      multimedaPresence: detectMultimedia(body),
      predictedEngagementScore: 0
    },
    
    // Overall grade
    gradeLevel: 0,
    readingLevel: '',
    overallScore: 0,
    recommendations: []
  };

  // Analyze sentence structure
  readabilityScore.sentences = analyzeSentenceStructure(body);
  
  // Analyze paragraphs
  readabilityScore.paragraphs = analyzeParagraphStructure(body);
  
  // Calculate engagement metrics
  readabilityScore.engagement.scanability = calculateScanability(body);
  readabilityScore.engagement.emotionalImpact = calculateEmotionalImpact(body);
  readabilityScore.engagement.predictedEngagementScore = predictEngagement(readabilityScore);
  
  // Calculate overall grade level
  readabilityScore.gradeLevel = calculateAverageGradeLevel(readabilityScore.scores);
  readabilityScore.readingLevel = getReadingLevel(readabilityScore.gradeLevel);
  
  // Calculate overall score
  readabilityScore.overallScore = calculateOverallReadabilityScore(readabilityScore, targetAudience);
  
  // Generate recommendations
  readabilityScore.recommendations = generateReadabilityRecommendations(readabilityScore, targetAudience);

  readabilityScores.set(readabilityScore.id, readabilityScore);
  return readabilityScore;
}

/**
 * Get readability score by ID
 */
function getReadabilityScore(scoreId) {
  const score = readabilityScores.get(scoreId);
  if (!score) {
    throw new Error('Readability score not found');
  }
  return score;
}

/**
 * Compare readability of multiple contents
 */
function compareReadability(scoreIds) {
  const scores = scoreIds.map(id => {
    const score = readabilityScores.get(id);
    if (!score) throw new Error(`Readability score ${id} not found`);
    return score;
  });

  return {
    count: scores.length,
    comparison: scores.map(s => ({
      id: s.id,
      contentId: s.contentId,
      gradeLevel: s.gradeLevel,
      readingLevel: s.readingLevel,
      overallScore: s.overallScore,
      fleschReadingEase: s.scores.fleschReadingEase,
      engagementScore: s.engagement.predictedEngagementScore
    })),
    averages: {
      gradeLevel: scores.reduce((sum, s) => sum + s.gradeLevel, 0) / scores.length,
      overallScore: scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length,
      engagementScore: scores.reduce((sum, s) => sum + s.engagement.predictedEngagementScore, 0) / scores.length
    },
    best: scores.reduce((best, s) => s.overallScore > best.overallScore ? s : best, scores[0]),
    insights: generateComparisonInsights(scores)
  };
}

/**
 * Suggest readability improvements
 */
function suggestImprovements(scoreId) {
  const score = readabilityScores.get(scoreId);
  if (!score) {
    throw new Error('Readability score not found');
  }

  const improvements = [];

  // Sentence length improvements
  if (score.sentences.long > score.sentences.total * 0.3) {
    improvements.push({
      category: 'Sentence Length',
      priority: 'high',
      issue: 'Too many long sentences',
      suggestion: `Break down ${score.sentences.long} long sentences into shorter ones`,
      impact: 'Improves readability by 10-15%'
    });
  }

  // Paragraph improvements
  if (score.paragraphs.tooLong > 0) {
    improvements.push({
      category: 'Paragraph Structure',
      priority: 'high',
      issue: `${score.paragraphs.tooLong} paragraphs are too long`,
      suggestion: 'Break long paragraphs into 2-3 shorter paragraphs',
      impact: 'Increases scanability'
    });
  }

  // Word choice
  if (score.metrics.complexWords > score.metrics.words * 0.2) {
    improvements.push({
      category: 'Word Choice',
      priority: 'medium',
      issue: 'High percentage of complex words',
      suggestion: 'Replace complex words with simpler alternatives where possible',
      impact: 'Makes content more accessible'
    });
  }

  // Grade level
  if (score.gradeLevel > 12 && score.targetAudience === 'general') {
    improvements.push({
      category: 'Reading Level',
      priority: 'high',
      issue: `Content is at grade ${score.gradeLevel.toFixed(1)} level`,
      suggestion: 'Simplify language to reach grade 8-10 level for general audience',
      impact: 'Expands potential readership'
    });
  }

  // Engagement
  if (score.engagement.scanability < 60) {
    improvements.push({
      category: 'Scanability',
      priority: 'medium',
      issue: 'Content is difficult to scan',
      suggestion: 'Add more headings, lists, and visual breaks',
      impact: 'Improves user experience'
    });
  }

  if (!score.engagement.callToAction) {
    improvements.push({
      category: 'Engagement',
      priority: 'low',
      issue: 'No clear call to action',
      suggestion: 'Add a clear call to action at the end',
      impact: 'Increases conversion potential'
    });
  }

  return {
    scoreId,
    totalImprovements: improvements.length,
    highPriority: improvements.filter(i => i.priority === 'high').length,
    improvements
  };
}

/**
 * Analyze tone and voice
 */
function analyzeTone(data) {
  const { body } = data;

  // Sentiment analysis (simplified)
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 'happy'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'hate', 'worst', 'sad', 'angry'];
  const actionWords = ['buy', 'get', 'try', 'shop', 'discover', 'learn', 'explore', 'start'];
  const technicalWords = ['algorithm', 'implementation', 'infrastructure', 'architecture', 'optimization'];

  const words = body.toLowerCase().split(/\s+/);
  
  const positive = words.filter(w => positiveWords.includes(w)).length;
  const negative = words.filter(w => negativeWords.includes(w)).length;
  const action = words.filter(w => actionWords.includes(w)).length;
  const technical = words.filter(w => technicalWords.includes(w)).length;

  const sentiment = positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral';
  const sentimentScore = ((positive - negative) / words.length) * 100;

  return {
    sentiment,
    sentimentScore: Math.max(-100, Math.min(100, sentimentScore)),
    tone: {
      positive: (positive / words.length) * 100,
      negative: (negative / words.length) * 100,
      action: (action / words.length) * 100,
      technical: (technical / words.length) * 100
    },
    voice: determinVoice(body),
    formality: determineFormality(body),
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Get readability statistics
 */
function getReadabilityStatistics() {
  const scores = Array.from(readabilityScores.values());

  return {
    totalAnalyses: scores.length,
    averageGradeLevel: scores.reduce((sum, s) => sum + s.gradeLevel, 0) / scores.length || 0,
    averageReadabilityScore: scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length || 0,
    readingLevelDistribution: {
      elementary: scores.filter(s => s.gradeLevel < 6).length,
      middleSchool: scores.filter(s => s.gradeLevel >= 6 && s.gradeLevel < 9).length,
      highSchool: scores.filter(s => s.gradeLevel >= 9 && s.gradeLevel < 13).length,
      college: scores.filter(s => s.gradeLevel >= 13).length
    },
    averageReadingTime: Math.round(scores.reduce((sum, s) => sum + s.engagement.readingTime, 0) / scores.length || 0),
    averageEngagement: scores.reduce((sum, s) => sum + s.engagement.predictedEngagementScore, 0) / scores.length || 0
  };
}

// Helper functions

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function countSentences(text) {
  if (!text) return 0;
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

function countSyllables(text) {
  if (!text) return 0;
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  
  return words.reduce((total, word) => {
    if (word.length <= 3) return total + 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    
    return total + (syllables ? syllables.length : 1);
  }, 0);
}

function countComplexWords(text) {
  if (!text) return 0;
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  
  return words.filter(word => {
    if (word.length <= 3) return false;
    
    let syllableCount = 0;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    syllableCount = syllables ? syllables.length : 1;
    
    return syllableCount >= 3;
  }).length;
}

function countParagraphs(text) {
  if (!text) return 0;
  return text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
}

function calculateAverageWordLength(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;
  return words.reduce((sum, word) => sum + word.length, 0) / words.length;
}

function calculateFleschReadingEase(words, sentences, syllables) {
  if (words === 0 || sentences === 0) return 0;
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, score));
}

function calculateFleschKincaidGrade(words, sentences, syllables) {
  if (words === 0 || sentences === 0) return 0;
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}

function calculateGunningFog(words, sentences, complexWords) {
  if (sentences === 0) return 0;
  return 0.4 * ((words / sentences) + 100 * (complexWords / words));
}

function calculateSMOG(sentences, complexWords) {
  if (sentences < 30) return 0;
  return 1.0430 * Math.sqrt(complexWords * (30 / sentences)) + 3.1291;
}

function calculateColemanLiau(text) {
  const characters = text.replace(/\s/g, '').length;
  const words = countWords(text);
  const sentences = countSentences(text);
  
  if (words === 0) return 0;
  
  const L = (characters / words) * 100;
  const S = (sentences / words) * 100;
  
  return 0.0588 * L - 0.296 * S - 15.8;
}

function calculateARI(words, sentences, text) {
  const characters = text.replace(/\s/g, '').length;
  
  if (words === 0 || sentences === 0) return 0;
  
  return 4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43;
}

function analyzeSentenceStructure(body) {
  const sentenceArray = body.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let short = 0, medium = 0, long = 0;
  
  sentenceArray.forEach(sentence => {
    const words = countWords(sentence);
    if (words < 15) short++;
    else if (words <= 25) medium++;
    else long++;
  });

  return {
    total: sentenceArray.length,
    short,
    medium,
    long,
    distribution: {
      short: (short / sentenceArray.length) * 100 || 0,
      medium: (medium / sentenceArray.length) * 100 || 0,
      long: (long / sentenceArray.length) * 100 || 0
    },
    complexity: long > medium ? 'complex' : medium > short ? 'medium' : 'simple'
  };
}

function analyzeParagraphStructure(body) {
  const paragraphArray = body.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  let tooShort = 0, ideal = 0, tooLong = 0;
  
  paragraphArray.forEach(paragraph => {
    const words = countWords(paragraph);
    if (words < 50) tooShort++;
    else if (words <= 150) ideal++;
    else tooLong++;
  });

  return {
    total: paragraphArray.length,
    averageLength: countWords(body) / paragraphArray.length,
    tooShort,
    ideal,
    tooLong
  };
}

function calculateScanability(body) {
  let score = 50; // Base score
  
  // Headers
  const headers = (body.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || []).length;
  score += Math.min(headers * 5, 20);
  
  // Lists
  const lists = (body.match(/<[uo]l[^>]*>.*?<\/[uo]l>/gi) || []).length;
  score += Math.min(lists * 5, 15);
  
  // Short paragraphs
  const paragraphs = body.split(/\n\n+/).filter(p => p.trim().length > 0);
  const shortParagraphs = paragraphs.filter(p => countWords(p) < 100).length;
  score += (shortParagraphs / paragraphs.length) * 15;
  
  return Math.min(100, score);
}

function calculateEmotionalImpact(body) {
  const emotionalWords = [
    'amazing', 'incredible', 'fantastic', 'revolutionary', 'breakthrough',
    'stunning', 'powerful', 'essential', 'critical', 'important',
    'discover', 'transform', 'unlock', 'reveal', 'secret'
  ];
  
  const words = body.toLowerCase().split(/\s+/);
  const emotionalCount = words.filter(w => emotionalWords.includes(w)).length;
  
  return Math.min(100, (emotionalCount / words.length) * 1000);
}

function detectCallToAction(body) {
  const ctaPhrases = ['click here', 'learn more', 'get started', 'try now', 'buy now', 'sign up', 'subscribe', 'download'];
  return ctaPhrases.some(phrase => body.toLowerCase().includes(phrase));
}

function detectMultimedia(body) {
  const hasImages = body.includes('<img');
  const hasVideos = body.includes('<video') || body.includes('youtube') || body.includes('vimeo');
  const hasEmbeds = body.includes('<iframe');
  
  return {
    present: hasImages || hasVideos || hasEmbeds,
    types: {
      images: hasImages,
      videos: hasVideos,
      embeds: hasEmbeds
    }
  };
}

function predictEngagement(readabilityScore) {
  let score = 50; // Base score
  
  // Readability boost (0-20 points)
  if (readabilityScore.scores.fleschReadingEase >= 60) score += 20;
  else if (readabilityScore.scores.fleschReadingEase >= 50) score += 10;
  
  // Scanability (0-15 points)
  score += (readabilityScore.engagement.scanability / 100) * 15;
  
  // Emotional impact (0-10 points)
  score += (readabilityScore.engagement.emotionalImpact / 100) * 10;
  
  // Call to action (0-5 points)
  if (readabilityScore.engagement.callToAction) score += 5;
  
  // Multimedia (0-10 points)
  if (readabilityScore.engagement.multimedaPresence.present) score += 10;
  
  return Math.min(100, score);
}

function calculateAverageGradeLevel(scores) {
  const levels = [
    scores.fleschKincaidGrade,
    scores.gunningFog,
    scores.colemanLiau,
    scores.automatedReadabilityIndex
  ].filter(score => score > 0);
  
  return levels.reduce((sum, level) => sum + level, 0) / levels.length || 0;
}

function getReadingLevel(gradeLevel) {
  if (gradeLevel < 6) return 'Elementary';
  if (gradeLevel < 9) return 'Middle School';
  if (gradeLevel < 13) return 'High School';
  return 'College';
}

function calculateOverallReadabilityScore(readabilityScore, targetAudience) {
  let score = 0;
  
  // Flesch Reading Ease (0-30 points)
  score += (readabilityScore.scores.fleschReadingEase / 100) * 30;
  
  // Grade level appropriateness (0-25 points)
  const targetGrade = { general: 10, technical: 14, academic: 16, children: 6 }[targetAudience];
  const gradeDiff = Math.abs(readabilityScore.gradeLevel - targetGrade);
  score += Math.max(0, 25 - gradeDiff * 2);
  
  // Sentence structure (0-20 points)
  if (readabilityScore.sentences.complexity === 'simple') score += 20;
  else if (readabilityScore.sentences.complexity === 'medium') score += 15;
  else score += 10;
  
  // Paragraph structure (0-15 points)
  const idealRatio = readabilityScore.paragraphs.ideal / readabilityScore.paragraphs.total;
  score += idealRatio * 15;
  
  // Engagement prediction (0-10 points)
 score += (readabilityScore.engagement.predictedEngagementScore / 100) * 10;
  
  return Math.round(Math.min(100, score));
}

function generateReadabilityRecommendations(readabilityScore, targetAudience) {
  const recommendations = [];
  
  if (readabilityScore.scores.fleschReadingEase < 60) {
    recommendations.push({
      priority: 'high',
      category: 'Readability',
      issue: 'Content is difficult to read',
      suggestion: 'Use shorter sentences and simpler words'
    });
  }
  
  if (readabilityScore.sentences.long > readabilityScore.sentences.total * 0.3) {
    recommendations.push({
      priority: 'high',
      category: 'Sentence Length',
      issue: 'Too many long sentences',
      suggestion: `Break down ${readabilityScore.sentences.long} long sentences`
    });
  }
  
  if (readabilityScore.paragraphs.tooLong > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Paragraph Length',
      issue: `${readabilityScore.paragraphs.tooLong} paragraphs are too long`,
      suggestion: 'Keep paragraphs under 150 words'
    });
  }
  
  if (readabilityScore.engagement.scanability < 60) {
    recommendations.push({
      priority: 'medium',
      category: 'Scanability',
      issue: 'Content is hard to scan',
      suggestion: 'Add more headings, lists, and visual breaks'
    });
  }
  
  return recommendations;
}

function generateComparisonInsights(scores) {
  const insights = [];
  
  const avgGrade = scores.reduce((sum, s) => sum + s.gradeLevel, 0) / scores.length;
  insights.push(`Average grade level: ${avgGrade.toFixed(1)}`);
  
  const best = scores.reduce((best, s) => s.overallScore > best.overallScore ? s : best, scores[0]);
  insights.push(`Best performing content ID: ${best.contentId} (Score: ${best.overallScore})`);
  
  return insights;
}

function determinVoice(body) {
  const firstPerson = (body.match(/\b(i|we|my|our)\b/gi) || []).length;
  const secondPerson = (body.match(/\b(you|your)\b/gi) || []).length;
  const thirdPerson = (body.match(/\b(he|she|they|it|their)\b/gi) || []).length;
  
  const total = firstPerson + secondPerson + thirdPerson;
  if (total === 0) return 'neutral';
  
  if (secondPerson > firstPerson && secondPerson > thirdPerson) return 'conversational';
  if (firstPerson > secondPerson && firstPerson > thirdPerson) return 'personal';
  return 'objective';
}

function determineFormality(body) {
  const contractions = (body.match(/\b(don't|won't|can't|it's|you're|we're)\b/gi) || []).length;
  const formalWords = (body.match(/\b(furthermore|moreover|consequently|nevertheless|therefore)\b/gi) || []).length;
  
  if (contractions > formalWords * 2) return 'informal';
  if (formalWords > contractions * 2) return 'formal';
  return 'neutral';
}

module.exports = {
  analyzeReadability,
  getReadabilityScore,
  compareReadability,
  suggestImprovements,
  analyzeTone,
  getReadabilityStatistics
};
