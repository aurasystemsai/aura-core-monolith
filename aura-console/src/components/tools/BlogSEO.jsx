import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
const API = "/api/blog-seo";
const S = {
  page:{background:"#09090b",minHeight:"100vh",color:"#fafafa",fontFamily:"'Inter',system-ui,sans-serif",padding:"28px 32px"},
  card:{background:"#18181b",border:"1px solid #27272a",borderRadius:14,padding:"20px 24px",marginBottom:16},
  h1:{fontSize:26,fontWeight:800,margin:"0 0 4px"},sub:{color:"#71717a",fontSize:14,margin:"0 0 24px"},
  btn:(v)=>({background:v==="primary"?"#4f46e5":"#27272a",color:"#fafafa",border:"none",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer"}),
  input:{width:"100%",background:"#18181b",border:"1px solid #3f3f46",borderRadius:10,color:"#fafafa",fontSize:14,padding:"10px 16px",outline:"none",boxSizing:"border-box"},
  row:{display:"flex",gap:10,marginBottom:12},badge:(s)=>({display:"inline-block",borderRadius:5,padding:"2px 9px",fontSize:11,fontWeight:700,background:s==="good"?"#052e16":s==="warn"?"#1c1917":"#27272a",color:s==="good"?"#4ade80":s==="warn"?"#fbbf24":"#a1a1aa"}),
  err:{background:"#3f1315",border:"1px solid #7f1d1d",borderRadius:8,padding:"12px 16px",color:"#fca5a5",fontSize:13,marginBottom:12},
};
export default function BlogSEO() {
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);const [err,setErr]=useState(null);const [url,setUrl]=useState("");const [score,setScore]=useState(null);const [analyzing,setAnalyzing]=useState(false);
  useEffect(()=>{apiFetchJSON(API+"/posts").then(r=>setPosts(r.posts||[])).catch(e=>setErr(e.message)).finally(()=>setLoading(false));},[]);
  const analyze=async()=>{if(!url.trim())return;setAnalyzing(true);try{const r=await apiFetchJSON(API+"/analyze",{method:"POST",body:JSON.stringify({url})});setScore(r.score||r);}catch(e){setErr(e.message);}finally{setAnalyzing(false);}};
  return (<div style={S.page}><h1 style={S.h1}>Blog SEO</h1><p style={S.sub}>Analyze and optimize blog post SEO performance.</p>
    {err&&<div style={S.err}>{err}</div>}
    <div style={S.card}><div style={{fontSize:11,fontWeight:700,color:"#52525b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Analyze Post URL</div>
      <div style={S.row}><input style={S.input} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://your-store.com/blog/post-title"/><button style={S.btn("primary")} onClick={analyze} disabled={analyzing}>{analyzing?"Analyzing…":"Analyze (1 credit)"}</button></div>
      {score&&<div style={{background:"#0c0c0e",border:"1px solid #27272a",borderRadius:10,padding:"14px 16px"}}>
        <div style={{display:"flex",gap:20,marginBottom:12}}>{score.score&&<div><div style={{fontSize:12,color:"#71717a"}}>SEO Score</div><div style={{fontWeight:800,fontSize:24,color:score.score>=70?"#4ade80":score.score>=50?"#fbbf24":"#f87171"}}>{score.score}/100</div></div>}</div>
        {(score.recommendations||[]).map((r,i)=><div key={i} style={{fontSize:13,color:"#e4e4e7",padding:"4px 0",borderBottom:"1px solid #1f1f22"}}>→ {typeof r==="string"?r:r.text||r.message}</div>)}
      </div>}
    </div>
    <div style={S.card}><div style={{fontSize:11,fontWeight:700,color:"#52525b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Recent Posts ({posts.length})</div>
      {loading&&<p style={{color:"#71717a"}}>Loading…</p>}
      {posts.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1f1f22",fontSize:13}}><span style={{color:"#e4e4e7"}}>{p.title||p.url}</span>{p.score!=null&&<span style={S.badge(p.score>=70?"good":p.score>=50?"warn":"bad")}>{p.score}/100</span>}</div>)}
    </div>
  </div>);
}
