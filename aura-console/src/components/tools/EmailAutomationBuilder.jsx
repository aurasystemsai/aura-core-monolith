// ================================================================
// EMAIL AUTOMATION BUILDER - ENTERPRISE FRONTEND
// ================================================================
// Version: 2.0
// Tabs: 42 (across 7 categories)
// Line Target: ~3,500 lines
// ================================================================

import React, { useState, useEffect, useRef } from "react";

export default function EmailAutomationBuilder() {
  // Core state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data state
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [lists, setLists] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [abTests, setAbTests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [modalActive, setModalActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef();

  // Form state
  const [campaignForm, setCampaignForm] = useState({
    name: '', subject: '', preheader: '', fromName: '', fromEmail: '', replyTo: '', body: '', type: 'regular'
  });

  // API helper
  const api = async (endpoint, options = {}) => {
    const res = await fetch(`/api/email-automation${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) throw new Error('API error');
    return res.json();
  };

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, t, s, w] = await Promise.all([
        api('/campaigns'),
        api('/templates'),
        api('/segments'),
        api('/workflows')
      ]);
      setCampaigns(c.campaigns || []);
      setTemplates(t.templates || []);
      setSegments(s.segments || []);
      setWorkflows(w.workflows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // CATEGORY 1: MANAGE (8 tabs)
  // ================================================================

  const CampaignListTab = () => {
    const filtered = campaigns.filter(c => 
      (!searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Campaigns</h3>
          <div style={styles.actions}>
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <button onClick={() => setModalActive(true)} style={styles.primaryBtn}>
              Create Campaign
            </button>
          </div>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Type</th>
              <th>Sent</th>
              <th>Open Rate</th>
              <th>Click Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td><span style={getBadgeStyle(c.status)}>{c.status}</span></td>
                <td>{c.type}</td>
                <td>{c.stats.sent.toLocaleString()}</td>
                <td>{((c.stats.opens / c.stats.sent) * 100 || 0).toFixed(1)}%</td>
                <td>{((c.stats.clicks / c.stats.sent) * 100 || 0).toFixed(1)}%</td>
                <td>
                  <button onClick={() => handleViewCampaign(c.id)} style={styles.secondaryBtn}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const CampaignDetailsTab = () => {
    if (!selectedCampaign) {
      return (
        <div style={styles.emptyState}>
          <h3>No campaign selected</h3>
          <p>Select a campaign from the list to view details</p>
          <button onClick={() => setActiveTab(0)} style={styles.primaryBtn}>View Campaigns</button>
        </div>
      );
    }

    return (
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Campaign Information</h3>
          <div style={styles.detailsGrid}>
            <div><strong>Name:</strong> {selectedCampaign.name}</div>
            <div><strong>Subject:</strong> {selectedCampaign.subject}</div>
            <div><strong>From:</strong> {selectedCampaign.fromName} &lt;{selectedCampaign.fromEmail}&gt;</div>
            <div><strong>Status:</strong> <span style={getBadgeStyle(selectedCampaign.status)}>{selectedCampaign.status}</span></div>
          </div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Performance</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{selectedCampaign.stats.sent.toLocaleString()}</div>
              <div style={styles.statLabel}>Sent</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{selectedCampaign.stats.opens.toLocaleString()}</div>
              <div style={styles.statLabel}>Opens</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{selectedCampaign.stats.clicks.toLocaleString()}</div>
              <div style={styles.statLabel}>Clicks</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{((selectedCampaign.stats.opens / selectedCampaign.stats.sent) * 100 || 0).toFixed(1)}%</div>
              <div style={styles.statLabel}>Open Rate</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TemplatesTab = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Email Templates</h3>
        <button style={styles.primaryBtn}>Create Template</button>
      </div>
      <div style={styles.grid}>
        {templates.map(t => (
          <div key={t.id} style={styles.templateCard}>
            <h4>{t.name}</h4>
            <p style={styles.muted}>{t.category}</p>
            <div style={styles.cardActions}>
              <button style={styles.secondaryBtn}>Use</button>
              <button style={styles.secondaryBtn}>Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ContactsTab = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Contacts</h3>
        <button style={styles.primaryBtn}>Add Contact</button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Status</th>
            <th>Engagement Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map(c => (
            <tr key={c.id}>
              <td>{c.email}</td>
              <td>{c.firstName} {c.lastName}</td>
              <td><span style={getBadgeStyle(c.status)}>{c.status}</span></td>
              <td>{c.engagementScore}/100</td>
              <td><button style={styles.secondaryBtn}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const SegmentsTab = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Audience Segments</h3>
        <button style={styles.primaryBtn}>Create Segment</button>
      </div>
      <div style={styles.listContainer}>
        {segments.map(s => (
          <div key={s.id} style={styles.listItem}>
            <div>
              <h4>{s.name}</h4>
              <p style={styles.muted}>{s.type} • {s.contactCount || 0} contacts</p>
            </div>
            <button style={styles.secondaryBtn}>Manage</button>
          </div>
        ))}
      </div>
    </div>
  );

  const ListsTab = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Contact Lists</h3>
        <button style={styles.primaryBtn}>Create List</button>
      </div>
      <div style={styles.listContainer}>
        {lists.map(l => (
          <div key={l.id} style={styles.listItem}>
            <div>
              <h4>{l.name}</h4>
              <p style={styles.muted}>{l.contactCount || 0} contacts</p>
            </div>
            <button style={styles.secondaryBtn}>Manage</button>
          </div>
        ))}
      </div>
    </div>
  );

  const ScheduledTab = () => {
    const scheduled = campaigns.filter(c => c.status === 'scheduled');
    return (
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Scheduled Campaigns</h3>
        {scheduled.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No scheduled campaigns</p>
          </div>
        ) : (
          <div style={styles.listContainer}>
            {scheduled.map(c => (
              <div key={c.id} style={styles.listItem}>
                <div>
                  <h4>{c.name}</h4>
                  <p style={styles.muted}>Scheduled for: {new Date(c.scheduledAt).toLocaleString()}</p>
                </div>
                <button style={styles.dangerBtn}>Cancel</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ActivityTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Recent Activity</h3>
      <div style={styles.listContainer}>
        <div style={styles.listItem}>
          <div>
            <strong>Campaign sent</strong>
            <p style={styles.muted}>by user@example.com • 2 hours ago</p>
          </div>
        </div>
        <div style={styles.listItem}>
          <div>
            <strong>Template created</strong>
            <p style={styles.muted}>by user@example.com • 1 day ago</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ================================================================
  // CATEGORY 2: CREATE (6 tabs)
  // ================================================================

  const CampaignBuilderTab = () => {
    const handleFieldChange = (field, value) => {
      setCampaignForm({ ...campaignForm, [field]: value });
    };

    const handleSave = async () => {
      setLoading(true);
      try {
        const res = await api('/campaigns', { method: 'POST', body: JSON.stringify(campaignForm) });
        setCampaigns([...campaigns, res.campaign]);
        setSuccess('Campaign created successfully');
        setCampaignForm({ name: '', subject: '', preheader: '', fromName: '', fromEmail: '', replyTo: '', body: '', type: 'regular' });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Create Campaign</h3>
          <div style={styles.form}>
            <input
              type="text"
              placeholder="Campaign Name"
              value={campaignForm.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Subject Line"
              value={campaignForm.subject}
              onChange={(e) => handleFieldChange('subject', e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Preheader Text"
              value={campaignForm.preheader}
              onChange={(e) => handleFieldChange('preheader', e.target.value)}
              style={styles.input}
            />
            <div style={styles.formRow}>
              <input
                type="text"
                placeholder="From Name"
                value={campaignForm.fromName}
                onChange={(e) => handleFieldChange('fromName', e.target.value)}
                style={styles.input}
              />
              <input
                type="email"
                placeholder="From Email"
                value={campaignForm.fromEmail}
                onChange={(e) => handleFieldChange('fromEmail', e.target.value)}
                style={styles.input}
              />
            </div>
            <textarea
              placeholder="Email Body (HTML)"
              value={campaignForm.body}
              onChange={(e) => handleFieldChange('body', e.target.value)}
              style={{...styles.input, minHeight: '120px'}}
            />
            <button onClick={handleSave} disabled={loading} style={styles.primaryBtn}>
              {loading ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Tips</h3>
          <ul style={styles.tipsList}>
            <li>Keep subject lines under 50 characters</li>
            <li>Use personalization tokens like {'{'}'{'}firstName{'}'}{'}'}  </li>
            <li>Test your email before sending</li>
            <li>Check spam score</li>
          </ul>
        </div>
      </div>
    );
  };

  const EmailDesignerTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Email Designer</h3>
      <div style={styles.banner}>Drag-and-drop email builder (Coming soon)</div>
      <textarea
        placeholder="Enter HTML..."
        style={{...styles.input, minHeight: '300px', fontFamily: 'monospace'}}
      />
      <button style={styles.primaryBtn}>Save Design</button>
    </div>
  );

  const AIContentTab = () => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResults, setAiResults] = useState([]);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
      setGenerating(true);
      try {
        const res = await api('/ai/subject-lines/generate', {
          method: 'POST',
          body: JSON.stringify({ campaignGoal: aiPrompt, count: 5 })
        });
        setAiResults(res.suggestions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setGenerating(false);
      }
    };

    return (
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>AI Content Generator</h3>
        <div style={styles.form}>
          <textarea
            placeholder="Describe your campaign..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            style={{...styles.input, minHeight: '100px'}}
          />
          <button onClick={handleGenerate} disabled={generating} style={styles.primaryBtn}>
            {generating ? 'Generating...' : 'Generate Subject Lines'}
          </button>
          {aiResults.length > 0 && (
            <div style={styles.resultsContainer}>
              <h4>Generated Subject Lines:</h4>
              {aiResults.map((r, i) => (
                <div key={i} style={styles.resultCard}>
                  <div style={styles.resultText}>{r.subject}</div>
                  <div style={styles.resultMeta}>
                    Open Rate: {(r.predictedOpenRate * 100).toFixed(1)}% | 
                    Score: {(r.score * 100).toFixed(0)}/100 |
                    Spam: {r.spamScore}/100
                  </div>
                  <button style={styles.secondaryBtn}>Use This</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TemplateEditorTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Template Editor</h3>
      <div style={styles.form}>
        <input type="text" placeholder="Template Name" style={styles.input} />
        <select style={styles.input}>
          <option>Custom</option>
          <option>Promotional</option>
          <option>Transactional</option>
          <option>Newsletter</option>
        </select>
        <textarea placeholder="HTML..." style={{...styles.input, minHeight: '200px', fontFamily: 'monospace'}} />
        <button style={styles.primaryBtn}>Save Template</button>
      </div>
    </div>
  );

  const ImportExportTab = () => {
    const handleExport = () => {
      const data = JSON.stringify(campaigns, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campaigns.json';
      a.click();
    };

    return (
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Import Contacts</h3>
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} style={styles.primaryBtn}>
            Choose CSV File
          </button>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Export Data</h3>
          <button onClick={handleExport} style={styles.primaryBtn}>Export Campaigns</button>
        </div>
      </div>
    );
  };

  const QuickSendTab = () => {
    const [quickEmail, setQuickEmail] = useState({ to: '', subject: '', body: '' });

    const handleQuickSend = async () => {
      try {
        await api('/send/email', { method: 'POST', body: JSON.stringify(quickEmail) });
        setSuccess('Email sent!');
        setQuickEmail({ to: '', subject: '', body: '' });
      } catch (err) {
        setError(err.message);
      }
    };

    return (
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Quick Send</h3>
        <div style={styles.form}>
          <input
            type="email"
            placeholder="To"
            value={quickEmail.to}
            onChange={(e) => setQuickEmail({...quickEmail, to: e.target.value})}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Subject"
            value={quickEmail.subject}
            onChange={(e) => setQuickEmail({...quickEmail, subject: e.target.value})}
            style={styles.input}
          />
          <textarea
            placeholder="Message"
            value={quickEmail.body}
            onChange={(e) => setQuickEmail({...quickEmail, body: e.target.value})}
            style={{...styles.input, minHeight: '150px'}}
          />
          <button onClick={handleQuickSend} style={styles.primaryBtn}>Send Now</button>
        </div>
      </div>
    );
  };

  // ================================================================
  // CATEGORY 3: AUTOMATE (7 tabs)
  // ================================================================

  const WorkflowsTab = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Automation Workflows</h3>
        <button style={styles.primaryBtn}>Create Workflow</button>
      </div>
      <div style={styles.listContainer}>
        {workflows.map(w => (
          <div key={w.id} style={styles.listItem}>
            <div>
              <h4>{w.name}</h4>
              <p style={styles.muted}>
                <span style={getBadgeStyle(w.status)}>{w.status}</span> • 
                {w.executionCount || 0} executions
              </p>
            </div>
            <div style={styles.cardActions}>
              <button style={styles.secondaryBtn}>Edit</button>
              <button style={styles.secondaryBtn}>Analytics</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const WorkflowBuilderTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Visual Workflow Builder</h3>
      <div style={styles.banner}>React Flow workflow canvas (Coming soon)</div>
      <div style={styles.canvasPlaceholder}>
        <h3>Workflow Canvas</h3>
        <p>Visual drag-and-drop builder will render here</p>
        <button style={styles.primaryBtn}>Add Trigger</button>
      </div>
    </div>
  );

  const TriggersTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Workflow Triggers</h3>
      <div style={styles.grid}>
        {['Contact Created', 'Email Opened', 'Link Clicked', 'Purchase Completed', 'Cart Abandoned'].map((trigger, i) => (
          <div key={i} style={styles.triggerCard}>
            <h4>{trigger}</h4>
            <button style={styles.secondaryBtn}>Use Trigger</button>
          </div>
        ))}
      </div>
    </div>
  );

  const ActionsTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Workflow Actions</h3>
      <div style={styles.grid}>
        {['Send Email', 'Send SMS', 'Add to Segment', 'Update Field', 'Wait', 'Webhook'].map((action, i) => (
          <div key={i} style={styles.triggerCard}>
            <h4>{action}</h4>
            <button style={styles.secondaryBtn}>Add Action</button>
          </div>
        ))}
      </div>
    </div>
  );

  const WorkflowTemplatesTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Workflow Templates</h3>
      <div style={styles.grid}>
        {[
          { name: 'Welcome Series', desc: '3-email onboarding sequence' },
          { name: 'Abandoned Cart', desc: 'Multi-channel cart recovery' },
          { name: 'Win-Back', desc: 'Re-engage inactive subscribers' }
        ].map((template, i) => (
          <div key={i} style={styles.templateCard}>
            <h4>{template.name}</h4>
            <p style={styles.muted}>{template.desc}</p>
            <button style={styles.primaryBtn}>Use Template</button>
          </div>
        ))}
      </div>
    </div>
  );

  const JourneyBuilderTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Cross-Channel Journey Builder</h3>
      <div style={styles.banner}>Create multi-channel customer journeys</div>
      <div style={styles.form}>
        <input type="text" placeholder="Journey Name" style={styles.input} />
        <div style={styles.channelBadges}>
          <span style={styles.badge}>📧 Email</span>
          <span style={styles.badge}>📱 SMS</span>
          <span style={styles.badge}>🔔 Push</span>
          <span style={styles.badge}>💬 WhatsApp</span>
        </div>
        <button style={styles.primaryBtn}>Build Journey</button>
      </div>
    </div>
  );

  const AutomationAnalyticsTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Automation Performance</h3>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>12,456</div>
          <div style={styles.statLabel}>Total Executions</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>95.3%</div>
          <div style={styles.statLabel}>Success Rate</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>3.4s</div>
          <div style={styles.statLabel}>Avg Duration</div>
        </div>
      </div>
    </div>
  );

  // ================================================================
  // CATEGORY 4: OPTIMIZE (6 tabs)
  // ================================================================

  const ABTestingTab = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>A/B Testing</h3>
        <button style={styles.primaryBtn}>Create Test</button>
      </div>
      <div style={styles.listContainer}>
        {abTests.map(test => (
          <div key={test.id} style={styles.listItem}>
            <div>
              <h4>{test.name}</h4>
              <p style={styles.muted}>{test.testType} • {test.variants?.length || 0} variants</p>
            </div>
            <button style={styles.secondaryBtn}>View Results</button>
          </div>
        ))}
      </div>
    </div>
  );

  const SendTimeOptTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Send Time Optimization</h3>
      <div style={styles.banner}>AI-powered optimal send time analysis</div>
      <div style={styles.listContainer}>
        {[
          { day: 'Tuesday', hour: 10, rate: 28.5 },
          { day: 'Wednesday', hour: 14, rate: 26.7 },
          { day: 'Thursday', hour: 9, rate: 25.3 }
        ].map((time, i) => (
          <div key={i} style={styles.listItem}>
            <div>
              <strong>{time.day} at {time.hour}:00</strong>
              <p style={styles.muted}>Predicted Open Rate: {time.rate}%</p>
            </div>
            <button style={styles.secondaryBtn}>Use This Time</button>
          </div>
        ))}
      </div>
    </div>
  );

  const FrequencyCapTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Frequency Capping</h3>
      <div style={styles.form}>
        <input type="number" placeholder="Max Emails" style={styles.input} />
        <select style={styles.input}>
          <option>Per Day</option>
          <option>Per Week</option>
          <option>Per Month</option>
        </select>
        <button style={styles.primaryBtn}>Save Frequency Cap</button>
      </div>
    </div>
  );

  const SpamScoreTab = () => {
    const [spamCheck, setSpamCheck] = useState({ subject: '', body: '' });
    const [spamResult, setSpamResult] = useState(null);

    const checkSpam = async () => {
      try {
        const res = await api('/ai/spam-score', { method: 'POST', body: JSON.stringify(spamCheck) });
        setSpamResult(res);
      } catch (err) {
        setError(err.message);
      }
    };

    return (
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Spam Score Checker</h3>
        <div style={styles.form}>
          <input
            type="text"
            placeholder="Subject Line"
            value={spamCheck.subject}
            onChange={(e) => setSpamCheck({...spamCheck, subject: e.target.value})}
            style={styles.input}
          />
          <textarea
            placeholder="Email Body"
            value={spamCheck.body}
            onChange={(e) => setSpamCheck({...spamCheck, body: e.target.value})}
            style={{...styles.input, minHeight: '120px'}}
          />
          <button onClick={checkSpam} style={styles.primaryBtn}>Check Spam Score</button>
          {spamResult && (
            <div style={styles.resultCard}>
              <strong>Spam Score: {spamResult.spamScore}/100</strong>
              <p>{spamResult.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const DeliverabilityTab = () => (
    <div style={styles.grid}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Domain Authentication</h3>
        <div style={styles.detailsGrid}>
          <div><strong>SPF:</strong> <span style={styles.successBadge}>Verified</span></div>
          <div><strong>DKIM:</strong> <span style={styles.successBadge}>Verified</span></div>
          <div><strong>DMARC:</strong> <span style={styles.warningBadge}>Pending</span></div>
        </div>
      </div>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Sender Reputation</h3>
        <div style={styles.statValue}>95/100</div>
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: '95%'}}></div>
        </div>
      </div>
    </div>
  );

  const ContentOptTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Content Optimization</h3>
      <div style={styles.listContainer}>
        <div style={styles.recommendationCard}>
          <div style={styles.highPriority}>High Priority</div>
          <strong>Add personalization to subject line</strong>
          <p style={styles.muted}>Estimated impact: +15% open rate</p>
        </div>
        <div style={styles.recommendationCard}>
          <div style={styles.mediumPriority}>Medium Priority</div>
          <strong>Shorten email body</strong>
          <p style={styles.muted}>Current: 450 words, Recommended: 250-300 words</p>
        </div>
      </div>
    </div>
  );

  // ================================================================
  // CATEGORY 5: ANALYZE (7 tabs)
  // ================================================================

  const CampaignAnalyticsTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Campaign Analytics</h3>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>10,000</div>
          <div style={styles.statLabel}>Sent</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>2,450</div>
          <div style={styles.statLabel}>Opens</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>735</div>
          <div style={styles.statLabel}>Clicks</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>21.4%</div>
          <div style={styles.statLabel}>Open Rate</div>
        </div>
      </div>
    </div>
  );

  const EngagementTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Engagement Metrics</h3>
      <div style={styles.banner}>30-day engagement overview</div>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>22.5%</div>
          <div style={styles.statLabel}>Avg Open Rate</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>6.8%</div>
          <div style={styles.statLabel}>Avg Click Rate</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>78</div>
          <div style={styles.statLabel}>Engagement Score</div>
        </div>
      </div>
    </div>
  );

  const RevenueTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Revenue Attribution</h3>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>$234,567</div>
          <div style={styles.statLabel}>Total Revenue</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>5,234</div>
          <div style={styles.statLabel}>Orders</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>$44.82</div>
          <div style={styles.statLabel}>Avg Order Value</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>5.2x</div>
          <div style={styles.statLabel}>ROI</div>
        </div>
      </div>
    </div>
  );

  const PredictiveTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Predictive Analytics</h3>
      <div style={styles.listContainer}>
        <div style={styles.listItem}>
          <div>
            <strong>Churn Prediction</strong>
            <p style={styles.muted}>1,250 contacts at high risk</p>
          </div>
          <button style={styles.secondaryBtn}>View</button>
        </div>
        <div style={styles.listItem}>
          <div>
            <strong>LTV Prediction</strong>
            <p style={styles.muted}>Avg predicted: $456.78</p>
          </div>
          <button style={styles.secondaryBtn}>View</button>
        </div>
      </div>
    </div>
  );

  const CohortsTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Cohort Analysis</h3>
      <div style={styles.banner}>Retention analysis by cohort</div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Cohort</th>
            <th>Size</th>
            <th>Week 1</th>
            <th>Week 2</th>
            <th>Week 3</th>
            <th>Week 4</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2024-01</td>
            <td>1,250</td>
            <td>100%</td>
            <td>85.2%</td>
            <td>76.8%</td>
            <td>68.5%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const RealtimeTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Real-Time Dashboard</h3>
      <div style={styles.banner}>Live activity in the last 60 seconds</div>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>47</div>
          <div style={styles.statLabel}>Opens</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>12</div>
          <div style={styles.statLabel}>Clicks</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>2</div>
          <div style={styles.statLabel}>Bounces</div>
        </div>
      </div>
    </div>
  );

  const ReportsTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Custom Reports</h3>
      <div style={styles.form}>
        <select style={styles.input}>
          <option>Campaign Performance</option>
          <option>Engagement Trends</option>
          <option>Revenue Attribution</option>
        </select>
        <select style={styles.input}>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
        <button style={styles.primaryBtn}>Generate Report</button>
      </div>
    </div>
  );

  // ================================================================
  // CATEGORY 6: TOOLS (6 tabs)
  // ================================================================

  const ESPTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>ESP Integrations</h3>
      <div style={styles.listContainer}>
        {[
          { name: 'SendGrid', status: 'active', usage: '12,457/100,000' },
          { name: 'AWS SES', status: 'active', usage: '5,234/50,000' },
          { name: 'Mailgun', status: 'inactive', usage: '0/10,000' }
        ].map((esp, i) => (
          <div key={i} style={styles.listItem}>
            <div>
              <h4>{esp.name}</h4>
              <p style={styles.muted}>
                <span style={esp.status === 'active' ? styles.successBadge : styles.mutedBadge}>{esp.status}</span> • 
                {esp.usage} daily quota
              </p>
            </div>
            <button style={styles.secondaryBtn}>Configure</button>
          </div>
        ))}
      </div>
    </div>
  );

  const SMSTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>SMS Provider</h3>
      <div style={styles.listContainer}>
        {[
          { name: 'Twilio', status: 'active', balance: '$487.23' },
          { name: 'Plivo', status: 'inactive', balance: '$0.00' }
        ].map((provider, i) => (
          <div key={i} style={styles.listItem}>
            <div>
              <h4>{provider.name}</h4>
              <p style={styles.muted}>Balance: {provider.balance}</p>
            </div>
            <button style={styles.secondaryBtn}>Configure</button>
          </div>
        ))}
      </div>
    </div>
  );

  const WebhooksTab = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Webhooks</h3>
        <button style={styles.primaryBtn}>Add Webhook</button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>URL</th>
            <th>Events</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>https://api.example.com/webhook</td>
            <td>email.opened, email.clicked</td>
            <td><span style={styles.successBadge}>active</span></td>
            <td><button style={styles.secondaryBtn}>Edit</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const APIKeysTab = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>API Keys</h3>
        <button style={styles.primaryBtn}>Create Key</button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Key</th>
            <th>Permissions</th>
            <th>Last Used</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Production Key</td>
            <td>ea_1234...****</td>
            <td>read, write</td>
            <td>2 hours ago</td>
            <td><button style={styles.dangerBtn}>Delete</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const AuditLogTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Audit Log</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Action</th>
            <th>User</th>
            <th>Resource</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>campaign_sent</td>
            <td>user@example.com</td>
            <td>Campaign #123</td>
            <td>2 hours ago</td>
          </tr>
          <tr>
            <td>template_created</td>
            <td>user@example.com</td>
            <td>Template #45</td>
            <td>1 day ago</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const ComplianceTab = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Compliance</h3>
      <div style={styles.listContainer}>
        <div style={styles.listItem}>
          <div>
            <strong>GDPR Data Export</strong>
            <p style={styles.muted}>Export contact data per GDPR requirements</p>
          </div>
          <button style={styles.secondaryBtn}>Export</button>
        </div>
        <div style={styles.listItem}>
          <div>
            <strong>CAN-SPAM Compliance</strong>
            <p style={styles.muted}>Unsubscribe link required in all emails</p>
          </div>
          <span style={styles.successBadge}>Compliant</span>
        </div>
      </div>
    </div>
  );

  // ================================================================
  // CATEGORY 7: SETTINGS (2 tabs)
  // ================================================================

  const SenderProfilesTab = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Sender Profiles</h3>
        <button style={styles.primaryBtn}>Add Profile</button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>From Email</th>
            <th>Reply-To</th>
            <th>Verified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Support Team</td>
            <td>support@example.com</td>
            <td>support@example.com</td>
            <td><span style={styles.successBadge}>verified</span></td>
            <td><button style={styles.secondaryBtn}>Edit</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const DomainsTab = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Domain Authentication</h3>
        <button style={styles.primaryBtn}>Add Domain</button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Domain</th>
            <th>SPF</th>
            <th>DKIM</th>
            <th>DMARC</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>example.com</td>
            <td><span style={styles.successBadge}>verified</span></td>
            <td><span style={styles.successBadge}>verified</span></td>
            <td><span style={styles.warningBadge}>pending</span></td>
            <td><button style={styles.secondaryBtn}>Verify</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // ================================================================
  // TAB CONFIGURATION
  // ================================================================

  const tabs = [
    // MANAGE (8 tabs)
    { id: 'campaigns', title: 'Campaigns', component: CampaignListTab },
    { id: 'details', title: 'Campaign Details', component: CampaignDetailsTab },
    { id: 'templates', title: 'Templates', component: TemplatesTab },
    { id: 'contacts', title: 'Contacts', component: ContactsTab },
    { id: 'segments', title: 'Segments', component: SegmentsTab },
    { id: 'lists', title: 'Lists', component: ListsTab },
    { id: 'scheduled', title: 'Scheduled', component: ScheduledTab },
    { id: 'activity', title: 'Activity', component: ActivityTab },
    // CREATE (6 tabs)
    { id: 'builder', title: 'Campaign Builder', component: CampaignBuilderTab },
    { id: 'designer', title: 'Email Designer', component: EmailDesignerTab },
    { id: 'ai-content', title: 'AI Content', component: AIContentTab },
    { id: 'template-editor', title: 'Template Editor', component: TemplateEditorTab },
    { id: 'import-export', title: 'Import/Export', component: ImportExportTab },
    { id: 'quick-send', title: 'Quick Send', component: QuickSendTab },
    // AUTOMATE (7 tabs)
    { id: 'workflows', title: 'Workflows', component: WorkflowsTab },
    { id: 'workflow-builder', title: 'Workflow Builder', component: WorkflowBuilderTab },
    { id: 'triggers', title: 'Triggers', component: TriggersTab },
    { id: 'actions', title: 'Actions', component: ActionsTab },
    { id: 'workflow-templates', title: 'Workflow Templates', component: WorkflowTemplatesTab },
    { id: 'journeys', title: 'Journey Builder', component: JourneyBuilderTab },
    { id: 'automation-analytics', title: 'Automation Analytics', component: AutomationAnalyticsTab },
    // OPTIMIZE (6 tabs)
    { id: 'ab-testing', title: 'A/B Testing', component: ABTestingTab },
    { id: 'send-time', title: 'Send Time Optimization', component: SendTimeOptTab },
    { id: 'frequency', title: 'Frequency Capping', component: FrequencyCapTab },
    { id: 'spam', title: 'Spam Score', component: SpamScoreTab },
    { id: 'deliverability', title: 'Deliverability', component: DeliverabilityTab },
    { id: 'content-opt', title: 'Content Optimization', component: ContentOptTab },
    // ANALYZE (7 tabs)
    { id: 'campaign-analytics', title: 'Campaign Analytics', component: CampaignAnalyticsTab },
    { id: 'engagement', title: 'Engagement', component: EngagementTab },
    { id: 'revenue', title: 'Revenue', component: RevenueTab },
    { id: 'predictive', title: 'Predictive', component: PredictiveTab },
    { id: 'cohorts', title: 'Cohorts', component: CohortsTab },
    { id: 'realtime', title: 'Real-Time', component: RealtimeTab },
    { id: 'reports', title: 'Reports', component: ReportsTab },
    // TOOLS (6 tabs)
    { id: 'esp', title: 'ESP', component: ESPTab },
    { id: 'sms', title: 'SMS', component: SMSTab },
    { id: 'webhooks', title: 'Webhooks', component: WebhooksTab },
    { id: 'api-keys', title: 'API Keys', component: APIKeysTab },
    { id: 'audit', title: 'Audit Log', component: AuditLogTab },
    { id: 'compliance', title: 'Compliance', component: ComplianceTab },
    // SETTINGS (2 tabs)
    { id: 'sender-profiles', title: 'Sender Profiles', component: SenderProfilesTab },
    { id: 'domains', title: 'Domains', component: DomainsTab }
  ];

  const tabCategories = [
    { name: 'Manage', count: 8 },
    { name: 'Create', count: 6 },
    { name: 'Automate', count: 7 },
    { name: 'Optimize', count: 6 },
    { name: 'Analyze', count: 7 },
    { name: 'Tools', count: 6 },
    { name: 'Settings', count: 2 }
  ];

  // Helper functions
  const handleViewCampaign = async (id) => {
    try {
      const res = await api(`/campaigns/${id}`);
      setSelectedCampaign(res.campaign);
      setActiveTab(1);
    } catch (err) {
      setError(err.message);
    }
  };

  const getBadgeStyle = (status) => {
    const baseStyle = { ...styles.badge };
    if (status === 'active' || status === 'sent' || status === 'subscribed' || status === 'success') {
      return { ...baseStyle, ...styles.successBadge };
    } else if (status === 'scheduled' || status === 'running' || status === 'pending') {
      return { ...baseStyle, ...styles.warningBadge };
    } else if (status === 'draft' || status === 'inactive') {
      return { ...baseStyle, ...styles.mutedBadge };
    }
    return baseStyle;
  };

  // Styles
  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    header: {
      marginBottom: '24px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0 0 8px 0',
      color: '#111827'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6B7280',
      margin: 0
    },
    notifications: {
      marginBottom: '16px'
    },
    banner: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '16px',
      background: '#EFF6FF',
      color: '#1E40AF',
      border: '1px solid #BFDBFE'
    },
    tabNav: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      overflowX: 'auto',
      padding: '8px 0',
      borderBottom: '2px solid #E5E7EB'
    },
    tab: {
      padding: '8px 16px',
      background: 'none',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#6B7280',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s'
    },
    activeTab: {
      background: '#3B82F6',
      color: '#FFFFFF'
    },
    card: {
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '16px'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '600',
      margin: 0,
      color: '#111827'
    },
    cardActions: {
      display: 'flex',
      gap: '8px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px'
    },
    statCard: {
      background: '#F9FAFB',
      padding: '20px',
      borderRadius: '8px',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#111827',
      marginBottom: '4px'
    },
    statLabel: {
      fontSize: '14px',
      color: '#6B7280'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    listContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      background: '#F9FAFB',
      borderRadius: '8px'
    },
    templateCard: {
      background: '#F9FAFB',
      padding: '20px',
      borderRadius: '8px'
    },
    triggerCard: {
      background: '#F9FAFB',
      padding: '20px',
      borderRadius: '8px',
      textAlign: 'center'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    input: {
      padding: '10px 12px',
      border: '1px solid #D1D5DB',
      borderRadius: '6px',
      fontSize: '14px',
      width: '100%',
      boxSizing: 'border-box'
    },
    searchInput: {
      padding: '8px 12px',
      border: '1px solid #D1D5DB',
      borderRadius: '6px',
      fontSize: '14px',
      width: '300px'
    },
    primaryBtn: {
      padding: '10px 20px',
      background: '#3B82F6',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    secondaryBtn: {
      padding: '8px 16px',
      background: '#FFFFFF',
      color: '#374151',
      border: '1px solid #D1D5DB',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    dangerBtn: {
      padding: '8px 16px',
      background: '#EF4444',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block'
    },
    successBadge: {
      background: '#D1FAE5',
      color: '#065F46'
    },
    warningBadge: {
      background: '#FEF3C7',
      color: '#92400E'
    },
    mutedBadge: {
      background: '#E5E7EB',
      color: '#4B5563'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#6B7280'
    },
    detailsGrid: {
      display: 'grid',
      gap: '12px'
    },
    actions: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    resultsContainer: {
      marginTop: '20px'
    },
    resultCard: {
      background: '#F9FAFB',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '12px'
    },
    resultText: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '8px'
    },
    resultMeta: {
      fontSize: '13px',
      color: '#6B7280',
      marginBottom: '12px'
    },
    muted: {
      color: '#6B7280',
      fontSize: '13px',
      margin: '4px 0 0 0'
    },
    tipsList: {
      margin: 0,
      paddingLeft: '20px'
    },
    channelBadges: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    canvasPlaceholder: {
      height: '400px',
      border: '2px dashed #D1D5DB',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6B7280'
    },
    recommendationCard: {
      background: '#F9FAFB',
      padding: '16px',
      borderRadius: '8px',
      position: 'relative'
    },
    highPriority: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      padding: '4px 8px',
      background: '#FEE2E2',
      color: '#991B1B',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600'
    },
    mediumPriority: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      padding: '4px 8px',
      background: '#FEF3C7',
      color: '#92400E',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: '#E5E7EB',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '8px'
    },
    progressFill: {
      height: '100%',
      background: '#10B981',
      transition: 'width 0.3s'
    }
  };

  const CurrentTabComponent = tabs[activeTab]?.component || null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Email Automation Builder</h1>
        <p style={styles.subtitle}>Enterprise email marketing with AI-powered optimization</p>
      </div>

      {error && (
        <div style={{...styles.banner, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA'}}>
          {error} <button onClick={() => setError(null)} style={{...styles.secondaryBtn, marginLeft: '12px'}}>Dismiss</button>
        </div>
      )}

      {success && (
        <div style={{...styles.banner, background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0'}}>
          {success} <button onClick={() => setSuccess(null)} style={{...styles.secondaryBtn, marginLeft: '12px'}}>Dismiss</button>
        </div>
      )}

      <div style={styles.tabNav}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(index)}
            style={{
              ...styles.tab,
              ...(activeTab === index && styles.activeTab)
            }}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {loading && <div style={{textAlign: 'center', padding: '40px'}}>Loading...</div>}
      
      {!loading && CurrentTabComponent && <CurrentTabComponent />}

      {modalActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3>Create Campaign</h3>
            <p>Ready to create a new email campaign?</p>
            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
              <button onClick={() => { setModalActive(false); setActiveTab(8); }} style={styles.primaryBtn}>
                Get Started
              </button>
              <button onClick={() => setModalActive(false)} style={styles.secondaryBtn}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
