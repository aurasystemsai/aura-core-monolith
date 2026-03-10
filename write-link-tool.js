const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'LinkIntersectOutreachSrc.jsx');
const dest = path.join(__dirname, 'aura-console/src/components/tools/LinkIntersectOutreach.jsx');
fs.copyFileSync(src, dest);
console.log('Copied OK', fs.statSync(dest).size, 'bytes');

// Legacy template below — kept for reference only, not used
const content = `import React, { useState, useCallback } from "react";
import { apiFetchJSON as _apiFetchJSON } from "../../api";

const apiFetch = (url, opts = {}) => _apiFetchJSON(url, {
  ...opts,
  headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
});

const API = "/api/link-intersect-outreach";

const S = {
  wrap: { background: "#09090b", color: "#fafafa", minHeight: "100vh", fontFamily: "inherit", paddingBottom: 60 },
  header: { padding: "20px 24px 0", borderBottom: "1px solid #18181b" },
  title: { fontSize: 22, fontWeight: 800, color: "#fafafa", margin: 0 },
  subtitle: { fontSize: 13, color: "#71717a", marginTop: 4 },
  tabsRow: { display: "flex", gap: 0, overflowX: "auto", paddingTop: 12 },
  tab: (active) => ({
    padding: "10px 16px", cursor: "pointer", border: "none", background: "none",
    color: active ? "#a78bfa" : "#71717a", fontWeight: active ? 700 : 500,
    borderBottom: \`2px solid \${active ? "#a78bfa" : "transparent"}\`,
    fontSize: 13, whiteSpace: "nowrap", transition: "color 0.15s",
  }),
  body: { padding: "20px 24px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "16px 18px", marginBottom: 12 },
  label: { fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, display: "block" },
  input: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 7, color: "#fafafa", padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" },
  btn: (c = "#7c3aed") => ({ padding: "9px 20px", background: c, border: "none", borderRadius: 7, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }),
  error: { background: "#2d0011", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", color: "#fca5a5", fontSize: 13, marginBottom: 12 },
  badge: (c) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: c + "22", color: c, border: \`1px solid \${c}55\` }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 },
  codeRow: { display: "flex", alignItems: "center", gap: 8, background: "#09090b", borderRadius: 6, padding: "7px 12px", marginBottom: 6 },
  emailBox: { background: "#09090b", borderRadius: 6, padding: "10px 12px", fontSize: 13, color: "#fafafa", whiteSpace: "pre-wrap", lineHeight: 1.6 },
};

const PC = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const EC = { high: "#f59e0b", medium: "#38bdf8", low: "#a78bfa" };

function CopyBtn({ text }) {
  const [c, setC] = useState(false);
  return (
    <button style={{ padding: "3px 9px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: 5, color: c ? "#22c55e" : "#a1a1aa", cursor: "pointer", fontSize: 11, flexShrink: 0 }}
      onClick={() => { navigator.clipboard && navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 1500); }}>
      {c ? "\\u2713" : "Copy"}
    </button>
  );
}

function Spin() {
  return <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #3f3f46", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "lio-spin 0.7s linear infinite" }} />;
}

function RunBtn({ onClick, disabled, loading, color, label, credits }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{ ...S.btn(color || "#7c3aed"), opacity: disabled ? 0.5 : 1 }}>
      {loading ? <><Spin />{" "}{label.replace(/^[^a-zA-Z]*/, "")}\\u2026</> : label}
      <span style={{ fontSize: 10, background: "rgba(255,255,255,0.15)", borderRadius: 4, padding: "2px 7px" }}>{credits} credit{credits > 1 ? "s" : ""}</span>
    </button>
  );
}

// Link Gap
function LinkGapTab() {
  const [domain, setDomain] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [niche, setNiche] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = useCallback(async () => {
    const comps = competitors.split(",").map(s => s.trim()).filter(Boolean);
    if (!domain || !comps.length) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const d = await apiFetch(\`\${API}/link-gap\`, { method: "POST", body: JSON.stringify({ yourDomain: domain, competitors: comps, niche }) });
      if (!d.ok) throw new Error(d.error);
      setResult(d);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, [domain, competitors, niche]);
  const lga = result && result.linkGapAnalysis;
  return (
    <div>
      <div style={S.card}>
        <div style={S.grid3}>
          <div><label style={S.label}>Your Domain</label><input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourstore.com" /></div>
          <div><label style={S.label}>Competitors (comma-separated)</label><input style={S.input} value={competitors} onChange={e => setCompetitors(e.target.value)} placeholder="comp1.com, comp2.com" /></div>
          <div><label style={S.label}>Niche (optional)</label><input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco yoga mats" /></div>
        </div>
        <RunBtn onClick={run} disabled={!domain || !competitors} loading={loading} color="#7c3aed" label="\\uD83D\\uDD0D Find Link Gaps" credits={1} />
      </div>
      {err && <div style={S.error}>{err}</div>}
      {result && lga && (
        <div>
          <div style={{ ...S.card, background: "linear-gradient(135deg,#0a0a0f,#130c1e)" }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#71717a", fontWeight: 600 }}>ESTIMATED DOMAIN GAP</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#ef4444", marginTop: 4 }}>{lga.estimatedDomainGap || "\\u2014"}</div>
                <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>referring domains behind competitors</div>
              </div>
              {result.monthlyLinkPlan && (
                <div style={{ background: "#27272a", borderRadius: 8, padding: "12px 16px", minWidth: 200 }}>
                  <div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, marginBottom: 6 }}>MONTHLY TARGET</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>{result.monthlyLinkPlan.target}</div>
                  {(result.monthlyLinkPlan.tactics || []).map((t, i) => <div key={i} style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>\\u2022 {t}</div>)}
                </div>
              )}
            </div>
          </div>
          {lga.typeGaps && lga.typeGaps.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83D\\uDD73\\uFE0F Link Type Gaps</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{lga.typeGaps.map((g, i) => <span key={i} style={S.badge("#f59e0b")}>{g}</span>)}</div>
            </div>
          )}
          {lga.topOpportunities && lga.topOpportunities.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>\\uD83C\\uDFAF Top Opportunities</div>
              {lga.topOpportunities.map((o, i) => (
                <div key={i} style={{ background: "#09090b", borderRadius: 7, padding: "10px 14px", marginBottom: 8 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{o.siteType}</span>
                    <span style={S.badge(PC[o.priority && o.priority.toLowerCase()] || "#71717a")}>{o.priority || "medium"} priority</span>
                    <span style={S.badge("#52525b")}>{o.domainAuthorityEstimate}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#a1a1aa" }}>{o.howToGet}</div>
                </div>
              ))}
            </div>
          )}
          {result.intersectTargets && result.intersectTargets.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>\\u2B50 Intersect Targets <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}> — link to multiple competitors, easiest to convince</span></div>
              {result.intersectTargets.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#a78bfa", padding: "4px 0", borderBottom: "1px solid #27272a" }}>\\u2192 {t}</div>)}
            </div>
          )}
          {result.quickWinTactics && result.quickWinTactics.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\u26A1 Quick Win Tactics</div>
              {result.quickWinTactics.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "4px 0" }}>\\u2713 {t}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Unlinked Mentions
function UnlinkedMentionsTab() {
  const [brand, setBrand] = useState("");
  const [domain, setDomain] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = useCallback(async () => {
    if (!brand) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const comps = competitors.split(",").map(s => s.trim()).filter(Boolean);
      const d = await apiFetch(\`\${API}/unlinked-mentions\`, { method: "POST", body: JSON.stringify({ brand, domain, competitors: comps }) });
      if (!d.ok) throw new Error(d.error);
      setResult(d);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, [brand, domain, competitors]);
  const strat = result && result.brandMentionStrategy;
  const email = result && result.outreachEmailTemplate;
  return (
    <div>
      <div style={S.card}>
        <div style={S.grid3}>
          <div><label style={S.label}>Brand Name</label><input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Your Brand" /></div>
          <div><label style={S.label}>Your Domain</label><input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourstore.com" /></div>
          <div><label style={S.label}>Competitors (optional)</label><input style={S.input} value={competitors} onChange={e => setCompetitors(e.target.value)} placeholder="comp1.com, comp2.com" /></div>
        </div>
        <RunBtn onClick={run} disabled={!brand} loading={loading} color="#059669" label="\\uD83C\\uDFF7\\uFE0F Find Unlinked Mentions" credits={1} />
      </div>
      {err && <div style={S.error}>{err}</div>}
      {result && (
        <div>
          {strat && strat.searchQueries && strat.searchQueries.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>\\uD83D\\uDD0D Search Queries to Find Mentions</div>
              {strat.searchQueries.map((q, i) => <div key={i} style={S.codeRow}><code style={{ fontSize: 12, color: "#38bdf8", flex: 1 }}>{q}</code><CopyBtn text={q} /></div>)}
            </div>
          )}
          <div style={S.grid2}>
            {strat && strat.platforms && strat.platforms.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83D\\uDCCD Platforms to Monitor</div>
                {strat.platforms.map((p, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "3px 0" }}>\\u2022 {p}</div>)}
              </div>
            )}
            {strat && strat.automationTips && strat.automationTips.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\u26A1 Set Up Alerts</div>
                {strat.automationTips.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "3px 0" }}>\\u2022 {t}</div>)}
              </div>
            )}
          </div>
          {email && (
            <div style={{ ...S.card, border: "1px solid #064e3b" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", marginBottom: 12 }}>\\uD83D\\uDCE7 Outreach Email Template</div>
              <div style={{ marginBottom: 10 }}>
                <div style={S.label}>SUBJECT</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "#09090b", borderRadius: 6, padding: "7px 12px", fontSize: 13 }}>{email.subject}</div>
                  <CopyBtn text={email.subject} />
                </div>
              </div>
              <div style={S.label}>BODY</div>
              <div style={S.emailBox}>{email.body}</div>
              <div style={{ textAlign: "right", marginTop: 6 }}><CopyBtn text={email.body} /></div>
              {email.followUpSubject && (
                <div style={{ marginTop: 14 }}>
                  <div style={S.label}>FOLLOW-UP SUBJECT</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, background: "#09090b", borderRadius: 6, padding: "7px 12px", fontSize: 13 }}>{email.followUpSubject}</div>
                    <CopyBtn text={email.followUpSubject} />
                  </div>
                  <div style={S.emailBox}>{email.followUpBody}</div>
                  <div style={{ textAlign: "right", marginTop: 6 }}><CopyBtn text={email.followUpBody || ""} /></div>
                </div>
              )}
            </div>
          )}
          <div style={S.grid2}>
            {result.estimatedMonthlyMentions && (
              <div style={{ ...S.card, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#71717a" }}>EST. MONTHLY MENTIONS</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#a78bfa", marginTop: 4 }}>{result.estimatedMonthlyMentions}</div>
              </div>
            )}
            {result.conversionRate && (
              <div style={{ ...S.card, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#71717a" }}>TYPICAL CONVERSION RATE</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>{result.conversionRate}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Outreach Sequences
function OutreachSequencesTab() {
  const [targetSite, setTargetSite] = useState("");
  const [yourSite, setYourSite] = useState("");
  const [yourContent, setYourContent] = useState("");
  const [angle, setAngle] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = useCallback(async () => {
    if (!targetSite || !yourSite) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const d = await apiFetch(\`\${API}/citation-outreach\`, { method: "POST", body: JSON.stringify({ targetSite, yourSite, yourContent, angle }) });
      if (!d.ok) throw new Error(d.error);
      setResult(d);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, [targetSite, yourSite, yourContent, angle]);
  const stepColors = ["#4f46e5", "#7c3aed", "#9d174d", "#374151"];
  return (
    <div>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>Target Site (to get a link from)</label><input style={S.input} value={targetSite} onChange={e => setTargetSite(e.target.value)} placeholder="industrysite.com" /></div>
          <div><label style={S.label}>Your Site</label><input style={S.input} value={yourSite} onChange={e => setYourSite(e.target.value)} placeholder="yourstore.com" /></div>
          <div><label style={S.label}>Content to get cited (optional)</label><input style={S.input} value={yourContent} onChange={e => setYourContent(e.target.value)} placeholder="Ultimate guide to eco yoga mats" /></div>
          <div><label style={S.label}>Unique angle (optional)</label><input style={S.input} value={angle} onChange={e => setAngle(e.target.value)} placeholder="Their article has an outdated stat we updated" /></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <RunBtn onClick={run} disabled={!targetSite || !yourSite} loading={loading} color="#4f46e5" label="\\uD83D\\uDCE7 Generate Outreach Sequence" credits={2} />
        </div>
      </div>
      {err && <div style={S.error}>{err}</div>}
      {result && (
        <div>
          {(result.outreachSequence || []).map((step, i) => (
            <div key={i} style={{ ...S.card, borderLeft: \`3px solid \${stepColors[i] || "#3f3f46"}\` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ background: stepColors[i], color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{step.step}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{step.type}</span>
                <span style={S.badge("#38bdf8")}>Send: {step.sendTiming}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={S.label}>SUBJECT</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "#09090b", borderRadius: 6, padding: "7px 12px", fontSize: 13 }}>{step.subject}</div>
                  <CopyBtn text={step.subject} />
                </div>
              </div>
              <div style={S.label}>BODY</div>
              <div style={S.emailBox}>{step.body}</div>
              <div style={{ textAlign: "right", marginTop: 6 }}><CopyBtn text={step.body} /></div>
            </div>
          ))}
          {result.subjectLineVariants && result.subjectLineVariants.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83E\\uDDEA Subject Line A/B Variants</div>
              {result.subjectLineVariants.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#a1a1aa", flex: 1 }}>{s}</span>
                  <CopyBtn text={s} />
                </div>
              ))}
            </div>
          )}
          <div style={S.grid2}>
            {result.valuePropositions && result.valuePropositions.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83D\\uDC8E Value Props to Mention</div>
                {result.valuePropositions.map((v, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "3px 0" }}>\\u2022 {v}</div>)}
              </div>
            )}
            {result.doNotDo && result.doNotDo.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>\\u274C Avoid These Mistakes</div>
                {result.doNotDo.map((d, i) => <div key={i} style={{ fontSize: 13, color: "#fca5a5", padding: "3px 0" }}>\\u2022 {d}</div>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// PR Stories
function PRStoriesTab() {
  const [brand, setBrand] = useState("");
  const [niche, setNiche] = useState("");
  const [products, setProducts] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = useCallback(async () => {
    if (!brand || !niche) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const d = await apiFetch(\`\${API}/pr-stories\`, { method: "POST", body: JSON.stringify({ brand, niche, products: products.split(",").map(p => p.trim()).filter(Boolean) }) });
      if (!d.ok) throw new Error(d.error);
      setResult(d);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, [brand, niche, products]);
  return (
    <div>
      <div style={S.card}>
        <div style={S.grid3}>
          <div><label style={S.label}>Brand Name</label><input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Your Brand" /></div>
          <div><label style={S.label}>Niche</label><input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco yoga equipment" /></div>
          <div><label style={S.label}>Products (comma-separated, optional)</label><input style={S.input} value={products} onChange={e => setProducts(e.target.value)} placeholder="yoga mats, blocks, straps" /></div>
        </div>
        <RunBtn onClick={run} disabled={!brand || !niche} loading={loading} color="#db2777" label="\\uD83D\\uDCF0 Find PR Story Angles" credits={2} />
      </div>
      {err && <div style={S.error}>{err}</div>}
      {result && (
        <div>
          {(result.prStoryAngles || []).map((a, i) => (
            <div key={i} style={S.card}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{a.headline}</div>
                <span style={S.badge(PC[a.linkPotential && a.linkPotential.toLowerCase()] || "#71717a")}>Link: {a.linkPotential}</span>
                <span style={S.badge(EC[a.effortToCreate && a.effortToCreate.toLowerCase()] || "#71717a")}>Effort: {a.effortToCreate}</span>
              </div>
              <span style={{ ...S.badge("#7c3aed"), marginBottom: 8, display: "inline-block" }}>{a.angle}</span>
              <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5, marginBottom: 6 }}>{a.pitch}</div>
              {a.dataNeeded && <div style={{ fontSize: 12, color: "#71717a" }}>\\uD83D\\uDCCA Data needed: {a.dataNeeded}</div>}
              {a.targetPublications && a.targetPublications.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={S.label}>TARGET PUBLICATIONS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {a.targetPublications.map((p, j) => <span key={j} style={S.badge("#38bdf8")}>{p}</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div style={S.grid2}>
            {result.dataStudyIdeas && result.dataStudyIdeas.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83D\\uDD2C Cheap Data Study Ideas</div>
                {result.dataStudyIdeas.map((d, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "3px 0" }}>\\u2022 {d}</div>)}
              </div>
            )}
            {result.journalistSearchQueries && result.journalistSearchQueries.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83D\\uDC26 Find Journalists</div>
                {result.journalistSearchQueries.map((q, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                    <code style={{ fontSize: 12, color: "#38bdf8", flex: 1 }}>{q}</code>
                    <CopyBtn text={q} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {result.pressReleaseOutline && (
            <div style={{ ...S.card, border: "1px solid #1c3d5a" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8", marginBottom: 8 }}>\\uD83D\\uDCC4 Press Release Outline</div>
              <div style={{ fontSize: 13, color: "#a1a1aa", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{result.pressReleaseOutline}</div>
              <div style={{ textAlign: "right", marginTop: 8 }}><CopyBtn text={result.pressReleaseOutline} /></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Guest Posts
function GuestPostTab() {
  const [niche, setNiche] = useState("");
  const [expertise, setExpertise] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = useCallback(async () => {
    if (!niche) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const d = await apiFetch(\`\${API}/guest-post-finder\`, { method: "POST", body: JSON.stringify({ niche, yourExpertise: expertise }) });
      if (!d.ok) throw new Error(d.error);
      setResult(d);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, [niche, expertise]);
  return (
    <div>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>Your Niche</label><input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco yoga equipment" /></div>
          <div><label style={S.label}>Your Expertise (optional)</label><input style={S.input} value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="sustainable living and mindfulness" /></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <RunBtn onClick={run} disabled={!niche} loading={loading} color="#0891b2" label="\\uD83D\\uDCDD Find Guest Post Opportunities" credits={1} />
        </div>
      </div>
      {err && <div style={S.error}>{err}</div>}
      {result && (
        <div>
          {result.searchQueries && result.searchQueries.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>\\uD83D\\uDD0D Google Search Queries to Find Sites</div>
              {result.searchQueries.map((q, i) => <div key={i} style={S.codeRow}><code style={{ fontSize: 12, color: "#38bdf8", flex: 1 }}>{q}</code><CopyBtn text={q} /></div>)}
            </div>
          )}
          {result.pitchTemplate && (
            <div style={{ ...S.card, border: "1px solid #1e3a5f" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8", marginBottom: 12 }}>\\uD83D\\uDCE7 Guest Post Pitch Template</div>
              <div style={{ marginBottom: 8 }}>
                <div style={S.label}>SUBJECT</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "#09090b", borderRadius: 6, padding: "7px 12px", fontSize: 13 }}>{result.pitchTemplate.subject}</div>
                  <CopyBtn text={result.pitchTemplate.subject} />
                </div>
              </div>
              <div style={S.label}>BODY</div>
              <div style={S.emailBox}>{result.pitchTemplate.body}</div>
              <div style={{ textAlign: "right", marginTop: 6 }}><CopyBtn text={result.pitchTemplate.body} /></div>
              {result.pitchTemplate.topicIdeas && result.pitchTemplate.topicIdeas.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={S.label}>TOPIC IDEAS TO PITCH</div>
                  {result.pitchTemplate.topicIdeas.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#a78bfa", padding: "3px 0" }}>\\uD83D\\uDCA1 {t}</div>)}
                </div>
              )}
            </div>
          )}
          <div style={S.grid2}>
            {result.evaluationCriteria && result.evaluationCriteria.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\u2705 How to Evaluate Sites</div>
                {result.evaluationCriteria.map((c, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "3px 0" }}>\\u2022 {c}</div>)}
              </div>
            )}
            {result.commonMistakes && result.commonMistakes.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>\\u274C Common Mistakes</div>
                {result.commonMistakes.map((m, i) => <div key={i} style={{ fontSize: 13, color: "#fca5a5", padding: "3px 0" }}>\\u2022 {m}</div>)}
              </div>
            )}
          </div>
          {result.linkBuildingByProxy && result.linkBuildingByProxy.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83E\\uDD1D Build Relationships First</div>
              {result.linkBuildingByProxy.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "3px 0" }}>\\u2022 {t}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Communities
function CommunitiesTab() {
  const [niche, setNiche] = useState("");
  const [brand, setBrand] = useState("");
  const [keywords, setKeywords] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = useCallback(async () => {
    if (!niche) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const d = await apiFetch(\`\${API}/community-monitor\`, { method: "POST", body: JSON.stringify({ niche, brand, keywords: keywords.split(",").map(k => k.trim()).filter(Boolean) }) });
      if (!d.ok) throw new Error(d.error);
      setResult(d);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, [niche, brand, keywords]);
  return (
    <div>
      <div style={S.card}>
        <div style={S.grid3}>
          <div><label style={S.label}>Niche</label><input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco yoga equipment" /></div>
          <div><label style={S.label}>Brand Name (optional)</label><input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Your Brand" /></div>
          <div><label style={S.label}>Keywords (comma-separated, optional)</label><input style={S.input} value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="sustainable yoga, eco mat" /></div>
        </div>
        <RunBtn onClick={run} disabled={!niche} loading={loading} color="#7c3aed" label="\\uD83D\\uDCAC Find Communities" credits={1} />
      </div>
      {err && <div style={S.error}>{err}</div>}
      {result && (
        <div>
          {result.subreddits && result.subreddits.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>\\uD83E\\uDD16 Subreddits to Target</div>
              {result.subreddits.map((s, i) => (
                <div key={i} style={{ background: "#09090b", borderRadius: 7, padding: "10px 12px", marginBottom: 7 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#ff6314" }}>{s.name}</span>
                    <span style={S.badge("#71717a")}>{s.estimatedSize}</span>
                    <span style={S.badge(s.engagement === "high" ? "#22c55e" : s.engagement === "medium" ? "#f59e0b" : "#ef4444")}>{s.engagement} engagement</span>
                    {s.linkFriendly && <span style={S.badge("#38bdf8")}>\\uD83D\\uDD17 link-friendly</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#a1a1aa" }}>{s.strategy}</div>
                </div>
              ))}
            </div>
          )}
          {result.otherCommunities && result.otherCommunities.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>\\uD83C\\uDF10 Other Communities</div>
              {result.otherCommunities.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #27272a", alignItems: "flex-start" }}>
                  <span style={S.badge("#a78bfa")}>{c.platform}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.community}</div>
                    <div style={{ fontSize: 12, color: "#a1a1aa" }}>{c.opportunity}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={S.grid2}>
            {result.monitoringKeywords && result.monitoringKeywords.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83D\\uDC41 Keywords to Monitor</div>
                {result.monitoringKeywords.map((k, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                    <code style={{ fontSize: 12, color: "#38bdf8", flex: 1 }}>{k}</code>
                    <CopyBtn text={k} />
                  </div>
                ))}
              </div>
            )}
            {result.valueAddApproach && result.valueAddApproach.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83D\\uDC8E Add Value First</div>
                {result.valueAddApproach.map((v, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "3px 0" }}>\\u2022 {v}</div>)}
              </div>
            )}
          </div>
          {result.redditSearchUrls && result.redditSearchUrls.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83D\\uDD17 Reddit Search URLs to Bookmark</div>
              {result.redditSearchUrls.map((u, i) => (
                <div key={i} style={S.codeRow}><code style={{ fontSize: 11, color: "#38bdf8", flex: 1, wordBreak: "break-all" }}>{u}</code><CopyBtn text={u} /></div>
              ))}
            </div>
          )}
          {result.contentThatPerformsWell && result.contentThatPerformsWell.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\uD83D\\uDCC8 Content That Gets Upvoted</div>
              {result.contentThatPerformsWell.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "3px 0" }}>\\u2022 {t}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Broken Links
function BrokenLinksTab() {
  const [niche, setNiche] = useState("");
  const [domain, setDomain] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = useCallback(async () => {
    if (!niche) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const d = await apiFetch(\`\${API}/broken-link-prospect\`, { method: "POST", body: JSON.stringify({ niche, yourDomain: domain, existingContent: content.split(",").map(c => c.trim()).filter(Boolean) }) });
      if (!d.ok) throw new Error(d.error);
      setResult(d);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, [niche, domain, content]);
  return (
    <div>
      <div style={S.card}>
        <div style={S.grid3}>
          <div><label style={S.label}>Niche</label><input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco yoga equipment" /></div>
          <div><label style={S.label}>Your Domain (optional)</label><input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourstore.com" /></div>
          <div><label style={S.label}>Your Content (comma-separated)</label><input style={S.input} value={content} onChange={e => setContent(e.target.value)} placeholder="guide to eco mats, yoga for beginners" /></div>
        </div>
        <RunBtn onClick={run} disabled={!niche} loading={loading} color="#b45309" label="\\uD83D\\uDD27 Find Broken Link Opportunities" credits={1} />
      </div>
      {err && <div style={S.error}>{err}</div>}
      {result && (
        <div>
          {result.prospectingSearchQueries && result.prospectingSearchQueries.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>\\uD83D\\uDD0D Prospecting Search Queries</div>
              {result.prospectingSearchQueries.map((q, i) => <div key={i} style={S.codeRow}><code style={{ fontSize: 12, color: "#38bdf8", flex: 1 }}>{q}</code><CopyBtn text={q} /></div>)}
            </div>
          )}
          {result.outreachTemplate && (
            <div style={{ ...S.card, border: "1px solid #451a03" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 12 }}>\\uD83D\\uDCE7 Broken Link Outreach Template</div>
              <div style={{ marginBottom: 8 }}>
                <div style={S.label}>SUBJECT</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "#09090b", borderRadius: 6, padding: "7px 12px", fontSize: 13 }}>{result.outreachTemplate.subject}</div>
                  <CopyBtn text={result.outreachTemplate.subject} />
                </div>
              </div>
              <div style={S.label}>BODY</div>
              <div style={S.emailBox}>{result.outreachTemplate.body}</div>
              <div style={{ textAlign: "right", marginTop: 6 }}><CopyBtn text={result.outreachTemplate.body} /></div>
              {result.outreachTemplate.keyElements && result.outreachTemplate.keyElements.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={S.label}>KEY ELEMENTS THAT CONVERT</div>
                  {result.outreachTemplate.keyElements.map((e, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa", padding: "2px 0" }}>\\u2713 {e}</div>)}
                </div>
              )}
            </div>
          )}
          {result.toolsToUse && result.toolsToUse.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>\\uD83D\\uDEE0\\uFE0F Tools to Use</div>
              {result.toolsToUse.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 160 }}>{t.tool}</span>
                  <span style={{ fontSize: 12, color: "#a1a1aa", flex: 1 }}>{t.purpose}</span>
                  <span style={S.badge(t.free ? "#22c55e" : "#ef4444")}>{t.free ? "Free" : "Paid"}</span>
                </div>
              ))}
            </div>
          )}
          <div style={S.grid2}>
            {result.contentToCreate && result.contentToCreate.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\u270D\\uFE0F Content to Create as Replacement</div>
                {result.contentToCreate.map((c, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "3px 0" }}>\\u2022 {c}</div>)}
              </div>
            )}
            {result.scalingTips && result.scalingTips.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>\\u26A1 Scaling Tips</div>
                {result.scalingTips.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "3px 0" }}>\\u2022 {t}</div>)}
              </div>
            )}
          </div>
          {result.estimatedSuccessRate && (
            <div style={{ ...S.card, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#71717a" }}>TYPICAL CONVERSION RATE</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#22c55e", marginTop: 4 }}>{result.estimatedSuccessRate}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "link-gap",     label: "\\uD83D\\uDD0D Link Gap",           component: LinkGapTab },
  { id: "unlinked",    label: "\\uD83C\\uDFF7\\uFE0F Unlinked Mentions",  component: UnlinkedMentionsTab },
  { id: "outreach",    label: "\\uD83D\\uDCE7 Outreach Sequences", component: OutreachSequencesTab },
  { id: "pr",          label: "\\uD83D\\uDCF0 PR Stories",          component: PRStoriesTab },
  { id: "guest",       label: "\\uD83D\\uDCDD Guest Posts",         component: GuestPostTab },
  { id: "communities", label: "\\uD83D\\uDCAC Communities",         component: CommunitiesTab },
  { id: "broken",      label: "\\uD83D\\uDD27 Broken Links",        component: BrokenLinksTab },
];

export default function LinkIntersectOutreach() {
  const [activeTab, setActiveTab] = useState("link-gap");
  const ActiveTab = TABS.find(t => t.id === activeTab).component;
  return (
    <div style={S.wrap}>
      <style>{\`@keyframes lio-spin { to { transform: rotate(360deg); } }\`}</style>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>\\uD83D\\uDD17</span>
          <div>
            <div style={S.title}>Link Intersect & Outreach</div>
            <div style={S.subtitle}>AI-powered link building — gap analysis, outreach sequences, PR stories, guest posts & more</div>
          </div>
        </div>
        <div style={S.tabsRow}>
          {TABS.map(t => (
            <button key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={S.body}><ActiveTab /></div>
    </div>
  );
}
`;

// fs.writeFileSync(
//   path.join(__dirname, 'aura-console/src/components/tools/LinkIntersectOutreach.jsx'),
//   content,
//   'utf8'
// );
// console.log('Written OK', fs.statSync(path.join(__dirname, 'aura-console/src/components/tools/LinkIntersectOutreach.jsx')).size, 'bytes');
