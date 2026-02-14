/**
 * AI Content Enhancement Engine
 * AI-powered content rewriting, improvement, and generation suggestions
 */

// In-memory storage
const enhancements = new Map();
const rewriteHistory = new Map();
let enhancementIdCounter = 1;
let rewriteIdCounter = 1;

/**
 * Generate content enhancement suggestions
 */
function generateEnhancements(data) {
  const {
    contentId,
    text,
    enhancementType = 'all', // all, grammar, clarity, engagement, seo
    tone = 'professional', // professional, casual, friendly, formal, persuasive
    targetAudience = 'general'
  } = data;

  const enhancement = {
    id: enhancementIdCounter++,
    contentId,
    generatedAt: new Date().toISOString(),
    enhancementType,
    tone,
    targetAudience,
    
    // Grammar and spelling suggestions
    grammar: enhancementType === 'all' || enhancementType === 'grammar' ? detectGrammarIssues(text) : [],
    
    // Clarity improvements
    clarity: enhancementType === 'all' || enhancementType === 'clarity' ? suggestClarityImprovements(text) : [],
    
    // Engagement enhancements
    engagement: enhancementType === 'all' || enhancementType === 'engagement' ? suggestEngagementImprovements(text) : [],
    
    // SEO optimizations
    seo: enhancementType === 'all' || enhancementType === 'seo' ? suggestSEOImprovements(text) : [],
    
    // Tone adjustments
    toneAdjustments: analyzeToneMatching(text, tone),
    
    // Overall recommendation
    priority: 'medium',
    totalSuggestions: 0
  };

  // Calculate total suggestions
  enhancement.totalSuggestions = 
    enhancement.grammar.length +
    enhancement.clarity.length +
    enhancement.engagement.length +
    enhancement.seo.length;

  // Determine priority
  if (enhancement.grammar.length > 5) enhancement.priority = 'high';
  else if (enhancement.totalSuggestions > 10) enhancement.priority = 'medium';
  else enhancement.priority = 'low';

  enhancements.set(enhancement.id, enhancement);
  return enhancement;
}

/**
 * Rewrite content with AI improvements
 */
function rewriteContent(data) {
  const {
    contentId,
    originalText,
    rewriteGoal = 'improve', // improve, simplify, expand, shorten, rephrase
    tone = 'maintain', // maintain, professional, casual, friendly, formal
    preserveKeywords = [],
    maxLength = null
  } = data;

  const rewrite = {
    id: rewriteIdCounter++,
    contentId,
    createdAt: new Date().toISOString(),
    originalText,
    rewriteGoal,
    tone,
    
    // Rewritten version (simulated - in production would use actual AI)
    rewrittenText: generateRewrittenContent(originalText, rewriteGoal, tone, preserveKeywords),
    
    // Analysis
    analysis: {
      originalLength: originalText.length,
      rewrittenLength: 0,
      wordsChanged: 0,
      improvementScore: 0,
      preservedKeywords: preserveKeywords.filter(kw => 
        originalText.toLowerCase().includes(kw.toLowerCase())
      ).length
    },
    
    changes: [],
    status: 'draft', // draft, accepted, rejected
    acceptedAt: null
  };

  rewrite.analysis.rewrittenLength = rewrite.rewrittenText.length;
  rewrite.analysis.improvementScore = calculateImprovementScore(originalText, rewrite.rewrittenText);
  rewrite.changes = highlightChanges(originalText, rewrite.rewrittenText);

  rewriteHistory.set(rewrite.id, rewrite);
  return rewrite;
}

/**
 * Generate content outline with AI
 */
function generateOutline(data) {
  const {
    topic,
    targetKeyword,
    contentType = 'article', // article, guide, listicle, review
    targetWordCount = 1500,
    targetAudience = 'general'
  } = data;

  // Generate AI-powered outline
  const outline = {
    topic,
    targetKeyword,
    contentType,
    targetWordCount,
    targetAudience,
    generatedAt: new Date().toISOString(),
    
    title: generateTitle(topic, targetKeyword, contentType),
    
    metaDescription: generateMetaDescription(topic, targetKeyword),
    
    introduction: {
      suggestedLength: Math.round(targetWordCount * 0.1),
      keyPoints: [
        `Introduce ${topic} and its relevance`,
        `State the main problem or question`,
        `Preview what readers will learn`,
        `Include target keyword naturally`
      ]
    },
    
    sections: generateSections(topic, targetKeyword, contentType, targetWordCount),
    
    conclusion: {
      suggestedLength: Math.round(targetWordCount * 0.1),
      keyPoints: [
        `Summarize main points`,
        `Reinforce key takeaways`,
        `Include call-to-action`,
        `Encourage next steps`
      ]
    },
    
    seoRecommendations: [
      `Use "${targetKeyword}" in title and first paragraph`,
      `Include 3-5 related keyphrases throughout`,
      `Aim for 2-3% keyword density`,
      `Add relevant internal and external links`,
      `Include alt text for all images`
    ],
    
    estimatedReadingTime: Math.ceil(targetWordCount / 200)
  };

  return outline;
}

/**
 * Suggest headline variations
 */
function suggestHeadlines(data) {
  const { topic, targetKeyword, count = 10, style = 'all' } = data;

  const headlines = [];

  // How-to headlines
  if (style === 'all' || style === 'howto') {
    headlines.push(
      `How to ${topic}: A Complete Guide`,
      `${topic}: Step-by-Step Tutorial for ${targetKeyword}`,
      `Master ${topic} in 5 Simple Steps`,
      `The Ultimate Guide to ${topic} [${new Date().getFullYear()}]`
    );
  }

  // Listicle headlines
  if (style === 'all' || style === 'listicle') {
    headlines.push(
      `10 ${targetKeyword} Tips Every ${topic} Expert Uses`,
      `7 Proven Ways to Improve Your ${topic}`,
      `15 ${topic} Strategies That Actually Work`,
      `The Top 5 ${targetKeyword} Techniques for ${topic}`
    );
  }

  // Question headlines
  if (style === 'all' || style === 'question') {
    headlines.push(
      `What is ${topic}? Everything You Need to Know`,
      `Why ${topic} Matters for ${targetKeyword}`,
      `When Should You Use ${topic}?`,
      `Which ${topic} Strategy is Right for You?`
    );
  }

  // Benefit-driven headlines
  if (style === 'all' || style === 'benefit') {
    headlines.push(
      `${topic}: Double Your ${targetKeyword} Results`,
      `Get Better ${targetKeyword} with These ${topic} Tips`,
      `Transform Your ${topic} Strategy Today`,
      `${targetKeyword} Made Easy: ${topic} Explained`
    );
  }

  return {
    topic,
    targetKeyword,
    total: headlines.slice(0, count).length,
    headlines: headlines.slice(0, count).map((h, index) => ({
      id: index + 1,
      text: h,
      estimatedCTR: Math.floor(Math.random() * 15) + 5, // Simulated CTR
      score: Math.floor(Math.random() * 30) + 70,
      analysis: {
        length: h.length,
        hasNumber: /\d+/.test(h),
        hasKeyword: h.toLowerCase().includes(targetKeyword.toLowerCase()),
        emotionalWords: countEmotionalWords(h),
        powerWords: countPowerWords(h)
      }
    })),
    recommendations: [
      'Include numbers for better engagement',
      'Keep title between 50-60 characters',
      'Start with strong action words',
      'Create curiosity while being specific'
    ]
  };
}

/**
 * Improve sentence structure
 */
function improveSentenceStructure(data) {
  const { text } = data;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const improvements = sentences.map((sentence, index) => {
    const words = sentence.trim().split(/\s+/).length;
    const issues = [];
    const suggestions = [];

    // Check sentence length
    if (words > 30) {
      issues.push('Sentence is too long');
      suggestions.push('Break into 2-3 shorter sentences');
    } else if (words < 5) {
      issues.push('Sentence is very short');
      suggestions.push('Consider combining with adjacent sentence or adding more detail');
    }

    // Check for passive voice (simplified detection)
    if (/\b(is|are|was|were|be|been|being)\s+\w+ed\b/.test(sentence)) {
      issues.push('Possible passive voice detected');
      suggestions.push('Consider using active voice for clarity');
    }

    // Check for complex words
    const complexWords = sentence.split(/\s+/).filter(w => w.length > 12).length;
    if (complexWords > 2) {
      issues.push('Contains complex words');
      suggestions.push('Simplify vocabulary where possible');
    }

    return {
      sentenceNumber: index + 1,
      originalSentence: sentence.trim(),
      wordCount: words,
      issues,
      suggestions,
      improvementNeeded: issues.length > 0
    };
  });

  return {
    totalSentences: sentences.length,
    needingImprovement: improvements.filter(i => i.improvementNeeded).length,
    improvements: improvements.filter(i => i.improvementNeeded),
    summary: {
      avgSentenceLength: sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length,
      longSentences: improvements.filter(i => i.wordCount > 25).length,
      shortSentences: improvements.filter(i => i.wordCount < 8).length
    }
  };
}

/**
 * Generate call-to-action suggestions
 */
function suggestCTA(data) {
  const { contentGoal, productService, tone = 'professional' } = data;

  const ctaSuggestions = [];

  // Goal-based CTAs
  if (contentGoal === 'lead_generation') {
    ctaSuggestions.push(
      'Download Your Free Guide Now',
      'Get Instant Access to Our Resources',
      'Sign Up for Exclusive Tips',
      'Start Your Free Trial Today'
    );
  } else if (contentGoal === 'sales') {
    ctaSuggestions.push(
      `Shop ${productService} Now`,
      'Get Started Today',
      'Buy Now and Save',
      'Order Your Copy Today'
    );
  } else if (contentGoal === 'engagement') {
    ctaSuggestions.push(
      'Read More',
      'Learn How It Works',
      'Explore Our Solutions',
      'Discover the Benefits'
    );
  } else if (contentGoal === 'newsletter') {
    ctaSuggestions.push(
      'Subscribe for Weekly Updates',
      'Join Our Community',
      'Get the Latest News',
      'Never Miss an Update'
    );
  }

  // Tone adjustments
  const adjustedCTAs = ctaSuggestions.map(cta => {
    if (tone === 'casual') {
      return cta.replace('Discover', 'Check Out')
                .replace('Obtain', 'Get')
                .replace('Purchase', 'Buy');
    } else if (tone === 'urgent') {
      return cta + ' - Limited Time!';
    }
    return cta;
  });

  return {
    contentGoal,
    tone,
    suggestions: adjustedCTAs.map((cta, index) => ({
      id: index + 1,
      text: cta,
      placement: index % 2 === 0 ? 'end' : 'mid-content',
      style: tone,
      estimatedConversionLift: `${Math.floor(Math.random() * 10) + 5}%`
    })),
    bestPractices: [
      'Use action-oriented language',
      'Create a sense of urgency where appropriate',
      'Make the value proposition clear',
      'Use contrasting colors for CTA buttons',
      'Place CTAs at natural pause points'
    ]
  };
}

/**
 * Get enhancement statistics
 */
function getEnhancementStatistics() {
  const allEnhancements = Array.from(enhancements.values());
  const allRewrites = Array.from(rewriteHistory.values());

  return {
    totalEnhancements: allEnhancements.length,
    totalRewrites: allRewrites.length,
    acceptedRewrites: allRewrites.filter(r => r.status === 'accepted').length,
    averageSuggestionsPerContent: allEnhancements.reduce((sum, e) => sum + e.totalSuggestions, 0) / allEnhancements.length || 0,
    mostCommonIssues: [
      { type: 'Grammar', count: allEnhancements.reduce((sum, e) => sum + e.grammar.length, 0) },
      { type: 'Clarity', count: allEnhancements.reduce((sum, e) => sum + e.clarity.length, 0) },
      { type: 'Engagement', count: allEnhancements.reduce((sum, e) => sum + e.engagement.length, 0) },
      { type: 'SEO', count: allEnhancements.reduce((sum, e) => sum + e.seo.length, 0) }
    ].sort((a, b) => b.count - a.count),
    averageImprovementScore: allRewrites.reduce((sum, r) => sum + r.analysis.improvementScore, 0) / allRewrites.length || 0
  };
}

// Helper functions

function detectGrammarIssues(text) {
  const issues = [];
  
  // Simplified grammar checks
  if (/\s{2,}/.test(text)) {
    issues.push({ type: 'spacing', message: 'Multiple spaces detected', severity: 'low' });
  }
  
  if (/[a-z]\.[A-Z]/.test(text)) {
    issues.push({ type: 'spacing', message: 'Missing space after period', severity: 'medium' });
  }
  
  if (/\b(their|there|they're)\b/i.test(text)) {
    issues.push({ type: 'common_mistakes', message: 'Check their/there/they\'re usage', severity: 'medium' });
  }
  
  return issues.slice(0, 10); // Limit to 10 issues
}

function suggestClarityImprovements(text) {
  const improvements = [];
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 25);
  
  if (longSentences.length > 0) {
    improvements.push({
      type: 'sentence_length',
      message: `${longSentences.length} sentences are too long`,
      suggestion: 'Break long sentences into shorter ones for better clarity'
    });
  }
  
  if (/\b(utilize|implement|facilitate|optimize)\b/i.test(text)) {
    improvements.push({
      type: 'word_choice',
      message: 'Complex words detected',
      suggestion: 'Replace with simpler alternatives (use, do, help, improve)'
    });
  }
  
  return improvements;
}

function suggestEngagementImprovements(text) {
  const improvements = [];
  
  if (!/\?/.test(text)) {
    improvements.push({
      type: 'questions',
      message: 'No questions found',
      suggestion: 'Add rhetorical questions to engage readers'
    });
  }
  
  const emotionalWords = ['amazing', 'incredible', 'revolutionary', 'transform', 'discover'];
  const hasEmotional = emotionalWords.some(word => text.toLowerCase().includes(word));
  
  if (!hasEmotional) {
    improvements.push({
      type: 'emotional_appeal',
      message: 'Content lacks emotional words',
      suggestion: 'Add power words to increase engagement'
    });
  }
  
  if (!text.includes('you') && !text.includes('your')) {
    improvements.push({
      type: 'voice',
      message: 'Not addressing reader directly',
      suggestion: 'Use "you" and "your" to create personal connection'
    });
  }
  
  return improvements;
}

function suggestSEOImprovements(text) {
  const improvements = [];
  
  if (text.length < 300) {
    improvements.push({
      type: 'content_length',
      message: 'Content is very short',
      suggestion: 'Expand to at least 300 words for better SEO'
    });
  }
  
  if (!/<h[1-6]/.test(text)) {
    improvements.push({
      type: 'structure',
      message: 'No headings detected',
      suggestion: 'Add H2 and H3 headings to structure content'
    });
  }
  
  if (!/<a\s/.test(text)) {
    improvements.push({
      type: 'links',
      message: 'No links found',
      suggestion: 'Add 2-3 internal links and 1-2 external links'
    });
  }
  
  return improvements;
}

function analyzeToneMatching(text, targetTone) {
  // Simplified tone analysis
  const professionalWords = ['hereby', 'furthermore', 'consequently', 'therefore'];
  const casualWords = ['gonna', 'wanna', 'yeah', 'cool', 'awesome'];
  
  const hasProfessional = professionalWords.some(w => text.toLowerCase().includes(w));
  const hasCasual = casualWords.some(w => text.toLowerCase().includes(w));
  
  let currentTone = 'neutral';
  if (hasProfessional && !hasCasual) currentTone = 'professional';
  else if (hasCasual && !hasProfessional) currentTone = 'casual';
  
  return {
    targetTone,
    currentTone,
    matches: currentTone === targetTone,
    suggestion: currentTone !== targetTone ? `Adjust tone to be more ${targetTone}` : 'Tone matches target'
  };
}

function generateRewrittenContent(original, goal, tone, preserveKeywords) {
  // Simulated rewrite - in production would use actual AI
  let rewritten = original;
  
  if (goal === 'simplify') {
    rewritten = original.replace(/\b(utilize|implement|facilitate)\b/gi, match => {
      const replacements = { utilize: 'use', implement: 'do', facilitate: 'help' };
      return replacements[match.toLowerCase()] || match;
    });
  } else if (goal === 'expand') {
    rewritten = original + ' This provides additional context and depth to the topic, offering readers more comprehensive understanding.';
  } else if (goal === 'shorten') {
    const sentences = original.split(/[.!?]+/);
    rewritten = sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
  }
  
  return rewritten;
}

function calculateImprovementScore(original, rewritten) {
  // Simplified scoring
  const lengthDiff = Math.abs(original.length - rewritten.length);
  const lengthScore = lengthDiff < 100 ? 50 : 30;
  
  // Simulated quality improvement
  const qualityScore = Math.floor(Math.random() * 40) + 30;
  
  return lengthScore + qualityScore;
}

function highlightChanges(original, rewritten) {
  // Simplified change detection
  return [
    { type: 'word_choice', count: Math.floor(Math.random() * 10) + 5 },
    { type: 'structure', count: Math.floor(Math.random() * 5) + 2 },
    { type: 'grammar', count: Math.floor(Math.random() * 3) + 1 }
  ];
}

function generateTitle(topic, targetKeyword, contentType) {
  const templates = {
    article: `${targetKeyword}: Complete Guide to ${topic}`,
    guide: `The Ultimate ${topic} Guide for ${targetKeyword}`,
    listicle: `10 Essential ${topic} Tips for ${targetKeyword}`,
    review: `${topic} Review: Everything You Need to Know About ${targetKeyword}`
  };
  
  return templates[contentType] || `${topic}: ${targetKeyword} Guide`;
}

function generateMetaDescription(topic, targetKeyword) {
  return `Learn everything about ${topic} and ${targetKeyword}. Comprehensive guide with actionable tips and expert insights. Start improving your ${targetKeyword} today.`;
}

function generateSections(topic, targetKeyword, contentType, targetWordCount) {
  const baseSections = [
    { title: `What is ${topic}?`, wordCount: Math.round(targetWordCount * 0.15) },
    { title: `Why ${topic} Matters`, wordCount: Math.round(targetWordCount * 0.15) },
    { title: `${topic} Best Practices`, wordCount: Math.round(targetWordCount * 0.25) },
    { title: `Common ${topic} Mistakes to Avoid`, wordCount: Math.round(targetWordCount * 0.15) },
    { title: `${topic} Tools and Resources`, wordCount: Math.round(targetWordCount * 0.10) }
  ];
  
  return baseSections;
}

function countEmotionalWords(text) {
  const emotionalWords = ['amazing', 'incredible', 'powerful', 'essential', 'secret', 'proven', 'ultimate'];
  return emotionalWords.filter(word => text.toLowerCase().includes(word)).length;
}

function countPowerWords(text) {
  const powerWords = ['guaranteed', 'exclusive', 'limited', 'free', 'bonus', 'instant', 'proven'];
  return powerWords.filter(word => text.toLowerCase().includes(word)).length;
}

module.exports = {
  generateEnhancements,
  rewriteContent,
  generateOutline,
  suggestHeadlines,
  improveSentenceStructure,
  suggestCTA,
  getEnhancementStatistics
};
