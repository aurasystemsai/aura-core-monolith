import React, { useEffect, useState } from "react";
import { apiFetch, apiFetchJSON } from "../../api";

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
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  warn: { background: "#1c1407", border: "1px solid #854d0e", color: "#fcd34d", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 10px", border: "1px solid #27272a", borderRadius: 8, marginBottom: 6, fontSize: 13 },
  tile: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 14px", flex: "1 1 150px" },
  big: { fontSize: 22, fontWeight: 800 },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/auto-insights";

async function call(setBusy, setError, name, url, options) {
  setBusy(name); setError("");
  try {
    const r = await apiFetchJSON(url, options);
    if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
    return r;
  } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
}
const pct = (v) => (v === null ? "no earlier period" : (v >= 0 ? "+" : "") + v + "%");

export default function ReportsInsights() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [insight, setInsight] = useState("");
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);
  const send = (body) => ({ method: "POST", body: JSON.stringify(body) });

  useEffect(() => { setData(null); setInsight(""); setMsg(""); run("load", "/summary?days=" + days).then((r) => r && setData(r)); }, [days]); // eslint-disable-line

  async function getInsight() { setInsight(""); const r = await run("ai", "/insights", send({ days })); if (r) setInsight(r.insight); }
  async function email() { setMsg(""); const r = await run("mail", "/email", send({ to, days })); if (r) setMsg(r.message); }
  async function download(type) {
    setError("");
    try {
      const r = await apiFetch(`${API}/export?type=${type}&days=${days}`);
      if (!r.ok) { let m = "Download failed."; try { m = (await r.json()).error || m; } catch {} throw new Error(m); }
      const text = await r.text();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
      a.download = `${type}-last-${days}-days.csv`; a.click(); URL.revokeObjectURL(a.href);
    } catch (e) { setError(e.message); }
  }
  const money = (n) => (data ? data.currency + " " + n.toLocaleString() : n);
  const max = data && data.daily ? Math.max(1, ...data.daily.map((d) => d.revenue)) : 1;

  return (
    <div style={S.root}>
      <h1 style={S.title}>Reports & Insights</h1>
      <p style={S.subtitle}>Your sales from real Shopify orders, compared with the period before. Download the data, email yourself a copy, or get a plain-English read of the numbers.</p>
      {error && <div style={S.error}>{error}</div>}
      <div style={{ marginBottom: 14 }}>
        {[7, 30, 90].map((d) => <button key={d} style={{ ...S.ghost, ...(d === days ? { color: "#fafafa", borderColor: "#4f46e5" } : {}), ...(busy === "load" ? S.off : {}) }} disabled={busy === "load"} onClick={() => setDays(d)}>Last {d} days</button>)}
      </div>
      {!data && busy === "load" && <div style={S.empty}>Loading...</div>}
      {data && data.unavailable && <div style={S.warn}>{data.note}</div>}
      {data && data.note && !data.unavailable && <div style={S.warn}>{data.note}</div>}
      {data && !data.unavailable && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={S.tile}><div style={S.muted}>Revenue</div><div style={S.big}>{money(data.revenue)}</div><div style={S.muted}>{pct(data.change.revenue)}</div></div>
            <div style={S.tile}><div style={S.muted}>Orders</div><div style={S.big}>{data.orders}</div><div style={S.muted}>{pct(data.change.orders)}</div></div>
            <div style={S.tile}><div style={S.muted}>Average order</div><div style={S.big}>{money(data.aov)}</div></div>
            <div style={S.tile}><div style={S.muted}>Units sold</div><div style={S.big}>{data.units}</div></div>
          </div>
          {!data.orders ? <div style={S.card}><div style={S.empty}>No orders in the last {days} days.</div></div> : (
            <>
              <div style={S.card}>
                <h2 style={S.h}>Revenue per day</h2>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80 }}>
                  {data.daily.map((d) => <div key={d.date} title={`${d.date}: ${money(d.revenue)}, ${d.orders} orders`} style={{ flex: 1, background: "#4f46e5", height: Math.max(2, (d.revenue / max) * 80), borderRadius: 2 }} />)}
                </div>
              </div>
              <div style={S.card}>
                <h2 style={S.h}>Top products</h2>
                {data.topProducts.map((p) => <div key={p.title} style={S.row}><span>{p.title}</span><span style={S.muted}>{p.units} sold, {money(p.revenue)}</span></div>)}
              </div>
            </>
          )}
          <div style={S.card}>
            <h2 style={S.h}>Take it with you</h2>
            <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => download("orders")}>Download orders (CSV)</button>
            <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => download("products")}>Download products (CSV)</button>
            <div style={{ marginTop: 12 }}>
              <input style={S.input} type="email" placeholder="Email this report to" value={to} onChange={(e) => setTo(e.target.value)} />
              <button style={{ ...S.btn, ...(!to || busy ? S.off : {}) }} disabled={!to || !!busy} onClick={email}>{busy === "mail" ? "Sending..." : "Email report"}</button>
              {msg && <span style={S.muted}>{msg}</span>}
            </div>
          </div>
          <div style={S.card}>
            <h2 style={S.h}>What do these numbers mean?</h2>
            <button style={{ ...S.btn, ...(!data.ai || !data.orders || busy ? S.off : {}) }} disabled={!data.ai || !data.orders || !!busy} onClick={getInsight}>{busy === "ai" ? "Reading..." : "AI insight (2 credits)"}</button>
            {insight && <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#d4d4d8", marginTop: 10 }}>{insight}</div>}
          </div>
        </>
      )}
    </div>
  );
}