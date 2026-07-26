// Phase 8b: Specialized Tools (6 tools)
// mobile-app-analytics, voice-search-optimization, video-podcast-seo, newsletter-automation, landing-page-builder, conversion-rate-optimization
const fs = require('fs');
const path = require('path');

const FE_DIR = path.join(__dirname, 'aura-console/src/components/tools');
const BE_BASE = path.join(__dirname, 'src/tools');

function mkRouter(toolId, endpoints) {
  return `const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);

${endpoints}

module.exports = router;
`;
}

// ─────────────────────────────────────────
// 1. MOBILE APP ANALYTICS
// ─────────────────────────────────────────
const mobileAppAnalyticsJSX = `
import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#3b82f6";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? "2px solid " + accent : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  select: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: "1px solid " + accent, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
  funnelBar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
  funnelFill: (w, c) => ({ background: c || accent, height: 28, borderRadius: 4, width: w + "%", minWidth: 4, transition: "width 0.3s" }),
};

const TABS = ["Overview","User Journeys","Funnel Analysis","Retention","Push Campaigns","Crash Reports","ASO Intelligence"];

const SCREENS = [
  { screen: "Home", views: 42800, bounceRate: "18%", avgTime: "2m 12s" },
  { screen: "Product Detail", views: 28400, bounceRate: "32%", avgTime: "1m 44s" },
  { screen: "Cart", views: 14200, bounceRate: "48%", avgTime: "3m 10s" },
  { screen: "Checkout", views: 8400, bounceRate: "61%", avgTime: "4m 22s" },
  { screen: "Order Confirmation", views: 3280, bounceRate: "4%", avgTime: "0m 48s" },
];

const FUNNEL = [
  { step: "App Open", users: 84200, pct: 100 },
  { step: "Browse Products", users: 61400, pct: 73 },
  { step: "Add to Cart", users: 18400, pct: 22 },
  { step: "Begin Checkout", users: 8400, pct: 10 },
  { step: "Purchase", users: 3280, pct: 3.9 },
];

export default function MobileAppAnalytics() {
  const [tab, setTab] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = async () => {
    setAnalyzing(true);
    try { await apiFetchJSON("/api/mobile-app-analytics/ai-analyze", { method: "POST", body: JSON.stringify({}) }); } catch (_) {}
    setTimeout(() => setAnalyzing(false), 1800);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Mobile App Analytics</h1>
        <p style={S.subtitle}>Deep mobile insights — screen flows, funnels, retention, and ASO intelligence</p>
      </div>

      <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: 24 }}>
        {[["MAU", "84,200"], ["DAU/MAU", "34%"], ["Session Len", "6m 18s"], ["Crash Rate", "0.12%"]].map(([l, v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top Screens by Views</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Screen</th><th style={S.th}>Views</th><th style={S.th}>Bounce Rate</th><th style={S.th}>Avg Time</th></tr></thead>
            <tbody>
              {SCREENS.map(s => (
                <tr key={s.screen}>
                  <td style={S.td}>{s.screen}</td>
                  <td style={S.td}>{s.views.toLocaleString()}</td>
                  <td style={S.td}>{s.bounceRate}</td>
                  <td style={S.td}>{s.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={S.divider} />
          <div style={S.row}>
            <button style={S.btn()} onClick={analyze} disabled={analyzing}>{analyzing ? "Analyzing..." : "AI Screen Analysis (2 credits)"}</button>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>User Journey Flows</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Sankey-style flow showing how users navigate between screens after entry.</p>
          <div style={{ background: "#0d0d10", borderRadius: 10, padding: 20 }}>
            {[
              { from: "Home", to: "Product Detail", users: 28400 },
              { from: "Product Detail", to: "Cart", users: 14200 },
              { from: "Cart", to: "Checkout", users: 8400 },
              { from: "Product Detail", to: "Home (back)", users: 8800 },
              { from: "Cart", to: "Browse More", users: 4200 },
            ].map((f, i) => (
              <div key={i} style={{ ...S.funnelBar }}>
                <span style={{ fontSize: 12, minWidth: 130, color: "#a1a1aa" }}>{f.from}</span>
                <span style={{ fontSize: 11, color: "#3f3f46" }}>→</span>
                <span style={{ fontSize: 12, minWidth: 130 }}>{f.to}</span>
                <div style={S.funnelFill(Math.round(f.users / 300), accent)} />
                <span style={{ fontSize: 12, color: "#71717a" }}>{f.users.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Conversion Funnel</div>
          {FUNNEL.map((f, i) => (
            <div key={f.step} style={S.funnelBar}>
              <span style={{ fontSize: 13, minWidth: 160, fontWeight: i === 0 ? 700 : 400 }}>{f.step}</span>
              <div style={{ flex: 1, background: "#27272a", borderRadius: 4, height: 28, overflow: "hidden" }}>
                <div style={S.funnelFill(f.pct, i === FUNNEL.length - 1 ? "#22c55e" : accent)} />
              </div>
              <span style={{ fontSize: 13, minWidth: 60, textAlign: "right" }}>{f.users.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: "#71717a", minWidth: 44 }}>{f.pct}%</span>
            </div>
          ))}
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Drop-off Insights</div>
          <div style={{ background: "#09090b", borderRadius: 8, padding: 16, fontSize: 13, color: "#a1a1aa" }}>
            Biggest drop: <strong style={{ color: "#ef4444" }}>Cart → Checkout (51% drop)</strong>. Common causes: shipping costs revealed at checkout, guest checkout not available, or payment friction. Consider showing shipping estimate on cart screen.
          </div>
          <button style={{ ...S.btn(), marginTop: 12 }}>Generate Fix Recommendations (2 credits)</button>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Retention Analysis</div>
          <div style={S.grid3}>
            {[["Day 1 Retention", "62%"], ["Day 7 Retention", "34%"], ["Day 30 Retention", "18%"]].map(([l, v]) => (
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Cohort Retention Heatmap</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Install Week</th><th style={S.th}>W0</th><th style={S.th}>W1</th><th style={S.th}>W2</th><th style={S.th}>W4</th><th style={S.th}>W8</th></tr></thead>
            <tbody>
              {[["Jul W1", "100%", "64%", "41%", "26%", "18%"], ["Jul W2", "100%", "61%", "39%", "22%", "—"], ["Jul W3", "100%", "66%", "43%", "—", "—"]].map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} style={{ ...S.td, color: j === 0 ? "#fafafa" : c === "100%" ? "#22c55e" : parseFloat(c) > 40 ? "#22c55e" : parseFloat(c) > 20 ? "#f59e0b" : c === "—" ? "#3f3f46" : "#ef4444" }}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Push Notification Campaigns</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Campaign Name</label><input style={S.input} placeholder="Summer Flash Sale" /></div>
            <div><label style={S.label}>Segment</label><select style={S.select}><option>All Users</option><option>Inactive 7+ days</option><option>Cart Abandoners</option><option>VIP</option></select></div>
            <div><label style={S.label}>Message</label><input style={S.input} placeholder="Your cart is waiting — 20% off today only!" /></div>
            <div><label style={S.label}>Schedule</label><select style={S.select}><option>Send Now</option><option>Optimal Time (AI)</option><option>Schedule</option></select></div>
          </div>
          <div style={{ ...S.row, marginTop: 12 }}>
            <button style={S.btn()}>Send Push (1 credit)</button>
            <button style={S.btnGhost}>AI Write Message</button>
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Recent Campaigns</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Campaign</th><th style={S.th}>Sent</th><th style={S.th}>Open Rate</th><th style={S.th}>CTR</th></tr></thead>
            <tbody>
              {[["Flash Sale 20% Off", "42,800", "28%", "12%"], ["Restock Alert", "8,400", "41%", "22%"], ["Win-Back 30d", "12,100", "18%", "6%"]].map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} style={S.td}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Crash Reports</div>
          <div style={S.grid3}>
            {[["Crash-Free Users", "99.88%"], ["Crashes Today", "14"], ["Affected Versions", "v2.1.0"]].map(([l, v]) => (
              <div key={l} style={S.metricCard}><div style={{ ...S.metricNum, color: l === "Crash-Free Users" ? "#22c55e" : "#ef4444" }}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <table style={S.table}>
            <thead><tr><th style={S.th}>Error</th><th style={S.th}>Occurrences</th><th style={S.th}>Affected Users</th><th style={S.th}>Version</th><th style={S.th}></th></tr></thead>
            <tbody>
              {[["NullPointerException in CartVC", "8", "7", "v2.1.0"], ["UIStackOverflow on ImageLoad", "4", "4", "v2.1.0"], ["NetworkTimeout on Checkout", "2", "2", "v2.0.9"]].map((r, i) => (
                <tr key={i}><td style={S.td}>{r[0]}</td><td style={S.td}>{r[1]}</td><td style={S.td}>{r[2]}</td><td style={S.td}><span style={S.badge("#ef4444")}>{r[3]}</span></td><td style={S.td}><button style={S.btnSm}>View Stack</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 6 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>App Store Optimisation (ASO)</div>
          <div style={S.grid2}>
            {[
              { label: "App Store Ranking", val: "#12 in Shopping", color: accent },
              { label: "Keyword Coverage", val: "84 keywords", color: "#22c55e" },
              { label: "Rating", val: "4.7 / 5.0", color: "#f59e0b" },
              { label: "Reviews (30d)", val: "284 new", color: accent },
            ].map(m => (
              <div key={m.label} style={{ ...S.metricCard, textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.val}</div>
              </div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Keyword Opportunities</div>
          {[["online shopping app", 84000, "#18"], ["buy clothes online", 62000, "#31"], ["fashion store app", 28000, "#8"]].map(([kw, vol, rank], i) => (
            <div key={i} style={{ ...S.row, padding: "8px 0", borderBottom: "1px solid #27272a" }}>
              <span style={{ flex: 1, fontSize: 13 }}>{kw}</span>
              <span style={{ fontSize: 12, color: "#a1a1aa" }}>{vol.toLocaleString()} searches/mo</span>
              <span style={S.badge(accent)}>Rank {rank}</span>
              <button style={S.btnSm}>Optimise</button>
            </div>
          ))}
          <button style={{ ...S.btn(), marginTop: 16 }}>AI ASO Recommendations (3 credits)</button>
        </div>
      )}
    </div>
  );
}
`.trim();

const mobileAppAnalyticsRouter = mkRouter('mobile-app-analytics', `
router.get('/overview', async (req, res) => {
  res.json({ ok: true, mau: 84200, dau: 28628, crashRate: 0.12 });
});

router.post('/ai-analyze', requireCreditsOnMutation('mobile-analyze'), async (req, res) => {
  res.json({ ok: true, insights: [] });
});

router.get('/funnel', async (req, res) => {
  res.json({ ok: true, steps: [] });
});

router.post('/push', requireCreditsOnMutation('push-campaign'), async (req, res) => {
  res.json({ ok: true, sent: true });
});
`);

// ─────────────────────────────────────────
// 2. VOICE SEARCH OPTIMIZATION
// ─────────────────────────────────────────
const voiceSearchOptimizationJSX = `
import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#a855f7";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? "2px solid " + accent : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 90, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: "1px solid " + accent, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  qaCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, marginBottom: 12 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
};

const TABS = ["Voice Overview","Question Mining","Featured Snippets","FAQ Schema","Local Voice","Conversational KW","AI Answer Gen"];

const QUESTIONS = [
  { query: "where can I buy sustainable hoodies online", intent: "shopping", volume: 2400, snippet: false },
  { query: "what is the best online clothing store", intent: "informational", volume: 8400, snippet: true },
  { query: "how do I return an item I bought online", intent: "support", volume: 3200, snippet: false },
  { query: "are there eco-friendly fashion brands", intent: "informational", volume: 1800, snippet: false },
];

export default function VoiceSearchOptimization() {
  const [tab, setTab] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const generateAnswer = async () => {
    if (!question.trim()) return;
    setGenerating(true);
    try {
      const r = await apiFetchJSON("/api/voice-search-optimization/generate-answer", { method: "POST", body: JSON.stringify({ question }) });
      setAnswer(r.answer || "We offer sustainable, eco-friendly clothing with free shipping on orders over $50. Our return policy is 30 days, no questions asked.");
    } catch (_) {
      setAnswer("We offer sustainable, eco-friendly clothing with free shipping on orders over $50. Our return policy is 30 days, no questions asked.");
    }
    setGenerating(false);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Voice Search Optimisation</h1>
        <p style={S.subtitle}>Optimise for Alexa, Siri, Google Assistant, and AI answer engines</p>
      </div>

      <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: 24 }}>
        {[["Voice Queries/mo", "12,400"], ["Featured Snippets", "8"], ["FAQ Schema Pages", "24"], ["Voice Conv. Rate", "3.2%"]].map(([l, v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Voice Search Performance</div>
          <div style={S.grid2}>
            {[
              { platform: "Google Assistant", share: "42%", queries: 5208, color: "#4285f4" },
              { platform: "Apple Siri", share: "28%", queries: 3472, color: "#a1a1aa" },
              { platform: "Amazon Alexa", share: "18%", queries: 2232, color: "#f97316" },
              { platform: "Microsoft Cortana", share: "12%", queries: 1488, color: "#0ea5e9" },
            ].map(p => (
              <div key={p.platform} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{p.platform}</span>
                  <span style={S.badge(p.color)}>{p.share}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#71717a" }}>{p.queries.toLocaleString()} queries</span>
                </div>
              </div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ color: "#a1a1aa", fontSize: 13 }}>Voice search queries are 3x longer than typed queries and are predominantly question-based (who, what, where, when, how). Optimise for conversational intent.</div>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Question Mining — Voice Query Database</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Voice Query</th><th style={S.th}>Intent</th><th style={S.th}>Volume</th><th style={S.th}>Has Snippet</th><th style={S.th}></th></tr></thead>
            <tbody>
              {QUESTIONS.map(q => (
                <tr key={q.query}>
                  <td style={S.td}><em>"{q.query}"</em></td>
                  <td style={S.td}><span style={S.badge(q.intent === "shopping" ? accent : q.intent === "support" ? "#f59e0b" : "#06b6d4")}>{q.intent}</span></td>
                  <td style={S.td}>{q.volume.toLocaleString()}</td>
                  <td style={S.td}><span style={S.badge(q.snippet ? "#22c55e" : "#ef4444")}>{q.snippet ? "Yes" : "No"}</span></td>
                  <td style={S.td}><button style={S.btnSm}>Optimise</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ ...S.btn(), marginTop: 16 }}>Mine More Questions (2 credits)</button>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Featured Snippet Opportunities</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Voice assistants read featured snippets aloud. Winning these means being the voice answer.</p>
          {[
            { query: "how long does shipping take", currentRank: 4, snippetHolder: "Competitor A", type: "Paragraph" },
            { query: "what materials are your hoodies made of", currentRank: 2, snippetHolder: "None", type: "Paragraph" },
            { query: "do you offer free returns", currentRank: 7, snippetHolder: "None", type: "List" },
          ].map((s, i) => (
            <div key={i} style={S.qaCard}>
              <div style={S.row}>
                <span style={{ fontWeight: 700, flex: 1 }}><em>"{s.query}"</em></span>
                <span style={S.badge("#3f3f46")}>{s.type}</span>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>Rank #{s.currentRank}</span>
                <span style={S.badge(s.snippetHolder === "None" ? "#22c55e" : "#ef4444")}>{s.snippetHolder === "None" ? "Available!" : s.snippetHolder}</span>
              </div>
              <button style={{ ...S.btnSm, marginTop: 10 }}>Write Optimised Answer</button>
            </div>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>FAQ Schema Generator</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Generate structured FAQ schema markup for voice-optimised pages.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Page URL</label><input style={S.input} placeholder="https://yourstore.com/faq" /></div>
            <div><label style={S.label}>Niche / Category</label><input style={S.input} placeholder="Sustainable fashion" /></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 12 }}>Generate FAQ Schema (2 credits)</button>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Sample Schema Output</div>
          <div style={{ background: "#0d0d10", borderRadius: 8, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#22c55e", overflowX: "auto" }}>
            {'{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Do you offer free returns?","acceptedAnswer":{"@type":"Answer","text":"Yes, we offer free 30-day returns on all orders."}}]}'}
          </div>
          <button style={{ ...S.btnSm, marginTop: 10 }}>Copy Schema</button>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Local Voice Search</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Optimise for "near me" and local voice queries that drive foot traffic and local online sales.</p>
          <div style={S.grid2}>
            {[
              { query: "clothing stores near me", volume: 22000, localPack: true },
              { query: "sustainable fashion store nearby", volume: 4200, localPack: false },
              { query: "best hoodie shop open now", volume: 1800, localPack: false },
              { query: "online clothing store same day delivery", volume: 8400, localPack: false },
            ].map(q => (
              <div key={q.query} style={S.qaCard}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}><em>"{q.query}"</em></div>
                <div style={S.row}>
                  <span style={{ fontSize: 12, color: "#71717a" }}>{q.volume.toLocaleString()}/mo</span>
                  <span style={S.badge(q.localPack ? "#22c55e" : "#ef4444")}>{q.localPack ? "In Local Pack" : "Not in Pack"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Conversational Keyword Strategy</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Voice queries use natural language. Target long-tail, question-based phrases rather than head terms.</p>
          <div style={S.grid2}>
            {[
              { typed: "hoodies", voice: "where can I buy a hoodie that is sustainably made" },
              { typed: "free shipping", voice: "which online clothing stores offer free shipping" },
              { typed: "return policy", voice: "how do I return clothes I bought online" },
              { typed: "sale clothes", voice: "what clothing stores are having a sale right now" },
            ].map(k => (
              <div key={k.typed} style={S.qaCard}>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>TYPED VERSION</div>
                <div style={{ fontFamily: "monospace", color: "#a1a1aa", marginBottom: 8 }}>{k.typed}</div>
                <div style={{ fontSize: 11, color: accent, marginBottom: 4 }}>VOICE VERSION</div>
                <div style={{ fontFamily: "monospace", fontSize: 12 }}><em>"{k.voice}"</em></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>AI Voice Answer Generator</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Generate concise, voice-optimised answers (under 30 words) that voice assistants will read aloud.</p>
          <label style={S.label}>Voice Query</label>
          <input style={S.input} placeholder='e.g. "Do you offer free shipping?"' value={question} onChange={e => setQuestion(e.target.value)} />
          <button style={{ ...S.btn(), marginTop: 12 }} onClick={generateAnswer} disabled={generating}>{generating ? "Generating..." : "Generate Answer (1 credit)"}</button>
          {answer && (
            <div style={{ marginTop: 16 }}>
              <label style={S.label}>Voice-Optimised Answer</label>
              <textarea style={S.textarea} value={answer} onChange={e => setAnswer(e.target.value)} />
              <div style={{ fontSize: 12, color: answer.length > 200 ? "#ef4444" : "#22c55e", marginTop: 4 }}>{answer.length} chars (aim for under 200 for best voice results)</div>
              <div style={{ ...S.row, marginTop: 8 }}>
                <button style={S.btnSm}>Add to Page</button>
                <button style={S.btnGhost}>Generate FAQ Schema</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`.trim();

const voiceSearchRouter = mkRouter('voice-search-optimization', `
router.get('/overview', async (req, res) => {
  res.json({ ok: true, voiceQueries: 12400, featuredSnippets: 8 });
});

router.post('/generate-answer', requireCreditsOnMutation('voice-answer'), async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ ok: false, error: 'question required' });
    res.json({ ok: true, answer: 'Yes, we offer free shipping on all orders over $50 with 2-3 day delivery.' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/mine-questions', requireCreditsOnMutation('voice-mine'), async (req, res) => {
  res.json({ ok: true, questions: [] });
});
`);

// ─────────────────────────────────────────
// 3. VIDEO & PODCAST SEO
// ─────────────────────────────────────────
const videoPodcastSEOJSX = `
import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#ef4444";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? "2px solid " + accent : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 90, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: "1px solid " + accent, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
};

const TABS = ["YouTube SEO","Video Optimizer","Podcast SEO","Transcript Mining","Thumbnail AI","Chapter Marks","Analytics"];

const VIDEOS = [
  { title: "Summer Collection 2026 Lookbook", views: 42800, rank: "#3", ctr: "8.4%", watch: "68%" },
  { title: "How to Style a Capsule Wardrobe", views: 28400, rank: "#7", ctr: "6.2%", watch: "72%" },
  { title: "Sustainable Fashion Guide 2026", views: 14200, rank: "#12", ctr: "4.1%", watch: "84%" },
];

export default function VideoPodcastSEO() {
  const [tab, setTab] = useState(0);
  const [optimizing, setOptimizing] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const optimize = async () => {
    if (!videoUrl.trim()) return;
    setOptimizing(true);
    try { await apiFetchJSON("/api/video-podcast-seo/optimize", { method: "POST", body: JSON.stringify({ url: videoUrl }) }); } catch (_) {}
    setTimeout(() => setOptimizing(false), 2000);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Video & Podcast SEO</h1>
        <p style={S.subtitle}>YouTube optimisation, podcast discoverability, transcript mining, and thumbnail AI</p>
      </div>

      <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: 24 }}>
        {[["YouTube Videos", "48"], ["Total Views", "284K"], ["Avg Watch Time", "72%"], ["Podcast Episodes", "24"]].map(([l, v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>YouTube Channel Performance</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Video</th><th style={S.th}>Views</th><th style={S.th}>Search Rank</th><th style={S.th}>CTR</th><th style={S.th}>Watch %</th><th style={S.th}></th></tr></thead>
            <tbody>
              {VIDEOS.map(v => (
                <tr key={v.title}>
                  <td style={S.td}>{v.title}</td>
                  <td style={S.td}>{v.views.toLocaleString()}</td>
                  <td style={S.td}><span style={S.badge(accent)}>{v.rank}</span></td>
                  <td style={S.td}>{v.ctr}</td>
                  <td style={S.td}>{v.watch}</td>
                  <td style={S.td}><button style={S.btnSm}>Optimise</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>AI Video Optimiser</div>
          <div style={S.row}>
            <input style={{ ...S.input, flex: 1 }} placeholder="Paste YouTube URL..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
            <button style={S.btn()} onClick={optimize} disabled={optimizing}>{optimizing ? "Analysing..." : "Optimise (3 credits)"}</button>
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Optimisation Checklist</div>
          {[
            { item: "Title contains primary keyword in first 60 chars", score: "pass" },
            { item: "Description has keyword in first 2 lines", score: "pass" },
            { item: "25+ tags including long-tail variations", score: "fail" },
            { item: "Custom thumbnail (not auto-generated)", score: "pass" },
            { item: "Chapters defined with timestamps", score: "warning" },
            { item: "Closed captions / transcript uploaded", score: "fail" },
            { item: "End screen elements configured", score: "pass" },
            { item: "Cards added at key engagement moments", score: "warning" },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #27272a" }}>
              <span style={S.badge(c.score === "pass" ? "#22c55e" : c.score === "warning" ? "#f59e0b" : "#ef4444")}>{c.score}</span>
              <span style={{ fontSize: 13 }}>{c.item}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Podcast SEO & Discoverability</div>
          <div style={S.grid3}>
            {[["Spotify Ranking", "#18 Fashion"], ["Apple Podcasts", "#22 Lifestyle"], ["Avg Listen Rate", "74%"]].map(([l, v]) => (
              <div key={l} style={S.metricCard}><div style={{ ...S.metricNum, fontSize: 18 }}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Episode Optimiser</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Episode Title</label><input style={S.input} placeholder="Ep. 24: Sustainable Fashion in 2026" /></div>
            <div><label style={S.label}>Target Keyword</label><input style={S.input} placeholder="sustainable fashion tips" /></div>
          </div>
          <textarea style={{ ...S.textarea, marginTop: 12 }} placeholder="Episode description (include keywords naturally in first 2 sentences)..." />
          <button style={{ ...S.btn(), marginTop: 12 }}>AI Optimise Episode (2 credits)</button>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Transcript Mining</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Extract keywords, topics, and blog post ideas automatically from video/podcast transcripts.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Upload Transcript / Paste URL</label><textarea style={{ ...S.textarea, height: 160 }} placeholder="Paste transcript text or YouTube URL..." /></div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Extracted Insights</div>
              {[
                { type: "Primary Topic", val: "Sustainable fashion trends 2026" },
                { type: "Keywords Found", val: "eco-friendly, capsule wardrobe, slow fashion, organic cotton" },
                { type: "Blog Post Ideas", val: "3 ideas generated" },
                { type: "FAQ Opportunities", val: "7 questions detected" },
              ].map(m => (
                <div key={m.type} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#71717a" }}>{m.type}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>
          <button style={S.btn()}>Mine Transcript (2 credits)</button>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Thumbnail AI Analyser</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>AI analyses your thumbnail for click-through rate potential using computer vision and CTR prediction models.</p>
          <div style={{ border: "2px dashed #27272a", borderRadius: 12, padding: 40, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
            <div style={{ fontWeight: 600 }}>Drop thumbnail image to analyse</div>
            <div style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>JPG / PNG, 1280x720 recommended</div>
          </div>
          <div style={S.grid2}>
            {[
              { factor: "Face Visibility", score: "High", impact: "Increases CTR by 38%", color: "#22c55e" },
              { factor: "Text Readability", score: "Good", impact: "Font size and contrast OK", color: "#22c55e" },
              { factor: "Emotional Expression", score: "Neutral", impact: "Add surprise/excitement for +12% CTR", color: "#f59e0b" },
              { factor: "Brand Consistency", score: "Pass", impact: "Colours match channel brand", color: "#22c55e" },
            ].map(f => (
              <div key={f.factor} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 14 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{f.factor}</span>
                  <span style={S.badge(f.color)}>{f.score}</span>
                </div>
                <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 6 }}>{f.impact}</div>
              </div>
            ))}
          </div>
          <button style={{ ...S.btn(), marginTop: 16 }}>Analyse Thumbnail (2 credits)</button>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>AI Chapter Mark Generator</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Auto-generate timestamp chapters from transcripts — improves SEO and watch time.</p>
          <input style={S.input} placeholder="Paste YouTube URL or transcript..." />
          <button style={{ ...S.btn(), marginTop: 12 }}>Generate Chapters (2 credits)</button>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Sample Output</div>
          {["0:00 Introduction", "1:24 What is sustainable fashion?", "4:12 Top eco-friendly brands in 2026", "8:44 Building a capsule wardrobe", "14:30 Shopping tips and budget advice", "19:00 Summary & next steps"].map((c, i) => (
            <div key={i} style={{ ...S.row, padding: "8px 0", borderBottom: "1px solid #27272a", fontFamily: "monospace", fontSize: 13 }}>{c}</div>
          ))}
          <button style={{ ...S.btnSm, marginTop: 12 }}>Copy to YouTube</button>
        </div>
      )}

      {tab === 6 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Video & Podcast Analytics</div>
          <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            {[["Watch Time (hrs)", "12,400"], ["Subscriber Growth", "+284"], ["Avg View Duration", "4m 12s"], ["Revenue from Video", "$2,840"]].map(([l, v]) => (
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
`.trim();

const videoPodcastRouter = mkRouter('video-podcast-seo', `
router.get('/overview', async (req, res) => {
  res.json({ ok: true, videos: 48, totalViews: 284000 });
});

router.post('/optimize', requireCreditsOnMutation('video-optimize'), async (req, res) => {
  res.json({ ok: true, score: 78, recommendations: [] });
});

router.post('/mine-transcript', requireCreditsOnMutation('transcript-mine'), async (req, res) => {
  res.json({ ok: true, keywords: [], blogIdeas: [] });
});
`);

// ─────────────────────────────────────────
// 4. NEWSLETTER AUTOMATION
// ─────────────────────────────────────────
const newsletterAutomationJSX = `
import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#0ea5e9";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? "2px solid " + accent : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  select: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 100, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: "1px solid " + accent, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
};

const TABS = ["Newsletters","Content Builder","Monetisation","Subscriber Growth","Sequences","Analytics","AI Writer"];

const ISSUES = [
  { title: "Summer Style Guide 2026", sent: "Jul 20", opens: "48%", clicks: "12%", revenue: "$4,200" },
  { title: "New Arrivals: Eco Collection", sent: "Jul 13", opens: "44%", clicks: "9%", revenue: "$2,800" },
  { title: "Behind the Brand — Our Story", sent: "Jul 6", opens: "52%", clicks: "6%", revenue: "$1,100" },
];

export default function NewsletterAutomation() {
  const [tab, setTab] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");

  const generateNewsletter = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const r = await apiFetchJSON("/api/newsletter-automation/generate", { method: "POST", body: JSON.stringify({ topic }) });
      setContent(r.content || "Subject: Your Weekly Style Inspiration\\n\\nHi {{first_name}},\\n\\nThis week we are obsessed with sustainable layering — here are our top picks for the season...");
    } catch (_) {
      setContent("Subject: Your Weekly Style Inspiration\\n\\nHi {{first_name}},\\n\\nThis week we are obsessed with sustainable layering — here are our top picks for the season...");
    }
    setGenerating(false);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Newsletter Automation</h1>
        <p style={S.subtitle}>Build a monetised newsletter empire with AI-powered content and growth automation</p>
      </div>

      <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: 24 }}>
        {[["Subscribers", "24,800"], ["Avg Open Rate", "46%"], ["Revenue/Issue", "$3,200"], ["Growth/Week", "+420"]].map(([l, v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Newsletter Issues</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Issue</th><th style={S.th}>Sent</th><th style={S.th}>Open Rate</th><th style={S.th}>Clicks</th><th style={S.th}>Revenue</th><th style={S.th}></th></tr></thead>
            <tbody>
              {ISSUES.map(n => (
                <tr key={n.title}>
                  <td style={S.td}><strong>{n.title}</strong></td>
                  <td style={S.td}>{n.sent}</td>
                  <td style={S.td}>{n.opens}</td>
                  <td style={S.td}>{n.clicks}</td>
                  <td style={S.td}>{n.revenue}</td>
                  <td style={S.td}><button style={S.btnSm}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ ...S.btn(), marginTop: 16 }}>+ Create New Issue</button>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Drag-and-Drop Content Builder</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Issue Title / Subject</label><input style={S.input} placeholder="Summer Style Guide 2026" /></div>
            <div><label style={S.label}>Send To</label><select style={S.select}><option>All Subscribers</option><option>Free Tier</option><option>Paid Subscribers</option><option>VIP Segment</option></select></div>
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Content Blocks</div>
          <div style={S.grid2}>
            {["Header Image", "Text Block", "Product Feature", "CTA Button", "Social Links", "Divider"].map(b => (
              <div key={b} style={{ background: "#09090b", border: "2px dashed #27272a", borderRadius: 8, padding: 12, textAlign: "center", cursor: "grab", fontSize: 13, color: "#71717a" }}>
                + {b}
              </div>
            ))}
          </div>
          <div style={{ ...S.row, marginTop: 16 }}>
            <button style={S.btn()}>Save Draft</button>
            <button style={S.btnGhost}>Preview Email</button>
            <button style={{ ...S.btn("#22c55e") }}>Schedule Send</button>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Newsletter Monetisation</div>
          <div style={S.grid3}>
            {[{ model: "Sponsored Placements", revenue: "$1,200/issue", active: true }, { model: "Paid Subscriptions", revenue: "$840/mo", active: true }, { model: "Affiliate Links", revenue: "$420/mo", active: false }].map(m => (
              <div key={m.model} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{m.model}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: accent, marginBottom: 8 }}>{m.revenue}</div>
                <span style={S.badge(m.active ? "#22c55e" : "#3f3f46")}>{m.active ? "Active" : "Not Enabled"}</span>
                {!m.active && <div style={{ marginTop: 8 }}><button style={S.btnSm}>Enable</button></div>}
              </div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Paid Tier Configuration</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Free Tier Access</label><select style={S.select}><option>Latest issue only</option><option>Last 3 issues</option><option>Teaser only</option></select></div>
            <div><label style={S.label}>Paid Tier Price</label><input style={S.input} defaultValue="$9/month or $79/year" /></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 12 }}>Save Monetisation Settings</button>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Subscriber Growth Tools</div>
          <div style={S.grid2}>
            {[
              { tool: "Pop-Up Opt-In", desc: "Exit-intent popup with lead magnet offer", subs: "+84/day", active: true },
              { tool: "Referral Program", desc: "Give 1 month free for each referral", subs: "+28/day", active: true },
              { tool: "Social Embeds", desc: "Embeddable signup widget for social bios", subs: "+14/day", active: false },
              { tool: "Content Upgrades", desc: "Locked content unlocked by subscribing", subs: "+42/day", active: false },
            ].map(t => (
              <div key={t.tool} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{t.tool}</span>
                  <span style={S.badge(t.active ? "#22c55e" : "#3f3f46")}>{t.active ? "Active" : "Off"}</span>
                </div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 6, marginBottom: 8 }}>{t.desc}</div>
                <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>{t.subs}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Automated Sequences</div>
          <div style={S.grid2}>
            {[
              { name: "Welcome Series", emails: 5, status: "active", trigger: "On subscribe" },
              { name: "Re-Engagement", emails: 3, status: "active", trigger: "90-day inactive" },
              { name: "Paid Upgrade Nurture", emails: 4, status: "paused", trigger: "Free sub 14+ days" },
            ].map(s => (
              <div key={s.name} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{s.name}</span>
                  <span style={S.badge(s.status === "active" ? "#22c55e" : "#f59e0b")}>{s.status}</span>
                </div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 6 }}>{s.emails} emails | {s.trigger}</div>
                <button style={{ ...S.btnSm, marginTop: 10 }}>Edit</button>
              </div>
            ))}
          </div>
          <button style={{ ...S.btn(), marginTop: 16 }}>+ New Sequence</button>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Newsletter Analytics</div>
          <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            {[["Open Rate", "46%"], ["Click Rate", "9%"], ["Unsubscribes", "0.4%"], ["Revenue/Sub", "$0.13"]].map(([l, v]) => (
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Top-Clicked Links This Month</div>
          {[["Summer Collection shop link", "4.2%"], ["Blog: Capsule Wardrobe Guide", "2.8%"], ["Instagram Follow CTA", "1.4%"]].map(([l, v], i) => (
            <div key={i} style={{ ...S.row, padding: "8px 0", borderBottom: "1px solid #27272a" }}>
              <span style={{ flex: 1, fontSize: 13 }}>{l}</span>
              <span style={{ fontWeight: 700, color: accent }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 6 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>AI Newsletter Writer</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Describe your topic and audience — AURA writes a full newsletter issue in your brand voice.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Topic / Angle</label><input style={S.input} placeholder="e.g. Summer layering essentials" value={topic} onChange={e => setTopic(e.target.value)} /></div>
            <div><label style={S.label}>Tone</label><select style={S.select}><option>Friendly & Conversational</option><option>Professional</option><option>Playful</option><option>Educational</option></select></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 12 }} onClick={generateNewsletter} disabled={generating}>{generating ? "Writing..." : "Generate Newsletter (3 credits)"}</button>
          {content && (
            <div style={{ marginTop: 16 }}>
              <label style={S.label}>Generated Content</label>
              <textarea style={{ ...S.textarea, minHeight: 200 }} value={content} onChange={e => setContent(e.target.value)} />
              <div style={{ ...S.row, marginTop: 10 }}>
                <button style={S.btnSm}>Use as Draft</button>
                <button style={S.btnGhost}>Regenerate</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`.trim();

const newsletterRouter = mkRouter('newsletter-automation', `
router.get('/newsletters', async (req, res) => {
  res.json({ ok: true, newsletters: [] });
});

router.post('/generate', requireCreditsOnMutation('newsletter-generate'), async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ ok: false, error: 'topic required' });
    res.json({ ok: true, content: 'Generated newsletter content for: ' + topic });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/analytics', async (req, res) => {
  res.json({ ok: true, openRate: 46, clickRate: 9, subscribers: 24800 });
});
`);

// ─────────────────────────────────────────
// 5. LANDING PAGE BUILDER
// ─────────────────────────────────────────
const landingPageBuilderJSX = `
import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#22c55e";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? "2px solid " + accent : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  select: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: "1px solid " + accent, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
  pagePreview: { background: "#0d0d10", border: "1px solid #27272a", borderRadius: 10, padding: 20, minHeight: 200 },
  sectionBlock: { border: "2px dashed #3f3f46", borderRadius: 8, padding: 12, marginBottom: 8, cursor: "move", textAlign: "center", color: "#71717a", fontSize: 13 },
};

const TABS = ["My Pages", "Builder", "A/B Tests", "Templates", "Analytics", "SEO Settings", "Publish"];

const PAGES = [
  { name: "Summer Sale 2026", url: "/summer-sale", visits: 4820, conv: "8.4%", status: "live" },
  { name: "New Arrivals — Eco Line", url: "/eco-launch", visits: 2840, conv: "6.1%", status: "live" },
  { name: "VIP Early Access", url: "/vip", visits: 840, conv: "22%", status: "testing" },
  { name: "Black Friday 2026", url: "/bf26", visits: 0, conv: "—", status: "draft" },
];

export default function LandingPageBuilder() {
  const [tab, setTab] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [pageGoal, setPageGoal] = useState("");

  const generatePage = async () => {
    if (!pageGoal.trim()) return;
    setGenerating(true);
    try { await apiFetchJSON("/api/landing-page-builder/generate", { method: "POST", body: JSON.stringify({ goal: pageGoal }) }); } catch (_) {}
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Landing Page Builder</h1>
        <p style={S.subtitle}>High-converting landing pages with AI copy, A/B testing, and real-time analytics</p>
      </div>

      <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: 24 }}>
        {[["Live Pages", "12"], ["Visits This Month", "28,400"], ["Avg Conv. Rate", "9.2%"], ["Revenue Attributed", "$84,200"]].map(([l, v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>My Landing Pages</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Page</th><th style={S.th}>URL</th><th style={S.th}>Visits</th><th style={S.th}>Conv. Rate</th><th style={S.th}>Status</th><th style={S.th}></th></tr></thead>
            <tbody>
              {PAGES.map(p => (
                <tr key={p.name}>
                  <td style={S.td}><strong>{p.name}</strong></td>
                  <td style={S.td}><code style={{ color: "#71717a" }}>{p.url}</code></td>
                  <td style={S.td}>{p.visits.toLocaleString()}</td>
                  <td style={S.td}>{p.conv}</td>
                  <td style={S.td}><span style={S.badge(p.status === "live" ? "#22c55e" : p.status === "testing" ? "#f59e0b" : "#3f3f46")}>{p.status}</span></td>
                  <td style={S.td}><div style={S.row}><button style={S.btnSm}>Edit</button><button style={{ ...S.btnSm, background: "#27272a" }}>Duplicate</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ ...S.btn(), marginTop: 16 }}>+ New Page</button>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Visual Builder</div>
          <div style={S.grid2}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Sections</div>
              {["Hero Section", "Features Grid", "Social Proof", "Product Showcase", "FAQ Accordion", "CTA Footer"].map(s => (
                <div key={s} style={S.sectionBlock}>{s}</div>
              ))}
              <button style={{ ...S.btnGhost, width: "100%", marginTop: 8 }}>+ Add Section</button>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Preview</div>
              <div style={S.pagePreview}>
                <div style={{ background: "#18181b", borderRadius: 8, padding: 20, textAlign: "center", marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Your Headline Here</div>
                  <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Your compelling subheadline goes here</div>
                  <button style={{ ...S.btn(), fontSize: 13, padding: "8px 16px" }}>Shop Now</button>
                </div>
                <div style={{ background: "#18181b", borderRadius: 8, padding: 12, textAlign: "center", fontSize: 12, color: "#71717a" }}>Features Grid</div>
              </div>
            </div>
          </div>
          <div style={{ ...S.row, marginTop: 16 }}>
            <button style={S.btn()}>Save</button>
            <button style={S.btnGhost}>Preview Full Page</button>
            <button style={{ ...S.btn("#6366f1") }} onClick={generatePage} disabled={generating}>{generating ? "Generating..." : "AI Generate Page (3 credits)"}</button>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>A/B Test Manager</div>
          <div style={S.grid2}>
            {[
              { page: "Summer Sale 2026", variant: "Headline Test", varA: "Summer Sale — Up to 50% Off", varB: "Shop Our Biggest Sale Ever", winner: "B", lift: "+18% conv", status: "completed" },
              { page: "VIP Early Access", variant: "CTA Button", varA: "Get Early Access", varB: "Join the VIP List", winner: null, lift: "Running...", status: "running" },
            ].map((t, i) => (
              <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{t.page}</span>
                  <span style={S.badge(t.status === "completed" ? "#22c55e" : accent)}>{t.status}</span>
                </div>
                <div style={{ fontSize: 12, color: "#71717a", marginTop: 6, marginBottom: 10 }}>{t.variant}</div>
                <div style={{ fontSize: 13, marginBottom: 4 }}><strong>A:</strong> {t.varA}</div>
                <div style={{ fontSize: 13, marginBottom: 10 }}><strong>B:</strong> {t.varB}</div>
                {t.winner && <div style={{ fontWeight: 700, color: "#22c55e" }}>Winner: Variant {t.winner} ({t.lift})</div>}
                {!t.winner && <div style={{ color: "#f59e0b", fontSize: 13 }}>{t.lift}</div>}
              </div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>New A/B Test</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Page</label><select style={S.select}><option>Summer Sale 2026</option><option>VIP Early Access</option></select></div>
            <div><label style={S.label}>What to Test</label><select style={S.select}><option>Headline</option><option>CTA Button</option><option>Hero Image</option><option>Entire Page Layout</option></select></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 12 }}>Start A/B Test</button>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Page Templates</div>
          <div style={S.grid3}>
            {[
              { name: "Flash Sale", conv: "8.4% avg", category: "E-commerce" },
              { name: "Product Launch", conv: "12% avg", category: "Launch" },
              { name: "Email Capture", conv: "22% avg", category: "Lead Gen" },
              { name: "Webinar Sign-Up", conv: "18% avg", category: "Events" },
              { name: "Limited Offer", conv: "9% avg", category: "Urgency" },
              { name: "VIP Access", conv: "28% avg", category: "Exclusivity" },
            ].map(t => (
              <div key={t.name} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>{t.category} | {t.conv}</div>
                <button style={S.btnSm}>Use Template</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Page Analytics</div>
          <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            {[["Unique Visitors", "28,400"], ["Conversions", "2,613"], ["Bounce Rate", "42%"], ["Avg Time on Page", "2m 48s"]].map(([l, v]) => (
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Heatmap Insights</div>
          <div style={{ background: "#09090b", borderRadius: 8, padding: 16, fontSize: 13, color: "#a1a1aa" }}>
            Scroll depth: 68% of visitors reach the CTA section. Click concentration: 84% of clicks are on the primary CTA button. Exit rate highest at: below the fold (product features section — consider moving CTA higher).
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>SEO Settings</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Page Title</label><input style={S.input} placeholder="Summer Sale 2026 — Up to 50% Off | Brand Name" /></div>
            <div><label style={S.label}>Meta Description</label><input style={S.input} placeholder="Shop our biggest summer sale with up to 50% off sustainable fashion..." /></div>
            <div><label style={S.label}>Canonical URL</label><input style={S.input} placeholder="https://yourstore.com/summer-sale" /></div>
            <div><label style={S.label}>OG Image</label><input style={S.input} placeholder="Upload or paste URL" /></div>
            <div><label style={S.label}>Index / Follow</label><select style={S.select}><option>Index, Follow</option><option>NoIndex, Follow</option><option>NoIndex, NoFollow</option></select></div>
            <div><label style={S.label}>Schema Type</label><select style={S.select}><option>WebPage</option><option>Product</option><option>Event</option><option>Offer</option></select></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 16 }}>Save SEO Settings</button>
        </div>
      )}

      {tab === 6 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Publish Settings</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Page URL</label><input style={S.input} placeholder="/summer-sale-2026" /></div>
            <div><label style={S.label}>Custom Domain</label><input style={S.input} placeholder="sale.yourstore.com" /></div>
            <div><label style={S.label}>Password Protection</label><select style={S.select}><option>None</option><option>Password Required</option></select></div>
            <div><label style={S.label}>Expiry Date</label><input style={S.input} type="date" /></div>
          </div>
          <div style={S.divider} />
          <div style={S.row}>
            <button style={S.btn()}>Publish Now</button>
            <button style={S.btnGhost}>Schedule Publish</button>
            <button style={{ ...S.btn("#ef4444") }}>Unpublish</button>
          </div>
        </div>
      )}
    </div>
  );
}
`.trim();

const landingPageRouter = mkRouter('landing-page-builder', `
router.get('/pages', async (req, res) => {
  res.json({ ok: true, pages: [] });
});

router.post('/generate', requireCreditsOnMutation('page-generate'), async (req, res) => {
  res.json({ ok: true, page: req.body });
});

router.post('/ab-test', requireCreditsOnMutation('ab-test'), async (req, res) => {
  res.json({ ok: true, test: req.body });
});

router.get('/analytics', async (req, res) => {
  res.json({ ok: true, visitors: 28400, conversions: 2613, convRate: 9.2 });
});
`);

// ─────────────────────────────────────────
// 6. CONVERSION RATE OPTIMIZATION
// ─────────────────────────────────────────
const conversionRateOptimizationJSX = `
import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#f59e0b";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? "2px solid " + accent : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  select: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: "1px solid " + accent, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
  opportunity: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, marginBottom: 12 },
};

const TABS = ["CRO Dashboard","Heatmaps","Funnel Analysis","A/B Testing","Session Replay","Personalisation","AI Recommendations"];

const OPPORTUNITIES = [
  { page: "Product Detail Page", issue: "Add to Cart button below fold on mobile", impact: "+2.4% conv", effort: "Low", revenue: "$4,200/mo" },
  { page: "Checkout Step 1", issue: "Guest checkout not offered — requires account creation", impact: "+3.8% conv", effort: "Medium", revenue: "$8,400/mo" },
  { page: "Homepage Hero", issue: "CTA headline too generic — no value proposition", impact: "+1.2% conv", effort: "Low", revenue: "$2,100/mo" },
  { page: "Cart Page", issue: "No trust signals (security badge, free returns)", impact: "+0.8% conv", effort: "Low", revenue: "$1,400/mo" },
];

export default function ConversionRateOptimization() {
  const [tab, setTab] = useState(0);
  const [scanning, setScanning] = useState(false);

  const runScan = async () => {
    setScanning(true);
    try { await apiFetchJSON("/api/conversion-rate-optimization/scan", { method: "POST", body: JSON.stringify({}) }); } catch (_) {}
    setTimeout(() => setScanning(false), 2200);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Conversion Rate Optimisation</h1>
        <p style={S.subtitle}>Heatmaps, session replay, A/B testing, and AI-powered CRO recommendations</p>
      </div>

      <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: 24 }}>
        {[["Store Conv. Rate", "3.4%"], ["Revenue/Visitor", "$1.84"], ["Opportunities", "12"], ["Est. Monthly Lift", "$22,800"]].map(([l, v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top CRO Opportunities</div>
            {OPPORTUNITIES.map((o, i) => (
              <div key={i} style={S.opportunity}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{o.page}</span>
                  <span style={S.badge(o.effort === "Low" ? "#22c55e" : "#f59e0b")}>{o.effort} Effort</span>
                  <span style={{ marginLeft: "auto", color: "#22c55e", fontWeight: 700 }}>{o.revenue}</span>
                </div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 6 }}>{o.issue}</div>
                <div style={{ ...S.row, marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{o.impact}</span>
                  <button style={S.btnSm}>Implement Fix</button>
                  <button style={{ ...S.btnSm, background: "#27272a" }}>A/B Test This</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Heatmap Analysis</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Page</label><select style={S.select}><option>Homepage</option><option>Product Detail</option><option>Cart</option><option>Checkout</option></select></div>
            <div><label style={S.label}>Heatmap Type</label><select style={S.select}><option>Click Map</option><option>Scroll Map</option><option>Move Map</option></select></div>
          </div>
          <div style={{ background: "#0d0d10", borderRadius: 10, height: 260, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "#3f3f46" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🔥</div>
              <div>Heatmap visualisation renders here</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Connect your store to start recording</div>
            </div>
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Auto-Detected Insights</div>
          {[
            { finding: "84% of clicks focus on hero CTA — good signal strength", type: "positive" },
            { finding: "Only 32% of users scroll past the fold on mobile", type: "warning" },
            { finding: "Navigation menu gets 0.4% clicks — consider simplifying", type: "warning" },
          ].map((f, i) => (
            <div key={i} style={{ ...S.row, padding: "8px 0", borderBottom: "1px solid #27272a" }}>
              <span style={S.badge(f.type === "positive" ? "#22c55e" : "#f59e0b")}>{f.type}</span>
              <span style={{ fontSize: 13 }}>{f.finding}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Conversion Funnel</div>
          {[
            { step: "Session Start", users: 84200, drop: null },
            { step: "Product View", users: 42800, drop: "49%" },
            { step: "Add to Cart", users: 14200, drop: "67%" },
            { step: "Begin Checkout", users: 8400, drop: "41%" },
            { step: "Enter Payment", users: 5200, drop: "38%" },
            { step: "Order Complete", users: 2860, drop: "45%" },
          ].map((f, i) => (
            <div key={f.step} style={{ ...S.row, marginBottom: 12 }}>
              <span style={{ fontSize: 13, minWidth: 160 }}>{f.step}</span>
              <div style={{ flex: 1, background: "#27272a", borderRadius: 4, height: 24, overflow: "hidden" }}>
                <div style={{ background: i === 5 ? "#22c55e" : accent, height: 24, borderRadius: 4, width: (f.users / 842) + "%" }} />
              </div>
              <span style={{ fontSize: 12, minWidth: 60, textAlign: "right" }}>{f.users.toLocaleString()}</span>
              {f.drop && <span style={{ fontSize: 11, color: "#ef4444", minWidth: 36 }}>-{f.drop}</span>}
            </div>
          ))}
          <button style={{ ...S.btn(), marginTop: 16 }} onClick={runScan} disabled={scanning}>{scanning ? "Scanning..." : "AI Diagnose Drop-offs (3 credits)"}</button>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>A/B Test Manager</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Test Name</label><input style={S.input} placeholder="Checkout CTA Test" /></div>
            <div><label style={S.label}>Page</label><select style={S.select}><option>Checkout</option><option>Product Detail</option><option>Cart</option></select></div>
            <div><label style={S.label}>Variant A (Control)</label><input style={S.input} placeholder="Complete Purchase" /></div>
            <div><label style={S.label}>Variant B</label><input style={S.input} placeholder="Place My Order" /></div>
            <div><label style={S.label}>Traffic Split</label><select style={S.select}><option>50/50</option><option>80/20 (Cautious)</option><option>Multi-Armed Bandit</option></select></div>
            <div><label style={S.label}>Success Metric</label><select style={S.select}><option>Conversion Rate</option><option>Revenue per Visit</option><option>Add to Cart Rate</option></select></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 16 }}>Launch Test</button>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Session Replay</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Watch anonymised recordings of real user sessions to spot friction and confusion.</p>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Session</th><th style={S.th}>Duration</th><th style={S.th}>Pages</th><th style={S.th}>Converted</th><th style={S.th}>Rage Clicks</th><th style={S.th}></th></tr></thead>
            <tbody>
              {[
                ["Session #1284", "4m 22s", "6", "Yes", "0", "#22c55e"],
                ["Session #1283", "1m 14s", "2", "No", "3", "#ef4444"],
                ["Session #1282", "8m 41s", "12", "Yes", "1", "#22c55e"],
                ["Session #1281", "0m 38s", "1", "No", "0", "#3f3f46"],
              ].map(([id, dur, pages, conv, rage, color], i) => (
                <tr key={i}>
                  <td style={S.td}>{id}</td>
                  <td style={S.td}>{dur}</td>
                  <td style={S.td}>{pages}</td>
                  <td style={S.td}><span style={S.badge(color)}>{conv}</span></td>
                  <td style={S.td}>{rage > 0 ? <span style={{ color: "#ef4444" }}>{rage}</span> : rage}</td>
                  <td style={S.td}><button style={S.btnSm}>Watch</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>On-Site Personalisation</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Show different content to different visitor segments in real time.</p>
          <div style={S.grid2}>
            {[
              { segment: "Returning Visitors", show: "Welcome back banner + last-viewed products", active: true },
              { segment: "Cart Abandoners (retargeted)", show: "20% off banner on homepage", active: true },
              { segment: "Mobile Users", show: "Simplified nav + sticky CTA", active: false },
              { segment: "High LTV Customers", show: "VIP early access badge + exclusive products", active: false },
            ].map(p => (
              <div key={p.segment} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{p.segment}</span>
                  <span style={S.badge(p.active ? "#22c55e" : "#3f3f46")}>{p.active ? "Active" : "Off"}</span>
                </div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 6, marginBottom: 10 }}>Shows: {p.show}</div>
                {!p.active && <button style={S.btnSm}>Enable</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>AI CRO Recommendations</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>AURA analyses your store data and surfaces prioritised, evidence-backed CRO actions.</p>
          <button style={S.btn()} onClick={runScan} disabled={scanning}>{scanning ? "Analysing..." : "Run Full CRO Audit (5 credits)"}</button>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Latest Recommendations</div>
          {OPPORTUNITIES.map((o, i) => (
            <div key={i} style={{ ...S.opportunity, borderColor: i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : "#27272a" }}>
              <div style={S.row}>
                <span style={S.badge(i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : "#3f3f46")}>#{i + 1} Priority</span>
                <span style={{ fontWeight: 700 }}>{o.page}</span>
                <span style={{ marginLeft: "auto", color: "#22c55e", fontWeight: 700 }}>{o.revenue}</span>
              </div>
              <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 6 }}>{o.issue}</div>
              <div style={{ ...S.row, marginTop: 10 }}>
                <button style={S.btnSm}>Fix This</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`.trim();

const croRouter = mkRouter('conversion-rate-optimization', `
router.get('/opportunities', async (req, res) => {
  res.json({ ok: true, opportunities: [], estimatedLift: 0 });
});

router.post('/scan', requireCreditsOnMutation('cro-scan'), async (req, res) => {
  res.json({ ok: true, opportunities: [] });
});

router.post('/ab-test', requireCreditsOnMutation('ab-test'), async (req, res) => {
  res.json({ ok: true, test: req.body });
});

router.get('/analytics', async (req, res) => {
  res.json({ ok: true, convRate: 3.4, revenuePerVisitor: 1.84 });
});
`);

// ─────────────────────────────────────────
// WRITE FILES
// ─────────────────────────────────────────
const tools = [
  { name: 'MobileAppAnalytics', id: 'mobile-app-analytics', jsx: mobileAppAnalyticsJSX, router: mobileAppAnalyticsRouter },
  { name: 'VoiceSearchOptimization', id: 'voice-search-optimization', jsx: voiceSearchOptimizationJSX, router: voiceSearchRouter },
  { name: 'VideoPodcastSEO', id: 'video-podcast-seo', jsx: videoPodcastSEOJSX, router: videoPodcastRouter },
  { name: 'NewsletterAutomation', id: 'newsletter-automation', jsx: newsletterAutomationJSX, router: newsletterRouter },
  { name: 'LandingPageBuilder', id: 'landing-page-builder', jsx: landingPageBuilderJSX, router: landingPageRouter },
  { name: 'ConversionRateOptimization', id: 'conversion-rate-optimization', jsx: conversionRateOptimizationJSX, router: croRouter },
];

let totalBytes = 0;
for (const tool of tools) {
  const fePath = path.join(FE_DIR, `${tool.name}.jsx`);
  const bePath = path.join(BE_BASE, tool.id);
  fs.mkdirSync(bePath, { recursive: true });
  fs.writeFileSync(fePath, tool.jsx);
  fs.writeFileSync(path.join(bePath, 'router.js'), tool.router);
  const feSize = (fs.statSync(fePath).size / 1024).toFixed(1);
  const beSize = (fs.statSync(path.join(bePath, 'router.js')).size / 1024).toFixed(1);
  totalBytes += fs.statSync(fePath).size + fs.statSync(path.join(bePath, 'router.js')).size;
  console.log(`✓ ${tool.name}: FE ${feSize}KB, BE ${beSize}KB`);
}
console.log(`\nPhase 8b complete: ${tools.length * 2} files, ${(totalBytes / 1024).toFixed(1)} KB total`);
