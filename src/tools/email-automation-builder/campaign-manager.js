/**
 * Campaign Manager - Email Campaign CRUD, Scheduling, Templates
 * Part of Email Automation Builder enterprise upgrade
 */

const { v4: uuidv4 } = require('uuid');

const campaigns = new Map();
const templates = new Map();
const campaignVersions = new Map();

// ============================================================================
// CAMPAIGN CRUD
// ============================================================================

function listCampaigns(query = {}) {
  const { status, type, limit = 100, offset = 0 } = query;
  let list = Array.from(campaigns.values());
  
  if (status) list = list.filter(c => c.status === status);
  if (type) list = list.filter(c => c.type === type);
  
  return {
    campaigns: list.slice(offset, offset + limit),
    total: list.length,
    offset,
    limit
  };
}

function getCampaign(id) {
  return campaigns.get(id) || null;
}

function createCampaign(data) {
  const campaign = {
    id: uuidv4(),
    name: data.name || 'Untitled Campaign',
    subject: data.subject || '',
    from: data.from || '',
    replyTo: data.replyTo || data.from || '',
    body: data.body || '',
    type: data.type || 'email', // email, sms, push, whatsapp
    status: 'draft', // draft, scheduled, sending, sent, paused, cancelled
    segment: data.segment || null,
    list: data.list || null,
    schedule: data.schedule || null,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    createdBy: data.createdBy || 'system',
    metadata: data.metadata || {},
    settings: {
      trackOpens: data.settings?.trackOpens !== false,
      trackClicks: data.settings?.trackClicks !== false,
      useABTest: data.settings?.useABTest || false,
      abVariants: data.settings?.abVariants || []
    },
    stats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      unsubscribed: 0,
      bounced: 0,
      revenue: 0
    }
  };
  
  campaigns.set(campaign.id, campaign);
  _createVersion(campaign.id, campaign, 'Initial version');
  
  return campaign;
}

function updateCampaign(id, updates) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  const updated = {
    ...campaign,
    ...updates,
    id: campaign.id,
    created: campaign.created,
    updated: new Date().toISOString(),
    stats: campaign.stats
  };
  
  campaigns.set(id, updated);
  _createVersion(id, updated, updates.versionNote || 'Update');
  
  return updated;
}

function deleteCampaign(id) {
  const deleted = campaigns.delete(id);
  campaignVersions.delete(id);
  return deleted;
}

function cloneCampaign(id, newName) {
  const original = campaigns.get(id);
  if (!original) return null;
  
  return createCampaign({
    ...original,
    name: newName || `${original.name} (Copy)`,
    status: 'draft',
    stats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      unsubscribed: 0,
      bounced: 0,
      revenue: 0
    }
  });
}

// ============================================================================
// CAMPAIGN SCHEDULING & SENDING
// ============================================================================

function scheduleCampaign(id, schedule) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  return updateCampaign(id, {
    schedule,
    status: 'scheduled'
  });
}

function sendCampaign(id, immediate = true) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  // Simulate sending logic
  const updated = {
    ...campaign,
    status: immediate ? 'sending' : 'scheduled',
    updated: new Date().toISOString()
  };
  
  campaigns.set(id, updated);
  
  // Simulate async send completion
  if (immediate) {
    setTimeout(() => {
      const c = campaigns.get(id);
      if (c && c.status === 'sending') {
        campaigns.set(id, {
          ...c,
          status: 'sent',
          sentAt: new Date().toISOString()
        });
      }
    }, 2000);
  }
  
  return updated;
}

function pauseCampaign(id) {
  return updateCampaign(id, { status: 'paused' });
}

function resumeCampaign(id) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  return updateCampaign(id, {
    status: campaign.schedule ? 'scheduled' : 'draft'
  });
}

function cancelCampaign(id) {
  return updateCampaign(id, { status: 'cancelled' });
}

// ============================================================================
// CAMPAIGN PREVIEW & TEST
// ============================================================================

function previewCampaign(id, contactData = {}) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  // Replace personalization tokens
  const subject = _replaceTokens(campaign.subject, contactData);
  const body = _replaceTokens(campaign.body, contactData);
  
  return {
    id: campaign.id,
    name: campaign.name,
    from: campaign.from,
    replyTo: campaign.replyTo,
    subject,
    body,
    type: campaign.type
  };
}

function sendTestCampaign(id, testEmails = []) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  // Simulate test send
  return {
    success: true,
    sent: testEmails.length,
    recipients: testEmails,
    timestamp: new Date().toISOString()
  };
}

function _replaceTokens(text, data) {
  if (!text) return '';
  
  let result = text;
  const tokens = {
    firstName: data.firstName || 'Customer',
    lastName: data.lastName || '',
    email: data.email || 'customer@example.com',
    companyName: data.companyName || 'Your Company',
    ...data
  };
  
  Object.keys(tokens).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, tokens[key]);
  });
  
  return result;
}

// ============================================================================
// TEMPLATES
// ============================================================================

function listTemplates(query = {}) {
  const { category, limit = 100, offset = 0 } = query;
  let list = Array.from(templates.values());
  
  if (category) list = list.filter(t => t.category === category);
  
  return {
    templates: list.slice(offset, offset + limit),
    total: list.length
  };
}

function getTemplate(id) {
  return templates.get(id) || null;
}

function createTemplate(data) {
  const template = {
    id: uuidv4(),
    name: data.name || 'Untitled Template',
    subject: data.subject || '',
    body: data.body || '',
    category: data.category || 'general',
    type: data.type || 'email',
    thumbnail: data.thumbnail || null,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    createdBy: data.createdBy || 'system',
    metadata: data.metadata || {}
  };
  
  templates.set(template.id, template);
  return template;
}

function updateTemplate(id, updates) {
  const template = templates.get(id);
  if (!template) return null;
  
  const updated = {
    ...template,
    ...updates,
    id: template.id,
    created: template.created,
    updated: new Date().toISOString()
  };
  
  templates.set(id, updated);
  return updated;
}

function deleteTemplate(id) {
  return templates.delete(id);
}

function duplicateTemplate(id, newName) {
  const original = templates.get(id);
  if (!original) return null;
  
  return createTemplate({
    ...original,
    name: newName || `${original.name} (Copy)`
  });
}

function getTemplateCategories() {
  const categories = new Set();
  templates.forEach(t => categories.add(t.category));
  
  return Array.from(categories).map(cat => ({
    id: cat,
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: Array.from(templates.values()).filter(t => t.category === cat).length
  }));
}

function importTemplate(html) {
  // Parse HTML and create template
  const template = createTemplate({
    name: 'Imported Template',
    body: html,
    category: 'imported',
    type: 'email'
  });
  
  return template;
}

function renderTemplate(id, data) {
  const template = templates.get(id);
  if (!template) return null;
  
  return {
    subject: _replaceTokens(template.subject, data),
    body: _replaceTokens(template.body, data)
  };
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

function bulkCreateCampaigns(campaignsData = []) {
  return campaignsData.map(data => createCampaign(data));
}

function bulkScheduleCampaigns(ids = [], schedule) {
  return ids.map(id => scheduleCampaign(id, schedule)).filter(Boolean);
}

function bulkCancelCampaigns(ids = []) {
  return ids.map(id => cancelCampaign(id)).filter(Boolean);
}

function bulkDeleteCampaigns(ids = []) {
  const results = ids.map(id => ({
    id,
    success: deleteCampaign(id)
  }));
  
  return {
    deleted: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

function exportCampaigns(query = {}) {
  const { campaigns: campList } = listCampaigns(query);
  
  return campList.map(c => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    status: c.status,
    type: c.type,
    created: c.created,
    stats: c.stats
  }));
}

function importCampaigns(data = []) {
  const imported = data.map(item => createCampaign(item));
  return {
    imported: imported.length,
    campaigns: imported
  };
}

// ============================================================================
// VERSION CONTROL
// ============================================================================

function _createVersion(campaignId, campaign, note) {
  if (!campaignVersions.has(campaignId)) {
    campaignVersions.set(campaignId, []);
  }
  
  const versions = campaignVersions.get(campaignId);
  const version = {
    versionId: uuidv4(),
    versionNumber: versions.length + 1,
    campaign: JSON.parse(JSON.stringify(campaign)),
    note,
    created: new Date().toISOString(),
    createdBy: campaign.createdBy || 'system'
  };
  
  versions.push(version);
  
  // Keep only last 50 versions
  if (versions.length > 50) {
    versions.shift();
  }
}

function listVersions(campaignId) {
  return campaignVersions.get(campaignId) || [];
}

function getVersion(campaignId, versionId) {
  const versions = campaignVersions.get(campaignId) || [];
  return versions.find(v => v.versionId === versionId) || null;
}

function restoreVersion(campaignId, versionId) {
  const version = getVersion(campaignId, versionId);
  if (!version) return null;
  
  const restoredCampaign = {
    ...version.campaign,
    updated: new Date().toISOString()
  };
  
  campaigns.set(campaignId, restoredCampaign);
  _createVersion(campaignId, restoredCampaign, `Restored from version ${version.versionNumber}`);
  
  return restoredCampaign;
}

// ============================================================================
// SEED DATA
// ============================================================================

function _seedDemoData() {
  // Create demo templates
  createTemplate({
    name: 'Welcome Email',
    subject: 'Welcome to {{companyName}}!',
    body: '<h1>Welcome {{firstName}}!</h1><p>Thanks for joining {{companyName}}.</p>',
    category: 'onboarding',
    type: 'email'
  });
  
  createTemplate({
    name: 'Abandoned Cart',
    subject: 'You left items in your cart',
    body: '<h1>Don\'t forget your items, {{firstName}}!</h1><p>Complete your purchase today.</p>',
    category: 'commerce',
    type: 'email'
  });
  
  createTemplate({
    name: 'Weekly Newsletter',
    subject: 'This week at {{companyName}}',
    body: '<h1>Hi {{firstName}},</h1><p>Here\'s what\'s new this week...</p>',
    category: 'newsletter',
    type: 'email'
  });
  
  // Create demo campaigns
  createCampaign({
    name: 'New Product Launch',
    subject: 'Introducing Our Latest Product',
    body: '<h1>You\'ll love this!</h1><p>Check out our new product...</p>',
    from: 'marketing@example.com',
    status: 'sent',
    type: 'email',
    createdBy: 'demo-user'
  });
  
  createCampaign({
    name: 'Summer Sale',
    subject: '50% Off Everything - Limited Time!',
    body: '<h1>Summer Sale</h1><p>Save 50% on all items this week!</p>',
    from: 'sales@example.com',
    status: 'scheduled',
    schedule: { sendAt: new Date(Date.now() + 86400000).toISOString() },
    type: 'email',
    createdBy: 'demo-user'
  });
}

// Seed on module load
_seedDemoData();

module.exports = {
  // Campaigns
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  cloneCampaign,
  
  // Scheduling & Sending
  scheduleCampaign,
  sendCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  
  // Preview & Test
  previewCampaign,
  sendTestCampaign,
  
  // Templates
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  getTemplateCategories,
  importTemplate,
  renderTemplate,
  
  // Bulk Operations
  bulkCreateCampaigns,
  bulkScheduleCampaigns,
  bulkCancelCampaigns,
  bulkDeleteCampaigns,
  exportCampaigns,
  importCampaigns,
  
  // Version Control
  listVersions,
  getVersion,
  restoreVersion
};
