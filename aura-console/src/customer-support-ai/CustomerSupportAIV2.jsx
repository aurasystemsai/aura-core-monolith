import React, { useState, useEffect } from 'react';
import { Page, Tabs, Card, EmptyState, Layout, TextContainer, Heading, Button } from '@shopify/polaris';
import './CustomerSupportAIV2.css';

export default function CustomerSupportAIV2() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    avgResponseTime: 0,
    csatScore: 0
  });
  
  const tabs = [
    // Operations (6 tabs)
    { id: 'tickets', content: 'Tickets', group: 'Operations' },
    { id: 'routing', content: 'Routing', group: 'Operations' },
    { id: 'sla', content: 'SLA', group: 'Operations' },
    { id: 'escalations', content: 'Escalations', group: 'Operations' },
    { id: 'assignments', content: 'Team Assignments', group: 'Operations' },
    { id: 'ops-dashboard', content: 'Dashboard', group: 'Operations' },
    
    // Quality (5 tabs)
    { id: 'qa-reviews', content: 'QA Reviews', group: 'Quality' },
    { id: 'coaching', content: 'Coaching', group: 'Quality' },
    { id: 'calibration', content: 'Calibration', group: 'Quality' },
    { id: 'qa-metrics', content: 'Metrics', group: 'Quality' },
    { id: 'qa-templates', content: 'Templates', group: 'Quality' },
    
    // Performance (5 tabs)
    { id: 'agent-metrics', content: 'Agent Metrics', group: 'Performance' },
    { id: 'goals', content: 'Goals', group: 'Performance' },
    { id: 'achievements', content: 'Achievements', group: 'Performance' },
    { id: 'leaderboards', content: 'Leaderboards', group: 'Performance' },
    { id: 'team-summary', content: 'Team Summary', group: 'Performance' },
    
    // Satisfaction (5 tabs)
    { id: 'surveys', content: 'Surveys', group: 'Satisfaction' },
    { id: 'responses', content: 'Responses', group: 'Satisfaction' },
    { id: 'csat-nps', content: 'CSAT/NPS', group: 'Satisfaction' },
    { id: 'sentiment', content: 'Sentiment', group: 'Satisfaction' },
    { id: 'agent-scores', content: 'Agent Scores', group: 'Satisfaction' },
    
    // Automation (5 tabs)
    { id: 'macros', content: 'Macros', group: 'Automation' },
    { id: 'triggers', content: 'Triggers', group: 'Automation' },
    { id: 'rules', content: 'Rules', group: 'Automation' },
    { id: 'auto-responses', content: 'Auto-Responses', group: 'Automation' },
    { id: 'executions', content: 'Executions', group: 'Automation' },
    
    // Knowledge (5 tabs)
    { id: 'articles', content: 'Articles', group: 'Knowledge' },
    { id: 'categories', content: 'Categories', group: 'Knowledge' },
    { id: 'search', content: 'Search', group: 'Knowledge' },
    { id: 'kb-analytics', content: 'Analytics', group: ' Knowledge' },
    { id: 'popular-terms', content: 'Popular Terms', group: 'Knowledge' },
    
    // Omnichannel (6 tabs)
    { id: 'inbox', content: 'Unified Inbox', group: 'Omnichannel' },
    { id: 'channels', content: 'Channels', group: 'Omnichannel' },
    { id: 'conversations', content: 'Conversations', group: 'Omnichannel' },
    { id: 'msg-templates', content: 'Templates', group: 'Omnichannel' },
    { id: 'channel-analytics', content: 'Analytics', group: 'Omnichannel' },
    { id: 'channel-settings', content: 'Settings', group: 'Omnichannel' },
    
    // AI Insights (5 tabs)
    { id: 'intent-analysis', content: 'Intent Analysis', group: 'AI' },
    { id: 'agent-assist', content: 'Agent Assist', group: 'AI' },
    { id: 'predictions', content: 'Predictions', group: 'AI' },
    { id: 'trends', content: 'Trends', group: 'AI' },
    { id: 'ai-recommendations', content: 'Recommendations', group: 'AI' }
  ];
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/customer-support-ai/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalTickets: data.statistics.operations.totalTickets || 0,
          openTickets: data.statistics.operations.statusBreakdown?.open || 0,
          avgResponseTime: data.statistics.operations.averageFirstResponseTime || 0,
          csatScore: 4.5
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderTabContent = () => {
    const currentTab = tabs[selectedTab];
    
    switch (currentTab.id) {
      // Operations
      case 'tickets':
        return renderTickets();
      case 'routing':
        return renderRouting();
      case 'sla':
        return renderSLA();
      case 'escalations':
        return renderEscalations();
      case 'assignments':
        return renderAssignments();
      case 'ops-dashboard':
        return renderOperationsDashboard();
        
      // Quality
      case 'qa-reviews':
        return renderQAReviews();
      case 'coaching':
        return renderCoaching();
      case 'calibration':
        return renderCalibration();
      case 'qa-metrics':
        return renderQAMetrics();
      case 'qa-templates':
        return renderQATemplates();
        
      // Performance
      case 'agent-metrics':
        return renderAgentMetrics();
      case 'goals':
        return renderGoals();
      case 'achievements':
        return renderAchievements();
      case 'leaderboards':
        return renderLeaderboards();
      case 'team-summary':
        return renderTeamSummary();
        
      // Satisfaction
      case 'surveys':
        return renderSurveys();
      case 'responses':
        return renderResponses();
      case 'csat-nps':
        return renderCSATNPS();
      case 'sentiment':
        return renderSentiment();
      case 'agent-scores':
        return renderAgentScores();
        
      // Automation
      case 'macros':
        return renderMacros();
      case 'triggers':
        return renderTriggers();
      case 'rules':
        return renderRules();
      case 'auto-responses':
        return renderAutoResponses();
      case 'executions':
        return renderExecutions();
        
      // Knowledge
      case 'articles':
        return renderArticles();
      case 'categories':
        return renderCategories();
      case 'search':
        return renderSearch();
      case 'kb-analytics':
        return renderKBAnalytics();
      case 'popular-terms':
        return renderPopularTerms();
        
      // Omnichannel
      case 'inbox':
        return renderInbox();
      case 'channels':
        return renderChannels();
      case 'conversations':
        return renderConversations();
      case 'msg-templates':
        return renderMessageTemplates();
      case 'channel-analytics':
        return renderChannelAnalytics();
      case 'channel-settings':
        return renderChannelSettings();
        
      // AI Insights
      case 'intent-analysis':
        return renderIntentAnalysis();
      case 'agent-assist':
        return renderAgentAssist();
      case 'predictions':
        return renderPredictions();
      case 'trends':
        return renderTrends();
      case 'ai-recommendations':
        return renderAIRecommendations();
        
      default:
        return renderDefaultEmpty();
    }
  };
  
  // Operations Renders
  const renderTickets = () => (
    <EmptyState
      heading="Ticket Management"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Create and manage support tickets with smart routing</p>
    </EmptyState>
  );
  
  const renderRouting = () => (
    <EmptyState
      heading="Routing Rules"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Configure automatic ticket routing based on priority, category, and skills</p>
    </EmptyState>
  );
  
  const renderSLA = () => (
    <EmptyState
      heading="SLA Management"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Monitor and manage service level agreements for response and resolution times</p>
    </EmptyState>
  );
  
  const renderEscalations = () => (
    <EmptyState
      heading="Escalation Management"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Track and manage escalated tickets approaching SLA breach</p>
    </EmptyState>
  );
  
  const renderAssignments = () => (
    <EmptyState
      heading="Team Assignments"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Manage agent availability, skills, and workload distribution</p>
    </EmptyState>
  );
  
  const renderOperationsDashboard = () => (
    <Layout>
      <Layout.Section>
        <div className="stats-grid">
          <Card sectioned>
            <TextContainer>
              <Heading>Total Tickets</Heading>
              <p className="stat-value">{stats.totalTickets.toLocaleString()}</p>
            </TextContainer>
          </Card>
          <Card sectioned>
            <TextContainer>
              <Heading>Open Tickets</Heading>
              <p className="stat-value">{stats.openTickets.toLocaleString()}</p>
            </TextContainer>
          </Card>
          <Card sectioned>
            <TextContainer>
              <Heading>Avg Response Time</Heading>
              <p className="stat-value">{stats.avgResponseTime} min</p>
            </TextContainer>
          </Card>
          <Card sectioned>
            <TextContainer>
              <Heading>CSAT Score</Heading>
              <p className="stat-value">{stats.csatScore.toFixed(1)}/5.0</p>
            </TextContainer>
          </Card>
        </div>
      </Layout.Section>
    </Layout>
  );
  
  // Quality Renders
  const renderQAReviews = () => (
    <EmptyState
      heading="QA Reviews"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Conduct quality assurance reviews for agent interactions</p>
    </EmptyState>
  );
  
  const renderCoaching = () => (
    <EmptyState
      heading="Coaching Sessions"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Schedule and track coaching sessions to improve agent performance</p>
    </EmptyState>
  );
  
  const renderCalibration = () => (
    <EmptyState
      heading="Calibration Sessions"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Ensure consistent QA scoring across reviewers</p>
    </EmptyState>
  );
  
  const renderQAMetrics = () => (
    <EmptyState
      heading="Quality Metrics"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>View average QA scores, compliance rates, and quality trends</p>
    </EmptyState>
  );
  
  const renderQATemplates = () => (
    <EmptyState
      heading="QA Templates"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Create and manage QA scoring templates for different interaction types</p>
    </EmptyState>
  );
  
  // Performance Renders
  const renderAgentMetrics = () => (
    <EmptyState
      heading="Agent Metrics"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Track individual agent performance including tickets resolved, response times, and satisfaction scores</p>
    </EmptyState>
  );
  
  const renderGoals = () => (
    <EmptyState
      heading="Performance Goals"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Set and track performance goals for agents and teams</p>
    </EmptyState>
  );
  
  const renderAchievements = () => (
    <EmptyState
      heading="Achievements"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Gamify agent performance with unlockable achievements and badges</p>
    </EmptyState>
  );
  
  const renderLeaderboards = () => (
    <EmptyState
      heading="Leaderboards"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>View agent rankings by productivity, satisfaction, and quality scores</p>
    </EmptyState>
  );
  
  const renderTeamSummary = () => (
    <EmptyState
      heading="Team Performance Summary"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Overview of team-wide metrics and performance trends</p>
    </EmptyState>
  );
  
  // Satisfaction Renders
  const renderSurveys = () => (
    <EmptyState
      heading="Customer Surveys"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Create and manage CSAT, NPS, and CES surveys</p>
    </EmptyState>
  );
  
  const renderResponses = () => (
    <EmptyState
      heading="Survey Responses"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>View and analyze customer feedback from surveys</p>
    </EmptyState>
  );
  
  const renderCSATNPS = () => (
    <EmptyState
      heading="CSAT & NPS Scores"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Monitor customer satisfaction and Net Promoter Scores</p>
    </EmptyState>
  );
  
  const renderSentiment = () => (
    <EmptyState
      heading="Sentiment Analysis"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>AI-powered sentiment analysis of customer comments and feedback</p>
    </EmptyState>
  );
  
  const renderAgentScores = () => (
    <EmptyState
      heading="Agent Satisfaction Scores"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Track individual agent CSAT and NPS performance</p>
    </EmptyState>
  );
  
  // Automation Renders
  const renderMacros = () => (
    <EmptyState
      heading="Macros"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Create reusable macros for common support actions</p>
    </EmptyState>
  );
  
  const renderTriggers = () => (
    <EmptyState
      heading="Automation Triggers"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Set up event-based triggers to automate ticket workflows</p>
    </EmptyState>
  );
  
  const renderRules = () => (
    <EmptyState
      heading="Automation Rules"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Configure business rules for automated ticket processing</p>
    </EmptyState>
  );
  
  const renderAutoResponses = () => (
    <EmptyState
      heading="Auto-Responses"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Set up automatic responses for common customer inquiries</p>
    </EmptyState>
  );
  
  const renderExecutions = () => (
    <EmptyState
      heading="Workflow Executions"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>View history of automated workflow executions</p>
    </EmptyState>
  );
  
  // Knowledge Renders
  const renderArticles = () => (
    <EmptyState
      heading="Knowledge Base Articles"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Create and manage help articles for customers and agents</p>
    </EmptyState>
  );
  
  const renderCategories = () => (
    <EmptyState
      heading="Article Categories"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Organize knowledge base with categories and subcategories</p>
    </EmptyState>
  );
  
  const renderSearch = () => (
    <EmptyState
      heading="Knowledge Base Search"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Search articles with AI-powered relevance ranking</p>
    </EmptyState>
  );
  
  const renderKBAnalytics = () => (
    <EmptyState
      heading="Knowledge Base Analytics"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Track article views, helpfulness scores, and engagement metrics</p>
    </EmptyState>
  );
  
  const renderPopularTerms = () => (
    <EmptyState
      heading="Popular Search Terms"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Identify trending topics and content gaps based on search behavior</p>
    </EmptyState>
  );
  
  // Omnichannel Renders
  const renderInbox = () => (
    <EmptyState
      heading="Unified Inbox"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Manage conversations from email, chat, phone, and social media in one place</p>
    </EmptyState>
  );
  
  const renderChannels = () => (
    <EmptyState
      heading="Channel Configuration"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Configure email, chat, phone, Facebook, Twitter, Instagram, and WhatsApp channels</p>
    </EmptyState>
  );
  
  const renderConversations = () => (
    <EmptyState
      heading="Conversations"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>View and manage customer conversations across all channels</p>
    </EmptyState>
  );
  
  const renderMessageTemplates = () => (
    <EmptyState
      heading="Message Templates"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Create channel-specific message templates with variable support</p>
    </EmptyState>
  );
  
  const renderChannelAnalytics = () => (
    <EmptyState
      heading="Channel Analytics"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Analyze performance metrics by channel including volume, response times, and satisfaction</p>
    </EmptyState>
  );
  
  const renderChannelSettings = () => (
    <EmptyState
      heading="Channel Settings"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Configure business hours, auto-responses, and routing for each channel</p>
    </EmptyState>
  );
  
  // AI Insights Renders
  const renderIntentAnalysis = () => (
    <EmptyState
      heading="Customer Intent Analysis"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>AI-powered analysis of customer intent from messages and tickets</p>
    </EmptyState>
  );
  
  const renderAgentAssist = () => (
    <EmptyState
      heading="AI Agent Assist"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Real-time AI suggestions for responses, articles, and actions</p>
    </EmptyState>
  );
  
  const renderPredictions = () => (
    <EmptyState
      heading="AI Predictions"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Predict resolution times, churn risk, and ticket outcomes</p>
    </EmptyState>
  );
  
  const renderTrends = () => (
    <EmptyState
      heading="Trend Detection"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Automatically detect trends in ticket volume, topics, and customer issues</p>
    </EmptyState>
  );
  
  const renderAIRecommendations = () => (
    <EmptyState
      heading="AI Recommendations"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Actionable recommendations to improve support operations and customer satisfaction</p>
    </EmptyState>
  );
  
  const renderDefaultEmpty = () => (
    <EmptyState
      heading="Customer Support AI V2"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Enterprise support platform with AI-powered operations</p>
    </EmptyState>
  );
  
  return (
    <Page
      title="Customer Support AI V2"
      subtitle="Enterprise support operations with AI-powered insights, quality assurance, and omnichannel management"
    >
      <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
        {renderTabContent()}
      </Tabs>
    </Page>
  );
}
