import React, { useState } from "react";
import { MozTabs } from "../MozUI";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "good" ? "#052e16" : c === "warn" ? "#3d2a0a" : c === "bad" ? "#3f1315" : "#27272a", color: c === "good" ? "#4ade80" : c === "warn" ? "#fbbf24" : c === "bad" ? "#f87171" : "#a1a1aa" }),
};

const TABS = [
  { id: "profile",  label: "Data Profiler" },
  { id: "mapping",  label: "Field Mapping" },
  { id: "guide",    label: "Data Quality Guide" },
];

const SAMPLE_RECORDS = [
  { id: "C001", name: "Sarah Johnson",   email: "sarah.j@example.com", phone: "+44 7700 900123", city: "London",    country: "GB", totalOrders: 8, totalSpend: 624.50, lastOrder: "2024-12-10", tags: "VIP,repeat" },
  { id: "C002", name: "Marcus Williams", email: "m.williams@test.com",  phone: "",                city: "Manchester", country: "GB", totalOrders: 1, totalSpend: 45.00,  lastOrder: "2024-09-03", tags: "" },
  { id: "C003", name: "",               email: "anon@example.com",     phone: "+1 555 0100",     city: "",          country: "US", totalOrders: 3, totalSpend: 210.00, lastOrder: "2024-11-20", tags: "new" },
  { id: "C004", name: "Emma Clarke",    email: "emma@clarke.co.uk",    phone: "+44 7911 123456", city: "Bristol",   country: "GB", totalOrders: 12, totalSpend: 1250.00, lastOrder: "2025-01-02", tags: "VIP,high-ltv" },
  { id: "C005", name: "Raj Patel",      email: "rajpatel",             phone: "+91 98765 43210", city: "Mumbai",    country: "IN", totalOrders: 2, totalSpend: 89.00,  lastOrder: "2024-10-15", tags: "" },
];

const FIELD_DEFINITIONS = [
  { field: "email",      required: true,  validation: "RFC 5321 email format",          enrichSources: ["Clearbit", "Hunter.io"] },
  { field: "phone",      required: false, validation: "E.164 format (+CC NN...)",       enrichSources: ["Twilio Lookup", "NumVerify"] },
  { field: "name",       required: true,  validation: "Non-empty, 2+ chars",            enrichSources: ["Shopify profile", "order data"] },
  { field: "city",       required: false, validation: "ISO 3166 region",                enrichSources: ["IP geolocation", "postcode API"] },
  { field: "country",    required: true,  validation: "ISO 3166-1 alpha-2 (2-char)",    enrichSources: ["Shopify shipping address"] },
  { field: "tags",       required: false, validation: "Comma-separated, no spaces",     enrichSources: ["RFM score engine", "behaviour data"] },
];

function profileRecord(rec) {
  const issues = [];
  if (!rec.email || !rec.email.includes("@")) issues.push({ field: "email", issue: "Invalid email format" });
  if (!rec.name || rec.name.trim().length < 2) issues.push({ field: "name", issue: "Missing or too short" });
  if (!rec.phone) issues.push({ field: "phone", issue: "Missing phone number" });
  if (!rec.city) issues.push({ field: "city", issue: "Missing city" });
  if (!rec.tags) issues.push({ field: "tags", issue: "No tags assigned" });
  const completeness = Math.round(100 - (issues.length / 5) * 100);
  return { issues, completeness };
}

export default function DataEnrichmentSuite() {
  const [tab, setTab] = useState("profile");
  const [selected, setSelected] = useState(null);
  const [csvInput, setCsvInput] = useState("");
  const [mapping, setMapping] = useState({ name: "name", email: "email", phone: "phone", city: "city", country: "country" });

  const profiles = SAMPLE_RECORDS.map(r => ({ ...r, ...profileRecord(r) }));
  const avgCompleteness = Math.round(profiles.reduce((s, p) => s + p.completeness, 0) / profiles.length);
  const issues = profiles.reduce((s, p) => s + p.issues.length, 0);

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Data Enrichment Suite</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Profile, validate and enrich your customer and product data. Identify missing fields, normalise formats, and prepare clean datasets for segmentation and marketing automation.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Records",           value: profiles.length,  color: "#818cf8" },
          { label: "Avg Completeness",  value: `${avgCompleteness}%`, color: avgCompleteness >= 80 ? "#4ade80" : "#fbbf24" },
          { label: "Total Issues",      value: issues,           color: issues > 5 ? "#f87171" : "#fbbf24" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* DATA PROFILER */}
      {tab === "profile" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={S.sectionTitle}>Customer Records — Sample Data</div>
              <div style={{ fontSize: 11, color: "#52525b" }}>Click a record to inspect data quality</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["ID", "Name", "Email", "Phone", "City", "Country", "Completeness", "Issues"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 12px", background: "#09090b", color: "#52525b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #27272a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(rec => (
                    <tr key={rec.id} style={{ cursor: "pointer", background: selected?.id === rec.id ? "#1a1a2e" : "transparent" }} onClick={() => setSelected(rec)}>
                      <td style={{ padding: "8px 12px", color: "#818cf8", fontWeight: 700 }}>{rec.id}</td>
                      <td style={{ padding: "8px 12px", color: rec.name ? "#e4e4e7" : "#f87171" }}>{rec.name || "⚠ Missing"}</td>
                      <td style={{ padding: "8px 12px", color: rec.email?.includes("@") ? "#e4e4e7" : "#f87171" }}>{rec.email || "—"}</td>
                      <td style={{ padding: "8px 12px", color: rec.phone ? "#e4e4e7" : "#a1a1aa" }}>{rec.phone || "—"}</td>
                      <td style={{ padding: "8px 12px", color: rec.city ? "#e4e4e7" : "#a1a1aa" }}>{rec.city || "—"}</td>
                      <td style={{ padding: "8px 12px", color: "#e4e4e7" }}>{rec.country}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 4, height: 8, width: 80, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${rec.completeness}%`, background: rec.completeness >= 80 ? "#4ade80" : rec.completeness >= 60 ? "#fbbf24" : "#f87171" }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}>{rec.completeness}%</div>
                      </td>
                      <td style={{ padding: "8px 12px", color: rec.issues.length ? "#f87171" : "#4ade80", fontWeight: 700 }}>{rec.issues.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>Record Detail: {selected.id}</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => setSelected(null)}>Close</button>
              </div>
              {selected.issues.length === 0 ? (
                <div style={{ color: "#4ade80", fontSize: 13 }}>✓ No data quality issues found for this record.</div>
              ) : (
                selected.issues.map((iss, i) => (
                  <div key={i} style={S.row}>
                    <span style={S.badge("bad")}>Issue</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>Field: <code style={{ color: "#f87171" }}>{iss.field}</code></div>
                      <div style={{ fontSize: 12, color: "#a1a1aa" }}>{iss.issue}</div>
                      <div style={{ fontSize: 11, color: "#818cf8" }}>Enrich via: {FIELD_DEFINITIONS.find(f => f.field === iss.field)?.enrichSources.join(", ") || "Manual entry"}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* FIELD MAPPING */}
      {tab === "mapping" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Standard Field Definitions</div>
            {FIELD_DEFINITIONS.map(f => (
              <div key={f.field} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <code style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", background: "#0d0d0f", padding: "2px 8px", borderRadius: 4 }}>{f.field}</code>
                    {f.required ? <span style={S.badge("bad")}>Required</span> : <span style={S.badge()}>Optional</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>Validation: {f.validation}</div>
                  <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>Enrich from: {f.enrichSources.join(", ")}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Import CSV — Map Your Fields</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>Paste a CSV header row to map your columns to standard fields.</p>
            <textarea style={{ ...S.ta, minHeight: 80 }} value={csvInput} onChange={e => setCsvInput(e.target.value)} placeholder="Paste CSV header row, e.g: customer_id,full_name,email_address,mobile,city_name,country_code" />
            {csvInput && (
              <div style={{ marginTop: 12 }}>
                <div style={S.sectionTitle}>Detected Columns → Map to Standard Field</div>
                {csvInput.split(",").map(col => col.trim()).filter(Boolean).map(col => (
                  <div key={col} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <code style={{ fontSize: 12, color: "#fbbf24", background: "#0d0d0f", padding: "3px 8px", borderRadius: 4, minWidth: 120 }}>{col}</code>
                    <span style={{ color: "#52525b", fontSize: 12 }}>→</span>
                    <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 12, padding: "6px 10px", outline: "none" }} value={mapping[col] || ""} onChange={e => setMapping(p => ({ ...p, [col]: e.target.value }))}>
                      <option value="">Ignore</option>
                      {FIELD_DEFINITIONS.map(f => <option key={f.field} value={f.field}>{f.field}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Data Quality Framework</div>
            {[
              { t: "Completeness",  d: "100% of required fields are populated. Target: >95% for email, >80% for phone, >70% for city/region." },
              { t: "Accuracy",      d: "Data reflects reality. Email deliverability rate > 95%. Phone number valid format. Addresses match postcode." },
              { t: "Consistency",   d: "Same format across all records. Country always ISO alpha-2. Phone always E.164 format. Dates always ISO 8601." },
              { t: "Uniqueness",    d: "No duplicate records. Email deduplication is the most common need. Run duplicate check monthly." },
              { t: "Timeliness",    d: "Data is up-to-date. Email bounces are removed within 48h. Address changes sync from Shopify in real-time." },
              { t: "Validity",      d: "Data conforms to defined rules. Email has @ symbol. Phone has +CC prefix. Tags are comma-separated strings." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>📊</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Enrichment ROI by Field</div>
            {[
              { field: "Email (verified)",   value: "+22% deliverability",   cost: "~$0.003/record" },
              { field: "Phone (E.164)",       value: "+18% SMS conversion",   cost: "~$0.01/lookup" },
              { field: "City/Region",         value: "+15% geo-targeting ROI", cost: "Free (IP geoloc)" },
              { field: "Company/Industry",    value: "+30% B2B segment match",  cost: "~$0.05/record" },
              { field: "RFM Tags",            value: "+41% campaign efficiency", cost: "Free (calculated)" },
            ].map(r => (
              <div key={r.field} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{r.field}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>{r.value}</span>
                <span style={{ color: "#71717a" }}>{r.cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
