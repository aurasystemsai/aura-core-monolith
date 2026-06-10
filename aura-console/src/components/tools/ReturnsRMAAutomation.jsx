import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/returns-rma-automation";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "approved" ? "#052e16" : c === "pending" ? "#3d2a0a" : c === "rejected" ? "#3f1315" : "#27272a", color: c === "approved" ? "#4ade80" : c === "pending" ? "#fbbf24" : c === "rejected" ? "#f87171" : "#a1a1aa" }),
};

const TABS = [
  { id: "create",    label: "New Return" },
  { id: "returns",   label: "Returns List" },
  { id: "policy",    label: "AI Policy" },
  { id: "analytics", label: "Analytics" },
  { id: "guide",     label: "RMA Guide" },
];

const STATUS_OPTIONS = ["pending", "approved", "rejected", "processing", "resolved"];
const RETURN_REASONS = ["Wrong size", "Wrong item sent", "Item damaged", "Not as described", "Changed mind", "Quality issue", "Arrived too late", "Duplicate order", "Other"];
const EMPTY_FORM = { orderId: "", customerEmail: "", product: "", reason: "", value: "", notes: "" };

export default function ReturnsRMAAutomation() {
  const [tab, setTab]           = useState("create");
  const [returns, setReturns]   = useState([]);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiAnalysis, setAiAnalysis]     = useState("");
  const [aiLoading, setAiLoading]       = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [selectedReturn, setSelected]   = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { loadReturns(); }, []);

  const loadReturns = async () => {
    try { const r = await apiFetchJSON(`${API}/returns`); if (r.ok) setReturns(r.returns || []); } catch {}
  };

  const createReturn = async () => {
    if (!form.orderId || !form.customerEmail || !form.product) { setError("Order ID, email and product are required."); return; }
    setCreating(true); setError(""); setSuccess("");
    try {
      const r = await apiFetchJSON(`${API}/returns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status: "pending", createdAt: new Date().toISOString() }) });
      if (!r.ok) throw new Error(r.error || "Failed to create return");
      setSuccess(`RMA created: ${r.return?.id || "done"}`);
      setForm(EMPTY_FORM); loadReturns();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) { setError(e.message); }
    setCreating(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await apiFetchJSON(`${API}/returns/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      setReturns(p => p.map(r => r.id === id ? { ...r, status } : r));
    } catch (e) { setError(e.message); }
  };

  const deleteReturn = async (id) => {
    try {
      await apiFetchJSON(`${API}/returns/${id}`, { method: "DELETE" });
      setReturns(p => p.filter(r => r.id !== id));
      if (selectedReturn?.id === id) setSelected(null);
    } catch (e) { setError(e.message); }
  };

  const getAiPolicy = async (ret) => {
    const order = ret || selectedReturn || form;
    if (!order.orderId && !form.orderId) { setError("Select a return or fill in New Return form first."); return; }
    setAiLoading(true); setError(""); setAiSuggestion("");
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order }) });
      if (!r.ok) throw new Error(r.error || "AI policy failed");
      setAiSuggestion(r.result || "");
      setTab("policy");
    } catch (e) { setError(e.message); }
    setAiLoading(false);
  };

  const runAnalytics = async () => {
    setAnalyticsLoading(true); setAiAnalysis("");
    try {
      const reasonCounts = RETURN_REASONS.reduce((acc, r) => ({ ...acc, [r]: returns.filter(x => x.reason === r).length }), {});
      const summary = `Returns data: ${returns.length} total. By reason: ${Object.entries(reasonCounts).filter(([,v]) => v > 0).map(([k,v]) => `${k}(${v})`).join(", ")}. By status: pending(${stats.pending}), approved(${stats.approved}), rejected(${stats.rejected}).`;
      const r = await apiFetchJSON(`${API}/ai/suggest`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: { notes: summary, reason: "analytics", orderId: "summary" } }) });
      if (!r.ok) throw new Error(r.error || "Analysis failed");
      setAiAnalysis(r.result || "");
    } catch (e) { setAiAnalysis(""); }
    setAnalyticsLoading(false);
  };

  const filtered = filterStatus === "all" ? returns : returns.filter(r => r.status === filterStatus);
  const stats = { total: returns.length, pending: returns.filter(r => r.status === "pending").length, approved: returns.filter(r => r.status === "approved").length, rejected: returns.filter(r => r.status === "rejected").length };

  // Analytics calcs
  const reasonCounts = RETURN_REASONS.map(reason => ({ reason, count: returns.filter(r => r.reason === reason).length })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);
  const maxReasonCount = reasonCounts[0]?.count || 1;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Returns & RMA Automation</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Streamline returns, automate RMA workflows, and let AI suggest the optimal policy for each return case. Reduce friction and recover more revenue from return situations.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total Returns", value: stats.total,    color: "#818cf8" },
          { label: "Pending",       value: stats.pending,  color: "#fbbf24" },
          { label: "Approved",      value: stats.approved, color: "#4ade80" },
          { label: "Rejected",      value: stats.rejected, color: "#f87171" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* CREATE RETURN */}
      {tab === "create" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>New Return / RMA Request</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {[
                { key: "orderId",       label: "Order ID *",       placeholder: "#1234" },
                { key: "customerEmail", label: "Customer Email *",  placeholder: "customer@example.com" },
                { key: "product",       label: "Product Name *",    placeholder: "Blue Denim Jacket XL" },
                { key: "value",         label: "Order Value ($)",   placeholder: "89.99" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Return Reason</label>
              <select style={{ ...S.input, width: "100%" }} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}>
                <option value="">Select reason…</option>
                {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Additional Notes</label>
              <textarea style={{ ...S.ta, minHeight: 70 }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional context about the return…" />
            </div>
            <ErrorBox message={error} />
            {success && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 10 }}>{success}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={createReturn} disabled={creating}>{creating ? "Creating…" : "Create RMA"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => getAiPolicy(form)} disabled={aiLoading}>{aiLoading ? "AI thinking…" : "Get AI Policy"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setForm(EMPTY_FORM)}>Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* RETURNS LIST */}
      {tab === "returns" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["all", ...STATUS_OPTIONS].map(s => (
              <button key={s} style={{ ...S.btn(s === filterStatus ? "primary" : null), fontSize: 11, padding: "5px 10px", textTransform: "capitalize" }} onClick={() => setFilterStatus(s)}>{s}</button>
            ))}
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px", marginLeft: "auto" }} onClick={loadReturns}>Refresh</button>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon="📦" title="No returns found" description="Create your first RMA request in the New Return tab." />
          ) : (
            filtered.map(ret => (
              <div key={ret.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7", marginBottom: 4 }}>{ret.orderId || ret.id} — {ret.product || "Unknown product"}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>{ret.customerEmail}{ret.value ? ` · $${ret.value}` : ""}{ret.reason ? ` · ${ret.reason}` : ""}</div>
                    <span style={S.badge(ret.status)}>{ret.status || "pending"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <select style={{ background: "#27272a", color: "#fafafa", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer" }} value={ret.status || "pending"} onChange={e => updateStatus(ret.id, e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setSelected(ret); getAiPolicy(ret); }}>AI Suggest</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteReturn(ret.id)}>Delete</button>
                  </div>
                </div>
                {ret.notes && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 8, paddingTop: 8, borderTop: "1px solid #1f1f22" }}>{ret.notes}</div>}
              </div>
            ))
          )}
        </div>
      )}

      {/* AI POLICY */}
      {tab === "policy" && (
        <div style={{ marginTop: 20 }}>
          {selectedReturn && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Return Context</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>Order: {selectedReturn.orderId} · {selectedReturn.product} · {selectedReturn.reason}</div>
            </div>
          )}
          {!aiSuggestion && !aiLoading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Get AI Policy Recommendation</div>
              <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>Select a return from Returns List and click "AI Suggest", or fill in the New Return form and click "Get AI Policy".</p>
              <button style={S.btn("primary")} onClick={() => setTab("create")}>Create New Return</button>
            </div>
          )}
          {aiLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {aiSuggestion && !aiLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI Policy Recommendation</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(aiSuggestion)}>Copy</button>
              </div>
              <pre style={S.pre}>{aiSuggestion}</pre>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS */}
      {tab === "analytics" && (
        <div style={{ marginTop: 20 }}>
          {returns.length === 0 ? (
            <EmptyState icon="📊" title="No returns data yet" description="Create some RMA requests and they will appear in your analytics." />
          ) : (
            <>
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={S.sectionTitle}>Returns by Reason</div>
                  <button style={{ ...S.btn("primary"), fontSize: 11, padding: "5px 12px" }} onClick={runAnalytics} disabled={analyticsLoading}>{analyticsLoading ? "Analysing…" : "AI Analysis"}</button>
                </div>
                {reasonCounts.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#71717a" }}>No reason data available.</div>
                ) : (
                  reasonCounts.map(({ reason, count }) => (
                    <div key={reason} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                        <span style={{ color: "#e4e4e7" }}>{reason}</span>
                        <span style={{ color: "#a1a1aa" }}>{count} ({Math.round(count / returns.length * 100)}%)</span>
                      </div>
                      <div style={{ height: 6, background: "#27272a", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${(count / maxReasonCount) * 100}%`, background: "#4f46e5", borderRadius: 3, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={S.card}>
                  <div style={S.sectionTitle}>By Status</div>
                  {STATUS_OPTIONS.map(status => {
                    const count = returns.filter(r => r.status === status).length;
                    return (
                      <div key={status} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                        <span style={{ textTransform: "capitalize", color: "#a1a1aa" }}>{status}</span>
                        <span style={{ fontWeight: 700, color: status === "approved" ? "#4ade80" : status === "rejected" ? "#f87171" : status === "pending" ? "#fbbf24" : "#fafafa" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={S.card}>
                  <div style={S.sectionTitle}>Value Summary</div>
                  {(() => {
                    const valued = returns.filter(r => r.value && !isNaN(Number(r.value)));
                    const totalValue = valued.reduce((sum, r) => sum + Number(r.value), 0);
                    const avgValue = valued.length ? (totalValue / valued.length).toFixed(2) : 0;
                    const approvedValue = returns.filter(r => r.status === "approved" && r.value).reduce((sum, r) => sum + Number(r.value), 0);
                    return [
                      { label: "Total Return Value", value: `$${totalValue.toFixed(2)}`, color: "#f87171" },
                      { label: "Avg Return Value",   value: `$${avgValue}`,              color: "#fbbf24" },
                      { label: "Approved Value",     value: `$${approvedValue.toFixed(2)}`, color: "#4ade80" },
                      { label: "Returns with value", value: valued.length,               color: "#818cf8" },
                    ].map(m => (
                      <div key={m.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                        <span style={{ color: "#a1a1aa" }}>{m.label}</span>
                        <span style={{ fontWeight: 700, color: m.color }}>{m.value}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {aiAnalysis && (
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={S.sectionTitle}>AI Returns Analysis</div>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(aiAnalysis)}>Copy</button>
                  </div>
                  <pre style={S.pre}>{aiAnalysis}</pre>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Returns Strategy Framework</div>
            {[
              { t: "Make returns effortless",              d: "Brands with easy returns see 40% higher repeat purchase rates. Pre-print return labels, offer self-service returns portal, keep 3-step maximum." },
              { t: "Identify return fraud patterns",       d: "Flag customers who return > 30% of orders. Common patterns: wardrobing (wear & return), serial returners, accounts with multiple addresses." },
              { t: "Offer exchanges over refunds",        d: "Prompt customers to exchange for a different size/colour before refunding. Converts 15-25% of would-be refunds into retained revenue." },
              { t: "Personalise the return resolution",   d: "High-LTV customers should get white-glove treatment: instant refund, no return required. Low-value one-time buyers: standard policy applies." },
              { t: "Use returns data to reduce future returns", d: "Track return reasons by product/SKU. 'Not as described' suggests imagery issues. 'Wrong size' suggests size guide gaps. Feed into product team." },
              { t: "Smart return window management",      d: "Tiered windows: 14 days standard, 30 days for loyalty members, 60 days for high-value products. Longer windows paradoxically reduce returns." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>↩</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Industry Return Rate Benchmarks</div>
            {[
              { cat: "Apparel",       rate: "25-40%", note: "Highest due to fit/sizing issues" },
              { cat: "Electronics",   rate: "8-15%",  note: "Defects and compatibility issues" },
              { cat: "Beauty",        rate: "5-10%",  note: "Low — consumables rarely returned" },
              { cat: "Home & Garden", rate: "10-20%", note: "Colour/size mismatch common" },
              { cat: "Books/Media",   rate: "3-8%",   note: "Lowest category return rate" },
              { cat: "Shoes",         rate: "20-35%", note: "Second highest after apparel" },
            ].map(r => (
              <div key={r.cat} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{r.cat}</span>
                <span style={{ color: "#f87171", fontWeight: 700 }}>{r.rate}</span>
                <span style={{ color: "#71717a" }}>{r.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
