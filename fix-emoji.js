#!/usr/bin/env node
// fix-emoji.js  — replace all corrupted ?? / ??? placeholders with proper emoji

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'aura-console/src/components/tools/BlogSEO.jsx');
let src = fs.readFileSync(FILE, 'utf8');

// Helper: escape regex special chars
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function rep(from, to) {
  src = src.split(from).join(to);
}

// ─── SECTIONS tool icons ─────────────────────────────────────────────────────
rep('id: "Analyze", icon: "??",', 'id: "Analyze", icon: "🔍",');
rep('id: "Keywords", icon: "??",', 'id: "Keywords", icon: "🎯",');
rep('id: "Write", icon: "??",', 'id: "Write", icon: "✍️",');
rep('id: "Optimize", icon: "??",', 'id: "Optimize", icon: "⚡",');
rep('id: "AI Chat", icon: "??",', 'id: "AI Chat", icon: "💬",');
rep('id: "Bulk Scan", icon: "??",', 'id: "Bulk Scan", icon: "📊",');
rep('id: "History", icon: "??",', 'id: "History", icon: "🕐",');
rep('id: "Technical", icon: "??",', 'id: "Technical", icon: "⚙️",');
rep('id: "Schema", icon: "???",', 'id: "Schema", icon: "🔗",');
rep('id: "SERP", icon: "??",', 'id: "SERP", icon: "📈",');
rep('id: "Backlinks", icon: "??",', 'id: "Backlinks", icon: "🕸️",');
rep('id: "AB", icon: "??",', 'id: "AB", icon: "🧪",');
rep('id: "Local", icon: "??",', 'id: "Local", icon: "📍",');
rep('id: "Voice", icon: "???",', 'id: "Voice", icon: "🎙️",');
rep('id: "AIGrowth", icon: "??",', 'id: "AIGrowth", icon: "🚀",');
rep('id: "RankTracker", icon: "??",', 'id: "RankTracker", icon: "🏆",');
rep('id: "SiteCrawl", icon: "???",', 'id: "SiteCrawl", icon: "🕷️",');
rep('id: "GeoLLM", icon: "??",', 'id: "GeoLLM", icon: "🌍",');
rep('id: "TrendScout", icon: "??",', 'id: "TrendScout", icon: "📡",');

// ─── Sub-tab labels ───────────────────────────────────────────────────────────
rep('{ id: "calendar", label: "?? Content Calendar" }', '{ id: "calendar", label: "📅 Content Calendar" }');
rep('{ id: "competitor", label: "??? Competitor Audit" }', '{ id: "competitor", label: "🕵️ Competitor Audit" }');
rep('{ id: "gnews", label: "?? Google News" }', '{ id: "gnews", label: "📰 Google News" }');
rep('{ id: "miner", label: "?? Topic Miner" }', '{ id: "miner", label: "⛏️ Topic Miner" }');
rep('{ id: "pillar", label: "??? Pillar Page" }', '{ id: "pillar", label: "🏛️ Pillar Page" }');
rep('{ id: "predictor", label: "?? Performance Predictor" }', '{ id: "predictor", label: "📊 Performance Predictor" }');
rep('{ id: "reclaim", label: "?? Link Reclamation" }', '{ id: "reclaim", label: "🔗 Link Reclamation" }');
rep('{ id: "roi", label: "?? Content ROI" }', '{ id: "roi", label: "💰 Content ROI" }');
rep('{ id: "semantic", label: "?? Semantic Clusters" }', '{ id: "semantic", label: "🧩 Semantic Clusters" }');
rep('{ id: "sge", label: "?? SGE / AI Overview" }', '{ id: "sge", label: "🤖 SGE / AI Overview" }');
rep('{ id: "social", label: "?? Social SEO Score" }', '{ id: "social", label: "📱 Social SEO Score" }');

// ─── ToggleSection titles ─────────────────────────────────────────────────────
rep('"?? SERP Preview"', '"👁️ SERP Preview"');
rep('"?? Readability Analysis (Flesch-Kincaid)"', '"📖 Readability Analysis (Flesch-Kincaid)"');
rep('`?? Content Freshness${scanResult.isContentStale ? " ?? Stale" : " ?"}', '`🕐 Content Freshness${scanResult.isContentStale ? " ⚠️ Stale" : " ✅"}');
rep('`?? E-E-A-T Signals (${scanResult.eeatSignals.score}/4)`', '`⭐ E-E-A-T Signals (${scanResult.eeatSignals.score}/4)`');
rep('`?? Featured Snippet Readiness${scanResult.questionHeadingCount > 0 ? " ?" : ""}', '`🎯 Featured Snippet Readiness${scanResult.questionHeadingCount > 0 ? " ✅" : ""}');
rep('`?? GEO / AI Citation Readiness', '`🌍 GEO / AI Citation Readiness');
rep('`?? Headings (${scanResult.headings', '`📋 Headings (${scanResult.headings');
rep('`?? Links', '`🔗 Links');
rep('`??? Images (${scanResult.imageCount})', '`🖼️ Images (${scanResult.imageCount})');
rep('`??? Schema', '`🔗 Schema');

// ─── Card titles (S.cardTitle) ────────────────────────────────────────────────
const cardTitles = [
  ['"?? Analyze Blog Post"', '"🔍 Analyze Blog Post"'],
  ['"?? AI Analysis"', '"🤖 AI Analysis"'],
  ['"?? AI Blog Outline"', '"📋 AI Blog Outline"'],
  ['"?? AI Content Brief Generator"', '"📝 AI Content Brief Generator"'],
  ['"?? AI CTA Generator"', '"✨ AI CTA Generator"'],
  ['"?? AI Intro Generator"', '"✍️ AI Intro Generator"'],
  ['"?? AI Keyword Research"', '"🎯 AI Keyword Research"'],
  ['"?? AI Overview Optimizer"', '"🤖 AI Overview Optimizer"'],
  ['"?? AI Rewrite Suggestions', '"✍️ AI Rewrite Suggestions'],
  ['"?? Author Bio Optimizer"', '"👤 Author Bio Optimizer"'],
  ['"?? Backlink Opportunity Finder"', '"🔗 Backlink Opportunity Finder"'],
  ['"?? BERT / NLP Semantic Optimizer"', '"🧠 BERT / NLP Semantic Optimizer"'],
  ['"?? Blog SEO Assistant"', '"💬 Blog SEO Assistant"'],
  ['"?? Brand Signal Audit"', '"🏷️ Brand Signal Audit"'],
  ['"?? Brief:', '"📝 Brief:'],
  ['"?? Broken Backlink Reclamation"', '"🔗 Broken Backlink Reclamation"'],
  ['"?? Bulk Blog Scanner"', '"📊 Bulk Blog Scanner"'],
  ['"?? \\"Best Of\\" List Finder"', '"🏆 \\"Best Of\\" List Finder"'],
  ['"?? "Best Of" List Finder"', '"🏆 "Best Of" List Finder"'],
  ['"?? Additional Schema Generators"', '"🔗 Additional Schema Generators"'],
  ['"?? Competitor Content Gap Analysis', '"🕵️ Competitor Content Gap Analysis'],
  ['"?? Competitor Link Gap Analyzer"', '"🕵️ Competitor Link Gap Analyzer"'],
  ['"?? Content Calendar Generator', '"📅 Content Calendar Generator'],
  ['"?? Content Ideas"', '"💡 Content Ideas"'],
  ['"?? Content Length Advisor"', '"📏 Content Length Advisor"'],
  ['"?? Content Outline"', '"📋 Content Outline"'],
  ['"?? Content Performance Predictor', '"📊 Content Performance Predictor'],
  ['"?? Content Pruning Advisor"', '"✂️ Content Pruning Advisor"'],
  ['"?? Content Refresh Advisor"', '"🔄 Content Refresh Advisor"'],
  ['"?? Content Relaunch Advisor"', '"🚀 Content Relaunch Advisor"'],
  ['"?? Content ROI Estimator', '"💰 Content ROI Estimator'],
  ['"?? Conversational Keyword Generator"', '"💬 Conversational Keyword Generator"'],
  ['"?? Course Schema"', '"🎓 Course Schema"'],
  ['"?? CTR Optimizer"', '"📈 CTR Optimizer"'],
  ['"?? Duplicate Content Detector"', '"📋 Duplicate Content Detector"'],
  ['"?? E-E-A-T Signal Scorer"', '"⭐ E-E-A-T Signal Scorer"'],
  ['"?? Entity & Knowledge Graph Optimizer"', '"🧠 Entity & Knowledge Graph Optimizer"'],
  ['"?? Event Schema Builder"', '"📅 Event Schema Builder"'],
  ['"?? Expert Quote Finder"', '"💬 Expert Quote Finder"'],
  ['"?? FAQPage Schema Generator"', '"❓ FAQPage Schema Generator"'],
  ['"?? Forum / Reddit Topic Miner', '"🔍 Forum / Reddit Topic Miner'],
  ['"?? Google Business Profile Optimizer"', '"📍 Google Business Profile Optimizer"'],
  ['"?? Google News & Discover Optimizer"', '"📰 Google News & Discover Optimizer"'],
  ['"?? Google News SEO Checker', '"📰 Google News SEO Checker'],
  ['"?? Hreflang & International SEO"', '"🌍 Hreflang & International SEO"'],
  ['"?? International SEO Advisor"', '"🌍 International SEO Advisor"'],
  ['"?? Issues (', '"⚠️ Issues ('],
  ['"?? Keyword Cannibalization Checker"', '"⚠️ Keyword Cannibalization Checker"'],
  ['"?? Keyword Cannibalization Detector"', '"⚠️ Keyword Cannibalization Detector"'],
  ['"?? Keyword Density"', '"🎯 Keyword Density"'],
  ['"?? Keyword Difficulty Estimator"', '"🎯 Keyword Difficulty Estimator"'],
  ['"?? Keyword Strategy"', '"🎯 Keyword Strategy"'],
  ['"?? Link Gap Analysis"', '"🔗 Link Gap Analysis"'],
  ['"?? Link Reclamation Finder', '"🔗 Link Reclamation Finder'],
  ['"?? Link Velocity Analyzer"', '"📈 Link Velocity Analyzer"'],
  ['"?? Local Business Schema"', '"📍 Local Business Schema"'],
  ['"?? Local Keyword Generator"', '"📍 Local Keyword Generator"'],
  ['"?? Log File Analysis Advisor"', '"📋 Log File Analysis Advisor"'],
  ['"?? Long-Tail Keywords"', '"🎯 Long-Tail Keywords"'],
  ['"?? Long-tail Title Embedder"', '"✍️ Long-tail Title Embedder"'],
  ['"?? Low-Difficulty Keyword Finder"', '"🎯 Low-Difficulty Keyword Finder"'],
  ['"?? LSI &amp; Semantic Keywords"', '"🧠 LSI &amp; Semantic Keywords"'],
  ['"?? LSI & Semantic Keywords"', '"🧠 LSI & Semantic Keywords"'],
  ['"?? Meta & Content Details"', '"📋 Meta & Content Details"'],
  ['"?? Meta Description A/B Variants"', '"🧪 Meta Description A/B Variants"'],
  ['"?? Mobile SEO Checker"', '"📱 Mobile SEO Checker"'],
  ['"?? Outreach Email Generator"', '"📧 Outreach Email Generator"'],
  ['"?? Page Speed Advisor"', '"⚡ Page Speed Advisor"'],
  ['"?? Person Schema"', '"👤 Person Schema"'],
  ['"?? Product', '"🔗 Product'],
  ['"?? RankBrain UX Advisor"', '"🧠 RankBrain UX Advisor"'],
  ['"?? Reading Level Analyzer"', '"📖 Reading Level Analyzer"'],
  ['"?? Recipe Schema"', '"🍳 Recipe Schema"'],
  ['"?? Redirect Chain Auditor"', '"🔗 Redirect Chain Auditor"'],
  ['"?? Search Intent Classifier', '"🎯 Search Intent Classifier'],
  ['"?? Secondary Keyword Optimizer"', '"🎯 Secondary Keyword Optimizer"'],
  ['"?? Semantic Cluster Builder', '"🧩 Semantic Cluster Builder'],
  ['"?? Semantic Enrichment Tool"', '"🧠 Semantic Enrichment Tool"'],
  ['"?? SEO A/B Test Advisor"', '"🧪 SEO A/B Test Advisor"'],
  ['"?? SERP Competitor Snapshot"', '"📈 SERP Competitor Snapshot"'],
  ['"?? SGE / AI Overview Optimizer', '"🤖 SGE / AI Overview Optimizer'],
  ['"?? Shopify Metafield SEO Generator', '"🏪 Shopify Metafield SEO Generator'],
  ['"?? Social SEO Signal Scorer', '"📱 Social SEO Signal Scorer'],
  ['"?? Software Schema"', '"💻 Software Schema"'],
  ['"?? Statistics Curator (Linkbait)"', '"📊 Statistics Curator (Linkbait)"'],
  ['"?? TF-IDF Keyword Analyzer"', '"🎯 TF-IDF Keyword Analyzer"'],
  ['"?? Title Tag A/B Variants"', '"🧪 Title Tag A/B Variants"'],
  ['"?? Topic Cluster Builder"', '"🧩 Topic Cluster Builder"'],
  ['"?? Trust Builder Audit"', '"⭐ Trust Builder Audit"'],
  ['"?? Video SEO Rich Results"', '"🎬 Video SEO Rich Results"'],
  ['"?? Visual Diversity Advisor"', '"🖼️ Visual Diversity Advisor"'],
  // ??? card titles
  ['"??? AI Title Ideas"', '"✨ AI Title Ideas"'],
  ['"??? Click Depth Analyzer"', '"🕷️ Click Depth Analyzer"'],
  ['"??? Collection Page SEO Audit"', '"🏪 Collection Page SEO Audit"'],
  ['"??? Competitor Blog Full Audit', '"🕵️ Competitor Blog Full Audit'],
  ['"??? Content Freshness Score"', '"🕐 Content Freshness Score"'],
  ['"??? Crawl Budget Advisor"', '"🕷️ Crawl Budget Advisor"'],
  ['"??? Event Schema"', '"📅 Event Schema"'],
  ['"??? Internal Link Suggester"', '"🔗 Internal Link Suggester"'],
  ['"??? Knowledge Graph Coverage"', '"🧠 Knowledge Graph Coverage"'],
  ['"??? Link Building Strategy Builder"', '"🔗 Link Building Strategy Builder"'],
  ['"??? Local Citation Finder"', '"📍 Local Citation Finder"'],
  ['"??? LocalBusiness Schema Builder"', '"📍 LocalBusiness Schema Builder"'],
  ['"??? Pillar Page & Cluster Builder', '"🏛️ Pillar Page & Cluster Builder'],
  ['"??? Product Schema"', '"🛍️ Product Schema"'],
  ['"??? Rich Result Eligibility Check"', '"✅ Rich Result Eligibility Check"'],
  ['"??? Shopify Blog Post Audit"', '"🏪 Shopify Blog Post Audit"'],
  ['"??? Skyscraper Gap Finder"', '"🔍 Skyscraper Gap Finder"'],
  ['"??? Topical Authority Mapper', '"🧠 Topical Authority Mapper'],
  ['"??? Voice Search Optimizer"', '"🎙️ Voice Search Optimizer"'],
];
for (const [from, to] of cardTitles) rep(from, to);

// ─── Headings ─────────────────────────────────────────────────────────────────
rep('"?? CTR Tips"', '"📈 CTR Tips"');
rep('"?? Topic Clusters to Cover"', '"🧩 Topic Clusters to Cover"');
rep('"??? Content Gaps"', '"🔍 Content Gaps"');
rep('"??? Competitor Gaps"', '"🕵️ Competitor Gaps"');
rep('"?? Recommendations"', '"💡 Recommendations"');
rep('"?? Related Topics"', '"💡 Related Topics"');
rep('"?? Unique Angles"', '"💡 Unique Angles"');
rep('"?? Weaknesses"', '"⚠️ Weaknesses"');
rep('"?? Battle Plan"', '"⚔️ Battle Plan"');
rep('"?? Topic Gaps to Exploit"', '"🎯 Topic Gaps to Exploit"');

// ─── Priority / urgency / emotion conditionals ────────────────────────────────
rep('"?? High Priority"', '"🔴 High Priority"');
rep('"?? Medium Priority"', '"🟡 Medium Priority"');
rep('"? Supporting Terms"', '"🟢 Supporting Terms"');
rep('urgency === "Immediate" ? "??"', 'urgency === "Immediate" ? "🔴"');
rep('urgency === "Soon" ? "??"', 'urgency === "Soon" ? "🟡"');
rep('urgency === "Eventually" ? "??"', 'urgency === "Eventually" ? "🟢"');
// last fallback in urgency ternary
rep(': "Eventually" ? "??" : "??"} {decayResult.urgency}', ': "Eventually" ? "🟢" : "⚪"} {decayResult.urgency}');
rep('emotionType === "positive" ? "??"', 'emotionType === "positive" ? "😊"');
rep('emotionType === "negative" ? "??"', 'emotionType === "negative" ? "😟"');
// neutral fallback
rep(': "negative" ? "??" : "??"}', ': "negative" ? "😟" : "😐"}');

// ─── Pass / fail / allowed / blocked ─────────────────────────────────────────
rep('"? Good"', '"✅ Good"');
rep('"?? Review"', '"⚠️ Review"');
rep('"? Allowed"', '"✅ Allowed"');
rep('"?? Blocked"', '"❌ Blocked"');
rep('"? Allowed: "', '"✅ Allowed: "');           // in case variant exists
rep('"?? Keyword cannibalization detected"', '"⚠️ Keyword cannibalization detected"');
rep('"? No cannibalization detected"', '"✅ No cannibalization detected"');
rep('"?? Mismatch"', '"⚠️ Mismatch"');
// presence indicator: {f.present ? "?" : f.required ? "?" : "??"}
rep('f.present ? "?" : f.required ? "?" : "??"', 'f.present ? "✅" : f.required ? "🔴" : "⚠️"');
// crawl allowed/blocked spans
rep('>? Allowed: {crawlerResult.summary', '>✅ Allowed: {crawlerResult.summary');
rep('>?? Blocked: {crawlerResult.summary', '>❌ Blocked: {crawlerResult.summary');

// ─── Schema section subheadings ───────────────────────────────────────────────
rep('"?? Generate BlogPosting Schema"', '"🔗 Generate BlogPosting Schema"');
rep('"?? BreadcrumbList Schema"', '"🔗 BreadcrumbList Schema"');
rep('"?? HowTo Schema (AI)', '"🧠 HowTo Schema (AI)');
rep('"?? Organization Schema"', '"🏢 Organization Schema"');
rep('"?? Speakable Schema (Voice Search)"', '"🎙️ Speakable Schema (Voice Search)"');
rep('"?? VideoObject Schema"', '"🎬 VideoObject Schema"');

// ─── Mode bar / header UI ──────────────────────────────────────────────────────
rep('"?? Shopify store not connected"', '"⚠️ Shopify store not connected"');
rep('"?? Welcome! Pick a tool to get started."', '"👋 Welcome! Pick a tool to get started."');
rep('"??? Advanced Mode ◆ all tools"', '"🔓 Advanced Mode ◆ all tools"');
rep('>?? Beginner<', '>🌱 Beginner<');
rep('>? Advanced<', '>⚡ Advanced<');
rep('">?? Beginner</button>', '">🌱 Beginner</button>');
// connected bar
rep('"?? Connected to"', '"✅ Connected to"');
rep('"? Connected to"', '"✅ Connected to"');

// ─── Analyze form ──────────────────────────────────────────────────────────────
rep('"??? Auto-fill from your store"', '"🏪 Auto-fill from your store"');
rep('"??? Auto-fill from your store&nbsp;"', '"🏪 Auto-fill from your store\u00a0"');
rep('??? Auto-fill from your store&nbsp;', '🏪 Auto-fill from your store&nbsp;');
rep('"?? Or use a product as keyword seed:"', '"💡 Or use a product as keyword seed:"');
rep('"?? Enter a target keyword above first."', '"⚠️ Enter a target keyword above first."');

// ─── SERP / Desktop / Mobile ──────────────────────────────────────────────────
rep('"?? Desktop"', '"🖥️ Desktop"');
rep('"?? Mobile"', '"📱 Mobile"');
rep('"?? Truncated', '"✂️ Truncated');
rep('"?? Too short', '"⚠️ Too short');

// ─── Re-run button patterns ───────────────────────────────────────────────────
const rerunPhrases = ['Re-check','Re-analyze','Re-run','Re-audit','Re-score','Re-predict','Re-extract','Regenerate','Re-grade','Re-classify','Re-optimize','Re-score'];
for (const p of rerunPhrases) {
  rep(`"?? ${p}"`, `"🔄 ${p}"`);
  rep(`"??? ${p}"`, `"🔄 ${p}"`);
}

// ─── Action buttons ───────────────────────────────────────────────────────────
rep('"?? AI Deep Analysis (1 credit)"', '"🤖 AI Deep Analysis (1 credit)"');
rep('"?? AI Generate Answers + Schema (1 credit)"', '"✨ AI Generate Answers + Schema (1 credit)"');
rep('"?? AI Generate Fix (1 credit)"', '"✨ AI Generate Fix (1 credit)"');
rep('"?? Build Calendar (3 credits)"', '"📅 Build Calendar (3 credits)"');
rep('"?? Full Competitor Audit (5 credits)"', '"🕵️ Full Competitor Audit (5 credits)"');
rep('"?? Check All Links"', '"🔍 Check All Links"');
rep('"?? Get Suggestions"', '"💡 Get Suggestions"');
rep('"?? Analyze"', '"🔍 Analyze"');
rep('"?? Structure Only (free)"', '"📋 Structure Only (free)"');
rep('"?? Score AI Readability"', '"🤖 Score AI Readability"');
rep('"?? Audit Anchors"', '"🔍 Audit Anchors"');
rep('"?? Audit Images"', '"🖼️ Audit Images"');
rep('"?? Audit Meta Desc"', '"📋 Audit Meta Desc"');
rep('"?? Audit Directives"', '"📋 Audit Directives"');
rep('"?? Audit Crawlers"', '"🔍 Audit Crawlers"');
rep('"?? Analyze CTR"', '"📈 Analyze CTR"');
rep('"?? Analyze Density"', '"🎯 Analyze Density"');
rep('"?? Analyze Structure"', '"📋 Analyze Structure"');
rep('"?? Check Authority"', '"⭐ Check Authority"');
rep('"?? Check CWV"', '"⚡ Check CWV"');
rep('"?? Check Eligibility"', '"✅ Check Eligibility"');
rep('"?? Grade"', '"📊 Grade"');
rep('"?? Score"', '"📊 Score"');
rep('"?? Validate"', '"✅ Validate"');
rep('"?? Extract Entities"', '"🧠 Extract Entities"');
rep('"?? Generate Breadcrumb JSON-LD"', '"🔗 Generate Breadcrumb JSON-LD"');
rep('"?? Predict Decay"', '"📉 Predict Decay"');

// ─── Scan History ─────────────────────────────────────────────────────────────
rep('"?? Scan History"', '"🕐 Scan History"');

// ─── Tip/info inline markers ──────────────────────────────────────────────────
rep('"?? {shopifyLinkResult.tip}"', '"💡 {shopifyLinkResult.tip}"');
rep('"?? {shopifyMetafieldResult.note}"', '"💡 {shopifyMetafieldResult.note}"');
rep('"?? Add a Table of Contents', '"💡 Add a Table of Contents');
rep('"?? Add H2/H3 headings', '"💡 Add H2/H3 headings');
rep('"?? {ctrSignals.titleLength} chars"', '"📏 {ctrSignals.titleLength} chars"');
rep('"?? Year: {ctrSignals.hasYear', '"📅 Year: {ctrSignals.hasYear');
rep('"?? Keyword: {ctrSignals.keywordPosition}"', '"🎯 Keyword: {ctrSignals.keywordPosition}"');
rep('"?? {c.contentIdea}"', '"💡 {c.contentIdea}"');
rep('"?? {lowDiffResult.lowDifficultyKeywords?.length || 0} low-difficulty', '"🎯 {lowDiffResult.lowDifficultyKeywords?.length || 0} low-difficulty');
rep('"?? Potential traffic: {lowDiffResult.estimatedTrafficPotential}"', '"📊 Potential traffic: {lowDiffResult.estimatedTrafficPotential}"');
rep('"?? Strategy: {lowDiffResult.quickWinStrategy}"', '"💡 Strategy: {lowDiffResult.quickWinStrategy}"');
rep('"?? This may block indexing"', '"⚠️ This may block indexing"');
rep('"?? AI-optimized answer:"', '"🤖 AI-optimized answer:"');
rep('"??? Ideal 29-word voice answer:"', '"🎙️ Ideal 29-word voice answer:"');
rep('"??? {kw}"', '"🎙️ {kw}"');
rep('"?? {s}"', '"🌐 {s}"');  // outreach sources
rep('"?? {faqGenResult.pageTitle}"', '"❓ {faqGenResult.pageTitle}"');
rep('"?? {statsCuratorResult.contentTitle}"', '"📊 {statsCuratorResult.contentTitle}"');
rep('"??? Pillar: {topicClusterResult.pillarPage?.title}"', '"🏛️ Pillar: {topicClusterResult.pillarPage?.title}"');
rep('"?? {eventSchemaResult.richResultPreview.eventTitle}"', '"🎉 {eventSchemaResult.richResultPreview.eventTitle}"');
rep('"?? {issue.keyword}"', '"⚠️ {issue.keyword}"');
rep('"??? {cwvResult.voiceSearchBonus}"', '"🎙️ {cwvResult.voiceSearchBonus}"');

// Tips with variable interpolation
rep('>?? {c.fix}<', '>💡 {c.fix}<');
rep('>?? {c.tip}<', '>💡 {c.tip}<');
rep('>?? {t}<', '>💡 {t}<');
rep('>?? {s}<', '>💡 {s}<');
rep('>?? {f.tip}<', '>💡 {f.tip}<');
rep('>?? {feat.tip}<', '>💡 {feat.tip}<');
rep('>?? {ampResult.tip}<', '>💡 {ampResult.tip}<');
rep('>?? {anchorResult.tips', '>💡 {anchorResult.tips');
rep('>?? {cannibResult.recommendation}<', '>💡 {cannibResult.recommendation}<');
rep('>?? {citationCheckResult.tip}<', '>💡 {citationCheckResult.tip}<');
rep('>?? {citationResult.napConsistencyTips', '>💡 {citationResult.napConsistencyTips');
rep('>?? {compResult.topicGaps', '>🎯 {compResult.topicGaps');
rep('>?? {contentStructResult.tips', '>💡 {contentStructResult.tips');
rep('>?? {crawlBudgetResult.robotsTxtIssues', '>❌ {crawlBudgetResult.robotsTxtIssues');
rep('>?? {crawlerResult.recommendation}<', '>💡 {crawlerResult.recommendation}<');
rep('>?? {ctaAuditResult.tip}<', '>💡 {ctaAuditResult.tip}<');
rep('>?? {ctaGenResult.tip}<', '>💡 {ctaGenResult.tip}<');
rep('>?? {data.missing', '>⚠️ {data.missing');
rep('>?? {dupContentResult.canonicalStatus?.recommendation}<', '>💡 {dupContentResult.canonicalStatus?.recommendation}<');
rep('>?? {entityOptResult.sameAsOpportunities', '>💡 {entityOptResult.sameAsOpportunities');
rep('>?? {emotionalToneResult.recommendation}<', '>💡 {emotionalToneResult.recommendation}<');
rep('>?? {expertiseResult.tip}<', '>💡 {expertiseResult.tip}<');
rep('>?? {extLinkAuthResult.tip}<', '>💡 {extLinkAuthResult.tip}<');
rep('>?? {featSnippetResult.tip}<', '>💡 {featSnippetResult.tip}<');
rep('>?? {formattingResult.tip}<', '>💡 {formattingResult.tip}<');
rep('>?? {hreflangResult.tip}<', '>💡 {hreflangResult.tip}<');
rep('>?? {httpsStatusResult.tip}<', '>💡 {httpsStatusResult.tip}<');
rep('>?? {indexDirectivesResult.recommendation}<', '>💡 {indexDirectivesResult.recommendation}<');
rep('>?? {intentResult.contentRecommendation}<', '>💡 {intentResult.contentRecommendation}<');
rep('>?? {intLinks.tip}<', '>💡 {intLinks.tip}<');
rep('>?? {introQualityResult.tip}<', '>💡 {introQualityResult.tip}<');
rep('>?? {jargonResult.tip}<', '>💡 {jargonResult.tip}<');
rep('>?? {jsonLdLintResult.tip}<', '>💡 {jsonLdLintResult.tip}<');
rep('>?? {kwProminenceResult.tip}<', '>💡 {kwProminenceResult.tip}<');
rep('>?? {kwTfidfResult.tip}<', '>💡 {kwTfidfResult.tip}<');
rep('>?? {linkDensityResult.tip}<', '>💡 {linkDensityResult.tip}<');
rep('>?? {negCheckResult.tip}<', '>💡 {negCheckResult.tip}<');
rep('>?? {resourceHintsResult.tip}<', '>💡 {resourceHintsResult.tip}<');
rep('>?? {thinContentResult.recommendation}<', '>💡 {thinContentResult.recommendation}<');
rep('>?? {aiOverviewResult.improvements', '>💡 {aiOverviewResult.improvements');
rep('>?? {aiOverviewResult.llmOptimizationTips', '>💡 {aiOverviewResult.llmOptimizationTips');
rep('>??? {q}<', '>🎙️ {q}<');

// ─── Standalone emoji used as large icons (empty state / section markers) ──────
rep('<div style={{ fontSize: 32, marginBottom: 8 }}>??</div>', '<div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>');
rep('<div style={{ fontSize: 42, marginBottom: 12 }}>??</div>', '<div style={{ fontSize: 42, marginBottom: 12 }}>🔍</div>');
rep('<div style={{ fontSize: 32, marginBottom: 8 }}>???</div>', '<div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>');
rep('<div style={{ fontSize: 42, marginBottom: 12 }}>???</div>', '<div style={{ fontSize: 42, marginBottom: 12 }}>🌍</div>');

// ─── Catch-all: remaining ?? / ??? patterns ────────────────────────────────────
// Use literal string splitting instead of regex to avoid ? quantifier issues
const catchAllPairs = [
  ['>??? {', '>💡 {'],
  ['>?? {', '>💡 {'],
  ['"??? ', '"💡 '],
  ['"?? ', '"💡 '],
  ['`??? ', '`💡 '],
  ['`?? ', '`💡 '],
  ['>??? ', '>💡 '],
  ['>?? ', '>💡 '],
  ['"???"', '"💡"'],
  ['"??"', '"💡"'],
];
for (const [from, to] of catchAllPairs) rep(from, to);

// ─── Write back ───────────────────────────────────────────────────────────────
fs.writeFileSync(FILE, src, 'utf8');
console.log('Done. Replaced all ?? / ??? placeholders.');

// Count remaining
const remaining = (src.match(/\?\?/g) || []).length;
console.log(`Remaining ?? occurrences: ${remaining}`);
