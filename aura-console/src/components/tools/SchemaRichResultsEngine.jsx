import React, { useState, useRef, useEffect, useCallback } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, MozCard, ErrorBox, EmptyState, Spinner, SortableTable } from "../MozUI";

const API = "/api/schema-rich-results-engine";

const S = {
  page: { background: "#09090b", minHeight: "100vh", padding: "28px 32px", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif" },
  title: { fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 },
  sub: { fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 20 },
  inputRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "monospace", lineHeight: 1.6 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, background: c === "good" ? "#052e16" : c === "red" ? "#3f1315" : c === "yellow" ? "#3d2a0a" : "#27272a", color: c === "good" ? "#4ade80" : c === "red" ? "#f87171" : c === "yellow" ? "#fbbf24" : "#a1a1aa" }),
  label: { fontSize: 12, color: "#71717a", marginBottom: 4, fontWeight: 600 },
  field: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 13, padding: "9px 12px", outline: "none", width: "100%", boxSizing: "border-box" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
};

const SCHEMA_TYPES = [
  { id: "Product", label: "Product", icon: "🛍️", desc: "Enables price, availability & star ratings in SERPs" },
  { id: "Article", label: "Article / Blog Post", icon: "📝", desc: "Enables article rich results with author, date, image" },
  { id: "FAQPage", label: "FAQ Page", icon: "❓", desc: "Expandable FAQ accordions in SERPs" },
  { id: "HowTo", label: "HowTo", icon: "🔧", desc: "Step-by-step instructions with images in SERPs" },
  { id: "LocalBusiness", label: "Local Business", icon: "🏪", desc: "Knowledge panel with hours, phone, location" },
  { id: "BreadcrumbList", label: "Breadcrumb", icon: "🧭", desc: "Breadcrumb navigation in SERP URLs" },
  { id: "Review", label: "Review / AggregateRating", icon: "⭐", desc: "Star ratings visible in organic results" },
  { id: "VideoObject", label: "Video Object", icon: "🎥", desc: "Video thumbnail and duration in SERPs" },
  { id: "Event", label: "Event", icon: "📅", desc: "Event rich results with date, location, ticket link" },
  { id: "Organization", label: "Organization", icon: "🏢", desc: "Brand entity signals and logo in Knowledge Panel" },
];

const SCHEMA_FIELDS = {
  Product: [
    { key: "name", label: "Product Name", placeholder: "e.g. Leather Bi-fold Wallet" },
    { key: "description", label: "Description", placeholder: "Product description..." },
    { key: "image", label: "Image URL", placeholder: "https://..." },
    { key: "price", label: "Price", placeholder: "e.g. 49.99" },
    { key: "currency", label: "Currency", placeholder: "USD" },
    { key: "availability", label: "Availability", options: ["InStock", "OutOfStock", "PreOrder", "BackOrder"] },
    { key: "brand", label: "Brand Name", placeholder: "e.g. Your Brand" },
    { key: "sku", label: "SKU", placeholder: "e.g. WALLET-BLK-001" },
    { key: "ratingValue", label: "Rating Value (0–5)", placeholder: "e.g. 4.7" },
    { key: "reviewCount", label: "Review Count", placeholder: "e.g. 128" },
  ],
  Article: [
    { key: "headline", label: "Article Title", placeholder: "e.g. 10 Ways to Improve Your SEO" },
    { key: "description", label: "Description", placeholder: "Brief article summary..." },
    { key: "image", label: "Featured Image URL", placeholder: "https://..." },
    { key: "authorName", label: "Author Name", placeholder: "e.g. Jane Smith" },
    { key: "publisherName", label: "Publisher (Brand)", placeholder: "e.g. Your Store" },
    { key: "datePublished", label: "Date Published", placeholder: "2024-01-15" },
    { key: "dateModified", label: "Date Modified", placeholder: "2024-06-01" },
    { key: "url", label: "Article URL", placeholder: "https://yourstore.com/blog/..." },
  ],
  FAQPage: [
    { key: "q1", label: "Question 1", placeholder: "What is your return policy?" },
    { key: "a1", label: "Answer 1", placeholder: "We offer 30-day returns..." },
    { key: "q2", label: "Question 2", placeholder: "How long does shipping take?" },
    { key: "a2", label: "Answer 2", placeholder: "Standard shipping takes 3-5 days..." },
    { key: "q3", label: "Question 3", placeholder: "Do you ship internationally?" },
    { key: "a3", label: "Answer 3", placeholder: "Yes, we ship to 50+ countries..." },
    { key: "q4", label: "Question 4 (optional)", placeholder: "" },
    { key: "a4", label: "Answer 4 (optional)", placeholder: "" },
  ],
  HowTo: [
    { key: "name", label: "How-To Title", placeholder: "e.g. How to Care for Leather Goods" },
    { key: "description", label: "Description", placeholder: "Learn how to..." },
    { key: "totalTime", label: "Total Time", placeholder: "e.g. PT10M (10 minutes)" },
    { key: "step1", label: "Step 1", placeholder: "Wipe with a dry cloth..." },
    { key: "step2", label: "Step 2", placeholder: "Apply leather conditioner..." },
    { key: "step3", label: "Step 3", placeholder: "Buff to a shine..." },
    { key: "step4", label: "Step 4 (optional)", placeholder: "" },
  ],
  LocalBusiness: [
    { key: "name", label: "Business Name", placeholder: "e.g. Your Store" },
    { key: "description", label: "Description", placeholder: "What your business does..." },
    { key: "url", label: "Website URL", placeholder: "https://yourstore.com" },
    { key: "telephone", label: "Phone Number", placeholder: "+1-555-555-5555" },
    { key: "streetAddress", label: "Street Address", placeholder: "123 Main St" },
    { key: "city", label: "City", placeholder: "New York" },
    { key: "region", label: "State / Region", placeholder: "NY" },
    { key: "postalCode", label: "Postal Code", placeholder: "10001" },
    { key: "country", label: "Country", placeholder: "US" },
    { key: "openingHours", label: "Opening Hours", placeholder: "Mo-Fr 09:00-17:00" },
  ],
  Review: [
    { key: "itemName", label: "Item / Product Name", placeholder: "e.g. Leather Wallet" },
    { key: "ratingValue", label: "Rating Value", placeholder: "4.8" },
    { key: "bestRating", label: "Best Rating", placeholder: "5" },
    { key: "ratingCount", label: "Rating Count", placeholder: "241" },
  ],
  VideoObject: [
    { key: "name", label: "Video Title", placeholder: "e.g. Product Overview" },
    { key: "description", label: "Description", placeholder: "Watch our product video..." },
    { key: "thumbnailUrl", label: "Thumbnail URL", placeholder: "https://..." },
    { key: "uploadDate", label: "Upload Date", placeholder: "2024-01-15" },
    { key: "duration", label: "Duration (ISO 8601)", placeholder: "PT3M45S" },
    { key: "contentUrl", label: "Video URL", placeholder: "https://youtube.com/..." },
  ],
  Event: [
    { key: "name", label: "Event Name", placeholder: "e.g. Summer Sale Launch" },
    { key: "description", label: "Description", placeholder: "Join us for our biggest sale..." },
    { key: "startDate", label: "Start Date & Time", placeholder: "2024-07-04T10:00:00" },
    { key: "endDate", label: "End Date & Time", placeholder: "2024-07-04T20:00:00" },
    { key: "location", label: "Location Name", placeholder: "e.g. Online or Venue Name" },
    { key: "url", label: "Event URL / Ticket Link", placeholder: "https://..." },
    { key: "organizer", label: "Organizer Name", placeholder: "Your Brand" },
  ],
  Organization: [
    { key: "name", label: "Organization Name", placeholder: "Your Brand" },
    { key: "url", label: "Website", placeholder: "https://yourstore.com" },
    { key: "logo", label: "Logo URL", placeholder: "https://yourstore.com/logo.png" },
    { key: "description", label: "Description", placeholder: "What your brand does..." },
    { key: "email", label: "Contact Email", placeholder: "hello@yourstore.com" },
    { key: "telephone", label: "Phone", placeholder: "+1-555-555-5555" },
    { key: "sameAs_twitter", label: "Twitter URL", placeholder: "https://twitter.com/yourbrand" },
    { key: "sameAs_instagram", label: "Instagram URL", placeholder: "https://instagram.com/yourbrand" },
    { key: "sameAs_facebook", label: "Facebook URL", placeholder: "https://facebook.com/yourbrand" },
  ],
  BreadcrumbList: [
    { key: "item1Name", label: "Item 1 Name", placeholder: "Home" },
    { key: "item1Url", label: "Item 1 URL", placeholder: "https://yourstore.com" },
    { key: "item2Name", label: "Item 2 Name", placeholder: "Collections" },
    { key: "item2Url", label: "Item 2 URL", placeholder: "https://yourstore.com/collections" },
    { key: "item3Name", label: "Item 3 Name", placeholder: "Product" },
    { key: "item3Url", label: "Item 3 URL", placeholder: "https://yourstore.com/products/..." },
  ],
};

function buildSchema(type, fields) {
  const f = fields;
  if (type === "Product") {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: f.name, description: f.description, image: f.image ? [f.image] : undefined,
      sku: f.sku, brand: f.brand ? { "@type": "Brand", name: f.brand } : undefined,
      offers: {
        "@type": "Offer",
        price: f.price, priceCurrency: f.currency || "USD",
        availability: f.availability ? `https://schema.org/${f.availability}` : "https://schema.org/InStock",
      },
      aggregateRating: f.ratingValue ? { "@type": "AggregateRating", ratingValue: f.ratingValue, reviewCount: f.reviewCount || "1" } : undefined,
    };
  }
  if (type === "Article") {
    return {
      "@context": "https://schema.org", "@type": "Article",
      headline: f.headline, description: f.description, image: f.image ? [f.image] : undefined,
      author: f.authorName ? { "@type": "Person", name: f.authorName } : undefined,
      publisher: f.publisherName ? { "@type": "Organization", name: f.publisherName } : undefined,
      datePublished: f.datePublished, dateModified: f.dateModified, url: f.url,
    };
  }
  if (type === "FAQPage") {
    const entries = [1, 2, 3, 4].filter(i => f[`q${i}`] && f[`a${i}`]).map(i => ({ "@type": "Question", name: f[`q${i}`], acceptedAnswer: { "@type": "Answer", text: f[`a${i}`] } }));
    return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: entries };
  }
  if (type === "HowTo") {
    const steps = [1, 2, 3, 4].filter(i => f[`step${i}`]).map((i, idx) => ({ "@type": "HowToStep", position: idx + 1, text: f[`step${i}`] }));
    return { "@context": "https://schema.org", "@type": "HowTo", name: f.name, description: f.description, totalTime: f.totalTime, step: steps };
  }
  if (type === "LocalBusiness") {
    return {
      "@context": "https://schema.org", "@type": "LocalBusiness",
      name: f.name, description: f.description, url: f.url, telephone: f.telephone,
      address: { "@type": "PostalAddress", streetAddress: f.streetAddress, addressLocality: f.city, addressRegion: f.region, postalCode: f.postalCode, addressCountry: f.country },
      openingHours: f.openingHours,
    };
  }
  if (type === "Review") {
    return { "@context": "https://schema.org", "@type": "AggregateRating", itemReviewed: { "@type": "Product", name: f.itemName }, ratingValue: f.ratingValue, bestRating: f.bestRating || "5", ratingCount: f.ratingCount };
  }
  if (type === "VideoObject") {
    return { "@context": "https://schema.org", "@type": "VideoObject", name: f.name, description: f.description, thumbnailUrl: f.thumbnailUrl, uploadDate: f.uploadDate, duration: f.duration, contentUrl: f.contentUrl };
  }
  if (type === "Event") {
    return { "@context": "https://schema.org", "@type": "Event", name: f.name, description: f.description, startDate: f.startDate, endDate: f.endDate, location: { "@type": "Place", name: f.location }, url: f.url, organizer: { "@type": "Organization", name: f.organizer } };
  }
  if (type === "Organization") {
    const sameAs = [f.sameAs_twitter, f.sameAs_instagram, f.sameAs_facebook].filter(Boolean);
    return { "@context": "https://schema.org", "@type": "Organization", name: f.name, url: f.url, logo: f.logo ? { "@type": "ImageObject", url: f.logo } : undefined, description: f.description, email: f.email, telephone: f.telephone, sameAs: sameAs.length ? sameAs : undefined };
  }
  if (type === "BreadcrumbList") {
    const items = [1, 2, 3].filter(i => f[`item${i}Name`]).map((i, idx) => ({ "@type": "ListItem", position: idx + 1, name: f[`item${i}Name`], item: f[`item${i}Url`] }));
    return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
  }
  return {};
}

const TABS = [
  { id: "generate", label: "AI Generate" },
  { id: "builder", label: "Schema Builder" },
  { id: "analyze", label: "AI Analyze" },
  { id: "deploy", label: "Deploy to Shopify" },
  { id: "history", label: "History" },
];

export default function SchemaRichResultsEngine() {
  const [tab, setTab] = useState("generate");

  // AI Generate tab
  const [genPrompt, setGenPrompt] = useState("");
  const [genType, setGenType] = useState("Product");
  const [genResult, setGenResult] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  // Schema Builder tab
  const [builderType, setBuilderType] = useState("Product");
  const [builderFields, setBuilderFields] = useState({});
  const [builtSchema, setBuiltSchema] = useState(null);

  // AI Analyze tab
  const [analyzeInput, setAnalyzeInput] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  // Deploy tab
  const [deploySchema, setDeploySchema] = useState("");
  const [deployType, setDeployType] = useState("product");
  const [deployEntityId, setDeployEntityId] = useState("");
  const [deployBlogId, setDeployBlogId] = useState("");
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployResult, setDeployResult] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const fileRef = useRef();

  const loadHistory = useCallback(async () => {
    try {
      const r = await apiFetchJSON(`${API}/history`);
      if (r.ok) setHistory(r.history || []);
    } catch {}
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const aiGenerate = async () => {
    if (!genPrompt.trim()) return;
    setGenLoading(true); setGenError(""); setGenResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: genType, prompt: genPrompt, data: { description: genPrompt } }),
      });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      setGenResult(r);
      loadHistory();
    } catch (e) { setGenError(e.message); }
    finally { setGenLoading(false); }
  };

  const aiAnalyze = async () => {
    if (!analyzeInput.trim()) return;
    setAnalyzeLoading(true); setAnalyzeError(""); setAnalyzeResult(null);
    try {
      let schemaObj;
      try { schemaObj = JSON.parse(analyzeInput); } catch { schemaObj = { raw: analyzeInput }; }
      const r = await apiFetchJSON(`${API}/ai/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: analyzeInput }),
      });
      if (!r.ok) throw new Error(r.error || "Analysis failed");
      setAnalyzeResult(r);
    } catch (e) { setAnalyzeError(e.message); }
    finally { setAnalyzeLoading(false); }
  };

  const deployToShopify = async () => {
    if (!deploySchema.trim() || !deployEntityId.trim()) return;
    setDeployLoading(true); setDeployResult(null);
    try {
      const r = await apiFetchJSON(`${API}/shopify/apply`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: deployType, entityId: deployEntityId,
          blogId: deployBlogId || undefined,
          schema: `<script type="application/ld+json">${deploySchema}</script>`,
        }),
      });
      setDeployResult(r);
    } catch (e) { setDeployResult({ ok: false, error: e.message }); }
    finally { setDeployLoading(false); }
  };

  const buildFromForm = () => {
    const schema = buildSchema(builderType, builderFields);
    const json = JSON.stringify(schema, null, 2);
    setBuiltSchema(json);
    setDeploySchema(json);
  };

  const setField = (key, val) => setBuilderFields(f => ({ ...f, [key]: val }));

  const copyToClipboard = (text) => navigator.clipboard?.writeText(text);

  const openGoogleTest = (schema) => {
    const encoded = encodeURIComponent(schema);
    window.open(`https://search.google.com/test/rich-results?code=${encoded}`, "_blank");
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "schema-history.json"; a.click();
  };

  const generatedJson = genResult?.schema ? (typeof genResult.schema === "string" ? genResult.schema : JSON.stringify(genResult.schema, null, 2)) : null;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={S.title}>Schema &amp; Rich Results Engine</h1>
        <p style={S.sub}>Generate, build, validate &amp; deploy JSON-LD structured data. Unlock rich results — star ratings, FAQs, prices, breadcrumbs &amp; more in Google Search. Google's schema validation depth for Shopify.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* AI GENERATE */}
      {tab === "generate" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Schema Generator</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Describe your page or product and AI will generate complete, valid JSON-LD schema ready to deploy. Choose the schema type you want to target.</p>
            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>Schema Type to Generate</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SCHEMA_TYPES.map(t => (
                  <button key={t.id} onClick={() => setGenType(t.id)} style={{ ...S.btn(t.id === genType ? "primary" : ""), fontSize: 12, padding: "6px 12px" }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={S.label}>Describe your page / product</div>
            <textarea style={{ ...S.ta, height: 100 }} value={genPrompt} onChange={e => setGenPrompt(e.target.value)} placeholder={`Describe your ${genType} for AI to generate accurate schema. E.g. "Handmade leather bifold wallet, black, price £49.99, 4.8 stars from 128 reviews, in stock"`} />
            <div style={{ marginTop: 12 }}>
              <button style={S.btn("primary")} onClick={aiGenerate} disabled={genLoading}>{genLoading ? "Generating…" : "Generate with AI"}</button>
            </div>
          </div>
          {genError && <ErrorBox message={genError} />}
          {genLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>}
          {genResult && (
            <>
              {(genResult.reply || genResult.report) && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>AI Notes</div>
                  <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{genResult.reply || genResult.report}</div>
                </div>
              )}
              {generatedJson && (
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={S.sectionTitle}>Generated JSON-LD</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => copyToClipboard(`<script type="application/ld+json">${generatedJson}</script>`)}>Copy Script Tag</button>
                      <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => openGoogleTest(generatedJson)}>Test in Google</button>
                      <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={() => { setDeploySchema(generatedJson); setTab("deploy"); }}>Deploy to Shopify →</button>
                    </div>
                  </div>
                  <div style={S.pre}>{generatedJson}</div>

                  {/* Rich Result Preview */}
                  <div style={{ marginTop: 16 }}>
                    <div style={S.sectionTitle}>Rich Result Preview (Google SERP)</div>
                    <div style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", maxWidth: 560 }}>
                      {genType === "Product" && (
                        <div style={{ fontFamily: "arial,sans-serif" }}>
                          <div style={{ fontSize: 13, color: "#1a0dab", marginBottom: 2 }}>yourstore.com › products › product-name</div>
                          <div style={{ fontSize: 18, color: "#1a0dab", marginBottom: 4 }}>Product Name</div>
                          <div style={{ fontSize: 13, color: "#4d5156", marginBottom: 6 }}>Product description from your page content.</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                            <span style={{ color: "#f59e0b", fontSize: 16 }}>★★★★★</span>
                            <span style={{ color: "#4d5156" }}>4.8 (128 reviews)</span>
                            <span style={{ color: "#137333", fontWeight: 600 }}>$49.99</span>
                            <span style={{ color: "#137333" }}>· In stock</span>
                          </div>
                        </div>
                      )}
                      {genType === "FAQPage" && (
                        <div style={{ fontFamily: "arial,sans-serif" }}>
                          <div style={{ fontSize: 18, color: "#1a0dab", marginBottom: 8 }}>Page Title</div>
                          {[1, 2].map(i => (
                            <div key={i} style={{ borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#202124" }}>▼ {i === 1 ? "What is your return policy?" : "How long does shipping take?"}</div>
                              <div style={{ fontSize: 13, color: "#4d5156", marginTop: 4, paddingLeft: 16 }}>{i === 1 ? "We offer 30-day returns on all items." : "Standard shipping takes 3-5 business days."}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {!["Product", "FAQPage"].includes(genType) && (
                        <div style={{ fontFamily: "arial,sans-serif", color: "#4d5156", fontSize: 13 }}>
                          <span style={{ color: "#1a0dab", fontSize: 16, display: "block", marginBottom: 4 }}>Your {genType} Title</span>
                          Rich result will appear based on your schema content. Use Google's Rich Results Test to verify.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {!genLoading && !genResult && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Schema Priority Guide for Shopify</div>
              {SCHEMA_TYPES.map(t => (
                <div key={t.id} style={S.row}>
                  <span style={{ fontSize: 18, minWidth: 28 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEMA BUILDER */}
      {tab === "builder" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Visual Schema Builder</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14 }}>Fill in the form fields to generate precise, valid JSON-LD. No coding required. AI-generated schemas are also available on the AI Generate tab.</p>
            <div style={{ marginBottom: 14 }}>
              <div style={S.label}>Schema Type</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SCHEMA_TYPES.map(t => (
                  <button key={t.id} onClick={() => { setBuilderType(t.id); setBuilderFields({}); setBuiltSchema(null); }} style={{ ...S.btn(t.id === builderType ? "primary" : ""), fontSize: 12, padding: "6px 12px" }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={S.card}>
              <div style={S.sectionTitle}>Fields — {builderType}</div>
              <div style={{ display: "grid", gap: 12 }}>
                {(SCHEMA_FIELDS[builderType] || []).map(field => (
                  <div key={field.key}>
                    <div style={S.label}>{field.label} {field.key.includes("q") && !field.key.includes("url") ? "" : ""}</div>
                    {field.options ? (
                      <select style={S.field} value={builderFields[field.key] || ""} onChange={e => setField(field.key, e.target.value)}>
                        <option value="">Select…</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input style={S.field} value={builderFields[field.key] || ""} onChange={e => setField(field.key, e.target.value)} placeholder={field.placeholder} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button style={S.btn("primary")} onClick={buildFromForm}>Generate JSON-LD</button>
                <button style={S.btn()} onClick={() => setBuilderFields({})}>Clear</button>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>JSON-LD Output</div>
                {builtSchema && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => copyToClipboard(`<script type="application/ld+json">${builtSchema}</script>`)}>Copy</button>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => openGoogleTest(builtSchema)}>Test</button>
                    <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={() => { setDeploySchema(builtSchema); setTab("deploy"); }}>Deploy →</button>
                  </div>
                )}
              </div>
              {builtSchema ? (
                <div style={S.pre}>{builtSchema}</div>
              ) : (
                <EmptyState icon="🔧" title="Fill in the fields and click Generate" description="Your valid JSON-LD schema will appear here, ready to copy and deploy." />
              )}
            </div>
          </div>

          {/* Schema validation checklist */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Schema Validation Requirements</div>
            {[
              { t: "Required properties must be present", d: "Google has required and recommended properties for each schema type. Missing required properties prevent rich results eligibility." },
              { t: "Values must match expected types", d: "Date values need ISO 8601 format (YYYY-MM-DD). URLs must be absolute. Prices must be numbers (not '£49.99')." },
              { t: "AggregateRating requires ratingCount ≥ 1", d: "Stars won't show in SERPs without a valid review count. Minimum ratingValue: 0.1, maximum: 5." },
              { t: "Product schema must include price and priceCurrency", d: "Both are required for Shopping rich results. Price validity window is 72 hours — priceValidUntil recommended." },
              { t: "JSON-LD must be wrapped in <script type='application/ld+json'>", d: "Do not use microdata or RDFa — JSON-LD is Google's preferred format and easiest to maintain." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={S.badge("good")}>✓</span>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI ANALYZE */}
      {tab === "analyze" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Schema Analyser</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>Paste your existing JSON-LD schema and AI will validate it, identify missing properties, flag errors, and suggest improvements to maximise rich result eligibility.</p>
            <textarea style={{ ...S.ta, height: 200 }} value={analyzeInput} onChange={e => setAnalyzeInput(e.target.value)} placeholder='Paste your JSON-LD schema here, e.g. { "@context": "https://schema.org", "@type": "Product", ... }' />
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={aiAnalyze} disabled={analyzeLoading}>{analyzeLoading ? "Analysing…" : "Analyse with AI"}</button>
              {analyzeInput && <button style={S.btn()} onClick={() => openGoogleTest(analyzeInput)}>Test in Google</button>}
            </div>
          </div>
          {analyzeError && <ErrorBox message={analyzeError} />}
          {analyzeLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>}
          {analyzeResult && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Schema Analysis Report</div>
              <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{analyzeResult.schemaReport || analyzeResult.report || JSON.stringify(analyzeResult, null, 2)}</div>
            </div>
          )}
          {!analyzeResult && !analyzeLoading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Common Schema Errors That Block Rich Results</div>
              {[
                { err: "Missing @context or @type", impact: "Schema won't be recognised by Google at all. Both are required on every schema object.", fix: "Always include @context: 'https://schema.org' and @type: 'Product' (or other type)." },
                { err: "Relative URLs", impact: "Google requires absolute URLs. Relative URLs (e.g. /products/wallet) will fail validation.", fix: "Use full URLs: https://yourstore.com/products/wallet" },
                { err: "Price as a formatted string", impact: "price: '$49.99' will fail. Must be a number.", fix: "Use price: 49.99 (numeric) with priceCurrency: 'USD'" },
                { err: "Rating without reviewCount", impact: "Star ratings won't show without a valid review count ≥ 1.", fix: "Add ratingCount: 128 (or however many reviews you have)." },
                { err: "Image as a string instead of array", impact: "Google prefers image as an array for Product schema.", fix: "Use image: ['https://...'] instead of image: 'https://...'" },
                { err: "FAQPage without mainEntity", impact: "FAQ schema won't render without the mainEntity array of Q&A pairs.", fix: "Structure: mainEntity: [{ @type: 'Question', name: '...', acceptedAnswer: { @type: 'Answer', text: '...' } }]" },
              ].map(({ err, impact, fix }) => (
                <div key={err} style={{ padding: "12px 0", borderBottom: "1px solid #1f1f22" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 3 }}>{err}</div>
                  <div style={{ fontSize: 12, color: "#71717a", marginBottom: 3 }}><strong style={{ color: "#52525b" }}>Impact:</strong> {impact}</div>
                  <div style={{ fontSize: 12, color: "#818cf8" }}><strong>Fix:</strong> {fix}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DEPLOY TO SHOPIFY */}
      {tab === "deploy" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Deploy Schema to Shopify</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16, lineHeight: 1.6 }}>Inject your JSON-LD schema directly into a Shopify product or blog article. The schema will be embedded in the page's {`<head>`} as a {`<script type="application/ld+json">`} tag.</p>

            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>JSON-LD Schema (paste or auto-filled from Builder/Generator)</div>
              <textarea style={{ ...S.ta, height: 180 }} value={deploySchema} onChange={e => setDeploySchema(e.target.value)} placeholder='{ "@context": "https://schema.org", "@type": "Product", ... }' />
            </div>

            <div style={S.grid2}>
              <div>
                <div style={S.label}>Entity Type</div>
                <select style={S.field} value={deployType} onChange={e => setDeployType(e.target.value)}>
                  <option value="product">Product</option>
                  <option value="article">Blog Article</option>
                </select>
              </div>
              <div>
                <div style={S.label}>{deployType === "product" ? "Product ID" : "Article ID"}</div>
                <input style={S.field} value={deployEntityId} onChange={e => setDeployEntityId(e.target.value)} placeholder="e.g. 7891234567890" />
              </div>
              {deployType === "article" && (
                <div>
                  <div style={S.label}>Blog ID</div>
                  <input style={S.field} value={deployBlogId} onChange={e => setDeployBlogId(e.target.value)} placeholder="e.g. 1234567890" />
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <button style={S.btn("primary")} onClick={deployToShopify} disabled={deployLoading || !deploySchema.trim() || !deployEntityId.trim()}>
                {deployLoading ? "Deploying…" : "Deploy to Shopify"}
              </button>
            </div>
            {deployResult && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: deployResult.ok ? "#052e16" : "#3f1315", border: `1px solid ${deployResult.ok ? "#166534" : "#7f1d1d"}`, borderRadius: 8, fontSize: 13, color: deployResult.ok ? "#4ade80" : "#f87171" }}>
                {deployResult.ok ? `✓ ${deployResult.message || "Schema deployed successfully!"}` : `✗ ${deployResult.error || deployResult.message || "Deployment failed"}`}
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>How to Find Shopify Product & Article IDs</div>
            {[
              { step: "1", how: "Go to Shopify Admin → Products → click on any product", detail: "The URL will show the ID: /admin/products/7891234567890" },
              { step: "2", how: "For blog articles: Shopify Admin → Online Store → Blog Posts → click article", detail: "URL: /admin/articles/1234567890 — both the blog ID and article ID are needed." },
              { step: "3", how: "Use Shopify Admin API to list all products and get their IDs in bulk", detail: "GET /admin/api/2024-01/products.json — returns paginated list with IDs." },
              { step: "4", how: "After deployment, verify via Google's Rich Results Test", detail: "Enter your product/article URL at search.google.com/test/rich-results to confirm schema is live." },
            ].map(({ step, how, detail }) => (
              <div key={step} style={S.row}>
                <span style={{ background: "#27272a", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#818cf8", flexShrink: 0 }}>{step}</span>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{how}</div><div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{detail}</div></div>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <a href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer" style={{ color: "#818cf8", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
                → Open Google Rich Results Test ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn(), fontSize: 12 }} onClick={exportHistory}>Export History</button>
              <button style={{ ...S.btn(), fontSize: 12 }} onClick={() => fileRef.current?.click()}>Import</button>
              <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                const text = await f.text(); try {
                  const data = JSON.parse(text);
                  await apiFetchJSON(`${API}/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
                  loadHistory();
                } catch {}
              }} />
            </div>
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Schema History ({history.length} schemas generated)</div>
            {history.length === 0 ? (
              <EmptyState icon="📄" title="No history yet" description="Generated schemas will appear here for reuse and deployment." />
            ) : (
              <SortableTable
                columns={[
                  { key: "schema", label: "Schema / Input", render: v => <span style={{ fontSize: 12, color: "#e4e4e7" }}>{(String(v || "")).slice(0, 80)}…</span> },
                  { key: "type", label: "Type", render: v => v ? <span style={S.badge("good")}>{v}</span> : <span style={{ color: "#52525b" }}>—</span> },
                  { key: "createdAt", label: "Date", render: v => <span style={{ fontSize: 12, color: "#52525b" }}>{v ? new Date(v).toLocaleString() : "—"}</span> },
                  { key: "id", label: "", render: (v, row) => (
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 8px" }} onClick={() => {
                      if (row.schema) { setDeploySchema(row.schema); setTab("deploy"); }
                    }}>Deploy</button>
                  )},
                ]}
                rows={history}
                emptyText="No history"
              />
            )}
          </div>

          {/* ROI stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
            {[
              { label: "Rich Result Types Available", value: SCHEMA_TYPES.length, color: "#4f46e5", note: "Schema types supported" },
              { label: "Schemas Generated", value: history.length, color: "#22c55e", note: "In your history" },
              { label: "CTR Uplift (Product)", value: "~30%", color: "#f59e0b", note: "With star ratings vs without" },
              { label: "Featured Snippet CTR", value: "~8.6%", color: "#818cf8", note: "Bonus clicks above position 1" },
            ].map(({ label, value, color, note }) => (
              <div key={label} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: 11, color: "#71717a" }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
                <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

