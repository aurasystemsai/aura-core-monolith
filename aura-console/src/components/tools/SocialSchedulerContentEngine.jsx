import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/social-scheduler-content-engine";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "create",   label: "Create & Schedule" },
  { id: "calendar", label: "Content Calendar" },
  { id: "history",  label: "Post History" },
  { id: "guide",    label: "Strategy Guide" },
];

const PLATFORMS = ["Instagram", "Facebook", "X (Twitter)", "LinkedIn", "TikTok", "Pinterest"];
const CONTENT_TYPES = ["Product Promotion", "Educational", "Behind the Scenes", "User-Generated Content", "Trending Hook", "Brand Story"];

const POSTING_TIMES = [
  { platform: "Instagram",    best: "Tue-Fri, 9-11am & 7-9pm",  note: "Reels get 2× reach in first 30 mins" },
  { platform: "Facebook",     best: "Tue-Thu, 1-4pm",            note: "Video posts get 3× organic reach" },
  { platform: "X (Twitter)",  best: "Weekdays, 9am-3pm",         note: "Threads outperform single tweets 4:1" },
  { platform: "LinkedIn",     best: "Tue-Thu, 8-10am & 5-6pm",   note: "Native video gets 3× more engagement" },
  { platform: "TikTok",       best: "Daily, 6-9am & 7-11pm",     note: "First 30 minutes determine viral potential" },
  { platform: "Pinterest",    best: "Sat-Sun, 2-4pm",            note: "Pins have 6-month average lifespan" },
];

export default function SocialSchedulerContentEngine() {
  const [tab, setTab]           = useState("create");
  const [content, setContent]   = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [contentType, setType]  = useState("Product Promotion");
  const [result, setResult]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const r = await apiFetchJSON(`${API}/history`);
      if (r.ok) setHistory(r.history || []);
    } catch {}
  };

  const schedule = async () => {
    if (!content.trim()) return;
    setLoading(true); setError(""); setResult(null);
    const enrichedContent = `Platform: ${platform}\nContent Type: ${contentType}\n\nContent:\n${content}`;
    try {
      const r = await apiFetchJSON(`${API}/ai/schedule`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: enrichedContent }),
      });
      if (!r.ok) throw new Error(r.error || "Schedule failed");
      setResult(r.scheduledContent || r.result || "");
      loadHistory();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "social-posts.json"; a.click();
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Social Scheduler & Content Engine</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered social media content creation and scheduling. Generate platform-optimised posts, best posting time recommendations, hashtag strategies, and a 30-day content calendar.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* CREATE & SCHEDULE */}
      {tab === "create" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>PLATFORM</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {PLATFORMS.map(p => (
                    <button key={p} style={{ ...S.btn(p === platform ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setPlatform(p)}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>CONTENT TYPE</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {CONTENT_TYPES.map(t => (
                    <button key={t} style={{ ...S.btn(t === contentType ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setType(t)}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={S.sectionTitle}>Content Brief or Raw Text</div>
            <textarea style={{ ...S.ta, minHeight: 120 }} value={content} onChange={e => setContent(e.target.value)} placeholder="Describe your content idea or paste raw copy…&#10;e.g. 'New collection launch: Midnight Blue denim jacket available now. Premium quality, sustainable materials. RRP $129.'" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={schedule} disabled={loading || !content.trim()}>{loading ? "Generating…" : "AI Schedule & Optimise"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setContent("")}>Clear</button>
            </div>
          </div>

          <ErrorBox message={error} />
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI Scheduled Content — {platform} · {contentType}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(result)}>Copy</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadHistory}>Refresh History</button>
                </div>
              </div>
              <pre style={S.pre}>{result}</pre>
            </div>
          )}
        </div>
      )}

      {/* CONTENT CALENDAR */}
      {tab === "calendar" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Optimal Posting Times by Platform</div>
            {POSTING_TIMES.map(pt => (
              <div key={pt.platform} style={S.row}>
                <div style={{ minWidth: 120, fontSize: 13, fontWeight: 700, color: "#818cf8" }}>{pt.platform}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#e4e4e7", fontWeight: 600 }}>{pt.best}</div>
                  <div style={{ fontSize: 11, color: "#71717a" }}>{pt.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>30-Day Content Framework</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14 }}>A proven weekly content mix for e-commerce brands.</p>
            {[
              { day: "Monday",    type: "Educational",             example: "'3 ways to style our [product]' — tips-based content drives saves" },
              { day: "Tuesday",   type: "Product Focus",           example: "Feature 1 product with lifestyle photography + CTA" },
              { day: "Wednesday", type: "User-Generated Content",  example: "Repost a customer photo/review with permission" },
              { day: "Thursday",  type: "Behind the Scenes",       example: "Show your process, packaging, or team — builds authenticity" },
              { day: "Friday",    type: "Promotional",             example: "Weekend deal or new arrival — highest purchase intent day" },
              { day: "Saturday",  type: "Engagement/Poll",         example: "Ask a question or run a poll — boosts algorithmic reach" },
              { day: "Sunday",    type: "Brand Story",             example: "Why you started, your values, your mission — emotional connection" },
            ].map(({ day, type, example }) => (
              <div key={day} style={{ display: "grid", gridTemplateColumns: "80px 160px 1fr", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{day}</span>
                <span style={{ color: "#818cf8", fontWeight: 600 }}>{type}</span>
                <span style={{ color: "#71717a", lineHeight: 1.4 }}>{example}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{history.length} scheduled posts</div>
            <div style={{ display: "flex", gap: 6 }}>
              {history.length > 0 && <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={exportHistory}>Export</button>}
              <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadHistory}>Refresh</button>
            </div>
          </div>
          {history.length === 0 ? (
            <EmptyState icon="📱" title="No scheduled posts yet" description="Create your first post in the Create & Schedule tab." />
          ) : (
            history.map((h, i) => (
              <div key={h.id || i} style={S.card}>
                <div style={{ fontSize: 11, color: "#52525b", marginBottom: 6 }}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : "Saved post"}</div>
                {h.content && <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Input: {h.content.slice(0, 100)}{h.content.length > 100 ? "…" : ""}</div>}
                {h.scheduledContent && <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{h.scheduledContent.slice(0, 200)}{h.scheduledContent.length > 200 ? "…" : ""}</div>}
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", marginTop: 8 }} onClick={() => navigator.clipboard?.writeText(h.scheduledContent || "")}>Copy</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* STRATEGY GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Social Media for E-Commerce: Key Principles</div>
            {[
              { t: "Social proof > product features",       d: "Customer photos, reviews and testimonials consistently outperform polished brand content. Build a UGC collection strategy from Day 1." },
              { t: "Consistency beats perfection",          d: "3 posts/week for 52 weeks beats 21 posts in 1 week. Algorithm rewards consistent posting cadence. Set a sustainable schedule you can maintain." },
              { t: "The first frame decides everything",    d: "On video platforms, the first 1-3 seconds determine watch time. Lead with the most interesting frame — product reveal, reaction shot, bold text." },
              { t: "Hashtags: depth over breadth",          d: "5-10 highly relevant hashtags outperform 30 random ones. Mix 3 niche (< 100k posts), 3 medium (100k-1M), and 2 broad (1M+) tags." },
              { t: "Comment engagement amplifies reach",   d: "Responding to comments within 1 hour significantly boosts algorithmic distribution. Set aside 15 minutes per post after publishing." },
              { t: "Link in bio is a campaign, not a link", d: "Change your link in bio to match every promotional post. Use link-in-bio tools to create a landing page rather than a single URL." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>📱</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

 const [input, setInput] = useState("");
 const [response, setResponse] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [history, setHistory] = useState([]);
 const [analytics, setAnalytics] = useState([]);
 const [imported, setImported] = useState(null);
 const [exported, setExported] = useState(null);
 const [feedback, setFeedback] = useState("");
 const fileInputRef = useRef();

 // Fetch history
 const fetchHistory = async () => {
 try {
 const res = await apiFetchJSON("/api/social-scheduler-content-engine/history");
 const data = res;
 if (data.ok) setHistory(data.history || []);
 } catch {}
 };
 // Fetch analytics
 const fetchAnalytics = async () => {
 try {
 const res = await apiFetchJSON("/api/social-scheduler-content-engine/analytics");
 const data = res;
 if (data.ok) setAnalytics(data.analytics || []);
 } catch {}
 };

 // AI Generate
 const handleRun = async () => {
 setLoading(true);
 setError("");
 setResponse("");
 try {
 const res = await apiFetchJSON("/api/social-scheduler-content-engine/ai/schedule", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ content: input })
 });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setResponse(data.scheduledContent || "No content scheduled");
 // Save to history
 await apiFetch("/api/social-scheduler-content-engine/history", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ content: input, scheduled: data.scheduledContent })
 });
 fetchHistory();
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // Import/Export
 const handleImport = e => {
 const file = e.target.files[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = async evt => {
 try {
 const res = await apiFetchJSON("/api/social-scheduler-content-engine/import", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ data: JSON.parse(evt.target.result) })
 });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setImported(file.name);
 fetchHistory();
 } catch (err) {
 setError(err.message);
 }
 };
 reader.readAsText(file);
 };
 const handleExport = () => {
 const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json"});
 const url = URL.createObjectURL(blob);
 setExported(url);
 setTimeout(() =>URL.revokeObjectURL(url), 10000);
 };

 // Feedback
 const handleFeedback = async () => {
 if (!feedback) return;
 setError("");
 try {
 await apiFetch("/api/social-scheduler-content-engine/feedback", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ feedback })
 });
 setFeedback("");
 } catch (err) {
 setError(err.message);
 }
 };

 useEffect(() => {
 fetchHistory();
 fetchAnalytics();
 }, []);

 return (
 <div style={{ background: "#09090b", color: "#f4f4f5", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif'}}>
 <BackButton />
 <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 8 }}>Social Scheduler Content Engine</h2>
 <div style={{ marginBottom: 10, color: "#0ea5e9", fontWeight: 600 }}>
 <span role="img"aria-label="sparkles"></span>Schedule, manage, and analyze social content with AI and analytics.
 </div>
 <textarea
 value={input}
 onChange={e => setInput(e.target.value)}
 rows={4}
 style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
 placeholder="Type your social content or prompt here..."aria-label="Social content input"/>
 <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
 <button onClick={handleRun} disabled={loading || !input} style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>{loading ? "Scheduling...": "AI Schedule"}</button>
 <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Import</button>
 <input ref={fileInputRef} type="file"accept=".json"style={{ display: "none"}} onChange={handleImport} aria-label="Import history"/>
 <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Export</button>
 {exported && <a href={exported} download="social-scheduler-history.json"style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
 </div>
 {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
 {response && (
 <div style={{ background: "#3f3f46", borderRadius: 10, padding: 16, marginBottom: 12, color: "#fafafa"}}>
 <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Scheduled Content:</div>
 <div>{response}</div>
 </div>
 )}
 {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
 <div style={{ marginTop: 24, background: "#f4f4f5", borderRadius: 12, padding: 18 }}>
 <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>History</div>
 <ul style={{ paddingLeft: 18 }}>
 {history.map(h => (
 <li key={h.id} style={{ marginBottom: 10 }}>
 <div><b>ID:</b> {h.id}</div>
 <div><b>Content:</b> {h.content}</div>
 <div><b>Scheduled:</b> {h.scheduled}</div>
 </li>
 ))}
 </ul>
 </div>
 <div style={{ marginTop: 24, background: "#f4f4f5", borderRadius: 12, padding: 18 }}>
 <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
 <div style={{ fontSize: 15, color: "#09090b"}}>
 {analytics.length ? (
 <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
 ) : (
 <span>No analytics yet. Generate or import history to see results.</span>
 )}
 </div>
 </div>
 <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#3f3f46", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
 <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
 <textarea
 value={feedback}
 onChange={e => setFeedback(e.target.value)}
 rows={2}
 style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #555", marginBottom: 12, background: "#09090b", color: "#f4f4f5"}}
 placeholder="Share your feedback or suggestions..."aria-label="Feedback input"/>
 <button type="submit"style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer"}}>Send Feedback</button>
 </form>
 </div>
 );
}



