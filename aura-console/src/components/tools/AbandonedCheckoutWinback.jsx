// --- User Guide Modal ---
function UserGuideModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
      <div style={{ background: '#18181b', borderRadius: 14, padding: 32, minWidth: 340, boxShadow: '0 8px 40px #0008', position: 'relative', color: '#fafafa' }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Abandoned Checkout Winback Guide</h2>
        <ol style={{ fontSize: 16, marginBottom: 18, lineHeight: 1.7 }}>
          <li><b>Create Segments:</b> Group customers by behavior, value, or activity.</li>
          <li><b>Use Templates:</b> Start quickly with pre-built segment templates.</li>
          <li><b>Analyze Performance:</b> Use segment stats to see what works.</li>
          <li><b>Bulk Actions:</b> Select multiple segments for fast management.</li>
          <li><b>Onboarding & Tooltips:</b> Hover for tips, and use the onboarding banner for a quick start.</li>
        </ol>
        <div style={{ fontSize: 15, color: '#a1a1aa', marginBottom: 18 }}>
          For more help, contact support or check the documentation.
        </div>
        <button onClick={onClose} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8 }}>Close</button>
      </div>
    </div>
  );
}

// --- Onboarding Banner ---
function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('acw_onboarding_dismissed') === '1';
    } catch { return false; }
  });
  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('acw_onboarding_dismissed', '1'); } catch {}
  };
  if (dismissed) return null;
  return (
    <div style={{ background: '#6366f1', color: '#fff', borderRadius: 10, padding: 18, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px #0004' }}>
      <div>
        <b>Welcome to Abandoned Checkout Winback!</b> <br />
        <span style={{ fontSize: 15 }}>
          1. Create segments to target specific customer groups.<br />
          2. Use templates for quick setup.<br />
          3. Analyze performance and iterate.<br />
        </span>
      </div>
      <button onClick={handleDismiss} style={{ background: '#18181b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginLeft: 18 }}>Dismiss</button>
    </div>
  );
}

// --- Customer Lifecycle Bar Component ---
function CustomerLifecycleBar({ segments, onFilter, selectedStage }) {
  // Best-practice lifecycle stages
  const stages = [
    { key: 'New', label: 'New', desc: 'Signed up <30d ago' },
    { key: 'Active', label: 'Active', desc: 'Purchased in last 30d' },
    { key: 'At Risk', label: 'At Risk', desc: 'No purchase 30-60d' },
    { key: 'Churned', label: 'Churned', desc: 'No purchase >60d' },
    { key: 'Loyal', label: 'Loyal', desc: 'Repeat/high-value' },
  ];
  // Count segments by stage (mock logic, real logic should use customer data)
  const counts = stages.reduce((acc, stage) => {
    acc[stage.key] = segments.filter(s => s.lifecycleStage === stage.key).length;
    return acc;
  }, {});
  return (
    <div style={{ display: 'flex', gap: 18, margin: '18px 0 18px 0', alignItems: 'center' }}>
      {stages.map(stage => (
        <button
          key={stage.key}
          onClick={() => onFilter(stage.key)}
          style={{
            background: selectedStage === stage.key ? '#232336' : '#18181b',
            color: '#fafafa',
            border: selectedStage === stage.key ? '2px solid #6366f1' : '1px solid #232336',
            borderRadius: 8,
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            minWidth: 110,
            boxShadow: selectedStage === stage.key ? '0 2px 8px #0004' : undefined,
            outline: 'none',
            transition: 'all 0.2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
          aria-pressed={selectedStage === stage.key}
          title={stage.desc + ' (Click to filter segments by this stage)'}
        >
          <span title={stage.desc}>{stage.label}</span>
          <span style={{ fontSize: 13, fontWeight: 400, color: '#a1a1aa' }} title="Number of segments in this stage">{counts[stage.key] || 0} segments</span>
        </button>
      ))}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
// --- Main Abandoned Checkout Winback Component (add guide button) ---
function AbandonedCheckoutWinbackMain(props) {
  const [showGuide, setShowGuide] = useState(false);
  // ...existing code...
  return (
    <>
      <OnboardingBanner />
      <button onClick={() => setShowGuide(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 18 }}>User Guide</button>
      <UserGuideModal open={showGuide} onClose={() => setShowGuide(false)} />
      {/* ...rest of the tool UI... */}
    </>
  );
}
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
                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</td>
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
            <div style={{ background: 'var(--background-secondary, #23232a)', color: 'var(--text-primary, #fafafa)', borderRadius: 14, padding: 32, minWidth: 400, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px #0008', position: 'relative' }}>
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

// --- Segment Statistics Enhancement ---
function SegmentStatistics({ segments }) {
  const totalSegments = segments.length;
  const totalCustomers = segments.reduce((sum, s) => sum + (s.customerCount || 0), 0);
  const avgWinbackRate = segments.length
    ? (segments.reduce((sum, s) => sum + (s.winbackRate || 0), 0) / segments.length).toFixed(2)
    : '0.00';
  return (
    <div style={{ display: 'flex', gap: 24, margin: '18px 0' }}>
      <div style={{ background: '#232336', border: '1px solid #232336', borderRadius: 10, padding: 18, minWidth: 140 }}>
        <div style={{ fontSize: 13, color: '#a1a1aa' }}>Total Segments</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#fafafa' }}>{totalSegments}</div>
      </div>
      <div style={{ background: '#232336', border: '1px solid #232336', borderRadius: 10, padding: 18, minWidth: 140 }}>
        <div style={{ fontSize: 13, color: '#a1a1aa' }}>Total Customers</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#fafafa' }}>{totalCustomers}</div>
      </div>
      <div style={{ background: '#232336', border: '1px solid #232336', borderRadius: 10, padding: 18, minWidth: 140 }}>
        <div style={{ fontSize: 13, color: '#a1a1aa' }}>Avg. Winback Rate</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#fafafa' }}>{avgWinbackRate}%</div>
      </div>
    </div>
  );
}

// --- Compliance flagship section ---
function ComplianceSection() {
  const [exporting, setExporting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [optedOut, setOptedOut] = React.useState(false);
  const [complianceError, setComplianceError] = React.useState("");
  const [complianceSuccess, setComplianceSuccess] = React.useState("");
  const [auditLog, setAuditLog] = React.useState([]);
  const [showAudit, setShowAudit] = React.useState(false);

  React.useEffect(() => {
    apiFetch('/api/abandoned-checkout-winback/compliance-status')
      .then(async resp => {
        if (!resp.ok) throw new Error('Failed to fetch compliance status');
        const data = await resp.json();
        setOptedOut(!!data.optedOut);
      })
      .catch(() => setOptedOut(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setComplianceError("");
    setComplianceSuccess("");
    try {
      const resp = await apiFetch('/api/abandoned-checkout-winback/export-data');
      if (!resp.ok) throw new Error('Failed to export data');
      const data = await resp.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-compliance-export-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setComplianceSuccess('Data export complete.');
    } catch (e) {
      setComplianceError(e.message);
    }
    setExporting(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure? This will permanently delete all your data and cannot be undone.')) return;
    setDeleting(true);
    setComplianceError("");
    setComplianceSuccess("");
    try {
      const resp = await apiFetch('/api/abandoned-checkout-winback/delete-data', { method: 'POST' });
      if (!resp.ok) throw new Error('Failed to delete data');
      setComplianceSuccess('Your data has been deleted.');
    } catch (e) {
      setComplianceError(e.message);
    }
    setDeleting(false);
  };

  const handleOptOut = async () => {
    setComplianceError("");
    setComplianceSuccess("");
    try {
      const resp = await apiFetch('/api/abandoned-checkout-winback/opt-out', { method: 'POST' });
      if (!resp.ok) throw new Error('Failed to opt out');
      setOptedOut(true);
      setComplianceSuccess('You have been opted out.');
    } catch (e) {
      setComplianceError(e.message);
    }
  };

  const handleShowAudit = async () => {
    setComplianceError("");
    setShowAudit(true);
    try {
      const resp = await apiFetch('/api/abandoned-checkout-winback/audit');
      if (!resp.ok) throw new Error('Failed to fetch audit log');
      const data = await resp.json();
      setAuditLog(Array.isArray(data.logs) ? data.logs : []);
    } catch (e) {
      setComplianceError(e.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <button onClick={handleExport} disabled={exporting} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginRight: 16 }}>Export My Data</button>
        <button onClick={handleDelete} disabled={deleting} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginRight: 16 }}>Delete My Data</button>
        <button onClick={handleOptOut} disabled={optedOut} style={{ background: optedOut ? '#64748b' : '#f59e42', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 16, cursor: optedOut ? 'not-allowed' : 'pointer', marginRight: 16 }}>{optedOut ? 'Opted Out' : 'Opt Out'}</button>
        <button onClick={handleShowAudit} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>View Audit Log</button>
      </div>
      {complianceError && <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 12 }}>{complianceError}</div>}
      {complianceSuccess && <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 12 }}>{complianceSuccess}</div>}
      {showAudit && (
        <div style={{ background: '#18181b', borderRadius: 10, padding: 18, marginTop: 18, maxHeight: 320, overflowY: 'auto' }}>
          <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>Audit Log</h4>
          <table style={{ width: '100%', color: '#fff', fontSize: 15 }}>
            <thead>
              <tr style={{ color: '#aaa', textAlign: 'left' }}>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Type</th>
                <th>Campaign</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.length === 0 ? (
                <tr><td colSpan={6} style={{ color: '#64748b', padding: 18 }}>No audit log entries.</td></tr>
              ) : auditLog.map((log, i) => (
                <tr key={i} style={{ borderTop: '1px solid #232336' }}>
                  <td>{log.timestamp || '-'}</td>
                  <td>{log.user || '-'}</td>
                  <td>{log.action || '-'}</td>
                  <td>{log.type || '-'}</td>
                  <td>{log.campaignId || '-'}</td>
                  <td>{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 32, color: '#64748b', fontSize: 14 }}>
        <b>Note:</b> These tools help you comply with GDPR/CCPA. Data export/download is instant. Data deletion is permanent. Opt-out disables all processing for your account/shop. For more, contact support@aura-core.ai.
      </div>
    </div>
  );
}

function AbandonedCheckoutWinback() {
        // --- A/B Testing Section UI ---
        function ABTestingSection() {
          return (
            <section aria-label="A/B Testing">
              <WinbackFeatureCard title="A/B Testing" description="Run experiments to optimize winback strategies." icon="🧪" />
              <div style={{ background: '#23232a', color: '#fafafa', borderRadius: 14, boxShadow: '0 2px 8px #0004', padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>Your Experiments</div>
                  <button onClick={() => setShowExperimentModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ New Experiment</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#232336', borderRadius: 10, overflow: 'hidden', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#18181b' }}>
                      <th><input type="checkbox" checked={experimentsList.length > 0 && experimentsList.every(e => e.selected)} onChange={e => selectAllExperiments(e.target.checked)} aria-label="Select all experiments" /></th>
                      <th>Name</th>
                      <th>Segment</th>
                      <th>Variant A</th>
                      <th>Variant B</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Results</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experimentsList.length === 0 ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No experiments yet.</td></tr>
                    ) : experimentsList.map(exp => (
                      <tr key={exp.id} style={{ background: exp.selected ? '#18181b' : undefined }}>
                        <td><input type="checkbox" checked={!!exp.selected} onChange={() => toggleSelectExperiment(exp.id)} aria-label={`Select experiment ${exp.name}`} /></td>
                        <td>{exp.name}</td>
                        <td>{exp.segment}</td>
                        <td>{exp.variantA}</td>
                        <td>{exp.variantB}</td>
                        <td>{exp.status}</td>
                        <td>{exp.created}</td>
                        <td>{exp.results ? `A: ${exp.results.winbackRateA}% | B: ${exp.results.winbackRateB}%` : '-'}</td>
                        <td>
                          <button onClick={() => openExperimentModal(exp)} style={{ background: '#18181b', color: '#fafafa', border: '1px solid #232336', borderRadius: 6, padding: '4px 12px', fontWeight: 500, fontSize: 14, cursor: 'pointer', marginRight: 6 }}>Edit</button>
                          <button onClick={() => setExperimentsList(list => list.filter(x => x.id !== exp.id))} style={{ background: '#232336', color: '#ef4444', border: '1px solid #232336', borderRadius: 6, padding: '4px 12px', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Bulk Actions */}
                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                  <button onClick={deleteSelectedExperiments} disabled={!experimentsList.some(e => e.selected)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Delete Selected</button>
                </div>
                {/* Experiment Modal (Add/Edit) */}
                {showExperimentModal && (
                  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
                    <div style={{ background: '#232336', color: '#fafafa', borderRadius: 14, padding: 32, minWidth: 400, boxShadow: '0 8px 40px #0008', position: 'relative' }}>
                      <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>{editingExperiment ? 'Edit Experiment' : 'New Experiment'}</h3>
                      <form onSubmit={e => { e.preventDefault(); saveExperiment(editingExperiment ? editingExperiment : { name: '', segment: '', variantA: '', variantB: '', status: 'draft', created: new Date().toISOString().slice(0, 10), results: null }); }}>
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }} htmlFor="modal-experiment-name">Name</label>
                        <input id="modal-experiment-name" value={editingExperiment ? editingExperiment.name : ''} onChange={e => setEditingExperiment(editingExperiment ? { ...editingExperiment, name: e.target.value } : { name: e.target.value, segment: '', variantA: '', variantB: '', status: 'draft', created: new Date().toISOString().slice(0, 10), results: null })} placeholder="Experiment name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #333', width: '100%', marginBottom: 12 }} required />
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }}>Segment</label>
                        <input value={editingExperiment ? editingExperiment.segment : ''} onChange={e => setEditingExperiment(editingExperiment ? { ...editingExperiment, segment: e.target.value } : { name: '', segment: e.target.value, variantA: '', variantB: '', status: 'draft', created: new Date().toISOString().slice(0, 10), results: null })} placeholder="Segment name" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #333', width: '100%', marginBottom: 12 }} required />
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }}>Variant A</label>
                        <input value={editingExperiment ? editingExperiment.variantA : ''} onChange={e => setEditingExperiment(editingExperiment ? { ...editingExperiment, variantA: e.target.value } : { name: '', segment: '', variantA: e.target.value, variantB: '', status: 'draft', created: new Date().toISOString().slice(0, 10), results: null })} placeholder="Variant A" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #333', width: '100%', marginBottom: 12 }} required />
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }}>Variant B</label>
                        <input value={editingExperiment ? editingExperiment.variantB : ''} onChange={e => setEditingExperiment(editingExperiment ? { ...editingExperiment, variantB: e.target.value } : { name: '', segment: '', variantA: '', variantB: e.target.value, status: 'draft', created: new Date().toISOString().slice(0, 10), results: null })} placeholder="Variant B" style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #333', width: '100%', marginBottom: 12 }} required />
                        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }}>Status</label>
                        <select value={editingExperiment ? editingExperiment.status : 'draft'} onChange={e => setEditingExperiment(editingExperiment ? { ...editingExperiment, status: e.target.value } : { name: '', segment: '', variantA: '', variantB: '', status: e.target.value, created: new Date().toISOString().slice(0, 10), results: null })} style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #333', width: '100%', marginBottom: 18 }} required>
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                          <button type="button" onClick={closeExperimentModal} style={{ background: '#232336', color: '#fafafa', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{editingExperiment ? 'Save Changes' : 'Create Experiment'}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        }
      // Customer lifecycle filter state
      const [lifecycleFilter, setLifecycleFilter] = useState(null);
    // --- Analytics state for Analytics section ---
    const [analytics, setAnalytics] = useState([]);

    // --- Activity Log flagship state and logic ---
    const [activityLog, setActivityLog] = useState([]);
    const [activityLogColumns, setActivityLogColumns] = useState([
      { key: 'timestamp', label: 'Timestamp', visible: true },
      { key: 'user', label: 'User', visible: true },
      { key: 'action', label: 'Action', visible: true },
      { key: 'type', label: 'Type', visible: true },
      { key: 'campaignId', label: 'Campaign', visible: true },
      { key: 'details', label: 'Details', visible: true },
    ]);
    const [activityLogSearch, setActivityLogSearch] = useState("");
    const [activityLogFilters, setActivityLogFilters] = useState({ user: "", action: "", type: "", campaignId: "" });
    const [showLogDetails, setShowLogDetails] = useState(false);
    const [logDetails, setLogDetails] = useState(null);

    // Fetch activity log from backend
    useEffect(() => {
      fetch('/api/abandoned-checkout-winback/audit')
        .then(resp => resp.json())
        .then(data => setActivityLog(Array.isArray(data.logs) ? data.logs : []))
        .catch(() => setActivityLog([]));
    }, []);

    // Filtered activity log (search + filters)
    const filteredActivityLog = React.useMemo(() => {
      return activityLog.filter(log => {
        const matchesSearch =
          !activityLogSearch ||
          Object.values(log).some(val =>
            String(val || '').toLowerCase().includes(activityLogSearch.toLowerCase())
          );
        const matchesUser = !activityLogFilters.user || (log.user || '').toLowerCase().includes(activityLogFilters.user.toLowerCase());
        const matchesAction = !activityLogFilters.action || (log.action || '').toLowerCase().includes(activityLogFilters.action.toLowerCase());
        const matchesType = !activityLogFilters.type || (log.type || '').toLowerCase().includes(activityLogFilters.type.toLowerCase());
        const matchesCampaign = !activityLogFilters.campaignId || (log.campaignId || '').toLowerCase().includes(activityLogFilters.campaignId.toLowerCase());
        return matchesSearch && matchesUser && matchesAction && matchesType && matchesCampaign;
      });
    }, [activityLog, activityLogSearch, activityLogFilters]);

    // Export CSV
    const exportActivityLog = () => {
      const cols = activityLogColumns.filter(c => c.visible);
      const header = cols.map(c => c.label).join(',');
      const rows = filteredActivityLog.map(log =>
        cols.map(c => '"' + String(log[c.key] || '').replace(/"/g, '""') + '"').join(',')
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-log-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Column toggles
    const toggleColumn = (key) => {
      setActivityLogColumns(cols => cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
    };

    // Log details modal
    const openLogDetails = (log) => {
      setLogDetails(log);
      setShowLogDetails(true);
    };
    const closeLogDetails = () => {
      setShowLogDetails(false);
      setLogDetails(null);
    };
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
      // --- AI Segment Builder state ---
      const [aiSegmentPrompt, setAISegmentPrompt] = useState("");
      const [aiSegmentLoading, setAISegmentLoading] = useState(false);
      const [aiSegmentError, setAISegmentError] = useState("");
      const [aiSegmentResult, setAISegmentResult] = useState(null);
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
              {/* ...existing code for table body and modal... */}
            </table>
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
            style={{ marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #333', width: '100%', fontSize: 15 }}
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
              <div style={{ background: '#18181b', borderRadius: 14, padding: 32, minWidth: 340, boxShadow: '0 8px 40px #0008', position: 'relative', color: '#fafafa' }}>
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

    // Quick Actions for Segments
    function SegmentQuickActions({ segment, onSend, onPreview }) {
      return (
        <span style={{ display: 'inline-flex', gap: 8 }}>
          <button
            title="Send Winback Email"
            style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            onClick={() => onSend(segment)}
          >Send</button>
          <button
            title="Preview Winback Email"
            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            onClick={() => onPreview(segment)}
          >Preview</button>
        </span>
      );
    }

    // Handler stubs for quick actions
    const handleSendWinback = (segment) => {
      alert(`Send Winback Email for segment: ${segment.name}`);
    };
    const handlePreviewWinback = (segment) => {
      alert(`Preview Winback Email for segment: ${segment.name}`);
    };

    // --- Main component return
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#18181b' }}>
        {/* Flagship Navigation Sidebar */}
        <nav aria-label="Winback flagship navigation" style={{
          width: 120,
          background: '#18181b',
          borderRight: '1px solid #232336',
          padding: '16px 0 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
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
        <div style={{ flex: 1, minWidth: 0 }}>
        {activeSection === 'segments' && (
          <>
            {/* --- Custom Segment Builder --- */}
            <div style={{ marginBottom: 28, background: '#232336', borderRadius: 10, padding: 18 }}>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Custom Segment Builder</h4>
              <div style={{ fontSize: 15, color: '#a1a1aa', marginTop: 6, marginBottom: 10 }}>
                Build your own segment by combining rules and filters. Mix purchase history, engagement, demographics, and more.
              </div>
              <CustomSegmentBuilder onCreate={segment => setSegmentsList(list => [...list, { ...segment, id: Date.now(), created: new Date().toISOString().slice(0, 10), selected: false }])} />
            </div>
            <section aria-label="Segments">
            <WinbackFeatureCard title="Advanced Segmentation" description="Create, manage, and apply dynamic customer segments. Saved segments, rule builder, and filters." icon="👥" />
            <div style={{ background: '#23232a', color: '#fafafa', borderRadius: 14, boxShadow: '0 2px 8px #0004', padding: 24, marginBottom: 24 }}>
              {/* --- AI-Based Segmentation --- */}
              <div style={{ marginBottom: 20, background: '#232336', borderRadius: 10, padding: 18 }}>
                <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>AI Segment Builder</h4>
                <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={aiSegmentPrompt || ''}
                    onChange={e => setAISegmentPrompt(e.target.value)}
                    placeholder="Describe your segment (e.g. 'VIPs who abandoned cart')"
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #333', fontSize: 15, background: '#18181b', color: '#fafafa' }}
                  />
                  <button
                    onClick={async () => {
                      setAISegmentLoading(true);
                      setAISegmentError("");
                      setAISegmentResult(null);
                      try {
                        const resp = await apiFetch('/api/abandoned-checkout-winback/ai-segment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ prompt: aiSegmentPrompt })
                        });
                        if (!resp.ok) throw new Error('AI failed to generate segment');
                        const data = await resp.json();
                        setAISegmentResult(data.segment);
                      } catch (e) {
                        setAISegmentError(e.message);
                      }
                      setAISegmentLoading(false);
                    }}
                    disabled={!aiSegmentPrompt || aiSegmentLoading}
                    style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: aiSegmentLoading ? 'not-allowed' : 'pointer' }}
                  >{aiSegmentLoading ? 'Generating...' : 'Generate Segment'}</button>
                </div>
                {aiSegmentError && <div style={{ color: '#f87171', marginTop: 8 }}>{aiSegmentError}</div>}
                {aiSegmentResult && (
                  <div style={{ marginTop: 16, background: '#18181b', borderRadius: 8, padding: 14, color: '#a7f3d0' }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>AI Suggestion:</div>
                    <pre style={{ margin: 0, fontSize: 15, color: '#a7f3d0' }}>{JSON.stringify(aiSegmentResult, null, 2)}</pre>
                    <button
                      onClick={() => {
                        setSegmentsList(list => [
                          ...list,
                          {
                            id: Date.now(),
                            name: aiSegmentResult.name || aiSegmentPrompt,
                            rule: aiSegmentResult.rule || aiSegmentPrompt,
                            created: new Date().toISOString().slice(0, 10),
                            selected: false
                          }
                        ]);
                        setAISegmentPrompt("");
                        setAISegmentResult(null);
                      }}
                      style={{ marginTop: 10, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                    >Add to Segments</button>
                  </div>
                )}
              </div>
              {/* --- Dynamic & Real-Time Segments --- */}
              <div style={{ marginBottom: 28, background: '#232336', borderRadius: 10, padding: 18 }}>
                <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Dynamic & Real-Time Segments</h4>
                <div style={{ fontSize: 15, color: '#a1a1aa', marginTop: 6, marginBottom: 10 }}>
                  Segments update automatically as customer data changes. Segments are kept in sync with your store and customer activity in real time.
                </div>
                <button
                  onClick={async () => {
                    // Simulate fetching new segments from backend/store
                    try {
                      const resp = await apiFetch('/api/abandoned-checkout-winback/segments/refresh', { method: 'POST' });
                      if (!resp.ok) throw new Error('Failed to refresh segments');
                      const data = await resp.json();
                      setSegmentsList(data.segments || []);
                    } catch (e) {
                      alert('Failed to refresh segments: ' + e.message);
                    }
                  }}
                  style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 8 }}
                >Refresh Segments from Store</button>
                <div style={{ fontSize: 14, color: '#a1a1aa' }}>
                  (Segments reflect live store/customer data.)
                </div>
              </div>
              {/* --- Pre-Built Segment Templates --- */}
              <div style={{ marginBottom: 28, background: '#232336', borderRadius: 10, padding: 18 }}>
                <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Pre-Built Segment Templates</h4>
                <div style={{ fontSize: 15, color: '#a1a1aa', marginTop: 6, marginBottom: 10 }}>
                  Quickly add common segments with one click. Templates are based on best practices from top ecommerce platforms.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {[
                    { name: 'First-Time Buyers', rule: 'Order count = 1', description: 'Customers who made their first purchase.' },
                    { name: 'Repeat Customers', rule: 'Order count > 1', description: 'Customers with multiple purchases.' },
                    { name: 'High Spenders', rule: 'Spent > $1000', description: 'Customers who spent over $1000.' },
                    { name: 'Inactive Users', rule: 'No purchase in 90d', description: 'No purchase in last 90 days.' },
                    { name: 'Cart Abandoners', rule: 'Abandoned cart in last 30d', description: 'Abandoned a cart in last 30 days.' },
                    { name: 'Recent Purchasers', rule: 'Order in last 7d', description: 'Purchased in last 7 days.' },
                    { name: 'New Signups', rule: 'Signup < 30d', description: 'Signed up in last 30 days.' },
                  ].map(tpl => (
                    <button
                      key={tpl.name}
                      onClick={() => setSegmentsList(list => [
                        ...list,
                        {
                          id: Date.now() + Math.random(),
                          name: tpl.name,
                          rule: tpl.rule,
                          created: new Date().toISOString().slice(0, 10),
                          selected: false
                        }
                      ])}
                      style={{ background: '#18181b', color: '#fff', border: '1px solid #333', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', minWidth: 180, textAlign: 'left' }}
                      title={tpl.description}
                    >{tpl.name}<br /><span style={{ fontWeight: 400, fontSize: 13, color: '#a1a1aa' }}>{tpl.description}</span></button>
                  ))}
                </div>
              </div>
              {/* --- Segment Statistics Enhancement --- */}
              <SegmentStatistics segments={segmentsList} />
                            {/* --- Customer Lifecycle Mapping --- */}
                            <CustomerLifecycleBar segments={segmentsList} onFilter={setLifecycleFilter} selectedStage={lifecycleFilter} />
              {/* Segments Table & Bulk Actions */}
              <div style={{ marginTop: 24, marginBottom: 32 }}>
                              {/* Filter segments by lifecycle stage if selected */}
                              {lifecycleFilter && (
                                <div style={{ marginBottom: 12, color: '#0ea5e9', fontWeight: 600 }}>
                                  Showing: {lifecycleFilter} customers
                                  <button onClick={() => setLifecycleFilter(null)} style={{ marginLeft: 16, background: 'none', color: '#ef4444', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Clear Filter</button>
                                </div>
                              )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>Your Segments</div>
                  <button onClick={() => openSegmentModal()} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ New Segment</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#232336', color: '#fafafa', borderRadius: 10, overflow: 'hidden', fontSize: 15, border: '1px solid #232336' }}>
                  <thead>
                    <tr style={{ background: '#18181b' }}>
                      <th style={{ fontWeight: 600, fontSize: 14, color: '#a1a1aa', padding: '12px 8px', borderBottom: '1px solid #232336' }}><input type="checkbox" checked={segmentsList.every(s => s.selected)} onChange={e => selectAllSegments(e.target.checked)} aria-label="Select all segments" /></th>
                      <th style={{ fontWeight: 600, fontSize: 14, color: '#a1a1aa', padding: '12px 8px', borderBottom: '1px solid #232336' }}>Name</th>
                      <th style={{ fontWeight: 600, fontSize: 14, color: '#a1a1aa', padding: '12px 8px', borderBottom: '1px solid #232336' }}>Rule</th>
                      <th style={{ fontWeight: 600, fontSize: 14, color: '#a1a1aa', padding: '12px 8px', borderBottom: '1px solid #232336' }}>Created</th>
                      <th style={{ fontWeight: 600, fontSize: 14, color: '#a1a1aa', padding: '12px 8px', borderBottom: '1px solid #232336' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segmentsList.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: 24, background: '#232336' }}>No segments yet.</td></tr>
                    ) : segmentsList
                        .filter(s => !lifecycleFilter || (s.lifecycleStage === lifecycleFilter))
                        .map(s => (
                          <tr key={s.id} style={{ background: s.selected ? '#18181b' : '#232336', borderBottom: '1px solid #232336' }}>
                            <td style={{ padding: '12px 8px' }}><input type="checkbox" checked={!!s.selected} onChange={() => toggleSelectSegment(s.id)} aria-label={`Select segment ${s.name}`} /></td>
                            <td style={{ padding: '12px 8px', fontWeight: 500 }}>{s.name}</td>
                            <td style={{ padding: '12px 8px', color: '#fafafa' }}>{s.rule}</td>
                            <td style={{ padding: '12px 8px', color: '#a1a1aa' }}>{s.created}</td>
                            <td style={{ verticalAlign: 'top', padding: '12px 8px', minWidth: 320 }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                                <button onClick={() => openSegmentModal(s)} style={{ background: '#18181b', color: '#fafafa', border: '1px solid #232336', borderRadius: 6, padding: '4px 12px', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>Edit</button>
                                <button onClick={() => setSegmentsList(list => list.filter(x => x.id !== s.id))} style={{ background: '#232336', color: '#ef4444', border: '1px solid #232336', borderRadius: 6, padding: '4px 12px', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>Delete</button>
                                <SegmentQuickActions segment={s} onSend={handleSendWinback} onPreview={handlePreviewWinback} />
                                <SegmentPerformanceInsights segment={s} />
                              </div>
                              <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #232336' }}>
                                <SegmentAutomations segment={s} onUpdate={automation => handleUpdateAutomation(s.id, automation)} />
                              </div>
                              <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #232336', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                <CrossChannelTargeting segment={s} onUpdate={channels => handleUpdateChannels(s.id, channels)} />
                                <IncludeExcludeToggle segment={s} onUpdate={mode => handleUpdateIncludeMode(s.id, mode)} />
                              </div>
                              <div style={{ marginBottom: 4, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                <StoreLanguageSelector segment={s} onUpdate={opts => handleUpdateStoreLanguage(s.id, opts)} />
                              </div>
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
                  <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 400, boxShadow: '0 8px 40px #0008', position: 'relative' }}>
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
          </>
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
                        <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.content}</td>
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
                  <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 400, boxShadow: '0 8px 40px #0008', position: 'relative' }}>
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
                  <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 400, boxShadow: '0 8px 40px #0008', position: 'relative' }}>
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
            <div style={{ background: '#23232a', color: '#fafafa', borderRadius: 14, boxShadow: '0 2px 8px #0004', padding: 32, marginBottom: 24, marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 22 }}>Activity Log</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={exportActivityLog} style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export CSV</button>
                  <div style={{ position: 'relative' }}>
                    <button style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Columns ▾</button>
                    <div style={{ position: 'absolute', top: 36, right: 0, background: '#18181c', color: '#fafafa', borderRadius: 8, boxShadow: '0 2px 8px #0008', padding: 12, zIndex: 10 }}>
                      {activityLogColumns.map(col => (
                        <label key={col.key} style={{ display: 'block', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
                          <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} style={{ marginRight: 6 }} /> {col.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <input type="text" placeholder="Search actions, users, details..." value={activityLogSearch} onChange={e => setActivityLogSearch(e.target.value)} style={{ width: '100%', marginBottom: 18, padding: 10, borderRadius: 8, border: '1px solid #333', background: '#18181c', color: '#fafafa', fontSize: 15 }} />
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                <input type="text" placeholder="Filter by user" value={activityLogFilters.user} onChange={e => setActivityLogFilters(f => ({ ...f, user: e.target.value }))} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #333', background: '#18181c', color: '#fafafa', fontSize: 14 }} />
                <input type="text" placeholder="Filter by action" value={activityLogFilters.action} onChange={e => setActivityLogFilters(f => ({ ...f, action: e.target.value }))} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #333', background: '#18181c', color: '#fafafa', fontSize: 14 }} />
                <input type="text" placeholder="Filter by type" value={activityLogFilters.type} onChange={e => setActivityLogFilters(f => ({ ...f, type: e.target.value }))} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #333', background: '#18181c', color: '#fafafa', fontSize: 14 }} />
                <input type="text" placeholder="Filter by campaign" value={activityLogFilters.campaignId} onChange={e => setActivityLogFilters(f => ({ ...f, campaignId: e.target.value }))} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #333', background: '#18181c', color: '#fafafa', fontSize: 14 }} />
              </div>
              {/* Table and details modal logic assumed present in your state/logic */}
              {/* Example Table UI: */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--background-secondary)', borderRadius: 10, overflow: 'hidden', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#232336', color: '#aaa' }}>
                      {activityLogColumns.filter(c => c.visible).map(col => (
                        <th key={col.key} style={{ padding: 8, textAlign: 'left' }}>{col.label}</th>
                      ))}
                      <th style={{ padding: 8, textAlign: 'left' }}>Raw</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivityLog.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #232336' }}>
                        {activityLogColumns.filter(c => c.visible).map(col => (
                          <td key={col.key} style={{ padding: 8 }}>{log[col.key] || '-'}</td>
                        ))}
                        <td style={{ padding: 8 }}>
                          <button onClick={() => openLogDetails(log)} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Log Details Modal */}
              {showLogDetails && logDetails && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
                  <div style={{ background: 'var(--background-secondary, #23232a)', color: 'var(--text-primary, #fafafa)', borderRadius: 14, padding: 32, minWidth: 400, maxHeight: '90vh', overflowY: 'auto' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Log Entry Details</h3>
                    <pre style={{ background: '#18181c', color: '#fafafa', borderRadius: 8, padding: 16, fontSize: 15, maxHeight: 400, overflow: 'auto' }}>{JSON.stringify(logDetails, null, 2)}</pre>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                      <button onClick={closeLogDetails} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {activeSection === 'compliance' && (
          <section aria-label="Compliance">
            <WinbackFeatureCard title="Compliance Center" description="GDPR/CCPA tools, opt-out, audit logs, data export/delete, and deliverability best practices." icon="🛡️" />
            <div style={{ background: '#23232a', color: '#fafafa', borderRadius: 14, boxShadow: '0 2px 8px #0004', padding: 32, marginBottom: 24, marginTop: 18 }}>
              <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Compliance Tools</h3>
              <ComplianceSection />
            </div>
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

// --- Custom Segment Builder Component ---
function CustomSegmentBuilder({ onCreate }) {
  const [name, setName] = React.useState("");
  const [rules, setRules] = React.useState([{ field: "purchaseCount", op: ">", value: "1" }]);
  const [error, setError] = React.useState("");
  const fields = [
    { value: "purchaseCount", label: "Purchase Count" },
    { value: "totalSpent", label: "Total Spent ($)" },
    { value: "lastPurchase", label: "Last Purchase (days ago)" },
    { value: "emailOpens", label: "Email Opens" },
    { value: "emailClicks", label: "Email Clicks" },
    { value: "country", label: "Country" },
    { value: "signupDays", label: "Signup (days ago)" },
    { value: "abandonedCart", label: "Abandoned Cart (days ago)" },
  ];
  const ops = [
    { value: ">", label: ">" },
    { value: "<", label: "<" },
    { value: "=", label: "=" },
    { value: "!=", label: "≠" },
    { value: "contains", label: "contains" },
  ];
  const handleRuleChange = (idx, key, val) => {
    setRules(rules => rules.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  };
  const addRule = () => setRules(rules => [...rules, { field: "purchaseCount", op: ">", value: "1" }]);
  const removeRule = idx => setRules(rules => rules.filter((_, i) => i !== idx));
  const handleCreate = () => {
    setError("");
    if (!name.trim()) {
      setError("Segment name required");
      return;
    }
    if (!rules.length) {
      setError("At least one rule required");
      return;
    }
    onCreate({ name, rule: rules.map(r => `${fields.find(f => f.value === r.field)?.label || r.field} ${r.op} ${r.value}`).join(" AND ") });
    setName("");
    setRules([{ field: "purchaseCount", op: ">", value: "1" }]);
  };
  return (
    <div style={{ background: '#18181b', borderRadius: 8, padding: 16, marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Segment name" style={{ flex: 2, padding: 8, borderRadius: 6, border: '1px solid #333', fontSize: 15, background: '#232336', color: '#fafafa' }} />
      </div>
      {rules.map((r, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <select value={r.field} onChange={e => handleRuleChange(idx, 'field', e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #333', fontSize: 15, background: '#232336', color: '#fafafa' }}>
            {fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select value={r.op} onChange={e => handleRuleChange(idx, 'op', e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #333', fontSize: 15, background: '#232336', color: '#fafafa' }}>
            {ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input value={r.value} onChange={e => handleRuleChange(idx, 'value', e.target.value)} placeholder="Value" style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid #333', fontSize: 15, background: '#232336', color: '#fafafa' }} />
          {rules.length > 1 && <button onClick={() => removeRule(idx)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Remove</button>}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button onClick={addRule} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>+ Add Rule</button>
      </div>
      {error && <div style={{ color: '#f87171', marginBottom: 8 }}>{error}</div>}
      <button onClick={handleCreate} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Create Segment</button>
    </div>
  );
}

// --- Segment Automations Component ---
function SegmentAutomations({ segment, onUpdate }) {
  const [showModal, setShowModal] = React.useState(false);
  const automations = segment.automations || [];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {automations.length === 0 ? (
          <span style={{ color: '#f87171', fontSize: 13 }}>No automations</span>
        ) : (
          automations.map((a, idx) => (
            <span key={idx} style={{ background: '#232336', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 13, fontWeight: 600, marginRight: 4 }}>{a.type}</span>
          ))
        )}
        <button onClick={() => setShowModal(true)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Automate</button>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
          <div style={{ background: '#18181b', borderRadius: 14, padding: 32, minWidth: 340, boxShadow: '0 8px 40px #0008', position: 'relative', color: '#fafafa' }}>
            <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 18 }}>Segment Automations</h3>
            <div style={{ marginBottom: 12 }}>
              <label>Add Automation</label>
              <select id="automation-type" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #333', fontSize: 15, background: '#232336', color: '#fafafa', marginBottom: 12 }}>
                <option value="email">Send Email</option>
                <option value="sms">Send SMS</option>
                <option value="push">Send Push</option>
                <option value="webhook">Trigger Webhook</option>
              </select>
              <input id="automation-detail" placeholder="Details (e.g. template, URL)" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #333', fontSize: 15, background: '#232336', color: '#fafafa', marginBottom: 12 }} />
              <button onClick={() => {
                const type = document.getElementById('automation-type').value;
                const detail = document.getElementById('automation-detail').value;
                if (type && detail) {
                  onUpdate({ type, detail });
                  setShowModal(false);
                }
              }} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 8 }}>Add Automation</button>
              <button onClick={() => setShowModal(false)} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
            </div>
            <div style={{ marginTop: 18 }}>
              <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, display: 'block' }}>Current Automations</label>
              {automations.length === 0 ? (
                <div style={{ color: '#f87171', fontSize: 14 }}>None</div>
              ) : (
                automations.map((a, idx) => (
                  <div key={idx} style={{ background: '#232336', color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    {a.type}: {a.detail}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Cross-Channel Targeting Component ---
function CrossChannelTargeting({ segment, onUpdate }) {
  const [channels, setChannels] = React.useState(segment.channels || ['email']);
  const allChannels = [
    { key: 'email', label: 'Email', color: '#0ea5e9' },
    { key: 'sms', label: 'SMS', color: '#facc15' },
    { key: 'push', label: 'Push', color: '#6366f1' },
    { key: 'webhook', label: 'Webhook', color: '#22c55e' },
  ];
  const toggleChannel = (key) => {
    let updated;
    if (channels.includes(key)) {
      updated = channels.filter(c => c !== key);
    } else {
      updated = [...channels, key];
    }
    setChannels(updated);
    onUpdate(updated);
  };
  return (
    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 600 }}>Channels:</span>
      {allChannels.map(ch => (
        <button
          key={ch.key}
          onClick={() => toggleChannel(ch.key)}
          style={{
            background: channels.includes(ch.key) ? ch.color : '#232336',
            color: channels.includes(ch.key) ? '#fff' : ch.color,
            border: 'none',
            borderRadius: 6,
            padding: '2px 10px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            outline: channels.includes(ch.key) ? `2px solid ${ch.color}` : 'none',
            transition: 'all 0.2s',
          }}
          aria-pressed={channels.includes(ch.key)}
        >
          {ch.label}
        </button>
      ))}
    </div>
  );
}

// --- Segment Performance Insights Component ---
function SegmentPerformanceInsights({ segment }) {
  const [show, setShow] = React.useState(false);
  // Mock performance data
  const data = segment.performance || {
    openRate: 42,
    clickRate: 18,
    conversionRate: 7,
    revenue: 1234,
    recentActivity: '2026-01-17',
    trend: '+12% MoM',
  };
  return (
    <>
      <button onClick={() => setShow(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginLeft: 6 }}>Performance</button>
      {show && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-modal="true">
          <div style={{ background: '#18181b', borderRadius: 14, padding: 32, minWidth: 340, boxShadow: '0 8px 40px #0008', position: 'relative', color: '#fafafa' }}>
            <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 18 }}>Segment Performance</h3>
            <div style={{ marginBottom: 12 }}><b>Open Rate:</b> {data.openRate}%</div>
            <div style={{ marginBottom: 12 }}><b>Click Rate:</b> {data.clickRate}%</div>
            <div style={{ marginBottom: 12 }}><b>Conversion Rate:</b> {data.conversionRate}%</div>
            <div style={{ marginBottom: 12 }}><b>Revenue:</b> ${data.revenue}</div>
            <div style={{ marginBottom: 12 }}><b>Recent Activity:</b> {data.recentActivity}</div>
            <div style={{ marginBottom: 12 }}><b>Trend:</b> {data.trend}</div>
            <button onClick={() => setShow(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 18 }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

// --- Include/Exclude Segment Toggle Component ---
function IncludeExcludeToggle({ segment, onUpdate }) {
  const [mode, setMode] = React.useState(segment.includeMode || 'include');
  const handleToggle = (newMode) => {
    setMode(newMode);
    onUpdate(newMode);
  };
  return (
    <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 600 }}>Mode:</span>
      <button
        onClick={() => handleToggle('include')}
        style={{
          background: mode === 'include' ? '#22c55e' : '#232336',
          color: mode === 'include' ? '#fff' : '#22c55e',
          border: 'none',
          borderRadius: 6,
          padding: '2px 10px',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          outline: mode === 'include' ? '2px solid #22c55e' : 'none',
          transition: 'all 0.2s',
        }}
        aria-pressed={mode === 'include'}
      >Include</button>
      <button
        onClick={() => handleToggle('exclude')}
        style={{
          background: mode === 'exclude' ? '#ef4444' : '#232336',
          color: mode === 'exclude' ? '#fff' : '#ef4444',
          border: 'none',
          borderRadius: 6,
          padding: '2px 10px',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          outline: mode === 'exclude' ? '2px solid #ef4444' : 'none',
          transition: 'all 0.2s',
        }}
        aria-pressed={mode === 'exclude'}
      >Exclude</button>
    </div>
  );
}

// --- Multi-Store & Multi-Language Selector Component ---
function StoreLanguageSelector({ segment, onUpdate }) {
  const [store, setStore] = React.useState(segment.store || 'Main Store');
  const [language, setLanguage] = React.useState(segment.language || 'en');
  const stores = ['Main Store', 'EU Store', 'US Store'];
  const languages = [
    { key: 'en', label: 'English' },
    { key: 'fr', label: 'French' },
    { key: 'es', label: 'Spanish' },
    { key: 'de', label: 'German' },
  ];
  const handleChange = (type, value) => {
    if (type === 'store') setStore(value);
    if (type === 'language') setLanguage(value);
    onUpdate({ store: type === 'store' ? value : store, language: type === 'language' ? value : language });
  };
  return (
    <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 600 }}>Store:</span>
      <select value={store} onChange={e => handleChange('store', e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #333', fontSize: 13, background: '#232336', color: '#fafafa' }}>
        {stores.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <span style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 600 }}>Language:</span>
      <select value={language} onChange={e => handleChange('language', e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #333', fontSize: 13, background: '#232336', color: '#fafafa' }}>
        {languages.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
      </select>
    </div>
  );
}

export default AbandonedCheckoutWinback;
// End of file
