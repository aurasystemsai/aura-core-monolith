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
                  <h3>{subscription.plan_name}</h3>
                  <div className="price">
                    ${subscription.price}/month
                  </div>
                  <div className="status-badge success">
                    {subscription.status}
                  </div>
                </div>

                <div className="subscription-details">
                  <div className="detail-row">
                    <span className="label">Billing Period:</span>
                    <span className="value">
                      {new Date(subscription.current_period_start).toLocaleDateString()} - 
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Next Billing Date:</span>
                    <span className="value">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                  {subscription.trial_ends_at && (
                    <div className="detail-row">
                      <span className="label">Trial Ends:</span>
                      <span className="value">
                        {new Date(subscription.trial_ends_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="subscription-actions">
                  <button className="btn-secondary">
                    Update Payment Method
                  </button>
                  <button className="btn-secondary">
                    View Billing History
                  </button>
                  <button className="btn-secondary">
                    Change Plan
                  </button>
                  <button className="btn-danger">
                    Cancel Subscription
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-subscription-card">
                <h3>No Active Subscription</h3>
                <p>Choose a plan to get started</p>
                <button className="btn-primary btn-large">
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
        }

        .settings-header {
          margin-bottom: 32px;
        }

        .settings-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .settings-header p {
          color: #666;
          margin: 0;
        }

        .settings-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #e0e0e0;
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
          color: #666;
          transition: all 0.2s;
        }

        .settings-tabs .tab:hover {
          color: #333;
        }

        .settings-tabs .tab.active {
          color: #7fffd4;
          border-bottom-color: #7fffd4;
        }

        .settings-section {
          background: white;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .connect-shopify-card {
          text-align: center;
          padding: 48px;
        }

        .icon-circle {
          width: 80px;
          height: 80px;
          background: #f0f0f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin: 0 auto 24px;
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
        }

        .shop-domain-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
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
          background: #f9f9f9;
          border-radius: 8px;
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
          border-bottom: 1px solid #e0e0e0;
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
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-row .label {
          font-weight: 500;
        }

        .sync-actions {
          margin: 32px 0;
        }

        .sync-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .sync-buttons button {
          padding: 12px 24px;
          background: #f0f0f0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .sync-buttons button:hover {
          background: #e0e0e0;
        }

        .danger-zone {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 2px solid #fee;
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
          border-bottom: 1px solid #e0e0e0;
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
          background: #f0f0f0;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .setting-group {
          margin: 24px 0;
          padding: 24px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .setting-group:last-child {
          border-bottom: none;
        }

        .checkbox-label {
          display: block;
          margin: 12px 0;
          cursor: pointer;
        }

        .checkbox-label input {
          margin-right: 8px;
        }

        .api-key-display {
          margin-top: 16px;
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
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
        }

        .btn-small {
          padding: 8px 16px;
          background: #f0f0f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default Settings;
