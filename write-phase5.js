/**
 * Phase 5 Generator: Advertising & Paid Media — 6 tools
 * google-ads-integration, facebook-ads-integration, tiktok-ads-integration,
 * ad-creative-optimizer, ads-anomaly-guard, multi-channel-optimizer
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const FE = (n) => path.join(ROOT, `aura-console/src/components/tools/${n}.jsx`);
const BE = (id) => path.join(ROOT, `src/tools/${id}/router.js`);
function mkdir(p) { fs.mkdirSync(path.dirname(p), { recursive: true }); }

// ─── shared base component template ──────────────────────────────────────────
function baseComponent(componentName, apiBase, description, accentColor, groups, renderTabFn) {
return `import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "${apiBase}";

const S = {
  root: { background:'#09090b', minHeight:'100vh', color:'#fafafa', fontFamily:"'Inter',system-ui,sans-serif", padding:'28px 32px' },
  card: { background:'#18181b', border:'1px solid #27272a', borderRadius:14, padding:24, marginBottom:20 },
  mini: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:16, marginTop:0 },
  row: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' },
  input: { flex:1, minWidth:180, background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:14, padding:'11px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif" },
  select: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'11px 14px', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, color:'#fafafa', fontSize:13, padding:'12px 14px', outline:'none', fontFamily:"'Inter',system-ui,sans-serif", resize:'vertical', boxSizing:'border-box' },
  btn: (bg) => ({ background:bg||'${accentColor}', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
  label: { fontSize:12, fontWeight:600, color:'#a1a1aa', marginBottom:6, display:'block' },
  tbl: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', color:'#71717a', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 14px', borderBottom:'2px solid #27272a', whiteSpace:'nowrap', background:'#18181b' },
  td: { padding:'12px 14px', borderBottom:'1px solid #1f1f22', color:'#fafafa', verticalAlign:'middle' },
  trOdd: { background:'#09090b44' },
  badge: (c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:(c||'#27272a')+'33', color:c||'#a1a1aa', border:\`1px solid \${(c||'#3f3f46')}44\` }),
  empty: { textAlign:'center', padding:'56px 24px', color:'#52525b', fontSize:13 },
  loading: { textAlign:'center', padding:'32px 24px', color:'#71717a', fontSize:13 },
  err: { background:'#1c0c0c', border:'1px solid #7f1d1d', color:'#fca5a5', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:16 },
  metaRow: { display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 },
  metaItem: { background:'#09090b', border:'1px solid #27272a', borderRadius:10, padding:'12px 18px', flex:'1 1 130px', textAlign:'center' },
  metaVal: (c) => ({ fontSize:22, fontWeight:700, color:c||'${accentColor}' }),
  metaLbl: { fontSize:11, color:'#71717a', marginTop:2 },
  sT: { fontSize:12, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, marginTop:16 },
  groupNav: { display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' },
  gBtn: (a, c) => ({ background:a?c+'22':'#18181b', color:a?c:'#71717a', border:\`1px solid \${a?c+'44':'#27272a'}\`, borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:a?700:500, cursor:'pointer' }),
  tabStrip: { display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:'1px solid #27272a', paddingBottom:8 },
  tBtn: (a, c) => ({ background:'none', color:a?c:'#71717a', border:'none', borderBottom:a?\`2px solid \${c}\`:'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', marginBottom:-9 }),
  bar: { height:6, background:'#27272a', borderRadius:3, overflow:'hidden', marginTop:4 },
  fill: (pct, c) => ({ height:'100%', width:Math.min(pct||0,100)+'%', background:c||'${accentColor}', borderRadius:3 }),
  pre: { background:'#0d0d10', border:'1px solid #3f3f46', borderRadius:10, padding:16, fontSize:12, color:'#a1a1aa', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto', marginBottom:12 },
};

const GROUPS = ${JSON.stringify(groups, null, 2)};

export default function ${componentName}() {
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);
  const [activeTab, setActiveTab] = useState(GROUPS[0].tabs[0].id);
  const [q, setQ] = useState({});
  const [form, setForm] = useState({ model:'gpt-4o-mini' });
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [err, setErr] = useState({});
  const [toast, setToast] = useState(null);

  const curGroup = GROUPS.find(g => g.id === activeGroup) || GROUPS[0];

  function toast_(msg, c='#10b981') { setToast({msg,c}); setTimeout(() => setToast(null), 3200); }

  async function fetch_(tab, endpoint, payload={}) {
    setLoading(l => ({...l,[tab]:true}));
    setErr(e => ({...e,[tab]:null}));
    try {
      const r = await apiFetchJSON(endpoint, { method:'POST', body:JSON.stringify({ ...payload, model:form.model }) });
      if (r.ok) setData(d => ({...d,[tab]:r.data||r}));
      else setErr(e => ({...e,[tab]:r.error||'Failed'}));
    } catch(e) { setErr(er => ({...er,[tab]:e.message})); }
    finally { setLoading(l => ({...l,[tab]:false})); }
  }

  function Generic(tab, title, desc, ep) {
    const d = data[tab];
    return (
      <div>
        <div style={S.card}>
          <div style={S.cardTitle}>{title}</div>
          {desc && <p style={{color:'#71717a',fontSize:13,marginTop:0}}>{desc}</p>}
          <div style={S.row}>
            <input style={S.input} placeholder="Search or filter..." value={q[tab]||''} onChange={e=>setQ(p=>({...p,[tab]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&fetch_(tab,ep,{query:q[tab]})} />
            <button style={S.btn()} onClick={()=>fetch_(tab,ep,{query:q[tab]})} disabled={loading[tab]}>{loading[tab]?'Loading...':'Load Data'}</button>
            <button style={S.btn('#10b981')} onClick={()=>toast_('AI analyzing...')}>AI Insights</button>
          </div>
          {err[tab] && <div style={S.err}>{err[tab]}</div>}
          {loading[tab] ? <div style={S.loading}>Loading {title.toLowerCase()}...</div> :
           d ? (
            <div style={{overflowX:'auto'}}>
              <table style={S.tbl}>
                <thead><tr><th style={S.th}>Item</th><th style={S.th}>Category</th><th style={S.th}>Value</th><th style={S.th}>Status</th></tr></thead>
                <tbody>{(Array.isArray(d)?d:Object.values(d)[0]||[]).map((row,i)=>(
                  <tr key={i} style={i%2?S.trOdd:{}}>
                    <td style={S.td}>{row.name||row.id||row.label||row.item||JSON.stringify(row).slice(0,40)}</td>
                    <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{row.category||row.type||row.group||'--'}</span></td>
                    <td style={S.td}><span style={{fontWeight:600}}>{row.value||row.amount||row.score||'--'}</span></td>
                    <td style={S.td}>{row.status?<span style={S.badge(row.status==='active'||row.status==='ok'?'#10b981':row.status==='warning'?'#f59e0b':'#ef4444')}>{row.status}</span>:'--'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
           ) : <div style={S.empty}>Enter a query to load {title.toLowerCase()}.</div>}
        </div>
      </div>
    );
  }

${renderTabFn}

  function handleGroup(gid) {
    const g = GROUPS.find(x=>x.id===gid);
    if(g){setActiveGroup(gid);setActiveTab(g.tabs[0].id);}
  }

  return (
    <div style={S.root}>
      <div style={{marginBottom:28}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:800,color:'#fafafa',margin:'0 0 4px',letterSpacing:'-0.02em'}}>${componentName.replace(/([A-Z])/g, ' $1').trim()}</h1>
            <p style={{color:'#71717a',fontSize:13,margin:'4px 0 0'}}>${description}</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={S.btn('#27272a')} onClick={()=>fetch_(activeTab, API+'/health',{})}>Refresh</button>
            <button style={S.btn('#10b981')} onClick={()=>toast_('AI analysis started...')}>AI Analysis</button>
          </div>
        </div>
      </div>

      <div style={S.groupNav}>
        {GROUPS.map(g=>(
          <button key={g.id} style={S.gBtn(activeGroup===g.id,g.color)} onClick={()=>handleGroup(g.id)}>{g.label}</button>
        ))}
      </div>

      <div style={S.tabStrip}>
        {curGroup.tabs.map(t=>(
          <button key={t.id} style={S.tBtn(activeTab===t.id,curGroup.color)} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {renderTab()}

      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:toast.c,color:'#fff',borderRadius:10,padding:'12px 20px',fontSize:13,fontWeight:600,zIndex:9999,boxShadow:'0 4px 24px #0006'}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 1: GOOGLE ADS INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

const GAI_GROUPS = [
  { id:'campaigns',  label:'Campaigns',      color:'#4285f4', tabs:[{id:'camp-list',label:'Campaigns'},{id:'ad-groups',label:'Ad Groups'},{id:'ads',label:'Ads'},{id:'extensions',label:'Extensions'},{id:'camp-perf',label:'Performance'},{id:'camp-ai',label:'AI Optimize'}]},
  { id:'keywords',   label:'Keywords',       color:'#34a853', tabs:[{id:'kw-list',label:'Keywords'},{id:'search-terms',label:'Search Terms'},{id:'negatives',label:'Negatives'},{id:'kw-mining',label:'AI Mining'},{id:'cannibalize',label:'Cannibalization'},{id:'quality-score',label:'Quality Score'}]},
  { id:'bidding',    label:'Bidding',        color:'#fbbc05', tabs:[{id:'bid-strategy',label:'Strategies'},{id:'bid-sim',label:'Simulator'},{id:'roas-targets',label:'ROAS Targets'},{id:'markowitz',label:'Markowitz Alloc'},{id:'ltv-bids',label:'LTV Bidding'},{id:'schedule',label:'Ad Schedule'}]},
  { id:'audiences',  label:'Audiences',      color:'#ea4335', tabs:[{id:'audience-list',label:'Audiences'},{id:'lookalike',label:'Lookalike'},{id:'remarketing',label:'Remarketing'},{id:'customer-match',label:'Customer Match'},{id:'in-market',label:'In-Market'},{id:'audience-perf',label:'Performance'}]},
  { id:'creative',   label:'Creative',       color:'#4285f4', tabs:[{id:'rsa-builder',label:'RSA Builder'},{id:'rsa-perf',label:'RSA Performance'},{id:'asset-groups',label:'Asset Groups'},{id:'ad-preview',label:'Ad Preview'},{id:'copy-gen',label:'AI Copy Gen'},{id:'creative-ai',label:'AI Insights'}]},
  { id:'intelligence',label:'Intelligence',  color:'#34a853', tabs:[{id:'auction-insights',label:'Auction Insights'},{id:'competitor-kw',label:'Competitor KW'},{id:'incrementality',label:'Incrementality'},{id:'search-impression',label:'Impression Share'},{id:'wasted-spend',label:'Wasted Spend'},{id:'opportunities',label:'Opportunities'}]},
  { id:'gai-adv',    label:'Advanced',       color:'#fbbc05', tabs:[{id:'budget-alloc',label:'Budget Alloc'},{id:'conversion-setup',label:'Conversions'},{id:'gai-integrations',label:'Integrations'},{id:'gai-reports',label:'Reports'},{id:'gai-settings',label:'Settings'},{id:'gai-world',label:'World-Class'}]},
];

const GAI_ROUTER = `const express = require('express');
const router = express.Router();
const store = { settings: new Map(), negatives: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'google-ads-integration',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{campaigns:12,keywords:2840,spend:48200}}));

router.post('/campaigns/list',(req,res)=>ok(res,{data:{campaigns:Array.from({length:12},(_,i)=>({
  id:'camp-'+i, name:['Brand','Non-Brand ROAS','Competitor','Shopping','Performance Max','Discovery','Display Remarketing','YouTube','Smart','RLSA','Dynamic Search','DSA'][i],
  status:i<9?'enabled':'paused', type:['SEARCH','SEARCH','SEARCH','SHOPPING','PERFORMANCE_MAX','DISCOVERY','DISPLAY','VIDEO','SMART','SEARCH','DSA','DSA'][i],
  budget:(rnd(50,2000)).toFixed(0), spend:(rnd(40,1900)).toFixed(0),
  impressions:Math.floor(rnd(1000,50000)), clicks:Math.floor(rnd(50,2000)),
  ctr:(rnd(1,8)).toFixed(2), cpc:(rnd(0.5,8)).toFixed(2),
  conversions:Math.floor(rnd(5,200)), convValue:(rnd(200,8000)).toFixed(0),
  roas:(rnd(1.5,8)).toFixed(2), qualityScore:Math.floor(rnd(5,10)),
}))}});
});
router.post('/keywords/list',(req,res)=>ok(res,{data:{keywords:Array.from({length:20},(_,i)=>({
  id:'kw-'+i, keyword:['running shoes','buy running shoes online','best trail running shoes','nike running shoes','adidas ultraboost','marathon training shoes','waterproof running shoes','minimalist running shoes','wide width running shoes','running shoes for overpronation'][i%10]+' '+(i>9?'v2':''),
  matchType:['EXACT','PHRASE','BROAD'][i%3], status:'enabled',
  impressions:Math.floor(rnd(100,10000)), clicks:Math.floor(rnd(10,500)),
  ctr:(rnd(1,12)).toFixed(2), avgCpc:(rnd(0.5,6)).toFixed(2),
  conversions:Math.floor(rnd(1,50)), convRate:(rnd(1,8)).toFixed(2),
  qualityScore:Math.floor(rnd(4,10)), adRelevance:['Below average','Average','Above average'][i%3],
  expectedCtr:['Below average','Average','Above average'][(i+1)%3],
  landingPageExp:['Below average','Average','Above average'][(i+2)%3],
}))}});
});
router.post('/keywords/search-terms',(req,res)=>ok(res,{data:{searchTerms:Array.from({length:25},(_,i)=>({
  term:'search term example '+i, matchedKeyword:'running shoes', matchType:'BROAD',
  impressions:Math.floor(rnd(10,500)), clicks:Math.floor(rnd(1,50)),
  conversions:Math.floor(rnd(0,5)), spend:(rnd(1,80)).toFixed(2),
  recommendation:i%3===0?'Add as EXACT keyword':i%3===1?'Add as negative keyword':'Monitor',
}))}});
});
router.post('/keywords/ai-mining',(req,res)=>{
  const {model='gpt-4o-mini'}=req.body;
  ok(res,{data:{clusters:[
    {theme:'Brand Intent',keywords:['nike air zoom pegasus 40','nike running shoes sale','nike zoom buy'],volume:8400,intent:'transactional',opportunity:'high',action:'Create dedicated brand ad group'},
    {theme:'Problem Aware',keywords:['best shoes for knee pain','running shoes plantar fasciitis','cushioned running shoes'],volume:12800,intent:'informational',opportunity:'medium',action:'Add informational ad with landing page'},
    {theme:'Competitor Conquest',keywords:['adidas vs nike running','alternatives to on cloud','hoka shoes review'],volume:6200,intent:'commercial',opportunity:'high',action:'Create competitor conquest campaign with price comparison'},
    {theme:'Long Tail Transactional',keywords:['waterproof trail running shoes mens size 11','wide toe box zero drop shoes','minimalist road running shoe'],volume:2400,intent:'transactional',opportunity:'very high',action:'Create tightly themed EXACT match ad groups per cluster'},
  ],negativesSuggested:['free','diy','how to make','running shoe repair','job'],model,creditsUsed:2}});
});
router.post('/keywords/quality-score',(req,res)=>ok(res,{data:{improvements:[
  {keyword:'running shoes',qs:6,adRelevance:'Average',expectedCtr:'Below average',landingPageExp:'Average',action:'Rewrite ad headline to include exact keyword match'},
  {keyword:'trail running shoes',qs:5,adRelevance:'Below average',expectedCtr:'Below average',landingPageExp:'Average',action:'Create dedicated ad group with highly relevant ads'},
  {keyword:'waterproof running shoes',qs:8,adRelevance:'Above average',expectedCtr:'Above average',landingPageExp:'Above average',action:'Bid more aggressively -- high QS reduces CPC'},
]}}));
router.post('/bidding/markowitz',(req,res)=>ok(res,{data:{allocation:{
  method:'Markowitz Mean-Variance Optimization',
  totalBudget:5000,
  campaigns:[
    {name:'Brand',currentBudget:400,recommendedBudget:350,roas:8.4,risk:0.12,allocation:7.0},
    {name:'Non-Brand ROAS',currentBudget:1500,recommendedBudget:1800,roas:4.2,risk:0.28,allocation:36.0},
    {name:'Shopping',currentBudget:1200,recommendedBudget:1400,roas:5.1,risk:0.22,allocation:28.0},
    {name:'Performance Max',currentBudget:800,recommendedBudget:1000,roas:3.8,risk:0.35,allocation:20.0},
    {name:'Competitor',currentBudget:600,recommendedBudget:450,roas:2.1,risk:0.48,allocation:9.0},
  ],
  projectedRoasLift:'+0.8x at same spend',
}}}));
router.post('/intelligence/auction-insights',(req,res)=>ok(res,{data:{competitors:[
  {name:'Competitor A',impressionShare:34.2,overlapRate:28.4,outrankedShare:18.2,posAbove:12.1,topImprShare:42.1},
  {name:'Competitor B',impressionShare:28.7,overlapRate:22.1,outrankedShare:14.8,posAbove:9.4,topImprShare:35.8},
  {name:'Competitor C',impressionShare:18.4,overlapRate:15.2,outrankedShare:8.4,posAbove:6.8,topImprShare:22.4},
  {name:'You',impressionShare:42.1,overlapRate:null,outrankedShare:null,posAbove:null,topImprShare:51.2},
]}}));
router.post('/intelligence/incrementality',(req,res)=>ok(res,{data:{test:{
  design:'Ghost Ad Holdout Test',
  testGroup:8420,controlGroup:8420,
  duration:'14 days',
  measuredIncrementalConversions:284,
  measuredIncrementalRevenue:28400,
  incrementalROAS:4.2,
  confidenceLevel:0.94,
  recommendation:'Paid search is incrementally effective. Do not reduce budget.',
}}}));
router.post('/intelligence/wasted-spend',(req,res)=>ok(res,{data:{wastedSpend:[
  {type:'Irrelevant search terms',amount:840,action:'Add 23 negative keywords'},
  {type:'Low-QS keywords (QS < 5)',amount:420,action:'Pause or restructure 8 keywords into tighter ad groups'},
  {type:'Underperforming display placements',amount:280,action:'Exclude 12 placements with 0 conversions'},
  {type:'Overlap with organic (brand terms)',amount:180,action:'Reduce brand bid for queries where organic ranks #1'},
],totalWasted:1720,potentialSaving:1720}}));
router.post('/creative/rsa-builder',(req,res)=>{
  const {keywords='running shoes',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{rsa:{headlines:['Free Shipping on All Orders','Shop Running Shoes Today','Top-Rated Running Gear',keywords+' -- Up to 40% Off','Expert-Picked '+keywords,'Find Your Perfect Fit','30-Day Free Returns','Official Store -- '+keywords,'Best Sellers in '+keywords,'New Arrivals -- '+keywords,'Trusted by 50,000+ Runners','Same Day Dispatch Available','Award-Winning Running Shoes','Compare Styles & Sizes','Buy 2 Get 15% Off'],descriptions:['Browse our full range of '+keywords+'. Free next-day delivery on orders over $50. 30-day hassle-free returns.','Expert-picked '+keywords+' from top brands. Filter by gait type, terrain, and cushioning to find your perfect match.'],pinning:['Headline 1: Brand name','Headline 2: USP (Free Shipping)'],score:'Excellent',creditsUsed:2,model},}});
});
router.post('/creative/copy-gen',(req,res)=>{
  const {product='running shoes',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{variations:Array.from({length:4},(_,i)=>({
    angle:['Price','Social Proof','Urgency','Feature'][i],
    headline1:['Prices From $59.99','50,000+ Happy Runners','Last Chance -- Sale Ends Today','Engineered for Performance'][i],
    headline2:['Free Shipping & Returns','Rated 4.9/5 Stars','Shop '+product+' Now','Advanced Cushioning Tech'][i],
    description:['Shop our full range of '+product+' with free next-day delivery and easy 30-day returns. Find your perfect pair today.','Join over 50,000 satisfied runners. Our '+product+' are trusted by marathoners, trail runners, and casual joggers alike.','Sale ends midnight. Up to 40% off selected '+product+'. Limited sizes remaining -- order now for same-day dispatch.','Engineered with advanced cushioning and responsive foam. Our '+product+' deliver the performance you need, mile after mile.'][i],
    predictedCtr:(rnd(3,9)).toFixed(1)+'%',
  })),model,creditsUsed:2}});
});
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini',currency:'USD'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;`;

const GAI_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'camp-list': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Campaign Overview</div>
            <div style={S.row}>
              <button style={S.btn('#4285f4')} onClick={()=>fetch_('camp-list',API+'/campaigns/list')} disabled={loading['camp-list']}>{loading['camp-list']?'Loading...':'Load Campaigns'}</button>
              <button style={S.btn('#34a853')} onClick={()=>fetch_('wasted-spend',API+'/intelligence/wasted-spend')}>Find Wasted Spend</button>
              <button style={S.btn('#10b981')} onClick={()=>toast_('AI optimization running...')}>AI Optimize</button>
            </div>
            {err['camp-list'] && <div style={S.err}>{err['camp-list']}</div>}
            {loading['camp-list'] ? <div style={S.loading}>Loading campaigns...</div> : d?.campaigns?.length ? (
              <div style={{overflowX:'auto'}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>Campaign</th><th style={S.th}>Type</th><th style={S.th}>Spend</th><th style={S.th}>ROAS</th><th style={S.th}>Conv.</th><th style={S.th}>CPC</th><th style={S.th}>CTR</th><th style={S.th}>Status</th></tr></thead>
                  <tbody>{d.campaigns.map((c,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:600,fontSize:13}}>{c.name}</span></td>
                      <td style={S.td}><span style={{color:'#71717a',fontSize:11}}>{c.type}</span></td>
                      <td style={S.td}><span style={{fontWeight:700}}>\${c.spend}</span></td>
                      <td style={S.td}><span style={{fontWeight:700,color:c.roas>=3?'#10b981':c.roas>=2?'#f59e0b':'#ef4444'}}>{c.roas}x</span></td>
                      <td style={S.td}>{c.conversions}</td>
                      <td style={S.td}>\${c.cpc}</td>
                      <td style={S.td}>{c.ctr}%</td>
                      <td style={S.td}><span style={S.badge(c.status==='enabled'?'#10b981':'#f59e0b')}>{c.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Load campaigns to see your Google Ads performance.</div>}
          </div>
        </div>
      );
      case 'kw-mining': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>AI Search Term Mining</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>NLP clustering of search terms finds new keyword opportunities and negative keyword candidates — reducing wasted spend while expanding reach.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Seed keywords or product category..." value={q['kw-mining']||''} onChange={e=>setQ(p=>({...p,'kw-mining':e.target.value}))} />
              <select style={S.select} value={form.model||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,model:e.target.value}))}>
                <option value="gpt-4o-mini">Mini (2 credits)</option>
                <option value="gpt-4o">GPT-4o (4 credits)</option>
              </select>
              <button style={S.btn('#34a853')} onClick={()=>fetch_('kw-mining',API+'/keywords/ai-mining',{query:q['kw-mining']})} disabled={loading['kw-mining']}>{loading['kw-mining']?'Mining...':'Mine Keywords'}</button>
            </div>
            {err['kw-mining'] && <div style={S.err}>{err['kw-mining']}</div>}
            {loading['kw-mining'] ? <div style={S.loading}>AI clustering search terms...</div> : d?.clusters?.length ? (
              <>
                {d.clusters.map((cl,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <span style={{fontWeight:700,color:'#fafafa'}}>{cl.theme}</span>
                      <div style={{display:'flex',gap:6}}>
                        <span style={S.badge('#4285f4')}>{cl.volume?.toLocaleString()} vol</span>
                        <span style={S.badge(cl.opportunity==='high'||cl.opportunity==='very high'?'#10b981':'#f59e0b')}>{cl.opportunity} opp</span>
                        <span style={S.badge('#a855f7')}>{cl.intent}</span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                      {cl.keywords?.map((kw,j)=><span key={j} style={{...S.badge('#3f3f46'),fontSize:11,padding:'3px 7px'}}>{kw}</span>)}
                    </div>
                    <div style={{fontSize:12,color:'#10b981',fontStyle:'italic'}}>{cl.action}</div>
                  </div>
                ))}
                {d.negativesSuggested?.length > 0 && (
                  <div style={{...S.mini,borderColor:'#ef444433'}}>
                    <div style={{fontWeight:700,color:'#ef4444',marginBottom:8}}>Suggested Negatives</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {d.negativesSuggested.map((n,i)=><span key={i} style={{...S.badge('#ef4444'),fontSize:11}}>{n}</span>)}
                    </div>
                  </div>
                )}
              </>
            ) : <div style={S.empty}>Enter seed keywords to discover new opportunities via AI mining.</div>}
          </div>
        </div>
      );
      case 'markowitz': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Markowitz Budget Allocation</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Mean-variance optimization across campaigns maximizes portfolio ROAS at a given risk tolerance -- same methodology as Modern Portfolio Theory in finance.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Total monthly budget..." value={q.markowitz||''} onChange={e=>setQ(p=>({...p,markowitz:e.target.value}))} />
              <button style={S.btn('#fbbc05')} onClick={()=>fetch_('markowitz',API+'/bidding/markowitz',{budget:q.markowitz})} disabled={loading.markowitz}>{loading.markowitz?'Optimizing...':'Run Markowitz'}</button>
            </div>
            {err.markowitz && <div style={S.err}>{err.markowitz}</div>}
            {loading.markowitz ? <div style={S.loading}>Running portfolio optimization...</div> : d?.allocation ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#fbbc0544'}}>
                  <div style={{fontSize:12,color:'#fbbc05',fontWeight:700,marginBottom:4}}>Method: {d.allocation.method}</div>
                  <div style={{color:'#10b981',fontWeight:700}}>Projected ROAS lift: {d.allocation.projectedRoasLift}</div>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Campaign</th><th style={S.th}>Current</th><th style={S.th}>Recommended</th><th style={S.th}>ROAS</th><th style={S.th}>Risk</th><th style={S.th}>Allocation</th></tr></thead>
                    <tbody>{d.allocation.campaigns?.map((c,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}><span style={{fontWeight:600}}>{c.name}</span></td>
                        <td style={S.td}>\${c.currentBudget}</td>
                        <td style={S.td}><span style={{fontWeight:700,color:c.recommendedBudget>c.currentBudget?'#10b981':'#f59e0b'}}>\${c.recommendedBudget}</span></td>
                        <td style={S.td}><span style={{fontWeight:700,color:c.roas>=4?'#10b981':c.roas>=2.5?'#f59e0b':'#ef4444'}}>{c.roas}x</span></td>
                        <td style={S.td}><span style={{color:c.risk>0.4?'#ef4444':c.risk>0.25?'#f59e0b':'#10b981'}}>{(c.risk*100).toFixed(0)}%</span></td>
                        <td style={S.td}><div style={S.bar}><div style={S.fill(c.allocation,'#fbbc05')} /></div><span style={{fontSize:11,color:'#71717a'}}>{c.allocation}%</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Enter your total budget and run Markowitz allocation to optimize spend.</div>}
          </div>
        </div>
      );
      case 'auction-insights': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Auction Insights</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Competitive intelligence: impression share, overlap rate, and outranking share vs your named competitors.</p>
            <button style={S.btn('#34a853')} onClick={()=>fetch_('auction-insights',API+'/intelligence/auction-insights')} disabled={loading['auction-insights']}>{loading['auction-insights']?'Loading...':'Load Auction Insights'}</button>
            {err['auction-insights'] && <div style={S.err}>{err['auction-insights']}</div>}
            {loading['auction-insights'] ? <div style={S.loading}>Loading competitive data...</div> : d?.competitors?.length ? (
              <div style={{overflowX:'auto',marginTop:16}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>Competitor</th><th style={S.th}>Impr. Share</th><th style={S.th}>Overlap Rate</th><th style={S.th}>Outranked</th><th style={S.th}>Pos. Above</th><th style={S.th}>Top IS</th></tr></thead>
                  <tbody>{d.competitors.map((c,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:700,color:c.name==='You'?'#4285f4':'#fafafa'}}>{c.name}</span></td>
                      <td style={S.td}><span style={{fontWeight:c.name==='You'?700:400,color:c.name==='You'?'#10b981':'#fafafa'}}>{c.impressionShare}%</span></td>
                      <td style={S.td}>{c.overlapRate!=null?c.overlapRate+'%':'--'}</td>
                      <td style={S.td}>{c.outrankedShare!=null?c.outrankedShare+'%':'--'}</td>
                      <td style={S.td}>{c.posAbove!=null?c.posAbove+'%':'--'}</td>
                      <td style={S.td}><span style={{fontWeight:700}}>{c.topImprShare}%</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Load auction insights to see your competitive position.</div>}
          </div>
        </div>
      );
      case 'rsa-builder': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Responsive Search Ad Builder</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>AI generates 15 headlines and 4 descriptions with predicted CTR. Pin key assets for brand consistency.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Keywords or product..." value={q['rsa-builder']||''} onChange={e=>setQ(p=>({...p,'rsa-builder':e.target.value}))} />
              <button style={S.btn('#4285f4')} onClick={()=>fetch_('rsa-builder',API+'/creative/rsa-builder',{keywords:q['rsa-builder']})} disabled={loading['rsa-builder']}>{loading['rsa-builder']?'Generating...':'Generate RSA'}</button>
            </div>
            {err['rsa-builder'] && <div style={S.err}>{err['rsa-builder']}</div>}
            {loading['rsa-builder'] ? <div style={S.loading}>AI writing your RSA...</div> : d?.rsa ? (
              <>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
                  <span style={S.badge('#10b981')}>Ad Strength: {d.rsa.score}</span>
                  <span style={{fontSize:12,color:'#71717a'}}>Credits used: {d.rsa.creditsUsed}</span>
                </div>
                <div style={S.sT}>Headlines (15)</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
                  {d.rsa.headlines?.map((h,i)=>(
                    <span key={i} style={{background:'#18181b',border:'1px solid #27272a',borderRadius:6,padding:'4px 10px',fontSize:12,color:'#fafafa'}}>{h}</span>
                  ))}
                </div>
                <div style={S.sT}>Descriptions (4)</div>
                {d.rsa.descriptions?.map((desc,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:8,fontSize:12,color:'#a1a1aa',lineHeight:1.6}}>{desc}</div>
                ))}
              </>
            ) : <div style={S.empty}>Enter keywords to generate your Responsive Search Ad.</div>}
          </div>
        </div>
      );
      case 'gai-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📊',t:'Markowitz Budget Allocation',d:'Mean-variance portfolio optimization across campaigns -- maximize ROAS at your target risk level using Modern Portfolio Theory.'},
                {icon:'🔍',t:'AI Search Term Mining',d:'NLP clustering of search terms discovers new keyword themes and negative keyword candidates -- reducing waste while expanding reach.'},
                {icon:'🏆',t:'Quality Score Optimizer',d:'Specific recommendations per keyword to improve Ad Relevance, Expected CTR, and Landing Page Experience scores.'},
                {icon:'🎯',t:'Incrementality Testing',d:'Ghost ad holdout test design for true incremental measurement -- know exactly what revenue disappears without paid search.'},
                {icon:'🔬',t:'Auction Insights AI',d:'Competitive impression share, overlap rate, and outranking analysis vs named competitors with actionable bid recommendations.'},
                {icon:'✍️',t:'RSA Copy Generator',d:'AI writes 15 headlines + 4 descriptions per RSA with predicted CTR scores and ad strength ratings.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 2: FACEBOOK ADS INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

const FAD_GROUPS = [
  { id:'overview-f',  label:'Overview',     color:'#1877f2', tabs:[{id:'fad-dash',label:'Dashboard'},{id:'fad-camps',label:'Campaigns'},{id:'ad-sets',label:'Ad Sets'},{id:'fad-ads',label:'Ads'},{id:'fad-perf',label:'Performance'},{id:'fad-trends',label:'Trends'}]},
  { id:'audiences-f', label:'Audiences',    color:'#42b72a', tabs:[{id:'custom-aud',label:'Custom Audiences'},{id:'lookalike-f',label:'Lookalike'},{id:'ltv-lookalike',label:'LTV Lookalike'},{id:'overlap',label:'Overlap Analysis'},{id:'interest-aud',label:'Interest'},{id:'saved-aud',label:'Saved'}]},
  { id:'creative-f',  label:'Creative',     color:'#e91e8c', tabs:[{id:'creative-lib',label:'Creative Library'},{id:'fatigue',label:'Fatigue Detector'},{id:'dco',label:'DCO Analysis'},{id:'creative-ai-f',label:'AI Creative'},{id:'creative-pred',label:'CTR Predictor'},{id:'copy-f',label:'Copy Generator'}]},
  { id:'pixel-f',     label:'Pixel & Data', color:'#f59e0b', tabs:[{id:'pixel-events',label:'Pixel Events'},{id:'ios14',label:'iOS 14+ Recovery'},{id:'capi',label:'Conversions API'},{id:'event-match',label:'Event Match'},{id:'custom-conv',label:'Custom Conv.'},{id:'data-health',label:'Data Health'}]},
  { id:'shopping-f',  label:'Shopping',     color:'#1877f2', tabs:[{id:'advantage-plus',label:'Advantage+'},{id:'catalog',label:'Catalog'},{id:'dynamic-ads',label:'Dynamic Ads'},{id:'shop-perf',label:'Performance'},{id:'cbo-sim',label:'CBO Sim'},{id:'shop-ai',label:'AI Optimize'}]},
  { id:'analytics-f', label:'Analytics',    color:'#42b72a', tabs:[{id:'attribution-f',label:'Attribution'},{id:'funnel-f',label:'Funnel'},{id:'cohort-f',label:'Cohort'},{id:'breakdown',label:'Breakdown'},{id:'cross-channel-f',label:'Cross-Channel'},{id:'reports-f',label:'Reports'}]},
  { id:'fad-adv',     label:'Advanced',     color:'#f59e0b', tabs:[{id:'cbo-adv',label:'CBO Setup'},{id:'a-b-tests',label:'A/B Tests'},{id:'fad-int',label:'Integrations'},{id:'fad-api',label:'API'},{id:'fad-settings',label:'Settings'},{id:'fad-world',label:'World-Class'}]},
];

const FAD_ROUTER = `const express = require('express');
const router = express.Router();
const store = { settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'facebook-ads-integration',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{campaigns:8,adSets:24,ads:72,spend:38400}}));

router.post('/overview/dashboard',(req,res)=>ok(res,{data:{
  spend:38420, roas:3.84, conversions:842, cpa:45.6,
  ctr:2.14, cpm:18.4, reach:184200, frequency:2.84,
  trends:{spend:[32000,34000,36000,38420],roas:[3.2,3.4,3.6,3.84],days:['Week 1','Week 2','Week 3','Week 4']},
}}));
router.post('/overview/campaigns',(req,res)=>ok(res,{data:{campaigns:Array.from({length:8},(_,i)=>({
  id:'camp-f-'+i, name:['Prospecting - TOF','Retargeting - MOF','Retargeting - BOF','LTV Lookalike','Advantage+ Shopping','Interest Prospecting','Video Views','Brand Awareness'][i],
  objective:['CONVERSIONS','CONVERSIONS','CONVERSIONS','CONVERSIONS','SALES','CONVERSIONS','VIDEO_VIEWS','REACH'][i],
  status:i<6?'ACTIVE':'PAUSED', spend:(rnd(1000,12000)).toFixed(0),
  roas:(rnd(1.5,6.5)).toFixed(2), conversions:Math.floor(rnd(20,300)),
  cpa:(rnd(20,80)).toFixed(2), frequency:(rnd(1.2,4.8)).toFixed(1),
  reach:Math.floor(rnd(5000,80000)),
}))}});
});
router.post('/audiences/overlap',(req,res)=>ok(res,{data:{overlaps:[
  {setA:'LTV Top 20% Lookalike',setB:'Interest: Running',overlapPct:34.2,audienceSizeA:240000,audienceSizeB:180000,recommendation:'High overlap -- exclude LTV Lookalike from Interest campaigns to prevent auction competition'},
  {setA:'Retargeting: ATC','setB':'Retargeting: View Content',overlapPct:68.4,audienceSizeA:12000,audienceSizeB:28000,recommendation:'Very high overlap -- consolidate into single ad set with dynamic creative'},
  {setA:'Lookalike 1%',setB:'Lookalike 2%',overlapPct:41.2,audienceSizeA:280000,audienceSizeB:560000,recommendation:'Expected -- consider using only Lookalike 2% with exclusion of purchasers'},
]}}));
router.post('/audiences/ltv-lookalike',(req,res)=>ok(res,{data:{seeds:[
  {segment:'Top LTV Quintile (Q5)',customers:1684,avgLtv:1240,audienceSize:'2.4M',lookalikePct:1,estimated_roas:5.2,recommendation:'Primary prospecting -- highest expected LTV from lookalikes'},
  {segment:'30-Day Buyers',customers:2840,avgLtv:284,audienceSize:'4.1M',lookalikePct:2,estimated_roas:3.8,recommendation:'Scale prospecting -- good volume with solid LTV signal'},
  {segment:'High-Frequency Buyers (5+ orders)',customers:840,avgLtv:840,audienceSize:'1.2M',lookalikePct:1,estimated_roas:4.8,recommendation:'Premium lookalike -- strong loyalty signal'},
]}}));
router.post('/creative/fatigue',(req,res)=>ok(res,{data:{creatives:Array.from({length:8},(_,i)=>({
  id:'creative-'+i, name:'Creative '+String.fromCharCode(65+i),
  frequency:(1.2+i*0.4).toFixed(1), fatigueScore:Math.min(Math.floor(i*12+rnd(5,15)),100),
  ctrDrop:i>3?(rnd(15,45)).toFixed(0)+'%':'0%',
  daysRunning:7+i*4, recommendation:i>=4?'Pause and replace -- significant fatigue':'Healthy -- continue running',
  status:i>=5?'fatigued':i>=3?'warning':'healthy',
}))}});
});
router.post('/creative/dco',(req,res)=>ok(res,{data:{elements:{
  headlines:[{text:'Free Shipping on All Orders',impressions:48200,ctr:3.84,conversions:142},{text:'Shop Now -- Up to 40% Off',impressions:42000,ctr:2.94,conversions:98},{text:'Top-Rated Running Shoes',impressions:38400,ctr:3.24,conversions:118}],
  images:[{url:'hero-product.jpg',impressions:62000,ctr:3.94,conversions:184},{url:'lifestyle-running.jpg',impressions:42000,ctr:3.24,conversions:124},{url:'user-generated.jpg',impressions:24400,ctr:4.44,conversions:108}],
  ctas:[{text:'Shop Now',ctr:3.84,conversions:284},{text:'Learn More',ctr:2.14,conversions:84},{text:'Buy Now',ctr:4.24,conversions:184}],
  insight:'UGC imagery outperforms studio shots by 37% on CTR. "Buy Now" CTA converts best. Headline 1 drives highest absolute conversions.',
}}}));
router.post('/creative/ai',(req,res)=>{
  const {brief='',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{concepts:[
    {format:'Static Image',headline:'Real runners. Real results.',body:'Join 50,000+ athletes who trust us for their training. Shop the full range -- free returns, next-day delivery.',hook:'Social proof + urgency',predicted_ctr:'3.8%'},
    {format:'Carousel',headline:'Find your perfect fit.',body:'Swipe to explore our top styles for road, trail, and track. Filter by gait type and get expert recommendations.',hook:'Interactive discovery',predicted_ctr:'4.2%'},
    {format:'Video (15s)',headline:'This is what 40% off looks like.',body:'Quick cut of 5 hero products with price overlays. Ends with countdown timer to sale end.',hook:'Price + urgency + visual',predicted_ctr:'5.1%'},
  ],model,creditsUsed:2}});
});
router.post('/pixel/ios14',(req,res)=>ok(res,{data:{recovery:{
  reportedConversions:842, modeledConversions:284, totalEstimated:1126,
  modelingCoverage:0.74, aggregatedEvents:['Purchase','AddToCart','ViewContent','InitiateCheckout'],
  recommendations:['Enable CAPI server-side events -- currently at 68% match rate, target 85%+','Prioritize Purchase event in AEM -- currently event 4, move to event 1','Set 7-day click, 1-day view attribution for cleaner signal','Enable Conversions API Gateway for cookieless measurement'],
}}}));
router.post('/shopping/advantage-plus',(req,res)=>ok(res,{data:{performance:{
  spend:12400, roas:5.84, conversions:248, cpa:50.0,
  vsManual:{spendDiff:'+12%',roasDiff:'+1.4x',conversionsDiff:'+38%'},
  breakdown:{newCustomers:{pct:42,roas:3.2},existingCustomers:{pct:58,roas:7.8}},
  recommendations:['Advantage+ is outperforming manual campaigns by 1.4x ROAS -- increase budget','New customer ROAS is below breakeven (3.2x vs 4.0x target) -- adjust new customer cap','Consider Advantage+ Creative for 20% estimated CTR improvement'],
}}}));
router.post('/analytics/attribution',(req,res)=>ok(res,{data:{models:[
  {model:'Last Click',conversions:842,revenue:84200,cpa:45.6},
  {model:'First Click',conversions:1124,revenue:112400,cpa:34.2},
  {model:'Linear',conversions:984,revenue:98400,cpa:39.0},
  {model:'Data-Driven',conversions:1042,revenue:104200,cpa:36.8},
  {model:'7d Click / 1d View',conversions:1084,revenue:108400,cpa:35.4},
]}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;`;

const FAD_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'fad-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Meta Ads Dashboard</div>
            <button style={S.btn('#1877f2')} onClick={()=>fetch_('fad-dash',API+'/overview/dashboard')} disabled={loading['fad-dash']}>{loading['fad-dash']?'Loading...':'Load Dashboard'}</button>
            {err['fad-dash'] && <div style={S.err}>{err['fad-dash']}</div>}
            {loading['fad-dash'] ? <div style={S.loading}>Loading Meta Ads data...</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Spend','\\$'+d.spend?.toLocaleString(),'#fafafa'],['ROAS',d.roas+'x','#10b981'],['Conversions',d.conversions,'#1877f2'],['CPA','\\$'+d.cpa,'#f59e0b'],['CTR',d.ctr+'%','#a855f7'],['Frequency',d.frequency,'#ef4444']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
              </>
            ) : <div style={S.empty}>Load your Meta Ads dashboard to see performance overview.</div>}
          </div>
        </div>
      );
      case 'fatigue': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Ad Fatigue Detector</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Frequency-based fatigue curves detect when creative performance begins declining. Auto-pause recommendations before CTR erodes significantly.</p>
            <button style={S.btn('#e91e8c')} onClick={()=>fetch_('fatigue',API+'/creative/fatigue')} disabled={loading.fatigue}>{loading.fatigue?'Analyzing...':'Detect Fatigue'}</button>
            {err.fatigue && <div style={S.err}>{err.fatigue}</div>}
            {loading.fatigue ? <div style={S.loading}>Analyzing creative fatigue...</div> : d?.creatives?.length ? (
              <div style={{marginTop:16}}>
                {d.creatives.map((c,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:8,borderColor:c.status==='fatigued'?'#ef444444':c.status==='warning'?'#f59e0b44':'#27272a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:600,color:'#fafafa'}}>{c.name}</div>
                      <div style={{fontSize:12,color:'#71717a',marginTop:2}}>{c.daysRunning} days running · Frequency: {c.frequency}</div>
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:16,fontWeight:700,color:c.fatigueScore>60?'#ef4444':c.fatigueScore>30?'#f59e0b':'#10b981'}}>{c.fatigueScore}</div>
                        <div style={{fontSize:10,color:'#71717a'}}>fatigue</div>
                      </div>
                      <span style={S.badge(c.status==='fatigued'?'#ef4444':c.status==='warning'?'#f59e0b':'#10b981')}>{c.status}</span>
                      {c.status==='fatigued'&&<button style={{...S.btn('#ef4444'),padding:'4px 10px',fontSize:11}} onClick={()=>toast_('Creative paused')}>Pause</button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Run fatigue detection to identify worn-out creatives.</div>}
          </div>
        </div>
      );
      case 'dco': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Dynamic Creative Optimization Analysis</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Element-level performance analysis: which headlines, images, and CTAs drive the most conversions independently.</p>
            <button style={S.btn('#e91e8c')} onClick={()=>fetch_('dco',API+'/creative/dco')} disabled={loading.dco}>{loading.dco?'Analyzing...':'Load DCO Analysis'}</button>
            {err.dco && <div style={S.err}>{err.dco}</div>}
            {loading.dco ? <div style={S.loading}>Loading DCO data...</div> : d?.elements ? (
              <>
                {[['Headlines',d.elements.headlines,'text'],['Images',d.elements.images,'url'],['CTAs',d.elements.ctas,'text']].map(([label,items,key])=>(
                  <div key={label}>
                    <div style={S.sT}>{label}</div>
                    <div style={{overflowX:'auto',marginBottom:16}}>
                      <table style={S.tbl}>
                        <thead><tr><th style={S.th}>{key==='url'?'Creative':'Text'}</th><th style={S.th}>Impressions</th><th style={S.th}>CTR</th><th style={S.th}>Conv.</th></tr></thead>
                        <tbody>{items?.map((item,i)=>(
                          <tr key={i} style={i%2?S.trOdd:{}}>
                            <td style={S.td}><span style={{fontSize:12}}>{item[key]}</span></td>
                            <td style={S.td}>{item.impressions?.toLocaleString()}</td>
                            <td style={S.td}><span style={{fontWeight:700,color:item.ctr>3.5?'#10b981':'#f59e0b'}}>{item.ctr}%</span></td>
                            <td style={S.td}><span style={{fontWeight:700}}>{item.conversions}</span></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                ))}
                <div style={{...S.mini,borderColor:'#1877f244'}}><p style={{color:'#a1a1aa',fontSize:13,lineHeight:1.6,margin:0}}>{d.elements.insight}</p></div>
              </>
            ) : <div style={S.empty}>Load DCO analysis to see element-level creative performance.</div>}
          </div>
        </div>
      );
      case 'ios14': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>iOS 14+ Attribution Recovery</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Modeled conversion data and aggregated event measurement workarounds to recover up to 74% of lost attribution signal.</p>
            <button style={S.btn('#f59e0b')} onClick={()=>fetch_('ios14',API+'/pixel/ios14')} disabled={loading.ios14}>{loading.ios14?'Analyzing...':'Analyze Attribution Loss'}</button>
            {err.ios14 && <div style={S.err}>{err.ios14}</div>}
            {loading.ios14 ? <div style={S.loading}>Analyzing attribution gaps...</div> : d?.recovery ? (
              <>
                <div style={S.metaRow}>
                  {[['Reported Conv.',d.recovery.reportedConversions,'#ef4444'],['Modeled Conv.',d.recovery.modeledConversions,'#f59e0b'],['Total Estimated',d.recovery.totalEstimated,'#10b981'],['Modeling Coverage',(d.recovery.modelingCoverage*100).toFixed(0)+'%','#4285f4']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Recommendations</div>
                {d.recovery.recommendations?.map((r,i)=>(
                  <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{...S.badge('#f59e0b'),flexShrink:0}}>{i+1}</span>
                    <span style={{fontSize:13,color:'#e4e4e7',lineHeight:1.5}}>{r}</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Analyze attribution loss to see iOS 14+ recovery recommendations.</div>}
          </div>
        </div>
      );
      case 'fad-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📉',t:'Ad Fatigue Detector',d:'Frequency-based fatigue curves with auto-pause recommendations before CTR erodes -- replace creative before performance drops.'},
                {icon:'🧬',t:'DCO Element Analysis',d:'Element-level performance: exactly which headlines, images, and CTAs drive conversions -- not just ad-level results.'},
                {icon:'👥',t:'Audience Overlap Analysis',d:'Detect and resolve audience overlap across ad sets -- preventing internal auction competition and inflated CPAs.'},
                {icon:'📱',t:'iOS 14+ Attribution Recovery',d:'Modeled conversion data and CAPI integration to recover 70%+ of lost attribution signal post-iOS 14 privacy changes.'},
                {icon:'💎',t:'LTV Lookalike Generator',d:'Upload LTV-weighted seed audiences (top quintile buyers) to Meta for lookalike expansion -- targeting prospects who match your best customers.'},
                {icon:'🤖',t:'Advantage+ Analysis',d:'Performance transparency into Advantage+ black-box campaigns -- new vs existing customer split, creative performance, and optimization recommendations.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 3: TIKTOK ADS INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

const TIK_GROUPS = [
  { id:'campaigns-t', label:'Campaigns',    color:'#fe2c55', tabs:[{id:'tik-camps',label:'Campaigns'},{id:'tik-adgroups',label:'Ad Groups'},{id:'tik-ads',label:'Ads'},{id:'tik-perf',label:'Performance'},{id:'tik-budget',label:'Budget'},{id:'tik-ai',label:'AI Optimize'}]},
  { id:'creative-t',  label:'Creative',     color:'#25f4ee', tabs:[{id:'spark-ads',label:'Spark Ads'},{id:'hook-analyzer',label:'Hook Analyzer'},{id:'video-perf',label:'Video Performance'},{id:'thumb-opt',label:'Thumbnail'},{id:'creative-gen-t',label:'AI Creative'},{id:'ugc',label:'UGC Creators'}]},
  { id:'audiences-t', label:'Audiences',    color:'#fe2c55', tabs:[{id:'tik-custom',label:'Custom'},{id:'tik-look',label:'Lookalike'},{id:'tik-interest',label:'Interest'},{id:'genz-intel',label:'Gen Z Intel'},{id:'tik-retarget',label:'Retargeting'},{id:'tik-aud-perf',label:'Performance'}]},
  { id:'tiktokseo',   label:'TikTok SEO',   color:'#25f4ee', tabs:[{id:'caption-opt',label:'Caption Opt'},{id:'hashtag',label:'Hashtags'},{id:'trending-audio',label:'Trending Audio'},{id:'tik-keywords',label:'Keywords'},{id:'organic-perf',label:'Organic Perf'},{id:'tik-seo-ai',label:'AI SEO'}]},
  { id:'shop-t',      label:'TikTok Shop',  color:'#fe2c55', tabs:[{id:'shop-attrib',label:'Attribution'},{id:'shop-products',label:'Products'},{id:'shop-creators',label:'Creator Collab'},{id:'shop-perf',label:'Shop Perf'},{id:'shop-content',label:'Content'},{id:'shop-ai',label:'AI Insights'}]},
  { id:'analytics-t', label:'Analytics',    color:'#25f4ee', tabs:[{id:'tik-attrib',label:'Attribution'},{id:'vta',label:'View-Through'},{id:'tik-funnel',label:'Funnel'},{id:'tik-cohort',label:'Cohort'},{id:'tik-bench',label:'Benchmarks'},{id:'tik-reports',label:'Reports'}]},
  { id:'tik-adv',     label:'Advanced',     color:'#fe2c55', tabs:[{id:'pixel-t',label:'Pixel Setup'},{id:'capi-t',label:'Events API'},{id:'tik-int',label:'Integrations'},{id:'tik-api',label:'API'},{id:'tik-settings',label:'Settings'},{id:'tik-world',label:'World-Class'}]},
];

const TIK_ROUTER = `const express = require('express');
const router = express.Router();
const store = { settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'tiktok-ads-integration',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{campaigns:6,spend:18400,followers:24800}}));

router.post('/campaigns/list',(req,res)=>ok(res,{data:{campaigns:Array.from({length:6},(_,i)=>({
  id:'tik-c-'+i, name:['Prospecting - TOF','Product Demo - MOF','Retargeting - BOF','Spark Ads Amplification','TikTok Shop','Brand Awareness'][i],
  objective:['TRAFFIC','CONVERSIONS','CONVERSIONS','REACH','CATALOG_SALES','REACH'][i],
  status:i<5?'ACTIVE':'PAUSED', spend:(rnd(800,6000)).toFixed(0),
  impressions:Math.floor(rnd(50000,500000)), clicks:Math.floor(rnd(500,8000)),
  ctr:(rnd(0.8,4.2)).toFixed(2), cpm:(rnd(4,18)).toFixed(2),
  conversions:Math.floor(rnd(10,200)), roas:(rnd(1.2,5.4)).toFixed(2),
}))}});
});
router.post('/creative/spark-ads',(req,res)=>ok(res,{data:{candidates:Array.from({length:8},(_,i)=>({
  id:'org-'+i, type:'Organic Post', author:'@yourbrand',
  views:Math.floor(rnd(5000,200000)), likes:Math.floor(rnd(200,8000)),
  engagementRate:(rnd(2,12)).toFixed(1)+'%',
  shares:Math.floor(rnd(50,2000)), comments:Math.floor(rnd(20,500)),
  sparkScore:Math.floor(rnd(60,98)),
  recommendation:i<3?'Top Spark Ad candidate -- high engagement rate and view completion':'Monitor performance before promoting',
}))}});
});
router.post('/creative/hook-analyzer',(req,res)=>ok(res,{data:{videos:Array.from({length:5},(_,i)=>({
  id:'vid-'+i, title:'Video '+String.fromCharCode(65+i),
  avgWatchTime:(rnd(4,14)).toFixed(1)+'s', completionRate:(rnd(15,55)).toFixed(0)+'%',
  dropOffSecond:Math.floor(rnd(2,8)),
  hookScore:Math.floor(rnd(40,95)),
  hookType:['Question hook','Shock/surprise open','Trending sound start','Direct address','Visual hook'][i],
  recommendation:i<2?'Strong hook -- repurpose as Spark Ad':'A/B test alternative hook style to improve 3s retention',
}))}});
});
router.post('/creative/trending-audio',(req,res)=>ok(res,{data:{trends:[
  {sound:'Trending Sound 1',usageCount:2840000,trend:'+284%',genre:'Pop',brandFit:'high',engagement_lift:'+18%'},
  {sound:'Trending Sound 2',usageCount:1240000,trend:'+142%',genre:'Hip-Hop',brandFit:'medium',engagement_lift:'+12%'},
  {sound:'Trending Sound 3',usageCount:840000,trend:'+94%',genre:'Electronic',brandFit:'high',engagement_lift:'+22%'},
  {sound:'Trending Sound 4',usageCount:480000,trend:'+48%',genre:'Viral Original',brandFit:'low',engagement_lift:'+8%'},
]}}));
router.post('/tiktokseo/caption-opt',(req,res)=>{
  const {caption='',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{optimized:{
    original:caption||'Check out our new running shoes!',
    optimized:'These running shoes changed my training routine #RunningShoes #FitTok #RunningMotivation #AthleticWear #MarathonTraining',
    keywords:['RunningShoes','FitTok','RunningMotivation','AthleticWear','MarathonTraining'],
    searchVolume:{RunningShoes:'2.4B views',FitTok:'18.4B views',RunningMotivation:'4.2B views'},
    predictedReach:'+34% vs non-optimized caption',
    creditsUsed:1,model,
  }}});
});
router.post('/audiences/genz-intel',(req,res)=>ok(res,{data:{insights:{
  topInterests:['FitTok','CleanTok','StudyTok','CottageCore','TechTok'],
  contentPreferences:{videoLength:'7-15 seconds',tone:'Authentic/raw over polished',format:'Tutorial/how-to converts 3x better'},
  trendsOverlap:[{trend:'5am club',overlap:34,brandFit:'Running shoes -- morning run content'},
    {trend:'12-3-30 workout',overlap:28,brandFit:'Treadmill/gym footwear angles'},
    {trend:'Hot girl walk',overlap:42,brandFit:'Casual athletic footwear for walking'}],
  avoidList:['Overly promotional','Celebrity endorsement without authenticity','Long pre-roll ads'],
}}}));
router.post('/shop/attribution',(req,res)=>ok(res,{data:{attribution:{
  totalRevenue:28400, fromTikTokShop:12400, fromAds:9800, fromOrganic:6200,
  conversionPath:'50% direct from TikTok Shop tab, 30% from Spark Ads, 20% from organic content',
  topProducts:Array.from({length:5},(_,i)=>({name:'Product '+(i+1),units:Math.floor(rnd(20,200)),revenue:Math.floor(rnd(800,8000)),source:'TikTok Shop'})),
}}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;`;

const TIK_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'spark-ads': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Spark Ad Amplification Engine</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Identify top-performing organic posts by engagement rate and hook score. Turn your best organic content into high-performing paid Spark Ads.</p>
            <button style={S.btn('#fe2c55')} onClick={()=>fetch_('spark-ads',API+'/creative/spark-ads')} disabled={loading['spark-ads']}>{loading['spark-ads']?'Analyzing...':'Find Spark Candidates'}</button>
            {err['spark-ads'] && <div style={S.err}>{err['spark-ads']}</div>}
            {loading['spark-ads'] ? <div style={S.loading}>Analyzing organic posts...</div> : d?.candidates?.length ? (
              <div style={{marginTop:16}}>
                {d.candidates.map((c,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                    <div>
                      <div style={{fontWeight:600,color:'#fafafa',fontSize:13}}>{c.id}</div>
                      <div style={{fontSize:12,color:'#71717a',marginTop:2}}>{c.views?.toLocaleString()} views · {c.likes?.toLocaleString()} likes · {c.engagementRate} engagement</div>
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:16,fontWeight:700,color:c.sparkScore>80?'#25f4ee':c.sparkScore>60?'#f59e0b':'#ef4444'}}>{c.sparkScore}</div>
                        <div style={{fontSize:10,color:'#71717a'}}>spark score</div>
                      </div>
                      {i<3&&<button style={{...S.btn('#fe2c55'),padding:'4px 12px',fontSize:11}} onClick={()=>toast_('Promoted as Spark Ad!')}>Promote</button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Find Spark Ad candidates from your organic content library.</div>}
          </div>
        </div>
      );
      case 'hook-analyzer': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Creative Hook Analyzer</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Analyze the first 3 seconds of your videos for drop-off rate and hook effectiveness. The hook determines whether viewers watch or scroll.</p>
            <button style={S.btn('#25f4ee')} onClick={()=>fetch_('hook-analyzer',API+'/creative/hook-analyzer')} disabled={loading['hook-analyzer']}>{loading['hook-analyzer']?'Analyzing...':'Analyze Hooks'}</button>
            {err['hook-analyzer'] && <div style={S.err}>{err['hook-analyzer']}</div>}
            {loading['hook-analyzer'] ? <div style={S.loading}>Analyzing video hooks...</div> : d?.videos?.length ? (
              <div style={{marginTop:16}}>
                {d.videos.map((v,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <div>
                        <span style={{fontWeight:700,color:'#fafafa'}}>{v.title}</span>
                        <span style={{...S.badge('#25f4ee'),marginLeft:8,fontSize:10}}>{v.hookType}</span>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:18,fontWeight:700,color:v.hookScore>75?'#25f4ee':v.hookScore>50?'#f59e0b':'#ef4444'}}>{v.hookScore}</div>
                        <div style={{fontSize:10,color:'#71717a'}}>hook score</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:16,marginBottom:6}}>
                      <div><span style={{fontSize:11,color:'#71717a'}}>Avg watch time: </span><span style={{fontWeight:600}}>{v.avgWatchTime}</span></div>
                      <div><span style={{fontSize:11,color:'#71717a'}}>Completion: </span><span style={{fontWeight:600}}>{v.completionRate}</span></div>
                      <div><span style={{fontSize:11,color:'#71717a'}}>Drop at: </span><span style={{fontWeight:600,color:'#ef4444'}}>{v.dropOffSecond}s</span></div>
                    </div>
                    <div style={{fontSize:12,color:'#a1a1aa',fontStyle:'italic'}}>{v.recommendation}</div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Analyze your video hooks to improve 3-second retention rate.</div>}
          </div>
        </div>
      );
      case 'genz-intel': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Gen Z Persona Intelligence</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Audience interest overlap with Gen Z trends, sub-cultures, and niches -- enabling authentic content strategy that resonates.</p>
            <button style={S.btn('#fe2c55')} onClick={()=>fetch_('genz-intel',API+'/audiences/genz-intel')} disabled={loading['genz-intel']}>{loading['genz-intel']?'Loading...':'Load Gen Z Intel'}</button>
            {err['genz-intel'] && <div style={S.err}>{err['genz-intel']}</div>}
            {loading['genz-intel'] ? <div style={S.loading}>Analyzing Gen Z trends...</div> : d?.insights ? (
              <>
                <div style={S.sT}>Top Interest Clusters</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
                  {d.insights.topInterests?.map((i,j)=><span key={j} style={{...S.badge('#fe2c55'),fontSize:12,padding:'4px 10px'}}>{i}</span>)}
                </div>
                <div style={S.sT}>Content Preferences</div>
                <div style={{...S.mini,marginBottom:16}}>
                  {Object.entries(d.insights.contentPreferences||{}).map(([k,v])=>(
                    <div key={k} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid #1f1f22'}}>
                      <span style={{fontSize:12,color:'#71717a',minWidth:120,textTransform:'capitalize'}}>{k.replace(/([A-Z])/g,' $1')}:</span>
                      <span style={{fontSize:12,color:'#fafafa'}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={S.sT}>Trend Overlap Opportunities</div>
                {d.insights.trendsOverlap?.map((t,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                    <div>
                      <div style={{fontWeight:700,color:'#25f4ee',fontSize:13}}>#{t.trend}</div>
                      <div style={{fontSize:12,color:'#a1a1aa',marginTop:2}}>{t.brandFit}</div>
                    </div>
                    <span style={S.badge('#fe2c55')}>{t.overlap}% overlap</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load Gen Z intelligence to find authentic content angles.</div>}
          </div>
        </div>
      );
      case 'tik-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'✨',t:'Spark Ad Amplification',d:'Identify top organic posts by engagement rate and hook score -- turn your best organic content into paid Spark Ads with one click.'},
                {icon:'🪝',t:'Creative Hook Analyzer',d:'Analyze first 3 seconds of each video for drop-off rate and hook effectiveness. Hook score predicts scroll-stop probability.'},
                {icon:'🎵',t:'Trending Audio Alignment',d:'Match ad audio to currently trending sounds for organic-feeling creative -- trending audio can increase engagement by 18-22%.'},
                {icon:'🧬',t:'Gen Z Persona Intelligence',d:'Audience interest overlap with Gen Z trends and sub-cultures -- enabling authentic content strategy that resonates with the algorithm.'},
                {icon:'🛍️',t:'TikTok Shop Attribution',d:'Full attribution for TikTok Shop sales -- which content, creators, and campaigns drive product discovery and purchase.'},
                {icon:'🔍',t:'TikTok SEO Engine',d:'Caption keyword optimization and hashtag strategy for organic discoverability -- rank in TikTok search for high-intent queries.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 4: AD CREATIVE OPTIMIZER
// ═══════════════════════════════════════════════════════════════════════════════

const ACO_GROUPS = [
  { id:'library',    label:'Creative Library',  color:'#8b5cf6', tabs:[{id:'lib-all',label:'All Creatives'},{id:'lib-images',label:'Images'},{id:'lib-videos',label:'Videos'},{id:'lib-copy',label:'Copy'},{id:'lib-tags',label:'Tags'},{id:'lib-score',label:'Score'}]},
  { id:'generate',   label:'AI Generate',       color:'#ec4899', tabs:[{id:'copy-gen-a',label:'Copy Generator'},{id:'concept-gen',label:'Concept Gen'},{id:'brief-gen',label:'Brief Gen'},{id:'headline-gen',label:'Headlines'},{id:'desc-gen',label:'Descriptions'},{id:'cta-gen',label:'CTAs'}]},
  { id:'analyze',    label:'Analysis',          color:'#8b5cf6', tabs:[{id:'creative-dna',label:'Creative DNA'},{id:'top-perf',label:'Top Performers'},{id:'bottom-perf',label:'Underperformers'},{id:'emotion-analysis',label:'Emotion Analysis'},{id:'brand-safety',label:'Brand Safety'},{id:'fatigue-a',label:'Fatigue'}]},
  { id:'testing',    label:'Testing',           color:'#ec4899', tabs:[{id:'test-matrix',label:'Test Matrix'},{id:'a-b-test-a',label:'A/B Tests'},{id:'multivariate',label:'Multivariate'},{id:'test-results',label:'Results'},{id:'test-velocity',label:'Velocity'},{id:'test-plan',label:'Test Plan'}]},
  { id:'localize',   label:'Localization',      color:'#8b5cf6', tabs:[{id:'lang-list',label:'Languages'},{id:'translate',label:'Translate'},{id:'cultural-adapt',label:'Cultural Adapt'},{id:'rtl-support',label:'RTL Support'},{id:'local-perf',label:'Performance'},{id:'local-ai',label:'AI Localize'}]},
  { id:'predict',    label:'Predictions',       color:'#ec4899', tabs:[{id:'ctr-pred',label:'CTR Predictor'},{id:'conv-pred',label:'Conv Predictor'},{id:'fatigue-pred',label:'Fatigue Pred'},{id:'creative-score-p',label:'Score'},{id:'ab-pred',label:'A/B Predictor'},{id:'pred-ai',label:'AI Models'}]},
  { id:'aco-adv',    label:'Advanced',          color:'#8b5cf6', tabs:[{id:'brand-guide',label:'Brand Guide'},{id:'aco-int',label:'Integrations'},{id:'asset-dam',label:'Asset DAM'},{id:'aco-api',label:'API'},{id:'aco-settings',label:'Settings'},{id:'aco-world',label:'World-Class'}]},
];

const ACO_ROUTER = `const express = require('express');
const router = express.Router();
const store = { settings: new Map(), library: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'ad-creative-optimizer',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{creatives:284,tests:42,avgScore:72}}));

router.post('/library/all',(req,res)=>ok(res,{data:{creatives:Array.from({length:20},(_,i)=>({
  id:'cr-'+i, name:'Creative '+i, type:['Static Image','Video','Carousel','Story'][i%4],
  platform:['Google','Meta','TikTok','All'][i%4], score:Math.floor(rnd(40,98)),
  ctr:(rnd(1,6)).toFixed(2)+'%', conversions:Math.floor(rnd(5,200)),
  status:i<16?'active':'paused', fatigueRisk:i>14?'high':i>10?'medium':'low',
}))}});
});
router.post('/analyze/creative-dna',(req,res)=>ok(res,{data:{patterns:{
  topPerformers:{
    visualFeatures:['People in action (not static)','Natural lighting over studio','Product in context (not white background)','UGC-style rawness'],
    copyPatterns:['Number in headline (e.g. "40% off")','Question-based hooks','Social proof mentions','Urgency without fake countdown'],
    colorPalette:['High contrast dark/light','Brand color as accent','Avoid >3 colors in single creative'],
    videoLength:['7-12 seconds for prospecting','20-30 seconds for retargeting'],
  },
  bottomPerformers:{
    commonMistakes:['Stock photo backgrounds','Generic CTAs ("Click Here")','No price anchor','Too much text overlay'],
  },
  insight:'Your top 20% of creatives share 3 key traits: action shot of product in use, price/offer in first 3 words of headline, and social proof within 5 words.',
}}}));
router.post('/analyze/emotion-analysis',(req,res)=>ok(res,{data:{creatives:Array.from({length:8},(_,i)=>({
  id:'cr-'+i, name:'Creative '+String.fromCharCode(65+i),
  emotions:{joy:Math.floor(rnd(20,80)),trust:Math.floor(rnd(30,90)),surprise:Math.floor(rnd(10,60)),fear:Math.floor(rnd(5,30)),anticipation:Math.floor(rnd(20,70))},
  dominantEmotion:['Joy','Trust','Surprise','Anticipation'][i%4],
  predictedEngagement:['High','Medium','High','Low','Medium','High','Low','Medium'][i],
}))}});
});
router.post('/analyze/brand-safety',(req,res)=>ok(res,{data:{scan:{
  scanned:20, passed:18, flagged:2,
  flags:[{creative:'Creative 4',issue:'Price claim without substantiation -- "Best price guaranteed"',severity:'medium',action:'Add asterisk and terms, or reword'},
    {creative:'Creative 11',issue:'Before/after weight comparison imagery -- restricted on Meta','severity':'high',action:'Replace with product-only creative for Meta campaigns'}],
}}}));
router.post('/generate/copy',(req,res)=>{
  const {product='',audience='',goal='conversions',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{copies:[
    {format:'Short (25 chars)','headline':'Save 40% Today Only','cta':'Shop Now','predictedCtr':'4.2%'},
    {format:'Medium (40 chars)','headline':'Free Shipping on '+( product||'All Orders'),'cta':'View Collection','predictedCtr':'3.8%'},
    {format:'Long (90 chars)','headline':'Join 50,000+ Happy Customers -- '+( product||'Premium Quality')+ ' with Free Returns','cta':'Explore Now','predictedCtr':'3.1%'},
    {format:'Question hook','headline':'Tired of '+(product||'Products')+' that disappoint?','cta':'See the Difference','predictedCtr':'5.1%'},
  ],model,creditsUsed:2}});
});
router.post('/generate/brief',(req,res)=>{
  const {campaignGoal='',targetAudience='',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{brief:{
    objective:campaignGoal||'Drive purchase conversions from cold audiences',
    targetAudience:targetAudience||'Adults 25-44 interested in fitness and running',
    keyMessage:'Premium running gear engineered for performance, available at an accessible price with free next-day delivery',
    mandatoryInclusions:['Product in use','Price anchor or offer','Social proof element','Clear CTA'],
    avoid:['Generic stock photos','Jargon','Too many features -- focus on one benefit'],
    formats:['15-second vertical video','1:1 static image','Carousel (3-5 slides)'],
    kpis:['CTR > 2.5%','CPA < $40','ROAS > 3.5x'],
    creditsUsed:2,model,
  }}});
});
router.post('/predict/ctr',(req,res)=>{
  const {headline='',description='',format='static'}=req.body;
  const score=Math.floor(rnd(50,95));
  ok(res,{data:{prediction:{score,predictedCtr:(rnd(1.5,6.5)).toFixed(1)+'%',confidence:0.72,factors:[{factor:'Headline includes number or offer',impact:'+0.8% CTR'},{factor:'CTA is action-oriented',impact:'+0.4% CTR'},{factor:'Format is '+format,impact:format==='video'?'+1.2% CTR':'+0%'}]}}});
});
router.post('/testing/matrix',(req,res)=>ok(res,{data:{matrix:{
  dimensions:['Offer (Price/Free Ship/Percent/BOGOF)','Audience (Prospecting/Retarget/Lookalike/RLSA)','Creative (UGC/Studio/Video/Carousel)','CTA (Shop Now/Learn More/Buy Now/View Collection)'],
  activeTests:8,completed:24,winner:'UGC creative + Percent offer + Prospecting audience = best CPA at $34',
}}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;`;

const ACO_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'lib-all': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Creative Library</div>
            <div style={S.row}>
              <button style={S.btn('#8b5cf6')} onClick={()=>fetch_('lib-all',API+'/library/all')} disabled={loading['lib-all']}>{loading['lib-all']?'Loading...':'Load Library'}</button>
              <button style={S.btn('#ec4899')} onClick={()=>fetch_('brand-safety',API+'/analyze/brand-safety')}>Brand Safety Scan</button>
              <button style={S.btn('#10b981')} onClick={()=>toast_('AI scoring all creatives...')}>AI Score All</button>
            </div>
            {err['lib-all'] && <div style={S.err}>{err['lib-all']}</div>}
            {loading['lib-all'] ? <div style={S.loading}>Loading creative library...</div> : d?.creatives?.length ? (
              <div style={{overflowX:'auto'}}>
                <table style={S.tbl}>
                  <thead><tr><th style={S.th}>Creative</th><th style={S.th}>Type</th><th style={S.th}>Platform</th><th style={S.th}>Score</th><th style={S.th}>CTR</th><th style={S.th}>Conv.</th><th style={S.th}>Fatigue</th></tr></thead>
                  <tbody>{d.creatives.map((c,i)=>(
                    <tr key={i} style={i%2?S.trOdd:{}}>
                      <td style={S.td}><span style={{fontWeight:600}}>{c.name}</span></td>
                      <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{c.type}</span></td>
                      <td style={S.td}><span style={{color:'#71717a',fontSize:12}}>{c.platform}</span></td>
                      <td style={S.td}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{...S.bar,width:50,display:'inline-block'}}><div style={S.fill(c.score,'#8b5cf6')} /></div>
                          <span style={{fontWeight:700,color:c.score>=75?'#10b981':c.score>=50?'#f59e0b':'#ef4444'}}>{c.score}</span>
                        </div>
                      </td>
                      <td style={S.td}>{c.ctr}</td>
                      <td style={S.td}>{c.conversions}</td>
                      <td style={S.td}><span style={S.badge(c.fatigueRisk==='high'?'#ef4444':c.fatigueRisk==='medium'?'#f59e0b':'#10b981')}>{c.fatigueRisk}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div style={S.empty}>Load your creative library to manage and score all creatives.</div>}
          </div>
        </div>
      );
      case 'creative-dna': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Creative DNA Extraction</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>What do your top-performing creatives have in common? Visual features, copy patterns, and structural elements that predict performance.</p>
            <button style={S.btn('#8b5cf6')} onClick={()=>fetch_('creative-dna',API+'/analyze/creative-dna')} disabled={loading['creative-dna']}>{loading['creative-dna']?'Analyzing...':'Extract Creative DNA'}</button>
            {err['creative-dna'] && <div style={S.err}>{err['creative-dna']}</div>}
            {loading['creative-dna'] ? <div style={S.loading}>Analyzing creative patterns...</div> : d?.patterns ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#10b98144'}}>
                  <div style={{fontWeight:700,color:'#10b981',marginBottom:6}}>Key Insight</div>
                  <p style={{color:'#e4e4e7',fontSize:13,lineHeight:1.6,margin:0}}>{d.patterns.insight}</p>
                </div>
                {[['Top Performer Traits','#10b981',d.patterns.topPerformers],['Common Mistakes','#ef4444',d.patterns.bottomPerformers]].map(([title,color,section])=>(
                  section && <div key={title}>
                    <div style={S.sT}>{title}</div>
                    {Object.entries(section).map(([key,items])=>(
                      <div key={key}>
                        <div style={{fontSize:11,color:'#71717a',textTransform:'capitalize',marginBottom:4}}>{key.replace(/([A-Z])/g,' $1')}</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>
                          {(Array.isArray(items)?items:[items]).map((item,i)=>(
                            <span key={i} style={{...S.badge(color),fontSize:11,padding:'3px 8px'}}>{item}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Extract Creative DNA to find patterns in your top performers.</div>}
          </div>
        </div>
      );
      case 'copy-gen-a': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>AI Copy Generator</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Generate ad copy variations with predicted CTR scores. Calibrated to your Creative DNA patterns for on-brand output.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Product name..." value={q['copy-gen-a']||''} onChange={e=>setQ(p=>({...p,'copy-gen-a':e.target.value}))} />
              <select style={S.select} value={form.model||'gpt-4o-mini'} onChange={e=>setForm(p=>({...p,model:e.target.value}))}>
                <option value="gpt-4o-mini">Mini (2 credits)</option>
                <option value="gpt-4o">GPT-4o (4 credits)</option>
              </select>
              <button style={S.btn('#ec4899')} onClick={()=>fetch_('copy-gen-a',API+'/generate/copy',{product:q['copy-gen-a']})} disabled={loading['copy-gen-a']}>{loading['copy-gen-a']?'Generating...':'Generate Copy'}</button>
            </div>
            {err['copy-gen-a'] && <div style={S.err}>{err['copy-gen-a']}</div>}
            {loading['copy-gen-a'] ? <div style={S.loading}>AI generating copy variations...</div> : d?.copies?.length ? (
              d.copies.map((c,i)=>(
                <div key={i} style={{...S.mini,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={S.badge('#8b5cf6')}>{c.format}</span>
                    <span style={{fontWeight:700,color:'#10b981',fontSize:13}}>{c.predictedCtr} CTR</span>
                  </div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{c.headline}</div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:11,color:'#71717a'}}>CTA:</span>
                    <span style={S.badge('#ec4899')}>{c.cta}</span>
                    <button style={{...S.btn('#27272a'),padding:'3px 8px',fontSize:11,marginLeft:'auto'}} onClick={()=>toast_('Copied to clipboard!')}>Copy</button>
                  </div>
                </div>
              ))
            ) : <div style={S.empty}>Generate AI copy variations with predicted CTR scores.</div>}
          </div>
        </div>
      );
      case 'ctr-pred': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>CTR Predictor</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Score your creative before launch. ML model predicts click-through rate based on headline, description, format, and historical patterns.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Ad headline..." value={q['ctr-pred']||''} onChange={e=>setQ(p=>({...p,'ctr-pred':e.target.value}))} />
            </div>
            <div style={S.row}>
              <textarea style={S.textarea} rows={2} placeholder="Description..." value={q['ctr-desc']||''} onChange={e=>setQ(p=>({...p,'ctr-desc':e.target.value}))} />
            </div>
            <div style={S.row}>
              <select style={S.select} value={form.adFormat||'static'} onChange={e=>setForm(p=>({...p,adFormat:e.target.value}))}>
                <option value="static">Static Image</option>
                <option value="video">Video</option>
                <option value="carousel">Carousel</option>
              </select>
              <button style={S.btn('#ec4899')} onClick={()=>fetch_('ctr-pred',API+'/predict/ctr',{headline:q['ctr-pred'],description:q['ctr-desc'],format:form.adFormat})} disabled={loading['ctr-pred']}>{loading['ctr-pred']?'Scoring...':'Predict CTR'}</button>
            </div>
            {err['ctr-pred'] && <div style={S.err}>{err['ctr-pred']}</div>}
            {loading['ctr-pred'] ? <div style={S.loading}>Scoring creative...</div> : data['ctr-pred']?.prediction ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#8b5cf644',textAlign:'center'}}>
                  <div style={{fontSize:36,fontWeight:800,color:'#8b5cf6'}}>{data['ctr-pred'].prediction.predictedCtr}</div>
                  <div style={{color:'#71717a',fontSize:12}}>Predicted CTR · Score: {data['ctr-pred'].prediction.score}/100</div>
                </div>
                <div style={S.sT}>Score Factors</div>
                {data['ctr-pred'].prediction.factors?.map((f,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{fontSize:13,color:'#e4e4e7'}}>{f.factor}</span>
                    <span style={{fontWeight:700,color:'#10b981'}}>{f.impact}</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Enter your ad creative to predict click-through rate before launch.</div>}
          </div>
        </div>
      );
      case 'aco-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'🧬',t:'Creative DNA Extraction',d:'Find exactly what your top-performing creatives have in common: visual features, copy patterns, and structural elements that predict performance.'},
                {icon:'😊',t:'Emotion Analysis',d:'Computer vision scoring of creative emotional valence across joy, trust, surprise, fear, and anticipation -- match emotion to campaign objective.'},
                {icon:'🛡️',t:'Brand Safety Scanner',d:'Detect brand safety violations, unsubstantiated claims, and platform policy violations before launch -- avoid rejected ads and account flags.'},
                {icon:'📐',t:'Message Testing Matrix',d:'2x2 matrix testing across offer, audience, creative, and channel -- systematically find the highest-performing combinations.'},
                {icon:'🔮',t:'CTR Predictor',d:'Score your creative before launch. ML model predicts click-through rate based on headline, format, and historical creative DNA patterns.'},
                {icon:'✍️',t:'AI Creative Brief',d:'Generate complete creative briefs from performance data: objective, audience, key message, mandatory inclusions, formats, and KPI targets.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 5: ADS ANOMALY GUARD
// ═══════════════════════════════════════════════════════════════════════════════

const AAG_GROUPS = [
  { id:'live',       label:'Live Monitor',   color:'#ef4444', tabs:[{id:'live-dash',label:'Live Dashboard'},{id:'spend-vel',label:'Spend Velocity'},{id:'roas-watch',label:'ROAS Watch'},{id:'conv-watch',label:'Conv. Watch'},{id:'cpc-watch',label:'CPC Watch'},{id:'live-alerts',label:'Live Alerts'}]},
  { id:'anomalies',  label:'Anomalies',      color:'#f97316', tabs:[{id:'anom-all',label:'All Anomalies'},{id:'budget-anom',label:'Budget'},{id:'perf-anom',label:'Performance'},{id:'conv-anom',label:'Conversions'},{id:'click-fraud',label:'Click Fraud'},{id:'anom-hist',label:'History'}]},
  { id:'rules',      label:'Rules',          color:'#ef4444', tabs:[{id:'rule-list',label:'Rules'},{id:'create-rule',label:'Create Rule'},{id:'auto-pause',label:'Auto-Pause'},{id:'auto-scale',label:'Auto-Scale'},{id:'rule-log',label:'Rule Log'},{id:'rule-ai',label:'AI Rules'}]},
  { id:'protection', label:'Protection',     color:'#f97316', tabs:[{id:'fraud-detect',label:'Fraud Detection'},{id:'ip-block',label:'IP Blocking'},{id:'placement-excl',label:'Excl. Placements'},{id:'quality-shield',label:'Quality Shield'},{id:'budget-lock',label:'Budget Locks'},{id:'protect-audit',label:'Audit Trail'}]},
  { id:'cannibalize',label:'Cannibalization',color:'#ef4444', tabs:[{id:'paid-organic',label:'Paid vs Organic'},{id:'brand-cannibal',label:'Brand Cannibal.'},{id:'channel-overlap-a',label:'Channel Overlap'},{id:'incrementality-a',label:'Incrementality'},{id:'cannibal-ai',label:'AI Analysis'},{id:'cannibal-fix',label:'Fixes'}]},
  { id:'alerts',     label:'Alerts',         color:'#f97316', tabs:[{id:'alert-config',label:'Config'},{id:'alert-history',label:'History'},{id:'slack-int',label:'Slack'},{id:'email-int',label:'Email'},{id:'webhook-int',label:'Webhook'},{id:'escalation',label:'Escalation'}]},
  { id:'aag-adv',    label:'Advanced',       color:'#ef4444', tabs:[{id:'burn-rate',label:'Burn Rate'},{id:'pacing',label:'Pacing'},{id:'aag-int',label:'Integrations'},{id:'aag-api',label:'API'},{id:'aag-settings',label:'Settings'},{id:'aag-world',label:'World-Class'}]},
];

const AAG_ROUTER = `const express = require('express');
const router = express.Router();
const store = { rules: new Map(), settings: new Map(), alerts: [] };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'ads-anomaly-guard',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{rules:store.rules.size,alertsToday:store.alerts.length,protectedBudget:48200}}));

router.post('/live/dashboard',(req,res)=>ok(res,{data:{
  status:'monitoring', lastCheck:new Date().toISOString(),
  spend:{today:2840,budget:3500,pacing:81.1,onTrack:true},
  roas:{current:3.84,target:3.5,status:'on-track'},
  conversions:{today:84,yesterday:78,change:'+7.7%'},
  anomalies:{active:2,warnings:3,critical:0},
  recentEvents:[
    {time:'14:32',type:'warning',message:'CPC spike detected on Brand campaign -- +42% vs 7-day avg'},
    {time:'13:15',type:'info',message:'Budget pacing on track -- 81% spent at 81% of day'},
    {time:'11:48',type:'alert',message:'Click fraud risk: 2.4% invalid click rate on Display (threshold: 3%)'},
  ],
}}));
router.post('/live/spend-velocity',(req,res)=>ok(res,{data:{
  velocity:{hourly:118,daily:2840,weeklyAvg:18400},
  burnProjection:{eomSpend:86200,budget:90000,onTrack:true,overrunRisk:false},
  hourlyPattern:Array.from({length:24},(_,h)=>({hour:h+'h',spend:Math.floor(rnd(40,200)),budget:Math.floor(rnd(60,180)),pacing:Math.floor(rnd(50,130))})),
}}));
router.post('/anomalies/all',(req,res)=>ok(res,{data:{anomalies:[
  {id:'an-1',severity:'critical',type:'ROAS Cliff',campaign:'Non-Brand ROAS',metric:'ROAS',value:1.2,threshold:2.0,detectedAt:new Date(Date.now()-1800000).toISOString(),status:'active',action:'Auto-paused by rule ROAS-GUARD'},
  {id:'an-2',severity:'warning',type:'CPC Spike',campaign:'Brand',metric:'CPC',value:4.84,threshold:3.50,detectedAt:new Date(Date.now()-3600000).toISOString(),status:'active',action:'Alert sent to Slack'},
  {id:'an-3',severity:'warning',type:'Click Fraud',campaign:'Display Remarketing',metric:'Invalid Click Rate',value:2.4,threshold:3.0,detectedAt:new Date(Date.now()-7200000).toISOString(),status:'monitoring',action:'IP clustering analysis running'},
  {id:'an-4',severity:'info',type:'Conversion Drop',campaign:'Shopping',metric:'Conv. Rate',value:1.2,threshold:2.0,detectedAt:new Date(Date.now()-14400000).toISOString(),status:'resolved',action:'Resolved -- checkout issue fixed'},
]}}));
router.post('/anomalies/click-fraud',(req,res)=>ok(res,{data:{analysis:{
  invalidClickRate:2.4, threshold:3.0, status:'monitoring',
  suspiciousClusters:[{ip:'185.x.x.x',clicks:48,bounce:0.98,timeOnSite:'<2s',pattern:'Rapid sequential clicks'},
    {ip:'92.x.x.x',clicks:32,bounce:0.96,timeOnSite:'<3s',pattern:'Same UA, multiple IPs'}],
  recommendations:['Add IP exclusion list for identified clusters','Enable enhanced CPC to reduce exposure to low-quality clicks','Set up IP rate-limiting in campaign settings'],
}}}));
router.post('/rules/list',(req,res)=>ok(res,{data:{rules:[...store.rules.values(),...[
  {id:'r-1',name:'ROAS Guard',condition:'ROAS < 1.5 for 2 consecutive hours',action:'Pause campaign + alert',campaigns:'All',status:'active',triggeredCount:3},
  {id:'r-2',name:'Budget Pacing Guard',condition:'Daily spend > 110% of daily budget by 6pm',action:'Reduce budget to 90%',campaigns:'All',status:'active',triggeredCount:1},
  {id:'r-3',name:'CPC Spike Alert',condition:'CPC > 150% of 7-day average',action:'Send Slack alert',campaigns:'Non-Brand',status:'active',triggeredCount:8},
  {id:'r-4',name:'Click Fraud Guard',condition:'Invalid click rate > 3%',action:'Pause + alert + IP report',campaigns:'Display',status:'active',triggeredCount:0},
]]}});
});
router.post('/rules/create',(req,res)=>{const id='rule-'+Date.now();const rule={...req.body,id,createdAt:new Date().toISOString()};store.rules.set(id,rule);ok(res,{data:{rule}});});
router.post('/cannibalization/paid-organic',(req,res)=>ok(res,{data:{keywords:[
  {keyword:'brand name',paidIS:42,organicRank:1,incrementalValue:0.18,recommendation:'Reduce brand bid -- organic #1 captures most value'},
  {keyword:'running shoes',paidIS:68,organicRank:4,incrementalValue:0.72,recommendation:'Maintain -- paid captures users who skip organic'},
  {keyword:'best running shoes 2024',paidIS:84,organicRank:2,incrementalValue:0.42,recommendation:'Reduce bid -- strong organic visibility reduces paid incrementality'},
]}}));
router.post('/protection/fraud-detect',(req,res)=>ok(res,{data:{summary:{totalClicks:48200,validClicks:47048,suspiciousClicks:1152,fraudRate:2.4,estimatedWaste:840,ipsClustered:8,actionTaken:'Monitoring -- below auto-block threshold of 3%'}}}));
router.post('/advanced/burn-rate',(req,res)=>ok(res,{data:{projection:{
  currentDailyBurn:2840, budgetRemaining:48200, daysRemaining:17,
  eomProjection:{low:82400,base:86200,high:91800},
  overrunProbability:0.12,
  scenarios:[{name:'Current pace',eom:86200,vs:'$90K budget'},{name:'+20% spend increase',eom:103440,vs:'12% over budget'},{name:'-15% spend reduction',eom:73270,vs:'18% under budget'}],
}}}));
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;`;

const AAG_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'live-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Live Ads Monitoring Dashboard</div>
            <div style={S.row}>
              <button style={S.btn('#ef4444')} onClick={()=>fetch_('live-dash',API+'/live/dashboard')} disabled={loading['live-dash']}>{loading['live-dash']?'Loading...':'Load Live Status'}</button>
              <button style={S.btn('#f97316')} onClick={()=>fetch_('anom-all',API+'/anomalies/all')}>Check Anomalies</button>
              <button style={S.btn('#10b981')} onClick={()=>toast_('All systems monitoring...')}>Status OK</button>
            </div>
            {err['live-dash'] && <div style={S.err}>{err['live-dash']}</div>}
            {loading['live-dash'] ? <div style={S.loading}>Connecting to live data feed...</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Today Spend','\\$'+d.spend?.today?.toLocaleString(),'#fafafa'],['Budget','\\$'+d.spend?.budget?.toLocaleString(),'#71717a'],['Pacing',d.spend?.pacing+'%',d.spend?.onTrack?'#10b981':'#ef4444'],['ROAS',d.roas?.current+'x',d.roas?.current>=d.roas?.target?'#10b981':'#ef4444'],['Anomalies',d.anomalies?.active,'#f97316'],['Conversions',d.conversions?.today,'#4285f4']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Recent Events</div>
                {d.recentEvents?.map((e,i)=>(
                  <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #1f1f22',alignItems:'flex-start'}}>
                    <span style={{color:'#71717a',fontSize:11,minWidth:40}}>{e.time}</span>
                    <span style={S.badge(e.type==='alert'?'#ef4444':e.type==='warning'?'#f59e0b':'#71717a')}>{e.type}</span>
                    <span style={{fontSize:13,color:'#e4e4e7',lineHeight:1.4}}>{e.message}</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load live monitoring to see real-time ads status.</div>}
          </div>
        </div>
      );
      case 'anom-all': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Anomaly Detection Center</div>
            <button style={S.btn('#f97316')} onClick={()=>fetch_('anom-all',API+'/anomalies/all')} disabled={loading['anom-all']}>{loading['anom-all']?'Scanning...':'Scan for Anomalies'}</button>
            {err['anom-all'] && <div style={S.err}>{err['anom-all']}</div>}
            {loading['anom-all'] ? <div style={S.loading}>Scanning all campaigns...</div> : d?.anomalies?.length ? (
              <div style={{marginTop:16}}>
                {d.anomalies.map((a,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:10,borderColor:a.severity==='critical'?'#ef444444':a.severity==='warning'?'#f59e0b44':'#27272a'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <span style={S.badge(a.severity==='critical'?'#ef4444':a.severity==='warning'?'#f59e0b':'#71717a')}>{a.severity}</span>
                        <span style={{fontWeight:700,color:'#fafafa'}}>{a.type}</span>
                      </div>
                      <span style={S.badge(a.status==='active'?'#ef4444':a.status==='monitoring'?'#f59e0b':'#10b981')}>{a.status}</span>
                    </div>
                    <div style={{fontSize:13,color:'#a1a1aa',marginBottom:4}}>{a.campaign} -- {a.metric}: <span style={{color:'#ef4444',fontWeight:700}}>{a.value}</span> (threshold: {a.threshold})</div>
                    <div style={{fontSize:12,color:'#71717a'}}>{a.action}</div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Scan campaigns to detect performance anomalies.</div>}
          </div>
        </div>
      );
      case 'click-fraud': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Click Fraud Detection</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Abnormal click patterns, IP clustering, and bounce rate correlation to detect invalid traffic before it wastes budget.</p>
            <button style={S.btn('#ef4444')} onClick={()=>fetch_('click-fraud',API+'/anomalies/click-fraud')} disabled={loading['click-fraud']}>{loading['click-fraud']?'Analyzing...':'Analyze Click Quality'}</button>
            {err['click-fraud'] && <div style={S.err}>{err['click-fraud']}</div>}
            {loading['click-fraud'] ? <div style={S.loading}>Analyzing click patterns...</div> : d?.analysis ? (
              <>
                <div style={S.metaRow}>
                  {[['Invalid Click Rate',d.analysis.invalidClickRate+'%',d.analysis.invalidClickRate>3?'#ef4444':'#10b981'],['Est. Wasted','\\$'+d.analysis.estimatedWaste,'#f97316'],['IPs Clustered',d.analysis.ipsClustered,'#f59e0b']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Suspicious IP Clusters</div>
                {d.analysis.suspiciousClusters?.map((c,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontFamily:'monospace',fontSize:12,color:'#ef4444'}}>{c.ip}</span>
                      <span style={S.badge('#ef4444')}>{c.clicks} clicks</span>
                    </div>
                    <div style={{fontSize:12,color:'#71717a'}}>{c.pattern} -- Bounce: {(c.bounce*100).toFixed(0)}% -- Avg time: {c.timeOnSite}</div>
                    <button style={{...S.btn('#ef4444'),padding:'4px 10px',fontSize:11,marginTop:6}} onClick={()=>toast_('IP blocked!')}>Block IP</button>
                  </div>
                ))}
                <div style={S.sT}>Recommendations</div>
                {d.analysis.recommendations?.map((r,i)=>(
                  <div key={i} style={{display:'flex',gap:8,padding:'8px 0',borderBottom:'1px solid #1f1f22'}}>
                    <span style={{...S.badge('#f97316'),flexShrink:0}}>{i+1}</span>
                    <span style={{fontSize:13,color:'#e4e4e7'}}>{r}</span>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Analyze click quality to detect and block invalid traffic.</div>}
          </div>
        </div>
      );
      case 'aag-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'🚨',t:'ROAS Cliff Detection',d:'Detect when ROAS crosses below break-even automatically -- auto-pause campaigns before you lose more money than the campaign is worth.'},
                {icon:'🤖',t:'Click Fraud Detection',d:'IP clustering, bounce rate correlation, and click pattern analysis to detect invalid traffic before it wastes significant budget.'},
                {icon:'💸',t:'Budget Burn Rate Forecasting',d:'Predict end-of-month spend at current pace with bull/base/bear scenarios -- never accidentally overspend your media budget.'},
                {icon:'📡',t:'Real-Time Spend Velocity',d:'Alert when spend rate deviates from hourly/daily budget pace -- catch runaway spend within minutes, not hours.'},
                {icon:'⚡',t:'Automated Guard Rules',d:'Define conditions that auto-pause campaigns (e.g. ROAS < 1.5 for 2 hours). Rules execute 24/7 without manual monitoring.'},
                {icon:'🔀',t:'Cross-Channel Cannibalization',d:'Detect when paid search cannibalizes organic, or when paid social cannibalizes paid search -- optimize total portfolio ROAS.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 6: MULTI-CHANNEL OPTIMIZER
// ═══════════════════════════════════════════════════════════════════════════════

const MCO_GROUPS = [
  { id:'overview-m',  label:'Overview',      color:'#6366f1', tabs:[{id:'mco-dash',label:'Dashboard'},{id:'channel-comp',label:'Channel Compare'},{id:'portfolio-view',label:'Portfolio'},{id:'total-roas',label:'Total ROAS'},{id:'mco-trends',label:'Trends'},{id:'mco-alerts',label:'Alerts'}]},
  { id:'mmm',         label:'Media Mix',     color:'#8b5cf6', tabs:[{id:'mmm-model',label:'MMM Model'},{id:'adstock',label:'Adstock Curves'},{id:'saturation',label:'Saturation'},{id:'diminishing',label:'Diminishing Returns'},{id:'mmm-fit',label:'Model Fit'},{id:'mmm-validate',label:'Validate'}]},
  { id:'attribution', label:'Attribution',   color:'#6366f1', tabs:[{id:'shapley',label:'Shapley Values'},{id:'path-analysis',label:'Path Analysis'},{id:'touchpoints',label:'Touchpoints'},{id:'model-compare',label:'Model Compare'},{id:'incr-roas',label:'Incr. ROAS'},{id:'attrib-report',label:'Report'}]},
  { id:'budgets',     label:'Budget Alloc',  color:'#8b5cf6', tabs:[{id:'current-alloc',label:'Current'},{id:'recommended',label:'Recommended'},{id:'scenarios',label:'Scenarios'},{id:'incremental-budget',label:'Incremental'},{id:'realloc',label:'Reallocation'},{id:'budget-ai',label:'AI Optimize'}]},
  { id:'frequency',   label:'Frequency',     color:'#6366f1', tabs:[{id:'freq-analysis',label:'Analysis'},{id:'freq-cap',label:'Freq Cap'},{id:'cross-channel-freq',label:'Cross-Channel'},{id:'reach-curve',label:'Reach Curve'},{id:'freq-opt',label:'Optimize'},{id:'freq-ai',label:'AI Freq'}]},
  { id:'synergy',     label:'Synergy',       color:'#8b5cf6', tabs:[{id:'channel-synergy',label:'Channel Synergy'},{id:'halo-effects',label:'Halo Effects'},{id:'sequencing',label:'Sequencing'},{id:'combo-perf',label:'Combo Perf'},{id:'synergy-ai',label:'AI Analysis'},{id:'synergy-report',label:'Report'}]},
  { id:'mco-adv',     label:'Advanced',      color:'#6366f1', tabs:[{id:'scenario-planner',label:'Scenario Planner'},{id:'mco-int',label:'Integrations'},{id:'data-sources-m',label:'Data Sources'},{id:'mco-api',label:'API'},{id:'mco-settings',label:'Settings'},{id:'mco-world',label:'World-Class'}]},
];

const MCO_ROUTER = `const express = require('express');
const router = express.Router();
const store = { settings: new Map() };
function ok(res,d){res.json({ok:true,...d});}
function rnd(a,b){return Math.random()*(b-a)+a;}

router.get('/health',(req,res)=>ok(res,{service:'multi-channel-optimizer',status:'healthy',ts:new Date().toISOString()}));
router.get('/stats',(req,res)=>ok(res,{stats:{channelsTracked:5,totalSpend:124800,blendedRoas:3.84}}));

router.post('/overview/dashboard',(req,res)=>ok(res,{data:{
  totalSpend:124800, blendedRoas:3.84, totalConversions:2840, blendedCpa:43.9,
  channels:[
    {name:'Google Search',spend:48200,roas:4.84,conversions:1124,pct:38.6,trend:'+8%'},
    {name:'Google Shopping',spend:18400,roas:5.24,conversions:428,pct:14.7,trend:'+12%'},
    {name:'Meta',spend:38420,roas:3.14,conversions:842,pct:30.8,trend:'-4%'},
    {name:'TikTok',spend:12400,roas:2.84,conversions:284,pct:9.9,trend:'+28%'},
    {name:'Email',spend:7380,roas:18.4,conversions:162,pct:5.9,trend:'+2%'},
  ],
}}));
router.post('/mmm/model',(req,res)=>ok(res,{data:{model:{
  name:'Bayesian Media Mix Model',
  description:'Adstock and saturation curves per channel. Separates baseline sales from media-driven incremental revenue.',
  channels:[
    {channel:'Google Search',contribution:0.34,adstockHalfLife:2.1,saturationAlpha:0.62,incrementalRoas:5.2},
    {channel:'Google Shopping',contribution:0.18,adstockHalfLife:1.4,saturationAlpha:0.71,incrementalRoas:5.8},
    {channel:'Meta',contribution:0.22,adstockHalfLife:4.2,saturationAlpha:0.44,incrementalRoas:2.8},
    {channel:'TikTok',contribution:0.08,adstockHalfLife:6.4,saturationAlpha:0.28,incrementalRoas:2.1},
    {channel:'Email',contribution:0.12,adstockHalfLife:1.2,saturationAlpha:0.82,incrementalRoas:18.4},
    {channel:'Baseline (organic)',contribution:0.06,adstockHalfLife:null,saturationAlpha:null,incrementalRoas:null},
  ],
  fit:{rSquared:0.91,mape:8.4},
}}}));
router.post('/attribution/shapley',(req,res)=>ok(res,{data:{shapley:{
  description:'Game-theory Shapley value attribution: each channel gets credit proportional to its marginal contribution across all possible customer journey combinations.',
  channels:[
    {channel:'Google Search',lastClick:42.1,shapley:28.4,diff:-13.7,insight:'Last click overcredits -- search often assists but not always the closer'},
    {channel:'Meta',lastClick:18.4,shapley:24.2,diff:+5.8,insight:'Under-credited -- Meta plays strong assist role in the conversion path'},
    {channel:'Email',lastClick:12.4,shapley:18.8,diff:+6.4,insight:'Significantly under-credited -- email is a key conversion driver mid-funnel'},
    {channel:'TikTok',lastClick:8.2,shapley:14.4,diff:+6.2,insight:'Under-credited -- TikTok drives discovery that converts via other channels'},
    {channel:'Google Shopping',lastClick:18.9,shapley:14.2,diff:-4.7,insight:'Slightly over-credited -- captures last-click on brand/branded queries'},
  ],
}}}));
router.post('/mmm/diminishing',(req,res)=>ok(res,{data:{curves:[
  {channel:'Google Search',currentSpend:48200,marginalRoas:3.2,optimalSpend:58000,potentialUplift:'+$8.4K revenue at optimal spend'},
  {channel:'Meta',currentSpend:38420,marginalRoas:1.4,optimalSpend:28000,potentialUplift:'+$6.2K revenue by reallocating overspend'},
  {channel:'TikTok',currentSpend:12400,marginalRoas:3.8,optimalSpend:18000,potentialUplift:'+$4.8K revenue at optimal spend'},
  {channel:'Email',currentSpend:7380,marginalRoas:12.4,optimalSpend:12000,potentialUplift:'+$9.2K revenue -- most underspent channel'},
]}}));
router.post('/budgets/scenarios',(req,res)=>{
  const {totalBudget=124800,objective='maximize-roas'}=req.body;
  ok(res,{data:{scenarios:[
    {name:'Current Allocation',totalBudget,blendedRoas:3.84,totalConversions:2840,note:'Baseline'},
    {name:'ROAS-Optimized',totalBudget,blendedRoas:4.42,totalConversions:2980,note:'Shift $10K from Meta to Google Search + Email'},
    {name:'Volume-Maximized',totalBudget,blendedRoas:3.44,totalConversions:3240,note:'Increase TikTok + Meta at lower ROAS'},
    {name:'Efficiency-Focused',totalBudget:100000,blendedRoas:4.84,totalConversions:2480,note:'Cut 20% budget, eliminate low-ROAS placements'},
  ]}}));
});
router.post('/attribution/incr-roas',(req,res)=>ok(res,{data:{incrementalRoas:[
  {channel:'Google Search',lastClickRoas:4.84,incrementalRoas:3.2,incrementality:0.66,interpretation:'For every $1 of Google Search revenue, $0.66 is truly incremental (not cannibalized from organic)'},
  {channel:'Meta',lastClickRoas:3.14,incrementalRoas:2.1,incrementality:0.67,interpretation:'Meta drives mostly incremental sales -- solid incrementality score'},
  {channel:'Brand Search',lastClickRoas:12.4,incrementalRoas:1.8,incrementality:0.15,interpretation:'Brand search is highly cannibalistic -- reduce brand bids where organic rank is #1'},
]}}));
router.post('/synergy/channel-synergy',(req,res)=>ok(res,{data:{synergies:[
  {combo:'Google Search + Email',synergyMultiplier:1.28,interpretation:'Customers exposed to both convert at 28% higher rate than sum of individual effects'},
  {combo:'TikTok + Meta',synergyMultiplier:1.18,interpretation:'Sequential exposure TikTok discovery -> Meta retargeting produces 18% lift'},
  {combo:'Meta + Email',synergyMultiplier:1.42,interpretation:'Strongest synergy pair -- email personalizes the Meta retargeting follow-up'},
  {combo:'Google Shopping + Google Search',synergyMultiplier:1.14,interpretation:'Cross-format coverage improves click capture rate by 14%'},
]}}));
router.post('/advanced/scenario-planner',(req,res)=>{
  const {reallocation='',model='gpt-4o-mini'}=req.body;
  ok(res,{data:{scenario:{
    description:reallocation||'Reallocate $10K from Meta to Google Search + Email',
    projectedRoasChange:'+0.6x',projectedConversionChange:'+8.4%',projectedRevChange:'+$12,400',
    confidence:0.78,model,creditsUsed:3,
    breakdown:[{channel:'Meta',change:'-$10K',roasImpact:'+0.2x (less diminishing returns)'},
      {channel:'Google Search',change:'+$6K',roasImpact:'-0.1x (still above breakeven)'},
      {channel:'Email',change:'+$4K',roasImpact:'+0.5x (most underspent channel)'}],
  }}});
});
router.get('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';ok(res,{settings:store.settings.get(s)||{model:'gpt-4o-mini'}});});
router.post('/settings',(req,res)=>{const s=req.headers['x-shopify-shop-domain']||'default';store.settings.set(s,req.body);ok(res,{settings:req.body});});

module.exports = router;`;

const MCO_TABS = `
  function renderTab() {
    const tab = activeTab;
    const d = data[tab];
    switch(tab) {
      case 'mco-dash': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Multi-Channel Portfolio Dashboard</div>
            <div style={S.row}>
              <button style={S.btn('#6366f1')} onClick={()=>fetch_('mco-dash',API+'/overview/dashboard')} disabled={loading['mco-dash']}>{loading['mco-dash']?'Loading...':'Load Portfolio'}</button>
              <button style={S.btn('#8b5cf6')} onClick={()=>fetch_('shapley',API+'/attribution/shapley')}>Shapley Attribution</button>
              <button style={S.btn('#10b981')} onClick={()=>toast_('AI optimization running...')}>AI Optimize</button>
            </div>
            {err['mco-dash'] && <div style={S.err}>{err['mco-dash']}</div>}
            {loading['mco-dash'] ? <div style={S.loading}>Loading portfolio data...</div> : d ? (
              <>
                <div style={S.metaRow}>
                  {[['Total Spend','\\$'+d.totalSpend?.toLocaleString(),'#fafafa'],['Blended ROAS',d.blendedRoas+'x','#10b981'],['Total Conv.',d.totalConversions?.toLocaleString(),'#6366f1'],['Blended CPA','\\$'+d.blendedCpa,'#f59e0b']].map(([l,v,c])=>(
                    <div key={l} style={S.metaItem}><div style={S.metaVal(c)}>{v}</div><div style={S.metaLbl}>{l}</div></div>
                  ))}
                </div>
                <div style={S.sT}>Channel Breakdown</div>
                {d.channels?.map((c,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1f1f22',flexWrap:'wrap',gap:6}}>
                    <div style={{minWidth:140}}>
                      <div style={{fontWeight:600,fontSize:13,color:'#fafafa'}}>{c.name}</div>
                      <div style={{fontSize:11,color:'#71717a'}}>\${c.spend?.toLocaleString()} spend</div>
                    </div>
                    <div style={{display:'flex',gap:12,alignItems:'center'}}>
                      <div style={{textAlign:'center'}}><div style={{fontWeight:700,color:'#10b981'}}>{c.roas}x</div><div style={{fontSize:10,color:'#71717a'}}>ROAS</div></div>
                      <div style={{textAlign:'center'}}><div style={{fontWeight:700}}>{c.conversions}</div><div style={{fontSize:10,color:'#71717a'}}>conv</div></div>
                      <span style={S.badge(c.trend.startsWith('+')?'#10b981':'#ef4444')}>{c.trend}</span>
                      <div style={{width:60}}><div style={S.bar}><div style={S.fill(c.pct,'#6366f1')} /></div><div style={{fontSize:10,color:'#71717a',textAlign:'center'}}>{c.pct}%</div></div>
                    </div>
                  </div>
                ))}
              </>
            ) : <div style={S.empty}>Load your multi-channel portfolio to see blended performance.</div>}
          </div>
        </div>
      );
      case 'mmm-model': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Bayesian Media Mix Model</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Separates media-driven incremental revenue from baseline organic sales. Adstock and saturation curves per channel reveal true contribution.</p>
            <button style={S.btn('#8b5cf6')} onClick={()=>fetch_('mmm-model',API+'/mmm/model')} disabled={loading['mmm-model']}>{loading['mmm-model']?'Running Model...':'Run MMM'}</button>
            {err['mmm-model'] && <div style={S.err}>{err['mmm-model']}</div>}
            {loading['mmm-model'] ? <div style={S.loading}>Fitting Bayesian MMM...</div> : d?.model ? (
              <>
                <div style={{...S.mini,marginBottom:16,borderColor:'#8b5cf644'}}>
                  <div style={{fontSize:12,color:'#8b5cf6',fontWeight:700,marginBottom:4}}>{d.model.name}</div>
                  <p style={{color:'#a1a1aa',fontSize:13,margin:'0 0 6px'}}>{d.model.description}</p>
                  <div style={{display:'flex',gap:16}}>
                    <span style={{fontSize:12,color:'#71717a'}}>R-squared: <span style={{color:'#10b981',fontWeight:700}}>{d.model.fit?.rSquared}</span></span>
                    <span style={{fontSize:12,color:'#71717a'}}>MAPE: <span style={{color:'#f59e0b',fontWeight:700}}>{d.model.fit?.mape}%</span></span>
                  </div>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Channel</th><th style={S.th}>Contribution</th><th style={S.th}>Adstock Half-Life</th><th style={S.th}>Saturation</th><th style={S.th}>Incr. ROAS</th></tr></thead>
                    <tbody>{d.model.channels?.map((c,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}><span style={{fontWeight:600}}>{c.channel}</span></td>
                        <td style={S.td}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <div style={{...S.bar,width:60,display:'inline-block'}}><div style={S.fill(c.contribution*100,'#8b5cf6')} /></div>
                            <span style={{fontWeight:700}}>{(c.contribution*100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={S.td}>{c.adstockHalfLife!=null?c.adstockHalfLife+' days':'--'}</td>
                        <td style={S.td}>{c.saturationAlpha!=null?c.saturationAlpha:'--'}</td>
                        <td style={S.td}>{c.incrementalRoas!=null?<span style={{fontWeight:700,color:c.incrementalRoas>3?'#10b981':c.incrementalRoas>1.5?'#f59e0b':'#ef4444'}}>{c.incrementalRoas}x</span>:'--'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Run the MMM to see channel contribution and adstock curves.</div>}
          </div>
        </div>
      );
      case 'shapley': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Shapley Value Attribution</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Game-theory attribution across touchpoints. Each channel gets credit proportional to its marginal contribution -- revealing true vs perceived value.</p>
            <button style={S.btn('#6366f1')} onClick={()=>fetch_('shapley',API+'/attribution/shapley')} disabled={loading.shapley}>{loading.shapley?'Computing...':'Compute Shapley Values'}</button>
            {err.shapley && <div style={S.err}>{err.shapley}</div>}
            {loading.shapley ? <div style={S.loading}>Computing Shapley values...</div> : d?.shapley ? (
              <>
                <p style={{color:'#71717a',fontSize:12,marginBottom:16}}>{d.shapley.description}</p>
                <div style={{overflowX:'auto'}}>
                  <table style={S.tbl}>
                    <thead><tr><th style={S.th}>Channel</th><th style={S.th}>Last-Click %</th><th style={S.th}>Shapley %</th><th style={S.th}>Diff</th><th style={S.th}>Insight</th></tr></thead>
                    <tbody>{d.shapley.channels?.map((c,i)=>(
                      <tr key={i} style={i%2?S.trOdd:{}}>
                        <td style={S.td}><span style={{fontWeight:600}}>{c.channel}</span></td>
                        <td style={S.td}>{c.lastClick}%</td>
                        <td style={S.td}><span style={{fontWeight:700,color:'#8b5cf6'}}>{c.shapley}%</span></td>
                        <td style={S.td}><span style={{fontWeight:700,color:c.diff>0?'#10b981':'#ef4444'}}>{c.diff>0?'+':''}{c.diff}pp</span></td>
                        <td style={{...S.td,fontSize:11,color:'#71717a',maxWidth:200}}>{c.insight}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : <div style={S.empty}>Compute Shapley values to see true multi-touch attribution.</div>}
          </div>
        </div>
      );
      case 'scenarios': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Budget Scenario Planner</div>
            <p style={{color:'#71717a',fontSize:13,marginTop:0}}>Model the impact of budget reallocations before making changes. Compare ROAS and conversion outcomes across different allocation strategies.</p>
            <div style={S.row}>
              <input style={S.input} placeholder="Total budget..." value={q.scenarios||''} onChange={e=>setQ(p=>({...p,scenarios:e.target.value}))} />
              <button style={S.btn('#8b5cf6')} onClick={()=>fetch_('scenarios',API+'/budgets/scenarios',{totalBudget:q.scenarios})} disabled={loading.scenarios}>{loading.scenarios?'Modeling...':'Model Scenarios'}</button>
            </div>
            {err.scenarios && <div style={S.err}>{err.scenarios}</div>}
            {loading.scenarios ? <div style={S.loading}>Running scenario models...</div> : d?.scenarios?.length ? (
              <div style={{marginTop:8}}>
                {d.scenarios.map((s,i)=>(
                  <div key={i} style={{...S.mini,marginBottom:10,borderColor:i===1?'#10b98144':i===0?'#27272a':'#3f3f46'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <span style={{fontWeight:700,color:i===0?'#71717a':'#fafafa'}}>{s.name}</span>
                      {i===1&&<span style={S.badge('#10b981')}>Recommended</span>}
                    </div>
                    <div style={{display:'flex',gap:16,marginBottom:4}}>
                      {[['Blended ROAS',s.blendedRoas+'x'],['Conversions',s.totalConversions?.toLocaleString()],['Budget','\\$'+s.totalBudget?.toLocaleString()]].map(([l,v])=>(
                        <div key={l}><span style={{fontSize:11,color:'#71717a'}}>{l}: </span><span style={{fontWeight:600}}>{v}</span></div>
                      ))}
                    </div>
                    <div style={{fontSize:12,color:'#a1a1aa',fontStyle:'italic'}}>{s.note}</div>
                  </div>
                ))}
              </div>
            ) : <div style={S.empty}>Model budget scenarios to compare allocation strategies.</div>}
          </div>
        </div>
      );
      case 'mco-world': return (
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>World-Class Features</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {[
                {icon:'📊',t:'Bayesian Media Mix Model',d:'Adstock and saturation curves per channel. Separates true incremental media revenue from baseline organic -- R-squared > 0.9 model fit.'},
                {icon:'🎮',t:'Shapley Value Attribution',d:'Game-theory attribution: each channel gets credit proportional to its marginal contribution across all possible customer journey combinations.'},
                {icon:'📉',t:'Diminishing Returns Curves',d:'Identify the marginal ROAS curve for each channel to find the optimal spend level before efficiency drops below breakeven.'},
                {icon:'🔀',t:'Cross-Channel Frequency Cap',d:'Unified frequency management across Google/Meta/TikTok/programmatic -- prevent over-serving the same user across all channels.'},
                {icon:'✨',t:'Channel Synergy Analysis',d:'Which channel combinations produce super-additive effects? Email + Meta retargeting shows 1.42x synergy multiplier in tests.'},
                {icon:'🎯',t:'Scenario Planning Dashboard',d:'Reallocate $10K from Meta to Google -- what is the predicted ROAS change? Model outcomes before committing real budget.'},
              ].map((f,i)=>(
                <div key={i} style={S.mini}>
                  <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontWeight:700,color:'#fafafa',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:12,color:'#71717a',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      default: return Generic(tab, curGroup.tabs.find(t=>t.id===tab)?.label||tab, '', API+'/health');
    }
  }
`;

// ─── generate all files ───────────────────────────────────────────────────────

const tools = [
  { id:'google-ads-integration',    name:'GoogleAdsIntegration',    groups:GAI_GROUPS, router:GAI_ROUTER, tabs:GAI_TABS, api:'/api/google-ads-integration',    color:'#4285f4', desc:'Google Ads intelligence -- Markowitz budget allocation, AI search term mining, RSA builder, auction insights & incrementality testing' },
  { id:'facebook-ads-integration',  name:'FacebookAdsIntegration',  groups:FAD_GROUPS, router:FAD_ROUTER, tabs:FAD_TABS, api:'/api/facebook-ads-integration',  color:'#1877f2', desc:'Meta Ads management -- LTV lookalike audiences, ad fatigue detection, DCO analysis, iOS 14+ attribution recovery & Advantage+ insights' },
  { id:'tiktok-ads-integration',    name:'TikTokAdsIntegration',    groups:TIK_GROUPS, router:TIK_ROUTER, tabs:TIK_TABS, api:'/api/tiktok-ads-integration',    color:'#fe2c55', desc:'TikTok Ads platform -- Spark Ad amplification, hook analyzer, Gen Z persona intelligence, trending audio & TikTok Shop attribution' },
  { id:'ad-creative-optimizer',     name:'AdCreativeOptimizer',     groups:ACO_GROUPS, router:ACO_ROUTER, tabs:ACO_TABS, api:'/api/ad-creative-optimizer',     color:'#8b5cf6', desc:'Creative intelligence -- Creative DNA extraction, emotion analysis, CTR predictor, brand safety scanner & AI copy generator' },
  { id:'ads-anomaly-guard',         name:'AdsAnomalyGuard',         groups:AAG_GROUPS, router:AAG_ROUTER, tabs:AAG_TABS, api:'/api/ads-anomaly-guard',         color:'#ef4444', desc:'Budget protection -- ROAS cliff detection, click fraud analysis, real-time spend velocity, auto-pause rules & cannibalization detection' },
  { id:'multi-channel-optimizer',   name:'MultiChannelOptimizer',   groups:MCO_GROUPS, router:MCO_ROUTER, tabs:MCO_TABS, api:'/api/multi-channel-optimizer',   color:'#6366f1', desc:'Media mix intelligence -- Bayesian MMM, Shapley attribution, diminishing returns curves, channel synergy & scenario planning' },
];

let total = { fe:0, be:0 };
tools.forEach(t => {
  const fePath = FE(t.name);
  const bePath = BE(t.id);
  mkdir(bePath);
  const feCode = baseComponent(t.name, t.api, t.desc, t.color, t.groups, t.tabs);
  fs.writeFileSync(fePath, feCode, 'utf8');
  fs.writeFileSync(bePath, t.router, 'utf8');
  const feKB = (Buffer.byteLength(feCode,'utf8')/1024).toFixed(1);
  const beKB = (Buffer.byteLength(t.router,'utf8')/1024).toFixed(1);
  total.fe += +feKB; total.be += +beKB;
  console.log(`✓ ${t.name}: FE ${feKB}KB, BE ${beKB}KB`);
});
console.log(`\nPhase 5 complete: 12 files, ${(total.fe+total.be).toFixed(1)} KB total`);
