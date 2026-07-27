import React, { useState, useEffect, useCallback } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/omnichannel-campaign-builder";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  h1: { fontSize: 26, fontWeight: 800, margin: "0 0 4px" },
  sub: { color: "#71717a", fontSize: 14, margin: "0 0 24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 },
  badge: (s) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, background: s === "active" ? "#052e16" : s === "completed" ? "#1e3a5f" : "#27272a", color: s === "active" ? "#4ade80" : s === "completed" ? "#60a5fa" : "#a1a1aa" }),
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "10px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  row: { display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" },
  label: { fontSize: 12, color: "#71717a", marginBottom: 4 },
  err: { background: "#3f1315", border: "1px solid #7f1d1d", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontSize: 13, marginBottom: 12 },
  tabRow: { display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #27272a", paddingBottom: 12 },
  tab: (a) => ({ background: a ? "#4f46e5" : "transparent", color: a ? "#fafafa" : "#71717a", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }),
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  stat: { fontSize: 12, color: "#71717a" },
  channelBadge: { display: "inline-block", background: "#27272a", color: "#a1a1aa", borderRadius: 5, padding: "2px 7px", fontSize: 11, margin: "2px 3px 2px 0" },
  brief: { background: "#0c0c0e", border: "1px solid #27272a", borderRadius: 10, padding: "14px 16px", marginTop: 12, fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap" },
};

const TABS = [
  { id: "campaigns", label: "Campaigns" },
  { id: "channels", label: "Channels" },
  { id: "journey", label: "Journey Template" },
  { id: "brief", label: "AI Campaign Brief" },
];

export default function OmnichannelCampaignBuilder() {
  const [tab, setTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState([]);
  const [channels, setChannels] = useState([]);
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [briefForm, setBriefForm] = useState({ goal: "", audience: "", budget: "" });
  const [brief, setBrief] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [c, ch, j] = await Promise.all([
        apiFetchJSON(`${API}/campaigns`),
        apiFetchJSON(`${API}/channels`),
        apiFetchJSON(`${API}/journey-template`),
      ]);
      setCampaigns(c.campaigns || []);
      setChannels(ch.channels || []);
      setJourney(j.template || j);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generateBrief = async () => {
    if (!briefForm.goal.trim()) return;
    setBriefLoading(true);
    setErr(null);
    try {
      const r = await apiFetchJSON(`${API}/campaigns/brief`, { method: "POST", body: JSON.stringify(briefForm) });
      setBrief(r.brief || r);
    } catch (e) { setErr(e.message); }
    finally { setBriefLoading(false); }
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Omnichannel Campaign Builder</h1>
      <p style={S.sub}>Plan and launch coordinated campaigns across 7+ channels with AI-generated briefs and journey templates.</p>

      {err && <div style={S.err}>{err}</div>}

      <div style={S.tabRow}>
        {TABS.map(t => <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>)}
        <button style={{ ...S.btn(""), marginLeft: "auto", fontSize: 12, padding: "6px 14px" }} onClick={load}>↻ Refresh</button>
      </div>

      {tab === "campaigns" && (
        <div style={S.grid}>
          {loading && <p style={{ color: "#71717a" }}>Loading campaigns…</p>}
          {campaigns.map(c => (
            <div key={c.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                <span style={S.badge(c.status)}>{c.status}</span>
              </div>
              <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
                {c.revenue && <div><div style={S.label}>Revenue</div><div style={{ fontWeight: 700 }}>£{c.revenue?.toLocaleString()}</div></div>}
                {c.roas && <div><div style={S.label}>ROAS</div><div style={{ fontWeight: 700 }}>{c.roas}x</div></div>}
                {c.reach && <div><div style={S.label}>Reach</div><div style={{ fontWeight: 700 }}>{c.reach?.toLocaleString()}</div></div>}
              </div>
              <div style={{ marginTop: 4 }}>
                {(c.channels || []).map(ch => <span key={ch} style={S.channelBadge}>{ch}</span>)}
              </div>
            </div>
          ))}
          {!loading && campaigns.length === 0 && <p style={{ color: "#71717a" }}>No campaigns yet.</p>}
        </div>
      )}

      {tab === "channels" && (
        <div style={S.grid}>
          {channels.map((c, i) => (
            <div key={i} style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{c.name || c.channel}</div>
              {c.description && <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 8 }}>{c.description}</div>}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {c.avgRoas && <div><div style={S.label}>Avg ROAS</div><div style={{ fontWeight: 700 }}>{c.avgRoas}x</div></div>}
                {c.cpm && <div><div style={S.label}>CPM</div><div style={{ fontWeight: 700 }}>£{c.cpm}</div></div>}
                {c.bestFor && <div><div style={S.label}>Best For</div><div style={{ fontSize: 12, color: "#e4e4e7" }}>{c.bestFor}</div></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "journey" && (
        <div style={S.card}>
          {!journey && loading && <p style={{ color: "#71717a" }}>Loading journey template…</p>}
          {journey && (
            <>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{journey.name}</div>
              <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 16 }}>{journey.description}</div>
              {(journey.steps || []).map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #1f1f22" }}>
                  <div style={{ background: "#4f46e5", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{step.name}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{step.channel && <span style={S.channelBadge}>{step.channel}</span>} {step.timing || step.delay || ""}</div>
                    {step.message && <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 4 }}>{step.message}</div>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "brief" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Generate AI Campaign Brief</div>
          <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14 }}>Describe your campaign goal and audience. AI will generate a full omnichannel brief with estimated ROAS and channel allocation.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <input style={{ ...S.input, flex: "unset" }} placeholder="Campaign goal (e.g. summer sale, new product launch)" value={briefForm.goal} onChange={e => setBriefForm(f => ({ ...f, goal: e.target.value }))} />
            <input style={{ ...S.input, flex: "unset" }} placeholder="Target audience (e.g. female 25-45, eco-conscious shoppers)" value={briefForm.audience} onChange={e => setBriefForm(f => ({ ...f, audience: e.target.value }))} />
            <input style={{ ...S.input, flex: "unset" }} placeholder="Budget (e.g. £5,000)" value={briefForm.budget} onChange={e => setBriefForm(f => ({ ...f, budget: e.target.value }))} />
          </div>
          <button style={S.btn("primary")} onClick={generateBrief} disabled={briefLoading}>
            {briefLoading ? "Generating…" : "Generate Brief (2 credits)"}
          </button>
          {brief && (
            <div style={{ marginTop: 16 }}>
              {brief.title && <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{brief.title}</div>}
              {brief.summary && <div style={S.brief}>{brief.summary}</div>}
              {brief.channels && (
                <div style={{ marginTop: 12 }}>
                  <div style={S.sectionTitle}>Channel Allocation</div>
                  {brief.channels.map((c, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                      <span>{c.channel}</span>
                      <span style={{ color: "#4f46e5", fontWeight: 700 }}>{c.budget || c.allocation}</span>
                    </div>
                  ))}
                </div>
              )}
              {brief.estimatedRoas && <div style={{ marginTop: 12, fontSize: 14 }}>Estimated ROAS: <strong style={{ color: "#4ade80" }}>{brief.estimatedRoas}x</strong></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
