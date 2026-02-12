# Dynamic Pricing Engine — Specification (v1)

## Goal
Build an enterprise-grade dynamic pricing platform that adapts prices in real time using demand, inventory, competitor signals, seasonality, promotions, and customer segments. Target scope: ~19k LoC (backend, frontend, tests, docs) with production-grade reliability, observability, governance, and safety guardrails.

## Personas & Use Cases
- **Pricing Manager**: create/approve rules, run simulations, schedule price updates, export audit trails.
- **Growth/Marketing**: launch promos, A/B test price points, coordinate campaigns and bundles.
- **Data/RevOps**: connect data sources, monitor model drift, manage cost/margin guardrails.
- **Engineering**: integrate via API/webhooks, set rollout policies, manage environments.

## Functional Scope
- Rule engine: priority-based rules, stacks (global, category, product), segment-aware, time-windowed, store-aware.
- Signals: demand index, inventory, velocity, competitor prices, seasonality, elasticity curves, promo calendars, cost/margin floors, shipping/fees.
- Price computation: deterministic rules + ML-assisted recommendations; guardrails (floor/ceiling, margin, MAP), rounding strategies, taxes/fees optional.
- Experiments: A/B and multi-armed bandits for price points; holdouts; auto-stop on guardrail breach.
- Forecasting/simulation: what-if on demand, inventory, promo; sensitivity analysis; revenue/GM impact estimates.
- Workflows: approvals, dual-control for high-impact changes, scheduled rollouts, change logs, rollback.
- Integrations: Shopify Admin API, ERP/OMS hooks, competitor feeds (CSV/API), webhooks for price applied/failed events.
- Collaboration: comments, assignments, notifications (email/slack webhook placeholder), version history per rule.
- Internationalization: multi-currency, locale formatting; translations via i18n table.
- Compliance/Safety: audit log, RBAC (admin/analyst/viewer/service), PII avoidance, GDPR/CCPA posture, MAP enforcement flags.

## Non-Functional
- Availability target 99.9%, latency p95 < 500ms for price lookups.
- Idempotent APIs, pagination, filtering; rate limits per key and per IP.
- Observability: structured logs, metrics (price_calc_ms, rules_applied, guardrail_hits), tracing hooks.
- Security: input validation, auth via API key + (later) OAuth/JWT; signed webhooks; request size caps.

## Data Model (initial)
- Rule: id, name, scope (global/category/product/segment), predicates, actions, priority, status, schedule, tags, owner, reviewers, version, createdAt, updatedAt.
- PriceComputation: id, productId, ruleIds[], basePrice, recommendedPrice, floor, ceiling, signals, elasticity, currency, context (channel/segment/region), diagnostics, createdAt.
- Experiment: id, name, variants[{price, weight}], metric, guardrails, status, startAt, endAt, results, winner.
- AuditLog: id, actor, action, entity, before, after, timestamp, source.
- Integration: id, type (shopify/erp/competitor), credentials ref, status, lastSync, settings.
- WebhookSubscription: id, url, events[], secret, status.

## API Surface (draft)
**Admin/Rules**
- GET/POST /rules, GET/PUT/DELETE /rules/:id, POST /rules/:id/clone, POST /rules/:id/publish, POST /rules/:id/rollback
- POST /rules/validate, POST /rules/bulk/import, GET /rules/export

**Pricing & Experiments**
- POST /ai/price (recommendation + guardrails)
- POST /pricing/evaluate (deterministic calculation with supplied signals)
- POST /experiments, GET/PUT /experiments/:id, POST /experiments/:id/start|stop, GET /experiments/:id/results

**Signals & Integrations**
- POST /signals/ingest (demand, competitor, inventory)
- POST /shopify/sync, GET /shopify/products (stub for now)
- POST /webhooks/test, POST /webhooks/subscribe, DELETE /webhooks/:id

**Analytics & Audit**
- GET /analytics/summary, GET /analytics/events
- GET /audit/logs

**System**
- GET /health, GET /i18n, GET /compliance, POST /rbac/check

## Guardrails & Safety
- Enforce margin floors (cost + minMargin), MAP compliance flag, price caps.
- Hard stops: block publish if validation fails; block experiment if guardrail unmet; revert on anomaly spike.
- Rounding rules: .99, .95, bankers, custom step.

## AI/ML Plan
- Models: GPT-4o/Claude/Gemini routing; fallback to deterministic rules if AI fails.
- Elasticity estimation: simple regression placeholder; later plug to forecasting service.
- Bandit strategy for experiments (epsilon-greedy placeholder, extensible to UCB/TS).
- Feedback loop: price outcome events feed back into model scoring (stub in v1).

## Frontend (console) Scope
- Pages: Overview, Rule Builder (wizard + JSON), Experiments, Signals, Integrations, Analytics, Audit, Settings.
- Features: bulk upload CSV/XLSX, collaborator mentions, approvals, diff view, timeline, dashboards (rev/GM, guardrail hits, experiment lift), onboarding checklist.
- Accessibility: keyboard nav, ARIA labels, color-safe themes, light/dark modes.

## Testing Plan
- Unit: rule evaluation, guardrails, rounding, validation.
- Integration: pricing endpoints (success/error), import/export, experiments lifecycle, webhooks signature verify (stub), RBAC checks.
- E2E (later): console flows for creating/publishing rules, running experiment, viewing analytics.

## Delivery Plan (8-week cadence)
- **Week 1**: Finalize spec, API contracts, data model, validation schemas, seed fixtures.
- **Weeks 2-3**: Backend services: rule store, evaluator, AI pricing, guardrails, analytics, audit, webhooks, integrations stubs, tests.
- **Weeks 4-5**: Console app: multi-tab UI with rule builder, experiment setup, analytics dashboards, onboarding, accessibility.
- **Week 6**: Experiments & simulations: bandit stub, what-if simulator, charts, exports.
- **Week 7**: Hardening: auth/rate limits, observability, perf tuning, pagination/filters, i18n, RBAC, compliance.
- **Week 8**: Docs, runbooks, QA, line coverage, polish, release notes.

## Risks & Mitigations
- Data freshness (competitor/inventory): expose lastSync and stale warnings.
- Guardrail breaches: block publish + auto-rollback endpoint; alerts via notification hooks.
- API cost/latency: caching for competitor feeds; AI fallback to rules; batch evaluate endpoint.
- Change fatigue: versioning, rollback, approvals, audit log, dry-run simulator.

## Backend Architecture (draft)
- **Services & layers**: Express API with domain modules (rules, pricing, experiments, signals, analytics/audit, integrations, webhooks, auth/rbac). Use a lightweight service layer per module with shared utilities (validation, logging, metrics, auth middleware, rate limits, pagination helpers, idempotency keys).
- **Data stores**: Postgres (rules, experiments, price_computations, audit_logs, integrations, webhook_subscriptions, signals_ingest queue table), Redis (hot caches for rules/by-scope, recent price outputs, rate limits), S3/Blob for bulk upload files. Keep in-memory stubs for dev until persistence lands.
- **Queues & async**: Bull (Redis) queues for long-running tasks (bulk price recompute, imports, webhook delivery retries, Shopify sync). Notification hooks enqueue events to avoid blocking API threads.
- **Pricing evaluation pipeline**: (1) validate request (productId/sku/context/currency), (2) load scope rules (global/category/product/segment) + feature flags, (3) fetch signals (demand, inventory, competitor, elasticity, seasonality, promo), (4) apply guardrails (floor/ceiling/margin/MAP), (5) deterministic rule evaluation (priority order, first-match or merge), (6) optional AI recommendation (GPT-4o/Claude/Gemini routing) with safety clamps, (7) rounding strategy (.99/.95/step/custom), (8) record audit + analytics event, (9) emit webhook/notifications async, (10) cache result (keyed by product+segment+channel).
- **Rule model**: id, name, scope, predicates (JSON logic), actions (set price/discount/override/floor/ceiling), priority, status (draft/approved/published), schedule, reviewers, version, tags, channels, currency, createdAt/updatedAt, lastEvaluatorHash.
- **Experiments**: store variants {price, weight}, guardrails, metric, holdout; support bandit strategy field (epsilon for v1). Track exposures/outcomes in analyticsModel; auto-stop on guardrail breach.
- **Signals ingestion**: POST /signals/ingest accepts batched demand/inventory/competitor; store with freshness timestamps; mark stale if beyond SLA; expose /signals/summary.
- **Integrations**: Shopify Admin sync stub; ERP/competitor feed stubs. Webhook subscriptions table; signed payloads (HMAC) planned.
- **Security & compliance**: API key auth v1; RBAC roles (admin/analyst/viewer/service) enforced per route; input size caps; request logging with PII scrubbing; audit log append-only; GDPR/CCPA posture (no PII in pricing payloads).
- **Observability**: metrics (price_calc_ms, rules_applied, guardrail_hits, ai_invocations, queue_lag), structured logs, tracing hooks placeholder. Health/ready endpoints per service; rate limit headers; pagination cursors.
- **Error handling**: consistent problem+json shape; validation errors list fields; AI fallbacks to deterministic path with warn flag; 429 for rate limits; 503 for upstream dependencies (OpenAI/Redis/DB) with retry-after where applicable.

## Console UX Plan (draft)
- **Navigation shell**: Left rail with sections (Overview, Rules, Experiments, Signals, Integrations, Analytics, Audit, Settings); right panel for inspectors/diffs; top bar shows env, last sync, and guardrail alert badge.
- **Overview**: KPI tiles (rev, GM, guardrail hits, stale signals), rollout status, open approvals, live price lookup widget (product/segment/channel) with diagnostics and cache hit flag.
- **Rules**: List with filters (scope, status, tags, owner, reviewer). Rule Builder wizard (scope → predicates → actions/guardrails → schedule → reviewers). JSON editor with schema validation + lint. Diff view (current vs draft), version history, timeline of comments/mentions, approvals with dual-control for high-impact changes. Bulk import/export CSV/XLSX; dry-run validator; publish/rollback buttons.
- **Experiments**: Create/edit experiment with variant table, guardrails, holdout, bandit toggle (epsilon). Status chips (draft/running/paused/stopped), lift charts, exposure/outcome breakdown, auto-stop reason, download results CSV. Variant-level diagnostics (guardrail breaches, sample ratio mismatch warnings).
- **Signals**: Ingest uploads (CSV/API placeholder), freshness indicators per source, SLA badges, demand/competitor/inventory charts, stale signal alerts, mapping UI for external fields → internal schema. Manual overrides with expiry. Last sync per integration.
- **Pricing simulator**: What-if playground to simulate price given signals; toggle AI vs deterministic; show applied rules, guardrail clamps, rounding, and final price with audit trace. Save scenario presets.
- **Integrations**: Shopify stub card (sync buttons, last run, error log), competitor feed cards, webhook subscriptions table (url, events, status, last delivery, retries). Test webhook sender with signed payload preview.
- **Analytics**: Dashboards for revenue/GM, guardrail hits over time, experiment lift, cache hit rate, latency (p50/p95), rule evaluation counts. Filters by product/category/segment/time. Export PNG/CSV.
- **Audit & approvals**: Timeline of changes with before/after diff, actor, RBAC role. Approval queue, comments with mentions, change rationale field, rollback entry point.
- **Settings**: API keys management, roles matrix (admin/analyst/viewer/service), rounding presets, currencies/locales, i18n strings table, webhook secrets, rate limits. Onboarding checklist with progress.
- **UX quality**: Keyboard shortcuts for search/nav, ARIA labels, skeleton/loading states, optimistic updates with rollback on error, toast + inline errors, dark/light themes.

## Testing & Fixtures Plan (v1)
- **Unit**: rule evaluation (predicate JSON logic, priority resolution), guardrails (floor/ceiling/MAP/margin), rounding strategies, AI fallback logic, bandit epsilon selection, validation schemas.
- **Integration (API)**: routes for rules CRUD/validate/publish/rollback, pricing evaluate (success/failure), experiments lifecycle, signals ingest freshness, import/export, webhooks subscribe/test (signature stub), RBAC checks, rate limit/backpressure behavior.
- **Console (later)**: component tests for Rule Builder wizard, diff/approvals, experiment setup, simulator, analytics dashboards; accessibility snapshots for key flows; smoke E2E for create → validate → publish rule and run price simulation.
- **Fixtures**: seed rules (global/category/product/segment), sample products with cost and MAP, signals payloads (demand/inventory/competitor), pricing requests, experiment variants/outcomes, webhook subscription examples, i18n strings. Provide golden expected price outputs for deterministic cases.
- **Test doubles**: mock OpenAI/Claude client, Redis cache, Shopify/competitor feeds, webhook delivery queue, RBAC middleware, analytics emitter; fake clock for schedules and freshness; deterministic random for bandit tests.
- **Data hygiene**: idempotent seeds, reset helpers, pagination/prefix-aware IDs, JSON schema validators for inputs/outputs; assert observability fields (requestId, latency ms) present.
