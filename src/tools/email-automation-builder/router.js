/**
 * Email Automation Builder - Enterprise Router
 * 200+ API endpoints across 8 categories
 * Part of Phase 1 - Revenue Critical tool upgrade
 */

const express = require('express');
const router = express.Router();

// Import backend modules
const campaignManager = require('./campaign-manager');
const aiOrchestration = require('./ai-orchestration');
const audienceSegmentation = require('./audience-segmentation');
const workflowEngine = require('./workflow-engine');
const analyticsEngine = require('./analytics-engine');
const testingOptimization = require('./testing-optimization');
const multiChannel = require('./multi-channel');
const settingsAdmin = require('./settings-admin');

//=============================================================================
// CATEGORY 1: CAMPAIGN MANAGEMENT (28 endpoints)
//=============================================================================

// 1.1 Core Campaign Operations
router.get('/campaigns', (req, res) => {
  try {
    const result = campaignManager.listCampaigns(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns', (req, res) => {
  try {
    const campaign = campaignManager.createCampaign(req.body);
    res.json({ ok: true, campaign });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/campaigns/:id', (req, res) => {
  try {
    const campaign = campaignManager.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, campaign });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/campaigns/:id', (req, res) => {
  try {
    const campaign = campaignManager.updateCampaign(req.params.id, req.body);
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, campaign });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/campaigns/:id', (req, res) => {
  try {
    const deleted = campaignManager.deleteCampaign(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/:id/clone', (req, res) => {
  try {
    const campaign = campaignManager.cloneCampaign(req.params.id, req.body.name);
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, campaign });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/:id/schedule', (req, res) => {
  try {
    const campaign = campaignManager.scheduleCampaign(req.params.id, req.body.schedule);
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, campaign });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/:id/send', (req, res) => {
  try {
    const campaign = campaignManager.sendCampaign(req.params.id, req.body.immediate !== false);
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, campaign });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/:id/pause', (req, res) => {
  try {
    const campaign = campaignManager.pauseCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, campaign });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/:id/resume', (req, res) => {
  try {
    const campaign = campaignManager.resumeCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, campaign });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/:id/cancel', (req, res) => {
  try {
    const campaign = campaignManager.cancelCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, campaign });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/campaigns/:id/preview', (req, res) => {
  try {
    const preview = campaignManager.previewCampaign(req.params.id, req.query);
    if (!preview) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, preview });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/:id/test-send', (req, res) => {
  try {
    const result = campaignManager.sendTestCampaign(req.params.id, req.body.emails || []);
    if (!result) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 1.2 Templates
router.get('/templates', (req, res) => {
  try {
    const result = campaignManager.listTemplates(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/templates', (req, res) => {
  try {
    const template = campaignManager.createTemplate(req.body);
    res.json({ ok: true, template });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/templates/:id', (req, res) => {
  try {
    const template = campaignManager.getTemplate(req.params.id);
    if (!template) return res.status(404).json({ ok: false, error: 'Template not found' });
    res.json({ ok: true, template });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/templates/:id', (req, res) => {
  try {
    const template = campaignManager.updateTemplate(req.params.id, req.body);
    if (!template) return res.status(404).json({ ok: false, error: 'Template not found' });
    res.json({ ok: true, template });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/templates/:id', (req, res) => {
  try {
    const deleted = campaignManager.deleteTemplate(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Template not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/templates/:id/duplicate', (req, res) => {
  try {
    const template = campaignManager.duplicateTemplate(req.params.id, req.body.name);
    if (!template) return res.status(404).json({ ok: false, error: 'Template not found' });
    res.json({ ok: true, template });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/templates/categories', (req, res) => {
  try {
    const categories = campaignManager.getTemplateCategories();
    res.json({ ok: true, categories });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/templates/import', (req, res) => {
  try {
    const template = campaignManager.importTemplate(req.body.html);
    res.json({ ok: true, template });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/templates/:id/render', (req, res) => {
  try {
    const rendered = campaignManager.renderTemplate(req.params.id, req.query);
    if (!rendered) return res.status(404).json({ ok: false, error: 'Template not found' });
    res.json({ ok: true, ...rendered });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 1.3 Bulk Operations
router.post('/campaigns/bulk-create', (req, res) => {
  try {
    const campaigns = campaignManager.bulkCreateCampaigns(req.body.campaigns || []);
    res.json({ ok: true, campaigns, count: campaigns.length });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/bulk-schedule', (req, res) => {
  try {
    const campaigns = campaignManager.bulkScheduleCampaigns(req.body.ids || [], req.body.schedule);
    res.json({ ok: true, campaigns, count: campaigns.length });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/bulk-cancel', (req, res) => {
  try {
    const campaigns = campaignManager.bulkCancelCampaigns(req.body.ids || []);
    res.json({ ok: true, campaigns, count: campaigns.length });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/campaigns/bulk-delete', (req, res) => {
  try {
    const result = campaignManager.bulkDeleteCampaigns(req.body.ids || []);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/export', (req, res) => {
  try {
    const data = campaignManager.exportCampaigns(req.body);
    res.json({ ok: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/import', (req, res) => {
  try {
    const result = campaignManager.importCampaigns(req.body.data || []);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 1.4 Version Control
router.get('/campaigns/:id/versions', (req, res) => {
  try {
    const versions = campaignManager.listVersions(req.params.id);
    res.json({ ok: true, versions, count: versions.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/campaigns/:id/versions/:versionId', (req, res) => {
  try {
    const version = campaignManager.getVersion(req.params.id, req.params.versionId);
    if (!version) return res.status(404).json({ ok: false, error: 'Version not found' });
    res.json({ ok: true, version });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/campaigns/:id/versions/:versionId/restore', (req, res) => {
  try {
    const campaign = campaignManager.restoreVersion(req.params.id, req.params.versionId);
    if (!campaign) return res.status(404).json({ ok: false, error: 'Version not found' });
    res.json({ ok: true, campaign });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

//=============================================================================
// CATEGORY 2: AI CONTENT GENERATION (32 endpoints)
//=============================================================================

// 2.1 Multi-Model Orchestration
router.post('/ai/orchestration/generate', async (req, res) => {
  try {
    const result = await aiOrchestration.generateContent(req.body.prompt, req.body.options || {});
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/ai/models/available', (req, res) => {
  try {
    const models = aiOrchestration.getAvailableModels();
    res.json({ ok: true, models });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/ai/models/performance', (req, res) => {
  try {
    const performance = aiOrchestration.getModelPerformance();
    res.json({ ok: true, performance });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2.2 Subject Line Optimization
router.post('/ai/subject-lines/generate', async (req, res) => {
  try {
    const result = await aiOrchestration.generateSubjectLines(req.body.topic, req.body.count || 5, req.body.options || {});
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/ai/subject-lines/analyze', async (req, res) => {
  try {
    const analysis = await aiOrchestration.analyzeSubjectLine(req.body.subject);
    res.json({ ok: true, analysis });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/subject-lines/predict-open-rate', async (req, res) => {
  try {
    const prediction = await aiOrchestration.predictOpenRate(req.body.subject);
    res.json({ ok: true, prediction });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/subject-lines/personalize', async (req, res) => {
  try {
    const result = await aiOrchestration.personalizeSubject(req.body.subject, req.body.level || 'medium');
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/subject-lines/emoji-suggest', async (req, res) => {
  try {
    const suggestions = await aiOrchestration.suggestEmoji(req.body.subject);
    res.json({ ok: true, ...suggestions });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/ai/subject-lines/best-practices', async (req, res) => {
  try {
    const bestPractices = await aiOrchestration.getSubjectLineBestPractices();
    res.json({ ok: true, bestPractices });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2.3 Email Body Generation
router.post('/ai/content/generate', async (req, res) => {
  try {
    const result = await aiOrchestration.generateEmailBody(req.body.topic, req.body.options || {});
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/ai/content/rewrite', async (req, res) => {
  try {
    const result = await aiOrchestration.rewriteContent(req.body.content, req.body.tone || 'professional');
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/content/expand', async (req, res) => {
  try {
    const result = await aiOrchestration.expandContent(req.body.content);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/content/summarize', async (req, res) => {
  try {
    const result = await aiOrchestration.summarizeContent(req.body.content);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/content/translate', async (req, res) => {
  try {
    const result = await aiOrchestration.translateContent(req.body.content, req.body.language);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/content/personalize', async (req, res) => {
  try {
    const result = await aiOrchestration.personalizeContent(req.body.content, req.body.personalizationData || {});
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

//2.4 Content Quality & Optimization
router.post('/ai/spam-score', async (req, res) => {
  try {
    const result = await aiOrchestration.checkSpamScore(req.body.subject, req.body.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/readability-score', async (req, res) => {
  try {
    const result = await aiOrchestration.calculateReadabilityScore(req.body.content);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/sentiment-analysis', async (req, res) => {
  try {
    const result = await aiOrchestration.analyzeSentiment(req.body.content);
    res.json({ ok: true, sentiment: result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/cta-optimization', async (req, res) => {
  try {
    const result = await aiOrchestration.optimizeCTA(req.body.cta);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ai/image-alt-text', async (req, res) => {
  try {
    const result = await aiOrchestration.generateImageAltText(req.body.imageUrl, req.body.context);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/ai/content/recommendations', async (req, res) => {
  try {
    const result = await aiOrchestration.getContentRecommendations(req.query.subject || '', req.query.body || '');
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 2.5 AI Usage & Cost
router.get('/ai/usage/stats', (req, res) => {
  try {
    const stats = aiOrchestration.getUsageStats(req.query.timeframe || '24h');
    res.json({ ok: true, stats });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/ai/usage/costs', (req, res) => {
  try {
    const costs = aiOrchestration.getCostBreakdown(req.query.timeframe || '30d');
    res.json({ ok: true, costs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//=============================================================================
// CATEGORY 3: AUDIENCE & SEGMENTATION (26 endpoints)
//=============================================================================

// 3.1 Segments
router.get('/segments', (req, res) => {
  try {
    const result = audienceSegmentation.listSegments(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/segments', (req, res) => {
  try {
    const segment = audienceSegmentation.createSegment(req.body);
    res.json({ ok: true, segment });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/segments/:id', (req, res) => {
  try {
    const segment = audienceSegmentation.getSegment(req.params.id);
    if (!segment) return res.status(404).json({ ok: false, error: 'Segment not found' });
    res.json({ ok: true, segment });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/segments/:id', (req, res) => {
  try {
    const segment = audienceSegmentation.updateSegment(req.params.id, req.body);
    if (!segment) return res.status(404).json({ ok: false, error: 'Segment not found' });
    res.json({ ok: true, segment });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/segments/:id', (req, res) => {
try {
    const deleted = audienceSegmentation.deleteSegment(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Segment not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/segments/:id/contacts', (req, res) => {
  try {
    const contacts = audienceSegmentation.getSegmentContacts(req.params.id);
    res.json({ ok: true, contacts, count: contacts.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/segments/:id/refresh', (req, res) => {
  try {
    const segment = audienceSegmentation.refreshSegment(req.params.id);
    if (!segment) return res.status(404).json({ ok: false, error: 'Segment not found or not dynamic' });
    res.json({ ok: true, segment });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 3.2 Behavioral Targeting
router.post('/behavioral-events', (req, res) => {
  try {
    const event = audienceSegmentation.trackBehavioralEvent(req.body);
    res.json({ ok: true, event });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/behavioral-events', (req, res) => {
  try {
    const events = audienceSegmentation.listBehavioralEvents();
    res.json({ ok: true, events });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/contacts/:id/behavior', (req, res) => {
  try {
    const behavior = audienceSegmentation.getContactBehavior(req.params.id);
    res.json({ ok: true, behavior, count: behavior.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3.3 Contact Management
router.get('/contacts', (req, res) => {
  try {
    const result = audienceSegmentation.listContacts(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/contacts', (req, res) => {
  try {
    const contact = audienceSegmentation.createContact(req.body);
    res.json({ ok: true, contact });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/contacts/:id', (req, res) => {
  try {
    const contact = audienceSegmentation.getContact(req.params.id);
    if (!contact) return res.status(404).json({ ok: false, error: 'Contact not found' });
    res.json({ ok: true, contact });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/contacts/:id', (req, res) => {
  try {
    const contact = audienceSegmentation.updateContact(req.params.id, req.body);
    if (!contact) return res.status(404).json({ ok: false, error: 'Contact not found' });
    res.json({ ok: true, contact });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/contacts/:id', (req, res) => {
  try {
    const deleted = audienceSegmentation.deleteContact(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Contact not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/contacts/bulk-import', (req, res) => {
  try {
    const result = audienceSegmentation.bulkImportContacts(req.body.data || []);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/contacts/bulk-update', (req, res) => {
  try {
    const result = audienceSegmentation.bulkUpdateContacts(req.body.updates || []);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/contacts/:id/score', (req, res) => {
  try {
    const contact = audienceSegmentation.calculateContactScore(req.params.id);
    if (!contact) return res.status(404).json({ ok: false, error: 'Contact not found' });
    res.json({ ok: true, contact, score: contact.score });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 3.4 Lists
router.get('/lists', (req, res) => {
  try {
    const lists = audienceSegmentation.listLists();
    res.json({ ok: true, lists });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/lists', (req, res) => {
  try {
    const list = audienceSegmentation.createList(req.body);
    res.json({ ok: true, list });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/lists/:id', (req, res) => {
  try {
    const list = audienceSegmentation.getList(req.params.id);
    if (!list) return res.status(404).json({ ok: false, error: 'List not found' });
    res.json({ ok: true, list });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/lists/:id', (req, res) => {
  try {
    const list = audienceSegmentation.updateList(req.params.id, req.body);
    if (!list) return res.status(404).json({ ok: false, error: 'List not found' });
    res.json({ ok: true, list });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/lists/:id', (req, res) => {
  try {
    const deleted = audienceSegmentation.deleteList(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'List not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message});
  }
});

router.post('/lists/:id/contacts/add', (req, res) => {
  try {
    const list = audienceSegmentation.addContactsToList(req.params.id, req.body.contactIds || []);
    if (!list) return res.status(404).json({ ok: false, error: 'List not found' });
    res.json({ ok: true, list });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/lists/:id/contacts/remove', (req, res) => {
  try {
    const list = audienceSegmentation.removeContactsFromList(req.params.id, req.body.contactIds || []);
    if (!list) return res.status(404).json({ ok: false, error: 'List not found' });
    res.json({ ok: true, list });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

//=============================================================================
// CATEGORY 4: AUTOMATION WORKFLOWS (28 endpoints)
//=============================================================================

router.get('/workflows', (req, res) => {
  try {
    const result = workflowEngine.listWorkflows(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/workflows', (req, res) => {
  try {
    const workflow = workflowEngine.createWorkflow(req.body);
    res.json({ ok: true, workflow });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/workflows/:id', (req, res) => {
  try {
    const workflow = workflowEngine.getWorkflow(req.params.id);
    if (!workflow) return res.status(404).json({ ok: false, error: 'Workflow not found' });
    res.json({ ok: true, workflow });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/workflows/:id', (req, res) => {
  try {
    const workflow = workflowEngine.updateWorkflow(req.params.id, req.body);
    if (!workflow) return res.status(404).json({ ok: false, error: 'Workflow not found' });
    res.json({ ok: true, workflow });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/workflows/:id', (req, res) => {
  try {
    const deleted = workflowEngine.deleteWorkflow(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Workflow not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/workflows/:id/activate', (req, res) => {
  try {
    const workflow = workflowEngine.activateWorkflow(req.params.id);
    if (!workflow) return res.status(404).json({ ok: false, error: 'Workflow not found' });
    res.json({ ok: true, workflow });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/workflows/:id/deactivate', (req, res) => {
  try {
    const workflow = workflowEngine.deactivateWorkflow(req.params.id);
    if (!workflow) return res.status(404).json({ ok: false, error: 'Workflow not found' });
    res.json({ ok: true, workflow });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/workflows/:id/clone', (req, res) => {
  try {
    const workflow = workflowEngine.cloneWorkflow(req.params.id, req.body.name);
    if (!workflow) return res.status(404).json({ ok: false, error: 'Workflow not found' });
    res.json({ ok: true, workflow });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/steps/types', (req, res) => {
  try {
    const types = workflowEngine.listStepTypes();
    res.json({ ok: true, types });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/workflows/templates', (req, res) => {
  try {
    const templates = workflowEngine.getWorkflowTemplates();
    res.json({ ok: true, templates });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/workflows/templates/:id/use', (req, res) => {
  try {
    const workflow = workflowEngine.createWorkflowFromTemplate(req.params.id);
    if (!workflow) return res.status(404).json({ ok: false, error: 'Template not found' });
    res.json({ ok: true, workflow });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/workflows/:id/save-as-template', (req, res) => {
  try {
    const template = workflowEngine.saveAsTemplate(req.params.id, req.body);
    if (!template) return res.status(404).json({ ok: false, error: 'Workflow not found' });
    res.json({ ok: true, template });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

//=============================================================================
// CATEGORY 5: ANALYTICS & PERFORMANCE (30 endpoints)
//=============================================================================

// 5.1 Overview Analytics
router.get('/analytics/overview', (req, res) => {
  try {
    const overview = analyticsEngine.getAnalyticsOverview(req.query);
    res.json({ ok: true, ...overview });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/analytics/campaigns/:id', (req, res) => {
  try {
    const analytics = analyticsEngine.getCampaignAnalytics(req.params.id);
    if (!analytics) return res.status(404).json({ ok: false, error: 'Analytics not found' });
    res.json({ ok: true, analytics });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/analytics/campaigns/:id/track', (req, res) => {
  try {
    const analytics = analyticsEngine.trackCampaignEvent(req.params.id, req.body.eventType, req.body.data || {});
    res.json({ ok: true, analytics });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 5.2 Engagement Analytics
router.get('/analytics/engagement/overview', (req, res) => {
  try {
    const engagement = analyticsEngine.getEngagementOverview(req.query);
    res.json({ ok: true, ...engagement });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/analytics/campaigns/:id/engagement/trends', (req, res) => {
  try {
    const trends = analyticsEngine.getEngagementTrends(req.params.id, req.query.timeframe || '30d');
    if (!trends) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, ...trends });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/analytics/campaigns/:id/device-breakdown', (req, res) => {
  try {
    const data = analyticsEngine.getDeviceBreakdown(req.params.id);
    if (!data) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, ...data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/analytics/campaigns/:id/location-breakdown', (req, res) => {
  try {
    const data = analyticsEngine.getLocationBreakdown(req.params.id);
    if (!data) return res.status(404).json({ ok: false, error: 'Campaign not found' });
    res.json({ ok: true, ...data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 5.3 Revenue Analytics
router.get('/analytics/revenue/overview', (req, res) => {
  try {
    const revenue = analyticsEngine.getRevenueOverview(req.query);
    res.json({ ok: true, ...revenue });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/analytics/revenue/by-segment', (req, res) => {
  try {
    const data = analyticsEngine.getRevenueBySegment(req.query);
    res.json({ ok: true, ...data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/analytics/revenue/by-product', (req, res) => {
  try {
    const data = analyticsEngine.getRevenueByProduct(req.query);
    res.json({ ok: true, ...data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 5.4 Reporting
router.get('/reports', (req, res) => {
  try {
    const result = analyticsEngine.listReports(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/reports', (req, res) => {
  try {
    const report = analyticsEngine.createReport(req.body);
    res.json({ ok: true, report });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/reports/:id', (req, res) => {
  try {
    const report = analyticsEngine.getReport(req.params.id);
    if (!report) return res.status(404).json({ ok: false, error: 'Report not found' });
    res.json({ ok: true, report });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/reports/:id', (req, res) => {
  try {
    const report = analyticsEngine.updateReport(req.params.id, req.body);
    if (!report) return res.status(404).json({ ok: false, error: 'Report not found' });
    res.json({ ok: true, report });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/reports/:id', (req, res) => {
  try {
    const deleted = analyticsEngine.deleteReport(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Report not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/reports/:id/generate', (req, res) => {
  try {
    const result = analyticsEngine.generateReport(req.params.id);
    if (!result) return res.status(404).json({ ok: false, error: 'Report not found' });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/reports/:id/schedule', (req, res) => {
  try {
    const report = analyticsEngine.scheduleReport(req.params.id, req.body.schedule);
    if (!report) return res.status(404).json({ ok: false, error: 'Report not found' });
    res.json({ ok: true, report });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 5.5 Comparative Analytics
router.post('/analytics/compare-campaigns', (req, res) => {
  try {
    const result = analyticsEngine.compareCampaigns(req.body.campaignIds || []);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/analytics/benchmarks', (req, res) => {
  try {
    const benchmarks = analyticsEngine.getBenchmarks();
    res.json({ ok: true, ...benchmarks });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//=============================================================================
// CATEGORY 6: TESTING & OPTIMIZATION (16 endpoints)
//=============================================================================

// 6.1 A/B Testing
router.get('/ab-tests', (req, res) => {
  try {
    const result = testingOptimization.listABTests(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/ab-tests', (req, res) => {
  try {
    const test = testingOptimization.createABTest(req.body);
    res.json({ ok: true, test });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/ab-tests/:id', (req, res) => {
  try {
    const test = testingOptimization.getABTest(req.params.id);
    if (!test) return res.status(404).json({ ok: false, error: 'Test not found' });
    res.json({ ok: true, test });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/ab-tests/:id', (req, res) => {
  try {
    const test = testingOptimization.updateABTest(req.params.id, req.body);
    if (!test) return res.status(404).json({ ok: false, error: 'Test not found' });
    res.json({ ok: true, test });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/ab-tests/:id', (req, res) => {
  try {
    const deleted = testingOptimization.deleteABTest(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Test not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ab-tests/:id/start', (req, res) => {
  try {
    const test = testingOptimization.startABTest(req.params.id);
    if (!test) return res.status(404).json({ ok: false, error: 'Test not found' });
    res.json({ ok: true, test });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/ab-tests/:id/stop', (req, res) => {
  try {
    const test = testingOptimization.stopABTest(req.params.id);
    if (!test) return res.status(404).json({ ok: false, error: 'Test not found' });
    res.json({ ok: true, test });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/ab-tests/:id/results', (req, res) => {
  try {
    const results = testingOptimization.getABTestResults(req.params.id);
    if (!results) return res.status(404).json({ ok: false, error: 'Test not found' });
    res.json({ ok: true, ...results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/ab-tests/:id/declare-winner', (req, res) => {
  try {
    const test = testingOptimization.declareWinner(req.params.id, req.body.variantId);
    if (!test) return res.status(404).json({ ok: false, error: 'Test not found' });
    res.json({ ok: true, test });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/multivariate-tests', (req, res) => {
  try {
    const test = testingOptimization.createMultivariateTest(req.body);
    res.json({ ok: true, test });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 6.2 Send-Time Optimization
router.post('/optimization/send-time/analyze', (req, res) => {
  try {
    const profile = testingOptimization.analyzeSendTime(req.body.contactId);
    res.json({ ok: true, profile });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/optimization/send-time/recommend', (req, res) => {
  try {
    const recommendation = testingOptimization.getBestSendTime(req.body.contactId);
    res.json({ ok: true, ...recommendation });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/optimization/send-time/campaign', (req, res) => {
  try {
    const distribution = testingOptimization.optimizeCampaignSendTime(req.body.campaignId, req.body.audienceSize);
    res.json({ ok: true, ...distribution });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 6.3 Frequency Optimization
router.post('/optimization/frequency/analyze', (req, res) => {
  try {
    const profile = testingOptimization.analyzeFrequency(req.body.contactId);
    res.json({ ok: true, profile });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/optimization/frequency/recommend', (req, res) => {
  try {
    const recommendation = testingOptimization.recommendFrequency(req.body.contactId);
    res.json({ ok: true, ...recommendation });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/optimization/frequency/segment', (req, res) => {
  try {
    const optimization = testingOptimization.optimizeSegmentFrequency(req.body.segmentId, req.body.contactIds || []);
    res.json({ ok: true, ...optimization });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

//=============================================================================
// CATEGORY 7: MULTI-CHANNEL ORCHESTRATION (24 endpoints)
//=============================================================================

// 7.1 Channel Management
router.get('/channels/available', (req, res) => {
  try {
    const result = multiChannel.listAvailableChannels();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/channels/:channel/config', (req, res) => {
  try {
    const config = multiChannel.getChannelConfig(req.params.channel);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.put('/channels/:channel/config', (req, res) => {
  try {
    const config = multiChannel.updateChannelConfig(req.params.channel, req.body);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/channels/:channel/test', (req, res) => {
  try {
    const result = multiChannel.testChannelConnection(req.params.channel);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 7.2 Message Sending
router.post('/channels/email/send', (req, res) => {
  try {
    const result = multiChannel.sendEmail(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/channels/sms/send', (req, res) => {
  try {
    const result = multiChannel.sendSMS(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/channels/push/send', (req, res) => {
  try {
    const result = multiChannel.sendPushNotification(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/channels/whatsapp/send', (req, res) => {
  try {
    const result = multiChannel.sendWhatsApp(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/channels/in-app/send', (req, res) => {
  try {
    const result = multiChannel.sendInAppMessage(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/channels/multi-send', (req, res) => {
  try {
    const result = multiChannel.sendMultiChannel(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 7.3 Deliverability
router.get('/channels/email/deliverability', (req, res) => {
  try {
    const deliverability = multiChannel.getEmailDeliverability(req.query);
    res.json({ ok: true, ...deliverability });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/channels/sms/deliverability', (req, res) => {
  try {
    const deliverability = multiChannel.getSMSDeliverability();
    res.json({ ok: true, ...deliverability });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 7.4 Message Tracking
router.get('/messages/:id/status', (req, res) => {
  try {
    const status = multiChannel.getMessageStatus(req.params.id);
    res.json({ ok: true, ...status });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

router.get('/messages', (req, res) => {
  try {
    const result = multiChannel.listMessages(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//=============================================================================
// CATEGORY 8: SETTINGS & ADMINISTRATION (16 endpoints)
//=============================================================================

// 8.1 ESP Configuration
router.get('/settings/esp/providers', (req, res) => {
  try {
    const result = settingsAdmin.listESPProviders();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/settings/esp/configure', (req, res) => {
  try {
    const config = settingsAdmin.configureESP(req.body);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/settings/esp/:provider', (req, res) => {
  try {
    const config = settingsAdmin.getESPConfiguration(req.params.provider);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

router.post('/settings/esp/:provider/test', (req, res) => {
  try {
    const result = settingsAdmin.testESPConnection(req.params.provider);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 8.2 Domain Management
router.get('/settings/domains', (req, res) => {
  try {
    const result = settingsAdmin.listDomains(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/settings/domains', (req, res) => {
  try {
    const domain = settingsAdmin.addDomain(req.body);
    res.json({ ok: true, domain });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/settings/domains/:id', (req, res) => {
  try {
    const domain = settingsAdmin.getDomain(req.params.id);
    res.json({ ok: true, domain });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

router.post('/settings/domains/:id/verify', (req, res) => {
  try {
    const result = settingsAdmin.verifyDomain(req.params.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/settings/domains/:id', (req, res) => {
  try {
    const deleted = settingsAdmin.deleteDomain(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Domain not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 8.3 API Keys
router.get('/settings/api-keys', (req, res) => {
  try {
    const result = settingsAdmin.listAPIKeys(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/settings/api-keys', (req, res) => {
  try {
    const apiKey = settingsAdmin.createAPIKey(req.body);
    res.json({ ok: true, apiKey });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/settings/api-keys/:id', (req, res) => {
  try {
    const apiKey = settingsAdmin.getAPIKey(req.params.id);
    res.json({ ok: true, apiKey });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

router.post('/settings/api-keys/:id/revoke', (req, res) => {
  try {
    const apiKey = settingsAdmin.revokeAPIKey(req.params.id);
    res.json({ ok: true, apiKey });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

router.delete('/settings/api-keys/:id', (req, res) => {
  try {
    const deleted = settingsAdmin.deleteAPIKey(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'API key not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 8.4 Webhooks
router.get('/settings/webhooks', (req, res) => {
  try {
    const result = settingsAdmin.listWebhooks(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/settings/webhooks', (req, res) => {
  try {
    const webhook = settingsAdmin.createWebhook(req.body);
    res.json({ ok: true, webhook });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/settings/webhooks/:id', (req, res) => {
  try {
    const webhook = settingsAdmin.getWebhook(req.params.id);
    res.json({ ok: true, webhook });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

router.put('/settings/webhooks/:id', (req, res) => {
  try {
    const webhook = settingsAdmin.updateWebhook(req.params.id, req.body);
    res.json({ ok: true, webhook });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

router.delete('/settings/webhooks/:id', (req, res) => {
  try {
    const deleted = settingsAdmin.deleteWebhook(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Webhook not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/settings/webhooks/:id/test', (req, res) => {
  try {
    const result = settingsAdmin.testWebhook(req.params.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

// 8.5 Compliance
router.get('/settings/compliance', (req, res) => {
  try {
    const settings = settingsAdmin.getComplianceSettings();
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/settings/compliance', (req, res) => {
  try {
    const settings = settingsAdmin.updateComplianceSettings(req.body);
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 8.6 Audit Logs
router.get('/settings/audit-logs', (req, res) => {
  try {
    const result = settingsAdmin.getAuditLogs(req.query);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//=============================================================================
// HEALTH & STATUS
//=============================================================================

router.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString(), endpoints: 200, version: '2.0.0-enterprise' });
});

module.exports = router;
