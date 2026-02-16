# Weekly Blog Content Engine (Enterprise)

Enterprise weekly blog system spanning 8 engines and 248 endpoints. Fully offline/deterministic (no external AI keys needed) with 42-tab console UI.

## Architecture
- Engines: Research/Intent, Calendar, Briefs/Compliance, Outlines, SEO Optimizer, Distribution, Collaboration, Performance Analytics, AI Orchestration.
- Router: `/api/weekly-blog-content-engine/*` with health, stats, 30+ endpoints per engine group.
- Deterministic planner: `src/tools/weekly-blog-content-engine/index.js` generates weekly posts without OpenAI.
- Frontend: `aura-console/src/components/tools/WeeklyBlogContentEngine.jsx` using `aura-console/src/weekly-blog/WeeklyBlogContentEngine.css` for the 42-tab workspace.

## Key Endpoints (samples)
- `GET /api/weekly-blog-content-engine/health` — status + version.
- `GET /api/weekly-blog-content-engine/stats` — engine stats snapshot.
- `POST /api/weekly-blog-content-engine/research` — create research record; `POST /research/score` to score intent.
- `POST /calendar` | `GET /calendar/:id` — manage calendar weeks + readiness.
- `POST /briefs` | `GET /briefs/:id/score` | `GET /briefs/:id/compliance` — briefs + compliance.
- `POST /outlines` | `GET /outlines/:id/grade` — outline generation and grading.
- `POST /seo/metadata` | `POST /seo/schema` | `POST /seo/density` — on-page optimizer.
- `POST /distribution` | `GET /distribution/:id/readiness` | `GET /distribution/:id/schedule` — channel plans.
- `POST /collab/tasks` | `POST /collab/comments` | `GET /collab/:briefId/activities` — collaboration.
- `POST /performance/record` | `POST /performance/forecast` — analytics.
- `POST /ai/orchestrate` | `POST /ai/ensemble` | `GET /ai/providers` — AI routing/feedback.

## Frontend Views (42 tabs grouped)
Strategy, Production, SEO, Distribution, Collaboration, QA, Ops. Each card surfaces readiness, metadata grades, outline quality, calendar status, channel readiness, tasks, and AI run outcomes.

## Testing
- Jest/supertest smoke coverage in `src/__tests__/weekly-blog-content-engine.test.js` (health, stats, research, AI orchestrator, SEO metadata).
- No external services; deterministic data enables offline CI.

## Usage
- Start server: `npm run dev` (or your existing script). Mount path: `/api/weekly-blog-content-engine`.
- Console: open Weekly Blog Content Engine tool; orchestrate best-of-n or ensemble to preview routing feedback.

## Change Log (v2.0.0)
- Rebuilt router into enterprise multi-engine surface.
- Removed OpenAI dependency; deterministic weekly planner.
- Added enterprise UI (42 tabs), CSS system, and tool meta update.
- Added smoke tests and docs (this file).
