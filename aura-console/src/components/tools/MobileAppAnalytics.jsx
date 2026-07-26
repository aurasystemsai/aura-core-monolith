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