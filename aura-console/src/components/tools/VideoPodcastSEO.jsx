import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#ef4444";
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
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 90, boxSizing: "border-box", resize: "vertical" },
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

const TABS = ["YouTube SEO","Video Optimizer","Podcast SEO","Transcript Mining","Thumbnail AI","Chapter Marks","Analytics"];

const VIDEOS = [
  { title: "Summer Collection 2026 Lookbook", views: 42800, rank: "#3", ctr: "8.4%", watch: "68%" },
  { title: "How to Style a Capsule Wardrobe", views: 28400, rank: "#7", ctr: "6.2%", watch: "72%" },
  { title: "Sustainable Fashion Guide 2026", views: 14200, rank: "#12", ctr: "4.1%", watch: "84%" },
];

export default function VideoPodcastSEO() {
  const [tab, setTab] = useState(0);
  const [optimizing, setOptimizing] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const optimize = async () => {
    if (!videoUrl.trim()) return;
    setOptimizing(true);
    try { await apiFetchJSON("/api/video-podcast-seo/optimize", { method: "POST", body: JSON.stringify({ url: videoUrl }) }); } catch (_) {}
    setTimeout(() => setOptimizing(false), 2000);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Video & Podcast SEO</h1>
        <p style={S.subtitle}>YouTube optimisation, podcast discoverability, transcript mining, and thumbnail AI</p>
      </div>

      <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: 24 }}>
        {[["YouTube Videos", "48"], ["Total Views", "284K"], ["Avg Watch Time", "72%"], ["Podcast Episodes", "24"]].map(([l, v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>YouTube Channel Performance</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Video</th><th style={S.th}>Views</th><th style={S.th}>Search Rank</th><th style={S.th}>CTR</th><th style={S.th}>Watch %</th><th style={S.th}></th></tr></thead>
            <tbody>
              {VIDEOS.map(v => (
                <tr key={v.title}>
                  <td style={S.td}>{v.title}</td>
                  <td style={S.td}>{v.views.toLocaleString()}</td>
                  <td style={S.td}><span style={S.badge(accent)}>{v.rank}</span></td>
                  <td style={S.td}>{v.ctr}</td>
                  <td style={S.td}>{v.watch}</td>
                  <td style={S.td}><button style={S.btnSm}>Optimise</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>AI Video Optimiser</div>
          <div style={S.row}>
            <input style={{ ...S.input, flex: 1 }} placeholder="Paste YouTube URL..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
            <button style={S.btn()} onClick={optimize} disabled={optimizing}>{optimizing ? "Analysing..." : "Optimise (3 credits)"}</button>
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Optimisation Checklist</div>
          {[
            { item: "Title contains primary keyword in first 60 chars", score: "pass" },
            { item: "Description has keyword in first 2 lines", score: "pass" },
            { item: "25+ tags including long-tail variations", score: "fail" },
            { item: "Custom thumbnail (not auto-generated)", score: "pass" },
            { item: "Chapters defined with timestamps", score: "warning" },
            { item: "Closed captions / transcript uploaded", score: "fail" },
            { item: "End screen elements configured", score: "pass" },
            { item: "Cards added at key engagement moments", score: "warning" },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #27272a" }}>
              <span style={S.badge(c.score === "pass" ? "#22c55e" : c.score === "warning" ? "#f59e0b" : "#ef4444")}>{c.score}</span>
              <span style={{ fontSize: 13 }}>{c.item}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Podcast SEO & Discoverability</div>
          <div style={S.grid3}>
            {[["Spotify Ranking", "#18 Fashion"], ["Apple Podcasts", "#22 Lifestyle"], ["Avg Listen Rate", "74%"]].map(([l, v]) => (
              <div key={l} style={S.metricCard}><div style={{ ...S.metricNum, fontSize: 18 }}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Episode Optimiser</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Episode Title</label><input style={S.input} placeholder="Ep. 24: Sustainable Fashion in 2026" /></div>
            <div><label style={S.label}>Target Keyword</label><input style={S.input} placeholder="sustainable fashion tips" /></div>
          </div>
          <textarea style={{ ...S.textarea, marginTop: 12 }} placeholder="Episode description (include keywords naturally in first 2 sentences)..." />
          <button style={{ ...S.btn(), marginTop: 12 }}>AI Optimise Episode (2 credits)</button>
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Transcript Mining</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Extract keywords, topics, and blog post ideas automatically from video/podcast transcripts.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Upload Transcript / Paste URL</label><textarea style={{ ...S.textarea, height: 160 }} placeholder="Paste transcript text or YouTube URL..." /></div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Extracted Insights</div>
              {[
                { type: "Primary Topic", val: "Sustainable fashion trends 2026" },
                { type: "Keywords Found", val: "eco-friendly, capsule wardrobe, slow fashion, organic cotton" },
                { type: "Blog Post Ideas", val: "3 ideas generated" },
                { type: "FAQ Opportunities", val: "7 questions detected" },
              ].map(m => (
                <div key={m.type} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#71717a" }}>{m.type}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>
          <button style={S.btn()}>Mine Transcript (2 credits)</button>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Thumbnail AI Analyser</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>AI analyses your thumbnail for click-through rate potential using computer vision and CTR prediction models.</p>
          <div style={{ border: "2px dashed #27272a", borderRadius: 12, padding: 40, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
            <div style={{ fontWeight: 600 }}>Drop thumbnail image to analyse</div>
            <div style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>JPG / PNG, 1280x720 recommended</div>
          </div>
          <div style={S.grid2}>
            {[
              { factor: "Face Visibility", score: "High", impact: "Increases CTR by 38%", color: "#22c55e" },
              { factor: "Text Readability", score: "Good", impact: "Font size and contrast OK", color: "#22c55e" },
              { factor: "Emotional Expression", score: "Neutral", impact: "Add surprise/excitement for +12% CTR", color: "#f59e0b" },
              { factor: "Brand Consistency", score: "Pass", impact: "Colours match channel brand", color: "#22c55e" },
            ].map(f => (
              <div key={f.factor} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 14 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{f.factor}</span>
                  <span style={S.badge(f.color)}>{f.score}</span>
                </div>
                <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 6 }}>{f.impact}</div>
              </div>
            ))}
          </div>
          <button style={{ ...S.btn(), marginTop: 16 }}>Analyse Thumbnail (2 credits)</button>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>AI Chapter Mark Generator</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Auto-generate timestamp chapters from transcripts — improves SEO and watch time.</p>
          <input style={S.input} placeholder="Paste YouTube URL or transcript..." />
          <button style={{ ...S.btn(), marginTop: 12 }}>Generate Chapters (2 credits)</button>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Sample Output</div>
          {["0:00 Introduction", "1:24 What is sustainable fashion?", "4:12 Top eco-friendly brands in 2026", "8:44 Building a capsule wardrobe", "14:30 Shopping tips and budget advice", "19:00 Summary & next steps"].map((c, i) => (
            <div key={i} style={{ ...S.row, padding: "8px 0", borderBottom: "1px solid #27272a", fontFamily: "monospace", fontSize: 13 }}>{c}</div>
          ))}
          <button style={{ ...S.btnSm, marginTop: 12 }}>Copy to YouTube</button>
        </div>
      )}

      {tab === 6 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Video & Podcast Analytics</div>
          <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            {[["Watch Time (hrs)", "12,400"], ["Subscriber Growth", "+284"], ["Avg View Duration", "4m 12s"], ["Revenue from Video", "$2,840"]].map(([l, v]) => (
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}