/**
 * Patch BlogSEO.jsx - add UI cards for 177 uncovered backend routes
 * Usage: node scripts/patch-blogseo-cards.js
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../aura-console/src/components/tools/BlogSEO.jsx');
// Read file and normalize to LF for easier string matching, then restore CRLF on write
const rawSrc = fs.readFileSync(FILE, 'utf8');
const hasCRLF = rawSrc.includes('\r\n');
let src = hasCRLF ? rawSrc.replace(/\r\n/g, '\n') : rawSrc;

// Special char used as bullet in existing code (U+FFFD)
const BULLET = '\uFFFD';

// Build body expression from a fields object, substituting __MARKER__ tokens
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

// Generate a compact card JSX line
function card(key, emoji, label, route, fields, extraInputs) {
  const body = bodyExpr(fields);
  const inp = extraInputs || '';
  return `            <div style={S.card}><div style={{...S.row,alignItems:'center',marginBottom:6}}><div style={{...S.cardTitle,marginBottom:0}}>${emoji} ${label}</div><button style={{...S.btn(),marginLeft:'auto'}} disabled={xLoad['${key}']} onClick={async()=>{setXLoad(p=>({...p,'${key}':true}));try{const d=await apiFetchJSON(\`\${API}/${route}\`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(${body})});setXRes(p=>({...p,'${key}':d}));}catch(e){setXRes(p=>({...p,'${key}':{error:e.message}}));}setXLoad(p=>({...p,'${key}':false}));}}>{xLoad['${key}']?'Running\u2026':'Run'}</button></div>${inp}{xRes['${key}']&&<div style={{...S.result,marginTop:6,fontSize:12}}>{xRes['${key}'].error?<span style={{color:'#f87171'}}>{xRes['${key}'].error}</span>:<pre style={{margin:0,whiteSpace:'pre-wrap',maxHeight:200,overflow:'auto'}}>{JSON.stringify(xRes['${key}'],null,2)}</pre>}</div>}</div>`;
}

// Reusable input snippets
const iUrl   = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="URL..." value={url} onChange={e=>setUrl(e.target.value)}/>`;
const iKw    = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Keyword..." value={keyword} onChange={e=>setKeyword(e.target.value)}/>`;
const iCont  = `<textarea style={{...S.input,height:54,resize:'vertical',marginBottom:4,fontSize:12}} placeholder="Content..." value={content} onChange={e=>setContent(e.target.value)}/>`;
const iComp  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Competitor domain..." value={competitorInput} onChange={e=>setCompetitorInput(e.target.value)}/>`;
const iPub   = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Publish date (YYYY-MM-DD)..." value={publishDate} onChange={e=>setPublishDate(e.target.value)}/>`;
const iTitle = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Title..." value={titleInput} onChange={e=>setTitleInput(e.target.value)}/>`;
const iDesc  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Meta description..." value={descInput} onChange={e=>setDescInput(e.target.value)}/>`;
const iVarA  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Variant A..." value={variantA} onChange={e=>setVariantA(e.target.value)}/>`;
const iVarB  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Variant B..." value={variantB} onChange={e=>setVariantB(e.target.value)}/>`;
const iBulk  = `<textarea style={{...S.input,height:54,resize:'vertical',marginBottom:4,fontSize:12}} placeholder="URLs (one per line)..." value={bulkUrlsText} onChange={e=>setBulkUrlsText(e.target.value)}/>`;
const iEnt   = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Entity name..." value={entityNameInput} onChange={e=>setEntityNameInput(e.target.value)}/>`;
const iPers  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Person name..." value={personNameInput} onChange={e=>setPersonNameInput(e.target.value)}/>`;
const iLoc   = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Location..." value={localLocation} onChange={e=>setLocalLocation(e.target.value)}/>`;
const iAName = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Author name..." value={authorName} onChange={e=>setAuthorName(e.target.value)}/>`;
const iAExp  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Expertise area..." value={authorExpertise} onChange={e=>setAuthorExpertise(e.target.value)}/>`;
const iCLen  = `<input style={{...S.input,marginBottom:4,fontSize:12}} placeholder="Content length (words)..." value={contentLengthNum} onChange={e=>setContentLengthNum(e.target.value)}/>`;

// ============================================================
// CARD DEFINITIONS PER TAB
// ============================================================

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

const serpCtrCards = [
  card('x_serpctr',     '\uD83D\uDCC8','CTR Optimizer',         'serp/ctr-optimizer',       {keyword:'__KEYWORD__',title:'__TITLEINPUT__',description:'__DESCINPUT__',shop:'__SHOP__'}, iTitle+iDesc),
  card('x_serpintent',  '\uD83C\uDFAF','Intent Classifier SERP','serp/intent-classifier',   {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_serpfeattgt', '\uD83C\uDF1F','Feature Targets',       'serp/feature-targets',     {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_serppaa',     '\u2753','PAA Generator',          'serp/paa-generator',       {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_serprichres', '\u2705','Rich Result Check',      'serp/rich-result-check',   {url:'__URL__',shop:'__SHOP__'}),
  card('x_serprankbr',  '\uD83E\uDDE0','RankBrain Advisor',     'serp/rankbrain-advisor',   {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_serplongtail','\uD83D\uDD17','Longtail Embedder',     'serp/longtail-embedder',   {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_serpmetaab',  '\uD83D\uDCCB','Meta A/B Variants',     'serp/meta-ab-variants',    {title:'__TITLEINPUT__',description:'__DESCINPUT__',keyword:'__KEYWORD__',shop:'__SHOP__'}, iTitle+iDesc),
  card('x_serpdifficulty','\uD83D\uDCCA','Difficulty Score',    'serp/difficulty-score',    {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_serpcomp',    '\uD83D\uDD0D','Competitor Snapshot',   'serp/competitor-snapshot', {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_serpnews',    '\uD83D\uDCF0','News SEO',              'serp/news-seo',            {url:'__URL__',shop:'__SHOP__'}),
  card('x_serpvideo',   '\uD83C\uDFA5','Video SEO',             'serp/video-seo',           {url:'__URL__',shop:'__SHOP__'}),
  card('x_serpentity',  '\uD83E\uDDE0','Entity Optimizer',      'serp/entity-optimizer',    {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_serpreview',  '\u2B50','Review Schema SERP',    'serp/review-schema',       {url:'__URL__',shop:'__SHOP__'}),
  card('x_serpevent',   '\uD83D\uDCC5','Event Schema SERP',     'serp/event-schema',        {url:'__URL__',shop:'__SHOP__'}),
].join('\n');

const backlinksCards = [
  card('x_blopport',    '\uD83D\uDD0D','Opportunity Finder',    'backlinks/opportunity-finder',     {domain:'__SHOP__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_bllinkgap',   '\uD83D\uDCCA','Link Gap',              'backlinks/link-gap',               {domain:'__SHOP__',competitors:[],shop:'__SHOP__'}),
  card('x_bloutreach',  '\u2709\uFE0F','Outreach Generator',    'backlinks/outreach-generator',     {domain:'__SHOP__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_blbestof',    '\uD83C\uDFC6','Best-Of Finder',        'backlinks/bestof-finder',          {niche:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_blanch',      '\u2693','Anchor Optimizer',      'backlinks/anchor-optimizer',       {url:'__URL__',shop:'__SHOP__'}),
  card('x_blstrategy',  '\uD83D\uDDFA\uFE0F','Strategy Builder','backlinks/strategy-builder',      {domain:'__SHOP__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_blinnersug',  '\uD83D\uDD00','Internal Suggester',    'backlinks/internal-suggester',     {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_blbroken',    '\uD83D\uDD17','Broken Backlinks',      'backlinks/broken-backlinks',       {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_blancrtext',  '\uD83D\uDCDD','Anchor Text',           'backlinks/anchor-text',            {url:'__URL__',shop:'__SHOP__'}),
  card('x_blvelocity',  '\uD83D\uDCC8','Link Velocity',         'backlinks/link-velocity',          {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_blreclaim',   '\uD83D\uDD04','Link Reclamation',      'backlinks/link-reclamation',       {domain:'__SHOP__',shop:'__SHOP__'}),
].join('\n');

const abRefreshCards = [
  card('x_ababtest',    '\uD83E\uDDEA','A/B Test Advisor',       'ab/ab-test-advisor',      {variantA:'__VARIANTA__',variantB:'__VARIANTB__',keyword:'__KEYWORD__',shop:'__SHOP__'}, iVarA+iVarB),
  card('x_abrefresh',   '\uD83D\uDD04','Content Refresh',        'ab/content-refresh',      {url:'__URL__',shop:'__SHOP__'}),
  card('x_abtitlevar',  '\uD83D\uDCDD','Title Variants',         'ab/title-variants',       {title:'__TITLEINPUT__',keyword:'__KEYWORD__',shop:'__SHOP__'}, iTitle),
  card('x_abmetavar',   '\uD83D\uDCCB','Meta Variants',          'ab/meta-variants',        {description:'__DESCINPUT__',keyword:'__KEYWORD__',shop:'__SHOP__'}, iDesc),
  card('x_abbert',      '\uD83E\uDDE0','BERT Optimizer',         'ab/bert-optimizer',       {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_abseckw',     '\uD83D\uDD11','Secondary Keywords',     'ab/secondary-keywords',   {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_abknow',      '\uD83D\uDDD8\uFE0F','Knowledge Graph',  'ab/knowledge-graph',      {keyword:'__KEYWORD__',entityName:'__ENTITYNAME__',url:'__URL__',shop:'__SHOP__'}, iEnt),
].join('\n');

const localSeoCards = [
  card('x_localgbp',    '\uD83D\uDCCD','GBP Optimizer',      'local/gbp-optimizer',      {businessName:'__SHOP__',shop:'__SHOP__'}),
  card('x_localcit',    '\uD83D\uDCCB','Citation Finder',    'local/citation-finder',    {businessName:'__SHOP__',location:'__LOCALLOCATION__',shop:'__SHOP__'}, iLoc),
  card('x_localkw',     '\uD83D\uDD11','Local Keyword Gen',  'local/local-keyword-gen',  {keyword:'__KEYWORD__',location:'__LOCALLOCATION__',shop:'__SHOP__'}, iLoc),
  card('x_localschema', '\uD83C\uDFEC','Local Schema',       'local/local-schema',       {businessName:'__SHOP__',address:'__LOCALLOCATION__',shop:'__SHOP__'}, iLoc),
].join('\n');

const eeatBrandCards = [
  card('x_eeat',        '\uD83C\uDFC5','E-E-A-T Scorer',     'brand/eeat-scorer',        {url:'__URL__',shop:'__SHOP__'}),
  card('x_authorbio',   '\uD83D\uDC64','Author Bio',         'brand/author-bio',         {name:'__AUTHORNAME__',expertise:'__AUTHOREXPERTISE__',shop:'__SHOP__'}, iAName+iAExp),
  card('x_brandsig',    '\uD83D\uDCE1','Brand Signals',      'brand/brand-signals',      {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_expertquotes','\uD83D\uDCAC','Expert Quotes',      'brand/expert-quotes',      {topic:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_trustbuild',  '\uD83D\uDEE1\uFE0F','Trust Builder','brand/trust-builder',      {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_socialproof', '\uD83D\uDC65','Social Proof',        'trust/social-proof',       {url:'__URL__',shop:'__SHOP__'}),
  card('x_citcheck',    '\uD83D\uDCDA','Citation Check',     'trust/citation-check',     {content:'__CONTENT__',shop:'__SHOP__'}),
].join('\n');

const voiceAiCards = [
  card('x_voiceopt',    '\uD83C\uDFA4','Voice Optimizer',            'voice/voice-optimizer',        {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_voicefaq',    '\u2753','FAQ Generator (Voice)',      'voice/faq-generator',          {topic:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_voiceaiovr',  '\u2728','AI Overview Optimizer',      'voice/ai-overview-optimizer',  {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_voiceconvkw', '\uD83D\uDCAC','Conversational Keywords',    'voice/conversational-keywords',{keyword:'__KEYWORD__',shop:'__SHOP__'}),
].join('\n');

const shopifyCards = [
  card('x_shopblogaudit','\uD83D\uDCCB','Blog Template Audit',  'shopify/blog-template-audit',  {shop:'__SHOP__'}),
  card('x_shopcollseo',  '\uD83D\uDED2','Collection SEO',        'shopify/collection-seo',       {shop:'__SHOP__'}),
  card('x_shopprodlinks','\uD83D\uDD17','Product Blog Links',    'shopify/product-blog-links',   {shop:'__SHOP__'}),
  card('x_shopmetafld',  '\uD83C\uDFF7\uFE0F','Metafield SEO',  'shopify/metafield-seo',         {shop:'__SHOP__'}),
].join('\n');

const aiGrowthCards = [
  card('x_aiblogout',   '\uD83D\uDCCB','Blog Outline',            'ai/blog-outline',        {topic:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aiintrogen',  '\u270D\uFE0F','Intro Generator',         'ai/intro-generator',     {topic:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aititleideas','\uD83D\uDCA1','Title Ideas',             'ai/title-ideas',         {topic:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aictagen',    '\uD83D\uDCE3','CTA Generator',           'ai/cta-generator',       {context:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aipullkeys',  '\uD83D\uDD11','Key Takeaways',           'ai/key-takeaways',       {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_aisumgen',    '\uD83D\uDCC4','Summary Generator',       'ai/summary-generator',   {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_aitoneana',   '\uD83C\uDFAD','Tone Analyzer',           'ai/tone-analyzer',       {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_aicontgrade', '\uD83D\uDCCA','Content Grader',          'ai/content-grader',      {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aipullquotes','\uD83D\uDCAC','Pull Quotes',             'ai/pull-quotes',         {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_aiheadline',  '\uD83C\uDFAF','Headline Hook',           'ai/headline-hook',       {topic:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aipassageopt','\uD83D\uDCD1','Passage Optimizer',       'ai/passage-optimizer',   {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_airepurpose', '\u267B\uFE0F','Content Repurpose',       'ai/content-repurpose',   {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_aicontvis',   '\uD83D\uDC41\uFE0F','Content Visibility','ai/content-visibility',  {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aicalendar',  '\uD83D\uDCC5','Content Calendar',        'ai/content-calendar',    {niche:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aipillar',    '\uD83C\uDFD7\uFE0F','Pillar Page',       'ai/pillar-page',         {topic:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aiprogmatic', '\u2699\uFE0F','Programmatic SEO',        'ai/programmatic-seo',    {template:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aicontroi',   '\uD83D\uDCB0','Content ROI',             'ai/content-roi',         {domain:'__SHOP__',shop:'__SHOP__'}),
  card('x_aisgeopt',    '\u2728','SGE Optimizer',            'ai/sge-optimizer',       {content:'__CONTENT__',keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aitopicminer','\u26CF\uFE0F','Topic Miner',             'ai/topic-miner',         {niche:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aiperfpred',  '\uD83D\uDCC8','Performance Predictor',   'ai/performance-predictor',{url:'__URL__',shop:'__SHOP__'}),
  card('x_aisemclust',  '\uD83D\uDD17','Semantic Clusters',       'ai/semantic-clusters',   {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_airewrite',   '\u270F\uFE0F','AI Rewrite',              'ai/rewrite',             {content:'__CONTENT__',shop:'__SHOP__'}),
  card('x_aikwresearch','\uD83D\uDD0D','AI Keyword Research',     'ai/keyword-research',    {keyword:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aigenerate',  '\uD83E\uDD16','AI Generate',             'ai/generate',            {prompt:'__KEYWORD__',shop:'__SHOP__'}),
  card('x_aifixcode',   '\uD83D\uDD27','AI Fix Code',             'ai/fix-code',            {code:'__KEYWORD__',shop:'__SHOP__'}),
].join('\n');

const geoLlmCards = [
  card('x_socialseo',    '\uD83D\uDCCA','Social SEO Score',      'social/seo-score',          {url:'__URL__',shop:'__SHOP__'}),
  card('x_compfullaudit','\uD83D\uDD0D','Competitor Full Audit', 'competitor/full-audit',     {domain:'__SHOP__',competitors:[],shop:'__SHOP__'}),
].join('\n');

// ============================================================
// APPLY PATCHES
// ============================================================

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
  console.log('\u2713 Patched: ' + anchorOld.slice(0, 80).trim().replace(/\n/g, ' '));
}

// 1. Add state variables after voiceProfileResult line
patch(
  `  const [voiceProfileResult, setVoiceProfileResult] = useState(null); const [voiceProfileLoading, setVoiceProfileLoading] = useState(false);\n\n    /* -- ANALYZER`,
  `  const [voiceProfileResult, setVoiceProfileResult] = useState(null); const [voiceProfileLoading, setVoiceProfileLoading] = useState(false);\n  // Shared state for uncovered route cards\n  const [xRes, setXRes] = useState({}); const [xLoad, setXLoad] = useState({});\n  const [competitorInput, setCompetitorInput] = useState(''); const [publishDate, setPublishDate] = useState('');\n  const [titleInput, setTitleInput] = useState(''); const [descInput, setDescInput] = useState('');\n  const [variantA, setVariantA] = useState(''); const [variantB, setVariantB] = useState('');\n  const [entityNameInput, setEntityNameInput] = useState(''); const [personNameInput, setPersonNameInput] = useState('');\n  const [localLocation, setLocalLocation] = useState(''); const [authorName, setAuthorName] = useState(''); const [authorExpertise, setAuthorExpertise] = useState('');\n  const [contentLengthNum, setContentLengthNum] = useState('1000'); const [bulkUrlsText, setBulkUrlsText] = useState('');\n\n    /* -- ANALYZER`
);

// 2. Analyzer tab - insert before the empty state block
patch(
  `            {!scanResult && !scanning && !scanErr && (\n              <div style={S.empty}>\n                <div style={{ fontSize: 42, marginBottom: 12 }}>??</div>\n                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Blog SEO Analyzer</div>\n                <div style={{ fontSize: 13 }}>Enter a blog post URL to get a comprehensive SEO audit with AI-powered recommendations.</div>\n              </div>\n            )}\n          </>\n        )}\n\n        {/* ================================================================\n            KEYWORDS TAB`,
  analyzerCards + `\n            {!scanResult && !scanning && !scanErr && (\n              <div style={S.empty}>\n                <div style={{ fontSize: 42, marginBottom: 12 }}>??</div>\n                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Blog SEO Analyzer</div>\n                <div style={{ fontSize: 13 }}>Enter a blog post URL to get a comprehensive SEO audit with AI-powered recommendations.</div>\n              </div>\n            )}\n          </>\n        )}\n\n        {/* ================================================================\n            KEYWORDS TAB`
);

// 3. Keywords tab - insert before closing </> (after Metadata Audit card)
patch(
  `              {metadataAnResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(metadataAnResult,null,2)}</pre></div>}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            CONTENT+ TAB (On-page quality)`,
  `              {metadataAnResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(metadataAnResult,null,2)}</pre></div>}\n            </div>\n` + keywordsCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            CONTENT+ TAB (On-page quality)`
);

// 4. Content+ tab - insert before closing </> (after Question Explorer card)
patch(
  `              {kwQuestResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(kwQuestResult,null,2)}</pre></div>}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            TECHNICAL+ TAB`,
  `              {kwQuestResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(kwQuestResult,null,2)}</pre></div>}\n            </div>\n` + contentPlusCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            TECHNICAL+ TAB`
);

// 5. Technical+ tab - insert before closing </> (after Voice Profile card)
patch(
  `              {voiceProfileResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(voiceProfileResult,null,2)}</pre></div>}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            SCHEMA & LINKS TAB`,
  `              {voiceProfileResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(voiceProfileResult,null,2)}</pre></div>}\n            </div>\n` + technicalPlusCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            SCHEMA & LINKS TAB`
);

// 6. Schema & Links tab - insert before closing </> (after Anchor Text Analyser card)
patch(
  `              {anchorResult&&anchorResult.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:10}}>\n                <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:8}}>\n                  <span style={{color:'#818cf8'}}>Diversity: {anchorResult.anchorDiversity}</span>\n                  <span style={{color:anchorResult.overOptimisedAnchors?.length>0?'#ef4444':'#22c55e'}}>Over-optimised: {anchorResult.overOptimisedAnchors?.length||0}</span>\n                </div>\n                {(anchorResult.distribution||[]).slice(0,5).map((d,i)=><div key={i} style={{fontSize:12,padding:'2px 0',borderBottom:'1px solid #27272a'}}>\n                  {d.text||d.anchor}: <span style={{color:'#818cf8'}}>{d.count||d.percentage}%</span>\n                </div>)}\n                {(anchorResult.recommendations||[]).slice(0,3).map((r,i)=><div key={i} style={{color:'#71717a',fontSize:12,marginTop:4}}>\u25b8 {r}</div>)}\n              </div>}\n            </div>\n\n          </>\n        )}\n\n        {/* ================================================================\n            SERP & CTR TAB`,
  `              {anchorResult&&anchorResult.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:10}}>\n                <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:8}}>\n                  <span style={{color:'#818cf8'}}>Diversity: {anchorResult.anchorDiversity}</span>\n                  <span style={{color:anchorResult.overOptimisedAnchors?.length>0?'#ef4444':'#22c55e'}}>Over-optimised: {anchorResult.overOptimisedAnchors?.length||0}</span>\n                </div>\n                {(anchorResult.distribution||[]).slice(0,5).map((d,i)=><div key={i} style={{fontSize:12,padding:'2px 0',borderBottom:'1px solid #27272a'}}>\n                  {d.text||d.anchor}: <span style={{color:'#818cf8'}}>{d.count||d.percentage}%</span>\n                </div>)}\n                {(anchorResult.recommendations||[]).slice(0,3).map((r,i)=><div key={i} style={{color:'#71717a',fontSize:12,marginTop:4}}>\u25b8 {r}</div>)}\n              </div>}\n            </div>\n\n` + schemaLinksCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            SERP & CTR TAB`
);

// 7. SERP & CTR tab - insert before closing </> (after Event Schema Builder card)
patch(
  `                  {eventSchemaResult.commonMistakes?.map((m, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa", padding: "2px 0" }}>\uFFFD {m}</div>)}\n                  {eventSchemaResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>? {a}</div>)}\n                </div>\n              )}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            BACKLINKS TAB`,
  `                  {eventSchemaResult.commonMistakes?.map((m, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa", padding: "2px 0" }}>\uFFFD {m}</div>)}\n                  {eventSchemaResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>? {a}</div>)}\n                </div>\n              )}\n            </div>\n` + serpCtrCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            BACKLINKS TAB`
);

// 8. Backlinks tab - insert before closing </> (after Skyscraper Prospector card)
patch(
  `              {skyscraperResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(skyscraperResult,null,2)}</pre></div>}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            A/B & REFRESH TAB (Batch 6)`,
  `              {skyscraperResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(skyscraperResult,null,2)}</pre></div>}\n            </div>\n` + backlinksCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            A/B & REFRESH TAB (Batch 6)`
);

// 9. A/B & Refresh tab - insert before closing </> (after Knowledge Graph card)
patch(
  `                  {knowledgeGraphResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>\uFFFD {a}</div>)}\n                </div>\n              )}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            LOCAL SEO TAB (Batch 5)`,
  `                  {knowledgeGraphResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>\uFFFD {a}</div>)}\n                </div>\n              )}\n            </div>\n` + abRefreshCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            LOCAL SEO TAB (Batch 5)`
);

// 10. Local SEO tab - insert before closing </> (after Local Schema card)
patch(
  `                  {localSchemaResult.schemaMarkup && (\n                    <div style={{ marginTop: 8 }}>\n                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Generated schema:</div>\n                      <textarea readOnly style={{ ...S.input, height: 120, fontFamily: "monospace", fontSize: 11 }} value={localSchemaResult.schemaMarkup} />\n                    </div>\n                  )}\n                </div>\n              )}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            E-E-A-T & BRAND TAB (Batch 5)`,
  `                  {localSchemaResult.schemaMarkup && (\n                    <div style={{ marginTop: 8 }}>\n                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Generated schema:</div>\n                      <textarea readOnly style={{ ...S.input, height: 120, fontFamily: "monospace", fontSize: 11 }} value={localSchemaResult.schemaMarkup} />\n                    </div>\n                  )}\n                </div>\n              )}\n            </div>\n` + localSeoCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            E-E-A-T & BRAND TAB (Batch 5)`
);

// 11. E-E-A-T & Brand tab - insert before closing </> (after Trust Builder card)
patch(
  `                  {trustBuilderResult.topTrustActions?.length > 0 && (\n                    <div style={{ marginTop: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Top actions:</div>{trustBuilderResult.topTrustActions.map((a, i) => <div key={i} style={{ fontSize: 13 }}>\uFFFD {a}</div>)}</div>\n                  )}\n                </div>\n              )}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            VOICE & AI SEARCH TAB (Batch 5)`,
  `                  {trustBuilderResult.topTrustActions?.length > 0 && (\n                    <div style={{ marginTop: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Top actions:</div>{trustBuilderResult.topTrustActions.map((a, i) => <div key={i} style={{ fontSize: 13 }}>\uFFFD {a}</div>)}</div>\n                  )}\n                </div>\n              )}\n            </div>\n` + eeatBrandCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            VOICE & AI SEARCH TAB (Batch 5)`
);

// 12. Voice & AI Search tab - insert before the Voice Profile Load card
patch(
  `            {/* === Voice Profile Load === */}\n            <div style={S.card}>\n              <div style={{ ...S.row, alignItems: 'center', marginBottom: 8 }}>\n                <div style={{ ...S.cardTitle, marginBottom: 0 }}>\uD83D\uDCE5 Load Voice Profile</div>\n                <button style={{ ...S.btn, marginLeft: 'auto' }} disabled={vpLoadLoading} onClick={async () => {`,
  voiceAiCards + `\n            {/* === Voice Profile Load === */}\n            <div style={S.card}>\n              <div style={{ ...S.row, alignItems: 'center', marginBottom: 8 }}>\n                <div style={{ ...S.cardTitle, marginBottom: 0 }}>\uD83D\uDCE5 Load Voice Profile</div>\n                <button style={{ ...S.btn, marginLeft: 'auto' }} disabled={vpLoadLoading} onClick={async () => {`
);

// 13. Shopify SEO tab - insert before closing </> (after Sitemap Enhancer card)
patch(
  `              {sitemapEnhResult&&!sitemapEnhResult.ok&&<div style={S.err}>{sitemapEnhResult.error}</div>}\n              {sitemapEnhResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(sitemapEnhResult,null,2)}</pre></div>}\n            </div>\n         </>\n        )}\n\n\n        {/* ================================================================\n            AI GROWTH TAB`,
  `              {sitemapEnhResult&&!sitemapEnhResult.ok&&<div style={S.err}>{sitemapEnhResult.error}</div>}\n              {sitemapEnhResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(sitemapEnhResult,null,2)}</pre></div>}\n            </div>\n` + shopifyCards + `\n         </>\n        )}\n\n\n        {/* ================================================================\n            AI GROWTH TAB`
);

// 14. AI Growth tab - insert before closing </> (after Algorithm Impact Check card)
patch(
  `              {algoImpactResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(algoImpactResult,null,2)}</pre></div>}\n            </div>\n          </>\n        )}\n\n        {/* ================================================================\n            RANK TRACKER TAB`,
  `              {algoImpactResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(algoImpactResult,null,2)}</pre></div>}\n            </div>\n` + aiGrowthCards + `\n          </>\n        )}\n\n        {/* ================================================================\n            RANK TRACKER TAB`
);

// 15. GEO & LLM tab - insert before closing </> (after No-Snippet Audit card)
patch(
  `              {nosnippetResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(nosnippetResult,null,2)}</pre></div>}\n            </div>\n          </>\n        )}\n\n        {/* TREND SCOUT TAB */}`,
  `              {nosnippetResult?.ok&&<div style={{fontSize:13,color:'#d4d4d8',marginTop:8}}><pre style={{whiteSpace:'pre-wrap',margin:0}}>{JSON.stringify(nosnippetResult,null,2)}</pre></div>}\n            </div>\n` + geoLlmCards + `\n          </>\n        )}\n\n        {/* TREND SCOUT TAB */}`
);

// Write back (restore CRLF if original had it)
const output = hasCRLF ? src.replace(/\n/g, '\r\n') : src;
fs.writeFileSync(FILE, output, 'utf8');
console.log('\n\u2705 All patches applied successfully!');
console.log('File size:', Math.round(Buffer.byteLength(output, 'utf8') / 1024), 'KB');
