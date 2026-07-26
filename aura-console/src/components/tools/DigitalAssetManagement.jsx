import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#06b6d4";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? `2px solid ${accent}` : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  select: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}`, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  assetGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 },
  assetCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, overflow: "hidden", cursor: "pointer" },
  assetThumb: { height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 },
  assetMeta: { padding: "8px 10px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
};

const TABS = ["Library","Upload & Tag","Collections","AI Tagging","Version Control","Brand Kit","Usage Rights"];

const ASSETS = [
  { name: "hero-banner.jpg", type: "image", size: "2.4MB", tags: ["hero","banner","summer"], icon: "🖼️" },
  { name: "product-shoot-01.jpg", type: "image", size: "4.1MB", tags: ["product","main"], icon: "📸" },
  { name: "brand-logo.svg", type: "vector", size: "42KB", tags: ["logo","brand"], icon: "✨" },
  { name: "promo-video.mp4", type: "video", size: "48MB", tags: ["video","promo"], icon: "🎬" },
  { name: "font-inter.ttf", type: "font", size: "380KB", tags: ["font","brand"], icon: "🔤" },
  { name: "color-palette.pdf", type: "doc", size: "210KB", tags: ["brand","guidelines"], icon: "🎨" },
];

export default function DigitalAssetManagement() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [tagging, setTagging] = useState(false);

  const autoTag = async () => {
    setTagging(true);
    try { await apiFetchJSON("/api/digital-asset-management/auto-tag", { method: "POST", body: JSON.stringify({ assetId: "demo" }) }); } catch (_) {}
    setTimeout(() => setTagging(false), 1800);
  };

  const filtered = ASSETS.filter(a => a.name.includes(search) || a.tags.some(t => t.includes(search)));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Digital Asset Management</h1>
        <p style={S.subtitle}>Centralised media library with AI tagging, version control, and brand kit management</p>
      </div>

      <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr", marginBottom:24}}>
        {[["Total Assets","4,820"],["Storage Used","84 GB"],["Collections","42"],["Shared Links","128"]].map(([l,v])=>(
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && (
        <div style={S.card}>
          <div style={{...S.row, marginBottom:16, justifyContent:"space-between"}}>
            <span style={{fontWeight:700, fontSize:15}}>Asset Library</span>
            <div style={S.row}>
              <input style={{...S.input, width:220}} placeholder="Search assets or tags..." value={search} onChange={e=>setSearch(e.target.value)}/>
              <select style={{...S.select, width:140}}><option>All Types</option><option>Images</option><option>Videos</option><option>Documents</option><option>Fonts</option></select>
            </div>
          </div>
          <div style={S.assetGrid}>
            {filtered.map(a=>(
              <div key={a.name} style={S.assetCard}>
                <div style={{...S.assetThumb, background:"#12121a"}}>{a.icon}</div>
                <div style={S.assetMeta}>
                  <div style={{fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{a.name}</div>
                  <div style={{fontSize:11, color:"#71717a", marginTop:2}}>{a.size}</div>
                  <div style={{...S.row, gap:4, marginTop:6, flexWrap:"wrap"}}>
                    {a.tags.slice(0,2).map(t=><span key={t} style={{...S.badge(accent), fontSize:10, padding:"2px 6px"}}>{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===1 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Upload & Tag Assets</div>
          <div style={{border:"2px dashed #27272a", borderRadius:12, padding:40, textAlign:"center", cursor:"pointer", marginBottom:16}}>
            <div style={{fontSize:36, marginBottom:8}}>📁</div>
            <div style={{fontWeight:600, marginBottom:4}}>Drop files here or click to browse</div>
            <div style={{fontSize:13, color:"#71717a"}}>Supports: JPG, PNG, SVG, MP4, PDF, AI, PSD up to 500MB</div>
          </div>
          <div style={S.grid2}>
            <div><label style={S.label}>Collection</label><select style={S.select}><option>General</option><option>Product Photos</option><option>Campaign Assets</option><option>Brand Kit</option></select></div>
            <div><label style={S.label}>Tags (comma-separated)</label><input style={S.input} placeholder="product, summer, hero"/></div>
          </div>
          <div style={{...S.row, marginTop:12}}>
            <button style={S.btn()}>Upload</button>
            <button style={S.btnGhost} onClick={autoTag} disabled={tagging}>{tagging?"Tagging...":"AI Auto-Tag (1 credit)"}</button>
          </div>
        </div>
      )}

      {tab===2 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Collections</div>
          <div style={S.grid3}>
            {[
              {name:"Product Photos", count:1240, thumb:"📸"},
              {name:"Campaign Assets", count:380, thumb:"🎯"},
              {name:"Brand Kit", count:42, thumb:"✨"},
              {name:"Social Media", count:620, thumb:"📱"},
              {name:"Email Templates", count:180, thumb:"📧"},
              {name:"Video Content", count:84, thumb:"🎬"},
            ].map(c=>(
              <div key={c.name} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:16, cursor:"pointer"}}>
                <div style={{fontSize:28, marginBottom:8}}>{c.thumb}</div>
                <div style={{fontWeight:700, marginBottom:4}}>{c.name}</div>
                <div style={{fontSize:12, color:"#71717a"}}>{c.count} assets</div>
              </div>
            ))}
          </div>
          <button style={{...S.btn(), marginTop:16}}>+ New Collection</button>
        </div>
      )}

      {tab===3 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>AI Auto-Tagging</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>AURA uses computer vision to automatically tag images with objects, scenes, colours, and emotions detected in each asset.</p>
          <div style={S.grid2}>
            {[
              {asset:"hero-banner.jpg", tags:["woman", "outdoor", "summer", "warm tones", "lifestyle", "aspirational"], conf:"94%"},
              {asset:"product-shoot-01.jpg", tags:["product", "white background", "flat lay", "minimal", "premium"], conf:"98%"},
            ].map(a=>(
              <div key={a.asset} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:16}}>
                <div style={{fontWeight:700, marginBottom:8}}>{a.asset}</div>
                <div style={{...S.row, flexWrap:"wrap", gap:6, marginBottom:8}}>
                  {a.tags.map(t=><span key={t} style={S.badge(accent)}>{t}</span>)}
                </div>
                <div style={{fontSize:12, color:"#71717a"}}>Confidence: {a.conf}</div>
              </div>
            ))}
          </div>
          <div style={{...S.row, marginTop:16}}>
            <button style={S.btn()} onClick={autoTag} disabled={tagging}>{tagging?"Processing...":"Run AI Tagging on All Assets (2 credits)"}</button>
            <button style={S.btnGhost}>Configure Tag Categories</button>
          </div>
        </div>
      )}

      {tab===4 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Version Control</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Asset</th><th style={S.th}>Version</th><th style={S.th}>Date</th><th style={S.th}>Changed By</th><th style={S.th}></th></tr></thead>
            <tbody>
              {[
                {asset:"hero-banner.jpg", v:"v3 (current)", date:"Jul 26", by:"You"},
                {asset:"hero-banner.jpg", v:"v2", date:"Jul 20", by:"Designer"},
                {asset:"brand-logo.svg", v:"v2 (current)", date:"Jul 15", by:"You"},
                {asset:"brand-logo.svg", v:"v1", date:"Jun 1", by:"Agency"},
              ].map((r,i)=>(
                <tr key={i}>
                  <td style={S.td}>{r.asset}</td>
                  <td style={S.td}><span style={S.badge(r.v.includes("current")?accent:"#3f3f46")}>{r.v}</span></td>
                  <td style={S.td}>{r.date}</td>
                  <td style={S.td}>{r.by}</td>
                  <td style={S.td}><div style={S.row}><button style={S.btnSm}>Download</button><button style={{...S.btnSm, background:"#27272a"}}>Restore</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab===5 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Brand Kit</div>
          <div style={S.grid2}>
            <div>
              <div style={{fontWeight:700, marginBottom:12}}>Brand Colours</div>
              {[{name:"Primary",hex:"#6366f1"},{name:"Accent",hex:"#06b6d4"},{name:"Background",hex:"#09090b"},{name:"Text",hex:"#fafafa"}].map(c=>(
                <div key={c.name} style={{...S.row, marginBottom:10}}>
                  <div style={{width:32, height:32, borderRadius:6, background:c.hex, border:"1px solid #27272a"}}/>
                  <div>
                    <div style={{fontSize:13, fontWeight:600}}>{c.name}</div>
                    <div style={{fontSize:12, color:"#71717a", fontFamily:"monospace"}}>{c.hex}</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontWeight:700, marginBottom:12}}>Brand Fonts</div>
              {[{name:"Inter",use:"UI / Body"},{name:"Cal Sans",use:"Headings"},{name:"JetBrains Mono",use:"Code"}].map(f=>(
                <div key={f.name} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:12, marginBottom:8}}>
                  <div style={{fontWeight:700}}>{f.name}</div>
                  <div style={{fontSize:12, color:"#71717a"}}>{f.use}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={S.divider}/>
          <div style={S.row}>
            <button style={S.btn()}>Export Brand Kit PDF</button>
            <button style={S.btnGhost}>Share Brand Portal</button>
          </div>
        </div>
      )}

      {tab===6 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Usage Rights & Licensing</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Track licensing terms, expiry dates, and usage restrictions for every asset.</p>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Asset</th><th style={S.th}>License</th><th style={S.th}>Expires</th><th style={S.th}>Channels</th><th style={S.th}></th></tr></thead>
            <tbody>
              {[
                {asset:"hero-banner.jpg",lic:"Royalty Free",exp:"Never",ch:"Web, Print, Social"},
                {asset:"lifestyle-photo-03.jpg",lic:"Limited Use",exp:"Dec 31, 2026",ch:"Web Only"},
                {asset:"promo-video.mp4",lic:"Editorial Only",exp:"Jun 30, 2026",ch:"Social Media"},
              ].map((r,i)=>(
                <tr key={i}>
                  <td style={S.td}>{r.asset}</td>
                  <td style={S.td}><span style={S.badge(r.lic==="Royalty Free"?"#22c55e":r.lic==="Limited Use"?"#f59e0b":"#ef4444")}>{r.lic}</span></td>
                  <td style={S.td}>{r.exp}</td>
                  <td style={S.td}>{r.ch}</td>
                  <td style={S.td}><button style={S.btnSm}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{...S.btn(), marginTop:16}}>+ Add License Record</button>
        </div>
      )}
    </div>
  );
}