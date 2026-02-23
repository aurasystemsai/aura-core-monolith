# AURA Core Monolith — AI Coding Instructions

## Architecture Overview

**Monorepo** with two layers that share a single Node.js process in production:

| Layer | Path | Stack | Purpose |
|-------|------|-------|---------|
| Backend API | `src/` | Express 5, CommonJS (`type: "commonjs"`) | REST API, Shopify integration, data |
| Frontend SPA | `aura-console/` | React 18, Vite 7, ESM | Shopify-embedded UI (iframe) |

The backend serves the built SPA from `aura-console/dist/` and proxies API calls. Deployed as a single service on Render (see `render.yaml`).

## Backend: Tool Architecture

Every feature is a **tool** under `src/tools/<tool-id>/`. A tool directory contains:

- `index.js` — exports `{ meta: { id, name }, run(input, ctx) }` registered in `src/core/tools-registry.cjs`
- `router.js` — Express router mounted at `/api/<tool-id>` in `src/server.js`
- Supporting modules (e.g., `campaign-manager.js`, `workflow-engine.js`)

**Route registration pattern** in `src/server.js`:
```js
const toolRouters = [
  { path: '/api/email-automation-builder', router: require('./tools/email-automation-builder/router'), middleware: requireTool('email-automation-builder') },
];
```
Premium tools use `requireTool()` middleware from `src/core/planAccessControl.js` (tiers: free → professional → enterprise).

**API conventions:**
- All responses use `{ ok: true, ...data }` or `{ ok: false, error: "message" }`
- Auth via Shopify session token verified by `src/middleware/verifyShopifySession.js`
- Shop-scoped via `x-shopify-shop-domain` header

## Frontend: Component Patterns

All tool UIs live in `aura-console/src/components/tools/<ToolName>.jsx` — **one file per tool**, inline styles, no CSS modules. Components use a dark theme (`#09090b` background, `#fafafa` text, `#18181b` cards, `#3f3f46` borders).

**API calls from frontend** — two patterns exist:
1. **Shared `apiFetch()`** from `aura-console/src/api.js` — adds Bearer token, shop domain header, retry logic. Use for new code.
2. **Local `apiFetch()`** — some older tools define their own fetch helper at the top of the file with a hardcoded base path (e.g., `const API = '/api/email-automation-builder'`). Don't double-prefix paths in these.

**Tool metadata** for the UI catalog is in `aura-console/src/toolMeta.js`. Plan gating is in `aura-console/src/hooks/usePlan.js` (`TOOL_PLAN` map).

**Routing** is state-based in `App.jsx` (`activePage` state), not React Router. Tools are lazy-loaded with `React.lazy()`.

## Build & Dev Commands

```bash
# Backend
npm start              # production: node src/server.js (port 10000)
npm run dev            # nodemon auto-reload

# Frontend
cd aura-console && npm run dev   # Vite dev server
npm run build:console            # production build → aura-console/dist/

# Tests (Jest + supertest)
npm test                         # all tests (Node 22 required)
npm run test:node22:direct:local # Windows: uses bundled Node 22, sets OPENAI_API_KEY=test-key

# Verify all tools load
npm run test:tools     # node src/test-all-tools.js
```

**Node version:** 22.x required (22.22.0 in CI). Node 24 causes Jest resolver issues — use `npm run test:node22` variants.

## Product Vision: AI-First, Manual-Optional

**Every action in every tool must have an AI-powered option.** Users can always do things manually if they prefer, but the default experience is AI-assisted. This is the core product vision for AURA.

- Every tool should expose "AI Generate", "AI Suggest", or "AI Optimise" actions for its key workflows.
- Manual input fields are always available alongside AI actions — never force AI-only.
- All AI actions consume credits (see Credit System below). Show the credit cost before the user confirms.
- The AI model used may vary by tool complexity — lightweight tasks use cheap models (gpt-4o-mini), complex tasks use premium models (gpt-4, gpt-5.2). Credit cost adjusts via model multipliers.

## Credit System & Model-Aware Pricing

All AI features run on OpenAI. Every AI action costs credits, tracked by `src/core/creditLedger.js`.

**Base costs** (per action type, assuming cheapest model gpt-4o-mini):
| Action | Base Credits |
|--------|-------------|
| SEO scan, alt-text, rank check | 1 |
| Email gen, content brief, keyword research | 2 |
| Blog draft, campaign gen | 3 |
| Competitive analysis | 5 |

**Model multipliers** — different OpenAI models cost different amounts:
| Model Tier | Models | Multiplier |
|-----------|--------|------------|
| Budget | gpt-4o-mini, gpt-4.1-mini, gpt-5-mini | 1× |
| Standard | gpt-4o, gpt-4.1, gpt-4-turbo | 2× |
| Premium | gpt-4, gpt-5 | 3× |
| Frontier | gpt-5.2, o1, o3 | 5× |

**Example:** Blog draft (3 base) × gpt-4 (3×) = 9 credits.

**Key files:**
- `src/core/creditLedger.js` — ACTION_COSTS, MODEL_MULTIPLIERS, getEffectiveCost(), deductCredits()
- `src/core/creditMiddleware.js` — requireCredits(), requireCreditsOnMutation(), reads `req.body.model` for dynamic pricing
- `src/routes/billing.js` — /credits, /credit-costs?model=gpt-4, /credit-history
- `aura-console/src/credits/Credits.jsx` — Credits & Usage dashboard

**Wiring pattern:** In `server.js`, each tool route has a `creditAction` that maps to an ACTION_COSTS key. The `requireCreditsOnMutation()` middleware auto-charges POST/PUT/PATCH requests. Use `req.deductCredits({ model })` after successful AI call to charge the right amount.

## Key Conventions

- **Dark theme everywhere.** Use the inline style objects pattern (`const S = { ... }`) already in tool components. Never use light backgrounds (`#fff`, `#fafafa` as page bg) in tool UIs.
- **No TypeScript.** Entire codebase is JavaScript (`.js`/`.jsx`).
- **CommonJS backend, ESM frontend.** Backend uses `require()`/`module.exports`. Frontend uses `import`/`export`.
- **File-based storage** for most tools (`data/` directory, JSON files). Some tools use SQLite (`better-sqlite3`) or Postgres (`pg`).
- **Complete UX states required.** Every feature must handle: loading, success, empty, error, and disabled states. See `AI_DEVELOPMENT_PRINCIPLES.md` for the full checklist.
- **Test files** go in `src/__tests__/<tool-id>.test.js`, using Jest + supertest for API routes.

## Common Pitfalls

- Frontend tool components often have a local `apiFetch()` that prepends the tool's base path — don't call it with the full `/api/tool-name/...` path or you'll double-prefix.
- `App.jsx` uses `activePage` state for navigation, not URL routing. To add a new tool page, add a lazy import + case in the render switch.
- The `src/core/tools-registry.cjs` must have every tool imported and listed — if you add a new tool, register it there.
- `toolMeta.js` controls which tools appear in the UI catalog; `usePlan.js` controls plan gating. Both need updating for new tools.
