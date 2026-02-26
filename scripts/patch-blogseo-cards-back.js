/**
 * Patch BlogSEO.jsx - patches 1-6 that were not applied (first script exited before writing)
 * Usage: node scripts/patch-blogseo-cards-back.js
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../aura-console/src/components/tools/BlogSEO.jsx');
const rawSrc = fs.readFileSync(FILE, 'utf8');
const hasCRLF = rawSrc.includes('\r\n');
let src = hasCRLF ? rawSrc.replace(/\r\n/g, '\n') : rawSrc;

function bodyExpr(fields) {
  return JSON.stringify(fields)
    .replace(/"__URL__"/g, 'url')
    .replace(/"__CONTENT__"/g, 'content')
    .replace(/"__KEYWORD__"/g, 'keyword')
    .replace(/"__SHOP__"/g, 'shopDomain')
    .replace(/"__COMPETITOR__"/g, 'competitorInput')
    .replace(/"__PUBLISHDATE__"/g, 'publishDate')
    .replace(/"__TITLEINPUT__"/g, 'titleInput')
    .replace(/"__DESCINPUT__"/g, 'descInput')
    .replace(/"__VARIANTA__"/g, 'variantA')
    .replace(/"__VARIANTB__"/g, 'variantB')
    .replace(/"__ENTITYNAME__"/g, 'entityNameInput')
    .replace(/"__PERSONNAME__"/g, 'personNameInput')
    .replace(/"__LOCALLOCATION__"/g, 'localLocation')
    .replace(/"__AUTHORNAME__"/g, 'authorName')
    .replace(/"__AUTHOREXPERTISE__"/g, 'authorExpertise')
    .replace(/:"__CONTENTLENGTH__"/g, ':Number(contentLengthNum)')
    .replace(/:"__BULKURLS__"/g, ":bulkUrlsText.split('\\\\n').filter(Boolean)")
    .replace(/:"keyword"/g, ':keyword');
}

function card(key, emoji, label, route, fields, extraInputs) {
  const body = bodyExpr(fields);
  const inp = extraInputs || '';
  return `            <div style={S.card}><div style={{...S.row,alignItems:'center',marginBottom:6}}><div style={{...S.cardTitle,marginBottom:0}}>${emoji} ${label}</div><button style={{...S.btn(),marginLeft:'auto'}} disabled={xLoad['${key}']} onClick={async()=>{setXLoad(p=>({...p,'${key}':true}));try{const d=await apiFetchJSON(\`\${API}/${route}\`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(${body})});setXRes(p=>({...p,'${key}':d}));}catch(e){setXRes(p=>({...p,'${key}':{error:e.message}}));}setXLoad(p=>({...p,'${key}':false}));}}>{xLoad['${key}']?'Running\u2026':'Run'}</button></div>${inp}{xRes['${key}']&&<div style={{...S.result,marginTop:6,fontSize:12}}>{xRes['${key}'].error?<span style={{color:'#f87171'}}>{xRes['${key}'].error}</span>:<pre style={{margin:0,whiteSpace:'pre-wrap',maxHeight:200,overflow:'auto'}}>{JSON.stringify(xRes['${key}'],null,2)}</pre>}</div>}</div>`;
}

const iUrl   = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="URL..." value={url} onChange={e=>setUrl(e.target.value)}/>`;
const iKw    = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Keyword..." value={keyword} onChange={e=>setKeyword(e.target.value)}/>`;
const iCont  = `<textarea style={{...S.input,height:54,resize:'vertical',marginBottom:4,fontSize:12}} placeholder="Content..." value={content} onChange={e=>setContent(e.target.value)}/>`;
const iComp  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Competitor domain..." value={competitorInput} onChange={e=>setCompetitorInput(e.target.value)}/>`;
const iPub   = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Publish date (YYYY-MM-DD)..." value={publishDate} onChange={e=>setPublishDate(e.target.value)}/>`;
const iTitle = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Title..." value={titleInput} onChange={e=>setTitleInput(e.target.value)}/>`;
const iDesc  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Meta description..." value={descInput} onChange={e=>setDescInput(e.target.value)}/>`;
const iBulk  = `<textarea style={{...S.input,height:54,resize:'vertical',marginBottom:4,fontSize:12}} placeholder="URLs (one per line)..." value={bulkUrlsText} onChange={e=>setBulkUrlsText(e.target.value)}/>`;
const iEnt   = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Entity name..." value={entityNameInput} onChange={e=>setEntityNameInput(e.target.value)}/>`;
const iPers  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Person name..." value={personNameInput} onChange={e=>setPersonNameInput(e.target.value)}/>`;
const iCLen  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Content length (words)..." value={contentLengthNum} onChange={e=>setContentLengthNum(e.target.value)}/>`;

const analyzerCards = [
  card('x_analyze',        '\uD83D\uDD0D','Full SEO Analyze',         'analyze',                     {url:'__URL__',content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_aianalyze',      '\uD83E\uDD16','AI SEO Analyze',            'ai/analyze',                  {url:'__URL__',content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_bulkanalyze',    '\uD83D\uDCE6','Bulk Analyze',              'bulk-analyze',                {urls:'__BULKURLS__',domain:'__SHOP__',shop:'__SHOP__'}, iBulk),
  card('x_metadescopt',    '\uD83D\uDCDD','Meta Desc Optimizer',       'meta-description-optimizer',  {url:'__URL__',shop:'__SHOP__'}),
  card('x_contentdecay',   '\uD83D\uDCC9','Content Decay',             'content-decay',               {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_competitorgap',  '\uD83D\uDD00','Competitor Gap',            'competitor-gap',              {domain:'__SHOP__',competitor:'__COMPETITOR__',shop:'__SHOP__'}, iComp),
  card('x_cannibal',       '\uD83D\uDD01','Cannibalization',           'cannibalization',             {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_anchortextaudit','\u2693','Anchor Text Audit',      'anchor-text-audit',           {url:'__URL__',shop:'__SHOP__'}),
  card('x_tocgen',         '\uD83D\uDCCB','TOC Generator',             'toc-generator',               {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_sectionwc',      '\uD83D\uDD22','Section Word Count',        'section-word-count',          {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_paa',            '\u2753','People Also Ask',        'people-also-ask',             {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_entitydetect',   '\uD83E\uDDE0','Entity Detection',          'entity-detection',            {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_serpfeatures',   '\uD83C\uDF1F','SERP Features',             'serp-features',               {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_passageindex',   '\uD83D\uDCD1','Passage Indexing',          'passage-indexing',            {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_topicalauth',    '\uD83C\uDFC6','Topical Authority',         'topical-authority',           {domain:'__SHOP__',niche:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aiovereq',       '\u2728','AI Overview Eligibility', 'ai-overview-eligibility',     {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_intentclass',    '\uD83C\uDFAF','Intent Classifier',         'intent-classifier',           {keyword:'__KEYWORD__',shop:'__SHOP__'}),
].join('\n');

const keywordsCards = [
  card('x_kwlsi',      '\uD83D\uDD17','LSI Keywords',           'keywords/lsi',                     {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_kwprom',     '\uD83D\uDCCA','Keyword Prominence',     'keywords/prominence',              {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_kwtfidf',    '\uD83D\uDCC8','TF-IDF Analysis',        'keywords/tfidf',                   {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_kwcooc',     '\uD83E\uDD1D','Co-occurrence',          'keywords/co-occurrence',           {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_kwsec',      '\uD83D\uDD11','Secondary Keywords',     'keywords/secondary',               {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_kwvoice',    '\uD83C\uDFA4','Voice Search Keywords',  'keywords/voice-search',            {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_kwneg',      '\uD83D\uDEAB','Negative Keyword Check', 'keywords/negative-check',         {keywords:[],content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_kwfeat',     '\u2B50','Featured Snippet KW',    'keywords/featured-snippet',        {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_kwlowdiff',  '\uD83C\uDFAF','Low Difficulty Finder',  'keywords/low-difficulty-finder',   {topic:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_kwcannibal', '\uD83D\uDD01','Cannibalization Detector','keywords/cannibalization-detector',{domain:'__SHOP__',shop:'__SHOP__'}),
].join('\n');

const contentPlusCards = [
  card('x_cread',     '\uD83D\uDCD6','Advanced Readability',    'content/advanced-readability',     {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_csentence', '\u270D\uFE0F','Sentence Variety',        'content/sentence-variety',         {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_cemotional','\uD83D\uDCA1','Emotional Tone',          'content/emotional-tone',           {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_cjargon',   '\uD83D\uDD0D','Jargon Detector',         'content/jargon-detector',          {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_cexpert',   '\uD83C\uDF93','Expertise Signals',       'content/expertise-signals',        {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_cmultimed', '\uD83D\uDDBC\uFE0F','Multimedia Score',  'content/multimedia-score',         {content:'__CONTENT__',url:'__URL__',shop:'__SHOP__'}),
  card('x_cquestions','\u2753','Questions Count',        'content/questions-count',          {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_cintro',    '\uD83D\uDE80','Intro Quality',           'content/intro-quality',            {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_ccta',      '\uD83D\uDCE3','CTA Audit',               'content/cta-audit',                {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_cformat',   '\uD83C\uDFA8','Formatting Score',        'content/formatting-score',         {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_cthin',     '\uD83D\uDCC9','Thin Content',            'content/thin-content',             {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_cfresh',    '\uD83D\uDCC5','Freshness Score',         'content/freshness-score',          {url:'__URL__',publishDate:'__PUBLISHDATE__',shop:'__SHOP__'}, iPub),
  card('x_cskyscraper','\uD83C\uDFD7\uFE0F','Skyscraper Gap',  'content/skyscraper-gap',           {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_crelaunch', '\uD83D\uDD04','Relaunch Advisor',        'content/relaunch-advisor',         {url:'__URL__',shop:'__SHOP__'}),
  card('x_csemantic', '\uD83E\uDDE0','Semantic Enrichment',     'content/semantic-enrichment',      {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_ctopicclus','\uD83C\uDF10','Topic Cluster Builder',   'content/topic-cluster-builder',    {topic:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_cvisual',   '\uD83C\uDFAD','Visual Diversity',        'content/visual-diversity',         {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_ctimevalue','\u23F1\uFE0F','Time to Value',           'content/time-to-value',            {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_cpruning',  '\u2702\uFE0F','Content Pruning',         'content/content-pruning',          {url:'__URL__',shop:'__SHOP__'}),
].join('\n');

const technicalPlusCards = [
  card('x_techaudit',   '\uD83D\uDD27','Technical Audit',           'technical/audit',                   {url:'__URL__',shop:'__SHOP__'}),
  card('x_techurlana',  '\uD83D\uDD17','URL Analysis',              'technical/url-analysis',            {url:'__URL__',shop:'__SHOP__'}),
  card('x_techmobile',  '\uD83D\uDCF1','Mobile SEO',                'technical/mobile-seo',              {url:'__URL__',shop:'__SHOP__'}),
  card('x_techhref',    '\uD83C\uDF0D','Hreflang Check',            'technical/hreflang',                {url:'__URL__',shop:'__SHOP__'}),
  card('x_techamp',     '\u26A1','AMP Check',                 'technical/amp-check',               {url:'__URL__',shop:'__SHOP__'}),
  card('x_techresource','\uD83D\uDE80','Resource Hints',            'technical/resource-hints',          {url:'__URL__',shop:'__SHOP__'}),
  card('x_techjsonld',  '\uD83D\uDCCB','JSON-LD Lint',              'technical/json-ld-lint',            {url:'__URL__',shop:'__SHOP__'}),
  card('x_techogimg',   '\uD83D\uDDBC\uFE0F','OG Image Dims',       'technical/og-image-dims',           {url:'__URL__',shop:'__SHOP__'}),
  card('x_techhttps',   '\uD83D\uDD12','HTTPS Status',              'technical/https-status',            {url:'__URL__',shop:'__SHOP__'}),
  card('x_techread',    '\uD83D\uDCDA','Reading Level',             'technical/reading-level',           {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_techtfidf',   '\uD83D\uDCCA','TF-IDF Analyzer',          'technical/tfidf-analyzer',          {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_techclen',    '\uD83D\uDCCF','Content Length Advisor',    'technical/content-length-advisor',  {keyword:'__KEYWORD__',contentLength:'__CONTENTLENGTH__',shop:'__SHOP__'}, iCLen),
  card('x_techcwv',     '\u26A1','CWV Advisor',               'technical/cwv-advisor',             {url:'__URL__',shop:'__SHOP__'}),
  card('x_techpagespd', '\uD83C\uDFCE\uFE0F','Page Speed Advisor',  'technical/page-speed-advisor',      {url:'__URL__',shop:'__SHOP__'}),
  card('x_techcrawlbdg','\uD83D\uDD77\uFE0F','Crawl Budget',        'technical/crawl-budget',            {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_techclickdep','\uD83D\uDCCD','Click Depth',              'technical/click-depth',             {url:'__URL__',shop:'__SHOP__'}),
  card('x_techlogfile', '\uD83D\uDCC2','Log File Analysis',         'technical/log-file',                {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_techintl',    '\uD83C\uDF10','International SEO',         'technical/international-seo',       {url:'__URL__',shop:'__SHOP__'}),
  card('x_techgnews',   '\uD83D\uDCF0','Google News Check',         'technical/google-news',             {url:'__URL__',shop:'__SHOP__'}),
  card('x_cwv',         '\u26A1','Core Web Vitals',          'core-web-vitals',                   {url:'__URL__',shop:'__SHOP__'}),
  card('x_crawleracc',  '\uD83D\uDD77\uFE0F','Crawler Access',      'crawler-access',                    {url:'__URL__',shop:'__SHOP__'}),
  card('x_titleh1',     '\uD83D\uDD24','Title H1 Alignment',        'title-h1-alignment',                {url:'__URL__',shop:'__SHOP__'}),
  card('x_headingh',    '\uD83D\uDCCB','Heading Hierarchy',         'heading-hierarchy',                 {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_imageseo',    '\uD83D\uDDBC\uFE0F','Image SEO',           'image-seo',                         {url:'__URL__',shop:'__SHOP__'}),
  card('x_semantichtml','\uD83C\uDFF7\uFE0F','Semantic HTML',       'semantic-html',                     {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_metadescaud', '\uD83D\uDCDD','Meta Description Audit',    'meta-description-audit',            {url:'__URL__',shop:'__SHOP__'}),
  card('x_kwdensity',   '\uD83D\uDCCA','Keyword Density',           'keyword-density',                   {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_indexdir',    '\uD83D\uDD0D','Index Directives',          'index-directives',                  {url:'__URL__',shop:'__SHOP__'}),
  card('x_contentstruct','\uD83C\uDFD7\uFE0F','Content Structure',  'content-structure',                 {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_authorauth',  '\uD83D\uDC64','Author Authority',          'author-authority',                  {url:'__URL__',shop:'__SHOP__'}),
  card('x_sitemapchk',  '\uD83D\uDDFA\uFE0F','Sitemap Check',       'sitemap-check',                     {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_ogvalid',     '\uD83D\uDCCB','OG Validator',              'og-validator',                      {url:'__URL__',shop:'__SHOP__'}),
  card('x_titlectr',    '\uD83D\uDCC8','Title CTR Signals',         'title/ctr-signals',                 {title:'__TITLEINPUT__',shop:'__SHOP__'}, iTitle),
  card('x_artschema',   '\u2705','Article Schema Validate',  'article-schema/validate',           {url:'__URL__',shop:'__SHOP__'}),
  card('x_llmscore',    '\uD83E\uDD16','LLM Score',                 'llm/score',                         {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_aicontbrief', '\uD83D\uDCCB','AI Content Brief',          'ai/content-brief',                  {topic:'__KEYWORD__',shop:'__SHOP__'}),
].join('\n');

const schemaLinksCards = [
  card('x_schemagen',    '\uD83D\uDCCB','Schema Generate',           'schema/generate',             {type:'Article',data:{name:'keyword'},shop:'__SHOP__'}),
  card('x_faqschema',    '\u2753','FAQ Schema',                'faq-schema/generate',         {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_schemabread',  '\uD83D\uDD17','Breadcrumb Schema',         'schema/breadcrumb',           {url:'__URL__',shop:'__SHOP__'}),
  card('x_schemahowto',  '\uD83D\uDCD6','HowTo Schema',              'schema/howto',                {title:'__KEYWORD__',steps:[],shop:'__SHOP__'}),
  card('x_schemavideo',  '\uD83C\uDFA5','Video Schema',              'schema/video',                {title:'__KEYWORD__',url:'__URL__',shop:'__SHOP__'}),
  card('x_schemareview', '\u2B50','Review Schema',             'schema/review',               {itemName:'__KEYWORD__',rating:5,shop:'__SHOP__'}),
  card('x_schemaorg',    '\uD83C\uDFE2','Organization Schema',       'schema/organization',         {name:'__SHOP__',url:'__URL__',shop:'__SHOP__'}),
  card('x_schemaspeakable','\uD83C\uDFA4','Speakable Schema',        'schema/speakable',            {url:'__URL__',shop:'__SHOP__'}),
  card('x_schemafact',   '\u2705','Fact-Check Schema',        'schema/fact-check',           {claimText:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_schemadata',   '\uD83D\uDCCA','Dataset Schema',            'schema/dataset',              {name:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_schemapodcast','\uD83C\uDF99\uFE0F','Podcast Episode Schema','schema/podcast-episode',   {episodeTitle:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_schemaprod',   '\uD83D\uDED2','Product Schema',            'schema/product',              {name:'__KEYWORD__',url:'__URL__',shop:'__SHOP__'}),
  card('x_schemaevent',  '\uD83D\uDCC5','Event Schema',              'schema/event',                {name:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_schemaperson', '\uD83D\uDC64','Person Schema',             'schema/person',               {name:'__PERSONNAME__',shop:'__SHOP__'}, iPers),
  card('x_schemacourse', '\uD83D\uDCDA','Course Schema',             'schema/course',               {name:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_schemarecipe', '\uD83C\uDF73','Recipe Schema',             'schema/recipe',               {name:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_schemasoftware','\uD83D\uDCBB','Software Schema',          'schema/software',             {name:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_schemalocal',  '\uD83C\uDFEC','Local Business Schema',     'schema/local-business',       {name:'__SHOP__',shop:'__SHOP__'}),
  card('x_schemaredirect','\uD83D\uDD04','Redirect Audit',           'schema/redirect-audit',       {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_schemaduplicate','\uD83D\uDD01','Duplicate Content Check', 'schema/duplicate-content',    {url:'__URL__',shop:'__SHOP__'}),
  card('x_schemahref',   '\uD83C\uDF0D','Hreflang Schema',           'schema/hreflang',             {url:'__URL__',shop:'__SHOP__'}),
  card('x_schemamobile', '\uD83D\uDCF1','Mobile SEO Schema',         'schema/mobile-seo',           {url:'__URL__',shop:'__SHOP__'}),
  card('x_linkscheck',   '\uD83D\uDD17','Links Check',               'links/check',                 {url:'__URL__',shop:'__SHOP__'}),
  card('x_linksinternal','\uD83D\uDD00','Internal Link Suggestions', 'links/internal-suggestions',  {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_linksexternal','\uD83C\uDF10','External Authority',        'links/external-authority',    {url:'__URL__',shop:'__SHOP__'}),
  card('x_linksdensity', '\uD83D\uDCCA','Link Density',              'links/link-density',          {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_linksoutbound','\uD83D\uDCE4','Outbound Audit',            'links/outbound-audit',        {url:'__URL__',shop:'__SHOP__'}),
].join('\n');

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

// Patch 1: Add shared state vars after voiceProfileResult line
patch(
  `  const [voiceProfileResult, setVoiceProfileResult] = useState(null); const [voiceProfileLoading, setVoiceProfileLoading] = useState(false);\n\n    /* -- ANALYZER`,
  `  const [voiceProfileResult, setVoiceProfileResult] = useState(null); const [voiceProfileLoading, setVoiceProfileLoading] = useState(false);\n  // Shared state for uncovered route cards\n  const [xRes, setXRes] = useState({}); const [xLoad, setXLoad] = useState({});\n  const [competitorInput, setCompetitorInput] = useState(''); const [publishDate, setPublishDate] = useState('');\n  const [titleInput, setTitleInput] = useState(''); const [descInput, setDescInput] = useState('');\n  const [variantA, setVariantA] = useState(''); const [variantB, setVariantB] = useState('');\n  const [entityNameInput, setEntityNameInput] = useState(''); const [personNameInput, setPersonNameInput] = useState('');\n  const [localLocation, setLocalLocation] = useState(''); const [authorName, setAuthorName] = useState(''); const [authorExpertise, setAuthorExpertise] = useState('');\n  const [contentLengthNum, setContentLengthNum] = useState('1000'); const [bulkUrlsText, setBulkUrlsText] = useState('');\n  const [vpLoadId, setVpLoadId] = useState(''); const [rankIdInput, setRankIdInput] = useState('');\n\n    /* -- ANALYZER`
);

// Patch 2: Analyzer tab cards inserted before the empty state block
patch(
  `            {!scanResult && !scanning && !scanErr && (\n              <div style={S.empty}>\n                <div style={{ fontSize: 42, marginBottom: 12 }}>??</div>\n                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Blog SEO Analyzer</div>\n                <div style={{ fontSize: 13 }}>Enter a blog post URL to get a comprehensive SEO audit with AI-powered recommendations.</div>\n              </div>\n            )}\n          </>\n        )}\n\n        {/* ================================================================\n            KEYWORDS TAB`,
  analyzerCards + `\n            {!scanResult && !scanning && !scanErr && (\n              <div style={S.empty}>\n                <div style={{ fontSize: 42, marginBottom: 12 }}>??</div>\n                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Blog SEO Analyzer</div>\n                <div style={{ fontSize: 13 }}>Enter a blog post URL to get a comprehensive SEO audit with AI-powered recommendations.</div>\n              </div>\n            )}\n          </>\n        )}\n\n        {/* ================================================================\n            KEYWORDS TAB`
);

// Patch 3: Keywords tab cards after Metadata Analysis last result block
patch(
  `              {metadataAnResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(metadataAnResult,null,2)}</pre></div>}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            CONTENT+ TAB (On-page quality)`,
  `              {metadataAnResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(metadataAnResult,null,2)}</pre></div>}\n            </div>\n` + keywordsCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            CONTENT+ TAB (On-page quality)`
);

// Patch 4: Content+ tab cards after Question Explorer last result block
patch(
  `              {kwQuestResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(kwQuestResult,null,2)}</pre></div>}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            TECHNICAL+ TAB`,
  `              {kwQuestResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(kwQuestResult,null,2)}</pre></div>}\n            </div>\n` + contentPlusCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            TECHNICAL+ TAB`
);

// Patch 5: Technical+ tab cards after Voice Profile result block
patch(
  `              {voiceProfileResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(voiceProfileResult,null,2)}</pre></div>}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            SCHEMA & LINKS TAB`,
  `              {voiceProfileResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(voiceProfileResult,null,2)}</pre></div>}\n            </div>\n` + technicalPlusCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            SCHEMA & LINKS TAB`
);

// Patch 6: Schema & Links tab cards after Anchor Text Analyser result block
patch(
  `              {anchorResult&&anchorResult.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:10}}>\n                <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:8}}>\n                  <span style={{color:'#818cf8'}}>Diversity: {anchorResult.anchorDiversity}</span>\n                  <span style={{color:anchorResult.overOptimisedAnchors?.length>0?'#ef4444':'#22c55e'}}>Over-optimised: {anchorResult.overOptimisedAnchors?.length||0}</span>\n                </div>\n                {(anchorResult.distribution||[]).slice(0,5).map((d,i)=><div key={i} style={{fontSize:12,padding:'2px 0',borderBottom:'1px solid #27272a'}}>\n                  {d.text||d.anchor}: <span style={{color:'#818cf8'}}>{d.count||d.percentage}%</span>\n                </div>)}\n                {(anchorResult.recommendations||[]).slice(0,3).map((r,i)=><div key={i} style={{color:'#71717a',fontSize:12,marginTop:4}}>\u25b8 {r}</div>)}\n              </div>}\n            </div>\n\n          </>\n        )}\n\n        {/* ================================================================\n            SERP & CTR TAB`,
  `              {anchorResult&&anchorResult.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:10}}>\n                <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:8}}>\n                  <span style={{color:'#818cf8'}}>Diversity: {anchorResult.anchorDiversity}</span>\n                  <span style={{color:anchorResult.overOptimisedAnchors?.length>0?'#ef4444':'#22c55e'}}>Over-optimised: {anchorResult.overOptimisedAnchors?.length||0}</span>\n                </div>\n                {(anchorResult.distribution||[]).slice(0,5).map((d,i)=><div key={i} style={{fontSize:12,padding:'2px 0',borderBottom:'1px solid #27272a'}}>\n                  {d.text||d.anchor}: <span style={{color:'#818cf8'}}>{d.count||d.percentage}%</span>\n                </div>)}\n                {(anchorResult.recommendations||[]).slice(0,3).map((r,i)=><div key={i} style={{color:'#71717a',fontSize:12,marginTop:4}}>\u25b8 {r}</div>)}\n              </div>}\n            </div>\n\n` + schemaLinksCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            SERP & CTR TAB`
);

const output = hasCRLF ? src.replace(/\n/g, '\r\n') : src;
fs.writeFileSync(FILE, output, 'utf8');
console.log('\n\u2705 Patches 1-6 applied successfully!');
console.log('File size:', Math.round(Buffer.byteLength(output, 'utf8') / 1024), 'KB');
