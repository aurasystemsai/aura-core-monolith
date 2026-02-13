/**
 * UGC Collection Engine
 * Handles user-generated content collection via email, SMS, widgets, and campaigns
 */

// In-memory storage
const campaigns = new Map();
const submissions = new Map();
const widgets = new Map();
const emailTemplates = new Map();

let campaignIdCounter = 1;
let submissionIdCounter = 1;
let widgetIdCounter = 1;

/**
 * Create review collection campaign
 */
function createCampaign(campaignData) {
  const campaign = {
    id: `campaign_${campaignIdCounter++}`,
    name: campaignData.name,
    type: campaignData.type || 'post_purchase', // post_purchase, ongoing, targeted
    channels: campaignData.channels || ['email'], // email, sms, widget, api
    status: campaignData.status || 'draft', // draft, active, paused, completed
    triggers: campaignData.triggers || {
      event: 'order_delivered',
      delay: 7, // days after trigger
    },
    incentives: campaignData.incentives || null, // discount, points, entry
    products: campaignData.products || [], // specific products or 'all'
    customers: campaignData.customers || 'all', // all, segment, specific
    emailTemplate: campaignData.emailTemplate || 'default',
    smsTemplate: campaignData.smsTemplate || null,
    requestTypes: campaignData.requestTypes || ['review', 'photo', 'video'],
    reminderSettings: campaignData.reminderSettings || {
      enabled: true,
      delayDays: 3,
      maxReminders: 2,
    },
    statistics: {
      sent: 0,
      opened: 0,
      clicked: 0,
      submitted: 0,
      conversionRate: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: campaignData.startDate || new Date().toISOString(),
    endDate: campaignData.endDate || null,
  };

  campaigns.set(campaign.id, campaign);
  return campaign;
}

/**
 * Update campaign
 */
function updateCampaign(campaignId, updates) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  Object.assign(campaign, updates, {
    updatedAt: new Date().toISOString(),
  });

  return campaign;
}

/**
 * Get campaign
 */
function getCampaign(campaignId) {
  return campaigns.get(campaignId);
}

/**
 * List campaigns
 */
function listCampaigns(options = {}) {
  const { status = null, type = null, limit = 20, offset = 0 } = options;

  let campaignList = Array.from(campaigns.values());

  if (status) {
    campaignList = campaignList.filter(c => c.status === status);
  }
  if (type) {
    campaignList = campaignList.filter(c => c.type === type);
  }

  campaignList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    campaigns: campaignList.slice(offset, offset + limit),
    total: campaignList.length,
  };
}

/**
 * Send review request
 */
function sendReviewRequest(requestData) {
  const {
    campaignId,
    customerId,
    customerEmail,
    customerPhone,
    productId,
    orderId,
    channel = 'email',
  } = requestData;

  const submission = {
    id: `submission_${submissionIdCounter++}`,
    campaignId,
    customerId,
    customerEmail,
    customerPhone,
    productId,
    orderId,
    channel,
    status: 'sent', // sent, opened, clicked, submitted, bounced
    token: generateReviewToken(),
    sentAt: new Date().toISOString(),
    openedAt: null,
    clickedAt: null,
    submittedAt: null,
    reminderCount: 0,
    lastReminderAt: null,
  };

  submissions.set(submission.id, submission);

  // Update campaign statistics
  if (campaignId) {
    const campaign = campaigns.get(campaignId);
    if (campaign) {
      campaign.statistics.sent += 1;
      campaign.updatedAt = new Date().toISOString();
    }
  }

  return submission;
}

/**
 * Track review request interaction
 */
function trackInteraction(submissionId, interactionType) {
  const submission = submissions.get(submissionId);
  if (!submission) {
    throw new Error('Submission not found');
  }

  const now = new Date().toISOString();

  if (interactionType === 'opened' && !submission.openedAt) {
    submission.openedAt = now;
    submission.status = 'opened';

    // Update campaign statistics
    if (submission.campaignId) {
      const campaign = campaigns.get(submission.campaignId);
      if (campaign) {
        campaign.statistics.opened += 1;
        campaign.updatedAt = now;
      }
    }
  } else if (interactionType === 'clicked' && !submission.clickedAt) {
    submission.clickedAt = now;
    submission.status = 'clicked';

    // Update campaign statistics
    if (submission.campaignId) {
      const campaign = campaigns.get(submission.campaignId);
      if (campaign) {
        campaign.statistics.clicked += 1;
        campaign.updatedAt = now;
      }
    }
  } else if (interactionType === 'submitted' && !submission.submittedAt) {
    submission.submittedAt = now;
    submission.status = 'submitted';

    // Update campaign statistics
    if (submission.campaignId) {
      const campaign = campaigns.get(submission.campaignId);
      if (campaign) {
        campaign.statistics.submitted += 1;
        campaign.statistics.conversionRate = 
          (campaign.statistics.submitted / campaign.statistics.sent) * 100;
        campaign.updatedAt = now;
      }
    }
  }

  return submission;
}

/**
 * Send reminder
 */
function sendReminder(submissionId) {
  const submission = submissions.get(submissionId);
  if (!submission) {
    throw new Error('Submission not found');
  }

  if (submission.status === 'submitted') {
    throw new Error('Review already submitted');
  }

  submission.reminderCount += 1;
  submission.lastReminderAt = new Date().toISOString();

  return {
    submissionId,
    reminderCount: submission.reminderCount,
    sentAt: submission.lastReminderAt,
  };
}

/**
 * Create review widget
 */
function createWidget(widgetData) {
  const widget = {
    id: `widget_${widgetIdCounter++}`,
    name: widgetData.name,
    type: widgetData.type || 'inline', // inline, popup, sidebar, badge
    placement: widgetData.placement || 'product_page', // product_page, home, cart, custom
    productId: widgetData.productId || null, // null for all products
    displaySettings: {
      showRatings: widgetData.displaySettings?.showRatings !== false,
      showPhotos: widgetData.displaySettings?.showPhotos !== false,
      showVerifiedBadge: widgetData.displaySettings?.showVerifiedBadge !== false,
      maxReviews: widgetData.displaySettings?.maxReviews || 10,
      sortBy: widgetData.displaySettings?.sortBy || 'recent',
      theme: widgetData.displaySettings?.theme || 'light',
      customCSS: widgetData.displaySettings?.customCSS || '',
    },
    collectSettings: {
      allowPhotos: widgetData.collectSettings?.allowPhotos !== false,
      allowVideos: widgetData.collectSettings?.allowVideos !== false,
      requirePurchase: widgetData.collectSettings?.requirePurchase || false,
      showIncentive: widgetData.collectSettings?.showIncentive || false,
      incentiveText: widgetData.collectSettings?.incentiveText || '',
    },
    status: widgetData.status || 'active', // active, inactive
    analytics: {
      views: 0,
      interactions: 0,
      submissions: 0,
      conversionRate: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  widgets.set(widget.id, widget);
  return widget;
}

/**
 * Update widget
 */
function updateWidget(widgetId, updates) {
  const widget = widgets.get(widgetId);
  if (!widget) {
    throw new Error('Widget not found');
  }

  Object.assign(widget, updates, {
    updatedAt: new Date().toISOString(),
  });

  return widget;
}

/**
 * Get widget
 */
function getWidget(widgetId) {
  return widgets.get(widgetId);
}

/**
 * List widgets
 */
function listWidgets(options = {}) {
  const { status = null, type = null } = options;

  let widgetList = Array.from(widgets.values());

  if (status) {
    widgetList = widgetList.filter(w => w.status === status);
  }
  if (type) {
    widgetList = widgetList.filter(w => w.type === type);
  }

  return widgetList;
}

/**
 * Track widget analytics
 */
function trackWidgetAnalytics(widgetId, eventType) {
  const widget = widgets.get(widgetId);
  if (!widget) {
    throw new Error('Widget not found');
  }

  if (eventType === 'view') {
    widget.analytics.views += 1;
  } else if (eventType === 'interaction') {
    widget.analytics.interactions += 1;
  } else if (eventType === 'submission') {
    widget.analytics.submissions += 1;
    widget.analytics.conversionRate = 
      (widget.analytics.submissions / widget.analytics.views) * 100;
  }

  widget.updatedAt = new Date().toISOString();

  return widget.analytics;
}

/**
 * Create email template
 */
function createEmailTemplate(templateData) {
  const template = {
    id: `template_${emailTemplates.size + 1}`,
    name: templateData.name,
    subject: templateData.subject,
    htmlBody: templateData.htmlBody,
    textBody: templateData.textBody,
    variables: templateData.variables || [], // customerId, productName, etc.
    previewText: templateData.previewText || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  emailTemplates.set(template.id, template);
  return template;
}

/**
 * Get email template
 */
function getEmailTemplate(templateId) {
  return emailTemplates.get(templateId);
}

/**
 * List email templates
 */
function listEmailTemplates() {
  return Array.from(emailTemplates.values());
}

/**
 * Get collection statistics
 */
function getCollectionStatistics() {
  const totalCampaigns = campaigns.size;
  const activeCampaigns = Array.from(campaigns.values()).filter(c => c.status === 'active').length;
  
  const allSubmissions = Array.from(submissions.values());
  const totalSent = allSubmissions.length;
  const totalOpened = allSubmissions.filter(s => s.openedAt).length;
  const totalClicked = allSubmissions.filter(s => s.clickedAt).length;
  const totalSubmitted = allSubmissions.filter(s => s.submittedAt).length;

  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
  const conversionRate = totalSent > 0 ? (totalSubmitted / totalSent) * 100 : 0;

  const totalWidgets = widgets.size;
  const activeWidgets = Array.from(widgets.values()).filter(w => w.status === 'active').length;

  return {
    campaigns: {
      total: totalCampaigns,
      active: activeCampaigns,
    },
    requests: {
      sent: totalSent,
      opened: totalOpened,
      clicked: totalClicked,
      submitted: totalSubmitted,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
    },
    widgets: {
      total: totalWidgets,
      active: activeWidgets,
    },
  };
}

/**
 * Generate unique review token
 */
function generateReviewToken() {
  return `token_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
}

module.exports = {
  createCampaign,
  updateCampaign,
  getCampaign,
  listCampaigns,
  sendReviewRequest,
  trackInteraction,
  sendReminder,
  createWidget,
  updateWidget,
  getWidget,
  listWidgets,
  trackWidgetAnalytics,
  createEmailTemplate,
  getEmailTemplate,
  listEmailTemplates,
  getCollectionStatistics,
};
