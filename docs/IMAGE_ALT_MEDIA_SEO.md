# Image Alt Media SEO

Production-ready Shopify-embedded alt-text generator with Postgres persistence, OpenAI generation, lint/grade, batch processing, analytics, and health checks.

## Endpoints
- `GET /api/image-alt-media-seo/images` — list images with pagination/search (`limit` 1–200, `offset`, optional `search` across url/alt)
- `GET /api/image-alt-media-seo/images/similar?q=...&limit=...&format=json|csv` — token-overlap similarity search across alt text and URL; returns scored items (limit 1–50, default 10). `format=csv` streams `id,url,altText,score`.
- Postgres deploys lower(url)/lower(alt_text) btree indexes plus pg_trgm GIN indexes on url/alt_text (extension auto-created if absent) to speed search/similarity.
- `POST /api/image-alt-media-seo/images` — create `{ url, altText }`
- `PUT /api/image-alt-media-seo/images/:id` — update
- `DELETE /api/image-alt-media-seo/images/:id` — delete
- `POST /api/image-alt-media-seo/import` — `{ items|data: [{ url, altText }] }`; validates object shape, clamps alt text length, rejects empty/oversized URLs, caps payload to 200 items; supports `dryRun`; optional `errorExport` to download validation errors as JSON (frontend shows download link on dry-run failure)
- `POST /api/image-alt-media-seo/import/csv` — accepts CSV payload (body.csv or raw text). Columns: `url`, `altText` (headers optional). Validates and imports; returns JSON errors with attachment when invalid.
- `GET /api/image-alt-media-seo/export` — export all images as JSON (defaults to full set); supports `?q` to similarity-score/sort with `score` returned, `?limit` clamp (1–100, defaults to all), and `?collection`/`?vendor` substring filters on url/alt text
- `GET /api/image-alt-media-seo/export/csv` — export all images as CSV (`id,url,altText,createdAt`); use `?includeHeaders=false` to omit the header row; supports `?collection` and `?vendor` substring filters on url/alt text; when `?q` is provided, rows are similarity-scored/sorted with a `score` column and `?limit` applied (1–100)
- `GET /api/image-alt-media-seo/meta` — presets (tone, verbosity, safeMode default, brand vocab hint, preset bundles) and limits (items, keywords, brand terms, alt/url length)
- `GET /api/image-alt-media-seo/analytics` — coverage/dupe/length stats (supports `?collection` and `?vendor` filters)
- `GET /api/image-alt-media-seo/analytics/missing` — IDs with missing alt text or URL (counts + arrays; respects `?collection` and `?vendor` filters)
- `GET /api/image-alt-media-seo/analytics/length-bands` — histogram of alt text lengths across bands (0-24, 25-50, 51-80, 81-120, 121-160, 161+; respects `?collection` and `?vendor` filters)
- `GET /api/image-alt-media-seo/analytics/duplicates` — alt texts used more than once with counts and IDs (respects `?collection` and `?vendor` filters)
- `POST /api/image-alt-media-seo/images/bulk-update` — bulk alt/url updates `{ items: [{ id, altText?, url? }] }`
- `POST /api/image-alt-media-seo/ai/generate` — single generate; supports context (productTitle, attributes, shotType, focus, variant, scene), `keywords`, `brandTerms`, tone (`minimalist|balanced|expressive`), verbosity (`terse|balanced|detailed`), `locale`, `safeMode`, `variantCount` (1–5) returning `variants[]` with lint/grade plus `result` as the chosen primary
- `POST /api/image-alt-media-seo/ai/caption` — single-sentence caption; supports `input|imageDescription`, `url`, context, `keywords`, `brandTerms`, `locale`, `safeMode`; returns `caption`, `lint`, `sanitized`
- Outputs are clamped to 400 chars for safety.
- `POST /api/image-alt-media-seo/ai/batch-generate` — batch up to 200 items; accepts shared/per-item `keywords`, `brandTerms`, tone, verbosity, `variantCount` (per-item override supported); validates item objects; `chunkSize` bounded 1–100; optional `paceMs` (0–2000) pauses between chunks to ease rate limits; returns `variants[]` per item and `summary` with totals, ok/errors, durationMs, chunkSize, paceMs, locale, safeMode, tone, verbosity, brandTerms, keywords
- Lints now return `issues` (blocking) and `warnings` (advisory) plus counts for each
- `POST /api/image-alt-media-seo/lint` — lint/grade existing alt text (alt is clamped to 400 chars); accepts `brandTerms`; flags vague adjectives, repeated words, casing/shouting, brand presence, instructional verbs, unspecified colors
- `GET /api/image-alt-media-seo/runs` — recent batch run summaries (includes chunkSize, paceMs, locale, safeMode, keywords, brandTerms, tone, verbosity)
- Analytics caching: `/analytics`, `/analytics/missing`, `/analytics/duplicates`, `/analytics/length-bands` respond with `cached` flag; cache TTL ~60s. Clear via `POST /api/image-alt-media-seo/analytics/cache/clear` (also auto-clears on imports/CRUD).
- Metrics: `/metrics` includes rateLimit hits and OpenAI success/errors + p95 latency.
- Health: `GET /api/image-alt-media-seo/health/db`, `GET /api/image-alt-media-seo/health/full`, `GET /api/image-alt-media-seo/health/openai` (config presence only)
- Health: `GET /api/image-alt-media-seo/health/db`, `GET /api/image-alt-media-seo/health/full`
- Metrics: `GET /api/image-alt-media-seo/metrics` aggregates batch run stats (totals, averages, last run; last run echoes run metadata)
- Batch observability: when pacing or non-default chunking is used, batch summaries (total/ok/errors/chunkSize/paceMs/durationMs) are logged to stdout

## Console UI Notes
- Filters: collection/vendor substring filters flow through analytics, missing, length-bands, duplicates, and exports (JSON/CSV); CSV toggle supports `includeHeaders=false`.
- Drilldowns: missing IDs, length bands, and duplicate alts render in the Analytics panel with copy/download (JSON) controls.
- Presets: UI pulls tone/verbosity/safeMode defaults, brand vocab hint, and bundle presets from `/meta` (bundles set tone+verbosity pairs).
- Variants: single generate and batch generate expose `variantCount` controls (1–5) and render variants with lint/grade; you can apply, copy, or save any variant.
- Images list: paginated/searchable via `limit/offset/search` query params and UI controls; shows totals and paging controls.
- Similarity finder: UI exposes “Find similar” search with top-N selector, Clear control, and scored CSV download; results show scores, allow selecting rows or seeding bulk edits with an existing alt, and respect query `limit`.
- Bulk edit: select rows (checkboxes or select page), set alt text, and apply via `/images/bulk-update` with inline feedback.
- Captions: UI exposes an AI Caption action (single sentence) with lint info and copy/use-sanitized controls.

## Environment
- `DATABASE_URL` or `AURA_PG_URL` (required, Postgres)
- `IMAGE_ALT_MEDIA_SEO_INMEMORY=true` (optional; use in tests/dev to skip Postgres and run fully in-memory)
- `PGSSL` (optional; set `false` to disable SSL)
- `OPENAI_API_KEY` (for generation; falls back to deterministic builder when missing)
- `OPENAI_API_KEY` (for generation; falls back to deterministic builder when missing; set `OPENAI_STUB=true` in tests/dev to skip external OpenAI calls)
- `SHOPIFY_API_SECRET` or `SHOPIFY_CLIENT_SECRET` (for HMAC validation)
- `SHOPIFY_STORE_URL` (optional allowlist; required to lock to a single shop in production)

## Safeguards
- Shopify HMAC + shop allowlist; shop domain validation
- Rate limiting: 120 requests/min per shop/IP; responds with `429` and `Retry-After: 60`
- Safe mode defaults on; PII/promo sanitization; keyword/brand term/URL/attribute length clamps; batch max 200 items; chunking + optional pacing to reduce 429s
- Alt text outputs are clamped to 400 chars to avoid overlong content.

## Health & Ops
- DB check: `/api/image-alt-media-seo/health/db`
- Full check (DB, OpenAI configured, shop lock): `/api/image-alt-media-seo/health/full`
- Slow-request logging (>1s) to stdout

## Frontend
- Console UI at `aura-console/src/components/tools/ImageAltMediaSEO.jsx`
- Features: context inputs, locale presets, tone/verbosity selectors, brand vocab input, preset bundles, safe mode toggle, lint/grade display, lint-only panel, variant count + variant cards (apply/copy/save), batch JSON runner with variant count + chunk/pacing controls, run history (tone/verbosity/brand/chunk/pacing metadata) with runs export, analytics, copy/download alt text, batch results download/copy/clear, retry failed batch items, import/export with dry-run, paginated/searchable images list, rate-limit friendly messaging.

## Deploy notes
- Restart service after setting env vars.
- Render env vars: `DATABASE_URL` (or `AURA_PG_URL`), `OPENAI_API_KEY`, `SHOPIFY_API_SECRET` (or `SHOPIFY_CLIENT_SECRET`), optional `SHOPIFY_STORE_URL`, optional `PGSSL=false` if SSL errors.
- Health checks: `/api/image-alt-media-seo/health/db` and `/api/image-alt-media-seo/health/full` (expect `ok: true`).
- Smoke: single generate, batch generate (sample JSON), save item, view runs and analytics.
- Logs: watch for rate-limit 429s and slow-request warnings (>1s).
