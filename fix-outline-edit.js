const fs = require('fs');
const file = 'aura-console/src/components/tools/BlogSEO.jsx';
let c = fs.readFileSync(file, 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
const R = (o, n) => { o=o.replace(/\n/g,nl); n=n.replace(/\n/g,nl); if(!c.includes(o)){console.log('NOT FOUND:',o.slice(0,80));return;} c=c.replace(o,n); console.log('OK:',o.slice(0,60)); };

// 1. Add editingSection state after outlineResult
R(
` const [outlineResult, setOutlineResult] = useState(null);`,
` const [outlineResult, setOutlineResult] = useState(null);
 const [editingSection, setEditingSection] = useState(null);`
);

// 2. Add id="panel-outline" to the outline panel outer div
R(
` {/* Blog Outline */}
 {(true) && (
 <div style={{ background: C.surface, border: \`1px solid \${C.border}\`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>`,
` {/* Blog Outline */}
 {(true) && (
 <div id="panel-outline" style={{ background: C.surface, border: \`1px solid \${C.border}\`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>`
);

// 3. Add id="panel-intro" to the intro panel outer div
R(
` {/* Write Intro */}
 {(true) && (
 <div style={{ background: C.surface, border: \`1px solid \${C.border}\`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>`,
` {/* Write Intro */}
 {(true) && (
 <div id="panel-intro" style={{ background: C.surface, border: \`1px solid \${C.border}\`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>`
);

// 4. Add id="panel-titles" to the titles panel outer div
R(
` {/* Title Ideas */}
 {(true) && (
 <div style={{ background: C.surface, border: \`1px solid \${C.border}\`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>`,
` {/* Title Ideas */}
 {(true) && (
 <div id="panel-titles" style={{ background: C.surface, border: \`1px solid \${C.border}\`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>`
);

// 5. Add id="panel-draft" to the draft panel outer div
R(
` {/* Full Draft */}
 {(true) && (
 <div style={{ background: C.surface, border: \`1px solid \${C.border}\`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>`,
` {/* Full Draft */}
 {(true) && (
 <div id="panel-draft" style={{ background: C.surface, border: \`1px solid \${C.border}\`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>`
);

// 6. Replace the section cards with editable + scroll version
const OLD_SECTIONS = ` {(outlineResult.sections || []).map((sec, i) => (
 <div key={i} style={{ background: C.bg, border: \`1px solid \${C.border}\`, borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: sec.keyPoints?.length ? 10 : 0 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
 <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0 }}>H2</span>
 <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{sec.heading}</span>
 </div>
 <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
 {sec.type && <span style={{ fontSize: 10, color: C.dim, background: C.muted, padding: "2px 8px", borderRadius: 4, textTransform: "capitalize" }}>{sec.type}</span>}
 {sec.suggestedWordCount > 0 && <span style={{ fontSize: 10, color: C.dim }}>~{sec.suggestedWordCount}w</span>}
 </div>
 </div>
 {sec.keyPoints?.length > 0 && (
 <ul style={{ margin: "0 0 0 24px", padding: 0 }}>
 {sec.keyPoints.map((pt, j) => (
 <li key={j} style={{ fontSize: 12, color: C.sub, lineHeight: 1.7 }}>{pt}</li>
 ))}
 </ul>
 )}
 {sec.seoTip && (
 <div style={{ marginTop: 8, fontSize: 11, color: "#6ee7b7", borderTop: \`1px solid \${C.border}\`, paddingTop: 8 }}>💡 {sec.seoTip}</div>
 )}
 <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => { setIntroKw(sec.heading); setDraftKw(outlineKw || sec.heading)}}>→ Write intro from this</button>
 </div>
 </div>
 ))}`;

const NEW_SECTIONS = ` {(outlineResult.sections || []).map((sec, i) => {
 const isEditing = editingSection === i;
 const updateSection = (patch) => {
 const sections = outlineResult.sections.map((s, idx) => idx === i ? { ...s, ...patch } : s);
 setOutlineResult({ ...outlineResult, sections });
 };
 return (
 <div key={i} style={{ background: C.bg, border: \`1px solid \${isEditing ? C.indigo : C.border}\`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, transition: "border-color 0.2s" }}>
 {isEditing ? (
 <div>
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
 <span style={{ fontSize: 11, fontWeight: 700, color: C.indigo, flexShrink: 0 }}>H2</span>
 <input style={{ ...S.input, flex: 1, fontWeight: 600, fontSize: 14 }} value={sec.heading} onChange={e => updateSection({ heading: e.target.value })} autoFocus />
 <button style={{ fontSize: 11, padding: "4px 12px", borderRadius: 7, border: \`1px solid \${C.green}\`, background: "transparent", color: C.green, cursor: "pointer", fontWeight: 600, flexShrink: 0 }} onClick={() => setEditingSection(null)}>✓ Done</button>
 </div>
 {(sec.keyPoints || []).map((pt, j) => (
 <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
 <span style={{ color: C.dim, fontSize: 16, flexShrink: 0 }}>•</span>
 <input style={{ ...S.input, flex: 1, fontSize: 12 }} value={pt} onChange={e => {
 const kps = (sec.keyPoints || []).map((p, k) => k === j ? e.target.value : p);
 updateSection({ keyPoints: kps });
 }} />
 <button style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 18, padding: "0 4px", lineHeight: 1 }} onClick={() => {
 const kps = (sec.keyPoints || []).filter((_, k) => k !== j);
 updateSection({ keyPoints: kps });
 }}>×</button>
 </div>
 ))}
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px", marginTop: 4 }} onClick={() => {
 const kps = [...(sec.keyPoints || []), ""];
 updateSection({ keyPoints: kps });
 }}>+ Add point</button>
 {sec.seoTip !== undefined && (
 <div style={{ marginTop: 10 }}>
 <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>SEO tip</div>
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box", fontSize: 11 }} value={sec.seoTip || ""} onChange={e => updateSection({ seoTip: e.target.value })} placeholder="SEO tip…" />
 </div>
 )}
 </div>
 ) : (
 <div>
 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: sec.keyPoints?.length ? 10 : 0 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
 <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0 }}>H2</span>
 <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{sec.heading}</span>
 </div>
 <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
 {sec.type && <span style={{ fontSize: 10, color: C.dim, background: C.muted, padding: "2px 8px", borderRadius: 4, textTransform: "capitalize" }}>{sec.type}</span>}
 {sec.suggestedWordCount > 0 && <span style={{ fontSize: 10, color: C.dim }}>~{sec.suggestedWordCount}w</span>}
 <button style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, border: \`1px solid \${C.border}\`, background: "none", color: C.dim, cursor: "pointer" }} onClick={() => setEditingSection(i)}>✏️ Edit</button>
 </div>
 </div>
 {sec.keyPoints?.length > 0 && (
 <ul style={{ margin: "0 0 0 24px", padding: 0 }}>
 {sec.keyPoints.map((pt, j) => (
 <li key={j} style={{ fontSize: 12, color: C.sub, lineHeight: 1.7 }}>{pt}</li>
 ))}
 </ul>
 )}
 {sec.seoTip && (
 <div style={{ marginTop: 8, fontSize: 11, color: "#6ee7b7", borderTop: \`1px solid \${C.border}\`, paddingTop: 8 }}>💡 {sec.seoTip}</div>
 )}
 <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => {
 setIntroKw(sec.heading); setDraftKw(outlineKw || sec.heading);
 document.getElementById('panel-intro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }}>→ Write intro from this</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => {
 setDraftKw(outlineKw || sec.heading);
 document.getElementById('panel-draft')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }}>→ Use in Draft</button>
 </div>
 </div>
 )}
 </div>
 );
 })}`;

R(OLD_SECTIONS, NEW_SECTIONS);

// 7. Update "Next step" buttons at end of outline to scroll
R(
` <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { const _kw = outlineResult?.title || outlineResult?.primaryKeyword || outlineKw; setTitleKw(_kw)}}>💡 Title Ideas →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { const _kw = outlineResult?.title || outlineResult?.primaryKeyword || outlineKw; setIntroKw(_kw)}}>✍️ Write Intro →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { const _kw = outlineResult?.title || outlineResult?.primaryKeyword || outlineKw; setDraftKw(_kw); if (outlineTone) setDraftTone(outlineTone)}}>📄 Full Draft →</button>`,
` <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { const _kw = outlineResult?.title || outlineResult?.primaryKeyword || outlineKw; setTitleKw(_kw); document.getElementById('panel-titles')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>💡 Title Ideas →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { const _kw = outlineResult?.title || outlineResult?.primaryKeyword || outlineKw; setIntroKw(_kw); document.getElementById('panel-intro')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>✍️ Write Intro →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { const _kw = outlineResult?.title || outlineResult?.primaryKeyword || outlineKw; setDraftKw(_kw); if (outlineTone) setDraftTone(outlineTone); document.getElementById('panel-draft')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>📄 Full Draft →</button>`
);

fs.writeFileSync(file, c, 'utf8');
console.log('\nDone.');
