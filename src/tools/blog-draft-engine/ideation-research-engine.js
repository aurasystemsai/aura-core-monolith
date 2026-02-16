/**
 * IDEATION & RESEARCH ENGINE
 * Blog topic ideation, intent scoring, ICP alignment, competitive gap analysis,
 * keyword opportunity discovery, and content pillar planning
 */

const crypto = require('crypto');

// In-memory stores
const ideas = new Map();
const intents = new Map();
const icpProfiles = new Map();
const competitorData = new Map();
const keywordOpportunities = new Map();
const contentPillars = new Map();

// ================================================================
// IDEA GENERATION
// ================================================================

function createIdea({ 
  topic, 
  angle, 
  audience, 
  primaryKeyword, 
  summary, 
  source = 'manual',
  metadata = {} 
}) {
  const ideaId = `idea-${crypto.randomBytes(4).toString('hex')}`;
  
  const idea = {
    ideaId,
    topic: topic || 'Evergreen content strategy',
    angle: angle || 'Playbook',
    audience: audience || 'Content & Growth',
    primaryKeyword: primaryKeyword || 'blog ideation',
    summary: summary || 'Deterministic idea generated',
    source,
    metadata,
    status: 'active',
    score: null,
    intentScore: null,
    icpScore: null,
    competitiveGap: null,
    keywordDifficulty: null,
    trafficPotential: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  ideas.set(ideaId, idea);
  
  // Auto-compute scores
  const intentResult = scoreIntent({ topic, audience, primaryKeyword });
  const icpResult = scoreICPAlignment({ topic, audience, angle });
  const competitiveResult = analyzeCompetitiveGap({ topic, primaryKeyword });
  
  idea.intentScore = intentResult.score;
  idea.icpScore = icpResult.score;
  idea.competitiveGap = competitiveResult.gap;
  idea.score = computeOverallIdeaScore(idea);
  ideas.set(ideaId, idea);
  return idea;
}

function getIdea(ideaId) {
  return ideas.get(ideaId) || null;
}

function listIdeas({ status, minScore, limit = 50, offset = 0 }) {
  let results = Array.from(ideas.values());
  
  if (status) {
    results = results.filter(i => i.status === status);
  }
  
  if (minScore !== undefined) {
    results = results.filter(i => i.score && i.score >= minScore);
  }
  
  results.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  return {
    ideas: results.slice(offset, offset + limit),
    total: results.length,
    offset,
    limit
  };
}

function updateIdea(ideaId, updates) {
  const idea = ideas.get(ideaId);
  if (!idea) return null;
  
  Object.assign(idea, updates);
  idea.updatedAt = new Date().toISOString();
  
  // Recompute score if key fields changed
  if (updates.topic || updates.audience || updates.primaryKeyword) {
    const intentResult = scoreIntent(idea);
    const icpResult = scoreICPAlignment(idea);
    const competitiveResult = analyzeCompetitiveGap(idea);
    
    idea.intentScore = intentResult.score;
    idea.icpScore = icpResult.score;
    idea.competitiveGap = competitiveResult.gap;
    idea.score = computeOverallIdeaScore(idea);
  }
  
  ideas.set(ideaId, idea);
  return idea;
}

function deleteIdea(ideaId) {
  return ideas.delete(ideaId);
}

function computeOverallIdeaScore(idea) {
  const weights = {
    intent: 0.35,
    icp: 0.30,
    competitive: 0.20,
    traffic: 0.15
  };
  
  const intent = idea.intentScore || 0;
  const icp = idea.icpScore || 0;
  const competitive = idea.competitiveGap || 0;
  const traffic = idea.trafficPotential || 0;
  
  return Math.round(
    intent * weights.intent +
    icp * weights.icp +
    competitive * weights.competitive +
    traffic * weights.traffic
  );
}

// ================================================================
// INTENT ANALYSIS
// ================================================================

function scoreIntent({ topic, audience, primaryKeyword, context = {} }) {
  const intentId = `intent-${crypto.randomBytes(4).toString('hex')}`;
  
  // Analyze search intent signals
  const alignment = analyzeIntentAlignment(topic, primaryKeyword);
  const depth = analyzeContentDepth(topic, context);
  const authority = analyzeAuthorityPotential(topic, audience);
  const relevance = analyzeTopicRelevance(topic, audience);
  
  const score = Math.round(
    alignment * 0.40 +
    depth * 0.25 +
    authority * 0.20 +
    relevance * 0.15
  );
  
  const grade = score >= 90 ? 'A' :
                score >= 80 ? 'B' :
                score >= 70 ? 'C' :
                score >= 60 ? 'D' : 'F';
  
  const intent = {
    intentId,
    topic,
    audience,
    primaryKeyword,
    score,
    grade,
    alignment,
    depth,
    authority,
    relevance,
    intentType: detectIntentType(primaryKeyword),
    searchVolume: estimateSearchVolume(primaryKeyword),
    difficulty: estimateKeywordDifficulty(primaryKeyword),
    createdAt: new Date().toISOString()
  };
  
  intents.set(intentId, intent);
  return intent;
}

function analyzeIntentAlignment(topic, primaryKeyword) {
  // Deterministic scoring based on keyword-topic coherence
  const topicWords = topic.toLowerCase().split(/\s+/);
  const keywordWords = primaryKeyword.toLowerCase().split(/\s+/);
  
  const overlap = topicWords.filter(w => keywordWords.includes(w)).length;
  const coverage = overlap / Math.max(topicWords.length, keywordWords.length);
  
  return Math.min(100, Math.round(70 + coverage * 30));
}

function analyzeContentDepth(topic, context) {
  // Score based on topic complexity and context richness
  const wordCount = topic.split(/\s+/).length;
  const contextKeys = Object.keys(context).length;
  
  const depthScore = Math.min(100, 
    60 + 
    Math.min(20, wordCount * 2) + 
    Math.min(20, contextKeys * 5)
  );
  
  return Math.round(depthScore);
}

function analyzeAuthorityPotential(topic, audience) {
  // Deterministic authority scoring
  const authoritySignals = [
    topic.toLowerCase().includes('guide') ? 15 : 0,
    topic.toLowerCase().includes('playbook') ? 15 : 0,
    topic.toLowerCase().includes('framework') ? 12 : 0,
    topic.toLowerCase().includes('best practice') ? 12 : 0,
    topic.toLowerCase().includes('strategy') ? 10 : 0,
    audience && audience.length > 5 ? 10 : 0
  ];
  
  const baseScore = 60;
  const signalBonus = authoritySignals.reduce((sum, s) => sum + s, 0);
  
  return Math.min(100, baseScore + signalBonus);
}

function analyzeTopicRelevance(topic, audience) {
  // Score relevance to target audience
  if (!audience || audience.length < 3) return 70;
  
  const audienceLower = audience.toLowerCase();
  const topicLower = topic.toLowerCase();
  
  const relevanceSignals = [
    topicLower.includes(audienceLower) ? 20 : 0,
    topicLower.includes('b2b') && audienceLower.includes('b2b') ? 15 : 0,
    topicLower.includes('saas') && audienceLower.includes('saas') ? 15 : 0,
    topicLower.includes('enterprise') && audienceLower.includes('enterprise') ? 12 : 0
  ];
  
  return Math.min(100, 65 + relevanceSignals.reduce((sum, s) => sum + s, 0));
}

function detectIntentType(keyword) {
  const keywordLower = keyword.toLowerCase();
  
  if (keywordLower.match(/how to|guide|tutorial|learn|step/)) {
    return 'informational';
  }
  
  if (keywordLower.match(/best|top|vs|compare|review/)) {
    return 'commercial';
  }
  
  if (keywordLower.match(/buy|price|cost|deal|discount/)) {
    return 'transactional';
  }
  
  if (keywordLower.match(/what is|define|meaning/)) {
    return 'navigational';
  }
  
  return 'informational';
}

function estimateSearchVolume(keyword) {
  // Deterministic volume estimation based on keyword characteristics
  const wordCount = keyword.split(/\s+/).length;
  const length = keyword.length;
  
  // Longer-tail = lower volume
  const baseVolume = 5000;
  const wordPenalty = (wordCount - 1) * 1000;
  const lengthPenalty = Math.max(0, (length - 15) * 50);
  
  return Math.max(100, baseVolume - wordPenalty - lengthPenalty);
}

function estimateKeywordDifficulty(keyword) {
  // Deterministic difficulty scoring
  const wordCount = keyword.split(/\s+/).length;
  
  // Shorter = harder
  if (wordCount === 1) return 85;
  if (wordCount === 2) return 70;
  if (wordCount === 3) return 55;
  if (wordCount === 4) return 40;
  return 30;
}

// ================================================================
// ICP ALIGNMENT
// ================================================================

function scoreICPAlignment({ topic, audience, angle, vertical = null }) {
  const icpId = `icp-${crypto.randomBytes(4).toString('hex')}`;
  
  const roleMatch = analyzeRoleMatch(audience);
  const painPointMatch = analyzePainPointMatch(topic, audience);
  const toneMatch = analyzeToneMatch(angle, audience);
  const verticalFit = analyzeVerticalFit(topic, vertical);
  
  const score = Math.round(
    roleMatch * 0.35 +
    painPointMatch * 0.30 +
    toneMatch * 0.20 +
    verticalFit * 0.15
  );
  
  const grade = score >= 90 ? 'A' :
                score >= 80 ? 'B' :
                score >= 70 ? 'C' : 'D';
  
  const icp = {
    icpId,
    topic,
    audience,
    angle,
    vertical,
    score,
    grade,
    roleMatch,
    painPointMatch,
    toneMatch,
    verticalFit,
    createdAt: new Date().toISOString()
  };
  
  icpProfiles.set(icpId, icp);
  return icp;
}

function analyzeRoleMatch(audience) {
  if (!audience) return 60;
  
  const audienceLower = audience.toLowerCase();
  const targetRoles = [
    'content',
    'marketing',
    'growth',
    'product',
    'founder',
    'ceo',
    'cmo',
    'vp'
  ];
  
  const matches = targetRoles.filter(role => audienceLower.includes(role)).length;
  return Math.min(100, 70 + matches * 10);
}

function analyzePainPointMatch(topic, audience) {
  const topicLower = topic.toLowerCase();
  
  const painPoints = [
    'scale',
    'velocity',
    'quality',
    'efficiency',
    'roi',
    'conversion',
    'retention',
    'churn'
  ];
  
  const matches = painPoints.filter(pain => topicLower.includes(pain)).length;
  return Math.min(100, 65 + matches * 12);
}

function analyzeToneMatch(angle, audience) {
  if (!angle) return 75;
  
  const angleLower = angle.toLowerCase();
  const audienceLower = (audience || '').toLowerCase();
  
  // Executive audience prefers frameworks/playbooks
  if (audienceLower.match(/ceo|founder|vp|director/)) {
    if (angleLower.match(/framework|playbook|strategy/)) return 95;
    if (angleLower.match(/guide|checklist/)) return 85;
    return 70;
  }
  
  // Practitioner audience prefers tactical content
  if (audienceLower.match(/manager|specialist|coordinator/)) {
    if (angleLower.match(/guide|checklist|tutorial/)) return 95;
    if (angleLower.match(/playbook|framework/)) return 80;
    return 70;
  }
  
  return 75;
}

function analyzeVerticalFit(topic, vertical) {
  if (!vertical) return 75;
  
  const topicLower = topic.toLowerCase();
  const verticalLower = vertical.toLowerCase();
  
  if (topicLower.includes(verticalLower)) return 95;
  
  // Industry-specific signals
  const verticalSignals = {
    'saas': ['software', 'platform', 'api', 'integration'],
    'ecommerce': ['product', 'cart', 'checkout', 'conversion'],
    'b2b': ['enterprise', 'sales', 'pipeline', 'account'],
    'fintech': ['payment', 'transaction', 'compliance', 'security']
  };
  
  const signals = verticalSignals[verticalLower] || [];
  const matches = signals.filter(sig => topicLower.includes(sig)).length;
  
  return Math.min(100, 70 + matches * 10);
}

// ================================================================
// COMPETITIVE GAP ANALYSIS
// ================================================================

function analyzeCompetitiveGap({ topic, primaryKeyword, competitors = [] }) {
  const gapId = `gap-${crypto.randomBytes(4).toString('hex')}`;
  
  const saturation = analyzeMarketSaturation(primaryKeyword);
  const differentiationPotential = analyzeDifferentiation(topic, competitors);
  const angleUniqueness = analyzeAngleUniqueness(topic);
  const contentQualityGap = analyzeQualityGap(competitors);
  
  const gap = Math.round(
    (100 - saturation) * 0.30 +
    differentiationPotential * 0.30 +
    angleUniqueness * 0.25 +
    contentQualityGap * 0.15
  );
  
  const competitive = {
    gapId,
    topic,
    primaryKeyword,
    gap,
    saturation,
    differentiationPotential,
    angleUniqueness,
    contentQualityGap,
    competitors: competitors.length,
    opportunity: gap >= 70 ? 'high' : gap >= 50 ? 'medium' : 'low',
    createdAt: new Date().toISOString()
  };
  
  competitorData.set(gapId, competitive);
  return competitive;
}

function analyzeMarketSaturation(keyword) {
  // Deterministic saturation scoring
  const difficulty = estimateKeywordDifficulty(keyword);
  const wordCount = keyword.split(/\s+/).length;
  
  // Shorter keywords = more saturated
  const saturationScore = Math.round(
    difficulty * 0.6 +
    Math.max(0, 50 - wordCount * 8) * 0.4
  );
  
  return Math.min(100, saturationScore);
}

function analyzeDifferentiation(topic, competitors) {
  if (competitors.length === 0) return 85;
  
  // Higher competitor count = harder to differentiate
  const competitorPenalty = Math.min(30, competitors.length * 3);
  
  return Math.max(50, 85 - competitorPenalty);
}

function analyzeAngleUniqueness(topic) {
  const topicLower = topic.toLowerCase();
  
  const uniqueAngles = [
    'playbook',
    'framework',
    'retro',
    'teardown',
    'behind the scenes',
    'contrarian',
    'unpopular opinion'
  ];
  
  const hasUniqueAngle = uniqueAngles.some(angle => topicLower.includes(angle));
  
  return hasUniqueAngle ? 90 : 70;
}

function analyzeQualityGap(competitors) {
  // Assume most existing content is mediocre
  const avgCompetitorQuality = 65;
  const ourTargetQuality = 90;
  
  return Math.min(100, ourTargetQuality - avgCompetitorQuality + 60);
}

// ================================================================
// KEYWORD OPPORTUNITY DISCOVERY
// ================================================================

function discoverKeywordOpportunities({ seed, limit = 20 }) {
  const opportunities = [];
  
  // Generate variations
  const prefixes = ['how to', 'best', 'top', 'guide to', 'tips for'];
  const suffixes = ['for beginners', 'in 2026', 'examples', 'checklist', 'template'];
  
  prefixes.forEach(prefix => {
    const keyword = `${prefix} ${seed}`;
    const opp = analyzeKeywordOpportunity(keyword);
    if (opp.score >= 60) opportunities.push(opp);
  });
  
  suffixes.forEach(suffix => {
    const keyword = `${seed} ${suffix}`;
    const opp = analyzeKeywordOpportunity(keyword);
    if (opp.score >= 60) opportunities.push(opp);
  });
  
  // Long-tail variations
  const longTail = [
    `${seed} for b2b`,
    `${seed} for saas`,
    `${seed} strategy`,
    `${seed} framework`
  ];
  
  longTail.forEach(keyword => {
    const opp = analyzeKeywordOpportunity(keyword);
    if (opp.score >= 60) opportunities.push(opp);
  });
  
  return opportunities
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function analyzeKeywordOpportunity(keyword) {
  const oppId = `opp-${crypto.randomBytes(4).toString('hex')}`;
  
  const volume = estimateSearchVolume(keyword);
  const difficulty = estimateKeywordDifficulty(keyword);
  const relevance = 85; // Assume high relevance since derived from seed
  
  // Opportunity score: high volume, low difficulty, high relevance
  const score = Math.round(
    Math.min(100, volume / 50) * 0.40 +
    (100 - difficulty) * 0.35 +
    relevance * 0.25
  );
  
  const opportunity = {
    oppId,
    keyword,
    volume,
    difficulty,
    relevance,
    score,
    intentType: detectIntentType(keyword),
    createdAt: new Date().toISOString()
  };
  
  keywordOpportunities.set(oppId, opportunity);
  return opportunity;
}

// ================================================================
// CONTENT PILLAR PLANNING
// ================================================================

function createContentPillar({ name, description, keywords = [], topics = [] }) {
  const pillarId = `pillar-${crypto.randomBytes(4).toString('hex')}`;
  
  const pillar = {
    pillarId,
    name,
    description,
    keywords,
    topics,
    status: 'active',
    contentCount: 0,
    avgPerformance: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  contentPillars.set(pillarId, pillar);
  return pillar;
}

function getContentPillar(pillarId) {
  return contentPillars.get(pillarId) || null;
}

function listContentPillars() {
  return Array.from(contentPillars.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateContentPillar(pillarId, updates) {
  const pillar = contentPillars.get(pillarId);
  if (!pillar) return null;
  
  Object.assign(pillar, updates);
  pillar.updatedAt = new Date().toISOString();
  
  contentPillars.set(pillarId, pillar);
  return pillar;
}

function deleteContentPillar(pillarId) {
  return contentPillars.delete(pillarId);
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Idea management
  createIdea,
  getIdea,
  listIdeas,
  updateIdea,
  deleteIdea,
  
  // Intent analysis
  scoreIntent,
  detectIntentType,
  estimateSearchVolume,
  estimateKeywordDifficulty,
  
  // ICP alignment
  scoreICPAlignment,
  
  // Competitive analysis
  analyzeCompetitiveGap,
  
  // Keyword opportunities
  discoverKeywordOpportunities,
  analyzeKeywordOpportunity,
  
  // Content pillars
  createContentPillar,
  getContentPillar,
  listContentPillars,
  updateContentPillar,
  deleteContentPillar,
  
  // Internal stores (for testing)
  ideas,
  intents,
  icpProfiles,
  competitorData,
  keywordOpportunities,
  contentPillars
};
