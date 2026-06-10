import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/customer-data-platform";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "profiles",  label: "Profiles" },
  { id: "segments",  label: "Segments" },
  { id: "guide",     label: "CDP Guide" },
];

export default function CustomerDataPlatform() {
  const [tab, setTab]       = useState("profiles");
  const [profiles, setProfiles] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [newProfile, setNewProfile] = useState({ email: "", name: "", source: "Manual" });
  const setNP = (k, v) => setNewProfile(p => ({ ...p, [k]: v }));

  useEffect(() => { loadProfiles(); loadSegments(); }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/profiles`);
      if (Array.isArray(r)) setProfiles(r);
      else if (r.profiles) setProfiles(r.profiles);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const loadSegments = async () => {
    try {
      const r = await apiFetchJSON(`${API}/segments`);
      if (Array.isArray(r)) setSegments(r);
      else if (r.segments) setSegments(r.segments);
    } catch {}
  };

  const createProfile = async () => {
    if (!newProfile.email.trim()) { setError("Email required"); return; }
    try {
      await apiFetchJSON(`${API}/profiles`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newProfile) });
      setNewProfile({ email: "", name: "", source: "Manual" });
      loadProfiles();
    } catch (e) { setError(e.message); }
  };

  const deleteProfile = async (id) => {
    try {
      await apiFetchJSON(`${API}/profiles/${id}`, { method: "DELETE" });
      setProfiles(p => p.filter(pr => pr.id !== id));
    } catch {}
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Customer Data Platform</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Unified customer profiles, event tracking, and behavioural segmentation. The single source of truth for all customer intelligence across your Shopify store.</p>
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "profiles" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Profile</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input style={S.input} value={newProfile.name} onChange={e => setNP("name", e.target.value)} placeholder="Full name" />
              <input style={{ ...S.input, flex: 2 }} value={newProfile.email} onChange={e => setNP("email", e.target.value)} placeholder="Email address" />
              <button style={S.btn("primary")} onClick={createProfile}>Add Profile</button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{profiles.length} profiles</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadProfiles}>Refresh</button>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : profiles.length === 0 ? (
            <EmptyState icon="👤" title="No customer profiles" description="Add a profile manually or they will be created automatically from Shopify orders." />
          ) : (
            profiles.slice(0, 50).map((p, i) => (
              <div key={p.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{p.name || p.email || "Unknown"}</div>
                    {p.email && p.name && <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{p.email}</div>}
                    {p.source && <span style={{ background: "#27272a", color: "#a1a1aa", padding: "1px 7px", borderRadius: 4, fontSize: 11, marginTop: 4, display: "inline-block" }}>{p.source}</span>}
                    <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                      {p.totalOrders != null && <span style={{ fontSize: 11, color: "#71717a" }}>Orders: {p.totalOrders}</span>}
                      {p.totalSpend != null  && <span style={{ fontSize: 11, color: "#71717a" }}>Spend: £{p.totalSpend?.toFixed?.(2) ?? p.totalSpend}</span>}
                    </div>
                  </div>
                  <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteProfile(p.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "segments" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{segments.length} segments</div>
          </div>
          {segments.length === 0 ? (
            <>
              <EmptyState icon="🎯" title="No segments defined" description="Segments are created automatically from customer behaviour patterns." />
              <div style={{ ...S.card, marginTop: 16 }}>
                <div style={S.sectionTitle}>Built-in Segment Examples</div>
                {[
                  { name: "Champions",          desc: "Purchased recently, buy often, spend the most", color: "#166534", text: "#4ade80" },
                  { name: "Loyal Customers",    desc: "Buy regularly, somewhat recently", color: "#1e3a5f", text: "#60a5fa" },
                  { name: "At Risk",            desc: "Used to buy frequently but haven't purchased recently", color: "#3d2a0a", text: "#fbbf24" },
                  { name: "Lost",               desc: "Lowest recency, frequency, and spend scores", color: "#3f1315", text: "#f87171" },
                  { name: "Potential Loyalists", desc: "Recent customers with average frequency", color: "#1e1b4b", text: "#818cf8" },
                ].map(seg => (
                  <div key={seg.name} style={S.row}>
                    <span style={{ background: seg.color, color: seg.text, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{seg.name}</span>
                    <div style={{ fontSize: 12, color: "#a1a1aa" }}>{seg.desc}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            segments.map((seg, i) => (
              <div key={seg.id || i} style={S.card}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{seg.name}</div>
                {seg.description && <div style={{ fontSize: 12, color: "#71717a", marginTop: 3 }}>{seg.description}</div>}
                {seg.count != null && <div style={{ fontSize: 12, color: "#52525b", marginTop: 3 }}>{seg.count} customers</div>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Customer Data Platform Essentials</div>
            {[
              { t: "First-party data is your most valuable asset",  d: "iOS 14+, cookie deprecation, and privacy changes have made third-party data less reliable. Your own customer data — emails, purchase history, behaviour — is becoming the primary competitive advantage." },
              { t: "Unified profiles unlock personalisation",       d: "Connecting a customer's email interactions, website behaviour, purchase history, and support tickets into one profile enables personalisation at scale. Fragmented data = generic experiences." },
              { t: "RFM is the foundation of customer analytics",   d: "Recency, Frequency, Monetary — these three dimensions explain 80% of customer behaviour patterns. Every CDP strategy should start with RFM segmentation." },
              { t: "Behavioural events > demographic data",         d: "What customers DO (add to cart, view product 3 times, abandon checkout) is 5× more predictive than who they ARE (age, location, gender)." },
              { t: "Data quality before quantity",                  d: "1,000 clean, enriched profiles with accurate email, purchase history, and engagement data is worth more than 100,000 records with 40% invalid emails and missing history." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>👤</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function FeedbackModal({ open, onClose, onSubmit }) {
 const [text, setText] = React.useState('');
 if (!open) return null;
 return (
 <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
 <div style={{ background: '#09090b', borderRadius: 14, padding: 28, minWidth: 340, boxShadow: '0 8px 32px #000a'}}>
 <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: '#f4f4f5'}}>Send Feedback</div>
 <textarea value={text} onChange={e => setText(e.target.value)} rows={4} style={{ width: '100%', background: '#27272a', color: '#f4f4f5', border: '1px solid #52525b', borderRadius: 8, padding: 10, fontSize: 14, boxSizing: 'border-box'}} placeholder='Share your feedback...'/>
 <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
 <button onClick={() => { onSubmit(text); setText(''); }} disabled={!text} style={{ background: '#4f46e5', color: '#09090b', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer'}}>Submit</button>
 <button onClick={onClose} style={{ background: '#52525b', color: '#f4f4f5', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, cursor: 'pointer'}}>Cancel</button>
 </div>
 </div>
 </div>
 );
}

