import React, { useState, useEffect } from 'react';
import { exportCampaignPDF } from './WinbackExportPDF';
import { apiFetch } from '../../api';

import WinbackFeatureCard from './WinbackFeatureCard';
import WinbackAnalyticsChart from './WinbackAnalyticsChart';
import WinbackAnomalyBanner from './WinbackAnomalyBanner';

import useWinbackSocket from './AbandonedCheckoutWinbackSocket';
import ToolScaffold from './ToolScaffold';

// --- Notifications state and logic (API-integrated) ---
function NotificationsSection() {
  const [notificationsList, setNotificationsList] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  // Load notifications from backend
  useEffect(() => {
    setNotificationsLoading(true);
    setNotificationsError("");
    apiFetch('/api/abandoned-checkout-winback/notifications')
      .then(async resp => {
        if (!resp.ok) throw new Error('Failed to fetch notifications');
        const data = await resp.json();
        setNotificationsList((data.notifications || []).map(n => ({ ...n, selected: false })));
      })
      .catch(e => setNotificationsError(e.message))
      .finally(() => setNotificationsLoading(false));
  }, []);

  const openNotificationModal = (notification = null) => {
    setEditingNotification(notification);
    setShowNotificationModal(true);
  };
  const closeNotificationModal = () => {
    setEditingNotification(null);
    setShowNotificationModal(false);
  };
  const saveNotification = async (n) => {
    setNotificationsError("");
    if (n.id) {
      // Update
      try {
        const resp = await apiFetch(`/api/abandoned-checkout-winback/notifications/${n.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n)
        });
        if (!resp.ok) throw new Error('Failed to update notification');
        const data = await resp.json();
        setNotificationsList(list => list.map(x => x.id === n.id ? { ...data.notification, selected: false } : x));
        closeNotificationModal();
      } catch (e) {
        setNotificationsError(e.message);
      }
    } else {
      // Create
      try {
        const resp = await apiFetch('/api/abandoned-checkout-winback/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n)
        });
        if (!resp.ok) throw new Error('Failed to create notification');
        const data = await resp.json();
        setNotificationsList(list => [...list, { ...data.notification, selected: false }]);
        closeNotificationModal();
      } catch (e) {
        setNotificationsError(e.message);
      }
    }
  };
  const toggleSelectNotification = (id) => {
    setNotificationsList(list => list.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
  };
  const selectAllNotifications = (checked) => {
    setNotificationsList(list => list.map(x => ({ ...x, selected: checked })));
  };
  const deleteSelectedNotifications = async () => {
    setNotificationsError("");
    const ids = notificationsList.filter(x => x.selected).map(x => x.id);
    if (ids.length === 0) return;
    try {
      const resp = await apiFetch('/api/abandoned-checkout-winback/notifications/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Failed to delete notifications');
      setNotificationsList(list => list.filter(x => !ids.includes(x.id)));
    } catch (e) {
      setNotificationsError(e.message);
    }
  };
  const deleteNotification = async (id) => {
    setNotificationsError("");
    try {
      const resp = await apiFetch(`/api/abandoned-checkout-winback/notifications/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete notification');
      setNotificationsList(list => list.filter(x => x.id !== id));
    } catch (e) {
      setNotificationsError(e.message);
    }
  };

  return (
    <section aria-label="Notifications">
      <WinbackFeatureCard title="Notifications" description="Manage notification preferences and delivery channels." icon="🔔" />
      <div style={{ background: '#23232a', color: '#fafafa', borderRadius: 14, boxShadow: '0 2px 8px #0004', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Your Notifications</div>
          <button onClick={() => setShowNotificationModal(true)} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ New Notification</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--background-secondary)', borderRadius: 10, overflow: 'hidden', fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#232336', color: '#aaa' }}>
              <th><input type="checkbox" checked={notificationsList.length > 0 && notificationsList.every(n => n.selected)} onChange={e => selectAllNotifications(e.target.checked)} aria-label="Select all notifications" /></th>
              <th>Name</th>
              <th>Channel</th>
              <th>Message</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notificationsList.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span role="img" aria-label="No notifications" style={{ fontSize: 32, opacity: 0.7 }}>🔔</span>
                  <span>No notifications yet. Click <b>+ New Notification</b> to get started!</span>
                </div>
              </td></tr>
            ) : notificationsList.map(n => (
              <tr key={n.id} style={{ background: n.selected ? '#e0e7ff' : undefined }}>
                <td><input type="checkbox" checked={!!n.selected} onChange={() => toggleSelectNotification(n.id)} aria-label={`Select notification ${n.name}`} /></td>
                <td>{n.name}</td>
                <td>{n.channel}</td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</td>
                <td>{n.status}</td>
                <td>{n.created}</td>
                <td>
                  <button onClick={() => openNotificationModal(n)} style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginRight: 6 }}>Edit</button>
                  <button onClick={() => deleteNotification(n.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} title="Delete notification">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Bulk Actions */}
        <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
          <button onClick={deleteSelectedNotifications} disabled={!notificationsList.some(n => n.selected)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} title="Delete all selected notifications">Delete Selected</button>
        </div>
        {/* Notification Modal (Add/Edit) */}
        {showNotificationModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
            <div style={{ background: 'var(--background-secondary, #23232a)', color: 'var(--text-primary, #fafafa)', borderRadius: 14, padding: 32, minWidth: 400, maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px #0008', position: 'relative' }}>
              <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>{editingNotification ? 'Edit Notification' : 'New Notification'}</h3>
              <form onSubmit={e => { e.preventDefault(); saveNotification(editingNotification ? editingNotification : { name: '', channel: 'email', message: '', status: 'enabled', created: new Date().toISOString().slice(0, 10) }); }}>
                <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-notification-name">Name</label>
                <input id="modal-notification-name" value={editingNotification ? editingNotification.name : ''} onChange={e => setEditingNotification(editingNotification ? { ...editingNotification, name: e.target.value } : { name: e.target.value, channel: 'email', message: '', status: 'enabled', created: new Date().toISOString().slice(0, 10) })} placeholder="Notification name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }}>Channels <span style={{ color: '#64748b', fontWeight: 400, fontSize: 13 }} title="Choose where this notification will be delivered.">(?)</span></label>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={editingNotification?.channel === 'email'} onChange={e => setEditingNotification(editingNotification ? { ...editingNotification, channel: e.target.checked ? 'email' : '' } : { name: '', channel: e.target.checked ? 'email' : '', message: '', status: 'enabled', created: new Date().toISOString().slice(0, 10) })} /> Email
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={editingNotification?.channel === 'sms'} onChange={e => setEditingNotification(editingNotification ? { ...editingNotification, channel: e.target.checked ? 'sms' : '' } : { name: '', channel: e.target.checked ? 'sms' : '', message: '', status: 'enabled', created: new Date().toISOString().slice(0, 10) })} /> SMS
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={editingNotification?.channel === 'push'} onChange={e => setEditingNotification(editingNotification ? { ...editingNotification, channel: e.target.checked ? 'push' : '' } : { name: '', channel: e.target.checked ? 'push' : '', message: '', status: 'enabled', created: new Date().toISOString().slice(0, 10) })} /> Push
                  </label>
                </div>
                <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }}>Schedule <span style={{ color: '#64748b', fontWeight: 400, fontSize: 13 }} title="Set a future date/time to send this notification.">(?)</span></label>
                <input type="datetime-local" value={editingNotification?.scheduledAt || ''} onChange={e => setEditingNotification(editingNotification ? { ...editingNotification, scheduledAt: e.target.value } : { name: '', channel: '', message: '', status: 'enabled', created: new Date().toISOString().slice(0, 10), scheduledAt: e.target.value })} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} />
                <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-notification-message">Message</label>
                <textarea id="modal-notification-message" value={editingNotification ? editingNotification.message : ''} onChange={e => setEditingNotification(editingNotification ? { ...editingNotification, message: e.target.value } : { name: '', channel: 'email', message: e.target.value, status: 'enabled', created: new Date().toISOString().slice(0, 10) })} placeholder="Notification message" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12, minHeight: 80 }} required />
                <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-notification-status">Status</label>
                <select id="modal-notification-status" value={editingNotification ? editingNotification.status : 'enabled'} onChange={e => setEditingNotification(editingNotification ? { ...editingNotification, status: e.target.value } : { name: '', channel: 'email', message: '', status: e.target.value, created: new Date().toISOString().slice(0, 10) })} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 18 }} required>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
                {/* Delivery Preview & Test Send */}
                <div style={{ background: 'var(--background-tertiary, #232336)', borderRadius: 8, padding: 12, marginBottom: 16, color: 'var(--text-primary, #fafafa)' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Preview <span style={{ color: '#64748b', fontWeight: 400, fontSize: 13 }} title="See how your message will appear.">(?)</span></div>
                  <div style={{ fontFamily: 'monospace', fontSize: 15, whiteSpace: 'pre-wrap', background: 'var(--background-secondary, #23232a)', borderRadius: 6, padding: 10, minHeight: 40, color: 'var(--text-primary, #fafafa)', border: '1px solid #333' }}>{editingNotification ? editingNotification.message : ''}</div>
                  <button type="button" onClick={() => alert('Test send feature coming soon!')} style={{ marginTop: 10, background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} title="Send a test notification to yourself">Send Test</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={closeNotificationModal} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{editingNotification ? 'Save Changes' : 'Create Notification'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {notificationsLoading && <div style={{ color: '#6366f1', padding: 12, fontWeight: 600, fontSize: 16 }} aria-live="polite">Loading notifications...</div>}
        {notificationsError && <div style={{ color: '#ef4444', padding: 12, fontWeight: 600, fontSize: 15 }} role="alert">{notificationsError}</div>}
      </div>
    </section>
  );
}

function AbandonedCheckoutWinback() {
      // --- Analytics state for Analytics section ---
      const [analytics, setAnalytics] = useState([]);
    // --- Flagship Navigation Sidebar ---
    const flagshipSections = [
      { key: 'segments', label: 'Segments' },
      { key: 'templates', label: 'Templates' },
      { key: 'abTesting', label: 'A/B Testing' },
      { key: 'analytics', label: 'Analytics' },
      { key: 'integrations', label: 'Integrations' },
      { key: 'notifications', label: 'Notifications' },
      { key: 'activityLog', label: 'Activity Log' },
      { key: 'compliance', label: 'Compliance' },
      { key: 'settings', label: 'Settings' },
      { key: 'help', label: 'Help & Docs' },
    ];
    // --- Flagship state and logic ---
    // Fix: Add activeSection state for navigation
    const [activeSection, setActiveSection] = useState('segments'); // Default section, change as needed
    // Experiments state for A/B Testing section
    const [experimentsList, setExperimentsList] = useState([
      { id: 1, name: 'Subject Line Test', variantA: 'Welcome to Aura!', variantB: 'Get Started with Aura', status: 'active', created: '2026-01-01', selected: false },
      { id: 2, name: 'SMS Timing', variantA: 'Send 1h after abandon', variantB: 'Send 24h after abandon', status: 'draft', created: '2026-01-05', selected: false },
    ]);
    const [showExperimentModal, setShowExperimentModal] = useState(false);
    const [editingExperiment, setEditingExperiment] = useState(null);
    const openExperimentModal = (experiment = null) => {
      setEditingExperiment(experiment);
      setShowExperimentModal(true);
    };
    const closeExperimentModal = () => {
      setEditingExperiment(null);
      setShowExperimentModal(false);
    };
    const saveExperiment = (e) => {
      if (e.id) {
        setExperimentsList(list => list.map(x => x.id === e.id ? { ...e, selected: false } : x));
      } else {
        setExperimentsList(list => [...list, { ...e, id: Date.now(), selected: false }]);
      }
      closeExperimentModal();
    };
    const toggleSelectExperiment = (id) => {
      setExperimentsList(list => list.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
    };
    const selectAllExperiments = (checked) => {
      setExperimentsList(list => list.map(x => ({ ...x, selected: checked })));
    };
    const deleteSelectedExperiments = () => {
      setExperimentsList(list => list.filter(x => !x.selected));
    };

    // Templates state for flagship management
    const [templatesList, setTemplatesList] = useState([
      { id: 1, name: 'Welcome Email', channel: 'email', content: 'Welcome to Aura!', created: '2026-01-01', selected: false },
      { id: 2, name: 'Cart Reminder SMS', channel: 'sms', content: 'You left something in your cart!', created: '2026-01-05', selected: false },
    ]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const openTemplateModal = (template = null) => {
      setEditingTemplate(template);
      setShowTemplateModal(true);
    };
    const closeTemplateModal = () => {
      setEditingTemplate(null);
      setShowTemplateModal(false);
    };
    const saveTemplate = (t) => {
      if (t.id) {
        setTemplatesList(list => list.map(x => x.id === t.id ? { ...t, selected: false } : x));
      } else {
        setTemplatesList(list => [...list, { ...t, id: Date.now(), selected: false }]);
      }
      closeTemplateModal();
    };
    const toggleSelectTemplate = (id) => {
      setTemplatesList(list => list.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
    };
    const selectAllTemplates = (checked) => {
      setTemplatesList(list => list.map(x => ({ ...x, selected: checked })));
    };
    const deleteSelectedTemplates = () => {
      setTemplatesList(list => list.filter(x => !x.selected));
    };

    // Segments state for advanced segmentation
    const [segmentsList, setSegmentsList] = useState([
      { id: 1, name: 'VIP Customers', rule: 'Spent > $500', created: '2026-01-01', selected: false },
      { id: 2, name: 'New Signups', rule: 'Joined < 30d', created: '2026-01-10', selected: false },
    ]);
    const [showSegmentModal, setShowSegmentModal] = useState(false);
    const [editingSegment, setEditingSegment] = useState(null);
    const openSegmentModal = (segment = null) => {
      setEditingSegment(segment);
      setShowSegmentModal(true);
    };
    const closeSegmentModal = () => {
      setEditingSegment(null);
      setShowSegmentModal(false);
    };
    const saveSegment = (s) => {
      if (s.id) {
        setSegmentsList(list => list.map(x => x.id === s.id ? { ...s, selected: false } : x));
      } else {
        setSegmentsList(list => [...list, { ...s, id: Date.now(), selected: false }]);
      }
      closeSegmentModal();
    };
    const toggleSelectSegment = (id) => {
      setSegmentsList(list => list.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
    };
    const selectAllSegments = (checked) => {
      setSegmentsList(list => list.map(x => ({ ...x, selected: checked })));
    };
    const deleteSelectedSegments = () => {
      setSegmentsList(list => list.filter(x => !x.selected));
    };

    // --- AutomationSection: flagship automation management ---
    function AutomationSection() {
      const [rules, setRules] = React.useState([]);
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState("");
      const [showModal, setShowModal] = React.useState(false);
      const [newRule, setNewRule] = React.useState({ trigger: '', action: '', enabled: true });

      React.useEffect(() => {
        setLoading(true);
        apiFetch('/api/abandoned-checkout-winback/automation')
          .then(async resp => {
            if (!resp.ok) throw new Error('Failed to fetch automation rules');
            const data = await resp.json();
            setRules(data.rules || []);
          })
          .catch(e => setError(e.message))
          .finally(() => setLoading(false));
      }, []);

      const handleCreate = async () => {
        setLoading(true);
        setError("");
        try {
          const resp = await apiFetch('/api/abandoned-checkout-winback/automation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRule)
          });
          const data = await resp.json();
          if (!data.ok) throw new Error(data.error || 'Failed to create rule');
          setRules(rules => [...rules, data.rule]);
          setShowModal(false);
          setNewRule({ trigger: '', action: '', enabled: true });
        } catch (e) {
          setError(e.message);
        }
        setLoading(false);
      };

      const handleDelete = async (id) => {
        setLoading(true);
        setError("");
        try {
          const resp = await apiFetch(`/api/abandoned-checkout-winback/automation/${id}`, { method: 'DELETE' });
          const data = await resp.json();
          if (!data.ok) throw new Error(data.error || 'Failed to delete rule');
          setRules(rules => rules.filter(r => r.id !== id));
        } catch (e) {
          setError(e.message);
        }
        setLoading(false);
      };

      return (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 20 }}>Automation Rules</h3>
            <button onClick={() => setShowModal(true)} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>+ New Rule</button>
          </div>
          {error && <div style={{ color: '#f87171', marginBottom: 12 }}>{error}</div>}
          {loading ? <div>Loading...</div> : (
            <table style={{ width: '100%', color: '#fff', fontSize: 15, background: '#18181b', borderRadius: 10 }}>
              <thead>
                <tr style={{ color: '#aaa', textAlign: 'left' }}>
                  <th>Trigger</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} style={{ borderTop: '1px solid #232336' }}>
                    <td>{rule.trigger}</td>
                    <td>{rule.action}</td>
                    <td>{rule.enabled ? 'Enabled' : 'Disabled'}</td>
                    <td><button onClick={() => handleDelete(rule.id)} style={{ background: 'none', color: '#f87171', border: 'none', cursor: 'pointer' }}>Delete</button></td>
                  </tr>
                ))}
                {rules.length === 0 && <tr><td colSpan={4} style={{ color: '#aaa', padding: 12 }}>No automation rules yet.</td></tr>}
              </tbody>
            </table>
          )}
          {/* Modal for new rule */}
          {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#232336', borderRadius: 12, padding: 32, minWidth: 340 }}>
                <h3 style={{ marginTop: 0 }}>Create Automation Rule</h3>
                <div style={{ marginBottom: 12 }}>
                  <label>Trigger<br />
                    <input value={newRule.trigger} onChange={e => setNewRule(r => ({ ...r, trigger: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #333', marginTop: 4 }} placeholder="e.g. Cart Abandoned" />
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Action<br />
                    <input value={newRule.action} onChange={e => setNewRule(r => ({ ...r, action: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #333', marginTop: 4 }} placeholder="e.g. Send Email" />
                  </label>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label>
                    <input type="checkbox" checked={newRule.enabled} onChange={e => setNewRule(r => ({ ...r, enabled: e.target.checked }))} /> Enabled
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowModal(false)} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleCreate} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Create</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // --- IntegrationsSection: flagship integrations management ---
    function IntegrationsSection() {
            // Modal state for adding integrations
            const [showAddModal, setShowAddModal] = React.useState(false);
            const [selectedIntegration, setSelectedIntegration] = React.useState(null);
            // List of available integrations (production-ready)
            const availableIntegrations = [
              { id: 'shopify', name: 'Shopify', description: 'Connect your Shopify store.' },
              { id: 'klaviyo', name: 'Klaviyo', description: 'Sync with Klaviyo for email marketing.' },
              { id: 'mailchimp', name: 'Mailchimp', description: 'Sync with Mailchimp for campaigns.' },
              { id: 'google-ads', name: 'Google Ads', description: 'Connect Google Ads for retargeting.' },
              { id: 'facebook-ads', name: 'Facebook Ads', description: 'Connect Facebook Ads for retargeting.' },
            ];

            // Add integration handler
            const handleAddIntegration = async () => {
              if (!selectedIntegration) return;
              setError("");
              setLoading(true);
              try {
                // Add integration for this shop
                const resp = await apiFetch(`/api/abandoned-checkout-winback/integrations/${selectedIntegration.id}/connect`, { method: 'POST' });
                const data = await resp.json();
                if (!data.ok) throw new Error(data.error || 'Failed to add integration');
                setIntegrations(list => [...list, { ...selectedIntegration, connected: true, lastConnected: new Date().toISOString().slice(0, 19).replace('T', ' ') }]);
                setShowAddModal(false);
                setSelectedIntegration(null);
              } catch (e) {
                setError(e.message);
              }
              setLoading(false);
            };
      const [integrations, setIntegrations] = React.useState([]);
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState("");
      const [connecting, setConnecting] = React.useState(null);
      const [filter, setFilter] = React.useState("");

      React.useEffect(() => {
        setLoading(true);
        apiFetch('/api/abandoned-checkout-winback/integrations')
          .then(async resp => {
            if (!resp.ok) throw new Error('Failed to fetch integrations');
            const data = await resp.json();
            // Add mock description and lastConnected if not present
            setIntegrations((data.integrations || []).map(i => ({
              ...i,
              description: i.description || `Integration with ${i.name}`,
              lastConnected: i.lastConnected || (i.connected ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null)
            })));
          })
          .catch(e => setError(e.message))
          .finally(() => setLoading(false));
      }, []);

      const handleConnect = async (integration) => {
        setConnecting(integration.id);
        setError("");
        try {
          const resp = await apiFetch(`/api/abandoned-checkout-winback/integrations/${integration.id}/connect`, { method: 'POST' });
          const data = await resp.json();
          if (!data.ok) throw new Error(data.error || 'Failed to connect');
          setIntegrations(list => list.map(i => i.id === integration.id ? { ...i, connected: true } : i));
        } catch (e) {
          setError(e.message);
        }
        setConnecting(null);
      };

      const handleDisconnect = async (integration) => {
        setConnecting(integration.id);
        setError("");
        try {
          const resp = await apiFetch(`/api/abandoned-checkout-winback/integrations/${integration.id}/disconnect`, { method: 'POST' });
          const data = await resp.json();
          if (!data.ok) throw new Error(data.error || 'Failed to disconnect');
          setIntegrations(list => list.map(i => i.id === integration.id ? { ...i, connected: false } : i));
        } catch (e) {
          setError(e.message);
        }
        setConnecting(null);
      };

      // Filtered integrations
      const filtered = integrations.filter(i =>
        i.name.toLowerCase().includes(filter.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(filter.toLowerCase()))
      );
      return (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 20 }}>Integrations</h3>
            <button onClick={() => setShowAddModal(true)} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ Add Integration</button>
          </div>
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search integrations..."
            style={{ marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #333', width: 260, fontSize: 15 }}
            aria-label="Filter integrations"
          />
          {error && <div style={{ color: '#f87171', marginBottom: 12 }}>{error}</div>}
          {loading ? <div>Loading...</div> : (
            <table style={{ width: '100%', color: '#fff', fontSize: 15, background: '#18181b', borderRadius: 10 }}>
              <thead>
                <tr style={{ color: '#aaa', textAlign: 'left' }}>
                  <th>Service</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Last Connected</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(integration => (
                  <tr key={integration.id} style={{ borderTop: '1px solid #232336' }}>
                    <td>{integration.name}</td>
                    <td>{integration.description}</td>
                    <td>{integration.connected ? 'Connected' : 'Not Connected'}</td>
                    <td>{integration.connected && integration.lastConnected ? integration.lastConnected : '-'}</td>
                    <td>
                      {integration.connected ? (
                        <button onClick={() => handleDisconnect(integration)} disabled={connecting === integration.id} style={{ background: 'var(--button-tertiary-bg)', color: '#f87171', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Disconnect</button>
                      ) : (
                        <button onClick={() => handleConnect(integration)} disabled={connecting === integration.id} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Connect</button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} style={{ color: '#aaa', padding: 12 }}>No integrations found.</td></tr>}
              </tbody>
            </table>
          )}

          {/* Add Integration Modal */}
          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
              <div style={{ background: '#18181b', borderRadius: 14, padding: 32, minWidth: 340, maxWidth: 400, boxShadow: '0 8px 40px #0008', position: 'relative', color: '#fafafa' }}>
                <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, color: '#fff' }}>Add Integration</h3>
                <div style={{ marginBottom: 18 }}>
                  {availableIntegrations.map(intg => (
                    <div key={intg.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                      <input
                        type="radio"
                        id={`add-intg-${intg.id}`}
                        name="add-integration"
                        value={intg.id}
                        checked={selectedIntegration && selectedIntegration.id === intg.id}
                        onChange={() => setSelectedIntegration(intg)}
                        style={{ marginRight: 10 }}
                      />
                      <label htmlFor={`add-intg-${intg.id}`} style={{ fontWeight: 600, fontSize: 16, color: '#fff' }}>{intg.name}</label>
                      <span style={{ marginLeft: 8, color: '#a1a1aa', fontSize: 14 }}>{intg.description}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={() => { setShowAddModal(false); setSelectedIntegration(null); }} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                  <button type="button" onClick={handleAddIntegration} disabled={!selectedIntegration} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Add</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Main component return
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#18181b' }}>
        {/* Flagship Navigation Sidebar */}
        <nav aria-label="Winback flagship navigation" style={{
          width: 210,
          background: '#18181b',
          borderRight: '1px solid #232336',
          padding: '32px 0 32px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minHeight: '100vh',
        }}>
          {flagshipSections.map(section => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              style={{
                background: activeSection === section.key ? '#232336' : 'none',
                color: activeSection === section.key ? '#fff' : '#cbd5e1',
                border: 'none',
                borderLeft: activeSection === section.key ? '4px solid #0ea5e9' : '4px solid transparent',
                borderRadius: '0 8px 8px 0',
                padding: '14px 24px',
                fontWeight: activeSection === section.key ? 700 : 500,
                fontSize: 16,
                textAlign: 'left',
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.2s, color 0.2s',
                marginRight: 0,
              }}
              aria-current={activeSection === section.key ? 'page' : undefined}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div style={{ flex: 1, padding: '32px 0 32px 32px' }}>
        {activeSection === 'segments' && (
          <section aria-label="Segments">
            <WinbackFeatureCard title="Advanced Segmentation" description="Create, manage, and apply dynamic customer segments. Saved segments, rule builder, and filters." icon="👥" />
            <div style={{ background: '#23232a', color: '#fafafa', borderRadius: 14, boxShadow: '0 2px 8px #0004', padding: 24, marginBottom: 24 }}>
              <WinbackFeatureCard title="Advanced Segmentation" description="Create, manage, and apply dynamic customer segments. Saved segments, rule builder, and filters." icon="👥" />
              {/* Segments Table & Bulk Actions */}
              <div style={{ marginTop: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>Your Segments</div>
                  <button onClick={() => openSegmentModal()} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ New Segment</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#23232a', color: '#fafafa', borderRadius: 10, overflow: 'hidden', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th><input type="checkbox" checked={segmentsList.every(s => s.selected)} onChange={e => selectAllSegments(e.target.checked)} aria-label="Select all segments" /></th>
                      <th>Name</th>
                      <th>Rule</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segmentsList.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No segments yet.</td></tr>
                    ) : segmentsList.map(s => (
                      <tr key={s.id} style={{ background: s.selected ? '#e0e7ff' : undefined }}>
                        <td><input type="checkbox" checked={!!s.selected} onChange={() => toggleSelectSegment(s.id)} aria-label={`Select segment ${s.name}`} /></td>
                        <td>{s.name}</td>
                        <td>{s.rule}</td>
                        <td>{s.created}</td>
                        <td>
                          <button onClick={() => openSegmentModal(s)} style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginRight: 6 }}>Edit</button>
                          <button onClick={() => setSegmentsList(list => list.filter(x => x.id !== s.id))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Bulk Actions */}
                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                  <button onClick={deleteSelectedSegments} disabled={!segmentsList.some(s => s.selected)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Delete Selected</button>
                </div>
              </div>
              {/* Segment Modal (Add/Edit) */}
              {showSegmentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
                  <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 400, maxWidth: 480, boxShadow: '0 8px 40px #0008', position: 'relative' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>{editingSegment ? 'Edit Segment' : 'New Segment'}</h3>
                    <form onSubmit={e => { e.preventDefault(); saveSegment(editingSegment ? editingSegment : { name: '', rule: '', created: new Date().toISOString().slice(0, 10) }); }}>
                      <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-segment-name">Name</label>
                      <input id="modal-segment-name" value={editingSegment ? editingSegment.name : ''} onChange={e => setEditingSegment(editingSegment ? { ...editingSegment, name: e.target.value } : { name: e.target.value, rule: '', created: new Date().toISOString().slice(0, 10) })} placeholder="Segment name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                      <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-segment-rule">Rule</label>
                      <input id="modal-segment-rule" value={editingSegment ? editingSegment.rule : ''} onChange={e => setEditingSegment(editingSegment ? { ...editingSegment, rule: e.target.value } : { name: '', rule: e.target.value, created: new Date().toISOString().slice(0, 10) })} placeholder="Rule (e.g. Spent > $500)" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button type="button" onClick={closeSegmentModal} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{editingSegment ? 'Save Changes' : 'Create Segment'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {activeSection === 'templates' && (
          <section aria-label="Templates">
            <WinbackFeatureCard title="Templates" description="Manage and create message templates for campaigns." icon="📝" />
            <div style={{ background: '#23232a', color: '#fafafa', borderRadius: 14, boxShadow: '0 2px 8px #0004', padding: 24, marginBottom: 24 }}>
              <WinbackFeatureCard title="Templates" description="Manage and create message templates for campaigns." icon="📝" />
              {/* Templates Table & Bulk Actions */}
              <div style={{ marginTop: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>Your Templates</div>
                  <button onClick={() => openTemplateModal()} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ New Template</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--background-secondary)', borderRadius: 10, overflow: 'hidden', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th><input type="checkbox" checked={templatesList.every(t => t.selected)} onChange={e => selectAllTemplates(e.target.checked)} aria-label="Select all templates" /></th>
                      <th>Name</th>
                      <th>Channel</th>
                      <th>Content</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templatesList.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No templates yet.</td></tr>
                    ) : templatesList.map(t => (
                      <tr key={t.id} style={{ background: t.selected ? '#e0e7ff' : undefined }}>
                        <td><input type="checkbox" checked={!!t.selected} onChange={() => toggleSelectTemplate(t.id)} aria-label={`Select template ${t.name}`} /></td>
                        <td>{t.name}</td>
                        <td>{t.channel}</td>
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.content}</td>
                        <td>{t.created}</td>
                        <td>
                          <button onClick={() => openTemplateModal(t)} style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginRight: 6 }}>Edit</button>
                          <button onClick={() => setTemplatesList(list => list.filter(x => x.id !== t.id))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Bulk Actions */}
                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                  <button onClick={deleteSelectedTemplates} disabled={!templatesList.some(t => t.selected)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Delete Selected</button>
                </div>
              </div>
              {/* Template Modal (Add/Edit) */}
              {showTemplateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
                  <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 400, maxWidth: 480, boxShadow: '0 8px 40px #0008', position: 'relative' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
                    <form onSubmit={e => { e.preventDefault(); saveTemplate(editingTemplate ? editingTemplate : { name: '', channel: 'email', content: '', created: new Date().toISOString().slice(0, 10) }); }}>
                      <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-template-name">Name</label>
                      <input id="modal-template-name" value={editingTemplate ? editingTemplate.name : ''} onChange={e => setEditingTemplate(editingTemplate ? { ...editingTemplate, name: e.target.value } : { name: e.target.value, channel: 'email', content: '', created: new Date().toISOString().slice(0, 10) })} placeholder="Template name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                      <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-template-channel">Channel</label>
                      <select id="modal-template-channel" value={editingTemplate ? editingTemplate.channel : 'email'} onChange={e => setEditingTemplate(editingTemplate ? { ...editingTemplate, channel: e.target.value } : { name: '', channel: e.target.value, content: '', created: new Date().toISOString().slice(0, 10) })} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="push">Push</option>
                      </select>
                      <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-template-content">Content</label>
                      <textarea id="modal-template-content" value={editingTemplate ? editingTemplate.content : ''} onChange={e => setEditingTemplate(editingTemplate ? { ...editingTemplate, content: e.target.value } : { name: '', channel: 'email', content: e.target.value, created: new Date().toISOString().slice(0, 10) })} placeholder="Template content" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12, minHeight: 80 }} required />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button type="button" onClick={closeTemplateModal} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{editingTemplate ? 'Save Changes' : 'Create Template'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {activeSection === 'abTesting' && (
          <section aria-label="A/B Testing">
            <WinbackFeatureCard title="A/B Testing" description="Run experiments to optimize winback strategies." icon="🧪" />
            <div style={{ background: '#23232a', color: '#fafafa', borderRadius: 14, boxShadow: '0 2px 8px #0004', padding: 24, marginBottom: 24 }}>
              <WinbackFeatureCard title="A/B Testing" description="Run experiments to optimize winback strategies." icon="🧪" />
              {/* Experiments Table & Bulk Actions */}
              <div style={{ marginTop: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>Your Experiments</div>
                  <button onClick={() => openExperimentModal()} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ New Experiment</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--background-secondary)', borderRadius: 10, overflow: 'hidden', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th><input type="checkbox" checked={experimentsList.every(e => e.selected)} onChange={e => selectAllExperiments(e.target.checked)} aria-label="Select all experiments" /></th>
                      <th>Name</th>
                      <th>Variant A</th>
                      <th>Variant B</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experimentsList.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No experiments yet.</td></tr>
                    ) : experimentsList.map(e => (
                      <tr key={e.id} style={{ background: e.selected ? '#e0e7ff' : undefined }}>
                        <td><input type="checkbox" checked={!!e.selected} onChange={() => toggleSelectExperiment(e.id)} aria-label={`Select experiment ${e.name}`} /></td>
                        <td>{e.name}</td>
                        <td>{e.variantA}</td>
                        <td>{e.variantB}</td>
                        <td>{e.status}</td>
                        <td>{e.created}</td>
                        <td>
                          <button onClick={() => openExperimentModal(e)} style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginRight: 6 }}>Edit</button>
                          <button onClick={() => setExperimentsList(list => list.filter(x => x.id !== e.id))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Bulk Actions */}
                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                  <button onClick={deleteSelectedExperiments} disabled={!experimentsList.some(e => e.selected)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Delete Selected</button>
                </div>
              </div>
              {/* Experiment Modal (Add/Edit) */}
              {showExperimentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
                  <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 400, maxWidth: 480, boxShadow: '0 8px 40px #0008', position: 'relative' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>{editingExperiment ? 'Edit Experiment' : 'New Experiment'}</h3>
                    <form onSubmit={e => { e.preventDefault(); saveExperiment(editingExperiment ? editingExperiment : { name: '', variantA: '', variantB: '', status: 'draft', created: new Date().toISOString().slice(0, 10) }); }}>
                      <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-experiment-name">Name</label>
                      <input id="modal-experiment-name" value={editingExperiment ? editingExperiment.name : ''} onChange={e => setEditingExperiment(editingExperiment ? { ...editingExperiment, name: e.target.value } : { name: e.target.value, variantA: '', variantB: '', status: 'draft', created: new Date().toISOString().slice(0, 10) })} placeholder="Experiment name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                      <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-experiment-variantA">Variant A</label>
                      <input id="modal-experiment-variantA" value={editingExperiment ? editingExperiment.variantA : ''} onChange={e => setEditingExperiment(editingExperiment ? { ...editingExperiment, variantA: e.target.value } : { name: '', variantA: e.target.value, variantB: '', status: 'draft', created: new Date().toISOString().slice(0, 10) })} placeholder="Variant A" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                      <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-experiment-variantB">Variant B</label>
                      <input id="modal-experiment-variantB" value={editingExperiment ? editingExperiment.variantB : ''} onChange={e => setEditingExperiment(editingExperiment ? { ...editingExperiment, variantB: e.target.value } : { name: '', variantA: '', variantB: e.target.value, status: 'draft', created: new Date().toISOString().slice(0, 10) })} placeholder="Variant B" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 12 }} required />
                      <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-experiment-status">Status</label>
                      <select id="modal-experiment-status" value={editingExperiment ? editingExperiment.status : 'draft'} onChange={e => setEditingExperiment(editingExperiment ? { ...editingExperiment, status: e.target.value } : { name: '', variantA: '', variantB: '', status: e.target.value, created: new Date().toISOString().slice(0, 10) })} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', width: '100%', marginBottom: 18 }} required>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                      </select>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button type="button" onClick={closeExperimentModal} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{editingExperiment ? 'Save Changes' : 'Create Experiment'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {activeSection === 'analytics' && (
          <section aria-label="Analytics">
            <WinbackFeatureCard title="Analytics" description="View performance metrics and insights for your campaigns." icon="📊" />
            {/* Analytics Summary Cards */}
            <div style={{ display: 'flex', gap: 24, margin: '24px 0' }}>
              <div style={{ background: '#232336', borderRadius: 10, padding: 18, minWidth: 180 }}>
                <div style={{ fontSize: 13, color: '#aaa' }}>Recovered Revenue</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>
                  ${analytics.reduce((sum, e) => sum + (e.recoveredRevenue || 0), 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: '#232336', borderRadius: 10, padding: 18, minWidth: 180 }}>
                <div style={{ fontSize: 13, color: '#aaa' }}>Emails Sent</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>
                  {analytics.reduce((sum, e) => sum + (e.emailsSent || 0), 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: '#232336', borderRadius: 10, padding: 18, minWidth: 180 }}>
                <div style={{ fontSize: 13, color: '#aaa' }}>Conversions</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e42' }}>
                  {analytics.reduce((sum, e) => sum + (e.conversions || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>
            {/* Analytics Chart */}
            <WinbackAnalyticsChart data={analytics} />
            {/* Analytics Table */}
            <div style={{ background: '#18181b', borderRadius: 10, padding: 18, marginTop: 18 }}>
              <table style={{ width: '100%', color: '#fff', fontSize: 15 }}>
                <thead>
                  <tr style={{ color: '#aaa', textAlign: 'left' }}>
                    <th>Date</th>
                    <th>Recovered Revenue</th>
                    <th>Emails Sent</th>
                    <th>Conversions</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((e, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #232336' }}>
                      <td>{e.timestamp || e.date || ''}</td>
                      <td>${(e.recoveredRevenue || 0).toLocaleString()}</td>
                      <td>{e.emailsSent || 0}</td>
                      <td>{e.conversions || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.length === 0 && <div style={{ color: '#aaa', padding: 12 }}>No analytics data yet.</div>}
            </div>
          </section>
        )}
        {activeSection === 'integrations' && (
          <section aria-label="Integrations">
            <WinbackFeatureCard title="Integrations" description="Connect third-party services for enhanced winback capabilities." icon="🔗" />
            <IntegrationsSection />
          </section>
        )}
        {activeSection === 'notifications' && <NotificationsSection />}



        {activeSection === 'activityLog' && (
          <section aria-label="Activity Log">
            <WinbackFeatureCard title="Activity Log" description="Timeline of all actions, sends, edits, and results. Export, search, and filter options." icon="📜" />
            {/* ...activity log code... */}
          </section>
        )}
        {activeSection === 'compliance' && (
          <section aria-label="Compliance">
            <WinbackFeatureCard title="Compliance Center" description="GDPR/CCPA tools, opt-out, audit logs, data export/delete, and deliverability best practices." icon="🛡️" />
            {/* ...compliance code... */}
          </section>
        )}
        {activeSection === 'settings' && (
          <section aria-label="Settings">
            <WinbackFeatureCard title="Settings" description="Configure tool preferences, notification options, and advanced settings. Personalize your winback experience." icon="⚙️" />
            {/* ...settings code... */}
          </section>
        )}
        {activeSection === 'help' && (
          <section aria-label="Help & Docs">
            <WinbackFeatureCard title="Help & Documentation" description="Browse FAQs, onboarding guides, and get support. Everything you need to master winback automation." icon="❓" />
            <div style={{ margin: '32px 0', background: '#f9fafb', borderRadius: 14, boxShadow: '0 2px 8px #0001', padding: 32 }}>
              <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Documentation & Guides</h3>
              <WinbackHelpDocs />
              <div style={{ marginTop: 32 }}>
                <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Frequently Asked Questions</h4>
                <ul style={{ fontSize: 15, color: '#334155', paddingLeft: 24 }}>
                  <li><b>How do I create a winback campaign?</b> Use the Campaigns section to create, schedule, and manage campaigns. Click '+ New Campaign' to get started.</li>
                  <li><b>Can I automate cart recovery?</b> Yes! Use the Automation section to set up triggers and actions for cart recovery workflows.</li>
                  <li><b>How do I connect integrations?</b> Go to Integrations and click '+ Connect Integration' to link third-party services like Shopify or Klaviyo.</li>
                  <li><b>Where can I find analytics?</b> The Analytics section provides charts, summary cards, and event logs for all winback activity.</li>
                  <li><b>How do I get support?</b> Click 'Contact Support' below or email support@aura-core.ai for help.</li>
                </ul>
              </div>
              <div style={{ marginTop: 32, textAlign: 'center' }}>
                <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 700, fontSize: 16 }}>Contact Support</a>
              </div>
            </div>
          </section>
        )}
        </div>
      </div>
    );
  }

export default AbandonedCheckoutWinback;
// End of file
