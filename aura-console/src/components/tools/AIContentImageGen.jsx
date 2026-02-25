import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";

const API = "/api/ai-content-image-gen";

// ─── Theme ────────────────────────────────────────────────────────────────────
const S = {
  page:      { minHeight: "100vh", background: "#09090b", color: "#fafafa", fontFamily: "Inter, system-ui, sans-serif", padding: "24px" },
  header:    { marginBottom: 28 },
  title:     { fontSize: 26, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle:  { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs:      { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 24, background: "#18181b", borderRadius: 10, padding: 4 },
  tab:       { padding: "8px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all .15s" },
  tabActive: { background: "#7c3aed", color: "#fff" },
  tabInact:  { background: "transparent", color: "#a1a1aa" },
  card:      { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20, marginBottom: 16 },
  row:       { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 },
  col:       { flex: 1, minWidth: 200 },
  label:     { display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input:     { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "9px 12px", fontSize: 14, boxSizing: "border-box" },
  textarea:  { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "9px 12px", fontSize: 14, boxSizing: "border-box", resize: "vertical", minHeight: 80 },
  select:    { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "9px 12px", fontSize: 14, boxSizing: "border-box" },
  btn:       { padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all .15s" },
  btnPurple: { background: "#7c3aed", color: "#fff" },
  btnGray:   { background: "#27272a", color: "#fafafa" },
  btnSm:     { padding: "6px 14px", fontSize: 13 },
  btnRed:    { background: "#7f1d1d", color: "#fca5a5" },
  result:    { background: "#0f0f11", border: "1px solid #27272a", borderRadius: 10, padding: 16, marginTop: 16 },
  resultLabel:{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 },
  pre:       { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 14, overflowX: "auto", fontSize: 13, color: "#e4e4e7", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  badge:     { display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  badgeGreen:{ background: "#14532d", color: "#86efac" },
  badgeYellow:{ background: "#713f12", color: "#fde68a" },
  badgeRed:  { background: "#7f1d1d", color: "#fca5a5" },
  badgePurple:{ background: "#4c1d95", color: "#c4b5fd" },
  divider:   { border: "none", borderTop: "1px solid #27272a", margin: "20px 0" },
  imageGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginTop: 16 },
  imageCard: { borderRadius: 10, overflow: "hidden", border: "1px solid #27272a", background: "#18181b" },
  imageImg:  { width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" },
  scoreBar:  { height: 6, borderRadius: 3, background: "#27272a", overflow: "hidden", marginTop: 4 },
  scoreFill: (v) => ({ height: "100%", borderRadius: 3, background: v >= 75 ? "#22c55e" : v >= 50 ? "#f59e0b" : "#ef4444", width: `${v}%`, transition: "width .5s" }),
};

function Spinner() {
  return <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", verticalAlign: "middle", marginRight: 8 }} />;
}
const spinStyle = document.createElement("style");
spinStyle.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
document.head.appendChild(spinStyle);

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button style={{ ...S.btn, ...S.btnGray, ...S.btnSm }} onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function ResultBlock({ label, children }) {
  return (
    <div style={S.result}>
      <div style={S.resultLabel}>{label}</div>
      {children}
    </div>
  );
}

function ScoreRow({ label, value }) {
  if (value == null) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#d4d4d8" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: value >= 75 ? "#22c55e" : value >= 50 ? "#f59e0b" : "#ef4444" }}>{value}/100</span>
      </div>
      <div style={S.scoreBar}><div style={S.scoreFill(value)} /></div>
    </div>
  );
}

function ModelSelect({ value, onChange }) {
  return (
    <div style={S.col}>
      <label style={S.label}>AI Model</label>
      <select style={S.select} value={value} onChange={e => onChange(e.target.value)}>
        <option value="gpt-4o-mini">gpt-4o-mini (2 credits)</option>
        <option value="gpt-4o">gpt-4o (4 credits)</option>
        <option value="gpt-4.1">gpt-4.1 (4 credits)</option>
      </select>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "product", label: "📦 Product Content" },
  { id: "ads",     label: "📣 Ad Copy" },
  { id: "social",  label: "📱 Social Media" },
  { id: "images",  label: "🖼️ Images" },
  { id: "brand",   label: "🎨 Brand Voice" },
  { id: "video",   label: "🎬 Video & Motion" },
  { id: "blog",    label: "✍️ Blog & Long-form" },
  { id: "quality", label: "🔍 Analyze & Score" },
  { id: "history", label: "📜 History" },
];

// ═══════════════════════════════════════════════════════════
// PRODUCT CONTENT TAB
// ═══════════════════════════════════════════════════════════
function ProductContentTab() {
  const [sub, setSub] = useState("description");
  const SUBS = [
    { id: "description", label: "Description Writer" },
    { id: "meta", label: "SEO Meta Tags" },
    { id: "bulk", label: "Bulk Descriptions" },
    { id: "variants", label: "Variant Copy" },
    { id: "collection", label: "Collection Page" },
    { id: "faq", label: "FAQ Generator" },
    { id: "comparison", label: "Comparison Table" },
    { id: "review", label: "Review Responder" },
  ];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Shared form state for each sub-tool
  const [f, setF] = useState({ title: "", tags: "", category: "", imageUrl: "", tone: "professional", keyword: "", collectionTitle: "", productTitles: "", variants: "", baseDescription: "", productTitle: "", description: "", count: 8, products: "", reviewText: "", starRating: "5", storeName: "", model: "gpt-4o-mini" });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));

  async function run(endpoint, body) {
    setLoading(true); setResult(null); setError("");
    try {
      const r = await apiFetch(`${API}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) setError(r.error || "Request failed"); else setResult(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const handlers = {
    description: () => run("product-description", { title: f.title, tags: f.tags.split(",").map(t => t.trim()).filter(Boolean), category: f.category, imageUrl: f.imageUrl || undefined, tone: f.tone, model: f.model }),
    meta: () => run("meta-tags", { title: f.title, keyword: f.keyword, category: f.category, model: f.model }),
    bulk: () => {
      let prods;
      try { prods = JSON.parse(f.products); } catch { prods = f.products.split("\n").filter(Boolean).map(l => ({ title: l.trim() })); }
      run("bulk-descriptions", { products: prods, tone: f.tone, model: f.model });
    },
    variants: () => run("variant-copy", { productTitle: f.title, baseDescription: f.baseDescription, variants: f.variants.split("\n").filter(Boolean), model: f.model }),
    collection: () => run("collection-description", { collectionTitle: f.collectionTitle, productTitles: f.productTitles.split("\n").filter(Boolean), theme: f.category, model: f.model }),
    faq: () => run("product-faq", { productTitle: f.title, description: f.description, tags: f.tags.split(",").map(t=>t.trim()).filter(Boolean), count: parseInt(f.count), model: f.model }),
    comparison: () => run("comparison-table", { products: f.products.split("\n").filter(Boolean), model: f.model }),
    review: () => run("review-response", { reviewText: f.reviewText, starRating: parseInt(f.starRating), productTitle: f.title, storeName: f.storeName, model: f.model }),
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {SUBS.map(s => <button key={s.id} style={{ ...S.btn, ...(sub === s.id ? S.btnPurple : S.btnGray), ...S.btnSm }} onClick={() => { setSub(s.id); setResult(null); setError(""); }}>{s.label}</button>)}
      </div>

      <div style={S.card}>
        {/* ── Description Writer ── */}
        {sub === "description" && <>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Product Title *</label><input style={S.input} value={f.title} onChange={set("title")} placeholder="Premium Leather Wallet" /></div>
            <div style={S.col}><label style={S.label}>Category</label><input style={S.input} value={f.category} onChange={set("category")} placeholder="Accessories" /></div>
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Tags (comma-separated)</label><input style={S.input} value={f.tags} onChange={set("tags")} placeholder="leather, wallet, minimalist" /></div>
            <div style={S.col}><label style={S.label}>Tone</label>
              <select style={S.select} value={f.tone} onChange={set("tone")}>
                {["professional","conversational","luxury","playful","technical","minimalist"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Product Image URL (optional, for AI vision)</label><input style={S.input} value={f.imageUrl} onChange={set("imageUrl")} placeholder="https://..." /></div>
            <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
          </div>
        </>}

        {/* ── Meta Tags ── */}
        {sub === "meta" && <>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Page/Product Title *</label><input style={S.input} value={f.title} onChange={set("title")} placeholder="Best Leather Wallet for Men" /></div>
            <div style={S.col}><label style={S.label}>Target Keyword</label><input style={S.input} value={f.keyword} onChange={set("keyword")} placeholder="mens leather wallet" /></div>
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Category</label><input style={S.input} value={f.category} onChange={set("category")} placeholder="Accessories" /></div>
            <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
          </div>
        </>}

        {/* ── Bulk ── */}
        {sub === "bulk" && <>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Products (one title per line, or JSON array)</label>
            <textarea style={{ ...S.textarea, minHeight: 120 }} value={f.products} onChange={set("products")} placeholder={"Premium Leather Wallet\nCanvas Backpack 30L\nSilicon Phone Case"} />
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Tone</label>
              <select style={S.select} value={f.tone} onChange={set("tone")}>
                {["professional","conversational","luxury","playful","technical"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
          </div>
        </>}

        {/* ── Variant Copy ── */}
        {sub === "variants" && <>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Product Title *</label><input style={S.input} value={f.title} onChange={set("title")} placeholder="Classic Hoodie" /></div>
            <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
          </div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Base Description *</label><textarea style={S.textarea} value={f.baseDescription} onChange={set("baseDescription")} placeholder="A comfortable everyday hoodie made from..." /></div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Variants (one per line)</label><textarea style={S.textarea} value={f.variants} onChange={set("variants")} placeholder={"Black / M\nNavy Blue / L\nForest Green / XL"} /></div>
        </>}

        {/* ── Collection ── */}
        {sub === "collection" && <>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Collection Title *</label><input style={S.input} value={f.collectionTitle} onChange={set("collectionTitle")} placeholder="Men's Accessories" /></div>
            <div style={S.col}><label style={S.label}>Theme/Niche</label><input style={S.input} value={f.category} onChange={set("category")} placeholder="premium leather goods" /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Products in Collection (one per line)</label><textarea style={S.textarea} value={f.productTitles} onChange={set("productTitles")} placeholder={"Leather Wallet\nCardhold Case\nBelt"} /></div>
          <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
        </>}

        {/* ── FAQ ── */}
        {sub === "faq" && <>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Product Title *</label><input style={S.input} value={f.title} onChange={set("title")} placeholder="Wireless Earbuds Pro" /></div>
            <div style={S.col}><label style={S.label}>Number of FAQs</label><input style={S.input} type="number" min={3} max={15} value={f.count} onChange={set("count")} /></div>
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Tags</label><input style={S.input} value={f.tags} onChange={set("tags")} placeholder="bluetooth, earbuds, noise cancelling" /></div>
            <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
          </div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Product Description (optional)</label><textarea style={S.textarea} value={f.description} onChange={set("description")} placeholder="Key product details..." /></div>
        </>}

        {/* ── Comparison ── */}
        {sub === "comparison" && <>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Products to Compare (one per line, min 2) *</label><textarea style={S.textarea} value={f.products} onChange={set("products")} placeholder={"iPhone 15 Pro\nSamsung Galaxy S25\nPixel 9 Pro"} /></div>
          <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
        </>}

        {/* ── Review Responder ── */}
        {sub === "review" && <>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Product Title</label><input style={S.input} value={f.title} onChange={set("title")} placeholder="Premium Leather Wallet" /></div>
            <div style={S.col}><label style={S.label}>Star Rating</label>
              <select style={S.select} value={f.starRating} onChange={set("starRating")}>
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Store Name</label><input style={S.input} value={f.storeName} onChange={set("storeName")} placeholder="My Store" /></div>
            <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
          </div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Review Text *</label><textarea style={S.textarea} value={f.reviewText} onChange={set("reviewText")} placeholder="Great product but took a while to arrive..." /></div>
        </>}

        {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
        <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handlers[sub]} disabled={loading}>
          {loading ? <><Spinner />Generating...</> : "✨ Generate with AI"}
        </button>
      </div>

      {result && <ProductResult sub={sub} data={result} />}
    </div>
  );
}

function ProductResult({ sub, data }) {
  if (sub === "description") return (
    <ResultBlock label="Generated Descriptions">
      {["short","medium","long"].map(len => data[len] && (
        <div key={len} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ ...S.badge, ...S.badgePurple, textTransform: "capitalize" }}>{len}</span>
            <CopyBtn text={data[len]} />
          </div>
          <p style={{ color: "#e4e4e7", margin: 0, lineHeight: 1.7, fontSize: 14 }}>{data[len]}</p>
        </div>
      ))}
      {data.bulletPoints?.length > 0 && <><hr style={S.divider} /><div style={S.resultLabel}>Bullet Points</div><ul style={{ color: "#d4d4d8", fontSize: 14, paddingLeft: 20 }}>{data.bulletPoints.map((b,i) => <li key={i}>{b}</li>)}</ul></>}
      {data.seoTitle && <><hr style={S.divider} /><div style={S.resultLabel}>SEO Title ({data.seoTitle.length} chars)</div><code style={{ color: "#a78bfa", fontSize: 14 }}>{data.seoTitle}</code></>}
      {data.metaDescription && <><div style={S.resultLabel} style={{ marginTop: 12 }}>Meta Description ({data.metaDescription.length} chars)</div><code style={{ color: "#6ee7b7", fontSize: 14 }}>{data.metaDescription}</code></>}
    </ResultBlock>
  );

  if (sub === "meta") return (
    <ResultBlock label="SEO Meta Tags">
      {data.metaTitles?.map((t, i) => (
        <div key={i} style={{ marginBottom: 12, padding: "10px 14px", background: "#09090b", borderRadius: 8, border: "1px solid #27272a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <code style={{ color: "#a78bfa", fontSize: 14 }}>{t}</code>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ ...S.badge, ...(data.estimatedCTRTier?.[i] === "high" ? S.badgeGreen : S.badgeYellow) }}>{data.estimatedCTRTier?.[i] || ""} CTR</span>
              <CopyBtn text={t} />
            </div>
          </div>
          {data.metaDescriptions?.[i] && <p style={{ color: "#a1a1aa", margin: "8px 0 0", fontSize: 13 }}>{data.metaDescriptions[i]}</p>}
        </div>
      ))}
    </ResultBlock>
  );

  if (sub === "bulk") return (
    <ResultBlock label={`Bulk Results (${data.count} products)`}>
      {data.results?.map((r, i) => (
        <div key={i} style={{ marginBottom: 12, padding: 12, background: "#09090b", borderRadius: 8, border: `1px solid ${r.ok ? "#27272a" : "#7f1d1d"}` }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{r.title} {!r.ok && <span style={{ color: "#fca5a5" }}>⚠ {r.error}</span>}</div>
          {r.description && <p style={{ color: "#d4d4d8", margin: 0, fontSize: 13 }}>{r.description}</p>}
        </div>
      ))}
    </ResultBlock>
  );

  if (sub === "faq") return (
    <ResultBlock label="FAQ Generation">
      {data.faqs?.map((faq, i) => (
        <div key={i} style={{ marginBottom: 14, padding: 14, background: "#09090b", borderRadius: 8 }}>
          <div style={{ fontWeight: 600, color: "#c4b5fd", marginBottom: 6 }}>Q: {faq.question}</div>
          <div style={{ color: "#d4d4d8", fontSize: 14 }}>A: {faq.answer}</div>
        </div>
      ))}
      {data.jsonLdSchema && <><hr style={S.divider} /><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={S.resultLabel}>JSON-LD Schema</div><CopyBtn text={JSON.stringify(data.jsonLdSchema, null, 2)} /></div><pre style={S.pre}>{JSON.stringify(data.jsonLdSchema, null, 2)}</pre></>}
    </ResultBlock>
  );

  if (sub === "review") return (
    <ResultBlock label="Review Responses">
      <div style={{ marginBottom: 12 }}>
        <span style={{ ...S.badge, ...(data.sentiment === "positive" ? S.badgeGreen : data.sentiment === "negative" ? S.badgeRed : S.badgeYellow) }}>Sentiment: {data.sentiment}</span>
        {data.keyIssue && <span style={{ color: "#a1a1aa", fontSize: 13, marginLeft: 12 }}>Issue: {data.keyIssue}</span>}
      </div>
      {data.responses?.map((r, i) => (
        <div key={i} style={{ marginBottom: 12, padding: 14, background: "#09090b", borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ ...S.badge, ...S.badgePurple, textTransform: "capitalize" }}>{r.tone}</span>
            <CopyBtn text={r.text} />
          </div>
          <p style={{ color: "#d4d4d8", margin: 0, fontSize: 14 }}>{r.text}</p>
        </div>
      ))}
    </ResultBlock>
  );

  // Generic JSON output for remaining sub-tools
  return (
    <ResultBlock label="Result">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><CopyBtn text={JSON.stringify(data, null, 2)} /></div>
      <pre style={S.pre}>{JSON.stringify(data, null, 2)}</pre>
    </ResultBlock>
  );
}

// ═══════════════════════════════════════════════════════════
// AD COPY TAB
// ═══════════════════════════════════════════════════════════
function AdCopyTab() {
  const [sub, setSub] = useState("meta");
  const SUBS = [
    { id: "meta", label: "Meta / Instagram" },
    { id: "pmax", label: "Google PMax" },
    { id: "tiktok", label: "TikTok Script" },
    { id: "email", label: "Email Subjects" },
    { id: "push", label: "Push Notifications" },
    { id: "cart", label: "Abandoned Cart Sequence" },
  ];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({ productTitle: "", offer: "", audience: "", goal: "conversions", variants: 5, url: "", campaign: "promo", count: 10, eventType: "flash-sale", discount: "", storeName: "", duration: 30, style: "ugc", model: "gpt-4o-mini" });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));

  async function run(endpoint, body) {
    setLoading(true); setResult(null); setError("");
    try {
      const r = await apiFetch(`${API}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) setError(r.error || "Failed"); else setResult(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const handlers = {
    meta: () => run("ad-copy/meta", { productTitle: f.productTitle, offer: f.offer, audience: f.audience, goal: f.goal, variants: parseInt(f.variants), model: f.model }),
    pmax: () => run("ad-copy/pmax", { productTitle: f.productTitle, description: f.offer, url: f.url, model: f.model }),
    tiktok: () => run("ad-copy/tiktok-script", { productTitle: f.productTitle, offer: f.offer, duration: parseInt(f.duration), style: f.style, model: f.model }),
    email: () => run("email-subjects", { campaign: f.campaign, productTitle: f.productTitle, offer: f.offer, count: parseInt(f.count), model: f.model }),
    push: () => run("push-notifications", { eventType: f.eventType, productTitle: f.productTitle, discount: f.discount, model: f.model }),
    cart: () => run("abandoned-cart-sequence", { productTitle: f.productTitle, cartValue: f.offer, discount: f.discount, storeName: f.storeName, model: f.model }),
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {SUBS.map(s => <button key={s.id} style={{ ...S.btn, ...(sub === s.id ? S.btnPurple : S.btnGray), ...S.btnSm }} onClick={() => { setSub(s.id); setResult(null); setError(""); }}>{s.label}</button>)}
      </div>
      <div style={S.card}>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Product Title *</label><input style={S.input} value={f.productTitle} onChange={set("productTitle")} placeholder="Wireless Earbuds Pro" /></div>
          {(sub === "meta" || sub === "tiktok" || sub === "cart") && <div style={S.col}><label style={S.label}>{sub === "cart" ? "Cart Value ($)" : "Offer / USP"}</label><input style={S.input} value={f.offer} onChange={set("offer")} placeholder={sub === "cart" ? "79.99" : "20% off today only"} /></div>}
        </div>
        <div style={S.row}>
          {sub === "meta" && <><div style={S.col}><label style={S.label}>Target Audience</label><input style={S.input} value={f.audience} onChange={set("audience")} placeholder="Men 25-45 interested in tech" /></div><div style={{ minWidth: 140 }}><label style={S.label}>Goal</label><select style={S.select} value={f.goal} onChange={set("goal")}>{["conversions","traffic","awareness","engagement"].map(t=><option key={t}>{t}</option>)}</select></div></>}
          {sub === "pmax" && <div style={S.col}><label style={S.label}>Final URL</label><input style={S.input} value={f.url} onChange={set("url")} placeholder="https://mystore.com/products/..." /></div>}
          {sub === "tiktok" && <><div style={{ minWidth: 140 }}><label style={S.label}>Duration (sec)</label><select style={S.select} value={f.duration} onChange={set("duration")}>{[15,30,60].map(d=><option key={d}>{d}</option>)}</select></div><div style={{ minWidth: 140 }}><label style={S.label}>Style</label><select style={S.select} value={f.style} onChange={set("style")}>{["ugc","branded","educational"].map(t=><option key={t}>{t}</option>)}</select></div></>}
          {sub === "email" && <><div style={{ minWidth: 160 }}><label style={S.label}>Campaign Type</label><select style={S.select} value={f.campaign} onChange={set("campaign")}>{["promo","abandoned-cart","welcome","reengagement","launch","sale"].map(t=><option key={t}>{t}</option>)}</select></div><div style={{ minWidth: 120 }}><label style={S.label}>Count</label><input style={S.input} type="number" min={3} max={15} value={f.count} onChange={set("count")} /></div></>}
          {sub === "push" && <div style={{ minWidth: 200 }}><label style={S.label}>Event Type</label><select style={S.select} value={f.eventType} onChange={set("eventType")}>{["flash-sale","back-in-stock","price-drop","new-arrival","loyalty"].map(t=><option key={t}>{t}</option>)}</select></div>}
          {sub === "cart" && <div style={S.col}><label style={S.label}>Store Name</label><input style={S.input} value={f.storeName} onChange={set("storeName")} placeholder="My Store" /></div>}
          {(sub === "push" || sub === "cart") && <div style={S.col}><label style={S.label}>Discount</label><input style={S.input} value={f.discount} onChange={set("discount")} placeholder="15% off" /></div>}
          <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
        </div>
        {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
        <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handlers[sub]} disabled={loading}>
          {loading ? <><Spinner />Generating...</> : "✨ Generate Ad Copy"}
        </button>
      </div>
      {result && <AdResult sub={sub} data={result} />}
    </div>
  );
}

function AdResult({ sub, data }) {
  if (sub === "meta") return (
    <ResultBlock label={`Meta Ad Variants (${data.variants?.length || 0})`}>
      {data.variants?.map((v, i) => (
        <div key={i} style={{ marginBottom: 14, padding: 14, background: "#09090b", borderRadius: 8, border: "1px solid #27272a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ ...S.badge, ...S.badgePurple }}>{v.angle}</span>
              <span style={{ ...S.badge, ...(v.estimatedCTRTier === "high" ? S.badgeGreen : S.badgeYellow) }}>{v.estimatedCTRTier} CTR</span>
            </div>
            <CopyBtn text={`${v.primaryText}\n\n${v.headline}\n${v.description}`} />
          </div>
          <div style={{ fontSize: 14 }}>
            <div style={{ color: "#e4e4e7", marginBottom: 6 }}><strong>Primary:</strong> {v.primaryText}</div>
            <div style={{ color: "#a78bfa" }}><strong>Headline:</strong> {v.headline}</div>
            <div style={{ color: "#6ee7b7" }}><strong>Description:</strong> {v.description}</div>
            <div style={{ color: "#fde68a", marginTop: 4 }}><strong>CTA:</strong> {v.callToAction}</div>
          </div>
        </div>
      ))}
      {data.creativeDirection && <div style={{ marginTop: 12, padding: 12, background: "#09090b", borderRadius: 8 }}><span style={S.resultLabel}>Creative Direction</span><p style={{ color: "#d4d4d8", margin: 0, fontSize: 14 }}>{data.creativeDirection}</p></div>}
    </ResultBlock>
  );

  if (sub === "email") return (
    <ResultBlock label="Email Subject Lines">
      {data.subjectLines?.map((sl, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 14px", background: "#09090b", borderRadius: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "#e4e4e7" }}>{sl.subject}</div>
            <div style={{ color: "#71717a", fontSize: 12, marginTop: 4 }}>Preview: {sl.preheader}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <span style={{ ...S.badge, ...S.badgePurple }}>{sl.angle}</span>
              <span style={{ ...S.badge, ...(sl.estimatedOpenRate === "high" ? S.badgeGreen : S.badgeYellow) }}>{sl.estimatedOpenRate} open rate</span>
              <span style={{ ...S.badge, background: "#1c1c1e", color: "#71717a" }}>{sl.characterCount || sl.subject.length} chars</span>
            </div>
          </div>
          <CopyBtn text={sl.subject} />
        </div>
      ))}
      {data.recommendation && <div style={{ marginTop: 12, padding: 12, background: "#09090b", borderRadius: 8 }}><span style={S.resultLabel}>Recommendation</span><p style={{ color: "#d4d4d8", margin: 0, fontSize: 14 }}>{data.recommendation}</p></div>}
    </ResultBlock>
  );

  if (sub === "tiktok") return (
    <ResultBlock label="TikTok Script">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: 15, marginBottom: 4 }}>⚡ Hook: {data.hook}</div>
        {data.hookVariants?.map((h, i) => <div key={i} style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 2 }}>Alt {i + 1}: {h}</div>)}
      </div>
      <hr style={S.divider} />
      <div style={S.resultLabel}>Storyboard</div>
      {data.script?.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, padding: "10px 14px", background: "#09090b", borderRadius: 8 }}>
          <span style={{ ...S.badge, ...S.badgePurple, minWidth: 52, textAlign: "center" }}>{s.timestamp}</span>
          <div style={{ flex: 1, fontSize: 13 }}>
            <div style={{ color: "#6ee7b7" }}>🎥 {s.onScreen}</div>
            <div style={{ color: "#d4d4d8", marginTop: 4 }}>🎙 {s.voiceover}</div>
          </div>
        </div>
      ))}
      {data.voiceoverScript && <><hr style={S.divider} /><div style={{ display: "flex", justifyContent: "space-between" }}><div style={S.resultLabel}>Full Voiceover Script</div><CopyBtn text={data.voiceoverScript} /></div><pre style={S.pre}>{data.voiceoverScript}</pre></>}
    </ResultBlock>
  );

  if (sub === "cart") return (
    <ResultBlock label="Abandoned Cart Email Sequence">
      {data.sequence?.map((email, i) => (
        <div key={i} style={{ marginBottom: 16, padding: 16, background: "#09090b", borderRadius: 10, border: "1px solid #27272a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <span style={{ ...S.badge, ...S.badgePurple, marginRight: 8 }}>Email {email.email}</span>
              <span style={{ color: "#a1a1aa", fontSize: 13 }}>Send: {email.sendDelay}</span>
            </div>
            <CopyBtn text={email.subject} />
          </div>
          <div style={{ fontWeight: 600, color: "#c4b5fd", marginBottom: 4 }}>Subject: {email.subject}</div>
          <div style={{ color: "#71717a", fontSize: 13 }}>Preview: {email.preheader}</div>
          <div style={{ marginTop: 8 }}><span style={{ ...S.badge, ...S.badgeYellow }}>{email.angle}</span></div>
        </div>
      ))}
    </ResultBlock>
  );

  return <ResultBlock label="Result"><pre style={S.pre}>{JSON.stringify(data, null, 2)}</pre></ResultBlock>;
}

// ═══════════════════════════════════════════════════════════
// SOCIAL MEDIA TAB
// ═══════════════════════════════════════════════════════════
function SocialTab() {
  const [sub, setSub] = useState("caption");
  const SUBS = [
    { id: "caption", label: "Caption Generator" },
    { id: "calendar", label: "30-Day Calendar" },
    { id: "ugc", label: "UGC Rewriter" },
    { id: "hashtags", label: "Hashtag Sets" },
  ];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({ productTitle: "", platform: "instagram", tone: "casual", imageUrl: "", theme: "", launchDate: "", days: 30, originalCopy: "", persona: "happy customer", niche: "", sets: 5, model: "gpt-4o-mini" });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));

  async function run(endpoint, body) {
    setLoading(true); setResult(null); setError("");
    try {
      const r = await apiFetch(`${API}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) setError(r.error || "Failed"); else setResult(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const handlers = {
    caption: () => run("social/caption", { productTitle: f.productTitle, platform: f.platform, tone: f.tone, imageUrl: f.imageUrl || undefined, model: f.model }),
    calendar: () => run("social/calendar", { theme: f.theme, launchDate: f.launchDate, days: parseInt(f.days), platforms: [f.platform], model: f.model }),
    ugc: () => run("social/ugc-rewrite", { originalCopy: f.originalCopy, platform: f.platform, persona: f.persona, model: f.model }),
    hashtags: () => run("social/hashtags", { niche: f.niche, productTitle: f.productTitle, platform: f.platform, sets: parseInt(f.sets), model: f.model }),
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {SUBS.map(s => <button key={s.id} style={{ ...S.btn, ...(sub === s.id ? S.btnPurple : S.btnGray), ...S.btnSm }} onClick={() => { setSub(s.id); setResult(null); setError(""); }}>{s.label}</button>)}
      </div>
      <div style={S.card}>
        <div style={S.row}>
          {sub !== "calendar" && sub !== "hashtags" && <div style={S.col}><label style={S.label}>Product Title</label><input style={S.input} value={f.productTitle} onChange={set("productTitle")} placeholder="Premium Yoga Mat" /></div>}
          {sub === "hashtags" && <div style={S.col}><label style={S.label}>Niche *</label><input style={S.input} value={f.niche} onChange={set("niche")} placeholder="e.g. yoga, fitness, wellness" /></div>}
          {sub === "calendar" && <div style={S.col}><label style={S.label}>Campaign Theme *</label><input style={S.input} value={f.theme} onChange={set("theme")} placeholder="Spring Sale / Product Launch" /></div>}
          <div style={{ minWidth: 160 }}><label style={S.label}>Platform</label>
            <select style={S.select} value={f.platform} onChange={set("platform")}>{["instagram","tiktok","pinterest","linkedin","twitter"].map(p => <option key={p}>{p}</option>)}</select>
          </div>
        </div>
        <div style={S.row}>
          {sub === "caption" && <><div style={{ minWidth: 160 }}><label style={S.label}>Tone</label><select style={S.select} value={f.tone} onChange={set("tone")}>{["casual","professional","playful","luxury","educational"].map(t=><option key={t}>{t}</option>)}</select></div><div style={S.col}><label style={S.label}>Product Image URL (optional)</label><input style={S.input} value={f.imageUrl} onChange={set("imageUrl")} placeholder="https://..." /></div></>}
          {sub === "calendar" && <><div style={{ minWidth: 140 }}><label style={S.label}>Days</label><select style={S.select} value={f.days} onChange={set("days")}>{[7,14,30].map(d=><option key={d}>{d}</option>)}</select></div>{f.launchDate !== undefined && <div style={S.col}><label style={S.label}>Start Date</label><input style={S.input} type="date" value={f.launchDate} onChange={set("launchDate")} /></div>}</>}
          {sub === "ugc" && <div style={S.col}><label style={S.label}>Customer Persona</label><input style={S.input} value={f.persona} onChange={set("persona")} placeholder="busy mom, gym enthusiast..." /></div>}
          {sub === "hashtags" && <><div style={S.col}><label style={S.label}>Product (optional)</label><input style={S.input} value={f.productTitle} onChange={set("productTitle")} placeholder="Yoga Mat" /></div><div style={{ minWidth: 100 }}><label style={S.label}>Sets</label><input style={S.input} type="number" min={1} max={10} value={f.sets} onChange={set("sets")} /></div></>}
          <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
        </div>
        {sub === "ugc" && <div style={{ marginBottom: 14 }}><label style={S.label}>Original Copy to Rewrite *</label><textarea style={S.textarea} value={f.originalCopy} onChange={set("originalCopy")} placeholder="Paste your formal product copy here..." /></div>}
        {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
        <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handlers[sub]} disabled={loading}>
          {loading ? <><Spinner />Generating...</> : "✨ Generate"}
        </button>
      </div>
      {result && <SocialResult sub={sub} data={result} />}
    </div>
  );
}

function SocialResult({ sub, data }) {
  if (sub === "caption") return (
    <ResultBlock label="Captions">
      {data.captions?.map((c, i) => (
        <div key={i} style={{ marginBottom: 14, padding: 14, background: "#09090b", borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ ...S.badge, ...S.badgePurple }}>{c.angle}</span>
            <CopyBtn text={c.text} />
          </div>
          <p style={{ color: "#e4e4e7", fontSize: 14, margin: 0, whiteSpace: "pre-wrap" }}>{c.text}</p>
        </div>
      ))}
      {data.hashtagSets && <><hr style={S.divider} />
        {["mega","mid","niche"].map(tier => data.hashtagSets[tier]?.length > 0 && (
          <div key={tier} style={{ marginBottom: 10 }}>
            <div style={S.resultLabel}>{tier} tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{data.hashtagSets[tier].map((t,i) => <span key={i} style={{ ...S.badge, ...S.badgePurple }}>{t}</span>)}</div>
          </div>
        ))}
      </>}
    </ResultBlock>
  );

  if (sub === "calendar") return (
    <ResultBlock label={`${data.calendar?.length || 0}-Day Calendar`}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Day","Date","Platform","Pillar","Caption","Time"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #27272a", color: "#71717a", fontWeight: 600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {data.calendar?.slice(0, 31).map((d, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #1c1c1e" }}>
                <td style={{ padding: "8px 12px", color: "#a78bfa", fontWeight: 700 }}>{d.day}</td>
                <td style={{ padding: "8px 12px", color: "#71717a" }}>{d.date}</td>
                <td style={{ padding: "8px 12px" }}><span style={{ ...S.badge, ...S.badgePurple }}>{d.platform}</span></td>
                <td style={{ padding: "8px 12px", color: "#6ee7b7" }}>{d.contentPillar}</td>
                <td style={{ padding: "8px 12px", color: "#d4d4d8", maxWidth: 300 }}>{d.caption?.slice(0, 100)}{d.caption?.length > 100 ? "…" : ""}</td>
                <td style={{ padding: "8px 12px", color: "#71717a" }}>{d.bestTimeToPost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ResultBlock>
  );

  if (sub === "hashtags") return (
    <ResultBlock label={`${data.hashtagSets?.length || 0} Hashtag Sets`}>
      {data.hashtagSets?.map((set, i) => (
        <div key={i} style={{ marginBottom: 16, padding: 14, background: "#09090b", borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: "#c4b5fd" }}>Set {set.setId}</span>
            <CopyBtn text={set.tags?.join(" ")} />
          </div>
          {["mega","mid","niche"].map(tier => set[tier]?.length > 0 && (
            <div key={tier} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4, textTransform: "uppercase" }}>{tier}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{set[tier].map((t,j) => <span key={j} style={{ ...S.badge, ...S.badgePurple }}>{t}</span>)}</div>
            </div>
          ))}
        </div>
      ))}
    </ResultBlock>
  );

  return <ResultBlock label="Result"><pre style={S.pre}>{JSON.stringify(data, null, 2)}</pre></ResultBlock>;
}

// ═══════════════════════════════════════════════════════════
// IMAGES TAB
// ═══════════════════════════════════════════════════════════
function ImagesTab() {
  const [sub, setSub] = useState("product-photo");
  const SUBS = [
    { id: "product-photo", label: "Product Photography" },
    { id: "lifestyle", label: "Lifestyle Scene" },
    { id: "background-replace", label: "Background Replace" },
    { id: "ad-creative", label: "Ad Creative" },
    { id: "brand-logo", label: "Brand Logo" },
    { id: "variant-visual", label: "Variant Visual" },
    { id: "upscale-prompt", label: "HD Upscale" },
  ];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({ productTitle: "", productCategory: "", backgroundStyle: "clean white studio", scene: "", style: "photorealistic", mood: "clean", size: "1024x1024", headline: "", cta: "Shop Now", adStyle: "modern", aspectRatio: "1:1", brandName: "", colorPalette: "black and white", industry: "", originalColor: "", newColor: "", motionStyle: "subtle loop", description: "" });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));

  async function run(endpoint, body) {
    setLoading(true); setResult(null); setError("");
    try {
      const r = await apiFetch(`${API}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) setError(r.error || "Failed"); else setResult(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const handlers = {
    "product-photo": () => run("image/product-photo", { productTitle: f.productTitle, backgroundStyle: f.backgroundStyle, productCategory: f.productCategory, size: f.size }),
    "lifestyle": () => run("image/lifestyle", { productTitle: f.productTitle, scene: f.scene, productCategory: f.productCategory, style: f.style, size: f.size }),
    "background-replace": () => run("image/background-replace", { productTitle: f.productTitle, newBackground: f.backgroundStyle, mood: f.mood, size: f.size }),
    "ad-creative": () => run("image/ad-creative", { productTitle: f.productTitle, headline: f.headline, cta: f.cta, style: f.adStyle, aspectRatio: f.aspectRatio }),
    "brand-logo": () => run("image/brand-logo", { brandName: f.brandName, style: f.style, colorPalette: f.colorPalette, industry: f.industry }),
    "variant-visual": () => run("image/variant-visual", { productTitle: f.productTitle, productCategory: f.productCategory, originalColor: f.originalColor, newColor: f.newColor }),
    "upscale-prompt": () => run("image/upscale-prompt", { productTitle: f.productTitle, productCategory: f.productCategory, description: f.description }),
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {SUBS.map(s => <button key={s.id} style={{ ...S.btn, ...(sub === s.id ? S.btnPurple : S.btnGray), ...S.btnSm }} onClick={() => { setSub(s.id); setResult(null); setError(""); }}>{s.label}</button>)}
      </div>
      <div style={S.card}>
        {(sub !== "brand-logo") && <div style={S.row}>
          <div style={S.col}><label style={S.label}>Product Title *</label><input style={S.input} value={f.productTitle} onChange={set("productTitle")} placeholder="Leather Wallet" /></div>
          <div style={S.col}><label style={S.label}>Product Category</label><input style={S.input} value={f.productCategory} onChange={set("productCategory")} placeholder="Accessories" /></div>
        </div>}

        {sub === "product-photo" && <div style={S.row}><div style={S.col}><label style={S.label}>Background Style</label><input style={S.input} value={f.backgroundStyle} onChange={set("backgroundStyle")} placeholder="clean white studio, marble surface..." /></div><div style={{ minWidth: 160 }}><label style={S.label}>Size</label><select style={S.select} value={f.size} onChange={set("size")}>{["1024x1024","1792x1024","1024x1792"].map(s=><option key={s}>{s}</option>)}</select></div></div>}
        {sub === "lifestyle" && <><div style={S.row}><div style={S.col}><label style={S.label}>Scene Description *</label><input style={S.input} value={f.scene} onChange={set("scene")} placeholder="being used on a marble kitchen countertop" /></div><div style={{ minWidth: 160 }}><label style={S.label}>Style</label><select style={S.select} value={f.style} onChange={set("style")}>{["photorealistic","editorial","minimal","atmospheric"].map(s=><option key={s}>{s}</option>)}</select></div></div></>}
        {sub === "background-replace" && <div style={S.row}><div style={S.col}><label style={S.label}>New Background *</label><input style={S.input} value={f.backgroundStyle} onChange={set("backgroundStyle")} placeholder="tropical beach, dark moody studio..." /></div><div style={{ minWidth: 160 }}><label style={S.label}>Mood</label><select style={S.select} value={f.mood} onChange={set("mood")}>{["clean","moody","vibrant","dark","bright"].map(m=><option key={m}>{m}</option>)}</select></div></div>}
        {sub === "ad-creative" && <><div style={S.row}><div style={S.col}><label style={S.label}>Headline *</label><input style={S.input} value={f.headline} onChange={set("headline")} placeholder="Up to 50% Off Today Only" /></div><div style={S.col}><label style={S.label}>CTA</label><input style={S.input} value={f.cta} onChange={set("cta")} placeholder="Shop Now" /></div></div><div style={S.row}><div style={{ minWidth: 160 }}><label style={S.label}>Ad Style</label><select style={S.select} value={f.adStyle} onChange={set("adStyle")}>{["modern","bold","minimal","luxury","playful"].map(s=><option key={s}>{s}</option>)}</select></div><div style={{ minWidth: 160 }}><label style={S.label}>Aspect Ratio</label><select style={S.select} value={f.aspectRatio} onChange={set("aspectRatio")}>{["1:1","9:16","16:9"].map(r=><option key={r}>{r}</option>)}</select></div></div></>}
        {sub === "brand-logo" && <><div style={S.row}><div style={S.col}><label style={S.label}>Brand Name *</label><input style={S.input} value={f.brandName} onChange={set("brandName")} placeholder="Aura" /></div><div style={S.col}><label style={S.label}>Industry</label><input style={S.input} value={f.industry} onChange={set("industry")} placeholder="fashion, tech, food..." /></div></div><div style={S.row}><div style={{ minWidth: 180 }}><label style={S.label}>Style</label><select style={S.select} value={f.style} onChange={set("style")}>{["minimal","bold","geometric","wordmark","icon-only","vintage"].map(s=><option key={s}>{s}</option>)}</select></div><div style={S.col}><label style={S.label}>Color Palette</label><input style={S.input} value={f.colorPalette} onChange={set("colorPalette")} placeholder="navy blue and gold" /></div></div></>}
        {sub === "variant-visual" && <div style={S.row}><div style={S.col}><label style={S.label}>Original Color</label><input style={S.input} value={f.originalColor} onChange={set("originalColor")} placeholder="black" /></div><div style={S.col}><label style={S.label}>New Color *</label><input style={S.input} value={f.newColor} onChange={set("newColor")} placeholder="forest green" /></div></div>}
        {sub === "upscale-prompt" && <div style={{ marginBottom: 14 }}><label style={S.label}>Additional Details</label><textarea style={S.textarea} value={f.description} onChange={set("description")} placeholder="Premium leather texture, hand-stitched..." /></div>}

        {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
        <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handlers[sub]} disabled={loading}>
          {loading ? <><Spinner />Generating image…</> : "🎨 Generate Image"}
        </button>
        <span style={{ color: "#71717a", fontSize: 12, marginLeft: 12 }}>~5 credits</span>
      </div>
      {result?.imageUrl && (
        <ResultBlock label="Generated Image">
          <img src={result.imageUrl} alt="generated" style={{ maxWidth: "100%", borderRadius: 10, border: "1px solid #27272a", display: "block" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <a href={result.imageUrl} target="_blank" rel="noreferrer" style={{ ...S.btn, ...S.btnPurple, textDecoration: "none", display: "inline-block" }}>⬇ Download</a>
            <CopyBtn text={result.imageUrl} />
          </div>
          {result.prompt && <div style={{ marginTop: 12 }}><div style={S.resultLabel}>Prompt Used</div><p style={{ color: "#71717a", fontSize: 13, margin: 0 }}>{result.prompt}</p></div>}
        </ResultBlock>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BRAND VOICE TAB
// ═══════════════════════════════════════════════════════════
function BrandVoiceTab() {
  const [sub, setSub] = useState("view");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({ samples: "", storeName: "", industry: "", competitorUrl: "", competitorCopy: "", yourCopy: "", policyType: "returns", country: "United States", productCategory: "general e-commerce", returnWindow: "30 days", imageDescriptions: "", colorKeywords: "", moodKeywords: "", model: "gpt-4o" });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    apiFetch(`${API}/brand/voice`).then(r => r.ok && setProfile(r.profile));
  }, []);

  async function run(endpoint, body, method = "POST") {
    setLoading(true); setResult(null); setError("");
    try {
      const r = await apiFetch(`${API}/${endpoint}`, { method, headers: { "Content-Type": "application/json" }, body: method !== "DELETE" ? JSON.stringify(body) : undefined });
      if (!r.ok) setError(r.error || "Failed"); else { setResult(r); if (r.profile) setProfile(r.profile); }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const SUBS = [
    { id: "view", label: "Brand Voice" },
    { id: "train", label: "Train Voice" },
    { id: "style", label: "Visual Style" },
    { id: "competitor", label: "Competitor Analysis" },
    { id: "legal", label: "Legal Copy" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {SUBS.map(s => <button key={s.id} style={{ ...S.btn, ...(sub === s.id ? S.btnPurple : S.btnGray), ...S.btnSm }} onClick={() => { setSub(s.id); setResult(null); setError(""); }}>{s.label}</button>)}
      </div>

      {sub === "view" && (
        <div style={S.card}>
          {profile ? (<>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Active Brand Voice: {profile.storeName || "Your Store"}</div>
              <button style={{ ...S.btn, ...S.btnRed, ...S.btnSm }} onClick={async () => { await apiFetch(`${API}/brand/voice`, { method: "DELETE" }); setProfile(null); }}>Clear</button>
            </div>
            <div style={S.row}>
              {[["Tone", profile.tone], ["Style", profile.sentenceStyle], ["Emojis", profile.emojiUsage]].map(([k, v]) => v && (
                <div key={k} style={{ padding: "10px 16px", background: "#09090b", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>{k}</div><div style={{ color: "#c4b5fd" }}>{v}</div></div>
              ))}
            </div>
            {profile.powerWords?.length > 0 && <div style={{ marginBottom: 12 }}><div style={S.resultLabel}>Power Words</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{profile.powerWords.map((w, i) => <span key={i} style={{ ...S.badge, ...S.badgeGreen }}>{w}</span>)}</div></div>}
            {profile.avoidWords?.length > 0 && <div style={{ marginBottom: 12 }}><div style={S.resultLabel}>Avoid Words</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{profile.avoidWords.map((w, i) => <span key={i} style={{ ...S.badge, ...S.badgeRed }}>{w}</span>)}</div></div>}
            {profile.voiceSummary && <div style={{ padding: 14, background: "#09090b", borderRadius: 8, color: "#d4d4d8", fontSize: 14 }}>{profile.voiceSummary}</div>}
          </>) : (
            <div style={{ textAlign: "center", padding: 40, color: "#71717a" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>No brand voice trained yet</div>
              <div style={{ fontSize: 14 }}>Go to "Train Voice" and paste 3+ copy examples to get started.</div>
              <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16 }} onClick={() => setSub("train")}>Train Brand Voice →</button>
            </div>
          )}
        </div>
      )}

      {sub === "train" && (
        <div style={S.card}>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Store Name</label><input style={S.input} value={f.storeName} onChange={set("storeName")} placeholder="My Shopify Store" /></div>
            <div style={S.col}><label style={S.label}>Industry</label><input style={S.input} value={f.industry} onChange={set("industry")} placeholder="fashion, wellness, tech..." /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Sample Copy Texts * (paste 3+ examples, separate with "---")</label><textarea style={{ ...S.textarea, minHeight: 160 }} value={f.samples} onChange={set("samples")} placeholder={"Your first copy example here...\n---\nSecond copy example here...\n---\nThird copy example here..."} /></div>
          <div style={S.row}><ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} /></div>
          {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
          <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("brand/voice-train", { sampleTexts: f.samples.split("---").map(s => s.trim()).filter(Boolean), storeName: f.storeName, industry: f.industry, model: f.model })}>
            {loading ? <><Spinner />Analyzing...</> : "🎨 Train Brand Voice"}
          </button>
        </div>
      )}

      {sub === "style" && (
        <div style={S.card}>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Image Descriptions * (one per line, min 3 — describe your existing product photos)</label><textarea style={{ ...S.textarea, minHeight: 120 }} value={f.imageDescriptions} onChange={set("imageDescriptions")} placeholder={"Clean white background, harsh side lighting, dark moody shadows\nOutdoor lifestyle, golden hour, warm tones\nMinimalist flat lay, marble surface, muted palette"} /></div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Color Keywords</label><input style={S.input} value={f.colorKeywords} onChange={set("colorKeywords")} placeholder="navy, cream, gold" /></div>
            <div style={S.col}><label style={S.label}>Mood Keywords</label><input style={S.input} value={f.moodKeywords} onChange={set("moodKeywords")} placeholder="premium, minimal, cozy" /></div>
          </div>
          {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
          <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("brand/style-profile", { imageDescriptions: f.imageDescriptions.split("\n").filter(Boolean), colorKeywords: f.colorKeywords.split(",").map(c=>c.trim()).filter(Boolean), moodKeywords: f.moodKeywords.split(",").map(c=>c.trim()).filter(Boolean) })}>
            {loading ? <><Spinner />Analyzing...</> : "🖼️ Build Style Profile"}
          </button>
          {result?.styleProfile && <ResultBlock label="Image Style Profile"><pre style={S.pre}>{JSON.stringify(result.styleProfile, null, 2)}</pre>{result.masterImagePromptPrefix && <><hr style={S.divider} /><div style={S.resultLabel}>Master Image Prompt Prefix</div><div style={{ display: "flex", gap: 8 }}><p style={{ color: "#6ee7b7", flex: 1, fontSize: 14, margin: 0 }}>{result.masterImagePromptPrefix}</p><CopyBtn text={result.masterImagePromptPrefix} /></div></>}</ResultBlock>}
        </div>
      )}

      {sub === "competitor" && (
        <div style={S.card}>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Competitor URL (optional — we'll scrape the copy)</label><input style={S.input} value={f.competitorUrl} onChange={set("competitorUrl")} placeholder="https://competitor.com/products/their-product" /></div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Or Paste Competitor Copy</label><textarea style={S.textarea} value={f.competitorCopy} onChange={set("competitorCopy")} placeholder="Paste the competitor's copy here..." /></div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Your Current Copy (optional — for gap analysis)</label><textarea style={S.textarea} value={f.yourCopy} onChange={set("yourCopy")} placeholder="Paste your copy to compare..." /></div>
          <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
          {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
          <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("brand/competitor-analysis", { competitorUrl: f.competitorUrl || undefined, competitorCopy: f.competitorCopy || undefined, yourCopy: f.yourCopy || undefined, model: f.model })}>
            {loading ? <><Spinner />Analyzing...</> : "🔍 Analyze Competitor"}
          </button>
          {result && <ResultBlock label="Analysis">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[["Readability", result.readabilityScore], ["Uniqueness", result.uniquenessScore]].map(([k, v]) => <div key={k} style={{ padding: 12, background: "#09090b", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#71717a" }}>{k}</div><div style={{ fontSize: 22, fontWeight: 700, color: v >= 70 ? "#22c55e" : "#f59e0b" }}>{v}</div></div>)}
              <div style={{ padding: 12, background: "#09090b", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#71717a" }}>Tone</div><div style={{ color: "#c4b5fd", fontWeight: 600, marginTop: 4 }}>{result.tone}</div></div>
            </div>
            {result.recommendations?.length > 0 && <><div style={S.resultLabel}>Recommendations</div><ul style={{ color: "#d4d4d8", paddingLeft: 20 }}>{result.recommendations.map((r, i) => <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>{r}</li>)}</ul></>}
          </ResultBlock>}
        </div>
      )}

      {sub === "legal" && (
        <div style={S.card}>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Store Name *</label><input style={S.input} value={f.storeName} onChange={set("storeName")} placeholder="My Shopify Store" /></div>
            <div style={{ minWidth: 160 }}><label style={S.label}>Policy Type *</label><select style={S.select} value={f.policyType} onChange={set("policyType")}>{["returns","privacy","terms","shipping"].map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Country/Jurisdiction</label><input style={S.input} value={f.country} onChange={set("country")} placeholder="United States" /></div>
            <div style={S.col}><label style={S.label}>Return Window</label><input style={S.input} value={f.returnWindow} onChange={set("returnWindow")} placeholder="30 days" /></div>
          </div>
          {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
          <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("brand/legal-copy", { policyType: f.policyType, storeName: f.storeName, country: f.country, productCategory: f.productCategory, returnWindow: f.returnWindow })}>
            {loading ? <><Spinner />Generating...</> : "📄 Generate Policy"}
          </button>
          {result && <ResultBlock label={result.policyTitle || "Policy"}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div><span style={{ ...S.badge, ...S.badgeYellow, marginRight: 8 }}>⚠ AI-generated — review with legal counsel</span></div>
              <CopyBtn text={result.policyMarkdown || result.policyHtml || ""} />
            </div>
            {result.keyPoints?.length > 0 && <><div style={S.resultLabel}>Key Points</div><ul style={{ color: "#d4d4d8", paddingLeft: 20, fontSize: 14 }}>{result.keyPoints.map((p, i) => <li key={i}>{p}</li>)}</ul><hr style={S.divider} /></>}
            <pre style={{ ...S.pre, maxHeight: 400, overflow: "auto" }}>{result.policyMarkdown || result.policyHtml}</pre>
          </ResultBlock>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VIDEO & MOTION TAB
// ═══════════════════════════════════════════════════════════
function VideoTab() {
  const [sub, setSub] = useState("product-ad");
  const SUBS = [{ id: "product-ad", label: "Product Video Ad" }, { id: "spokesperson", label: "Spokesperson Script" }, { id: "seasonal", label: "Seasonal Template" }, { id: "gif-cinemagraph", label: "GIF/Cinemagraph" }];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({ productTitle: "", offer: "", duration: 15, platform: "tiktok", style: "dynamic", scriptLength: 30, persona: "friendly expert", season: "", motionStyle: "subtle loop", productCategory: "", model: "gpt-4o-mini" });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));

  async function run(endpoint, body) {
    setLoading(true); setResult(null); setError("");
    try {
      const r = await apiFetch(`${API}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) setError(r.error || "Failed"); else setResult(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const handlers = {
    "product-ad": () => run("video/product-ad", { productTitle: f.productTitle, offer: f.offer, duration: parseInt(f.duration), platform: f.platform, style: f.style, model: f.model }),
    "spokesperson": () => run("video/spokesperson", { productTitle: f.productTitle, scriptLength: parseInt(f.scriptLength), persona: f.persona, offer: f.offer, model: f.model }),
    "seasonal": () => run("video/seasonal", { productTitle: f.productTitle, season: f.season, discount: f.offer, model: f.model }),
    "gif-cinemagraph": () => run("video/gif-cinemagraph", { productTitle: f.productTitle, productCategory: f.productCategory, motionStyle: f.motionStyle }),
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {SUBS.map(s => <button key={s.id} style={{ ...S.btn, ...(sub === s.id ? S.btnPurple : S.btnGray), ...S.btnSm }} onClick={() => { setSub(s.id); setResult(null); setError(""); }}>{s.label}</button>)}
      </div>
      <div style={S.card}>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Product Title *</label><input style={S.input} value={f.productTitle} onChange={set("productTitle")} placeholder="Wireless Earbuds Pro" /></div>
          {sub !== "gif-cinemagraph" && <div style={S.col}><label style={S.label}>{sub === "seasonal" ? "Season/Holiday *" : "Offer/USP"}</label><input style={S.input} value={sub === "seasonal" ? f.season : f.offer} onChange={set(sub === "seasonal" ? "season" : "offer")} placeholder={sub === "seasonal" ? "Black Friday, Christmas, Valentine's Day" : "Limited time offer"} /></div>}
        </div>
        <div style={S.row}>
          {sub === "product-ad" && <><div style={{ minWidth: 180 }}><label style={S.label}>Platform</label><select style={S.select} value={f.platform} onChange={set("platform")}>{["tiktok","instagram","youtube","facebook"].map(p=><option key={p}>{p}</option>)}</select></div><div style={{ minWidth: 120 }}><label style={S.label}>Duration (sec)</label><select style={S.select} value={f.duration} onChange={set("duration")}>{[5,10,15,30,60].map(d=><option key={d}>{d}</option>)}</select></div></>}
          {sub === "spokesperson" && <><div style={{ minWidth: 130 }}><label style={S.label}>Script Length (sec)</label><input style={S.input} type="number" min={10} max={120} value={f.scriptLength} onChange={set("scriptLength")} /></div><div style={S.col}><label style={S.label}>Persona</label><input style={S.input} value={f.persona} onChange={set("persona")} placeholder="confident fitness coach" /></div></>}
          {sub === "gif-cinemagraph" && <><div style={S.col}><label style={S.label}>Product Category</label><input style={S.input} value={f.productCategory} onChange={set("productCategory")} placeholder="beverage, candle..." /></div><div style={S.col}><label style={S.label}>Motion Style</label><select style={S.select} value={f.motionStyle} onChange={set("motionStyle")}>{["subtle loop","steam rising","ripple effect","sparkle","liquid pour"].map(m=><option key={m}>{m}</option>)}</select></div></>}
          {sub !== "gif-cinemagraph" && <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />}
        </div>
        {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
        <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handlers[sub]} disabled={loading}>
          {loading ? <><Spinner />Generating...</> : "🎬 Generate"}
        </button>
      </div>
      {result && (
        <ResultBlock label="Video Plan">
          {result.storyboard?.length > 0 && <>
            <div style={S.resultLabel}>Storyboard</div>
            {result.storyboard.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8, padding: "10px 14px", background: "#09090b", borderRadius: 8 }}>
                <span style={{ ...S.badge, ...S.badgePurple, minWidth: 60, textAlign: "center" }}>{s.second || s.scene || `Scene ${i + 1}`}</span>
                <div style={{ flex: 1, fontSize: 13 }}>
                  <div style={{ color: "#6ee7b7" }}>🎥 {s.visual || s.onScreen}</div>
                  {(s.audio || s.voiceover) && <div style={{ color: "#d4d4d8", marginTop: 4 }}>🎙 {s.audio || s.voiceover}</div>}
                  {s.textOverlay && <div style={{ color: "#f59e0b", marginTop: 4 }}>💬 {s.textOverlay}</div>}
                </div>
              </div>
            ))}
          </>}
          {result.voiceoverScript && <><hr style={S.divider} /><div style={{ display: "flex", justifyContent: "space-between" }}><div style={S.resultLabel}>Voiceover Script</div><CopyBtn text={result.voiceoverScript} /></div><pre style={S.pre}>{result.voiceoverScript}</pre></>}
          {result.script && <><hr style={S.divider} /><div style={{ display: "flex", justifyContent: "space-between" }}><div style={S.resultLabel}>Spoken Script</div><CopyBtn text={result.script} /></div><pre style={S.pre}>{result.script}</pre></>}
          {result.imageUrl && <><hr style={S.divider} /><div style={S.resultLabel}>Base Frame Image</div><img src={result.imageUrl} alt="base frame" style={{ maxWidth: 300, borderRadius: 10, border: "1px solid #27272a", display: "block", marginBottom: 8 }} /><a href={result.imageUrl} target="_blank" rel="noreferrer" style={{ ...S.btn, ...S.btnPurple, ...S.btnSm, textDecoration: "none", display: "inline-block" }}>⬇ Download Frame</a></>}
          {result.falApiPayload && <><hr style={S.divider} /><div style={S.resultLabel}>fal.ai API Payload</div><pre style={S.pre}>{JSON.stringify(result.falApiPayload || result.falApiPrompt, null, 2)}</pre></>}
        </ResultBlock>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BLOG TAB
// ═══════════════════════════════════════════════════════════
function BlogTab() {
  const [sub, setSub] = useState("generate");
  const SUBS = [{ id: "generate", label: "Blog Post Generator" }, { id: "image-pack", label: "Image Pack" }, { id: "repurpose", label: "Content Repurposer" }];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({ keyword: "", productCategory: "", wordCount: 1200, blogTitle: "", sections: "", style: "editorial photography", content: "", sourceUrl: "", storeName: "", count: 3, model: "gpt-4o" });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));

  async function run(endpoint, body) {
    setLoading(true); setResult(null); setError("");
    try {
      const r = await apiFetch(`${API}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) setError(r.error || "Failed"); else setResult(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {SUBS.map(s => <button key={s.id} style={{ ...S.btn, ...(sub === s.id ? S.btnPurple : S.btnGray), ...S.btnSm }} onClick={() => { setSub(s.id); setResult(null); setError(""); }}>{s.label}</button>)}
      </div>
      <div style={S.card}>
        {sub === "generate" && <>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Target Keyword *</label><input style={S.input} value={f.keyword} onChange={set("keyword")} placeholder="best leather wallets for men" /></div>
            <div style={S.col}><label style={S.label}>Product Category</label><input style={S.input} value={f.productCategory} onChange={set("productCategory")} placeholder="accessories" /></div>
          </div>
          <div style={S.row}><div style={{ minWidth: 160 }}><label style={S.label}>Word Count</label><select style={S.select} value={f.wordCount} onChange={set("wordCount")}>{[800,1200,1500,2000].map(w=><option key={w}>{w}</option>)}</select></div><ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} /></div>
          {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
          <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("blog/generate", { keyword: f.keyword, productCategory: f.productCategory, wordCount: parseInt(f.wordCount), model: f.model })}>
            {loading ? <><Spinner />Writing... (30-60s)</> : "✍️ Generate Blog Post"}
          </button>
        </>}

        {sub === "image-pack" && <>
          <div style={S.row}><div style={S.col}><label style={S.label}>Blog Title *</label><input style={S.input} value={f.blogTitle} onChange={set("blogTitle")} placeholder="10 Best Leather Wallets for Men in 2026" /></div><div style={{ minWidth: 120 }}><label style={S.label}>Image Count</label><input style={S.input} type="number" min={1} max={6} value={f.count} onChange={set("count")} /></div></div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>H2 Section Titles (one per line, optional)</label><textarea style={S.textarea} value={f.sections} onChange={set("sections")} placeholder={"Why Quality Leather Matters\nTop Brands Compared\nHow to Choose"} /></div>
          {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
          <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("blog/image-pack", { blogTitle: f.blogTitle, sections: f.sections.split("\n").filter(Boolean), style: f.style, count: parseInt(f.count) })}>
            {loading ? <><Spinner />Generating images...</> : "🎨 Generate Image Pack"}
          </button>
        </>}

        {sub === "repurpose" && <>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Source URL (optional — paste URL to scrape)</label><input style={S.input} value={f.sourceUrl} onChange={set("sourceUrl")} placeholder="https://myblog.com/post/..." /></div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Or Paste Content</label><textarea style={{ ...S.textarea, minHeight: 120 }} value={f.content} onChange={set("content")} placeholder="Paste your blog post or article content here..." /></div>
          <div style={S.row}><div style={S.col}><label style={S.label}>Store Name</label><input style={S.input} value={f.storeName} onChange={set("storeName")} placeholder="My Store" /></div><ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} /></div>
          {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
          <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("blog/repurpose", { content: f.content || undefined, sourceUrl: f.sourceUrl || undefined, storeName: f.storeName, model: f.model })}>
            {loading ? <><Spinner />Repurposing...</> : "♻️ Repurpose Content"}
          </button>
        </>}
      </div>

      {result && (
        <ResultBlock label={sub === "generate" ? result.title || "Blog Post" : sub === "image-pack" ? "Image Pack" : "Repurposed Content"}>
          {sub === "generate" && <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span style={{ ...S.badge, ...S.badgePurple }}>{result.wordCountActual || "~1200"} words</span>
              <span style={{ ...S.badge, ...S.badgeGreen }}>{result.seoTitle?.length || 0} char title</span>
              <CopyBtn text={result.fullPost || ""} />
            </div>
            {result.seoTitle && <div style={{ marginBottom: 10 }}><div style={S.resultLabel}>SEO Title</div><code style={{ color: "#a78bfa" }}>{result.seoTitle}</code></div>}
            {result.metaDescription && <div style={{ marginBottom: 10 }}><div style={S.resultLabel}>Meta Description</div><code style={{ color: "#6ee7b7", fontSize: 13 }}>{result.metaDescription}</code></div>}
            {result.featuredImageUrl && <img src={result.featuredImageUrl} alt="featured" style={{ maxWidth: "100%", borderRadius: 10, border: "1px solid #27272a", marginBottom: 12, display: "block" }} />}
            {result.fullPost && <><hr style={S.divider} /><div style={S.resultLabel}>Full Post (Markdown)</div><pre style={{ ...S.pre, maxHeight: 500, overflow: "auto" }}>{result.fullPost}</pre></>}
          </>}
          {sub === "image-pack" && (
            <div style={S.imageGrid}>
              {result.images?.map((img, i) => img.url && (
                <div key={i} style={S.imageCard}>
                  <img src={img.url} alt={img.section} style={S.imageImg} />
                  <div style={{ padding: 10 }}><div style={{ fontSize: 12, color: "#a1a1aa" }}>{img.section}</div><a href={img.url} target="_blank" rel="noreferrer" style={{ ...S.btn, ...S.btnPurple, ...S.btnSm, textDecoration: "none", display: "inline-block", marginTop: 8 }}>⬇</a></div>
                </div>
              ))}
            </div>
          )}
          {sub === "repurpose" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Instagram", result.instagram?.caption], ["TikTok Hook", result.tiktok?.hook], ["Twitter Thread", result.twitter?.thread?.join("\n\n")], ["Email Subject", result.email?.subject], ["SMS/Push", result.smsOrPush], ["Pinterest", result.pinterest?.description]].map(([label, text]) => text && (
                <div key={label} style={{ padding: 14, background: "#09090b", borderRadius: 8, border: "1px solid #27272a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><div style={S.resultLabel}>{label}</div><CopyBtn text={String(text)} /></div>
                  <p style={{ color: "#d4d4d8", fontSize: 13, margin: 0, whiteSpace: "pre-wrap" }}>{String(text).slice(0, 200)}{String(text).length > 200 ? "…" : ""}</p>
                </div>
              ))}
            </div>
          )}
        </ResultBlock>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// QUALITY / ANALYZE TAB
// ═══════════════════════════════════════════════════════════
function QualityTab() {
  const [sub, setSub] = useState("score");
  const SUBS = [{ id: "score", label: "Content Scorer" }, { id: "vision", label: "Product Image Analyzer" }];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({ content: "", contentType: "product-description", keyword: "", imageUrl: "", model: "gpt-4o-mini" });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));

  async function run(endpoint, body) {
    setLoading(true); setResult(null); setError("");
    try {
      const r = await apiFetch(`${API}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) setError(r.error || "Failed"); else setResult(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {SUBS.map(s => <button key={s.id} style={{ ...S.btn, ...(sub === s.id ? S.btnPurple : S.btnGray), ...S.btnSm }} onClick={() => { setSub(s.id); setResult(null); setError(""); }}>{s.label}</button>)}
      </div>
      <div style={S.card}>
        {sub === "score" && <>
          <div style={S.row}><div style={{ minWidth: 200 }}><label style={S.label}>Content Type</label><select style={S.select} value={f.contentType} onChange={set("contentType")}>{["product-description","meta-title","email-subject","ad-copy","blog-intro","social-caption"].map(t=><option key={t}>{t}</option>)}</select></div><div style={S.col}><label style={S.label}>Target Keyword</label><input style={S.input} value={f.keyword} onChange={set("keyword")} placeholder="leather wallet men" /></div><ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} /></div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Content to Score *</label><textarea style={{ ...S.textarea, minHeight: 140 }} value={f.content} onChange={set("content")} placeholder="Paste your product description, meta tag, or copy to score..." /></div>
          {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
          <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("analyze/content-quality", { content: f.content, contentType: f.contentType, keyword: f.keyword, model: f.model })}>
            {loading ? <><Spinner />Scoring...</> : "🔍 Score & Improve"}
          </button>
        </>}
        {sub === "vision" && <>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Product Image URL *</label><input style={S.input} value={f.imageUrl} onChange={set("imageUrl")} placeholder="https://cdn.shopify.com/..." /></div>
          {f.imageUrl && <img src={f.imageUrl} alt="preview" style={{ maxHeight: 200, borderRadius: 8, marginBottom: 14, border: "1px solid #27272a", display: "block" }} onError={e => { e.target.style.display = "none"; }} />}
          <ModelSelect value={f.model} onChange={v => setF(p => ({ ...p, model: v }))} />
          {error && <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14 }}>⚠ {error}</div>}
          <button style={{ ...S.btn, ...S.btnPurple, marginTop: 16, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("analyze/product-image", { imageUrl: f.imageUrl, model: f.model })}>
            {loading ? <><Spinner />Analyzing...</> : "👁 Analyze Image"}
          </button>
        </>}
      </div>

      {result && sub === "score" && (
        <ResultBlock label={`Content Grade: ${result.grade || "—"}`}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 40, fontWeight: 900, color: result.grade?.startsWith("A") ? "#22c55e" : result.grade?.startsWith("B") ? "#f59e0b" : "#ef4444" }}>{result.grade}</span>
            <div style={{ flex: 1 }}>
              {Object.entries(result.scores || {}).map(([k, v]) => v != null && <ScoreRow key={k} label={k.replace(/([A-Z])/g, " $1")} value={v} />)}
            </div>
          </div>
          {result.keyIssues?.length > 0 && <><hr style={S.divider} /><div style={S.resultLabel}>Issues</div>{result.keyIssues.map((iss, i) => <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 14px", background: "#09090b", borderRadius: 8 }}><span style={{ ...S.badge, ...(iss.severity === "high" ? S.badgeRed : iss.severity === "medium" ? S.badgeYellow : S.badgePurple) }}>{iss.severity}</span><div style={{ flex: 1, fontSize: 13 }}><div style={{ color: "#d4d4d8" }}>{iss.issue}</div><div style={{ color: "#71717a", marginTop: 2 }}>Fix: {iss.fix}</div></div></div>)}</>}
          {result.improvedVersion && <><hr style={S.divider} /><div style={{ display: "flex", justifyContent: "space-between" }}><div style={S.resultLabel}>Improved Version</div><CopyBtn text={result.improvedVersion} /></div><div style={{ background: "#09090b", borderRadius: 8, padding: 14, color: "#d4d4d8", fontSize: 14, lineHeight: 1.7 }}>{result.improvedVersion}</div></>}
        </ResultBlock>
      )}

      {result && sub === "vision" && (
        <ResultBlock label="Product Analysis">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[["Category", result.productCategory], ["Type", result.productType], ["Price Tier", result.priceTier], ["Target Audience", result.targetAudience], ["Season", result.season]].map(([k, v]) => v && <div key={k} style={{ padding: "10px 14px", background: "#09090b", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#71717a" }}>{k}</div><div style={{ color: "#c4b5fd", marginTop: 4 }}>{v}</div></div>)}
          </div>
          {result.colors?.length > 0 && <><div style={S.resultLabel}>Colors Detected</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>{result.colors.map((c, i) => <span key={i} style={{ ...S.badge, background: "#27272a", color: "#e4e4e7" }}>{c}</span>)}</div></>}
          {result.suggestedKeywords?.length > 0 && <><div style={S.resultLabel}>SEO Keywords</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>{result.suggestedKeywords.map((k, i) => <span key={i} style={{ ...S.badge, ...S.badgePurple }}>{k}</span>)}</div></>}
          {result.shortDescription && <><div style={S.resultLabel}>Description from Image</div><p style={{ color: "#d4d4d8", fontSize: 14, margin: 0 }}>{result.shortDescription}</p></>}
          {result.altText && <><hr style={S.divider} /><div style={{ display: "flex", justifyContent: "space-between" }}><div style={S.resultLabel}>Alt Text (SEO)</div><CopyBtn text={result.altText} /></div><code style={{ color: "#6ee7b7", fontSize: 13 }}>{result.altText}</code></>}
        </ResultBlock>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HISTORY TAB
// ═══════════════════════════════════════════════════════════
function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`${API}/history${typeFilter ? `?type=${typeFilter}` : ""}`);
      if (r.ok) setHistory(r.history || []);
    } finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  async function del(id) {
    await apiFetch(`${API}/history/${id}`, { method: "DELETE" });
    setHistory(h => h.filter(x => x.id !== id));
  }

  const types = [...new Set(history.map(h => h.type))].sort();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={{ ...S.btn, ...(typeFilter === "" ? S.btnPurple : S.btnGray), ...S.btnSm }} onClick={() => setTypeFilter("")}>All</button>
          {types.map(t => <button key={t} style={{ ...S.btn, ...(typeFilter === t ? S.btnPurple : S.btnGray), ...S.btnSm }} onClick={() => setTypeFilter(t)}>{t}</button>)}
        </div>
        <button style={{ ...S.btn, ...S.btnGray, ...S.btnSm }} onClick={load}>↻ Refresh</button>
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#71717a" }}><Spinner /> Loading...</div> :
        history.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "#71717a" }}>No history yet — generate something to see it here.</div> : (
          history.map(item => (
            <div key={item.id} style={{ ...S.card, padding: "14px 16px", cursor: "pointer" }} onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ ...S.badge, ...S.badgePurple, marginRight: 10 }}>{item.type}</span>
                  <span style={{ color: "#d4d4d8", fontSize: 14 }}>{item.title || item.keyword || item.niche || item.campaign || "—"}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#71717a", fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <button style={{ ...S.btn, ...S.btnRed, ...S.btnSm }} onClick={e => { e.stopPropagation(); del(item.id); }}>✕</button>
                </div>
              </div>
              {expanded === item.id && <pre style={{ ...S.pre, marginTop: 12 }}>{JSON.stringify(item, null, 2)}</pre>}
            </div>
          ))
        )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function AIContentImageGen() {
  const [tab, setTab] = useState("product");

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>🤖 AI Content & Image Gen</h1>
        <p style={S.subtitle}>38 AI-powered tools — product copy, ad creative, social media, images, video, blog posts, and more.</p>
      </div>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={{ ...S.tab, ...(tab === t.id ? S.tabActive : S.tabInact) }} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "product" && <ProductContentTab />}
      {tab === "ads" && <AdCopyTab />}
      {tab === "social" && <SocialTab />}
      {tab === "images" && <ImagesTab />}
      {tab === "brand" && <BrandVoiceTab />}
      {tab === "video" && <VideoTab />}
      {tab === "blog" && <BlogTab />}
      {tab === "quality" && <QualityTab />}
      {tab === "history" && <HistoryTab />}
    </div>
  );
}
