// Settings Page - Shopify + Stripe Configuration
// Complete settings management UI for the platform

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('shopify');
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [shopInfo, setShopInfo] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      // Check Shopify connection
      const shopifyStatus = await apiFetch('/shopify/status');
      setShopifyConnected(shopifyStatus.connected);
      if (shopifyStatus.shop) {
        setShopDomain(shopifyStatus.shop);
        // Load shop details
        const shopDetails = await apiFetch(`/shopify/shop/${shopifyStatus.shop}`);
        setShopInfo(shopDetails);
      }

      // Load subscription info
      const subInfo = await apiFetch('/billing/subscription');
      setSubscription(subInfo);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function connectShopify() {
    if (!shopDomain) {
      alert('Please enter your shop domain');
      return;
    }

    // Validate domain format
    if (!shopDomain.includes('.myshopify.com')) {
      alert('Please enter a valid Shopify domain (e.g., yourstore.myshopify.com)');
      return;
    }

    // Redirect to OAuth flow
    window.location.href = `/shopify/auth?shop=${encodeURIComponent(shopDomain)}`;
  }

  async function disconnectShopify() {
    if (!confirm('Are you sure you want to disconnect your Shopify store?')) {
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/shopify/disconnect', {
        method: 'POST',
        body: JSON.stringify({ shop: shopDomain })
      });
      setShopifyConnected(false);
      setShopInfo(null);
      alert('Shopify store disconnected successfully');
    } catch (error) {
      alert('Failed to disconnect: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function syncShopifyData(dataType) {
    setSaving(true);
    try {
      await apiFetch(`/shopify/sync/${dataType}`, {
        method: 'POST',
        body: JSON.stringify({ shop: shopDomain })
      });
      alert(`${dataType} sync started successfully`);
    } catch (error) {
      alert('Sync failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function updatePaymentMethod() {
    // Shopify manages payment - redirect to Shopify billing settings
    alert('Payment methods are managed through your Shopify admin. Go to Settings > Account > Billing in Shopify.');
  }

  function viewBillingHistory() {
    // Navigate to billing page which shows usage and plan details
    window.location.href = '/billing';
  }

  async function changePlan() {
    // Navigate to billing page with plans
    window.location.href = '/billing';
  }

  async function cancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/billing/cancel', { method: 'POST' });
      alert('Subscription cancelled. You will retain access until the end of your billing period.');
      await loadSettings();
    } catch (error) {
      alert('Failed to cancel: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not set';
      return date.toLocaleDateString();
    } catch {
      return 'Not set';
    }
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-spinner">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your integrations and platform configuration</p>
      </div>

      <div className="settings-tabs">
        <button 
          className={`tab ${activeTab === 'shopify' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopify')}
        >
          Shopify Integration
        </button>
        <button 
          className={`tab ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          Billing & Subscription
        </button>
        <button 
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General Settings
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'shopify' && (
          <div className="settings-section">
            <h2>Shopify Integration</h2>
            
            {!shopifyConnected ? (
              <div className="connect-shopify-card">
                <div className="icon-circle">🛍️</div>
                <h3>Connect Your Shopify Store</h3>
                <p>Connect your Shopify store to unlock all platform features</p>
                
                <div className="input-group">
                  <label>Shop Domain</label>
                  <input
                    type="text"
                    placeholder="yourstore.myshopify.com"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    className="shop-domain-input"
                  />
                </div>

                <button 
                  onClick={connectShopify}
                  className="btn-primary btn-large"
                  disabled={saving}
                >
                  {saving ? 'Connecting...' : 'Connect to Shopify'}
                </button>

                <div className="help-text">
                  <strong>What we'll access:</strong>
                  <ul>
                    <li>Products (read & write)</li>
                    <li>Orders (read & write)</li>
                    <li>Customers (read & write)</li>
                    <li>Inventory (read & write)</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="connected-shopify-card">
                <div className="connection-status">
                  <span className="status-badge success">Connected</span>
                  <h3>{shopInfo?.name || shopDomain}</h3>
                  <p className="subdomain">{shopDomain}</p>
                </div>

                {shopInfo && (
                  <div className="shop-details">
                    <div className="detail-row">
                      <span className="label">Email:</span>
                      <span className="value">{shopInfo.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Plan:</span>
                      <span className="value">{shopInfo.plan_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Currency:</span>
                      <span className="value">{shopInfo.currency}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Country:</span>
                      <span className="value">{shopInfo.country_code}</span>
                    </div>
                  </div>
                )}

                <div className="sync-actions">
                  <h4>Data Synchronization</h4>
                  <div className="sync-buttons">
                    <button onClick={() => syncShopifyData('products')} disabled={saving}>
                      Sync Products
                    </button>
                    <button onClick={() => syncShopifyData('orders')} disabled={saving}>
                      Sync Orders
                    </button>
                    <button onClick={() => syncShopifyData('customers')} disabled={saving}>
                      Sync Customers
                    </button>
                    <button onClick={() => syncShopifyData('inventory')} disabled={saving}>
                      Sync Inventory
                    </button>
                  </div>
                </div>

                <div className="danger-zone">
                  <h4>Danger Zone</h4>
                  <button 
                    onClick={disconnectShopify}
                    className="btn-danger"
                    disabled={saving}
                  >
                    Disconnect Shopify Store
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="settings-section">
            <h2>Billing & Subscription</h2>
            
            {subscription ? (
              <div className="subscription-card">
                <div className="plan-info">
                  <h3>{subscription.plan_name || 'Free'}</h3>
                  <div className="price">
                    ${subscription.price || 0}/month
                  </div>
                  <div className="status-badge success">
                    {subscription.status || 'active'}
                  </div>
                </div>

                <div className="subscription-details">
                  <div className="detail-row">
                    <span className="label">Billing Period:</span>
                    <span className="value">
                      {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Next Billing Date:</span>
                    <span className="value">
                      {formatDate(subscription.current_period_end)}
                    </span>
                  </div>
                  {subscription.trial_ends_at && (
                    <div className="detail-row">
                      <span className="label">Trial Ends:</span>
                      <span className="value">
                        {formatDate(subscription.trial_ends_at)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="subscription-actions">
                  <button 
                    className="btn-secondary"
                    onClick={updatePaymentMethod}
                    disabled={saving}
                  >
                    Update Payment Method
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={viewBillingHistory}
                    disabled={saving}
                  >
                    View Billing History
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={changePlan}
                    disabled={saving}
                  >
                    Change Plan
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={cancelSubscription}
                    disabled={saving}
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-subscription-card">
                <h3>No Active Subscription</h3>
                <p>Choose a plan to get started</p>
                <button 
                  className="btn-primary btn-large"
                  onClick={changePlan}
                >
                  View Plans
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'general' && (
          <div className="settings-section">
            <h2>General Settings</h2>
            
            <div className="setting-group">
              <h3>Notifications</h3>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                Email notifications for important updates
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                Weekly performance summary
              </label>
              <label className="checkbox-label">
                <input type="checkbox" />
                SMS alerts for critical issues
              </label>
            </div>

            <div className="setting-group">
              <h3>API Access</h3>
              <div className="api-key-display">
                <label>Your API Key</label>
                <div className="api-key-input">
                  <code>aura_live_••••••••••••••••</code>
                  <button className="btn-small">Reveal</button>
                  <button className="btn-small">Regenerate</button>
                </div>
              </div>
            </div>

            <div className="setting-group">
              <h3>Team Management</h3>
              <p>Manage team members and permissions</p>
              <button className="btn-secondary">
                Manage Team
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .settings-page {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          background: #0f172a;
          min-height: 100vh;
        }

        .settings-header {
          margin-bottom: 32px;
        }

        .settings-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #e5e7eb;
        }

        .settings-header p {
          color: #94a3b8;
          margin: 0;
        }

        .settings-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #2f3650;
          margin-bottom: 32px;
        }

        .settings-tabs .tab {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          color: #94a3b8;
          transition: all 0.2s;
        }

        .settings-tabs .tab:hover {
          color: #e5e7eb;
        }

        .settings-tabs .tab.active {
          color: #7fffd4;
          border-bottom-color: #7fffd4;
        }

        .settings-section {
          background: #1a1d2e;
          padding: 32px;
          border-radius: 12px;
          border: 1px solid #2f3650;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .settings-section h2 {
          color: #e5e7eb;
        }

        .connect-shopify-card {
          text-align: center;
          padding: 48px;
        }

        .icon-circle {
          width: 80px;
          height: 80px;
          background: #2f3650;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin: 0 auto 24px;
        }

        .connect-shopify-card h2 {
          color: #e5e7eb;
        }

        .connect-shopify-card p {
          color: #cbd5e1;
        }

        .input-group {
          margin: 24px 0;
          text-align: left;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #e5e7eb;
        }

        .shop-domain-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #2f3650;
          border-radius: 8px;
          font-size: 16px;
          background: #0f1324;
          color: #e5e7eb;
        }

        .shop-domain-input:focus {
          outline: none;
          border-color: #7fffd4;
        }

        .btn-primary {
          background: #7fffd4;
          color: #23263a;
          padding: 12px 32px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #6ad5bc;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-large {
          padding: 16px 48px;
          font-size: 18px;
        }

        .help-text {
          margin-top: 32px;
          text-align: left;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
          padding: 16px;
          background: #0f1324;
          border: 1px solid #2f3650;
          border-radius: 8px;
          color: #cbd5e1;
        }

        .help-text strong {
          color: #e5e7eb;
        }

        .help-text ul {
          margin: 8px 0 0;
          padding-left: 20px;
        }

        .connected-shopify-card {
          padding: 24px;
        }

        .connection-status {
          text-align: center;
          padding-bottom: 24px;
          border-bottom: 1px solid #2f3650;
        }

        .connected-shopify-card h3 {
          color: #e5e7eb;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.success {
          background: #d4edda;
          color: #155724;
        }

        .shop-details {
          margin: 24px 0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #2f3650;
          color: #cbd5e1;
        }

        .detail-row .label {
          font-weight: 500;
          color: #94a3b8;
        }

        .detail-row .value {
          color: #e5e7eb;
        }

        .sync-actions {
          margin: 32px 0;
        }

        .sync-actions h4 {
          color: #e5e7eb;
        }

        .sync-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .sync-buttons button {
          padding: 12px 24px;
          background: #2f3650;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          color: #e5e7eb;
          transition: all 0.2s;
        }

        .sync-buttons button:hover {
          background: #3a4565;
        }

        .danger-zone {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 2px solid #5a2a2a;
        }

        .danger-zone h4 {
          color: #fca5a5;
        }

        .danger-zone p {
          color: #cbd5e1;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .subscription-card {
          padding: 24px;
        }

        .plan-info {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 24px;
          border-bottom: 1px solid #2f3650;
        }

        .subscription-card h3 {
          color: #e5e7eb;
        }

        .plan-info h3 {
          margin: 0;
          font-size: 24px;
        }

        .price {
          font-size: 20px;
          font-weight: 600;
          color: #7fffd4;
        }

        .subscription-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-secondary {
          background: #2f3650;
          color: #e5e7eb;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #3a4565;
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .subscription-details {
          margin-top: 24px;
        }

        .no-subscription-card {
          text-align: center;
          padding: 48px;
        }

        .no-subscription-card h3 {
          color: #e5e7eb;
          margin-bottom: 16px;
        }

        .no-subscription-card p {
          color: #cbd5e1;
          margin-bottom: 24px;
        }

        .setting-group {
          margin: 24px 0;
          padding: 24px 0;
          border-bottom: 1px solid #2f3650;
        }

        .setting-group h3 {
          color: #e5e7eb;
        }

        .setting-group p {
          color: #cbd5e1;
        }

        .setting-group:last-child {
          border-bottom: none;
        }

        .checkbox-label {
          display: block;
          margin: 12px 0;
          cursor: pointer;
          color: #cbd5e1;
        }

        .checkbox-label input {
          margin-right: 8px;
        }

        .api-key-display {
          margin-top: 16px;
        }

        .api-key-display label {
          color: #e5e7eb;
        }

        .api-key-input {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 8px;
        }

        .api-key-input code {
          flex: 1;
          padding: 12px;
          background: #0f1324;
          border: 1px solid #2f3650;
          border-radius: 6px;
          color: #e5e7eb;
        }

        .btn-small {
          padding: 8px 16px;
          background: #2f3650;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #e5e7eb;
          transition: all 0.2s;
        }

        .btn-small:hover {
          background: #3a4565;
        }
      `}</style>
    </div>
  );
};

export default Settings;
