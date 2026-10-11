import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px", maxWidth: 760 },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h2: { fontSize: 16, margin: "0 0 4px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  label: { display: "block", fontSize: 12, color: "#a1a1aa", margin: "10px 0 4px", fontWeight: 600 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "9px 16px", fontSize: 13, cursor: "pointer", marginRight: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#0c1c12", border: "1px solid #14532d", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  muted: { color: "#71717a", fontSize: 12 },
  code: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, fontSize: 12, color: "#d4d4d8", overflow: "auto", maxHeight: 280, whiteSpace: "pre" },
  chk: (ok) => ({ fontSize: 13, padding: "5px 0", color: ok ? "#86efac" : "#fbbf24" }),
};
const API = "/api/local-seo-toolkit";

function Location({ loc, types, days, siteUrl, onSaved }) {
  const [form, setForm] = useState(loc.extra);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => setForm(loc.extra), [loc]);

  const setHour = (d, k, v) => setForm((f) => {
    const h = { ...(f.hours || {}) };
    h[d] = { open: "", close: "", ...(h[d] || {}), [k]: v };
    return { ...f, hours: h };
  });
  const clearDay = (d) => setForm((f) => { const h = { ...f.hours }; delete h[d]; return { ...f, hours: h }; });

  async function save() {
    setBusy(true); setError(""); setNote("");
    try {
      const r = await apiFetchJSON(`${API}/locations/${encodeURIComponent(loc.id)}`, { method: "PUT", body: JSON.stringify(form) });
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      setNote("Saved."); onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function copy() {
    const text = `<script type="application/ld+json">\n${JSON.stringify(loc.schema, null, 2)}\n</script>`;
    try { await navigator.clipboard.writeText(text); setNote("Copied. Paste it into your theme, just before the closing </head> tag."); } catch { setError("Copying was blocked. Select the code below and copy it by hand."); }
  }
  const a = loc.address || {};

  return (
    <div style={S.card}>
      <h2 style={S.h2}>{loc.name}</h2>
      <div style={S.muted}>{[a.address1, a.city, a.zip, a.countryCode].filter(Boolean).join(", ") || "No address set in Shopify"}</div>
      <div style={{ margin: "12px 0" }}>
        {loc.checks.map((c) => (
          <div key={c.label} style={S.chk(c.ok)}>{c.ok ? "✓" : "!"} {c.label}{!c.ok && <span style={S.muted}> — {c.fix}</span>}</div>
        ))}
      </div>
      <div style={S.grid}>
        <div>
          <label style={S.label}>Business type</label>
          <select style={S.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="">Choose a type</option>
            {types.map((t) => <option key={t} value={t}>{t.replace(/([a-z])([A-Z])/g, "$1 $2")}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Phone</label>
          <input style={S.input} value={form.phone} placeholder="+44 20 7946 0000" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label style={S.label}>Price range (optional)</label>
          <input style={S.input} value={form.priceRange} placeholder="££" maxLength={20} onChange={(e) => setForm({ ...form, priceRange: e.target.value })} />
        </div>
      </div>
      <label style={S.label}>Opening hours (leave a day empty if you are closed)</label>
      {days.map((d) => {
        const h = (form.hours || {})[d] || {};
        return (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 90, fontSize: 13 }}>{d}</span>
            <input type="time" style={{ ...S.input, width: 120 }} value={h.open || ""} onChange={(e) => setHour(d, "open", e.target.value)} />
            <span style={S.muted}>to</span>
            <input type="time" style={{ ...S.input, width: 120 }} value={h.close || ""} onChange={(e) => setHour(d, "close", e.target.value)} />
            {h.open || h.close ? <button style={{ ...S.ghost, padding: "4px 10px" }} onClick={() => clearDay(d)}>Closed</button> : null}
          </div>
        );
      })}
      {error && <div style={{ ...S.error, marginTop: 12 }}>{error}</div>}
      {note && <div style={{ ...S.ok, marginTop: 12 }}>{note}</div>}
      <div style={{ margin: "14px 0" }}>
        <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={busy} onClick={save}>{busy ? "Saving…" : "Save details"}</button>
        <button style={S.ghost} onClick={copy}>Copy markup</button>
      </div>
      <div style={S.muted}>Markup for this location (it updates after you save):</div>
      <pre style={{ ...S.code, marginTop: 6 }}>{JSON.stringify(loc.schema, null, 2)}</pre>
    </div>
  );
}

export default function LocalSEOToolkit() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [site, setSite] = useState(null);
  const [checking, setChecking] = useState(false);
  const [siteError, setSiteError] = useState("");

  async function load() {
    setError("");
    try {
      const r = await apiFetchJSON(`${API}/overview`);
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      setData(r);
    } catch (e) { setError(e.message); setData((d) => d || { locations: [], types: [], days: [] }); }
  }
  useEffect(() => { load(); }, []);

  async function checkSite() {
    setChecking(true); setSite(null); setSiteError("");
    try {
      const r = await apiFetchJSON(`${API}/site-check`);
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      setSite(r);
    } catch (e) { setSiteError(e.message); } finally { setChecking(false); }
  }

  return (
    <div style={S.root}>
      <h1 style={S.title}>Local SEO</h1>
      <p style={S.subtitle}>Helps people and search engines near you find your shop. We read your locations from Shopify and build the structured data Google uses for local results. Shopify does not hold opening hours or phone numbers for this, so add them below.</p>
      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <h2 style={S.h2}>Is it on your site already?</h2>
        <div style={{ ...S.muted, marginBottom: 10 }}>Opens your live home page and looks for local business data.</div>
        <button style={{ ...S.btn, ...(checking ? S.off : {}) }} disabled={checking} onClick={checkSite}>{checking ? "Checking…" : "Check my home page"}</button>
        {siteError && <div style={{ ...S.error, marginTop: 12 }}>{siteError}</div>}
        {site && (site.found
          ? <div style={{ ...S.ok, marginTop: 12 }}>Found local business data ({site.localTypes.join(", ")}) on {site.url}.</div>
          : <div style={{ ...S.error, marginTop: 12 }}>No local business data found on {site.url}. Add the markup below to your theme.{site.types.length ? ` Other data found: ${site.types.join(", ")}.` : ""}</div>)}
      </div>

      {!data ? <div style={S.muted}>Loading your locations…</div>
        : data.locations.length === 0 ? <div style={S.card}><div style={S.muted}>No active locations found in Shopify. Add one under Settings, Locations, then come back.</div></div>
        : data.locations.map((l) => <Location key={l.id} loc={l} types={data.types} days={data.days} siteUrl={data.siteUrl} onSaved={load} />)}
    </div>
  );
}
