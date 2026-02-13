import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Tabs,
  DataTable,
  TextField,
  Select,
  Button,
  Badge,
  Banner,
  Spinner,
  TextStyle,
  Stack,
  ButtonGroup,
  Icon,
} from '@shopify/polaris';
import './AISupportAssistantV2.css';

function AISupportAssistantV2() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // State for conversations
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // State for AI models
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [modelMetrics, setModelMetrics] = useState({});
  
  // State for knowledge base
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for tickets
  const [tickets, setTickets] = useState([]);
  const [ticketStats, setTicketStats] = useState({});
  const [slaBreached, setSlaBreached] = useState([]);
  
  // State for automations
  const [automations, setAutomations] = useState([]);
  const [routingRules, setRoutingRules] = useState([]);
  const [automationRuns, setAutomationRuns] = useState([]);
  
  // State for analytics
  const [conversationAnalytics, setConversationAnalytics] = useState({});
  const [ticketAnalytics, setTicketAnalytics] = useState({});
  const [agentPerformance, setAgentPerformance] = useState([]);
  
  // State for agent assist
  const [snippets, setSnippets] = useState([]);
  const [macros, setMacros] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  // State for integrations
  const [integrations, setIntegrations] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  
  // State for dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalConversations: 0,
    activeTickets: 0,
    avgResponseTime: '0 min',
    knowledgeArticles: 0,
  });

  // Load dashboard data
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-support-assistant/stats');
      const data = await response.json();
      
      setDashboardStats({
        totalConversations: data.conversations?.totalConversations || 0,
        activeTickets: data.tickets?.openTickets || 0,
        avgResponseTime: '2.5 min',
        knowledgeArticles: data.knowledgeBase?.totalArticles || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Conversation functions
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-support-assistant/conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (formData) => {
    try {
      const response = await fetch('/api/ai-support-assistant/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const conversation = await response.json();
      setConversations([conversation, ...conversations]);
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // AI Model functions
  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-support-assistant/ai/models');
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = async (conversationId, messages) => {
    try {
      const response = await fetch('/api/ai-support-assistant/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, messages, modelId: selectedModel }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to generate response:', error);
    }
  };

  // Knowledge Base functions
  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-support-assistant/knowledge/articles');
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchArticles = async (query) => {
    try {
      const response = await fetch('/api/ai-support-assistant/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Failed to search articles:', error);
    }
  };

  // Ticket functions
  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-support-assistant/tickets');
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (formData) => {
    try {
      const response = await fetch('/api/ai-support-assistant/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const ticket = await response.json();
      setTickets([ticket, ...tickets]);
      return ticket;
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  // Automation functions
  const loadAutomations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-support-assistant/automations');
      const data = await response.json();
      setAutomations(data);
    } catch (error) {
      console.error('Failed to load automations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Analytics functions
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [convRes, ticketRes] = await Promise.all([
        fetch('/api/ai-support-assistant/analytics/conversations'),
        fetch('/api/ai-support-assistant/analytics/tickets'),
      ]);
      setConversationAnalytics(await convRes.json());
      setTicketAnalytics(await ticketRes.json());
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Agent Assist functions
  const loadSnippets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-support-assistant/agents/snippets');
      const data = await response.json();
      setSnippets(data);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Integration functions
  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-support-assistant/integrations');
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    // Conversation tabs (8)
    {
      id: 'conv-list',
      content: 'Conversations',
      panelID: 'conversations-panel',
    },
    {
      id: 'conv-create',
      content: 'New Conversation',
      panelID: 'new-conversation-panel',
    },
    {
      id: 'conv-messages',
      content: 'Messages',
      panelID: 'messages-panel',
    },
    {
      id: 'conv-threads',
      content: 'Threads',
      panelID: 'threads-panel',
    },
    {
      id: 'conv-search',
      content: 'Search',
      panelID: 'conv-search-panel',
    },
    {
      id: 'conv-assign',
      content: 'Assignment',
      panelID: 'assignment-panel',
    },
    {
      id: 'conv-tags',
      content: 'Tags',
      panelID: 'tags-panel',
    },
    {
      id: 'conv-stats',
      content: 'Conv Stats',
      panelID: 'conv-stats-panel',
    },
    // AI Model tabs (6)
    {
      id: 'ai-generate',
      content: 'Generate',
      panelID: 'ai-generate-panel',
    },
    {
      id: 'ai-models',
      content: 'Models',
      panelID: 'models-panel',
    },
    {
      id: 'ai-suggestions',
      content: 'Suggestions',
      panelID: 'suggestions-panel',
    },
    {
      id: 'ai-improve',
      content: 'Improve',
      panelID: 'improve-panel',
    },
    {
      id: 'ai-intent',
      content: 'Intent',
      panelID: 'intent-panel',
    },
    {
      id: 'ai-metrics',
      content: 'AI Metrics',
      panelID: 'ai-metrics-panel',
    },
    // Knowledge Base tabs (6)
    {
      id: 'kb-articles',
      content: 'Articles',
      panelID: 'articles-panel',
    },
    {
      id: 'kb-create',
      content: 'New Article',
      panelID: 'new-article-panel',
    },
    {
      id: 'kb-search',
      content: 'KB Search',
      panelID: 'kb-search-panel',
    },
    {
      id: 'kb-categories',
      content: 'Categories',
      panelID: 'categories-panel',
    },
    {
      id: 'kb-popular',
      content: 'Popular',
      panelID: 'popular-panel',
    },
    {
      id: 'kb-stats',
      content: 'KB Stats',
      panelID: 'kb-stats-panel',
    },
    // Ticket tabs (5)
    {
      id: 'ticket-list',
      content: 'Tickets',
      panelID: 'tickets-panel',
    },
    {
      id: 'ticket-create',
      content: 'New Ticket',
      panelID: 'new-ticket-panel',
    },
    {
      id: 'ticket-sla',
      content: 'SLA Monitor',
      panelID: 'sla-panel',
    },
    {
      id: 'ticket-assign',
      content: 'Assignment Queue',
      panelID: 'ticket-assign-panel',
    },
    {
      id: 'ticket-stats',
      content: 'Ticket Stats',
      panelID: 'ticket-stats-panel',
    },
    // Automation tabs (4)
    {
      id: 'auto-list',
      content: 'Automations',
      panelID: 'automations-panel',
    },
    {
      id: 'auto-routing',
      content: 'Routing',
      panelID: 'routing-panel',
    },
    {
      id: 'auto-triggers',
      content: 'Triggers',
      panelID: 'triggers-panel',
    },
    {
      id: 'auto-stats',
      content: 'Auto Stats',
      panelID: 'auto-stats-panel',
    },
    // Analytics tabs (5)
    {
      id: 'analytics-dashboard',
      content: 'Analytics',
      panelID: 'analytics-panel',
    },
    {
      id: 'analytics-conv',
      content: 'Conv Analytics',
      panelID: 'conv-analytics-panel',
    },
    {
      id: 'analytics-ticket',
      content: 'Ticket Analytics',
      panelID: 'ticket-analytics-panel',
    },
    {
      id: 'analytics-agent',
      content: 'Agent Performance',
      panelID: 'agent-analytics-panel',
    },
    {
      id: 'analytics-csat',
      content: 'CSAT/NPS',
      panelID: 'csat-panel',
    },
    // Agent Assist tabs (5)
    {
      id: 'agent-assist',
      content: 'Agent Assist',
      panelID: 'agent-assist-panel',
    },
    {
      id: 'agent-snippets',
      content: 'Snippets',
      panelID: 'snippets-panel',
    },
    {
      id: 'agent-macros',
      content: 'Macros',
      panelID: 'macros-panel',
    },
    {
      id: 'agent-context',
      content: 'Customer Context',
      panelID: 'customer-context-panel',
    },
    {
      id: 'agent-insights',
      content: 'Agent Insights',
      panelID: 'agent-insights-panel',
    },
    // Integration tabs (3)
    {
      id: 'int-list',
      content: 'Integrations',
      panelID: 'integrations-panel',
    },
    {
      id: 'int-webhooks',
      content: 'Webhooks',
      panelID: 'webhooks-panel',
    },
    {
      id: 'int-logs',
      content: 'Sync Logs',
      panelID: 'logs-panel',
    },
  ];

  const renderTabPanel = () => {
    const tabId = tabs[selectedTab]?.id;

    switch (tabId) {
      // Conversation tabs
      case 'conv-list':
        return (
          <Card>
            <Card.Section>
              <Stack distribution="equalSpacing" alignment="center">
                <TextStyle variation="strong">All Conversations</TextStyle>
                <Button primary onClick={loadConversations}>Refresh</Button>
              </Stack>
            </Card.Section>
            <Card.Section>
              {loading ? (
                <div className="ai-support-loading"><Spinner size="large" /></div>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                  headings={['Conversation ID', 'User', 'Channel', 'Status', 'Messages']}
                  rows={conversations.map(conv => [
                    conv.id,
                    conv.userId,
                    <Badge status={conv.channel === 'web' ? 'success' : 'info'}>{conv.channel}</Badge>,
                    <Badge status={conv.status === 'active' ? 'info' : 'success'}>{conv.status}</Badge>,
                    conv.messageCount,
                  ])}
                />
              )}
            </Card.Section>
          </Card>
        );

      case 'conv-create':
        return (
          <Card>
            <Card.Section>
              <TextStyle variation="strong">Create New Conversation</TextStyle>
            </Card.Section>
            <Card.Section>
              <Banner status="info">
                Create conversations via API. See documentation for API endpoints.
              </Banner>
            </Card.Section>
          </Card>
        );

      case 'conv-messages':
        return (
          <Card sectioned title="Conversation Messages">
            <Banner status="info">
              Select a conversation to view messages. Use Messages API to retrieve message history.
            </Banner>
          </Card>
        );

      case 'conv-threads':
        return (
          <Card sectioned title="Conversation Threads">
            <Banner status="info">
              Manage multi-turn conversation threads. Create threads to organize related messages.
            </Banner>
          </Card>
        );

      case 'conv-search':
        return (
          <Card>
            <Card.Section>
              <Stack vertical>
                <TextField
                  label="Search Conversations"
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                  placeholder="Enter search query..."
                />
                <Button primary onClick={() => console.log('Search:', searchQuery)}>Search</Button>
              </Stack>
            </Card.Section>
          </Card>
        );

      case 'conv-assign':
        return (
          <Card sectioned title="Conversation Assignment">
            <Banner status="info">
              Assign conversations to agents. Use assignment API to manage workload distribution.
            </Banner>
          </Card>
        );

      case 'conv-tags':
        return (
          <Card sectioned title="Conversation Tags">
            <Banner status="info">
              Manage conversation tags for categorization and filtering.
            </Banner>
          </Card>
        );

      case 'conv-stats':
        return (
          <Card>
            <Card.Section>
              <TextStyle variation="strong">Conversation Statistics</TextStyle>
            </Card.Section>
            <Card.Section>
              <div className="ai-support-stats-grid">
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Total Conversations</div>
                  <div className="ai-support-stat-value">{dashboardStats.totalConversations}</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Active</div>
                  <div className="ai-support-stat-value">0</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Resolved</div>
                  <div className="ai-support-stat-value">0</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Avg Messages</div>
                  <div className="ai-support-stat-value">0</div>
                </div>
              </div>
            </Card.Section>
          </Card>
        );

      // AI Model tabs
      case 'ai-generate':
        return (
          <Card>
            <Card.Section>
              <TextStyle variation="strong">Generate AI Response</TextStyle>
            </Card.Section>
            <Card.Section>
              <Stack vertical>
                <Select
                  label="Select Model"
                  options={models.map(m => ({ label: m.name, value: m.id }))}
                  value={selectedModel}
                  onChange={setSelectedModel}
                />
                <TextField
                  label="User Message"
                  multiline={4}
                  placeholder="Enter user message..."
                />
                <Button primary onClick={() => console.log('Generate response')}>Generate Response</Button>
              </Stack>
            </Card.Section>
          </Card>
        );

      case 'ai-models':
        return (
          <Card>
            <Card.Section>
              <Stack distribution="equalSpacing">
                <TextStyle variation="strong">AI Models</TextStyle>
                <Button onClick={loadModels}>Refresh</Button>
              </Stack>
            </Card.Section>
            <Card.Section>
              {loading ? (
                <div className="ai-support-loading"><Spinner size="large" /></div>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['Model ID', 'Name', 'Provider', 'Status']}
                  rows={models.map(model => [
                    model.id,
                    model.name,
                    model.provider,
                    <Badge status={model.enabled ? 'success' : 'critical'}>
                      {model.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>,
                  ])}
                />
              )}
            </Card.Section>
          </Card>
        );

      case 'ai-suggestions':
        return (
          <Card sectioned title="AI Suggestions">
            <Banner status="info">
              Get AI-powered response suggestions for faster reply handling.
            </Banner>
          </Card>
        );

      case 'ai-improve':
        return (
          <Card sectioned title="Response Improvement">
            <Banner status="info">
              Use AI to improve response quality, tone, and clarity.
            </Banner>
          </Card>
        );

      case 'ai-intent':
        return (
          <Card sectioned title="Intent Detection">
            <Banner status="info">
              Automatically detect customer intent from messages.
            </Banner>
          </Card>
        );

      case 'ai-metrics':
        return (
          <Card sectioned title="AI Model Metrics">
            <Banner status="info">
              Monitor AI model performance, latency, and token usage.
            </Banner>
          </Card>
        );

      // Knowledge Base tabs
      case 'kb-articles':
        return (
          <Card>
            <Card.Section>
              <Stack distribution="equalSpacing">
                <TextStyle variation="strong">Knowledge Base Articles</TextStyle>
                <Button primary onClick={loadArticles}>Refresh</Button>
              </Stack>
            </Card.Section>
            <Card.Section>
              {loading ? (
                <div className="ai-support-loading"><Spinner size="large" /></div>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'numeric']}
                  headings={['Title', 'Category', 'Status', 'Views']}
                  rows={articles.map(article => [
                    article.title,
                    article.category,
                    <Badge status={article.status === 'published' ? 'success' : 'warning'}>{article.status}</Badge>,
                    article.views,
                  ])}
                />
              )}
            </Card.Section>
          </Card>
        );

      case 'kb-create':
        return (
          <Card>
            <Card.Section>
              <TextStyle variation="strong">Create Knowledge Article</TextStyle>
            </Card.Section>
            <Card.Section>
              <Stack vertical>
                <TextField label="Title" placeholder="Article title..." />
                <TextField label="Content" multiline={6} placeholder="Article content..." />
                <Select
                  label="Category"
                  options={[{ label: 'General', value: 'general' }]}
                />
                <Button primary>Create Article</Button>
              </Stack>
            </Card.Section>
          </Card>
        );

      case 'kb-search':
        return (
          <Card>
            <Card.Section>
              <Stack vertical>
                <TextField
                  label="Search Knowledge Base"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search articles..."
                />
                <Button primary onClick={() => searchArticles(searchQuery)}>Search</Button>
              </Stack>
            </Card.Section>
            <Card.Section>
              {articles.length > 0 && (
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric']}
                  headings={['Title', 'Relevance', 'Views']}
                  rows={articles.map(article => [
                    article.title,
                    article.relevanceScore ? `${(article.relevanceScore * 100).toFixed(0)}%` : '-',
                    article.views,
                  ])}
                />
              )}
            </Card.Section>
          </Card>
        );

      case 'kb-categories':
        return (
          <Card sectioned title="Knowledge Base Categories">
            <Banner status="info">
              Organize articles into categories for better navigation.
            </Banner>
          </Card>
        );

      case 'kb-popular':
        return (
          <Card sectioned title="Popular Articles">
            <Banner status="info">
              View most viewed and most helpful knowledge base articles.
            </Banner>
          </Card>
        );

      case 'kb-stats':
        return (
          <Card>
            <Card.Section>
              <TextStyle variation="strong">Knowledge Base Statistics</TextStyle>
            </Card.Section>
            <Card.Section>
              <div className="ai-support-stats-grid">
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Total Articles</div>
                  <div className="ai-support-stat-value">{dashboardStats.knowledgeArticles}</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Published</div>
                  <div className="ai-support-stat-value">0</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Total Views</div>
                  <div className="ai-support-stat-value">0</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Categories</div>
                  <div className="ai-support-stat-value">0</div>
                </div>
              </div>
            </Card.Section>
          </Card>
        );

      // Ticket tabs
      case 'ticket-list':
        return (
          <Card>
            <Card.Section>
              <Stack distribution="equalSpacing">
                <TextStyle variation="strong">Support Tickets</TextStyle>
                <Button primary onClick={loadTickets}>Refresh</Button>
              </Stack>
            </Card.Section>
            <Card.Section>
              {loading ? (
                <div className="ai-support-loading"><Spinner size="large" /></div>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                  headings={['Ticket #', 'Subject', 'Priority', 'Status', 'SLA']}
                  rows={tickets.map(ticket => [
                    ticket.ticketNumber,
                    ticket.subject,
                    <Badge status={ticket.priority === 'urgent' ? 'critical' : 'info'}>{ticket.priority}</Badge>,
                    <Badge>{ticket.status}</Badge>,
                    <Badge status={ticket.slaStatus === 'breached' ? 'critical' : 'success'}>{ticket.slaStatus}</Badge>,
                  ])}
                />
              )}
            </Card.Section>
          </Card>
        );

      case 'ticket-create':
        return (
          <Card>
            <Card.Section>
              <TextStyle variation="strong">Create Support Ticket</TextStyle>
            </Card.Section>
            <Card.Section>
              <Stack vertical>
                <TextField label="Subject" placeholder="Ticket subject..." />
                <TextField label="Description" multiline={4} placeholder="Ticket description..." />
                <Select
                  label="Priority"
                  options={[
                    { label: 'Low', value: 'low' },
                    { label: 'Normal', value: 'normal' },
                    { label: 'High', value: 'high' },
                    { label: 'Urgent', value: 'urgent' },
                  ]}
                />
                <Button primary>Create Ticket</Button>
              </Stack>
            </Card.Section>
          </Card>
        );

      case 'ticket-sla':
        return (
          <Card sectioned title="SLA Monitor">
            <Banner status="warning">
              Monitor tickets at risk of SLA breach. Take immediate action on critical items.
            </Banner>
          </Card>
        );

      case 'ticket-assign':
        return (
          <Card sectioned title="Assignment Queue">
            <Banner status="info">
              Auto-assign tickets based on routing rules and agent workload.
            </Banner>
          </Card>
        );

      case 'ticket-stats':
        return (
          <Card>
            <Card.Section>
              <TextStyle variation="strong">Ticket Statistics</TextStyle>
            </Card.Section>
            <Card.Section>
              <div className="ai-support-stats-grid">
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Open Tickets</div>
                  <div className="ai-support-stat-value">{dashboardStats.activeTickets}</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Resolved</div>
                  <div className="ai-support-stat-value">0</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Avg Resolution</div>
                  <div className="ai-support-stat-value">{dashboardStats.avgResponseTime}</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">SLA Compliance</div>
                  <div className="ai-support-stat-value">0%</div>
                </div>
              </div>
            </Card.Section>
          </Card>
        );

      // Automation tabs
      case 'auto-list':
        return (
          <Card>
            <Card.Section>
              <Stack distribution="equalSpacing">
                <TextStyle variation="strong">Automation Workflows</TextStyle>
                <Button onClick={loadAutomations}>Refresh</Button>
              </Stack>
            </Card.Section>
            <Card.Section>
              <Banner status="info">
                Create automated workflows for common support tasks.
              </Banner>
            </Card.Section>
          </Card>
        );

      case 'auto-routing':
        return (
          <Card sectioned title="Routing Rules">
            <Banner status="info">
              Configure intelligent routing rules to assign conversations to the right agents.
            </Banner>
          </Card>
        );

      case 'auto-triggers':
        return (
          <Card sectioned title="Automation Triggers">
            <Banner status="info">
              Set up event-based triggers for automated actions.
            </Banner>
          </Card>
        );

      case 'auto-stats':
        return (
          <Card sectioned title="Automation Statistics">
            <Banner status="info">
              Monitor automation performance and execution history.
            </Banner>
          </Card>
        );

      // Analytics tabs
      case 'analytics-dashboard':
        return (
          <Card>
            <Card.Section>
              <TextStyle variation="strong">Analytics Dashboard</TextStyle>
            </Card.Section>
            <Card.Section>
              <div className="ai-support-stats-grid">
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Total Conversations</div>
                  <div className="ai-support-stat-value">{dashboardStats.totalConversations}</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Active Tickets</div>
                  <div className="ai-support-stat-value">{dashboardStats.activeTickets}</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Avg Response Time</div>
                  <div className="ai-support-stat-value">{dashboardStats.avgResponseTime}</div>
                </div>
                <div className="ai-support-stat-card">
                  <div className="ai-support-stat-label">Knowledge Articles</div>
                  <div className="ai-support-stat-value">{dashboardStats.knowledgeArticles}</div>
                </div>
              </div>
            </Card.Section>
          </Card>
        );

      case 'analytics-conv':
        return (
          <Card sectioned title="Conversation Analytics">
            <Banner status="info">
              Analyze conversation volume, duration, resolution rate, and sentiment trends.
            </Banner>
          </Card>
        );

      case 'analytics-ticket':
        return (
          <Card sectioned title="Ticket Analytics">
            <Banner status="info">
              Track ticket metrics including resolution time, SLA compliance, and reopen rate.
            </Banner>
          </Card>
        );

      case 'analytics-agent':
        return (
          <Card sectioned title="Agent Performance">
            <Banner status="info">
              Monitor individual agent performance, productivity, and CSAT scores.
            </Banner>
          </Card>
        );

      case 'analytics-csat':
        return (
          <Card sectioned title="Customer Satisfaction">
            <Banner status="info">
              Track CSAT scores and NPS ratings to measure customer satisfaction.
            </Banner>
          </Card>
        );

      // Agent Assist tabs
      case 'agent-assist':
        return (
          <Card sectioned title="Agent Assist Dashboard">
            <Banner status="success">
              AI-powered tools to help agents provide faster, better support.
            </Banner>
          </Card>
        );

      case 'agent-snippets':
        return (
          <Card>
            <Card.Section>
              <Stack distribution="equalSpacing">
                <TextStyle variation="strong">Quick Snippets</TextStyle>
                <Button onClick={loadSnippets}>Refresh</Button>
              </Stack>
            </Card.Section>
            <Card.Section>
              <Banner status="info">
                Create reusable text snippets for common responses.
              </Banner>
            </Card.Section>
          </Card>
        );

      case 'agent-macros':
        return (
          <Card sectioned title="Macros">
            <Banner status="info">
              Multi-step automation macros for repetitive tasks.
            </Banner>
          </Card>
        );

      case 'agent-context':
        return (
          <Card sectioned title="Customer Context">
            <Banner status="info">
              View complete customer context including purchase history and past interactions.
            </Banner>
          </Card>
        );

      case 'agent-insights':
        return (
          <Card sectioned title="Agent Insights">
            <Banner status="info">
              Real-time performance insights and coaching recommendations.
            </Banner>
          </Card>
        );

      // Integration tabs
      case 'int-list':
        return (
          <Card>
            <Card.Section>
              <Stack distribution="equalSpacing">
                <TextStyle variation="strong">Integrations</TextStyle>
                <Button onClick={loadIntegrations}>Refresh</Button>
              </Stack>
            </Card.Section>
            <Card.Section>
              {loading ? (
                <div className="ai-support-loading"><Spinner size="large" /></div>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text']}
                  headings={['Integration', 'Type', 'Status']}
                  rows={integrations.map(integration => [
                    integration.name,
                    integration.type,
                    <Badge status={integration.status === 'connected' ? 'success' : 'warning'}>
                      {integration.status}
                    </Badge>,
                  ])}
                />
              )}
            </Card.Section>
          </Card>
        );

      case 'int-webhooks':
        return (
          <Card sectioned title="Webhooks">
            <Banner status="info">
              Configure webhooks to receive real-time event notifications.
            </Banner>
          </Card>
        );

      case 'int-logs':
        return (
          <Card sectioned title="Sync Logs">
            <Banner status="info">
              View integration sync history and troubleshoot connection issues.
            </Banner>
          </Card>
        );

      default:
        return (
          <Card sectioned>
            <Banner status="info">Select a tab to view content</Banner>
          </Card>
        );
    }
  };

  return (
    <Page title="AI Support Assistant V2" fullWidth>
      <Layout>
        <Layout.Section>
          <Card>
            <div className="ai-support-tabs-wrapper">
              <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
                <div className="ai-support-tab-content">
                  {renderTabPanel()}
                </div>
              </Tabs>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default AISupportAssistantV2;
