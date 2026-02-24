import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, apiFetchJSON } from '../api';
import { PLAN_LABEL, PLAN_CREDITS, PLAN_COLOUR } from '../hooks/usePlan';

const CREDIT_PACKS = [
  { id: 'credits-500',   credits: 500,   price: 9,   label: '500 credits' },
  { id: 'credits-2000',  credits: 2000,  price: 29,  label: '2,000 credits', save: '28%' },
  { id: 'credits-5000',  credits: 5000,  price: 59,  label: '5,000 credits', save: '34%', popular: true },
  { id: 'credits-15000', credits: 15000, price: 149, label: '15,000 credits', save: '45%' },
];

// Action type to human-readable label mapping
const ACTION_LABELS = {
  'seo-scan':            'SEO scan',
  'seo-analysis':        'SEO analysis',
  'alt-text':            'Alt-text generation',
  'image-alt':           'Image alt-text',
  'blog-draft':          'Blog draft',
  'blog-outline':        'Blog outline',
  'content-brief':       'Content brief',
  'email-gen':           'Email generation',
  'email-template':      'Email template',
  'social-post':         'Social post',
  'social-schedule':     'Social schedule',
  'link-suggestion':     'Link suggestion',
  'internal-link':       'Internal link',
  'competitive-report':  'Competitive report',
  'competitive-analysis':'Competitive analysis',
  'support-reply':       'Support reply',
  'ai-support':          'AI support',
  'product-description': 'Product description',
  'schema-gen':          'Schema generation',
  'keyword-research':    'Keyword research',
  'rank-check':          'Rank check',
  'churn-predict':       'Churn prediction',
  'pricing-optimize':    'Pricing optimisation',
  'ad-copy':             'Ad copy',
  'campaign-gen':        'Campaign generation',
  'analytics-insight':   'Analytics insight',
  'segmentation':        'Segmentation',
  'personalization':     'Personalisation',
  'fix-queue-item':      'SEO auto-fix',
  'generic-ai':          'AI action',
};

const S = {
  shell: { background: '#09090b', minHeight: '100%', padding: '32px 28px', color: '#fafafa' },
  card: { background: '#18181b', borderRadius: 14, padding: 24, border: '1px solid #27272a', marginBottom: 20 },
  h2: { fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: '#fafafa' },
  sub: { fontSize: 14, color: '#71717a', margin: '0 0 20px' },
  label: { fontSize: 13, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  bigNum: { fontSize: 36, fontWeight: 900, color: '#fafafa', lineHeight: 1.1 },
  bar: { background: '#27272a', borderRadius: 6, height: 10, overflow: 'hidden', margin: '12px 0 6px' },
  barFill: { height: '100%', borderRadius: 6, transition: 'width 0.4s ease' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 },
  packCard: { background: '#18181b', borderRadius: 12, padding: '20px 18px', border: '2px solid #27272a', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' },
  packCardPop: { border: '2px solid #4f46e5' },
  btn: { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%', marginTop: 10 },
  btnDis: { opacity: 0.5, cursor: 'not-allowed' },
  btnSm: { background: '#27272a', color: '#fafafa', border: '1px solid #3f3f46', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  table: { width: '100%', fontSize: 14, borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '6px 10px', color: '#4f46e5', borderBottom: '1px solid #27272a', fontWeight: 700 },
  td: { padding: '6px 10px', borderBottom: '1px solid #27272a22' },
  badge: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, marginLeft: 8 },
  error: { background: '#2d1515', border: '1px solid #f87171', borderRadius: 8, padding: '10px 16px', color: '#f87171', fontSize: 14, marginBottom: 16 },
  success: { background: '#052e16', border: '1px solid #4ade80', borderRadius: 8, padding: '10px 16px', color: '#4ade80', fontSize: 14, marginBottom: 16 },
  txRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #27272a44' },
  txAction: { fontSize: 14, fontWeight: 600, color: '#fafafa' },
  txTime: { fontSize: 12, color: '#71717a' },
  txCost: { fontSize: 14, fontWeight: 700, minWidth: 60, textAlign: 'right' },
  liveRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 },
  statBox: { background: '#0f0f12', borderRadius: 10, padding: '14px 18px', flex: '1 1 120px', minWidth: 120 },
  statLabel: { fontSize: 12, color: '#71717a', marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: 800, color: '#fafafa' },
};

function formatTimeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

const Credits = ({ plan = 'free' }) => {
  const [balance, setBalance] = useState(null);
  const [used, setUsed] = useState(0);
  const [unlimited, setUnlimited] = useState(false);
  const [planCredits, setPlanCredits] = useState(0);
  const [topupCredits, setTopupCredits] = useState(0);
  const [lifetimeUsed, setLifetimeUsed] = useState(0);
  const [periodStart, setPeriodStart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Transaction history
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // Credit costs from API
  const [creditCosts, setCreditCosts] = useState(null);
  const [modelMultipliers, setModelMultipliers] = useState(null);

  const loadCredits = useCallback(async () => {
    try {
      const res = await apiFetchJSON('/api/billing/credits');
      const data = res;
      if (data.ok) {
        setBalance(data.balance);
        setUsed(data.used || 0);
        setUnlimited(data.unlimited || false);
        setPlanCredits(data.plan_credits || 0);
        setTopupCredits(data.topup_credits || 0);
        setLifetimeUsed(data.lifetime_used || 0);
        setPeriodStart(data.period_start || null);
        // Use recent_transactions from credit status if available
        if (data.recent_transactions) {
          setTransactions(data.recent_transactions.slice().reverse());
        }
      }
    } catch (_) {
      const pc = PLAN_CREDITS[plan] || 10;
      setBalance(pc === -1 ? 999999 : pc);
      setUnlimited(pc === -1);
      setPlanCredits(pc === -1 ? 999999 : pc);
    }
    setLoading(false);
  }, [plan]);

  const loadHistory = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await apiFetchJSON('/api/billing/credit-history');
      const data = res;
      if (data.ok && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch (_) { /* silent */ }
    setTxLoading(false);
  }, []);

  const loadCosts = useCallback(async () => {
    try {
      const res = await apiFetchJSON('/api/billing/credit-costs');
      const data = res;
      if (data.ok && data.costs) {
        setCreditCosts(data.costs);
      }
      if (data.modelMultipliers) {
        setModelMultipliers(data.modelMultipliers);
      }
    } catch (_) { /* silent */ }
  }, []);

  useEffect(() => {
    loadCredits();
    loadCosts();
  }, [loadCredits, loadCosts]);

  async function handleBuyCredits() {
    if (!selectedPack) return;
    setPurchasing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetchJSON('/api/billing/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: selectedPack }),
      });
      const data = await res.json();
      if (data.ok && data.confirmationUrl) {
        window.open(data.confirmationUrl, '_top');
      } else if (data.ok) {
        setSuccess(`${data.credits} credits added to your account!`);
        setBalance(b => (b || 0) + (data.credits || 0));
        setTopupCredits(t => t + (data.credits || 0));
      } else {
        setError(data.error || 'Purchase failed');
      }
    } catch (e) {
      setError(e.message || 'Network error');
    }
    setPurchasing(false);
  }

  const totalPool = unlimited ? 1 : (balance || 0) + used;
  const usedPct = totalPool > 0 ? Math.min(100, (used / totalPool) * 100) : 0;
  const barColor = usedPct > 80 ? '#f87171' : usedPct > 50 ? '#facc15' : '#4ade80';
  const planLabel = PLAN_LABEL[plan] || 'Starter';
  const planColour = PLAN_COLOUR[plan] || '#71717a';

  // Days until period reset
  const daysLeft = periodStart
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(periodStart).getTime()) / 86400000))
    : 30;

  // Cost table from API or fallback
  const costEntries = creditCosts
    ? Object.entries(creditCosts).map(([key, cost]) => ({
        action: ACTION_LABELS[key] || key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        cost,
        key,
      }))
    : Object.entries(ACTION_LABELS).map(([key, label]) => ({ action: label, cost: '?', key }));

  return (
    <div style={S.shell}>
      <h2 style={S.h2}>Credits & Usage</h2>
      <p style={S.sub}>AI credits power every tool in AURA. Each plan includes monthly credits, and you can buy top-up packs anytime.</p>

      {error && <div style={S.error}>{error}</div>}
      {success && <div style={S.success}>{success}</div>}

      {/* Balance card */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={S.label}>Available credits</div>
            <div style={S.bigNum}>
              {loading ? '\u2026' : unlimited ? '\u221E Unlimited' : (balance || 0).toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={S.label}>Plan</div>
            <span style={{ ...S.badge, background: `${planColour}22`, color: planColour, border: `1px solid ${planColour}44`, fontSize: 13, padding: '4px 12px' }}>
              {planLabel}
            </span>
          </div>
        </div>

        {!unlimited && (
          <div>
            <div style={S.bar}>
              <div style={{ ...S.barFill, width: `${usedPct}%`, background: barColor }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#71717a' }}>
              <span>{used.toLocaleString()} used this period</span>
              <span>{(balance || 0).toLocaleString()} remaining</span>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={S.liveRow}>
          <div style={S.statBox}>
            <div style={S.statLabel}>Plan credits</div>
            <div style={S.statVal}>{unlimited ? '\u221E' : planCredits.toLocaleString()}<span style={{ fontSize: 12, color: '#71717a', fontWeight: 400 }}>/mo</span></div>
          </div>
          {topupCredits > 0 && (
            <div style={S.statBox}>
              <div style={S.statLabel}>Top-up credits</div>
              <div style={S.statVal}>{topupCredits.toLocaleString()}</div>
            </div>
          )}
          <div style={S.statBox}>
            <div style={S.statLabel}>Period resets in</div>
            <div style={S.statVal}>{daysLeft}<span style={{ fontSize: 12, color: '#71717a', fontWeight: 400 }}> days</span></div>
          </div>
          <div style={S.statBox}>
            <div style={S.statLabel}>Lifetime used</div>
            <div style={S.statVal}>{lifetimeUsed.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fafafa' }}>Transaction History</h3>
          <button
            style={S.btnSm}
            onClick={loadHistory}
            disabled={txLoading}
          >
            {txLoading ? 'Loading\u2026' : 'Load Full History'}
          </button>
        </div>

        {transactions.length === 0 && !txLoading && (
          <div style={{ color: '#71717a', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            No transactions yet. Credits will be deducted when you use AI tools.
          </div>
        )}

        {transactions.length > 0 && (
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {transactions.map((tx, i) => {
              const isDeduct = tx.type === 'deduct';
              const isTopup = tx.type === 'topup';
              const isReset = tx.type === 'period_reset';
              const isPlanChange = tx.type === 'plan_change';

              return (
                <div key={i} style={S.txRow}>
                  <div>
                    <div style={S.txAction}>
                      {isDeduct && (ACTION_LABELS[tx.action] || tx.action || 'AI Action')}
                      {isTopup && 'Credit Top-Up'}
                      {isReset && 'Period Reset'}
                      {isPlanChange && `Plan: ${tx.from || '?'} \u2192 ${tx.to || '?'}`}
                    </div>
                    <div style={S.txTime}>
                      {formatTimeAgo(tx.timestamp)}
                      {tx.tool && <span style={{ marginLeft: 8, color: '#52525b' }}>{tx.tool}</span>}
                    </div>
                  </div>
                  <div style={{
                    ...S.txCost,
                    color: isDeduct ? '#f87171' : isTopup ? '#4ade80' : '#71717a',
                  }}>
                    {isDeduct && `-${tx.cost || 0}`}
                    {isTopup && `+${tx.credits || 0}`}
                    {isReset && '\u21BB'}
                    {isPlanChange && '\u2191'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buy credits section */}
      <div style={S.card}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#fafafa' }}>Buy Credit Top-Ups</h3>
        <p style={{ fontSize: 14, color: '#71717a', margin: '0 0 16px' }}>Need more credits? Purchase a one-time top-up pack. Credits never expire.</p>

        <div style={S.grid}>
          {CREDIT_PACKS.map(pack => (
            <div
              key={pack.id}
              onClick={() => setSelectedPack(pack.id)}
              style={{
                ...S.packCard,
                ...(pack.popular ? S.packCardPop : {}),
                ...(selectedPack === pack.id ? { borderColor: '#4ade80', background: '#4ade8010' } : {}),
              }}
            >
              {pack.popular && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', marginBottom: 6, textTransform: 'uppercase' }}>Best Value</div>
              )}
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fafafa' }}>{pack.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fafafa', margin: '8px 0 4px' }}>${pack.price}</div>
              <div style={{ fontSize: 13, color: '#71717a' }}>
                ${(pack.price / pack.credits * 100).toFixed(1)}{'\u00a2'} per credit
              </div>
              {pack.save && (
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', marginTop: 4 }}>Save {pack.save}</div>
              )}
            </div>
          ))}
        </div>

        <button
          style={{ ...S.btn, ...((!selectedPack || purchasing) ? S.btnDis : {}), marginTop: 16 }}
          onClick={handleBuyCredits}
          disabled={!selectedPack || purchasing}
        >
          {purchasing ? 'Processing\u2026' : selectedPack ? `Buy ${CREDIT_PACKS.find(p => p.id === selectedPack)?.label}` : 'Select a pack'}
        </button>
      </div>

      {/* Credit costs table */}
      <div style={S.card}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#fafafa' }}>Credit Costs per Action</h3>
        <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 14px' }}>
          Base costs assume the most affordable AI model. Premium models apply a multiplier.
        </p>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Action</th>
              <th style={{ ...S.th, textAlign: 'center' }}>Base Credits</th>
            </tr>
          </thead>
          <tbody>
            {costEntries
              .sort((a, b) => (typeof a.cost === 'number' && typeof b.cost === 'number') ? a.cost - b.cost : 0)
              .map(row => (
                <tr key={row.key}>
                  <td style={S.td}>{row.action}</td>
                  <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: '#fafafa' }}>{row.cost}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Model multipliers */}
      <div style={S.card}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#fafafa' }}>AI Model Pricing Tiers</h3>
        <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 14px' }}>
          Different AI models cost different amounts. The multiplier is applied to the base credit cost above.
        </p>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Tier</th>
              <th style={S.th}>Models</th>
              <th style={{ ...S.th, textAlign: 'center' }}>Multiplier</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}><span style={{ color: '#4ade80', fontWeight: 700 }}>Budget</span></td>
              <td style={{ ...S.td, fontSize: 13 }}>gpt-4o-mini, gpt-4.1-mini, gpt-5-mini</td>
              <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: '#4ade80' }}>1{'\u00d7'}</td>
            </tr>
            <tr>
              <td style={S.td}><span style={{ color: '#60a5fa', fontWeight: 700 }}>Standard</span></td>
              <td style={{ ...S.td, fontSize: 13 }}>gpt-4o, gpt-4.1, gpt-4-turbo</td>
              <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: '#60a5fa' }}>2{'\u00d7'}</td>
            </tr>
            <tr>
              <td style={S.td}><span style={{ color: '#c084fc', fontWeight: 700 }}>Premium</span></td>
              <td style={{ ...S.td, fontSize: 13 }}>gpt-4, gpt-5</td>
              <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: '#c084fc' }}>3{'\u00d7'}</td>
            </tr>
            <tr>
              <td style={S.td}><span style={{ color: '#f97316', fontWeight: 700 }}>Frontier</span></td>
              <td style={{ ...S.td, fontSize: 13 }}>gpt-5.2, o1, o3</td>
              <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: '#f97316' }}>5{'\u00d7'}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ background: '#0f0f12', borderRadius: 8, padding: '12px 16px', marginTop: 12, fontSize: 13 }}>
          <span style={{ color: '#71717a' }}>Example: </span>
          <span style={{ color: '#fafafa' }}>Blog draft </span>
          <span style={{ color: '#71717a' }}>(3 base) {'\u00d7'} </span>
          <span style={{ color: '#c084fc' }}>gpt-4 </span>
          <span style={{ color: '#71717a' }}>(3{'\u00d7'}) = </span>
          <span style={{ color: '#fafafa', fontWeight: 700 }}>9 credits</span>
        </div>
        <p style={{ fontSize: 13, color: '#71717a', marginTop: 10 }}>
          Credits are deducted only when an AI action completes successfully. Plan credits reset monthly. Top-up credits never expire.
        </p>
      </div>
    </div>
  );
};

export default Credits;
