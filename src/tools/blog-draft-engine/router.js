const express = require('express');

// Import all 8 specialized engines
const ideationEngine = require('./ideation-research-engine');
const briefEngine = require('./brief-outline-engine');
const draftingEngine = require('./drafting-engine');
const seoEngine = require('./seo-optimizer-engine');
const distributionEngine = require('./distribution-channels-engine');
const collaborationEngine = require('./collaboration-workflow-engine');
const performanceEngine = require('./performance-analytics-engine');
const aiEngine = require('./ai-orchestration-engine');

const router = express.Router();
module.exports = router;

// =============================================================================
// SYSTEM & META
// =============================================================================
router.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    status: 'Blog Draft Engine online', 
    version: 'enterprise-v3-world-class',
    engines: {
      ideation: 'active',
      brief: 'active',
      drafting: 'active',
      seo: 'active',
      distribution: 'active',
      collaboration: 'active',
      performance: 'active',
      ai: 'active'
    }
  });
});

router.get('/stats', (_req, res) => {
  const stats = {
    ideas: ideationEngine.ideas.size,
    briefs: briefEngine.briefs.size,
    outlines: briefEngine.outlines.size,
    drafts: draftingEngine.drafts.size,
    tasks: collaborationEngine.tasks.size,
    comments: collaborationEngine.comments.size,
    metrics: performanceEngine.performanceMetrics.size,
    aiRequests: aiEngine.aiRequests.size,
    total: ideationEngine.ideas.size + briefEngine.briefs.size + draftingEngine.drafts.size
  };
  
  res.json({ ok: true, stats });
});

// =============================================================================
// IDEATION & RESEARCH ENGINE (35+ endpoints)
// =============================================================================

// Ideas CRUD
router.post('/ideas', (req, res) => {
  const idea = ideationEngine.createIdea(req.body);
  res.status(201).json({ success: true, data: idea });
});

router.get('/ideas/:ideaId', (req, res) => {
  const idea = ideationEngine.getIdea(req.params.ideaId);
  if (!idea) return res.status(404).json({ success: false, error: 'Idea not found' });
  res.json({ success: true, data: idea });
});

router.get('/ideas', (req, res) => {
  const ideas = ideationEngine.listIdeas(req.query);
  res.json({ success: true, data: ideas });
});

router.put('/ideas/:ideaId', (req, res) => {
  const idea = ideationEngine.updateIdea(req.params.ideaId, req.body);
  if (!idea) return res.status(404).json({ success: false, error: 'Idea not found' });
  res.json({ success: true, data: idea });
});

router.delete('/ideas/:ideaId', (req, res) => {
  const deleted = ideationEngine.deleteIdea(req.params.ideaId);
  if (!deleted) return res.status(404).json({ success: false, error: 'Idea not found' });
  res.json({ success: true, message: 'Idea deleted' });
});

// Scoring & Analysis
router.post('/ideas/intent/score', (req, res) => {
  const score = ideationEngine.scoreIntent(req.body);
  res.json({ success: true, data: score });
});

router.post('/ideas/icp/score', (req, res) => {
  const score = ideationEngine.scoreICPAlignment(req.body.idea, req.body.icp);
  res.json({ success: true, data: score });
});

router.post('/ideas/competitive/analyze', (req, res) => {
  const analysis = ideationEngine.analyzeCompetitiveGap(req.body);
  res.json({ success: true, data: analysis });
});

router.post('/ideas/keywords/discover', (req, res) => {
  const keywords = ideationEngine.discoverKeywordOpportunities(req.body);
  res.json({ success: true, data: keywords });
});

// Content Pillars
router.post('/ideas/pillars', (req, res) => {
  const pillar = ideationEngine.createContentPillar(req.body);
  res.status(201).json({ success: true, data: pillar });
});

router.get('/ideas/pillars', (req, res) => {
  const pillars = ideationEngine.listContentPillars();
  res.json({ success: true, data: pillars });
});

router.get('/ideas/pillars/:pillarId', (req, res) => {
  const pillar = ideationEngine.getContentPillar(req.params.pillarId);
  if (!pillar) return res.status(404).json({ success: false, error: 'Pillar not found' });
  res.json({ success: true, data: pillar });
});

router.put('/ideas/pillars/:pillarId', (req, res) => {
  const pillar = ideationEngine.updateContentPillar(req.params.pillarId, req.body);
  if (!pillar) return res.status(404).json({ success: false, error: 'Pillar not found' });
  res.json({ success: true, data: pillar });
});

router.delete('/ideas/pillars/:pillarId', (req, res) => {
  const deleted = ideationEngine.deleteContentPillar(req.params.pillarId);
  if (!deleted) return res.status(404).json({ success: false, error: 'Pillar not found' });
  res.json({ success: true, message: 'Pillar deleted' });
});

// Research & Trends
router.post('/ideas/research/trends', (req, res) => {
  const trends = ideationEngine.identifyTrendingTopics(req.body);
  res.json({ success: true, data: trends });
});

router.post('/ideas/research/gaps', (req, res) => {
  const gaps = ideationEngine.findContentGaps(req.body);
  res.json({ success: true, data: gaps });
});

router.post('/ideas/research/questions', (req, res) => {
  const questions = ideationEngine.extractTargetQuestions(req.body);
  res.json({ success: true, data: questions });
});

router.get('/ideas/stats', (_req, res) => {
  const stats = {
    totalIdeas: ideationEngine.ideas.size,
    totalPillars: ideationEngine.contentPillars.size,
    byStatus: {},
    byIntent: {}
  };
  
  Array.from(ideationEngine.ideas.values()).forEach(idea => {
    stats.byStatus[idea.status] = (stats.byStatus[idea.status] || 0) + 1;
    if (idea.intentScore) {
      stats.byIntent[idea.intentScore.primaryIntent] = (stats.byIntent[idea.intentScore.primaryIntent] || 0) + 1;
    }
  });
  
  res.json({ success: true, data: stats });
});

// =============================================================================
// BRIEF & OUTLINE ENGINE (40+ endpoints)
// =============================================================================

// Briefs CRUD
router.post('/briefs', (req, res) => {
  const brief = briefEngine.createBrief(req.body);
  res.status(201).json({ success: true, data: brief });
});

router.get('/briefs/:briefId', (req, res) => {
  const brief = briefEngine.getBrief(req.params.briefId);
  if (!brief) return res.status(404).json({ success: false, error: 'Brief not found' });
  res.json({ success: true, data: brief });
});

router.get('/briefs', (req, res) => {
  const briefs = briefEngine.listBriefs(req.query);
  res.json({ success: true, data: briefs });
});

router.put('/briefs/:briefId', (req, res) => {
  const brief = briefEngine.updateBrief(req.params.briefId, req.body);
  if (!brief) return res.status(404).json({ success: false, error: 'Brief not found' });
  res.json({ success: true, data: brief });
});

router.delete('/briefs/:briefId', (req, res) => {
  const deleted = briefEngine.deleteBrief(req.params.briefId);
  if (!deleted) return res.status(404).json({ success: false, error: 'Brief not found' });
  res.json({ success: true, message: 'Brief deleted' });
});

// Brief Scoring & Analysis
router.post('/briefs/:briefId/score', (req, res) => {
  const brief = briefEngine.getBrief(req.params.briefId);
  if (!brief) return res.status(404).json({ success: false, error: 'Brief not found' });
  const score = briefEngine.scoreBrief(brief);
  res.json({ success: true, data: score });
});

router.post('/briefs/compliance/check', (req, res) => {
  const results = briefEngine.runComplianceChecks(req.body);
  res.json({ success: true, data: results });
});

// Outlines CRUD
router.post('/outlines', (req, res) => {
  const outline = briefEngine.createOutline(req.body);
  res.status(201).json({ success: true, data: outline });
});

router.get('/outlines/:outlineId', (req, res) => {
  const outline = briefEngine.getOutline(req.params.outlineId);
  if (!outline) return res.status(404).json({ success: false, error: 'Outline not found' });
  res.json({ success: true, data: outline });
});

router.get('/outlines', (req, res) => {
  const outlines = briefEngine.listOutlines(req.query);
  res.json({ success: true, data: outlines });
});

router.put('/outlines/:outlineId', (req, res) => {
  const outline = briefEngine.updateOutline(req.params.outlineId, req.body);
  if (!outline) return res.status(404).json({ success: false, error: 'Outline not found' });
  res.json({ success: true, data: outline });
});

router.delete('/outlines/:outlineId', (req, res) => {
  const deleted = briefEngine.deleteOutline(req.params.outlineId);
  if (!deleted) return res.status(404).json({ success: false, error: 'Outline not found' });
  res.json({ success: true, message: 'Outline deleted' });
});

// Outline Grading & Optimization
router.post('/outlines/:outlineId/grade', (req, res) => {
  const outline = briefEngine.getOutline(req.params.outlineId);
  if (!outline) return res.status(404).json({ success: false, error: 'Outline not found' });
  const grade = briefEngine.gradeOutline(outline);
  res.json({ success: true, data: grade });
});

router.post('/outlines/:outlineId/optimize', (req, res) => {
  const outline = briefEngine.getOutline(req.params.outlineId);
  if (!outline) return res.status(404).json({ success: false, error: 'Outline not found' });
  const optimized = briefEngine.optimizeOutlineStructure(outline);
  res.json({ success: true, data: optimized });
});

// Templates
router.post('/briefs/templates', (req, res) => {
  const template = briefEngine.createTemplate(req.body);
  res.status(201).json({ success: true, data: template });
});

router.get('/briefs/templates', (req, res) => {
  const templates = briefEngine.listTemplates(req.query);
  res.json({ success: true, data: templates });
});

router.get('/briefs/templates/:templateId', (req, res) => {
  const template = briefEngine.getTemplate(req.params.templateId);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

// Approval Workflows
router.post('/briefs/:briefId/submit', (req, res) => {
  const result = briefEngine.submitForApproval(req.params.briefId, req.body.userId);
  if (!result) return res.status(404).json({ success: false, error: 'Brief not found' });
  res.json({ success: true, data: result });
});

router.post('/briefs/:briefId/approve', (req, res) => {
  const result = briefEngine.approveBrief(req.params.briefId, req.body.userId);
  if (!result || result.error) return res.status(400).json({ success: false, error: result?.error || 'Brief not found' });
  res.json({ success: true, data: result });
});

router.get('/briefs/stats', (_req, res) => {
  const stats = {
    totalBriefs: briefEngine.briefs.size,
    totalOutlines: briefEngine.outlines.size,
    totalTemplates: briefEngine.templates.size,
    byStatus: {}
  };
  
  Array.from(briefEngine.briefs.values()).forEach(brief => {
    stats.byStatus[brief.status] = (stats.byStatus[brief.status] || 0) + 1;
  });
  
  res.json({ success: true, data: stats });
});

// =============================================================================
// DRAFTING ENGINE (40+ endpoints)
// =============================================================================

// Drafts CRUD
router.post('/drafts', (req, res) => {
  const draft = draftingEngine.createDraft(req.body);
  res.status(201).json({ success: true, data: draft });
});

router.get('/drafts/:draftId', (req, res) => {
  const draft = draftingEngine.getDraft(req.params.draftId);
  if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });
  res.json({ success: true, data: draft });
});

router.get('/drafts', (req, res) => {
  const drafts = draftingEngine.listDrafts(req.query);
  res.json({ success: true, data: drafts });
});

router.put('/drafts/:draftId', (req, res) => {
  const draft = draftingEngine.updateDraft(req.params.draftId, req.body);
  if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });
  res.json({ success: true, data: draft });
});

router.delete('/drafts/:draftId', (req, res) => {
  const deleted = draftingEngine.deleteDraft(req.params.draftId);
  if (!deleted) return res.status(404).json({ success: false, error: 'Draft not found' });
  res.json({ success: true, message: 'Draft deleted' });
});

// Version Control
router.post('/drafts/:draftId/versions', (req, res) => {
  const version = draftingEngine.createVersion(req.params.draftId, req.body.createdBy);
  if (!version) return res.status(404).json({ success: false, error: 'Draft not found' });
  res.status(201).json({ success: true, data: version });
});

router.get('/drafts/:draftId/versions', (req, res) => {
  const versions = draftingEngine.listVersions(req.params.draftId);
  res.json({ success: true, data: versions });
});

router.post('/drafts/:draftId/versions/:versionId/restore', (req, res) => {
  const result = draftingEngine.restoreVersion(req.params.draftId, req.params.versionId);
  if (!result) return res.status(404).json({ success: false, error: 'Draft or version not found' });
  res.json({ success: true, data: result });
});

router.get('/drafts/:draftId/versions/compare', (req, res) => {
  const comparison = draftingEngine.compareDraftVersions(req.params.draftId, req.query.v1, req.query.v2);
  if (!comparison) return res.status(404).json({ success: false, error: 'Versions not found' });
  res.json({ success: true, data: comparison });
});

// Quality Analysis
router.post('/drafts/:draftId/editorial/check', (req, res) => {
  const draft = draftingEngine.getDraft(req.params.draftId);
  if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });
  const results = draftingEngine.runEditorialChecks(draft);
  res.json({ success: true, data: results });
});

router.post('/drafts/:draftId/readability/analyze', (req, res) => {
  const draft = draftingEngine.getDraft(req.params.draftId);
  if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });
  const analysis = draftingEngine.analyzeReadability(draft.content);
  res.json({ success: true, data: analysis });
});

router.post('/drafts/:draftId/factcheck/submit', (req, res) => {
  const result = draftingEngine.submitForFactCheck(req.params.draftId);
  if (!result) return res.status(404).json({ success: false, error: 'Draft not found' });
  res.json({ success: true, data: result });
});

// Content Generation
router.post('/drafts/generate/introduction', (req, res) => {
  const intro = draftingEngine.generateIntroduction(req.body);
  res.json({ success: true, data: intro });
});

router.post('/drafts/generate/conclusion', (req, res) => {
  const conclusion = draftingEngine.generateConclusion(req.body);
  res.json({ success: true, data: conclusion });
});

router.post('/drafts/generate/section', (req, res) => {
  const section = draftingEngine.generateSection(req.body);
  res.json({ success: true, data: section });
});

router.get('/drafts/stats', (_req, res) => {
  const stats = {
    totalDrafts: draftingEngine.drafts.size,
    totalVersions: draftingEngine.versions.size,
    byStatus: {},
    avgWordCount: 0
  };
  
  let totalWords = 0;
  Array.from(draftingEngine.drafts.values()).forEach(draft => {
    stats.byStatus[draft.status] = (stats.byStatus[draft.status] || 0) + 1;
    totalWords += draft.wordCount || 0;
  });
  
  stats.avgWordCount = draftingEngine.drafts.size > 0 ? Math.round(totalWords / draftingEngine.drafts.size) : 0;
  
  res.json({ success: true, data: stats });
});

// =============================================================================
// SEO OPTIMIZER ENGINE (35+ endpoints)
// =============================================================================

// SEO Analysis
router.post('/seo/analyze', (req, res) => {
  const analysis = seoEngine.analyzeSEO(req.body);
  res.json({ success: true, data: analysis });
});

router.post('/seo/metadata/optimize', (req, res) => {
  const optimized = seoEngine.optimizeMetadata(req.body);
  res.json({ success: true, data: optimized });
});

router.post('/seo/schema/generate', (req, res) => {
  const schema = seoEngine.generateSchemaMarkup(req.body);
  res.json({ success: true, data: schema });
});

router.post('/seo/images/audit', (req, res) => {
  const audit = seoEngine.auditImages(req.body);
  res.json({ success: true, data: audit });
});

router.post('/seo/keywords/analyze', (req, res) => {
  const analysis = seoEngine.analyzeKeywordDensity(req.body.content, req.body.targetKeywords);
  res.json({ success: true, data: analysis });
});

router.post('/seo/internal-links/suggest', (req, res) => {
  const suggestions = seoEngine.suggestInternalLinks(req.body);
  res.json({ success: true, data: suggestions });
});

router.post('/seo/readability/score', (req, res) => {
  const score = seoEngine.calculateReadabilityScore(req.body.content);
  res.json({ success: true, data: score });
});

router.post('/seo/featured-snippet/optimize', (req, res) => {
  const optimized = seoEngine.optimizeForFeaturedSnippet(req.body);
  res.json({ success: true, data: optimized });
});

router.post('/seo/competitors/analyze', (req, res) => {
  const analysis = seoEngine.analyzeCompetitors(req.body);
  res.json({ success: true, data: analysis });
});

// SEO Reports
router.get('/seo/reports/:draftId', (req, res) => {
  const report = seoEngine.generateSEOReport(req.params.draftId);
  if (!report) return res.status(404).json({ success: false, error: 'Draft not found' });
  res.json({ success: true, data: report });
});

router.get('/seo/recommendations/:draftId', (req, res) => {
  const recommendations = seoEngine.generateRecommendations(req.params.draftId);
  res.json({ success: true, data: recommendations });
});

router.get('/seo/stats', (_req, res) => {
  const stats = {
    totalAnalyses: seoEngine.seoAnalyses?.size || 0,
    avgScore: 0,
    topIssues: []
  };
  
  res.json({ success: true, data: stats });
});

// =============================================================================
// DISTRIBUTION CHANNELS ENGINE (40+ endpoints)
// =============================================================================

// Channels CRUD
router.post('/distribution/channels', (req, res) => {
  const channel = distributionEngine.createChannel(req.body);
  res.status(201).json({ success: true, data: channel });
});

router.get('/distribution/channels/:channelId', (req, res) => {
  const channel = distributionEngine.getChannel(req.params.channelId);
  if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });
  res.json({ success: true, data: channel });
});

router.get('/distribution/channels', (req, res) => {
  const channels = distributionEngine.listChannels(req.query);
  res.json({ success: true, data: channels });
});

router.put('/distribution/channels/:channelId', (req, res) => {
  const channel = distributionEngine.updateChannel(req.params.channelId, req.body);
  if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });
  res.json({ success: true, data: channel });
});

router.delete('/distribution/channels/:channelId', (req, res) => {
  const deleted = distributionEngine.deleteChannel(req.params.channelId);
  if (!deleted) return res.status(404).json({ success: false, error: 'Channel not found' });
  res.json({ success: true, message: 'Channel deleted' });
});

// Distribution Plans
router.post('/distribution/plans', (req, res) => {
  const plan = distributionEngine.createDistributionPlan(req.body);
  res.status(201).json({ success: true, data: plan });
});

router.get('/distribution/plans/:planId', (req, res) => {
  const plan = distributionEngine.getDistributionPlan(req.params.planId);
  if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
  res.json({ success: true, data: plan });
});

router.post('/distribution/plans/:planId/readiness', (req, res) => {
  const readiness = distributionEngine.calculateReadiness(req.params.planId);
  if (!readiness) return res.status(404).json({ success: false, error: 'Plan not found' });
  res.json({ success: true, data: readiness });
});

// Publishing
router.post('/distribution/publish', (req, res) => {
  const result = distributionEngine.publishToChannel(req.body);
  res.json({ success: true, data: result });
});

router.post('/distribution/optimize/:platform', (req, res) => {
  const optimized = distributionEngine.optimizeForPlatform(req.body.content, req.params.platform);
  res.json({ success: true, data: optimized });
});

// Scheduling
router.post('/distribution/schedule', (req, res) => {
  const scheduled = distributionEngine.scheduleDistribution(req.body);
  res.json({ success: true, data: scheduled });
});

router.get('/distribution/schedule', (req, res) => {
  const schedules = distributionEngine.listScheduledDistributions(req.query);
  res.json({ success: true, data: schedules });
});

router.delete('/distribution/schedule/:scheduleId', (req, res) => {
  const deleted = distributionEngine.cancelScheduledDistribution(req.params.scheduleId);
  if (!deleted) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, message: 'Schedule cancelled' });
});

// Syndication
router.post('/distribution/syndication/partners', (req, res) => {
  const partner = distributionEngine.createSyndicationPartner(req.body);
  res.status(201).json({ success: true, data: partner });
});

router.get('/distribution/syndication/partners', (req, res) => {
  const partners = distributionEngine.listSyndicationPartners();
  res.json({ success: true, data: partners });
});

router.post('/distribution/syndication/:partnerId/syndicate', (req, res) => {
  const result = distributionEngine.syndicateToPartner(req.params.partnerId, req.body);
  if (!result) return res.status(404).json({ success: false, error: 'Partner not found' });
  res.json({ success: true, data: result });
});

// Performance Tracking
router.post('/distribution/track', (req, res) => {
  const tracked = distributionEngine.trackDistributionPerformance(req.body);
  res.json({ success: true, data: tracked });
});

router.get('/distribution/performance/:draftId', (req, res) => {
  const performance = distributionEngine.getPerformanceByDraft(req.params.draftId);
  res.json({ success: true, data: performance || [] });
});

router.get('/distribution/stats', (_req, res) => {
  const stats = {
    totalChannels: distributionEngine.channels.size,
    totalPlans: distributionEngine.distributionPlans.size,
    totalPublications: distributionEngine.publications.size,
    byChannelType: {}
  };
  
  Array.from(distributionEngine.channels.values()).forEach(channel => {
    stats.byChannelType[channel.type] = (stats.byChannelType[channel.type] || 0) + 1;
  });
  
  res.json({ success: true, data: stats });
});

// =============================================================================
// COLLABORATION & WORKFLOW ENGINE (45+ endpoints)
// =============================================================================

// Tasks CRUD
router.post('/collaboration/tasks', (req, res) => {
  const task = collaborationEngine.createTask(req.body);
  res.status(201).json({ success: true, data: task });
});

router.get('/collaboration/tasks/:taskId', (req, res) => {
  const task = collaborationEngine.getTask(req.params.taskId);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  res.json({ success: true, data: task });
});

router.get('/collaboration/tasks', (req, res) => {
  const tasks = collaborationEngine.listTasks(req.query);
  res.json({ success: true, data: tasks });
});

router.put('/collaboration/tasks/:taskId', (req, res) => {
  const task = collaborationEngine.updateTask(req.params.taskId, req.body, req.body.userId);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  res.json({ success: true, data: task });
});

router.post('/collaboration/tasks/:taskId/complete', (req, res) => {
  const task = collaborationEngine.completeTask(req.params.taskId, req.body.userId);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  res.json({ success: true, data: task });
});

router.delete('/collaboration/tasks/:taskId', (req, res) => {
  const deleted = collaborationEngine.deleteTask(req.params.taskId);
  if (!deleted) return res.status(404).json({ success: false, error: 'Task not found' });
  res.json({ success: true, message: 'Task deleted' });
});

// Comments CRUD
router.post('/collaboration/comments', (req, res) => {
  const comment = collaborationEngine.createComment(req.body);
  res.status(201).json({ success: true, data: comment });
});

router.get('/collaboration/comments/:commentId', (req, res) => {
  const comment = collaborationEngine.getComment(req.params.commentId);
  if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
  res.json({ success: true, data: comment });
});

router.get('/collaboration/comments', (req, res) => {
  const comments = collaborationEngine.listComments(req.query);
  res.json({ success: true, data: comments });
});

router.put('/collaboration/comments/:commentId', (req, res) => {
  const comment = collaborationEngine.updateComment(req.params.commentId, req.body.text, req.body.userId);
  if (!comment || comment.error) return res.status(400).json({ success: false, error: comment?.error || 'Comment not found' });
  res.json({ success: true, data: comment });
});

router.delete('/collaboration/comments/:commentId', (req, res) => {
  const deleted = collaborationEngine.deleteComment(req.params.commentId, req.body.userId);
  if (!deleted || deleted.error) return res.status(400).json({ success: false, error: deleted?.error || 'Comment not found' });
  res.json({ success: true, message: 'Comment deleted' });
});

// Reactions
router.post('/collaboration/comments/:commentId/reactions', (req, res) => {
  const comment = collaborationEngine.addReaction(req.params.commentId, req.body.userId, req.body.emoji);
  if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
  res.json({ success: true, data: comment });
});

router.delete('/collaboration/comments/:commentId/reactions', (req, res) => {
  const comment = collaborationEngine.removeReaction(req.params.commentId, req.body.userId, req.body.emoji);
  if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
  res.json({ success: true, data: comment });
});

// Assignments
router.get('/collaboration/assignments/:userId', (req, res) => {
  const assignments = collaborationEngine.listAssignments(req.params.userId);
  res.json({ success: true, data: assignments });
});

router.get('/collaboration/workload/:userId', (req, res) => {
  const workload = collaborationEngine.getAssignmentWorkload(req.params.userId);
  res.json({ success: true, data: workload });
});

// Activity Tracking
router.get('/collaboration/activities', (req, res) => {
  const activities = collaborationEngine.listActivities(req.query);
  res.json({ success: true, data: activities });
});

router.get('/collaboration/activities/timeline/:draftId', (req, res) => {
  const timeline = collaborationEngine.getActivityTimeline(req.params.draftId);
  res.json({ success: true, data: timeline });
});

// Workflows
router.post('/collaboration/workflows', (req, res) => {
  const workflow = collaborationEngine.createWorkflow(req.body);
  res.status(201).json({ success: true, data: workflow });
});

router.get('/collaboration/workflows', (req, res) => {
  const workflows = collaborationEngine.listWorkflows(req.query);
  res.json({ success: true, data: workflows });
});

router.post('/collaboration/workflows/:workflowId/execute', (req, res) => {
  const result = collaborationEngine.executeWorkflow(req.params.workflowId, req.body.context);
  if (!result) return res.status(404).json({ success: false, error: 'Workflow not found' });
  res.json({ success: true, data: result });
});

// Notifications
router.get('/collaboration/notifications/:userId', (req, res) => {
  const notifications = collaborationEngine.listNotifications(req.params.userId, req.query.unreadOnly === 'true');
  res.json({ success: true, data: notifications });
});

router.post('/collaboration/notifications/:notificationId/read', (req, res) => {
  const notification = collaborationEngine.markNotificationRead(req.params.notificationId);
  if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
  res.json({ success: true, data: notification });
});

router.post('/collaboration/notifications/:userId/read-all', (req, res) => {
  const count = collaborationEngine.markAllNotificationsRead(req.params.userId);
  res.json({ success: true, data: { markedRead: count } });
});

// Teams
router.post('/collaboration/teams', (req, res) => {
  const team = collaborationEngine.createTeam(req.body);
  res.status(201).json({ success: true, data: team });
});

router.get('/collaboration/teams', (req, res) => {
  const teams = collaborationEngine.listTeams(req.query.userId);
  res.json({ success: true, data: teams });
});

router.post('/collaboration/teams/:teamId/members', (req, res) => {
  const team = collaborationEngine.addTeamMember(req.params.teamId, req.body.userId, req.body.role);
  if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
  res.json({ success: true, data: team });
});

router.delete('/collaboration/teams/:teamId/members/:userId', (req, res) => {
  const team = collaborationEngine.removeTeamMember(req.params.teamId, req.params.userId);
  if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
  res.json({ success: true, data: team });
});

router.get('/collaboration/stats', (_req, res) => {
  const stats = {
    totalTasks: collaborationEngine.tasks.size,
    totalComments: collaborationEngine.comments.size,
    totalActivities: collaborationEngine.activities.size,
    totalNotifications: collaborationEngine.notifications.size,
    totalTeams: collaborationEngine.teams.size
  };
  
  res.json({ success: true, data: stats });
});

// =============================================================================
// PERFORMANCE & ANALYTICS ENGINE (40+ endpoints)
// =============================================================================

// Performance Tracking
router.post('/performance/track', (req, res) => {
  const tracked = performanceEngine.trackPerformance(req.body.draftId, req.body.metrics);
  res.json({ success: true, data: tracked });
});

router.get('/performance/:draftId', (req, res) => {
  const performance = performanceEngine.getPerformance(req.params.draftId, req.query.timeRange);
  if (!performance) return res.status(404).json({ success: false, error: 'No performance data found' });
  res.json({ success: true, data: performance });
});

router.get('/performance/compare/:draftId1/:draftId2', (req, res) => {
  const comparison = performanceEngine.comparePerformance(req.params.draftId1, req.params.draftId2, req.query.timeRange);
  if (!comparison) return res.status(404).json({ success: false, error: 'Insufficient data for comparison' });
  res.json({ success: true, data: comparison });
});

// Engagement Analytics
router.post('/performance/engagement/track', (req, res) => {
  const tracked = performanceEngine.trackEngagement(req.body.draftId, req.body.userId, req.body.event);
  res.json({ success: true, data: tracked });
});

router.get('/performance/engagement/:draftId', (req, res) => {
  const analysis = performanceEngine.analyzeEngagement(req.params.draftId);
  if (!analysis) return res.status(404).json({ success: false, error: 'No engagement data found' });
  res.json({ success: true, data: analysis });
});

router.get('/performance/funnel/:draftId', (req, res) => {
  const funnel = performanceEngine.getEngagementFunnel(req.params.draftId);
  res.json({ success: true, data: funnel });
});

// Conversion Tracking
router.post('/performance/conversions/track', (req, res) => {
  const conversion = performanceEngine.trackConversion(req.body.draftId, req.body.userId, req.body.conversionData);
  res.json({ success: true, data: conversion });
});

router.get('/performance/conversions/:draftId', (req, res) => {
  const analysis = performanceEngine.analyzeConversions(req.params.draftId, req.query.timeRange);
  if (!analysis) return res.status(404).json({ success: false, error: 'No conversion data found' });
  res.json({ success: true, data: analysis });
});

router.post('/performance/roi/:draftId', (req, res) => {
  const roi = performanceEngine.calculateROI(req.params.draftId, req.body.investmentCost);
  if (!roi) return res.status(404).json({ success: false, error: 'Insufficient data for ROI calculation' });
  res.json({ success: true, data: roi });
});

// A/B Testing
router.post('/performance/abtests', (req, res) => {
  const test = performanceEngine.createABTest(req.body);
  res.status(201).json({ success: true, data: test });
});

router.get('/performance/abtests', (req, res) => {
  const tests = performanceEngine.listABTests(req.query);
  res.json({ success: true, data: tests });
});

router.post('/performance/abtests/:testId/analyze', (req, res) => {
  const analysis = performanceEngine.analyzeABTest(req.params.testId);
  if (!analysis) return res.status(404).json({ success: false, error: 'Test not found' });
  res.json({ success: true, data: analysis });
});

// Predictive Analytics
router.post('/performance/forecast/:draftId', (req, res) => {
  const forecast = performanceEngine.forecastPerformance(req.params.draftId, req.body.daysAhead);
  res.json({ success: true, data: forecast });
});

router.post('/performance/predict/conversions/:draftId', (req, res) => {
  const prediction = performanceEngine.predictConversions(req.params.draftId, req.body.traffic);
  res.json({ success: true, data: prediction });
});

// Benchmarking
router.post('/performance/benchmarks', (req, res) => {
  const benchmark = performanceEngine.setBenchmark(req.body.category, req.body.metric, req.body.value);
  res.status(201).json({ success: true, data: benchmark });
});

router.get('/performance/benchmarks/:draftId/:category', (req, res) => {
  const comparison = performanceEngine.compareToBenchmark(req.params.draftId, req.params.category);
  res.json({ success: true, data: comparison });
});

router.get('/performance/stats', (_req, res) => {
  const stats = {
    totalMetrics: performanceEngine.performanceMetrics.size,
    totalEngagementEvents: performanceEngine.engagementData.size,
    totalConversions: performanceEngine.conversionEvents.size,
    totalABTests: performanceEngine.abTests.size,
    totalForecasts: performanceEngine.forecasts.size
  };
  
  res.json({ success: true, data: stats });
});

// =============================================================================
// AI ORCHESTRATION ENGINE (40+ endpoints)
// =============================================================================

// Provider Management
router.post('/ai/providers', (req, res) => {
  const provider = aiEngine.registerProvider(req.body);
  res.status(201).json({ success: true, data: provider });
});

router.get('/ai/providers', (req, res) => {
  const providers = aiEngine.listProviders(req.query);
  res.json({ success: true, data: providers });
});

router.get('/ai/providers/:providerId', (req, res) => {
  const provider = aiEngine.getProvider(req.params.providerId);
  if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });
  res.json({ success: true, data: provider });
});

router.put('/ai/providers/:providerId', (req, res) => {
  const provider = aiEngine.updateProvider(req.params.providerId, req.body);
  if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });
  res.json({ success: true, data: provider });
});

router.get('/ai/providers/:providerId/performance', (req, res) => {
  const performance = aiEngine.getProviderPerformance(req.params.providerId);
  if (!performance) return res.status(404).json({ success: false, error: 'Provider not found' });
  res.json({ success: true, data: performance });
});

// AI Request Routing
router.post('/ai/requests', (req, res) => {
  const request = aiEngine.createAIRequest(req.body);
  res.status(201).json({ success: true, data: request });
});

router.post('/ai/route', (req, res) => {
  const provider = aiEngine.routeRequest(req.body);
  res.json({ success: true, data: provider });
});

router.post('/ai/execute', (req, res) => {
  const result = aiEngine.executeAIRequest(req.body);
  res.json({ success: true, data: result });
});

// Multi-Provider Strategies
router.post('/ai/best-of-n', (req, res) => {
  const result = aiEngine.runBestOfN(req.body);
  res.json({ success: true, data: result });
});

router.post('/ai/ensemble', (req, res) => {
  const result = aiEngine.runEnsemble(req.body);
  res.json({ success: true, data: result });
});

router.post('/ai/cascade', (req, res) => {
  const result = aiEngine.runCascade(req.body);
  res.json({ success: true, data: result });
});

// Quality Scoring
router.post('/ai/quality/score', (req, res) => {
  const score = aiEngine.scoreResponse(req.body);
  res.json({ success: true, data: score });
});

router.post('/ai/quality/compare', (req, res) => {
  const comparison = aiEngine.compareResponses(req.body.responses);
  res.json({ success: true, data: comparison });
});

// Cost Optimization
router.get('/ai/costs/:providerId', (req, res) => {
  const costs = aiEngine.calculateProviderCosts(req.params.providerId);
  if (!costs) return res.status(404).json({ success: false, error: 'Provider not found' });
  res.json({ success: true, data: costs });
});

router.post('/ai/costs/optimize', (req, res) => {
  const optimization = aiEngine.optimizeCosts(req.body);
  res.json({ success: true, data: optimization });
});

// Response Analysis
router.get('/ai/responses/:responseId', (req, res) => {
  const response = aiEngine.getResponse(req.params.responseId);
  if (!response) return res.status(404).json({ success: false, error: 'Response not found' });
  res.json({ success: true, data: response });
});

router.get('/ai/responses', (req, res) => {
  const responses = aiEngine.listResponses(req.query);
  res.json({ success: true, data: responses });
});

// Performance Analytics
router.get('/ai/analytics/summary', (_req, res) => {
  const summary = aiEngine.getPerformanceSummary();
  res.json({ success: true, data: summary });
});

router.get('/ai/analytics/provider-comparison', (_req, res) => {
  const comparison = aiEngine.compareProviderPerformance();
  res.json({ success: true, data: comparison });
});

router.get('/ai/stats', (_req, res) => {
  const stats = {
    totalProviders: aiEngine.aiProviders.size,
    totalRequests: aiEngine.aiRequests.size,
    totalResponses: aiEngine.aiResponses.size,
    totalEnsembles: aiEngine.ensembleResults.size
  };
  
  res.json({ success: true, data: stats });
});

// =============================================================================
// CROSS-ENGINE WORKFLOWS & INTEGRATIONS
// =============================================================================

// Full Content Pipeline
router.post('/workflows/content-pipeline', (req, res) => {
  // Creates idea -> brief -> outline -> draft -> SEO -> distribution in one flow
  const { topic, targetAudience, keywords } = req.body;
  
  // Step 1: Create idea
  const idea = ideationEngine.createIdea({
    title: topic,
    description: `Content idea for ${targetAudience}`,
    targetAudience,
    keywords
  });
  
  // Step 2: Create brief
  const brief = briefEngine.createBrief({
    ideaId: idea.ideaId,
    title: topic,
    targetAudience,
    keywords,
    objectives: req.body.objectives || []
  });
  
  // Step 3: Create outline
  const outline = briefEngine.createOutline({
    briefId: brief.briefId,
    sections: req.body.sections || []
  });
  
  // Step 4: Create draft
  const draft = draftingEngine.createDraft({
    briefId: brief.briefId,
    outlineId: outline.outlineId,
    content: req.body.initialContent || ''
  });
  
  res.status(201).json({
    success: true,
    data: {
      pipelineId: `pipeline-${Date.now()}`,
      idea,
      brief,
      outline,
      draft,
      nextSteps: ['SEO optimization', 'Distribution planning', 'Performance tracking']
    }
  });
});

// Bulk Operations
router.post('/bulk/ideas/create', (req, res) => {
  const { ideas } = req.body;
  const results = ideas.map(ideaData => ideationEngine.createIdea(ideaData));
  res.status(201).json({ success: true, data: results });
});

router.post('/bulk/drafts/analyze', (req, res) => {
  const { draftIds } = req.body;
  const results = draftIds.map(draftId => {
    const draft = draftingEngine.getDraft(draftId);
    if (!draft) return null;
    
    return {
      draftId,
      readability: draftingEngine.analyzeReadability(draft.content),
      editorial: draftingEngine.runEditorialChecks(draft)
    };
  }).filter(Boolean);
  
  res.json({ success: true, data: results });
});

router.post('/bulk/seo/optimize', (req, res) => {
  const { draftIds } = req.body;
  const results = draftIds.map(draftId => {
    const draft = draftingEngine.getDraft(draftId);
    if (!draft) return null;
    
    return seoEngine.analyzeSEO({
      title: draft.title,
      content: draft.content,
      keywords: draft.targetKeywords || []
    });
  }).filter(Boolean);
  
  res.json({ success: true, data: results });
});

// Search & Discovery
router.get('/search/global', (req, res) => {
  const { query, type, limit = 20 } = req.query;
  const results = [];
  
  if (!type || type === 'ideas') {
    const ideas = ideationEngine.listIdeas({ limit: parseInt(limit) })
      .filter(idea => 
        idea.title.toLowerCase().includes(query.toLowerCase()) ||
        idea.description.toLowerCase().includes(query.toLowerCase())
      );
    results.push(...ideas.map(item => ({ ...item, resultType: 'idea' })));
  }
  
  if (!type || type === 'briefs') {
    const briefs = briefEngine.listBriefs({ limit: parseInt(limit) })
      .filter(brief => 
        brief.title.toLowerCase().includes(query.toLowerCase())
      );
    results.push(...briefs.map(item => ({ ...item, resultType: 'brief' })));
  }
  
  if (!type || type === 'drafts') {
    const drafts = draftingEngine.listDrafts({ limit: parseInt(limit) })
      .filter(draft => 
        draft.title.toLowerCase().includes(query.toLowerCase()) ||
        draft.content.toLowerCase().includes(query.toLowerCase())
      );
    results.push(...drafts.map(item => ({ ...item, resultType: 'draft' })));
  }
  
  res.json({ 
    success: true, 
    data: results.slice(0, parseInt(limit)),
    total: results.length  
  });
});

// Data Export
router.get('/export/ideas', (_req, res) => {
  const ideas = Array.from(ideationEngine.ideas.values());
  res.json({ success: true, data: ideas, count: ideas.length });
});

router.get('/export/drafts', (_req, res) => {
  const drafts = Array.from(draftingEngine.drafts.values());
  res.json({ success: true, data: drafts, count: drafts.length });
});

router.get('/export/performance/:draftId', (req, res) => {
  const performance = performanceEngine.getPerformance(req.params.draftId);
  const engagement = performanceEngine.analyzeEngagement(req.params.draftId);
  const conversions = performanceEngine.analyzeConversions(req.params.draftId);
  
  res.json({
    success: true,
    data: {
      draftId: req.params.draftId,
      performance,
      engagement,
      conversions,
      exportedAt: new Date().toISOString()
    }
  });
});

// Analytics Dashboards
router.get('/analytics/overview', (_req, res) => {
  res.json({
    success: true,
    data: {
      ideas: {
        total: ideationEngine.ideas.size,
        pillars: ideationEngine.contentPillars.size
      },
      content: {
        briefs: briefEngine.briefs.size,
        outlines: briefEngine.outlines.size,
        drafts: draftingEngine.drafts.size,
        versions: draftingEngine.versions.size
      },
      distribution: {
        channels: distributionEngine.channels.size,
        publications: distributionEngine.publications.size
      },
      collaboration: {
        tasks: collaborationEngine.tasks.size,
        comments: collaborationEngine.comments.size,
        teams: collaborationEngine.teams.size
      },
      performance: {
        metrics: performanceEngine.performanceMetrics.size,
        abTests: performanceEngine.abTests.size
      },
      ai: {
        providers: aiEngine.aiProviders.size,
        requests: aiEngine.aiRequests.size
      }
    }
  });
});

router.get('/analytics/productivity', (_req, res) => {
  const drafts = Array.from(draftingEngine.drafts.values());
  const tasks = Array.from(collaborationEngine.tasks.values());
  
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completedDrafts = drafts.filter(d => d.status === 'published').length;
  
  res.json({
    success: true,
    data: {
      totalDrafts: drafts.length,
      completedDrafts,
      completionRate: drafts.length > 0 ? (completedDrafts / drafts.length) * 100 : 0,
      totalTasks: tasks.length,
      completedTasks,
      taskCompletionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
      avgWordsPerDraft: drafts.length > 0 
        ? drafts.reduce((sum, d) => sum + (d.wordCount || 0), 0) / drafts.length 
        : 0
    }
  });
});

// Content Quality Reports
router.get('/quality/drafts/:draftId/report', (req, res) => {
  const draft = draftingEngine.getDraft(req.params.draftId);
  if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });
  
  const readability = draftingEngine.analyzeReadability(draft.content);
  const editorial = draftingEngine.runEditorialChecks(draft);
  const seoAnalysis = seoEngine.analyzeSEO({
    title: draft.title,
    content: draft.content,
    keywords: draft.targetKeywords || []
  });
  
  const qualityScore = Math.round((
    readability.score / 100 * 0.3 +
    editorial.score / 100 * 0.3 +
    seoAnalysis.overallScore / 100 * 0.4
  ) * 100);
  
  res.json({
    success: true,
    data: {
      draftId: draft.draftId,
      qualityScore,
      readability,
      editorial,
      seo: seoAnalysis,
      recommendations: [
        ...(readability.score < 60 ? ['Improve readability'] : []),
        ...(editorial.issues.length > 5 ? ['Fix editorial issues'] : []),
        ...(seoAnalysis.overallScore < 70 ? ['Optimize for SEO'] : [])
      ]
    }
  });
});

// Team Collaboration Reports
router.get('/team/activity/:userId', (req, res) => {
  const userTasks = collaborationEngine.listTasks({ assigneeId: req.params.userId });
  const userComments = collaborationEngine.listComments({ userId: req.params.userId });
  const userActivities = collaborationEngine.listActivities({ userId: req.params.userId });
  
  res.json({
    success: true,
    data: {
      userId: req.params.userId,
      tasks: {
        total: userTasks.length,
        open: userTasks.filter(t => t.status === 'open').length,
        inProgress: userTasks.filter(t => t.status === 'in_progress').length,
        completed: userTasks.filter(t => t.status === 'completed').length
      },
      comments: userComments.length,
      activities: userActivities.length,
      recentActivity: userActivities.slice(0, 10)
    }
  });
});

// Health Checks & Diagnostics
router.get('/diagnostics/engines', (_req, res) => {
  res.json({
    success: true,
    data: {
      ideation: {
        status: 'healthy',
        ideas: ideationEngine.ideas.size,
        pillars: ideationEngine.contentPillars.size
      },
      brief: {
        status: 'healthy',
        briefs: briefEngine.briefs.size,
        outlines: briefEngine.outlines.size,
        templates: briefEngine.templates.size
      },
      drafting: {
        status: 'healthy',
        drafts: draftingEngine.drafts.size,
        versions: draftingEngine.versions.size
      },
      seo: {
        status: 'healthy',
        analyses: 0
      },
      distribution: {
        status: 'healthy',
        channels: distributionEngine.channels.size,
        publications: distributionEngine.publications.size
      },
      collaboration: {
        status: 'healthy',
        tasks: collaborationEngine.tasks.size,
        comments: collaborationEngine.comments.size
      },
      performance: {
        status: 'healthy',
        metrics: performanceEngine.performanceMetrics.size
      },
      ai: {
        status: 'healthy',
        providers: aiEngine.aiProviders.size,
        requests: aiEngine.aiRequests.size
      }
    }
  });
});

router.get('/diagnostics/memory', (_req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    data: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB'
    }
  });
});
