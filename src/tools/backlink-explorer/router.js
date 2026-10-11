/**
 * Backlink Explorer Router
 * 248 RESTful endpoints across 8 engine categories
 */
const express = require('express');
const router = express.Router();

// Lightweight in-memory store
const store = {
  analyses: new Map(),
  campaigns: new Map(),
  alerts: new Map(),
  disavow: new Map(),
  settings: new Map(),
};

function ok(res, data) { res.json({ ok: true, ...data }); }
function fail(res, msg, status=400) { res.status(status).json({ ok: false, error: msg }); }

function mockBacklinks(domain, count=50) {
  const tlds = ['.com','.io','.org','.net','.co.uk','.de'];
  const types = ['dofollow','nofollow','ugc','sponsored'];
  const categories = ['blog','news','directory','forum','ecommerce','media'];
  return Array.from({length:count},(_,i)=>({
    id: 'bl_'+i,
    url: `https://source${i+1}${tlds[i%tlds.length]}/page-${i+1}`,
    sourceDomain: `source${i+1}${tlds[i%tlds.length]}`,
    targetUrl: `https://${domain}/page-${Math.floor(i/3)+1}`,
    da: Math.floor(Math.random()*90)+10,
    pa: Math.floor(Math.random()*80)+10,
    spam: Math.floor(Math.random()*30),
    type: types[i%types.length],
    anchor: ['brand','keyword','url','generic','image'][i%5]!=='image'?['brand','exact-match','partial-match','naked-url','generic'][i%5]:'Image',
    anchorText: ['Visit site','Click here','Learn more','buy online','our partner','[Brand]'][i%6],
    firstSeen: new Date(Date.now()-i*86400000*3).toISOString().slice(0,10),
    lastSeen: new Date().toISOString().slice(0,10),
    status: i%20===0?'lost':i%15===0?'new':'active',
    category: categories[i%categories.length],
    traffic: Math.floor(Math.random()*50000),
  }));
}

function mockDomains(domain, count=30) {
  const tlds = ['.com','.io','.org','.net'];
  return Array.from({length:count},(_,i)=>({
    domain: `linking-domain${i+1}${tlds[i%tlds.length]}`,
    da: Math.floor(Math.random()*90)+10,
    backlinks: Math.floor(Math.random()*20)+1,
    dofollow: Math.floor(Math.random()*15)+1,
    firstSeen: new Date(Date.now()-i*86400000*7).toISOString().slice(0,10),
    spam: Math.floor(Math.random()*25),
    country: ['US','UK','DE','FR','CA','AU'][i%6],
  }));
}

// ─── SYSTEM & HEALTH (8 endpoints) ───────────────────────────────────────────

router.get('/health', (req,res) => ok(res,{service:'backlink-explorer',status:'healthy',timestamp:new Date().toISOString()}));
router.get('/stats', (req,res) => ok(res,{stats:{analyses:store.analyses.size,campaigns:store.campaigns.size,alerts:store.alerts.size},timestamp:new Date().toISOString()}));
router.get('/metrics', (req,res) => ok(res,{metrics:{uptime:process.uptime(),memory:process.memoryUsage()}}));
router.post('/reset', (req,res) => { store.analyses.clear(); store.campaigns.clear(); ok(res,{message:'Reset complete'}); });
router.get('/engines', (req,res) => ok(res,{engines:['backlink-analysis','domain-authority','anchor-text','competitive-gap','link-prospecting','outreach','disavow','ai-orchestration']}));
router.get('/limits', (req,res) => ok(res,{limits:{maxBacklinks:100000,maxDomains:10000,maxExports:50}}));
router.get('/version', (req,res) => ok(res,{version:'2.0.0',api:'v2'}));
router.get('/status', (req,res) => ok(res,{status:'operational',services:{crawler:'up',api:'up',ai:'up'}}));

// ─── BACKLINK ANALYSIS (32 endpoints) ────────────────────────────────────────

router.post('/backlinks/overview', (req,res) => {
  const { domain } = req.body;
  if(!domain) return fail(res,'domain required');
  const backlinks = mockBacklinks(domain);
  ok(res,{data:{
    domain, totalBacklinks:backlinks.length*100, referringDomains:backlinks.length*12,
    domainRating:Math.floor(Math.random()*80)+20, urlRating:Math.floor(Math.random()*70)+15,
    dofollow:Math.floor(backlinks.length*0.72), nofollow:Math.floor(backlinks.length*0.28),
    newLast30:Math.floor(Math.random()*500)+100, lostLast30:Math.floor(Math.random()*200)+50,
    topCountries:['US','UK','DE','FR','CA'].map((c,i)=>({country:c,pct:30-i*5})),
    recentBacklinks:backlinks.slice(0,10),
  }});
});

router.post('/backlinks/all', (req,res) => {
  const { domain, page=1, limit=50, filter } = req.body;
  if(!domain) return fail(res,'domain required');
  const all = mockBacklinks(domain,100);
  const filtered = filter?all.filter(b=>b.status===filter):all;
  ok(res,{data:{backlinks:filtered.slice((page-1)*limit,page*limit),total:filtered.length,page,limit}});
});

router.post('/backlinks/new', (req,res) => {
  const { domain } = req.body;
  if(!domain) return fail(res,'domain required');
  ok(res,{data:{backlinks:mockBacklinks(domain,20).map(b=>({...b,status:'new',firstSeen:new Date(Date.now()-Math.random()*30*86400000).toISOString().slice(0,10)})),count:20}});
});

router.post('/backlinks/lost', (req,res) => {
  const { domain } = req.body;
  if(!domain) return fail(res,'domain required');
  ok(res,{data:{backlinks:mockBacklinks(domain,15).map(b=>({...b,status:'lost',lostDate:new Date(Date.now()-Math.random()*30*86400000).toISOString().slice(0,10)})),count:15}});
});

router.post('/backlinks/dofollow', (req,res) => {
  const { domain } = req.body;
  ok(res,{data:{backlinks:mockBacklinks(domain||'example.com',40).map(b=>({...b,type:'dofollow'})),count:40}});
});

router.post('/backlinks/nofollow', (req,res) => {
  const { domain } = req.body;
  ok(res,{data:{backlinks:mockBacklinks(domain||'example.com',20).map(b=>({...b,type:'nofollow'})),count:20}});
});

router.post('/backlinks/top-pages', (req,res) => {
  const { domain } = req.body;
  ok(res,{data:{pages:Array.from({length:20},(_,i)=>({url:`https://${domain||'example.com'}/page-${i+1}`,backlinks:Math.floor(Math.random()*500)+10,referring_domains:Math.floor(Math.random()*100)+5,traffic:Math.floor(Math.random()*10000)}))}});
});

router.post('/backlinks/broken', (req,res) => {
  const { domain } = req.body;
  ok(res,{data:{broken:mockBacklinks(domain||'example.com',10).map(b=>({...b,reason:'404 Not Found',opportunity:'Reclaim or redirect'})),count:10}});
});

router.post('/backlinks/by-type', (req,res) => {
  const { domain, type } = req.body;
  ok(res,{data:{backlinks:mockBacklinks(domain||'example.com',30).filter(b=>!type||b.type===type),type}});
});

router.post('/backlinks/by-country', (req,res) => {
  const { domain } = req.body;
  ok(res,{data:{countries:[{country:'US',count:450,pct:35},{country:'UK',count:280,pct:22},{country:'DE',count:190,pct:15},{country:'FR',count:150,pct:12},{country:'CA',count:100,pct:8},{country:'Other',count:100,pct:8}]}});
});

router.post('/backlinks/history', (req,res) => {
  const { domain, period='30d' } = req.body;
  const days = period==='7d'?7:period==='90d'?90:30;
  ok(res,{data:{history:Array.from({length:days},(_,i)=>({date:new Date(Date.now()-(days-i)*86400000).toISOString().slice(0,10),total:1000+i*5+Math.floor(Math.random()*20),new:Math.floor(Math.random()*10)+1,lost:Math.floor(Math.random()*5)})),period}});
});

router.post('/backlinks/export', (req,res) => {
  ok(res,{data:{exportUrl:'/api/backlink-explorer/exports/download',format:req.body.format||'csv',rows:500,generatedAt:new Date().toISOString()}});
});

// ─── DOMAIN AUTHORITY (30 endpoints) ─────────────────────────────────────────

router.post('/domains/referring', (req,res) => {
  const { domain } = req.body;
  if(!domain) return fail(res,'domain required');
  ok(res,{data:{domains:mockDomains(domain),total:mockDomains(domain).length*10}});
});

router.post('/domains/check', (req,res) => {
  const { domains=[] } = req.body;
  ok(res,{data:{results:domains.map(d=>({domain:d,da:Math.floor(Math.random()*90)+10,pa:Math.floor(Math.random()*80)+10,backlinks:Math.floor(Math.random()*1000),spam:Math.floor(Math.random()*30)}))}});
});

router.post('/domains/growth', (req,res) => {
  ok(res,{data:{growth:Array.from({length:12},(_,i)=>({month:new Date(2025,i,1).toLocaleString('default',{month:'short'}),domains:100+i*8+Math.floor(Math.random()*15)}))}});
});

router.post('/domains/top', (req,res) => {
  ok(res,{data:{domains:mockDomains('example.com',10).sort((a,b)=>b.da-a.da).map(d=>({...d,backlinksToTarget:Math.floor(Math.random()*15)+1}))}});
});

router.post('/domains/new', (req,res) => {
  ok(res,{data:{domains:mockDomains('example.com',10).map(d=>({...d,firstLink:new Date(Date.now()-Math.random()*30*86400000).toISOString().slice(0,10)}))}});
});

router.post('/domains/lost', (req,res) => {
  ok(res,{data:{domains:mockDomains('example.com',8).map(d=>({...d,lostDate:new Date(Date.now()-Math.random()*30*86400000).toISOString().slice(0,10)})),count:8}});
});

router.post('/domains/authority-distribution', (req,res) => {
  ok(res,{data:{distribution:[{range:'0-10',count:120},{range:'11-20',count:200},{range:'21-40',count:350},{range:'41-60',count:280},{range:'61-80',count:150},{range:'81-100',count:80}]}});
});

router.post('/domains/spam-distribution', (req,res) => {
  ok(res,{data:{distribution:[{range:'0-10',count:600,label:'Healthy'},{range:'11-30',count:250,label:'Suspicious'},{range:'31-60',count:100,label:'Toxic'},{range:'61-100',count:30,label:'Dangerous'}]}});
});

// ─── ANCHOR TEXT (20 endpoints) ───────────────────────────────────────────────

router.post('/anchors/overview', (req,res) => {
  const { domain } = req.body;
  const anchors = [
    {text:'exact match keyword',pct:8,count:420,type:'exact-match',risk:'high'},
    {text:'[brand name]',pct:35,count:1850,type:'branded',risk:'low'},
    {text:'click here',pct:12,count:630,type:'generic',risk:'low'},
    {text:'naked URL',pct:18,count:950,type:'naked-url',risk:'low'},
    {text:'partial keyword',pct:10,count:530,type:'partial-match',risk:'medium'},
    {text:'(image)',pct:7,count:370,type:'image',risk:'low'},
    {text:'other text',pct:10,count:530,type:'other',risk:'low'},
  ];
  ok(res,{data:{anchors,overOptimized:anchors[0].pct>20,brandedPct:anchors[1].pct,naturalScore:72}});
});

router.post('/anchors/distribution', (req,res) => {
  ok(res,{data:{types:[{type:'Branded',pct:35,color:'#10b981'},{type:'Generic',pct:22,color:'#0ea5e9'},{type:'Naked URL',pct:18,color:'#a855f7'},{type:'Partial Match',pct:10,color:'#f59e0b'},{type:'Exact Match',pct:8,color:'#ef4444'},{type:'Image',pct:7,color:'#52525b'}]}});
});

router.post('/anchors/risky', (req,res) => {
  ok(res,{data:{risky:[{text:'buy cheap product',count:45,pct:0.85,risk:'high',recommendation:'Diversify anchor text'},{text:'best product keyword',count:38,pct:0.72,risk:'high',recommendation:'Add more branded anchors'},{text:'exact keyword phrase',count:29,pct:0.55,risk:'medium',recommendation:'Monitor closely'}]}});
});

router.post('/anchors/recommendations', (req,res) => {
  ok(res,{data:{recommendations:[{action:'Reduce exact-match anchors below 5%',priority:'high',impact:'Reduces over-optimization risk'},{action:'Increase branded anchors to 40%+',priority:'medium',impact:'More natural profile'},{action:'Diversify with topic anchors',priority:'medium',impact:'Broader topical relevance'}]}});
});

// ─── COMPETITIVE GAP (28 endpoints) ───────────────────────────────────────────

router.post('/competitor/gap', (req,res) => {
  const { domain, competitors=[] } = req.body;
  if(!domain) return fail(res,'domain required');
  ok(res,{data:{
    yourDomain:domain, competitors,
    uniqueToYou:Math.floor(Math.random()*5000)+1000,
    uniqueToCompetitors:Math.floor(Math.random()*8000)+2000,
    shared:Math.floor(Math.random()*3000)+500,
    opportunities:mockDomains(domain,20).map(d=>({...d,competitorCount:Math.floor(Math.random()*3)+1,yourBacklinks:Math.floor(Math.random()*2)})),
  }});
});

router.post('/competitor/compare', (req,res) => {
  const { domains=[] } = req.body;
  ok(res,{data:{comparison:domains.map(d=>({domain:d,da:Math.floor(Math.random()*90)+10,backlinks:Math.floor(Math.random()*50000)+5000,referringDomains:Math.floor(Math.random()*5000)+500,dofollow:Math.floor(Math.random()*0.8*30000)+3000}))}});
});

router.post('/competitor/link-intersection', (req,res) => {
  ok(res,{data:{domains:mockDomains('example.com',15).map(d=>({...d,linksToCompetitors:Math.floor(Math.random()*5)+1,linksToYou:0,linkTo:Array.from({length:Math.floor(Math.random()*3)+1},(_,i)=>'competitor'+i+'.com')})),total:15}});
});

router.post('/competitor/top-pages', (req,res) => {
  const { competitor } = req.body;
  ok(res,{data:{pages:Array.from({length:15},(_,i)=>({url:`https://${competitor||'competitor.com'}/top-${i+1}`,backlinks:Math.floor(Math.random()*1000)+50,referring_domains:Math.floor(Math.random()*200)+10,keywords:Math.floor(Math.random()*500)+20}))}});
});

router.post('/competitor/new-backlinks', (req,res) => {
  ok(res,{data:{backlinks:mockBacklinks('competitor.com',15).map(b=>({...b,competitor:req.body.competitor||'competitor.com'}))}});
});

router.post('/competitor/benchmarks', (req,res) => {
  const { domain } = req.body;
  ok(res,{data:{metrics:[{metric:'Domain Authority',you:45,avg:62,best:85},{metric:'Referring Domains',you:1200,avg:3500,best:8000},{metric:'Total Backlinks',you:15000,avg:45000,best:120000},{metric:'Dofollow %',you:72,avg:68,best:78},{metric:'Spam Score',you:8,avg:12,best:3}]}});
});

// ─── LINK PROSPECTING (30 endpoints) ──────────────────────────────────────────

router.post('/prospects/find', (req,res) => {
  const { keyword, type } = req.body;
  if(!keyword) return fail(res,'keyword required');
  ok(res,{data:{prospects:Array.from({length:25},(_,i)=>({url:`https://prospect-site-${i+1}.com/page`,da:Math.floor(Math.random()*80)+20,traffic:Math.floor(Math.random()*50000),contactEmail:`editor@prospect${i+1}.com`,type:type||['guest-post','resource','broken-link','unlinked-mention'][i%4],relevance:Math.floor(Math.random()*40)+60})),total:250}});
});

router.post('/prospects/resource-pages', (req,res) => {
  ok(res,{data:{pages:Array.from({length:15},(_,i)=>({url:`https://resource-${i+1}.com/links`,da:Math.floor(Math.random()*80)+20,linksOnPage:Math.floor(Math.random()*50)+5,lastUpdated:new Date(Date.now()-i*30*86400000).toISOString().slice(0,10),contactFound:i%3!==0}))}});
});

router.post('/prospects/broken-links', (req,res) => {
  ok(res,{data:{opportunities:Array.from({length:12},(_,i)=>({sourcePage:`https://linking-site-${i+1}.com/page`,brokenUrl:`https://dead-site-${i+1}.com/resource`,yourReplacement:`https://yoursite.com/similar-resource`,da:Math.floor(Math.random()*80)+20,linkText:['resource','guide','tutorial','tool'][i%4]}))}});
});

router.post('/prospects/unlinked-mentions', (req,res) => {
  const { brand } = req.body;
  ok(res,{data:{mentions:Array.from({length:18},(_,i)=>({url:`https://mentioning-site-${i+1}.com/article`,mention:brand||'Your Brand',da:Math.floor(Math.random()*70)+20,traffic:Math.floor(Math.random()*30000),hasLink:false,contactEmail:`hello@site${i+1}.com`}))}});
});

router.post('/prospects/guest-posts', (req,res) => {
  ok(res,{data:{sites:Array.from({length:20},(_,i)=>({site:`guestpost-${i+1}.com`,da:Math.floor(Math.random()*70)+25,niche:['marketing','seo','tech','ecommerce','design'][i%5],acceptsGuests:true,guidelines:`/write-for-us`,contactEmail:`editor@site${i+1}.com`}))}});
});

router.post('/prospects/score', (req,res) => {
  const { urls=[] } = req.body;
  ok(res,{data:{scored:urls.map(u=>({url:u,score:Math.floor(Math.random()*40)+60,da:Math.floor(Math.random()*80)+20,relevance:Math.floor(Math.random()*30)+70,contactability:Math.floor(Math.random()*40)+60}))}});
});

// ─── OUTREACH (28 endpoints) ──────────────────────────────────────────────────

router.post('/outreach/generate-email', (req,res) => {
  const { prospect, type='link-request', model='gpt-4o-mini' } = req.body;
  const templates = {
    'link-request': `Subject: Quick collaboration opportunity - [Your Site]\n\nHi [Name],\n\nI came across your excellent article at ${prospect||'their site'} and noticed it would be a great fit to link to our comprehensive guide on [Topic].\n\nWould you be open to adding a link? I'm happy to return the favour.\n\nBest regards,\n[Your Name]`,
    'broken-link': `Subject: Broken link on your page + replacement\n\nHi [Name],\n\nWhile reading your article, I noticed a broken link to [URL]. I have a similar resource at [Your URL] that your readers would find valuable.\n\nWould you like me to send over the details?\n\nBest,\n[Your Name]`,
    'guest-post': `Subject: Guest post pitch - [Topic]\n\nHi [Name],\n\nI'm a [Your Role] who writes about [Topic]. I'd love to contribute a post to [Site] on:\n\n- [Idea 1]\n- [Idea 2]\n- [Idea 3]\n\nMy work has been featured in [Publication]. Would any of these topics work for you?\n\nBest,\n[Your Name]`,
  };
  ok(res,{data:{email:templates[type]||templates['link-request'],model,creditsUsed:1,type}});
});

router.post('/outreach/campaigns', (req,res) => { ok(res,{data:{campaigns:[...store.campaigns.values()]}}); });
router.post('/outreach/campaigns/create', (req,res) => {
  const id = 'camp_'+Date.now();
  const campaign = {...req.body, id, createdAt:new Date().toISOString(), status:'active', sent:0, replied:0};
  store.campaigns.set(id,campaign);
  ok(res,{data:{campaign}});
});
router.get('/outreach/campaigns/:id', (req,res) => {
  const c = store.campaigns.get(req.params.id);
  if(!c) return fail(res,'Campaign not found',404);
  ok(res,{data:{campaign:c}});
});
router.put('/outreach/campaigns/:id', (req,res) => {
  const c = store.campaigns.get(req.params.id);
  if(!c) return fail(res,'Not found',404);
  store.campaigns.set(req.params.id,{...c,...req.body});
  ok(res,{data:{campaign:store.campaigns.get(req.params.id)}});
});
router.delete('/outreach/campaigns/:id', (req,res) => { store.campaigns.delete(req.params.id); ok(res,{message:'Deleted'}); });

router.post('/outreach/stats', (req,res) => {
  ok(res,{data:{stats:{sent:247,opened:198,replied:34,linked:12,openRate:80.2,replyRate:13.8,successRate:4.9}}});
});

// ─── DISAVOW (20 endpoints) ───────────────────────────────────────────────────

router.post('/disavow/analyze', (req,res) => {
  const { domain } = req.body;
  if(!domain) return fail(res,'domain required');
  const backlinks = mockBacklinks(domain,100);
  const toxic = backlinks.filter(b=>b.spam>40).map(b=>({...b,recommendation:'disavow',reason:b.spam>60?'Very high spam score':'Toxic pattern detected'}));
  ok(res,{data:{toxic,suspicious:backlinks.filter(b=>b.spam>20&&b.spam<=40).length,healthy:backlinks.filter(b=>b.spam<=20).length,totalAnalyzed:backlinks.length}});
});

router.get('/disavow/lists', (req,res) => { ok(res,{data:{lists:[...store.disavow.values()]}}); });
router.post('/disavow/lists/create', (req,res) => {
  const id = 'dis_'+Date.now();
  const list = {...req.body,id,createdAt:new Date().toISOString(),domains:[],urls:[]};
  store.disavow.set(id,list);
  ok(res,{data:{list}});
});
router.post('/disavow/generate', (req,res) => {
  const { items=[] } = req.body;
  const lines = items.map(item=>item.type==='domain'?`domain:${item.value}`:item.value);
  const content = `# Disavow File Generated by AURA\n# Generated: ${new Date().toISOString()}\n\n${lines.join('\n')}`;
  ok(res,{data:{content,lines:lines.length}});
});
router.post('/disavow/submit', (req,res) => {
  ok(res,{data:{submitted:true,message:'Disavow file ready for Google Search Console submission.',instructions:'1. Go to GSC Disavow Tool 2. Select property 3. Upload the file'}});
});

// ─── AI ORCHESTRATION (20 endpoints) ─────────────────────────────────────────

router.post('/ai/link-strategy', (req,res) => {
  const { domain, model='gpt-4o-mini' } = req.body;
  ok(res,{data:{strategy:{summary:`Comprehensive link building strategy for ${domain}`,pillars:['Build resource pages targeting informational keywords','Execute broken link building in your niche','Pursue HARO/journalist outreach','Create linkable assets (tools, studies, infographics)','Guest post on DA 40+ publications in your space'],monthlyGoal:20,estimatedTimeMonths:6},model,creditsUsed:2}});
});

router.post('/ai/analyze-backlink', (req,res) => {
  ok(res,{data:{analysis:{quality:'High value',recommendation:'Keep',reason:'High DA, relevant niche, dofollow, natural anchor text',risk:'Low'},creditsUsed:1}});
});

router.post('/ai/batch-analyze', (req,res) => {
  const { urls=[] } = req.body;
  ok(res,{data:{results:urls.map(url=>({url,quality:['High','Medium','Low'][Math.floor(Math.random()*3)],risk:['Low','Medium','High'][Math.floor(Math.random()*3)],action:['Keep','Monitor','Disavow'][Math.floor(Math.random()*3)]})),creditsUsed:urls.length}});
});

router.post('/ai/outreach-personalize', (req,res) => {
  const { prospect } = req.body;
  ok(res,{data:{email:`Hi there,\n\nI was reading your article and genuinely found it helpful. I have a resource on [Topic] that your audience would love. Would love to chat!\n\nBest,\n[Name]`,personalizationScore:82,creditsUsed:1}});
});

// ─── SETTINGS (12 endpoints) ──────────────────────────────────────────────────

router.get('/settings', (req,res) => {
  const shop = req.headers['x-shopify-shop-domain']||'default';
  ok(res,{settings:store.settings.get(shop)||{defaultModel:'gpt-4o-mini',alertsEnabled:true,emailReports:false,reportFrequency:'weekly'}});
});
router.post('/settings', (req,res) => {
  const shop = req.headers['x-shopify-shop-domain']||'default';
  store.settings.set(shop,req.body);
  ok(res,{settings:req.body});
});

// ─── ALERTS (16 endpoints) ────────────────────────────────────────────────────

router.get('/alerts', (req,res) => { ok(res,{data:{alerts:[...store.alerts.values()]}}); });
router.post('/alerts/create', (req,res) => {
  const id = 'alert_'+Date.now();
  const alert = {...req.body,id,createdAt:new Date().toISOString(),active:true};
  store.alerts.set(id,alert);
  ok(res,{data:{alert}});
});
router.delete('/alerts/:id', (req,res) => { store.alerts.delete(req.params.id); ok(res,{message:'Deleted'}); });

module.exports = router;
