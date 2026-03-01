import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, apiFetchJSON } from "../../api";

// -----------------------------------------------------------------------------
// PRODUCT SEO ENGINE FRONTEND (42 tabs, Week 4-6 scope)
// -----------------------------------------------------------------------------

const categories = [
 {
 id: "manage",
 label: "Manage",
 accent: "#14b8a6",
 tabs: [
 { id: "product-list", label: "Product List"},
 { id: "product-editor", label: "Product Editor"},
 { id: "bulk-operations", label: "Bulk Operations"},
 { id: "templates", label: "Templates"},
 { id: "categories", label: "Categories"},
 { id: "tags-attributes", label: "Tags & Attributes"},
 { id: "version-history", label: "Version History"},
 { id: "trash-recovery", label: "Trash & Recovery"}
 ]
 },
 {
 id: "optimize",
 label: "Optimize",
 accent: "#4f46e5",
 tabs: [
 { id: "title-optimization", label: "Title Optimization"},
 { id: "description-enhancement", label: "Description Enhancement"},
 { id: "meta-data", label: "Meta Data"},
 { id: "image-seo", label: "Image SEO"},
 { id: "keyword-density", label: "Keyword Density"},
 { id: "readability-score", label: "Readability Score"},
 { id: "schema-generator", label: "Schema Generator"}
 ]
 },
 {
 id: "advanced",
 label: "Advanced",
 accent: "#f97316",
 tabs: [
 { id: "ai-orchestration", label: "AI Orchestration"},
 { id: "keyword-research", label: "Keyword Research"},
 { id: "serp-analysis", label: "SERP Analysis"},
 { id: "competitor-intel", label: "Competitor Intelligence"},
 { id: "multi-channel-optimizer", label: "Multi-Channel Optimizer"},
 { id: "ab-testing", label: "A/B Testing"},
 { id: "predictive-analytics", label: "Predictive Analytics"},
 { id: "attribution", label: "Attribution Model"}
 ]
 },
 {
 id: "tools",
 label: "Tools",
 accent: "#0ea5e9",
 tabs: [
 { id: "bulk-ai-generator", label: "Bulk AI Generator"},
 { id: "import-export", label: "Import/Export"},
 { id: "content-scorer", label: "Content Scorer"},
 { id: "schema-validator", label: "Schema Validator"},
 { id: "rich-results-preview", label: "Rich Results Preview"},
 { id: "keyword-planner", label: "Keyword Planner"}
 ]
 },
 {
 id: "monitoring",
 label: "Monitoring",
 accent: "#22c55e",
 tabs: [
 { id: "analytics-dashboard", label: "Analytics Dashboard"},
 { id: "ranking-tracker", label: "Ranking Tracker"},
 { id: "performance-metrics", label: "Performance Metrics"},
 { id: "anomaly-detection", label: "Anomaly Detection"},
 { id: "reports", label: "Reports"},
 { id: "sla-dashboard", label: "SLA Dashboard"},
 { id: "audit-logs", label: "Audit Logs"}
 ]
 },
 {
 id: "settings",
 label: "Settings",
 accent: "#eab308",
 tabs: [
 { id: "preferences", label: "Preferences"},
 { id: "api-keys", label: "API Keys"},
 { id: "webhooks", label: "Webhooks"},
 { id: "backup-restore", label: "Backup & Restore"},
 { id: "notifications", label: "Notifications"},
 { id: "integrations", label: "Integrations"}
 ]
 }
];

const optimisticColors = ["#14b8a6", "#4f46e5", "#f97316", "#0ea5e9", "#22c55e", "#eab308", "#f43f5e"];

function SectionCard({ title, description, children, accent }) {
 return (
 <div style={{ background: "#09090b", border: `1px solid ${accent || "#27272a"}` , borderRadius: 14, padding: 18, marginBottom: 14 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
 <div style={{ color: "#fafafa", fontWeight: 700 }}>{title}</div>
 {accent && <span style={{ width: 10, height: 10, borderRadius: "50%", background: accent }} />}
 </div>
 {description && <div style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 10 }}>{description}</div>}
 {children}
 </div>
 );
}

function StatPill({ label, value }) {
 return (
 <div style={{ padding: "10px 14px", background: "#18181b", border: "1px solid #27272a", borderRadius: 12, minWidth: 140 }}>
 <div style={{ color: "#a1a1aa", fontSize: 12 }}>{label}</div>
 <div style={{ color: "#fafafa", fontWeight: 700 }}>{value}</div>
 </div>
 );
}

function InlineInput({ value, onChange, placeholder, type = "text", width = "100%"}) {
 return (
 <input
 value={value}
 type={type}
 onChange={e => onChange(e.target.value)}
 placeholder={placeholder}
 style={{ width, background: "#18181b", border: "1px solid #27272a", color: "#fafafa", padding: "10px 12px", borderRadius: 10 }}
 />
 );
}

function Divider() {
 return <div style={{ height: 1, background: "#27272a", margin: "12px 0"}} />;
}

export default function ProductSEOEngine() {
 const [activeCategory, setActiveCategory] = useState("manage");
 const [activeTab, setActiveTab] = useState("product-list");
 const [products, setProducts] = useState([]);
 const [selectedProduct, setSelectedProduct] = useState(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [toast, setToast] = useState("");
 const [seoScore, setSeoScore] = useState(null);
 const [schemaPreview, setSchemaPreview] = useState(null);
 const [keywordIdeas, setKeywordIdeas] = useState([]);
 const [serpResults, setSerpResults] = useState(null);
 const [analytics, setAnalytics] = useState(null);
 const [rankings, setRankings] = useState([]);
 const [reports, setReports] = useState([]);
 const [auditLogs, setAuditLogs] = useState([]);
 const [abTests, setAbTests] = useState([]);
 const [orchestration, setOrchestration] = useState(null);
 const [bulkJob, setBulkJob] = useState(null);
 const [focusKeywords, setFocusKeywords] = useState([]);
 const [kwInput, setKwInput] = useState("");
 const [fieldGenerating, setFieldGenerating] = useState({});
 const [shopifyPushing, setShopifyPushing] = useState(false);
 const [shopifyPushResult, setShopifyPushResult] = useState(null);
 const [config, setConfig] = useState({
 model: "claude-3.5-sonnet",
 channel: "amazon",
 keywordSeed: "wireless headphones",
 targetKeyword: "noise cancelling headphones",
 price: "99.00"});

 const toastTimeout = useRef();

 const showToast = (msg) => {
 setToast(msg);
 clearTimeout(toastTimeout.current);
 toastTimeout.current = setTimeout(() => setToast("") , 4000);
 };

 const setAndNormalizeError = (msg) => {
 setError(msg || "Something went wrong");
 showToast(msg || "Something went wrong");
 };

 const fetchProducts = async () => {
 try {
 const res = await apiFetchJSON("/api/product-seo/products");
 const data = res;
 if (data.ok) {
 setProducts(data.products || []);
 if (!selectedProduct && data.products?.length) setSelectedProduct(data.products[0]);
 }
 } catch (err) {
 setAndNormalizeError(err.message);
 }
 };

 const fetchAnalytics = async () => {
 try {
 const res = await apiFetchJSON("/api/product-seo/analytics/overview");
 const data = res;
 if (data.ok) setAnalytics(data.overview);
 } catch (err) {
 setAndNormalizeError(err.message);
 }
 };

 const fetchAuditLogs = async () => {
 try {
 const res = await apiFetchJSON("/api/product-seo/audit-logs?limit=25");
 const data = res;
 if (data.ok) setAuditLogs(data.logs || []);
 } catch (err) {
 setAndNormalizeError(err.message);
 }
 };

 useEffect(() => {
 fetchProducts();
 fetchAnalytics();
 fetchAuditLogs();
 }, []);

 const callEndpoint = async (path, options = {}, onSuccess) => {
 setLoading(true);
 setError("");
 try {
 const res = await apiFetchJSON(path, options);
 const data = res;
 if (!data.ok) throw new Error(data.error || "Request failed");
 if (onSuccess) onSuccess(data);
 showToast("Success");
 } catch (err) {
 setAndNormalizeError(err.message);
 } finally {
 setLoading(false);
 }
 };

 const optimizeTitle = async () => {
 if (!selectedProduct) return;
 await callEndpoint(`/api/product-seo/products/${selectedProduct.id}/title-suggestions`, {}, (data) => {
 setSelectedProduct({ ...selectedProduct, title: data.suggestions?.[0] || selectedProduct.title });
 });
 };

 const runKeywordResearch = async () => {
 await callEndpoint("/api/product-seo/keywords/research", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ seed: config.keywordSeed, count: 20 })
 }, (data) => setKeywordIdeas(data.keywords || []));
 };

 const runSerp = async () => {
 await callEndpoint(`/api/product-seo/serp/${encodeURIComponent(config.targetKeyword)}`, {}, (data) => setSerpResults(data.serp));
 };

 const fetchScore = async () => {
 if (!selectedProduct) return;
 await callEndpoint(`/api/product-seo/products/${selectedProduct.id}/score`, {}, (data) => setSeoScore({ score: data.score, breakdown: data.breakdown, grade: data.grade }));
 };

 const generateSchema = async () => {
 if (!selectedProduct) return;
 await callEndpoint(`/api/product-seo/schema/${selectedProduct.id}/generate`, { method: "POST"}, (data) => setSchemaPreview(data.schema));
 };

 const runOrchestration = async () => {
 await callEndpoint("/api/product-seo/ai/orchestration/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ prompt: `Improve SEO for ${config.targetKeyword}`, models: ["gpt-4", "claude-3.5-sonnet"], strategy: "best-of-n"})
 }, (data) => setOrchestration(data.result));
 };

 const startBulk = async () => {
 const productIds = products.slice(0, 5).map(p => p.id);
 await callEndpoint("/api/product-seo/ai/batch-process", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ productIds, operation: "regenerate", model: config.model })
 }, (data) => setBulkJob(data.batch));
 };

 const fetchRankings = async () => {
 await callEndpoint("/api/product-seo/rankings/summary", {}, (data) => setRankings(data.summary ? [data.summary] : []));
 };

 const fetchReports = async () => {
 await callEndpoint("/api/product-seo/analytics/scheduled-reports", {}, (data) => setReports(data.reports || []));
 };

 const fetchAbTests = async () => {
 await callEndpoint("/api/product-seo/ab-tests", {}, (data) => setAbTests(data.tests || []));
 };

 const pushToShopify = async () => {
 if (!selectedProduct) return;
 setShopifyPushing(true);
 setShopifyPushResult(null);
 try {
 const res = await apiFetchJSON("/api/product-seo/shopify/apply", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({
 productId: selectedProduct.shopifyId || selectedProduct.id,
 title: selectedProduct.title,
 body_html: selectedProduct.description,
 handle: selectedProduct.slug,
 metaDescription: selectedProduct.metaDescription,
 seoTitle: selectedProduct.seoTitle,
 }),
 });
 if (!res.ok) throw new Error(res.error || "Shopify update failed");
 setShopifyPushResult({ ok: true, message: res.message || "Product updated on Shopify"});
 showToast("Pushed to Shopify!");
 } catch (err) {
 setShopifyPushResult({ ok: false, message: err.message });
 showToast("Shopify push failed: "+ err.message);
 } finally {
 setShopifyPushing(false);
 }
 };

 const createAbTest = async () => {
 if (!selectedProduct) return;
 await callEndpoint("/api/product-seo/ab-tests", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({
 name: `Title Test for ${selectedProduct.title}`,
 productId: selectedProduct.id,
 variants: [
 { name: "Variant A", content: `${selectedProduct.title} | Official"` },
 { name: "Variant B", content: `${selectedProduct.title} | Free Shipping` }
 ],
 metric: "ctr"})
 }, fetchAbTests);
 };

 const activeCategoryTabs = useMemo(() => categories.find(c => c.id === activeCategory)?.tabs || [], [activeCategory]);

 const renderList = (items, key) => (
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
 {items.map((item, idx) => (
 <div key={idx} style={{ padding: 12, borderRadius: 10, background: "#18181b", border: "1px solid #27272a"}}>
 <pre style={{ margin: 0, color: "#fafafa", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word"}}>{JSON.stringify(item, null, 2)}</pre>
 </div>
 ))}
 </div>
 );

 const renderTab = () => {
 switch (activeTab) {
 case "product-list":
 return (
 <SectionCard title="Product List"description="Browse and select products. Uses /api/product-seo/products.">
 <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
 <button onClick={fetchProducts} disabled={loading} className="btn">Refresh</button>
 <button onClick={fetchScore} disabled={loading || !selectedProduct} className="btn">Score Selected</button>
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
 {products.map(p => (
 <div key={p.id} style={{ border: `1px solid ${selectedProduct?.id === p.id ? "#4f46e5": "#27272a"}`, background: "#18181b", borderRadius: 12, padding: 12 }}>
 <div style={{ color: "#fafafa", fontWeight: 700 }}>{p.title}</div>
 <div style={{ color: "#a1a1aa", fontSize: 12 }}>{p.slug}</div>
 <Divider />
 <div style={{ color: "#a1a1aa", fontSize: 12 }}>Price: ${p.price || "-"}</div>
 <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
 <button onClick={() => setSelectedProduct(p)} className="btn-secondary">Select</button>
 <button onClick={() => optimizeTitle()} className="btn-tertiary">AI Title</button>
 </div>
 </div>
 ))}
 </div>
 </SectionCard>
 );
 case "product-editor": {
 const addKw = () => {
 const trimmed = kwInput.trim().replace(/,$/, "");
 if (!trimmed) return;
 const newKws = trimmed.split(/[,\n]+/).map(k => k.trim().toLowerCase()).filter(k => k && !focusKeywords.includes(k));
 if (newKws.length) setFocusKeywords(prev => [...prev, ...newKws]);
 setKwInput("");
 };
 const removeKw = kw => setFocusKeywords(prev => prev.filter(k => k !== kw));

 const genField = async (field) => {
 if (!selectedProduct) return;
 setFieldGenerating(f => ({ ...f, [field]: true }));
 try {
 let path = "";
 let method = "GET";
 if (field === "title") path = `/api/product-seo/products/${selectedProduct.id}/title-suggestions`;
 else if (field === "description") path = `/api/product-seo/products/${selectedProduct.id}/description-suggestions`;
 else if (field === "slug") path = `/api/product-seo/products/${selectedProduct.id}/slug-suggestions`;
 else if (field === "altText") { path = `/api/product-seo/products/${selectedProduct.id}/bulk-images-alt`; method = "POST"; }
 const res = await apiFetchJSON(path, { method, headers: { "Content-Type": "application/json"} });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Failed");
 const value = data.suggestions?.[0] || data.altTexts?.[0]?.altText || "";
 if (value) setSelectedProduct(sp => ({ ...sp, [field]: value }));
 showToast(`${field} generated`);
 } catch (err) {
 showToast(err.message);
 } finally {
 setFieldGenerating(f => ({ ...f, [field]: false }));
 }
 };

 const titleLower = (selectedProduct?.title || "").toLowerCase();
 const descLower = (selectedProduct?.description || "").toLowerCase();
 const slugLower = (selectedProduct?.slug || "").toLowerCase();
 const serpTitle = selectedProduct?.title || "Product Title";
 const serpSlug = selectedProduct?.slug || "product-slug";
 const serpDesc = (selectedProduct?.description || "No description.").slice(0, 160);
 const storeBase = "yourstore.myshopify.com";

 return (
 <SectionCard title="Product Editor"description="Edit product fields · per-field AI generate · focus keywords · SERP preview">
 {!selectedProduct ? (
 <div style={{ color: "#a1a1aa"}}>Select a product from Product List.</div>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

 {/* Title */}
 <div>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Title</div>
 <div style={{ display: "flex", gap: 8 }}>
 <input value={selectedProduct.title || ""} onChange={e => setSelectedProduct({ ...selectedProduct, title: e.target.value })} placeholder="Product title"style={{ flex: 1, background: "#18181b", border: "1px solid #27272a", color: "#fafafa", padding: "10px 12px", borderRadius: 10 }} />
 <button onClick={() => genField("title")} disabled={fieldGenerating.title || loading} className="btn"style={{ whiteSpace: "nowrap", fontSize: 13 }}>{fieldGenerating.title ? "": "Generate"}</button>
 </div>
 </div>

 {/* Description */}
 <div>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</div>
 <div style={{ display: "flex", gap: 8, alignItems: "flex-start"}}>
 <textarea value={selectedProduct.description || ""} onChange={e => setSelectedProduct({ ...selectedProduct, description: e.target.value })} rows={4} placeholder="Product description"style={{ flex: 1, background: "#18181b", border: "1px solid #27272a", color: "#fafafa", padding: "10px 12px", borderRadius: 10, resize: "vertical"}} />
 <button onClick={() => genField("description")} disabled={fieldGenerating.description || loading} className="btn"style={{ whiteSpace: "nowrap", fontSize: 13 }}>{fieldGenerating.description ? "": "Generate"}</button>
 </div>
 </div>

 {/* URL Handle + Alt Text row */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
 <div>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>URL Handle / Slug</div>
 <div style={{ display: "flex", gap: 8 }}>
 <input value={selectedProduct.slug || ""} onChange={e => setSelectedProduct({ ...selectedProduct, slug: e.target.value })} placeholder="url-handle"style={{ flex: 1, background: "#18181b", border: "1px solid #27272a", color: "#fafafa", padding: "10px 12px", borderRadius: 10 }} />
 <button onClick={() => genField("slug")} disabled={fieldGenerating.slug || loading} className="btn"style={{ fontSize: 13 }}>{fieldGenerating.slug ? "": "Gen"}</button>
 </div>
 </div>
 <div>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Image Alt Text</div>
 <div style={{ display: "flex", gap: 8 }}>
 <input value={selectedProduct.altText || ""} onChange={e => setSelectedProduct({ ...selectedProduct, altText: e.target.value })} placeholder="Alt text"style={{ flex: 1, background: "#18181b", border: "1px solid #27272a", color: "#fafafa", padding: "10px 12px", borderRadius: 10 }} />
 <button onClick={() => genField("altText")} disabled={fieldGenerating.altText || loading} className="btn"style={{ fontSize: 13 }}>{fieldGenerating.altText ? "": "Gen"}</button>
 </div>
 </div>
 </div>

 <Divider />

 {/* Focus Keywords */}
 <div>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Focus Keywords <span style={{ fontWeight: 400, textTransform: "none"}}>(Enter or comma to add)</span></div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "8px 10px", minHeight: 44, alignItems: "center"}}>
 {focusKeywords.map(kw => (
 <span key={kw} style={{ background: "#27272a", color: "#60a5fa", borderRadius: 20, padding: "3px 11px 3px 12px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
 {kw}
 <button onClick={() => removeKw(kw)} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
 </span>
 ))}
 <input
 value={kwInput}
 onChange={e => setKwInput(e.target.value)}
 onKeyDown={e => { if (e.key === "Enter"|| e.key === ",") { e.preventDefault(); addKw(); } }}
 onBlur={addKw}
 style={{ flex: 1, minWidth: 140, background: "none", border: "none", color: "#fafafa", fontSize: 13, outline: "none"}}
 placeholder={focusKeywords.length === 0 ? "e.g. snowboard, winter sports": "Add another"}
 />
 </div>
 </div>

 {/* Keyword Presence Check */}
 {focusKeywords.length > 0 && (
 <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 14px"}}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Keyword Presence Check</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
 {focusKeywords.map(kw => (
 <div key={kw} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>
 <span style={{ fontWeight: 600, color: "#fafafa"}}>{kw}</span>
 <span style={{ marginLeft: 8, color: titleLower.includes(kw) ? "#22c55e": "#ef4444", fontSize: 11, fontWeight: 700 }}>Title {titleLower.includes(kw) ? "": ""}</span>
 <span style={{ marginLeft: 6, color: descLower.includes(kw) ? "#22c55e": "#ef4444", fontSize: 11, fontWeight: 700 }}>Desc {descLower.includes(kw) ? "": ""}</span>
 <span style={{ marginLeft: 6, color: slugLower.includes(kw.replace(/ /g, "-")) ? "#22c55e": "#f59e0b", fontSize: 11, fontWeight: 700 }}>URL {slugLower.includes(kw.replace(/ /g, "-")) ? "": ""}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Google SERP Preview */}
 <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "14px 16px"}}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Google SERP Preview</div>
 <div style={{ background: "#4f46e5", borderRadius: 8, padding: "14px 18px", maxWidth: 600 }}>
 <div style={{ fontSize: 12, color: "#27272a", marginBottom: 2 }}>{storeBase}/products/{serpSlug}</div>
 <div style={{ fontSize: 20, color: "#52525b", fontWeight: 500, marginBottom: 3, lineHeight: 1.3, textDecoration: "underline", cursor: "pointer"}}>{serpTitle.slice(0, 60)}{serpTitle.length > 60 ? "": ""}</div>
 <div style={{ fontSize: 14, color: "#4d5156", lineHeight: 1.5 }}>{serpDesc}{serpDesc.length >= 160 ? "": ""}</div>
 </div>
 <div style={{ marginTop: 6, display: "flex", gap: 12, fontSize: 12 }}>
 <span style={{ color: serpTitle.length > 60 ? "#ef4444": "#22c55e"}}>Title: {serpTitle.length}/60 chars {serpTitle.length > 60 ? "too long": ""}</span>
 <span style={{ color: serpDesc.length < 50 ? "#f59e0b": serpDesc.length > 155 ? "#ef4444": "#22c55e"}}>Desc: {serpDesc.length}/160 chars</span>
 </div>
 </div>

 <Divider />

 {/* Save + Price */}
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap"}}>
 <input value={selectedProduct.price || ""} onChange={e => setSelectedProduct({ ...selectedProduct, price: e.target.value })} placeholder="Price"style={{ width: 120, background: "#18181b", border: "1px solid #27272a", color: "#fafafa", padding: "10px 12px", borderRadius: 10 }} />
 <button
 onClick={() => callEndpoint(`/api/product-seo/products/${selectedProduct.id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify(selectedProduct)
 }, fetchProducts)}
 className="btn"disabled={loading}
 >Save Product</button>
 <button
 onClick={pushToShopify}
 disabled={shopifyPushing || !selectedProduct.shopifyId && !selectedProduct.id}
 style={{ background: shopifyPushResult?.ok ? "#22c55e": "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: shopifyPushing ? "not-allowed": "pointer", opacity: shopifyPushing ? 0.7 : 1 }}
 >
 {shopifyPushing ? "Pushing": shopifyPushResult?.ok ? "Pushed!": "Push to Shopify"}
 </button>
 {shopifyPushResult && !shopifyPushResult.ok && (
 <span style={{ fontSize: 12, color: "#f87171"}}>{shopifyPushResult.message}</span>
 )}
 </div>
 </div>
 )}
 </SectionCard>
 );
 }
 case "bulk-operations":
 return (
 <SectionCard title="Bulk Operations"description="Bulk regenerate SEO using /ai/batch-process"accent="#4f46e5">
 <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
 <InlineInput value={config.model} onChange={(v) => setConfig({ ...config, model: v })} width="220px"placeholder="Model (e.g., claude-3.5-sonnet)"/>
 <button onClick={startBulk} disabled={loading || !products.length} className="btn">Start Bulk</button>
 </div>
 {bulkJob && <pre className="code-block">{JSON.stringify(bulkJob, null, 2)}</pre>}
 </SectionCard>
 );
 case "templates":
 return (
 <SectionCard title="Templates"description="Prompt templates powered by /ai/prompts">
 <button onClick={() => callEndpoint("/api/product-seo/ai/prompts") } className="btn"disabled={loading}>Load Templates</button>
 <Divider />
 <div style={{ color: "#a1a1aa", fontSize: 12 }}>Use prompt templates to accelerate optimization workflows.</div>
 </SectionCard>
 );
 case "categories":
 return (
 <SectionCard title="Categories"description="Assign categories to products with smart suggestions."accent="#14b8a6">
 <InlineInput value={config.targetKeyword} onChange={(v) => setConfig({ ...config, targetKeyword: v })} placeholder="Category hint"width="260px"/>
 <Divider />
 <button onClick={() => callEndpoint(`/api/product-seo/products/${selectedProduct?.id || 1}/category-suggestions`)} className="btn"disabled={loading}>Suggest Categories</button>
 </SectionCard>
 );
 case "tags-attributes":
 return (
 <SectionCard title="Tags & Attributes"description="Extract attributes via /attribute-extraction"accent="#14b8a6">
 <button onClick={() => callEndpoint(`/api/product-seo/products/${selectedProduct?.id || 1}/attribute-extraction`, {}, (data) => setKeywordIdeas([data.attributes]))} className="btn"disabled={loading}>Extract Attributes</button>
 {keywordIdeas.length > 0 && renderList(keywordIdeas, "attributes")}
 </SectionCard>
 );
 case "version-history":
 return (
 <SectionCard title="Version History"description="Audit trail via /products/:id/history"accent="#14b8a6">
 <button onClick={() => callEndpoint(`/api/product-seo/products/${selectedProduct?.id || 1}/history`, {}, (data) => setAuditLogs(data.history || []))} className="btn"disabled={loading}>Load History</button>
 {auditLogs.length > 0 && renderList(auditLogs, "history")}
 </SectionCard>
 );
 case "trash-recovery":
 return (
 <SectionCard title="Trash & Recovery"description="Placeholder for soft-delete flows.">
 <div style={{ color: "#a1a1aa"}}>Soft-delete and restore actions can be wired to bulk-delete and rollback endpoints.</div>
 </SectionCard>
 );
 case "title-optimization":
 return (
 <SectionCard title="Title Optimization"description="Call /title-suggestions and apply best title."accent="#4f46e5">
 <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
 <InlineInput value={selectedProduct?.title || ""} onChange={(v) => setSelectedProduct({ ...selectedProduct, title: v })} width="320px"placeholder="Current title"/>
 <button onClick={optimizeTitle} disabled={loading || !selectedProduct} className="btn">AI Suggest</button>
 </div>
 {selectedProduct?.title && <div style={{ color: "#a1a1aa", fontSize: 13 }}>Preview: {selectedProduct.title}</div>}
 </SectionCard>
 );
 case "description-enhancement":
 return (
 <SectionCard title="Description Enhancement"description="Use /description-suggestions to enrich copy."accent="#4f46e5">
 <button onClick={() => callEndpoint(`/api/product-seo/products/${selectedProduct?.id || 1}/description-suggestions`, {}, (data) => setSelectedProduct({ ...selectedProduct, description: data.suggestions?.[0] }))} className="btn"disabled={loading || !selectedProduct}>Generate Descriptions</button>
 <Divider />
 <textarea value={selectedProduct?.description || ""} onChange={e => setSelectedProduct({ ...selectedProduct, description: e.target.value })} rows={6} className="text-area"/>
 </SectionCard>
 );
 case "meta-data":
 return (
 <SectionCard title="Meta Data"description="Generate meta descriptions and slugs."accent="#4f46e5">
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap"}}>
 <button onClick={() => callEndpoint(`/api/product-seo/products/${selectedProduct?.id || 1}/meta-suggestions`)} className="btn"disabled={loading}>Meta Suggestions</button>
 <button onClick={() => callEndpoint(`/api/product-seo/products/${selectedProduct?.id || 1}/slug-suggestions`)} className="btn-secondary"disabled={loading}>Slug Suggestions</button>
 </div>
 </SectionCard>
 );
 case "image-seo":
 return (
 <SectionCard title="Image SEO"description="Bulk alt text via /bulk-images-alt"accent="#4f46e5">
 <button onClick={() => callEndpoint(`/api/product-seo/products/${selectedProduct?.id || 1}/bulk-images-alt`, { method: "POST"})} className="btn"disabled={loading}>Generate Alt Text</button>
 </SectionCard>
 );
 case "keyword-density":
 return (
 <SectionCard title="Keyword Density"description="Analyze keyword density for selected product."accent="#4f46e5">
 <button onClick={() => callEndpoint(`/api/product-seo/products/${selectedProduct?.id || 1}/keyword-density`)} className="btn"disabled={loading}>Analyze Density</button>
 </SectionCard>
 );
 case "readability-score":
 return (
 <SectionCard title="Readability Score"description="Compute readability via /readability-score">
 <button onClick={() => callEndpoint(`/api/product-seo/products/${selectedProduct?.id || 1}/readability-score`)} className="btn"disabled={loading}>Calculate Readability</button>
 </SectionCard>
 );
 case "schema-generator":
 return (
 <SectionCard title="Schema Generator"description="Generate structured data via /schema/:id/generate"accent="#4f46e5">
 <button onClick={generateSchema} className="btn"disabled={loading || !selectedProduct}>Generate Schema</button>
 {schemaPreview && <pre className="code-block">{JSON.stringify(schemaPreview, null, 2)}</pre>}
 </SectionCard>
 );
 case "ai-orchestration":
 return (
 <SectionCard title="AI Orchestration"description="Run best-of-n orchestration."accent="#f97316">
 <div style={{ display: "flex", gap: 10, alignItems: "center"}}>
 <InlineInput value={config.targetKeyword} onChange={(v) => setConfig({ ...config, targetKeyword: v })} width="320px"placeholder="Prompt keyword"/>
 <button onClick={runOrchestration} className="btn"disabled={loading}>Run</button>
 </div>
 {orchestration && <pre className="code-block">{JSON.stringify(orchestration, null, 2)}</pre>}
 </SectionCard>
 );
 case "keyword-research":
 return (
 <SectionCard title="Keyword Research"description="Powered by /keywords/research"accent="#f97316">
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap"}}>
 <InlineInput value={config.keywordSeed} onChange={(v) => setConfig({ ...config, keywordSeed: v })} width="260px"placeholder="Seed keyword"/>
 <button onClick={runKeywordResearch} className="btn"disabled={loading}>Research</button>
 </div>
 {keywordIdeas.length > 0 && renderList(keywordIdeas, "keywords")}
 </SectionCard>
 );
 case "serp-analysis":
 return (
 <SectionCard title="SERP Analysis"description="Real-time SERP snapshot."accent="#f97316">
 <div style={{ display: "flex", gap: 10, alignItems: "center"}}>
 <InlineInput value={config.targetKeyword} onChange={(v) => setConfig({ ...config, targetKeyword: v })} width="260px"placeholder="Keyword"/>
 <button onClick={runSerp} className="btn"disabled={loading}>Analyze SERP</button>
 </div>
 {serpResults && <pre className="code-block">{JSON.stringify(serpResults, null, 2)}</pre>}
 </SectionCard>
 );
 case "competitor-intel":
 return (
 <SectionCard title="Competitor Intelligence"description="Gap analysis and competitor stats."accent="#f97316">
 <button onClick={() => callEndpoint("/api/product-seo/competitors/list", {}, (data) => setKeywordIdeas(data.competitors || []))} className="btn"disabled={loading}>Load Competitors</button>
 {keywordIdeas.length > 0 && renderList(keywordIdeas, "competitors")}
 </SectionCard>
 );
 case "multi-channel-optimizer":
 return (
 <SectionCard title="Multi-Channel Optimizer"description="Optimize content per channel."accent="#f97316">
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap"}}>
 <InlineInput value={config.channel} onChange={(v) => setConfig({ ...config, channel: v })} width="200px"placeholder="Channel (amazon/ebay)"/>
 <button onClick={() => callEndpoint(`/api/product-seo/channels/${selectedProduct?.id || 1}/optimize`, {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ channel: config.channel })
 })} className="btn"disabled={loading}>Optimize Channel</button>
 </div>
 </SectionCard>
 );
 case "ab-testing":
 return (
 <SectionCard title="A/B Testing"description="Create and monitor SEO experiments."accent="#f97316">
 <div style={{ display: "flex", gap: 10, alignItems: "center"}}>
 <button onClick={createAbTest} className="btn"disabled={loading || !selectedProduct}>Create Title Test</button>
 <button onClick={fetchAbTests} className="btn-secondary"disabled={loading}>Refresh Tests</button>
 </div>
 {abTests.length > 0 && renderList(abTests, "tests")}
 </SectionCard>
 );
 case "predictive-analytics":
 return (
 <SectionCard title="Predictive Analytics"description="Forecast trends via /analytics/predictive"accent="#f97316">
 <button onClick={() => callEndpoint("/api/product-seo/analytics/predictive", {}, (data) => setAnalytics({ ...analytics, predictive: data.predictive }))} className="btn"disabled={loading}>Forecast</button>
 {analytics?.predictive && <pre className="code-block">{JSON.stringify(analytics.predictive, null, 2)}</pre>}
 </SectionCard>
 );
 case "attribution":
 return (
 <SectionCard title="Attribution Model"description="Multi-touch attribution snapshot."accent="#f97316">
 <button onClick={() => callEndpoint("/api/product-seo/analytics/attribution", {}, (data) => setAnalytics({ ...analytics, attribution: data.attribution }))} className="btn"disabled={loading}>Load Attribution</button>
 {analytics?.attribution && <pre className="code-block">{JSON.stringify(analytics.attribution, null, 2)}</pre>}
 </SectionCard>
 );
 case "bulk-ai-generator":
 return (
 <SectionCard title="Bulk AI Generator"description="Queue AI jobs via /ai/batch-process"accent="#0ea5e9">
 <button onClick={startBulk} className="btn"disabled={loading}>Start Batch</button>
 {bulkJob && <pre className="code-block">{JSON.stringify(bulkJob, null, 2)}</pre>}
 </SectionCard>
 );
 case "import-export":
 return (
 <SectionCard title="Import/Export"description="Call /products/import and /products/export"accent="#0ea5e9">
 <button onClick={() => callEndpoint("/api/product-seo/products/export", { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ format: "json"}) })} className="btn"disabled={loading}>Export JSON</button>
 <button onClick={() => callEndpoint("/api/product-seo/products/import", { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ data: [] }) })} className="btn-secondary"disabled={loading}>Import Sample</button>
 </SectionCard>
 );
 case "content-scorer":
 return (
 <SectionCard title="Content Scorer"description="SEO score breakdown."accent="#0ea5e9">
 <button onClick={fetchScore} className="btn"disabled={loading || !selectedProduct}>Compute Score</button>
 {seoScore && (
 <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap"}}>
 <StatPill label="Score"value={seoScore.score} />
 <StatPill label="Grade"value={seoScore.grade} />
 <pre className="code-block"style={{ minWidth: 240 }}>{JSON.stringify(seoScore.breakdown, null, 2)}</pre>
 </div>
 )}
 </SectionCard>
 );
 case "schema-validator":
 return (
 <SectionCard title="Schema Validator"description="Validate structured data."accent="#0ea5e9">
 <button onClick={() => callEndpoint(`/api/product-seo/schema/${selectedProduct?.id || 1}/validate`)} className="btn"disabled={loading}>Validate</button>
 <button onClick={() => callEndpoint(`/api/product-seo/schema/errors`)} className="btn-secondary"disabled={loading}>List Errors</button>
 </SectionCard>
 );
 case "rich-results-preview":
 return (
 <SectionCard title="Rich Results Preview"description="Preview and eligibility."accent="#0ea5e9">
 <button onClick={() => callEndpoint(`/api/product-seo/rich-results/${selectedProduct?.id || 1}/preview`)} className="btn"disabled={loading}>Preview</button>
 <button onClick={() => callEndpoint(`/api/product-seo/rich-results/${selectedProduct?.id || 1}/eligibility`)} className="btn-secondary"disabled={loading}>Eligibility</button>
 </SectionCard>
 );
 case "keyword-planner":
 return (
 <SectionCard title="Keyword Planner"description="Intent mapping and opportunities."accent="#0ea5e9">
 <button onClick={() => callEndpoint("/api/product-seo/opportunity-finder", { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({}) })} className="btn"disabled={loading}>Find Opportunities</button>
 <button onClick={() => callEndpoint("/api/product-seo/intent-mapping", {}, (data) => setKeywordIdeas(data.mapping || []))} className="btn-secondary"disabled={loading}>Intent Map</button>
 {keywordIdeas.length > 0 && renderList(keywordIdeas, "intent")}
 </SectionCard>
 );
 case "analytics-dashboard":
 return (
 <SectionCard title="Analytics Dashboard"description="Overview metrics."accent="#22c55e">
 <button onClick={fetchAnalytics} className="btn"disabled={loading}>Refresh Overview</button>
 {analytics && (
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
 <StatPill label="Total Products"value={analytics.totalProducts} />
 <StatPill label="Avg SEO Score"value={analytics.avgSeoScore} />
 <StatPill label="Impressions"value={analytics.totalImpressions} />
 <StatPill label="CTR"value={analytics.avgCtr} />
 </div>
 )}
 </SectionCard>
 );
 case "ranking-tracker":
 return (
 <SectionCard title="Ranking Tracker"description="Monitor keyword rankings."accent="#22c55e">
 <button onClick={fetchRankings} className="btn"disabled={loading}>Refresh Rankings</button>
 {rankings.length > 0 && renderList(rankings, "rankings")}
 </SectionCard>
 );
 case "performance-metrics":
 return (
 <SectionCard title="Performance Metrics"description="Core Web Vitals snapshot."accent="#22c55e">
 <button onClick={() => callEndpoint("/api/product-seo/analytics/performance", {}, (data) => setAnalytics({ ...analytics, performance: data.performance }))} className="btn"disabled={loading}>Load Performance</button>
 {analytics?.performance && <pre className="code-block">{JSON.stringify(analytics.performance, null, 2)}</pre>}
 </SectionCard>
 );
 case "anomaly-detection":
 return (
 <SectionCard title="Anomaly Detection"description="Spot anomalies in traffic and conversions."accent="#22c55e">
 <button onClick={() => callEndpoint("/api/product-seo/analytics/anomalies", {}, (data) => setAnalytics({ ...analytics, anomalies: data.anomalies }))} className="btn"disabled={loading}>Detect</button>
 {analytics?.anomalies && renderList(analytics.anomalies, "anomalies")}
 </SectionCard>
 );
 case "reports":
 return (
 <SectionCard title="Reports"description="Scheduled reports overview."accent="#22c55e">
 <div style={{ display: "flex", gap: 10 }}>
 <button onClick={fetchReports} className="btn"disabled={loading}>Load Reports</button>
 <button onClick={() => callEndpoint("/api/product-seo/reports/export", { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ reportType: "executive"}) })} className="btn-secondary"disabled={loading}>Export Executive</button>
 </div>
 {reports.length > 0 && renderList(reports, "reports")}
 </SectionCard>
 );
 case "sla-dashboard":
 return (
 <SectionCard title="SLA Dashboard"description="Health and uptime from /health"accent="#22c55e">
 <button onClick={() => callEndpoint("/api/product-seo/health", {}, (data) => setAnalytics({ ...analytics, health: data.health }))} className="btn"disabled={loading}>Check Health</button>
 {analytics?.health && <pre className="code-block">{JSON.stringify(analytics.health, null, 2)}</pre>}
 </SectionCard>
 );
 case "audit-logs":
 return (
 <SectionCard title="Audit Logs"description="System-wide audit trail."accent="#22c55e">
 <button onClick={fetchAuditLogs} className="btn"disabled={loading}>Refresh Logs</button>
 {auditLogs.length > 0 && renderList(auditLogs, "logs")}
 </SectionCard>
 );
 case "preferences":
 return (
 <SectionCard title="Preferences"description="Load and tweak defaults."accent="#eab308">
 <button onClick={() => callEndpoint("/api/product-seo/settings", {}, (data) => setConfig({ ...config, model: data.settings?.ai?.defaultModel || config.model }))} className="btn"disabled={loading}>Load Settings</button>
 </SectionCard>
 );
 case "api-keys":
 return (
 <SectionCard title="API Keys"description="Manage API keys."accent="#eab308">
 <button onClick={() => callEndpoint("/api/product-seo/api-keys", {}, (data) => setKeywordIdeas(data.apiKeys || []))} className="btn"disabled={loading}>List Keys</button>
 <button onClick={() => callEndpoint("/api/product-seo/api-keys", { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ name: "Frontend Key"}) })} className="btn-secondary"disabled={loading}>Create Key</button>
 {keywordIdeas.length > 0 && renderList(keywordIdeas, "apiKeys")}
 </SectionCard>
 );
 case "webhooks":
 return (
 <SectionCard title="Webhooks"description="Manage webhook targets."accent="#eab308">
 <button onClick={() => callEndpoint("/api/product-seo/webhooks", {}, (data) => setKeywordIdeas(data.webhooks || []))} className="btn"disabled={loading}>List Webhooks</button>
 <button onClick={() => callEndpoint("/api/product-seo/webhooks", { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: "https://example.com/webhook", events: ["product.updated"] }) })} className="btn-secondary"disabled={loading}>Create Webhook</button>
 {keywordIdeas.length > 0 && renderList(keywordIdeas, "webhooks")}
 </SectionCard>
 );
 case "backup-restore":
 return (
 <SectionCard title="Backup & Restore"description="On-demand backup/restore."accent="#eab308">
 <button onClick={() => callEndpoint("/api/product-seo/backup", {}, (data) => setBulkJob(data.backup))} className="btn"disabled={loading}>Create Backup</button>
 <button onClick={() => callEndpoint("/api/product-seo/restore", { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ backupId: "latest"}) })} className="btn-secondary"disabled={loading}>Restore Latest</button>
 {bulkJob && <pre className="code-block">{JSON.stringify(bulkJob, null, 2)}</pre>}
 </SectionCard>
 );
 case "notifications":
 return (
 <SectionCard title="Notifications"description="Notification preferences."accent="#eab308">
 <div style={{ color: "#a1a1aa"}}>Configure weekly digests, anomaly alerts, and webhook events.</div>
 </SectionCard>
 );
 case "integrations":
 return (
 <SectionCard title="Integrations"description="Shopify/WooCommerce sync."accent="#eab308">
 <button onClick={() => callEndpoint("/api/product-seo/shopify/products", {}, (data) => setProducts(data.products || []))} className="btn"disabled={loading}>Pull Shopify</button>
 <button onClick={() => callEndpoint("/api/product-seo/woocommerce/products", {}, (data) => setProducts(data.products || []))} className="btn-secondary"disabled={loading}>Pull WooCommerce</button>
 </SectionCard>
 );
 default:
 return <div style={{ color: "#a1a1aa"}}>Tab not implemented yet.</div>;
 }
 };

 return (
 <div style={{ background: "#05080f", minHeight: "100%", padding: 20, color: "#fafafa", fontFamily: "Inter, system-ui, sans-serif"}}>
 <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
 <div>
 <div style={{ fontSize: 26, fontWeight: 800 }}>Product SEO Engine</div>
 <div style={{ color: "#a1a1aa"}}>42-tab enterprise console · Backed by 200 endpoints</div>
 </div>
 <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end"}}>
 <StatPill label="Active Tab"value={activeTab} />
 {seoScore?.score && <StatPill label="SEO Score"value={seoScore.score} />}
 {analytics?.avgSeoScore && <StatPill label="Avg Score"value={analytics.avgSeoScore} />}
 </div>
 </header>

 <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 14 }}>
 <div style={{ background: "#18181b", border: "1px solid #18181b", borderRadius: 14, padding: 12, maxHeight: "82vh", overflow: "auto"}}>
 {categories.map(cat => (
 <div key={cat.id} style={{ marginBottom: 14 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer"}} onClick={() => { setActiveCategory(cat.id); setActiveTab(cat.tabs[0].id); }}>
 <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.accent }} />
 <div style={{ fontWeight: 700 }}>{cat.label}</div>
 </div>
 <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
 {cat.tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => { setActiveCategory(cat.id); setActiveTab(tab.id); }}
 style={{
 textAlign: "left",
 padding: "9px 10px",
 borderRadius: 10,
 border: "1px solid #18181b",
 background: activeTab === tab.id ? cat.accent + "22": "#18181b",
 color: "#fafafa",
 cursor: "pointer"}}
 >
 {tab.label}
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>

 <div style={{ background: "#18181b", border: "1px solid #18181b", borderRadius: 14, padding: 16, minHeight: "80vh"}}>
 {renderTab()}
 </div>
 </div>

 {error && (
 <div style={{ position: "fixed", bottom: 20, right: 20, background: "#7f1d1d", color: "#fecdd3", padding: "12px 16px", borderRadius: 10, border: "1px solid #b91c1c"}}>
 {error}
 </div>
 )}
 {toast && (
 <div style={{ position: "fixed", bottom: 20, left: 20, background: "#18181b", color: "#fafafa", padding: "10px 14px", borderRadius: 10, border: "1px solid #27272a"}}>
 {toast}
 </div>
 )}

 <style>{`
 .btn { background: #2563eb; border: 1px solid #52525b; color: #fff; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-weight: 600; }
 .btn-secondary { background: #18181b; border: 1px solid #27272a; color: #fafafa; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-weight: 600; }
 .btn-tertiary { background: #18181b; border: 1px dashed #52525b; color: #fafafa; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-weight: 600; }
 .text-area { width: 100%; background: #18181b; border: 1px solid #27272a; color: #fafafa; padding: 10px; border-radius: 10px; }
 .code-block { background: #05080f; border: 1px solid #27272a; color: #fafafa; padding: 12px; border-radius: 10px; margin-top: 10px; white-space: pre-wrap; word-break: break-word; }
 button:disabled { opacity: 0.6; cursor: not-allowed; }
 `}</style>
 </div>
 );
}



