/**
 * Brand Mention Tracker V2 - Response Management Engine
 * Response templates, team collaboration, and performance tracking
 */

const responseTemplates = new Map();
const responses = new Map();
const responseQueue = new Map();
const collaborationNotes = new Map();
const performanceMetrics = new Map();

/**
 * Create response template
 */
async function createResponseTemplate(templateData) {
  const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const template = {
    id: templateId,
    name: templateData.name,
    category: templateData.category, // positive, negative, neutral, question, complaint
    content: templateData.content,
    variables: extractVariables(templateData.content),
    tone: templateData.tone || 'professional', // professional, friendly, apologetic, enthusiastic
    suggestedFor: {
      sentimentRange: templateData.suggestedFor?.sentimentRange || null, // e.g., [-1, -0.5]
      keywords: templateData.suggestedFor?.keywords || [],
      sourceTypes: templateData.suggestedFor?.sourceTypes || []
    },
    isActive: templateData.isActive !== false,
    createdAt: new Date().toISOString(),
    usageCount: 0,
    averageResponseTime: 0,
    satisfactionScore: 0
  };
  
  responseTemplates.set(templateId, template);
  
  return template;
}

/**
 * Extract variables from content
 */
function extractVariables(content) {
  const regex = /{{(\w+)}}/g;
  const variables = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

/**
 * Assign response to team member
 */
async function assignResponse(mentionId, assignmentData) {
  const queueId = `queue_${mentionId}`;
  
  const queueItem = {
    id: queueId,
    mentionId,
    status: 'assigned',
    assignedTo: {
      userId: assignmentData.userId,
      userName: assignmentData.userName,
      assignedAt: new Date().toISOString()
    },
    priority: assignmentData.priority || 'medium', // urgent, high, medium, low
    dueDate: assignmentData.dueDate || null,
    responseTemplate: assignmentData.templateId || null,
    createdAt: new Date().toISOString(),
    updatedAt: null
  };
  
  responseQueue.set(queueId, queueItem);
  
  return queueItem;
}

/**
 * Track response
 */
async function trackResponse(responseData) {
  const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const response = {
    id: responseId,
    mentionId: responseData.mentionId,
    content: responseData.content,
    templateId: responseData.templateId || null,
    respondedBy: {
      userId: responseData.userId,
      userName: responseData.userName
    },
    respondedAt: new Date().toISOString(),
    status: responseData.status || 'sent', // sent, delivered, read, replied
    channel: responseData.channel, // same_platform, email, dm
    responseTime: calculateResponseTime(responseData.mentionId),
    qualityScore: null, // set later
    escalated: responseData.escalated || false,
    escalationReason: responseData.escalationReason || null
  };
  
  responses.set(responseId, response);
  
  // Update queue item
  const queueId = `queue_${responseData.mentionId}`;
  const queueItem = responseQueue.get(queueId);
  if (queueItem) {
    queueItem.status = 'responded';
    queueItem.responseId = responseId;
    queueItem.updatedAt = new Date().toISOString();
  }
  
  // Update template usage
  if (responseData.templateId) {
    const template = responseTemplates.get(responseData.templateId);
    if (template) {
      template.usageCount++;
      
      // Update average response time
      const totalTime = template.averageResponseTime * (template.usageCount - 1) + response.responseTime;
      template.averageResponseTime = totalTime / template.usageCount;
    }
  }
  
  return response;
}

/**
 * Calculate response time
 */
function calculateResponseTime(mentionId) {
  // Would get actual mention timestamp
  // For now, return mock value
  return 1800000; // 30 minutes in milliseconds
}

/**
 * Add collaboration note
 */
async function addCollaborationNote(mentionId, noteData) {
  const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const note = {
    id: noteId,
    mentionId,
    content: noteData.content,
    author: {
      userId: noteData.userId,
      userName: noteData.userName
    },
    type: noteData.type || 'comment', // comment, status_update, escalation
    mentions: extractMentions(noteData.content), // @username
    createdAt: new Date().toISOString(),
    isInternal: noteData.isInternal !== false
  };
  
  if (!collaborationNotes.has(mentionId)) {
    collaborationNotes.set(mentionId, []);
  }
  
  collaborationNotes.get(mentionId).push(note);
  
  return note;
}

/**
 * Extract @mentions from text
 */
function extractMentions(text) {
  const regex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (!mentions.includes(match[1])) {
      mentions.push(match[1]);
    }
  }
  
  return mentions;
}

/**
 * Get automated response suggestions
 */
async function getResponseSuggestions(mention) {
  const suggestions = [];
  
  // Find matching templates
  for (const [templateId, template] of responseTemplates.entries()) {
    if (!template.isActive) continue;
    
    let score = 0;
    
    // Check sentiment range
    if (template.suggestedFor.sentimentRange && mention.sentiment) {
      const [min, max] = template.suggestedFor.sentimentRange;
      if (mention.sentiment >= min && mention.sentiment <= max) {
        score += 40;
      }
    }
    
    // Check keywords
    if (template.suggestedFor.keywords.length > 0 && mention.content) {
      const keywordMatches = template.suggestedFor.keywords.filter(keyword =>
        mention.content.toLowerCase().includes(keyword.toLowerCase())
      );
      score += (keywordMatches.length / template.suggestedFor.keywords.length) * 30;
    }
    
    // Check source type
    if (template.suggestedFor.sourceTypes.length > 0) {
      if (template.suggestedFor.sourceTypes.includes(mention.sourceType)) {
        score += 30;
      }
    }
    
    if (score > 30) {
      suggestions.push({
        templateId,
        templateName: template.name,
        category: template.category,
        preview: template.content.substring(0, 100) + '...',
        matchScore: score,
        usageCount: template.usageCount,
        averageResponseTime: template.averageResponseTime
      });
    }
  }
  
  // Sort by match score
  suggestions.sort((a, b) => b.matchScore - a.matchScore);
  
  // Add suggested action
  suggestions.forEach(s => {
    s.suggestedAction = getSuggestedAction(mention);
  });
  
  return suggestions.slice(0, 5); // Return top 5
}

/**
 * Get suggested action for mention
 */
function getSuggestedAction(mention) {
  if (mention.sentiment < -0.5) {
    return 'Respond quickly to address negative feedback';
  } else if (mention.sentiment > 0.5) {
    return 'Thank the user and engage positively';
  } else if (mention.content?.includes('?')) {
    return 'Answer the question promptly';
  } else {
    return 'Acknowledge and engage appropriately';
  }
}

/**
 * Update response status
 */
async function updateResponseStatus(responseId, status, statusData = {}) {
  const response = responses.get(responseId);
  if (!response) {
    throw new Error(`Response ${responseId} not found`);
  }
  
  response.status = status;
  
  // Handle escalation
  if (status === 'escalated') {
    response.escalated = true;
    response.escalationReason = statusData.reason || null;
    response.escalatedTo = {
      userId: statusData.userId,
      userName: statusData.userName,
      escalatedAt: new Date().toISOString()
    };
  }
  
  // Handle quality scoring
  if (statusData.qualityScore !== undefined) {
    response.qualityScore = statusData.qualityScore;
  }
  
  return response;
}

/**
 * Get response queue
 */
async function getResponseQueue(filters = {}) {
  let queue = Array.from(responseQueue.values());
  
  // Filter by status
  if (filters.status) {
    queue = queue.filter(q => q.status === filters.status);
  }
  
  // Filter by assigned user
  if (filters.userId) {
    queue = queue.filter(q => q.assignedTo?.userId === filters.userId);
  }
  
  // Filter by priority
  if (filters.priority) {
    queue = queue.filter(q => q.priority === filters.priority);
  }
  
  // Sort by priority then created date
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  queue.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  
  // Paginate
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  
  return queue.slice(offset, offset + limit);
}

/**
 * Calculate performance metrics
 */
async function calculatePerformanceMetrics(userId = null, period = 'week') {
  const periodStart = getPeriodStart(period);
  let relevantResponses = Array.from(responses.values())
    .filter(r => new Date(r.respondedAt) >= periodStart);
  
  if (userId) {
    relevantResponses = relevantResponses.filter(r => r.respondedBy.userId === userId);
  }
  
  const metrics = {
    period,
    periodStart: periodStart.toISOString(),
    userId,
    totalResponses: relevantResponses.length,
    averageResponseTime: 0,
    responseTimeBreakdown: {
      under15min: 0,
      under1hour: 0,
      under4hours: 0,
      over4hours: 0
    },
    statusBreakdown: {
      sent: 0,
      delivered: 0,
      read: 0,
      replied: 0,
      escalated: 0
    },
    averageQualityScore: 0,
    templatesUsed: {},
    calculatedAt: new Date().toISOString()
  };
  
  let totalResponseTime = 0;
  let qualityScoreCount = 0;
  let totalQualityScore = 0;
  
  relevantResponses.forEach(response => {
    // Response time
    totalResponseTime += response.responseTime;
    
    if (response.responseTime < 900000) { // 15 min
      metrics.responseTimeBreakdown.under15min++;
    } else if (response.responseTime < 3600000) { // 1 hour
      metrics.responseTimeBreakdown.under1hour++;
    } else if (response.responseTime < 14400000) { // 4 hours
      metrics.responseTimeBreakdown.under4hours++;
    } else {
      metrics.responseTimeBreakdown.over4hours++;
    }
    
    // Status
    metrics.statusBreakdown[response.status]++;
    if (response.escalated) {
      metrics.statusBreakdown.escalated++;
    }
    
    // Quality score
    if (response.qualityScore !== null) {
      totalQualityScore += response.qualityScore;
      qualityScoreCount++;
    }
    
    // Templates
    if (response.templateId) {
      metrics.templatesUsed[response.templateId] = (metrics.templatesUsed[response.templateId] || 0) + 1;
    }
  });
  
  metrics.averageResponseTime = relevantResponses.length > 0 ? totalResponseTime / relevantResponses.length : 0;
  metrics.averageQualityScore = qualityScoreCount > 0 ? totalQualityScore / qualityScoreCount : 0;
  
  return metrics;
}

/**
 * Get period start date
 */
function getPeriodStart(period) {
  const now = new Date();
  const periodDays = {
    day: 1,
    week: 7,
    month: 30,
    quarter: 90
  };
  
  const days = periodDays[period] || 7;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Get response statistics
 */
async function getResponseStatistics() {
  const allResponses = Array.from(responses.values());
  const allQueue = Array.from(responseQueue.values());
  
  return {
    totalTemplates: responseTemplates.size,
    activeTemplates: Array.from(responseTemplates.values()).filter(t => t.isActive).length,
    totalResponses: allResponses.length,
    queueSize: allQueue.filter(q => q.status === 'pending' || q.status === 'assigned').length,
    averageResponseTime: allResponses.reduce((sum, r) => sum + r.responseTime, 0) / allResponses.length || 0,
    statusBreakdown: {
      pending: allQueue.filter(q => q.status === 'pending').length,
      assigned: allQueue.filter(q => q.status === 'assigned').length,
      responded: allQueue.filter(q => q.status === 'responded').length,
      ignored: allQueue.filter(q => q.status === 'ignored').length,
      escalated: allResponses.filter(r => r.escalated).length
    },
    mostUsedTemplates: Array.from(responseTemplates.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(t => ({ id: t.id, name: t.name, usageCount: t.usageCount }))
  };
}

module.exports = {
  createResponseTemplate,
  assignResponse,
  trackResponse,
  addCollaborationNote,
  getResponseSuggestions,
  updateResponseStatus,
  getResponseQueue,
  calculatePerformanceMetrics,
  getResponseStatistics
};
