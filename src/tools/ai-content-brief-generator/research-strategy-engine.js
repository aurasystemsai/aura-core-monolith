const crypto = require('crypto');

// ============================================================================
// DATA STORES
// ============================================================================

const briefs = new Map();
const researchNotes = new Map();
const competitors = new Map();
const trends = new Map();
const keywords = new Map();
const audiences = new Map();
const contentGaps = new Map();
const strategicFrameworks = new Map();
const researchProjects = new Map();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function calculateScore(metrics) {
  const weights = {
    relevance: 0.25,
    searchVolume: 0.20,
    competition: 0.15,
    alignment: 0.20,
    feasibility: 0.20
  };
  
  let score = 0;
  Object.keys(weights).forEach(key => {
    score += (metrics[key] || 50) * weights[key];
  });
  
  return Math.round(score);
}

// ============================================================================
// BRIEF MANAGEMENT
// ============================================================================

function generateBrief(data = {}) {
  const briefId = data.briefId || generateId('brief');
  const payload = {
    briefId,
    topic: data.topic || 'Untitled brief',
    primaryKeyword: data.primaryKeyword || 'ai content brief',
    secondaryKeywords: data.secondaryKeywords || [],
    audience: data.audience || 'Content Marketing',
    goal: data.goal || 'Drive pipeline and SEO rankings',
    tone: data.tone || 'Confident & concise',
    persona: data.persona || 'Demand Gen Manager',
    status: data.status || 'draft',
    outline: data.outline || [],
    seo: data.seo || { primaryKeyword: 'ai content brief', secondaryKeywords: ['brief template'] },
    research: data.research || {
      questions: ['What problem are we solving?', 'Who is the decision maker?', 'What proof points matter most?'],
      competitors: [],
      differentiators: ['Workflow automation', 'Compliance guardrails'],
      sources: [],
      insights: []
    },
    strategicFramework: data.strategicFramework || null,
    targetWordCount: data.targetWordCount || 2000,
    priority: data.priority || 'medium',
    deadline: data.deadline || null,
    assignedTo: data.assignedTo || null,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    score: data.score || calculateScore({ relevance: 70, searchVolume: 80, competition: 60, alignment: 75, feasibility: 85 }),
    risks: data.risks || [],
    opportunities: data.opportunities || [],
    contentGaps: data.contentGaps || [],
    competitiveAdvantages: data.competitiveAdvantages || []
  };

  briefs.set(briefId, payload);
  
  logResearchInsight(briefId, `Created brief for ${payload.topic}`, 'system');

  return payload;
}

function getBrief(briefId) {
  if (!briefs.has(briefId)) {
    throw new Error('Brief not found');
  }
  return briefs.get(briefId);
}

function updateBrief(briefId, updates) {
  if (!briefs.has(briefId)) {
    throw new Error('Brief not found');
  }
  
  const brief = briefs.get(briefId);
  const updated = {
    ...brief,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  briefs.set(briefId, updated);
  logResearchInsight(briefId, `Updated brief: ${Object.keys(updates).join(', ')}`, 'system');
  
  return updated;
}

function deleteBrief(briefId) {
  if (!briefs.has(briefId)) {
    throw new Error('Brief not found');
  }
  
  briefs.delete(briefId);
  return { success: true, message: 'Brief deleted' };
}

function listBriefs(filters = {}) {
  let results = Array.from(briefs.values());
  
  if (filters.status) {
    results = results.filter(b => b.status === filters.status);
  }
  
  if (filters.priority) {
    results = results.filter(b => b.priority === filters.priority);
  }
  
  if (filters.assignedTo) {
    results = results.filter(b => b.assignedTo === filters.assignedTo);
  }
  
  if (filters.minScore) {
    results = results.filter(b => b.score >= filters.minScore);
  }
  
  return results;
}

// ============================================================================
// IDEA SCORING & VALIDATION
// ============================================================================

function scoreIdea(input = {}) {
  const metrics = {
    relevance: input.relevance || (70 + Math.round(Math.random() * 30)),
    searchVolume: input.searchVolume || (60 + Math.round(Math.random() * 40)),
    competition: input.competition || (50 + Math.round(Math.random() * 30)),
    alignment: input.alignment || (75 + Math.round(Math.random() * 25)),
    feasibility: input.feasibility || (80 + Math.round(Math.random() * 20))
  };
  
  const overallScore = calculateScore(metrics);
  const confidence = overallScore > 85 ? 'high' : overallScore > 70 ? 'medium' : 'low';
  
  const risks = [];
  if (metrics.competition > 80) risks.push('High competition in search results');
  if (metrics.alignment < 60) risks.push('Weak ICP alignment');
  if (metrics.feasibility < 50) risks.push('Resource constraints');
  if (metrics.searchVolume < 40) risks.push('Low search demand');
  
  const recommendations = [];
  if (metrics.relevance < 70) recommendations.push('Strengthen topic relevance to audience');
  if (metrics.searchVolume < 60) recommendations.push('Consider adjacent keywords with higher volume');
  if (metrics.competition > 75) recommendations.push('Differentiate with unique angle or data');
  if (metrics.alignment < 70) recommendations.push('Refine messaging for target persona');
  
  return {
    idea: input.idea || 'New content idea',
    topic: input.topic,
    overallScore,
    metrics,
    confidence,
    risks,
    recommendations,
    viability: overallScore > 75 ? 'High' : overallScore > 60 ? 'Medium' : 'Low',
    estimatedImpact: overallScore > 80 ? 'Significant' : 'Moderate',
    scoredAt: new Date().toISOString()
  };
}

function validateBriefQuality(briefId) {
  const brief = getBrief(briefId);
  
  const checks = {
    hasTopic: !!brief.topic,
    hasKeywords: brief.secondaryKeywords && brief.secondaryKeywords.length > 0,
    hasAudience: !!brief.audience,
    hasGoal: !!brief.goal,
    hasOutline: brief.outline && brief.outline.length > 0,
    hasResearch: brief.research && brief.research.questions && brief.research.questions.length > 0,
    hasFramework: !!brief.strategicFramework,
    hasWordCount: !!brief.targetWordCount
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const qualityScore = Math.round((passedChecks / totalChecks) * 100);
  
  return {
    briefId,
    qualityScore,
    checks,
    passed: qualityScore >= 80,
    grade: qualityScore >= 90 ? 'A' : qualityScore >= 80 ? 'B' : qualityScore >= 70 ? 'C' : 'D',
    recommendations: Object.entries(checks)
      .filter(([key, passed]) => !passed)
      .map(([key]) => `Complete ${key.replace('has', '').toLowerCase()}`)
  };
}

// ============================================================================
// STRATEGIC FRAMEWORKS
// ============================================================================

function generateFrameworks(industry = 'SaaS') {
  const frameworks = {
    'Pain-Agitate-Solve': {
      name: 'Pain-Agitate-Solve',
      suitability: 90,
      description: 'Identify pain, amplify urgency, present solution',
      structure: ['Pain Point', 'Amplification', 'Solution', 'Proof', 'CTA'],
      bestFor: ['Problem-aware audiences', 'Solution comparisons']
    },
    'Problem-Solution-Proof': {
      name: 'Problem-Solution-Proof',
      suitability: 92,
      description: 'Frame problem, introduce solution, validate with proof',
      structure: ['Problem Definition', 'Solution Overview', 'Proof Points', 'Implementation', 'Results'],
      bestFor: ['Decision-makers', 'ROI-focused content']
    },
    'Jobs-To-Be-Done': {
      name: 'Jobs To Be Done',
      suitability: 88,
      description: 'Frame content around the job customer needs to accomplish',
      structure: ['Job Context', 'Current State', 'Desired State', 'Enablers', 'Success Criteria'],
      bestFor: ['Product marketing', 'Use case content']
    },
    'StoryBrand': {
      name: 'StoryBrand',
      suitability: 85,
      description: 'Position customer as hero with brand as guide',
      structure: ['Character', 'Problem', 'Guide', 'Plan', 'Call to Action', 'Success', 'Failure'],
      bestFor: ['Brand awareness', 'Emotional connection']
    },
    'AIDA': {
      name: 'AIDA (Attention-Interest-Desire-Action)',
      suitability: 83,
      description: 'Classic conversion-focused framework',
      structure: ['Attention Hook', 'Interest Building', 'Desire Creation', 'Action Prompt'],
      bestFor: ['Landing pages', 'Conversion content']
    },
    'Feature-Advantage-Benefit': {
      name: 'Feature-Advantage-Benefit (FAB)',
      suitability: 80,
      description: 'Connect features to tangible benefits',
      structure: ['Feature', 'Advantage', 'Benefit', 'Proof', 'Application'],
      bestFor: ['Product launches', 'Feature announcements']
    }
  };
  
  return {
    industry,
    frameworks: Object.values(frameworks),
    recommended: industry === 'SaaS' ? 'Problem-Solution-Proof' : 'Pain-Agitate-Solve'
  };
}

function applyFramework(briefId, frameworkName) {
  const brief = getBrief(briefId);
  const frameworks = generateFrameworks(brief.industry || 'SaaS');
  const framework = frameworks.frameworks.find(f => f.name === frameworkName);
  
  if (!framework) {
    throw new Error(`Framework "${frameworkName}" not found`);
  }
  
  const outline = framework.structure.map(section => ({
    section,
    notes: `Complete ${section.toLowerCase()} section`,
    targetWords: Math.round(brief.targetWordCount / framework.structure.length)
  }));
  
  return updateBrief(briefId, {
    strategicFramework: frameworkName,
    outline
  });
}

// ============================================================================
// RESEARCH & COMPETITIVE ANALYSIS
// ============================================================================

function researchQuestions(topic = 'AI content brief') {
  const questionTypes = {
    awareness: [
      `What is ${topic}?`,
      `Why does ${topic} matter?`,
      `Who needs ${topic}?`
    ],
    consideration: [
      `How does ${topic} work?`,
      `What are the benefits of ${topic}?`,
      `How to implement ${topic}?`
    ],
    decision: [
      `Which ${topic} solution is best?`,
      `What does ${topic} cost?`,
      `How long does ${topic} take to implement?`
    ],
    retention: [
      `How to optimize ${topic}?`,
      `What are advanced ${topic} techniques?`,
      `How to measure ${topic} success?`
    ]
  };
  
  return {
    topic,
    questionsByStage: questionTypes,
    allQuestions: Object.values(questionTypes).flat(),
    priorityQuestions: [
      `What problem does ${topic} solve?`,
      `How is ${topic} different from alternatives?`,
      `What results can I expect from ${topic}?`
    ]
  };
}

function researchThemes(sector = 'B2B') {
  const themesBySector = {
    'B2B': [
      { name: 'Efficiency & Productivity', signals: ['automation', 'workflow', 'time to value', 'ROI'], priority: 'high', impact: 90 },
      { name: 'Risk & Compliance', signals: ['governance', 'PII', 'audits', 'security', 'GDPR'], priority: 'high', impact: 85 },
      { name: 'Performance & Growth', signals: ['pipeline', 'conversions', 'revenue', 'scale'], priority: 'high', impact: 92 },
      { name: 'Integration & Ecosystem', signals: ['API', 'integration', 'platform', 'ecosystem'], priority: 'medium', impact: 75 },
      { name: 'Innovation & Differentiation', signals: ['AI', 'ML', 'innovation', 'competitive edge'], priority: 'medium', impact: 80 }
    ],
    'B2C': [
      { name: 'Value & Savings', signals: ['discount', 'value', 'savings', 'affordable'], priority: 'high', impact: 95 },
      { name: 'Convenience & Experience', signals: ['easy', 'simple', 'fast', 'convenient'], priority: 'high', impact: 90 },
      { name: 'Trust & Social Proof', signals: ['review', 'rating', 'testimonial', 'trusted'], priority: 'high', impact: 88 },
      { name: 'Personalization', signals: ['personalized', 'custom', 'tailored', 'unique'], priority: 'medium', impact: 82 },
      { name: 'Community & Belonging', signals: ['community', 'tribe', 'movement', 'belonging'], priority: 'medium', impact: 78 }
    ],
    'SaaS': [
      { name: 'Rapid Time-to-Value', signals: ['quick setup', 'instant', 'ready', 'launch'], priority: 'high', impact: 93 },
      { name: 'Scalability & Flexibility', signals: ['scale', 'flexible', 'adapt', 'grow'], priority: 'high', impact: 91 },
      { name: 'Data & Analytics', signals: ['insights', 'analytics', 'data-driven', 'metrics'], priority: 'high', impact: 89 },
      { name: 'Collaboration & Workflow', signals: ['team', 'collaborate', 'workflow', 'share'], priority: 'medium', impact: 85 },
      { name: 'Automation & AI', signals: ['automate', 'AI', 'smart', 'intelligent'], priority: 'medium', impact: 87 }
    ]
  };
  
  return {
    sector,
    themes: themesBySector[sector] || themesBySector['B2B'],
    topThemes: (themesBySector[sector] || themesBySector['B2B'])
      .filter(t => t.priority === 'high')
      .sort((a, b) => b.impact - a.impact)
  };
}

function analyzeCompetitor(competitorData) {
  const competitorId = generateId('comp');
  
  const analysis = {
    id: competitorId,
    name: competitorData.name,
    url: competitorData.url,
    contentVolume: competitorData.contentVolume || 0,
    topKeywords: competitorData.topKeywords || [],
    contentTypes: competitorData.contentTypes || [],
    publishingFrequency: competitorData.publishingFrequency || 'unknown',
    topPerformingContent: competitorData.topPerformingContent || [],
    strengths: competitorData.strengths || [],
    weaknesses: competitorData.weaknesses || [],
    contentGaps: competitorData.contentGaps || [],
    differentiationOpportunities: [],
    analyzedAt: new Date().toISOString()
  };
  
  // Identify differentiation opportunities
  if (analysis.weaknesses.length > 0) {
    analysis.differentiationOpportunities.push('Address competitor weaknesses');
  }
  if (analysis.contentGaps.length > 0) {
    analysis.differentiationOpportunities.push('Fill content gaps  competitor missed');
  }
  
  competitors.set(competitorId, analysis);
  
  return analysis;
}

function identifyContentGaps(briefId, competitorIds = []) {
  const brief = getBrief(briefId);
  const competitorAnalyses = competitorIds.map(id => competitors.get(id)).filter(Boolean);
  
  const allCompetitorKeywords = new Set();
  competitorAnalyses.forEach(comp => {
    comp.topKeywords.forEach(kw => allCompetitorKeywords.add(kw));
  });
  
  const gaps = [];
  
  // Keyword gaps
  const ourKeywords = new Set([brief.primaryKeyword, ...(brief.secondaryKeywords || [])]);
  allCompetitorKeywords.forEach(kw => {
    if (!ourKeywords.has(kw)) {
      gaps.push({
        type: 'keyword',
        value: kw,
        opportunity: 'high',
        recommendation: `Consider targeting "${kw}"`
      });
    }
  });
  
  // Content type gaps
  const competitorContentTypes = new Set();
  competitorAnalyses.forEach(comp => {
    comp.contentTypes.forEach(type => competitorContentTypes.add(type));
  });
  
  const ourContentTypes = new Set(['blog post']); // Default
  competitorContentTypes.forEach(type => {
    if (!ourContentTypes.has(type)) {
      gaps.push({
        type: 'content_type',
        value: type,
        opportunity: 'medium',
        recommendation: `Explore ${type} format`
      });
    }
  });
  
  const gapId = generateId('gap');
  const gapAnalysis = {
    id: gapId,
    briefId,
    gaps,
    competitorsAnalyzed: competitorIds.length,
    totalGaps: gaps.length,
    highOpportunity: gaps.filter(g => g.opportunity === 'high').length,
    analyzedAt: new Date().toISOString()
  };
  
  contentGaps.set(gapId, gapAnalysis);
  
  return gapAnalysis;
}

// ============================================================================
// TREND ANALYSIS
// ============================================================================

function identifyTrends(topic, timeframe = '30d') {
  const trendId = generateId('trend');
  
  const mockTrends = {
    rising: [
      { term: `${topic} automation`, growth: 45, volume: 8500 },
      { term: `${topic} AI`, growth: 38, volume: 12000 },
      { term: `${topic} integration`, growth: 28, volume: 6500 }
    ],
    stable: [
      { term: `${topic} best practices`, growth: 5, volume: 15000 },
      { term: `how to ${topic}`, growth: 3, volume: 22000 }
    ],
    declining: [
      { term: `${topic} manual`, growth: -15, volume: 3500 }
    ]
  };
  
  const analysis = {
    id: trendId,
    topic,
    timeframe,
    trends: mockTrends,
    topRising: mockTrends.rising.sort((a, b) => b.growth - a.growth)[0],
    recommendation: `Focus on rising trend: ${mockTrends.rising[0].term}`,
    analyzedAt: new Date().toISOString()
  };
  
  trends.set(trendId, analysis);
  
  return analysis;
}

// ============================================================================
// KEYWORD RESEARCH
// ============================================================================

function researchKeywords(seedKeyword, options = {}) {
  const keywordId = generateId('kw');
  
  const related = [
    { keyword: `${seedKeyword} tool`, volume: 8500, difficulty: 45, cpc: 12.50 },
    { keyword: `${seedKeyword} software`, volume: 12000, difficulty: 58, cpc: 18.30 },
    { keyword: `${seedKeyword} guide`, volume: 6500, difficulty: 35, cpc: 5.20 },
    { keyword: `best ${seedKeyword}`, volume: 15000, difficulty: 72, cpc: 22.00 },
    { keyword: `${seedKeyword} template`, volume: 5200, difficulty: 28, cpc: 3.80 }
  ];
  
  const longtail = related.map(kw => ({
    ...kw,
    keyword: `${kw.keyword} for ${options.industry || 'business'}`,
    volume: Math.round(kw.volume * 0.3),
    difficulty: Math.round(kw.difficulty * 0.7)
  }));
  
  const analysis = {
    id: keywordId,
    seedKeyword,
    relatedKeywords: related,
    longtailKeywords: longtail,
    topOpportunities: related
      .filter(kw => kw.difficulty < 50 && kw.volume > 5000)
      .sort((a, b) => b.volume - a.volume),
    totalKeywords: related.length + longtail.length,
    analyzedAt: new Date().toISOString()
  };
  
  keywords.set(keywordId, analysis);
  
  return analysis;
}

// ============================================================================
// AUDIENCE & ICP RESEARCH
// ============================================================================

function defineAudience(audienceData) {
  const audienceId = generateId('aud');
  
  const profile = {
    id: audienceId,
    name: audienceData.name,
    jobTitles: audienceData.jobTitles || [],
    industries: audienceData.industries || [],
    companySize: audienceData.companySize || 'all',
    painPoints: audienceData.painPoints || [],
    goals: audienceData.goals || [],
    informationNeeds: audienceData.informationNeeds || [],
    preferredFormats: audienceData.preferredFormats || ['blog', 'guide', 'video'],
    buyingStage: audienceData.buyingStage || 'awareness',
    decisionCriteria: audienceData.decisionCriteria || [],
    createdAt: new Date().toISOString()
  };
  
  audiences.set(audienceId, profile);
  
  return profile;
}

function alignBriefToAudience(briefId, audienceId) {
  const brief = getBrief(briefId);
  const audience = audiences.get(audienceId);
  
  if (!audience) {
    throw new Error('Audience not found');
  }
  
  const alignmentScore = calculateScore({
    relevance: 80,
    alignment: 90,
    feasibility: 85,
    searchVolume: 70,
    competition: 60
  });
  
  const recommendations = [];
  
  if (audience.painPoints.length > 0) {
    recommendations.push(`Address pain point: ${audience.painPoints[0]}`);
  }
  
  if (audience.preferredFormats.length > 0 && !audience.preferredFormats.includes('blog')) {
    recommendations.push(`Consider ${audience.preferredFormats[0]} format for this audience`);
  }
  
  return {
    briefId,
    audienceId,
    audience: audience.name,
    alignmentScore,
    recommendations,
    alignedAt: new Date().toISOString()
  };
}

// ============================================================================
// RESEARCH NOTES & INSIGHTS
// ============================================================================

function logResearchInsight(briefId, note, author = 'researcher') {
  const noteId = generateId('note');
  const entry = {
    id: noteId,
    briefId,
    note,
    author,
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  
  if (!researchNotes.has(briefId)) {
    researchNotes.set(briefId, []);
  }
  
  researchNotes.get(briefId).push(entry);
  
  return entry;
}

function listResearchNotes(briefId) {
  if (!briefId) {
    const allNotes = [];
    researchNotes.forEach((notes, id) => {
      allNotes.push(...notes);
    });
    return allNotes;
  }
  
  return researchNotes.get(briefId) || [];
}

function getResearchInsights(briefId) {
  const notes = listResearchNotes(briefId);
  const brief = getBrief(briefId);
  
  return {
    briefId,
    topic: brief.topic,
    totalNotes: notes.length,
    notes: notes.slice(-10), // Last 10 notes
    keyInsights: notes.filter(n => n.note.toLowerCase().includes('insight')),
    recentActivity: notes.filter(n => Date.now() - n.timestamp < 24 * 60 * 60 * 1000) // Last 24h
  };
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

function getStats() {
  const scores = Array.from(briefs.values()).map((b) => b.score || 0);
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  
  return {
    totalBriefs: briefs.size,
    totalCompetitors: competitors.size,
    totalKeywordResearch: keywords.size,
    totalAudiences: audiences.size,
    totalContentGaps: contentGaps.size,
    averageScore,
    statuses: Array.from(briefs.values()).reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {}),
    priorities: Array.from(briefs.values()).reduce((acc, b) => {
      acc[b.priority] = (acc[b.priority] || 0) + 1;
      return acc;
    }, {}),
    highScoreBriefs: scores.filter(s => s >= 80).length,
    mediumScoreBriefs: scores.filter(s => s >= 60 && s < 80).length,
    lowScoreBriefs: scores.filter(s => s < 60).length
  };
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  // Brief Management
  generateBrief,
  getBrief,
  updateBrief,
  deleteBrief,
  listBriefs,
  
  // Idea Scoring
  scoreIdea,
  validateBriefQuality,
  
  // Strategic Frameworks
  generateFrameworks,
  applyFramework,
  
  // Research
  researchQuestions,
  researchThemes,
  analyzeCompetitor,
  identifyContentGaps,
  
  // Trends & Keywords
  identifyTrends,
  researchKeywords,
  
  // Audience
  defineAudience,
  alignBriefToAudience,
  
  // Research Notes
  logResearchInsight,
  listResearchNotes,
  getResearchInsights,
  
  // Statistics
  getStats,
};
