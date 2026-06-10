import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/personalization-recommendation-engine";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "ai",      label: "AI Suggestions" },
  { id: "saved",   label: "Saved Recommendations" },
  { id: "guide",   label: "Personalisation Guide" },
];

const SAMPLE_DESCRIPTIONS = [
  "Generate product recommendation widgets for a running shoe store. Customer segments: beginner runners, marathon runners, trail runners. Show 3-5 product slots per page.",
  "Design a personalised email sequence for customers who viewed winter coats 3+ times but didn't purchase. Include social proof, price anchoring, and urgency tactics.",
  "Create a homepage personalisation strategy for returning customers vs new visitors. Different hero banners, featured products, and CTAs for each segment.",
  "Suggest an upsell recommendation engine for a supplements brand. Show complementary products post-purchase based on what the customer bought.",
];

export default function PersonalizationRecommendationEngine() {
  const [tab, setTab]       = useState("ai");
  const [description, setDescription] = useState("");
  const [suggestion, setSuggestion]   = useState(null);
  const [recs, setRecs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { loadRecs(); }, []);

  const loadRecs = async () => {
    try {
      const r = await apiFetchJSON(`${API}/recommendations`);
      if (r.ok) setRecs(r.recommendations || []);
    } catch {}
  };

  const runSuggest = async (override) => {
    const desc = (override || description).trim();
    if (!desc) return;
    setLoading(true); setError(""); setSuggestion(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      });
      if (!r.ok) throw new Error(r.error || "AI suggest failed");
      setSuggestion(r.suggestion || r.answer || "");
      if (!override) setDescription("");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveRec = async () => {
    if (!suggestion) return;
    setSaving(true);
    try {
      await apiFetchJSON(`${API}/recommendations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: suggestion, description, createdAt: new Date().toISOString() }),
      });
      loadRecs();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const deleteRec = async (id) => {
    setDeleting(id);
    try {
      await apiFetchJSON(`${API}/recommendations/${id}`, { method: "DELETE" });
      setRecs(p => p.filter(r => r.id !== id));
    } catch {}
    setDeleting(null);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Personalisation & Recommendation Engine</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered personalisation strategy — product recommendations, customer segment targeting, homepage personalisation, email sequences, and upsell flows.</p>
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "ai" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {SAMPLE_DESCRIPTIONS.map((d, i) => (
              <button key={i} style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => runSuggest(d)}>{d.slice(0, 35)}…</button>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Describe Your Personalisation Need</div>
            <textarea style={{ ...S.ta, minHeight: 100 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your personalisation or recommendation use case — segment, goal, products, channel, and any constraints…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={() => runSuggest()} disabled={loading || !description.trim()}>{loading ? "Generating…" : "Get AI Suggestion"}</button>
              {suggestion && <button style={{ ...S.btn("green"), fontSize: 11, padding: "6px 12px" }} onClick={saveRec} disabled={saving}>{saving ? "Saving…" : "Save to Library"}</button>}
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setDescription(""); setSuggestion(null); }}>Clear</button>
            </div>
          </div>
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {suggestion && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>AI Personalisation Strategy</div>
                <button onClick={() => navigator.clipboard?.writeText(suggestion)} style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }}>Copy</button>
              </div>
              <pre style={S.pre}>{suggestion}</pre>
            </div>
          )}
        </div>
      )}

      {tab === "saved" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{recs.length} recommendations</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadRecs}>Refresh</button>
          </div>
          {recs.length === 0 ? (
            <EmptyState icon="🎯" title="No saved recommendations" description="Generate personalisation suggestions and save them to build your library." />
          ) : (
            recs.map((rec, i) => (
              <div key={rec.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    {rec.createdAt && <div style={{ fontSize: 11, color: "#52525b", marginBottom: 4 }}>{new Date(rec.createdAt).toLocaleDateString()}</div>}
                    {rec.description && <div style={{ fontSize: 12, color: "#818cf8", marginBottom: 6 }}>{rec.description.slice(0, 80)}…</div>}
                    <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{(rec.content || "").slice(0, 250)}{(rec.content || "").length > 250 ? "…" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(rec.content || "")}>Copy</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteRec(rec.id)} disabled={deleting === rec.id}>{deleting === rec.id ? "…" : "Delete"}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Personalisation Principles</div>
            {[
              { t: "Personalisation lifts conversion by 10-30%",   d: "McKinsey data: personalisation drives 10-15% revenue uplift. The range varies by category — fashion sees up to 30%, electronics 10-12%. The key is relevance, not just 'hello, [first name]'." },
              { t: "'Customers also bought' is still the best algo", d: "Collaborative filtering (show what similar customers bought) consistently outperforms content-based recommendations. Start here before anything else." },
              { t: "Context > segment for recommendations",         d: "Where someone is in the buying journey matters more than their segment. A first-time visitor needs social proof. A returning browser needs urgency. A post-purchase customer needs upsell." },
              { t: "Test personalisation properly",                 d: "Many 'personalised' experiences aren't tested rigorously. Run A/B tests with statistical significance. A blank control (no personalisation) is your baseline." },
              { t: "GDPR and personalisation",                      d: "You need consent for personalisation based on tracking across sites. First-party Shopify data (purchase history, browse history on your own site) requires less friction than third-party retargeting." },
              { t: "Email personalisation ROI",                     d: "Personalised subject lines increase open rates by 26% (Campaign Monitor). Personalised email content increases click rates by 14% and conversions by 10%." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🎯</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
