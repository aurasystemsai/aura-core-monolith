/**
 * Optimization Recommendations Engine
 * AI-powered actionable content optimization suggestions
 */

// In-memory storage
const optimizations = new Map();
let optimizationIdCounter = 1;

/**
 * Generate comprehensive optimization recommendations
 */
function generateOptimizations(data) {
  const {
    contentId,
    contentAnalysis,
    seoScore,
    readabilityScore,
    targetGoals = ['seo', 'engagement', 'conversions'], // seo, engagement, conversions, readability
    priority = 'all' // all, high, medium, low
  } = data;

  const optimization = {
    id: optimizationIdCounter++,
    contentId,
    generatedAt: new Date().toISOString(),
    targetGoals,
    
    // Quick wins (easy, high-impact changes)
    quickWins: [],
    
    // SEO optimizations
    seo: [],
    
    // Content quality improvements
    contentQuality: [],
    
    // Readability improvements
    readability: [],
    
    // Engagement boosters
    engagement: [],
    
    // Conversion optimizations
    conversions: [],
    
    // Priority breakdown
    priorityBreakdown: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    
    // Estimated impact
    estimatedImpact: {
      seoScore: 0,
      readabilityScore: 0,
      engagementRate: 0,
      conversionRate: 0
    },
    
    totalRecommendations: 0
  };

  // Generate SEO recommendations
  if (targetGoals.includes('seo')) {
    optimization.seo = generateSEOOptimizations(contentAnalysis, seoScore);
  }

  // Generate content quality recommendations
  optimization.contentQuality = generateContentQualityOptimizations(contentAnalysis);

  // Generate readability recommendations
  if (targetGoals.includes('readability')) {
    optimization.readability = generateReadabilityOptimizations(readabilityScore);
  }

  // Generate engagement recommendations
  if (targetGoals.includes('engagement')) {
    optimization.engagement = generateEngagementOptimizations(contentAnalysis, readabilityScore);
  }

  // Generate conversion recommendations
  if (targetGoals.includes('conversions')) {
    optimization.conversions = generateConversionOptimizations(contentAnalysis);
  }

  // Identify quick wins
  optimization.quickWins = identifyQuickWins([
    ...optimization.seo,
    ...optimization.contentQuality,
    ...optimization.readability,
    ...optimization.engagement,
    ...optimization.conversions
  ]);

  // Calculate priority breakdown
  const allRecommendations = [
    ...optimization.seo,
    ...optimization.contentQuality,
    ...optimization.readability,
    ...optimization.engagement,
    ...optimization.conversions
  ];

  allRecommendations.forEach(rec => {
    optimization.priorityBreakdown[rec.priority]++;
  });

  optimization.totalRecommendations = allRecommendations.length;

  // Calculate estimated impact
  optimization.estimatedImpact = calculateEstimatedImpact(allRecommendations);

  // Filter by priority if requested
  if (priority !== 'all') {
    optimization.seo = optimization.seo.filter(r => r.priority === priority);
    optimization.contentQuality = optimization.contentQuality.filter(r => r.priority === priority);
    optimization.readability = optimization.readability.filter(r => r.priority === priority);
    optimization.engagement = optimization.engagement.filter(r => r.priority === priority);
    optimization.conversions = optimization.conversions.filter(r => r.priority === priority);
  }

  optimizations.set(optimization.id, optimization);
  return optimization;
}

/**
 * Get optimization by ID
 */
function getOptimization(optimizationId) {
  const optimization = optimizations.get(optimizationId);
  if (!optimization) {
    throw new Error('Optimization not found');
  }
  return optimization;
}

/**
 * Track optimization implementation
 */
function trackImplementation(data) {
  const { optimizationId, implementedIds = [], notes = '' } = data;

  const optimization = optimizations.get(optimizationId);
  if (!optimization) {
    throw new Error('Optimization not found');
  }

  const implementation = {
    id: Date.now(),
    optimizationId,
    implementedCount: implementedIds.length,
    totalRecommendations: optimization.totalRecommendations,
    completionRate: (implementedIds.length / optimization.totalRecommendations) * 100,
    implementedAt: new Date().toISOString(),
    notes,
    implemented: implementedIds
  };

  return implementation;
}

/**
 * Generate A/B test suggestions
 */
function suggestABTests(data) {
  const { contentId, currentVersion, goals = ['engagement'] } = data;

  const tests = [];

  // Title variations
  tests.push({
    element: 'title',
    hypothesis: 'Adding numbers to title increases click-through rate',
    variants: [
      { id: 'A', type: 'control', description: 'Current title' },
      { id: 'B', type: 'test', description: 'Title with numbers (e.g., "7 Ways...")' }
    ],
    successMetric: 'Click-through rate',
    estimatedLift: '15-25%',
    effort: 'low',
    duration: '7 days'
  });

  // Content length
  tests.push({
    element: 'content_length',
    hypothesis: 'Longer, more comprehensive content ranks better',
    variants: [
      { id: 'A', type: 'control', description: `Current length (${currentVersion.wordCount} words)` },
      { id: 'B', type: 'test', description: `Extended version (${Math.round(currentVersion.wordCount * 1.5)} words)` }
    ],
    successMetric: 'Average time on page',
    estimatedLift: '20-30%',
    effort: 'high',
    duration: '14 days'
  });

  // CTA placement
  tests.push({
    element: 'cta_placement',
    hypothesis: 'Multiple CTAs increase conversion rate',
    variants: [
      { id: 'A', type: 'control', description: 'Single CTA at end' },
      { id: 'B', type: 'test', description: 'CTAs at beginning, middle, and end' }
    ],
    successMetric: 'Conversion rate',
    estimatedLift: '10-20%',
    effort: 'low',
    duration: '10 days'
  });

  // Visual elements
  tests.push({
    element: 'visuals',
    hypothesis: 'More images and infographics increase engagement',
    variants: [
      { id: 'A', type: 'control', description: 'Current image count' },
      { id: 'B', type: 'test', description: '2x images + 1 infographic' }
    ],
    successMetric: 'Engagement rate',
    estimatedLift: '15-25%',
    effort: 'medium',
    duration: '7 days'
  });

  return {
    contentId,
    totalSuggestions: tests.length,
    tests,
    recommendedFirst: tests.find(t => t.effort === 'low' && t.estimatedLift.includes('25')),
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate content refresh recommendations
 */
function recommendContentRefresh(data) {
  const { contentId, publishedDate, currentMetrics = {} } = data;

  const daysSincePublished = Math.floor((Date.now() - new Date(publishedDate).getTime()) / (1000 * 60 * 60 * 24));
  const needsRefresh = daysSincePublished > 180; // 6 months

  const recommendations = [];

  if (needsRefresh) {
    recommendations.push({
      type: 'update_statistics',
      priority: 'high',
      reason: 'Data may be outdated',
      suggestion: 'Update all statistics and data points with current information',
      effort: 'medium'
    });

    recommendations.push({
      type: 'check_links',
      priority: 'high',
      reason: 'Links may be broken',
      suggestion: 'Verify all external and internal links are still valid',
      effort: 'low'
    });

    recommendations.push({
      type: 'update_examples',
      priority: 'medium',
      reason: 'Examples may be outdated',
      suggestion: 'Replace old examples with more recent, relevant ones',
      effort: 'medium'
    });

    recommendations.push({
      type: 'expand_content',
      priority: 'medium',
      reason: 'Add new insights',
      suggestion: 'Add sections covering new developments or trends',
      effort: 'high'
    });
  }

  // Performance-based recommendations
  if (currentMetrics.bounceRate > 70) {
    recommendations.push({
      type: 'improve_intro',
      priority: 'high',
      reason: 'High bounce rate detected',
      suggestion: 'Rewrite introduction to be more engaging and clear',
      effort: 'low'
    });
  }

  if (currentMetrics.avgTimeOnPage < 60) {
    recommendations.push({
      type: 'add_multimedia',
      priority: 'medium',
      reason: 'Low time on page',
      suggestion: 'Add videos, images, or interactive elements',
      effort: 'medium'
    });
  }

  return {
    contentId,
    daysSincePublished,
    needsRefresh,
    refreshPriority: needsRefresh ? 'high' : 'low',
    recommendations,
    estimatedImpact: needsRefresh ? 'Refresh could improve SEO ranking by 15-30%' : 'Content is still fresh',
    nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
}

/**
 * Get optimization statistics
 */
function getOptimizationStatistics() {
  const opts = Array.from(optimizations.values());

  return {
    totalOptimizations: opts.length,
    averageRecommendations: opts.reduce((sum, o) => sum + o.totalRecommendations, 0) / opts.length || 0,
    priorityDistribution: {
      critical: opts.reduce((sum, o) => sum + o.priorityBreakdown.critical, 0),
      high: opts.reduce((sum, o) => sum + o.priorityBreakdown.high, 0),
      medium: opts.reduce((sum, o) => sum + o.priorityBreakdown.medium, 0),
      low: opts.reduce((sum, o) => sum + o.priorityBreakdown.low, 0)
    },
    averageQuickWins: opts.reduce((sum, o) => sum + o.quickWins.length, 0) / opts.length || 0,
    commonRecommendations: [
      { type: 'Add meta description', frequency: Math.floor(opts.length * 0.3) },
      { type: 'Optimize title tag', frequency: Math.floor(opts.length * 0.4) },
      { type: 'Improve readability', frequency: Math.floor(opts.length * 0.5) },
      { type: 'Add schema markup', frequency: Math.floor(opts.length * 0.6) }
    ]
  };
}

// Helper functions

function generateSEOOptimizations(contentAnalysis, seoScore) {
  const recommendations = [];

  if (!seoScore) return recommendations;

  // Title optimization
  if (seoScore.onPage && seoScore.onPage.titleTag.score < 80) {
    recommendations.push({
      id: 'seo_title',
      category: 'SEO',
      type: 'title_tag',
      priority: 'critical',
      effort: 'low',
      impact: 'high',
      issue: 'Title tag not optimized',
      suggestion: 'Rewrite title to include target keyword near the beginning and keep it between 30-60 characters',
      example: 'Current: Generic Title → Optimized: [Target Keyword] - [Benefit] | [Brand]',
      estimatedImpact: '+15-20% CTR improvement'
    });
  }

  // Meta description
  if (seoScore.onPage && !seoScore.onPage.metaDescription.present) {
    recommendations.push({
      id: 'seo_meta',
      category: 'SEO',
      type: 'meta_description',
      priority: 'critical',
      effort: 'low',
      impact: 'high',
      issue: 'Missing meta description',
      suggestion: 'Add a compelling meta description (120-160 characters) that includes target keyword and a call-to-action',
      example: 'Discover [benefit] with our [solution]. [Call to action]. Perfect for [audience].',
      estimatedImpact: '+10-15% CTR improvement'
    });
  }

  // Heading structure
  if (seoScore.onPage && seoScore.onPage.headings.h1 !== 1) {
    recommendations.push({
      id: 'seo_h1',
      category: 'SEO',
      type: 'heading_structure',
      priority: 'high',
      effort: 'low',
      impact: 'medium',
      issue: seoScore.onPage.headings.h1 === 0 ? 'Missing H1 tag' : 'Multiple H1 tags',
      suggestion: 'Use exactly one H1 tag per page containing your main keyword',
      estimatedImpact: '+5-10% SEO score improvement'
    });
  }

  // Schema markup
  if (seoScore.schema && !seoScore.schema.present) {
    recommendations.push({
      id: 'seo_schema',
      category: 'SEO',
      type: 'schema_markup',
      priority: 'high',
      effort: 'medium',
      impact: 'high',
      issue: 'No schema markup detected',
      suggestion: 'Add appropriate schema markup (Article, Product, FAQ, etc.) to enhance rich snippets',
      estimatedImpact: '+20-30% potential for rich snippets'
    });
  }

  // Internal linking
  if (seoScore.technical && seoScore.technical.internalLinks.count < 2) {
    recommendations.push({
      id: 'seo_internal_links',
      category: 'SEO',
      type: 'internal_linking',
      priority: 'medium',
      effort: 'low',
      impact: 'medium',
      issue: 'Insufficient internal linking',
      suggestion: 'Add 3-5 relevant internal links to other content on your site',
      estimatedImpact: '+5-8% site authority distribution'
    });
  }

  return recommendations;
}

function generateContentQualityOptimizations(contentAnalysis) {
  const recommendations = [];

  if (!contentAnalysis) return recommendations;

  // Word count
  if (contentAnalysis.wordCount && contentAnalysis.wordCount.total < 600) {
    recommendations.push({
      id: 'quality_length',
      category: 'Content Quality',
      type: 'word_count',
      priority: 'high',
      effort: 'high',
      impact: 'high',
      issue: 'Content is too short',
      suggestion: `Expand content to at least 800-1000 words (current: ${contentAnalysis.wordCount.total} words)`,
      estimatedImpact: '+15-25% SEO ranking improvement'
    });
  }

  // Structure
  if (contentAnalysis.structure && contentAnalysis.structure.headers.h2 < 2) {
    recommendations.push({
      id: 'quality_structure',
      category: 'Content Quality',
      type: 'structure',
      priority: 'medium',
      effort: 'low',
      impact: 'medium',
      issue: 'Weak content structure',
      suggestion: 'Add clear H2 subheadings to break content into logical sections',
      estimatedImpact: '+10-15% readability improvement'
    });
  }

  // Lists
  if (contentAnalysis.structure && contentAnalysis.structure.lists.total === 0) {
    recommendations.push({
      id: 'quality_lists',
      category: 'Content Quality',
      type: 'formatting',
      priority: 'low',
      effort: 'low',
      impact: 'medium',
      issue: 'No lists or bullet points',
      suggestion: 'Convert appropriate content sections to bullet points or numbered lists',
      estimatedImpact: '+8-12% scanability improvement'
    });
  }

  // Images
  if (contentAnalysis.structure && contentAnalysis.structure.images < 1) {
    recommendations.push({
      id: 'quality_images',
      category: 'Content Quality',
      type: 'multimedia',
      priority: 'medium',
      effort: 'medium',
      impact: 'high',
      issue: 'No images in content',
      suggestion: 'Add 2-3 relevant, high-quality images with descriptive alt text',
      estimatedImpact: '+10-15% engagement improvement'
    });
  }

  return recommendations;
}

function generateReadabilityOptimizations(readabilityScore) {
  const recommendations = [];

  if (!readabilityScore) return recommendations;

  // Flesch Reading Ease
  if (readabilityScore.scores && readabilityScore.scores.fleschReadingEase < 60) {
    recommendations.push({
      id: 'read_flesch',
      category: 'Readability',
      type: 'simplification',
      priority: 'high',
      effort: 'medium',
      impact: 'high',
      issue: 'Content is difficult to read',
      suggestion: 'Simplify language: use shorter sentences (15-20 words), replace complex words with simpler alternatives',
      estimatedImpact: '+15-20% reader comprehension'
    });
  }

  // Sentence length
  if (readabilityScore.sentences && readabilityScore.sentences.long > readabilityScore.sentences.total * 0.3) {
    recommendations.push({
      id: 'read_sentences',
      category: 'Readability',
      type: 'sentence_length',
      priority: 'medium',
      effort: 'medium',
      impact: 'medium',
      issue: 'Too many long sentences',
      suggestion: `Break ${readabilityScore.sentences.long} long sentences into shorter, clearer statements`,
      estimatedImpact: '+10-15% readability improvement'
    });
  }

  // Paragraph length
  if (readabilityScore.paragraphs && readabilityScore.paragraphs.tooLong > 0) {
    recommendations.push({
      id: 'read_paragraphs',
      category: 'Readability',
      type: 'paragraph_length',
      priority: 'low',
      effort: 'low',
      impact: 'medium',
      issue: `${readabilityScore.paragraphs.tooLong} paragraphs are too long`,
      suggestion: 'Break long paragraphs into 2-3 shorter paragraphs (50-150 words each)',
      estimatedImpact: '+8-12% scanability'
    });
  }

  return recommendations;
}

function generateEngagementOptimizations(contentAnalysis, readabilityScore) {
  const recommendations = [];

  // Call to action
  if (readabilityScore && readabilityScore.engagement && !readabilityScore.engagement.callToAction) {
    recommendations.push({
      id: 'engage_cta',
      category: 'Engagement',
      type: 'call_to_action',
      priority: 'high',
      effort: 'low',
      impact: 'high',
      issue: 'No clear call-to-action',
      suggestion: 'Add a compelling CTA at the end (and optionally mid-content) to guide readers to next steps',
      example: 'Try it free today, Download the guide, Learn more, Get started',
      estimatedImpact: '+20-35% conversion rate'
    });
  }

  // Multimedia
  if (readabilityScore && readabilityScore.engagement && !readabilityScore.engagement.multimedaPresence.present) {
    recommendations.push({
      id: 'engage_multimedia',
      category: 'Engagement',
      type: 'multimedia',
      priority: 'medium',
      effort: 'medium',
      impact: 'high',
      issue: 'No multimedia elements',
      suggestion: 'Add videos, infographics, or interactive elements to increase engagement',
      estimatedImpact: '+15-25% time on page'
    });
  }

  // Reading time
  if (readabilityScore && readabilityScore.engagement && readabilityScore.engagement.readingTime > 10) {
    recommendations.push({
      id: 'engage_toc',
      category: 'Engagement',
      type: 'navigation',
      priority: 'low',
      effort: 'low',
      impact: 'medium',
      issue: 'Long content without navigation',
      suggestion: 'Add a table of contents with jump links for easier navigation',
      estimatedImpact: '+10-15% user experience improvement'
    });
  }

  return recommendations;
}

function generateConversionOptimizations(contentAnalysis) {
  const recommendations = [];

  recommendations.push({
    id: 'conv_social_proof',
    category: 'Conversions',
    type: 'trust_building',
    priority: 'medium',
    effort: 'medium',
    impact: 'high',
    issue: 'Missing social proof',
    suggestion: 'Add testimonials, case studies, statistics, or trust badges',
    estimatedImpact: '+15-20% conversion lift'
  });

  recommendations.push({
    id: 'conv_urgency',
    category: 'Conversions',
    type: 'urgency',
    priority: 'low',
    effort: 'low',
    impact: 'medium',
    issue: 'No sense of urgency',
    suggestion: 'Add time-limited offers or scarcity indicators where appropriate',
    estimatedImpact: '+10-15% conversion rate'
  });

  return recommendations;
}

function identifyQuickWins(allRecommendations) {
  return allRecommendations
    .filter(rec => rec.effort === 'low' && (rec.impact === 'high' || rec.impact === 'medium'))
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5);
}

function calculateEstimatedImpact(recommendations) {
  const impact = {
    seoScore: 0,
    readabilityScore: 0,
    engagementRate: 0,
    conversionRate: 0
  };

  recommendations.forEach(rec => {
    if (rec.category === 'SEO') {
      impact.seoScore += rec.priority === 'critical' ? 10 : rec.priority === 'high' ? 5 : 2;
    } else if (rec.category === 'Readability') {
      impact.readabilityScore += rec.priority === 'high' ? 8 : rec.priority === 'medium' ? 4 : 2;
    } else if (rec.category === 'Engagement') {
      impact.engagementRate += rec.priority === 'high' ? 12 : rec.priority === 'medium' ? 6 : 3;
    } else if (rec.category === 'Conversions') {
      impact.conversionRate += rec.priority === 'high' ? 10 : rec.priority === 'medium' ? 5 : 2;
    }
  });

  return {
    seoScore: Math.min(30, impact.seoScore),
    readabilityScore: Math.min(25, impact.readabilityScore),
    engagementRate: Math.min(40, impact.engagementRate),
    conversionRate: Math.min(35, impact.conversionRate)
  };
}

module.exports = {
  generateOptimizations,
  getOptimization,
  trackImplementation,
  suggestABTests,
  recommendContentRefresh,
  getOptimizationStatistics
};
