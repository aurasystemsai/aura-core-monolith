import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#22c55e";
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
  pagePreview: { background: "#0d0d10", border: "1px solid #27272a", borderRadius: 10, padding: 20, minHeight: 200 },
  sectionBlock: { border: "2px dashed #3f3f46", borderRadius: 8, padding: 12, marginBottom: 8, cursor: "move", textAlign: "center", color: "#71717a", fontSize: 13 },
};

const TABS = ["My Pages", "Builder", "A/B Tests", "Templates", "Analytics", "SEO Settings", "Publish"];

const PAGES = [
  { name: "Summer Sale 2026", url: "/summer-sale", visits: 4820, conv: "8.4%", status: "live" },
  { name: "New Arrivals — Eco Line", url: "/eco-launch", visits: 2840, conv: "6.1%", status: "live" },
  { name: "VIP Early Access", url: "/vip", visits: 840, conv: "22%", status: "testing" },
  { name: "Black Friday 2026", url: "/bf26", visits: 0, conv: "—", status: "draft" },
];

export default function LandingPageBuilder() {
  const [tab, setTab] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [pageGoal, setPageGoal] = useState("");

  const generatePage = async () => {
    if (!pageGoal.trim()) return;
    setGenerating(true);
    try { await apiFetchJSON("/api/landing-page-builder/generate", { method: "POST", body: JSON.stringify({ goal: pageGoal }) }); } catch (_) {}
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Landing Page Builder</h1>
        <p style={S.subtitle}>High-converting landing pages with AI copy, A/B testing, and real-time analytics</p>
      </div>

      <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: 24 }}>
        {[["Live Pages", "12"], ["Visits This Month", "28,400"], ["Avg Conv. Rate", "9.2%"], ["Revenue Attributed", "$84,200"]].map(([l, v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>My Landing Pages</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Page</th><th style={S.th}>URL</th><th style={S.th}>Visits</th><th style={S.th}>Conv. Rate</th><th style={S.th}>Status</th><th style={S.th}></th></tr></thead>
            <tbody>
              {PAGES.map(p => (
                <tr key={p.name}>
                  <td style={S.td}><strong>{p.name}</strong></td>
                  <td style={S.td}><code style={{ color: "#71717a" }}>{p.url}</code></td>
                  <td style={S.td}>{p.visits.toLocaleString()}</td>
                  <td style={S.td}>{p.conv}</td>
                  <td style={S.td}><span style={S.badge(p.status === "live" ? "#22c55e" : p.status === "testing" ? "#f59e0b" : "#3f3f46")}>{p.status}</span></td>
                  <td style={S.td}><div style={S.row}><button style={S.btnSm}>Edit</button><button style={{ ...S.btnSm, background: "#27272a" }}>Duplicate</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ ...S.btn(), marginTop: 16 }}>+ New Page</button>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Visual Builder</div>
          <div style={S.grid2}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Sections</div>
              {["Hero Section", "Features Grid", "Social Proof", "Product Showcase", "FAQ Accordion", "CTA Footer"].map(s => (
                <div key={s} style={S.sectionBlock}>{s}</div>
              ))}
              <button style={{ ...S.btnGhost, width: "100%", marginTop: 8 }}>+ Add Section</button>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Preview</div>
              <div style={S.pagePreview}>
                <div style={{ background: "#18181b", borderRadius: 8, padding: 20, textAlign: "center", marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Your Headline Here</div>
                  <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Your compelling subheadline goes here</div>
                  <button style={{ ...S.btn(), fontSize: 13, padding: "8px 16px" }}>Shop Now</button>
                </div>
                <div style={{ background: "#18181b", borderRadius: 8, padding: 12, textAlign: "center", fontSize: 12, color: "#71717a" }}>Features Grid</div>
              </div>
            </div>
          </div>
          <div style={{ ...S.row, marginTop: 16 }}>
            <button style={S.btn()}>Save</button>
            <button style={S.btnGhost}>Preview Full Page</button>
            <button style={{ ...S.btn("#6366f1") }} onClick={generatePage} disabled={generating}>{generating ? "Generating..." : "AI Generate Page (3 credits)"}</button>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>A/B Test Manager</div>
          <div style={S.grid2}>
            {[
              { page: "Summer Sale 2026", variant: "Headline Test", varA: "Summer Sale — Up to 50% Off", varB: "Shop Our Biggest Sale Ever", winner: "B", lift: "+18% conv", status: "completed" },
              { page: "VIP Early Access", variant: "CTA Button", varA: "Get Early Access", varB: "Join the VIP List", winner: null, lift: "Running...", status: "running" },
            ].map((t, i) => (
              <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{t.page}</span>
                  <span style={S.badge(t.status === "completed" ? "#22c55e" : accent)}>{t.status}</span>
                </div>
                <div style={{ fontSize: 12, color: "#71717a", marginTop: 6, marginBottom: 10 }}>{t.variant}</div>
                <div style={{ fontSize: 13, marginBottom: 4 }}><strong>A:</strong> {t.varA}</div>
                <div style={{ fontSize: 13, marginBottom: 10 }}><strong>B:</strong> {t.varB}</div>
                {t.winner && <div style={{ fontWeight: 700, color: "#22c55e" }}>Winner: Variant {t.winner} ({t.lift})</div>}
                {!t.winner && <div style={{ color: "#f59e0b", fontSize: 13 }}>{t.lift}</div>}
              </div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>New A/B Test</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Page</label><select style={S.select}><option>Summer Sale 2026</option><option>VIP Early Access</option></select></div>
            <div><label style={S.label}>What to Test</label><select style={S.select}><option>Headline</option><option>CTA Button</option><option>Hero Image</option><option>Entire Page Layout</option></select></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 12 }}>Start A/B Test</button>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Page Templates</div>
          <div style={S.grid3}>
            {[
              { name: "Flash Sale", conv: "8.4% avg", category: "E-commerce" },
              { name: "Product Launch", conv: "12% avg", category: "Launch" },
              { name: "Email Capture", conv: "22% avg", category: "Lead Gen" },
              { name: "Webinar Sign-Up", conv: "18% avg", category: "Events" },
              { name: "Limited Offer", conv: "9% avg", category: "Urgency" },
              { name: "VIP Access", conv: "28% avg", category: "Exclusivity" },
            ].map(t => (
              <div key={t.name} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>{t.category} | {t.conv}</div>
                <button style={S.btnSm}>Use Template</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Page Analytics</div>
          <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            {[["Unique Visitors", "28,400"], ["Conversions", "2,613"], ["Bounce Rate", "42%"], ["Avg Time on Page", "2m 48s"]].map(([l, v]) => (
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Heatmap Insights</div>
          <div style={{ background: "#09090b", borderRadius: 8, padding: 16, fontSize: 13, color: "#a1a1aa" }}>
            Scroll depth: 68% of visitors reach the CTA section. Click concentration: 84% of clicks are on the primary CTA button. Exit rate highest at: below the fold (product features section — consider moving CTA higher).
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>SEO Settings</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Page Title</label><input style={S.input} placeholder="Summer Sale 2026 — Up to 50% Off | Brand Name" /></div>
            <div><label style={S.label}>Meta Description</label><input style={S.input} placeholder="Shop our biggest summer sale with up to 50% off sustainable fashion..." /></div>
            <div><label style={S.label}>Canonical URL</label><input style={S.input} placeholder="https://yourstore.com/summer-sale" /></div>
            <div><label style={S.label}>OG Image</label><input style={S.input} placeholder="Upload or paste URL" /></div>
            <div><label style={S.label}>Index / Follow</label><select style={S.select}><option>Index, Follow</option><option>NoIndex, Follow</option><option>NoIndex, NoFollow</option></select></div>
            <div><label style={S.label}>Schema Type</label><select style={S.select}><option>WebPage</option><option>Product</option><option>Event</option><option>Offer</option></select></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 16 }}>Save SEO Settings</button>
        </div>
      )}

      {tab === 6 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Publish Settings</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Page URL</label><input style={S.input} placeholder="/summer-sale-2026" /></div>
            <div><label style={S.label}>Custom Domain</label><input style={S.input} placeholder="sale.yourstore.com" /></div>
            <div><label style={S.label}>Password Protection</label><select style={S.select}><option>None</option><option>Password Required</option></select></div>
            <div><label style={S.label}>Expiry Date</label><input style={S.input} type="date" /></div>
          </div>
          <div style={S.divider} />
          <div style={S.row}>
            <button style={S.btn()}>Publish Now</button>
            <button style={S.btnGhost}>Schedule Publish</button>
            <button style={{ ...S.btn("#ef4444") }}>Unpublish</button>
          </div>
        </div>
      )}
    </div>
  );
}