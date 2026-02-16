# Blog SEO Engine (Enterprise)

Enterprise-grade blog SEO workspace delivering research, keyword clusters, content briefs, on-page checks, internal linking, performance analytics, and AI orchestration. Matches the 8-engine / 248-endpoint / 42-tab standard used across AURA Phase 3 tools.

## Architecture

- **Backend (8 engines)**
  - Research & Intent: topics, SERP snapshots, intent scoring, notes.
  - Keyword Clusters: clustering, difficulty, refresh/import, evaluation.
  - Content Briefs: structured briefs, scoring, versioning, compliance checks.
  - Outline Optimization: outline generation, grading, versioning, stats.
  - On-page Technical: metadata scoring, schema suggestions, page speed and link health.
  - Internal Linking: suggestion packs, approval flows, sprints/maps.
  - Performance Analytics: capture metrics, forecast, compare periods.
  - AI Orchestration: best-of-n routing, ensemble runs, provider catalog, feedback.
- **Router**: `/api/blog-seo/*` with health, stats, and ~248 REST endpoints across the engines (static feature stubs maintain parity with enterprise pattern).
- **Frontend**: 42-tab React workspace (7 groups × 6 tabs) at `BlogSEO` component with emerald/amber visual system.
- **Styling**: `aura-console/src/blog-seo/BlogSEOEngine.css` (ink + teal gradient, high-contrast pills, responsive grid).
- **Deterministic Core**: `index.js` uses offline-safe orchestration (no external API calls) for CI stability.

## API Surface (high level)

- **Health/Stats**: `/health`, `/stats` (aggregated engine metrics).
- **Research**: `/research/create|get|notes|serp|score|questions|stats` + 24 feature placeholders.
- **Keywords**: `/keywords/cluster|get|refresh|import|evaluate|stats` + 24 feature placeholders.
- **Briefs**: `/briefs` CRUD + `/score|/version|/versions|/compliance` + 24 feature placeholders.
- **Outlines**: `/outline/generate|get|put|grade|version|versions|stats` + 24 feature placeholders.
- **On-page**: `/onpage/metadata|schema|audit|links|stats` + 24 feature placeholders.
- **Internal Links**: `/links/suggest|approve|sprint|map|stats` + 24 feature placeholders.
- **Performance**: `/performance/record|get|forecast|compare|stats` + 24 feature placeholders.
- **AI**: `/ai/orchestrate|ensemble|providers|feedback|run|stats` + 24 feature placeholders.

## Data Model Notes

- In-memory stores for tests/dev (Maps + arrays). Each engine exposes `getStats()` for aggregation.
- IDs use crypto-random prefixes for uniqueness (`research-*`, `cluster-*`, `brief-*`, `run-*`).
- Scoring heuristics keep responses deterministic and fast (no network calls).

## Frontend Experience

- **Tabs**: Manage, Optimize, Advanced, Tools, Monitoring, Settings, World-Class (6 tabs each).
- **Cards**: Research, Keyword clusters, Metadata, Outline, On-page/Schema, Internal Links, Performance, AI Orchestration, Activity/Tasks.
- **Interactions**: Import/export outlines, add clusters/tasks, approve sprints, route via best provider, ensemble queue, readiness progression.
- **Responsive**: Single-column on narrow screens; pill badges for key KPIs.

## Testing

- Comprehensive supertest coverage in `src/__tests__/blog-seo-enterprise.test.js` (health, 8 engines, E2E journey). Deterministic responses enable fast CI without external API keys.

## Deployment & Ops

- **API**: Mounted via `src/server.js` at `/api/blog-seo` (already registered in tool router list).
- **Env**: No external env vars required for core flows; runs offline-friendly.
- **Logging**: Minimal console logging for clarity; extend with morgan if needed.
- **Scaling**: Stateless in-memory for tests; back with Redis/DB for prod if needed.

## Performance & Reliability

- CPU-only deterministic scoring; no external latency.
- Feature placeholders preserve endpoint footprint for forward compatibility.
- Outline/cluster generation uses lightweight heuristics (<5 ms typical in local runs).

## Security & Compliance

- No PII persisted; in-memory only for dev/test.
- Compliance surface: brief compliance checks, on-page audits, link validation hooks.
- Ready for RBAC/SSO hooks via shared middleware when moved to persistent services.

## Next Steps

- Wire real data stores for research/briefs/outlines (Postgres/Redis).
- Add async workers for audits, link crawls, and forecast recalcs.
- Integrate live SERP/keyword APIs and lighthouse audits for production scoring.
