# Release Notes

## Phase 3 (Image Alt Media SEO)
- Added analytics response caching (~60s TTL) with cache clear endpoint; auto-clears on imports/CRUD.
- Added rate-limit hit counters in metrics for ops visibility.
- Introduced AI Caption endpoint (single-sentence caption) and console UI action with lint/sanitization controls.
- Polished UI to show alt + caption side-by-side when both are present; variants/pagination remain.
- Tests expanded to cover caption, analytics cache, variants, pagination; all passing.
- Rebuilt better-sqlite3 for current Node; native deps healthy.

Ops checklist: run `npm test -- image-alt-media-seo`, verify `/metrics` shows rateLimit stats, and smoke the caption/analytics cache endpoints.

## Phase 4 (Image Alt Media SEO)
- Added similarity search endpoint (`/images/similar`) with token-overlap scoring and UI finder (top-N selector, reuse alt into bulk editor).
- Introduced bulk edit workflow in console (row selection, select-page, apply alt to selected) wired to `/images/bulk-update`.
- Improved keyboard flow on image search (Enter submits) and added selectable rows with visual feedback.
- Tests updated to cover similarity search ordering.

## Phase 5 (Image Alt Media SEO)
- Similarity export: `/images/similar` supports `format=csv` streaming `id,url,altText,score`; UI adds download control.
- Added Postgres indexes on lower(url) and lower(alt_text) to speed search/similarity.
- A11y polish: similarity/bulk controls include ARIA labels/status and selected pills on rows.
- Performance: auto-enables `pg_trgm` and adds GIN trigram indexes on url/alt_text for fuzzy search/similarity speed.
