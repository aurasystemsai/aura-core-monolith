// ================================================================
// EMAIL AUTOMATION BUILDER - ENTERPRISE GRADE BACKEND
// ================================================================
// Version: 2.0
// Created: February 11, 2026
// Endpoints: 200 (all 8 categories)
// Line Target: ~5,500 lines
// ================================================================
// Categories:
//   1. Campaign Management (28 endpoints)
//   2. AI Content Generation (32 endpoints)
//   3. Audience & Segmentation (26 endpoints)
//   4. Multi-Channel Orchestration (24 endpoints)
//   5. Automation Workflows (28 endpoints)
//   6. Analytics & Performance (30 endpoints)
//   7. Testing & Optimization (16 endpoints)
//   8. Settings & Administration (16 endpoints)
// ================================================================

const express = require('express');
const router = express.Router();

// Mock AI clients (replace with actual implementations)
const { getOpenAIClient } = require('../core/openaiClient');
const { anthropicChat } = require('../core/anthropicChat');

// ================================================================
// IN-MEMORY DATA STORES (Replace with database in production)
// ================================================================

const campaigns = new Map();
const templates = new Map();
const contacts = new Map();
const segments = new Map();
const lists = new Map();
const workflows = new Map();
const abTests = new Map();
const senderProfiles = new Map();
const domains = new Map();
const apiKeys = new Map();
const webhooks = new Map();
const reports = new Map();

// Analytics storage
const campaignStats = new Map();
const emailEvents = []; // Opens, clicks, bounces, etc.
const workflowExecutions = [];
const auditLogs = [];

let campaignIdCounter = 1;
let templateIdCounter = 1;
let contactIdCounter = 1;
let segmentIdCounter = 1;
let listIdCounter = 1;
let workflowIdCounter = 1;
let testIdCounter = 1;

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function logAudit(action, user, resourceId, metadata = {}) {
  auditLogs.push({
    id: auditLogs.length + 1,
    action,
    user,
    resourceId,
    metadata,
    timestamp: new Date().toISOString()
  });
}

async function executeAIModel(model, prompt, options = {}) {
  const { temperature = 0.7, maxTokens = 500 } = options;
  
  try {
    if (model.startsWith('gpt')) {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens
      });
      return response.choices[0].message.content;
    } else if (model.startsWith('claude')) {
      return await anthropicChat(prompt, { model, temperature, max_tokens: maxTokens });
    } else if (model.startsWith('gemini')) {
      // Mock Gemini response
      return `Gemini response to: ${prompt.substring(0, 50)}...`;
    }
  } catch (error) {
    console.error(`AI model error (${model}):`, error);
    throw error;
  }
}

async function intelligentRouting(prompt, models, strategy = 'best-of-n') {
  const responses = [];
  
  for (const model of models) {
    const response = await executeAIModel(model, prompt);
    const score = calculateContentScore(response);
    responses.push({ model, response, score });
  }
  
  if (strategy === 'best-of-n') {
    return responses.sort((a, b) => b.score - a.score)[0];
  } else if (strategy === 'ensemble') {
    // Combine responses (simplified)
    return { response: responses.map(r => r.response).join('\n\n'), scores: responses };
  } else if (strategy === 'cascade') {
    // Return first response above threshold
    const threshold = 0.8;
    return responses.find(r => r.score >= threshold) || responses[0];
  }
  
  return responses[0];
}

function calculateContentScore(content) {
  // Simplified scoring: length, word count, sentiment indicators
  const wordCount = content.split(/\s+/).length;
  const hasCallToAction = /click|buy|shop|get|try|download/i.test(content);
  const hasPersonalization = /\{\{|\[\[/test(content);
  
  let score = 0.5;
  if (wordCount >= 50 && wordCount <= 200) score += 0.2;
  if (hasCallToAction) score += 0.15;
  if (hasPersonalization) score += 0.15;
  
  return Math.min(score, 1.0);
}

function calculateSpamScore(subject, body) {
  // Simplified spam score calculation
  let spamScore = 0;
  
  const spamWords = ['free', 'win', 'winner', 'cash', 'prize', 'urgent', 'act now', '!!!'];
  const allCaps = (subject.match(/[A-Z]/g) || []).length / subject.length;
  
  spamWords.forEach(word => {
    if (subject.toLowerCase().includes(word)) spamScore += 10;
    if (body.toLowerCase().includes(word)) spamScore += 5;
  });
  
  if (allCaps > 0.5) spamScore += 20;
  if ((subject.match(/!/g) || []).length > 2) spamScore += 15;
  
  return Math.min(spamScore, 100);
}

function calculateReadability(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Flesch Reading Ease
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, score));
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let syllableCount = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevWasVowel) syllableCount++;
    prevWasVowel = isVowel;
  }
  
  if (word.endsWith('e')) syllableCount--;
  return Math.max(1, syllableCount);
}

function predictOpenRate(subject, senderName, dayOfWeek, hour) {
  // Simplified predictive model
  let baseRate = 0.18; // 18% baseline
  
  // Subject analysis
  const subjectLength = subject.length;
  if (subjectLength >= 30 && subjectLength <= 50) baseRate += 0.05;
  if (/\?/.test(subject)) baseRate += 0.03;
  if (/emoji/.test(subject)) baseRate += 0.02;
  
  // Sender name recognition
  if (senderName.length > 0) baseRate += 0.04;
  
  // Day of week impact
  const dayMultipliers = { 1: 0.9, 2: 1.1, 3: 1.15, 4: 1.1, 5: 0.95, 6: 0.85, 7: 0.8 };
  baseRate *= (dayMultipliers[dayOfWeek] || 1);
  
  // Hour of day impact  
  if (hour >= 9 && hour <= 11) baseRate *= 1.2;
  else if (hour >= 18 && hour <= 20) baseRate *= 1.1;
  else if (hour >= 0 && hour <= 6) baseRate *= 0.7;
  
  return Math.min(baseRate, 0.5);
}

// ================================================================
// CATEGORY 1: CAMPAIGN MANAGEMENT (28 endpoints)
// ================================================================

// 1.1 Core Campaign Operations

router.get('/campaigns', (req, res) => {
  const { page = 1, limit = 20, status, type, search } = req.query;
  
  let filtered = Array.from(campaigns.values());
  
  if (status) filtered = filtered.filter(c => c.status === status);
  if (type) filtered = filtered.filter(c => c.type === type);
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.subject.toLowerCase().includes(searchLower)
    );
  }
  
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));
  
  res.json({
    ok: true,
    campaigns: paginated,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.post('/campaigns', (req, res) => {
  const { name, subject, preheader, fromName, fromEmail, replyTo, body, type = 'regular', segmentId, listId } = req.body;
  
  if (!name || !subject || !body) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }
  
  const campaign = {
    id: campaignIdCounter++,
    name,
    subject,
    preheader,
    fromName,
    fromEmail,
    replyTo,
    body,
    type,
    segmentId,
    listId,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledAt: null,
    sentAt: null,
    stats: {
      sent: 0,
      delivered: 0,
      opens: 0,
      uniqueOpens: 0,
      clicks: 0,
      uniqueClicks: 0,
      bounces: 0,
      unsubscribes: 0,
      spam: 0
    }
  };
  
  campaigns.set(campaign.id, campaign);
  logAudit('campaign_created', 'user', campaign.id, { name });
  
  res.status(201).json({ ok: true, campaign });
});

router.get('/campaigns/:id', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  res.json({ ok: true, campaign });
});

router.put('/campaigns/:id', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  if (campaign.status !== 'draft') {
    return res.status(400).json({ ok: false, error: 'Cannot edit non-draft campaign' });
  }
  
  Object.assign(campaign, req.body, {
    updatedAt: new Date().toISOString()
  });
  
  logAudit('campaign_updated', 'user', campaign.id);
  
  res.json({ ok: true, campaign });
});

router.delete('/campaigns/:id', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  campaigns.delete(parseInt(req.params.id));
  logAudit('campaign_deleted', 'user', campaign.id);
  
  res.json({ ok: true, message: 'Campaign deleted' });
});

router.post('/campaigns/:id/clone', (req, res) => {
  const original = campaigns.get(parseInt(req.params.id));
  
  if (!original) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  const cloned = {
    ...original,
    id: campaignIdCounter++,
    name: `${original.name} (Copy)`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledAt: null,
    sentAt: null,
    stats: {
      sent: 0,
      delivered: 0,
      opens: 0,
      uniqueOpens: 0,
      clicks: 0,
      uniqueClicks: 0,
      bounces: 0,
      unsubscribes: 0,
      spam: 0
    }
  };
  
  campaigns.set(cloned.id, cloned);
  logAudit('campaign_cloned', 'user', cloned.id, { originalId: original.id });
  
  res.status(201).json({ ok: true, campaign: cloned });
});

router.post('/campaigns/:id/schedule', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  const { scheduledAt } = req.body;
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  if (!scheduledAt) {
    return res.status(400).json({ ok: false, error: 'scheduledAt is required' });
  }
  
  campaign.scheduledAt = scheduledAt;
  campaign.status = 'scheduled';
  campaign.updatedAt = new Date().toISOString();
  
  logAudit('campaign_scheduled', 'user', campaign.id, { scheduledAt });
  
  res.json({ ok: true, campaign });
});

router.post('/campaigns/:id/send', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  campaign.status = 'sending';
  campaign.sentAt = new Date().toISOString();
  campaign.updatedAt = new Date().toISOString();
  
  // Mock sending process
  setTimeout(() => {
    campaign.status = 'sent';
    campaign.stats.sent = 1000; // Mock number
    campaign.stats.delivered = 980;
  }, 2000);
  
  logAudit('campaign_sent', 'user', campaign.id);
  
  res.json({ ok: true, campaign, message: 'Campaign is being sent' });
});

router.post('/campaigns/:id/pause', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  if (campaign.status !== 'scheduled' && campaign.status !== 'sending') {
    return res.status(400).json({ ok: false, error: 'Cannot pause campaign in current state' });
  }
  
  campaign.status = 'paused';
  campaign.updatedAt = new Date().toISOString();
  
  logAudit('campaign_paused', 'user', campaign.id);
  
  res.json({ ok: true, campaign });
});

router.post('/campaigns/:id/resume', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  if (campaign.status !== 'paused') {
    return res.status(400).json({ ok: false, error: 'Campaign is not paused' });
  }
  
  campaign.status = campaign.scheduledAt ? 'scheduled' : 'sending';
  campaign.updatedAt = new Date().toISOString();
  
  logAudit('campaign_resumed', 'user', campaign.id);
  
  res.json({ ok: true, campaign });
});

router.post('/campaigns/:id/cancel', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  campaign.status = 'cancelled';
  campaign.updatedAt = new Date().toISOString();
  
  logAudit('campaign_cancelled', 'user', campaign.id);
  
  res.json({ ok: true, campaign });
});

router.get('/campaigns/:id/preview', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  const preview = {
    subject: campaign.subject,
    preheader: campaign.preheader,
    fromName: campaign.fromName,
    fromEmail: campaign.fromEmail,
    body: campaign.body,
    rendered: `<!DOCTYPE html><html><body>${campaign.body}</body></html>`
  };
  
  res.json({ ok: true, preview });
});

router.post('/campaigns/:id/test-send', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  const { recipients } = req.body;
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  if (!recipients || !Array.isArray(recipients)) {
    return res.status(400).json({ ok: false, error: 'Recipients array required' });
  }
  
  // Mock test send
  res.json({
    ok: true,
    message: `Test email sent to ${recipients.length} recipient(s)`,
    recipients
  });
});

// 1.2 Templates

router.get('/templates', (req, res) => {
  const { category, page = 1, limit = 20 } = req.query;
  
  let filtered = Array.from(templates.values());
  if (category) filtered = filtered.filter(t => t.category === category);
  
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));
  
  res.json({
    ok: true,
    templates: paginated,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.post('/templates', (req, res) => {
  const { name, category, html, json, thumbnail } = req.body;
  
  if (!name || !html) {
    return res.status(400).json({ ok: false, error: 'Name and HTML are required' });
  }
  
  const template = {
    id: templateIdCounter++,
    name,
    category: category || 'custom',
    html,
    json,
    thumbnail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  templates.set(template.id, template);
  logAudit('template_created', 'user', template.id, { name });
  
  res.status(201).json({ ok: true, template });
});

router.get('/templates/:id', (req, res) => {
  const template = templates.get(parseInt(req.params.id));
  
  if (!template) {
    return res.status(404).json({ ok: false, error: 'Template not found' });
  }
  
  res.json({ ok: true, template });
});

router.put('/templates/:id', (req, res) => {
  const template = templates.get(parseInt(req.params.id));
  
  if (!template) {
    return res.status(404).json({ ok: false, error: 'Template not found' });
  }
  
  Object.assign(template, req.body, {
    updatedAt: new Date().toISOString()
  });
  
  logAudit('template_updated', 'user', template.id);
  
  res.json({ ok: true, template });
});

router.delete('/templates/:id', (req, res) => {
  const template = templates.get(parseInt(req.params.id));
  
  if (!template) {
    return res.status(404).json({ ok: false, error: 'Template not found' });
  }
  
  templates.delete(parseInt(req.params.id));
  logAudit('template_deleted', 'user', template.id);
  
  res.json({ ok: true, message: 'Template deleted' });
});

router.post('/templates/:id/duplicate', (req, res) => {
  const original = templates.get(parseInt(req.params.id));
  
  if (!original) {
    return res.status(404).json({ ok: false, error: 'Template not found' });
  }
  
  const duplicate = {
    ...original,
    id: templateIdCounter++,
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  templates.set(duplicate.id, duplicate);
  logAudit('template_duplicated', 'user', duplicate.id, { originalId: original.id });
  
  res.status(201).json({ ok: true, template: duplicate });
});

router.get('/templates/categories', (req, res) => {
  const categories = [
    { id: 'promotional', name: 'Promotional', count: 12 },
    { id: 'transactional', name: 'Transactional', count: 8 },
    { id: 'newsletter', name: 'Newsletter', count: 15 },
    { id: 'welcome', name: 'Welcome Series', count: 5 },
    { id: 'abandoned-cart', name: 'Abandoned Cart', count: 4 },
    { id: 'custom', name: 'Custom', count: templates.size }
  ];
  
  res.json({ ok: true, categories });
});

router.post('/templates/import', (req, res) => {
  const { html, name } = req.body;
  
  if (!html) {
    return res.status(400).json({ ok: false, error: 'HTML required' });
  }
  
  const template = {
    id: templateIdCounter++,
    name: name || 'Imported Template',
    category: 'custom',
    html,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  templates.set(template.id, template);
  
  res.status(201).json({ ok: true, template });
});

router.get('/templates/:id/render', (req, res) => {
  const template = templates.get(parseInt(req.params.id));
  const { data = {} } = req.query;
  
  if (!template) {
    return res.status(404).json({ ok: false, error: 'Template not found' });
  }
  
  let rendered = template.html;
  
  // Simple template rendering (replace {{variable}} with data)
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, data[key]);
  });
  
  res.json({ ok: true, rendered });
});

// 1.3 Bulk Operations

router.post('/campaigns/bulk-create', (req, res) => {
  const { campaigns: campaignsData } = req.body;
  
  if (!Array.isArray(campaignsData)) {
    return res.status(400).json({ ok: false, error: 'campaigns array required' });
  }
  
  const created = campaignsData.map(data => {
    const campaign = {
      id: campaignIdCounter++,
      ...data,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        sent: 0,
        delivered: 0,
        opens: 0,
        uniqueOpens: 0,
        clicks: 0,
        uniqueClicks: 0,
        bounces: 0,
        unsubscribes: 0,
        spam: 0
      }
    };
    campaigns.set(campaign.id, campaign);
    return campaign;
  });
  
  logAudit('campaigns_bulk_created', 'user', null, { count: created.length });
  
  res.status(201).json({ ok: true, count: created.length, campaigns: created });
});

router.post('/campaigns/bulk-schedule', (req, res) => {
  const { campaignIds, scheduledAt } = req.body;
  
  if (!Array.isArray(campaignIds) || !scheduledAt) {
    return res.status(400).json({ ok: false, error: 'campaignIds array and scheduledAt required' });
  }
  
  const updated = campaignIds.map(id => {
    const campaign = campaigns.get(id);
    if (campaign) {
      campaign.scheduledAt = scheduledAt;
      campaign.status = 'scheduled';
      campaign.updatedAt = new Date().toISOString();
    }
    return campaign;
  }).filter(Boolean);
  
  res.json({ ok: true, count: updated.length, campaigns: updated });
});

router.post('/campaigns/bulk-cancel', (req, res) => {
  const { campaignIds } = req.body;
  
  if (!Array.isArray(campaignIds)) {
    return res.status(400).json({ ok: false, error: 'campaignIds array required' });
  }
  
  const updated = campaignIds.map(id => {
    const campaign = campaigns.get(id);
    if (campaign) {
      campaign.status = 'cancelled';
      campaign.updatedAt = new Date().toISOString();
    }
    return campaign;
  }).filter(Boolean);
  
  res.json({ ok: true, count: updated.length });
});

router.delete('/campaigns/bulk-delete', (req, res) => {
  const { campaignIds } = req.body;
  
  if (!Array.isArray(campaignIds)) {
    return res.status(400).json({ ok: false, error: 'campaignIds array required' });
  }
  
  let deleted = 0;
  campaignIds.forEach(id => {
    if (campaigns.delete(id)) deleted++;
  });
  
  res.json({ ok: true, deleted });
});

router.post('/campaigns/export', (req, res) => {
  const { format = 'csv', filters = {} } = req.body;
  
  let data = Array.from(campaigns.values());
  
  // Apply filters
  if (filters.status) data = data.filter(c => c.status === filters.status);
  if (filters.type) data = data.filter(c => c.type === filters.type);
  
  const exportData = {
    format,
    data: format === 'csv' ? data.map(c => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      status: c.status,
      sent: c.stats.sent,
      opens: c.stats.opens,
      clicks: c.stats.clicks
    })) : data,
    downloadUrl: `/exports/campaigns-${Date.now()}.${format}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  res.json({ ok: true, ...exportData });
});

router.post('/campaigns/import', (req, res) => {
  const { data, overwrite = false } = req.body;
  
  if (!Array.isArray(data)) {
    return res.status(400).json({ ok: false, error: 'data array required' });
  }
  
  let imported = 0;
  let skipped = 0;
  const errors = [];
  
  data.forEach((row, index) => {
    try {
      if (!row.name || !row.subject) {
        errors.push({ row: index + 1, error: 'Missing required fields' });
        skipped++;
        return;
      }
      
      const campaign = {
        id: campaignIdCounter++,
        ...row,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          sent: 0,
          delivered: 0,
          opens: 0,
          uniqueOpens: 0,
          clicks: 0,
          uniqueClicks: 0,
          bounces: 0,
          unsubscribes: 0,
          spam: 0
        }
      };
      
      campaigns.set(campaign.id, campaign);
      imported++;
    } catch (error) {
      errors.push({ row: index + 1, error: error.message });
      skipped++;
    }
  });
  
  res.json({ ok: true, imported, skipped, errors });
});

// 1.4 Version Control

router.get('/campaigns/:id/versions', (req, res) => {
  // Mock version history
  const versions = [
    {
      versionId: 1,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user@example.com',
      changes: 'Initial version'
    },
    {
      versionId: 2,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user@example.com',
      changes: 'Updated subject line'
    }
  ];
  
  res.json({ ok: true, versions });
});

router.post('/campaigns/:id/versions', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  const version = {
    versionId: 3,
    campaignId: campaign.id,
    snapshot: { ...campaign },
    createdAt: new Date().toISOString(),
    createdBy: 'user@example.com'
  };
  
  res.status(201).json({ ok: true, version });
});

router.get('/campaigns/:id/versions/:versionId', (req, res) => {
  const version = {
    versionId: parseInt(req.params.versionId),
    campaignId: parseInt(req.params.id),
    snapshot: campaigns.get(parseInt(req.params.id)),
    createdAt: new Date().toISOString()
  };
  
  res.json({ ok: true, version });
});

router.post('/campaigns/:id/versions/:versionId/restore', (req, res) => {
  const campaign = campaigns.get(parseInt(req.params.id));
  
  if (!campaign) {
    return res.status(404).json({ ok: false, error: 'Campaign not found' });
  }
  
  // Mock restore
  campaign.updatedAt = new Date().toISOString();
  logAudit('campaign_version_restored', 'user', campaign.id, { versionId: req.params.versionId });
  
  res.json({ ok: true, campaign, message: 'Version restored' });
});

// ================================================================
// CATEGORY 2: AI CONTENT GENERATION (32 endpoints)
// ================================================================

// 2.1 Multi-Model Orchestration

router.post('/ai/orchestration/generate', async (req, res) => {
  const { prompt, models = ['gpt-4o-mini', 'claude-3.5-sonnet'], strategy = 'best-of-n', temperature = 0.7 } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ ok: false, error: 'Prompt is required' });
  }
  
  try {
    const result = await intelligentRouting(prompt, models, strategy);
    
    res.json({
      ok: true,
      result: {
        selectedModel: result.model,
        content: result.response,
        score: result.score,
        strategy
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/ai/models/available', (req, res) => {
  const models = [
    {
      id: 'gpt-4o-mini',
      provider: 'openai',
      capabilities: ['content-generation', 'subject-lines', 'personalization'],
      costPer1kTokens: 0.002,
      recommended: ['subject-lines', 'short-content']
    },
    {
      id: 'gpt-4',
      provider: 'openai',
      capabilities: ['content-generation', 'analysis', 'optimization'],
      costPer1kTokens: 0.03,
      recommended: ['long-content', 'analysis']
    },
    {
      id: 'claude-3.5-sonnet',
      provider: 'anthropic',
      capabilities: ['content-generation', 'analysis', 'personalization'],
      costPer1kTokens: 0.015,
      recommended: ['email-body', 'personalization']
    },
    {
      id: 'gemini-pro',
      provider: 'google',
      capabilities: ['content-generation', 'multilingual'],
      costPer1kTokens: 0.001,
      recommended: ['multilingual', 'budget']
    }
  ];
  
  res.json({ ok: true, models });
});

router.post('/ai/models/set-preference', (req, res) => {
  const { task, model, fallbackModels = [] } = req.body;
  
  if (!task || !model) {
    return res.status(400).json({ ok: false, error: 'task and model required' });
  }
  
  const preference = {
    task,
    primaryModel: model,
    fallbackModels,
    updatedAt: new Date().toISOString()
  };
  
  logAudit('ai_preference_set', 'user', null, preference);
  
  res.json({ ok: true, preference });
});

router.get('/ai/models/performance', (req, res) => {
  const { period = '30d' } = req.query;
  
  const performance = [
    {
      model: 'gpt-4o-mini',
      requests: 1247,
      avgLatency: 856,
      successRate: 99.2,
      avgScore: 0.87,
      totalCost: 2.45
    },
    {
      model: 'claude-3.5-sonnet',
      requests: 892,
      avgLatency: 1024,
      successRate: 99.8,
      avgScore: 0.92,
      totalCost: 13.38
    },
    {
      model: 'gpt-4',
      requests: 156,
      avgLatency: 1456,
      successRate: 99.4,
      avgScore: 0.94,
      totalCost: 4.68
    }
  ];
  
  res.json({ ok: true, performance, period });
});

router.post('/ai/routing/best-of-n', async (req, res) => {
  const { prompt, n = 3, model = 'gpt-4o-mini' } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ ok: false, error: 'Prompt required' });
  }
  
  try {
    const responses = [];
    for (let i = 0; i < n; i++) {
      const content = await executeAIModel(model, prompt);
      const score = calculateContentScore(content);
      responses.push({ content, score, attemptNumber: i + 1 });
    }
    
    const best = responses.sort((a, b) => b.score - a.score)[0];
    
    res.json({
      ok: true,
      bestResult: best,
      allResults: responses
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/ai/routing/ensemble', async (req, res) => {
  const { prompt, models = ['gpt-4o-mini', 'claude-3.5-sonnet'] } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ ok: false, error: 'Prompt required' });
  }
  
  try {
    const responses = [];
    for (const model of models) {
      const content = await executeAIModel(model, prompt);
      responses.push({ model, content });
    }
    
    // Combine responses (simplified ensemble)
    const ensemble = responses.map(r => r.content).join('\n\n---\n\n');
    
    res.json({ ok: true, ensemble, sources: responses });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/ai/routing/cascade', async (req, res) => {
  const { prompt, models = ['gpt-4o-mini', 'claude-3.5-sonnet', 'gpt-4'], threshold = 0.8 } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ ok: false, error: 'Prompt required' });
  }
  
  try {
    for (const model of models) {
      const content = await executeAIModel(model, prompt);
      const score = calculateContentScore(content);
      
      if (score >= threshold) {
        return res.json({
          ok: true,
          result: { model, content, score },
          attemptNumber: models.indexOf(model) + 1
        });
      }
    }
    
    // If none meet threshold, return last attempt
    const lastModel = models[models.length - 1];
    const content = await executeAIModel(lastModel, prompt);
    
    res.json({
      ok: true,
      result: { model: lastModel, content, score: calculateContentScore(content) },
      attemptNumber: models.length,
      note: 'Threshold not met, returning last attempt'
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 2.2 Subject Line Optimization

router.post('/ai/subject-lines/generate', async (req, res) => {
  const { campaignGoal, productName, offer, tone = 'professional', count = 5, model = 'gpt-4o-mini' } = req.body;
  
  const prompt = `Generate ${count} compelling email subject lines for a ${tone} email campaign about ${productName}. ${offer ? `Special offer: ${offer}` : ''}. Make them engaging and likely to increase open rates.`;
  
  try {
    const content = await executeAIModel(model, prompt);
    const lines = content.split('\n').filter(l => l.trim()).slice(0, count);
    
    const suggestions = lines.map((line, i) => ({
      subject: line.replace(/^\d+\.\s*/, ''),
      predictedOpenRate: predictOpenRate(line, 'Brand', 3, 10),
      score: calculateContentScore(line),
      spamScore: calculateSpamScore(line, '')
    }));
    
    res.json({ ok: true, suggestions, model });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/ai/subject-lines/analyze', (req, res) => {
  const { subject } = req.body;
  
  if (!subject) {
    return res.status(400).json({ ok: false, error: 'Subject required' });
  }
  
  const analysis = {
    length: subject.length,
    wordCount: subject.split(/\s+/).length,
    hasEmoji: /[\u{1F600}-\u{1F64F}]/u.test(subject),
    hasNumbers: /\d/.test(subject),
    hasQuestion: /\?/.test(subject),
    allCaps: subject === subject.toUpperCase(),
    spamScore: calculateSpamScore(subject, ''),
    predictedOpenRate: predictOpenRate(subject, 'Brand', 3, 10),
    recommendations: []
  };
  
  if (analysis.length < 30) analysis.recommendations.push('Subject is too short, consider 30-50 characters');
  if (analysis.length > 60) analysis.recommendations.push('Subject is too long, keep under 60 characters');
  if (analysis.allCaps) analysis.recommendations.push('Avoid all caps to prevent spam filters');
  if (analysis.spamScore > 30) analysis.recommendations.push('High spam score, remove trigger words');
  
  res.json({ ok: true, analysis });
});

router.post('/ai/subject-lines/predict-open-rate', (req, res) => {
  const { subject, senderName = 'Brand', dayOfWeek = 3, hour = 10 } = req.body;
  
  if (!subject) {
    return res.status(400).json({ ok: false, error: 'Subject required' });
  }
  
  const prediction = {
    subject,
    predictedOpenRate: predictOpenRate(subject, senderName, dayOfWeek, hour),
    confidence: 0.78,
    factors: {
      subjectLength: subject.length,
      dayOfWeek,
      hour,
      senderName
    }
  };
  
  res.json({ ok: true, prediction });
});

router.post('/ai/subject-lines/personalize', async (req, res) => {
  const { subject, personalizationFields = ['firstName', 'location', 'lastPurchase'], model = 'gpt-4o-mini' } = req.body;
  
  if (!subject) {
    return res.status(400).json({ ok: false, error: 'Subject required' });
  }
  
  const prompt = `Add personalization to this email subject line using these fields: ${personalizationFields.join(', ')}. Original: "${subject}"`;
  
  try {
    const personalized = await executeAIModel(model, prompt);
    
    res.json({
      ok: true,
      original: subject,
      personalized: personalized.replace(/\n/g, ' ').trim(),
      fields: personalizationFields
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/ai/subject-lines/emoji-suggest', (req, res) => {
  const { subject } = req.body;
  
  if (!subject) {
    return res.status(400).json({ ok: false, error: 'Subject required' });
  }
  
  // Simple emoji suggestions based on keywords
  const emojiMap = {
    sale: '🛍️',
    discount: '💰',
    new: '✨',
    free: '🎁',
    limited: '⏰',
    welcome: '👋',
    thank: '🙏',
    love: '❤️',
    celebrate: '🎉',
    win: '🏆'
  };
  
  const suggestions = [];
  const lowerSubject = subject.toLowerCase();
  
  Object.keys(emojiMap).forEach(keyword => {
    if (lowerSubject.includes(keyword)) {
      suggestions.push({
        emoji: emojiMap[keyword],
        keyword,
        example: `${emojiMap[keyword]} ${subject}`
      });
    }
  });
  
  res.json({ ok: true, suggestions });
});

router.get('/ai/subject-lines/best-practices', (req, res) => {
  const bestPractices = [
    {
      category: 'Length',
      tip: 'Keep subject lines between 30-50 characters',
      impact: 'high'
    },
    {
      category: 'Personalization',
      tip: 'Include recipient name or location when possible',
      impact: 'high'
    },
    {
      category: 'Urgency',
      tip: 'Use time-sensitive language sparingly',
      impact: 'medium'
    },
    {
      category: 'Questions',
      tip: 'Questions can increase engagement by 10-15%',
      impact: 'medium'
    },
    {
      category: 'Emojis',
      tip: 'Use 1-2 relevant emojis to stand out',
      impact: 'low'
    },
    {
      category: 'Spam Words',
      tip: 'Avoid: free, win, cash, urgent, act now',
      impact: 'high'
    }
  ];
  
  res.json({ ok: true, bestPractices });
});

// 2.3 Email Body Generation

router.post('/ai/content/generate', async (req, res) => {
  const { topic, length = 'medium', tone = 'professional', includeCtamodel = 'claude-3.5-sonnet' } = req.body;
  
  if (!topic) {
    return res.status(400).json({ ok: false, error: 'Topic required' });
  }
  
  const lengthGuide = { short: '100-150 words', medium: '200-300 words', long: '400-600 words' };
  const prompt = `Write a ${tone} email about ${topic}. Length: ${lengthGuide[length]}. ${includeCta ? 'Include a compelling call-to-action.' : ''}`;
  
  try {
    const content = await executeAIModel(model, prompt);
    
    res.json({
      ok: true,
      content,
      wordCount: content.split(/\s+/).length,
      readabilityScore: calculateReadability(content),
      model
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/ai/content/rewrite', async (req, res) => {
  const { content, tone, model = 'gpt-4o-mini' } = req.body;
  
  if (!content || !tone) {
    return res.status(400).json({ ok: false, error: 'content and tone required' });
  }
  
  const prompt = `Rewrite this email content in a ${tone} tone:\n\n${content}`;
  
  try {
    const rewritten = await executeAIModel(model, prompt);
    
    res.json({ ok: true, original: content, rewritten, tone });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/ai/content/expand', async (req, res) => {
  const { content, targetLength, model = 'gpt-4' } = req.body;
  
  if (!content) {
    return res.status(400).json({ ok: false, error: 'content required' });
  }
  
  const prompt = `Expand this email content to approximately ${targetLength || 300} words, adding more details and value:\n\n${content}`;
  
  try {
    const expanded = await executeAIModel(model, prompt);
    
    res.json({
      ok: true,
      original: content,
      expanded,
      originalWordCount: content.split(/\s+/).length,
      expandedWordCount: expanded.split(/\s+/).length
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/ai/content/summarize', async (req, res) => {
  const { content, maxLength = 100, model = 'gpt-4o-mini' } = req.body;
  
  if (!content) {
    return res.status(400).json({ ok: false, error: 'content required' });
  }
  
  const prompt = `Summarize this email content in ${maxLength} words or less:\n\n${content}`;
  
  try {
    const summary = await executeAIModel(model, prompt);
    
    res.json({ ok: true, original: content, summary });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/ai/content/translate', async (req, res) => {
  const { content, targetLanguage, model = 'gpt-4' } = req.body;
  
  if (!content || !targetLanguage) {
    return res.status(400).json({ ok: false, error: 'content and targetLanguage required' });
  }
  
  const prompt = `Translate this email content to ${targetLanguage}:\n\n${content}`;
  
  try {
    const translated = await executeAIModel(model, prompt);
    
    res.json({ ok: true, original: content, translated, targetLanguage });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/ai/content/personalize', async (req, res) => {
  const { content, tokens = {}, model = 'gpt-4o-mini' } = req.body;
  
  if (!content) {
    return res.status(400).json({ ok: false, error: 'content required' });
  }
  
  let personalized = content;
  
  // Replace tokens {{firstName}}, {{location}}, etc.
  Object.keys(tokens).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    personalized = personalized.replace(regex, tokens[key]);
  });
  
  res.json({ ok: true, original: content, personalized, tokens });
});

// 2.4 Content Quality & Optimization

router.post('/ai/spam-score', (req, res) => {
  const { subject, body } = req.body;
  
  if (!subject || !body) {
    return res.status(400).json({ ok: false, error: 'subject and body required' });
  }
  
  const spamScore = calculateSpamScore(subject, body);
  
  const rating = spamScore < 20 ? 'low' : spamScore < 50 ? 'medium' : 'high';
  const recommendation = spamScore > 30 ? 
    'Reduce spam trigger words and avoid excessive punctuation' :
    'Spam score is acceptable';
  
  res.json({
    ok: true,
    spamScore,
    rating,
    recommendation,
    details: {
      subjectScore: calculateSpamScore(subject, ''),
      bodyScore: calculateSpamScore('', body)
    }
  });
});

router.post('/ai/readability-score', (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ ok: false, error: 'content required' });
  }
  
  const score = calculateReadability(content);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/);
  
  let level;
  if (score >= 90) level = 'Very Easy';
  else if (score >= 80) level = 'Easy';
  else if (score >= 70) level = 'Fairly Easy';
  else if (score >= 60) level = 'Standard';
  else if (score >= 50) level = 'Fairly Difficult';
  else if (score >= 30) level = 'Difficult';
  else level = 'Very Difficult';
  
  res.json({
    ok: true,
    score,
    level,
    metrics: {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: (words.length / sentences.length).toFixed(1)
    },
    recommendation: score < 60 ? 'Simplify language for better engagement' : 'Readability is good'
  });
});

router.post('/ai/sentiment-analysis', async (req, res) => {
  const { content, model = 'gpt-4o-mini' } = req.body;
  
  if (!content) {
    return res.status(400).json({ ok: false, error: 'content required' });
  }
  
  // Simplified sentiment analysis
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'perfect', 'wonderful'];
  const negativeWords = ['bad', 'terrible', 'worst', 'hate', 'awful', 'poor', 'disappointing'];
  
  const lowerContent = content.toLowerCase();
  const positiveCount = positiveWords.filter(w => lowerContent.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerContent.includes(w)).length;
  
  const sentimentScore = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
  
  let sentiment;
  if (sentimentScore > 0.3) sentiment = 'positive';
  else if (sentimentScore < -0.3) sentiment = 'negative';
  else sentiment = 'neutral';
  
  res.json({
    ok: true,
    sentiment,
    score: sentimentScore,
    details: {
      positiveIndicators: positiveCount,
      negativeIndicators: negativeCount
    }
  });
});

router.post('/ai/cta-optimization', async (req, res) => {
  const { currentCta, goal, model = 'gpt-4o-mini' } = req.body;
  
  if (!currentCta) {
    return res.status(400).json({ ok: false, error: 'currentCta required' });
  }
  
  const prompt = `Optimize this call-to-action for better conversion${goal ? ` (goal: ${goal})` : ''}: "${currentCta}". Provide 5 improved variations.`;
  
  try {
    const content = await executeAIModel(model, prompt);
    const variants = content.split('\n').filter(l => l.trim()).slice(0, 5);
    
    res.json({
      ok: true,
      original: currentCta,
      suggestions: variants.map(v => v.replace(/^\d+\.\s*/, ''))
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/api/image-alt-text', async (req, res) => {
  const { imageUrl, context, model = 'gpt-4-vision' } = req.body;
  
  if (!imageUrl) {
    return res.status(400).json({ ok: false, error: 'imageUrl required' });
  }
  
  // Mock alt text generation
  const altText = `Professional image showing ${context || 'product'}`;
  
  res.json({ ok: true, imageUrl, altText, context });
});

router.get('/ai/content/recommendations', async (req, res) => {
  const { campaignId } = req.query;
  
  const recommendations = [
    {
      type: 'subject-line',
      priority: 'high',
      suggestion: 'Add personalization token {{firstName}} to subject line',
      estimatedImpact: '+15% open rate'
    },
    {
      type: 'content-length',
      priority: 'medium',
      suggestion: 'Content is too long (450 words), consider reducing to 250-300 words',
      estimatedImpact: 'Better engagement'
    },
    {
      type: 'call-to-action',
      priority: 'high',
      suggestion: 'Make CTA more specific: "Shop Now" → "Get 20% Off Today"',
      estimatedImpact: '+10% click-through'
    },
    {
      type: 'spam-score',
      priority: 'low',
      suggestion: 'Spam score is acceptable (15/100)',
      estimatedImpact: 'No action needed'
    }
  ];
  
  res.json({ ok: true, recommendations, campaignId });
});

// 2.5 AI Training & Feedback

router.post('/ai/rlhf/feedback', (req, res) => {
  const { requestId, rating, feedback, selectedVariant } = req.body;
  
  if (!requestId || !rating) {
    return res.status(400).json({ ok: false, error: 'requestId and rating required' });
  }
  
  const feedbackRecord = {
    feedbackId: `fb_${Date.now()}`,
    requestId,
    rating,
    feedback,
    selectedVariant,
    submittedAt: new Date().toISOString()
  };
  
  logAudit('ai_feedback_submitted', 'user', requestId, feedbackRecord);
  
  res.json({
    ok: true,
    feedbackId: feedbackRecord.feedbackId,
    message: 'Feedback recorded for model improvement'
  });
});

router.post('/ai/fine-tune/create', (req, res) => {
  const { baseModel, trainingData, validationData, epochs = 3 } = req.body;
  
  if (!baseModel || !trainingData) {
    return res.status(400).json({ ok: false, error: 'baseModel and trainingData required' });
  }
  
  const job = {
    jobId: `ft_job_${Date.now()}`,
    baseModel,
    status: 'pending',
    trainingExamples: Array.isArray(trainingData) ? trainingData.length : 0,
    validationExamples: Array.isArray(validationData) ? validationData.length : 0,
    epochs,
    createdAt: new Date().toISOString(),
    estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  };
  
  res.json({ ok: true, job });
});

router.get('/ai/fine-tune/:jobId/status', (req, res) => {
  const status = {
    jobId: req.params.jobId,
    status: 'running',
    progress: 47,
    currentEpoch: 2,
    totalEpochs: 3,
    estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  };
  
  res.json({ ok: true, status });
});

router.post('/ai/active-learning/samples', (req, res) => {
  const { model, count = 10, confidenceThreshold = 0.6 } = req.body;
  
  // Mock uncertain samples for labeling
  const samples = Array.from({ length: count }, (_, i) => ({
    id: `sample_${i + 1}`,
    content: `Email content sample ${i + 1}`,
    confidence: 0.3 + Math.random() * 0.3,
    needsLabeling: true
  }));
  
  res.json({ ok: true, samples, model, confidenceThreshold });
});

router.post('/ai/batch-process', (req, res) => {
  const { campaignIds, operation, model = 'gpt-4o-mini', concurrency = 5 } = req.body;
  
  if (!campaignIds || !operation) {
    return res.status(400).json({ ok: false, error: 'campaignIds and operation required' });
  }
  
  const batch = {
    batchId: `batch_${Date.now()}`,
    operation,
    model,
    totalItems: campaignIds.length,
    status: 'processing',
    completed: 0,
    failed: 0,
    createdAt: new Date().toISOString(),
    estimatedCompletion: new Date(Date.now() + campaignIds.length * 2000).toISOString()
  };
  
  res.json({ ok: true, batch });
});

router.get('/ai/batch-process/:batchId/status', (req, res) => {
  const status = {
    batchId: req.params.batchId,
    status: 'processing',
    progress: 65,
    completed: 65,
    failed: 2,
    total: 100,
    estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  };
  
  res.json({ ok: true, status });
});

// 2.6 AI Usage & Cost

router.get('/ai/usage/stats', (req, res) => {
  const { period = '30d' } = req.query;
  
  const stats = {
    period,
    totalRequests: 2395,
    byModel: {
      'gpt-4o-mini': 1247,
      'claude-3.5-sonnet': 892,
      'gpt-4': 156,
      'gemini-pro': 100
    },
    byTask: {
      'subject-line-generation': 845,
      'content-generation': 712,
      'optimization': 438,
      'analysis': 400
    },
    avgResponseTime: 1024,
    successRate: 99.4
  };
  
  res.json({ ok: true, stats });
});

router.get('/ai/usage/costs', (req, res) => {
  const { period = '30d' } = req.query;
  
  const costs = {
    period,
    totalCost: 28.67,
    byModel: {
      'gpt-4o-mini': 2.49,
      'claude-3.5-sonnet': 13.38,
      'gpt-4': 12.48,
      'gemini-pro': 0.32
    },
    avgCostPerRequest: 0.012,
    budget: 100,
    percentUsed: 28.67
  };
  
  res.json({ ok: true, costs });
});

router.get('/ai/prompts', (req, res) => {
  const prompts = [
    {
      id: 1,
      name: 'Subject Line - Promotional',
      template: 'Generate {{count}} promotional email subject lines for {{product}} with a {{tone}} tone.',
      category: 'subject-line'
    },
    {
      id: 2,
      name: 'Email Body - Welcome',
      template: 'Write a welcome email for new subscribers to {{brand}}. Include {{cta}}.',
      category: 'content'
    },
    {
      id: 3,
      name: 'Personalization - Birthday',
      template: 'Create a personalized birthday email for {{firstName}} with a special {{offer}}.',
      category: 'personalization'
    }
  ];
  
  res.json({ ok: true, prompts });
});

router.post('/ai/prompts', (req, res) => {
  const { name, template, category, variables } = req.body;
  
  if (!name || !template) {
    return res.status(400).json({ ok: false, error: 'name and template required' });
  }
  
  const prompt = {
    id: 4,
    name,
    template,
    category,
    variables,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({ ok: true, prompt });
});

// ================================================================
// CATEGORY 3: AUDIENCE & SEGMENTATION (26 endpoints)
// ================================================================

// 3.1 Segments

router.get('/segments', (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  
  let filtered = Array.from(segments.values());
  if (type) filtered = filtered.filter(s => s.type === type);
  
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));
  
  res.json({
    ok: true,
    segments: paginated,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.post('/segments', (req, res) => {
  const { name, type = 'static', conditions, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ ok: false, error: 'name required' });
  }
  
  const segment = {
    id: segmentIdCounter++,
    name,
    type,
    conditions,
    description,
    contactCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  segments.set(segment.id, segment);
  logAudit('segment_created', 'user', segment.id, { name, type });
  
  res.status(201).json({ ok: true, segment });
});

router.get('/segments/:id', (req, res) => {
  const segment = segments.get(parseInt(req.params.id));
  
  if (!segment) {
    return res.status(404).json({ ok: false, error: 'Segment not found' });
  }
  
  res.json({ ok: true, segment });
});

router.put('/segments/:id', (req, res) => {
  const segment = segments.get(parseInt(req.params.id));
  
  if (!segment) {
    return res.status(404).json({ ok: false, error: 'Segment not found' });
  }
  
  Object.assign(segment, req.body, {
    updatedAt: new Date().toISOString()
  });
  
  logAudit('segment_updated', 'user', segment.id);
  
  res.json({ ok: true, segment });
});

router.delete('/segments/:id', (req, res) => {
  const segment = segments.get(parseInt(req.params.id));
  
  if (!segment) {
    return res.status(404).json({ ok: false, error: 'Segment not found' });
  }
  
  segments.delete(parseInt(req.params.id));
  logAudit('segment_deleted', 'user', segment.id);
  
  res.json({ ok: true, message: 'Segment deleted' });
});

router.get('/segments/:id/contacts', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  // Mock contact list for segment
  const mockContacts = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    email: `contact${i + 1}@example.com`,
    firstName: `Contact`,
    lastName: `${i + 1}`,
    joinedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
  }));
  
  const total = mockContacts.length;
  const start = (page - 1) * limit;
  const paginated = mockContacts.slice(start, start + parseInt(limit));
  
  res.json({
    ok: true,
    contacts: paginated,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.get('/segments/:id/count', (req, res) => {
  const segment = segments.get(parseInt(req.params.id));
  
  if (!segment) {
    return res.status(404).json({ ok: false, error: 'Segment not found' });
  }
  
  // Mock count
  const count = Math.floor(Math.random() * 1000) + 100;
  
  res.json({ ok: true, count, segmentId: segment.id });
});

router.post('/segments/:id/refresh', (req, res) => {
  const segment = segments.get(parseInt(req.params.id));
  
  if (!segment) {
    return res.status(404).json({ ok: false, error: 'Segment not found' });
  }
  
  if (segment.type !== 'dynamic') {
    return res.status(400).json({ ok: false, error: 'Only dynamic segments can be refreshed' });
  }
  
  segment.contactCount = Math.floor(Math.random() * 1000) + 100;
  segment.updatedAt = new Date().toISOString();
  
  res.json({ ok: true, segment, message: 'Segment refreshed' });
});

// 3.2 Behavioral Targeting

router.post('/segments/behavioral', (req, res) => {
  const { name, event, conditions } = req.body;
  
  if (!name || !event) {
    return res.status(400).json({ ok: false, error: 'name and event required' });
  }
  
  const segment = {
    id: segmentIdCounter++,
    name,
    type: 'behavioral',
    event,
    conditions,
    contactCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  segments.set(segment.id, segment);
  
  res.status(201).json({ ok: true, segment });
});

router.get('/behavioral-events', (req, res) => {
  const events = [
    { name: 'email_opened', count: 15234 },
    { name: 'email_clicked', count: 8456 },
    { name: 'product_viewed', count: 12367 },
    { name: 'product_purchased', count: 2341 },
    { name: 'cart_abandoned', count: 1876 },
    { name: 'page_visited', count: 23456 }
  ];
  
  res.json({ ok: true, events });
});

router.post('/behavioral-events', (req, res) => {
  const { contactId, event, metadata = {} } = req.body;
  
  if (!contactId || !event) {
    return res.status(400).json({ ok: false, error: 'contactId and event required' });
  }
  
  const eventRecord = {
    id: emailEvents.length + 1,
    contactId,
    event,
    metadata,
    timestamp: new Date().toISOString()
  };
  
  emailEvents.push(eventRecord);
  
  res.status(201).json({ ok: true, event: eventRecord });
});

router.get('/contacts/:id/behavior', (req, res) => {
  const behavior = {
    contactId: parseInt(req.params.id),
    events: [
      { event: 'email_opened', count: 45, lastOccurred: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { event: 'email_clicked', count: 23, lastOccurred: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      { event: 'product_purchased', count: 3, lastOccurred: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    engagementScore: 78,
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  };
  
  res.json({ ok: true, behavior });
});

router.post('/segments/engagement-score', (req, res) => {
  const { name, minScore, maxScore = 100 } = req.body;
  
  if (!name || minScore === undefined) {
    return res.status(400).json({ ok: false, error: 'name and minScore required' });
  }
  
  const segment = {
    id: segmentIdCounter++,
    name,
    type: 'engagement',
    minScore,
    maxScore,
    contactCount: Math.floor(Math.random() * 500) + 50,
    createdAt: new Date().toISOString()
  };
  
  segments.set(segment.id, segment);
  
  res.status(201).json({ ok: true, segment });
});

// 3.3 Predictive Segments

router.post('/segments/predictive/churn', (req, res) => {
  const { name, riskLevel = 'high', lookbackDays = 30 } = req.body;
  
  if (!name) {
    return res.status(400).json({ ok: false, error: 'name required' });
  }
  
  const segment = {
    id: segmentIdCounter++,
    name,
    type: 'predictive-churn',
    riskLevel,
    lookbackDays,
    contactCount: Math.floor(Math.random() * 200) + 50,
    accuracy: 0.87,
    createdAt: new Date().toISOString()
  };
  
  segments.set(segment.id, segment);
  
  res.status(201).json({ ok: true, segment });
});

router.post('/segments/predictive/conversion', (req, res) => {
  const { name, probabilityThreshold = 0.7 } = req.body;
  
  if (!name) {
    return res.status(400).json({ ok: false, error: 'name required' });
  }
  
  const segment = {
    id: segmentIdCounter++,
    name,
    type: 'predictive-conversion',
    probabilityThreshold,
    contactCount: Math.floor(Math.random() * 300) + 100,
    accuracy: 0.82,
    createdAt: new Date().toISOString()
  };
  
  segments.set(segment.id, segment);
  
  res.status(201).json({ ok: true, segment });
});

router.post('/segments/predictive/ltv', (req, res) => {
  const { name, minLtv } = req.body;
  
  if (!name || !minLtv) {
    return res.status(400).json({ ok: false, error: 'name and minLtv required' });
  }
  
  const segment = {
    id: segmentIdCounter++,
    name,
    type: 'predictive-ltv',
    minLtv,
    contactCount: Math.floor(Math.random() * 150) + 30,
    avgPredictedLtv: minLtv * 1.5,
    createdAt: new Date().toISOString()
  };
  
  segments.set(segment.id, segment);
  
  res.status(201).json({ ok: true, segment });
});

router.get('/segments/predictive/models', (req, res) => {
  const models = [
    {
      id: 'churn-v2',
      name: 'Churn Prediction Model v2',
      type: 'churn',
      accuracy: 0.87,
      lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'conversion-v1',
      name: 'Conversion Probability Model v1',
      type: 'conversion',
      accuracy: 0.82,
      lastTrained: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ltv-v1',
      name: 'Lifetime Value Prediction v1',
      type: 'ltv',
      accuracy: 0.79,
      lastTrained: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json({ ok: true, models });
});

router.post('/segments/predictive/train', (req, res) => {
  const { modelType, trainingData } = req.body;
  
  if (!modelType) {
    return res.status(400).json({ ok: false, error: 'modelType required' });
  }
  
  const job = {
    jobId: `train_${Date.now()}`,
    modelType,
    status: 'training',
    progress: 0,
    estimatedCompletion: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };
  
  res.json({ ok: true, job });
});

// 3.4 Contact Management

router.get('/contacts', (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  
  let filtered = Array.from(contacts.values());
  
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.email.toLowerCase().includes(searchLower) ||
      (c.firstName && c.firstName.toLowerCase().includes(searchLower)) ||
      (c.lastName && c.lastName.toLowerCase().includes(searchLower))
    );
  }
  
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));
  
  res.json({
    ok: true,
    contacts: paginated,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.post('/contacts', (req, res) => {
  const { email, firstName, lastName, phone, customFields = {} } = req.body;
  
  if (!email) {
    return res.status(400).json({ ok: false, error: 'email required' });
  }
  
  const contact = {
    id: contactIdCounter++,
    email,
    firstName,
    lastName,
    phone,
    customFields,
    engagementScore: 50,
    status: 'subscribed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  contacts.set(contact.id, contact);
  logAudit('contact_created', 'user', contact.id, { email });
  
  res.status(201).json({ ok: true, contact });
});

router.get('/contacts/:id', (req, res) => {
  const contact = contacts.get(parseInt(req.params.id));
  
  if (!contact) {
    return res.status(404).json({ ok: false, error: 'Contact not found' });
  }
  
  res.json({ ok: true, contact });
});

router.put('/contacts/:id', (req, res) => {
  const contact = contacts.get(parseInt(req.params.id));
  
  if (!contact) {
    return res.status(404).json({ ok: false, error: 'Contact not found' });
  }
  
  Object.assign(contact, req.body, {
    updatedAt: new Date().toISOString()
  });
  
  logAudit('contact_updated', 'user', contact.id);
  
  res.json({ ok: true, contact });
});

router.delete('/contacts/:id', (req, res) => {
  const contact = contacts.get(parseInt(req.params.id));
  
  if (!contact) {
    return res.status(404).json({ ok: false, error: 'Contact not found' });
  }
  
  contacts.delete(parseInt(req.params.id));
  logAudit('contact_deleted', 'user', contact.id);
  
  res.json({ ok: true, message: 'Contact deleted' });
});

router.post('/contacts/bulk-import', (req, res) => {
  const { contacts: contactsData, overwriteExisting = false } = req.body;
  
  if (!Array.isArray(contactsData)) {
    return res.status(400).json({ ok: false, error: 'contacts array required' });
  }
  
  let imported = 0;
  let skipped = 0;
  const errors = [];
  
  contactsData.forEach((data, index) => {
    try {
      if (!data.email) {
        errors.push({ row: index + 1, error: 'Missing email' });
        skipped++;
        return;
      }
      
      const contact = {
        id: contactIdCounter++,
        ...data,
        engagementScore: 50,
        status: 'subscribed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      contacts.set(contact.id, contact);
      imported++;
    } catch (error) {
      errors.push({ row: index + 1, error: error.message });
      skipped++;
    }
  });
  
  res.json({ ok: true, imported, skipped, errors });
});

router.post('/contacts/bulk-update', (req, res) => {
  const { contactIds, updates } = req.body;
  
  if (!Array.isArray(contactIds) || !updates) {
    return res.status(400).json({ ok: false, error: 'contactIds array and updates object required' });
  }
  
  let updated = 0;
  contactIds.forEach(id => {
    const contact = contacts.get(id);
    if (contact) {
      Object.assign(contact, updates, { updatedAt: new Date().toISOString() });
      updated++;
    }
  });
  
  res.json({ ok: true, updated });
});

router.post('/contacts/:id/score', (req, res) => {
  const contact = contacts.get(parseInt(req.params.id));
  
  if (!contact) {
    return res.status(404).json({ ok: false, error: 'Contact not found' });
  }
  
  // Calculate engagement score based on mock behavior
  const score = Math.floor(Math.random() * 40) + 60; // 60-100
  
  contact.engagementScore = score;
  contact.updatedAt = new Date().toISOString();
  
  res.json({
    ok: true,
    contactId: contact.id,
    score,
    factors: {
      emailOpens: 0.3,
      emailClicks: 0.25,
      purchases: 0.25,
      recency: 0.2
    }
  });
});

// 3.5 Lists

router.get('/lists', (req, res) => {
  const filtered = Array.from(lists.values());
  
  res.json({ ok: true, lists: filtered });
});

router.post('/lists', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ ok: false, error: 'name required' });
  }
  
  const list = {
    id: listIdCounter++,
    name,
    description,
    contactCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  lists.set(list.id, list);
  logAudit('list_created', 'user', list.id, { name });
  
  res.status(201).json({ ok: true, list });
});

router.get('/lists/:id', (req, res) => {
  const list = lists.get(parseInt(req.params.id));
  
  if (!list) {
    return res.status(404).json({ ok: false, error: 'List not found' });
  }
  
  res.json({ ok: true, list });
});

router.put('/lists/:id', (req, res) => {
  const list = lists.get(parseInt(req.params.id));
  
  if (!list) {
    return res.status(404).json({ ok: false, error: 'List not found' });
  }
  
  Object.assign(list, req.body, {
    updatedAt: new Date().toISOString()
  });
  
  res.json({ ok: true, list });
});

router.delete('/lists/:id', (req, res) => {
  const list = lists.get(parseInt(req.params.id));
  
  if (!list) {
    return res.status(404).json({ ok: false, error: 'List not found' });
  }
  
  lists.delete(parseInt(req.params.id));
  logAudit('list_deleted', 'user', list.id);
  
  res.json({ ok: true, message: 'List deleted' });
});

router.post('/lists/:id/contacts/add', (req, res) => {
  const list = lists.get(parseInt(req.params.id));
  const { contactIds } = req.body;
  
  if (!list) {
    return res.status(404).json({ ok: false, error: 'List not found' });
  }
  
  if (!Array.isArray(contactIds)) {
    return res.status(400).json({ ok: false, error: 'contactIds array required' });
  }
  
  list.contactCount += contactIds.length;
  list.updatedAt = new Date().toISOString();
  
  res.json({ ok: true, list, added: contactIds.length });
});

router.post('/lists/:id/contacts/remove', (req, res) => {
  const list = lists.get(parseInt(req.params.id));
  const { contactIds } = req.body;
  
  if (!list) {
    return res.status(404).json({ ok: false, error: 'List not found' });
  }
  
  if (!Array.isArray(contactIds)) {
    return res.status(400).json({ ok: false, error: 'contactIds array required' });
  }
  
  list.contactCount = Math.max(0, list.contactCount - contactIds.length);
  list.updatedAt = new Date().toISOString();
  
  res.json({ ok: true, list, removed: contactIds.length });
});

// ================================================================
// CATEGORY 4: MULTI-CHANNEL ORCHESTRATION (24 endpoints)
// ================================================================

// 4.1 Email Delivery (ESP Integration)

router.post('/send/email', async (req, res) => {
  const { to, subject, html, fromName, fromEmail, esp = 'sendgrid' } = req.body;
  
  if (!to || !subject || !html) {
    return res.status(400).json({ ok: false, error: 'to, subject, and html required' });
  }
  
  // Mock ESP delivery
  const delivery = {
    messageId: `msg_${Date.now()}`,
    esp,
    to,
    subject,
    status: 'sent',
    sentAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 5000).toISOString()
  };
  
  res.json({ ok: true, delivery });
});

router.post('/send/email/batch', async (req, res) => {
  const { recipients, subject, html, fromName, fromEmail, esp = 'sendgrid' } = req.body;
  
  if (!Array.isArray(recipients) || !subject || !html) {
    return res.status(400).json({ ok: false, error: 'recipients array, subject, and html required' });
  }
  
  const batch = {
    batchId: `batch_${Date.now()}`,
    esp,
    recipientCount: recipients.length,
    status: 'processing',
    sentAt: new Date().toISOString()
  };
  
  res.json({ ok: true, batch });
});

router.get('/send/status/:messageId', (req, res) => {
  const status = {
    messageId: req.params.messageId,
    status: 'delivered',
    deliveredAt: new Date().toISOString(),
    events: [
      { event: 'sent', timestamp: new Date(Date.now() - 10000).toISOString() },
      { event: 'delivered', timestamp: new Date().toISOString() }
    ]
  };
  
  res.json({ ok: true, status });
});

router.post('/send/test', async (req, res) => {
  const { to, subject, html } = req.body;
  
  if (!to) {
    return res.status(400).json({ ok: false, error: 'to required' });
  }
  
  res.json({
    ok: true,
    message: `Test email sent to ${to}`,
    deliveryTime: '2.3s'
  });
});

router.get('/esp/integrations', (req, res) => {
  const integrations = [
    {
      id: 'sendgrid',
      name: 'SendGrid',
      status: 'active',
      apiKeySet: true,
      dailyQuota: 100000,
      dailyUsage: 12457
    },
    {
      id: 'aws-ses',
      name: 'AWS SES',
      status: 'active',
      apiKeySet: true,
      dailyQuota: 50000,
      dailyUsage: 5234
    },
    {
      id: 'mailgun',
      name: 'Mailgun',
      status: 'inactive',
      apiKeySet: false,
      dailyQuota: 10000,
      dailyUsage: 0
    },
    {
      id: 'postmark',
      name: 'Postmark',
      status: 'active',
      apiKeySet: true,
      dailyQuota: 25000,
      dailyUsage: 3452
    }
  ];
  
  res.json({ ok: true, integrations });
});

router.post('/esp/configure', (req, res) => {
  const { esp, apiKey, settings = {} } = req.body;
  
  if (!esp || !apiKey) {
    return res.status(400).json({ ok: false, error: 'esp and apiKey required' });
  }
  
  const config = {
    esp,
    status: 'active',
    configuredAt: new Date().toISOString(),
    settings
  };
  
  logAudit('esp_configured', 'user', null, { esp });
  
  res.json({ ok: true, config });
});

router.get('/esp/health', (req, res) => {
  const health = {
    sendgrid: { status: 'healthy', latency: 145, successRate: 99.8 },
    'aws-ses': { status: 'healthy', latency: 89, successRate: 99.9 },
    mailgun: { status: 'inactive', latency: null, successRate: null },
    postmark: { status: 'healthy', latency: 112, successRate: 99.7 }
  };
  
  res.json({ ok: true, health });
});

router.post('/esp/failover', (req, res) => {
  const { from, to } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ ok: false, error: 'from and to ESPs required' });
  }
  
  const failover = {
    from,
    to,
    reason: 'Primary ESP unhealthy',
    switchedAt: new Date().toISOString()
  };
  
  logAudit('esp_failover', 'system', null, failover);
  
  res.json({ ok: true, failover });
});

// 4.2 SMS Delivery

router.post('/send/sms', async (req, res) => {
  const { to, message, provider = 'twilio' } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ ok: false, error: 'to and message required' });
  }
  
  const delivery = {
    messageId: `sms_${Date.now()}`,
    provider,
    to,
    message,
    status: 'sent',
    sentAt: new Date().toISOString()
  };
  
  res.json({ ok: true, delivery });
});

router.post('/send/sms/batch', async (req, res) => {
  const { recipients, message, provider = 'twilio' } = req.body;
  
  if (!Array.isArray(recipients) || !message) {
    return res.status(400).json({ ok: false, error: 'recipients array and message required' });
  }
  
  const batch = {
    batchId: `sms_batch_${Date.now()}`,
    provider,
    recipientCount: recipients.length,
    status: 'processing'
  };
  
  res.json({ ok: true, batch });
});

router.get('/sms/providers', (req, res) => {
  const providers = [
    { id: 'twilio', name: 'Twilio', status: 'active', balance: 487.23 },
    { id: 'plivo', name: 'Plivo', status: 'inactive', balance: 0 },
    { id: 'aws-sns', name: 'AWS SNS', status: 'active', balance: 156.78 }
  ];
  
  res.json({ ok: true, providers });
});

router.post('/sms/configure', (req, res) => {
  const { provider, credentials } = req.body;
  
  if (!provider || !credentials) {
    return res.status(400).json({ ok: false, error: 'provider and credentials required' });
  }
  
  res.json({
    ok: true,
    provider,
    status: 'configured',
    configuredAt: new Date().toISOString()
  });
});

// 4.3 Push Notifications

router.post('/send/push', async (req, res) => {
  const { userId, title, body, data = {} } = req.body;
  
  if (!userId || !title || !body) {
    return res.status(400).json({ ok: false, error: 'userId, title, and body required' });
  }
  
  const delivery = {
    notificationId: `push_${Date.now()}`,
    userId,
    title,
    body,
    status: 'sent',
    sentAt: new Date().toISOString()
  };
  
  res.json({ ok: true, delivery });
});

router.post('/send/push/batch', async (req, res) => {
  const { userIds, title, body, data = {} } = req.body;
  
  if (!Array.isArray(userIds) || !title || !body) {
    return res.status(400).json({ ok: false, error: 'userIds array, title, and body required' });
  }
  
  const batch = {
    batchId: `push_batch_${Date.now()}`,
    userCount: userIds.length,
    status: 'processing'
  };
  
  res.json({ ok: true, batch });
});

router.get('/push/subscriptions', (req, res) => {
  const stats = {
    total: 12456,
    active: 10234,
    inactive: 2222,
    platforms: {
      ios: 5678,
      android: 5234,
      web: 1322
    }
  };
  
  res.json({ ok: true, stats });
});

// 4.4 WhatsApp Business

router.post('/send/whatsapp', async (req, res) => {
  const { to, message, templateId } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ ok: false, error: 'to and message required' });
  }
  
  const delivery = {
    messageId: `wa_${Date.now()}`,
    to,
    message,
    templateId,
    status: 'sent',
    sentAt: new Date().toISOString()
  };
  
  res.json({ ok: true, delivery });
});

router.get('/whatsapp/templates', (req, res) => {
  const templates = [
    { id: 'welcome', name: 'Welcome Message', status: 'approved' },
    { id: 'order-confirm', name: 'Order Confirmation', status: 'approved' },
    { id: 'shipping', name: 'Shipping Update', status: 'pending' }
  ];
  
  res.json({ ok: true, templates });
});

// 4.5 In-App Messages

router.post('/send/in-app', async (req, res) => {
  const { userId, title, body, action } = req.body;
  
  if (!userId || !title || !body) {
    return res.status(400).json({ ok: false, error: 'userId, title, and body required' });
  }
  
  const message = {
    messageId: `inapp_${Date.now()}`,
    userId,
    title,
    body,
    action,
    status: 'queued',
    createdAt: new Date().toISOString()
  };
  
  res.json({ ok: true, message });
});

router.get('/in-app/messages/:userId', (req, res) => {
  const messages = [
    {
      id: 1,
      title: 'Special Offer',
      body: 'Get 20% off your next purchase',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      title: 'New Feature',
      body: 'Check out our latest feature',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json({ ok: true, messages });
});

// 4.6 Cross-Channel Journeys

router.post('/journeys', (req, res) => {
  const { name, channels, triggers, steps } = req.body;
  
  if (!name || !channels || !steps) {
    return res.status(400).json({ ok: false, error: 'name, channels, and steps required' });
  }
  
  const journey = {
    id: workflowIdCounter++,
    name,
    channels,
    triggers,
    steps,
    status: 'draft',
    enrolledContacts: 0,
    createdAt: new Date().toISOString()
  };
  
  res.json({ ok: true, journey });
});

router.get('/journeys', (req, res) => {
  const journeys = [
    {
      id: 1,
      name: 'Welcome Series',
      channels: ['email', 'sms'],
      status: 'active',
      enrolledContacts: 1247
    },
    {
      id: 2,
      name: 'Cart Abandonment',
      channels: ['email', 'push'],
      status: 'active',
      enrolledContacts: 856
    }
  ];
  
  res.json({ ok: true, journeys });
});

router.get('/journeys/:id', (req, res) => {
  const journey = {
    id: parseInt(req.params.id),
    name: 'Welcome Series',
    channels: ['email', 'sms', 'push'],
    triggers: [{ event: 'contact_created' }],
    steps: [
      { id: 1, channel: 'email', delay: 0, template: 'welcome-1' },
      { id: 2, channel: 'sms', delay: 86400, message: 'Thanks for joining!' },
      { id: 3, channel: 'push', delay: 259200, template: 'push-welcome' }
    ],
    status: 'active',
    enrolledContacts: 1247
  };
  
  res.json({ ok: true, journey });
});

router.post('/journeys/:id/activate', (req, res) => {
  res.json({
    ok: true,
    journeyId: parseInt(req.params.id),
    status: 'active',
    activatedAt: new Date().toISOString()
  });
});

// ================================================================
// CATEGORY 5: AUTOMATION WORKFLOWS (28 endpoints)
// ================================================================

// 5.1 Workflow Management

router.get('/workflows', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  let filtered = Array.from(workflows.values());
  if (status) filtered = filtered.filter(w => w.status === status);
  
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));
  
  res.json({
    ok: true,
    workflows: paginated,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.post('/workflows', (req, res) => {
  const { name, trigger, actions, description } = req.body;
  
  if (!name || !trigger || !actions) {
    return res.status(400).json({ ok: false, error: 'name, trigger, and actions required' });
  }
  
  const workflow = {
    id: workflowIdCounter++,
    name,
    trigger,
    actions,
    description,
    status: 'draft',
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  workflows.set(workflow.id, workflow);
  logAudit('workflow_created', 'user', workflow.id, { name });
  
  res.status(201).json({ ok: true, workflow });
});

router.get('/workflows/:id', (req, res) => {
  const workflow = workflows.get(parseInt(req.params.id));
  
  if (!workflow) {
    return res.status(404).json({ ok: false, error: 'Workflow not found' });
  }
  
  res.json({ ok: true, workflow });
});

router.put('/workflows/:id', (req, res) => {
  const workflow = workflows.get(parseInt(req.params.id));
  
  if (!workflow) {
    return res.status(404).json({ ok: false, error: 'Workflow not found' });
  }
  
  Object.assign(workflow, req.body, {
    updatedAt: new Date().toISOString()
  });
  
  logAudit('workflow_updated', 'user', workflow.id);
  
  res.json({ ok: true, workflow });
});

router.delete('/workflows/:id', (req, res) => {
  const workflow = workflows.get(parseInt(req.params.id));
  
  if (!workflow) {
    return res.status(404).json({ ok: false, error: 'Workflow not found' });
  }
  
  workflows.delete(parseInt(req.params.id));
  logAudit('workflow_deleted', 'user', workflow.id);
  
  res.json({ ok: true, message: 'Workflow deleted' });
});

router.post('/workflows/:id/activate', (req, res) => {
  const workflow = workflows.get(parseInt(req.params.id));
  
  if (!workflow) {
    return res.status(404).json({ ok: false, error: 'Workflow not found' });
  }
  
  workflow.status = 'active';
  workflow.activatedAt = new Date().toISOString();
  workflow.updatedAt = new Date().toISOString();
  
  logAudit('workflow_activated', 'user', workflow.id);
  
  res.json({ ok: true, workflow });
});

router.post('/workflows/:id/deactivate', (req, res) => {
  const workflow = workflows.get(parseInt(req.params.id));
  
  if (!workflow) {
    return res.status(404).json({ ok: false, error: 'Workflow not found' });
  }
  
  workflow.status = 'inactive';
  workflow.deactivatedAt = new Date().toISOString();
  workflow.updatedAt = new Date().toISOString();
  
  logAudit('workflow_deactivated', 'user', workflow.id);
  
  res.json({ ok: true, workflow });
});

router.post('/workflows/:id/test', async (req, res) => {
  const workflow = workflows.get(parseInt(req.params.id));
  const { testData = {} } = req.body;
  
  if (!workflow) {
    return res.status(404).json({ ok: false, error: 'Workflow not found' });
  }
  
  const execution = {
    executionId: `exec_${Date.now()}`,
    workflowId: workflow.id,
    mode: 'test',
    status: 'completed',
    steps: workflow.actions.map((action, i) => ({
      stepId: i + 1,
      action: action.type,
      status: 'completed',
      duration: Math.floor(Math.random() * 500) + 100
    })),
    startedAt: new Date(Date.now() - 2000).toISOString(),
    completedAt: new Date().toISOString()
  };
  
  res.json({ ok: true, execution });
});

router.post('/workflows/:id/duplicate', (req, res) => {
  const original = workflows.get(parseInt(req.params.id));
  
  if (!original) {
    return res.status(404).json({ ok: false, error: 'Workflow not found' });
  }
  
  const duplicate = {
    ...original,
    id: workflowIdCounter++,
    name: `${original.name} (Copy)`,
    status: 'draft',
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  workflows.set(duplicate.id, duplicate);
  
  res.status(201).json({ ok: true, workflow: duplicate });
});

// 5.2 Triggers

router.get('/workflows/triggers/available', (req, res) => {
  const triggers = [
    {
      id: 'contact_created',
      name: 'Contact Created',
      description: 'Triggered when a new contact is added',
      category: 'contacts'
    },
    {
      id: 'email_opened',
      name: 'Email Opened',
      description: 'Triggered when a contact opens an email',
      category: 'engagement'
    },
    {
      id: 'link_clicked',
      name: 'Link Clicked',
      description: 'Triggered when a link is clicked',
      category: 'engagement'
    },
    {
      id: 'segment_joined',
      name: 'Segment Joined',
      description: 'Triggered when contact joins a segment',
      category: 'segments'
    },
    {
      id: 'purchase_completed',
      name: 'Purchase Completed',
      description: 'Triggered when a purchase is made',
      category: 'ecommerce'
    },
    {
      id: 'cart_abandoned',
      name: 'Cart Abandoned',
      description: 'Triggered when a cart is abandoned',
      category: 'ecommerce'
    },
    {
      id: 'date_based',
      name: 'Date Based',
      description: 'Triggered on specific dates or anniversaries',
      category: 'time'
    },
    {
      id: 'api_event',
      name: 'API Event',
      description: 'Triggered by external API calls',
      category: 'custom'
    }
  ];
  
  res.json({ ok: true, triggers });
});

router.post('/workflows/triggers/test', (req, res) => {
  const { triggerId, testData = {} } = req.body;
  
  if (!triggerId) {
    return res.status(400).json({ ok: false, error: 'triggerId required' });
  }
  
  const result = {
    triggerId,
    triggered: true,
    matchedWorkflows: 3,
    testData,
    timestamp: new Date().toISOString()
  };
  
  res.json({ ok: true, result });
});

// 5.3 Actions

router.get('/workflows/actions/available', (req, res) => {
  const actions = [
    {
      id: 'send_email',
      name: 'Send Email',
      description: 'Send an email to the contact',
      category: 'messaging',
      requiredFields: ['templateId', 'delay']
    },
    {
      id: 'send_sms',
      name: 'Send SMS',
      description: 'Send an SMS message',
      category: 'messaging',
      requiredFields: ['message', 'delay']
    },
    {
      id: 'add_to_segment',
      name: 'Add to Segment',
      description: 'Add contact to a segment',
      category: 'segments',
      requiredFields: ['segmentId']
    },
    {
      id: 'remove_from_segment',
      name: 'Remove from Segment',
      description: 'Remove contact from a segment',
      category: 'segments',
      requiredFields: ['segmentId']
    },
    {
      id: 'update_field',
      name: 'Update Field',
      description: 'Update a contact field',
      category: 'contacts',
      requiredFields: ['field', 'value']
    },
    {
      id: 'add_tag',
      name: 'Add Tag',
      description: 'Add a tag to contact',
      category: 'contacts',
      requiredFields: ['tag']
    },
    {
      id: 'wait',
      name: 'Wait',
      description: 'Wait for a specified duration',
      category: 'flow',
      requiredFields: ['duration']
    },
    {
      id: 'conditional_split',
      name: 'Conditional Split',
      description: 'Split flow based on conditions',
      category: 'flow',
      requiredFields: ['conditions']
    },
    {
      id: 'webhook',
      name: 'Webhook',
      description: 'Call an external webhook',
      category: 'integrations',
      requiredFields: ['url', 'method']
    }
  ];
  
  res.json({ ok: true, actions });
});

router.post('/workflows/:id/actions/add', (req, res) => {
  const workflow = workflows.get(parseInt(req.params.id));
  const { action } = req.body;
  
  if (!workflow) {
    return res.status(404).json({ ok: false, error: 'Workflow not found' });
  }
  
  if (!action) {
    return res.status(400).json({ ok: false, error: 'action required' });
  }
  
  if (!workflow.actions) workflow.actions = [];
  workflow.actions.push(action);
  workflow.updatedAt = new Date().toISOString();
  
  res.json({ ok: true, workflow });
});

router.delete('/workflows/:id/actions/:actionId', (req, res) => {
  const workflow = workflows.get(parseInt(req.params.id));
  
  if (!workflow) {
    return res.status(404).json({ ok: false, error: 'Workflow not found' });
  }
  
  if (workflow.actions) {
    workflow.actions = workflow.actions.filter(a => a.id !== req.params.actionId);
    workflow.updatedAt = new Date().toISOString();
  }
  
  res.json({ ok: true, workflow });
});

// 5.4 Workflow Execution & Analytics

router.get('/workflows/:id/executions', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  const mockExecutions = Array.from({ length: 50 }, (_, i) => ({
    executionId: `exec_${i + 1}`,
    workflowId: parseInt(req.params.id),
    contactId: i + 1,
    status: ['completed', 'failed', 'running'][i % 3],
    startedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - (i - 1) * 60 * 60 * 1000).toISOString()
  }));
  
  let filtered = mockExecutions;
  if (status) filtered = filtered.filter(e => e.status === status);
  
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));
  
  res.json({
    ok: true,
    executions: paginated,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.get('/workflows/:id/analytics', (req, res) => {
  const analytics = {
    workflowId: parseInt(req.params.id),
    totalExecutions: 1247,
    successfulExecutions: 1189,
    failedExecutions: 58,
    successRate: 95.3,
    avgDuration: 3420,
    byDay: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      executions: Math.floor(Math.random() * 200) + 100
    }))
  };
  
  res.json({ ok: true, analytics });
});

router.post('/workflows/:id/stop-execution', (req, res) => {
  const { executionId } = req.body;
  
  if (!executionId) {
    return res.status(400).json({ ok: false, error: 'executionId required' });
  }
  
  res.json({
    ok: true,
    executionId,
    status: 'stopped',
    stoppedAt: new Date().toISOString()
  });
});

// 5.5 Workflow Templates

router.get('/workflows/templates', (req, res) => {
  const templates = [
    {
      id: 'welcome-series',
      name: 'Welcome Series',
      description: '3-email welcome sequence for new subscribers',
      category: 'onboarding',
      estimatedSetup: '5 minutes'
    },
    {
      id: 'abandoned-cart',
      name: 'Abandoned Cart Recovery',
      description: 'Multi-channel cart abandonment workflow',
      category: 'ecommerce',
      estimatedSetup: '10 minutes'
    },
    {
      id: 'win-back',
      name: 'Win-Back Campaign',
      description: 'Re-engage inactive subscribers',
      category: 'engagement',
      estimatedSetup: '7 minutes'
    },
    {
      id: 'post-purchase',
      name: 'Post-Purchase Follow-up',
      description: 'Request reviews and cross-sell',
      category: 'ecommerce',
      estimatedSetup: '8 minutes'
    },
    {
      id: 'birthday',
      name: 'Birthday Campaign',
      description: 'Automated birthday wishes with offers',
      category: 'lifecycle',
      estimatedSetup: '5 minutes'
    }
  ];
  
  res.json({ ok: true, templates });
});

router.get('/workflows/templates/:id', (req, res) => {
  const template = {
    id: req.params.id,
    name: 'Welcome Series',
    description: '3-email welcome sequence for new subscribers',
    trigger: { type: 'contact_created' },
    actions: [
      { type: 'send_email', templateId: 'welcome-1', delay: 0 },
      { type: 'wait', duration: 86400 },
      { type: 'send_email', templateId: 'welcome-2', delay: 86400 },
      { type: 'wait', duration: 172800 },
      { type: 'send_email', templateId: 'welcome-3', delay: 259200 }
    ]
  };
  
  res.json({ ok: true, template });
});

router.post('/workflows/templates/:id/use', (req, res) => {
  const { name } = req.body;
  
  const workflow = {
    id: workflowIdCounter++,
    name: name || 'New Workflow from Template',
    templateId: req.params.id,
    status: 'draft',
    trigger: { type: 'contact_created' },
    actions: [],
    executionCount: 0,
    createdAt: new Date().toISOString()
  };
  
  workflows.set(workflow.id, workflow);
  
  res.status(201).json({ ok: true, workflow });
});

// 5.6 Goals & Conversion Tracking

router.post('/workflows/:id/goals', (req, res) => {
  const { goal, targetValue } = req.body;
  
  if (!goal) {
    return res.status(400).json({ ok: false, error: 'goal required' });
  }
  
  const goalConfig = {
    workflowId: parseInt(req.params.id),
    goal,
    targetValue,
    currentValue: 0,
    progress: 0,
    createdAt: new Date().toISOString()
  };
  
  res.json({ ok: true, goal: goalConfig });
});

router.get('/workflows/:id/goals', (req, res) => {
  const goals = [
    {
      id: 1,
      goal: 'email_open_rate',
      targetValue: 25,
      currentValue: 22.5,
      progress: 90
    },
    {
      id: 2,
      goal: 'conversion_rate',
      targetValue: 5,
      currentValue: 4.2,
      progress: 84
    },
    {
      id: 3,
      goal: 'revenue',
      targetValue: 10000,
      currentValue: 8450,
      progress: 84.5
    }
  ];
  
  res.json({ ok: true, goals });
});

router.post('/workflows/:id/goals/:goalId/track', (req, res) => {
  const { value } = req.body;
  
  res.json({
    ok: true,
    goalId: parseInt(req.params.goalId),
    value,
    trackedAt: new Date().toISOString()
  });
});

// 5.7 Workflow Versioning

router.get('/workflows/:id/versions', (req, res) => {
  const versions = [
    {
      versionId: 1,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user@example.com',
      changes: 'Initial version'
    },
    {
      versionId: 2,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user@example.com',
      changes: 'Added SMS step'
    }
  ];
  
  res.json({ ok: true, versions });
});

router.post('/workflows/:id/versions', (req, res) => {
  const workflow = workflows.get(parseInt(req.params.id));
  
  if (!workflow) {
    return res.status(404).json({ ok: false, error: 'Workflow not found' });
  }
  
  const version = {
    versionId: 3,
    workflowId: workflow.id,
    snapshot: { ...workflow },
    createdAt: new Date().toISOString(),
    createdBy: 'user@example.com'
  };
  
  res.status(201).json({ ok: true, version });
});

// ================================================================
// CATEGORY 6: ANALYTICS & PERFORMANCE (30 endpoints)
// ================================================================

// 6.1 Campaign Analytics

router.get('/analytics/campaigns/:id', (req, res) => {
  const analytics = {
    campaignId: parseInt(req.params.id),
    sent: 10000,
    delivered: 9800,
    deliveryRate: 98.0,
    opens: 2450,
    uniqueOpens: 2100,
    openRate: 21.4,
    clicks: 735,
    uniqueClicks: 650,
    clickRate: 6.6,
    clickToOpenRate: 31.0,
    bounces: 200,
    bounceRate: 2.0,
    unsubscribes: 15,
    unsubscribeRate: 0.15,
    spam: 5,
    spamRate: 0.05
  };
  
  res.json({ ok: true, analytics });
});

router.get('/analytics/campaigns/:id/engagement-timeline', (req, res) => {
  const timeline = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    opens: Math.floor(Math.random() * 200) + 50,
    clicks: Math.floor(Math.random() * 50) + 10
  }));
  
  res.json({ ok: true, timeline });
});

router.get('/analytics/campaigns/:id/top-links', (req, res) => {
  const links = [
    { url: 'https://example.com/product1', clicks: 245, uniqueClicks: 198 },
    { url: 'https://example.com/product2', clicks: 189, uniqueClicks: 156 },
    { url: 'https://example.com/sale', clicks: 156, uniqueClicks: 134 },
    { url: 'https://example.com/blog', clicks: 98, uniqueClicks: 87 }
  ];
  
  res.json({ ok: true, links });
});

router.get('/analytics/campaigns/:id/devices', (req, res) => {
  const devices = {
    desktop: { opens: 1200, clicks: 400, percentage: 48.0 },
    mobile: { opens: 1050, clicks: 280, percentage: 42.0 },
    tablet: { opens: 250, clicks: 55, percentage: 10.0 }
  };
  
  res.json({ ok: true, devices });
});

router.get('/analytics/campaigns/:id/locations', (req, res) => {
  const locations = [
    { country: 'United States', opens: 1200, clicks: 380 },
    { country: 'United Kingdom', opens: 350, clicks: 110 },
    { country: 'Canada', opens: 280, clicks: 85 },
    { country: 'Australia', opens: 180, clicks: 52 }
  ];
  
  res.json({ ok: true, locations });
});

router.get('/analytics/campaigns/:id/email-clients', (req, res) => {
  const clients = [
    { client: 'Gmail', opens: 980, percentage: 39.2 },
    { client: 'Apple Mail', opens: 750, percentage: 30.0 },
    { client: 'Outlook', opens: 520, percentage: 20.8 },
    { client: 'Yahoo Mail', opens: 250, percentage: 10.0 }
  ];
  
  res.json({ ok: true, clients });
});

// 6.2 Engagement Metrics

router.get('/analytics/engagement/overview', (req, res) => {
  const { period = '30d' } = req.query;
  
  const overview = {
    period,
    totalSent: 125000,
    avgOpenRate: 22.5,
    avgClickRate: 6.8,
    avgBounceRate: 1.8,
    avgUnsubscribeRate: 0.12,
    engagementScore: 78
  };
  
  res.json({ ok: true, overview });
});

router.get('/analytics/engagement/trends', (req, res) => {
  const { metric = 'openRate', period = '30d' } = req.query;
  
  const trends = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 18 + Math.random() * 10
  }));
  
  res.json({ ok: true, metric, trends });
});

router.get('/analytics/engagement/heatmap', (req, res) => {
  const heatmap = Array.from({ length: 7 }, (_, day) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
    hours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      opens: Math.floor(Math.random() * 100) + 10
    }))
  }));
  
  res.json({ ok: true, heatmap });
});

router.get('/analytics/engagement/top-segments', (req, res) => {
  const segments = [
    { name: 'VIP Customers', openRate: 34.5, clickRate: 12.3, size: 1247 },
    { name: 'Active Shoppers', openRate: 28.7, clickRate: 9.8, size: 3456 },
    { name: 'Newsletter Subscribers', openRate: 22.1, clickRate: 6.5, size: 8934 }
  ];
  
  res.json({ ok: true, segments });
});

// 6.3 Revenue Attribution

router.get('/analytics/revenue/campaigns/:id', (req, res) => {
  const revenue = {
    campaignId: parseInt(req.params.id),
    totalRevenue: 15678.50,
    orders: 347,
    avgOrderValue: 45.19,
    revenuePerRecipient: 1.57,
    roi: 4.5,
    attributionModel: 'last-click'
  };
  
  res.json({ ok: true, revenue });
});

router.get('/analytics/revenue/overview', (req, res) => {
  const { period = '30d' } = req.query;
  
  const overview = {
    period,
    totalRevenue: 234567.89,
    orders: 5234,
    avgOrderValue: 44.82,
    revenuePerEmail: 1.88,
    roi: 5.2,
    topCampaigns: [
      { id: 1, name: 'Summer Sale', revenue: 45678.90 },
      { id: 2, name: 'Product Launch', revenue: 34567.80 },
      { id: 3, name: 'Flash Sale', revenue: 28934.50 }
    ]
  };
  
  res.json({ ok: true, overview });
});

router.get('/analytics/revenue/attribution-models', (req, res) => {
  const models = [
    {
      model: 'last-click',
      name: 'Last Click',
      description: 'Full credit to last touchpoint',
      revenue: 234567.89
    },
    {
      model: 'first-click',
      name: 'First Click',
      description: 'Full credit to first touchpoint',
      revenue: 189234.56
    },
    {
      model: 'linear',
      name: 'Linear',
      description: 'Equal credit to all touchpoints',
      revenue: 207891.23
    },
    {
      model: 'time-decay',
      name: 'Time Decay',
      description: 'More credit to recent touchpoints',
      revenue: 221456.78
    }
  ];
  
  res.json({ ok: true, models });
});

router.post('/analytics/revenue/custom-attribution', (req, res) => {
  const { weights, period = '30d' } = req.body;
  
  if (!weights) {
    return res.status(400).json({ ok: false, error: 'weights required' });
  }
  
  const attribution = {
    model: 'custom',
    weights,
    period,
    totalRevenue: 215678.34,
    calculatedAt: new Date().toISOString()
  };
  
  res.json({ ok: true, attribution });
});

// 6.4 Predictive Analytics

router.get('/analytics/predictive/churn', (req, res) => {
  const predictions = {
    totalContacts: 25000,
    churnRisk: {
      high: 1250,
      medium: 3750,
      low: 20000
    },
    predictedChurnRate: 5.0,
    estimatedRevenueLoss: 45678.90,
    topChurnFactors: [
      { factor: 'Low engagement (< 2 opens in 30d)', impact: 0.35 },
      { factor: 'No purchases in 90d', impact: 0.28 },
      { factor: 'Multiple unsubscribe attempts', impact: 0.22 }
    ]
  };
  
  res.json({ ok: true, predictions });
});

router.get('/analytics/predictive/ltv', (req, res) => {
  const { segmentId } = req.query;
  
  const ltv = {
    segmentId: segmentId || 'all',
    avgPredictedLtv: 456.78,
    distribution: {
      low: { range: '0-100', count: 5000, avgLtv: 45.23 },
      medium: { range: '100-500', count: 15000, avgLtv: 287.45 },
      high: { range: '500+', count: 5000, avgLtv: 1234.56 }
    },
    factors: [
      { factor: 'Purchase frequency', weight: 0.35 },
      { factor: 'Avg order value', weight: 0.30 },
      { factor: 'Email engagement', weight: 0.20 },
      { factor: 'Customer tenure', weight: 0.15 }
    ]
  };
  
  res.json({ ok: true, ltv });
});

router.get('/analytics/predictive/next-purchase', (req, res) => {
  const { contactId } = req.query;
  
  const prediction = {
    contactId: contactId || 123,
    probability: 0.78,
    estimatedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.85,
    recommendedProducts: [
      { id: 'prod_1', name: 'Product A', probability: 0.65 },
      { id: 'prod_2', name: 'Product B', probability: 0.48 },
      { id: 'prod_3', name: 'Product C', probability: 0.32 }
    ]
  };
  
  res.json({ ok: true, prediction });
});

router.get('/analytics/predictive/best-channel', (req, res) => {
  const { contactId } = req.query;
  
  const recommendations = {
    contactId: contactId || 123,
    channels: [
      { channel: 'email', probability: 0.85, avgEngagement: 0.72 },
      { channel: 'sms', probability: 0.62, avgEngagement: 0.58 },
      { channel: 'push', probability: 0.45, avgEngagement: 0.38 }
    ],
    recommended: 'email',
    confidence: 0.89
  };
  
  res.json({ ok: true, recommendations });
});

router.get('/analytics/predictive/send-time', (req, res) => {
  const { contactId, segmentId } = req.query;
  
  const optimal = {
    contactId,
    segmentId,
    optimalDay: 'Tuesday',
    optimalHour: 10,
    predictedOpenRate: 28.5,
    confidence: 0.82,
    alternatives: [
      { day: 'Wednesday', hour: 14, predictedOpenRate: 26.7 },
      { day: 'Thursday', hour: 9, predictedOpenRate: 25.3 }
    ]
  };
  
  res.json({ ok: true, optimal });
});

// 6.5 Cohort Analysis

router.get('/analytics/cohorts', (req, res) => {
  const { metric = 'retention', period = '30d' } = req.query;
  
  const cohorts = Array.from({ length: 6 }, (_, i) => ({
    cohort: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].substring(0, 7),
    size: 1000 + Math.floor(Math.random() * 500),
    values: Array.from({ length: 6 }, (_, j) => ({
      period: j,
      value: 100 - (j * 15) + Math.random() * 10
    }))
  }));
  
  res.json({ ok: true, metric, cohorts });
});

router.get('/analytics/cohorts/:id', (req, res) => {
  const cohort = {
    id: req.params.id,
    name: '2024-01',
    size: 1250,
    retentionRate: 68.5,
    avgLtv: 345.67,
    metrics: {
      week1: 100,
      week2: 85.2,
      week3: 76.8,
      week4: 68.5
    }
  };
  
  res.json({ ok: true, cohort });
});

router.post('/analytics/cohorts/create', (req, res) => {
  const { name, criteria, metric } = req.body;
  
  if (!name || !criteria) {
    return res.status(400).json({ ok: false, error: 'name and criteria required' });
  }
  
  const cohort = {
    id: `cohort_${Date.now()}`,
    name,
    criteria,
    metric,
    size: Math.floor(Math.random() * 1000) + 500,
    createdAt: new Date().toISOString()
  };
  
  res.json({ ok: true, cohort });
});

// 6.6 Real-Time Analytics

router.get('/analytics/realtime/active-campaigns', (req, res) => {
  const campaigns = [
    {
      id: 1,
      name: 'Flash Sale',
      sent: 5234,
      opens: 1247,
      clicks: 389,
      openRate: 23.8,
      clickRate: 7.4
    },
    {
      id: 2,
      name: 'Newsletter',
      sent: 12456,
      opens: 2789,
      clicks: 678,
      openRate: 22.4,
      clickRate: 5.4
    }
  ];
  
  res.json({ ok: true, campaigns, timestamp: new Date().toISOString() });
});

router.get('/analytics/realtime/events', (req, res) => {
  const events = Array.from({ length: 20 }, (_, i) => ({
    id: `event_${Date.now()}_${i}`,
    type: ['open', 'click', 'bounce'][Math.floor(Math.random() * 3)],
    campaignId: Math.floor(Math.random() * 3) + 1,
    timestamp: new Date(Date.now() - i * 1000).toISOString()
  }));
  
  res.json({ ok: true, events });
});

router.get('/analytics/realtime/stats', (req, res) => {
  const stats = {
    last60Seconds: {
      opens: 47,
      clicks: 12,
      bounces: 2
    },
    last5Minutes: {
      opens: 234,
      clicks: 67,
      bounces: 8
    },
    timestamp: new Date().toISOString()
  };
  
  res.json({ ok: true, stats });
});

// 6.7 Benchmarks & Comparisons

router.get('/analytics/benchmarks', (req, res) => {
  const { industry = 'ecommerce' } = req.query;
  
  const benchmarks = {
    industry,
    openRate: { industry: 21.5, yourAverage: 23.2 },
    clickRate: { industry: 2.6, yourAverage: 3.1 },
    bounceRate: { industry: 1.8, yourAverage: 1.5 },
    unsubscribeRate: { industry: 0.25, yourAverage: 0.18 }
  };
  
  res.json({ ok: true, benchmarks });
});

router.get('/analytics/compare', (req, res) => {
  const { campaignIds } = req.query;
  
  if (!campaignIds) {
    return res.status(400).json({ ok: false, error: 'campaignIds required' });
  }
  
  const ids = campaignIds.split(',').map(id => parseInt(id));
  
  const comparison = ids.map(id => ({
    campaignId: id,
    openRate: 18 + Math.random() * 10,
    clickRate: 2 + Math.random() * 6,
    conversionRate: 1 + Math.random() * 4,
    revenue: Math.floor(Math.random() * 10000) + 5000
  }));
  
  res.json({ ok: true, comparison });
});

router.get('/analytics/reports/summary', (req, res) => {
  const { period = '30d' } = req.query;
  
  const summary = {
    period,
    campaignsSent: 47,
    totalEmails: 125000,
    avgOpenRate: 22.5,
    avgClickRate: 6.8,
    totalRevenue: 234567.89,
    roi: 5.2,
    topPerformingCampaign: { id: 1, name: 'Summer Sale', openRate: 34.2 },
    improvementAreas: [
      'Click rate is below benchmark',
      'Mobile open rate could be improved'
    ]
  };
  
  res.json({ ok: true, summary });
});

router.post('/analytics/reports/export', (req, res) => {
  const { reportType, format = 'pdf', period = '30d' } = req.body;
  
  if (!reportType) {
    return res.status(400).json({ ok: false, error: 'reportType required' });
  }
  
  const report = {
    reportId: `report_${Date.now()}`,
    type: reportType,
    format,
    period,
    status: 'generating',
    downloadUrl: null,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  res.json({ ok: true, report });
});

router.get('/analytics/reports/:reportId/status', (req, res) => {
  const status = {
    reportId: req.params.reportId,
    status: 'completed',
    downloadUrl: `/downloads/reports/${req.params.reportId}.pdf`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  res.json({ ok: true, status });
});

// ================================================================
// CATEGORY 7: TESTING & OPTIMIZATION (16 endpoints)
// ================================================================

// 7.1 A/B Testing

router.post('/ab-tests', (req, res) => {
  const { name, campaignId, variants, testType = 'subject', sampleSize = 20, duration = 86400 } = req.body;
  
  if (!name || !variants || variants.length < 2) {
    return res.status(400).json({ ok: false, error: 'name and at least 2 variants required' });
  }
  
  const test = {
    id: testIdCounter++,
    name,
    campaignId,
    testType,
    variants: variants.map((v, i) => ({
      id: `variant_${i}`,
      ...v,
      sent: 0,
      opens: 0,
      clicks: 0,
      conversions: 0
    })),
    sampleSize,
    duration,
    status: 'draft',
    createdAt: new Date().toISOString()
  };
  
  abTests.set(test.id, test);
  logAudit('ab_test_created', 'user', test.id, { name, testType });
  
  res.status(201).json({ ok: true, test });
});

router.get('/ab-tests', (req, res) => {
  const { status } = req.query;
  
  let filtered = Array.from(abTests.values());
  if (status) filtered = filtered.filter(t => t.status === status);
  
  res.json({ ok: true, tests: filtered });
});

router.get('/ab-tests/:id', (req, res) => {
  const test = abTests.get(parseInt(req.params.id));
  
  if (!test) {
    return res.status(404).json({ ok: false, error: 'Test not found' });
  }
  
  res.json({ ok: true, test });
});

router.post('/ab-tests/:id/start', (req, res) => {
  const test = abTests.get(parseInt(req.params.id));
  
  if (!test) {
    return res.status(404).json({ ok: false, error: 'Test not found' });
  }
  
  test.status = 'running';
  test.startedAt = new Date().toISOString();
  test.estimatedCompletion = new Date(Date.now() + test.duration * 1000).toISOString();
  
  logAudit('ab_test_started', 'user', test.id);
  
  res.json({ ok: true, test });
});

router.post('/ab-tests/:id/stop', (req, res) => {
  const test = abTests.get(parseInt(req.params.id));
  
  if (!test) {
    return res.status(404).json({ ok: false, error: 'Test not found' });
  }
  
  test.status = 'completed';
  test.completedAt = new Date().toISOString();
  
  // Determine winner (simplified)
  const winner = test.variants.reduce((prev, curr) => 
    (curr.clicks / curr.sent) > (prev.clicks / prev.sent) ? curr : prev
  );
  test.winner = winner.id;
  
  logAudit('ab_test_stopped', 'user', test.id, { winner: winner.id });
  
  res.json({ ok: true, test, winner });
});

router.get('/ab-tests/:id/results', (req, res) => {
  const test = abTests.get(parseInt(req.params.id));
  
  if (!test) {
    return res.status(404).json({ ok: false, error: 'Test not found' });
  }
  
  const results = {
    testId: test.id,
    testType: test.testType,
    status: test.status,
    variants: test.variants.map(v => ({
      ...v,
      openRate: v.sent > 0 ? ((v.opens / v.sent) * 100).toFixed(2) : 0,
      clickRate: v.sent > 0 ? ((v.clicks / v.sent) * 100).toFixed(2) : 0,
      conversionRate: v.sent > 0 ? ((v.conversions / v.sent) * 100).toFixed(2) : 0
    })),
    winner: test.winner,
    confidence: 95.5,
    uplift: 23.4
  };
  
  res.json({ ok: true, results });
});

router.post('/ab-tests/:id/apply-winner', (req, res) => {
  const test = abTests.get(parseInt(req.params.id));
  
  if (!test) {
    return res.status(404).json({ ok: false, error: 'Test not found' });
  }
  
  if (!test.winner) {
    return res.status(400).json({ ok: false, error: 'No winner determined yet' });
  }
  
  res.json({
    ok: true,
    message: 'Winner applied to campaign',
    winnerId: test.winner,
    appliedAt: new Date().toISOString()
  });
});

// 7.2 Multivariate Testing

router.post('/multivariate-tests', (req, res) => {
  const { name, elements } = req.body;
  
  if (!name || !elements) {
    return res.status(400).json({ ok: false, error: 'name and elements required' });
  }
  
  const test = {
    id: testIdCounter++,
    name,
    elements,
    status: 'draft',
    totalCombinations: elements.reduce((acc, el) => acc * el.variants.length, 1),
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({ ok: true, test });
});

router.get('/multivariate-tests/:id/results', (req, res) => {
  const results = {
    testId: parseInt(req.params.id),
    bestCombination: {
      subject: 'Variant A',
      cta: 'Variant B',
      image: 'Variant A',
      openRate: 28.5,
      clickRate: 8.2
    },
    allCombinations: [
      { combination: 'A-A-A', openRate: 24.5, clickRate: 6.8 },
      { combination: 'A-B-A', openRate: 28.5, clickRate: 8.2 },
      { combination: 'B-A-B', openRate: 22.1, clickRate: 5.9 }
    ]
  };
  
  res.json({ ok: true, results });
});

// 7.3 Send Time Optimization

router.post('/send-time-optimization/analyze', (req, res) => {
  const { segmentId, lookbackDays = 30 } = req.body;
  
  const analysis = {
    segmentId,
    optimalSendTimes: [
      { day: 'Tuesday', hour: 10, predictedOpenRate: 28.5, confidence: 0.89 },
      { day: 'Wednesday', hour: 14, predictedOpenRate: 26.7, confidence: 0.84 },
      { day: 'Thursday', hour: 9, predictedOpenRate: 25.3, confidence: 0.81 }
    ],
    worstSendTimes: [
      { day: 'Saturday', hour: 23, predictedOpenRate: 12.3 },
      { day: 'Sunday', hour: 3, predictedOpenRate: 10.8 }
    ],
    lookbackDays
  };
  
  res.json({ ok: true, analysis });
});

router.post('/send-time-optimization/schedule', (req, res) => {
  const { campaignId, useOptimal = true } = req.body;
  
  if (!campaignId) {
    return res.status(400).json({ ok: false, error: 'campaignId required' });
  }
  
  const schedule = {
    campaignId,
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    reason: useOptimal ? 'Optimal send time based on historical data' : 'Manual selection',
    predictedOpenRate: 28.5
  };
  
  res.json({ ok: true, schedule });
});

// 7.4 Frequency Capping

router.post('/frequency-caps', (req, res) => {
  const { name, maxEmails, period, segments = [] } = req.body;
  
  if (!name || !maxEmails || !period) {
    return res.status(400).json({ ok: false, error: 'name, maxEmails, and period required' });
  }
  
  const cap = {
    id: `cap_${Date.now()}`,
    name,
    maxEmails,
    period,
    segments,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  res.json({ ok: true, cap });
});

router.get('/frequency-caps', (req, res) => {
  const caps = [
    {
      id: 'cap_1',
      name: 'Global Cap',
      maxEmails: 7,
      period: 'week',
      status: 'active'
    },
    {
      id: 'cap_2',
      name: 'VIP Cap',
      maxEmails: 14,
      period: 'week',
      status: 'active'
    }
  ];
  
  res.json({ ok: true, caps });
});

router.get('/frequency-caps/check/:contactId', (req, res) => {
  const check = {
    contactId: parseInt(req.params.contactId),
    currentCount: 3,
    limit: 7,
    period: 'week',
    canSend: true,
    nextResetAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  res.json({ ok: true, check });
});

router.get('/frequency-caps/violations', (req, res) => {
  const violations = [
    {
      contactId: 123,
      count: 8,
      limit: 7,
      period: 'week',
      lastViolation: new Date().toISOString()
    },
    {
      contactId: 456,
      count: 9,
      limit: 7,
      period: 'week',
      lastViolation: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json({ ok: true, violations });
});

// ================================================================
// CATEGORY 8: SETTINGS & ADMINISTRATION (16 endpoints)
// ================================================================

// 8.1 Sender Profiles

router.get('/sender-profiles', (req, res) => {
  const profiles = Array.from(senderProfiles.values());
  res.json({ ok: true, profiles });
});

router.post('/sender-profiles', (req, res) => {
  const { name, fromName, fromEmail, replyTo, description } = req.body;
  
  if (!name || !fromName || !fromEmail) {
    return res.status(400).json({ ok: false, error: 'name, fromName, and fromEmail required' });
  }
  
  const profile = {
    id: `profile_${Date.now()}`,
    name,
    fromName,
    fromEmail,
    replyTo: replyTo || fromEmail,
    description,
    verified: false,
    createdAt: new Date().toISOString()
  };
  
  senderProfiles.set(profile.id, profile);
  logAudit('sender_profile_created', 'user', profile.id, { name, fromEmail });
  
  res.status(201).json({ ok: true, profile });
});

router.get('/sender-profiles/:id', (req, res) => {
  const profile = senderProfiles.get(req.params.id);
  
  if (!profile) {
    return res.status(404).json({ ok: false, error: 'Sender profile not found' });
  }
  
  res.json({ ok: true, profile });
});

router.put('/sender-profiles/:id', (req, res) => {
  const profile = senderProfiles.get(req.params.id);
  
  if (!profile) {
    return res.status(404).json({ ok: false, error: 'Sender profile not found' });
  }
  
  Object.assign(profile, req.body, {
    updatedAt: new Date().toISOString()
  });
  
  res.json({ ok: true, profile });
});

router.delete('/sender-profiles/:id', (req, res) => {
  senderProfiles.delete(req.params.id);
  res.json({ ok: true, message: 'Sender profile deleted' });
});

// 8.2 Domain Authentication

router.get('/domains', (req, res) => {
  const domainList = Array.from(domains.values());
  res.json({ ok: true, domains: domainList });
});

router.post('/domains', (req, res) => {
  const { domain } = req.body;
  
  if (!domain) {
    return res.status(400).json({ ok: false, error: 'domain required' });
  }
  
  const domainRecord = {
    id: `domain_${Date.now()}`,
    domain,
    spfVerified: false,
    dkimVerified: false,
    dmarcVerified: false,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  domains.set(domainRecord.id, domainRecord);
  
  res.status(201).json({ ok: true, domain: domainRecord });
});

router.get('/domains/:id', (req, res) => {
  const domain = domains.get(req.params.id);
  
  if (!domain) {
    return res.status(404).json({ ok: false, error: 'Domain not found' });
  }
  
  res.json({ ok: true, domain });
});

router.post('/domains/:id/verify', (req, res) => {
  const domain = domains.get(req.params.id);
  
  if (!domain) {
    return res.status(404).json({ ok: false, error: 'Domain not found' });
  }
  
  // Mock verification
  domain.spfVerified = true;
  domain.dkimVerified = true;
  domain.dmarcVerified = false;
  domain.status = 'partial';
  domain.verifiedAt = new Date().toISOString();
  
  res.json({ ok: true, domain, message: 'SPF and DKIM verified, DMARC pending' });
});

router.get('/domains/:id/dns-records', (req, res) => {
  const records = {
    spf: {
      type: 'TXT',
      host: '@',
      value: 'v=spf1 include:_spf.example.com ~all',
      verified: true
    },
    dkim: {
      type: 'TXT',
      host: 'default._domainkey',
      value: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...',
      verified: true
    },
    dmarc: {
      type: 'TXT',
      host: '_dmarc',
      value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com',
      verified: false
    }
  };
  
  res.json({ ok: true, records });
});

router.delete('/domains/:id', (req, res) => {
  domains.delete(req.params.id);
  res.json({ ok: true, message: 'Domain deleted' });
});

// 8.3 API Keys

router.get('/api-keys', (req, res) => {
  const keys = Array.from(apiKeys.values()).map(key => ({
    ...key,
    key: `${key.key.substring(0, 8)}...` // Mask key
  }));
  
  res.json({ ok: true, keys });
});

router.post('/api-keys', (req, res) => {
  const { name, permissions = ['read'] } = req.body;
  
  if (!name) {
    return res.status(400).json({ ok: false, error: 'name required' });
  }
  
  const key = {
    id: `key_${Date.now()}`,
    name,
    key: `ea_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    permissions,
    createdAt: new Date().toISOString(),
    lastUsed: null
  };
  
  apiKeys.set(key.id, key);
  logAudit('api_key_created', 'user', key.id, { name });
  
  res.status(201).json({ ok: true, key });
});

router.delete('/api-keys/:id', (req, res) => {
  apiKeys.delete(req.params.id);
  logAudit('api_key_deleted', 'user', req.params.id);
  
  res.json({ ok: true, message: 'API key deleted' });
});

router.post('/api-keys/:id/rotate', (req, res) => {
  const key = apiKeys.get(req.params.id);
  
  if (!key) {
    return res.status(404).json({ ok: false, error: 'API key not found' });
  }
  
  key.key = `ea_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  key.rotatedAt = new Date().toISOString();
  
  res.json({ ok: true, key });
});

// 8.4 Webhooks

router.get('/webhooks', (req, res) => {
  const webhookList = Array.from(webhooks.values());
  res.json({ ok: true, webhooks: webhookList });
});

router.post('/webhooks', (req, res) => {
  const { url, events, secret } = req.body;
  
  if (!url || !events) {
    return res.status(400).json({ ok: false, error: 'url and events required' });
  }
  
  const webhook = {
    id: `webhook_${Date.now()}`,
    url,
    events,
    secret: secret || Math.random().toString(36).substring(2, 15),
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  webhooks.set(webhook.id, webhook);
  logAudit('webhook_created', 'user', webhook.id, { url, events });
  
  res.status(201).json({ ok: true, webhook });
});

router.post('/webhooks/test', async (req, res) => {
  const { url, event = 'email.opened' } = req.body;
  
  if (!url) {
    return res.status(400).json({ ok: false, error: 'url required' });
  }
  
  // Mock webhook test
  const test = {
    url,
    event,
    status: 'success',
    responseCode: 200,
    responseTime: 145,
    testedAt: new Date().toISOString()
  };
  
  res.json({ ok: true, test });
});

router.delete('/webhooks/:id', (req, res) => {
  webhooks.delete(req.params.id);
  res.json({ ok: true, message: 'Webhook deleted' });
});

router.get('/webhooks/events', (req, res) => {
  const events = [
    { name: 'email.sent', description: 'Email was sent' },
    { name: 'email.delivered', description: 'Email was delivered' },
    { name: 'email.opened', description: 'Email was opened' },
    { name: 'email.clicked', description: 'Link was clicked' },
    { name: 'email.bounced', description: 'Email bounced' },
    { name: 'email.unsubscribed', description: 'Contact unsubscribed' },
    { name: 'contact.created', description: 'New contact created' },
    { name: 'contact.updated', description: 'Contact updated' },
    { name: 'segment.joined', description: 'Contact joined segment' },
    { name: 'workflow.started', description: 'Workflow execution started' },
    { name: 'workflow.completed', description: 'Workflow execution completed' }
  ];
  
  res.json({ ok: true, events });
});

// 8.5 Compliance

router.get('/compliance/gdpr/export/:contactId', (req, res) => {
  const data = {
    contactId: parseInt(req.params.contactId),
    personalData: {
      email: 'contact@example.com',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    activity: {
      emailsSent: 47,
      emailsOpened: 23,
      linksClicked: 12
    },
    exportedAt: new Date().toISOString()
  };
  
  res.json({ ok: true, data });
});

router.post('/compliance/gdpr/delete/:contactId', (req, res) => {
  const contactId = parseInt(req.params.contactId);
  
  contacts.delete(contactId);
  
  logAudit('gdpr_deletion', 'user', contactId);
  
  res.json({
    ok: true,
    contactId,
    message: 'Contact data deleted per GDPR request',
    deletedAt: new Date().toISOString()
  });
});

router.get('/compliance/can-spam/unsubscribe/:contactId', (req, res) => {
  const contact = contacts.get(parseInt(req.params.contactId));
  
  if (contact) {
    contact.status = 'unsubscribed';
    contact.unsubscribedAt = new Date().toISOString();
  }
  
  res.json({
    ok: true,
    contactId: parseInt(req.params.contactId),
    status: 'unsubscribed',
    message: 'Successfully unsubscribed'
  });
});

// ================================================================
// Export router
// ================================================================

module.exports = router;
