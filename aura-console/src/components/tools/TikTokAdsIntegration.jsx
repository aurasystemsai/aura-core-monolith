import React, { useCallback, useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/tiktok-ads-integration";
const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20, maxWidth: 900 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  btn: { background: "#6366f1", color: "#fff", border: 0, borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" },
  row: { padding: "9px 10px", border: "1px solid #27272a", borderRadius: 8, marginBottom: 6, fontSize: 13, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  muted: { color: "#71717a", fontSize: 12 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "right", padding: "6px 8px", color: "#71717a", fontWeight: 600, borderBottom: "1px solid #3f3f46" },
  td: { textAlign: "right", padding: "7px 8px", borderBottom: "1px solid #27272a" },
  stat: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 14px", minWidth: 110 },
};

export default function TikTokAdsIntegration() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [accounts, setAccounts] = useState(null);
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [advice, setAdvice] = useState(null);

  const call = async (url, options) => {
    const r = await apiFetchJSON(API + url, options);
    if (!r.ok) throw new Error(r.error || "Something went wrong.");
    return r;
  };
  const post = (url, body) => call(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });

  const loadStatus = useCallback(() => call("/status").then(setStatus).catch((e) => setError(e.message)), []);
  useEffect(() => { loadStatus(); }, [loadStatus]);

  const loadReport = useCallback(async (d) => {
    setBusy("report"); setError(""); setAdvice(null);
    try { setReport(await call(`/campaigns?days=${d}`)); } catch (e) { setError(e.message); setReport(null); } finally { setBusy(""); }
  }, []);

  useEffect(() => {
    if (!status || !status.connected) return;
    if (status.accountId) { loadReport(days); return; }
    setBusy("accounts");
    call("/accounts").then((r) => setAccounts(r.accounts)).catch((e) => setError(e.message)).finally(() => setBusy(""));
  }, [status, days, loadReport]);

  const run = async (name, fn) => {
    setBusy(name); setError("");
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(""); }
  };

  const connect = () => run("connect", async () => {
    const r = await call("/connect");
    window.open(r.url, "_blank", "noopener");
  });
  const disconnect = () => run("disconnect", async () => {
    await post("/disconnect"); setReport(null); setAccounts(null); setAdvice(null); await loadStatus();
  });
  const choose = (a) => run("select", async () => { await post("/select", { accountId: a.id }); await loadStatus(); });
  const suggest = () => run("suggest", async () => { setAdvice(await post("/suggest", { days })); });

  const money = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={S.root}>
      <h1 style={S.title}>TikTok Ads</h1>
      <p style={S.subtitle}>See what your ads spend and earn, and get plain-English advice. AURA only reads your account; it never changes it.</p>
      {error && <div style={S.error}>{error}</div>}
      {!status && !error && <div style={S.muted}>Loading…</div>}

      {status && !status.connected && (
        <div style={S.card}>
          <h2 style={S.h}>Connect your TikTok ad account</h2>
          <p style={{ fontSize: 13, color: "#d4d4d8", marginTop: 0 }}>Sign in with the TikTok account that runs your ads. You choose what to share and can disconnect at any time.</p>
          {!status.configured && <p style={S.muted}>TikTok connection is not available yet. It is waiting for TikTok's approval of AURA.</p>}
          <button style={{ ...S.btn, opacity: status.configured ? 1 : 0.5 }} disabled={!status.configured || busy === "connect"} onClick={connect}>
            {busy === "connect" ? "Opening TikTok…" : "Connect TikTok"}
          </button>
          <button style={{ ...S.ghost, marginLeft: 8 }} onClick={loadStatus}>I have connected</button>
        </div>
      )}

      
      {status && status.connected && !status.accountId && (
        <div style={S.card}>
          <h2 style={S.h}>Choose an ad account</h2>
          {busy === "accounts" && <div style={S.muted}>Loading your accounts…</div>}
          {accounts && !accounts.length && <div style={S.muted}>No ad accounts were found on this TikTok login.</div>}
          {accounts && accounts.map((a) => (
            <div key={a.id} style={S.row}>
              <span>{a.name} <span style={S.muted}>({a.id}{a.currency ? `, ${a.currency}` : ""})</span></span>
              <button style={S.btn} disabled={busy === "select"} onClick={() => choose(a)}>Use this</button>
            </div>
          ))}
          <button style={S.ghost} onClick={disconnect}>Disconnect</button>
        </div>
      )}

      {status && status.connected && status.accountId && (
        <>
          <div style={S.card}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <h2 style={{ ...S.h, margin: 0 }}>Campaigns</h2>
              {[7, 14, 30].map((d) => (
                <button key={d} style={d === days ? S.btn : S.ghost} onClick={() => setDays(d)}>{d} days</button>
              ))}
              <span style={{ flex: 1 }} />
              <button style={S.ghost} onClick={disconnect}>Disconnect</button>
            </div>
            {busy === "report" && <div style={S.muted}>Loading results…</div>}
            {report && !report.campaigns.length && <div style={S.muted}>No campaigns have data in this period.</div>}
            {report && report.campaigns.length > 0 && (
              <>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                  {[["Spend", money(report.totals.spend)], ["Clicks", report.totals.clicks.toLocaleString()], ["Conversions", report.totals.conversions]].map(([k, v]) => (
                    <div key={k} style={S.stat}><div style={S.muted}>{k}</div><div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div></div>
                  ))}
                </div>
                <table style={S.table}>
                  <thead><tr>{["Campaign", "Spend", "Clicks", "CTR %", "CPC", "Conv."].map((h, i) => <th key={h} style={{ ...S.th, textAlign: i < 1 ? "left" : "right" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {report.campaigns.map((c) => (
                      <tr key={c.id}>
                        <td style={{ ...S.td, textAlign: "left" }}>{c.name}</td>
                        
                        <td style={S.td}>{money(c.spend)}</td><td style={S.td}>{c.clicks.toLocaleString()}</td>
                        <td style={S.td}>{c.ctr}</td><td style={S.td}>{money(c.cpc)}</td><td style={S.td}>{c.conversions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
          {report && report.campaigns.length > 0 && (
            <div style={S.card}>
              <h2 style={S.h}>AI advice</h2>
              <p style={S.muted}>Based only on the numbers above. Costs 2 credits.</p>
              <button style={S.btn} disabled={busy === "suggest"} onClick={suggest}>{busy === "suggest" ? "Reviewing…" : "Review my campaigns"}</button>
              {advice && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 13, color: "#d4d4d8" }}>{advice.summary}</p>
                  {advice.actions.map((a, i) => (
                    <div key={i} style={{ ...S.row, display: "block" }}>
                      <div style={{ fontWeight: 600 }}>{a.campaign}</div>
                      <div>{a.action}</div>
                      <div style={S.muted}>{a.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}