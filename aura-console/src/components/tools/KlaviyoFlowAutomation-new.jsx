import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './KlaviyoFlowAutomation.css';

const KlaviyoFlowAutomation = () => {
  const [activeCategory, setActiveCategory] = useState('flow-builder');
  const [activeTab, setActiveTab] = useState('flow-templates');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Tab configuration with 42 tabs across 8 categories
  const categories = {
    'flow-builder': {
      name: 'Flow Builder',
      icon: '🔄',
      tabs: [
        { id: 'flow-templates', label: 'Flow Templates', endpoint: '/flow-templates' },
        { id: 'flows', label: 'Flows', endpoint: '/flows' },
        { id: 'triggers', label: 'Triggers', endpoint: '/triggers' },
        { id: 'actions', label: 'Actions', endpoint: '/actions' },
        { id: 'campaigns', label: 'Campaigns', endpoint: '/campaigns' }
      ]
    },
    'messaging': {
      name: 'Messaging',
      icon: '📧',
      tabs: [
        { id: 'email-templates', label: 'Email Templates', endpoint: '/email-templates' },
        { id: 'sms-templates', label: 'SMS Templates', endpoint: '/sms-templates' },
        { id: 'push-templates', label: 'Push Templates', endpoint: '/push-templates' },
        { id: 'messages', label: 'Messages', endpoint: '/messages' },
        { id: 'send-history', label: 'Send History', endpoint: '/send-history' },
        { id: 'channel-stats', label: 'Channel Stats', endpoint: '/channel-stats/email' }
      ]
    },
    'contacts-segments': {
      name: 'Contacts & Segments',
      icon: '👥',
      tabs: [
        { id: 'contacts', label: 'Contacts', endpoint: '/contacts' },
        { id: 'segments', label: 'Segments', endpoint: '/segments' },
        { id: 'lists', label: 'Lists', endpoint: '/lists' },
        { id: 'audiences', label: 'Audiences', endpoint: '/audiences' },
        { id: 'import-jobs', label: 'Import Jobs', endpoint: '/import-jobs' }
      ]
    },
    'analytics': {
      name: 'Analytics & Reporting',
      icon: '📊',
      tabs: [
        { id: 'metrics', label: 'Metrics', endpoint: '/metrics' },
        { id: 'reports', label: 'Reports', endpoint: '/reports' },
        { id: 'dashboards', label: 'Dashboards', endpoint: '/dashboards' },
        { id: 'insights', label: 'Insights', endpoint: '/insights' },
        { id: 'events', label: 'Events', endpoint: '/events' },
        { id: 'attribution', label: 'Attribution', endpoint: '/attribution-models' }
      ]
    },
    'ai-personalization': {
      name: 'AI & Personalization',
      icon: '🤖',
      tabs: [
        { id: 'predictions', label: 'Predictions', endpoint: '/predictions' },
        { id: 'personalization-rules', label: 'Personalization Rules', endpoint: '/personalization-rules' },
        { id: 'recommendations', label: 'Recommendations', endpoint: '/recommendations' },
        { id: 'ab-tests', label: 'A/B Tests', endpoint: '/ab-tests' },
        { id: 'ml-models', label: 'ML Models', endpoint: '/ml-models' }
      ]
    },
    'automation': {
      name: 'Automation & Scheduling',
      icon: '⚙️',
      tabs: [
        { id: 'automation-rules', label: 'Automation Rules', endpoint: '/automation-rules' },
        { id: 'schedules', label: 'Schedules', endpoint: '/schedules' },
        { id: 'jobs', label: 'Jobs', endpoint: '/jobs' },
        { id: 'delays', label: 'Delays', endpoint: '/delays' },
        { id: 'workflows', label: 'Workflows', endpoint: '/workflows' }
      ]
    },
    'integrations': {
      name: 'Integrations & Settings',
      icon: '🔌',
      tabs: [
        { id: 'integrations', label: 'Integrations', endpoint: '/integrations' },
        { id: 'webhooks', label: 'Webhooks', endpoint: '/webhooks' },
        { id: 'api-keys', label: 'API Keys', endpoint: '/api-keys' },
        { id: 'settings', label: 'Settings', endpoint: '/settings/general' },
        { id: 'connections', label: 'Connections', endpoint: '/connections' }
      ]
    },
    'advanced': {
      name: 'Advanced Features',
      icon: '🚀',
      tabs: [
        { id: 'versions', label: 'Version History', endpoint: '/versions' },
        { id: 'templates-library', label: 'Templates Library', endpoint: '/templates' },
        { id: 'compliance', label: 'Compliance', endpoint: '/compliance-rules' },
        { id: 'audit-logs', label: 'Audit Logs', endpoint: '/audit-logs' },
        { id: 'backups', label: 'Backups', endpoint: '/backups' },
        { id: 'exports', label: 'Exports', endpoint: '/exports' }
      ]
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentTab = getCurrentTab();
      if (currentTab && currentTab.endpoint) {
        const response = await axios.get(`/api/klaviyo-flow-automation${currentTab.endpoint}`);
        setData(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTab = () => {
    for (const category of Object.values(categories)) {
      const tab = category.tabs.find(t => t.id === activeTab);
      if (tab) return tab;
    }
    return null;
  };

  const handleCreate = async (item) => {
    const currentTab = getCurrentTab();
    try {
      await axios.post(`/api/klaviyo-flow-automation${currentTab.endpoint}`, item);
      loadData();
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleUpdate = async (id, updates) => {
    const currentTab = getCurrentTab();
    try {
      await axios.put(`/api/klaviyo-flow-automation${currentTab.endpoint}/${id}`, updates);
      loadData();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDelete = async (id) => {
    const currentTab = getCurrentTab();
    try {
      await axios.delete(`/api/klaviyo-flow-automation${currentTab.endpoint}/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Render functions for each tab type
  const renderFlowTemplates = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Flow Templates</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Template
        </button>
      </div>
      <div className="klaviyo-grid">
        {Array.isArray(data) && data.map(template => (
          <div key={template.id} className="klaviyo-card">
            <h3>{template.name}</h3>
            <p className="meta">Category: {template.category}</p>
            <p className="meta">Channel: {template.channel}</p>
            <p>Estimated Revenue: ${template.estimatedRevenue}</p>
            <div className="actions">
              <button onClick={() => setSelectedItem(template)}>Edit</button>
              <button onClick={() => handleDelete(template.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFlows = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Flows</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Flow
        </button>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Triggered</th>
              <th>Completed</th>
              <th>Conversion Rate</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(flow => (
              <tr key={flow.id}>
                <td>{flow.name}</td>
                <td><span className={`status-badge ${flow.status}`}>{flow.status}</span></td>
                <td>{flow.stats?.triggered || 0}</td>
                <td>{flow.stats?.completed || 0}</td>
                <td>{flow.stats?.conversionRate || 0}%</td>
                <td>${flow.stats?.revenue || 0}</td>
                <td>
                  <button onClick={() => setSelectedItem(flow)}>View</button>
                  {flow.status === 'active' && <button onClick={() => handleUpdate(flow.id, { status: 'paused' })}>Pause</button>}
                  {flow.status === 'paused' && <button onClick={() => handleUpdate(flow.id, { status: 'active' })}>Activate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTriggers = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Triggers</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Trigger
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(trigger => (
          <div key={trigger.id} className="klaviyo-list-item">
            <div className="item-header">
              <h3>{trigger.name}</h3>
              <span className={`badge ${trigger.enabled ? 'enabled' : 'disabled'}`}>
                {trigger.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p>Type: {trigger.type}</p>
            <p>Event: {trigger.event}</p>
            <p>Triggered: {trigger.stats?.triggered || 0} times</p>
            <div className="actions">
              <button onClick={() => setSelectedItem(trigger)}>Edit</button>
              <button onClick={async () => {
                await axios.post(`/api/klaviyo-flow-automation/triggers/${trigger.id}/test`, {});
                alert('Test triggered!');
              }}>Test</button>
              <button onClick={() => handleDelete(trigger.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActions = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Actions</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Action
        </button>
      </div>
      <div className="klaviyo-grid">
        {Array.isArray(data) && data.map(action => (
          <div key={action.id} className="klaviyo-card">
            <h3>{action.name}</h3>
            <p>Type: {action.type}</p>
            <p>Channel: {action.channel}</p>
            <div className="stats">
              <span>Executed: {action.stats?.executed || 0}</span>
              <span>Success: {action.stats?.succeeded || 0}</span>
              <span>Failed: {action.stats?.failed || 0}</span>
            </div>
            <div className="actions">
              <button onClick={() => setSelectedItem(action)}>Edit</button>
              <button onClick={() => handleDelete(action.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCampaigns = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Campaigns</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Campaign
        </button>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Opened</th>
              <th>Converted</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(campaign => (
              <tr key={campaign.id}>
                <td>{campaign.name}</td>
                <td>{campaign.type}</td>
                <td><span className={`status-badge ${campaign.status}`}>{campaign.status}</span></td>
                <td>{campaign.stats?.sent || 0}</td>
                <td>{campaign.stats?.opened || 0}</td>
                <td>{campaign.stats?.converted || 0}</td>
                <td>${campaign.stats?.revenue || 0}</td>
                <td>
                  <button onClick={() => setSelectedItem(campaign)}>View</button>
                  {campaign.status === 'draft' && <button onClick={async () => {
                    await axios.post(`/api/klaviyo-flow-automation/campaigns/${campaign.id}/launch`);
                    loadData();
                  }}>Launch</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmailTemplates = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Email Templates</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Email Template
        </button>
      </div>
      <div className="klaviyo-grid">
        {Array.isArray(data) && data.map(template => (
          <div key={template.id} className="klaviyo-card">
            <h3>{template.name}</h3>
            <p className="subject">{template.subject}</p>
            <p>Category: {template.category}</p>
            <div className="stats">
              <span>Sent: {template.stats?.sent || 0}</span>
              <span>Open Rate: {template.stats?.openRate || 0}%</span>
              <span>Click Rate: {template.stats?.clickRate || 0}%</span>
            </div>
            <div className="actions">
              <button onClick={() => setSelectedItem(template)}>Edit</button>
              <button onClick={async () => {
                await handleCreate({ ...template, name: `${template.name} (Copy)` });
              }}>Clone</button>
              <button onClick={() => handleDelete(template.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSMSTemplates = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>SMS Templates</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create SMS Template
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(template => (
          <div key={template.id} className="klaviyo-list-item">
            <h3>{template.name}</h3>
            <p className="message">{template.message}</p>
            <p>Category: {template.category}</p>
            <div className="stats">
              <span>Sent: {template.stats?.sent || 0}</span>
              <span>Delivery Rate: {template.stats?.deliveryRate || 0}%</span>
            </div>
            <div className="actions">
              <button onClick={() => setSelectedItem(template)}>Edit</button>
              <button onClick={() => handleDelete(template.id)}>Delete</button>
            </div>
          </div>
        ))}
       </div>
    </div>
  );

  const renderPushTemplates = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Push Notification Templates</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Push Template
        </button>
      </div>
      <div className="klaviyo-grid">
        {Array.isArray(data) && data.map(template => (
          <div key={template.id} className="klaviyo-card">
            <h3>{template.title}</h3>
            <p>{template.body}</p>
            <p>Platform: {template.platform}</p>
            <div className="stats">
              <span>Sent: {template.stats?.sent || 0}</span>
              <span>Open Rate: {template.stats?.openRate || 0}%</span>
            </div>
            <div className="actions">
              <button onClick={() => setSelectedItem(template)}>Edit</button>
              <button onClick={() => handleDelete(template.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Messages</h2>
        <button onClick={() => loadData()} className="klaviyo-btn-secondary">Refresh</button>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>To</th>
              <th>Status</th>
              <th>Sent At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(message => (
              <tr key={message.id}>
                <td>{message.id}</td>
                <td><span className="type-badge">{message.type}</span></td>
                <td>{message.to}</td>
                <td><span className={`status-badge ${message.status}`}>{message.status}</span></td>
                <td>{message.sentAt ? new Date(message.sentAt).toLocaleString() : 'Pending'}</td>
                <td>
                  <button onClick={() => setSelectedItem(message)}>View</button>
                  {message.status === 'failed' && <button onClick={async () => {
                    await axios.post(`/api/klaviyo-flow-automation/messages/${message.id}/retry`);
                    loadData();
                  }}>Retry</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Contacts</h2>
        <div className="header-actions">
          <input type="text" placeholder="Search contacts..." className="search-input" />
          <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
            Add Contact
          </button>
        </div>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Status</th>
              <th>Tags</th>
              <th>Total Spent</th>
              <th>Orders</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(contact => (
              <tr key={contact.id}>
                <td>{contact.email}</td>
                <td>{contact.firstName} {contact.lastName}</td>
                <td><span className={`status-badge ${contact.status}`}>{contact.status}</span></td>
                <td>{contact.tags?.join(', ') || 'None'}</td>
                <td>${contact.totalSpent || 0}</td>
                <td>{contact.orderCount || 0}</td>
                <td>
                  <button onClick={() => setSelectedItem(contact)}>Edit</button>
                  {contact.status === 'unsubscribed' && <button onClick={async () => {
                    await axios.post(`/api/klaviyo-flow-automation/contacts/${contact.id}/subscribe`);
                    loadData();
                  }}>Subscribe</button>}
                  <button onClick={() => handleDelete(contact.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSegments = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Segments</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Segment
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(segment => (
          <div key={segment.id} className="klaviyo-list-item">
            <div className="item-header">
              <h3>{segment.name}</h3>
              <span className="badge">{segment.type}</span>
            </div>
            <p>Total Contacts: {segment.stats?.totalContacts || 0}</p>
            <p>Auto-update: {segment.autoUpdate ? 'Yes' : 'No'}</p>
            {segment.lastComputedAt && (
              <p className="meta">Last computed: {new Date(segment.lastComputedAt).toLocaleString()}</p>
            )}
            <div className="actions">
              <button onClick={() => setSelectedItem(segment)}>Edit</button>
              {segment.type === 'dynamic' && <button onClick={async () => {
                await axios.post(`/api/klaviyo-flow-automation/segments/${segment.id}/compute`);
                loadData();
              }}>Recompute</button>}
              <button onClick={() => handleDelete(segment.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLists = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Lists</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create List
        </button>
      </div>
      <div className="klaviyo-grid">
        {Array.isArray(data) && data.map(list => (
          <div key={list.id} className="klaviyo-card">
            <h3>{list.name}</h3>
            <p>{list.description}</p>
            <div className="stats">
              <span>Total: {list.stats?.totalContacts || 0}</span>
              <span>Subscribed: {list.stats?.subscribedContacts || 0}</span>
              <span>Growth: {list.stats?.growthRate || 0}%</span>
            </div>
            <div className="actions">
              <button onClick={() => setSelectedItem(list)}>Edit</button>
              <button onClick={() => handleDelete(list.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAudiences = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Audiences</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Audience
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(audience => (
          <div key={audience.id} className="klaviyo-list-item">
            <h3>{audience.name}</h3>
            <p>Estimated Reach: {audience.estimatedReach || 0}</p>
            <p>Segments: {audience.segmentIds?.length || 0}</p>
            <p>Lists: {audience.listIds?.length || 0}</p>
            <div className="actions">
              <button onClick={() => setSelectedItem(audience)}>Edit</button>
              <button onClick={async () => {
                await axios.post(`/api/klaviyo-flow-automation/audiences/${audience.id}/compute`);
                loadData();
              }}>Recompute</button>
              <button onClick={() => handleDelete(audience.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Metrics</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Track Metric
        </button>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Value</th>
              <th>Flow ID</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(metric => (
              <tr key={metric.id}>
                <td>{metric.name}</td>
                <td>{metric.type}</td>
                <td>{metric.value}</td>
                <td>{metric.flowId || 'N/A'}</td>
                <td>{new Date(metric.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Reports</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Report
        </button>
      </div>
      <div className="klaviyo-grid">
        {Array.isArray(data) && data.map(report => (
          <div key={report.id} className="klaviyo-card">
            <h3>{report.name}</h3>
            <p>Type: {report.type}</p>
            <p>Metrics: {report.metrics?.length || 0}</p>
            {report.lastGeneratedAt && (
              <p className="meta">Last generated: {new Date(report.lastGeneratedAt).toLocaleString()}</p>
            )}
            <div className="actions">
              <button onClick={() => setSelectedItem(report)}>Edit</button>
              <button onClick={async () => {
                const response = await axios.post(`/api/klaviyo-flow-automation/reports/${report.id}/generate`);
                alert('Report generated!');
                console.log(response.data);
              }}>Generate</button>
              <button onClick={() => handleDelete(report.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDashboards = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Dashboards</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Dashboard
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(dashboard => (
          <div key={dashboard.id} className="klaviyo-list-item">
            <h3>{dashboard.name}</h3>
            <p>Widgets: {dashboard.widgets?.length || 0}</p>
            <p>Layout: {dashboard.layout}</p>
            <p>Refresh Interval: {dashboard.refreshInterval}s</p>
            <div className="actions">
              <button onClick={() => setSelectedItem(dashboard)}>View</button>
              <button onClick={() => setSelectedItem(dashboard)}>Edit</button>
              <button onClick={() => handleDelete(dashboard.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>AI Insights</h2>
        <button onClick={async () => {
          await axios.post('/api/klaviyo-flow-automation/insights/generate', {});
          loadData();
        }} className="klaviyo-btn-primary">
          Generate Insights
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(insight => (
          <div key={insight.id} className={`klaviyo-list-item insight-${insight.impact}`}>
            <div className="item-header">
              <h3>{insight.title}</h3>
              <span className={`badge impact-${insight.impact}`}>{insight.impact} impact</span>
            </div>
            <p>{insight.description}</p>
            <p className="recommendation"><strong>Recommendation:</strong> {insight.recommendation}</p>
            <p className="meta">Generated: {new Date(insight.generatedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPredictions = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>AI Predictions</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          New Prediction
        </button>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Contact ID</th>
              <th>Score</th>
              <th>Confidence</th>
              <th>Recommendation</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(prediction => (
              <tr key={prediction.id}>
                <td><span className="type-badge">{prediction.type}</span></td>
                <td>{prediction.contactId}</td>
                <td>{prediction.score.toFixed(2)}</td>
                <td>{(prediction.confidence * 100).toFixed(0)}%</td>
                <td>{prediction.recommendation}</td>
                <td>{new Date(prediction.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPersonalizationRules = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Personalization Rules</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Rule
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(rule => (
          <div key={rule.id} className="klaviyo-list-item">
            <div className="item-header">
              <h3>{rule.name}</h3>
              <span className={`badge ${rule.active ? 'active' : 'inactive'}`}>
                {rule.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p>Type: {rule.type}</p>
            <p>Priority: {rule.priority}</p>
            <p>Conditions: {rule.conditions?.length || 0}</p>
            <div className="actions">
              <button onClick={() => setSelectedItem(rule)}>Edit</button>
              <button onClick={() => handleDelete(rule.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderABTests = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>A/B Tests</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create A/B Test
        </button>
      </div>
      <div className="klaviyo-grid">
        {Array.isArray(data) && data.map(test => (
          <div key={test.id} className="klaviyo-card">
            <h3>{test.name}</h3>
            <p>Type: {test.type}</p>
            <p>Status: <span className={`status-badge ${test.status}`}>{test.status}</span></p>
            <p>Variants: {test.variants?.length || 0}</p>
            {test.results?.winner && (
              <p className="winner">Winner: {test.results.winner} ({test.results.confidence}% confidence)</p>
            )}
            <div className="actions">
              <button onClick={() => setSelectedItem(test)}>View Results</button>
              <button onClick={() => setSelectedItem(test)}>Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAutomationRules = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Automation Rules</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Rule
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(rule => (
          <div key={rule.id} className="klaviyo-list-item">
            <div className="item-header">
              <h3>{rule.name}</h3>
              <span className={`badge ${rule.status}`}>{rule.status}</span>
            </div>
            <p>Type: {rule.type}</p>
            <p>Priority: {rule.priority}</p>
            <p>Executions: {rule.executionCount || 0}</p>
            {rule.lastExecutedAt && (
              <p className="meta">Last executed: {new Date(rule.lastExecutedAt).toLocaleString()}</p>
            )}
            <div className="actions">
              <button onClick={() => setSelectedItem(rule)}>Edit</button>
              <button onClick={async () => {
                await axios.post(`/api/klaviyo-flow-automation/automation-rules/${rule.id}/execute`, {});
                loadData();
              }}>Execute</button>
              <button onClick={() => handleDelete(rule.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSchedules = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Schedules</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Schedule
        </button>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Cron</th>
              <th>Status</th>
              <th>Next Run</th>
              <th>Executions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(schedule => (
              <tr key={schedule.id}>
                <td>{schedule.name}</td>
                <td>{schedule.type}</td>
                <td><code>{schedule.cronExpression}</code></td>
                <td><span className={`status-badge ${schedule.status}`}>{schedule.status}</span></td>
                <td>{schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : 'N/A'}</td>
                <td>{schedule.executionCount || 0}</td>
                <td>
                  <button onClick={() => setSelectedItem(schedule)}>Edit</button>
                  {schedule.status === 'active' && <button onClick={async () => {
                    await axios.post(`/api/klaviyo-flow-automation/schedules/${schedule.id}/pause`);
                    loadData();
                  }}>Pause</button>}
                  {schedule.status === 'paused' && <button onClick={async () => {
                    await axios.post(`/api/klaviyo-flow-automation/schedules/${schedule.id}/resume`);
                    loadData();
                  }}>Resume</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Jobs Queue</h2>
        <button onClick={() => loadData()} className="klaviyo-btn-secondary">Refresh</button>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Attempts</th>
              <th>Scheduled For</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(job => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>{job.name}</td>
                <td>{job.type}</td>
                <td><span className={`status-badge ${job.status}`}>{job.status}</span></td>
                <td>{job.priority}</td>
                <td>{job.attempts}/{job.maxAttempts}</td>
                <td>{new Date(job.scheduledFor).toLocaleString()}</td>
                <td>
                  {job.status === 'queued' && <button onClick={async () => {
                    await axios.post(`/api/klaviyo-flow-automation/jobs/${job.id}/process`);
                    loadData();
                  }}>Process</button>}
                  {job.status === 'failed' && <button onClick={async () => {
                    await axios.post(`/api/klaviyo-flow-automation/jobs/${job.id}/retry`);
                    loadData();
                  }}>Retry</button>}
                  {['queued', 'processing'].includes(job.status) && <button onClick={async () => {
                    await axios.post(`/api/klaviyo-flow-automation/jobs/${job.id}/cancel`);
                    loadData();
                  }}>Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWorkflows = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Workflows</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Workflow
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(workflow => (
          <div key={workflow.id} className="klaviyo-list-item">
            <div className="item-header">
              <h3>{workflow.name}</h3>
              <span className={`status-badge ${workflow.status}`}>{workflow.status}</span>
            </div>
            <p>Steps: {workflow.steps?.length || 0}</p>
            <p>Current Step: {workflow.currentStep + 1}</p>
            {workflow.startedAt && (
              <p className="meta">Started: {new Date(workflow.startedAt).toLocaleString()}</p>
            )}
            <div className="actions">
              <button onClick={() => setSelectedItem(workflow)}>View</button>
              {workflow.status === 'pending' && <button onClick={async () => {
                await axios.post(`/api/klaviyo-flow-automation/workflows/${workflow.id}/execute`);
                loadData();
              }}>Execute</button>}
              {workflow.status === 'running' && <button onClick={async () => {
                await axios.post(`/api/klaviyo-flow-automation/workflows/${workflow.id}/pause`);
                loadData();
              }}>Pause</button>}
              {workflow.status === 'paused' && <button onClick={async () => {
                await axios.post(`/api/klaviyo-flow-automation/workflows/${workflow.id}/resume`);
                loadData();
              }}>Resume</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Integrations</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Add Integration
        </button>
      </div>
      <div className="klaviyo-grid">
        {Array.isArray(data) && data.map(integration => (
          <div key={integration.id} className="klaviyo-card">
            <h3>{integration.name}</h3>
            <p>Provider: {integration.provider}</p>
            <p>Status: <span className={`status-badge ${integration.status}`}>{integration.status}</span></p>
            <div className="stats">
              <span>Syncs: {integration.stats?.totalSyncs || 0}</span>
              <span>Success: {integration.stats?.successfulSyncs || 0}</span>
            </div>
            <div className="actions">
              <button onClick={() => setSelectedItem(integration)}>Edit</button>
              <button onClick={async () => {
                const response = await axios.post(`/api/klaviyo-flow-automation/integrations/${integration.id}/test`);
                alert(response.data.data.message);
              }}>Test</button>
              <button onClick={async () => {
                await axios.post(`/api/klaviyo-flow-automation/integrations/${integration.id}/sync`);
                loadData();
              }}>Sync</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWebhooks = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Webhooks</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Webhook
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(webhook => (
          <div key={webhook.id} className="klaviyo-list-item">
            <div className="item-header">
              <h3>{webhook.name}</h3>
              <span className={`badge ${webhook.status}`}>{webhook.status}</span>
            </div>
            <p><code>{webhook.url}</code></p>
            <p>Events: {webhook.events?.join(', ')}</p>
            <div className="stats">
              <span>Calls: {webhook.stats?.totalCalls || 0}</span>
              <span>Success: {webhook.stats?.successfulCalls || 0}</span>
              <span>Avg Latency: {webhook.stats?.averageLatency?.toFixed(0) || 0}ms</span>
            </div>
            <div className="actions">
              <button onClick={() => setSelectedItem(webhook)}>Edit</button>
              <button onClick={async () => {
                await axios.post(`/api/klaviyo-flow-automation/webhooks/${webhook.id}/test`);
                alert('Test webhook sent!');
              }}>Test</button>
              <button onClick={() => handleDelete(webhook.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAPIKeys = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>API Keys</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create API Key
        </button>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Last Used</th>
              <th>Usage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(key => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td><code>{key.key}</code></td>
                <td>{key.permissions?.join(', ')}</td>
                <td><span className={`status-badge ${key.status}`}>{key.status}</span></td>
                <td>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}</td>
                <td>{key.usageCount || 0}</td>
                <td>
                  <button onClick={async () => {
                    if (confirm('Revoke this API key?')) {
                      await axios.post(`/api/klaviyo-flow-automation/api-keys/${key.id}/revoke`);
                      loadData();
                    }
                  }}>Revoke</button>
                  <button onClick={async () => {
                    const response = await axios.post(`/api/klaviyo-flow-automation/api-keys/${key.id}/rotate`);
                    alert('New key: ' + response.data.data.key);
                    loadData();
                  }}>Rotate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Settings</h2>
        <button onClick={() => loadData()} className="klaviyo-btn-secondary">Refresh</button>
      </div>
      <div className="settings-form">
        <h3>General Settings</h3>
        {typeof data === 'object' && !Array.isArray(data) && Object.keys(data).map(key => (
          <div key={key} className="setting-item">
            <label>{key}</label>
            <input type="text" value={data[key]} onChange={(e) => {
              const newData = { ...data, [key]: e.target.value };
              setData(newData);
            }} />
          </div>
        ))}
        <button onClick={async () => {
          await axios.put('/api/klaviyo-flow-automation/settings/general', data);
          alert('Settings saved!');
        }} className="klaviyo-btn-primary">Save Settings</button>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Audit Logs</h2>
        <button onClick={() => loadData()} className="klaviyo-btn-secondary">Refresh</button>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Entity ID</th>
              <th>User</th>
              <th>IP Address</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(log => (
              <tr key={log.id}>
                <td><span className="action-badge">{log.action}</span></td>
                <td>{log.entityType}</td>
                <td>{log.entityId}</td>
                <td>{log.userId}</td>
                <td>{log.ipAddress || 'N/A'}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBackups = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Backups</h2>
        <button onClick={async () => {
          await axios.post('/api/klaviyo-flow-automation/backups', { type: 'full' });
          loadData();
        }} className="klaviyo-btn-primary">
          Create Backup
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(backup => (
          <div key={backup.id} className="klaviyo-list-item">
            <div className="item-header">
              <h3>{backup.name}</h3>
              <span className={`status-badge ${backup.status}`}>{backup.status}</span>
            </div>
            <p>Type: {backup.type}</p>
            <p>Size: {(backup.size / 1024 / 1024).toFixed(2)} MB</p>
            <p>Created: {new Date(backup.createdAt).toLocaleString()}</p>
            <div className="actions">
              {backup.status === 'completed' && <button onClick={async () => {
                if (confirm('Restore this backup?')) {
                  await axios.post(`/api/klaviyo-flow-automation/backups/${backup.id}/restore`);
                  alert('Backup restored successfully!');
                }
              }}>Restore</button>}
              <button onClick={() => handleDelete(backup.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Compliance Rules</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Rule
        </button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(rule => (
          <div key={rule.id} className="klaviyo-list-item">
            <div className="item-header">
              <h3>{rule.name}</h3>
              <span className={`badge severity-${rule.severity}`}>{rule.severity}</span>
            </div>
            <p>Type: {rule.type}</p>
            <p>{rule.description}</p>
            <p>Checks: {rule.checks?.length || 0}</p>
            <div className="actions">
              <button onClick={() => setSelectedItem(rule)}>Edit</button>
              <button onClick={() => handleDelete(rule.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExports = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Data Exports</h2>
        <button onClick={() => setSelectedItem({ type: 'create' })} className="klaviyo-btn-primary">
          Create Export
        </button>
      </div>
      <div className="klaviyo-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Format</th>
              <th>Status</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map(exportJob => (
              <tr key={exportJob.id}>
                <td>{exportJob.name}</td>
                <td>{exportJob.type}</td>
                <td>{exportJob.format}</td>
                <td><span className={`status-badge ${exportJob.status}`}>{exportJob.status}</span></td>
                <td>{new Date(exportJob.createdAt).toLocaleString()}</td>
                <td>{exportJob.expiresAt ? new Date(exportJob.expiresAt).toLocaleString() : 'N/A'}</td>
                <td>
                  {exportJob.status === 'completed' && exportJob.downloadUrl && (
                    <a href={exportJob.downloadUrl} download className="klaviyo-btn-secondary">Download</a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVersions = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>Version History</h2>
        <button onClick={() => loadData()} className="klaviyo-btn-secondary">Refresh</button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.map(version => (
          <div key={version.id} className="klaviyo-list-item">
            <h3>Version {version.version}</h3>
            <p>Entity: {version.entityType} ({version.entityId})</p>
            <p>Created by: {version.createdBy}</p>
            <p>Message: {version.changeMessage}</p>
            <p className="meta">Created: {new Date(version.createdAt).toLocaleString()}</p>
            <div className="actions">
              <button onClick={async () => {
                if (confirm('Restore this version?')) {
                  await axios.post(`/api/klaviyo-flow-automation/versions/${version.id}/restore`);
                  alert('Version restored!');
                }
              }}>Restore</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Generic renderer for remaining tabs
  const renderGenericList = () => (
    <div className="klaviyo-content">
      <div className="klaviyo-header">
        <h2>{getCurrentTab()?.label || 'Data'}</h2>
        <button onClick={() => loadData()} className="klaviyo-btn-secondary">Refresh</button>
      </div>
      <div className="klaviyo-list">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((item, index) => (
            <div key={item.id || index} className="klaviyo-list-item">
              <pre>{JSON.stringify(item, null, 2)}</pre>
            </div>
          ))
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    const renderers = {
      // Flow Builder
      'flow-templates': renderFlowTemplates,
      'flows': renderFlows,
      'triggers': renderTriggers,
      'actions': renderActions,
      'campaigns': renderCampaigns,
      // Messaging
      'email-templates': renderEmailTemplates,
      'sms-templates': renderSMSTemplates,
      'push-templates': renderPushTemplates,
      'messages': renderMessages,
      // Contacts & Segments
      'contacts': renderContacts,
      'segments': renderSegments,
      'lists': renderLists,
      'audiences': renderAudiences,
      // Analytics
      'metrics': renderMetrics,
      'reports': renderReports,
      'dashboards': renderDashboards,
      'insights': renderInsights,
      // AI & Personalization
      'predictions': renderPredictions,
      'personalization-rules': renderPersonalizationRules,
      'ab-tests': renderABTests,
      // Automation
      'automation-rules': renderAutomationRules,
      'schedules': renderSchedules,
      'jobs': renderJobs,
      'workflows': renderWorkflows,
      // Integrations
      'integrations': renderIntegrations,
      'webhooks': renderWebhooks,
      'api-keys': renderAPIKeys,
      'settings': renderSettings,
      // Advanced
      'audit-logs': renderAuditLogs,
      'backups': renderBackups,
      'compliance': renderCompliance,
      'exports': renderExports,
      'versions': renderVersions
    };

    const renderer = renderers[activeTab] || renderGenericList;
    return loading ? <div className="klaviyo-loading">Loading...</div> : renderer();
  };

  return (
    <div className="klaviyo-flow-automation">
      <div className="klaviyo-sidebar">
        <h1>Klaviyo Flow Automation</h1>
        {Object.entries(categories).map(([key, category]) => (
          <div key={key} className={`category ${activeCategory === key ? 'active' : ''}`}>
            <button 
              className="category-header"
              onClick={() => setActiveCategory(activeCategory === key ? '' : key)}
            >
              <span className="icon">{category.icon}</span>
              <span className="name">{category.name}</span>
            </button>
            {activeCategory === key && (
              <div className="tabs">
                {category.tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="klaviyo-main">
        {renderContent()}
      </div>
    </div>
  );
};

export default KlaviyoFlowAutomation;
