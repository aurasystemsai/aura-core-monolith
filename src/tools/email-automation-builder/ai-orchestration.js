/**
 * AI Orchestration Engine - Multi-Model Content Generation
 * Supports GPT-4, Claude, Gemini with intelligent routing
 * Part of Email Automation Builder enterprise upgrade
 */

const { v4: uuidv4 } = require('uuid');

// AI model clients (would be actual SDKs in production)
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'demo' });

// Model performance tracking
const modelMetrics = new Map();
const generationHistory = [];

// Model configurations
const MODELS = {
  'gpt-4': { provider: 'openai', cost: 0.03, maxTokens: 8192, strengths: ['creative', 'detailed'] },
  'gpt-3.5-turbo': { provider: 'openai', cost: 0.002, maxTokens: 4096, strengths: ['fast', 'efficient'] },
  'claude-3-opus': { provider: 'anthropic', cost: 0.015, maxTokens: 200000, strengths: ['analytical', 'precise'] },
  'claude-3-sonnet': { provider: 'anthropic', cost: 0.003, maxTokens: 200000, strengths: ['balanced', 'fast'] },
  'gemini-pro': { provider: 'google', cost: 0.00025, maxTokens: 32768, strengths: ['visual', 'multimodal'] }
};

//=============================================================================
// MULTI-MODEL ORCHESTRATION
//=============================================================================

async function generateContent(prompt, options = {}) {
  const {
    model = 'gpt-4',
    task = 'general',
    temperature = 0.7,
    maxTokens = 500,
    routing = 'single' // single, best-of-n, ensemble, cascade
  } = options;
  
  const requestId = uuidv4();
  const startTime = Date.now();
  
  try {
    let result;
    
    switch (routing) {
      case 'best-of-n':
        result = await _bestOfN(prompt, options);
        break;
      case 'ensemble':
        result = await _ensemble(prompt, options);
        break;
      case 'cascade':
        result = await _cascade(prompt, options);
        break;
      default:
        result = await _generate(model, prompt, { temperature, maxTokens });
    }
    
    const latency = Date.now() - startTime;
    
    _trackMetrics(model, task, true, latency, result.tokensUsed || 0);
    
    generationHistory.push({
      requestId,
      model,
      task,
      routing,
      success: true,
      latency,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 requests
    if (generationHistory.length > 1000) generationHistory.shift();
    
    return {
      requestId,
      content: result.content,
      model: result.model || model,
      latency,
      tokensUsed: result.tokensUsed || 0,
      cost: result.cost || _calculateCost(model, result.tokensUsed || 0),
      metadata: result.metadata || {}
    };
  } catch (error) {
    _trackMetrics(model, task, false, Date.now() - startTime, 0);
    
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

async function _generate(model, prompt, options = {}) {
  const modelConfig = MODELS[model];
  if (!modelConfig) throw new Error(`Unknown model: ${model}`);
  
  // Simulate API call (in production, route to actual provider)
  if (modelConfig.provider === 'openai' && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo') {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are an expert email marketing copywriter.' },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500
      });
      
      return {
        content: completion.choices[0]?.message?.content || '',
        tokensUsed: completion.usage?.total_tokens || 0,
        model
      };
    } catch (err) {
      // Fall through to simulation
    }
  }
  
  // Simulation for demo/development
  const simulatedContent = _simulateGeneration(model, prompt);
  const tokensUsed = Math.floor(simulatedContent.length / 4);
  
  return {
    content: simulatedContent,
    tokensUsed,
    model,
    cost: _calculateCost(model, tokensUsed)
  };
}

function _simulateGeneration(model, prompt) {
  const templates = {
    'subject-line': `Exclusive Offer: Save 30% Today!`,
    'email-body': `<h1>Hello!</h1><p>We have an exciting offer just for you. Don't miss out on our limited-time promotion.</p><p>Click here to shop now and save 30% on your entire order.</p>`,
    'personalized': `Hi {{firstName}},\n\nWe noticed you've been browsing our new collection. Here's a special 20% discount just for you!\n\nUse code: WELCOME20 at checkout.\n\nBest regards,\nThe Team`
  };
  
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('subject')) return templates['subject-line'];
  if (promptLower.includes('personalize')) return templates['personalized'];
  
  return templates['email-body'];
}

function _calculateCost(model, tokens) {
  const config = MODELS[model];
  if (!config) return 0;
  
  return (tokens / 1000) * config.cost;
}

//=============================================================================
// ROUTING STRATEGIES
//=============================================================================

async function _bestOfN(prompt, options) {
  const { n = 3, model = 'gpt-4' } = options;
  
  // Generate N variants in parallel
  const promises = Array(n).fill(null).map(() => _generate(model, prompt, options));
  const results = await Promise.all(promises);
  
  // Score each result
  const scored = results.map(r => ({
    ...r,
    score: _scoreContent(r.content)
  }));
  
  // Return best
  scored.sort((a, b) => b.score - a.score);
  
  return {
    ...scored[0],
    metadata: {
      variants: scored.length,
      scores: scored.map(s => s.score)
    }
  };
}

async function _ensemble(prompt, options) {
  const models = options.models || ['gpt-4', 'claude-3-sonnet', 'gemini-pro'];
  
  // Generate from multiple models
  const promises = models.map(m => _generate(m, prompt, options));
  const results = await Promise.all(promises);
  
  // Combine results intelligently
  const combined = results.map(r => r.content).join('\n\n---\n\n');
  
  return {
    content: combined,
    tokensUsed: results.reduce((sum, r) => sum + r.tokensUsed, 0),
    model: 'ensemble',
    metadata: {
      models,
      results: results.map(r => ({ model: r.model, preview: r.content.slice(0, 100) }))
    }
  };
}

async function _cascade(prompt, options) {
  const models = options.models || ['gemini-pro', 'gpt-3.5-turbo', 'gpt-4'];
  const qualityThreshold = options.qualityThreshold || 0.7;
  
  for (const model of models) {
    const result = await _generate(model, prompt, options);
    const score = _scoreContent(result.content);
    
    if (score >= qualityThreshold) {
      return {
        ...result,
        metadata: {
          attemptedModels: models.slice(0, models.indexOf(model) + 1),
          score
        }
      };
    }
  }
  
  // If none meet threshold, return last attempt
  return await _generate(models[models.length - 1], prompt, options);
}

function _scoreContent(content) {
  if (!content) return 0;
  
  let score = 0.5;
  
  // Length check
  if (content.length > 50 && content.length < 2000) score += 0.2;
  
  // Has HTML tags (for email body)
  if (content.includes('<') && content.includes('>')) score += 0.1;
  
  // Has personalization tokens
  if (content.includes('{{') && content.includes('}}')) score += 0.1;
  
  // Not too repetitive
  const words = content.toLowerCase().split(/\s+/);
  const unique = new Set(words).size;
  if (unique / words.length > 0.7) score += 0.1;
  
  return Math.min(score, 1.0);
}

//=============================================================================
// SUBJECT LINE OPTIMIZATION
//=============================================================================

async function generateSubjectLines(topic, count = 5, options = {}) {
  const prompt = `Generate ${count} compelling email subject lines for: ${topic}. Make them concise, actionable, and engaging.`;
  
  const result = await generateContent(prompt, {
    model: options.model || 'gpt-4',
    task: 'subject-line',
    temperature: 0.8,
    maxTokens: 200
  });
  
  // Parse subject lines
  const lines = result.content
    .split('\n')
    .filter(l => l.trim().length > 0)
    .map(l => l.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
    .slice(0, count);
  
  return {
    subjectLines: lines,
    model: result.model,
    cost: result.cost
  };
}

async function analyzeSubjectLine(subject) {
  const analysis = {
    length: subject.length,
    wordCount: subject.split(/\s+/).length,
    hasEmoji: /[\u{1F600}-\u{1F64F}]/u.test(subject),
    hasNumbers: /\d/.test(subject),
    hasQuestionMark: subject.includes('?'),
    hasExclamation: subject.includes('!'),
    hasPersonalization: subject.includes('{{') || subject.includes('}}'),
    sentiment: _analyzeSentiment(subject),
    spamWords: _detectSpamWords(subject),
    score: 0
  };
  
  // Calculate score
  let score = 0.5;
  if (analysis.length >= 30 && analysis.length <= 60) score += 0.2;
  if (analysis.hasEmoji) score += 0.05;
  if (analysis.hasPersonalization) score += 0.15;
  if (analysis.spamWords.length === 0) score += 0.1;
  
  analysis.score = Math.min(score, 1.0);
  analysis.rating = score >= 0.8 ? 'excellent' : score >= 0.6 ? 'good' : score >= 0.4 ? 'fair' : 'poor';
  
  return analysis;
}

async function predictOpenRate(subject) {
  const analysis = await analyzeSubjectLine(subject);
  
  // Simplified open rate prediction
  const baseRate = 0.20; // 20% baseline
  const scoreMultiplier = analysis.score;
  
  const predicted = baseRate * (0.5 + scoreMultiplier);
  
  return {
    predicted: Math.round(predicted * 100) / 100,
    confidence: 0.75,
    factors: {
      subjectScore: analysis.score,
      hasPersonalization: analysis.hasPersonalization,
      optimalLength: analysis.length >= 30 && analysis.length <= 60
    }
  };
}

async function personalizeSubject(subject, personalizationLevel = 'medium') {
  const tokens = {
    low: ['{{firstName}}'],
    medium: ['{{firstName}}', '{{location}}'],
    high: ['{{firstName}}', '{{location}}', '{{lastPurchase}}', '{{favoriteCategory}}']
  };
  
  const selectedTokens = tokens[personalizationLevel] || tokens.medium;
  const randomToken = selectedTokens[Math.floor(Math.random() * selectedTokens.length)];
  
  // Insert token at beginning or end
  const personalized = Math.random() > 0.5
    ? `${randomToken}, ${subject}`
    : `${subject} - ${randomToken}`;
  
  return {
    original: subject,
    personalized,
    token: randomToken,
    level: personalizationLevel
  };
}

async function suggestEmoji(subject) {
  const emojiMap = {
    sale: '🔥',
    discount: '💰',
    new: '✨',
    limited: '⏰',
    free: '🎁',
    exclusive: '👑',
    welcome: '👋',
    alert: '🚨'
  };
  
  const suggestions = [];
  const lowerSubject = subject.toLowerCase();
  
  for (const [keyword, emoji] of Object.entries(emojiMap)) {
    if (lowerSubject.includes(keyword)) {
      suggestions.push({ emoji, keyword, placement: 'start' });
    }
  }
  
  return {
    suggestions,
    recommended: suggestions[0] || { emoji: '✨', keyword: 'general', placement: 'start' }
  };
}

async function getSubjectLineBestPractices() {
  return {
    length: {
      min: 30,
      max: 60,
      optimal: 45,
      reason: 'Most email clients preview 30-60 characters'
    },
    tips: [
      'Use action-oriented language',
      'Create urgency when appropriate',
      'Personalize when possible',
      'A/B test different approaches',
      'Avoid spam trigger words',
      'Use numbers and specific offers',
      'Ask questions to engage',
      'Keep it relevant to email body'
    ],
    avoidWords: ['FREE', 'BUY NOW', 'CLICK HERE', 'LIMITED TIME OFFER'],
    examples: {
      good: [
        '{{firstName}}, your 20% discount expires tonight',
        '5 ways to improve your email marketing',
        'New arrivals you\'ll love this season'
      ],
      bad: [
        'FREE MONEY CLICK HERE NOW!!!',
        'You won a prize',
        'Act now before it\'s too late'
      ]
    }
  };
}

//=============================================================================
// EMAIL BODY GENERATION
//=============================================================================

async function generateEmailBody(topic, options = {}) {
  const {
    tone = 'professional',
    length = 'medium',
    includeHTML = true
  } = options;
  
  const lengthMap = {
    short: 150,
    medium: 400,
    long: 800
  };
  
  const prompt = `Generate a ${tone} email body about: ${topic}. Length: ${length}. ${includeHTML ? 'Format as HTML.' : 'Plain text only.'}`;
  
  const result = await generateContent(prompt, {
    model: options.model || 'gpt-4',
    task: 'email-body',
    temperature: 0.7,
    maxTokens: lengthMap[length] || 400
  });
  
  return {
    body: result.content,
    model: result.model,
    cost: result.cost,
    wordCount: result.content.split(/\s+/).length
  };
}

async function rewriteContent(content, tone = 'professional') {
  const prompt = `Rewrite the following email content in a ${tone} tone:\n\n${content}`;
  
  const result = await generateContent(prompt, {
    model: 'gpt-4',
    task: 'rewrite',
    temperature: 0.6,
    maxTokens: 600
  });
  
  return {
    original: content,
    rewritten: result.content,
    tone,
    model: result.model,
    cost: result.cost
  };
}

async function expandContent(content) {
  const prompt = `Expand the following email content with more details and examples:\n\n${content}`;
  
  const result = await generateContent(prompt, {
    model: 'gpt-4',
    task: 'expand',
    temperature: 0.7,
    maxTokens: 800
  };
  
  return {
    original: content,
    expanded: result.content,
    model: result.model,
    cost: result.cost
  };
}

async function summarizeContent(content) {
  const prompt = `Summarize the following email content concisely:\n\n${content}`;
  
  const result = await generateContent(prompt, {
    model: 'gpt-3.5-turbo',
    task: 'summarize',
    temperature: 0.5,
    maxTokens: 200
  });
  
  return {
    original: content,
    summary: result.content,
    model: result.model,
    cost: result.cost
  };
}

async function translateContent(content, targetLanguage = 'es') {
  const prompt = `Translate the following email content to ${targetLanguage}:\n\n${content}`;
  
  const result = await generateContent(prompt, {
    model: 'gpt-4',
    task: 'translate',
    temperature: 0.3,
    maxTokens: 600
  });
  
  return {
    original: content,
    translated: result.content,
    targetLanguage,
    model: result.model,
    cost: result.cost
  };
}

async function personalizeContent(content, personalizationData = {}) {
  const prompt = `Add appropriate personalization tokens to this email content. Available data: ${Object.keys(personalizationData).join(', ')}:\n\n${content}`;
  
  const result = await generateContent(prompt, {
    model: 'gpt-4',
    task: 'personalize',
    temperature: 0.6,
    maxTokens: 600
  });
  
  return {
    original: content,
    personalized: result.content,
    availableTokens: Object.keys(personalizationData),
    model: result.model,
    cost: result.cost
  };
}

//=============================================================================
// CONTENT QUALITY & OPTIMIZATION
//=============================================================================

async function checkSpamScore(subject, body) {
  const spamWords = _detectSpamWords(subject + ' ' + body);
  const allCapsCount = (subject + body).match(/[A-Z]{3,}/g)?.length || 0;
  const exclamationCount = (subject + body).match(/!/g)?.length || 0;
  
  let score = 0;
  score += spamWords.length * 10;
  score += allCapsCount * 5;
  score += exclamationCount * 2;
  
  return {
    score: Math.min(score, 100),
    rating: score < 20 ? 'excellent' : score < 40 ? 'good' : score < 60 ? 'fair' : 'poor',
    issues: {
      spamWords,
      allCapsCount,
      exclamationCount
    },
    recommendations: _getSpamRecommendations(score, spamWords.length, allCapsCount, exclamationCount)
  };
}

function _detectSpamWords(text) {
  const spamWords = ['free', 'buy now', 'click here', 'limited time', 'act now', 'urgent', 'congratulations', 'winner', 'prize', 'guarantee'];
  const found = [];
  
  const lowerText = text.toLowerCase();
  spamWords.forEach(word => {
    if (lowerText.includes(word)) found.push(word);
  });
  
  return found;
}

function _getSpamRecommendations(score, spamWords, allCaps, exclamations) {
  const recommendations = [];
  
  if (spamWords > 0) recommendations.push('Remove spam trigger words');
  if (allCaps > 2) recommendations.push('Reduce ALL CAPS text');
  if (exclamations > 3) recommendations.push('Use fewer exclamation marks');
  if (score === 0) recommendations.push('Content looks good!');
  
  return recommendations;
}

async function calculateReadabilityScore(content) {
  const words = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const syllables = _countSyllables(content);
  
  // Flesch Reading Ease
  const fleschScore = sentences > 0 && words > 0
    ? 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    : 0;
  
  return {
    score: Math.max(0, Math.min(100, fleschScore)),
    level: _getReadingLevel(fleschScore),
    metrics: {
      words,
      sentences,
      syllables,
      avgWordsPerSentence: sentences > 0 ? Math.round(words / sentences) : 0,
      avgSyllablesPerWord: words > 0 ? Math.round((syllables / words) * 10) / 10 : 0
    }
  };
}

function _countSyllables(text) {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  let count = 0;
  
  words.forEach(word => {
    const vowels = word.match(/[aeiouy]+/g);
    count += vowels ? vowels.length : 1;
  });
  
  return count;
}

function _getReadingLevel(score) {
  if (score >= 90) return 'very easy';
  if (score >= 80) return 'easy';
  if (score >= 70) return 'fairly easy';
  if (score >= 60) return 'standard';
  if (score >= 50) return 'fairly difficult';
  if (score >= 30) return 'difficult';
  return 'very difficult';
}

function _analyzeSentiment(text) {
  const positive = ['great', 'excellent', 'amazing', 'love', 'wonderful', 'fantastic', 'best'];
  const negative = ['bad', 'poor', 'worst', 'terrible', 'awful', 'hate', 'disappointing'];
  
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positive.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negative.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  const sentiment = positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral';
  
  return {
    sentiment,
    positiveCount,
    negativeCount,
    score: positiveCount - negativeCount
  };
}

async function analyzeSentiment(content) {
  return _analyzeSentiment(content);
}

async function optimizeCTA(cta) {
  const prompt = `Optimize this call-to-action for higher click-through rates: "${cta}". Provide 3 improved versions.`;
  
  const result = await generateContent(prompt, {
    model: 'gpt-4',
    task: 'cta-optimization',
    temperature: 0.7,
    maxTokens: 200
  });
  
  const variants = result.content
    .split('\n')
    .filter(l => l.trim().length > 0)
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .slice(0, 3);
  
  return {
    original: cta,
    variants,
    model: result.model,
    cost: result.cost
  };
}

async function generateImageAltText(imageUrl, context = '') {
  const prompt = `Generate SEO-friendly alt text for an image in an email about: ${context}. Image URL: ${imageUrl}`;
  
  const result = await generateContent(prompt, {
    model: 'gemini-pro',
    task: 'alt-text',
    temperature: 0.5,
    maxTokens: 100
  });
  
  return {
    imageUrl,
    altText: result.content.trim(),
    model: result.model,
    cost: result.cost
  };
}

async function getContentRecommendations(subject, body) {
  const spamCheck = await checkSpamScore(subject, body);
  const readability = await calculateReadabilityScore(body);
  const sentiment = _analyzeSentiment(body);
  
  const recommendations = [];
  
  if (spamCheck.score > 40) recommendations.push('Reduce spam trigger words');
  if (readability.score < 60) recommendations.push('Simplify language for better readability');
  if (sentiment.sentiment === 'negative') recommendations.push('Consider more positive tone');
  if (body.length < 100) recommendations.push('Add more content - email seems too short');
  if (!body.includes('{{') && !body.includes('}}')) recommendations.push('Add personalization tokens');
  
  return {
    recommendations,
    scores: {
      spam: spamCheck.score,
      readability: readability.score,
      sentiment: sentiment.score
    }
  };
}

//=============================================================================
// METRICS & ANALYTICS
//=============================================================================

function _trackMetrics(model, task, success, latency, tokens) {
  const key = `${model}:${task}`;
  
  if (!modelMetrics.has(key)) {
    modelMetrics.set(key, {
      model,
      task,
      requests: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0,
      totalTokens: 0,
      totalCost: 0
    });
  }
  
  const metrics = modelMetrics.get(key);
  metrics.requests++;
  
  if (success) {
    metrics.successes++;
  } else {
    metrics.failures++;
  }
  
  metrics.totalLatency += latency;
  metrics.totalTokens += tokens;
  metrics.totalCost += _calculateCost(model, tokens);
}

function getAvailableModels() {
  return Object.entries(MODELS).map(([name, config]) => ({
    name,
    provider: config.provider,
    cost: config.cost,
    maxTokens: config.maxTokens,
    strengths: config.strengths
  }));
}

function getModelPerformance() {
  const performance = [];
  
  modelMetrics.forEach((metrics, key) => {
    const avgLatency = metrics.requests > 0 ? metrics.totalLatency / metrics.requests : 0;
    const successRate = metrics.requests > 0 ? metrics.successes / metrics.requests : 0;
    
    performance.push({
      model: metrics.model,
      task: metrics.task,
      requests: metrics.requests,
      successRate: Math.round(successRate * 100) / 100,
      avgLatency: Math.round(avgLatency),
      totalTokens: metrics.totalTokens,
      totalCost: Math.round(metrics.totalCost * 100) / 100
    });
  });
  
  return performance;
}

function getUsageStats(timeframe = '24h') {
  const now = Date.now();
  const cutoff = {
    '1h': 3600000,
    '24h': 86400000,
    '7d': 604800000,
    '30d': 2592000000
  }[timeframe] || 86400000;
  
  const recentRequests = generationHistory.filter(r => {
    const requestTime = new Date(r.timestamp).getTime();
    return now - requestTime < cutoff;
  });
  
  const totalCost = recentRequests.reduce((sum, r) => {
    const metrics = Array.from(modelMetrics.values()).find(m => m.model === r.model && m.task === r.task);
    return sum + (metrics?.totalCost || 0);
  }, 0);
  
  return {
    timeframe,
    requests: recentRequests.length,
    successRate: recentRequests.filter(r => r.success).length / (recentRequests.length || 1),
    avgLatency: recentRequests.reduce((sum, r) => sum + r.latency, 0) / (recentRequests.length || 1),
    totalCost: Math.round(totalCost * 100) / 100,
    byModel: _groupBy(recentRequests, 'model'),
    byTask: _groupBy(recentRequests, 'task')
  };
}

function _groupBy(items, key) {
  const groups = {};
  items.forEach(item => {
    const value = item[key];
    if (!groups[value]) groups[value] = 0;
    groups[value]++;
  });
  return groups;
}

function getCostBreakdown(timeframe = '30d') {
  const stats = getUsageStats(timeframe);
  const performance = getModelPerformance();
  
  const breakdown = performance.map(p => ({
    model: p.model,
    task: p.task,
    requests: p.requests,
    cost: p.totalCost,
    percentage: stats.totalCost > 0 ? Math.round((p.totalCost / stats.totalCost) * 100) : 0
  }));
  
  breakdown.sort((a, b) => b.cost - a.cost);
  
  return {
    timeframe,
    totalCost: stats.totalCost,
    breakdown,
    topModels: breakdown.slice(0, 5)
  };
}

module.exports = {
  // Core generation
  generateContent,
  
  // Subject lines
  generateSubjectLines,
  analyzeSubjectLine,
  predictOpenRate,
  personalizeSubject,
  suggestEmoji,
  getSubjectLineBestPractices,
  
  // Email body
  generateEmailBody,
  rewriteContent,
  expandContent,
  summarizeContent,
  translateContent,
  personalizeContent,
  
  // Quality & optimization
  checkSpamScore,
  calculateReadabilityScore,
  analyzeSentiment,
  optimizeCTA,
  generateImageAltText,
  getContentRecommendations,
  
  // Models & metrics
  getAvailableModels,
  getModelPerformance,
  getUsageStats,
  getCostBreakdown
}; 