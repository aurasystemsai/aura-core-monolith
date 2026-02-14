/**
 * Competitor Content Analysis Engine
 * Analyze competitor content strategies and identify opportunities
 */

// In-memory storage
const competitorAnalyses = new Map();
const competitors = new Map();
let analysisIdCounter = 1;
let competitorIdCounter = 1;

/**
 * Add a competitor for tracking
 */
function addCompetitor(data) {
  const {
    name,
    domain,
    industry,
    targetKeywords = [],
    notes = ''
  } = data;

  const competitor = {
    id: competitorIdCounter++,
    name,
    domain,
    industry,
    targetKeywords,
    notes,
    addedAt: new Date().toISOString(),
    lastAnalyzed: null,
    contentCount: 0
  };

  competitors.set(competitor.id, competitor);
  return competitor;
}

/**
 * Analyze competitor content
 */
function analyzeCompetitorContent(data) {
  const {
    competitorId,
    url,
    targetKeyword,
    ownContentId = null
  } = data;

  const competitor = competitors.get(competitorId);
  if (!competitor) {
    throw new Error('Competitor not found');
  }

  // Simulated competitor content analysis
  const analysis = {
    id: analysisIdCounter++,
    competitorId,
    competitorName: competitor.name,
    url,
    targetKeyword,
    analyzedAt: new Date().toISOString(),
    
    // Content metrics
    content: {
      wordCount: Math.floor(Math.random() * 2000) + 800,
      headings: {
        h1: 1,
        h2: Math.floor(Math.random() * 8) + 3,
        h3: Math.floor(Math.random() * 12) + 2
      },
      paragraphs: Math.floor(Math.random() * 30) + 15,
      images: Math.floor(Math.random() * 10) + 2,
      videos: Math.floor(Math.random() * 3),
      lists: Math.floor(Math.random() * 5) + 1,
      externalLinks: Math.floor(Math.random() * 8) + 2,
      internalLinks: Math.floor(Math.random() * 12) + 5
    },
    
    // SEO metrics
    seo: {
      titleLength: Math.floor(Math.random() * 30) + 40,
      metaDescriptionLength: Math.floor(Math.random() * 40) + 120,
      keywordInTitle: Math.random() > 0.3,
      keywordInMeta: Math.random() > 0.4,
      keywordDensity: (Math.random() * 2 + 0.5).toFixed(2),
      hasSchema: Math.random() > 0.5,
      schemaTypes: Math.random() > 0.5 ? ['Article', 'BreadcrumbList'] : [],
      mobileOptimized: Math.random() > 0.2,
      pagespeed: Math.floor(Math.random() * 30) + 65
    },
    
    // Readability
    readability: {
      fleschReadingEase: Math.floor(Math.random() * 40) + 50,
      gradeLevel: Math.floor(Math.random() * 6) + 8,
      averageSentenceLength: Math.floor(Math.random() * 10) + 15,
      averageParagraphLength: Math.floor(Math.random() * 50) + 60
    },
    
    // Backlinks (simulated)
    backlinks: {
      total: Math.floor(Math.random() * 500) + 50,
      dofollow: Math.floor(Math.random() * 300) + 30,
      uniqueDomains: Math.floor(Math.random() * 100) + 20,
      domainAuthority: Math.floor(Math.random() * 50) + 40
    },
    
    // Rankings (simulated)
    rankings: {
      currentPosition: Math.floor(Math.random() * 20) + 1,
      estimatedTraffic: Math.floor(Math.random() * 5000) + 500,
      visibility: Math.random() * 100
    },
    
    // Content topics (extracted from simulated analysis)
    topics: generateCompetitorTopics(targetKeyword),
    
    // Strengths and weaknesses
    strengths: [],
    weaknesses: [],
    
    // Overall content score
    contentScore: 0
  };

  // Calculate content score
  analysis.contentScore = calculateCompetitorContentScore(analysis);
  
  // Identify strengths and weaknesses
  analysis.strengths = identifyStrengths(analysis);
  analysis.weaknesses = identifyWeaknesses(analysis);

  // Update competitor record
  competitor.lastAnalyzed = new Date().toISOString();
  competitor.contentCount++;

  competitorAnalyses.set(analysis.id, analysis);
  return analysis;
}

/**
 * Compare own content with competitor
 */
function compareWithCompetitor(data) {
  const { ownContentAnalysis, competitorAnalysisId } = data;

  const competitorAnalysis = competitorAnalyses.get(competitorAnalysisId);
  if (!competitorAnalysis) {
    throw new Error('Competitor analysis not found');
  }

  const comparison = {
    comparedAt: new Date().toISOString(),
    
    wordCount: {
      own: ownContentAnalysis.wordCount || 0,
      competitor: competitorAnalysis.content.wordCount,
      difference: (ownContentAnalysis.wordCount || 0) - competitorAnalysis.content.wordCount,
      winner: (ownContentAnalysis.wordCount || 0) > competitorAnalysis.content.wordCount ? 'own' : 'competitor'
    },
    
    headingStructure: {
      own: ownContentAnalysis.headings || { h2: 0, h3: 0 },
      competitor: competitorAnalysis.content.headings,
      winner: (ownContentAnalysis.headings?.h2 || 0) > competitorAnalysis.content.headings.h2 ? 'own' : 'competitor'
    },
    
    multimedia: {
      own: { images: ownContentAnalysis.images || 0, videos: ownContentAnalysis.videos || 0 },
      competitor: { images: competitorAnalysis.content.images, videos: competitorAnalysis.content.videos },
      winner: (ownContentAnalysis.images || 0) > competitorAnalysis.content.images ? 'own' : 'competitor'
    },
    
    seoScore: {
      own: ownContentAnalysis.seoScore || 0,
      competitor: competitorAnalysis.contentScore,
      difference: (ownContentAnalysis.seoScore || 0) - competitorAnalysis.contentScore,
      winner: (ownContentAnalysis.seoScore || 0) > competitorAnalysis.contentScore ? 'own' : 'competitor'
    },
    
    backlinks: {
      own: ownContentAnalysis.backlinks || 0,
      competitor: competitorAnalysis.backlinks.total,
      difference: (ownContentAnalysis.backlinks || 0) - competitorAnalysis.backlinks.total,
      winner: (ownContentAnalysis.backlinks || 0) > competitorAnalysis.backlinks.total ? 'own' : 'competitor'
    },
    
    gaps: identifyContentGaps(ownContentAnalysis, competitorAnalysis),
    opportunities: identifyOpportunities(ownContentAnalysis, competitorAnalysis),
    recommendations: generateComparisonRecommendations(ownContentAnalysis, competitorAnalysis)
  };

  return comparison;
}

/**
 * Identify content gaps
 */
function identifyContentGaps(data) {
  const { competitorAnalysisIds = [], ownTopics = [] } = data;

  const analyses = competitorAnalysisIds.map(id => {
    const analysis = competitorAnalyses.get(id);
    if (!analysis) throw new Error(`Analysis ${id} not found`);
    return analysis;
  });

  // Collect competitor topics
  const competitorTopics = new Map();
  analyses.forEach(analysis => {
    analysis.topics.forEach(topic => {
      if (!competitorTopics.has(topic.name)) {
        competitorTopics.set(topic.name, {
          name: topic.name,
          coveredBy: [],
          averageDepth: 0,
          priority: 'medium'
        });
      }
      const topicData = competitorTopics.get(topic.name);
      topicData.coveredBy.push(analysis.competitorName);
      topicData.averageDepth += topic.depth;
    });
  });

  // Calculate average depth and identify gaps
  const gaps = [];
  competitorTopics.forEach(topic => {
    topic.averageDepth /= topic.coveredBy.length;
    
    // Check if own content covers this topic
    const ownCoverage = ownTopics.find(t => t.toLowerCase().includes(topic.name.toLowerCase()));
    
    if (!ownCoverage) {
      gaps.push({
        topic: topic.name,
        coveredByCompetitors: topic.coveredBy.length,
        averageDepth: topic.averageDepth,
        priority: topic.coveredBy.length >= analyses.length * 0.6 ? 'high' : 'medium',
        recommendation: `Create content covering "${topic.name}" - covered by ${topic.coveredBy.length}/${analyses.length} competitors`
      });
    }
  });

  return {
    totalGaps: gaps.length,
    highPriority: gaps.filter(g => g.priority === 'high').length,
    gaps: gaps.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return b.coveredByCompetitors - a.coveredByCompetitors;
    })
  };
}

/**
 * Get SERP analysis for keyword
 */
function analyzeSERP(data) {
  const { keyword, ownUrl = null } = data;

  // Simulated SERP analysis
  const serpResults = [];
  for (let position = 1; position <= 10; position++) {
    serpResults.push({
      position,
      url: `https://example-${position}.com`,
      title: `Sample Title ${position} for ${keyword}`,
      domain: `example-${position}.com`,
      wordCount: Math.floor(Math.random() * 2000) + 800,
      domainAuthority: Math.floor(Math.random() * 50) + 40,
      backlinks: Math.floor(Math.random() * 1000) + 100,
      hasVideo: Math.random() > 0.7,
      hasFeaturedSnippet: position === 1 && Math.random() > 0.7,
      contentType: ['article', 'guide', 'list', 'tutorial'][Math.floor(Math.random() * 4)]
    });
  }

  // Calculate averages
  const averages = {
    wordCount: Math.round(serpResults.reduce((sum, r) => sum + r.wordCount, 0) / serpResults.length),
    domainAuthority: Math.round(serpResults.reduce((sum, r) => sum + r.domainAuthority, 0) / serpResults.length),
    backlinks: Math.round(serpResults.reduce((sum, r) => sum + r.backlinks, 0) / serpResults.length)
  };

  // Content type distribution
  const contentTypes = serpResults.reduce((acc, r) => {
    acc[r.contentType] = (acc[r.contentType] || 0) + 1;
    return acc;
  }, {});

  return {
    keyword,
    analyzedAt: new Date().toISOString(),
    topResults: serpResults.slice(0, 3),
    allResults: serpResults,
    averages,
    contentTypeDistribution: contentTypes,
    featuredSnippetPresent: serpResults.some(r => r.hasFeaturedSnippet),
    videoResultsCount: serpResults.filter(r => r.hasVideo).length,
    recommendations: [
      `Target word count: ${averages.wordCount} words (SERP average)`,
      `Most common content type: ${Object.entries(contentTypes).sort((a, b) => b[1] - a[1])[0][0]}`,
      `${serpResults.filter(r => r.hasVideo).length}/10 results include video - consider adding video content`,
      serpResults.some(r => r.hasFeaturedSnippet) ? 'Featured snippet opportunity available' : 'No featured snippet currently shown'
    ]
  };
}

/**
 * Get competitor statistics
 */
function getCompetitorStatistics() {
  const allCompetitors = Array.from(competitors.values());
  const allAnalyses = Array.from(competitorAnalyses.values());

  return {
    totalCompetitors: allCompetitors.length,
    totalAnalyses: allAnalyses.length,
    averageContentScore: allAnalyses.reduce((sum, a) => sum + a.contentScore, 0) / allAnalyses.length || 0,
    topCompetitors: allCompetitors
      .map(c => ({
        id: c.id,
        name: c.name,
        contentCount: c.contentCount,
        lastAnalyzed: c.lastAnalyzed
      }))
      .sort((a, b) => b.contentCount - a.contentCount)
      .slice(0, 5),
    averageMetrics: {
      wordCount: Math.round(allAnalyses.reduce((sum, a) => sum + a.content.wordCount, 0) / allAnalyses.length || 0),
      backlinks: Math.round(allAnalyses.reduce((sum, a) => sum + a.backlinks.total, 0) / allAnalyses.length || 0),
      images: Math.round(allAnalyses.reduce((sum, a) => sum + a.content.images, 0) / allAnalyses.length || 0)
    }
  };
}

// Helper functions

function generateCompetitorTopics(targetKeyword) {
  const baseTopics = [
    { name: `${targetKeyword} basics`, depth: Math.random() * 50 + 50, wordCount: Math.floor(Math.random() * 300) + 200 },
    { name: `${targetKeyword} benefits`, depth: Math.random() * 50 + 50, wordCount: Math.floor(Math.random() * 300) + 200 },
    { name: `How to use ${targetKeyword}`, depth: Math.random() * 50 + 50, wordCount: Math.floor(Math.random() * 400) + 300 },
    { name: `${targetKeyword} best practices`, depth: Math.random() * 50 + 50, wordCount: Math.floor(Math.random() * 400) + 300 },
    { name: `${targetKeyword} examples`, depth: Math.random() * 50 + 50, wordCount: Math.floor(Math.random() * 300) + 200 }
  ];

  // Randomly select 3-5 topics
  const count = Math.floor(Math.random() * 3) + 3;
  return baseTopics.slice(0, count);
}

function calculateCompetitorContentScore(analysis) {
  let score = 0;
  
  // Content depth (0-25 points)
  if (analysis.content.wordCount >= 2000) score += 25;
  else if (analysis.content.wordCount >= 1000) score += 18;
  else score += 10;
  
  // SEO optimization (0-25 points)
  if (analysis.seo.keywordInTitle) score += 8;
  if (analysis.seo.keywordInMeta) score += 7;
  if (analysis.seo.hasSchema) score += 10;
  
  // Structure (0-20 points)
  if (analysis.content.headings.h2 >= 3) score += 10;
  if (analysis.content.lists >= 2) score += 10;
  
  // Multimedia (0-15 points)
  if (analysis.content.images >= 3) score += 8;
  if (analysis.content.videos >= 1) score += 7;
  
  // Link profile (0-15 points)
  if (analysis.backlinks.total >= 100) score += 8;
  if (analysis.backlinks.uniqueDomains >= 50) score += 7;
  
  return Math.min(100, score);
}

function identifyStrengths(analysis) {
  const strengths = [];
  
  if (analysis.content.wordCount >= 2000) {
    strengths.push('Comprehensive content length');
  }
  
  if (analysis.seo.hasSchema) {
    strengths.push('Schema markup implementation');
  }
  
  if (analysis.content.videos >= 1) {
    strengths.push('Video content integration');
  }
  
  if (analysis.backlinks.total >= 200) {
    strengths.push('Strong backlink profile');
  }
  
  if (analysis.rankings.currentPosition <= 3) {
    strengths.push(`Top 3 ranking (position ${analysis.rankings.currentPosition})`);
  }
  
  if (analysis.seo.pagespeed >= 85) {
    strengths.push('Excellent page speed');
  }
  
  return strengths;
}

function identifyWeaknesses(analysis) {
  const weaknesses = [];
  
  if (analysis.content.wordCount < 800) {
    weaknesses.push('Content too short');
  }
  
  if (!analysis.seo.keywordInTitle) {
    weaknesses.push('Target keyword not in title');
  }
  
  if (!analysis.seo.hasSchema) {
    weaknesses.push('Missing schema markup');
  }
  
  if (analysis.content.images < 2) {
    weaknesses.push('Insufficient visual content');
  }
  
  if (analysis.backlinks.total < 50) {
    weaknesses.push('Weak backlink profile');
  }
  
  if (analysis.readability.fleschReadingEase < 50) {
    weaknesses.push('Difficult readability');
  }
  
  return weaknesses;
}

function identifyOpportunities(ownContentAnalysis, competitorAnalysis) {
  const opportunities = [];
  
  if ((ownContentAnalysis.wordCount || 0) > competitorAnalysis.content.wordCount) {
    opportunities.push({
      type: 'content_depth',
      description: `Your content is ${(ownContentAnalysis.wordCount || 0) - competitorAnalysis.content.wordCount} words longer`,
      advantage: 'high'
    });
  }
  
  if ((ownContentAnalysis.images || 0) > competitorAnalysis.content.images) {
    opportunities.push({
      type: 'visual_content',
      description: 'More images than competitor',
      advantage: 'medium'
    });
  }
  
  if (!competitorAnalysis.seo.hasSchema && (ownContentAnalysis.hasSchema || false)) {
    opportunities.push({
      type: 'technical_seo',
      description: 'You have schema markup, competitor does not',
      advantage: 'high'
    });
  }
  
  return opportunities;
}

function generateComparisonRecommendations(ownContentAnalysis, competitorAnalysis) {
  const recommendations = [];
  
  if ((ownContentAnalysis.wordCount || 0) < competitorAnalysis.content.wordCount) {
    recommendations.push({
      priority: 'high',
      action: 'Expand content',
      details: `Add ${competitorAnalysis.content.wordCount - (ownContentAnalysis.wordCount || 0)} more words to match competitor depth`
    });
  }
  
  if ((ownContentAnalysis.images || 0) < competitorAnalysis.content.images) {
    recommendations.push({
      priority: 'medium',
      action: 'Add more images',
      details: `Competitor has ${competitorAnalysis.content.images} images, you have ${ownContentAnalysis.images || 0}`
    });
  }
  
  if (competitorAnalysis.content.videos > 0 && !(ownContentAnalysis.hasVideo || false)) {
    recommendations.push({
      priority: 'high',
      action: 'Add video content',
      details: 'Competitor includes video, which can boost engagement'
    });
  }
  
  if (competitorAnalysis.seo.hasSchema && !(ownContentAnalysis.hasSchema || false)) {
    recommendations.push({
      priority: 'high',
      action: 'Implement schema markup',
      details: 'Competitor uses schema for enhanced SERP appearance'
    });
  }
  
  return recommendations;
}

module.exports = {
  addCompetitor,
  analyzeCompetitorContent,
  compareWithCompetitor,
  identifyContentGaps,
  analyzeSERP,
  getCompetitorStatistics
};
