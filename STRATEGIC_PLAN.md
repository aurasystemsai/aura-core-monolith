# AURA Platform — Full Strategic Plan (All-in-One Vision)

> Generated after auditing every tool, component, route, and module in the codebase, then benchmarking against Klaviyo, Omnisend, Yotpo, Gorgias, Semrush, HubSpot, Triple Whale, Shopify native, Nosto, Rebuy, Lifetimely, Buffer, and Hootsuite.

---

## 1. Executive Summary

**The Vision**: AURA is the first all-in-one AI growth platform built natively inside Shopify. No app has ever unified SEO, email, support, social, ads, analytics, personalization, and operations into a single embedded experience. Other apps pick one lane — AURA owns the entire highway.

**The precedent**: Shopify itself started as "just an online store" and now owns payments, POS, fulfillment, email, social, analytics, and shipping. HubSpot started as a blog/SEO tool and became a $30B all-in-one CRM platform. The winners are the ones who consolidate — merchants are exhausted paying $130/mo for Semrush + $45/mo for Klaviyo + $300/mo for Gorgias + $99/mo for Triple Whale + $79/mo for Yotpo. **AURA replaces all of them for one price.**

### Current State
- **89 backend tool directories** — the ambition is there
- **16 tools are FULL implementations** with real logic, AI integrations, and substantial codebases
- **26 tools are PARTIAL** — have working CRUD + routes but need deeper logic
- **18 are STUBS** and **24 are SCAFFOLDS** — need to be built out
- **8 true duplicates** need consolidation (not cutting categories — merging duplicates within categories)

### The Play
Instead of cutting categories, **consolidate duplicates** and then **build each category to production quality in phases.** The all-in-one approach works when every tool is genuinely good — not when you have 89 half-built tools. Quality over quantity at each phase, but quantity grows over time.

---

## 2. Competitive Landscape — What AURA Replaces

### The Merchant's Current Stack (Total: $650+/mo)

| App | What It Does | Monthly Cost | AURA Replacement |
|-----|-------------|-------------|------------------|
| **Semrush** | SEO, Keywords, Rank tracking, Site audit, Content | $130–500 | SEO & Content Suite (10 tools) |
| **Klaviyo** | Email flows, SMS, Segmentation, Forms, CDP, Reviews | $45–150+ | Email & Lifecycle Suite (5 tools) |
| **Gorgias** | AI helpdesk, Tickets, Voice, SMS support | $10–900 | Customer Support Suite (3 tools) |
| **Triple Whale** | Attribution, Analytics, AI insights, Creative | $0–1,300 | Analytics & Intelligence Suite (6 tools) |
| **Yotpo** | Reviews, Loyalty, Referrals, UGC | $0–79+ | Reviews + Loyalty tools |
| **Buffer/Hootsuite** | Social scheduling, Analytics, Monitoring | $5–249 | Social & Brand Suite (3 tools) |
| **Nosto/Rebuy** | Personalization, Recommendations, Pricing | $99–299 | Personalization & Revenue Suite (4 tools) |
| **QuickBooks** | Financial reports, P&L, Cash flow | $30–200 | Finance & Operations Suite (4 tools) |
| **TOTAL** | 8 separate apps, 8 logins, 8 bills | **$650–3,000+/mo** | **One app. One bill.** |

### AURA's Pitch
> "Stop paying $650+/mo for 8 different apps that don't talk to each other. AURA gives you everything — SEO, email, support, social, analytics, personalization, and operations — in one AI-powered platform inside your Shopify admin. Starting at $0."

### Why No One Has Done This Yet
1. **It's hard.** Building 40+ production tools is a massive engineering effort.
2. **Investors push focus.** VCs tell startups to "pick a lane." AURA doesn't have that constraint.
3. **The all-in-one approach requires AI.** Before GPT-4, building this many tools meant massive teams. With AI, a small team can build Semrush-quality SEO + Klaviyo-quality email in the same app.
4. **Shopify's embedded app framework makes it possible.** Every tool runs inside the same admin, shares the same auth, the same customer data, the same shop context. This is a structural advantage no standalone SaaS has.

---

## 3. The 9 Product Suites

AURA's tools organize into **9 product suites** — like HubSpot has Marketing Hub, Sales Hub, Service Hub, etc. Each suite replaces a specific competitor.

---

### SUITE 1: SEO & Content — *Replaces Semrush ($130–500/mo)*
**Status: Strongest suite. 6 FULL tools + 4 PARTIAL. Needs duplicate cleanup.**

Shopify has ZERO native SEO tools. This is AURA's biggest competitive advantage — every Shopify merchant needs SEO but currently must leave the admin and pay $130/mo+ for Semrush or Ahrefs.

| # | Tool | Implementation | Plan | Action |
|---|------|---------------|------|--------|
| 1 | `product-seo` | ✅ FULL (180-line index, real OpenAI GPT-4o-mini, tests) | Free | **Ship as-is** |
| 2 | `blog-seo` | ✅ FULL (76-line orchestrator, 12 engine files) | Free | **Ship as-is** |
| 3 | `seo-site-crawler` | ✅ FULL (real HTTP crawling with axios+cheerio) | Free | **Ship as-is** |
| 4 | `on-page-seo-engine` | ⚡ PARTIAL (43-line rule-based checks) | Free | **Upgrade** — add AI analysis |
| 5 | `blog-draft-engine` | ✅ FULL (304-line index, SQLite, 20+ files, 9,663 lines) | Pro | **Ship as-is** |
| 6 | `weekly-blog-content-engine` | ✅ FULL (114-line index, 13 engine files) | Pro | **Ship as-is** |
| 7 | `content-scoring-optimization` | 🔧 SCAFFOLD (21-line router, 10 engine files unused) | Pro | **Build** — wire engine files to router |
| 8 | `ai-content-brief-generator` | ✅ FULL (1,544-line router, 10 files, 5,033 lines) | Pro | **Ship as-is** |
| 9 | `rank-visibility-tracker` | ⚡ PARTIAL (43-line rule-based + boilerplate) | Pro | **Upgrade** — add real rank tracking API |
| 10 | `internal-link-optimizer` | ⚡ PARTIAL (38-line rule-based + db) | Pro | **Upgrade** — add AI link suggestions |
| 11 | `image-alt-media-seo` | ✅ FULL (6,011-line router!, OpenAI) | Pro | **Ship as-is** |
| 12 | `technical-seo-auditor` | ⚡ PARTIAL (40-line rule-based) | Pro | **Upgrade** — add crawl-based auditing |
| 13 | `schema-rich-results-engine` | ⚡ PARTIAL (35-line rule-based) | Pro | **Upgrade** — add auto-generation |

**Duplicates to merge (keep the better one):**
| Remove | Keep | Reason |
|--------|------|--------|
| `seo-master-suite` | Sidebar grouping | It's a 2,267-line mega-router duplicating other tools |
| `internal-linking-suggestions` | `internal-link-optimizer` | Same purpose, optimizer has more code |
| `entity-topic-explorer` | `ai-content-brief-generator` | Topic exploration belongs in content briefs |
| `site-audit-health` | `seo-site-crawler` + `technical-seo-auditor` | Duplicate of existing tools |
| `serp-tracker` | `rank-visibility-tracker` | Same purpose — SERP tracking |
| `content-health-auditor` | `content-scoring-optimization` | Same purpose — content quality |
| `ai-alt-text-engine` | `image-alt-media-seo` | image-alt-media-seo has 6,011 lines vs 47-line stub |

**SEO tools to BUILD (currently scaffold):**
| Tool | Priority | Why | Data Source Needed |
|------|----------|-----|-------------------|
| `keyword-research-suite` | ★★★ HIGH | Foundation of all SEO — every competitor has this | DataForSEO API or Moz API |
| `backlink-explorer` | ★★★ HIGH | Backlinks = top-3 ranking factor | DataForSEO or Majestic API |
| `competitive-analysis` | ★★☆ MEDIUM | "What are my competitors ranking for?" | DataForSEO API |
| `local-seo-toolkit` | ★★☆ MEDIUM | Critical for stores with physical locations | Google Business Profile API |
| `link-intersect-outreach` | ★☆☆ LOW | Advanced link building feature | DataForSEO API |

**Suite total after cleanup: 13 tools (keep) + 5 to build = 18 SEO tools**

---

### SUITE 2: Email & Lifecycle Marketing — *Replaces Klaviyo ($45–150+/mo)*
**Status: 2 FULL tools. EmailAutomationBuilder is the crown jewel (88 tabs, 5,000+ lines). Already consolidated 7 deprecated tools into it.**

| # | Tool | Implementation | Plan | Action |
|---|------|---------------|------|--------|
| 1 | `email-automation-builder` | ✅ FULL (1,440-line router, 8 files, 4,094 lines, 88 tabs) | Pro | **Ship as-is** — already best-in-class |
| 2 | `abandoned-checkout-winback` | ✅ FULL (545-line router, 26 files, real SendGrid/Twilio/Shopify) | Pro | **Ship as-is** |
| 3 | `loyalty-referral-programs` | 🔧 Has frontend component | Enterprise | **Build** backend from `loyalty-referral-engine` engines |
| 4 | `ltv-churn-predictor` | ⚡ PARTIAL (40-line rule-based + boilerplate) | Pro | **Upgrade** — add real cohort analysis |
| 5 | `churn-prediction-playbooks` | 🔧 SCAFFOLD | Pro | **Build** — actionable playbooks from LTV data |

**Already consolidated into EmailAutomationBuilder (DELETE directories):**
- `workflow-orchestrator`, `klaviyo-flow-automation`, `ab-testing-suite`, `visual-workflow-builder`, `workflow-automation-builder`, `multi-channel-optimizer`, `conditional-logic-automation`

**Duplicate to merge:**
| Remove | Keep | Reason |
|--------|------|--------|
| `loyalty-referral-engine` (engine-only, no entry point) | `loyalty-referral-programs` | Move engine files into loyalty-referral-programs |

**Email tools to BUILD (gaps vs Klaviyo/Omnisend):**
| Tool | Priority | Why | Notes |
|------|----------|-----|-------|
| Web Forms / Popups | ★★★ HIGH | Lead capture — Klaviyo & Omnisend both have this | New tool or tab in EmailAutomationBuilder |
| SMS Marketing | ★★☆ MEDIUM | Omnichannel — Klaviyo, Omnisend, Shopify all have SMS | Requires Twilio/MessageBird integration |
| Email Template Library | ★★★ HIGH | 250+ templates in Klaviyo/Omnisend — AURA needs at least 20 | Can be AI-generated |
| Benchmarks | ★☆☆ LOW | Compare your metrics vs industry peers | Requires aggregate data across merchants |

**Suite total: 5 existing + 4 to build = 9 Email & Lifecycle tools**

---

### SUITE 3: Customer Support — *Replaces Gorgias ($10–900/mo)*
**Status: 2 PARTIAL tools with large engine file sets. Need to consolidate duplicates and build real integrations.**

| # | Tool | Implementation | Plan | Action |
|---|------|---------------|------|--------|
| 1 | `ai-support-assistant` | ⚡ PARTIAL (38-line index, 8 engine files ~2,973 lines) | Enterprise | **Upgrade** — wire engine files, add real knowledge base |
| 2 | `customer-support-ai` | ⚡ PARTIAL (38-line index, 14 engine files ~3,188 lines) | Enterprise | **MERGE into ai-support-assistant** |
| 3 | `returns-rma-automation` | ✅ FULL (53-line index, rule-based decisions, 15 files) | Pro | **Ship** — unique vs Gorgias |
| 4 | `review-ugc-engine` | ⚡ PARTIAL (38-line index + boilerplate) | Pro | **Upgrade** — add Shopify review collection |

**Duplicates to merge:**
| Remove | Keep | Reason |
|--------|------|--------|
| `customer-support-ai` | `ai-support-assistant` | Same domain — merge 14 engine files into ai-support-assistant |
| `inbox-reply-assistant` | `inbox-assistant` | Same domain — inbox AI. Merge into one. |
| `self-service-support-portal` | `self-service-portal` | Identical purpose, identical scaffold |
| `reviews-ugc-engine` (engine-only) | `review-ugc-engine` | Move engine files into review-ugc-engine |

**Support tools to BUILD:**
| Tool | Priority | Why | Notes |
|------|----------|-----|-------|
| Unified Inbox (from `inbox-assistant`) | ★★★ HIGH | Single inbox for email, chat, social DMs | Central to support experience |
| Self-Service Portal (from scaffold) | ★★☆ MEDIUM | Customer-facing FAQ/order tracking portal | Gorgias charges for this |
| Live Chat Widget | ★★☆ MEDIUM | Real-time chat on storefront | Shopify Inbox does basics |

**Suite total: 4 kept + 3 to build = 7 Support tools**

---

### SUITE 4: Social & Brand — *Replaces Buffer ($5/mo) + Hootsuite ($99/mo) + Brand24 ($79/mo)*
**Status: Mostly scaffolds. Needs real API integrations to be credible.**

| # | Tool | Implementation | Plan | Action |
|---|------|---------------|------|--------|
| 1 | `social-scheduler-content-engine` | ⚡ PARTIAL (45-line schedule builder) | Pro | **Upgrade** — add real posting APIs |
| 2 | `brand-mention-tracker` | 🔧 SCAFFOLD (21-line router, 9 engine files ~5,661 lines) | Pro | **Build** — wire engines, add web crawling |
| 3 | `creative-automation-engine` | ⚡ PARTIAL (39-line index, basic CRUD) | Enterprise | **Upgrade** — add AI image/copy generation |

**Duplicates to merge:**
| Remove | Keep | Reason |
|--------|------|--------|
| `social-media-analytics` (engine-only, no entry point) | `social-media-analytics-listening` | Move engine files into the one with a router |

**Social tools to BUILD:**
| Tool | Priority | Why | Notes |
|------|----------|-----|-------|
| Social Analytics Dashboard | ★★☆ MEDIUM | Cross-platform performance metrics | Upgrade social-media-analytics-listening |
| AI Content Generator for Social | ★★☆ MEDIUM | Auto-generate posts, captions, hashtags | Can leverage existing AI infrastructure |
| Influencer/Collab Tracker | ★☆☆ LOW | Track influencer campaigns and ROI | Shopify Collabs exists but is limited |

**Suite total: 3 kept + 3 to build = 6 Social & Brand tools**

---

### SUITE 5: Ads & Acquisition — *Replaces manual ad management + Triple Whale creative ($300+/mo)*
**Status: All stubs. This is the hardest suite to build because it requires real ad platform API integrations.**

| # | Tool | Implementation | Plan | Action |
|---|------|---------------|------|--------|
| 1 | `google-ads-integration` | 💀 STUB (25 lines) | Pro | **Build** — Google Ads API integration |
| 2 | `facebook-ads-integration` | 💀 STUB (27 lines) | Pro | **Build** — Meta Marketing API |
| 3 | `tiktok-ads-integration` | 💀 STUB (26 lines) | Pro | **Build** — TikTok Marketing API |
| 4 | `ad-creative-optimizer` | 💀 STUB (22 lines) | Enterprise | **Build** — AI creative testing + analysis |
| 5 | `ads-anomaly-guard` | 💀 STUB (22 lines) | Pro | **Build** — spend anomaly detection |
| 6 | `omnichannel-campaign-builder` | 💀 STUB (22 lines) | Enterprise | **Build** — unified campaign launcher |

**Important**: This suite is the **lowest priority** to build because:
- Each ad platform has complex OAuth, API rate limits, and approval processes
- Google/Meta/TikTok all have their own management UIs
- Triple Whale spent $100M+ on just attribution/creative analytics
- Build this LAST, but build it well when the time comes

**Suite total: 6 tools to build from stubs**

---

### SUITE 6: Analytics & Intelligence — *Replaces Triple Whale ($0–1,300/mo)*
**Status: Mix of partial tools. Need unified data layer to tie everything together.**

| # | Tool | Implementation | Plan | Action |
|---|------|---------------|------|--------|
| 1 | `customer-data-platform` | ✅ FULL (503-line router, 13 engine files, 6,578 lines) | Pro | **Ship** — already substantial |
| 2 | `predictive-analytics-widgets` | ⚡ PARTIAL (323-line index, no router) | Pro | **Upgrade** — add API routes + real data |
| 3 | `auto-insights` | ⚡ PARTIAL (35-line index + boilerplate models) | Enterprise | **Upgrade** — add AI-generated insights |
| 4 | `advanced-analytics-attribution` | ⚡ PARTIAL (70-line index, OpenAI, 136-line service) | Enterprise | **Upgrade** — add multi-touch attribution |
| 5 | `brand-intelligence-layer` | ⚡ PARTIAL (38-line index + boilerplate) | Enterprise | **Upgrade** — add competitive intelligence |
| 6 | `self-service-analytics` | 💀 STUB (22 lines) | Pro | **Build** — custom report builder |

**Analytics tools to BUILD:**
| Tool | Priority | Why | Notes |
|------|----------|-----|-------|
| Unified Dashboard | ★★★ HIGH | Single view across all suites | Ties all data together |
| AI Insights Agent | ★★★ HIGH | "Moby" equivalent — proactive AI recommendations | Uses auto-insights + predictive widgets |
| Custom Report Builder | ★★☆ MEDIUM | Let merchants build their own reports | From self-service-analytics scaffold |

**Suite total: 6 existing + 3 to build = 9 Analytics tools**

---

### SUITE 7: Personalization & Revenue — *Replaces Nosto ($99/mo) + Rebuy ($99/mo)*
**Status: 2 FULL tools, 2 scaffolds. Dynamic pricing engine is exceptionally well-built.**

| # | Tool | Implementation | Plan | Action |
|---|------|---------------|------|--------|
| 1 | `dynamic-pricing-engine` | ✅ FULL (996-line router, 20+ files, 4,810 lines, AI/ML) | Pro | **Ship as-is** — enterprise-grade |
| 2 | `upsell-cross-sell-engine` | ✅ FULL (719-line router, 13 files, 7,605 lines) | Pro | **Ship as-is** — massive engine layer |
| 3 | `personalization-recommendation-engine` | 🔧 SCAFFOLD (127-line router, 17-line stub) | Pro | **Build** — has disconnected engine files to wire up |
| 4 | `ai-segmentation-engine` | 💀 STUB (22 lines) | Pro | **Build** — AI-powered customer segmentation |

**Duplicate to merge:**
| Remove | Keep | Reason |
|--------|------|--------|
| `personalization-recommendation` (engine-only) | `personalization-recommendation-engine` | Move 4,141 lines of engine code into the tool with a router |

**Suite total: 4 existing + 0 to build = 4 Personalization tools** (after wiring existing engines)

---

### SUITE 8: Finance & Operations — *Replaces QuickBooks/Xero + Katana + manual ops*
**Status: Partial implementations. Finance tools are basic CRUD, need real Shopify data integration.**

| # | Tool | Implementation | Plan | Action |
|---|------|---------------|------|--------|
| 1 | `finance-autopilot` | ⚡ PARTIAL (38-line index, basic CRUD) | Pro | **Upgrade** — pull real Shopify revenue data |
| 2 | `daily-cfo-pack` | ⚡ PARTIAL (30-line index, basic CRUD) | Pro | **MERGE into finance-autopilot** as daily digest |
| 3 | `inventory-supplier-sync` | ⚡ PARTIAL (30-line index + boilerplate) | Pro | **Upgrade** — connect to Shopify inventory API |
| 4 | `inventory-forecasting` | 💀 STUB (56-line router, 17-line service) | Pro | **Build** — AI demand forecasting |
| 5 | `aura-operations-ai` | 💀 STUB (39-line index) | Enterprise | **Build** — AI operations co-pilot |
| 6 | `ai-launch-planner` | 💀 STUB (33-line index) | Enterprise | **Upgrade** — AI product launch planning |

**Duplicate to merge:**
| Remove | Keep | Reason |
|--------|------|--------|
| `daily-cfo-pack` | `finance-autopilot` | Daily financial digest is a feature of finance tool, not separate tool |
| `advanced-finance-inventory-planning` | Splint into finance-autopilot + inventory-forecasting | Scaffold combining two tools |

**Suite total: 5 tools (after merging daily-cfo-pack into finance-autopilot)**

---

### SUITE 9: Platform & Developer — *Unique to AURA, no direct competitor*
**Status: Stubs and scaffolds. Platform tools that power the ecosystem.**

| # | Tool | Implementation | Plan | Action |
|---|------|---------------|------|--------|
| 1 | `aura-api-sdk` | 💀 STUB (34 lines) | Enterprise | **Build** — public API for integrations |
| 2 | `webhook-api-triggers` | 🔧 SCAFFOLD (243-line router) | Enterprise | **Build** — webhook management |
| 3 | `automation-templates` | 🔧 SCAFFOLD (21-line router) | Free | **Build** — pre-built automation templates |
| 4 | `scheduled-export` | 🔧 SCAFFOLD (131-line router) | Pro | **Build** — data export scheduling |
| 5 | `data-warehouse-connector` | 🔧 SCAFFOLD (21-line router) | Enterprise | **Build** — connect to BigQuery/Snowflake |
| 6 | `reporting-integrations` | 🔧 SCAFFOLD (130-line router) | Pro | **Build** — connect to Google Sheets, Looker |
| 7 | `compliance-privacy-suite` | 💀 STUB (22 lines) | Pro | **Build** — GDPR/CCPA compliance |
| 8 | `consent-privacy-management` | 🔧 SCAFFOLD | Pro | **MERGE into compliance-privacy-suite** |
| 9 | `collaboration-approval-workflows` | 🔧 SCAFFOLD | Enterprise | **Build** — team workflows |
| 10 | `custom-dashboard-builder` | 🔧 SCAFFOLD | Enterprise | **Build** — drag-and-drop dashboard builder |

**Duplicate to merge:**
| Remove | Keep | Reason |
|--------|------|--------|
| `consent-privacy-management` | `compliance-privacy-suite` | Same domain — privacy compliance |

**Suite total: 9 Platform tools (after merging consent into compliance)**

---

## 4. Duplicate Cleanup Summary

**Only merge duplicates. Never cut entire categories.**

| # | REMOVE (duplicate) | KEEP (canonical) | Reason |
|---|-------------------|------------------|--------|
| 1 | `seo-master-suite` | Sidebar grouping handles this | 2,267-line mega-router duplicating other SEO tools |
| 2 | `internal-linking-suggestions` | `internal-link-optimizer` | Same purpose |
| 3 | `entity-topic-explorer` | `ai-content-brief-generator` | Topic exploration is part of content briefs |
| 4 | `site-audit-health` | `seo-site-crawler` + `technical-seo-auditor` | Duplicate combo |
| 5 | `serp-tracker` | `rank-visibility-tracker` | Same purpose |
| 6 | `content-health-auditor` | `content-scoring-optimization` | Same purpose |
| 7 | `ai-alt-text-engine` | `image-alt-media-seo` | 47-line stub vs 6,011-line full tool |
| 8 | `customer-support-ai` | `ai-support-assistant` | Merge 14 engine files into one unified support tool |
| 9 | `inbox-reply-assistant` | `inbox-assistant` | Same domain — inbox AI |
| 10 | `self-service-support-portal` | `self-service-portal` | Identical purpose |
| 11 | `reviews-ugc-engine` (engine-only) | `review-ugc-engine` | Move engines into the tool with a router |
| 12 | `personalization-recommendation` (engine-only) | `personalization-recommendation-engine` | Move engines into the tool with a router |
| 13 | `social-media-analytics` (engine-only) | `social-media-analytics-listening` | Move engines into the tool with a router |
| 14 | `loyalty-referral-engine` (engine-only) | `loyalty-referral-programs` | Move engines into loyalty tool |
| 15 | `daily-cfo-pack` | `finance-autopilot` | Daily digest is a feature, not a tool |
| 16 | `advanced-finance-inventory-planning` | Split into `finance-autopilot` + `inventory-forecasting` | Scaffold combining two tools |
| 17 | `consent-privacy-management` | `compliance-privacy-suite` | Same domain |
| 18 | `workflow-orchestrator` | `email-automation-builder` | Already deprecated/merged |
| 19 | `klaviyo-flow-automation` | `email-automation-builder` | Already deprecated/merged |
| 20 | `ab-testing-suite` | `email-automation-builder` | Already deprecated/merged |
| 21 | `visual-workflow-builder` | `email-automation-builder` | Already deprecated/merged |
| 22 | `workflow-automation-builder` | `email-automation-builder` | Already deprecated/merged |
| 23 | `multi-channel-optimizer` | `email-automation-builder` | Already deprecated/merged |
| 24 | `conditional-logic-automation` | `email-automation-builder` | Already deprecated/merged |

**Result: Remove 24 duplicate directories. Keep all 9 categories.**

---

## 5. Final Tool Inventory — All 9 Suites

### After duplicate cleanup: 89 → 65 tools across 9 suites

| Suite | Tools | Status Breakdown | Replaces |
|-------|-------|-----------------|----------|
| **1. SEO & Content** | 18 | 6 FULL, 5 PARTIAL, 2 SCAFFOLD, 5 TO BUILD | Semrush ($130–500/mo) |
| **2. Email & Lifecycle** | 9 | 2 FULL, 1 PARTIAL, 2 SCAFFOLD, 4 TO BUILD | Klaviyo ($45–150/mo) |
| **3. Customer Support** | 7 | 1 FULL, 2 PARTIAL, 1 SCAFFOLD, 3 TO BUILD | Gorgias ($10–900/mo) |
| **4. Social & Brand** | 6 | 0 FULL, 2 PARTIAL, 1 SCAFFOLD, 3 TO BUILD | Buffer+Hootsuite+Brand24 ($180/mo) |
| **5. Ads & Acquisition** | 6 | 0 FULL, 0 PARTIAL, 6 STUBS TO BUILD | Triple Whale Creative ($300/mo) |
| **6. Analytics & Intelligence** | 9 | 1 FULL, 4 PARTIAL, 1 STUB, 3 TO BUILD | Triple Whale ($0–1,300/mo) |
| **7. Personalization & Revenue** | 4 | 2 FULL, 0 PARTIAL, 1 SCAFFOLD, 1 TO BUILD | Nosto+Rebuy ($200/mo) |
| **8. Finance & Operations** | 5 | 0 FULL, 3 PARTIAL, 2 STUBS TO BUILD | QuickBooks ($30–200/mo) |
| **9. Platform & Developer** | 9 | 0 FULL, 0 PARTIAL, 9 TO BUILD | No competitor — unique |
| **TOTAL** | **65** | **12 FULL, 17 PARTIAL, 36 TO BUILD** | **$650–3,000+/mo replaced** |

---

## 6. Plan & Pricing

### Pricing Structure (4 tiers)

| Plan | Price | What You Get | Target |
|------|-------|-------------|--------|
| **Free** | $0 | 4 core SEO tools + basic analytics dashboard | New Shopify merchants wanting SEO basics |
| **Growth** | $49/mo | All SEO tools + email automation + abandoned checkout + basic support + reviews | Growing stores that need traffic + conversions |
| **Professional** | $149/mo | Everything in Growth + all 9 suites (basic features) + CDP + personalization + social + finance | Scaling stores (1K+ orders/mo) replacing 3-4 tools |
| **Enterprise** | $349/mo | Everything + advanced analytics + API access + custom dashboards + team workflows + ads suite + priority support | Large stores / agencies replacing their entire stack |

### Why This Beats The Competition

| Comparison | Their Cost | AURA Cost | Savings |
|-----------|-----------|-----------|---------|
| Semrush Pro alone | $130/mo | $0–49/mo | **$80–130/mo saved** |
| Klaviyo + Semrush | $175/mo | $49/mo | **$126/mo saved** |
| Klaviyo + Semrush + Gorgias + Yotpo | $354/mo | $149/mo | **$205/mo saved** |
| Full stack (all 8 apps) | $650+/mo | $349/mo | **$300+/mo saved** |

The pitch is simple: **"We're cheaper than any two of your current tools combined, and we replace all eight."**

---

## 7. Phased Build Roadmap

### Phase 1: Clean + Ship What Works (2–3 weeks)
**Goal: Remove 24 duplicates. Ship the 12 FULL tools. Get to production.**

- [ ] Delete 24 duplicate directories (listed in Section 4)
- [ ] Merge engine files from engine-only directories into their canonical tools
- [ ] Update `tools-registry.cjs` — register all 65 kept tools
- [ ] Update `modules.js` — reorganize into 9 suite groups
- [ ] Update `usePlan.js` — new 4-tier pricing
- [ ] Update `toolMeta.js` — metadata for all tools
- [ ] Update `App.jsx` — routing for all tools
- [ ] Ship 12 FULL tools: product-seo, blog-seo, seo-site-crawler, blog-draft-engine, weekly-blog-content-engine, ai-content-brief-generator, image-alt-media-seo, email-automation-builder, abandoned-checkout-winback, dynamic-pricing-engine, upsell-cross-sell-engine, customer-data-platform

**Deliverable**: Production app with 12 working tools, 53 showing "Coming Soon" or locked behind plan upgrades.

### Phase 2: Upgrade PARTIAL Tools (4–6 weeks)
**Goal: Take the 17 PARTIAL tools from boilerplate CRUD to real functionality.**

Priority order (highest revenue impact first):
1. `on-page-seo-engine` — add AI-powered page analysis (Free tier drives signups)
2. `rank-visibility-tracker` — add real SERP tracking
3. `technical-seo-auditor` — connect to seo-site-crawler data
4. `schema-rich-results-engine` — auto-generate JSON-LD from Shopify product data
5. `ltv-churn-predictor` — add real cohort analysis from Shopify orders
6. `review-ugc-engine` — add Shopify review collection and display widgets
7. `ai-support-assistant` — wire engine files, add knowledge base
8. `inbox-assistant` — build unified inbox for support
9. `social-scheduler-content-engine` — add at least 1 real platform API (Instagram)
10. `brand-mention-tracker` — wire 5,661 lines of engines to router
11. `content-scoring-optimization` — wire 5,196 lines of engines to router
12. `creative-automation-engine` — add AI image/copy generation
13. `predictive-analytics-widgets` — add API routes and dashboard
14. `auto-insights` — add AI-generated insight summaries
15. `brand-intelligence-layer` — add competitive monitoring
16. `finance-autopilot` — pull Shopify revenue/order data
17. `inventory-supplier-sync` — connect to Shopify inventory API

**Deliverable**: 29 working tools (12 FULL + 17 upgraded PARTIAL).

### Phase 3: Build Priority Scaffolds (6–8 weeks)  
**Goal: Build the highest-impact scaffold tools.**

| # | Tool | Suite | Why First |
|---|------|-------|-----------|
| 1 | `keyword-research-suite` | SEO | Foundation of all SEO work |
| 2 | `loyalty-referral-programs` | Email | Drives retention + enterprise upgrades |
| 3 | Web Forms / Popups | Email | Lead capture — critical for email list growth |
| 4 | Email Template Library | Email | Reduces friction for new email users |
| 5 | `personalization-recommendation-engine` | Personalization | Wire 4,141 lines of existing engine code |
| 6 | `backlink-explorer` | SEO | Backlinks = major ranking factor |
| 7 | `self-service-portal` | Support | Customer-facing support portal |
| 8 | `churn-prediction-playbooks` | Email | Actionable retention plays |
| 9 | `competitive-analysis` | SEO | "What do my competitors rank for?" |
| 10 | `compliance-privacy-suite` | Platform | GDPR/CCPA — needed for enterprise sales |

**Deliverable**: ~39 working tools.

### Phase 4: Build Remaining Tools (8–12 weeks)
**Goal: Complete all 65 tools. Full all-in-one platform.**

- Ads suite (6 tools — hardest, requires Google/Meta/TikTok API approvals)
- Platform tools (API SDK, webhooks, dashboards, exports, data connectors)
- Remaining SEO tools (local-seo-toolkit, link-intersect-outreach)
- SMS marketing
- AI operations co-pilot
- Custom dashboard builder
- Collaboration workflows

**Deliverable**: Full 65-tool platform. Every suite complete.

### Phase 5: Competitive Moats (Ongoing)
**Goal: Build features no competitor has because they require cross-suite data.**

This is AURA's ultimate advantage — **cross-suite intelligence** that no single-purpose app can match:

| Feature | Why Only AURA Can Do This |
|---------|--------------------------|
| "Your SEO drove 500 visits → 12 abandoned carts → winback email recovered 4 sales" | Ties SEO + Email + Analytics |
| "Customers from Instagram ads have 2.3x higher LTV than Google" | Ties Ads + CDP + Analytics |
| "Your review score dropped — here's a support playbook + a retention email" | Ties Reviews + Support + Email |
| "Your competitor just started ranking for 15 keywords you own — here's a content brief" | Ties SEO + Competitive + Content |
| "Based on your inventory forecast, launch this promotion next week" | Ties Inventory + Pricing + Email |

**No single-purpose app can connect these dots. That's the all-in-one advantage.**

---

## 8. Directories to Delete (Duplicates Only — 24)

```
# Already deprecated (merged into EmailAutomationBuilder)
src/tools/ab-testing-suite/
src/tools/conditional-logic-automation/
src/tools/klaviyo-flow-automation/
src/tools/multi-channel-optimizer/
src/tools/visual-workflow-builder/
src/tools/workflow-automation-builder/
src/tools/workflow-orchestrator/

# Duplicate SEO tools
src/tools/ai-alt-text-engine/           → keep image-alt-media-seo
src/tools/content-health-auditor/       → keep content-scoring-optimization  
src/tools/entity-topic-explorer/        → merge into ai-content-brief-generator
src/tools/internal-linking-suggestions/ → keep internal-link-optimizer
src/tools/seo-master-suite/            → sidebar grouping replaces this
src/tools/serp-tracker/                → keep rank-visibility-tracker
src/tools/site-audit-health/           → keep seo-site-crawler + technical-seo-auditor

# Duplicate support tools
src/tools/customer-support-ai/         → merge into ai-support-assistant
src/tools/inbox-reply-assistant/       → merge into inbox-assistant
src/tools/self-service-support-portal/ → merge into self-service-portal

# Engine-only directories (no entry point — move engines into canonical tool)
src/tools/loyalty-referral-engine/      → move engines into loyalty-referral-programs
src/tools/personalization-recommendation/ → move engines into personalization-recommendation-engine
src/tools/reviews-ugc-engine/          → move engines into review-ugc-engine
src/tools/social-media-analytics/      → move engines into social-media-analytics-listening

# Duplicates within finance
src/tools/daily-cfo-pack/             → merge into finance-autopilot
src/tools/advanced-finance-inventory-planning/ → split into existing tools
src/tools/consent-privacy-management/  → merge into compliance-privacy-suite
```

---

## 9. Final Architecture

```
src/tools/
│
├── main-suite/                          # Dashboard + module registry
│
├── ── SEO & CONTENT (13 tools + 5 to build) ──
├── product-seo/                         ✅ FULL — Free
├── blog-seo/                            ✅ FULL — Free
├── seo-site-crawler/                    ✅ FULL — Free
├── on-page-seo-engine/                  ⚡ PARTIAL — Free
├── blog-draft-engine/                   ✅ FULL — Pro
├── weekly-blog-content-engine/          ✅ FULL — Pro
├── content-scoring-optimization/        🔧 SCAFFOLD — Pro (wire engines)
├── ai-content-brief-generator/          ✅ FULL — Pro
├── rank-visibility-tracker/             ⚡ PARTIAL — Pro
├── internal-link-optimizer/             ⚡ PARTIAL — Pro
├── image-alt-media-seo/                 ✅ FULL — Pro
├── technical-seo-auditor/               ⚡ PARTIAL — Pro
├── schema-rich-results-engine/          ⚡ PARTIAL — Pro
├── keyword-research-suite/              🔧 TO BUILD — Pro
├── backlink-explorer/                   🔧 TO BUILD — Pro
├── competitive-analysis/                🔧 TO BUILD — Pro
├── local-seo-toolkit/                   🔧 TO BUILD — Pro
├── link-intersect-outreach/             🔧 TO BUILD — Enterprise
│
├── ── EMAIL & LIFECYCLE (5 tools + 4 to build) ──
├── email-automation-builder/            ✅ FULL — Pro
├── abandoned-checkout-winback/          ✅ FULL — Pro
├── loyalty-referral-programs/           🔧 TO BUILD — Enterprise
├── ltv-churn-predictor/                 ⚡ PARTIAL — Pro
├── churn-prediction-playbooks/          🔧 TO BUILD — Pro
│
├── ── CUSTOMER SUPPORT (4 tools + 3 to build) ──
├── ai-support-assistant/                ⚡ PARTIAL — Enterprise
├── returns-rma-automation/              ✅ FULL — Pro
├── review-ugc-engine/                   ⚡ PARTIAL — Pro
├── inbox-assistant/                     ⚡ PARTIAL — Pro
├── self-service-portal/                 🔧 TO BUILD — Pro
│
├── ── SOCIAL & BRAND (3 tools + 3 to build) ──
├── social-scheduler-content-engine/     ⚡ PARTIAL — Pro
├── brand-mention-tracker/               🔧 SCAFFOLD — Pro
├── creative-automation-engine/          ⚡ PARTIAL — Enterprise
├── social-media-analytics-listening/    🔧 TO BUILD — Pro
│
├── ── ADS & ACQUISITION (6 tools to build) ──
├── google-ads-integration/              💀 STUB → TO BUILD — Pro
├── facebook-ads-integration/            💀 STUB → TO BUILD — Pro
├── tiktok-ads-integration/              💀 STUB → TO BUILD — Pro
├── ad-creative-optimizer/               💀 STUB → TO BUILD — Enterprise
├── ads-anomaly-guard/                   💀 STUB → TO BUILD — Pro
├── omnichannel-campaign-builder/        💀 STUB → TO BUILD — Enterprise
│
├── ── ANALYTICS & INTELLIGENCE (6 tools + 3 to build) ──
├── customer-data-platform/              ✅ FULL — Pro
├── predictive-analytics-widgets/        ⚡ PARTIAL — Pro
├── auto-insights/                       ⚡ PARTIAL — Enterprise
├── advanced-analytics-attribution/      ⚡ PARTIAL — Enterprise
├── brand-intelligence-layer/            ⚡ PARTIAL — Enterprise
├── self-service-analytics/              💀 STUB → TO BUILD — Pro
│
├── ── PERSONALIZATION & REVENUE (4 tools) ──
├── dynamic-pricing-engine/              ✅ FULL — Pro
├── upsell-cross-sell-engine/            ✅ FULL — Pro
├── personalization-recommendation-engine/ 🔧 SCAFFOLD → BUILD — Pro
├── ai-segmentation-engine/              💀 STUB → TO BUILD — Pro
│
├── ── FINANCE & OPERATIONS (5 tools) ──
├── finance-autopilot/                   ⚡ PARTIAL — Pro
├── inventory-supplier-sync/             ⚡ PARTIAL — Pro
├── inventory-forecasting/               💀 STUB → TO BUILD — Pro
├── aura-operations-ai/                  💀 STUB → TO BUILD — Enterprise
├── ai-launch-planner/                   💀 STUB → TO BUILD — Enterprise
│
├── ── PLATFORM & DEVELOPER (9 tools to build) ──
├── aura-api-sdk/                        💀 STUB → TO BUILD — Enterprise
├── webhook-api-triggers/                🔧 SCAFFOLD → BUILD — Enterprise
├── automation-templates/                🔧 SCAFFOLD → BUILD — Free
├── scheduled-export/                    🔧 SCAFFOLD → BUILD — Pro
├── data-warehouse-connector/            🔧 SCAFFOLD → BUILD — Enterprise
├── reporting-integrations/              🔧 SCAFFOLD → BUILD — Pro
├── compliance-privacy-suite/            💀 STUB → TO BUILD — Pro
├── collaboration-approval-workflows/    🔧 SCAFFOLD → BUILD — Enterprise
├── custom-dashboard-builder/            🔧 SCAFFOLD → BUILD — Enterprise
│
└── ai-content-image-gen/                💀 STUB → TO BUILD — Pro (cross-suite AI tool)
```

---

## 10. Cross-Suite Intelligence — The Ultimate Moat

This is what makes the all-in-one approach not just viable but **unbeatable**. No single-purpose app can do this:

### Insight Chains (data flows between suites)

```
SEO Suite ──→ discovers keywords ──→ Content Suite auto-generates briefs
     │                                        │
     └─ drives traffic ──→ Email captures leads ──→ Lifecycle nurtures
                                │                          │
                         Analytics tracks ──→ Support handles ──→ Reviews collected
                                │                                      │
                         CDP unifies ──→ Personalization serves ──→ Revenue grows
                                │
                         Finance tracks ──→ Inventory forecasts ──→ Ads scales
```

### Example Cross-Suite Automations
1. **SEO → Email**: "A blog post ranked #1 → auto-send to email list with product CTA"
2. **Ads → Support**: "Customer clicked ad, bought product, has shipping question → AI agent resolves instantly"
3. **Reviews → Email → Social**: "5-star review received → auto-generate testimonial email + social post"
4. **CDP → Personalization → Pricing**: "High-LTV customer visiting → show VIP pricing + personalized recommendations"
5. **Inventory → Ads → Email**: "Overstock detected → auto-launch discount ad + flash sale email"
6. **Support → Reviews → SEO**: "Support ticket resolved positively → request review → review becomes UGC for product page SEO"

**These automations are impossible when your tools don't talk to each other.** That's why "just use Klaviyo + Semrush + Gorgias" will always be inferior to AURA's all-in-one approach.

---

## 11. Positioning Statement

> **AURA is the AI command center for Shopify.** SEO, email, support, social, ads, analytics, personalization, and operations — unified in one platform that costs less than any two of the tools it replaces. No more juggling 8 apps. No more disconnected data. Just one dashboard that runs your entire business.

---

## 12. Key Metrics to Track

| Metric | Target (6 months) | Why |
|--------|-------------------|-----|
| Free tier signups | 1,000/mo | SEO tools drive organic adoption |
| Free → Growth conversion | 15% | Email + winback features drive upgrades |
| Growth → Pro conversion | 10% | Full suite access drives scale |
| Pro → Enterprise | 5% | API + analytics + team features |
| Tool completion rate | 65/65 (100%) | Every tool production-ready |
| Monthly recurring revenue | $50K/mo | ~500 paid merchants |
| Churn rate | <5%/mo | All-in-one stickiness reduces churn |
| Tools replaced per merchant | 3.2 avg | Measures all-in-one value proposition |

---

## 13. Decision Summary

| Decision | Detail |
|----------|--------|
| **Vision** | First all-in-one AI growth platform for Shopify — replaces Semrush + Klaviyo + Gorgias + Triple Whale + Yotpo + Buffer + Nosto + QuickBooks |
| **Categories** | ALL 9 stay. No categories cut. |
| **Duplicates removed** | 24 duplicate directories deleted |
| **Final tool count** | 65 tools across 9 suites (down from 89) |
| **Currently shippable** | 12 FULL implementation tools |
| **Need upgrading** | 17 PARTIAL tools |
| **Need building** | 36 scaffold/stub tools |
| **Pricing** | Free ($0) → Growth ($49) → Pro ($149) → Enterprise ($349) |
| **Build phases** | 5 phases over ~6 months to full platform |
| **Ultimate moat** | Cross-suite intelligence — data flows between tools that single-purpose apps can never replicate |
