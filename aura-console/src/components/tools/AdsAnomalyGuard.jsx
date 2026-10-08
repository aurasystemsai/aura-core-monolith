import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13 },
  row: { padding: 12, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/ads-anomaly-guard";
const COLOR = { high: "#fca5a5", medium: "#fcd34d" };
const SETUP = { not_connected: "Not connected. Connect it in its own ad tool first.", no_account: "Connected, but no ad account is chosen yet." };

export default function AdsAnomalyGuard() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function check() {
    setBusy(true); setError("");
    try {
      const r = await apiFetchJSON(API + "/check");
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      setData(r);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  useEffect(() => { check(); }, []); // eslint-disable-line

  const connected = data ? data.platforms.filter((p) => p.state === "ok") : [];
  const total = connected.reduce((n, p) => n + p.alerts.length, 0);

  return (
    <div style={S.root}>
      <h1 style={S.title}>Ads Anomaly Guard</h1>
      <p style={S.subtitle}>Compares each campaign&apos;s last 7 days with its own weekly average over the 23 days before, and flags spend spikes, wasted spend, falling returns and traffic drops. Free to run.</p>
      {error && <div style={S.error}>{error}</div>}
      <p><button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={busy} onClick={check}>{busy ? "Checking…" : "Check now"}</button>
        {data && <span style={S.muted}> Last checked {new Date(data.checkedAt).toLocaleTimeString()}</span>}</p>
      {!data && !error && <div style={S.muted}>Loading…</div>}
      {data && connected.length === 0 && <div style={S.card}>No ad platform is connected with an account chosen, so there is nothing to watch yet. Connect Google Ads, Meta or TikTok first.</div>}
      {data && connected.length > 0 && total === 0 && <div style={S.ok}>No problems found across {connected.map((p) => p.name).join(", ")}.</div>}
      {data && data.platforms.map((p) => (
        <div key={p.id} style={{ ...S.card, marginTop: 16 }}>
          <h2 style={S.h}>{p.name}{p.state === "ok" ? <span style={S.muted}> · {p.campaigns} campaigns checked</span> : null}</h2>
          {SETUP[p.state] && <div style={S.muted}>{SETUP[p.state]}</div>}
          {p.state === "error" && <div style={{ ...S.error, marginBottom: 0 }}>{p.error}</div>}
          {p.state === "ok" && p.alerts.length === 0 && <div style={S.muted}>All campaigns look normal.</div>}
          {p.alerts.map((a) => (
            <div key={a.campaignId} style={S.row}>
              <strong>{a.campaign}</strong>
              {a.issues.map((i) => <div key={i.code} style={{ marginTop: 4 }}><span style={{ color: COLOR[i.severity], fontWeight: 700 }}>{i.severity === "high" ? "Urgent" : "Watch"}</span> {i.message}</div>)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}