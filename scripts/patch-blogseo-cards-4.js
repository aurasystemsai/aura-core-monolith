/**
 * Patch 4: Add 5 remaining GET/DELETE route cards
 * GET /voice-profile/:id, DELETE /voice-profile/:id, DELETE /rank/keyword/:id
 * GET /gsc/summary, GET /log-analyser/history
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../aura-console/src/components/tools/BlogSEO.jsx');
const rawSrc = fs.readFileSync(FILE, 'utf8');
const hasCRLF = rawSrc.includes('\r\n');
let src = hasCRLF ? rawSrc.replace(/\r\n/g, '\n') : rawSrc;

function patch(anchorOld, anchorNew) {
  if (!src.includes(anchorOld)) {
    console.error('ANCHOR NOT FOUND:\n' + anchorOld.slice(0, 300).replace(/\n/g, '\\n'));
    process.exit(1);
  }
  const count = src.split(anchorOld).length - 1;
  if (count > 1) {
    console.error('ANCHOR NOT UNIQUE (found ' + count + ' times):\n' + anchorOld.slice(0, 200));
    process.exit(1);
  }
  src = src.replace(anchorOld, anchorNew);
  console.log('\u2713 Patched: ' + anchorOld.slice(0, 80).trim().replace(/\n/g, ' ').replace(/\r/g, ''));
}

// GET voice profile by ID
const vpGetCard = `            <div style={S.card}><div style={{...S.row,alignItems:'center',marginBottom:6}}><div style={{...S.cardTitle,marginBottom:0}}>\uD83D\uDCE5 Load Voice Profile by ID</div><button style={{...S.btn(),marginLeft:'auto'}} disabled={xLoad['x_vpget']} onClick={async()=>{setXLoad(p=>({...p,'x_vpget':true}));try{const d=await apiFetchJSON(\`\${API}/voice-profile/\${vpLoadId}\`,{method:'GET'});setXRes(p=>({...p,'x_vpget':d}));}catch(e){setXRes(p=>({...p,'x_vpget':{error:e.message}}));}setXLoad(p=>({...p,'x_vpget':false}));}}>{xLoad['x_vpget']?'Loading\u2026':'Load'}</button></div><input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Voice Profile ID..." value={vpLoadId} onChange={e=>setVpLoadId(e.target.value)}/>{xRes['x_vpget']&&<div style={{...S.result,marginTop:6,fontSize:12}}>{xRes['x_vpget'].error?<span style={{color:'#f87171'}}>{xRes['x_vpget'].error}</span>:<pre style={{margin:0,whiteSpace:'pre-wrap',maxHeight:200,overflow:'auto'}}>{JSON.stringify(xRes['x_vpget'],null,2)}</pre>}</div>}</div>`;

// DELETE voice profile by ID
const vpDelCard = `            <div style={S.card}><div style={{...S.row,alignItems:'center',marginBottom:6}}><div style={{...S.cardTitle,marginBottom:0}}>\uD83D\uDDD1\uFE0F Delete Voice Profile</div><button style={{...S.btn(),marginLeft:'auto'}} disabled={xLoad['x_vpdel']} onClick={async()=>{setXLoad(p=>({...p,'x_vpdel':true}));try{const d=await apiFetchJSON(\`\${API}/voice-profile/\${vpLoadId}\`,{method:'DELETE'});setXRes(p=>({...p,'x_vpdel':d}));}catch(e){setXRes(p=>({...p,'x_vpdel':{error:e.message}}));}setXLoad(p=>({...p,'x_vpdel':false}));}}>{xLoad['x_vpdel']?'Deleting\u2026':'Delete'}</button></div><input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Voice Profile ID..." value={vpLoadId} onChange={e=>setVpLoadId(e.target.value)}/>{xRes['x_vpdel']&&<div style={{...S.result,marginTop:6,fontSize:12}}>{xRes['x_vpdel'].error?<span style={{color:'#f87171'}}>{xRes['x_vpdel'].error}</span>:<pre style={{margin:0,whiteSpace:'pre-wrap',maxHeight:200,overflow:'auto'}}>{JSON.stringify(xRes['x_vpdel'],null,2)}</pre>}</div>}</div>`;

// DELETE rank keyword by ID
const rankDelCard = `            <div style={S.card}><div style={{...S.row,alignItems:'center',marginBottom:6}}><div style={{...S.cardTitle,marginBottom:0}}>\uD83D\uDDD1\uFE0F Delete Tracked Keyword</div><button style={{...S.btn(),marginLeft:'auto'}} disabled={xLoad['x_rankdel']} onClick={async()=>{setXLoad(p=>({...p,'x_rankdel':true}));try{const d=await apiFetchJSON(\`\${API}/rank/keyword/\${rankIdInput}\`,{method:'DELETE'});setXRes(p=>({...p,'x_rankdel':d}));}catch(e){setXRes(p=>({...p,'x_rankdel':{error:e.message}}));}setXLoad(p=>({...p,'x_rankdel':false}));}}>{xLoad['x_rankdel']?'Deleting\u2026':'Delete'}</button></div><input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Keyword ID..." value={rankIdInput} onChange={e=>setRankIdInput(e.target.value)}/>{xRes['x_rankdel']&&<div style={{...S.result,marginTop:6,fontSize:12}}>{xRes['x_rankdel'].error?<span style={{color:'#f87171'}}>{xRes['x_rankdel'].error}</span>:<pre style={{margin:0,whiteSpace:'pre-wrap',maxHeight:200,overflow:'auto'}}>{JSON.stringify(xRes['x_rankdel'],null,2)}</pre>}</div>}</div>`;

// GET GSC summary
const gscCard = `            <div style={S.card}><div style={{...S.row,alignItems:'center',marginBottom:6}}><div style={{...S.cardTitle,marginBottom:0}}>\uD83D\uDCCA GSC Summary</div><button style={{...S.btn(),marginLeft:'auto'}} disabled={xLoad['x_gscsummary']} onClick={async()=>{setXLoad(p=>({...p,'x_gscsummary':true}));try{const d=await apiFetchJSON(\`\${API}/gsc/summary\`,{method:'GET'});setXRes(p=>({...p,'x_gscsummary':d}));}catch(e){setXRes(p=>({...p,'x_gscsummary':{error:e.message}}));}setXLoad(p=>({...p,'x_gscsummary':false}));}}>{xLoad['x_gscsummary']?'Loading\u2026':'Load'}</button></div>{xRes['x_gscsummary']&&<div style={{...S.result,marginTop:6,fontSize:12}}>{xRes['x_gscsummary'].error?<span style={{color:'#f87171'}}>{xRes['x_gscsummary'].error}</span>:<pre style={{margin:0,whiteSpace:'pre-wrap',maxHeight:200,overflow:'auto'}}>{JSON.stringify(xRes['x_gscsummary'],null,2)}</pre>}</div>}</div>`;

// GET log analyser history
const logHistCard = `            <div style={S.card}><div style={{...S.row,alignItems:'center',marginBottom:6}}><div style={{...S.cardTitle,marginBottom:0}}>\uD83D\uDCDC Log Analyser History</div><button style={{...S.btn(),marginLeft:'auto'}} disabled={xLoad['x_loghistory']} onClick={async()=>{setXLoad(p=>({...p,'x_loghistory':true}));try{const d=await apiFetchJSON(\`\${API}/log-analyser/history\`,{method:'GET'});setXRes(p=>({...p,'x_loghistory':d}));}catch(e){setXRes(p=>({...p,'x_loghistory':{error:e.message}}));}setXLoad(p=>({...p,'x_loghistory':false}));}}>{xLoad['x_loghistory']?'Loading\u2026':'Load'}</button></div>{xRes['x_loghistory']&&<div style={{...S.result,marginTop:6,fontSize:12}}>{xRes['x_loghistory'].error?<span style={{color:'#f87171'}}>{xRes['x_loghistory'].error}</span>:<pre style={{margin:0,whiteSpace:'pre-wrap',maxHeight:200,overflow:'auto'}}>{JSON.stringify(xRes['x_loghistory'],null,2)}</pre>}</div>}</div>`;

// 1. Add voice profile GET/DELETE before Voice Profile Load card
patch(
  `            {/* === Voice Profile Load === */}`,
  vpGetCard + `\n` + vpDelCard + `\n            {/* === Voice Profile Load === */}`
);

// 2. Add rank keyword DELETE before the GEO & LLM TAB (end of Site Crawl/Rank Tracker section)
patch(
  `Export CSV'}</button>\n              </div>\n            </div>\n          </>\n        )}\n\n        {/* GEO & LLM TAB */}`,
  `Export CSV'}</button>\n              </div>\n            </div>\n` + rankDelCard + `\n          </>\n        )}\n\n        {/* GEO & LLM TAB */}`
);

// 3. Add GSC summary + log history at the start of Trend Scout tab (after its opening tag)
patch(
  `{/* TREND SCOUT TAB */}\n        {tab === "Trend Scout" && (\n          <>\n            <div style={{ display:"flex", gap:8`,
  `{/* TREND SCOUT TAB */}\n        {tab === "Trend Scout" && (\n          <>\n` + gscCard + `\n` + logHistCard + `\n            <div style={{ display:"flex", gap:8`
);

const output = hasCRLF ? src.replace(/\n/g, '\r\n') : src;
fs.writeFileSync(FILE, output, 'utf8');
console.log('\n\u2705 5 remaining GET/DELETE route cards applied!');
console.log('File size:', Math.round(Buffer.byteLength(output, 'utf8') / 1024), 'KB');
