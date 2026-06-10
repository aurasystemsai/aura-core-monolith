import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/creative-automation-engine";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : v === "amber" ? "#78350f" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "generate", label: "Generate" },
  { id: "abtest",   label: "A/B Test Planner" },
  { id: "library",  label: "Creative Library" },
  { id: "guide",    label: "Creative Strategy" },
];

const CREATIVE_TYPES = ["Ad Copy", "Email Subject Lines", "Social Caption", "Product Description", "Video Script Hook", "Blog Title", "Landing Page Headline", "CTA Variants", "Push Notification", "SMS Copy"];
const TONES          = ["Conversational", "Professional", "Urgent", "Playful", "Luxury/Premium", "Educational", "Empowering", "Bold & Direct"];
const PLATFORMS      = ["Facebook / Instagram", "TikTok", "Google Ads", "Email", "SMS", "Pinterest", "YouTube", "LinkedIn"];
const AB_ANGLES      = ["Price / Value", "Social Proof", "Urgency / Scarcity", "Problem → Solution", "Authority / Expert", "Curiosity / Intrigue", "Emotion / Story", "Benefit-led", "Comparison"];

const SAMPLE_BRIEFS = [
  { label: "Women's running shoe",    brief: "Generate 5 Facebook ad headlines for a women's running shoe. Price: $89. Target: women 25-40, fitness-focused. Emotion: empowerment. USP: designed with female biomechanics in mind." },
  { label: "Abandoned cart email",    brief: "Write 5 email subject lines for an abandoned cart email. Product: Premium coffee subscription, $45/month. Test urgency, social proof, curiosity, and personalisation angles." },
  { label: "TikTok hook — skincare",  brief: "Create a TikTok video script hook (first 3 seconds) for a skincare product that claims to reduce dark circles in 7 days. Must stop the scroll instantly." },
  { label: "Candle product desc.",    brief: "Write 3 product descriptions for a handmade soy candle. Scent: Midnight Forest. Tone: premium, sustainable, sensory. 50-80 words each. For a Shopify PDP." },
  { label: "High-ticket supplement",  brief: "5 CTA button variant copies for a £120 nootropic supplement. Must overcome price objection and drive click. Variants: different angles (value, social proof, transformation)." },
];

export default function CreativeAutomationEngine() {
  const [tab, setTab]       = useState("generate");
  const [brief, setBrief]   = useState("");
  const [creativeType, setType] = useState("Ad Copy");
  const [tone, setTone]     = useState("Conversational");
  const [platform, setPlatform] = useState("Facebook / Instagram");
  const [brandVoice, setBrandVoice] = useState("");
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);

  // A/B Test Planner
  const [abBrief, setAbBrief]   = useState("");
  const [abAngles, setAbAngles] = useState([AB_ANGLES[0], AB_ANGLES[1]]);
  const [abResult, setAbResult] = useState(null);
  const [abLoading, setAbLoading] = useState(false);

  // Library
  const [creatives, setCreatives] = useState([]);
  const [libLoading, setLibLoading] = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [filterType, setFilterType] = useState("all");

  const [error, setError] = useState("");

  useEffect(() => { loadCreatives(); }, []);

  const loadCreatives = async () => {
    setLibLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/creatives`);
      if (r.ok) setCreatives(r.creatives || []);
    } catch {}
    setLibLoading(false);
  };

  const generate = async () => {
    if (!brief.trim()) return;
    setGenerating(true); setError(""); setResult(null);
    const fullBrief = `Creative Type: ${creativeType}\nPlatform: ${platform}\nTone: ${tone}${brandVoice ? `\nBrand Voice: ${brandVoice}` : ""}\n\nBrief:\n${brief}`;
    try {
      const r = await apiFetchJSON(`${API}/ai/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: fullBrief }),
      });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      setResult(r.result || "");
    } catch (e) { setError(e.message); }
    setGenerating(false);
  };

  const saveCreative = async () => {
    if (!result) return;
    try {
      const r = await apiFetchJSON(`${API}/creatives`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: result, brief, type: creativeType, platform, tone, createdAt: new Date().toISOString() }),
      });
      if (r.ok) { loadCreatives(); }
    } catch (e) { setError(e.message); }
  };

  const generateAbTest = async () => {
    if (!abBrief.trim()) return;
    setAbLoading(true); setAbResult(null); setError("");
    const prompt = `A/B Test Plan\nAngles to test: ${abAngles.join(", ")}\n\nBrief:\n${abBrief}`;
    try {
      const r = await apiFetchJSON(`${API}/ai/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: prompt }),
      });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      setAbResult(r.result || "");
    } catch (e) { setError(e.message); }
    setAbLoading(false);
  };

  const toggleAngle = (angle) => {
    setAbAngles(p => p.includes(angle) ? p.filter(a => a !== angle) : [...p, angle]);
  };

  const deleteCreative = async (id) => {
    setDeleting(id);
    try {
      await apiFetchJSON(`${API}/creatives/${id}`, { method: "DELETE" });
      setCreatives(p => p.filter(c => c.id !== id));
    } catch {}
    setDeleting(null);
  };

  const filteredCreatives = filterType === "all" ? creatives : creatives.filter(c => c.type === filterType);

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Creative Automation Engine</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          AI-powered marketing creative at scale — ad copy, email subjects, social captions, product descriptions, video hooks, and A/B test plans. Ship 10× more creative variants without a larger team.
        </p>
      </div>

      {creatives.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>Saved Creatives</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#4f46e5" }}>{creatives.length}</div>
          </div>
          {[...new Set(creatives.map(c => c.type))].slice(0, 3).map(t => (
            <div key={t} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
              <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{t}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#818cf8" }}>{creatives.filter(c => c.type === t).length}</div>
            </div>
          ))}
        </div>
      )}

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── GENERATE ── */}
      {tab === "generate" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Creative Type</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {CREATIVE_TYPES.map(t => (
                <button key={t} style={{ ...S.btn(t === creativeType ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setType(t)}>{t}</button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Platform</label>
                <select style={{ ...S.select, width: "100%" }} value={platform} onChange={e => setPlatform(e.target.value)}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Tone</label>
                <select style={{ ...S.select, width: "100%" }} value={tone} onChange={e => setTone(e.target.value)}>
                  {TONES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Brand Voice (optional)</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={brandVoice} onChange={e => setBrandVoice(e.target.value)} placeholder="e.g. bold, female-first, no jargon" />
              </div>
            </div>

            <div style={S.sectionTitle}>Creative Brief</div>
            <textarea style={{ ...S.ta, minHeight: 120 }} value={brief} onChange={e => setBrief(e.target.value)} placeholder="Describe your creative need — audience, product, USP, emotion, key message, any restrictions…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={generate} disabled={generating || !brief.trim()}>{generating ? "Generating…" : "Generate Creative"}</button>
              {result && <button style={{ ...S.btn("green"), fontSize: 11, padding: "6px 12px" }} onClick={saveCreative}>Save to Library</button>}
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setBrief(""); setResult(null); }}>Clear</button>
            </div>
          </div>

          {!brief && !result && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Sample Briefs</div>
              {SAMPLE_BRIEFS.map(({ label, brief: b }) => (
                <div key={label} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setBrief(b)}>Load</button>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>{b.slice(0, 100)}…</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {generating && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {result && !generating && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>{creativeType} · {platform} · {tone}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={saveCreative}>Save</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(result)}>Copy</button>
                </div>
              </div>
              <pre style={S.pre}>{result}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── A/B TEST PLANNER ── */}
      {tab === "abtest" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Select Angles to Test</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12, lineHeight: 1.6 }}>
              Select 2-5 creative angles. The AI will write a distinct variant for each angle, so you can run a proper A/B test with meaningfully different approaches — not just different wording.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {AB_ANGLES.map(angle => (
                <button key={angle} style={{ ...S.btn(abAngles.includes(angle) ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => toggleAngle(angle)}>{angle}</button>
              ))}
            </div>
            {abAngles.length > 0 && <div style={{ fontSize: 12, color: "#818cf8", marginBottom: 14 }}>Testing {abAngles.length} angles: {abAngles.join(", ")}</div>}

            <div style={S.sectionTitle}>What Are You Testing?</div>
            <textarea style={{ ...S.ta, minHeight: 100 }} value={abBrief} onChange={e => setAbBrief(e.target.value)} placeholder="Describe the creative you're testing — product, audience, channel, goal. e.g. 'Facebook ad for £89 women's running shoes, target age 25-40, goal: add to cart. Test 4 different angles.'" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={generateAbTest} disabled={abLoading || !abBrief.trim() || abAngles.length < 2}>{abLoading ? "Generating…" : `Generate ${abAngles.length} Variants`}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setAbBrief(""); setAbResult(null); }}>Clear</button>
            </div>
          </div>

          {abLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {abResult && !abLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>A/B Test Creative Plan — {abAngles.length} Variants</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(abResult)}>Copy All</button>
              </div>
              <pre style={S.pre}>{abResult}</pre>
              <div style={{ background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#c7d2fe", lineHeight: 1.6 }}>
                Testing tip: Run each variant with equal budget for a minimum of 1,000 impressions per variant before declaring a winner. Statistical significance requires sufficient sample size.
              </div>
            </div>
          )}

          {!abResult && !abLoading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Why Test Angles, Not Just Words?</div>
              {[
                { angle: "Price / Value",    ex: "'Just £89 — less than your monthly coffee'" },
                { angle: "Social Proof",     ex: "'12,847 women have already made the switch'" },
                { angle: "Urgency",          ex: "'Selling fast — only 23 pairs left in your size'" },
                { angle: "Problem-led",      ex: "'Still getting shin splints? Your shoes are the reason'" },
                { angle: "Benefit-led",      ex: "'Run further. Recover faster. Feel the difference.'" },
                { angle: "Curiosity",        ex: "'The thing elite runners have known for years…'" },
              ].map(({ angle, ex }) => (
                <div key={angle} style={S.row}>
                  <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>{angle}</span>
                  <div style={{ fontSize: 12, color: "#71717a", fontStyle: "italic" }}>{ex}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATIVE LIBRARY ── */}
      {tab === "library" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <button style={{ ...S.btn(filterType === "all" ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setFilterType("all")}>All</button>
            {[...new Set(creatives.map(c => c.type))].map(t => (
              <button key={t} style={{ ...S.btn(filterType === t ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setFilterType(t)}>{t}</button>
            ))}
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadCreatives}>Refresh</button>
          </div>

          {libLoading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : filteredCreatives.length === 0 ? (
            <EmptyState icon="🎨" title="No creatives saved yet" description="Generate creative content and save it to build your library." />
          ) : (
            filteredCreatives.map(c => (
              <div key={c.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                      {c.type     && <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{c.type}</span>}
                      {c.platform && <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{c.platform}</span>}
                      {c.tone     && <span style={{ background: "#27272a", color: "#71717a", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{c.tone}</span>}
                      {c.createdAt && <span style={{ fontSize: 11, color: "#52525b" }}>{new Date(c.createdAt).toLocaleDateString()}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{(c.content || "").slice(0, 220)}{(c.content || "").length > 220 ? "…" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexDirection: "column", alignItems: "flex-end" }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(c.content || "")}>Copy</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteCreative(c.id)} disabled={deleting === c.id}>{deleting === c.id ? "…" : "Delete"}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CREATIVE STRATEGY ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Creative Performance Principles</div>
            {[
              { t: "Outcome > feature in every headline",          d: "'Lose 5kg in 30 days' beats 'Contains CLA and Chromium'. Customers buy outcomes. Features are proof points, not headlines. Put the transformation in the headline, the mechanism in the body." },
              { t: "Specificity multiplies credibility",           d: "'87% saw results in 7 days' converts better than 'most customers see results quickly'. Numbers create trust. Be as specific as your data allows." },
              { t: "Test angles, not just words",                   d: "Don't test 'Buy Now' vs 'Shop Now'. Test value-led vs social-proof vs urgency vs emotion. Meaningful creative differences reveal what your audience responds to at a strategy level." },
              { t: "Social proof in the first line",               d: "'Join 12,000 happy customers' or '★★★★★ 4.9/5 from 847 reviews' in the headline or first sentence can double click-through rates. Put it where it's seen first." },
              { t: "Platform context changes everything",           d: "TikTok: the hook must stop the scroll in 0.5s. Facebook: more text is often better. Email subject: 40 characters or fewer for mobile. Google: match search intent exactly. Never recycle creative across platforms." },
              { t: "The 5-second test before any creative goes live", d: "Show your creative to 5 people for 5 seconds. They should answer: what is it, who is it for, what should I do next. If they can't, rewrite before you spend budget." },
              { t: "Urgency must be real",                          d: "False scarcity ('Only 3 left!' when stock is 500) destroys trust long-term. Use genuine urgency: real deadline, authentic low stock, limited-time offer. Fake urgency works once and burns the list." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🎨</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Creative Volume Benchmarks (Paid Social)</div>
            {[
              { stage: "Testing phase",          output: "10-20 variants/week",  why: "Find winning angles before scaling spend" },
              { stage: "Scaling phase",           output: "5-10 variants/week",  why: "Iterate on winners, replace fatigued creatives" },
              { stage: "Mature / retention",      output: "2-5 variants/week",   why: "Maintain freshness for warm audiences" },
              { stage: "Creative fatigue signal", output: "CTR drops >40% WoW", why: "Replace primary creatives when this happens" },
            ].map(({ stage, output, why }) => (
              <div key={stage} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                <span style={{ color: "#e4e4e7" }}>{stage}</span>
                <span style={{ color: "#818cf8", fontWeight: 700, textAlign: "center" }}>{output}</span>
                <span style={{ color: "#52525b" }}>{why}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
