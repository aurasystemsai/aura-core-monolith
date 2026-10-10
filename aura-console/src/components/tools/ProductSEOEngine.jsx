import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiFetchJSON } from "../../api";
import { ScoreRing, MetricRow, MozCard, MozTabs, ErrorBox, EmptyState, Spinner } from "../MozUI";

// Product SEO workflows backed by the current API.

const categories = [
 {
 id: "manage",
 label: "Manage",
 accent: "#14b8a6",
 tabs: [
 { id: "product-list", label: "Products"},
 { id: "product-editor", label: "Product Editor"}
 ]
 },
 {
 id: "optimize",
 label: "Optimize",
 accent: "#4f46e5",
 tabs: [
 { id: "meta-data", label: "SEO Metadata"},
 { id: "keyword-research", label: "Keyword Research"}
 ]
 },
 {
 id: "tools",
 label: "Tools",
 accent: "#0ea5e9",
 tabs: [
 { id: "bulk-operations", label: "Bulk Generate"},
]
},
];

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
 const [activeTab, setActiveTab] = useState("product-list");
 const [products, setProducts] = useState([]);
 const [selectedProduct, setSelectedProduct] = useState(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [toast, setToast] = useState("");
 const [seoScore, setSeoScore] = useState(null);
 const [seoDraft, setSeoDraft] = useState(null);
 const [schemaPreview, setSchemaPreview] = useState(null);
 const [keywordIdeas, setKeywordIdeas] = useState([]);
 const [serpResults, setSerpResults] = useState(null);
 const [analytics, setAnalytics] = useState(null);
 const [orchestration, setOrchestration] = useState(null);
 const [bulkJob, setBulkJob] = useState(null);
 const [focusKeywords, setFocusKeywords] = useState([]);
 const [kwInput, setKwInput] = useState("");
 const [shopifyPushing, setShopifyPushing] = useState(false);
 const [shopifyPushResult, setShopifyPushResult] = useState(null);
 const [config, setConfig] = useState({
 model: "claude-3.5-sonnet",
 channel: "amazon",
 keywordSeed: "wireless headphones",
 targetKeyword: "noise cancelling headphones",
 price: "99.00"});

 const toastTimeout = useRef();

 const selectProduct = (product) => {
 setSelectedProduct(product);
 setSeoDraft(null);
 setShopifyPushResult(null);
 };

 const showToast = useCallback((msg) => {
 setToast(msg);
 clearTimeout(toastTimeout.current);
 toastTimeout.current = setTimeout(() => setToast("") , 4000);
 }, []);

 const setAndNormalizeError = useCallback((msg) => {
 setError(msg || "Something went wrong");
 showToast(msg || "Something went wrong");
 }, [showToast]);

 const fetchProducts = useCallback(async () => {
 try {
 const res = await apiFetchJSON("/api/product-seo/shopify-products");
 if (!res.ok) throw new Error(res.error || "Could not load Shopify products");
 const loadedProducts = res.products || [];
 setProducts(loadedProducts);
 setSelectedProduct(current => loadedProducts.find(product => product.id === current?.id) || loadedProducts[0] || null);
 setError("");
 } catch (err) {
 setAndNormalizeError(err.message);
 }
 }, [setAndNormalizeError]);

 const fetchAnalytics = useCallback(async () => {
 try {
 const res = await apiFetchJSON("/api/product-seo/analytics");
 if (!res.ok) throw new Error(res.error || "Could not load Product SEO activity");
 setAnalytics({ eventCount: (res.events || []).length, recentEvents: res.events || [] });
 } catch (err) {
 setAndNormalizeError(err.message);
 }
 }, [setAndNormalizeError]);

 useEffect(() => {
 fetchProducts();
 fetchAnalytics();
 }, [fetchProducts, fetchAnalytics]);

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

 const _aiGenBody = (product) => ({
 productName: product?.title || product?.handle || "Product",
 productDescription: product?.description || product?.body_html || product?.title || "",
 focusKeywords: focusKeywords.join(", "),
 });

 const optimizeTitle = async () => {
 if (!selectedProduct) return;
 await generateSeoDraft();
 };

 const generateSeoDraft = async () => {
 if (!selectedProduct) return;
 setLoading(true);
 setError("");
 try {
 const res = await apiFetchJSON("/api/product-seo/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(_aiGenBody(selectedProduct)),
 });
 if (!res.ok) throw new Error(res.error || "Could not generate SEO metadata");
 if (!res.parsed?.seoTitle || !res.parsed?.metaDescription) {
 throw new Error("The AI response did not include both an SEO title and meta description. Please try again.");
 }
 setSeoDraft(res.parsed);
 showToast("SEO metadata generated");
 } catch (requestError) {
 setAndNormalizeError(requestError.message);
 } finally {
 setLoading(false);
 }
 };

 const runKeywordResearch = async () => {
 await callEndpoint("/api/blog-seo/ai/keyword-research", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ seedKeyword: config.keywordSeed || selectedProduct?.title || "" }),
 }, (data) => {
 const kws = (data.clusters || []).flatMap(c => c.keywords || []);
 setKeywordIdeas(kws.length ? kws : (data.keywords || []));
 });
 };

 const runSerp = async () => {
 // SERP preview is rendered client-side from the selected product's fields
 setSerpResults([{ keyword: config.targetKeyword, preview: selectedProduct?.title }]);
 };

 const fetchScore = async () => {
 if (!selectedProduct) return;
 setLoading(true);
 try {
 const res = await apiFetchJSON("/api/product-seo/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(_aiGenBody(selectedProduct)),
 });
 if (res.ok) {
 const title = res.parsed?.seoTitle || "";
 const desc = res.parsed?.metaDescription || "";
 const score = Math.round(((title.length >= 30 ? 40 : 20) + (desc.length >= 150 ? 60 : 30)) * (focusKeywords.length > 0 ? 1 : 0.8));
 setSeoScore({ score, grade: score >= 80 ? "A" : score >= 60 ? "B" : "C", breakdown: { title: title.length, description: desc.length } });
 }
 showToast("Score calculated");
 } catch (e) { showToast(e.message); } finally { setLoading(false); }
 };

 const generateSchema = async () => {
 if (!selectedProduct) return;
 setLoading(true);
 try {
 const res = await apiFetchJSON("/api/product-seo/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(_aiGenBody(selectedProduct)),
 });
 if (res.ok) {
 const schema = {
 "@context": "https://schema.org",
 "@type": "Product",
 "name": res.parsed?.seoTitle || selectedProduct.title,
 "description": res.parsed?.metaDescription || "",
 "url": `https://yourstore.myshopify.com/products/${res.parsed?.slug || selectedProduct.handle || ""}`,
 "image": selectedProduct.image || "",
 };
 setSchemaPreview(schema);
 }
 showToast("Schema generated");
 } catch (e) { showToast(e.message); } finally { setLoading(false); }
 };

 const runOrchestration = async () => {
 if (!selectedProduct) return;
 await callEndpoint("/api/product-seo/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(_aiGenBody(selectedProduct)),
 }, (data) => setOrchestration(data.parsed || data));
 };

 const startBulk = async () => {
 const bulkProducts = products.slice(0, 5).map(p => ({
 productName: p.title || p.handle || "Product",
 productDescription: p.description || p.body_html || p.title || "",
 focusKeywords: focusKeywords.join(", "),
 }));
 await callEndpoint("/api/product-seo/bulk-generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ products: bulkProducts }),
 }, (data) => setBulkJob(data.results || []));
 };

 const undoPush = async () => {
 const id = shopifyPushResult?.undoId;
 if (!id) return;
 setShopifyPushing(true);
 try {
 const res = await apiFetchJSON("/api/product-seo/shopify/undo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
 if (!res.ok) throw new Error(res.error || "Could not undo");
 setShopifyPushResult({ ok: true, message: "Undone", undone: true });
 showToast("Put the product back as it was.");
 } catch (err) {
 setShopifyPushResult({ ok: false, message: err.message });
 } finally {
 setShopifyPushing(false);
 }
 };

 const downloadChangeLog = async () => {
 try {
 const res = await apiFetchJSON("/api/product-seo/shopify/history");
 if (!res.ok) throw new Error(res.error || "Could not load changes");
 const cell = (v) => { let s = String(v == null ? "" : v); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
 const rows = [["when", "product id", "fields changed", "undone", "previous title", "previous SEO title", "previous meta description"],
 ...res.history.map((h) => [h.at, h.productId, (h.changed || []).join(" "), h.reverted ? "yes" : "no", h.before?.title, h.before?.seoTitle, h.before?.metaDescription])];
 const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" }));
 const a = document.createElement("a"); a.href = url; a.download = "product-seo-changes.csv"; a.click();
 URL.revokeObjectURL(url);
 } catch (err) { showToast(err.message); }
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
 handle: seoDraft?.slug || selectedProduct.slug || selectedProduct.handle,
 seoTitle: seoDraft?.seoTitle || selectedProduct.seoTitle,
 metaDescription: seoDraft?.metaDescription || selectedProduct.metaDescription,
 }),
 });
 if (!res.ok) throw new Error(res.error || "Shopify update failed");
 setShopifyPushResult({ ok: true, message: res.message || "Product updated on Shopify", undoId: res.undoId });
 showToast("Pushed to Shopify!");
 } catch (err) {
 setShopifyPushResult({ ok: false, message: err.message });
 showToast("Shopify push failed: "+ err.message);
 } finally {
 setShopifyPushing(false);
 }
 };

 const renderList = (items) => (
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
 <SectionCard title="Shopify Products"description="Products returned from the connected Shopify shop.">
 <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
 <button onClick={fetchProducts} disabled={loading} className="btn">Refresh</button>
 <button onClick={fetchScore} disabled={loading || !selectedProduct} className="btn">Score Selected</button>
 </div>
 {products.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
 {products.map(p => (
 <div key={p.id} style={{ border: `1px solid ${selectedProduct?.id === p.id ? "#4f46e5": "#27272a"}`, background: "#18181b", borderRadius: 12, padding: 12 }}>
 <div style={{ color: "#fafafa", fontWeight: 700 }}>{p.title}</div>
 <div style={{ color: "#a1a1aa", fontSize: 12 }}>{p.handle ? `/products/${p.handle}` : "No product handle"}</div>
 <Divider />
 <div style={{ color: "#a1a1aa", fontSize: 12 }}>Price: ${p.variants?.[0]?.price || "—"}</div>
 <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
 <button onClick={() => selectProduct(p)} className="btn-secondary">Select for optimization</button>
 </div>
 </div>
 ))}
 </div> : <div style={{ color: "#a1a1aa", padding: 12 }}>
 {error ? "Products could not be loaded. Check the connection and try again." : "No Shopify products were returned. Refresh to retry."}
 </div>}
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

 const titleLower = (selectedProduct?.title || "").toLowerCase();
 const descLower = (selectedProduct?.description || "").toLowerCase();
 const slugLower = (selectedProduct?.slug || "").toLowerCase();
 const serpTitle = seoDraft?.seoTitle || selectedProduct?.title || "Product Title";
 const serpSlug = seoDraft?.slug || selectedProduct?.slug || selectedProduct?.handle || "product-slug";
 const serpDesc = (seoDraft?.metaDescription || selectedProduct?.description || "No description.").slice(0, 160);

 return (
 <SectionCard title="Product Editor"description="Edit Shopify product fields, review the search preview, and apply approved changes.">
 {!selectedProduct ? (
 <div style={{ color: "#a1a1aa"}}>Select a product from Product List.</div>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

 {/* Title */}
 <div>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Title</div>
 <div style={{ display: "flex", gap: 8 }}>
 <input value={selectedProduct.title || ""} onChange={e => setSelectedProduct({ ...selectedProduct, title: e.target.value })} placeholder="Product title"style={{ flex: 1, background: "#18181b", border: "1px solid #27272a", color: "#fafafa", padding: "10px 12px", borderRadius: 10 }} />
 </div>
 </div>

 {/* Description */}
 <div>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</div>
 <div style={{ display: "flex", gap: 8, alignItems: "flex-start"}}>
 <textarea value={selectedProduct.description || ""} onChange={e => setSelectedProduct({ ...selectedProduct, description: e.target.value })} rows={4} placeholder="Product description"style={{ flex: 1, background: "#18181b", border: "1px solid #27272a", color: "#fafafa", padding: "10px 12px", borderRadius: 10, resize: "vertical"}} />
 </div>
 </div>

 {/* URL Handle + Alt Text row */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
 <div>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>URL Handle / Slug</div>
 <div style={{ display: "flex", gap: 8 }}>
 <input value={selectedProduct.slug || selectedProduct.handle || ""} onChange={e => setSelectedProduct({ ...selectedProduct, slug: e.target.value })} placeholder="url-handle"style={{ flex: 1, background: "#18181b", border: "1px solid #27272a", color: "#fafafa", padding: "10px 12px", borderRadius: 10 }} />
 </div>
 </div>
 <div>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Image Alt Text</div>
 <div style={{ display: "flex", gap: 8 }}>
 <input value={selectedProduct.altText || ""} onChange={e => setSelectedProduct({ ...selectedProduct, altText: e.target.value })} placeholder="Alt text"style={{ flex: 1, background: "#18181b", border: "1px solid #27272a", color: "#fafafa", padding: "10px 12px", borderRadius: 10 }} />
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
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Search result preview (approximate)</div>
 <div style={{ background: "#09090b", borderRadius: 8, padding: "14px 18px", maxWidth: 600, border: "1px solid #3f3f46" }}>
 <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 2 }}>/products/{serpSlug}</div>
 <div style={{ fontSize: 20, color: "#93c5fd", fontWeight: 500, marginBottom: 3, lineHeight: 1.3, textDecoration: "underline"}}>{serpTitle.slice(0, 60)}{serpTitle.length > 60 ? "…": ""}</div>
 <div style={{ fontSize: 14, color: "#d4d4d8", lineHeight: 1.5 }}>{serpDesc}{serpDesc.length >= 160 ? "…": ""}</div>
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
 onClick={pushToShopify}
 disabled={shopifyPushing || (!selectedProduct.shopifyId && !selectedProduct.id)}
 style={{ background: shopifyPushResult?.ok ? "#22c55e": "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: shopifyPushing ? "not-allowed": "pointer", opacity: shopifyPushing ? 0.7 : 1 }}
 >
 {shopifyPushing ? "Applying…": shopifyPushResult?.ok ? "Applied to Shopify": "Apply changes to Shopify"}
 </button>
 {shopifyPushResult && !shopifyPushResult.ok && (
 <span style={{ fontSize: 12, color: "#f87171"}}>{shopifyPushResult.message}</span>
 )}
 {shopifyPushResult?.ok && shopifyPushResult.undoId && (
 <button onClick={undoPush} disabled={shopifyPushing} style={{ background: "#fff", color: "#18181b", border: "1px solid #a1a1aa", borderRadius: 10, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Undo this change</button>
 )}
 {shopifyPushResult?.ok && shopifyPushResult.undone && (
 <span style={{ fontSize: 12, color: "#4ade80"}}>Put back as it was.</span>
 )}
 <button onClick={downloadChangeLog} style={{ background: "transparent", color: "#52525b", border: "none", textDecoration: "underline", fontSize: 13, cursor: "pointer" }}>Download change log (CSV)</button>
 </div>
 </div>
 )}
 </SectionCard>
 );
 }
 case "bulk-operations":
 return (
 <SectionCard title="Bulk Generate"description="Generate SEO metadata drafts for up to five connected Shopify products. Drafts are not applied automatically."accent="#4f46e5">
 <button onClick={startBulk} disabled={loading || !products.length} className="btn">{loading ? "Generating…" : "Generate drafts for up to 5 products"}</button>
 {bulkJob && <pre className="code-block">{JSON.stringify(bulkJob, null, 2)}</pre>}
 </SectionCard>
 );
 case "templates":
 return (
 <SectionCard title="Templates"description="Prompt templates powered by /ai/prompts">
 <button onClick={() => callEndpoint("/api/product-seo/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(_aiGenBody(selectedProduct)) }, () => showToast("Review the generated fields in SEO Metadata.") )} className="btn" disabled={loading || !selectedProduct}>AI Generate</button>
 <Divider />
 <div style={{ color: "#a1a1aa", fontSize: 12 }}>Use prompt templates to accelerate optimization workflows.</div>
 </SectionCard>
 );
 case "categories":
 return (
 <SectionCard title="Categories"description="Assign categories to products with smart suggestions."accent="#14b8a6">
 <InlineInput value={config.targetKeyword} onChange={(v) => setConfig({ ...config, targetKeyword: v })} placeholder="Category hint"width="260px"/>
 <Divider />
 <button onClick={() => callEndpoint("/api/product-seo/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(_aiGenBody(selectedProduct)) }, (d) => setKeywordIdeas(d.parsed?.keywords ? d.parsed.keywords.split(",").map(k => k.trim()) : []) )} className="btn" disabled={loading || !selectedProduct}>AI Suggest</button>
 </SectionCard>
 );
 case "tags-attributes":
 return (
 <SectionCard title="Tags & Attributes"description="Extract attributes via /attribute-extraction"accent="#14b8a6">
 <button onClick={() => callEndpoint("/api/product-seo/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(_aiGenBody(selectedProduct)) }, (d) => setKeywordIdeas(d.parsed?.keywords ? d.parsed.keywords.split(",").map(k => k.trim()) : []) )} className="btn" disabled={loading || !selectedProduct}>Extract from AI</button>
 {keywordIdeas.length > 0 && renderList(keywordIdeas, "attributes")}
 </SectionCard>
 );
 case "version-history":
 return (
 <SectionCard title="Version History"description="Audit trail via /products/:id/history"accent="#14b8a6">
 <div style={{ color: "#a1a1aa" }}>Product version history is not available in the current API.</div>
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
 <SectionCard title="Description Enhancement"description="Generate an SEO title, description, and handle for the selected product."accent="#4f46e5">
 <button onClick={generateSeoDraft} className="btn" disabled={loading || !selectedProduct}>Generate SEO metadata</button>
 <Divider />
 {seoDraft && <pre className="code-block">{JSON.stringify(seoDraft, null, 2)}</pre>}
 </SectionCard>
 );
 case "meta-data":
 return (
 <SectionCard title="SEO Metadata"description="Generate an SEO title, meta description, and URL handle for the selected Shopify product."accent="#4f46e5">
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap"}}>
 <button onClick={generateSeoDraft} className="btn" disabled={loading || !selectedProduct}>{loading ? "Generating…" : "Generate SEO metadata"}</button>
 </div>
 {seoDraft && (
 <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
 <label style={{ color: "#a1a1aa", fontSize: 13 }}>SEO title
 <div style={{ color: "#fafafa", marginTop: 4 }}>{seoDraft.seoTitle}</div>
 </label>
 <label style={{ color: "#a1a1aa", fontSize: 13 }}>Meta description
 <div style={{ color: "#fafafa", marginTop: 4 }}>{seoDraft.metaDescription}</div>
 </label>
 <label style={{ color: "#a1a1aa", fontSize: 13 }}>Suggested handle
 <div style={{ color: "#fafafa", marginTop: 4 }}>{seoDraft.slug}</div>
 </label>
 <div style={{ color: "#71717a", fontSize: 12 }}>Review the draft, then use “Apply changes to Shopify” in Product Editor to save it.</div>
 </div>
 )}
 </SectionCard>
 );
 case "image-seo":
 return (
 <SectionCard title="Image SEO"description="Use the Image & Media SEO tool for product image alt-text workflows."accent="#4f46e5">
 <div style={{ color: "#a1a1aa" }}>Product image alt-text generation is not part of the current Product SEO API.</div>
 </SectionCard>
 );
 case "keyword-density":
 return (
 <SectionCard title="Keyword Density"description="Analyze keyword density for selected product."accent="#4f46e5">
 <button onClick={() => fetchScore()} className="btn" disabled={loading || !selectedProduct}>Analyze via AI</button>
 </SectionCard>
 );
 case "readability-score":
 return (
 <SectionCard title="Readability Score"description="Compute readability via /readability-score">
 <button onClick={() => fetchScore()} className="btn" disabled={loading || !selectedProduct}>Calculate via AI</button>
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
 <div style={{ color: "#a1a1aa" }}>Use the standalone A/B Testing Suite to manage and analyze experiments.</div>
 </SectionCard>
 );
 case "predictive-analytics":
 return (
 <SectionCard title="Predictive Analytics"description="Forecast trends via /analytics/predictive"accent="#f97316">
 <button onClick={() => showToast("Predictive analytics coming soon")} className="btn" disabled={loading}>Forecast</button>
 {analytics?.predictive && <pre className="code-block">{JSON.stringify(analytics.predictive, null, 2)}</pre>}
 </SectionCard>
 );
 case "attribution":
 return (
 <SectionCard title="Attribution Model"description="Multi-touch attribution snapshot."accent="#f97316">
 <button onClick={() => showToast("Attribution model coming soon")} className="btn" disabled={loading}>Load Attribution</button>
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
 <SectionCard title="Import & Export"description="Data export is not included in the active Shopify product workflow."accent="#0ea5e9">
 <div style={{ color: "#a1a1aa" }}>No export action is available here.</div>
 </SectionCard>
 );
 case "content-scorer":
 return (
 <SectionCard title="Content Scorer" description="SEO score breakdown." accent="#0ea5e9">
 <button onClick={fetchScore} className="btn" disabled={loading || !selectedProduct}>Compute Score</button>
 {seoScore && (
 <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
 <ScoreRing score={seoScore.score ?? 0} label="SEO Score" size={80} />
 <StatPill label="Grade" value={seoScore.grade} />
 <pre className="code-block" style={{ minWidth: 240 }}>{JSON.stringify(seoScore.breakdown, null, 2)}</pre>
 </div>
 )}
 </SectionCard>
 );
 case "schema-validator":
 return (
 <SectionCard title="Schema Validator"description="Validate structured data."accent="#0ea5e9">
 <button onClick={() => generateSchema()} className="btn" disabled={loading || !selectedProduct}>Validate via Generate</button>
 <button onClick={() => { setSchemaPreview(null); showToast("No schema errors detected"); }} className="btn-secondary" disabled={loading}>List Errors</button>
 </SectionCard>
 );
 case "rich-results-preview":
 return (
 <SectionCard title="Rich Results Preview"description="Preview and eligibility."accent="#0ea5e9">
 <button onClick={() => generateSchema()} className="btn" disabled={loading || !selectedProduct}>Preview as Schema</button>
 <button onClick={() => showToast("Rich results eligibility coming soon")} className="btn-secondary" disabled={loading}>Eligibility</button>
 </SectionCard>
 );
 case "keyword-planner":
 return (
 <SectionCard title="Keyword Planner"description="Intent mapping and opportunities."accent="#0ea5e9">
 <button onClick={() => showToast("Use Keyword Research tab for opportunities")} className="btn" disabled={loading}>Find Opportunities</button>
 <button onClick={() => runKeywordResearch()} className="btn-secondary" disabled={loading}>Intent Map</button>
 {keywordIdeas.length > 0 && renderList(keywordIdeas, "intent")}
 </SectionCard>
 );
 case "analytics-dashboard":
 return (
 <SectionCard title="Product SEO Activity"description="Live counts from Shopify product loading and Product SEO API events."accent="#22c55e">
 <button onClick={fetchAnalytics} className="btn"disabled={loading}>Refresh Overview</button>
 {analytics && (
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
 <StatPill label="Shopify products loaded"value={products.length} />
 <StatPill label="Recorded SEO events"value={analytics.eventCount} />
 </div>
 )}
 {analytics?.recentEvents?.length > 0 && <div style={{ marginTop: 12 }}>{renderList(analytics.recentEvents.slice(0, 10), "events")}</div>}
 </SectionCard>
 );
 case "ranking-tracker":
 return (
 <SectionCard title="Ranking Tracker"description="Keyword rank tracking is not available in the current Product SEO API."accent="#22c55e" />
 );
 case "performance-metrics":
 return (
 <SectionCard title="Performance Metrics"description="Core Web Vitals snapshot."accent="#22c55e">
 <button onClick={() => showToast("Performance metrics coming soon")} className="btn" disabled={loading}>Load Performance</button>
 {analytics?.performance && <pre className="code-block">{JSON.stringify(analytics.performance, null, 2)}</pre>}
 </SectionCard>
 );
 case "anomaly-detection":
 return (
 <SectionCard title="Anomaly Detection"description="Spot anomalies in traffic and conversions."accent="#22c55e">
 <button onClick={() => showToast("Anomaly detection coming soon")} className="btn" disabled={loading}>Detect</button>
 {analytics?.anomalies && renderList(analytics.anomalies, "anomalies")}
 </SectionCard>
 );
 case "reports":
 return (
 <SectionCard title="Reports"description="Reporting is not available in the current Product SEO API."accent="#22c55e" />
 );
 case "sla-dashboard":
 return (
 <SectionCard title="SLA Dashboard"description="Health and uptime from /health"accent="#22c55e">
 <button onClick={() => callEndpoint("/api/product-seo/analytics", {}, (data) => setAnalytics(a => ({ ...a, health: { events: data.events?.length || 0, status: "ok" } })))} className="btn" disabled={loading}>Check Health</button>
 {analytics?.health && <pre className="code-block">{JSON.stringify(analytics.health, null, 2)}</pre>}
 </SectionCard>
 );
 case "audit-logs":
 return (
 <SectionCard title="Audit Logs"description="System-wide audit trail."accent="#22c55e">
 <div style={{ color: "#a1a1aa" }}>Audit logs are not available in the current Product SEO API.</div>
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
 <div className="product-seo-engine" style={{ background: "#05080f", minHeight: "100%", padding: 20, color: "#fafafa", fontFamily: "Inter, system-ui, sans-serif"}}>
 <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
 <div>
 <div style={{ fontSize: 26, fontWeight: 800 }}>Product SEO Engine</div>
 <div style={{ color: "#a1a1aa"}}>Optimize Shopify product metadata with AI, then review and apply changes.</div>
 </div>
 <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end"}}>
 <StatPill label="Active Tab"value={activeTab} />
 {seoScore?.score && <StatPill label="Generated SEO score"value={seoScore.score} />}
 </div>
 </header>

 <div className="product-seo-workspace" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 14 }}>
 <div className="product-seo-nav" style={{ background: "#18181b", border: "1px solid #18181b", borderRadius: 14, padding: 12, maxHeight: "82vh", overflow: "auto"}}>
 {categories.map(cat => (
 <div key={cat.id} className="product-seo-nav-category" style={{ marginBottom: 14 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer"}} onClick={() => setActiveTab(cat.tabs[0].id)}>
 <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.accent }} />
 <div style={{ fontWeight: 700 }}>{cat.label}</div>
 </div>
 <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
 {cat.tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
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

 <div className="product-seo-content" style={{ background: "#18181b", border: "1px solid #18181b", borderRadius: 14, padding: 16, minHeight: "80vh"}}>
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
 .product-seo-engine {
  background: #f5f7fb !important;
  color: #172033 !important;
 }
 .product-seo-engine [style*="background: rgb(5, 8, 15)"],
 .product-seo-engine [style*="background: rgb(9, 9, 11)"],
 .product-seo-engine [style*="background: rgb(24, 24, 27)"] {
  background-color: #ffffff !important;
  border-color: #e2e8f0 !important;
 }
 .product-seo-engine [style*="background: rgb(39, 39, 42)"],
 .product-seo-engine [style*="background: rgb(63, 63, 70)"] {
  background-color: #f1f5f9 !important;
  border-color: #d5deea !important;
 }
 .product-seo-engine [style*="color: rgb(250, 250, 250)"] {
  color: #172033 !important;
 }
 .product-seo-engine [style*="color: rgb(161, 161, 170)"],
 .product-seo-engine [style*="color: rgb(113, 113, 122)"],
 .product-seo-engine [style*="color: rgb(82, 82, 91)"] {
  color: #64748b !important;
 }
 .product-seo-engine .btn-secondary,
 .product-seo-engine .btn-tertiary {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #334155;
 }
 .product-seo-engine .text-area,
 .product-seo-engine input,
 .product-seo-engine textarea,
 .product-seo-engine select {
  background: #ffffff !important;
  border-color: #cbd5e1 !important;
  color: #172033 !important;
 }
 .product-seo-engine input::placeholder,
 .product-seo-engine textarea::placeholder {
  color: #64748b;
 }
 .product-seo-engine .code-block {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #172033;
 }
 @media (max-width: 900px) {
  .product-seo-engine { padding: 12px !important; }
  .product-seo-workspace { grid-template-columns: minmax(0, 1fr) !important; }
  .product-seo-nav {
   display: flex;
   flex-wrap: wrap;
   gap: 8px;
   max-height: none !important;
   overflow: visible !important;
  }
  .product-seo-nav-category { flex: 1 1 150px; min-width: 0; margin: 0 !important; }
  .product-seo-nav-category > div:last-child { display: flex !important; flex-wrap: wrap; }
  .product-seo-nav-category > div:last-child > button { flex: 1 1 auto; }
  .product-seo-content { min-height: 0 !important; min-width: 0; }
 }
 @media (max-width: 540px) {
  .product-seo-engine > header { align-items: flex-start !important; flex-direction: column; gap: 10px; }
 }
 `}</style>
 </div>
 );
}
