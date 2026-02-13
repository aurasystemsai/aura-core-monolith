/**
 * Omnichannel Engine
 * Handles email/chat/phone/social integration, unified inbox, channel analytics
 */

// In-memory storage (replace with database in production)
const channels = new Map();
const messages = new Map();
const conversations = new Map();
const channelConfigs = new Map();
const messageTemplates = new Map();

/**
 * Configure channel
 */
async function configureChannel(channelData) {
  const channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const channel = {
    id: channelId,
    type: channelData.type, // email, chat, phone, facebook, twitter, instagram, whatsapp
    name: channelData.name,
    enabled: channelData.enabled !== false,
    config: channelData.config || {},
    businessHours: channelData.businessHours || {
      enabled: false,
      timezone: 'UTC',
      hours: { monday: { start: '09:00', end: '17:00' } }
    },
    autoResponse: channelData.autoResponse || false,
    routingRules: channelData.routingRules || [],
    sla: channelData.sla || {},
    createdAt: new Date().toISOString()
  };
  
  channels.set(channelId, channel);
  return channel;
}

/**
 * Create conversation
 */
async function createConversation(conversationData) {
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const conversation = {
    id: conversationId,
    channelId: conversationData.channelId,
    customerId: conversationData.customerId,
    subject: conversationData.subject || '',
    status: 'open',
    assignedTo: conversationData.assignedTo || null,
    priority: conversationData.priority || 'normal',
    tags: conversationData.tags || [],
    messageCount: 0,
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    closedAt: null
  };
  
  conversations.set(conversationId, conversation);
  return conversation;
}

/**
 * Send message
 */
async function sendMessage(messageData) {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const message = {
    id: messageId,
    conversationId: messageData.conversationId,
    channelId: messageData.channelId,
    senderId: messageData.senderId,
    senderType: messageData.senderType, // agent, customer, system
    content: messageData.content,
    contentType: messageData.contentType || 'text', // text, html, markdown
    attachments: messageData.attachments || [],
    metadata: messageData.metadata || {},
    status: 'sent',
    sentAt: new Date().toISOString(),
    deliveredAt: null,
    readAt: null
  };
  
  messages.set(messageId, message);
  
  // Update conversation
  const conversation = conversations.get(messageData.conversationId);
  if (conversation) {
    conversation.messageCount++;
    conversation.lastMessageAt = message.sentAt;
    conversations.set(messageData.conversationId, conversation);
  }
  
  return message;
}

/**
 * Receive message
 */
async function receiveMessage(messageData) {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Find or create conversation
  let conversation = Array.from(conversations.values())
    .find(c => c.customerId === messageData.customerId && c.channelId === messageData.channelId && c.status === 'open');
  
  if (!conversation) {
    conversation = await createConversation({
      channelId: messageData.channelId,
      customerId: messageData.customerId,
      subject: messageData.subject || 'New conversation'
    });
  }
  
  const message = {
    id: messageId,
    conversationId: conversation.id,
    channelId: messageData.channelId,
    senderId: messageData.customerId,
    senderType: 'customer',
    content: messageData.content,
    contentType: messageData.contentType || 'text',
    attachments: messageData.attachments || [],
    metadata: messageData.metadata || {},
    status: 'received',
    sentAt: new Date().toISOString(),
    deliveredAt: new Date().toISOString(),
    readAt: null
  };
  
  messages.set(messageId, message);
  
  // Update conversation
  conversation.messageCount++;
  conversation.lastMessageAt = message.sentAt;
  conversations.set(conversation.id, conversation);
  
  return { message, conversation };
}

/**
 * Get unified inbox
 */
async function getUnifiedInbox(filters = {}) {
  let conversationList = Array.from(conversations.values());
  
  if (filters.status) {
    conversationList = conversationList.filter(c => c.status === filters.status);
  }
  if (filters.assignedTo) {
    conversationList = conversationList.filter(c => c.assignedTo === filters.assignedTo);
  }
  if (filters.channelId) {
    conversationList = conversationList.filter(c => c.channelId === filters.channelId);
  }
  if (filters.priority) {
    conversationList = conversationList.filter(c => c.priority === filters.priority);
  }
  if (filters.tags && filters.tags.length > 0) {
    conversationList = conversationList.filter(c => 
      filters.tags.some(tag => c.tags.includes(tag))
    );
  }
  
  // Enrich with channel info and latest message
  conversationList = conversationList.map(conv => {
    const channel = channels.get(conv.channelId);
    const latestMessage = Array.from(messages.values())
      .filter(m => m.conversationId === conv.id)
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];
    
    return {
      ...conv,
      channel: channel ? { id: channel.id, name: channel.name, type: channel.type } : null,
      latestMessage: latestMessage ? {
        id: latestMessage.id,
        content: latestMessage.content.substring(0, 100),
        senderType: latestMessage.senderType,
        sentAt: latestMessage.sentAt
      } : null
    };
  });
  
  // Sort by latest message
  conversationList.sort((a, b) => 
    new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );
  
  return conversationList;
}

/**
 * Get conversation messages
 */
async function getConversationMessages(conversationId) {
  const messageList = Array.from(messages.values())
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
  
  return messageList;
}

/**
 * Mark message as read
 */
async function markMessageAsRead(messageId) {
  const message = messages.get(messageId);
  if (!message) throw new Error('Message not found');
  
  message.readAt = new Date().toISOString();
  messages.set(messageId, message);
  
  return message;
}

/**
 * Close conversation
 */
async function closeConversation(conversationId) {
  const conversation = conversations.get(conversationId);
  if (!conversation) throw new Error('Conversation not found');
  
  conversation.status = 'closed';
  conversation.closedAt = new Date().toISOString();
  conversations.set(conversationId, conversation);
  
  return conversation;
}

/**
 * Create message template
 */
async function createMessageTemplate(templateData) {
  const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const template = {
    id: templateId,
    name: templateData.name,
    channelType: templateData.channelType,
    subject: templateData.subject || '',
    content: templateData.content,
    category: templateData.category || 'general',
    variables: templateData.variables || [],
    usageCount: 0,
    createdAt: new Date().toISOString()
  };
  
  messageTemplates.set(templateId, template);
  return template;
}

/**
 * Use message template
 */
async function useMessageTemplate(templateId, variables = {}) {
  const template = messageTemplates.get(templateId);
  if (!template) throw new Error('Template not found');
  
  let content = template.content;
  let subject = template.subject;
  
  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, value);
    subject = subject.replace(regex, value);
  });
  
  // Update usage count
  template.usageCount++;
  messageTemplates.set(templateId, template);
  
  return {
    subject,
    content,
    templateId
  };
}

/**
 * Get channel analytics
 */
async function getChannelAnalytics(channelId, period = 'month') {
  const channel = channels.get(channelId);
  if (!channel) throw new Error('Channel not found');
  
  const conversationList = Array.from(conversations.values())
    .filter(c => c.channelId === channelId);
  
  const messageList = Array.from(messages.values())
    .filter(m => m.channelId === channelId);
  
  // Calculate response time
  const agentMessages = messageList.filter(m => m.senderType === 'agent');
  const responseTimes = [];
  
  agentMessages.forEach(agentMsg => {
    const conv = conversations.get(agentMsg.conversationId);
    if (!conv) return;
    
    const prevCustomerMsg = Array.from(messages.values())
      .filter(m => m.conversationId === agentMsg.conversationId)
      .filter(m => m.senderType === 'customer')
      .filter(m => new Date(m.sentAt) < new Date(agentMsg.sentAt))
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];
    
    if (prevCustomerMsg) {
      const diff = new Date(agentMsg.sentAt) - new Date(prevCustomerMsg.sentAt);
      responseTimes.push(diff / (1000 * 60)); // minutes
    }
  });
  
  const avgResponseTime = responseTimes.length > 0 ?
    responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length : 0;
  
  return {
    channelId,
    channelName: channel.name,
    channelType: channel.type,
    period,
    totalConversations: conversationList.length,
    openConversations: conversationList.filter(c => c.status === 'open').length,
    closedConversations: conversationList.filter(c => c.status === 'closed').length,
    totalMessages: messageList.length,
    messagesFromCustomers: messageList.filter(m => m.senderType === 'customer').length,
    messagesFromAgents: messageList.filter(m => m.senderType === 'agent').length,
    averageResponseTime: Math.round(avgResponseTime),
    averageMessagesPerConversation: conversationList.length > 0 ?
      messageList.length / conversationList.length : 0
  };
}

/**
 * Get omnichannel statistics
 */
async function getOmnichannelStatistics() {
  const conversationList = Array.from(conversations.values());
  const messageList = Array.from(messages.values());
  
  // Channel distribution
  const channelDistribution = {};
  conversationList.forEach(c => {
    const channel = channels.get(c.channelId);
    if (channel) {
      channelDistribution[channel.type] = (channelDistribution[channel.type] || 0) + 1;
    }
  });
  
  return {
    totalChannels: channels.size,
    activeChannels: Array.from(channels.values()).filter(c => c.enabled).length,
    totalConversations: conversationList.length,
    openConversations: conversationList.filter(c => c.status === 'open').length,
    totalMessages: messageList.length,
    totalTemplates: messageTemplates.size,
    channelDistribution
  };
}

module.exports = {
  configureChannel,
  createConversation,
  sendMessage,
  receiveMessage,
  getUnifiedInbox,
  getConversationMessages,
  markMessageAsRead,
  closeConversation,
  createMessageTemplate,
  useMessageTemplate,
  getChannelAnalytics,
  getOmnichannelStatistics
};
