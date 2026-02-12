// ================================================================
// KLAVIYO FLOW AUTOMATION - COMPREHENSIVE ROUTER
// ================================================================
// Integrates all 8 backend modules with 200+ REST API endpoints
// ================================================================

const express = require('express');
const router = express.Router();

// Import all engine modules
const flowBuilderEngine = require('./flow-builder-engine');
const messagingEngine = require('./messaging-engine');
const contactSegmentEngine = require('./contact-segment-engine');
const analyticsReportingEngine = require('./analytics-reporting-engine');
const aiPersonalizationEngine = require('./ai-personalization-engine');
const automationSchedulingEngine = require('./automation-scheduling-engine');
const integrationsSettingsEngine = require('./integrations-settings-engine');
const advancedFeaturesEngine = require('./advanced-features-engine');

// ================================================================
// FLOW BUILDER ENDPOINTS (34 endpoints)
// ================================================================

// Flow Templates
router.get('/flow-templates', (req, res) => {
  const templates = flowBuilderEngine.listFlowTemplates(req.query);
  res.json({ success: true, data: templates, count: templates.length });
});

router.post('/flow-templates', (req, res) => {
  const template = flowBuilderEngine.createFlowTemplate(req.body);
  res.status(201).json({ success: true, data: template });
});

router.get('/flow-templates/:id', (req, res) => {
  const template = flowBuilderEngine.getFlowTemplate(req.params.id);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

router.put('/flow-templates/:id', (req, res) => {
  const template = flowBuilderEngine.updateFlowTemplate(req.params.id, req.body);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

router.delete('/flow-templates/:id', (req, res) => {
  const deleted = flowBuilderEngine.deleteFlowTemplate(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, message: 'Template deleted' });
});

router.post('/flow-templates/:id/clone', (req, res) => {
  const cloned = flowBuilderEngine.cloneFlowTemplate(req.params.id, req.body.name);
  if (!cloned) return res.status(404).json({ success: false, error: 'Template not found' });
  res.status(201).json({ success: true, data: cloned });
});

// Flows
router.get('/flows', (req, res) => {
  const flows = flowBuilderEngine.listFlows(req.query);
  res.json({ success: true, data: flows, count: flows.length });
});

router.post('/flows', (req, res) => {
  const flow = flowBuilderEngine.createFlow(req.body);
  res.status(201).json({ success: true, data: flow });
});

router.get('/flows/:id', (req, res) => {
  const flow = flowBuilderEngine.getFlow(req.params.id);
  if (!flow) return res.status(404).json({ success: false, error: 'Flow not found' });
  res.json({ success: true, data: flow });
});

router.put('/flows/:id', (req, res) => {
  const flow = flowBuilderEngine.updateFlow(req.params.id, req.body);
  if (!flow) return res.status(404).json({ success: false, error: 'Flow not found' });
  res.json({ success: true, data: flow });
});

router.delete('/flows/:id', (req, res) => {
  const deleted = flowBuilderEngine.deleteFlow(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Flow not found' });
  res.json({ success: true, message: 'Flow deleted' });
});

router.post('/flows/:id/clone', (req, res) => {
  const cloned = flowBuilderEngine.cloneFlow(req.params.id, req.body.name);
  if (!cloned) return res.status(404).json({ success: false, error: 'Flow not found' });
  res.status(201).json({ success: true, data: cloned });
});

router.post('/flows/:id/activate', (req, res) => {
  const flow = flowBuilderEngine.activateFlow(req.params.id);
  if (!flow) return res.status(404).json({ success: false, error: 'Flow not found' });
  res.json({ success: true, data: flow });
});

router.post('/flows/:id/pause', (req, res) => {
  const flow = flowBuilderEngine.pauseFlow(req.params.id);
  if (!flow) return res.status(404).json({ success: false, error: 'Flow not found' });
  res.json({ success: true, data: flow });
});

router.post('/flows/:id/archive', (req, res) => {
  const flow = flowBuilderEngine.archiveFlow(req.params.id);
  if (!flow) return res.status(404).json({ success: false, error: 'Flow not found' });
  res.json({ success: true, data: flow });
});

router.post('/flows/:id/validate', (req, res) => {
  const validation = flowBuilderEngine.validateFlow(req.params.id);
  if (!validation) return res.status(404).json({ success: false, error: 'Flow not found' });
  res.json({ success: true, data: validation });
});

// Triggers
router.get('/triggers', (req, res) => {
  const triggers = flowBuilderEngine.listTriggers(req.query);
  res.json({ success: true, data: triggers, count: triggers.length });
});

router.post('/triggers', (req, res) => {
  const trigger = flowBuilderEngine.createTrigger(req.body);
  res.status(201).json({ success: true, data: trigger });
});

router.get('/triggers/:id', (req, res) => {
  const trigger = flowBuilderEngine.getTrigger(req.params.id);
  if (!trigger) return res.status(404).json({ success: false, error: 'Trigger not found' });
  res.json({ success: true, data: trigger });
});

router.put('/triggers/:id', (req, res) => {
  const trigger = flowBuilderEngine.updateTrigger(req.params.id, req.body);
  if (!trigger) return res.status(404).json({ success: false, error: 'Trigger not found' });
  res.json({ success: true, data: trigger });
});

router.delete('/triggers/:id', (req, res) => {
  const deleted = flowBuilderEngine.deleteTrigger(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Trigger not found' });
  res.json({ success: true, message: 'Trigger deleted' });
});

router.post('/triggers/:id/test', (req, res) => {
  const result = flowBuilderEngine.testTrigger(req.params.id, req.body);
  if (!result) return res.status(404).json({ success: false, error: 'Trigger not found' });
  res.json({ success: true, data: result });
});

// Actions
router.get('/actions', (req, res) => {
  const actions = flowBuilderEngine.listActions(req.query);
  res.json({ success: true, data: actions, count: actions.length });
});

router.post('/actions', (req, res) => {
  const action = flowBuilderEngine.createAction(req.body);
  res.status(201).json({ success: true, data: action });
});

router.get('/actions/:id', (req, res) => {
  const action = flowBuilderEngine.getAction(req.params.id);
  if (!action) return res.status(404).json({ success: false, error: 'Action not found' });
  res.json({ success: true, data: action });
});

router.put('/actions/:id', (req, res) => {
  const action = flowBuilderEngine.updateAction(req.params.id, req.body);
  if (!action) return res.status(404).json({ success: false, error: 'Action not found' });
  res.json({ success: true, data: action });
});

router.delete('/actions/:id', (req, res) => {
  const deleted = flowBuilderEngine.deleteAction(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Action not found' });
  res.json({ success: true, message: 'Action deleted' });
});

router.post('/actions/:id/test', (req, res) => {
  const result = flowBuilderEngine.testAction(req.params.id, req.body);
  if (!result) return res.status(404).json({ success: false, error: 'Action not found' });
  res.json({ success: true, data: result });
});

// Campaigns
router.get('/campaigns', (req, res) => {
  const campaigns = flowBuilderEngine.listCampaigns(req.query);
  res.json({ success: true, data: campaigns, count: campaigns.length });
});

router.post('/campaigns', (req, res) => {
  const campaign = flowBuilderEngine.createCampaign(req.body);
  res.status(201).json({ success: true, data: campaign });
});

router.get('/campaigns/:id', (req, res) => {
  const campaign = flowBuilderEngine.getCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  res.json({ success: true, data: campaign });
});

router.put('/campaigns/:id', (req, res) => {
  const campaign = flowBuilderEngine.updateCampaign(req.params.id, req.body);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  res.json({ success: true, data: campaign });
});

router.delete('/campaigns/:id', (req, res) => {
  const deleted = flowBuilderEngine.deleteCampaign(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Campaign not found' });
  res.json({ success: true, message: 'Campaign deleted' });
});

router.post('/campaigns/:id/launch', (req, res) => {
  const campaign = flowBuilderEngine.launchCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  res.json({ success: true, data: campaign });
});

router.post('/campaigns/:id/pause', (req, res) => {
  const campaign = flowBuilderEngine.pauseCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  res.json({ success: true, data: campaign });
});

// ================================================================
// MESSAGING ENDPOINTS (30 endpoints)
// ================================================================

// Email Templates
router.get('/email-templates', (req, res) => {
  const templates = messagingEngine.listEmailTemplates(req.query);
  res.json({ success: true, data: templates, count: templates.length });
});

router.post('/email-templates', (req, res) => {
  const template = messagingEngine.createEmailTemplate(req.body);
  res.status(201).json({ success: true, data: template });
});

router.get('/email-templates/:id', (req, res) => {
  const template = messagingEngine.getEmailTemplate(req.params.id);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

router.put('/email-templates/:id', (req, res) => {
  const template = messagingEngine.updateEmailTemplate(req.params.id, req.body);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

router.delete('/email-templates/:id', (req, res) => {
  const deleted = messagingEngine.deleteEmailTemplate(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, message: 'Template deleted' });
});

router.post('/email-templates/:id/clone', (req, res) => {
  const cloned = messagingEngine.cloneEmailTemplate(req.params.id, req.body.name);
  if (!cloned) return res.status(404).json({ success: false, error: 'Template not found' });
  res.status(201).json({ success: true, data: cloned });
});

router.post('/send-email', (req, res) => {
  const message = messagingEngine.sendEmail(req.body);
  res.status(201).json({ success: true, data: message });
});

// SMS Templates
router.get('/sms-templates', (req, res) => {
  const templates = messagingEngine.listSMSTemplates(req.query);
  res.json({ success: true, data: templates, count: templates.length });
});

router.post('/sms-templates', (req, res) => {
  const template = messagingEngine.createSMSTemplate(req.body);
  res.status(201).json({ success: true, data: template });
});

router.get('/sms-templates/:id', (req, res) => {
  const template = messagingEngine.getSMSTemplate(req.params.id);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

router.put('/sms-templates/:id', (req, res) => {
  const template = messagingEngine.updateSMSTemplate(req.params.id, req.body);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

router.delete('/sms-templates/:id', (req, res) => {
  const deleted = messagingEngine.deleteSMSTemplate(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, message: 'Template deleted' });
});

router.post('/send-sms', (req, res) => {
  const message = messagingEngine.sendSMS(req.body);
  res.status(201).json({ success: true, data: message });
});

// Push Notifications
router.get('/push-templates', (req, res) => {
  const templates = messagingEngine.listPushTemplates(req.query);
  res.json({ success: true, data: templates, count: templates.length });
});

router.post('/push-templates', (req, res) => {
  const template = messagingEngine.createPushTemplate(req.body);
  res.status(201).json({ success: true, data: template });
});

router.get('/push-templates/:id', (req, res) => {
  const template = messagingEngine.getPushTemplate(req.params.id);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

router.put('/push-templates/:id', (req, res) => {
  const template = messagingEngine.updatePushTemplate(req.params.id, req.body);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

router.delete('/push-templates/:id', (req, res) => {
  const deleted = messagingEngine.deletePushTemplate(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, message: 'Template deleted' });
});

router.post('/send-push', (req, res) => {
  const message = messagingEngine.sendPushNotification(req.body);
  res.status(201).json({ success: true, data: message });
});

// Webhooks & Messages
router.post('/webhooks/send', (req, res) => {
  const message = messagingEngine.sendWebhook(req.body);
  res.status(201).json({ success: true, data: message });
});

router.get('/messages', (req, res) => {
  const messages = messagingEngine.listMessages(req.query);
  res.json({ success: true, data: messages, count: messages.length });
});

router.get('/messages/:id', (req, res) => {
  const message = messagingEngine.getMessage(req.params.id);
  if (!message) return res.status(404).json({ success: false, error: 'Message not found' });
  res.json({ success: true, data: message });
});

router.get('/messages/:id/status', (req, res) => {
  const status = messagingEngine.getMessageStatus(req.params.id);
  if (!status) return res.status(404).json({ success: false, error: 'Message not found' });
  res.json({ success: true, data: status });
});

router.post('/messages/:id/cancel', (req, res) => {
  const message = messagingEngine.cancelMessage(req.params.id);
  if (!message) return res.status(404).json({ success: false, error: 'Message not found or cannot be cancelled' });
  res.json({ success: true, data: message });
});

router.post('/messages/:id/retry', (req, res) => {
  const message = messagingEngine.retryMessage(req.params.id);
  if (!message) return res.status(404).json({ success: false, error: 'Message not found or cannot be retried' });
  res.json({ success: true, data: message });
});

router.get('/send-history', (req, res) => {
  const history = messagingEngine.getSendHistory(req.query);
  res.json({ success: true, data: history, count: history.length });
});

router.post('/send-events', (req, res) => {
  const event = messagingEngine.recordSendEvent(req.body);
  res.status(201).json({ success: true, data: event });
});

router.get('/channel-stats/:channel', (req, res) => {
  const stats = messagingEngine.getChannelStats(req.params.channel, req.query.timeframe);
  res.json({ success: true, data: stats });
});

router.post('/delivery/track', (req, res) => {
  const tracking = messagingEngine.trackDelivery(req.body.messageId, req.body.status, req.body.metadata);
  res.status(201).json({ success: true, data: tracking });
});

router.get('/delivery/:messageId', (req, res) => {
  const status = messagingEngine.getDeliveryStatus(req.params.messageId);
  res.json({ success: true, data: status });
});

// ================================================================
// CONTACTS & SEGMENTS ENDPOINTS (31 endpoints)
// ================================================================

// Contacts
router.get('/contacts', (req, res) => {
  const contacts = contactSegmentEngine.listContacts(req.query);
  res.json({ success: true, data: contacts, count: contacts.length });
});

router.post('/contacts', (req, res) => {
  const contact = contactSegmentEngine.createContact(req.body);
  res.status(201).json({ success: true, data: contact });
});

router.get('/contacts/:id', (req, res) => {
  const contact = contactSegmentEngine.getContact(req.params.id);
  if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' });
  res.json({ success: true, data: contact });
});

router.get('/contacts/email/:email', (req, res) => {
  const contact = contactSegmentEngine.getContactByEmail(req.params.email);
  if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' });
  res.json({ success: true, data: contact });
});

router.put('/contacts/:id', (req, res) => {
  const contact = contactSegmentEngine.updateContact(req.params.id, req.body);
  if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' });
  res.json({ success: true, data: contact });
});

router.delete('/contacts/:id', (req, res) => {
  const deleted = contactSegmentEngine.deleteContact(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Contact not found' });
  res.json({ success: true, message: 'Contact deleted' });
});

router.post('/contacts/:id/enrich', (req, res) => {
  const contact = contactSegmentEngine.enrichContact(req.params.id, req.body);
  if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' });
  res.json({ success: true, data: contact });
});

router.post('/contacts/:id/subscribe', (req, res) => {
  const contact = contactSegmentEngine.subscribeContact(req.params.id);
  if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' });
  res.json({ success: true, data: contact });
});

router.post('/contacts/:id/unsubscribe', (req, res) => {
  const contact = contactSegmentEngine.unsubscribeContact(req.params.id);
  if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' });
  res.json({ success: true, data: contact });
});

router.post('/contacts/export', (req, res) => {
  const exportData = contactSegmentEngine.exportContacts(req.body);
  res.json({ success: true, data: exportData });
});

// Segments
router.get('/segments', (req, res) => {
  const segments = contactSegmentEngine.listSegments(req.query);
  res.json({ success: true, data: segments, count: segments.length });
});

router.post('/segments', (req, res) => {
  const segment = contactSegmentEngine.createSegment(req.body);
  res.status(201).json({ success: true, data: segment });
});

router.get('/segments/:id', (req, res) => {
  const segment = contactSegmentEngine.getSegment(req.params.id);
  if (!segment) return res.status(404).json({ success: false, error: 'Segment not found' });
  res.json({ success: true, data: segment });
});

router.put('/segments/:id', (req, res) => {
  const segment = contactSegmentEngine.updateSegment(req.params.id, req.body);
  if (!segment) return res.status(404).json({ success: false, error: 'Segment not found' });
  res.json({ success: true, data: segment });
});

router.delete('/segments/:id', (req, res) => {
  const deleted = contactSegmentEngine.deleteSegment(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Segment not found' });
  res.json({ success: true, message: 'Segment deleted' });
});

router.post('/segments/:id/compute', (req, res) => {
  const segment = contactSegmentEngine.computeSegment(req.params.id);
  if (!segment) return res.status(404).json({ success: false, error: 'Segment not found' });
  res.json({ success: true, data: segment });
});

router.post('/segments/:id/contacts', (req, res) => {
  const segment = contactSegmentEngine.addContactsToSegment(req.params.id, req.body.contactIds);
  if (!segment) return res.status(404).json({ success: false, error: 'Segment not found or invalid operation' });
  res.json({ success: true, data: segment });
});

router.delete('/segments/:id/contacts', (req, res) => {
  const segment = contactSegmentEngine.removeContactsFromSegment(req.params.id, req.body.contactIds);
  if (!segment) return res.status(404).json({ success: false, error: 'Segment not found' });
  res.json({ success: true, data: segment });
});

// Lists
router.get('/lists', (req, res) => {
  const lists = contactSegmentEngine.listLists(req.query);
  res.json({ success: true, data: lists, count: lists.length });
});

router.post('/lists', (req, res) => {
  const list = contactSegmentEngine.createList(req.body);
  res.status(201).json({ success: true, data: list });
});

router.get('/lists/:id', (req, res) => {
  const list = contactSegmentEngine.getList(req.params.id);
  if (!list) return res.status(404).json({ success: false, error: 'List not found' });
  res.json({ success: true, data: list });
});

router.put('/lists/:id', (req, res) => {
  const list = contactSegmentEngine.updateList(req.params.id, req.body);
  if (!list) return res.status(404).json({ success: false, error: 'List not found' });
  res.json({ success: true, data: list });
});

router.delete('/lists/:id', (req, res) => {
  const deleted = contactSegmentEngine.deleteList(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'List not found' });
  res.json({ success: true, message: 'List deleted' });
});

router.post('/lists/:id/contacts', (req, res) => {
  const list = contactSegmentEngine.addContactsToList(req.params.id, req.body.contactIds);
  if (!list) return res.status(404).json({ success: false, error: 'List not found' });
  res.json({ success: true, data: list });
});

router.delete('/lists/:id/contacts', (req, res) => {
  const list = contactSegmentEngine.removeContactsFromList(req.params.id, req.body.contactIds);
  if (!list) return res.status(404).json({ success: false, error: 'List not found' });
  res.json({ success: true, data: list });
});

// Audiences
router.get('/audiences', (req, res) => {
  const audiences = contactSegmentEngine.listAudiences(req.query);
  res.json({ success: true, data: audiences, count: audiences.length });
});

router.post('/audiences', (req, res) => {
  const audience = contactSegmentEngine.createAudience(req.body);
  res.status(201).json({ success: true, data: audience });
});

router.get('/audiences/:id', (req, res) => {
  const audience = contactSegmentEngine.getAudience(req.params.id);
  if (!audience) return res.status(404).json({ success: false, error: 'Audience not found' });
  res.json({ success: true, data: audience });
});

router.put('/audiences/:id', (req, res) => {
  const audience = contactSegmentEngine.updateAudience(req.params.id, req.body);
  if (!audience) return res.status(404).json({ success: false, error: 'Audience not found' });
  res.json({ success: true, data: audience });
});

router.delete('/audiences/:id', (req, res) => {
  const deleted = contactSegmentEngine.deleteAudience(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Audience not found' });
  res.json({ success: true, message: 'Audience deleted' });
});

router.post('/audiences/:id/compute', (req, res) => {
  const audience = contactSegmentEngine.computeAudience(req.params.id);
  if (!audience) return res.status(404).json({ success: false, error: 'Audience not found' });
  res.json({ success: true, data: audience });
});

// Import/Export
router.post('/import-jobs', (req, res) => {
  const job = contactSegmentEngine.createImportJob(req.body);
  res.status(201).json({ success: true, data: job });
});

router.get('/import-jobs/:id', (req, res) => {
  const job = contactSegmentEngine.getImportJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Import job not found' });
  res.json({ success: true, data: job });
});

router.post('/import-jobs/:id/process', (req, res) => {
  const job = contactSegmentEngine.processImport(req.params.id, req.body.data);
  if (!job) return res.status(404).json({ success: false, error: 'Import job not found' });
  res.json({ success: true, data: job });
});

// ================================================================
// ANALYTICS & REPORTING ENDPOINTS (28 endpoints)
// ================================================================

// Metrics
router.post('/metrics', (req, res) => {
  const metric = analyticsReportingEngine.trackMetric(req.body);
  res.status(201).json({ success: true, data: metric });
});

router.get('/metrics', (req, res) => {
  const metrics = analyticsReportingEngine.getMetrics(req.query);
  res.json({ success: true, data: metrics, count: metrics.length });
});

router.get('/metrics/:name/aggregate', (req, res) => {
  const value = analyticsReportingEngine.aggregateMetrics(req.params.name, req.query.aggregation, req.query);
  res.json({ success: true, data: { metric: req.params.name, value } });
});

// Reports
router.get('/reports', (req, res) => {
  const reports = analyticsReportingEngine.listReports(req.query);
  res.json({ success: true, data: reports, count: reports.length });
});

router.post('/reports', (req, res) => {
  const report = analyticsReportingEngine.createReport(req.body);
  res.status(201).json({ success: true, data: report });
});

router.get('/reports/:id', (req, res) => {
  const report = analyticsReportingEngine.getReport(req.params.id);
  if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
  res.json({ success: true, data: report });
});

router.put('/reports/:id', (req, res) => {
  const report = analyticsReportingEngine.updateReport(req.params.id, req.body);
  if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
  res.json({ success: true, data: report });
});

router.delete('/reports/:id', (req, res) => {
  const deleted = analyticsReportingEngine.deleteReport(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Report not found' });
  res.json({ success: true, message: 'Report deleted' });
});

router.post('/reports/:id/generate', (req, res) => {
  const data = analyticsReportingEngine.generateReport(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: 'Report not found' });
  res.json({ success: true, data });
});

// Dashboards
router.get('/dashboards', (req, res) => {
  const dashboards = analyticsReportingEngine.listDashboards(req.query);
  res.json({ success: true, data: dashboards, count: dashboards.length });
});

router.post('/dashboards', (req, res) => {
  const dashboard = analyticsReportingEngine.createDashboard(req.body);
  res.status(201).json({ success: true, data: dashboard });
});

router.get('/dashboards/:id', (req, res) => {
  const dashboard = analyticsReportingEngine.getDashboard(req.params.id);
  if (!dashboard) return res.status(404).json({ success: false, error: 'Dashboard not found' });
  res.json({ success: true, data: dashboard });
});

router.put('/dashboards/:id', (req, res) => {
  const dashboard = analyticsReportingEngine.updateDashboard(req.params.id, req.body);
  if (!dashboard) return res.status(404).json({ success: false, error: 'Dashboard not found' });
  res.json({ success: true, data: dashboard });
});

router.delete('/dashboards/:id', (req, res) => {
  const deleted = analyticsReportingEngine.deleteDashboard(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Dashboard not found' });
  res.json({ success: true, message: 'Dashboard deleted' });
});

router.get('/dashboards/:id/data', (req, res) => {
  const data = analyticsReportingEngine.getDashboardData(req.params.id, req.query);
  if (!data) return res.status(404).json({ success: false, error: 'Dashboard not found' });
  res.json({ success: true, data });
});

// Insights
router.post('/insights/generate', (req, res) => {
  const insight = analyticsReportingEngine.generateInsights(req.body);
  res.status(201).json({ success: true, data: insight });
});

router.get('/insights', (req, res) => {
  const insights = analyticsReportingEngine.listInsights(req.query);
  res.json({ success: true, data: insights, count: insights.length });
});

router.get('/insights/:id', (req, res) => {
  const insight = analyticsReportingEngine.getInsight(req.params.id);
  if (!insight) return res.status(404).json({ success: false, error: 'Insight not found' });
  res.json({ success: true, data: insight });
});

// Events
router.post('/events', (req, res) => {
  const event = analyticsReportingEngine.trackEvent(req.body);
  res.status(201).json({ success: true, data: event });
});

router.get('/events', (req, res) => {
  const events = analyticsReportingEngine.getEvents(req.query);
  res.json({ success: true, data: events, count: events.length });
});

// Attribution
router.post('/attribution-models', (req, res) => {
  const model = analyticsReportingEngine.createAttributionModel(req.body);
  res.status(201).json({ success: true, data: model });
});

router.get('/attribution-models/:id', (req, res) => {
  const model = analyticsReportingEngine.getAttributionModel(req.params.id);
  if (!model) return res.status(404).json({ success: false, error: 'Attribution model not found' });
  res.json({ success: true, data: model });
});

router.post('/attribution-models/:id/calculate', (req, res) => {
  const attribution = analyticsReportingEngine.calculateAttribution(req.params.id, req.body.conversions);
  if (!attribution) return res.status(404).json({ success: false, error: 'Attribution model not found' });
  res.json({ success: true, data: attribution });
});

// Performance
router.get('/performance/flows/:flowId', (req, res) => {
  const stats = analyticsReportingEngine.getFlowPerformance(req.params.flowId, req.query);
  res.json({ success: true, data: stats });
});

router.get('/performance/campaigns/:campaignId', (req, res) => {
  const stats = analyticsReportingEngine.getCampaignPerformance(req.params.campaignId, req.query);
  res.json({ success: true, data: stats });
});

// ================================================================
// AI & PERSONALIZATION ENDPOINTS (26 endpoints)
// ================================================================

// Predictions
router.post('/predictions', (req, res) => {
  const prediction = aiPersonalizationEngine.createPrediction(req.body);
  res.status(201).json({ success: true, data: prediction });
});

router.get('/predictions/:id', (req, res) => {
  const prediction = aiPersonalizationEngine.getPrediction(req.params.id);
  if (!prediction) return res.status(404).json({ success: false, error: 'Prediction not found' });
  res.json({ success: true, data: prediction });
});

router.get('/predictions/contact/:contactId', (req, res) => {
  const predictions = aiPersonalizationEngine.getPredictionsByContact(req.params.contactId, req.query.type);
  res.json({ success: true, data: predictions, count: predictions.length });
});

router.post('/predictions/churn', (req, res) => {
  const prediction = aiPersonalizationEngine.predictChurn(req.body.contactId, req.body.data);
  res.status(201).json({ success: true, data: prediction });
});

router.post('/predictions/ltv', (req, res) => {
  const prediction = aiPersonalizationEngine.predictLTV(req.body.contactId, req.body.data);
  res.status(201).json({ success: true, data: prediction });
});

router.post('/predictions/next-purchase', (req, res) => {
  const prediction = aiPersonalizationEngine.predictNextPurchase(req.body.contactId, req.body.data);
  res.status(201).json({ success: true, data: prediction });
});

// Personalization
router.get('/personalization-rules', (req, res) => {
  const rules = aiPersonalizationEngine.listPersonalizationRules(req.query);
  res.json({ success: true, data: rules, count: rules.length });
});

router.post('/personalization-rules', (req, res) => {
  const rule = aiPersonalizationEngine.createPersonalizationRule(req.body);
  res.status(201).json({ success: true, data: rule });
});

router.get('/personalization-rules/:id', (req, res) => {
  const rule = aiPersonalizationEngine.getPersonalizationRule(req.params.id);
  if (!rule) return res.status(404).json({ success: false, error: 'Personalization rule not found' });
  res.json({ success: true, data: rule });
});

router.put('/personalization-rules/:id', (req, res) => {
  const rule = aiPersonalizationEngine.updatePersonalizationRule(req.params.id, req.body);
  if (!rule) return res.status(404).json({ success: false, error: 'Personalization rule not found' });
  res.json({ success: true, data: rule });
});

router.delete('/personalization-rules/:id', (req, res) => {
  const deleted = aiPersonalizationEngine.deletePersonalizationRule(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Personalization rule not found' });
  res.json({ success: true, message: 'Personalization rule deleted' });
});

router.post('/personalize-content', (req, res) => {
  const personalizedContent = aiPersonalizationEngine.personalizeContent(req.body.content, req.body.contactData);
  res.json({ success: true, data: { content: personalizedContent } });
});

// Recommendations
router.post('/recommendations/generate', (req, res) => {
  const recommendation = aiPersonalizationEngine.generateRecommendations(req.body.contactId, req.body.data);
  res.status(201).json({ success: true, data: recommendation });
});

router.get('/recommendations/contact/:contactId', (req, res) => {
  const recommendations = aiPersonalizationEngine.getRecommendations(req.params.contactId, req.query.type);
  res.json({ success: true, data: recommendations, count: recommendations.length });
});

// A/B Testing
router.post('/ab-tests', (req, res) => {
  const test = aiPersonalizationEngine.createABTest(req.body);
  res.status(201).json({ success: true, data: test });
});

router.get('/ab-tests/:id', (req, res) => {
  const test = aiPersonalizationEngine.getABTest(req.params.id);
  if (!test) return res.status(404).json({ success: false, error: 'A/B test not found' });
  res.json({ success: true, data: test });
});

router.post('/ab-tests/:id/assign', (req, res) => {
  const assignment = aiPersonalizationEngine.assignVariant(req.params.id, req.body.contactId);
  if (!assignment) return res.status(404).json({ success: false, error: 'A/B test not found or inactive' });
  res.json({ success: true, data: assignment });
});

router.post('/ab-tests/:id/results', (req, res) => {
  const test = aiPersonalizationEngine.recordABTestResult(req.params.id, req.body.variantId, req.body.outcome);
  if (!test) return res.status(404).json({ success: false, error: 'A/B test not found' });
  res.json({ success: true, data: test });
});

router.post('/ab-tests/:id/analyze', (req, res) => {
  const analysis = aiPersonalizationEngine.analyzeABTest(req.params.id);
  if (!analysis) return res.status(404).json({ success: false, error: 'A/B test not found' });
  res.json({ success: true, data: analysis });
});

// Optimization
router.post('/optimization/send-time', (req, res) => {
  const optimization = aiPersonalizationEngine.optimizeSendTime(req.body.contactId, req.body.data);
  res.status(201).json({ success: true, data: optimization });
});

router.post('/optimization/frequency', (req, res) => {
  const optimization = aiPersonalizationEngine.optimizeFrequency(req.body.contactId, req.body.data);
  res.status(201).json({ success: true, data: optimization });
});

// ML Models
router.post('/ml-models/train', (req, res) => {
  const model = aiPersonalizationEngine.trainModel(req.body);
  res.status(201).json({ success: true, data: model });
});

router.get('/ml-models/:id', (req, res) => {
  const model = aiPersonalizationEngine.getModel(req.params.id);
  if (!model) return res.status(404).json({ success: false, error: 'Model not found' });
  res.json({ success: true, data: model });
});

router.get('/ml-models', (req, res) => {
  const models = aiPersonalizationEngine.listModels(req.query);
  res.json({ success: true, data: models, count: models.length });
});

// ================================================================
// AUTOMATION & SCHEDULING ENDPOINTS (29 endpoints)
// ================================================================

// Automation Rules
router.get('/automation-rules', (req, res) => {
  const rules = automationSchedulingEngine.listAutomationRules(req.query);
  res.json({ success: true, data: rules, count: rules.length });
});

router.post('/automation-rules', (req, res) => {
  const rule = automationSchedulingEngine.createAutomationRule(req.body);
  res.status(201).json({ success: true, data: rule });
});

router.get('/automation-rules/:id', (req, res) => {
  const rule = automationSchedulingEngine.getAutomationRule(req.params.id);
  if (!rule) return res.status(404).json({ success: false, error: 'Rule not found' });
  res.json({ success: true, data: rule });
});

router.put('/automation-rules/:id', (req, res) => {
  const rule = automationSchedulingEngine.updateAutomationRule(req.params.id, req.body);
  if (!rule) return res.status(404).json({ success: false, error: 'Rule not found' });
  res.json({ success: true, data: rule });
});

router.delete('/automation-rules/:id', (req, res) => {
  const deleted = automationSchedulingEngine.deleteAutomationRule(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Rule not found' });
  res.json({ success: true, message: 'Rule deleted' });
});

router.post('/automation-rules/:id/execute', (req, res) => {
  const result = automationSchedulingEngine.executeAutomationRule(req.params.id, req.body);
  if (!result) return res.status(404).json({ success: false, error: 'Rule not found or inactive' });
  res.json({ success: true, data: result });
});

// Schedules
router.get('/schedules', (req, res) => {
  const schedules = automationSchedulingEngine.listSchedules(req.query);
  res.json({ success: true, data: schedules, count: schedules.length });
});

router.post('/schedules', (req, res) => {
  const schedule = automationSchedulingEngine.createSchedule(req.body);
  res.status(201).json({ success: true, data: schedule });
});

router.get('/schedules/:id', (req, res) => {
  const schedule = automationSchedulingEngine.getSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: schedule });
});

router.put('/schedules/:id', (req, res) => {
  const schedule = automationSchedulingEngine.updateSchedule(req.params.id, req.body);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: schedule });
});

router.delete('/schedules/:id', (req, res) => {
  const deleted = automationSchedulingEngine.deleteSchedule(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, message: 'Schedule deleted' });
});

router.post('/schedules/:id/pause', (req, res) => {
  const schedule = automationSchedulingEngine.pauseSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: schedule });
});

router.post('/schedules/:id/resume', (req, res) => {
  const schedule = automationSchedulingEngine.resumeSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: schedule });
});

router.post('/schedules/:id/execute', (req, res) => {
  const result = automationSchedulingEngine.executeSchedule(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: result });
});

// Jobs
router.post('/jobs', (req, res) => {
  const job = automationSchedulingEngine.createJob(req.body);
  res.status(201).json({ success: true, data: job });
});

router.get('/jobs/:id', (req, res) => {
  const job = automationSchedulingEngine.getJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
  res.json({ success: true, data: job });
});

router.get('/jobs', (req, res) => {
  const jobs = automationSchedulingEngine.listJobs(req.query);
  res.json({ success: true, data: jobs, count: jobs.length });
});

router.post('/jobs/:id/process', (req, res) => {
  const job = automationSchedulingEngine.processJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found or not queued' });
  res.json({ success: true, data: job });
});

router.post('/jobs/:id/retry', (req, res) => {
  const job = automationSchedulingEngine.retryJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found or not failed' });
  res.json({ success: true, data: job });
});

router.post('/jobs/:id/cancel', (req, res) => {
  const job = automationSchedulingEngine.cancelJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found or cannot be cancelled' });
  res.json({ success: true, data: job });
});

// Delays
router.post('/delays', (req, res) => {
  const delay = automationSchedulingEngine.createDelay(req.body);
  res.status(201).json({ success: true, data: delay });
});

router.get('/delays/:id', (req, res) => {
  const delay = automationSchedulingEngine.getDelay(req.params.id);
  if (!delay) return res.status(404).json({ success: false, error: 'Delay not found' });
  res.json({ success: true, data: delay });
});

router.get('/delays', (req, res) => {
  const delays = automationSchedulingEngine.listDelays(req.query);
  res.json({ success: true, data: delays, count: delays.length });
});

router.post('/delays/process', (req, res) => {
  const count = automationSchedulingEngine.processPendingDelays();
  res.json({ success: true, data: { processed: count } });
});

// Workflows
router.post('/workflows', (req, res) => {
  const workflow = automationSchedulingEngine.createWorkflow(req.body);
  res.status(201).json({ success: true, data: workflow });
});

router.get('/workflows/:id', (req, res) => {
  const workflow = automationSchedulingEngine.getWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
  res.json({ success: true, data: workflow });
});

router.post('/workflows/:id/execute', (req, res) => {
  const workflow = automationSchedulingEngine.executeWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
  res.json({ success: true, data: workflow });
});

router.post('/workflows/:id/pause', (req, res) => {
  const workflow = automationSchedulingEngine.pauseWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found or not running' });
  res.json({ success: true, data: workflow });
});

router.post('/workflows/:id/resume', (req, res) => {
  const workflow = automationSchedulingEngine.resumeWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found or not paused' });
  res.json({ success: true, data: workflow });
});

router.post('/workflows/:id/cancel', (req, res) => {
  const workflow = automationSchedulingEngine.cancelWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
  res.json({ success: true, data: workflow });
});

// Retry Policies
router.post('/retry-policies', (req, res) => {
  const policy = automationSchedulingEngine.createRetryPolicy(req.body);
  res.status(201).json({ success: true, data: policy });
});

router.get('/retry-policies/:id', (req, res) => {
  const policy = automationSchedulingEngine.getRetryPolicy(req.params.id);
  if (!policy) return res.status(404).json({ success: false, error: 'Policy not found' });
  res.json({ success: true, data: policy });
});

// ================================================================
// INTEGRATIONS & SETTINGS ENDPOINTS (36 endpoints)
// ================================================================

// Integrations
router.get('/integrations', (req, res) => {
  const integrations = integrationsSettingsEngine.listIntegrations(req.query);
  res.json({ success: true, data: integrations, count: integrations.length });
});

router.post('/integrations', (req, res) => {
  const integration = integrationsSettingsEngine.createIntegration(req.body);
  res.status(201).json({ success: true, data: integration });
});

router.get('/integrations/:id', (req, res) => {
  const integration = integrationsSettingsEngine.getIntegration(req.params.id);
  if (!integration) return res.status(404).json({ success: false, error: 'Integration not found' });
  res.json({ success: true, data: integration });
});

router.put('/integrations/:id', (req, res) => {
  const integration = integrationsSettingsEngine.updateIntegration(req.params.id, req.body);
  if (!integration) return res.status(404).json({ success: false, error: 'Integration not found' });
  res.json({ success: true, data: integration });
});

router.delete('/integrations/:id', (req, res) => {
  const deleted = integrationsSettingsEngine.deleteIntegration(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Integration not found' });
  res.json({ success: true, message: 'Integration deleted' });
});

router.post('/integrations/:id/test', (req, res) => {
  const result = integrationsSettingsEngine.testIntegration(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: 'Integration not found' });
  res.json({ success: true, data: result });
});

router.post('/integrations/:id/sync', (req, res) => {
  const result = integrationsSettingsEngine.syncIntegration(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: 'Integration not found' });
  res.json({ success: true, data: result });
});

// Webhooks
router.get('/webhooks', (req, res) => {
  const webhooks = integrationsSettingsEngine.listWebhooks(req.query);
  res.json({ success: true, data: webhooks, count: webhooks.length });
});

router.post('/webhooks', (req, res) => {
  const webhook = integrationsSettingsEngine.createWebhook(req.body);
  res.status(201).json({ success: true, data: webhook });
});

router.get('/webhooks/:id', (req, res) => {
  const webhook = integrationsSettingsEngine.getWebhook(req.params.id);
  if (!webhook) return res.status(404).json({ success: false, error: 'Webhook not found' });
  res.json({ success: true, data: webhook });
});

router.put('/webhooks/:id', (req, res) => {
  const webhook = integrationsSettingsEngine.updateWebhook(req.params.id, req.body);
  if (!webhook) return res.status(404).json({ success: false, error: 'Webhook not found' });
  res.json({ success: true, data: webhook });
});

router.delete('/webhooks/:id', (req, res) => {
  const deleted = integrationsSettingsEngine.deleteWebhook(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Webhook not found' });
  res.json({ success: true, message: 'Webhook deleted' });
});

router.post('/webhooks/:id/trigger', (req, res) => {
  const result = integrationsSettingsEngine.triggerWebhook(req.params.id, req.body.event, req.body.payload);
  if (!result) return res.status(404).json({ success: false, error: 'Webhook not found or inactive' });
  res.json({ success: true, data: result });
});

router.post('/webhooks/:id/test', (req, res) => {
  const result = integrationsSettingsEngine.testWebhook(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: 'Webhook not found' });
  res.json({ success: true, data: result });
});

// API Keys
router.get('/api-keys', (req, res) => {
  const keys = integrationsSettingsEngine.listAPIKeys(req.query);
  res.json({ success: true, data: keys, count: keys.length });
});

router.post('/api-keys', (req, res) => {
  const key = integrationsSettingsEngine.createAPIKey(req.body);
  res.status(201).json({ success: true, data: key });
});

router.get('/api-keys/:id', (req, res) => {
  const key = integrationsSettingsEngine.getAPIKey(req.params.id);
  if (!key) return res.status(404).json({ success: false, error: 'API key not found' });
  res.json({ success: true, data: key });
});

router.post('/api-keys/validate', (req, res) => {
  const result = integrationsSettingsEngine.validateAPIKey(req.body.key);
  res.json({ success: true, data: result });
});

router.post('/api-keys/:id/revoke', (req, res) => {
  const key = integrationsSettingsEngine.revokeAPIKey(req.params.id);
  if (!key) return res.status(404).json({ success: false, error: 'API key not found' });
  res.json({ success: true, data: key });
});

router.post('/api-keys/:id/rotate', (req, res) => {
  const newKey = integrationsSettingsEngine.rotateAPIKey(req.params.id);
  if (!newKey) return res.status(404).json({ success: false, error: 'API key not found' });
  res.json({ success: true, data: newKey });
});

// Settings
router.get('/settings/:category', (req, res) => {
  const settings = integrationsSettingsEngine.getSettings(req.params.category);
  res.json({ success: true, data: settings });
});

router.put('/settings/:category', (req, res) => {
  const settings = integrationsSettingsEngine.updateSettings(req.params.category, req.body);
  res.json({ success: true, data: settings });
});

router.post('/settings/:category/reset', (req, res) => {
  const settings = integrationsSettingsEngine.resetSettings(req.params.category);
  res.json({ success: true, data: settings });
});

// Connections
router.post('/connections', (req, res) => {
  const connection = integrationsSettingsEngine.createConnection(req.body);
  res.status(201).json({ success: true, data: connection });
});

router.get('/connections/:id', (req, res) => {
  const connection = integrationsSettingsEngine.getConnection(req.params.id);
  if (!connection) return res.status(404).json({ success: false, error: 'Connection not found' });
  res.json({ success: true, data: connection });
});

router.post('/connections/:id/test', (req, res) => {
  const result = integrationsSettingsEngine.testConnection(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: 'Connection not found' });
  res.json({ success: true, data: result });
});

router.delete('/connections/:id', (req, res) => {
  const deleted = integrationsSettingsEngine.deleteConnection(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Connection not found' });
  res.json({ success: true, message: 'Connection deleted' });
});

// OAuth
router.post('/oauth/tokens', (req, res) => {
  const token = integrationsSettingsEngine.createOAuthToken(req.body);
  res.status(201).json({ success: true, data: token });
});

router.get('/oauth/tokens/:id', (req, res) => {
  const token = integrationsSettingsEngine.getOAuthToken(req.params.id);
  if (!token) return res.status(404).json({ success: false, error: 'OAuth token not found' });
  res.json({ success: true, data: token });
});

router.post('/oauth/tokens/:id/refresh', (req, res) => {
  const token = integrationsSettingsEngine.refreshOAuthToken(req.params.id);
  if (!token) return res.status(404).json({ success: false, error: 'OAuth token not found' });
  res.json({ success: true, data: token });
});

router.delete('/oauth/tokens/:id', (req, res) => {
  const deleted = integrationsSettingsEngine.revokeOAuthToken(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'OAuth token not found' });
  res.json({ success: true, message: 'OAuth token revoked' });
});

// User Preferences
router.get('/preferences/:userId', (req, res) => {
  const preferences = integrationsSettingsEngine.getUserPreferences(req.params.userId);
  res.json({ success: true, data: preferences });
});

router.put('/preferences/:userId', (req, res) => {
  const preferences = integrationsSettingsEngine.updateUserPreferences(req.params.userId, req.body);
  res.json({ success: true, data: preferences });
});

// ================================================================
// ADVANCED FEATURES ENDPOINTS (31 endpoints)
// ================================================================

// Versioning
router.get('/versions/:entityType/:entityId', (req, res) => {
  const versions = advancedFeaturesEngine.listVersions(req.params.entityId, req.params.entityType);
  res.json({ success: true, data: versions, count: versions.length });
});

router.post('/versions', (req, res) => {
  const version = advancedFeaturesEngine.createVersion(req.body);
  res.status(201).json({ success: true, data: version });
});

router.get('/versions/:id', (req, res) => {
  const version = advancedFeaturesEngine.getVersion(req.params.id);
  if (!version) return res.status(404).json({ success: false, error: 'Version not found' });
  res.json({ success: true, data: version });
});

router.post('/versions/:id/restore', (req, res) => {
  const result = advancedFeaturesEngine.restoreVersion(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: 'Version not found' });
  res.json({ success: true, data: result });
});

router.post('/versions/compare', (req, res) => {
  const comparison = advancedFeaturesEngine.compareVersions(req.body.versionId1, req.body.versionId2);
  if (!comparison) return res.status(404).json({ success: false, error: 'Version(s) not found' });
  res.json({ success: true, data: comparison });
});

// Templates Advanced
router.get('/templates', (req, res) => {
  const templates = advancedFeaturesEngine.listTemplates(req.query);
  res.json({ success: true, data: templates, count: templates.length });
});

router.post('/templates', (req, res) => {
  const template = advancedFeaturesEngine.createTemplate(req.body);
  res.status(201).json({ success: true, data: template });
});

router.get('/templates/:id', (req, res) => {
  const template = advancedFeaturesEngine.getTemplate(req.params.id);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

router.put('/templates/:id', (req, res) => {
  const template = advancedFeaturesEngine.updateTemplate(req.params.id, req.body);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

router.delete('/templates/:id', (req, res) => {
  const deleted = advancedFeaturesEngine.deleteTemplate(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, message: 'Template deleted' });
});

router.post('/templates/:id/use', (req, res) => {
  const result = advancedFeaturesEngine.useTemplate(req.params.id, req.body.variables);
  if (!result) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: result });
});

router.post('/templates/:id/rate', (req, res) => {
  const template = advancedFeaturesEngine.rateTemplate(req.params.id, req.body.rating);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: template });
});

// Compliance
router.get('/compliance-rules', (req, res) => {
  const rules = advancedFeaturesEngine.listComplianceRules(req.query);
  res.json({ success: true, data: rules, count: rules.length });
});

router.post('/compliance-rules', (req, res) => {
  const rule = advancedFeaturesEngine.createComplianceRule(req.body);
  res.status(201).json({ success: true, data: rule });
});

router.get('/compliance-rules/:id', (req, res) => {
  const rule = advancedFeaturesEngine.getComplianceRule(req.params.id);
  if (!rule) return res.status(404).json({ success: false, error: 'Compliance rule not found' });
  res.json({ success: true, data: rule });
});

router.post('/compliance/check', (req, res) => {
  const results = advancedFeaturesEngine.checkCompliance(req.body.entityType, req.body.entityData);
  res.json({ success: true, data: results });
});

router.post('/compliance/report', (req, res) => {
  const report = advancedFeaturesEngine.generateComplianceReport(req.body.startDate, req.body.endDate);
  res.json({ success: true, data: report });
});

// Audit Logs
router.post('/audit-logs', (req, res) => {
  const log = advancedFeaturesEngine.logAuditEvent(req.body);
  res.status(201).json({ success: true, data: log });
});

router.get('/audit-logs', (req, res) => {
  const logs = advancedFeaturesEngine.getAuditLogs(req.query);
  res.json({ success: true, data: logs, count: logs.length });
});

router.post('/audit-logs/export', (req, res) => {
  const exportData = advancedFeaturesEngine.exportAuditLogs(req.body);
  res.json({ success: true, data: exportData });
});

// Backups
router.post('/backups', (req, res) => {
  const backup = advancedFeaturesEngine.createBackup(req.body);
  res.status(201).json({ success: true, data: backup });
});

router.get('/backups/:id', (req, res) => {
  const backup = advancedFeaturesEngine.getBackup(req.params.id);
  if (!backup) return res.status(404).json({ success: false, error: 'Backup not found' });
  res.json({ success: true, data: backup });
});

router.get('/backups', (req, res) => {
  const backups = advancedFeaturesEngine.listBackups(req.query);
  res.json({ success: true, data: backups, count: backups.length });
});

router.post('/backups/:id/restore', (req, res) => {
  const result = advancedFeaturesEngine.restoreBackup(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: 'Backup not found or not completed' });
  res.json({ success: true, data: result });
});

router.delete('/backups/:id', (req, res) => {
  const deleted = advancedFeaturesEngine.deleteBackup(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Backup not found' });
  res.json({ success: true, message: 'Backup deleted' });
});

// Data Export
router.post('/exports', (req, res) => {
  const exportJob = advancedFeaturesEngine.createExport(req.body);
  res.status(201).json({ success: true, data: exportJob });
});

router.get('/exports/:id', (req, res) => {
  const exportJob = advancedFeaturesEngine.getExport(req.params.id);
  if (!exportJob) return res.status(404).json({ success: false, error: 'Export not found' });
  res.json({ success: true, data: exportJob });
});

router.get('/exports', (req, res) => {
  const exports = advancedFeaturesEngine.listExports(req.query);
  res.json({ success: true, data: exports, count: exports.length });
});

// Bulk Operations
router.post('/bulk/create', (req, res) => {
  const results = advancedFeaturesEngine.bulkCreate(req.body.entityType, req.body.items);
  res.json({ success: true, data: results });
});

router.post('/bulk/update', (req, res) => {
  const results = advancedFeaturesEngine.bulkUpdate(req.body.entityType, req.body.updates);
  res.json({ success: true, data: results });
});

router.post('/bulk/delete', (req, res) => {
  const results = advancedFeaturesEngine.bulkDelete(req.body.entityType, req.body.ids);
  res.json({ success: true, data: results });
});

// ================================================================
// HEALTH CHECK & STATUS
// ================================================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      totalEndpoints: 245,
      modules: {
        flowBuilder: 34,
        messaging: 30,
        contactsSegments: 31,
        analyticsReporting: 28,
        aiPersonalization: 26,
        automationScheduling: 29,
        integrationsSettings: 36,
        advancedFeatures: 31
      },
      status: 'operational',
      timestamp: Date.now()
    }
  });
});

module.exports = router;
