import React, { useCallback, useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/rank-visibility-tracker";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 24, marginBottom: 20 },
  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnGhost: { background: "#27272a", color: "#fafafa", border: "1px solid #3f3f46", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  btnOff: { opacity: 0.5, cursor: "not-allowed" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 13, padding: "10px 12px", boxSizing: "border-box" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  warn: { background: "#1c1708", border: "1px solid #78350f", color: "#fcd34d", borderRadius: 10, padding: "12px 14px", fontSize: 13, marginBottom: 16 },
  empty: { color: "#71717a", fontSize: 13, padding: "16px 0" },
  th: { textAlign: "left", fontSize: 11, color: "#71717a", padding: "6px 8px", borderBottom: "1px solid #27272a" },
  td: { fontSize: 13, padding: "10px 8px", borderBottom: "1px solid #27272a", verticalAlign: "middle" },
};

function Spark({ history }) {
  const pts = history.filter((h) => h.position).slice().reverse();
  if (pts.length < 2) return <span style={{ color: "#52525b", fontSize: 11 }}>needs 2+ checks</span>;
  const max = Math.max(...pts.map((p) => p.position));
  const min = Math.min(...pts.map((p) => p.position));
  const span = Math.max(1, max - min);
  const d = pts.map((p, i) => `${(i / (pts.length - 1)) * 100},${((p.position - min) / span) * 22 + 2}`).join(" ");
  return <svg width="100" height="26"><polyline points={d} fill="none" stroke="#818cf8" strokeWidth="2" /></svg>;
}

export default function RankVisibilityTracker() {
  const [rows, setRows] = useState(null);
  const [configured, setConfigured] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("us");
  const [countries, setCountries] = useState(["us", "gb"]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [gsc, setGsc] = useState({ available: false, connected: false });
  const [gscData, setGscData] = useState(null);

  const loadGsc = useCallback(async () => {
    setBusy("gsc"); setError("");
    const r = await apiFetchJSON(`${API}/gsc/queries`);
    setBusy("");
    if (!r.ok) return setError(r.error || "Could not load Search Console data");
    setGscData(r);
  }, []);

  async function connectGoogle() {
    const r = await apiFetchJSON(`${API}/gsc/connect`);
    if (!r.ok) return setError(r.error || "Could not start Google connection");
    window.open(r.url, "_blank", "noopener");
  }

  async function disconnectGoogle() {
    const r = await apiFetchJSON(`${API}/gsc/disconnect`, { method: "POST", body: JSON.stringify({}) });
    if (!r.ok) return setError(r.error || "Could not disconnect");
    setGsc((g) => ({ ...g, connected: false })); setGscData(null);
  }

  async function refreshStatus() {
    const s = await apiFetchJSON(`${API}/status`);
    if (s.ok && s.gsc) setGsc(s.gsc);
  }

  const load = useCallback(async () => {
    const [s, k] = await Promise.all([apiFetchJSON(`${API}/status`), apiFetchJSON(`${API}/keywords`)]);
    if (!k.ok) { setRows([]); return setError(k.error || "Could not load keywords"); }
    if (s.ok) { setConfigured(s.configured); setCountries(s.countries); if (s.gsc) setGsc(s.gsc); }
    setRows(k.keywords);
  }, []);

  useEffect(() => {
    let live = true;
    Promise.all([apiFetchJSON(`${API}/status`), apiFetchJSON(`${API}/keywords`)]).then(([s, k]) => {
      if (!live) return;
      if (!k.ok) { setRows([]); return setError(k.error || "Could not load keywords"); }
      if (s.ok) { setConfigured(s.configured); setCountries(s.countries); if (s.gsc) setGsc(s.gsc); }
      setRows(k.keywords);
    }).catch(() => { if (live) { setRows([]); setError("Could not load keywords"); } });
    return () => { live = false; };
  }, []);

  async function track() {
    setBusy("track"); setError("");
    const r = await apiFetchJSON(`${API}/track`, { method: "POST", body: JSON.stringify({ keyword, country }) });
    setBusy("");
    if (!r.ok) return setError(r.error || "Check failed");
    setKeyword(""); await load();
  }

  async function recheck(id) {
    setBusy(id); setError("");
    const r = await apiFetchJSON(`${API}/recheck/${id}`, { method: "POST", body: JSON.stringify({}) });
    setBusy("");
    if (!r.ok) return setError(r.error || "Check failed");
    await load();
  }

  async function remove(id) {
    setBusy(id);
    const r = await apiFetchJSON(`${API}/keywords/${id}`, { method: "DELETE" });
    setBusy("");
    if (!r.ok) return setError(r.error || "Could not remove keyword");
    await load();
  }

  return (
    <div style={S.root}>
      <h1 style={S.title}>Rank & Visibility Tracker</h1>
      <p style={S.subtitle}>Real Google positions for your store. Rankings are never estimated or made up.</p>
      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Google Search Console <span style={{ color: "#86efac", fontSize: 12, fontWeight: 600 }}>No credits used</span></div>
        <p style={{ color: "#a1a1aa", fontSize: 13, margin: "0 0 12px" }}>Connect your own Google account to see the real average position, clicks and impressions for every search your store already appears in. No credits used. Don't have a Google account? Use the on-demand checks below instead.</p>
        {!gsc.available ? <div style={S.warn}>Google connection is not set up on this server yet.</div> : !gsc.connected ? (
          <div style={S.row}>
            <button style={S.btn} onClick={connectGoogle}>Connect Google</button>
            <button style={S.btnGhost} onClick={refreshStatus}>I've connected, refresh</button>
          </div>
        ) : (
          <div>
            <div style={S.row}>
              <button style={{ ...S.btn, ...(busy ? S.btnOff : {}) }} disabled={!!busy} onClick={loadGsc}>{busy === "gsc" ? "Loading…" : gscData ? "Reload" : "Load last 28 days"}</button>
              <button style={S.btnGhost} onClick={disconnectGoogle}>Disconnect</button>
            </div>
            {gscData && (!gscData.queries.length ? <div style={S.empty}>No search data yet for {gscData.site}. New sites can take a few days to appear.</div> : (
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                <thead><tr><th style={S.th}>Search query</th><th style={S.th}>Avg position</th><th style={S.th}>Clicks</th><th style={S.th}>Impressions</th><th style={S.th}>CTR</th></tr></thead>
                <tbody>{gscData.queries.map((q) => (
                  <tr key={q.query}><td style={S.td}>{q.query}</td><td style={{ ...S.td, fontWeight: 700 }}>{q.position}</td><td style={S.td}>{q.clicks}</td><td style={S.td}>{q.impressions}</td><td style={S.td}>{q.ctr}%</td></tr>
                ))}</tbody>
              </table>
            ))}
          </div>
        )}
      </div>

      <h2 style={{ fontSize: 16, margin: "8px 0 4px" }}>On-demand checks</h2>
      <p style={S.subtitle}>Check any keyword live, including ones you don't rank for yet. 1 credit per check.</p>
      {!configured && <div style={S.warn}>Live checks are not enabled on this server yet.</div>}
      <div style={S.card}>
        <div style={S.row}>
          <input style={{ ...S.input, flex: 1, minWidth: 220 }} value={keyword} maxLength={80} placeholder="Keyword to track, e.g. handmade ceramic mug" onChange={(e) => setKeyword(e.target.value)} />
          <select style={S.input} value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
          <button style={{ ...S.btn, ...(!configured || keyword.trim().length < 2 || busy ? S.btnOff : {}) }} disabled={!configured || keyword.trim().length < 2 || !!busy} onClick={track}>
            {busy === "track" ? "Checking Google…" : "Track & check"}
          </button>
        </div>
      </div>

      <div style={S.card}>
        {rows === null ? <div style={S.empty}>Loading…</div> : !rows.length ? <div style={S.empty}>No keywords tracked yet.</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Position</th><th style={S.th}>Change</th><th style={S.th}>Trend</th><th style={S.th}>Last check</th><th style={S.th}></th></tr></thead>
            <tbody>
              {rows.map((k) => (
                <tr key={k.id}>
                  <td style={S.td}>{k.keyword} <span style={{ color: "#71717a", fontSize: 11 }}>{k.country.toUpperCase()}</span></td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{!k.latest ? "–" : k.latest.position ? `#${k.latest.position}` : "Not in top 100"}</td>
                  <td style={{ ...S.td, color: k.change > 0 ? "#86efac" : k.change < 0 ? "#f87171" : "#71717a" }}>{k.change === null ? "–" : k.change > 0 ? `▲ ${k.change}` : k.change < 0 ? `▼ ${-k.change}` : "no change"}</td>
                  <td style={S.td}><Spark history={k.history} /></td>
                  <td style={{ ...S.td, color: "#71717a", fontSize: 12 }}>{k.latest ? new Date(k.latest.at).toLocaleString() : "never"}</td>
                  <td style={S.td}>
                    <button style={{ ...S.btnGhost, ...(!configured || busy ? S.btnOff : {}) }} disabled={!configured || !!busy} onClick={() => recheck(k.id)}>{busy === k.id ? "…" : "Re-check"}</button>{" "}
                    <button style={{ ...S.btnGhost, ...(busy ? S.btnOff : {}) }} disabled={!!busy} onClick={() => remove(k.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

