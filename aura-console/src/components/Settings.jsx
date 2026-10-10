// Settings Page - Shopify Integration
// Platform configuration and integrations management

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const PLANS = [
 {
 id: 'free',
 name: 'Starter',
 price: 0,
 colour: '#71717a',
 features: ['Dashboard only', '10 lifetime AI credits', '1 team member', 'Community support'],
 },
 {
 id: 'growth',
 name: 'Growth',
 price: 49,
 colour: '#38bdf8',
 features: ['5,000 AI credits / month', 'All core SEO tools', 'Email & social tools', 'Unlimited products', '3 team members', 'Priority email support'],
 },
 {
 id: 'pro',
 name: 'Pro',
 price: 149,
 colour: '#4f46e5',
 badge: 'Most Popular',
 features: ['25,000 AI credits / month', 'All Growth tools', 'Ads & analytics suite', 'Personalization engine', 'Advanced automations', '10 team members', 'Priority support'],
 },
 {
 id: 'enterprise',
 name: 'Enterprise',
 price: 349,
 colour: '#a78bfa',
 features: ['Unlimited AI credits', 'All Pro tools', 'Custom dashboards & exports', 'API & SDK access', 'Unlimited team members', 'Dedicated account manager', '24/7 SLA'],
 },
];

async function readJson(r) {
 try { return await r.json(); } catch (e) {
 return { ok: false, error: r.status === 401 ? 'Please reopen AURA from your Shopify admin to sign in.' : 'The server sent an unexpected reply. Please try again.' };
 }
}

const Settings = ({ setActiveSection }) => {
 const [shopifyConnected, setShopifyConnected] = useState(false);
 const [shopDomain, setShopDomain] = useState('');
 const [shopInfo, setShopInfo] = useState(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [apiKeyInfo, setApiKeyInfo] = useState(null);
 const [newApiKey, setNewApiKey] = useState('');
 const [apiKeyError, setApiKeyError] = useState('');
 const [hooks, setHooks] = useState(null);
 const [hookUrl, setHookUrl] = useState('');
 const [hookSecret, setHookSecret] = useState('');
 const [hookMsg, setHookMsg] = useState('');
 const [hookBusy, setHookBusy] = useState('');
 const [subscription, setSubscription] = useState(null);
 const [billingLoading, setBillingLoading] = useState(false);
 const SYNC_TOOL_MAP = {
 products: 'product-seo',
 orders: 'dashboard',
 customers: 'customer-data-platform',
 inventory: 'product-seo',
 };

 const SYNC_TOOL_LABEL = {
 products: 'Product SEO Engine',
 orders: 'Dashboard',
 customers: 'Customer Data Platform',
 inventory: 'Product SEO Engine',
 };

 const [upgrading, setUpgrading] = useState(null);
 const [billingError, setBillingError] = useState('');
 const [syncStatus, setSyncStatus] = useState({});
 const [syncResult, setSyncResult] = useState({});

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
 setSubscription({ plan_id: 'free', status: 'active'});
 }
 setBillingLoading(false);
 }

 async function subscribePlan(planId) {
 if (planId === subscription?.plan_id) return;
 setBillingError('');
 setUpgrading(planId);
 // Resolve shop from state, URL params, or localStorage
 const shop = shopDomain
 || new URLSearchParams(window.location.search).get('shop')
 || localStorage.getItem('auraShop')
 || localStorage.getItem('shopDomain')
 || '';
 try {
 const res = await apiFetch('/api/billing/subscribe', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', ...(shop ? { 'x-shopify-shop-domain': shop } : {}) },
 body: JSON.stringify({ planId, shop }),
 });
 const data = await res.json();
 if (data.error) throw new Error(data.error);
 // Shopify returns a confirmationUrl — redirect there for merchant approval
 if (data.confirmationUrl) {
 window.top.location.href = data.confirmationUrl;
 } else if (data.plan_id) {
 // Immediate plan change (e.g. downgrade to free) — reload so plan badge & credits refresh
 setSubscription(data);
 setTimeout(() => window.location.reload(), 300);
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
 const statusRes = await apiFetch('/shopify/status');
 const shopifyStatus = await statusRes.json().catch(() => ({}));
 setShopifyConnected(!!shopifyStatus.connected);
 if (shopifyStatus.shop) {
 setShopDomain(shopifyStatus.shop);
 localStorage.setItem('auraShop', shopifyStatus.shop);
 // Load shop details
 const detailsRes = await apiFetch(`/shopify/shop/${shopifyStatus.shop}`);
 const shopDetails = await detailsRes.json().catch(() => null);
 setShopInfo(shopDetails);
 } else {
 // Fallback: ask the server for the shop via session/stored tokens
 try {
 const sessionRes = await apiFetch('/api/session');
 const sessionData = await sessionRes.json().catch(() => ({}));
 if (sessionData.shop) {
 setShopDomain(sessionData.shop);
 setShopifyConnected(true);
 localStorage.setItem('auraShop', sessionData.shop);
 }
 } catch (_) {}
 }
 } catch (error) {
 console.error('Failed to load settings:', error);
 // Last-resort: try /api/session
 try {
 const sessionRes = await apiFetch('/api/session');
 const sessionData = await sessionRes.json().catch(() => ({}));
 if (sessionData.shop) {
 setShopDomain(sessionData.shop);
 setShopifyConnected(true);
 localStorage.setItem('auraShop', sessionData.shop);
 }
 } catch (_) {}
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
 alert('Failed to disconnect: '+ error.message);
 } finally {
 setSaving(false);
 }
 }

 async function syncShopifyData(dataType) {
 setSyncStatus(prev => ({ ...prev, [dataType]: 'loading'}));
 try {
 const shop = shopDomain || localStorage.getItem('auraShop') || '';
 const res = await apiFetch(`/shopify/sync/${dataType}`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json'},
 body: JSON.stringify({ shop })
 });
 const data = await res.json();
 if (data.error) throw new Error(data.error);
 setSyncStatus(prev => ({ ...prev, [dataType]: 'done'}));
 setSyncResult(prev => ({ ...prev, [dataType]: data.message }));
 setTimeout(() => {
 setSyncStatus(prev => ({ ...prev, [dataType]: null }));
 setSyncResult(prev => ({ ...prev, [dataType]: null }));
 }, 4000);
 } catch (error) {
 setSyncStatus(prev => ({ ...prev, [dataType]: 'error'}));
 setSyncResult(prev => ({ ...prev, [dataType]: error.message }));
 setTimeout(() => {
 setSyncStatus(prev => ({ ...prev, [dataType]: null }));
 setSyncResult(prev => ({ ...prev, [dataType]: null }));
 }, 5000);
 }
 }

 async function hookCall(name, path, options) {
 setHookBusy(name); setHookMsg('');
 try {
 const r = await apiFetch('/api/settings/webhooks' + path, options);
  const d = await readJson(r);
 if (!d.ok) throw new Error(d.error || 'Request failed');
 return d;
 } catch (error) {
 setHookMsg(error.message);
 return null;
 } finally {
 setHookBusy('');
 }
 }
 const hookJson = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
 async function loadHooks() { const d = await hookCall('load', ''); if (d) setHooks(d); }
 useEffect(() => { loadHooks(); }, []);
 async function addHook() {
 const d = await hookCall('add', '', hookJson('POST', { url: hookUrl }));
 if (d) { setHookSecret(d.webhook.secret); setHookUrl(''); loadHooks(); }
 }
 async function testHook(h) {
 const d = await hookCall('t:' + h.id, `/${h.id}/test`, hookJson('POST'));
 if (d) { setHookMsg(d.ok ? 'Test sent: your server answered OK.' : `Test failed: ${d.error || 'HTTP ' + d.status}`); loadHooks(); }
 }
 async function toggleHook(h) {
 const d = await hookCall('a:' + h.id, `/${h.id}/active`, hookJson('POST', { active: !h.active }));
 if (d) setHooks((prev) => ({ ...prev, endpoints: d.endpoints }));
 }
 async function removeHook(h) {
 if (!confirm('Delete this webhook?')) return;
 if (await hookCall('d:' + h.id, `/${h.id}`, { method: 'DELETE' })) loadHooks();
 }
 async function loadApiKey() {
 try {
 const r = await apiFetch('/api/settings/api-key');
  const d = await readJson(r);
 if (d.ok) setApiKeyInfo(d); else setApiKeyError(d.error || 'Could not load your API key status.');
 } catch (error) {
 setApiKeyError('Could not load your API key status.');
 }
 }

 useEffect(() => { loadApiKey(); }, []);

 function copyApiKey() {
 navigator.clipboard.writeText(newApiKey)
 .then(() => alert('API key copied to clipboard'))
 .catch(() => alert('Failed to copy'));
 }

 async function regenerateApiKey() {
 if (apiKeyInfo && apiKeyInfo.exists && !confirm('Make a new API key? The current key will stop working straight away.')) {
 return;
 }
 setSaving(true); setApiKeyError('');
 try {
 const r = await apiFetch('/api/settings/api-key/regenerate', { method: 'POST' });
  const d = await readJson(r);
 if (!d.ok) throw new Error(d.error || 'Request failed');
 setNewApiKey(d.key);
 setApiKeyInfo(d);
 } catch (error) {
 setApiKeyError('Could not make a key: ' + error.message);
 } finally {
 setSaving(false);
 }
 }

 async function revokeApiKey() {
 if (!confirm('Delete your API key? Anything using it will stop working.')) return;
 setSaving(true); setApiKeyError('');
 try {
 await apiFetch('/api/settings/api-key', { method: 'DELETE' });
 setNewApiKey('');
 await loadApiKey();
 } catch (error) {
 setApiKeyError('Could not delete the key: ' + error.message);
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
 <div className="icon-circle"></div>
 <h3>Connect Your Shopify Store</h3>
 <p>Connect your Shopify store to unlock all platform features</p>
 
 <div className="input-group">
 <label>Shop Domain</label>
 <input
 type="text"placeholder="yourstore.myshopify.com"value={shopDomain}
 onChange={(e) => setShopDomain(e.target.value)}
 className="shop-domain-input"/>
 </div>

 <button 
 onClick={connectShopify}
 className="btn-primary btn-large"disabled={saving}
 >
 {saving ? 'Connecting...': 'Connect to Shopify'}
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

 <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #27272a'}}>
 <div style={{ fontSize: 13, fontWeight: 700, color: '#a1a1aa', marginBottom: 10 }}>Data Synchronisation</div>
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap'}}>
 {['products','orders','customers','inventory'].map(type => {
 const st = syncStatus[type];
 const msg = syncResult[type];
 return (
 <div key={type}>
 <button
 onClick={() => syncShopifyData(type)}
 disabled={!!st}
 style={{
 background: st === 'done'? '#052e16': st === 'error'? '#2d1515': '#27272a',
 border: `1px solid ${st === 'done'? '#16a34a': st === 'error'? '#f87171': '#52525b'}`,
 color: st === 'done'? '#4ade80': st === 'error'? '#f87171': '#a1a1aa',
 borderRadius: 8, padding: '7px 14px', fontSize: 13,
 cursor: st ? 'wait': 'pointer', whiteSpace: 'nowrap'}}
 >
 {st === 'loading'? `Syncing ${type}` : st === 'done'? ` ${type}` : st === 'error'? ` ${type}` : `Sync ${type}`}
 </button>
 {msg && st && st !== 'loading'&& (
 <div style={{ fontSize: 11, color: st === 'done'? '#4ade80': '#f87171', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
 <span>{msg}</span>
 {st === 'done'&& setActiveSection && (
 <button
 onClick={() => setActiveSection(SYNC_TOOL_MAP[type])}
 style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline'}}
 >
 Open {SYNC_TOOL_LABEL[type]} 
 </button>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 <div style={{ marginTop: 16 }}>
 <button
 onClick={disconnectShopify}
 disabled={saving}
 style={{ background: 'none', border: '1px solid #52525b', color: '#71717a', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer'}}
 >
 Disconnect store
 </button>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Billing & Plan */}
 <div style={{ background: '#18181b', padding: 32, borderRadius: 12, border: '1px solid #27272a', marginBottom: 24 }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
 <div>
 <h2 style={{ margin: 0, color: '#fafafa', fontSize: 22, fontWeight: 800 }}>Billing &amp; Plan</h2>
 <p style={{ margin: '4px 0 0', color: '#71717a', fontSize: 14 }}>Billing is handled securely through Shopify no card details stored here.</p>
 </div>
 {subscription && (
 <div style={{ background: '#18181b', border: `2px solid ${PLANS.find(p => p.id === subscription.plan_id)?.colour || '#4ade80'}`, borderRadius: 10, padding: '8px 20px', textAlign: 'center'}}>
 <div style={{ fontSize: 11, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Current Plan</div>
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
 <div style={{ color: '#71717a', textAlign: 'center', padding: '32px 0'}}>Loading plan info</div>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16 }}>
 {(() => {
 const currentPlanIndex = PLANS.findIndex(p => p.id === (subscription?.plan_id || 'free'));
 return PLANS.map((plan, planIndex) => {
 const isCurrent = subscription?.plan_id === plan.id;
 const isUpgrading = upgrading === plan.id;
 const isDowngrade = planIndex < currentPlanIndex;
 return (
 <div key={plan.id} style={{ background: isCurrent ? `${plan.colour}12` : '#18181b', border: `2px solid ${isCurrent ? plan.colour : '#27272a'}`, borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative'}}>
 {plan.badge && (
 <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.colour, color: '#18181b', fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap'}}>{plan.badge}</div>
 )}
 <div style={{ fontSize: 18, fontWeight: 800, color: plan.colour, marginBottom: 4 }}>{plan.name}</div>
 <div style={{ marginBottom: 16 }}>
 <span style={{ fontSize: 32, fontWeight: 900, color: '#fafafa'}}>${plan.price}</span>
 {plan.price > 0 && <span style={{ fontSize: 14, color: '#71717a'}}> / month</span>}
 {plan.price === 0 && <span style={{ fontSize: 14, color: '#71717a'}}> no card needed</span>}
 </div>
 <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
 {plan.features.map((f, i) => (
 <li key={i} style={{ fontSize: 13, color: '#a1a1aa', padding: '4px 0', display: 'flex', gap: 8, alignItems: 'flex-start'}}>
 <span style={{ color: plan.colour, flexShrink: 0 }}></span> {f}
 </li>
 ))}
 </ul>
 {isCurrent ? (
 <div style={{ textAlign: 'center', padding: '10px', background: `${plan.colour}20`, borderRadius: 8, color: plan.colour, fontWeight: 700, fontSize: 14 }}>Current Plan</div>
 ) : (
 <button
 onClick={() => subscribePlan(plan.id)}
 disabled={!!upgrading}
 style={{ background: isUpgrading ? '#52525b': plan.colour, border: 'none', borderRadius: 8, padding: '11px', color: '#18181b', fontWeight: 800, cursor: upgrading ? 'wait': 'pointer', fontSize: 14, opacity: upgrading && !isUpgrading ? 0.5 : 1 }}
 >
 {isUpgrading ? 'Redirecting to Shopify': isDowngrade ? `Downgrade to ${plan.name}` : `Upgrade to ${plan.name} `}
 </button>
 )}
 </div>
 );
 });
 })()}
 </div>
 )}
 <p style={{ marginTop: 16, fontSize: 12, color: '#52525b', textAlign: 'center'}}>Clicking Upgrade or Downgrade takes you to the Shopify billing confirmation page. Your store will not be charged until you confirm.</p>
 </div>

 <div className="settings-section">
 <h2>Developer Access</h2>
 <div className="setting-card">
 <div className="card-header">
 <div className="header-icon"></div>
 <div>
 <h3>API Access</h3>
 <p className="card-subtitle">Manage your API keys for programmatic access</p>
 </div>
 </div>
 <div className="card-body">
 <div className="api-key-section">
 <label className="input-label">Your API key</label>
 {apiKeyError && <p className="help-text-small" style={{ color: '#b91c1c' }}>{apiKeyError}</p>}
 {newApiKey ? (
 <>
 <div className="api-key-display">
 <code className="api-key-code" style={{ wordBreak: 'break-all' }}>{newApiKey}</code>
 <div className="api-key-actions">
 <button className="btn-secondary-small" onClick={copyApiKey}>Copy</button>
 </div>
 </div>
 <p className="help-text-small"><strong>Copy it now.</strong> For your security it is shown only once and cannot be shown again.</p>
 </>
 ) : (
 <p className="help-text-small">
 {!apiKeyInfo ? (apiKeyError ? '' : 'Checking…') : apiKeyInfo.exists
 ? `A key ending in ${apiKeyInfo.hint} was made ${new Date(apiKeyInfo.createdAt).toLocaleDateString()}. ${apiKeyInfo.lastUsedAt ? `Last used ${new Date(apiKeyInfo.lastUsedAt).toLocaleString()}.` : 'Not used yet.'}`
 : 'You do not have a key yet.'}
 </p>
 )}
 <div className="api-key-actions" style={{ marginTop: 8 }}>
 <button className="btn-secondary-small" onClick={regenerateApiKey} disabled={saving}>
 {saving ? 'Working…' : apiKeyInfo && apiKeyInfo.exists ? 'Make a new key' : 'Make my API key'}
 </button>
 {apiKeyInfo && apiKeyInfo.exists && <button className="btn-secondary-small" onClick={revokeApiKey} disabled={saving} style={{ marginLeft: 8 }}>Delete key</button>}
 </div>
 <p className="help-text-small">Read-only: lets other tools see your plan, credits and the changes AURA has made. It cannot change anything and uses no credits. Send it as <code>Authorization: Bearer YOUR_KEY</code> to <code>/v1/me</code> or <code>/v1/changes</code>. Keep it private.</p>
 </div>
 </div>
 </div>
 <div className="setting-card" style={{ marginTop: 16 }}>
 <div className="card-header">
 <div className="header-icon"></div>
 <div>
 <h3>Webhooks</h3>
 <p className="card-subtitle">Get a message sent to your own system when AURA changes something</p>
 </div>
 </div>
 <div className="card-body">
 {hookMsg && <p className="help-text-small" style={{ color: '#b91c1c' }}>{hookMsg}</p>}
 {hookSecret && (
 <p className="help-text-small"><strong>Signing secret, copy it now (shown once):</strong> <code style={{ wordBreak: 'break-all' }}>{hookSecret}</code></p>
 )}
 {!hooks && !hookMsg && <p className="help-text-small">Loading…</p>}
 {hooks && hooks.endpoints.length === 0 && <p className="help-text-small">No webhooks yet.</p>}
 {hooks && hooks.endpoints.map((h) => {
 const last = hooks.log.find((l) => l.endpointId === h.id);
 return (
 <div key={h.id} style={{ borderTop: '1px solid #e4e4e7', padding: '8px 0' }}>
 <div style={{ wordBreak: 'break-all', fontWeight: 600 }}>{h.url}</div>
 <div className="help-text-small">
 {h.active ? 'On' : 'Off'}{!h.active && h.failures >= 10 ? ' (turned off after repeated failures)' : ''} · {last ? (last.ok ? `last send OK (${last.status})` : `last send failed: ${last.error}`) : 'nothing sent yet'}
 </div>
 <div className="api-key-actions" style={{ marginTop: 6 }}>
 <button className="btn-secondary-small" disabled={!!hookBusy} onClick={() => testHook(h)}>{hookBusy === 't:' + h.id ? 'Sending…' : 'Send test'}</button>
 <button className="btn-secondary-small" disabled={!!hookBusy} onClick={() => toggleHook(h)} style={{ marginLeft: 8 }}>{h.active ? 'Turn off' : 'Turn on'}</button>
 <button className="btn-secondary-small" disabled={!!hookBusy} onClick={() => removeHook(h)} style={{ marginLeft: 8 }}>Delete</button>
 </div>
 </div>
 );
 })}
 {hooks && hooks.endpoints.length < hooks.max && (
 <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
 <input type="url" aria-label="Webhook address" placeholder="https://your-server.com/aura" value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} style={{ flex: '1 1 260px', padding: 8, border: '1px solid #a1a1aa', borderRadius: 8 }} />
 <button className="btn-secondary-small" disabled={!hookUrl.trim() || !!hookBusy} onClick={addHook}>{hookBusy === 'add' ? 'Adding…' : 'Add webhook'}</button>
 </div>
 )}
 <p className="help-text-small">Sent when a change is applied to your store and when a scheduled draft is written. Must be an https address. Each message is signed: check the <code>X-Aura-Signature</code> header (HMAC-SHA256 of <code>timestamp.body</code> with your secret). Failed sends are retried twice.</p>
 </div>
 </div>
 </div>
 </div>

 <style>{`
 .settings-page {
 width: 100%;
 min-width: 0;
 box-sizing: border-box;
 padding: clamp(16px, 3vw, 32px);
 max-width: 1200px;
 margin: 0 auto;
 background: #f5f7fb;
 color: #172033;
 min-height: 100%;
 }

 .settings-header {
 margin-bottom: 32px;
 }

 .settings-header h1 {
 font-size: 32px;
 font-weight: 700;
 margin: 0 0 8px 0;
 color: #172033;
 }

 .settings-header p {
 color: #64748b;
 margin: 0;
 }

 .settings-section {
 background: #ffffff;
 padding: 32px;
 border-radius: 12px;
 border: 1px solid #dbe3ed;
 box-shadow: 0 1px 3px rgba(15,23,42,0.06);
 margin-bottom: 24px;
 }

 .settings-section h2 {
 color: #172033;
 }

 .connect-shopify-card {
 text-align: center;
 padding: 48px;
 }

 .icon-circle {
 width: 80px;
 height: 80px;
 background: #27272a;
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 font-size: 40px;
 margin: 0 auto 24px;
 }

 .connect-shopify-card h2 {
 color: #fafafa;
 }

 .connect-shopify-card p {
 color: #d4d4d8;
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
 color: #fafafa;
 }

 .shop-domain-input {
 width: 100%;
 padding: 12px;
 border: 2px solid #27272a;
 border-radius: 8px;
 font-size: 16px;
 background: #18181b;
 color: #fafafa;
 }

 .shop-domain-input:focus {
 outline: none;
 border-color: #4f46e5;
 }

 .btn-primary {
 background: #4f46e5;
 color: #09090b;
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
 background: #18181b;
 border: 1px solid #27272a;
 border-radius: 8px;
 color: #d4d4d8;
 }

 .help-text strong {
 color: #fafafa;
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
 border-bottom: 1px solid #27272a;
 }

 .connected-shopify-card h3 {
 color: #fafafa;
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
 border-bottom: 1px solid #27272a;
 color: #d4d4d8;
 }

 .detail-row .label {
 font-weight: 500;
 color: #a1a1aa;
 }

 .detail-row .value {
 color: #fafafa;
 }

 .sync-actions {
 margin: 32px 0;
 }

 .sync-actions h4 {
 color: #fafafa;
 }

 .sync-buttons {
 display: grid;
 grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
 gap: 12px;
 margin-top: 16px;
 }

 .sync-buttons button {
 padding: 12px 24px;
 background: #27272a;
 border: none;
 border-radius: 8px;
 cursor: pointer;
 font-weight: 500;
 color: #fafafa;
 transition: all 0.2s;
 }

 .sync-buttons button:hover {
 background: #3f3f46;
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
 color: #d4d4d8;
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
 border-bottom: 1px solid #27272a;
 }

 .setting-group h3 {
 color: #fafafa;
 }

 .setting-group p {
 color: #d4d4d8;
 }

 .setting-group:last-child {
 border-bottom: none;
 }

 /* Modern Card Styles */
 .setting-card {
 background: #ffffff;
 border: 1px solid #dbe3ed;
 border-radius: 16px;
 margin-bottom: 24px;
 overflow: hidden;
 transition: all 0.3s;
 }

 .setting-card:hover {
 border-color: #bfdbfe;
 box-shadow: 0 4px 12px rgba(15,23,42,0.08);
 }

 .card-header {
 display: flex;
 align-items: center;
 gap: 16px;
 padding: 24px;
 border-bottom: 1px solid #dbe3ed;
 background: #f8fafc;
 }

 .header-icon {
 font-size: 32px;
 width: 56px;
 height: 56px;
 background: #27272a;
 border-radius: 12px;
 display: flex;
 align-items: center;
 justify-content: center;
 }

 .card-header h3 {
 margin: 0 0 4px 0;
 font-size: 20px;
 font-weight: 600;
 color: #172033;
 }

 .card-subtitle {
 margin: 0;
 font-size: 14px;
 color: #64748b;
 }

 .card-body {
 padding: 24px;
 }

 .card-actions {
 display: flex;
 gap: 12px;
 margin-top: 24px;
 padding-top: 24px;
 border-top: 1px solid #27272a;
 }

 /* API Key Section */
 .api-key-section {
 max-width: 100%;
 }

 .input-label {
 display: block;
 font-weight: 600;
 color: #fafafa;
 margin-bottom: 12px;
 font-size: 14px;
 }

 .api-key-display {
 display: flex;
 gap: 12px;
 align-items: center;
 background: #18181b;
 border: 2px solid #27272a;
 border-radius: 8px;
 padding: 16px;
 }

 .api-key-code {
 flex: 1;
 font-family: 'Courier New', monospace;
 font-size: 14px;
 color: #4f46e5;
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
 background: #27272a;
 border: none;
 border-radius: 6px;
 padding: 8px 12px;
 font-size: 18px;
 cursor: pointer;
 transition: all 0.2s;
 }

 .btn-icon-action:hover {
 background: #3f3f46;
 transform: scale(1.05);
 }

 .btn-secondary-small {
 background: #27272a;
 color: #fafafa;
 border: none;
 border-radius: 6px;
 padding: 8px 16px;
 font-size: 14px;
 font-weight: 500;
 cursor: pointer;
 transition: all 0.2s;
 }

 .btn-secondary-small:hover {
 background: #3f3f46;
 }

 .btn-secondary-small:disabled {
 opacity: 0.5;
 cursor: not-allowed;
 }

 .help-text-small {
 margin-top: 12px;
 font-size: 13px;
 color: #64748b;
 line-height: 1.5;
 }

 .settings-content,
 .settings-page > div {
 min-width: 0;
 }

 @media (max-width: 600px) {
 .settings-section {
 padding: 20px;
 }
 }
 `}</style>
 </div>
 );
};

export default Settings;


