import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/social-scheduler-content-engine";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "create",   label: "Create & Schedule" },
  { id: "queue",    label: "Post Queue" },
  { id: "hashtags", label: "Hashtag Research" },
  { id: "calendar", label: "Content Calendar" },
  { id: "guide",    label: "Strategy Guide" },
];

const PLATFORMS       = ["Instagram", "Facebook", "X (Twitter)", "LinkedIn", "TikTok", "Pinterest"];
const CONTENT_TYPES   = ["Product Promotion", "Educational", "Behind the Scenes", "User-Generated Content", "Trending Hook", "Brand Story"];
const QUEUE_STATUSES  = ["Draft", "Scheduled", "Published", "Paused"];

const CHAR_LIMITS = { Instagram: 2200, Facebook: 63206, "X (Twitter)": 280, LinkedIn: 3000, TikTok: 2200, Pinterest: 500 };

const POSTING_TIMES = [
  { platform: "Instagram",   best: "Tue-Fri, 9-11am & 7-9pm",  note: "Reels get 2× reach in first 30 mins" },
  { platform: "Facebook",    best: "Tue-Thu, 1-4pm",            note: "Video posts get 3× organic reach" },
  { platform: "X (Twitter)", best: "Weekdays, 9am-3pm",         note: "Threads outperform single tweets 4:1" },
  { platform: "LinkedIn",    best: "Tue-Thu, 8-10am & 5-6pm",   note: "Native video gets 3× more engagement" },
  { platform: "TikTok",      best: "Daily, 6-9am & 7-11pm",     note: "First 30 minutes determine viral potential" },
  { platform: "Pinterest",   best: "Sat-Sun, 2-4pm",            note: "Pins have 6-month average lifespan" },
];

export default function SocialSchedulerContentEngine() {
  const [tab, setTab] = useState("create");

  // Create & Schedule
  const [content, setContent]   = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [contentType, setType]  = useState("Product Promotion");
  const [result, setResult]     = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Post Queue
  const [posts, setPosts]       = useState([]);
  const [pLoading, setPLoading] = useState(false);
  const [newPost, setNewPost]   = useState({ platform: "Instagram", caption: "", status: "Draft", scheduledAt: "" });
  const setP = (k, v) => setNewPost(p => ({ ...p, [k]: v }));

  // Hashtags
  const [hashTopic, setHashTopic]     = useState("");
  const [hashResult, setHashResult]   = useState(null);
  const [hashLoading, setHashLoading] = useState(false);

  const [error, setError] = useState("");

  const fetchPosts = useCallback(async () => {
    setPLoading(true);
    try { const r = await apiFetchJSON(`${API}/history`); if (r.ok) setPosts(r.history || r.posts || []); } catch {}
    setPLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const schedule = async () => {
    if (!content.trim()) return;
    setCreateLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/schedule`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Platform: ${platform}\nContent Type: ${contentType}\n\nContent:\n${content}` }),
      });
      if (!r.ok) throw new Error(r.error || "Schedule failed");
      setResult(r.scheduledContent || r.result || "");
      fetchPosts();
    } catch (e) { setError(e.message); }
    setCreateLoading(false);
  };

  const createPost = async () => {
    if (!newPost.caption.trim()) { setError("Caption required"); return; }
    setError("");
    try {
      await apiFetchJSON(`${API}/posts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPost, createdAt: new Date().toISOString() }),
      });
      fetchPosts();
      setNewPost({ platform: "Instagram", caption: "", status: "Draft", scheduledAt: "" });
    } catch (e) { setError(e.message); }
  };

  const updatePostStatus = async (id, status) => {
    try { await apiFetchJSON(`${API}/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); } catch {}
    setPosts(p => p.map(post => post.id === id ? { ...post, status } : post));
  };

  const deletePost = async (id) => {
    try { await apiFetchJSON(`${API}/posts/${id}`, { method: "DELETE" }); } catch {}
    setPosts(p => p.filter(post => post.id !== id));
  };

  const generateHashtags = async () => {
    if (!hashTopic.trim()) return;
    setHashLoading(true); setError(""); setHashResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/schedule`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Generate a comprehensive hashtag strategy for Instagram for a Shopify e-commerce brand in the "${hashTopic}" niche. Include:\n- 5 niche hashtags (<100k posts) for discoverability\n- 5 medium hashtags (100k-1M posts) for reach\n- 3 broad hashtags (1M+ posts) for exposure\n- 2 brand/campaign hashtags\n- 3 trending hashtags relevant to ${hashTopic} in 2026\n\nFor each hashtag, include approximate post count and best use case. Format as a clear structured list.` }),
      });
      if (!r.ok) throw new Error(r.error || "Hashtag generation failed");
      setHashResult(r.scheduledContent || r.result || "");
    } catch (e) { setError(e.message); }
    setHashLoading(false);
  };

  const charCount  = content.length;
  const charLimit  = CHAR_LIMITS[platform] || 2200;
  const charColor  = charCount > charLimit ? "#f87171" : charCount > charLimit * 0.8 ? "#fbbf24" : "#52525b";

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Social Scheduler & Content Engine</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          AI content creation and scheduling — generate platform-optimised posts, manage your post queue, research hashtags, and plan a 30-day content calendar.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Scheduled",  val: posts.filter(p => p.status === "Scheduled").length,  color: "#818cf8" },
          { label: "Published",  val: posts.filter(p => p.status === "Published").length,  color: "#4ade80" },
          { label: "Drafts",     val: posts.filter(p => p.status === "Draft").length,       color: "#fbbf24" },
          { label: "Total Posts", val: posts.length,                                        color: "#4f46e5" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── CREATE & SCHEDULE ── */}
      {tab === "create" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>PLATFORM</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {PLATFORMS.map(p => <button key={p} style={{ ...S.btn(p === platform ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setPlatform(p)}>{p}</button>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>CONTENT TYPE</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {CONTENT_TYPES.map(t => <button key={t} style={{ ...S.btn(t === contentType ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setType(t)}>{t}</button>)}
                </div>
              </div>
            </div>
            <div style={S.sectionTitle}>Content Brief or Raw Text</div>
            <textarea style={{ ...S.ta, minHeight: 120 }} value={content} onChange={e => setContent(e.target.value)} placeholder={`Describe your content idea or paste raw copy…\ne.g. 'New collection launch: Midnight Blue denim jacket available now. Sustainable materials, £129.'`} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: charColor }}>{charCount}/{charLimit} chars ({platform})</span>
              {charCount > charLimit && <span style={{ fontSize: 11, color: "#f87171", fontWeight: 700 }}>Over character limit for {platform}</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={schedule} disabled={createLoading || !content.trim()}>{createLoading ? "Generating…" : "AI Schedule & Optimise"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setContent(""); setResult(null); }}>Clear</button>
            </div>
          </div>
          {createLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {result && !createLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI Scheduled Content — {platform} · {contentType}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof result === "string" ? result : JSON.stringify(result))}>Copy</button>
                  <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={() => { setNewPost(p => ({ ...p, caption: typeof result === "string" ? result : JSON.stringify(result), platform })); setTab("queue"); }}>Add to Queue</button>
                </div>
              </div>
              <pre style={S.pre}>{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── POST QUEUE ── */}
      {tab === "queue" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add to Queue</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Platform</label>
                <select style={{ ...S.select, width: "100%" }} value={newPost.platform} onChange={e => setP("platform", e.target.value)}>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Status</label>
                <select style={{ ...S.select, width: "100%" }} value={newPost.status} onChange={e => setP("status", e.target.value)}>{QUEUE_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Scheduled Date/Time</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newPost.scheduledAt} onChange={e => setP("scheduledAt", e.target.value)} type="datetime-local" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Caption *</label>
              <textarea style={{ ...S.ta, minHeight: 80 }} value={newPost.caption} onChange={e => setP("caption", e.target.value)} placeholder="Post caption, hashtags, CTAs…" />
            </div>
            <button style={S.btn("primary")} onClick={createPost}>Add to Queue</button>
          </div>

          {pLoading ? <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
            : posts.length === 0 ? <EmptyState icon="📅" title="No posts queued" description="Add posts above or generate content in the Create tab and send to queue." />
            : posts.map((post, i) => (
              <div key={post.id || i} style={{ ...S.card, borderLeft: `3px solid ${post.status === "Published" ? "#4ade80" : post.status === "Scheduled" ? "#818cf8" : post.status === "Paused" ? "#fbbf24" : "#3f3f46"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{post.platform}</span>
                      <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{post.status}</span>
                      {post.scheduledAt && <span style={{ fontSize: 11, color: "#52525b" }}>{new Date(post.scheduledAt).toLocaleString()}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{(post.caption || post.scheduledContent || "").slice(0, 150)}{(post.caption || "").length > 150 ? "…" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <select style={{ ...S.select, fontSize: 11, padding: "4px 8px" }} value={post.status} onChange={e => updatePostStatus(post.id, e.target.value)}>{QUEUE_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 8px" }} onClick={() => navigator.clipboard?.writeText(post.caption || "")}>Copy</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deletePost(post.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── HASHTAG RESEARCH ── */}
      {tab === "hashtags" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Hashtag Research</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12, lineHeight: 1.6 }}>
              Enter your niche or product category and get a curated hashtag strategy — niche tags for discoverability, medium tags for reach, broad tags for exposure, and trending tags for virality.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={S.input} value={hashTopic} onChange={e => setHashTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generateHashtags()} placeholder="e.g. luxury candles, fitness apparel, organic skincare, home decor…" />
              <button style={S.btn("primary")} onClick={generateHashtags} disabled={hashLoading || !hashTopic.trim()}>{hashLoading ? "Generating…" : "Generate Hashtags"}</button>
            </div>
          </div>
          {hashLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {hashResult && !hashLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>{hashTopic} — Hashtag Strategy</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof hashResult === "string" ? hashResult : JSON.stringify(hashResult, null, 2))}>Copy All</button>
              </div>
              <pre style={S.pre}>{typeof hashResult === "string" ? hashResult : JSON.stringify(hashResult, null, 2)}</pre>
            </div>
          )}
          <div style={S.card}>
            <div style={S.sectionTitle}>Hashtag Strategy Framework</div>
            {[
              { type: "Niche tags (<100k posts)",         pct: "40%", ex: "#organiccandles, #handpouredcandles, #smallbatchcandles", tip: "Best for appearing in highly relevant feeds. Low competition, high conversion." },
              { type: "Medium tags (100k–1M posts)",      pct: "35%", ex: "#candlelovers, #homedecorinspo, #shopsmallbusiness",      tip: "Sweet spot for reach + relevance. Algorithm favours these for new accounts." },
              { type: "Broad tags (1M+ posts)",           pct: "10%", ex: "#candles, #homedecor, #lifestyle",                         tip: "Use sparingly. Hard to rank for but adds reach for established accounts." },
              { type: "Brand/campaign tags",              pct: "10%", ex: "#NovaSkinGlow, #WearNova, #NovaX2026",                    tip: "Build community around your brand. Encourage customers to use them." },
              { type: "Trending/seasonal tags",           pct: "5%",  ex: "#MindfulLiving2026, #SundayReset, #CleanHome",           tip: "Rotate weekly. Research trending topics in your niche and join the conversation." },
            ].map(({ type, pct, ex, tip }) => (
              <div key={type} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{type}</div>
                    <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{pct} of your mix</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#52525b", fontStyle: "italic", marginBottom: 2 }}>e.g. {ex}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTENT CALENDAR ── */}
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
            <div style={S.sectionTitle}>30-Day Content Framework — Weekly Mix</div>
            {[
              { day: "Monday",    type: "Educational",            example: "'3 ways to style our [product]' — tips content drives saves and shares" },
              { day: "Tuesday",   type: "Product Focus",          example: "Feature 1 product with lifestyle photography + CTA" },
              { day: "Wednesday", type: "User-Generated Content", example: "Repost a customer photo/review with permission" },
              { day: "Thursday",  type: "Behind the Scenes",      example: "Show your process, packaging, or team — builds authenticity" },
              { day: "Friday",    type: "Promotional",            example: "Weekend deal or new arrival — highest purchase intent day" },
              { day: "Saturday",  type: "Engagement / Poll",      example: "Ask a question or run a poll — boosts algorithmic reach" },
              { day: "Sunday",    type: "Brand Story",            example: "Why you started, your values, your mission — emotional connection" },
            ].map(({ day, type, example }) => (
              <div key={day} style={{ display: "grid", gridTemplateColumns: "90px 180px 1fr", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{day}</span>
                <span style={{ color: "#818cf8", fontWeight: 600 }}>{type}</span>
                <span style={{ color: "#71717a", lineHeight: 1.4 }}>{example}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STRATEGY GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Social Media for E-Commerce: Key Principles</div>
            {[
              { t: "Social proof > product features",     d: "Customer photos and reviews consistently outperform polished brand content. Build a UGC collection strategy from Day 1." },
              { t: "Consistency beats perfection",        d: "3 posts/week for 52 weeks beats 21 posts in 1 week. Algorithm rewards consistent cadence." },
              { t: "The first frame decides everything",  d: "On video platforms, the first 1-3 seconds determine watch time. Lead with your most interesting frame." },
              { t: "Hashtags: depth over breadth",        d: "5-10 highly relevant hashtags outperform 30 random ones. Mix niche, medium, and broad." },
              { t: "Comment engagement amplifies reach",  d: "Responding to comments within 1 hour significantly boosts algorithmic distribution." },
              { t: "Link in bio is a campaign, not a link", d: "Change your link in bio for every promotional post. Use a link-in-bio tool to create a landing page." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5" }}>📱</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Platform Character Limits</div>
            {Object.entries(CHAR_LIMITS).map(([platform, limit]) => (
              <div key={platform} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                <span style={{ color: "#e4e4e7", fontWeight: 600 }}>{platform}</span>
                <span style={{ color: "#818cf8", fontWeight: 700 }}>{limit.toLocaleString()} chars</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
