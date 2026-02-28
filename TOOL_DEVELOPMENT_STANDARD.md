# AURA Tool Development Standard
**Every new tool and every future change must follow this standard. No exceptions.**

This document exists because we wasted days fixing the same class of bugs repeatedly:
- AI generated content that had no way to push to Shopify
- Apply buttons that silently did nothing (stale closures)
- No error feedback when things failed
- Tools that were display-only instead of automatic

This is the definitive reference. When in doubt, follow this. When adding a feature, check this first.

---

## 1. The Core Principle: Everything Must Be Pushable

> **If the tool generates content that belongs in Shopify, it must have a button to put it there. No copy-only. No "paste this yourself". Automatic, one click.**

Every tool that generates any of the following **must** have a working Apply/Publish button that writes directly to Shopify:

| Content Type | Shopify Target | Endpoint to use |
|---|---|---|
| Product title, description, meta, handle | Product via Admin API | `/shopify/apply` on tool router |
| Blog article, draft, weekly post | New article via Admin API | `/shopify/publish` on tool router |
| Schema markup (JSON-LD) | Article or Product body_html | `/shopify/apply` on schema tool |
| H2 headings | Article body_html (replaces existing h2s) | Blog SEO `/apply-field` |
| Title / meta description / URL slug | Article fields | Blog SEO `/apply-field` |
| Alt text | Product/article images | Image Alt tool `/images/push-shopify` |

**Never** leave a generated output with only a Copy button. Copy is a fallback, not the primary action.

---

## 2. Backend: Shopify Write Endpoints

### 2a. Use the shared module

All Shopify writes go through **`src/core/shopifyApply.js`**. Never duplicate Shopify API logic in individual routers.

```js
const { applyProductFields, publishArticle, applySchemaToEntity } = require('../../core/shopifyApply');
```

| Function | Use for |
|---|---|
| `applyProductFields(shop, productId, fields)` | Product title, body_html, handle, metaDescription, seoTitle |
| `publishArticle(shop, opts)` | Creating new blog articles from any tool |
| `applySchemaToEntity(shop, opts)` | Injecting JSON-LD into article or product body_html |

For blog article field updates (title, meta, handle, headings on existing articles) use the Blog SEO `/apply-field` pattern which already handles all those cases.

### 2b. Every content tool must have a Shopify write endpoint

Add this to every tool's `router.js` that generates content:

```js
// For tools that publish blog content:
router.post('/shopify/publish', async (req, res) => {
  try {
    const { title, bodyHtml, metaDescription, tags, blogId, asDraft = true } = req.body;
    if (!title) return res.status(400).json({ ok: false, error: 'title required' });
    const shop = req.headers['x-shopify-shop-domain'] || req.body.shop;
    if (!shop) return res.status(400).json({ ok: false, error: 'No shop domain — add x-shopify-shop-domain header' });
    const { publishArticle } = require('../../core/shopifyApply');
    const result = await publishArticle(shop, { title, bodyHtml, metaDescription, tags, blogId, asDraft });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// For tools that update existing product fields:
router.post('/shopify/apply', async (req, res) => {
  try {
    const { productId, ...fields } = req.body;
    if (!productId) return res.status(400).json({ ok: false, error: 'productId required' });
    const shop = req.headers['x-shopify-shop-domain'] || req.body.shop;
    if (!shop) return res.status(400).json({ ok: false, error: 'No shop domain — add x-shopify-shop-domain header' });
    const { applyProductFields } = require('../../core/shopifyApply');
    const result = await applyProductFields(shop, productId, fields);
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
```

### 2c. Response format

All endpoints return:
```js
{ ok: true, message: "...", ...anyExtraData }   // success
{ ok: false, error: "specific error message" }  // failure
```

Never return a 200 with an error inside it unchecked. Frontend must be able to test `r.ok` reliably.

---

## 3. Frontend: Apply Button Pattern

### 3a. State — what you always need

```jsx
// For tools applying to an existing entity (article/product already selected):
const [applying, setApplying] = useState(false);
const [applyResult, setApplyResult] = useState(null); // null | 'ok' | 'error: message'

// For tools publishing multiple items (e.g. draft list, weekly plan):
const [publishingId, setPublishingId] = useState(null);
const [publishResults, setPublishResults] = useState({}); // { [itemId]: 'ok' | 'error: msg' }
```

### 3b. The Apply function — useCallback with correct deps

**This is the most important rule.** The bug we fixed repeatedly: `useCallback` with a stale `selectedId` closure.

**WRONG — this silently fails:**
```jsx
const applyRewrite = useCallback(async (value, field, idx) => {
  const art = shopifyArticles.find(a => String(a.id) === String(selectedArticleId)); // STALE CLOSURE
  if (!art) return; // SILENT FAILURE — no error, no feedback
  ...
}, [shopifyArticles]); // BUG: selectedArticleId missing from deps
```

**RIGHT — capture IDs at action time, never look them up in a closure:**
```jsx
// Store IDs at scan/select time, NOT inside the callback
const [scannedArticleId, setScannedArticleId] = useState(null);
const [scannedBlogId, setScannedBlogId] = useState(null);

// Set them when the user scans or selects:
const runScan = useCallback(async () => {
  // ... do scan ...
  setScannedArticleId(selectedArticleId);  // capture NOW
  setScannedBlogId(selectedBlogId);
}, [url, kwInput, selectedArticleId, shopifyArticles]);

// Use the captured IDs directly in the callback:
const applyRewrite = useCallback(async (value, field, idx) => {
  const articleId = scannedArticleId;  // from state, never stale
  const blogId = scannedBlogId;
  if (!articleId || !blogId) {
    setApplyResult(p => ({ ...p, [idx]: 'error: No article linked — select your post and rescan' }));
    return; // VISIBLE ERROR, not silent
  }
  setApplyResult(p => ({ ...p, [idx]: 'loading' }));
  try {
    const r = await apiFetchJSON(`${API}/apply-field`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, blogId, field, value }),
    });
    setApplyResult(p => ({ ...p, [idx]: r.ok ? 'ok' : `error: ${r.error}` }));
  } catch (e) {
    setApplyResult(p => ({ ...p, [idx]: `error: ${e.message}` }));
  }
}, [scannedArticleId, scannedBlogId, shopDomain]); // correct deps
```

**Rules for useCallback deps:**
- Every variable read inside the callback must be in the deps array
- IDs and state that change over time must be explicitly included
- Never rely on closure over `useState` values without listing them in deps
- When in doubt: extract what you need into a local `const` at the top of the callback

### 3c. The Apply button — standard render pattern

```jsx
// Single item apply:
<button
  style={{ ...S.btn(applyResult === 'ok' ? undefined : 'primary'), fontSize: 12, padding: '5px 14px' }}
  disabled={applyResult === 'loading'}
  onClick={() => applyToShopify()}
>
  {applyResult === 'loading' ? <><span style={S.spinner} /> Applying…</>
    : applyResult === 'ok' ? '✅ Applied!'
    : '🚀 Apply to Shopify'}
</button>
{typeof applyResult === 'string' && applyResult.startsWith('error:') && (
  <span style={{ fontSize: 11, color: '#f87171' }}>{applyResult.slice(7)}</span>
)}

// When no entity is selected/scanned yet — SHOW A WARNING, not nothing:
{scannedArticleId
  ? <button ...>🚀 Apply to Shopify</button>
  : <span style={{ fontSize: 11, color: '#fbbf24', fontStyle: 'italic' }}>
      ⚠️ Select a post and scan first to enable apply
    </span>}

// Per-item in a list:
<button
  disabled={publishingId === item.id || publishResults[item.id] === 'ok'}
  onClick={() => publishItem(item)}
  style={{
    background: publishResults[item.id] === 'ok' ? '#22c55e' : '#4f46e5',
    color: '#fff', border: 'none', borderRadius: 8,
    padding: '5px 14px', fontWeight: 700, fontSize: 12,
    cursor: publishingId === item.id ? 'not-allowed' : 'pointer',
  }}
>
  {publishingId === item.id ? '⏳ Publishing…'
    : publishResults[item.id] === 'ok' ? '✅ Published'
    : '🚀 Publish to Shopify'}
</button>
{publishResults[item.id]?.startsWith('error:') && (
  <div style={{ fontSize: 11, color: '#f87171' }}>{publishResults[item.id].slice(7)}</div>
)}
```

### 3d. Local state mirror after apply

After a successful apply, mirror the change locally so the UI reflects it immediately without needing a rescan:

```jsx
if (r.ok && field !== 'headings' && field !== 'body_html') {
  // Simple fields: mirror directly
  setScanResult(prev => prev ? { ...prev, [field]: r.handle || value } : prev);
}
// Don't mirror body_html/headings — too complex to reconstruct locally
```

---

## 4. UX States — Required for Every Feature

Every AI action in every tool must handle all five states. No exceptions.

| State | What to show |
|---|---|
| **Loading** | Spinner + "Generating…" or "Applying…" text. Disable the button. |
| **Success** | Green indicator, result displayed, Apply button available |
| **Empty** | "No [items] yet. Click Generate to start." — never a blank panel |
| **Error** | Red text showing the actual error message. Never swallow errors silently. |
| **Disabled** | Clear label explaining why (e.g. "Select a post first"). Amber/grey text. |

```jsx
// Standard pattern:
{loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a5b4fc' }}>
  <span style={S.spinner} /> Generating AI suggestions…
</div>}

{error && <div style={{ color: '#f87171', fontSize: 13, padding: '8px 12px', background: '#1a0a0a', borderRadius: 8 }}>
  {error}
</div>}

{!loading && !error && !result && (
  <div style={{ color: '#52525b', fontSize: 13 }}>
    Click "AI Generate" to get suggestions.
  </div>
)}

{result && (
  // ... show result with Apply button ...
)}
```

---

## 5. AI-First Architecture

Every tool feature must have an AI option. This is non-negotiable product vision.

**Pattern:**
1. Show the current value (from Shopify data if available)
2. Provide an "AI Generate" / "AI Suggest" / "AI Optimise" button
3. Show AI results with Apply button
4. Keep manual edit field alongside — never force AI-only

```jsx
<div style={{ display: 'flex', gap: 8 }}>
  <input
    value={editedTitle}
    onChange={e => setEditedTitle(e.target.value)}
    placeholder="Enter title manually"
    style={{ flex: 1, ...S.input }}
  />
  <button onClick={() => runAISuggestions('title')} disabled={aiLoading}>
    {aiLoading ? '⏳' : '✨ AI Suggest'}
  </button>
  <button onClick={() => applyField('title', editedTitle)} disabled={applying}>
    🚀 Apply
  </button>
</div>
```

**Credit cost display:** Show credit cost before user clicks for any premium AI action.

---

## 6. API Calls — Always Use apiFetch

**Frontend:** Always use `apiFetch` / `apiFetchJSON` from `aura-console/src/api.js`.

```jsx
import { apiFetch, apiFetchJSON } from '../../api';
```

These automatically add:
- `Authorization: Bearer <token>` header
- `x-shopify-shop-domain` header
- Retry logic

**Never** craft raw `fetch()` calls with manual header construction in tool components.

**Backend route registration:** Every new tool router added to `src/server.js` follows:
```js
{ path: '/api/tool-name', router: require('./tools/tool-name/router'), middleware: requireTool('tool-name') }
```

---

## 7. Error Handling Rules

### Never do this:
```js
// WRONG — silent failure
const art = articles.find(a => a.id === selectedId);
if (!art) return;

// WRONG — swallowed error
try { ... } catch (e) {}

// WRONG — no user feedback
if (!r.ok) console.error(r.error);
```

### Always do this:
```js
// RIGHT — visible error to user
const art = articles.find(a => a.id === selectedId);
if (!art) {
  setError('No article found — select an article from the dropdown and try again');
  return;
}

// RIGHT — error shown in UI
try { ... } catch (e) {
  setError(e.message || 'Something went wrong — please try again');
}

// RIGHT — check ok and show error
if (!r.ok) {
  setError(r.error || r.credit_error
    ? `Not enough credits (need ${r.credits_needed})`
    : 'Request failed');
  return;
}
```

---

## 8. Checklist: Adding a New Tool

Use this every time. Don't ship without checking all boxes.

### Backend (`src/tools/<tool-id>/`)

- [ ] `index.js` exports `{ meta: { id, name }, run(input, ctx) }`
- [ ] Registered in `src/core/tools-registry.cjs`
- [ ] Router mounted in `src/server.js` with `requireTool()` middleware
- [ ] Every AI endpoint uses `getOpenAIClient()` and handles `!openai` case
- [ ] Every AI endpoint uses `requireCreditsOnMutation()` or `req.deductCredits()`
- [ ] `POST /shopify/publish` or `POST /shopify/apply` endpoint added (if tool generates Shopify content)
- [ ] All endpoints return `{ ok: true/false, ... }` shape
- [ ] Error responses include descriptive `error` string

### Frontend (`aura-console/src/components/tools/<ToolName>.jsx`)

- [ ] Lazy imported in `App.jsx` with `React.lazy()`
- [ ] Added to `aura-console/src/toolMeta.js` catalog
- [ ] Plan gate added in `aura-console/src/hooks/usePlan.js` `TOOL_PLAN` map
- [ ] Uses `apiFetchJSON` from `../../api` — no raw fetch
- [ ] All `useCallback`/`useMemo` have **correct dep arrays** (every variable read is listed)
- [ ] IDs captured at action time (not relied on via stale closure)
- [ ] All 5 UX states handled: loading / success / empty / error / disabled
- [ ] Every AI output has an Apply/Publish button (not just Copy)
- [ ] Apply button shows warning state when preconditions not met (not hidden/disabled silently)
- [ ] Error messages shown inline near the action that failed
- [ ] Dark theme: `#09090b` background, `#18181b` cards, `#3f3f46` borders, `#fafafa` text
- [ ] No light backgrounds (`#fff`, `#f5f5f5`) anywhere

### Test (`src/__tests__/<tool-id>.test.js`)

- [ ] Happy path test for main AI endpoint
- [ ] 400 test for missing required fields
- [ ] 500 test mocking OpenAI failure
- [ ] Shopify publish/apply endpoint tested with mock token

---

## 9. Checklist: Modifying an Existing Tool

Before touching any existing tool:

1. **Read the current code first.** Understand what state vars exist, what `useCallback` deps are, what API paths are used.
2. **Check for stale closure risk.** Any `useCallback` that reads `selectedId`, `shopifyArticles`, or similar mutable state and has missing deps is a bug waiting to happen.
3. **Check the response shape.** Does the existing endpoint return `{ ok: true/false }`? If it returns something different, handle it explicitly.
4. **Don't rename existing endpoints.** Adding new endpoints is fine. Renaming breaks existing integrations.
5. **Test the Apply flow end-to-end** after any change — not just that the button renders, but that it actually writes to Shopify.

---

## 10. Shopify Admin API Notes

- API version: `process.env.SHOPIFY_API_VERSION || '2023-10'` — use the env var, don't hardcode
- Token: `shopTokens.getToken(shop)` — synchronous, returns `null` if not found
- Shop domain: from `req.headers['x-shopify-shop-domain']` (preferred) or `req.body.shop`
- All API calls: include `'X-Shopify-Access-Token': token` header
- Article endpoints: require `blogId` — always fetch it if not provided: `GET /admin/api/ver/blogs.json?limit=1`
- Product metafields (SEO title/description): `POST /products/:id/metafields.json` with `namespace: 'global'`, keys `title_tag` and `description_tag`
- Handle sanitisation: `value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')`

---

## 11. What Was Fixed / Why This Standard Exists

These are the bugs we kept hitting. This standard prevents them.

| Bug | Root cause | Fix |
|---|---|---|
| Apply button does nothing | `useCallback` stale closure on `selectedArticleId` | Capture IDs at scan time into dedicated state vars |
| No feedback on failure | `if (!art) return` — silent | Always set error state, never silent return |
| H2 suggestions Copy-only | Assumed body_html patching was risky | It's fine — GET body, replace `<h2>` tags, PUT back |
| Schema only Copy-only | No Shopify apply endpoint | Added `applySchemaToEntity()` in shared module |
| ProductSEO AI output not pushable | No `/shopify/apply` endpoint | Added endpoint using shared `applyProductFields()` |
| BlogDraftEngine drafts not publishable | No `/shopify/publish` endpoint | Added endpoint using shared `publishArticle()` |
| Duplicate Shopify API code | Each tool implemented its own fetch logic | All writes through `src/core/shopifyApply.js` |
| Apply button shown when it can't work | Button gated on `selectedArticleId` which could be stale | Gated on `scannedArticleId` which is set at scan time |

---

## 12. Standard File Structure for a Tool

```
src/tools/<tool-id>/
  index.js              # meta + run() — registered in tools-registry.cjs
  router.js             # Express router — all endpoints including /shopify/publish or /shopify/apply
  model.js              # (if needed) data access layer
  *.engine.js           # supporting business logic modules

aura-console/src/components/tools/
  <ToolName>.jsx        # single-file component, inline styles, dark theme

src/__tests__/
  <tool-id>.test.js     # Jest + supertest
```

---

*Last updated: February 2026. Update this document whenever a new pattern is established or a new class of bug is fixed.*
