// ================================================================
// KLAVIYO FLOW AUTOMATION - MESSAGING ENGINE  
// ================================================================
// Handles multi-channel messaging: email, SMS, push, webhooks
// ================================================================

const crypto = require('crypto');

// In-memory stores
const messages = new Map();
const emailTemplates = new Map();
const smsTemplates = new Map();
const pushTemplates = new Map();
const sendHistory = new Map();
const deliveryStatus = new Map();

// ================================================================
// EMAIL MESSAGING
// ================================================================

function listEmailTemplates(filter = {}) {
  let results = Array.from(emailTemplates.values());
  
  if (filter.category) {
    results = results.filter(t => t.category === filter.category);
  }
  if (filter.tags) {
    results = results.filter(t => t.tags && t.tags.some(tag => filter.tags.includes(tag)));
  }
  
  return results;
}

function createEmailTemplate(data) {
  const template = {
    id: `EMAIL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Email',
    subject: data.subject || '',
    preheader: data.preheader || '',
    fromName: data.fromName || 'Your Brand',
    fromEmail: data.fromEmail || 'noreply@example.com',
    replyTo: data.replyTo || null,
    htmlContent: data.htmlContent || '',
    textContent: data.textContent || '',
    category: data.category || 'general',
    tags: data.tags || [],
    variables: data.variables || [],
    design: data.design || null,
    stats: {
      sent: 0,
      opened: 0,
      clicked: 0,
      openRate: 0,
      clickRate: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  emailTemplates.set(template.id, template);
 return template;
}

function getEmailTemplate(id) {
  return emailTemplates.get(id);
}

function updateEmailTemplate(id, updates) {
  const template = emailTemplates.get(id);
  if (!template) return null;
  
  Object.assign(template, updates, { updatedAt: Date.now() });
  emailTemplates.set(id, template);
  return template;
}

function deleteEmailTemplate(id) {
  return emailTemplates.delete(id);
}

function cloneEmailTemplate(id, newName) {
  const template = emailTemplates.get(id);
  if (!template) return null;
  
  const cloned = {
    ...template,
    id: `EMAIL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: newName || `${template.name} (Copy)`,
    stats: { sent: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  emailTemplates.set(cloned.id, cloned);
  return cloned;
}

function sendEmail(data) {
  const message = {
    id: `MSG-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
    type: 'email',
    templateId: data.templateId || null,
    to: data.to || '',
    subject: data.subject || '',
    content: data.content || '',
    status: 'queued',
    sentAt: null,
    deliveredAt: null,
    openedAt: null,
    clickedAt: null,
    createdAt: Date.now()
  };
  
  messages.set(message.id, message);
  
  // Simulate async sending
  setTimeout(() => {
    message.status = 'sent';
    message.sentAt = Date.now();
    messages.set(message.id, message);
  }, 100);
  
  return message;
}

// ================================================================
// SMS MESSAGING
// ================================================================

function listSMSTemplates(filter = {}) {
  let results = Array.from(smsTemplates.values());
  
  if (filter.category) {
    results = results.filter(t => t.category === filter.category);
  }
  
  return results;
}

function createSMSTemplate(data) {
  const template = {
    id: `SMS-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled SMS',
    message: data.message || '',
    category: data.category || 'general',
    variables: data.variables || [],
    complianceCheck: data.complianceCheck !== false,
    optOutMessage: data.optOutMessage || 'Reply STOP to unsubscribe',
    stats: {
      sent: 0,
      delivered: 0,
      failed: 0,
      deliveryRate: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  smsTemplates.set(template.id, template);
  return template;
}

function getSMSTemplate(id) {
  return smsTemplates.get(id);
}

function updateSMSTemplate(id, updates) {
  const template = smsTemplates.get(id);
  if (!template) return null;
  
  Object.assign(template, updates, { updatedAt: Date.now() });
  smsTemplates.set(id, template);
  return template;
}

function deleteSMSTemplate(id) {
  return smsTemplates.delete(id);
}

function sendSMS(data) {
  const message = {
    id: `SMS-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
    type: 'sms',
    templateId: data.templateId || null,
    to: data.to || '',
    message: data.message || '',
    status: 'queued',
    sentAt: null,
    deliveredAt: null,
    segments: Math.ceil((data.message?.length || 0) / 160),
    createdAt: Date.now()
  };
  
  messages.set(message.id, message);
  
  // Simulate async sending
  setTimeout(() => {
    message.status = 'sent';
    message.sentAt = Date.now();
    messages.set(message.id, message);
  }, 100);
  
  return message;
}

// ================================================================
// PUSH NOTIFICATIONS
// ================================================================

function listPushTemplates(filter = {}) {
  let results = Array.from(pushTemplates.values());
  
  if (filter.platform) {
    results = results.filter(t => t.platform === filter.platform);
  }
  
  return results;
}

function createPushTemplate(data) {
  const template = {
    id: `PUSH-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Push',
    title: data.title || '',
    body: data.body || '',
    icon: data.icon || null,
    image: data.image || null,
    platform: data.platform || 'universal',
    action: data.action || null,
    deepLink: data.deepLink || null,
    category: data.category || 'general',
    stats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      openRate: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  pushTemplates.set(template.id, template);
  return template;
}

function getPushTemplate(id) {
  return pushTemplates.get(id);
}

function updatePushTemplate(id, updates) {
  const template = pushTemplates.get(id);
  if (!template) return null;
  
  Object.assign(template, updates, { updatedAt: Date.now() });
  pushTemplates.set(id, template);
  return template;
}

function deletePushTemplate(id) {
  return pushTemplates.delete(id);
}

function sendPushNotification(data) {
  const message = {
    id: `PUSH-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
    type: 'push',
    templateId: data.templateId || null,
    to: data.to || [],
    title: data.title || '',
    body: data.body || '',
    status: 'queued',
    sentAt: null,
    deliveredAt: null,
    createdAt: Date.now()
  };
  
  messages.set(message.id, message);
  
  // Simulate async sending
  setTimeout(() => {
    message.status = 'sent';
    message.sentAt = Date.now();
    messages.set(message.id, message);
  }, 100);
  
  return message;
}

// ================================================================
// WEBHOOK MESSAGING
// ================================================================

function sendWebhook(data) {
  const message = {
    id: `WH-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
    type: 'webhook',
    url: data.url || '',
    method: data.method || 'POST',
    headers: data.headers || {},
    payload: data.payload || {},
    status: 'queued',
    response: null,
    sentAt: null,
    createdAt: Date.now()
  };
  
  messages.set(message.id, message);
  
  // Simulate async webhook call
  setTimeout(() => {
    message.status = 'sent';
    message.sentAt = Date.now();
    message.response = { statusCode: 200, body: 'OK' };
    messages.set(message.id, message);
  }, 150);
  
  return message;
}

// ================================================================
// MESSAGE MANAGEMENT
// ================================================================

function listMessages(filter = {}) {
  let results = Array.from(messages.values());
  
  if (filter.type) {
    results = results.filter(m => m.type === filter.type);
  }
  if (filter.status) {
    results = results.filter(m => m.status === filter.status);
  }
  if (filter.limit) {
    results = results.slice(0, filter.limit);
  }
  
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

function getMessage(id) {
  return messages.get(id);
}

function getMessageStatus(id) {
  const message = messages.get(id);
  if (!message) return null;
  
  const status = {
    id: message.id,
    type: message.type,
    status: message.status,
    sent: message.sentAt ? true : false,
    delivered: message.deliveredAt ? true : false,
    opened: message.openedAt ? true : false,
    clicked: message.clickedAt ? true : false,
    timeline: []
  };
  
  if (message.createdAt) status.timeline.push({ event: 'queued', timestamp: message.createdAt });
  if (message.sentAt) status.timeline.push({ event: 'sent', timestamp: message.sentAt });
  if (message.deliveredAt) status.timeline.push({ event: 'delivered', timestamp: message.deliveredAt });
  if (message.openedAt) status.timeline.push({ event: 'opened', timestamp: message.openedAt });
  if (message.clickedAt) status.timeline.push({ event: 'clicked', timestamp: message.clickedAt });
  
  return status;
}

function cancelMessage(id) {
  const message = messages.get(id);
  if (!message || message.status !== 'queued') return null;
  
  message.status = 'cancelled';
  message.cancelledAt = Date.now();
  messages.set(id, message);
  return message;
}

function retryMessage(id) {
  const message = messages.get(id);
  if (!message || message.status !== 'failed') return null;
  
  message.status = 'queued';
  message.retryCount = (message.retryCount || 0) + 1;
  message.retriedAt = Date.now();
  messages.set(id, message);
  return message;
}

// ================================================================
// SEND HISTORY & ANALYTICS
// ================================================================

function getSendHistory(filter = {}) {
  const history = Array.from(sendHistory.values());
  
  let results = history;
  if (filter.channel) {
    results = results.filter(h => h.channel === filter.channel);
  }
  if (filter.flowId) {
    results = results.filter(h => h.flowId === filter.flowId);
  }
  if (filter.startDate) {
    results = results.filter(h => h.timestamp >= filter.startDate);
  }
  if (filter.endDate) {
    results = results.filter(h => h.timestamp <= filter.endDate);
  }
  
  return results.sort((a, b) => b.timestamp - a.timestamp);
}

function recordSendEvent(data) {
  const event = {
    id: `HIST-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    messageId: data.messageId || null,
    flowId: data.flowId || null,
    channel: data.channel || 'email',
    event: data.event || 'sent',
    recipient: data.recipient || '',
    metadata: data.metadata || {},
    timestamp: Date.now()
  };
  
  sendHistory.set(event.id, event);
  return event;
}

function getChannelStats(channel, timeframe = '30d') {
  const cutoff = Date.now() - (parseInt(timeframe) * 24 * 60 * 60 * 1000);
  const events = Array.from(sendHistory.values())
    .filter(e => e.channel === channel && e.timestamp >= cutoff);
  
  const groupedByEvent = events.reduce((acc, e) => {
    acc[e.event] = (acc[e.event] || 0) + 1;
    return acc;
  }, {});
  
  return {
    channel,
    timeframe,
    total: events.length,
    sent: groupedByEvent.sent || 0,
    delivered: groupedByEvent.delivered || 0,
    opened: groupedByEvent.opened || 0,
    clicked: groupedByEvent.clicked || 0,
    failed: groupedByEvent.failed || 0,
    deliveryRate: groupedByEvent.sent ? ((groupedByEvent.delivered || 0) / groupedByEvent.sent * 100).toFixed(2) : 0,
    openRate: groupedByEvent.delivered ? ((groupedByEvent.opened || 0) / groupedByEvent.delivered * 100).toFixed(2) : 0,
    clickRate: groupedByEvent.opened ? ((groupedByEvent.clicked || 0) / groupedByEvent.opened * 100).toFixed(2) : 0
  };
}

// ================================================================
// DELIVERY STATUS & TRACKING
// ================================================================

function trackDelivery(messageId, status, metadata = {}) {
  const tracking = {
    id: `TRACK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    messageId,
    status,
    metadata,
    timestamp: Date.now()
  };
  
  deliveryStatus.set(tracking.id, tracking);
  
  // Update message status
  const message = messages.get(messageId);
  if (message) {
    message.status = status;
    if (status === 'delivered') message.deliveredAt = Date.now();
    if (status === 'opened') message.openedAt = Date.now();
    if (status === 'clicked') message.clickedAt = Date.now();
    messages.set(messageId, message);
  }
  
  return tracking;
}

function getDeliveryStatus(messageId) {
  return Array.from(deliveryStatus.values())
    .filter(d => d.messageId === messageId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Email
  listEmailTemplates,
  createEmailTemplate,
  getEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  cloneEmailTemplate,
  sendEmail,
  
  // SMS
  listSMSTemplates,
  createSMSTemplate,
  getSMSTemplate,
  updateSMSTemplate,
  deleteSMSTemplate,
  sendSMS,
  
  // Push
  listPushTemplates,
  createPushTemplate,
  getPushTemplate,
  updatePushTemplate,
  deletePushTemplate,
  sendPushNotification,
  
  // Webhook
  sendWebhook,
  
  // Message Management
  listMessages,
  getMessage,
  getMessageStatus,
  cancelMessage,
  retryMessage,
  
  // History & Analytics
  getSendHistory,
  recordSendEvent,
  getChannelStats,
  
  // Delivery Tracking
  trackDelivery,
  getDeliveryStatus
};
