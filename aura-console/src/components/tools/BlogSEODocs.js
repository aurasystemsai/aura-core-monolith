/**
 * BlogSEO In-App Documentation
 * Each entry is keyed by a tool ID and contains:
 *   title       - Tool display name
 *   what        - Plain-English "what does this do" (2–3 sentences)
 *   when        - "Use this when..." guidance
 *   steps       - Array of numbered how-to steps
 *   tips        - Array of pro tips
 *   mistakes    - Array of common mistakes to avoid
 *   credits     - Credit cost (0 = free)
 *   related     - Array of related tool IDs
 *   difficulty  - "beginner" | "intermediate" | "advanced"
 *   timeEstimate - Approx time e.g. "~2 min"
 */

export const DOCS = {

  /* ═══════════════════════════════════════════════════════════
     ANALYZER
  ═══════════════════════════════════════════════════════════ */
  'analyzer': {
    title: 'SEO Analyzer',
    what: 'Scans any blog post URL and gives it an overall SEO score from 0–100. It checks over 40 on-page factors including title tags, meta descriptions, keyword usage, headings, images, links, and content length.',
    when: 'Use this before publishing a new post to catch issues early, or when an existing post has lost traffic and you want to find out why.',
    steps: [
      'Paste the full URL of your blog post into the URL field',
      'Optionally enter your target keyword in the "Focus Keyword" field',
      'Click "Analyse" and wait 5–10 seconds',
      'Review the score ring — red issues are highest priority',
      'Click on any issue card to see the specific fix required',
    ],
    tips: [
      'Aim for a score of 75 or higher before publishing',
      'Run the analyzer again after making fixes to confirm the score improved',
      'The "vs. Top 10" sub-tab compares your post directly against the top 5 ranking pages',
      'Export results as CSV to track improvement over time',
    ],
    mistakes: [
      'Do not run on draft or password-protected pages — the analyzer cannot access them',
      'A high score does not guarantee ranking — it means your on-page SEO is solid; off-page factors also matter',
    ],
    credits: 0,
    related: ['content-vs-top10', 'keyword-density', 'technical-audit', 'meta-description-optimizer'],
    difficulty: 'beginner',
    timeEstimate: '~2 min',
  },

  'ai-analyze': {
    title: 'AI SEO Analysis',
    what: 'Uses AI to generate a detailed narrative SEO report for any URL. Goes beyond raw scores to give you specific, actionable improvements written in plain English.',
    when: 'Use this when you want a human-readable explanation of what is wrong and exactly how to fix it, rather than just a score.',
    steps: [
      'Enter your post URL and target keyword',
      'Select the AI model (gpt-4o-mini for quick, gpt-4 for deeper analysis)',
      'Click "AI Analyse" — takes 15–30 seconds',
      'Read the priority-ordered recommendations',
    ],
    tips: [
      'Use gpt-4 for your most important pages — the extra cost is worth it for detailed insights',
      'Copy the recommendations directly into your editing workflow',
    ],
    mistakes: [
      'Do not run AI analysis on every post — save it for your high-priority pages',
    ],
    credits: 2,
    related: ['analyzer', 'ai-rewrite', 'content-grader'],
    difficulty: 'beginner',
    timeEstimate: '~1 min',
  },

  /* ═══════════════════════════════════════════════════════════
     KEYWORD TOOLS
  ═══════════════════════════════════════════════════════════ */
  'keyword-research': {
    title: 'Keyword Research',
    what: 'Generates a list of relevant keywords for any topic using AI. Returns search-intent classification, estimated difficulty, and content format recommendations for each keyword.',
    when: 'Use this at the start of any new content project to find the best keywords to target before you write.',
    steps: [
      'Enter your main topic or seed keyword',
      'Optionally specify your niche or industry for more targeted results',
      'Click "Research Keywords"',
      'Review the list — focus on low-difficulty, high-intent keywords first',
      'Click "Add to Tracker" on any keyword you want to monitor',
    ],
    tips: [
      'Long-tail keywords (3+ words) are almost always easier to rank for than short ones',
      'Look for question-format keywords — they often trigger Featured Snippets',
      'The "Cluster by Intent" tool groups these results by search intent automatically',
    ],
    mistakes: [
      'Do not target keywords with difficulty > 70 if your site is new (less than 12 months old)',
      'Volume estimates are approximate — treat them as relative indicators, not exact numbers',
    ],
    credits: 2,
    related: ['alphabet-soup', 'question-explorer', 'cluster-by-intent', 'kgr-calculator'],
    difficulty: 'beginner',
    timeEstimate: '~1 min',
  },

  'alphabet-soup': {
    title: 'Alphabet Soup Mining',
    what: 'Mines Google Autocomplete suggestions for every letter of the alphabet (A–Z) for your seed keyword. Generates hundreds of long-tail keyword ideas instantly.',
    when: 'Use this when you want to find every possible long-tail variation of a keyword that real people are searching for.',
    steps: [
      'Enter your seed keyword (e.g. "coffee maker")',
      'Click "Mine Suggestions"',
      'Browse or export the full A–Z list',
      'Copy promising keywords into the Keyword Research or Cluster tools',
    ],
    tips: [
      'Best used for content hub planning — find every sub-topic to cover',
      'Combine with "Question Explorer" to get both statement and question formats',
    ],
    mistakes: [
      'Not all suggestions have meaningful search volume — filter by your niche relevance',
    ],
    credits: 1,
    related: ['question-explorer', 'related-searches', 'keyword-research'],
    difficulty: 'beginner',
    timeEstimate: '~30 sec',
  },

  'question-explorer': {
    title: 'Question Explorer',
    what: 'Generates who/what/when/where/why/how question variants for any keyword. These question keywords are ideal for Featured Snippets, People Also Ask boxes, and FAQ schema.',
    when: 'Use this when writing a post and you want to target "People Also Ask" results, or when building FAQ sections.',
    steps: [
      'Enter your main keyword',
      'Click "Find Questions"',
      'Select questions to include in your content or FAQ schema',
      'Use the "FAQ Schema Generator" to convert selected questions to structured data',
    ],
    tips: [
      '"How to" and "what is" questions are the easiest to rank for as Featured Snippets',
      'Answer each question concisely in 40–60 words for best Featured Snippet capture',
    ],
    mistakes: [
      'Avoid stuffing too many question headings into one post — keep it to 3–5 per page',
    ],
    credits: 1,
    related: ['paa-dominator', 'faq-schema', 'featured-snippet-optimizer'],
    difficulty: 'beginner',
    timeEstimate: '~30 sec',
  },

  'cluster-by-serp': {
    title: 'Keyword Clustering (SERP Overlap)',
    what: 'Groups a list of keywords into clusters based on how much SERP overlap they have — keywords ranking on the same search results page should be targeted together in one post.',
    when: 'Use this after building a keyword list to figure out which keywords should be covered in the same article vs. separate articles.',
    steps: [
      'Paste up to 500 keywords (one per line)',
      'Click "Cluster"',
      'Review clusters — each cluster = one potential piece of content',
      'Export clusters to use as your content calendar',
    ],
    tips: [
      'Large clusters (10+ keywords) usually indicate a high-demand topic worth covering thoroughly',
      'Single-keyword clusters should either be deprioritised or merged with the nearest related cluster',
    ],
    mistakes: [
      'Do not create a separate page for every single keyword — Google prefers fewer, more comprehensive pages',
    ],
    credits: 2,
    related: ['cluster-by-intent', 'keyword-mapping', 'content-brief'],
    difficulty: 'intermediate',
    timeEstimate: '~2 min',
  },

  'cluster-by-intent': {
    title: 'Keyword Clustering (By Intent)',
    what: 'Classifies a keyword list into four intent buckets: Informational, Navigational, Commercial, and Transactional. Each intent type needs a different content format.',
    when: 'Use this to ensure you are matching your content format to what the searcher actually wants to find.',
    steps: [
      'Paste your keyword list',
      'Click "Classify Intent"',
      'Review the four buckets',
      'Use Informational → blog posts, Commercial → comparison pages, Transactional → product/checkout pages',
    ],
    tips: [
      'Mixing intent on a single page confuses Google — one URL should serve one primary intent',
      'Commercial keywords are ideal for Shopify collection pages, not blog posts',
    ],
    mistakes: [
      'Do not write a blog post for a clearly transactional keyword — it will not rank well',
    ],
    credits: 1,
    related: ['cluster-by-serp', 'search-intent-matrix', 'keyword-mapping'],
    difficulty: 'intermediate',
    timeEstimate: '~1 min',
  },

  'kgr-calculator': {
    title: 'Keyword Golden Ratio (KGR)',
    what: 'Calculates the Keyword Golden Ratio for any keyword. KGR = allintitle results ÷ monthly search volume. A ratio below 0.25 indicates a low-competition opportunity where ranking quickly is very likely.',
    when: 'Use this when you have a new site and need quick wins — KGR keywords are much easier to rank for than standard targets.',
    steps: [
      'Enter a keyword',
      'The tool fetches the allintitle count and estimated volume',
      'A KGR below 0.25 = green (go for it), 0.25–1.0 = yellow (maybe), above 1.0 = red (too competitive)',
    ],
    tips: [
      'KGR works best for long-tail keywords (3–5 words) under 250 monthly searches',
      'Batch-test multiple keywords to quickly identify your best opportunities',
    ],
    mistakes: [
      'A low KGR does not mean the topic has no competition — it means the exact page title is uncrowded',
    ],
    credits: 1,
    related: ['personal-difficulty', 'keyword-research', 'alphabet-soup'],
    difficulty: 'intermediate',
    timeEstimate: '~30 sec',
  },

  /* ═══════════════════════════════════════════════════════════
     CONTENT TOOLS
  ═══════════════════════════════════════════════════════════ */
  'content-brief': {
    title: 'Content Brief Generator',
    what: 'Generates a complete editorial brief for any keyword or topic. Includes target keyword, secondary keywords, recommended word count, suggested headings, competitor overview, and key points to cover.',
    when: 'Use this at the start of every new article — especially useful for briefing writers or using as an AI writing prompt.',
    steps: [
      'Enter your target keyword and optionally your industry',
      'Select AI model',
      'Click "Generate Brief"',
      'Review the brief — edit headings and key points as needed',
      'Use the brief to guide your writing or paste into AI Create as a skeleton',
    ],
    tips: [
      'The brief includes competitor analysis — read what the top 5 ranking pages cover and go deeper',
      'Save the brief to your voice profile to ensure every writer uses your brand voice',
      'Brief + Full Blog Writer together = fast, high-quality first drafts in under 5 minutes',
    ],
    mistakes: [
      'Do not follow the brief so rigidly that you ignore what makes your content unique and valuable',
    ],
    credits: 2,
    related: ['full-blog-writer', 'outline-generator', 'intro-generator', 'voice-profile'],
    difficulty: 'beginner',
    timeEstimate: '~2 min',
  },

  'full-blog-writer': {
    title: 'Full Blog Post Writer',
    what: 'Writes a complete 2,000–3,500 word SEO-optimised blog post from a keyword or brief. Uses gpt-4 for high-quality output with natural keyword integration, internal link suggestions, and proper heading structure.',
    when: 'Use this when you need a full first draft quickly. Always review and personalise the output before publishing.',
    steps: [
      'Enter your target keyword and topic',
      'Optionally select a Voice Profile to match your brand tone',
      'Select content type (how-to, listicle, pillar page, news, etc.)',
      'Click "Write Post" — takes 60–90 seconds for a full article',
      'Review, edit and personalise the draft before publishing',
    ],
    tips: [
      'Always add personal experience, original data, or unique examples to AI-written drafts',
      'Use the Content Humanizer tool if the draft sounds robotic',
      'Run the Analyzer on the finished post to confirm the SEO score is 75+',
    ],
    mistakes: [
      'Do not publish AI content without review — Google rewards experience and authenticity',
      'Do not use the same keyword for multiple AI-written posts — check cannibalization first',
    ],
    credits: 15,
    related: ['content-brief', 'content-humanizer', 'analyzer', 'ai-content-detector'],
    difficulty: 'beginner',
    timeEstimate: '~2 min',
  },

  'content-humanizer': {
    title: 'Content Humanizer',
    what: 'Rewrites AI-generated or generic-sounding text to sound naturally human-written. Varies sentence structure, adds conversational phrases, and removes tell-tale AI patterns.',
    when: 'Use this on any AI-generated content before publishing, or on any post that sounds stiff or robotic.',
    steps: [
      'Paste the text you want to humanize',
      'Click "Humanize"',
      'Review the output — it should sound more natural and conversational',
      'Run AI Content Detector to verify the score improved',
    ],
    tips: [
      'Best results come from humanizing in paragraphs, not the whole article at once',
      'Add your own anecdotes or examples manually — no AI can replicate genuine experience',
    ],
    mistakes: [
      'Humanizing changes the wording but not the ideas — you still need to add original value',
    ],
    credits: 2,
    related: ['ai-content-detector', 'full-blog-writer', 'tone-analyzer'],
    difficulty: 'beginner',
    timeEstimate: '~1 min',
  },

  'ai-content-detector': {
    title: 'AI Content Detector',
    what: 'Analyses text to estimate the probability it was AI-generated. Returns a percentage score and highlights the most AI-sounding passages.',
    when: 'Use this before publishing any AI-assisted content to verify it reads naturally, or when reviewing content from writers.',
    steps: [
      'Paste your content into the text field',
      'Click "Detect"',
      'Review the overall score — aim for below 30% AI probability',
      'Focus rewrites on the highlighted passages with highest AI probability',
    ],
    tips: [
      'Adding personal stories, specific data, and unique opinions consistently lowers AI detection scores',
      'Even 100% human writers sometimes score in the AI range if they write in a formulaic style',
    ],
    mistakes: [
      'AI detection tools are not 100% accurate — use as a quality indicator, not a verdict',
    ],
    credits: 1,
    related: ['content-humanizer', 'full-blog-writer', 'originality-check'],
    difficulty: 'beginner',
    timeEstimate: '~30 sec',
  },

  'atomize': {
    title: 'Content Atomizer',
    what: 'Takes one blog post and generates all repurposed content variants in one click: email newsletter, X/Twitter thread, LinkedIn article, Instagram caption, YouTube script, email sequence, and slide deck outline.',
    when: 'Use this immediately after publishing any significant blog post to maximise its reach across all channels.',
    steps: [
      'Paste your blog post URL or the full article text',
      'Select which formats you want (or tick "All")',
      'Click "Atomize"',
      'Copy each variant to the appropriate platform',
    ],
    tips: [
      'The X thread format works best when the blog post has clear numbered points or steps',
      'LinkedIn articles should be edited to feel more personal before posting — add your own commentary',
      'Schedule these repurposed pieces over 2 weeks for maximum reach from a single piece of content',
    ],
    mistakes: [
      'Do not post all variants on the same day — space them out to sustain traffic over time',
    ],
    credits: 5,
    related: ['newsletter-digest', 'x-thread', 'linkedin-article', 'youtube-optimizer'],
    difficulty: 'beginner',
    timeEstimate: '~2 min',
  },

  /* ═══════════════════════════════════════════════════════════
     TECHNICAL SEO
  ═══════════════════════════════════════════════════════════ */
  'technical-audit': {
    title: 'Technical SEO Audit',
    what: 'Runs a comprehensive technical health check on any URL covering Core Web Vitals, mobile-friendliness, HTTPS, crawlability, canonical tags, hreflang, and structured data.',
    when: 'Use this on any important page that is underperforming despite good content, or before major site changes.',
    steps: [
      'Enter the URL to audit',
      'Click "Run Audit"',
      'Issues are shown in three severity levels: High (red), Medium (orange), Low (blue)',
      'Fix High issues first — they have the most impact on rankings',
    ],
    tips: [
      'Core Web Vitals (LCP, CLS, INP) are Google ranking signals — prioritise them',
      'Run a re-audit after fixes to verify they are resolved',
      'Use the "Generate Dev Ticket" button to create a formatted task card to send to your developer',
    ],
    mistakes: [
      'Ignoring mobile SEO issues — over 60% of searches are now on mobile',
    ],
    credits: 0,
    related: ['core-web-vitals', 'crawl-start', 'js-rendering-audit', 'security-headers'],
    difficulty: 'intermediate',
    timeEstimate: '~3 min',
  },

  'core-web-vitals': {
    title: 'Core Web Vitals',
    what: 'Fetches real-world CrUX data and Lighthouse scores for LCP (Largest Contentful Paint), CLS (Cumulative Layout Shift), and INP (Interaction to Next Paint) for any URL.',
    when: 'Use this when a page is ranking lower than expected, or when Google Search Console flags CWV issues.',
    steps: [
      'Enter the URL',
      'Click "Check CWV"',
      'Review each metric: LCP < 2.5s, CLS < 0.1, INP < 200ms = passing',
      'Click the "How to fix" link on any failing metric for specific recommendations',
    ],
    tips: [
      'LCP is most commonly caused by slow hero images — compress and lazy-load them',
      'CLS is usually caused by images without explicit width/height attributes or late-loading ads',
      'INP is the newest metric (replaced FID in 2024) — track it in GSC',
    ],
    mistakes: [
      'Do not only test your homepage — test your top-traffic blog posts individually',
    ],
    credits: 0,
    related: ['technical-audit', 'page-speed-advisor', 'lcp-deep-dive', 'inp-advisor'],
    difficulty: 'intermediate',
    timeEstimate: '~2 min',
  },

  'js-rendering-audit': {
    title: 'JavaScript Rendering Audit',
    what: 'Compares the raw HTML Googlebot initially sees with the fully rendered HTML after JavaScript executes. Surfaces any content visible to users but invisible to search engines.',
    when: 'Use this if your site uses React, Vue, Angular or any JavaScript framework, or if Google seems to be missing content from your pages.',
    steps: [
      'Enter the URL',
      'Click "Audit Rendering"',
      'Compare the Raw HTML and Rendered HTML columns',
      'Any content in Rendered but not Raw = invisible to Googlebot on first pass',
    ],
    tips: [
      'Critical content like headings and internal links should be in raw HTML, not JavaScript-rendered',
      'If important content is JavaScript-only, consider server-side rendering or static generation',
    ],
    mistakes: [
      'Assuming Googlebot can always render JavaScript — it does, but with delays of days to weeks',
    ],
    credits: 1,
    related: ['technical-audit', 'crawl-start', 'crawler-access'],
    difficulty: 'advanced',
    timeEstimate: '~2 min',
  },

  /* ═══════════════════════════════════════════════════════════
     RANK TRACKER
  ═══════════════════════════════════════════════════════════ */
  'rank-tracker': {
    title: 'Rank Tracker',
    what: 'Tracks your keyword rankings over time and shows you whether positions are rising, falling, or stable. Supports up to 100 tracked keywords with daily check alerts.',
    when: 'Use this to monitor the impact of your SEO work over time. Add your most important keywords and check weekly.',
    steps: [
      'Click "Add Keyword" and enter a keyword + target URL',
      'Click "Check Positions" to run an initial rank check',
      'Set up an alert if you want notifications when a keyword drops more than 5 positions',
      'Import your Google Search Console CSV for real verified position data',
      'Return weekly to review the position trend charts',
    ],
    tips: [
      'Import GSC data for the most accurate positions — AURA\'s scraped estimates may differ slightly',
      'Group keywords into URL groups (e.g. all blog posts, all product pages) to track at a cluster level',
      'The "YoY Comparison" view shows whether you are growing compared to the same period last year',
    ],
    mistakes: [
      'Checking rankings daily creates anxiety — weekly reviews are enough to spot meaningful trends',
      'Rankings fluctuate naturally by 1–5 positions — only act if a drop is sustained for 2+ weeks',
    ],
    credits: 2,
    related: ['gsc-import', 'keyword-velocity', 'rank-forecast', 'device-split'],
    difficulty: 'beginner',
    timeEstimate: '~5 min setup',
  },

  'rank-forecast': {
    title: 'Rank Forecast',
    what: 'Uses AI to predict where a keyword\'s ranking is likely to move over the next 30–90 days based on current trend, competition signals, and content quality.',
    when: 'Use this to set realistic expectations for new content and to prioritise which keywords to focus optimisation effort on.',
    steps: [
      'Select a tracked keyword from your Rank Tracker list',
      'Click "Generate Forecast"',
      'Review the predicted trajectory and confidence score',
      'Act on "High opportunity" forecasts first — these are keywords close to page 1 with upward momentum',
    ],
    tips: [
      'Forecasts are most accurate for keywords you\'ve been tracking for 30+ days (more history = better model)',
      'Pair with Keyword Velocity to spot accelerating trends before they peak',
    ],
    mistakes: [
      'Forecasts are probabilistic — treat them as directional signals, not guarantees',
    ],
    credits: 2,
    related: ['rank-tracker', 'keyword-velocity', 'content-decay'],
    difficulty: 'intermediate',
    timeEstimate: '~1 min',
  },

  /* ═══════════════════════════════════════════════════════════
     SITE CRAWL
  ═══════════════════════════════════════════════════════════ */
  'site-crawl': {
    title: 'Site Crawler',
    what: 'Crawls up to 500 pages of your website and builds a complete map of every SEO issue found. Detects broken links, missing meta data, duplicate titles, orphan pages, redirect chains, and more.',
    when: 'Run a full crawl once per month, after any major site change, or when you notice a sudden drop in traffic.',
    steps: [
      'Enter your site\'s homepage URL (e.g. https://yoursite.com)',
      'Click "Start Crawl" — a progress bar shows pages discovered',
      'When complete, review issues by severity (High → Medium → Low)',
      'Use filters to focus on specific issue types (broken links, missing meta, etc.)',
      'Click "AI Summary" for a priority-ordered action plan',
    ],
    tips: [
      'Fix all 404 errors first — broken links waste crawl budget and harm user experience',
      'The "Orphan Pages" tab shows pages with no internal links — add links to these from relevant posts',
      'Save a snapshot after each crawl to compare issues over time',
      'Use "Export CSV" to share the issue list with your developer',
    ],
    mistakes: [
      'Do not run frequent crawls on very large sites (thousands of pages) — it puts load on your server',
      'Orphan pages are not always a problem — some pages (e.g. thank-you pages) are intentionally unlinked',
    ],
    credits: 0,
    related: ['technical-audit', 'redirect-chain-mapper', 'crawl-compare', 'orphan-finder'],
    difficulty: 'intermediate',
    timeEstimate: '~10 min for 500 pages',
  },

  'crawl-compare': {
    title: 'Crawl Snapshot Comparison',
    what: 'Compares two saved crawl snapshots to show exactly what SEO issues appeared, were resolved, or worsened between two points in time.',
    when: 'Use this after a site migration, redesign, plugin update, or any major change to verify you have not introduced new issues.',
    steps: [
      'Run at least two crawls (they are auto-saved)',
      'Select a "Before" and "After" snapshot',
      'Click "Compare" to see the diff',
      'New Issues (red) = problems introduced; Resolved (green) = problems fixed',
    ],
    tips: [
      'Always take a snapshot before a major site change so you have a clean baseline to compare against',
      'The "Critical New Issues" alert highlights anything that could cause an immediate ranking impact',
    ],
    mistakes: [
      'Do not delete old snapshots — they are your audit trail and baseline for comparisons',
    ],
    credits: 0,
    related: ['site-crawl', 'technical-audit', 'cicd-pre-deploy'],
    difficulty: 'advanced',
    timeEstimate: '~2 min',
  },

  /* ═══════════════════════════════════════════════════════════
     GEO — GENERATIVE ENGINE OPTIMISATION
  ═══════════════════════════════════════════════════════════ */
  'geo-health-score': {
    title: 'GEO Health Score',
    what: 'Measures your content\'s readiness to be cited by AI search engines (ChatGPT, Perplexity, Google AI Overviews, etc.) across three pillars: Discovery (can AI find you), Understanding (can AI parse your content), and Inclusion (will AI cite you).',
    when: 'Use this if you are concerned about visibility in AI-powered search results, or if your organic traffic has been declining as AI Overviews have expanded.',
    steps: [
      'Enter your site URL and a topic/keyword you want to be cited for',
      'Click "Check GEO Health"',
      'Review your score for each of the three pillars',
      'Click into any failing pillar for specific fix recommendations',
    ],
    tips: [
      'The Discovery pillar is most affected by your llms.txt file and site speed for AI crawlers',
      'The Understanding pillar improves dramatically with proper structured data (FAQ, HowTo, Speakable schema)',
      'The Inclusion pillar requires original research, clear citations, and authoritative writing style',
    ],
    mistakes: [
      'AI search optimisation does not replace traditional SEO — it is an additional layer on top of it',
    ],
    credits: 2,
    related: ['llms-txt-generator', 'prompt-simulation', 'citation-gap', 'ai-platform-tracker'],
    difficulty: 'advanced',
    timeEstimate: '~3 min',
  },

  'prompt-simulation': {
    title: 'LLM Prompt Simulator',
    what: 'Simulates what a user might ask ChatGPT or Perplexity about your topic, then shows you whether your content would likely be cited in the AI\'s response and why — or why not.',
    when: 'Use this to test whether your content is likely to appear in AI search results for your target queries.',
    steps: [
      'Enter the topic or question a user might ask an AI about your area',
      'Enter your site URL',
      'Click "Simulate"',
      'Review the citation likelihood score and the specific reasons for or against inclusion',
    ],
    tips: [
      'Content that directly answers the question concisely is much more likely to be cited',
      'AI models prefer pages with clear author attribution, date stamps, and cited sources',
      'Structured data (especially Speakable and FAQ schema) significantly improves citation likelihood',
    ],
    mistakes: [
      'AI citation is not just about keywords — it\'s about being the most trustworthy, clear, and direct answer',
    ],
    credits: 3,
    related: ['geo-health-score', 'citation-gap', 'faq-for-llm', 'speakable-schema'],
    difficulty: 'advanced',
    timeEstimate: '~2 min',
  },

  'llms-txt-generator': {
    title: 'llms.txt Generator',
    what: 'Automatically generates an llms.txt and llms-full.txt file for your domain. These files tell AI crawlers which pages are most important and how to understand your site — the robots.txt equivalent for AI systems.',
    when: 'Use this now — llms.txt is an emerging standard. Setting it up early gives you a first-mover advantage as AI crawlers adopt it.',
    steps: [
      'Enter your domain URL',
      'Click "Generate llms.txt"',
      'Review the generated file — it lists your key pages with descriptions',
      'Copy the content and upload as /llms.txt on your server',
      'Also upload the /llms-full.txt for AI systems that want more detail',
    ],
    tips: [
      'Keep your llms.txt updated when you add major new content sections',
      'Prioritise your most authoritative, comprehensive pages in the file',
      'The standard is at llmstxt.org — review it for the latest specification',
    ],
    mistakes: [
      'Do not list every URL — focus on your most important and representative pages',
    ],
    credits: 0,
    related: ['geo-health-score', 'robots-txt-generator', 'mcp-schema-generator'],
    difficulty: 'intermediate',
    timeEstimate: '~2 min',
  },

  'ai-platform-tracker': {
    title: 'AI Platform Visibility Tracker',
    what: 'Tracks your brand\'s visibility and mention frequency across 8 AI search platforms: ChatGPT, Perplexity, Google AI Overview, Gemini, Claude, Microsoft Copilot, Grok, and DeepSeek. Stores history so you can track trends.',
    when: 'Use this monthly to measure whether your GEO efforts are working and where competitors are gaining ground.',
    steps: [
      'Enter your brand name and top 3–5 competitor names',
      'Enter 5–10 queries that users in your niche might ask AI',
      'Click "Check Visibility"',
      'Review the mention matrix — green = mentioned, red = not mentioned',
      'Review historical trend to see whether your visibility is growing',
    ],
    tips: [
      'Focus first on platforms where your competitors appear but you do not — these are your biggest gaps',
      'Content that contains statistics, original data, and clear author attribution is most likely to be cited',
    ],
    mistakes: [
      'AI visibility is not the same as being the top organic result — different strategies are required',
    ],
    credits: 3,
    related: ['geo-health-score', 'mention-gap', 'ai-brand-sentiment', 'prompt-simulation'],
    difficulty: 'advanced',
    timeEstimate: '~5 min',
  },

  /* ═══════════════════════════════════════════════════════════
     TREND SCOUT
  ═══════════════════════════════════════════════════════════ */
  'rising-topics': {
    title: 'Rising Topics Finder',
    what: 'Discovers topics and keywords that are rapidly gaining search popularity in your niche — surfacing them weeks or months before they peak when competition is lowest.',
    when: 'Use this at the start of each month as part of your content planning process.',
    steps: [
      'Enter your niche or industry',
      'Click "Find Rising Topics"',
      'Review the list sorted by growth velocity (fastest-rising first)',
      'Click "Get Content Brief" on any topic to start writing immediately',
    ],
    tips: [
      'First-mover content written before a trend peaks consistently outperforms content written at peak',
      'Combine with Seasonal Planner to see if a trend is seasonal or a genuine new search behaviour',
    ],
    mistakes: [
      'Not all rising topics are worth targeting — check if the topic fits your niche before investing',
    ],
    credits: 2,
    related: ['seasonal-planner', 'first-mover-brief', 'keyword-surge-detector', 'trend-report'],
    difficulty: 'intermediate',
    timeEstimate: '~2 min',
  },

  'seasonal-planner': {
    title: 'Seasonal Content Planner',
    what: 'Maps out when each topic in your niche peaks in search volume across the year. Generates a 12-month content calendar timed to capture seasonal traffic at its peak.',
    when: 'Use this in Q4 planning to map out your entire next year\'s content calendar around seasonal demand.',
    steps: [
      'Enter your niche/industry and up to 10 seed topics',
      'Click "Generate Calendar"',
      'Review the month-by-month peak schedule',
      'Export as a content calendar spreadsheet',
    ],
    tips: [
      'Publish seasonal content 4–8 weeks BEFORE the peak — it takes time to rank',
      'Evergreen content published in off-peak periods still captures year-round traffic',
    ],
    mistakes: [
      'Publishing Christmas content in December is too late — publish in October',
    ],
    credits: 2,
    related: ['rising-topics', 'content-calendar', 'trend-report', 'shopify-seasonal-meta'],
    difficulty: 'intermediate',
    timeEstimate: '~2 min',
  },

  /* ═══════════════════════════════════════════════════════════
     BACKLINKS
  ═══════════════════════════════════════════════════════════ */
  'digital-pr-pitch': {
    title: 'Digital PR Pitch Generator',
    what: 'Generates compelling digital PR story angles designed to earn links from journalists and bloggers. Creates ready-to-send pitch emails targeting your most link-worthy content.',
    when: 'Use this when you want to build authoritative backlinks through press coverage rather than outreach to random sites.',
    steps: [
      'Enter your content URL or topic',
      'Describe your target audience and niche',
      'Click "Generate Pitches"',
      'Review the 3–5 story angles with suggested journalist targets',
      'Customise and send the pitch emails',
    ],
    tips: [
      'Stories with original data (surveys, studies, experiments) get 3x more coverage than opinion pieces',
      'Newsjacking angles (tying your content to current events) get the fastest responses',
      'Follow up once after 5 days — most journalists respond within 48 hours if they are interested',
    ],
    mistakes: [
      'Do not pitch to journalists who clearly cover a different topic — research their beat first',
    ],
    credits: 3,
    related: ['citation-tracker', 'pr-press-planner', 'data-journalism-brief', 'outreach-pipeline'],
    difficulty: 'intermediate',
    timeEstimate: '~3 min',
  },

  /* ═══════════════════════════════════════════════════════════
     LOCAL SEO
  ═══════════════════════════════════════════════════════════ */
  'local-pack-optimizer': {
    title: 'Local Pack Optimizer',
    what: 'Audits your Google Business Profile, local citations, and on-page local SEO signals with a prioritised checklist to help you rank in the Google local 3-pack.',
    when: 'Use this if you have a physical business location that should appear in local search results.',
    steps: [
      'Enter your business name and location',
      'Click "Audit Local SEO"',
      'Work through the checklist starting with High priority items',
      'Use the "Review Response Generator" to respond to recent Google reviews',
    ],
    tips: [
      'Consistent NAP (Name, Address, Phone) across all directories is the most important local SEO factor',
      'Posting weekly on Google Business Profile significantly improves local ranking',
      'Reviews with keyword mentions (e.g. "great coffee shop in Manchester") boost local rankings',
    ],
    mistakes: [
      'Do not use a P.O. box as your business address — Google requires a real, verifiable location',
    ],
    credits: 0,
    related: ['nap-consistency', 'review-response', 'gbp-post-generator', 'local-schema'],
    difficulty: 'beginner',
    timeEstimate: '~5 min',
  },

  /* ═══════════════════════════════════════════════════════════
     E-E-A-T & BRAND
  ═══════════════════════════════════════════════════════════ */
  'eeat-scorer': {
    title: 'E-E-A-T Scorer',
    what: 'Evaluates your content and site against Google\'s E-E-A-T signals: Experience, Expertise, Authoritativeness, and Trustworthiness. Returns a score and specific improvements.',
    when: 'Use this on any YMYL (Your Money or Your Life) content — health, finance, legal, news — where E-E-A-T has the highest impact on rankings.',
    steps: [
      'Enter your page URL',
      'Click "Score E-E-A-T"',
      'Review each of the four pillars scored separately',
      'Follow the priority recommendations to improve each area',
    ],
    tips: [
      'Author bio pages with credentials, social proof, and publications dramatically improve Expertise scores',
      'Citing your sources (linking to studies, official bodies) improves Trustworthiness',
      '"Experience" signals come from first-person language, case studies, and original research',
    ],
    mistakes: [
      'E-E-A-T is not about keywords — it is about demonstrating real-world expertise and credibility',
    ],
    credits: 0,
    related: ['author-bio', 'brand-signals', 'trust-builder', 'knowledge-graph-optimizer'],
    difficulty: 'intermediate',
    timeEstimate: '~3 min',
  },

  /* ═══════════════════════════════════════════════════════════
     SCHEMA & STRUCTURED DATA
  ═══════════════════════════════════════════════════════════ */
  'schema-generator': {
    title: 'Schema Generator',
    what: 'Generates valid JSON-LD structured data markup for any page type. Supports 20+ schema types including Article, Product, Recipe, FAQ, HowTo, Event, Review, Video, Person, and more.',
    when: 'Use this to add structured data to any page to enable rich results in Google Search (stars, FAQs, breadcrumbs, etc. appearing in search listings).',
    steps: [
      'Select the schema type that matches your page',
      'Fill in the fields (most are optional — fill as many as possible)',
      'Click "Generate Schema"',
      'Copy the generated JSON-LD code',
      'Paste it inside a <script type="application/ld+json"> tag in your page\'s <head>',
      'Validate using Google\'s Rich Results Test',
    ],
    tips: [
      'FAQ schema is the easiest to implement and often shows immediately in search results',
      'Article schema on every blog post improves how Google understands your content dates and authors',
      'Speakable schema marks the key quotable paragraphs — important for Google AI Overview inclusion',
    ],
    mistakes: [
      'Do not add schema that misrepresents your content — Google penalises misleading structured data',
      'Always validate schema after adding it — a single syntax error breaks the whole block',
    ],
    credits: 0,
    related: ['schema-breadcrumb', 'schema-faq', 'schema-howto', 'schema-speakable', 'json-ld-lint'],
    difficulty: 'intermediate',
    timeEstimate: '~5 min',
  },

  'speakable-schema': {
    title: 'Speakable Schema',
    what: 'Generates Speakable schema markup that flags specific sections of your content as ideal for voice assistants (Google Assistant, Alexa) and AI search engines to read aloud or cite.',
    when: 'Use this on any informational post where you want to be cited in AI Overviews or voice search responses.',
    steps: [
      'Enter your page URL or paste the article text',
      'The tool identifies the most "speakable" passages (concise, authoritative, direct answers)',
      'Review and confirm which sections to mark',
      'Add the generated schema to your page',
    ],
    tips: [
      'Speakable sections should be 20–40 seconds of reading time (about 50–120 words)',
      'The most effective speakable sections are direct, factual answers that stand alone without context',
    ],
    mistakes: [
      'Do not mark promotional or salesy language as Speakable — it will not be read',
    ],
    credits: 0,
    related: ['schema-generator', 'faq-for-llm', 'voice-optimizer', 'geo-health-score'],
    difficulty: 'advanced',
    timeEstimate: '~3 min',
  },

  /* ═══════════════════════════════════════════════════════════
     SERP & CTR
  ═══════════════════════════════════════════════════════════ */
  'content-vs-top10': {
    title: 'Content vs. Top 10',
    what: 'Fetches and analyses the top 5 ranking pages for your target keyword. Compares their word count, heading structure, LSI keywords, image count, and schema types against your content — showing you exactly what you need to add to compete.',
    when: 'Use this before writing new content (to know what to include) or when optimising an existing post that is stuck on page 2.',
    steps: [
      'Enter your target keyword',
      'Optionally enter your page URL for side-by-side comparison',
      'Click "Analyse Top 10"',
      'Review the gaps: terms competitors use that you do not, structural differences, word count gaps',
      'Add the missing elements to your content',
    ],
    tips: [
      'Focus on the "LSI Terms Gap" — terms all 5 competitors use that you do not — these are must-adds',
      'Do not just match the average word count — try to be the most comprehensive result',
      'If all top-10 competitors use FAQ schema, you should too',
    ],
    mistakes: [
      'Matching competitors exactly is a floor, not a ceiling — adding more value is what makes you rank above them',
    ],
    credits: 5,
    related: ['analyzer', 'keyword-frequency-targets', 'semantic-enrichment', 'content-brief'],
    difficulty: 'intermediate',
    timeEstimate: '~3 min',
  },

  'featured-snippet-optimizer': {
    title: 'Featured Snippet Optimizer',
    what: 'Analyses your content and rewrites the most relevant section to make it ideal for a Google Featured Snippet (the boxed answer at the top of search results, Position 0).',
    when: 'Use this when a post is ranking in positions 3–10 and the query has an informational intent — these are the most likely candidates for snippet capture.',
    steps: [
      'Enter the URL of the post and the target keyword',
      'Click "Optimise for Snippet"',
      'Review the rewritten passage — it should directly answer the query in 40–60 words',
      'Replace the corresponding section in your post with the optimised version',
    ],
    tips: [
      'Definition-format snippets ("X is Y") and numbered lists are the two most common snippet formats',
      'The question must appear as a heading (H2/H3) above the answer for best results',
      'Tables are the fastest way to get a Featured Snippet for comparison-type queries',
    ],
    mistakes: [
      'Do not optimise for snippets on very competitive keywords — focus on positions 3–10 first',
    ],
    credits: 2,
    related: ['paa-dominator', 'zero-click', 'question-explorer', 'content-vs-top10'],
    difficulty: 'intermediate',
    timeEstimate: '~2 min',
  },

  /* ═══════════════════════════════════════════════════════════
     SHOPIFY SEO
  ═══════════════════════════════════════════════════════════ */
  'shopify-seo': {
    title: 'Shopify SEO Audit',
    what: 'Runs a Shopify-specific SEO audit pulling data directly from your store via the Shopify API. Checks product pages, collection pages, blog posts, theme structure, URL format, and metafield usage.',
    when: 'Run this once per month on your Shopify store, and after any theme change or major product update.',
    steps: [
      'Your store is automatically connected via the Shopify session',
      'Click "Run Shopify Audit"',
      'Issues are grouped by type: Products, Collections, Blog, Theme, Technical',
      'Click any issue for specific fix instructions',
    ],
    tips: [
      'Collection page descriptions are one of the most underused SEO opportunities in Shopify — most stores leave them blank',
      'Turn off duplicate tag URLs (/collections/t-shirts vs /products/red-tshirt) using canonical tags',
      'Shopify auto-generates sitemaps — use "Sitemap Enhancer" to add priority weighting',
    ],
    mistakes: [
      'Shopify\'s default /collections/all URL generates a duplicate content issue — add noindex or canonical',
    ],
    credits: 0,
    related: ['blog-tag-optimizer', 'product-blog-linker', 'collection-content-optimizer', 'theme-seo-audit'],
    difficulty: 'beginner',
    timeEstimate: '~5 min',
  },

  /* ═══════════════════════════════════════════════════════════
     VOICE PROFILE / BRAND
  ═══════════════════════════════════════════════════════════ */
  'voice-profile': {
    title: 'Brand Voice Library',
    what: 'Saves your brand\'s writing style, tone, vocabulary, and rules as a reusable profile. Every AI content generation tool can then match your brand voice automatically rather than producing generic output.',
    when: 'Set this up once before using any AI writing tools. It dramatically improves the quality and consistency of all AI-generated content.',
    steps: [
      'Enter a name for your voice profile (e.g. "Our Blog Voice")',
      'Describe your tone (casual, authoritative, playful, professional)',
      'List vocabulary to use and avoid',
      'Add any brand-specific rules (e.g. "Always use British English", "Never use jargon")',
      'Paste a sample paragraph that represents your ideal writing style',
      'Click "Save Profile"',
    ],
    tips: [
      'The more specific your rules, the better the output — "conversational but professional" is vague; specific examples work much better',
      'You can save multiple profiles for different use cases (blog articles, product descriptions, social media)',
      'Select a voice profile in any AI Create tool to activate it',
    ],
    mistakes: [
      'Skipping the sample paragraph — it is the single most important field for teaching the AI your style',
    ],
    credits: 0,
    related: ['full-blog-writer', 'content-brief', 'ai-rewrite', 'brand-signals'],
    difficulty: 'beginner',
    timeEstimate: '~5 min setup',
  },

  /* ═══════════════════════════════════════════════════════════
     CONTENT+ TOOLS
  ═══════════════════════════════════════════════════════════ */
  'helpful-content-checklist': {
    title: 'Helpful Content Checklist',
    what: 'Audits your content against all of Google\'s Helpful Content criteria — the guidelines Google uses to identify and demote low-quality, unhelpful, or AI-generated-for-SEO content.',
    when: 'Use this on any post that has experienced a significant ranking drop, or before publishing high-stakes content.',
    steps: [
      'Enter your post URL or paste the content',
      'Click "Run Checklist"',
      'Review each criterion — red = failing, orange = partially meeting, green = passing',
      'Follow recommendations for each failing criterion',
    ],
    tips: [
      'The most commonly failing criteria are: original information, substantial value beyond what competitors offer, and author expertise signals',
      'First-person experience language ("I tested this", "In my experience") strongly satisfies the Experience criterion',
    ],
    mistakes: [
      'Meeting all checklist criteria does not guarantee recovery if a site-wide Helpful Content penalty has been applied',
    ],
    credits: 0,
    related: ['eeat-scorer', 'ai-content-detector', 'content-grader', 'expertise-signals'],
    difficulty: 'intermediate',
    timeEstimate: '~3 min',
  },

  'content-decay': {
    title: 'Content Decay Detector',
    what: 'Identifies posts that have lost significant traffic or rankings compared to their peak. Shows the percentage of traffic lost and recommends a refresh strategy.',
    when: 'Run this on your entire blog every 3 months to find posts that need updating before they lose more ground.',
    steps: [
      'Enter a URL or use Bulk Scan to check your whole site',
      'Click "Check Decay"',
      'Posts with > 20% traffic loss vs. their peak are flagged for refresh',
      'Click "Refresh Strategy" for AI-generated recommendations specific to each post',
    ],
    tips: [
      'Refreshing a decaying post is often faster and more impactful than writing new content',
      'The fastest refresh wins: update statistics, add a new section to address new questions, and update the date',
      'Use Content vs. Top 10 to see what the current top-ranking pages have that your older post lacks',
    ],
    mistakes: [
      'Do not change the URL of a decaying post — redirect chains compound the problem',
    ],
    credits: 1,
    related: ['content-vs-top10', 'search-intent-shift', 'content-refresh', 'stale-cornerstone'],
    difficulty: 'intermediate',
    timeEstimate: '~2 min',
  },

  /* ═══════════════════════════════════════════════════════════
     LOG FILE ANALYSIS
  ═══════════════════════════════════════════════════════════ */
  'log-file-analyzer': {
    title: 'Server Log Analyzer',
    what: 'Parses your web server log file to show exactly which pages search engine bots are crawling, how often, and whether AI crawlers (GPTBot, ClaudeBot, PerplexityBot) are accessing your content.',
    when: 'Use this when investigating crawl budget issues, after a major ranking drop, or to understand how AI crawlers are engaging with your content.',
    steps: [
      'Export a log file from your hosting control panel or CDN (Apache, Nginx, Cloudflare)',
      'Upload the log file',
      'Click "Analyse"',
      'Review the bot breakdown — Googlebot, Bingbot, and 7 AI crawlers shown separately',
      'Check "Budget Waste" tab for pages being crawled frequently but generating no traffic',
    ],
    tips: [
      'Pages crawled by GPTBot/ClaudeBot frequently are often good AI citation targets — invest more in these',
      'Pages with high crawl frequency but zero traffic are wasting crawl budget — consider noindexing or consolidating them',
      'The "Crawl to Index Lag" metric shows how fast Google is indexing your content',
    ],
    mistakes: [
      'Do not block all AI crawlers — GPTBot (OpenAI), PerplexityBot, and GoogleBot-Extended drive new traffic sources',
    ],
    credits: 0,
    related: ['site-crawl', 'crawl-budget', 'ai-bot-blocker', 'geo-health-score'],
    difficulty: 'advanced',
    timeEstimate: '~10 min (depends on log size)',
  },

  /* ═══════════════════════════════════════════════════════════
     MONITORING
  ═══════════════════════════════════════════════════════════ */
  'page-monitor': {
    title: 'Page Change Monitor',
    what: 'Watches any set of URLs for changes to specific page elements (title, meta, headings, schema, canonical, body text). Sends alerts when unauthorised or unexpected changes are detected.',
    when: 'Use this on your most important pages to catch accidental SEO regressions from plugin updates, theme changes, or content edits.',
    steps: [
      'Click "Add URL" to start monitoring a page',
      'Optionally specify which elements to watch (or monitor all by default)',
      'Changes appear in the Changelog within 24 hours of detection',
      'Review each change to determine if it was intentional',
    ],
    tips: [
      'Monitor your 10 highest-traffic pages at minimum',
      'Set up Slack alerts so you hear about changes immediately',
      'After a theme update or plugin upgrade, check the monitor immediately',
    ],
    mistakes: [
      'Do not monitor pages that change frequently by design (e.g. live pricing pages)',
    ],
    credits: 0,
    related: ['site-crawl', 'technical-audit', 'competitor-alert'],
    difficulty: 'intermediate',
    timeEstimate: '~5 min setup',
  },

  /* ═══════════════════════════════════════════════════════════
     REPORTING
  ═══════════════════════════════════════════════════════════ */
  'pdf-report': {
    title: 'PDF Report Generator',
    what: 'Generates a white-label branded PDF SEO report from any tool\'s results. Includes your logo, agency name, client domain, and executive summary.',
    when: 'Use this to send monthly SEO reports to clients, stakeholders, or to document progress for your own records.',
    steps: [
      'Run any analysis tool (Analyzer, Rank Tracker, Bulk Scan, etc.)',
      'Click the "Export PDF" button on the results',
      'Add your logo and agency name in the settings (saved for future reports)',
      'Download or email the PDF',
    ],
    tips: [
      'Include the executive summary section — it translates technical results into business-language wins',
      'Combine Rank Tracker + Bulk Scan + backlink data for a comprehensive monthly report',
    ],
    mistakes: [
      'Do not send raw technical reports to non-technical clients without the executive summary',
    ],
    credits: 0,
    related: ['rank-tracker', 'bulk-scan', 'client-portal', 'executive-summary'],
    difficulty: 'beginner',
    timeEstimate: '~2 min',
  },

  /* ═══════════════════════════════════════════════════════════
     INTERNATIONAL
  ═══════════════════════════════════════════════════════════ */
  'market-entry-brief': {
    title: 'Market Entry SEO Brief',
    what: 'Generates a complete SEO strategy brief for entering a new country or language market. Covers hreflang setup, local keyword research, competitor landscape, content localisation requirements, and technical infrastructure needs.',
    when: 'Use this before expanding your blog or store into a new country to ensure you set up international SEO correctly from the start.',
    steps: [
      'Enter your target country and primary language',
      'Enter your current domain and top 3 competitors',
      'Click "Generate Brief"',
      'Review the phased action plan (Technical setup → Content → Link building)',
    ],
    tips: [
      'Use ccTLDs (e.g. .de, .fr) for maximum local ranking authority if the budget allows',
      'Machine translation without localisation hurts rankings — always have a native speaker review',
      'hreflang tags must be reciprocal — every version must reference every other version',
    ],
    mistakes: [
      'Do not launch a translated duplicate of your site without hreflang — it will be treated as duplicate content',
    ],
    credits: 3,
    related: ['hreflang-strategy', 'translate', 'currency-localization', 'local-language-keywords'],
    difficulty: 'advanced',
    timeEstimate: '~3 min',
  },

};

/* ═══════════════════════════════════════════════════════════
   MISSIONS — Guided Workflows chaining multiple tools
═══════════════════════════════════════════════════════════ */
export const MISSIONS = [
  {
    id: 'publish-ready',
    title: '🚀 Publish-Ready Checklist',
    description: 'Make sure your post is fully optimised before hitting publish.',
    difficulty: 'beginner',
    timeEstimate: '~10 min',
    steps: [
      { toolId: 'analyzer', label: 'Score Your Post', description: 'Run a full SEO analysis to find all issues' },
      { toolId: 'keyword-density', label: 'Check Keyword Usage', description: 'Verify your keyword appears the right number of times' },
      { toolId: 'meta-description-optimizer', label: 'Optimise Meta Description', description: 'Write a compelling meta that gets clicks' },
      { toolId: 'schema-generator', label: 'Add Schema Markup', description: 'Add structured data for rich results' },
    ],
  },
  {
    id: 'fix-declining',
    title: '🔧 Fix a Declining Post',
    description: 'Diagnose and revive a post that has lost traffic.',
    difficulty: 'intermediate',
    timeEstimate: '~15 min',
    steps: [
      { toolId: 'analyzer', label: 'Run Full Analysis', description: 'Identify current technical and content issues' },
      { toolId: 'content-decay', label: 'Check Traffic Loss', description: 'Quantify how much traffic the post has lost' },
      { toolId: 'content-vs-top10', label: 'Compare vs. Top 10', description: 'See what competing pages have that yours lacks' },
      { toolId: 'ai-rewrite', label: 'AI Rewrite Weak Sections', description: 'Improve the lowest-scoring sections' },
    ],
  },
  {
    id: 'keyword-sprint',
    title: '🎯 Keyword Research Sprint',
    description: 'Go from a topic idea to a full content plan in 20 minutes.',
    difficulty: 'beginner',
    timeEstimate: '~20 min',
    steps: [
      { toolId: 'alphabet-soup', label: 'Mine All Variations', description: 'Find every long-tail keyword variant' },
      { toolId: 'question-explorer', label: 'Find Questions', description: 'Identify question-format keywords' },
      { toolId: 'cluster-by-intent', label: 'Group by Intent', description: 'Organise keywords by what searchers want' },
      { toolId: 'content-brief', label: 'Generate Content Brief', description: 'Create a full brief for your best keyword cluster' },
    ],
  },
  {
    id: 'internal-links',
    title: '🔗 Internal Link Audit',
    description: 'Find and fix your orphan pages and internal link structure.',
    difficulty: 'intermediate',
    timeEstimate: '~10 min',
    steps: [
      { toolId: 'site-crawl', label: 'Crawl Your Site', description: 'Find all pages and internal link structure' },
      { toolId: 'orphan-finder', label: 'Find Orphan Pages', description: 'Identify pages with no internal links pointing to them' },
      { toolId: 'links-auto-inserter', label: 'Auto-Suggest Links', description: 'Find contextual link opportunities across your content' },
      { toolId: 'anchor-text-audit', label: 'Audit Anchor Text', description: 'Check your anchor text distribution is natural' },
    ],
  },
  {
    id: 'monthly-health',
    title: '📊 Monthly SEO Health Check',
    description: 'A complete monthly audit covering all key areas.',
    difficulty: 'intermediate',
    timeEstimate: '~30 min',
    steps: [
      { toolId: 'bulk-scan', label: 'Bulk Scan All Posts', description: 'Score every blog post to find biggest opportunities' },
      { toolId: 'rank-tracker', label: 'Review Rankings', description: 'Check whether key keywords are rising or falling' },
      { toolId: 'content-decay', label: 'Check Content Decay', description: 'Find posts losing traffic that need refreshing' },
      { toolId: 'algo-impact-check', label: 'Algorithm Impact Check', description: 'See if any Google updates affected your traffic' },
    ],
  },
  {
    id: 'ai-search-readiness',
    title: '🤖 AI Search Readiness',
    description: 'Optimise your content for ChatGPT, Perplexity, and Google AI Overviews.',
    difficulty: 'advanced',
    timeEstimate: '~20 min',
    steps: [
      { toolId: 'geo-health-score', label: 'Check GEO Health', description: 'Score your AI search readiness across 3 pillars' },
      { toolId: 'llms-txt-generator', label: 'Generate llms.txt', description: 'Create the AI-crawler guide for your site' },
      { toolId: 'speakable-schema', label: 'Add Speakable Schema', description: 'Mark your most quotable content sections' },
      { toolId: 'ai-platform-tracker', label: 'Track AI Visibility', description: 'Monitor mentions across 8 AI platforms' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   GLOSSARY — Plain-English definitions of SEO terms
═══════════════════════════════════════════════════════════ */
export const GLOSSARY = {
  'Core Web Vitals': 'Three Google performance metrics: LCP (how fast main content loads), CLS (how much the page jumps around while loading), and INP (how fast it responds to clicks). Poor scores can hurt rankings.',
  'E-E-A-T': 'Experience, Expertise, Authoritativeness, Trustworthiness. Google\'s framework for evaluating content quality. Most important for health, finance, and legal topics.',
  'Canonical Tag': 'A piece of code that tells Google which version of a page is the "master" copy when the same content appears at multiple URLs.',
  'Crawl Budget': 'The number of pages Google will crawl on your site in a given time period. For large sites, wasting it on unimportant pages means important pages get crawled less frequently.',
  'Featured Snippet': 'The boxed answer that appears above organic results for many queries. Also called "Position Zero." Getting a Featured Snippet can triple your click-through rate.',
  'hreflang': 'Code that tells Google which language and country each version of a page is intended for. Required for sites with content in multiple languages.',
  'Internal Link': 'A link from one page on your site to another page on the same site. Helps Google discover pages and distributes PageRank (link authority) across your site.',
  'KGR': 'Keyword Golden Ratio. A formula to quickly identify low-competition keywords: allintitle count ÷ monthly search volume. Below 0.25 = easy win.',
  'LSI Keywords': 'Latent Semantic Indexing keywords — terms that are closely related to your main keyword and naturally appear in well-written content on the topic. Including them helps Google understand your page\'s full context.',
  'Meta Description': 'The short description below a page title in search results. Does not directly affect rankings but affects click-through rate. Ideal length: 150–160 characters.',
  'Noindex': 'A tag that tells Google not to include a page in search results. Use it on thank-you pages, admin pages, and duplicate content pages.',
  'Orphan Page': 'A page that no other page on your site links to. Google struggles to find and understand these pages, so they rarely rank well.',
  'PageRank': 'Google\'s original algorithm for measuring page importance based on the number and quality of links pointing to it. Still a significant ranking factor.',
  'Rich Result': 'An enhanced Google search listing that includes extra information like star ratings, FAQs, recipe info, or event details. Enabled by structured data (schema markup).',
  'Schema Markup': 'Structured data code added to HTML that helps search engines understand what your content is about. Enables rich results like FAQ boxes, recipe cards, and product ratings.',
  'Search Intent': 'What a user actually wants when they type a search query. The four main intents are: Informational (learn), Navigational (find a site), Commercial (compare), Transactional (buy).',
  'Sitemap': 'A file (usually sitemap.xml) that lists all important URLs on your site and helps search engines find them. Submit to Google Search Console.',
  'TF-IDF': 'Term Frequency-Inverse Document Frequency. A measure of how important a keyword is in a document relative to all other documents. High TF-IDF means the word is particularly relevant to that specific page.',
  'Title Tag': 'The clickable headline in search results. The single most important on-page SEO element. Ideal length: 50–60 characters including your keyword.',
  'URL Slug': 'The part of a URL after the domain name (e.g. /best-coffee-makers). Short, keyword-rich slugs with hyphens between words are best practice.',
  'Voice Search': 'Queries made using a voice assistant like Siri, Alexa, or Google Assistant. These tend to be longer, more conversational, and question-format.',
  'GEO': 'Generative Engine Optimisation. The practice of optimising content to be cited and referenced by AI search engines (ChatGPT, Perplexity, Google AI Overviews). The emerging evolution of traditional SEO.',
  'llms.txt': 'An emerging file standard (like robots.txt for AI) that guides large language models about what content on a site is most important and how to use it.',
  'AI Overview': 'Google\'s AI-generated summary that appears above organic results for many queries. Powered by Gemini. Being cited in AI Overviews drives significant traffic.',
};

/* ═══════════════════════════════════════════════════════════
   CHANGELOG — What's new in AURA Blog SEO
═══════════════════════════════════════════════════════════ */
export const CHANGELOG = [
  {
    date: '2026-02-26',
    title: 'Massive Platform Update',
    items: [
      '4 new tabs: Rank Tracker, Site Crawl, GEO & LLM, Trend Scout',
      'Beginner / Advanced mode with guided onboarding wizard',
      '⌘K command palette for instant tool navigation',
      'In-app help drawer for every tool',
      'Guided missions: 6 step-by-step SEO workflows',
      'Brand Voice Library — save your tone for all AI tools',
      'Content vs. Top 10 — compare your content against competitors',
      'Log File Analyzer — see which AI bots crawl your site',
      'AI Platform Tracker — monitor visibility across 8 AI search engines',
      '100+ new tools across all existing tabs',
    ],
  },
];
