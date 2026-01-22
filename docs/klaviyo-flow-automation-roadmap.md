# Klaviyo Flow Automation — Competitive Feature Rollup & Build Plan

Date: 2026-01-22
Owner: Aura Core
Status: Draft
Scope: Bring parity and differentiation vs. Klaviyo, Attentive, Iterable, Braze, ActiveCampaign, Mailchimp, HubSpot, Salesforce MC, Customer.io, Omnisend, Drip.

## Feature Matrix (Gap Check)
- **Visual Journeys**: ✅ basic (email/SMS text); ❌ rich canvas, branching UX polish
- **Channels**: ✅ email/SMS text; ❌ push, in-app, web push, ads retargeting, WhatsApp
- **AI**: ✅ suggest/automate (OpenAI); ❌ predictive LTV/churn, send-time optimization, product recs, content scoring, subject/gen AI variants, guardrails
- **Segmentation**: ✅ basic; ❌ behavioral, real-time event-driven, predictive segments
- **Personalization**: ✅ text templates; ❌ dynamic data bindings, product feeds, conditional content blocks
- **A/B/n & Experiments**: ❌ variants, splits, holdouts, stats engine
- **Analytics**: ✅ run summary; ❌ cohort, funnel, attribution, revenue, deliverability, per-step drop-off
- **Integrations**: ✅ Klaviyo/Shopify hooks (light); ❌ Salesforce, HubSpot, Segment, Snowflake, BigQuery, Zapier, Attentive, Braze, Iterable, Customer.io, Omnisend, Drip, webhooks-in, webhook signing
- **Data & Storage**: ✅ JSON persistence; ❌ events store, multi-tenant isolation, PII hashing, retention policies
- **Collaboration**: ✅ collaborator list; ❌ roles in UI, approvals, versioning, comments, share links, audit log
- **Compliance & Trust**: ✅ GDPR/SOC2 claims; ❌ HIPAA/TCPA/CCPA toggles, DSR APIs, consent registry, rate/geo controls
- **Operational**: ✅ health; ❌ alerting hooks, dead-letter, replay, scheduler with SLAs
- **Marketplace/Plugins**: ✅ stub; ❌ registry UI, extension API, templates gallery

## Phased Build Plan

### Phase 1 — Foundation (immediate)
- Add multi-channel primitives (push/web push/in-app placeholders), webhook-in, and branching UX improvements.
- Add A/B/n variant blocks and holdouts in flows (backend schema + UI controls).
- Add advanced analytics skeleton (events, steps, funnels) and persist events store.
- Add segmentation model (rules + traits) and attach to flows.
- Surface RBAC in UI (roles: admin/editor/viewer) and audit log entries for CRUD.

### Phase 2 — AI & Personalization
- Predictive scores (LTV/churn/next-best-action/send-time) via OpenAI/Anthropic + heuristics.
- AI content variants (subject/body, SMS, push copy) with safety/brand guardrails.
- Product recommendations (feed ingestion; simple popularity + vector recall optional).
- Dynamic content blocks and conditional rendering per segment.

### Phase 3 — Integrations & Data
- Connectors: Segment (sources), Salesforce/HubSpot (CRM), Zapier, Snowflake/BigQuery (warehouse sync), webhooks-in with signing/verification, consent sync. **(added API stubs and config storage)**
- Event ingestion pipeline, retention, PII hashing, and per-project isolation. **(event ingest endpoint with PII hashing added; persistence via events store)**
- Export/import flows with dependencies; template gallery + marketplace stubs.

### Phase 4 — Analytics & Experiments
- Cohort/funnel/attribution dashboards; deliverability and revenue per step.
- Stats engine for A/B/n with configurable metrics and minimum sample guardrails.
- Holdouts and control groups; reporting and alerts.

### Phase 5 — Collaboration, Compliance, Ops
- Approvals workflow, comments, versions, share links, audit log UI.
- Compliance toggles: HIPAA/TCPA/CCPA; consent registry; DSR endpoints.
- Observability: alerts hooks (email/webhook), replay/dead-letter, scheduler SLAs.

## Minimal Backlog Tickets (cut to ship)
- backend: add channel models (push/web push/in-app), update flow schema, RBAC in responses.
- backend: events store (SQLite/JSON) + analytics endpoints for funnels/cohorts.
- backend: A/B/n split nodes with allocation and results buckets.
- backend: segmentation rules API + attach to flows; preview endpoint.
- backend: webhook-in endpoint (signed) to trigger flows; outbound signing.
- backend: notifications/alerts endpoint and dead-letter queue stub.
- ui: flow builder supports channel types, splits, holdouts; variant editing UI.
- ui: analytics panel for funnels/step drops; experiments results; event debugger.
- ui: RBAC surface (role badge, disabled controls) and audit log view.
- ui: segmentation builder (conditions, events, traits) and attach to flows.

## Notes
- Keep storage path configurable (env) and multi-tenant safe.
- Add rate limits and consent checks per channel (TCPA/GDPR).
- Use feature flags to roll out channels and experiments safely.
