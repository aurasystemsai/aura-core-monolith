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

## 2. UI Architecture — Complete Pattern for Every Tool

This entire section defines exactly how every tool UI must be built. Follow it without deviation.

---

### 2a. The `S` Styles Object — Standard Design Tokens

Every tool component defines a single `const S = { ... }` object at the top of the file (outside the component).  
**Never** use separate CSS files, CSS modules, Tailwind classes, or scattered inline style objects throughout JSX.  
All styles live in `S`. Reference them as `S.card`, `S.btn('primary')`, etc.

```jsx
/* -- Dark-theme inline styles -------------------------------------------- */
const S = {
  // Page shell
  page: {
    minHeight: '100vh',
    background: '#09090b',
    color: '#fafafa',
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    padding: '0 0 64px',
  },
  topBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '18px 32px 0', flexWrap: 'wrap',
  },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' },
  badge: {
    fontSize: 11, fontWeight: 600, padding: '3px 10px',
    borderRadius: 999, background: '#4f46e5', color: '#fff', marginLeft: 8,
  },
  body: { maxWidth: 1100, margin: '0 auto', padding: '0 24px' },

  // Navigation
  tabs: {
    display: 'flex', gap: 6, padding: '18px 0 12px',
    borderBottom: '1px solid #27272a', flexWrap: 'wrap',
  },
  tab: (active) => ({
    padding: '7px 18px', borderRadius: 8, fontSize: 13,
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    background: active ? '#4f46e5' : '#18181b',
    color: active ? '#fff' : '#a1a1aa',
    border: active ? '1px solid #4f46e5' : '1px solid #27272a',
    transition: 'all .15s',
  }),

  // Cards
  card: {
    background: '#18181b', border: '1px solid #27272a',
    borderRadius: 12, padding: 20, marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15, fontWeight: 700, marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  cardDesc: { fontSize: 12, color: '#71717a', marginBottom: 10, marginTop: -6, lineHeight: 1.5 },

  // Layout helpers
  row: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  section: { marginBottom: 20 },
  heading: {
    fontSize: 13, fontWeight: 700, color: '#a1a1aa',
    textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10,
  },

  // Form elements
  input: {
    flex: 1, minWidth: 220, padding: '10px 14px', borderRadius: 8,
    border: '1px solid #3f3f46', background: '#09090b', color: '#fafafa',
    fontSize: 14, outline: 'none',
  },
  textarea: {
    width: '100%', minHeight: 90, padding: '10px 14px', borderRadius: 8,
    border: '1px solid #3f3f46', background: '#09090b', color: '#fafafa',
    fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
  },
  select: {
    padding: '9px 12px', borderRadius: 8, border: '1px solid #3f3f46',
    background: '#09090b', color: '#fafafa', fontSize: 13, outline: 'none',
  },

  // Buttons — call S.btn('primary') / S.btn('danger') / S.btn('success') / S.btn()
  btn: (variant) => ({
    padding: '9px 20px', borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .15s',
    ...(variant === 'primary'
      ? { background: '#4f46e5', color: '#fff' }
      : variant === 'danger'
      ? { background: '#7f1d1d', color: '#fca5a5' }
      : variant === 'success'
      ? { background: '#14532d', color: '#86efac' }
      : { background: '#27272a', color: '#d4d4d8' }),
  }),

  // Feedback
  spinner: {
    display: 'inline-block', width: 18, height: 18,
    border: '2px solid #3f3f46', borderTop: '2px solid #4f46e5',
    borderRadius: '50%', animation: 'spin .7s linear infinite',
  },
  err: {
    background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10,
    padding: '14px 18px', color: '#fca5a5', fontSize: 13, marginBottom: 12,
  },
  result: {
    background: '#18181b', border: '1px solid #27272a',
    borderRadius: 8, padding: '10px 14px', marginTop: 8,
  },
  empty: { textAlign: 'center', padding: '48px 20px', color: '#71717a' },

  // Score / grading display
  scoreRing: (score) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 64, height: 64, borderRadius: '50%', fontSize: 22, fontWeight: 800,
    border: `3px solid ${score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'}`,
    color: score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444',
  }),
  grade: (g) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 38, height: 38, borderRadius: 8, fontSize: 18, fontWeight: 800, marginLeft: 12,
    background: g === 'A' ? '#14532d' : g === 'B' ? '#422006' : g === 'C' ? '#713f12' : '#7f1d1d',
    color:      g === 'A' ? '#86efac' : g === 'B' ? '#fbbf24' : g === 'C' ? '#fbbf24' : '#fca5a5',
  }),
  pill: (severity) => ({
    display: 'inline-block', fontSize: 11, fontWeight: 700,
    padding: '2px 10px', borderRadius: 999, marginRight: 6,
    background: severity === 'high' ? '#7f1d1d' : severity === 'medium' ? '#713f12' : '#1e3a5f',
    color:      severity === 'high' ? '#fca5a5' : severity === 'medium' ? '#fbbf24' : '#93c5fd',
  }),
  catCard: (score) => ({
    flex: '1 1 140px', background: '#09090b', border: '1px solid #27272a',
    borderRadius: 10, padding: '12px 16px', textAlign: 'center',
    borderTop: `3px solid ${score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'}`,
  }),

  // Tables
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #27272a',
    color: '#71717a', fontWeight: 600, fontSize: 11, textTransform: 'uppercase',
  },
  td: { padding: '8px 10px', borderBottom: '1px solid #1e1e22', color: '#d4d4d8' },

  // Chat / AI output
  chatBubble: (isUser) => ({
    maxWidth: '82%', padding: '10px 16px', borderRadius: 14, fontSize: 14,
    lineHeight: 1.55, whiteSpace: 'pre-wrap',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    background: isUser ? '#4f46e5' : '#27272a', color: '#fafafa', marginBottom: 8,
  }),

  // Code blocks
  fixCode: {
    background: '#09090b', border: '1px solid #27272a', borderRadius: 8,
    padding: 12, fontSize: 12, fontFamily: "'Fira Code',monospace",
    color: '#86efac', whiteSpace: 'pre-wrap', overflowX: 'auto', maxHeight: 220,
  },

  // Misc
  link: { color: '#818cf8', textDecoration: 'none', cursor: 'pointer', fontSize: 13 },
  metaRow:   { display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 10 },
  metaLabel: { fontSize: 12, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' },
  metaVal:   { fontSize: 14, color: '#d4d4d8', marginTop: 2 },

  // Sidebar layout (for tools with a navigation sidebar)
  layout:      { display: 'flex', alignItems: 'flex-start', minHeight: 'calc(100vh - 72px)' },
  sidebar:     { width: 220, flexShrink: 0, borderRight: '1px solid #18181b', paddingTop: 12, paddingBottom: 32, position: 'sticky', top: 0, maxHeight: '100vh', overflowY: 'auto' },
  sidebarItem: (active) => ({
    padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
    fontWeight: active ? 600 : 400, background: active ? '#1e1b4b' : 'transparent',
    color: active ? '#c4b5fd' : '#a1a1aa',
    borderLeft: active ? '3px solid #818cf8' : '3px solid transparent',
    marginBottom: 2, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 10,
  }),
  mainContent: { flex: 1, minWidth: 0, padding: '0 28px 64px', maxWidth: 1000 },
};
```

**Required** global CSS (include once somewhere, e.g. `index.css` or injected via `<style>` in the component):
```css
@keyframes spin { to { transform: rotate(360deg); } }
```

---

### 2b. Standard Page Shell

Every tool renders exactly this outer structure:

```jsx
export default function MyTool() {
  return (
    <div style={S.page}>
      {/* 1. Top bar with back button + title */}
      <div style={S.topBar}>
        <BackButton />
        <span style={S.title}>🔧 Tool Name</span>
        <span style={S.badge}>PLAN</span>
      </div>

      {/* 2. Constrained body */}
      <div style={S.body}>

        {/* 3. Tab row (if multi-tab) */}
        <div style={S.tabs}>
          {['Tab A', 'Tab B', 'Tab C'].map(t => (
            <button key={t} style={S.tab(activeTab === t)} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {/* 4. Tab panels */}
        {activeTab === 'Tab A' && <TabA />}
        {activeTab === 'Tab B' && <TabB />}
      </div>

      {/* 5. Toast (if used) — rendered last so it floats above everything */}
      {errToast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12,
          padding: '12px 24px', color: '#fca5a5', fontSize: 13,
          boxShadow: '0 8px 24px #000a', zIndex: 999, whiteSpace: 'nowrap',
        }}>
          {errToast}
        </div>
      )}
    </div>
  );
}
```

---

### 2c. Toast Notification Pattern

Use a toast for any error that doesn't belong inline (global errors, network failures, permission issues).

```jsx
const [errToast, setErrToast]   = useState(null);
const toastTimerRef             = useRef(null);

const showToast = useCallback((msg) => {
  setErrToast(msg);
  if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  toastTimerRef.current = setTimeout(() => setErrToast(null), 4500);
}, []);
```

Call `showToast('Something went wrong')` anywhere in your callbacks.  
Render the toast at the bottom of the return JSX (see shell above).

---

### 2d. Simple / Expert Mode Toggle

For tools with beginner and advanced workflows, always provide a mode toggle:

```jsx
const [expertMode, setExpertMode] = useState(false);

// In top bar:
<button
  style={{ ...S.btn(expertMode ? 'primary' : undefined), fontSize: 12, padding: '5px 14px' }}
  onClick={() => setExpertMode(e => !e)}
>
  {expertMode ? '⚡ Expert Mode ON' : '⚡ Expert Mode'}
</button>

// Hide/show sections by mode:
{/* Always visible: */}
<div style={S.card}>...</div>

{/* Expert only: */}
{expertMode && (
  <div style={S.card}>
    <div style={S.cardTitle}>🔬 Advanced Settings</div>
    ...
  </div>
)}
```

**Rule:** Every tool should have at least one "beginner" workflow that is immediately usable without configuration. Expert mode unlocks more controls, not required functionality.

---

### 2e. Standard Card Structure

```jsx
<div style={S.card}>
  {/* Title — always has an icon */}
  <div style={S.cardTitle}>
    📝 Card Title
    <span style={{ fontSize: 11, color: '#71717a', fontWeight: 400 }}>optional subtitle</span>
  </div>

  {/* Description — only if not self-explanatory */}
  <div style={S.cardDesc}>Brief explanation of what this card does.</div>

  {/* Content */}
  <div style={S.row}>
    <input style={S.input} placeholder="Enter value…" value={val} onChange={e => setVal(e.target.value)} />
    <button style={S.btn('primary')} onClick={handleAction}>✨ AI Generate</button>
  </div>

  {/* Loading */}
  {loading && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a5b4fc', marginTop: 12 }}>
      <span style={S.spinner} /> Generating…
    </div>
  )}

  {/* Error */}
  {error && <div style={S.err}>{error}</div>}

  {/* Empty */}
  {!loading && !error && !result && (
    <div style={{ ...S.empty, padding: '24px 0' }}>Click Generate to get AI suggestions.</div>
  )}

  {/* Result */}
  {result && (
    <div style={S.result}>
      {/* ... display result ... */}
      <button style={{ ...S.btn('primary'), fontSize: 12, marginTop: 10 }} onClick={applyToShopify}>
        🚀 Apply to Shopify
      </button>
    </div>
  )}
</div>
```

---

### 2f. Table Pattern

```jsx
<table style={S.table}>
  <thead>
    <tr>
      <th style={S.th}>Column A</th>
      <th style={S.th}>Column B</th>
      <th style={S.th}>Actions</th>
    </tr>
  </thead>
  <tbody>
    {items.map(item => (
      <tr key={item.id}>
        <td style={S.td}>{item.name}</td>
        <td style={S.td}>
          <span style={S.pill(item.severity)}>{item.severity}</span>
        </td>
        <td style={S.td}>
          <button style={{ ...S.btn('primary'), padding: '4px 12px', fontSize: 11 }}>
            Apply
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

### 2g. Score Display Pattern

For tools that generate a numeric score (0–100):

```jsx
{/* Score ring + letter grade side by side */}
<div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
  <div style={S.scoreRing(score)}>{score}</div>
  <div style={S.grade(score >= 75 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D')}>
    {score >= 75 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D'}
  </div>
  <div>
    <div style={{ fontWeight: 700 }}>Overall SEO Score</div>
    <div style={{ fontSize: 12, color: '#71717a' }}>
      {score >= 75 ? 'Good' : score >= 50 ? 'Needs work' : 'Poor'}
    </div>
  </div>
</div>

{/* Category breakdown row */}
<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
  {categories.map(cat => (
    <div key={cat.label} style={S.catCard(cat.score)}>
      <div style={{ fontSize: 26, fontWeight: 800, color: cat.score >= 75 ? '#22c55e' : cat.score >= 50 ? '#eab308' : '#ef4444' }}>
        {cat.score}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', marginTop: 2 }}>
        {cat.label}
      </div>
    </div>
  ))}
</div>
```

---

### 2h. Sidebar Layout Pattern

For complex multi-section tools that need a persistent left navigation:

```jsx
<div style={S.layout}>
  {/* Left sidebar */}
  <nav style={S.sidebar}>
    <div style={{ fontSize: 10, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: 1, padding: '14px 14px 4px' }}>
      SECTIONS
    </div>
    {SECTIONS.map(s => (
      <div
        key={s.id}
        style={S.sidebarItem(activeSection === s.id)}
        onClick={() => setActiveSection(s.id)}
      >
        <span>{s.icon}</span> {s.title}
      </div>
    ))}
  </nav>

  {/* Main content */}
  <main style={S.mainContent}>
    {/* render active section */}
  </main>
</div>
```

---

### 2i. AI Output + Apply Panel Pattern

Every section that has AI output must follow this exact structure:

```jsx
{/* AI action row */}
<div style={S.row}>
  <input style={S.input} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic or URL…" />
  <button style={S.btn('primary')} onClick={runAI} disabled={aiLoading}>
    {aiLoading ? <><span style={S.spinner} /> Generating…</> : '✨ AI Generate'}
  </button>
</div>

{/* AI output block */}
{aiResult && (
  <div style={{ ...S.result, marginTop: 12 }}>
    {/* Editable output so user can tweak before applying */}
    <textarea
      style={{ ...S.textarea, minHeight: 60 }}
      value={editedResult}
      onChange={e => setEditedResult(e.target.value)}
    />

    {/* Action row: Copy always available, Apply is primary */}
    <div style={{ ...S.row, marginTop: 8 }}>
      <button
        style={{ ...S.btn('primary'), fontSize: 12, padding: '5px 14px' }}
        disabled={applying}
        onClick={applyToShopify}
      >
        {applying
          ? <><span style={S.spinner} /> Applying…</>
          : applyResult === 'ok'
          ? '✅ Applied!'
          : '🚀 Apply to Shopify'}
      </button>

      <button
        style={{ ...S.btn(), fontSize: 12, padding: '5px 14px' }}
        onClick={() => navigator.clipboard.writeText(editedResult)}
      >
        📋 Copy
      </button>

      {/* Credits notice */}
      <span style={{ fontSize: 11, color: '#52525b', marginLeft: 'auto' }}>
        ✦ 2 credits
      </span>
    </div>

    {/* Inline error — only shown on failure */}
    {typeof applyResult === 'string' && applyResult.startsWith('error:') && (
      <div style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>{applyResult.slice(7)}</div>
    )}

    {/* Warning when apply preconditions aren't met */}
    {!scannedArticleId && (
      <div style={{ fontSize: 11, color: '#fbbf24', fontStyle: 'italic', marginTop: 6 }}>
        ⚠️ Select a post and scan first to enable Apply
      </div>
    )}
  </div>
)}
```

---

### 2j. List / Draft Row Pattern

For tools that manage a list of generated items (drafts, posts, campaigns, etc.):

```jsx
{items.map(item => (
  <div key={item.id} style={{ ...S.card, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
    {/* Item content */}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
      <div style={{ fontSize: 12, color: '#71717a', marginBottom: 6 }}>{item.description}</div>
      {/* Tags */}
      {item.tags?.map(tag => (
        <span key={tag} style={{ ...S.pill('low'), marginBottom: 4 }}>{tag}</span>
      ))}
    </div>

    {/* Action column */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
      <button
        style={{
          ...S.btn(publishResults[item.id] === 'ok' ? 'success' : 'primary'),
          fontSize: 12, padding: '5px 14px',
        }}
        disabled={publishingId === item.id || publishResults[item.id] === 'ok'}
        onClick={() => publishItem(item)}
      >
        {publishingId === item.id
          ? <><span style={S.spinner} /> Publishing…</>
          : publishResults[item.id] === 'ok'
          ? '✅ Published'
          : '🚀 Publish to Shopify'}
      </button>
      <button style={{ ...S.btn(), fontSize: 11, padding: '4px 10px' }} onClick={() => navigator.clipboard.writeText(item.content)}>
        📋 Copy
      </button>
    </div>

    {/* Inline publish error */}
    {publishResults[item.id]?.startsWith('error:') && (
      <div style={{ fontSize: 11, color: '#f87171', width: '100%', marginTop: 4 }}>
        {publishResults[item.id].slice(7)}
      </div>
    )}
  </div>
))}
```

---

### 2k. Credits Notice — Show Before Any Paid AI Action

```jsx
{/* Before the button, show cost prominently */}
<div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 8 }}>
  This action costs <strong style={{ color: '#fbbf24' }}>2 credits</strong>
  {' '}(you have <strong>{credits}</strong> remaining)
</div>
<button style={S.btn('primary')} disabled={credits < 2} onClick={runAI}>
  ✨ AI Generate
</button>
{credits < 2 && (
  <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>
    Not enough credits. <a href="#" style={S.link}>Buy more →</a>
  </div>
)}
```

---

### 2l. Standard Imports for Every Tool Component

```jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { apiFetch, apiFetchJSON } from '../../api';
import BackButton from './BackButton';

const API = '/api/<tool-id>';
```

Always import `BackButton` — every tool screen has a back button to return to the main menu.

---

## 3. Backend: Shopify Write Endpoints

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

### 3b. Every content tool must have a Shopify write endpoint

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

### 3c. Response format

All endpoints return:
```js
{ ok: true, message: "...", ...anyExtraData }   // success
{ ok: false, error: "specific error message" }  // failure
```

Never return a 200 with an error inside it unchecked. Frontend must be able to test `r.ok` reliably.

---

## 4. Frontend: Apply Button Pattern

### 4a. State — what you always need

```jsx
// For tools applying to an existing entity (article/product already selected):
const [applying, setApplying] = useState(false);
const [applyResult, setApplyResult] = useState(null); // null | 'ok' | 'error: message'

// For tools publishing multiple items (e.g. draft list, weekly plan):
const [publishingId, setPublishingId] = useState(null);
const [publishResults, setPublishResults] = useState({}); // { [itemId]: 'ok' | 'error: msg' }
```

### 4b. The Apply function — useCallback with correct deps

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

### 4c. The Apply button — standard render pattern

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

### 4d. Local state mirror after apply

After a successful apply, mirror the change locally so the UI reflects it **immediately** — without needing a rescan.

**Scalar fields (title, metaDescription, handle, h1):**
```jsx
setScanResult(prev => prev ? { ...prev, [field]: r.handle || value } : prev);
// Auto-dismiss the matching issue card
setScanResult(prev => {
  if (!prev?.scored?.issues) return prev;
  const updatedIssues = prev.scored.issues.filter(i => !isIssueForField(field, i.msg));
  return { ...prev, scored: { ...prev.scored, issues: updatedIssues } };
});
```

**Headings / body_html fields:**
```jsx
// Parse applied H2s back into heading objects
const newH2s = value.split(/\s*\|\s*/).filter(Boolean).map(t => ({ tag: 'H2', text: t.trim() }));
setScanResult(prev => {
  if (!prev) return prev;
  const existing = (prev.headings || []).filter(h => h.tag !== 'H2');
  const updatedIssues = (prev.scored?.issues || []).filter(i => !isIssueForField('headings', i.msg));
  return {
    ...prev,
    headings: [...existing, ...newH2s],
    scored: prev.scored ? { ...prev.scored, issues: updatedIssues } : prev.scored,
  };
});
```

**Issue-to-field matcher helper** — add this inside the component before your issue card renderer:
```jsx
// Maps a rewrite field name to whether a given issue message belongs to it.
// Used to auto-dismiss issue cards after a successful apply.
const isIssueForField = (field, msg) => {
  const m = (msg || '').toLowerCase();
  if (field === 'headings') return (m.includes('h2') || m.includes('subheading') || m.includes('subhead')) &&
                                    (m.includes('no ') || m.includes('missing') || m.includes('lack') || m.includes('needs') || m.includes('structure') || m.includes('clear'));
  if (field === 'handle')  return m.includes('keyword') && (m.includes('url') || m.includes('slug') || m.includes('handle'));
  if (field === 'title')   return m.includes('title') && (m.includes('missing') || m.includes('short') || m.includes('long') || m.includes('keyword'));
  if (field === 'metaDescription') return m.includes('meta desc') || (m.includes('meta') && m.includes('description'));
  if (field === 'h1')      return m.includes('h1') && (m.includes('missing') || m.includes('no h1') || m.includes('keyword') || m.includes('multiple'));
  return false;
};
```

**Track fixed fields** — add this state and reset it on every new scan:
```jsx
const [fixedFields, setFixedFields] = useState(new Set());

// In your scan reset:
setFixedFields(new Set()); setApplyResult({});

// After successful apply:
setFixedFields(prev => new Set([...prev, field]));
```

**Rule:** Issue cards must disappear the moment a fix is applied. Never require a rescan to see the result of an action the user just took.

---

## 5. UX States — Required for Every Feature

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

## 6. AI-First Architecture

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

## 7. API Calls — Always Use apiFetch

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

## 8. Error Handling Rules

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

## 9. Checklist: Adding a New Tool

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

## 10. Checklist: Modifying an Existing Tool

Before touching any existing tool:

1. **Read the current code first.** Understand what state vars exist, what `useCallback` deps are, what API paths are used.
2. **Check for stale closure risk.** Any `useCallback` that reads `selectedId`, `shopifyArticles`, or similar mutable state and has missing deps is a bug waiting to happen.
3. **Check the response shape.** Does the existing endpoint return `{ ok: true/false }`? If it returns something different, handle it explicitly.
4. **Don't rename existing endpoints.** Adding new endpoints is fine. Renaming breaks existing integrations.
5. **Test the Apply flow end-to-end** after any change — not just that the button renders, but that it actually writes to Shopify.

---

## 11. Shopify Admin API Notes

- API version: `process.env.SHOPIFY_API_VERSION || '2023-10'` — use the env var, don't hardcode
- Token: `shopTokens.getToken(shop)` — synchronous, returns `null` if not found
- Shop domain: from `req.headers['x-shopify-shop-domain']` (preferred) or `req.body.shop`
- All API calls: include `'X-Shopify-Access-Token': token` header
- Article endpoints: require `blogId` — always fetch it if not provided: `GET /admin/api/ver/blogs.json?limit=1`
- Product metafields (SEO title/description): `POST /products/:id/metafields.json` with `namespace: 'global'`, keys `title_tag` and `description_tag`
- Handle sanitisation: `value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')`

---

## 12. What Was Fixed / Why This Standard Exists

These are the bugs we kept hitting. This standard prevents them.

| Bug | Root cause | Fix |
|---|---|---|
| Apply button does nothing | `useCallback` stale closure on `selectedArticleId` | Capture IDs at scan time into dedicated state vars |
| No feedback on failure | `if (!art) return` — silent | Always set error state, never silent return |
| Issue cards stay showing after fix | `scanResult.scored.issues` never updated after apply | Strip matching issues from `scanResult.scored.issues` in the apply callback; mirror headings back into `scanResult.headings` |
| H2 suggestions Copy-only | Assumed body_html patching was risky | It's fine — GET body, replace `<h2>` tags, PUT back |
| Schema only Copy-only | No Shopify apply endpoint | Added `applySchemaToEntity()` in shared module |
| ProductSEO AI output not pushable | No `/shopify/apply` endpoint | Added endpoint using shared `applyProductFields()` |
| BlogDraftEngine drafts not publishable | No `/shopify/publish` endpoint | Added endpoint using shared `publishArticle()` |
| Duplicate Shopify API code | Each tool implemented its own fetch logic | All writes through `src/core/shopifyApply.js` |
| Apply button shown when it can't work | Button gated on `selectedArticleId` which could be stale | Gated on `scannedArticleId` which is set at scan time |

---

## 13. Standard File Structure for a Tool

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
