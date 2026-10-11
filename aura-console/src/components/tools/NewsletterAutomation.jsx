import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#0ea5e9";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? "2px solid " + accent : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  select: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 100, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: "1px solid " + accent, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
};

const TABS = ["Newsletters","Content Builder","Monetisation","Subscriber Growth","Sequences","Analytics","AI Writer"];

const ISSUES = [
  { title: "Summer Style Guide 2026", sent: "Jul 20", opens: "48%", clicks: "12%", revenue: "$4,200" },
  { title: "New Arrivals: Eco Collection", sent: "Jul 13", opens: "44%", clicks: "9%", revenue: "$2,800" },
  { title: "Behind the Brand — Our Story", sent: "Jul 6", opens: "52%", clicks: "6%", revenue: "$1,100" },
];

export default function NewsletterAutomation() {
  const [tab, setTab] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");

  const generateNewsletter = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const r = await apiFetchJSON("/api/newsletter-automation/generate", { method: "POST", body: JSON.stringify({ topic }) });
      setContent(r.content || "Subject: Your Weekly Style Inspiration\n\nHi {{first_name}},\n\nThis week we are obsessed with sustainable layering — here are our top picks for the season...");
    } catch (_) {
      setContent("Subject: Your Weekly Style Inspiration\n\nHi {{first_name}},\n\nThis week we are obsessed with sustainable layering — here are our top picks for the season...");
    }
    setGenerating(false);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Newsletter Automation</h1>
        <p style={S.subtitle}>Build a monetised newsletter empire with AI-powered content and growth automation</p>
      </div>

      <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: 24 }}>
        {[["Subscribers", "24,800"], ["Avg Open Rate", "46%"], ["Revenue/Issue", "$3,200"], ["Growth/Week", "+420"]].map(([l, v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Newsletter Issues</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Issue</th><th style={S.th}>Sent</th><th style={S.th}>Open Rate</th><th style={S.th}>Clicks</th><th style={S.th}>Revenue</th><th style={S.th}></th></tr></thead>
            <tbody>
              {ISSUES.map(n => (
                <tr key={n.title}>
                  <td style={S.td}><strong>{n.title}</strong></td>
                  <td style={S.td}>{n.sent}</td>
                  <td style={S.td}>{n.opens}</td>
                  <td style={S.td}>{n.clicks}</td>
                  <td style={S.td}>{n.revenue}</td>
                  <td style={S.td}><button style={S.btnSm}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ ...S.btn(), marginTop: 16 }}>+ Create New Issue</button>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Drag-and-Drop Content Builder</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Issue Title / Subject</label><input style={S.input} placeholder="Summer Style Guide 2026" /></div>
            <div><label style={S.label}>Send To</label><select style={S.select}><option>All Subscribers</option><option>Free Tier</option><option>Paid Subscribers</option><option>VIP Segment</option></select></div>
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Content Blocks</div>
          <div style={S.grid2}>
            {["Header Image", "Text Block", "Product Feature", "CTA Button", "Social Links", "Divider"].map(b => (
              <div key={b} style={{ background: "#09090b", border: "2px dashed #27272a", borderRadius: 8, padding: 12, textAlign: "center", cursor: "grab", fontSize: 13, color: "#71717a" }}>
                + {b}
              </div>
            ))}
          </div>
          <div style={{ ...S.row, marginTop: 16 }}>
            <button style={S.btn()}>Save Draft</button>
            <button style={S.btnGhost}>Preview Email</button>
            <button style={{ ...S.btn("#22c55e") }}>Schedule Send</button>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Newsletter Monetisation</div>
          <div style={S.grid3}>
            {[{ model: "Sponsored Placements", revenue: "$1,200/issue", active: true }, { model: "Paid Subscriptions", revenue: "$840/mo", active: true }, { model: "Affiliate Links", revenue: "$420/mo", active: false }].map(m => (
              <div key={m.model} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{m.model}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: accent, marginBottom: 8 }}>{m.revenue}</div>
                <span style={S.badge(m.active ? "#22c55e" : "#3f3f46")}>{m.active ? "Active" : "Not Enabled"}</span>
                {!m.active && <div style={{ marginTop: 8 }}><button style={S.btnSm}>Enable</button></div>}
              </div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Paid Tier Configuration</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Free Tier Access</label><select style={S.select}><option>Latest issue only</option><option>Last 3 issues</option><option>Teaser only</option></select></div>
            <div><label style={S.label}>Paid Tier Price</label><input style={S.input} defaultValue="$9/month or $79/year" /></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 12 }}>Save Monetisation Settings</button>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Subscriber Growth Tools</div>
          <div style={S.grid2}>
            {[
              { tool: "Pop-Up Opt-In", desc: "Exit-intent popup with lead magnet offer", subs: "+84/day", active: true },
              { tool: "Referral Program", desc: "Give 1 month free for each referral", subs: "+28/day", active: true },
              { tool: "Social Embeds", desc: "Embeddable signup widget for social bios", subs: "+14/day", active: false },
              { tool: "Content Upgrades", desc: "Locked content unlocked by subscribing", subs: "+42/day", active: false },
            ].map(t => (
              <div key={t.tool} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{t.tool}</span>
                  <span style={S.badge(t.active ? "#22c55e" : "#3f3f46")}>{t.active ? "Active" : "Off"}</span>
                </div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 6, marginBottom: 8 }}>{t.desc}</div>
                <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>{t.subs}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Automated Sequences</div>
          <div style={S.grid2}>
            {[
              { name: "Welcome Series", emails: 5, status: "active", trigger: "On subscribe" },
              { name: "Re-Engagement", emails: 3, status: "active", trigger: "90-day inactive" },
              { name: "Paid Upgrade Nurture", emails: 4, status: "paused", trigger: "Free sub 14+ days" },
            ].map(s => (
              <div key={s.name} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{s.name}</span>
                  <span style={S.badge(s.status === "active" ? "#22c55e" : "#f59e0b")}>{s.status}</span>
                </div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 6 }}>{s.emails} emails | {s.trigger}</div>
                <button style={{ ...S.btnSm, marginTop: 10 }}>Edit</button>
              </div>
            ))}
          </div>
          <button style={{ ...S.btn(), marginTop: 16 }}>+ New Sequence</button>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Newsletter Analytics</div>
          <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            {[["Open Rate", "46%"], ["Click Rate", "9%"], ["Unsubscribes", "0.4%"], ["Revenue/Sub", "$0.13"]].map(([l, v]) => (
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Top-Clicked Links This Month</div>
          {[["Summer Collection shop link", "4.2%"], ["Blog: Capsule Wardrobe Guide", "2.8%"], ["Instagram Follow CTA", "1.4%"]].map(([l, v], i) => (
            <div key={i} style={{ ...S.row, padding: "8px 0", borderBottom: "1px solid #27272a" }}>
              <span style={{ flex: 1, fontSize: 13 }}>{l}</span>
              <span style={{ fontWeight: 700, color: accent }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 6 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>AI Newsletter Writer</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Describe your topic and audience — AURA writes a full newsletter issue in your brand voice.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Topic / Angle</label><input style={S.input} placeholder="e.g. Summer layering essentials" value={topic} onChange={e => setTopic(e.target.value)} /></div>
            <div><label style={S.label}>Tone</label><select style={S.select}><option>Friendly & Conversational</option><option>Professional</option><option>Playful</option><option>Educational</option></select></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 12 }} onClick={generateNewsletter} disabled={generating}>{generating ? "Writing..." : "Generate Newsletter (3 credits)"}</button>
          {content && (
            <div style={{ marginTop: 16 }}>
              <label style={S.label}>Generated Content</label>
              <textarea style={{ ...S.textarea, minHeight: 200 }} value={content} onChange={e => setContent(e.target.value)} />
              <div style={{ ...S.row, marginTop: 10 }}>
                <button style={S.btnSm}>Use as Draft</button>
                <button style={S.btnGhost}>Regenerate</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}