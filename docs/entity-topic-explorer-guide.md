# Entity & Topic Explorer — Enterprise Guide
Version 2.0.0 | Generated: 2026-07-26

## Overview
Entity & Topic Explorer is AURA's flagship SEO intelligence tool for optimising your position
in Google's Knowledge Graph. It provides world-class entity discovery, topical authority mapping,
E-E-A-T scoring, and AI-powered optimisation recommendations.

## Architecture — 8 Engines

| Engine | Purpose |
|--------|---------|
| entity-discovery-engine | PMI co-occurrence, Wikidata matching, opportunity scoring |
| topic-cluster-engine | PageRank-style authority, coverage scoring, content plans |
| knowledge-graph-engine | Schema.org validation, rich result eligibility, KG presence |
| content-analysis-engine | Semantic triples, NLP, entity density, freshness |
| competitor-entity-engine | SOV, SWOT, featured snippets, benchmark gaps |
| optimization-engine | Priority matrix, internal link sprints, entity strategy |
| eeat-scoring-engine | E/E/A/T factor scoring per Quality Rater Guidelines |
| ai-orchestration-engine | Multi-model routing, ensemble, RLHF, cost optimization |

## Frontend: 42 Tabs (7 groups x 6)

1. Entities: Discover | Gap Analysis | Competitors | Authority | Co-occurrence | Wikidata
2. Topics: Cluster Map | Hierarchy | Coverage | Intent | Seasonality | Questions
3. Knowledge Graph: KG Presence | Entity Cards | Schema Types | Structured Data | Rich Results | E-E-A-T
4. Content Analysis: Semantic Audit | NLP Scan | Triple Extractor | Density | Freshness | Gaps
5. Competitors: Comp Entities | SOV | Topical Authority | Featured Snippets | Comp Content | Benchmarks
6. Optimise: Recs | Internal Linking | Content Plan | Entity Strategy | Schema Gen | AI Writer
7. Advanced: AI Analysis | Trends | Voice Search | International | Settings | World-Class

## Key Innovations

### E-E-A-T Scoring
Algorithmic scoring of Experience (22%), Expertise (26%), Authoritativeness (28%), Trustworthiness (24%)
per Google Quality Rater Guidelines. Each signal is weighted by estimated impact.

### PMI Co-occurrence
Pointwise Mutual Information scoring identifies which entities appear together in top-ranking pages.
Helps build contextually relevant content clusters and semantic entity groups.

### Semantic Triple Extraction
Subject to Predicate to Object NLP parsing surfaces knowledge gaps. If competitors have triples
you don't, you can create targeted content to claim those semantic relationships.

### Multi-Model AI Routing
Entity discovery: GPT-4o + Gemini. E-E-A-T: Claude 3.5. Schema: Gemini 1.5 Pro.
Ensemble voting with confidence weighting reduces hallucination risk.

## API Summary (248 endpoints)

### System: /health, /stats, /dashboard, /overview
### Entities: /entities, /entities/discover (POST), /entities/:id/co-occurrences, /entities/wikidata-match, /entities/gaps, /entities/report, /entities/categories, /entities/competitors, /entities/bulk-discover, /entities/pmi-analysis, /entities/schema-types
### Topics: /topics/clusters, /topics/clusters/:id/hierarchy, /topics/clusters/:id/questions, /topics/questions, /topics/seasonal, /topics/authority, /topics/content-plan, /topics/coverage, /topics/intent-map, /topics/clusters/create
### KG: /kg/presence, /kg/rich-results, /kg/eeat, /kg/schema/generate, /kg/schema/validate, /kg/schema/types, /kg/structured-data, /kg/entity-cards, /kg/recommendations, /kg/audit
### Content: /content/analyze, /content/nlp-scan, /content/triples, /content/freshness, /content/gaps, /content/density, /content/bulk-analyze, /content/semantic-audit
### Competitors: /competitors, /competitors/entity-gaps, /competitors/featured-snippets, /competitors/swot, /competitors/benchmarks, /competitors/add, /competitors/sov, /competitors/analyze
### Optimize: /optimize/priorities, /optimize/internal-links, /optimize/entity-strategy, /optimize/schema, /optimize/content-plan, /optimize/ai-prompts, /optimize/actions/:id/complete, /optimize/recs
### EEAT: /eeat, /eeat/signals, /eeat/signals/:id (PUT), /eeat/roadmap, /eeat/competitors, /eeat/quick-wins
### AI: /ai/models, /ai/analyze, /ai/route, /ai/feedback, /ai/feedback/stats, /ai/usage, /ai/prompt-builder, /ai/entity-discover, /ai/eeat-analysis, /ai/schema-gen

## Environment Variables
- OPENAI_API_KEY — GPT-4o, GPT-4o-mini
- ANTHROPIC_API_KEY — Claude 3.5 Sonnet (optional)
- GOOGLE_AI_API_KEY — Gemini 1.5 Pro (optional)
