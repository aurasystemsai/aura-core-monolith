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
const API = "/api/email-deliverability";
const COLOR = { healthy: "#86efac", warning: "#fcd34d", critical: "#fca5a5" };
const SEV = { high: "#fca5a5", medium: "#fcd34d", low: "#a1a1aa" };

function Check({ label, ok, detail }) {
  return (
    <div style={S.row}>
      <span>{ok ? "✓" : "✗"} {label}</span>
      <span style={{ color: ok ? "#86efac" : "#fca5a5", fontSize: 12 }}>{detail}</span>
    </div>
  );
}

export default function EmailDeliverability() {
  const [domains, setDomains] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [status, setStatus] = useState(null);
  const [input, setInput] = useState("");
  const [advice, setAdvice] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);

  const refresh = async () => {
    const [d, s] = await Promise.all([run("load", "/domains"), run("load", "/status")]);
    if (d) { setDomains(d.domains); setSuggested(d.suggested); }
    if (s) setStatus(s);
  };
  useEffect(() => { refresh(); }, []); // eslint-disable-line

  async function check(domain) {
    const r = await run("check:" + domain, "/check", { method: "POST", body: JSON.stringify({ domain }) });
    if (r) { setInput(""); refresh(); }
  }
  async function remove(domain) { await run("rm", "/domains/" + encodeURIComponent(domain), { method: "DELETE" }); refresh(); }
  async function advise(domain) {
    const r = await run("advise:" + domain, "/advise", { method: "POST", body: JSON.stringify({ domain }) });
    if (r) setAdvice((a) => ({ ...a, [domain]: r.advice }));
  }

  return (
    <div style={S.root}>
      <h1 style={S.title}>Email Deliverability</h1>
      <p style={S.subtitle}>Live checks of the records that decide whether your emails reach the inbox or spam: SPF, DKIM, DMARC and MX. Nothing here is estimated.</p>
      {error && <div style={S.error}>{error}</div>}
      {status && status.sender && <div style={S.warn}>Sending as {status.sender}. Add the domain you send from below.</div>}

      <div style={S.card}>
        <h2 style={S.h}>Check a domain</h2>
        <input style={S.input} placeholder="mystore.com" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && input && check(input)} />
        <button style={{ ...S.btn, ...(!input || busy ? S.off : {}) }} disabled={!input || !!busy} onClick={() => check(input)}>{busy.startsWith("check:") ? "Checking…" : "Check domain"}</button>
        {suggested.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={S.muted}>Suggested from your store:</div>
            {suggested.map((d) => <button key={d} style={S.ghost} disabled={!!busy} onClick={() => check(d)}>{d}</button>)}
          </div>
        )}
      </div>

      {domains === null && <div style={S.empty}>Loading…</div>}
      {domains && domains.length === 0 && <div style={S.empty}>No domains checked yet. Enter the domain you send email from.</div>}
      {domains && domains.map((d) => (
        <div key={d.domain} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ ...S.h, margin: 0 }}>{d.domain} <span style={{ color: COLOR[d.status], fontSize: 13 }}>{d.score}/100 · {d.status}</span></h2>
            <div>
              <button style={S.ghost} disabled={!!busy} onClick={() => check(d.domain)}>Re-check</button>
              <button style={S.ghost} disabled={!!busy} onClick={() => remove(d.domain)}>Remove</button>
            </div>
          </div>
          <Check label="SPF" ok={d.spf.found} detail={d.spf.found ? (d.spf.strict ? "Published, strict" : "Published, not strict") : "Missing"} />
          <Check label="DKIM" ok={d.dkim.found} detail={d.dkim.found ? "Found: " + d.dkim.selectors.join(", ") : "Not found on common selectors"} />
          <Check label="DMARC" ok={d.dmarc.found} detail={d.dmarc.found ? "Policy: " + d.dmarc.policy : "Missing"} />
          <Check label="MX" ok={d.mx.found} detail={d.mx.found ? d.mx.count + " record(s)" : "None"} />
          {d.issues.length === 0 && <div style={{ ...S.ok, marginTop: 10 }}>No problems found.</div>}
          {d.issues.map((i, k) => (
            <div key={k} style={{ ...S.row, flexDirection: "column", marginTop: 6 }}>
              <strong style={{ color: SEV[i.severity] }}>{i.issue}</strong>
              <span style={S.muted}>{i.fix}</span>
            </div>
          ))}
          {d.issues.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button style={{ ...S.btn, ...(busy || !(status && status.ai) ? S.off : {}) }} disabled={!!busy || !(status && status.ai)} onClick={() => advise(d.domain)}>
                {busy === "advise:" + d.domain ? "Thinking…" : "AI fix plan (2 credits)"}
              </button>
              {advice[d.domain] && <pre style={{ whiteSpace: "pre-wrap", color: "#d4d4d8", fontSize: 13, fontFamily: "inherit", marginTop: 10 }}>{advice[d.domain]}</pre>}
            </div>
          )}
          <div style={{ ...S.muted, marginTop: 8 }}>Checked {new Date(d.checkedAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}