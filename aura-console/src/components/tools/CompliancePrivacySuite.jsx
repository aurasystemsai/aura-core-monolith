import React, { useState, useEffect, useCallback } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/compliance-privacy-suite";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  h1: { fontSize: 26, fontWeight: 800, margin: "0 0 4px" },
  sub: { color: "#71717a", fontSize: 14, margin: "0 0 24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 },
  badge: (s) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, background: s === "pass" ? "#052e16" : s === "fail" ? "#3f1315" : s === "pending" ? "#1c1917" : "#27272a", color: s === "pass" ? "#4ade80" : s === "fail" ? "#f87171" : s === "pending" ? "#fbbf24" : "#a1a1aa" }),
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "10px 16px", outline: "none" },
  row: { display: "flex", gap: 10, alignItems: "center", marginBottom: 12 },
  label: { fontSize: 12, color: "#71717a", marginBottom: 4 },
  err: { background: "#3f1315", border: "1px solid #7f1d1d", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontSize: 13, marginBottom: 12 },
  tabRow: { display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #27272a", paddingBottom: 12 },
  tab: (a) => ({ background: a ? "#4f46e5" : "transparent", color: a ? "#fafafa" : "#71717a", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }),
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  tableHeader: { fontSize: 11, color: "#52525b", fontWeight: 700, textTransform: "uppercase", padding: "6px 0", borderBottom: "1px solid #27272a" },
  tableRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 120px", gap: 8, padding: "10px 0", borderBottom: "1px solid #1f1f22", alignItems: "center", fontSize: 13 },
};

const TABS = [
  { id: "checks", label: "Compliance Checks" },
  { id: "dsar", label: "DSAR Requests" },
  { id: "consents", label: "Consent Records" },
  { id: "delete", label: "Data Deletion" },
];

export default function CompliancePrivacySuite() {
  const [tab, setTab] = useState("checks");
  const [checks, setChecks] = useState([]);
  const [dsar, setDsar] = useState([]);
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [dsarForm, setDsarForm] = useState({ customerId: "", type: "access" });
  const [deleteId, setDeleteId] = useState("");
  const [deleteScope, setDeleteScope] = useState("all");
  const [actionMsg, setActionMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [c, d, co] = await Promise.all([
        apiFetchJSON(`${API}/compliance-checks`),
        apiFetchJSON(`${API}/dsar`),
        apiFetchJSON(`${API}/consents`),
      ]);
      setChecks(c.checks || []);
      setDsar(d.requests || []);
      setConsents(co.consents || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitDsar = async () => {
    if (!dsarForm.customerId.trim()) return;
    try {
      await apiFetchJSON(`${API}/dsar`, { method: "POST", body: JSON.stringify(dsarForm) });
      setActionMsg("DSAR request submitted successfully");
      setDsarForm({ customerId: "", type: "access" });
      load();
    } catch (e) { setErr(e.message); }
  };

  const deleteCustomer = async () => {
    if (!deleteId.trim()) return;
    if (!window.confirm(`Delete all data for customer ${deleteId}? This cannot be undone.`)) return;
    try {
      await apiFetchJSON(`${API}/customers/${deleteId}/delete`, { method: "POST", body: JSON.stringify({ scope: deleteScope }) });
      setActionMsg(`Data deletion initiated for customer ${deleteId}`);
      setDeleteId("");
    } catch (e) { setErr(e.message); }
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Compliance & Privacy Suite</h1>
      <p style={S.sub}>GDPR/CCPA compliance, consent management, DSAR handling, and data governance.</p>

      {err && <div style={S.err}>{err}</div>}
      {actionMsg && <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 8, padding: "12px 16px", color: "#4ade80", fontSize: 13, marginBottom: 12 }}>{actionMsg} <button style={{ background: "none", border: "none", color: "#4ade80", cursor: "pointer", float: "right" }} onClick={() => setActionMsg(null)}>✕</button></div>}

      <div style={S.tabRow}>
        {TABS.map(t => <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>)}
        <button style={{ ...S.btn(""), marginLeft: "auto", fontSize: 12, padding: "6px 14px" }} onClick={load}>↻ Refresh</button>
      </div>

      {tab === "checks" && (
        <div>
          {loading && <p style={{ color: "#71717a" }}>Running compliance checks…</p>}
          {checks.map((c, i) => (
            <div key={i} style={{ ...S.card, display: "flex", alignItems: "flex-start", gap: 16 }}>
              <span style={S.badge(c.status === "pass" ? "pass" : c.status === "fail" ? "fail" : "pending")}>{c.status || "pending"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name || c.check}</div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 4 }}>{c.description || c.detail}</div>
                {c.regulation && <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>Regulation: {c.regulation}</div>}
              </div>
              {c.action && <div style={{ fontSize: 12, color: "#fbbf24", maxWidth: 200 }}>{c.action}</div>}
            </div>
          ))}
          {!loading && checks.length === 0 && <p style={{ color: "#71717a" }}>No compliance checks available.</p>}
        </div>
      )}

      {tab === "dsar" && (
        <div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Submit DSAR Request</div>
            <div style={S.row}>
              <input style={S.input} placeholder="Customer ID" value={dsarForm.customerId} onChange={e => setDsarForm(f => ({ ...f, customerId: e.target.value }))} />
              <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px" }} value={dsarForm.type} onChange={e => setDsarForm(f => ({ ...f, type: e.target.value }))}>
                <option value="access">Access</option>
                <option value="deletion">Deletion</option>
                <option value="portability">Portability</option>
              </select>
              <button style={S.btn("primary")} onClick={submitDsar}>Submit</button>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>DSAR Requests ({dsar.length})</div>
            {dsar.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1f1f22" }}>
                <span style={S.badge(d.status === "completed" ? "pass" : d.status === "pending" ? "pending" : "")}>{d.status}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{d.type}</span>
                  <span style={{ fontSize: 12, color: "#71717a", marginLeft: 8 }}>Customer: {d.customerId}</span>
                </div>
                <span style={{ fontSize: 12, color: "#52525b" }}>{d.submittedAt ? new Date(d.submittedAt).toLocaleDateString() : ""}</span>
              </div>
            ))}
            {dsar.length === 0 && <p style={{ color: "#71717a", fontSize: 13 }}>No DSAR requests.</p>}
          </div>
        </div>
      )}

      {tab === "consents" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Consent Records ({consents.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 120px", gap: 8, marginBottom: 8 }}>
            {["Customer", "Type", "Status", "Date"].map(h => <div key={h} style={S.tableHeader}>{h}</div>)}
          </div>
          {consents.slice(0, 50).map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 120px", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13, alignItems: "center" }}>
              <span style={{ color: "#e4e4e7" }}>{c.customerId}</span>
              <span style={{ color: "#a1a1aa" }}>{c.type || c.consentType}</span>
              <span style={S.badge(c.consented || c.status === "granted" ? "pass" : "fail")}>{c.consented || c.status === "granted" ? "Yes" : "No"}</span>
              <span style={{ color: "#52525b" }}>{c.timestamp ? new Date(c.timestamp).toLocaleDateString() : c.date || ""}</span>
            </div>
          ))}
          {consents.length === 0 && <p style={{ color: "#71717a", fontSize: 13 }}>No consent records.</p>}
        </div>
      )}

      {tab === "delete" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Right to Erasure — Customer Data Deletion</div>
          <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>Permanently delete all personal data for a customer. This action cannot be undone and will be logged for compliance purposes.</p>
          <div style={S.row}>
            <input style={S.input} placeholder="Customer ID" value={deleteId} onChange={e => setDeleteId(e.target.value)} />
            <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px" }} value={deleteScope} onChange={e => setDeleteScope(e.target.value)}>
              <option value="all">All data</option>
              <option value="pii">PII only</option>
              <option value="orders">Orders only</option>
              <option value="marketing">Marketing only</option>
            </select>
            <button style={S.btn("danger")} onClick={deleteCustomer}>Delete Data</button>
          </div>
          <div style={{ background: "#0c0c0e", border: "1px solid #3f1315", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#f87171" }}>
            ⚠ This will permanently delete customer data. Action is logged with timestamp for GDPR audit trail.
          </div>
        </div>
      )}
    </div>
  );
}
