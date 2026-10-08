import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/schema-rich-results-engine";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 24, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: 700, margin: "0 0 12px" },
  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 12 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnGhost: { background: "#27272a", color: "#fafafa", border: "1px solid #3f3f46", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  btnOff: { opacity: 0.5, cursor: "not-allowed" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 13, padding: "8px 10px", width: "100%", boxSizing: "border-box" },
  code: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 14, fontSize: 12, color: "#d4d4d8", overflow: "auto", maxHeight: 360, whiteSpace: "pre" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  empty: { color: "#71717a", fontSize: 13, padding: "16px 0" },
  label: { fontSize: 12, fontWeight: 600, color: "#a1a1aa", margin: "10px 0 6px", display: "block" },
};

const TYPES = [
  { id: "Product", label: "Product", needs: "product" },
  { id: "Article", label: "Blog article", needs: "article" },
  { id: "Organization", label: "Organization" },
  { id: "BreadcrumbList", label: "Breadcrumbs" },
  { id: "FAQPage", label: "FAQ" },
];

function Validation({ v }) {
  if (!v) return null;
  return (
    <div style={{ marginTop: 12, fontSize: 13 }}>
      <div style={{ color: v.valid ? "#86efac" : "#f87171", fontWeight: 700 }}>
        {v.valid ? "Valid for Google rich results" : "Needs fixes"}{v.types.length ? ` · ${v.types.join(", ")}` : ""}
      </div>
      {v.issues.map((i, n) => (
        <div key={n} style={{ color: i.level === "error" ? "#fca5a5" : "#fcd34d", fontSize: 12, marginTop: 4 }}>{i.level}: {i.message}</div>
      ))}
    </div>
  );
}

export default function SchemaRichResultsEngine() {
  const [type, setType] = useState("Product");
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState("");
  const [crumbs, setCrumbs] = useState([{ name: "Home", url: "" }, { name: "", url: "" }]);
  const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);
  const [sameAs, setSameAs] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [out, setOut] = useState(null);
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState("");
  const [pastedResult, setPastedResult] = useState(null);

  const needs = (TYPES.find(t => t.id === type) || {}).needs;

  useEffect(() => {
    setItems([]);
    setItemId("");
    setOut(null);
    if (!needs) return;
    let cancelled = false;
    setLoading("items");
    apiFetchJSON(`${API}/items?kind=${needs}`).then(r => {
      if (cancelled) return;
      if (!r.ok) setError(r.error || "Could not load your store items");
      else setItems(r.items || []);
    }).finally(() => { if (!cancelled) setLoading(""); });
    return () => { cancelled = true; };
  }, [needs]);

  async function call(name, path, body) {
    setLoading(name);
    setError("");
    try {
      const r = await apiFetchJSON(API + path, { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading("");
    }
  }

  async function generate() {
    const body = { type };
    if (needs) body.id = itemId;
    if (type === "BreadcrumbList") body.items = crumbs.filter(c => c.name.trim());
    if (type === "FAQPage") body.questions = faqs.filter(f => f.question.trim() && f.answer.trim());
    if (type === "Organization") body.sameAs = sameAs.split(/\s+/).filter(Boolean);
    const r = await call("generate", "/generate", body);
    if (r) { setOut(r); setCopied(false); }
  }

  async function aiFaqs() {
    const r = await call("faq", "/ai/faq", { id: itemId });
    if (r) { setType("FAQPage"); setFaqs(r.questions); }
  }

  async function validatePasted() {
    const r = await call("validate", "/validate", { schema: pasted });
    if (r) setPastedResult(r.validation);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(out.snippet); setCopied(true); } catch { setError("Copy failed. Select the code and copy it manually."); }
  }

  const busy = !!loading;
  const canGenerate = !busy && (!needs || itemId) && (type !== "FAQPage" || faqs.some(f => f.question.trim() && f.answer.trim()));

  return (
    <div style={S.root}>
      <h1 style={S.title}>Schema & Rich Results</h1>
      <p style={S.subtitle}>Builds JSON-LD from your real Shopify data, checks it against Google's rich result requirements, and gives you a snippet to add to your theme.</p>

      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TYPES.map(t => (
            <button key={t.id} style={{ ...S.btnGhost, ...(type === t.id ? { background: "#4f46e5", borderColor: "#4f46e5" } : {}) }} onClick={() => setType(t.id)}>{t.label}</button>
          ))}
        </div>

        {needs && (
          <>
            <label style={S.label} htmlFor="schema-item">{needs === "product" ? "Product" : "Article"}</label>
            <select id="schema-item" style={S.input} value={itemId} onChange={e => setItemId(e.target.value)} disabled={loading === "items"}>
              <option value="">{loading === "items" ? "Loading…" : items.length ? "Select…" : "Nothing found in your store"}</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
          </>
        )}

        {type === "BreadcrumbList" && crumbs.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input style={S.input} placeholder="Name" value={c.name} onChange={e => setCrumbs(crumbs.map((x, n) => n === i ? { ...x, name: e.target.value } : x))} />
            <input style={S.input} placeholder="URL (optional)" value={c.url} onChange={e => setCrumbs(crumbs.map((x, n) => n === i ? { ...x, url: e.target.value } : x))} />
          </div>
        ))}
        {type === "BreadcrumbList" && crumbs.length < 10 && <button style={{ ...S.btnGhost, marginTop: 8 }} onClick={() => setCrumbs([...crumbs, { name: "", url: "" }])}>Add level</button>}

        {type === "Organization" && (
          <>
            <label style={S.label} htmlFor="schema-sameas">Social profile URLs (space separated, optional)</label>
            <input id="schema-sameas" style={S.input} value={sameAs} onChange={e => setSameAs(e.target.value)} placeholder="https://instagram.com/yourshop https://facebook.com/yourshop" />
          </>
        )}

        {type === "FAQPage" && (
          <>
            {faqs.map((f, i) => (
              <div key={i} style={{ marginTop: 10 }}>
                <input style={S.input} placeholder="Question" value={f.question} onChange={e => setFaqs(faqs.map((x, n) => n === i ? { ...x, question: e.target.value } : x))} />
                <textarea style={{ ...S.input, marginTop: 6, minHeight: 56 }} placeholder="Answer" value={f.answer} onChange={e => setFaqs(faqs.map((x, n) => n === i ? { ...x, answer: e.target.value } : x))} />
              </div>
            ))}
            <div style={S.row}>
              {faqs.length < 15 && <button style={S.btnGhost} onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}>Add question</button>}
              <button style={{ ...S.btnGhost, ...(busy ? S.btnOff : {}) }} disabled={busy} onClick={() => setFaqs([{ question: "", answer: "" }])}>Clear</button>
            </div>
          </>
        )}

        <div style={S.row}>
          <button style={{ ...S.btn, ...(!canGenerate ? S.btnOff : {}) }} disabled={!canGenerate} onClick={generate}>
            {loading === "generate" ? "Generating…" : "Generate schema"}
          </button>
          {needs === "product" && (
            <button style={{ ...S.btnGhost, ...(busy || !itemId ? S.btnOff : {}) }} disabled={busy || !itemId} onClick={aiFaqs}>
              {loading === "faq" ? "Writing…" : "AI: write FAQs from this product"}
            </button>
          )}
          <span style={{ color: "#71717a", fontSize: 12 }}>1 credit per generation. Manual entry is always available.</span>
        </div>
      </div>

      {out && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>Your {type} schema</h3>
          <pre style={S.code}>{out.snippet}</pre>
          <Validation v={out.validation} />
          <div style={S.row}>
            <button style={S.btnGhost} onClick={copy}>{copied ? "Copied" : "Copy snippet"}</button>
          </div>
          <p style={{ color: "#71717a", fontSize: 12, marginTop: 12 }}>
            Add this in your theme (Online Store → Themes → Edit code) in the relevant template or section. Many themes already output Product schema, so check for duplicates with Google's Rich Results Test before adding it.
          </p>
        </div>
      )}

      <div style={S.card}>
        <h3 style={S.cardTitle}>Validate existing JSON-LD</h3>
        <textarea style={{ ...S.input, minHeight: 110, fontFamily: "monospace" }} aria-label="JSON-LD to validate" placeholder="Paste JSON-LD or a full <script> tag" value={pasted} onChange={e => setPasted(e.target.value)} />
        <div style={S.row}>
          <button style={{ ...S.btnGhost, ...(busy || !pasted.trim() ? S.btnOff : {}) }} disabled={busy || !pasted.trim()} onClick={validatePasted}>
            {loading === "validate" ? "Checking…" : "Validate"}
          </button>
        </div>
        {pastedResult ? <Validation v={pastedResult} /> : <div style={S.empty}>Paste markup from any page to check it.</div>}
      </div>
    </div>
  );
}
