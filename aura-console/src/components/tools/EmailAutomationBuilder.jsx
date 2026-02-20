﻿import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';

// Main Email Automation Builder Component with 8-Category, 42-Tab Enterprise Structure
export default function EmailAutomationBuilder() {
  // Top-level navigation state (8 categories)
  const [activeCategory, setActiveCategory] = useState('campaigns');
  const [activeTab, setActiveTab] = useState('overview');

  // 8 Enterprise Categories
  const categories = [
    { id: 'campaigns', label: 'Campaigns', icon: '', count: 6 },
    { id: 'ai-orchestration', label: 'AI Orchestration', icon: '', count: 6 },
    { id: 'workflows', label: 'Workflows', icon: '', count: 6 },
    { id: 'multichannel', label: 'Multi-Channel', icon: '', count: 5 },
    { id: 'analytics', label: 'Analytics', icon: '', count: 6 },
    { id: 'testing', label: 'Testing & Optimization', icon: '', count: 6 },
    { id: 'settings', label: 'Settings & Admin', icon: '️', count: 4 },
    { id: 'advanced', label: 'Advanced', icon: '', count: 3 },
  ];

  // 42 Tabs organized by category
  const tabs = {
    campaigns: [
      { id: 'overview', label: 'Campaign Overview', description: 'View and manage all campaigns' },
      { id: 'create', label: 'Create Campaign', description: 'Build new email campaigns' },
      { id: 'templates', label: 'Email Templates', description: 'Template library' },
      { id: 'sequences', label: 'Email Sequences', description: 'Multi-email sequences' },
      { id: 'segments', label: 'Audience Segments', description: 'Customer segmentation' },
      { id: 'personalization', label: 'Personalization', description: 'Dynamic content engine' },
    ],
    'ai-orchestration': [
      { id: 'smart-send', label: 'Smart Send Time', description: 'AI-optimized send times' },
      { id: 'content-gen', label: 'Content Generation', description: 'AI copywriting' },
      { id: 'subject-opt', label: 'Subject Line Optimizer', description: 'AI subject lines' },
      { id: 'predictive', label: 'Predictive Analytics', description: 'Engagement predictions' },
      { id: 'auto-optimize', label: 'Auto-Optimization', description: 'Self-tuning campaigns' },
      { id: 'recommendations', label: 'AI Recommendations', description: 'Strategy suggestions' },
    ],
    workflows: [
      { id: 'builder', label: 'Workflow Builder', description: 'Visual workflow designer' },
      { id: 'triggers', label: 'Triggers & Events', description: 'Automation triggers' },
      { id: 'conditions', label: 'Conditional Logic', description: 'Smart branching' },
      { id: 'actions', label: 'Actions Library', description: 'Available actions' },
      { id: 'monitoring', label: 'Workflow Monitoring', description: 'Live workflow status' },
      { id: 'history', label: 'Execution History', description: 'Past runs and logs' },
    ],
    multichannel: [
      { id: 'sms', label: 'SMS Campaigns', description: 'Text message automation' },
      { id: 'push', label: 'Push Notifications', description: 'Mobile push' },
      { id: 'webhooks', label: 'Webhooks', description: 'External integrations' },
      { id: 'orchestration', label: 'Channel Orchestration', description: 'Multi-channel flows' },
      { id: 'preferences', label: 'Channel Preferences', description: 'Customer preferences' },
    ],
    analytics: [
      { id: 'dashboard', label: 'Analytics Dashboard', description: 'Real-time metrics' },
      { id: 'reports', label: 'Campaign Reports', description: 'Detailed reports' },
      { id: 'revenue', label: 'Revenue Attribution', description: 'Revenue tracking' },
      { id: 'engagement', label: 'Engagement Metrics', description: 'Open/click analytics' },
      { id: 'deliverability', label: 'Deliverability', description: 'Inbox placement' },
      { id: 'export', label: 'Data Export', description: 'Export analytics data' },
    ],
    testing: [
      { id: 'abtests', label: 'A/B Testing', description: 'Split testing' },
      { id: 'multivariate', label: 'Multivariate Testing', description: 'Multi-variant tests' },
      { id: 'experiments', label: 'Experiments', description: 'Experiment management' },
      { id: 'frequency', label: 'Frequency Optimization', description: 'Send frequency' },
      { id: 'content-testing', label: 'Content Testing', description: 'Content variants' },
      { id: 'results', label: 'Test Results', description: 'Test performance' },
    ],
    settings: [
      { id: 'general', label: 'General Settings', description: 'Basic configuration' },
      { id: 'team', label: 'Team & Permissions', description: 'User management' },
      { id: 'compliance', label: 'Compliance & GDPR', description: 'Legal compliance' },
      { id: 'integrations', label: 'Integrations', description: 'Third-party apps' },
    ],
    advanced: [
      { id: 'api', label: 'API & Developer', description: 'API access' },
      { id: 'custom-fields', label: 'Custom Fields', description: 'Custom data fields' },
      { id: 'automation-rules', label: 'Custom Automation', description: 'Advanced rules' },
    ],
  };

  // Shared state for data
  const [campaigns, setCampaigns] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [campaignsRes, workflowsRes, segmentsRes] = await Promise.all([
        apiFetch('/api/email-automation-builder/campaigns'),
        apiFetch('/api/email-automation-builder/workflows/list'),
        apiFetch('/api/email-automation-builder/campaigns/segments'),
      ]);
      
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
      }
      if (workflowsRes.ok) {
        const data = await workflowsRes.json();
        setWorkflows(data.workflows || []);
      }
      if (segmentsRes.ok) {
        const data = await segmentsRes.json();
        setSegments(data.segments || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Render category navigation bar
  const renderCategoryNav = () => (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '2px solid #f9fafb', paddingBottom: 12 }}>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => {
            setActiveCategory(cat.id);
            setActiveTab(tabs[cat.id][0].id);
          }}
          style={{
            background: activeCategory === cat.id ? '#6366f1' : '#f3f4f6',
            color: activeCategory === cat.id ? '#fff' : '#2e3045',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
          <span style={{ 
            background: activeCategory === cat.id ? '#8b8fa8' : '#f9fafb',
            borderRadius: 12,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 600,
          }}>{cat.count}</span>
        </button>
      ))}
    </div>
  );

  // Render tab navigation
  const renderTabNav = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
      {tabs[activeCategory].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            background: activeTab === tab.id ? '#ede9fe' : '#fff',
            color: '#2e3045',
            border: activeTab === tab.id ? '2px solid #6366f1' : '1px solid #f9fafb',
            borderRadius: 10,
            padding: 16,
            fontWeight: activeTab === tab.id ? 700 : 500,
            fontSize: 15,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{tab.label}</div>
          <div style={{ fontSize: 13, color: '#8b8fa8' }}>{tab.description}</div>
        </button>
      ))}
    </div>
  );

  // Render active tab content
  const renderTabContent = () => {
    // Campaign tabs
    if (activeCategory === 'campaigns' && activeTab === 'overview') return <CampaignOverviewTab campaigns={campaigns} setCampaigns={setCampaigns} />;
    if (activeCategory === 'campaigns' && activeTab === 'create') return <CreateCampaignTab />;
    if (activeCategory === 'campaigns' && activeTab === 'templates') return <EmailTemplatesTab />;
    if (activeCategory === 'campaigns' && activeTab === 'sequences') return <EmailSequencesTab />;
    if (activeCategory === 'campaigns' && activeTab === 'segments') return <AudienceSegmentsTab segments={segments} setSegments={setSegments} />;
    if (activeCategory === 'campaigns' && activeTab === 'personalization') return <PersonalizationTab />;
    
    // AI Orchestration tabs
    if (activeCategory === 'ai-orchestration' && activeTab === 'smart-send') return <SmartSendTimeTab />;
    if (activeCategory === 'ai-orchestration' && activeTab === 'content-gen') return <ContentGenerationTab />;
    if (activeCategory === 'ai-orchestration' && activeTab === 'subject-opt') return <SubjectLineOptimizerTab />;
    if (activeCategory === 'ai-orchestration' && activeTab === 'predictive') return <PredictiveAnalyticsTab />;
    if (activeCategory === 'ai-orchestration' && activeTab === 'auto-optimize') return <AutoOptimizationTab />;
    if (activeCategory === 'ai-orchestration' && activeTab === 'recommendations') return <AIRecommendationsTab />;
    
    // Workflow tabs
    if (activeCategory === 'workflows' && activeTab === 'builder') return <WorkflowBuilderTab workflows={workflows} setWorkflows={setWorkflows} />;
    if (activeCategory === 'workflows' && activeTab === 'triggers') return <TriggersEventsTab />;
    if (activeCategory === 'workflows' && activeTab === 'conditions') return <ConditionalLogicTab />;
    if (activeCategory === 'workflows' && activeTab === 'actions') return <ActionsLibraryTab />;
    if (activeCategory === 'workflows' && activeTab === 'monitoring') return <WorkflowMonitoringTab />;
    if (activeCategory === 'workflows' && activeTab === 'history') return <ExecutionHistoryTab />;
    
    // Multi-channel tabs
    if (activeCategory === 'multichannel' && activeTab === 'sms') return <SMSCampaignsTab />;
    if (activeCategory === 'multichannel' && activeTab === 'push') return <PushNotificationsTab />;
    if (activeCategory === 'multichannel' && activeTab === 'webhooks') return <WebhooksTab />;
    if (activeCategory === 'multichannel' && activeTab === 'orchestration') return <ChannelOrchestrationTab />;
    if (activeCategory === 'multichannel' && activeTab === 'preferences') return <ChannelPreferencesTab />;
    
    // Analytics tabs
    if (activeCategory === 'analytics' && activeTab === 'dashboard') return <AnalyticsDashboardTab />;
    if (activeCategory === 'analytics' && activeTab === 'reports') return <CampaignReportsTab />;
    if (activeCategory === 'analytics' && activeTab === 'revenue') return <RevenueAttributionTab />;
    if (activeCategory === 'analytics' && activeTab === 'engagement') return <EngagementMetricsTab />;
    if (activeCategory === 'analytics' && activeTab === 'deliverability') return <DeliverabilityTab />;
    if (activeCategory === 'analytics' && activeTab === 'export') return <DataExportTab />;
    
    // Testing tabs
    if (activeCategory === 'testing' && activeTab === 'abtests') return <ABTestingTab />;
    if (activeCategory === 'testing' && activeTab === 'multivariate') return <MultivariateTestingTab />;
    if (activeCategory === 'testing' && activeTab === 'experiments') return <ExperimentsTab />;
    if (activeCategory === 'testing' && activeTab === 'frequency') return <FrequencyOptimizationTab />;
    if (activeCategory === 'testing' && activeTab === 'content-testing') return <ContentTestingTab />;
    if (activeCategory === 'testing' && activeTab === 'results') return <TestResultsTab />;
    
    // Settings tabs
    if (activeCategory === 'settings' && activeTab === 'general') return <GeneralSettingsTab />;
    if (activeCategory === 'settings' && activeTab === 'team') return <TeamPermissionsTab />;
    if (activeCategory === 'settings' && activeTab === 'compliance') return <ComplianceGDPRTab />;
    if (activeCategory === 'settings' && activeTab === 'integrations') return <IntegrationsTab />;
    
    // Advanced tabs
    if (activeCategory === 'advanced' && activeTab === 'api') return <APIDeveloperTab />;
    if (activeCategory === 'advanced' && activeTab === 'custom-fields') return <CustomFieldsTab />;
    if (activeCategory === 'advanced' && activeTab === 'automation-rules') return <CustomAutomationTab />;
    
    return <div style={{ color: '#8b8fa8', padding: 32, textAlign: 'center' }}>Tab content coming soon...</div>;
  };

  return (
    <div style={{ padding: 32, background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#2e3045', marginBottom: 8 }}>Email Automation Builder</h1>
          <p style={{ fontSize: 16, color: '#8b8fa8' }}>Enterprise email marketing automation platform with AI orchestration, workflows, and multi-channel delivery</p>
        </div>

        {/* Category Navigation */}
        {renderCategoryNav()}

        {/* Tab Navigation */}
        {renderTabNav()}

        {/* Loading & Error States */}
        {loading && <div style={{ color: '#8b8fa8', padding: 24, textAlign: 'center' }}>Loading...</div>}
        {error && <div style={{ color: '#dc2626', padding: 24, textAlign: 'center', background: '#fee2e2', borderRadius: 8, marginBottom: 24 }}>Error: {error}</div>}

        {/* Tab Content */}
        <div style={{ background: '#6366f1', borderRadius: 12, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

// ========================================
// CATEGORY 1: CAMPAIGNS (6 tabs)
// ========================================

function CampaignOverviewTab({ campaigns, setCampaigns }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    if (campaigns.length === 0) {
      // Add sample data
      setCampaigns([
        { id: 1, name: 'Welcome Series', status: 'active', sent: 12543, openRate: 42.3, clickRate: 8.7, revenue: 45231, created: '2026-01-15' },
        { id: 2, name: 'Weekly Newsletter', status: 'active', sent: 8965, openRate: 38.1, clickRate: 6.2, revenue: 12450, created: '2026-01-20' },
        { id: 3, name: 'Product Launch', status: 'scheduled', sent: 0, openRate: 0, clickRate: 0, revenue: 0, created: '2026-02-10' },
      ]);
    }
  }, [campaigns, setCampaigns]);

  const handleDelete = (id) => {
    if (window.confirm('Delete this campaign?')) {
      setCampaigns(campaigns.filter(c => c.id !== id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Campaign Overview</h2>
        <button onClick={() => setShowModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>+ New Campaign</button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#ede9fe', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Total Campaigns</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>{campaigns.length}</div>
        </div>
        <div style={{ background: '#dbeafe', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Emails Sent</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>{campaigns.reduce((sum, c) => sum + c.sent, 0).toLocaleString()}</div>
        </div>
        <div style={{ background: '#d1fae5', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Avg Open Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>{(campaigns.reduce((sum, c) => sum + c.openRate, 0) / (campaigns.length || 1)).toFixed(1)}%</div>
        </div>
        <div style={{ background: '#fef3c7', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>${campaigns.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f9fafb' }}>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#8b8fa8' }}>Campaign Name</th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#8b8fa8' }}>Status</th>
            <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#8b8fa8' }}>Sent</th>
            <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#8b8fa8' }}>Open Rate</th>
            <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#8b8fa8' }}>Click Rate</th>
            <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#8b8fa8' }}>Revenue</th>
            <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#8b8fa8' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(campaign => (
            <tr key={campaign.id} style={{ borderBottom: '1px solid #f9fafb' }}>
              <td style={{ padding: 12, fontWeight: 500 }}>{campaign.name}</td>
              <td style={{ padding: 12 }}>
                <span style={{ 
                  background: campaign.status === 'active' ? '#d1fae5' : campaign.status === 'scheduled' ? '#dbeafe' : '#fee2e2',
                  color: campaign.status === 'active' ? '#059669' : campaign.status === 'scheduled' ? '#2563eb' : '#dc2626',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                }}>{campaign.status}</span>
              </td>
              <td style={{ padding: 12, textAlign: 'right' }}>{campaign.sent.toLocaleString()}</td>
              <td style={{ padding: 12, textAlign: 'right' }}>{campaign.openRate}%</td>
              <td style={{ padding: 12, textAlign: 'right' }}>{campaign.clickRate}%</td>
              <td style={{ padding: 12, textAlign: 'right' }}>${campaign.revenue.toLocaleString()}</td>
              <td style={{ padding: 12, textAlign: 'right' }}>
                <button onClick={() => setSelectedCampaign(campaign)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', marginRight: 8, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(campaign.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateCampaignTab() {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    from: '',
    segment: '',
    template: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/email-automation-builder/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert('Campaign created successfully!');
        setFormData({ name: '', subject: '', from: '', segment: '', template: '' });
      }
    } catch (err) {
      alert('Error creating campaign');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Create New Campaign</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Campaign Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #f9fafb', fontSize: 15 }}
            required
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Subject Line</label>
          <input
            type="text"
            value={formData.subject}
            onChange={e => setFormData({ ...formData, subject: e.target.value })}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #f9fafb', fontSize: 15 }}
            required
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>From Address</label>
          <input
            type="email"
            value={formData.from}
            onChange={e => setFormData({ ...formData, from: e.target.value })}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #f9fafb', fontSize: 15 }}
            required
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Audience Segment</label>
          <select
            value={formData.segment}
            onChange={e => setFormData({ ...formData, segment: e.target.value })}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #f9fafb', fontSize: 15 }}
            required
          >
            <option value="">Select segment</option>
            <option value="all">All Subscribers</option>
            <option value="engaged">Engaged Users</option>
            <option value="vip">VIP Customers</option>
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Email Template</label>
          <select
            value={formData.template}
            onChange={e => setFormData({ ...formData, template: e.target.value })}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #f9fafb', fontSize: 15 }}
            required
          >
            <option value="">Select template</option>
            <option value="welcome">Welcome Email</option>
            <option value="newsletter">Newsletter</option>
            <option value="promotion">Promotional</option>
          </select>
        </div>
        <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 16 }}>Create Campaign</button>
      </form>
    </div>
  );
}

function EmailTemplatesTab() {
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Welcome Email', category: 'Onboarding', lastModified: '2026-02-10' },
    { id: 2, name: 'Weekly Newsletter', category: 'Newsletter', lastModified: '2026-02-08' },
    { id: 3, name: 'Product Launch', category: 'Promotional', lastModified: '2026-02-05' },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Email Templates</h2>
        <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>+ New Template</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {templates.map(template => (
          <div key={template.id} style={{ background: '#f9fafb', borderRadius: 10, padding: 20, border: '1px solid #f9fafb' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{template.name}</div>
            <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 12 }}>{template.category}</div>
            <div style={{ fontSize: 13, color: '#a8adc4', marginBottom: 16 }}>Modified: {template.lastModified}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '8px', cursor: 'pointer' }}>Edit</button>
              <button style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '8px', cursor: 'pointer' }}>Preview</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailSequencesTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Email Sequences</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Create multi-email sequences with automated timing and triggers.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Email sequence builder coming soon...
      </div>
    </div>
  );
}

function AudienceSegmentsTab({ segments, setSegments }) {
  useEffect(() => {
    if (segments.length === 0) {
      setSegments([
        { id: 1, name: 'Engaged Users', rule: 'Opened email in last 30 days', count: 15234 },
        { id: 2, name: 'VIP Customers', rule: 'Total spend > $1000', count: 892 },
        { id: 3, name: 'Inactive', rule: 'No activity in 90 days', count: 4521 },
      ]);
    }
  }, [segments, setSegments]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Audience Segments</h2>
        <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>+ New Segment</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f9fafb' }}>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#8b8fa8' }}>Segment Name</th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#8b8fa8' }}>Rule</th>
            <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#8b8fa8' }}>Count</th>
            <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#8b8fa8' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {segments.map(segment => (
            <tr key={segment.id} style={{ borderBottom: '1px solid #f9fafb' }}>
              <td style={{ padding: 12, fontWeight: 500 }}>{segment.name}</td>
              <td style={{ padding: 12, color: '#8b8fa8' }}>{segment.rule}</td>
              <td style={{ padding: 12, textAlign: 'right' }}>{segment.count.toLocaleString()}</td>
              <td style={{ padding: 12, textAlign: 'right' }}>
                <button style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PersonalizationTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Personalization Engine</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Dynamic content and personalization tokens for hyper-targeted emails.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Personalization engine coming soon...
      </div>
    </div>
  );
}

// ========================================
// CATEGORY 2: AI ORCHESTRATION (6 tabs)
// ========================================

function SmartSendTimeTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Smart Send Time Optimization</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>AI-powered optimal send time prediction for each subscriber.</p>
      <div style={{ background: '#ede9fe', borderRadius: 10, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>AI Send Time Recommendations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: '#6366f1', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Optimal Hour</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>2:00 PM</div>
          </div>
          <div style={{ background: '#6366f1', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Predicted Open Rate</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>46.2%</div>
          </div>
          <div style={{ background: '#6366f1', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Timezone</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>EST</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentGenerationTab() {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await apiFetch('/api/email-automation-builder/ai/content-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setGeneratedContent(data.content || 'Generated content will appear here...');
    } catch (err) {
      setGeneratedContent('Error generating content');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>AI Content Generation</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Generate email copy using AI.</p>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Describe your email</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="E.g., Write a welcome email for new subscribers..."
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #f9fafb', fontSize: 15, minHeight: 100 }}
        />
      </div>
      <button onClick={handleGenerate} disabled={generating} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', marginBottom: 20 }}>
        {generating ? 'Generating...' : 'Generate Content'}
      </button>
      {generatedContent && (
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: 20, whiteSpace: 'pre-wrap' }}>
          {generatedContent}
        </div>
      )}
    </div>
  );
}

function SubjectLineOptimizerTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Subject Line Optimizer</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>AI-powered subject line analysis and suggestions.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Subject line optimizer coming soon...
      </div>
    </div>
  );
}

function PredictiveAnalyticsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Predictive Analytics</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Predict engagement, churn risk, and conversion probability.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Predictive analytics dashboard coming soon...
      </div>
    </div>
  );
}

function AutoOptimizationTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Auto-Optimization</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Self-tuning campaigns that automatically optimize for performance.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Auto-optimization settings coming soon...
      </div>
    </div>
  );
}

function AIRecommendationsTab() {
  const recommendations = [
    { id: 1, type: 'Send Time', recommendation: 'Send emails at 2:00 PM EST for best open rates', impact: '+12% open rate' },
    { id: 2, type: 'Subject Line', recommendation: 'Use personalization in subject lines', impact: '+8% open rate' },
    { id: 3, type: 'Frequency', recommendation: 'Reduce send frequency to 2x per week', impact: '-15% unsubscribes' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>AI Recommendations</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Actionable insights to improve your email performance.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {recommendations.map(rec => (
          <div key={rec.id} style={{ background: '#f9fafb', borderRadius: 10, padding: 20, border: '1px solid #f9fafb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
              <span style={{ background: '#ede9fe', color: '#6366f1', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{rec.type}</span>
              <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{rec.impact}</span>
            </div>
            <div style={{ fontSize: 15, color: '#2e3045', marginBottom: 12 }}>{rec.recommendation}</div>
            <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}>Apply</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================================
// CATEGORY 3: WORKFLOWS (6 tabs)
// ========================================

function WorkflowBuilderTab({ workflows, setWorkflows }) {
  useEffect(() => {
    if (workflows.length === 0) {
      setWorkflows([
        { id: 1, name: 'Welcome Series', trigger: 'User signs up', status: 'active', runs: 1523 },
        { id: 2, name: 'Abandoned Cart', trigger: 'Cart abandoned', status: 'active', runs: 892 },
        { id: 3, name: 'Re-engagement', trigger: 'Inactive 30 days', status: 'paused', runs: 234 },
      ]);
    }
  }, [workflows, setWorkflows]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Workflow Builder</h2>
        <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>+ New Workflow</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f9fafb' }}>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#8b8fa8' }}>Workflow Name</th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#8b8fa8' }}>Trigger</th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#8b8fa8' }}>Status</th>
            <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#8b8fa8' }}>Total Runs</th>
            <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#8b8fa8' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map(workflow => (
            <tr key={workflow.id} style={{ borderBottom: '1px solid #f9fafb' }}>
              <td style={{ padding: 12, fontWeight: 500 }}>{workflow.name}</td>
              <td style={{ padding: 12, color: '#8b8fa8' }}>{workflow.trigger}</td>
              <td style={{ padding: 12 }}>
                <span style={{ 
                  background: workflow.status === 'active' ? '#d1fae5' : '#fee2e2',
                  color: workflow.status === 'active' ? '#059669' : '#dc2626',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                }}>{workflow.status}</span>
              </td>
              <td style={{ padding: 12, textAlign: 'right' }}>{workflow.runs.toLocaleString()}</td>
              <td style={{ padding: 12, textAlign: 'right' }}>
                <button style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TriggersEventsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Triggers & Events</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Configure automation triggers based on user behavior and events.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Trigger configuration coming soon...
      </div>
    </div>
  );
}

function ConditionalLogicTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Conditional Logic</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Add smart branching and decision points to workflows.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Conditional logic builder coming soon...
      </div>
    </div>
  );
}

function ActionsLibraryTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Actions Library</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Browse available actions for your workflows.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Actions library coming soon...
      </div>
    </div>
  );
}

function WorkflowMonitoringTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Workflow Monitoring</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Monitor active workflows and execution status in real-time.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Workflow monitoring dashboard coming soon...
      </div>
    </div>
  );
}

function ExecutionHistoryTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Execution History</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>View past workflow executions and debug logs.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Execution history coming soon...
      </div>
    </div>
  );
}

// ========================================
// CATEGORY 4: MULTI-CHANNEL (5 tabs)
// ========================================

function SMSCampaignsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>SMS Campaigns</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Create and manage SMS text message campaigns.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        SMS campaign builder coming soon...
      </div>
    </div>
  );
}

function PushNotificationsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Push Notifications</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Send mobile and web push notifications.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Push notification builder coming soon...
      </div>
    </div>
  );
}

function WebhooksTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Webhooks</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Configure webhooks for external integrations.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Webhook configuration coming soon...
      </div>
    </div>
  );
}

function ChannelOrchestrationTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Channel Orchestration</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Coordinate campaigns across email, SMS, and push.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Multi-channel orchestration coming soon...
      </div>
    </div>
  );
}

function ChannelPreferencesTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Channel Preferences</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Manage customer communication channel preferences.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Channel preference center coming soon...
      </div>
    </div>
  );
}

// ========================================
// CATEGORY 5: ANALYTICS (6 tabs)
// ========================================

function AnalyticsDashboardTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Analytics Dashboard</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Real-time email marketing performance metrics.</p>
      
      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#ede9fe', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Open Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>42.3%</div>
          <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>↑ 5.2% from last month</div>
        </div>
        <div style={{ background: '#dbeafe', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Click Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>8.7%</div>
          <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>↑ 2.1% from last month</div>
        </div>
        <div style={{ background: '#d1fae5', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Conversion Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>3.2%</div>
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>↓ 0.4% from last month</div>
        </div>
        <div style={{ background: '#fef3c7', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, color: '#8b8fa8', marginBottom: 4 }}>Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>$57,681</div>
          <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>↑ 12.3% from last month</div>
        </div>
      </div>
    </div>
  );
}

function CampaignReportsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Campaign Reports</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Detailed performance reports for each campaign.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Campaign reports coming soon...
      </div>
    </div>
  );
}

function RevenueAttributionTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Revenue Attribution</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Track revenue generated by email campaigns.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Revenue attribution dashboard coming soon...
      </div>
    </div>
  );
}

function EngagementMetricsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Engagement Metrics</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Analyze opens, clicks, and engagement trends.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Engagement analytics coming soon...
      </div>
    </div>
  );
}

function DeliverabilityTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Deliverability</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Monitor inbox placement and deliverability metrics.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Deliverability dashboard coming soon...
      </div>
    </div>
  );
}

function DataExportTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Data Export</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Export analytics data in various formats.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Data export tools coming soon...
      </div>
    </div>
  );
}

// ========================================
// CATEGORY 6: TESTING & OPTIMIZATION (6 tabs)
// ========================================

function ABTestingTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>A/B Testing</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Run split tests to optimize email performance.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        A/B testing interface coming soon...
      </div>
    </div>
  );
}

function MultivariateTestingTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Multivariate Testing</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Test multiple variables simultaneously.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Multivariate testing coming soon...
      </div>
    </div>
  );
}

function ExperimentsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Experiments</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Manage all active and past experiments.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Experiment management coming soon...
      </div>
    </div>
  );
}

function FrequencyOptimizationTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Frequency Optimization</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Find the optimal send frequency for your audience.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Frequency optimizer coming soon...
      </div>
    </div>
  );
}

function ContentTestingTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Content Testing</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Test different content variations.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Content testing tools coming soon...
      </div>
    </div>
  );
}

function TestResultsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Test Results</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>View results and insights from all tests.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Test results dashboard coming soon...
      </div>
    </div>
  );
}

// ========================================
// CATEGORY 7: SETTINGS & ADMIN (4 tabs)
// ========================================

function GeneralSettingsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>General Settings</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Configure basic email automation settings.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        General settings coming soon...
      </div>
    </div>
  );
}

function TeamPermissionsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Team & Permissions</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Manage team members and role-based access control.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Team management coming soon...
      </div>
    </div>
  );
}

function ComplianceGDPRTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Compliance & GDPR</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Legal compliance, consent management, and GDPR tools.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Compliance tools coming soon...
      </div>
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Integrations</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Connect third-party apps and services.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Integrations marketplace coming soon...
      </div>
    </div>
  );
}

// ========================================
// CATEGORY 8: ADVANCED (3 tabs)
// ========================================

function APIDeveloperTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>API & Developer</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>API documentation, keys, and developer tools.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Developer portal coming soon...
      </div>
    </div>
  );
}

function CustomFieldsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Custom Fields</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Create and manage custom data fields for subscribers.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Custom fields manager coming soon...
      </div>
    </div>
  );
}

function CustomAutomationTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Custom Automation Rules</h2>
      <p style={{ color: '#8b8fa8', marginBottom: 24 }}>Build advanced custom automation logic.</p>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8b8fa8' }}>
        Custom automation builder coming soon...
      </div>
    </div>
  );
}



