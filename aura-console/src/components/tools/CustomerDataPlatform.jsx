import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", marginBottom: 10 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "8px 14px", fontSize: 12, cursor: "pointer", marginRight: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 10px", border: "1px solid #27272a", borderRadius: 8, marginBottom: 6, fontSize: 13 },
  pill: { background: "#27272a", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "#d4d4d8", display: "inline-block", margin: "0 6px 6px 0" },
  ta: { background: '#09090b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fafafa', padding: '9px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box', marginBottom: 10, minHeight: 140, fontFamily: 'inherit' },
  ok: { background: '#052e16', border: '1px solid #166534', color: '#86efac', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 },
  warn: { background: '#1c1407', border: '1px solid #854d0e', color: '#fcd34d', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 },
  muted: { color: "#71717a", fontSize: 12 },
};

async function call(setBusy, setError, name, url, options) {
  setBusy(name); setError("");
  try {
    const r = await apiFetchJSON(url, options);
    if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
    return r;
  } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
}
const API = "/api/customer-data-platform";
const RISK = { high: "#fca5a5", medium: "#fcd34d", low: "#86efac" };
const money = (n, c) => (n == null ? "–" : `${c ? c + " " : ""}${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);

export default function CustomerDataPlatform() {
  const [ov, setOv] = useState(null);
  const [seg, setSeg] = useState("");
  const [list, setList] = useState(null);
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);

  useEffect(() => { run("load", "/overview").then((r) => r && setOv(r)); }, []); // eslint-disable-line

  async function open(name) {
    setSeg(name); setPlan(null); setList(null);
    const r = await run("list", "/customers?segment=" + encodeURIComponent(name));
    if (r) setList(r);
  }
  async function playbook() {
    const r = await run("plan", "/playbook", { method: "POST", body: JSON.stringify({ segment: seg }) });
    if (r) setPlan(r);
  }

  const t = ov && ov.totals;
  const cur = t && t.currency;
  return (
    <div style={S.root}>
      <h1 style={S.title}>Customer Intelligence</h1>
      <p style={S.subtitle}>Segments, lifetime value, churn risk and journey stages worked out from your real customers and orders. Calculated from order history, not guessed.</p>
      {error && <div style={S.error}>{error}</div>}
      {busy === "load" && !ov && <div style={S.empty}>Loading your customers…</div>}
      {ov && ov.truncated && <div style={S.warn}>Showing your first 1,000 customers.</div>}
      {ov && t.customers === 0 && <div style={S.empty}>No customers yet. They appear here after your first sign-up or order.</div>}

      {ov && t.customers > 0 && (
        <>
          <div style={S.card}>
            <span style={S.pill}>{t.customers} customers</span>
            <span style={S.pill}>{t.buyers} have bought</span>
            <span style={S.pill}>Revenue {money(t.revenue, cur)}</span>
            <span style={S.pill}>Avg lifetime value {money(t.avgLifetimeValue, cur)}</span>
            <span style={S.pill}>Repeat rate {t.repeatRate == null ? "–" : t.repeatRate + "%"}</span>
            <span style={S.pill}>Top 10% bring {t.top10PercentShare == null ? "–" : t.top10PercentShare + "%"} of revenue</span>
            <span style={{ ...S.pill, color: "#fca5a5" }}>{t.highChurnRisk} at high churn risk</span>
          </div>

          <div style={S.card}>
            <h2 style={S.h}>Journey</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {ov.stages.map((s) => (
                <div key={s.name} style={{ ...S.row, flexDirection: "column", minWidth: 150 }}>
                  <span style={S.muted}>{s.name}</span>
                  <strong style={{ fontSize: 20 }}>{s.customers}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <h2 style={S.h}>Segments</h2>
            <p style={S.muted}>Based on how recently, how often and how much each customer buys. Click one to see who is in it.</p>
            {ov.segments.map((s) => (
              <div key={s.name} style={{ ...S.row, cursor: "pointer", borderColor: seg === s.name ? "#6366f1" : "#27272a" }} onClick={() => open(s.name)}>
                <strong>{s.name}</strong>
                <span style={S.muted}>{s.customers} customers · avg spend {money(s.avgSpend, cur)} · total {money(s.revenue, cur)}</span>
              </div>
            ))}
          </div>

          {seg && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={S.h}>{seg}</h2>
                <div>
                  <a style={{ ...S.ghost, textDecoration: "none", display: "inline-block" }} href={`${API}/export?segment=${encodeURIComponent(seg)}`} target="_blank" rel="noreferrer">Download CSV</a>
                  <button style={{ ...S.btn, ...(busy || !ov.ai || seg === "No purchase yet" ? S.off : {}) }} disabled={!!busy || !ov.ai || seg === "No purchase yet"} onClick={playbook}>{busy === "plan" ? "Writing…" : "AI playbook (2 credits)"}</button>
                </div>
              </div>
              {plan && (
                <div style={{ ...S.row, flexDirection: "column", marginBottom: 12 }}>
                  <strong>{plan.playbook.goal}</strong>
                  {plan.playbook.steps.map((s, i) => <div key={i} style={{ marginTop: 6 }}><span style={S.pill}>{s.when} · {s.channel}</span> {s.message}</div>)}
                  {plan.playbook.avoid.length > 0 && <div style={{ ...S.muted, marginTop: 6 }}>Avoid: {plan.playbook.avoid.join("; ")}</div>}
                </div>
              )}
              {busy === "list" && <div style={S.empty}>Loading…</div>}
              {list && list.customers.length === 0 && <div style={S.empty}>No customers in this segment.</div>}
              {list && list.customers.map((c) => (
                <div key={c.id} style={S.row}>
                  <span>{c.name} <span style={S.muted}>{c.email || ""}</span></span>
                  <span style={S.muted}>
                    {c.orders} orders · {money(c.spent, cur)} · {c.daysSinceLastOrder == null ? "no orders" : c.daysSinceLastOrder + "d ago"}
                    {c.churnRisk && <span style={{ color: RISK[c.churnRisk] }}> · {c.churnRisk} churn risk</span>}
                  </span>
                </div>
              ))}
              {list && list.total > list.customers.length && <div style={S.muted}>Showing the top {list.customers.length} of {list.total} by spend. The CSV has everyone.</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}