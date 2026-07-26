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