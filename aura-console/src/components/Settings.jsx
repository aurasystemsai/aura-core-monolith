// Settings Page - Shopify Integration
// Platform configuration and integrations management

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    colour: '#4ade80',
    features: ['100 AI runs / month', '50 products', '1 team member', 'Blog SEO + Product SEO', 'Basic support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    colour: '#7fffd4',
    badge: 'Most Popular',
    features: ['10,000 AI runs / month', 'Unlimited products', '5 team members', 'All core SEO tools', 'On-Page SEO Engine', 'Content brief generator', 'Advanced analytics', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    colour: '#a78bfa',
    features: ['Unlimited AI runs', 'Unlimited products', 'Unlimited team members', 'All tools unlocked', 'Custom integrations', 'Dedicated support', '24/7 uptime SLA', 'White-label options'],
  },
];

const Settings = () => {
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKeyRevealed, setApiKeyRevealed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(null);
  const [billingError, setBillingError] = useState('');

  useEffect(() => {
    loadSettings();
    loadBilling();
  }, []);

  async function loadBilling() {
    setBillingLoading(true);
    try {
      const res = await apiFetch('/api/billing/subscription');
      const data = await res.json();
      setSubscription(data);
    } catch (_) {
      setSubscription({ plan_id: 'free', status: 'active' });
    }
    setBillingLoading(false);
  }

  async function subscribePlan(planId) {
    if (planId === subscription?.plan_id) return;
    setBillingError('');
    setUpgrading(planId);
    try {
      const res = await apiFetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Shopify returns a confirmationUrl — redirect there
      if (data.confirmationUrl) {
        window.top.location.href = data.confirmationUrl;
      } else if (data.plan_id) {
        setSubscription(data);
      }
    } catch (err) {
      setBillingError(err.message || 'Failed to start upgrade. Please try again.');
    }
    setUpgrading(null);
  }

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

  function copyApiKey() {
    navigator.clipboard.writeText('aura_live_sk_1234567890abcdef')
      .then(() => alert('API key copied to clipboard'))
      .catch(() => alert('Failed to copy'));
  }

  async function regenerateApiKey() {
    if (!confirm('Are you sure you want to regenerate your API key? This will invalidate the current key.')) {
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/settings/api-key/regenerate', { method: 'POST' });
      alert('API key regenerated successfully');
      setApiKeyRevealed(false);
    } catch (error) {
      alert('Failed to regenerate: ' + error.message);
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
        <p>Manage your Shopify integration and API access</p>
      </div>

      <div className="settings-content">
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

        {/* ── Billing & Plan ── */}
        <div style={{ background: '#1a1d2e', padding: 32, borderRadius: 12, border: '1px solid #2f3650', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: 0, color: '#e5e7eb', fontSize: 22, fontWeight: 800 }}>Billing &amp; Plan</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Billing is handled securely through Shopify — no card details stored here.</p>
            </div>
            {subscription && (
              <div style={{ background: '#0f172a', border: `2px solid ${PLANS.find(p => p.id === subscription.plan_id)?.colour || '#4ade80'}`, borderRadius: 10, padding: '8px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Plan</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: PLANS.find(p => p.id === subscription.plan_id)?.colour || '#4ade80', marginTop: 2 }}>
                  {PLANS.find(p => p.id === subscription.plan_id)?.name || subscription.plan_id}
                </div>
              </div>
            )}
          </div>

          {billingError && (
            <div style={{ background: '#2d1515', border: '1px solid #f87171', borderRadius: 8, padding: '10px 16px', color: '#f87171', fontSize: 14, marginBottom: 20 }}>{billingError}</div>
          )}

          {billingLoading ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '32px 0' }}>Loading plan info…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {PLANS.map(plan => {
                const isCurrent = subscription?.plan_id === plan.id;
                const isUpgrading = upgrading === plan.id;
                return (
                  <div key={plan.id} style={{ background: isCurrent ? `${plan.colour}12` : '#0f172a', border: `2px solid ${isCurrent ? plan.colour : '#2f3650'}`, borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {plan.badge && (
                      <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.colour, color: '#0f172a', fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>{plan.badge}</div>
                    )}
                    <div style={{ fontSize: 18, fontWeight: 800, color: plan.colour, marginBottom: 4 }}>{plan.name}</div>
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: '#e5e7eb' }}>${plan.price}</span>
                      {plan.price > 0 && <span style={{ fontSize: 14, color: '#64748b' }}> / month</span>}
                      {plan.price === 0 && <span style={{ fontSize: 14, color: '#64748b' }}> forever</span>}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
                      {plan.features.map((f, i) => (
                        <li key={i} style={{ fontSize: 13, color: '#94a3b8', padding: '4px 0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ color: plan.colour, flexShrink: 0 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <div style={{ textAlign: 'center', padding: '10px', background: `${plan.colour}20`, borderRadius: 8, color: plan.colour, fontWeight: 700, fontSize: 14 }}>✓ Current Plan</div>
                    ) : (
                      <button
                        onClick={() => subscribePlan(plan.id)}
                        disabled={!!upgrading}
                        style={{ background: isUpgrading ? '#374151' : plan.colour, border: 'none', borderRadius: 8, padding: '11px', color: '#0f172a', fontWeight: 800, cursor: upgrading ? 'wait' : 'pointer', fontSize: 14, opacity: upgrading && !isUpgrading ? 0.5 : 1 }}
                      >
                        {isUpgrading ? '⏳ Redirecting to Shopify…' : plan.price === 0 ? 'Downgrade to Free' : `Upgrade to ${plan.name} →`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p style={{ marginTop: 16, fontSize: 12, color: '#475569', textAlign: 'center' }}>Clicking Upgrade takes you to the Shopify billing confirmation page. Your store will not be charged until you confirm.</p>
        </div>

        <div className="settings-section">
          <h2>Developer Access</h2>
          <div className="setting-card">
              <div className="card-header">
                <div className="header-icon">🔑</div>
                <div>
                  <h3>API Access</h3>
                  <p className="card-subtitle">Manage your API keys for programmatic access</p>
                </div>
              </div>
              <div className="card-body">
                <div className="api-key-section">
                  <label className="input-label">Your API Key</label>
                  <div className="api-key-display">
                    <code className="api-key-code">
                      {apiKeyRevealed ? 'aura_live_sk_1234567890abcdef' : 'aura_live_••••••••••••••••'}
                    </code>
                    <div className="api-key-actions">
                      <button 
                        className="btn-icon-action" 
                        onClick={() => setApiKeyRevealed(!apiKeyRevealed)}
                        title={apiKeyRevealed ? 'Hide' : 'Reveal'}
                      >
                        {apiKeyRevealed ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button 
                        className="btn-icon-action" 
                        onClick={copyApiKey}
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                      <button 
                        className="btn-secondary-small" 
                        onClick={regenerateApiKey}
                        disabled={saving}
                      >
                        🔄 Regenerate
                      </button>
                    </div>
                  </div>
                  <p className="help-text-small">Keep your API key secure. Never share it publicly or commit it to version control.</p>
                </div>
              </div>
            </div>
        </div>
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

        .settings-section {
          background: #1a1d2e;
          padding: 32px;
          border-radius: 12px;
          border: 1px solid #2f3650;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          margin-bottom: 24px;
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

        /* Modern Card Styles */
        .setting-card {
          background: #1a1d2e;
          border: 1px solid #2f3650;
          border-radius: 16px;
          margin-bottom: 24px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .setting-card:hover {
          border-color: #3a4565;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          border-bottom: 1px solid #2f3650;
          background: linear-gradient(135deg, #1a1d2e 0%, #232842 100%);
        }

        .header-icon {
          font-size: 32px;
          width: 56px;
          height: 56px;
          background: #2f3650;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-header h3 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 600;
          color: #e5e7eb;
        }

        .card-subtitle {
          margin: 0;
          font-size: 14px;
          color: #94a3b8;
        }

        .card-body {
          padding: 24px;
        }

        .card-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #2f3650;
        }

        /* API Key Section */
        .api-key-section {
          max-width: 100%;
        }

        .input-label {
          display: block;
          font-weight: 600;
          color: #e5e7eb;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .api-key-display {
          display: flex;
          gap: 12px;
          align-items: center;
          background: #0f1324;
          border: 2px solid #2f3650;
          border-radius: 8px;
          padding: 16px;
        }

        .api-key-code {
          flex: 1;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #7fffd4;
          background: transparent;
          border: none;
          padding: 0;
        }

        .api-key-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn-icon-action {
          background: #2f3650;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon-action:hover {
          background: #3a4565;
          transform: scale(1.05);
        }

        .btn-secondary-small {
          background: #2f3650;
          color: #e5e7eb;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary-small:hover {
          background: #3a4565;
        }

        .btn-secondary-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .help-text-small {
          margin-top: 12px;
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default Settings;
