/**
 * Brand Mention Tracker V2 - Alert Management Engine
 * Custom alert rules, multi-channel notifications, and quiet hours
 */

const alertRules = new Map();
const alertHistory = new Map();
const notificationChannels = new Map();
const templates = new Map();
const quietHours = new Map();

/**
 * Create alert rule
 */
async function createAlertRule(ruleData) {
  const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const rule = {
    id: ruleId,
    name: ruleData.name,
    description: ruleData.description || '',
    triggers: {
      keywords: ruleData.triggers?.keywords || [],
      sentimentThreshold: ruleData.triggers?.sentimentThreshold || null,
      volumeThreshold: ruleData.triggers?.volumeThreshold || null,
      sourceTypes: ruleData.triggers?.sourceTypes || [],
      credibilityThreshold: ruleData.triggers?.credibilityThreshold || null,
      competitorMention: ruleData.triggers?.competitorMention || false,
      influencerMention: ruleData.triggers?.influencerMention || false,
      crisisDetected: ruleData.triggers?.crisisDetected || false
    },
    conditions: ruleData.conditions || {
      operator: 'AND', // AND, OR
      filters: []
    },
    actions: {
      notify: ruleData.actions?.notify || true,
      channels: ruleData.actions?.channels || ['email'],
      recipients: ruleData.actions?.recipients || [],
      template: ruleData.actions?.template || 'default',
      priority: ruleData.actions?.priority || 'medium' // urgent, high, medium, low
    },
    frequency: {
      type: ruleData.frequency?.type || 'immediate', // immediate, hourly, daily, weekly
      maxPerDay: ruleData.frequency?.maxPerDay || null
    },
    isActive: ruleData.isActive !== false,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    triggeredCount: 0,
    lastTriggered: null
  };
  
  alertRules.set(ruleId, rule);
  
  return rule;
}

/**
 * Evaluate alert rules
 */
async function evaluateAlertRules(mention) {
  const triggeredRules = [];
  
  for (const [ruleId, rule] of alertRules.entries()) {
    if (!rule.isActive) continue;
    
    // Check if quiet hours are active
    if (await isQuietHours(rule.actions.recipients[0])) {
      if (rule.actions.priority !== 'urgent') {
        continue; // Skip non-urgent alerts during quiet hours
      }
    }
    
    // Check frequency limits
    if (rule.frequency.maxPerDay) {
      const todayCount = await getTriggersToday(ruleId);
      if (todayCount >= rule.frequency.maxPerDay) {
        continue;
      }
    }
    
    // Evaluate triggers
    let isTriggered = false;
    
    // Keyword triggers
    if (rule.triggers.keywords.length > 0) {
      const hasKeyword = rule.triggers.keywords.some(keyword =>
        mention.content?.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasKeyword) isTriggered = true;
    }
    
    // Sentiment threshold
    if (rule.triggers.sentimentThreshold !== null) {
      if (mention.sentiment && mention.sentiment <= rule.triggers.sentimentThreshold) {
        isTriggered = true;
      }
    }
    
    // Source type triggers
    if (rule.triggers.sourceTypes.length > 0) {
      if (rule.triggers.sourceTypes.includes(mention.sourceType)) {
        isTriggered = true;
      }
    }
    
    // Credibility threshold
    if (rule.triggers.credibilityThreshold !== null) {
      if (mention.credibilityScore && mention.credibilityScore >= rule.triggers.credibilityThreshold) {
        isTriggered = true;
      }
    }
    
    if (isTriggered) {
      triggeredRules.push(rule);
      await sendAlert(rule, mention);
      
      // Update rule stats
      rule.triggeredCount++;
      rule.lastTriggered = new Date().toISOString();
    }
  }
  
  return triggeredRules;
}

/**
 * Get triggers today
 */
async function getTriggersToday(ruleId) {
  const today = new Date().toISOString().split('T')[0];
  let count = 0;
  
  for (const [id, alert] of alertHistory.entries()) {
    if (alert.ruleId === ruleId && alert.triggeredAt.startsWith(today)) {
      count++;
    }
  }
  
  return count;
}

/**
 * Send alert
 */
async function sendAlert(rule, mention) {
  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const alert = {
    id: alertId,
    ruleId: rule.id,
    ruleName: rule.name,
    mentionId: mention.id,
    priority: rule.actions.priority,
    channels: rule.actions.channels,
    recipients: rule.actions.recipients,
    status: 'pending',
    deliveryResults: {},
    triggeredAt: new Date().toISOString(),
    deliveredAt: null
  };
  
  // Send through each channel
  for (const channel of rule.actions.channels) {
    try {
      await sendToChannel(channel, rule, mention, alert);
      alert.deliveryResults[channel] = 'sent';
    } catch (error) {
      alert.deliveryResults[channel] = `failed: ${error.message}`;
    }
  }
  
  alert.status = Object.values(alert.deliveryResults).some(r => r === 'sent') ? 'sent' : 'failed';
  alert.deliveredAt = new Date().toISOString();
  
  alertHistory.set(alertId, alert);
  
  return alert;
}

/**
 * Send to specific channel
 */
async function sendToChannel(channel, rule, mention, alert) {
  const template = templates.get(rule.actions.template) || getDefaultTemplate();
  const message = formatMessage(template, mention, rule);
  
  switch (channel) {
    case 'email':
      await sendEmail(rule.actions.recipients, message);
      break;
    case 'sms':
      await sendSMS(rule.actions.recipients, message);
      break;
    case 'slack':
      await sendSlack(message);
      break;
    case 'webhook':
      await sendWebhook(message, mention);
      break;
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
}

/**
 * Send email
 */
async function sendEmail(recipients, message) {
  // Integration with email service (e.g., SendGrid, AWS SES)
  console.log(`Email sent to ${recipients.join(', ')}: ${message.subject}`);
  return { success: true };
}

/**
 * Send SMS
 */
async function sendSMS(recipients, message) {
  // Integration with SMS service (e.g., Twilio)
  console.log(`SMS sent to ${recipients.join(', ')}: ${message.body.substring(0, 50)}...`);
  return { success: true };
}

/**
 * Send Slack notification
 */
async function sendSlack(message) {
  // Integration with Slack webhook
  console.log(`Slack notification sent: ${message.subject}`);
  return { success: true };
}

/**
 * Send webhook
 */
async function sendWebhook(message, mention) {
  // Send to configured webhook URL
  console.log(`Webhook sent with payload for mention ${mention.id}`);
  return { success: true };
}

/**
 * Format message from template
 */
function formatMessage(template, mention, rule) {
  const variables = {
    mentionContent: mention.content || '',
    mentionSource: mention.sourceType || '',
    mentionSentiment: mention.sentiment || 0,
    mentionAuthor: mention.author?.username || 'Unknown',
    mentionUrl: mention.url || '',
    ruleName: rule.name,
    triggeredAt: new Date().toLocaleString()
  };
  
  let subject = template.subject;
  let body = template.body;
  
  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });
  
  return { subject, body };
}

/**
 * Get default template
 */
function getDefaultTemplate() {
  return {
    subject: 'Brand Mention Alert: {{ruleName}}',
    body: `A new mention has triggered your alert rule "{{ruleName}}".

Mention: {{mentionContent}}
Source: {{mentionSource}}
Author: {{mentionAuthor}}
Sentiment: {{mentionSentiment}}
URL: {{mentionUrl}}

Triggered at: {{triggeredAt}}`
  };
}

/**
 * Create notification template
 */
async function createTemplate(templateData) {
  const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const template = {
    id: templateId,
    name: templateData.name,
    subject: templateData.subject,
    body: templateData.body,
    type: templateData.type || 'mention_alert', // mention_alert, crisis_alert, report
    variables: extractVariables(templateData.body),
    createdAt: new Date().toISOString(),
    usageCount: 0
  };
  
  templates.set(templateId, template);
  
  return template;
}

/**
 * Extract variables from template
 */
function extractVariables(text) {
  const regex = /{{(\w+)}}/g;
  const variables = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

/**
 * Configure notification channel
 */
async function configureChannel(channelData) {
  const channelId = `channel_${channelData.type}_${Date.now()}`;
  
  const channel = {
    id: channelId,
    type: channelData.type, // email, sms, slack, webhook
    config: {},
    isActive: channelData.isActive !== false,
    createdAt: new Date().toISOString()
  };
  
  switch (channelData.type) {
    case 'email':
      channel.config = {
        from: channelData.config.from,
        smtpHost: channelData.config.smtpHost,
        smtpPort: channelData.config.smtpPort
      };
      break;
    case 'sms':
      channel.config = {
        provider: channelData.config.provider, // twilio, aws
        apiKey: channelData.config.apiKey
      };
      break;
    case 'slack':
      channel.config = {
        webhookUrl: channelData.config.webhookUrl,
        channel: channelData.config.channel
      };
      break;
    case 'webhook':
      channel.config = {
        url: channelData.config.url,
        method: channelData.config.method || 'POST',
        headers: channelData.config.headers || {}
      };
      break;
  }
  
  notificationChannels.set(channelId, channel);
  
  return channel;
}

/**
 * Set quiet hours
 */
async function setQuietHours(userId, quietHoursData) {
  const quietHoursId = `quiethours_${userId}`;
  
  const config = {
    userId,
    enabled: quietHoursData.enabled !== false,
    timezone: quietHoursData.timezone || 'America/New_York',
    schedule: quietHoursData.schedule || {
      monday: { start: '22:00', end: '08:00' },
      tuesday: { start: '22:00', end: '08:00' },
      wednesday: { start: '22:00', end: '08:00' },
      thursday: { start: '22:00', end: '08:00' },
      friday: { start: '22:00', end: '08:00' },
      saturday: { start: '00:00', end: '10:00' },
      sunday: { start: '00:00', end: '10:00' }
    },
    allowUrgent: quietHoursData.allowUrgent !== false,
    updatedAt: new Date().toISOString()
  };
  
  quietHours.set(quietHoursId, config);
  
  return config;
}

/**
 * Check if currently in quiet hours
 */
async function isQuietHours(userId) {
  const quietHoursId = `quiethours_${userId}`;
  const config = quietHours.get(quietHoursId);
  
  if (!config || !config.enabled) return false;
  
  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const schedule = config.schedule[dayOfWeek];
  
  if (!schedule) return false;
  
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Simple time range check (doesn't handle timezone conversion)
  return currentTime >= schedule.start || currentTime <= schedule.end;
}

/**
 * Get alert history
 */
async function getAlertHistory(filters = {}) {
  let alerts = Array.from(alertHistory.values());
  
  // Filter by date range
  if (filters.startDate) {
    alerts = alerts.filter(a => a.triggeredAt >= filters.startDate);
  }
  if (filters.endDate) {
    alerts = alerts.filter(a => a.triggeredAt <= filters.endDate);
  }
  
  // Filter by status
  if (filters.status) {
    alerts = alerts.filter(a => a.status === filters.status);
  }
  
  // Filter by priority
  if (filters.priority) {
    alerts = alerts.filter(a => a.priority === filters.priority);
  }
  
  // Filter by rule
  if (filters.ruleId) {
    alerts = alerts.filter(a => a.ruleId === filters.ruleId);
  }
  
  // Sort by triggered date
  alerts.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  
  // Paginate
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  
  return alerts.slice(offset, offset + limit);
}

/**
 * Get alert statistics
 */
async function getAlertStatistics() {
  const alerts = Array.from(alertHistory.values());
  
  const stats = {
    totalRules: alertRules.size,
    activeRules: Array.from(alertRules.values()).filter(r => r.isActive).length,
    totalAlerts: alerts.length,
    alertsByStatus: {
      sent: alerts.filter(a => a.status === 'sent').length,
      failed: alerts.filter(a => a.status === 'failed').length,
      pending: alerts.filter(a => a.status === 'pending').length
    },
    alertsByPriority: {
      urgent: alerts.filter(a => a.priority === 'urgent').length,
      high: alerts.filter(a => a.priority === 'high').length,
      medium: alerts.filter(a => a.priority === 'medium').length,
      low: alerts.filter(a => a.priority === 'low').length
    },
    alertsByChannel: {},
    templates: templates.size,
    channels: notificationChannels.size
  };
  
  // Count by channel
  alerts.forEach(alert => {
    alert.channels.forEach(channel => {
      stats.alertsByChannel[channel] = (stats.alertsByChannel[channel] || 0) + 1;
    });
  });
  
  return stats;
}

module.exports = {
  createAlertRule,
  evaluateAlertRules,
  sendAlert,
  createTemplate,
  configureChannel,
  setQuietHours,
  isQuietHours,
  getAlertHistory,
  getAlertStatistics
};
