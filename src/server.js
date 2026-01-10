

// ...existing code...

// ...existing code...

// ...existing code...

// ...existing code...
// ...existing code...

// --- Stub endpoint for /api/analytics (prevents 404 in frontend) ---
app.post('/api/analytics', (req, res) => {
  res.json({ ok: true, message: 'Analytics event received (stub).' });
});

// --- Stub endpoint for /api/csrf-token (prevents 401 in frontend) ---
app.get('/api/csrf-token', (req, res) => {
  res.json({ ok: true, token: 'stub-csrf-token' });
});


// --- WebSocket stub will be attached to the main server instance at startup ---
let wss;

// Replace app.listen with server.listen at the end of the file:
// server.listen(PORT, ...)
// --- All requires and initializations at the top ---
const path = require('path');
const morgan = require('morgan');
const compression = require('compression');
let uuidv4;
try {
  // Prefer CJS require for Jest compatibility
  uuidv4 = require('uuid').v4;
} catch (e) {
  // Fallback for ESM environments
  uuidv4 = (...args) => '';
}
const stoppable = require('stoppable');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs');
const productSeoRouter = require('./tools/product-seo/router');
const verifyShopifySession = require('./middleware/verifyShopifySession');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// const lusca = require('lusca');
const PORT = process.env.PORT || 10000;
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session Middleware (legacy, not used for embedded Shopify app) ---

const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
app.use(session({
  store: new SQLiteStore({
    db: 'aura-core-session.sqlite',
    dir: path.join(__dirname, '../data'),
    concurrentDB: true
  }),
  secret: process.env.SESSION_SECRET || 'aura-core-monolith-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Required for Shopify embedded apps (HTTPS)
    httpOnly: true,
    sameSite: 'lax', // Shopify recommends 'lax' for embedded apps
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));



// --- Shopify session token verification for all /api routes ---
app.use('/api', verifyShopifySession);

// --- Register all tool routers (auto-generated, advanced features) ---
const toolRouters = [
  { path: '/api/product-seo', router: require('./tools/product-seo/router') },
  { path: '/api/ai-alt-text-engine', router: require('./tools/ai-alt-text-engine/router') },
  { path: '/api/advanced-analytics-attribution', router: require('./tools/advanced-analytics-attribution/router') },
  { path: '/api/creative-automation-engine', router: require('./tools/creative-automation-engine/router') },
  { path: '/api/weekly-blog-content-engine', router: require('./tools/weekly-blog-content-engine/router') },
  { path: '/api/workflow-orchestrator', router: require('./tools/workflow-orchestrator/router') },
  { path: '/api/technical-seo-auditor', router: require('./tools/technical-seo-auditor/router') },
  { path: '/api/schema-rich-results-engine', router: require('./tools/schema-rich-results-engine/router') },
  { path: '/api/social-scheduler-content-engine', router: require('./tools/social-scheduler-content-engine/router') },
  { path: '/api/review-ugc-engine', router: require('./tools/review-ugc-engine/router') },
  { path: '/api/rank-visibility-tracker', router: require('./tools/rank-visibility-tracker/router') },
  { path: '/api/on-page-seo-engine', router: require('./tools/on-page-seo-engine/router') },
  { path: '/api/ltv-churn-predictor', router: require('./tools/ltv-churn-predictor/router') },
  { path: '/api/klaviyo-flow-automation', router: require('./tools/klaviyo-flow-automation/router') },
  { path: '/api/internal-link-optimizer', router: require('./tools/internal-link-optimizer/router') },
  { path: '/api/multi-channel-optimizer', router: require('./tools/multi-channel-optimizer/router') },
  { path: '/api/inbox-assistant', router: require('./tools/inbox-assistant/router') },
  { path: '/api/inbox-reply-assistant', router: require('./tools/inbox-reply-assistant/router') },
  { path: '/api/inventory-supplier-sync', router: require('./tools/inventory-supplier-sync/router') },
  { path: '/api/image-alt-media-seo', router: require('./tools/image-alt-media-seo/router') },
  { path: '/api/email-automation-builder', router: require('./tools/email-automation-builder/router') },
  { path: '/api/daily-cfo-pack', router: require('./tools/daily-cfo-pack/router') },
  { path: '/api/dynamic-pricing-engine', router: require('./tools/dynamic-pricing-engine/router') },
  { path: '/api/customer-support-ai', router: require('./tools/customer-support-ai/router') },
  { path: '/api/finance-autopilot', router: require('./tools/finance-autopilot/router') },
  { path: '/api/auto-insights', router: require('./tools/auto-insights/router') },
  { path: '/api/ai-support-assistant', router: require('./tools/ai-support-assistant/router') },
  { path: '/api/ai-launch-planner', router: require('./tools/ai-launch-planner/router') },
  { path: '/api/aura-api-sdk', router: require('./tools/aura-api-sdk/router') },
  { path: '/api/aura-operations-ai', router: require('./tools/aura-operations-ai/router') },
  { path: '/api/brand-intelligence-layer', router: require('./tools/brand-intelligence-layer/router') },
  { path: '/api/blog-draft-engine', router: require('./tools/blog-draft-engine/router') },
  { path: '/api/blog-seo', router: require('./tools/blog-seo/router') },
  { path: '/api/content-health-auditor', router: require('./tools/content-health-auditor/router') },
];
toolRouters.forEach(({ path, router }) => {
  try {
    console.log(`[Router Registration] ${path}:`, typeof router, Array.isArray(router), router && router.stack ? 'Express Router' : typeof router);
    app.use(path, router);
  } catch (err) {
    console.error(`Error registering router for path ${path}:`, {
      type: typeof router,
      isArray: Array.isArray(router),
      hasStack: router && router.stack,
      value: router
    });
    console.error('Stack trace:', err);
    throw err;
  }
});

// --- Product SEO Engine: Shopify Products Fetch Endpoint ---
// GET /api/product-seo/shopify-products?limit=50
app.get('/api/product-seo/shopify-products', async (req, res) => {
  try {
    // Try to get shop domain and token from DB, env, or session
    // Priority: session > env > fail
    let shop = req.session && req.session.shop;
    let token = req.session && req.session.shopifyToken;
    console.log('[Product SEO] Session values:', {
      sessionId: req.sessionID,
      shop,
      token: token ? token.slice(0, 6) + '...' : undefined,
      cookies: req.headers.cookie
    });
    if (!shop) shop = process.env.SHOPIFY_SHOP_DOMAIN;
    if (!token) token = process.env.SHOPIFY_ADMIN_TOKEN;
    console.log('[Product SEO] /api/product-seo/shopify-products called', { shop, token: token ? token.slice(0, 6) + '...' : undefined });
    if (!shop || !token) {
      console.warn('[Product SEO] Missing shop domain or admin token', { shop, token });
      return res.status(400).json({ ok: false, error: 'Missing shop domain or admin token. Please connect your Shopify store and provide an Admin API token.' });
    }
    const apiVersion = '2023-10';
    const limit = Math.max(1, Math.min(250, parseInt(req.query.limit) || 50));
    const url = `https://${shop}/admin/api/${apiVersion}/products.json?limit=${limit}`;
    const fetch = global.fetch || require('node-fetch');
    const shopRes = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (!shopRes.ok) {
      const text = await shopRes.text();
      console.warn('[Product SEO] Shopify API error', { status: shopRes.status, text });
      return res.status(shopRes.status).json({ ok: false, error: `Shopify API error: ${text}` });
    }
    const data = await shopRes.json();
    // Return only essential product fields for UI
    const products = (data.products || []).map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      status: p.status,
      vendor: p.vendor,
      image: p.image && p.image.src,
      created_at: p.created_at,
      updated_at: p.updated_at,
      tags: p.tags,
      variants: (p.variants || []).map(v => ({ id: v.id, title: v.title, sku: v.sku, price: v.price })),
    }));
    console.log(`[Product SEO] Shopify products returned: ${products.length}`);
    res.json({ ok: true, products });
  } catch (err) {
    console.error('[Product SEO] Shopify products fetch error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Failed to fetch products' });
  }
});

// --- AI Chatbot API (OpenAI-powered, v4 SDK) ---
app.post('/api/ai/chatbot', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ ok: false, error: 'No messages provided' });
    }
    // Only allow user/assistant/system roles
    const filtered = messages.filter(m => ['user','assistant','system'].includes(m.role));
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: filtered,
      max_tokens: 512,
      temperature: 0.7
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, reply });
  } catch (err) {
    console.error('[AI Chatbot] Error:', err);
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});


// --- Register custom morgan token for request ID ---
morgan.token('id', function getId(req) {
  return req.id || '-';
});

// --- Route and Worker Requires ---
const draftsRoutes = require('./routes/drafts');
const fixQueueRoutes = require('./routes/fix-queue');
const makeRoutes = require('./routes/make');
const automationRoutes = require('./routes/automation');
const { startFixQueueWorker } = require('./core/fixQueueWorker');

// --- Request ID and Tracing Middleware ---
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});
// --- Advanced Logging (morgan) ---
app.use(morgan(':date[iso] :remote-addr :method :url :status :res[content-length] - :response-time ms :req[header] :id', {
  stream: {
    write: (msg) => {
      if (process.env.NODE_ENV !== 'test') console.log(msg.trim());
    }
  }
}));

// --- All requires at the top ---
// --- Gzip Compression ---
app.use(compression());

// --- Strict Transport Security (HSTS) ---
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  next();
});

// --- Referrer Policy (already present, but ensure strictest) ---
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});

// --- Permissions Policy ---
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// --- X-Content-Type-Options ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});


// --- Content-Security-Policy for Shopify embedding ---
app.use((req, res, next) => {
  // Remove X-Frame-Options if set by any upstream middleware
  res.removeHeader && res.removeHeader('X-Frame-Options');
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com"
  );
  next();
});

// --- X-XSS-Protection (legacy, but some browsers use it) ---
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// --- OpenAPI/Swagger Docs (auto-load if present) ---
try {
  const openapiPath = path.join(__dirname, '../openapi.yaml');
  if (fs.existsSync(openapiPath)) {
    const openapiSpec = YAML.load(openapiPath);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
    console.log('[Core] Swagger UI available at /api/docs');
  }
} catch (e) {
  console.warn('[Core] Swagger UI not loaded:', e.message);
}

// --- Health, Liveness, and Readiness Probes ---
app.get('/livez', (_req, res) => res.status(200).send('OK'));
app.get('/readyz', (_req, res) => {
  // Add DB/Redis checks here if needed
  res.status(200).send('READY');
});

// --- Developer-Friendly Error Pages (dev only) ---
if (process.env.NODE_ENV !== 'production') {
  app.use((err, req, res, next) => {
    console.error('[DEV ERROR]', err);
    res.status(500).send(`<pre>${err.stack || err.message}</pre>`);
  });
}

// --- Async Error Boundary (catch unhandled async errors) ---
process.on('unhandledRejection', (reason, p) => {
  console.error('[UNHANDLED REJECTION]', reason, p);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

// --- Graceful Shutdown ---


// (Server start logic moved to the bottom, using http.createServer only)


// Protect all /api routes (except health) with API key
// app.use('/api', requireApiKey); // Disabled for local dev: requireApiKey not defined



// REMOVE: Lusca CSRF protection for embedded Shopify app

// REMOVE: CSRF token endpoint for embedded Shopify app
// ---------- SHOPIFY AUTHENTICATION ROUTES ----------

// Shopify OAuth Authentication - Step 1: Redirect to Shopify OAuth screen
app.get("/shopify/auth", (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).json({ error: "Missing shop parameter" });
  }

  // Validate critical env vars early and return helpful errors if missing.
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  if (!clientId) {
    console.error("[Core] Missing SHOPIFY_CLIENT_ID environment variable");
    return res
      .status(500)
      .json({ error: "Server misconfiguration: missing SHOPIFY_CLIENT_ID" });
  }

  // Derive a safe host URL for the OAuth redirect. Prefer explicit env, then Render,
  // then fall back to the current request's protocol+host. This prevents `undefined`
  // values when HOST_URL isn't set in the environment (e.g. during quick deploys).
  const hostUrl =
    process.env.HOST_URL ||
    process.env.SHOPIFY_APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `${req.protocol}://${req.get("host")}`;

  const redirectUri = `${String(hostUrl).replace(/\/$/, "")}/shopify/auth/callback`;

  // Log the redirectUri for debugging OAuth issues
  console.log("[Core] Shopify OAuth redirectUri:", redirectUri);

  // Allow configuring scopes via env but fall back to sensible defaults.
  const scope = process.env.SHOPIFY_SCOPES || "read_products,write_products";

  // Sanitize provided shop value (strip protocol/path if present)
  const safeShop = String(shop).replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  // Build query params with URLSearchParams to ensure proper encoding
  const params = new URLSearchParams({
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
  });

  const authUrl = `https://${safeShop}/admin/oauth/authorize?${params.toString()}`;

  // Helpful debug log so we can see what we redirect to in server logs.
  console.log("[Core] Redirecting to Shopify OAuth:", authUrl);

  res.redirect(authUrl);
});

// Shopify OAuth Callback - Step 2: Receive the code and exchange it for an access token
app.get("/shopify/auth/callback", async (req, res) => {
  const { code, shop } = req.query;
  if (!code || !shop) {
    return res.status(400).json({ error: "Missing code or shop parameter" });
  }

  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  const payload = {
    client_id: process.env.SHOPIFY_CLIENT_ID,
    client_secret: process.env.SHOPIFY_CLIENT_SECRET,
    code,
  };

  try {
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const text = await tokenRes.text();
    let tokenData = null;
    try {
      tokenData = JSON.parse(text);
    } catch (jsonErr) {
      // Log the raw response for debugging
      console.error("[Shopify OAuth] Non-JSON response from Shopify:", text);
      throw new Error("Shopify token endpoint did not return JSON");
    }
    const accessToken = tokenData.access_token;

    // Store the token for future API calls (can be stored in a session or database)
    try {
      if (accessToken) {
        console.log(`[Shopify OAuth] Saving token for shop: ${shop}`);
        shopTokens.upsertToken(shop, accessToken);
        console.log(`[Shopify OAuth] Token saved for shop: ${shop}`);
        // --- Store shop and token in session for automatic product fetch ---
        if (req.session) {
          req.session.shop = shop;
          req.session.shopifyToken = accessToken;
          req.session.save(() => {
            console.log(`[Shopify OAuth] Session updated with shop and token`);
          });
        }
      } else {
        console.error(`[Shopify OAuth] No access token received for shop: ${shop}`);
      }

      // ensure a project exists for this shop (auto-create)
      const normalized = String(shop).trim();
      let project = projectsCore.getProjectByDomain(normalized);
      if (!project) {
        console.log(`[Shopify OAuth] Creating project for shop: ${normalized}`);
        project = projectsCore.createProject({
          name: normalized,
          domain: normalized,
          platform: "shopify",
        });
        console.log(`[Shopify OAuth] Project created:`, project);
      } else {
        console.log(`[Shopify OAuth] Project already exists for shop: ${normalized}`);
      }

      // Redirect merchant back to the console and include the shop param so UI can auto-connect
      const consoleUrl = process.env.CONSOLE_URL || process.env.HOST_URL || "http://localhost:5173";
      const redirect = `${consoleUrl.replace(/\/$/, "")}/?shop=${encodeURIComponent(normalized)}`;
      console.log(`[Shopify OAuth] Redirecting back to console: ${redirect}`);
      return res.redirect(redirect);
    } catch (innerErr) {
      console.error("Error storing shop token or creating project", innerErr);
      return res.status(500).send("Shopify authentication succeeded but failed to save installation.");
    }
  } catch (err) {
    console.error("Error during Shopify authentication", err);
    res.status(500).send("Authentication failed");
  }
});
// (Removed duplicate/older debug handler to avoid stray `next()` and duplicates.)

// ---------- API ROUTES (must be before static + catch-all) ----------
//
// IMPORTANT:
// We mount the SAME routes both with and without /api prefix.
// This fixes Make scenarios that call /api/... while keeping existing clients working.
//

// Draft Library API
app.use(draftsRoutes);
app.use("/api", draftsRoutes);

// Fix Queue API
app.use(fixQueueRoutes);
app.use("/api", fixQueueRoutes);

// Make outbound integration API
app.use(makeRoutes);
app.use("/api", makeRoutes);

// Automation Scheduling API
app.use("/api/automation", automationRoutes);
app.use("/automation", automationRoutes);

// AI Alt-Text Engine API
const aiAltTextEngineRouter = require('./tools/ai-alt-text-engine/router');
app.use('/api/ai-alt-text-engine', aiAltTextEngineRouter);

// ---------- HEALTH CHECK ----------

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aura-core-monolith",
    env: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
    makeApplyFixQueueWebhookConfigured:
      !!process.env.MAKE_APPLY_FIX_QUEUE_WEBHOOK_URL,
    fixQueueWorkerEnabled:
      String(process.env.FIX_QUEUE_WORKER_ENABLED || "true") !== "false",
  });
});

// Also expose the same health under /api/health for consistency
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aura-core-monolith",
    env: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
    makeApplyFixQueueWebhookConfigured:
      !!process.env.MAKE_APPLY_FIX_QUEUE_WEBHOOK_URL,
    fixQueueWorkerEnabled:
      String(process.env.FIX_QUEUE_WORKER_ENABLED || "true") !== "false",
  });
});

// ---------- DEBUG: SHOPIFY PRODUCTS (TEMPORARY) ----------
//
// Purpose:
// - Prove we can read products from the shop using an Admin token.
// - This does NOT rely on your embedded-app session wiring.
// - Remove or protect this before any real release.
//
// Usage:
//   GET /debug/shopify/products?shop=aurasystemsai.myshopify.com
//   Optional: &limit=10
//   Token: pass ?token=shpat_... OR set env SHOPIFY_ADMIN_TOKEN
//   Optional safety: set env DEBUG_KEY and pass ?key=thevalue
//

async function fetchShopifyProducts({ shop, token, apiVersion, limit }) {
  console.log(`[Core] fetchShopifyProducts called`, { shop, token: token ? token.slice(0, 6) + '...' : undefined, apiVersion, limit });
  console.log(`[Core] About to fetch from Shopify API for shop=${shop}`);

  const safeShop = String(shop || "").trim();
  if (!safeShop.endsWith(".myshopify.com")) {
    throw new Error("Invalid shop. Expected *.myshopify.com");
  }

  // Log the token being used for debugging 401 errors (mask most of it for safety)
  if (token) {
    const masked = token.length > 10 ? token.slice(0, 6) + "..." + token.slice(-4) : token;
    console.log(`[Core] Using Shopify Admin API token for ${safeShop}:`, masked);
  } else {
    console.warn(`[Core] No Shopify Admin API token provided for ${safeShop}`);
  }

  const ver = apiVersion || process.env.SHOPIFY_API_VERSION || "2025-10";
  const url = `https://${safeShop}/admin/api/${ver}/graphql.json`;

  const first = Number.isFinite(Number(limit)) ? Math.min(Number(limit), 50) : 10;

  const query = `
    query Products($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            status
            totalInventory
            createdAt
            updatedAt
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      }
    }
  `;

  let resp, text, json;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        query,
        variables: { first },
      }),
    });
    console.log(`[Core] Shopify API fetch completed for shop=${shop}, status=${resp.status}`);
    text = await resp.text();
    try {
      json = JSON.parse(text);
    } catch (parseErr) {
      console.error(`[Core] Failed to parse Shopify API response as JSON for shop=${shop}:`, text);
      throw parseErr;
    }
    if (!resp.ok) {
      console.error(`[Core] Shopify API HTTP error`, {
        status: resp.status,
        body: text,
        headers: resp.headers,
      });
      throw new Error(
        `Shopify HTTP ${resp.status}: ${text.slice(0, 500)}`
      );
    }
    if (json && json.errors && json.errors.length) {
      console.error(`[Core] Shopify GraphQL errors`, json.errors);
      throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
    }
    if (!json?.data?.products?.edges) {
      console.error(`[Core] Shopify response missing products.edges`, json);
    }
    console.log(`[Core] Shopify API full response for shop=${shop}:`, JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(`[Core] Error during Shopify product fetch for shop=${shop}:`, err);
    throw err;
  }
  const edges = json?.data?.products?.edges || [];
  const products = edges.map((e) => {
    const node = e.node;
    let variants = [];
    if (node.variants && node.variants.edges && node.variants.edges.length) {
      variants = node.variants.edges.map(v => v.node);
    }
    return { ...node, variants };
  });
  if (products.length === 0) {
    console.warn(`[Core] Shopify returned zero products`, {
      shop,
      token: token ? token.slice(0, 6) + '...' : undefined,
      apiVersion,
      limit,
      response: json,
    });
  }

  return { products, rawCount: products.length };
}

function debugGuard(req) {
  const required = process.env.DEBUG_KEY;
  if (!required) return true; // no guard configured
  const provided = req.query.key;
  return String(provided || "") === String(required);
}

app.get("/debug/shopify/products", async (req, res) => {
  try {
    if (!debugGuard(req)) {
      return res.status(401).json({ ok: false, error: "Unauthorized (bad key)" });
    }

    const shop = req.query.shop;
    const limit = req.query.limit;
    const apiVersion = req.query.apiVersion;

    const token =
      req.query.token ||
      process.env.SHOPIFY_ADMIN_TOKEN || // recommended for Render
      "";

    if (!shop) {
      return res.status(400).json({ ok: false, error: "Missing ?shop=" });
    }
    if (!token) {
      return res.status(400).json({
        ok: false,
        error:
          "Missing token. Pass ?token=shpat_... or set env SHOPIFY_ADMIN_TOKEN on Render.",
      });
    }

    const out = await fetchShopifyProducts({ shop, token, apiVersion, limit });

    return res.json({
      ok: true,
      shop,
      apiVersion: apiVersion || process.env.SHOPIFY_API_VERSION || "2025-10",
      count: out.rawCount,
      products: out.products,
    });
  } catch (err) {
    console.error("[Core] debug shopify products error", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Optional: same endpoint under /api for consistency
app.get("/api/debug/shopify/products", async (req, res) => {
  // delegate to the non-/api handler behaviour
  req.url = req.url.replace(/^\/api/, "");
  return app._router.handle(req, res, () => {});
});

// Correct /api/shopify/products route (must be after all middleware, before SPA fallback)
app.get("/api/shopify/products", async (req, res) => {
  try {
    if (!debugGuard(req)) {
      return res.status(401).json({ ok: false, error: "Unauthorized (bad key)" });
    }


    const shop = req.query.shop;
    const limit = req.query.limit;
    const apiVersion = req.query.apiVersion;

    // Accept token from query, env, or Authorization header
    let token = req.query.token || process.env.SHOPIFY_ADMIN_TOKEN || "";
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    console.log("[Core] /api/shopify/products called", {
      query: req.query,
      headers: req.headers,
      time: new Date().toISOString(),
    });

    if (!shop) {
      return res.status(400).json({ ok: false, error: "Missing ?shop=" });
    }
    if (!token) {
      return res.status(400).json({
        ok: false,
        error:
          "Missing token. Pass ?token=shpat_... or set env SHOPIFY_ADMIN_TOKEN on Render.",
      });
    }

    try {
      console.log("[Core] About to call fetchShopifyProducts in /api/shopify/products route");
      const out = await fetchShopifyProducts({ shop, token, apiVersion, limit });
      console.log("[Core] fetchShopifyProducts returned in /api/shopify/products route", { count: out.rawCount });
      return res.json({
        ok: true,
        shop,
        apiVersion: apiVersion || process.env.SHOPIFY_API_VERSION || "2025-10",
        count: out.rawCount,
        products: out.products,
      });
    } catch (shopifyErr) {
      console.error("[Core] Shopify fetch error in /api/shopify/products route", {
        shop,
        token: token ? token.slice(0, 6) + '...' : undefined,
        apiVersion,
        limit,
        error: shopifyErr && shopifyErr.message,
        stack: shopifyErr && shopifyErr.stack,
      });
      return res.status(500).json({ ok: false, error: shopifyErr.message });
    }
  } catch (err) {
    console.error("[Core] /api/shopify/products error", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- PROJECTS API (Connect Store) ----------
//
// Existing routes: /projects, /projects/:projectId/content/...
// Add /api equivalents as well.
//


function validateProjectInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object') errors.push('Input must be an object');
  if (!input.name || typeof input.name !== 'string' || !input.name.trim()) errors.push('name is required');
  if (!input.domain || typeof input.domain !== 'string' || !input.domain.trim()) errors.push('domain is required');
  return errors;
}

function validateContentBatchInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object') errors.push('Input must be an object');
  if (!Array.isArray(input.items) || input.items.length === 0) errors.push('items[] array is required');
  return errors;
}

function registerProjectsAndContentRoutes(prefix = "") {
  // Create a new project from the Connect Store screen
  app.post(`${prefix}/projects`, (req, res) => {
    const errors = validateProjectInput(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, error: errors.join('; ') });
    }
    try {
      const { name, domain, platform } = req.body || {};
      const project = projectsCore.createProject({
        name: String(name).trim(),
        domain: String(domain).trim(),
        platform: (platform || "other").trim(),
      });
      return res.json({
        ok: true,
        project,
      });
    } catch (err) {
      console.error("[Core] Error creating project", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to create project",
      });
    }
  });

  // List all projects (used by console project switcher)
  app.get(`${prefix}/projects`, (_req, res) => {
    try {
      const projects = projectsCore.listProjects();
      return res.json({
        ok: true,
        projects,
      });
    } catch (err) {
      console.error("[Core] Error listing projects", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to list projects",
      });
    }
  });

  /**
   * POST /projects/:projectId/content/batch
   *
   * Ingest / update content items for a project.
   *
   * NEW BEHAVIOUR:
   * - If title/metaDescription are missing, Core will fetch the URL and attempt
   *   to fill them automatically before saving (beginner-friendly).
   */
  app.post(`${prefix}/projects/:projectId/content/batch`, async (req, res) => {
    const projectId = req.params.projectId;
    const errors = validateContentBatchInput(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, error: errors.join('; ') });
    }
    try {
      const { items } = req.body || {};
      // Normalise + enrich missing title/meta (with small concurrency limit)
      const concurrency = 5;
      let autoFilledTitle = 0;
      let autoFilledMeta = 0;
      let fetchErrors = 0;

      const queue = items.slice();
      const enriched = [];

      const worker = async () => {
        while (queue.length) {
          const item = queue.shift();
          if (!item || typeof item !== "object") {
            enriched.push(item);
            continue;
          }

          const next = { ...item };

          const hasUrl = !!next.url;
          const needsTitle = !next.title || String(next.title).trim() === "";
          const needsMeta =
            !next.metaDescription || String(next.metaDescription).trim() === "";

          if (hasUrl && (needsTitle || needsMeta)) {
            const fetched = await fetchPageMeta(String(next.url).trim());
            if (fetched.ok) {
              if (needsTitle && fetched.title) {
                next.title = fetched.title;
                autoFilledTitle += 1;
              }
              if (needsMeta && fetched.metaDescription) {
                next.metaDescription = fetched.metaDescription;
                autoFilledMeta += 1;
              }
            } else {
              fetchErrors += 1;
            }
          }

          enriched.push(next);
        }
      };

      const workers = Array.from({ length: concurrency }, () => worker());
      await Promise.all(workers);

      const result = contentCore.upsertContentItems(projectId, enriched);

      return res.json({
        ok: true,
        projectId,
        inserted: result.inserted,
        enriched: {
          autoFilledTitle,
          autoFilledMeta,
          fetchErrors,
        },
      });
    } catch (err) {
      console.error("[Core] Error in content batch", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to upsert content items",
      });
    }
  });

  /**
   * GET /projects/:projectId/content/health
   */
  app.get(`${prefix}/projects/:projectId/content/health`, (req, res) => {
    const projectId = req.params.projectId;
    const { type, maxScore, limit } = req.query;

    try {
      const items = contentCore.getContentHealth({
        projectId,
        type: type || undefined,
        maxScore:
          maxScore !== undefined && maxScore !== "" ? Number(maxScore) : 70,
        limit: limit !== undefined && limit !== "" ? Number(limit) : 100,
      });

      return res.json({
        ok: true,
        projectId,
        type: type || null,
        maxScore: maxScore !== undefined ? Number(maxScore) : 70,
        limit: limit !== undefined ? Number(limit) : 100,
        items,
      });
    } catch (err) {
      console.error("[Core] Error in content health", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch content health",
      });
    }
  });
}

// register both non-/api and /api variants
registerProjectsAndContentRoutes("");
registerProjectsAndContentRoutes("/api");

// ---------- TOOL RUN ROUTE ----------
//
// Existing: /run/:toolId
// Add: /api/run/:toolId
//
async function toolRunHandler(req, res) {
  const toolId = req.params.toolId;
  const projectId = req.headers["x-aura-project-id"];

  try {
    const tool = getTool(toolId);
    const input = req.body || {};

    const ctx = {
      environment: process.env.NODE_ENV || "production",
      projectId: projectId || null,
    };

    const result = await tool.run(input, ctx);

    return res.json({
      ok: true,
      toolId,
      result,
    });
  } catch (err) {
    console.error(`[Core] Tool error: ${toolId}`, err);

    return res.status(500).json({
      ok: false,
      error: err.message || "Tool run failed",
    });
  }
}

app.post("/run/:toolId", toolRunHandler);
app.post("/api/run/:toolId", toolRunHandler);


// ---------- ABANDONED CHECKOUT WINBACK: GENERATE MESSAGE ENDPOINT ----------
app.post('/api/winback/generate-message', async (req, res) => {
  try {
    const { customerName, cartItems, discountCode, brand, tone, prompt, language } = req.body || {};
    if (!customerName || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ ok: false, error: 'customerName and cartItems[] are required' });
    }
    // Use OpenAI integration for winback message generation
    const openai = require('./tools/abandoned-checkout-winback/openai.js');
    const result = await openai.generateWinbackMessage({ customerName, cartItems, discountCode, brand, tone, prompt, language });
    return res.json({ ok: true, message: result });
  } catch (err) {
    console.error('Winback message generation error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
// ---------- RETURNS/RMA AUTOMATION: GENERATE MESSAGE ENDPOINT ----------
app.post('/api/rma/generate-message', async (req, res) => {
  try {
    const { customerName, orderItems, reason, brand, tone, prompt, language } = req.body || {};
    if (!customerName || !Array.isArray(orderItems) || orderItems.length === 0 || !reason) {
      return res.status(400).json({ ok: false, error: 'customerName, orderItems[], and reason are required' });
    }
    // Use OpenAI integration for RMA message generation
    const openai = require('./tools/returns-rma-automation/openai.js');
    const result = await openai.generateRmaMessage({ customerName, orderItems, reason, brand, tone, prompt, language });
    return res.json({ ok: true, message: result });
  } catch (err) {
    console.error('RMA message generation error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- ABANDONED CHECKOUT WINBACK: SCHEDULING ENDPOINTS ----------
const winbackScheduleModel = require('./tools/abandoned-checkout-winback/scheduleModel.js');
// Create schedule
app.post('/api/winback/schedules', (req, res) => {
  try {
    const schedule = winbackScheduleModel.createSchedule(req.body || {});
    res.json({ ok: true, schedule });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// List schedules
app.get('/api/winback/schedules', (req, res) => {
  res.json({ ok: true, schedules: winbackScheduleModel.listSchedules() });
});
// Get schedule by ID
app.get('/api/winback/schedules/:id', (req, res) => {
  const schedule = winbackScheduleModel.getSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, schedule });
});
// Update schedule
app.put('/api/winback/schedules/:id', (req, res) => {
  const schedule = winbackScheduleModel.updateSchedule(req.params.id, req.body || {});
  if (!schedule) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, schedule });
});
// Delete schedule
app.delete('/api/winback/schedules/:id', (req, res) => {
  const ok = winbackScheduleModel.deleteSchedule(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// ---------- ABANDONED CHECKOUT WINBACK: SEGMENTATION ENDPOINTS ----------
const winbackSegmentModel = require('./tools/abandoned-checkout-winback/segmentModel.js');
// Create segment
app.post('/api/winback/segments', (req, res) => {
  try {
    const segment = winbackSegmentModel.createSegment(req.body || {});
    res.json({ ok: true, segment });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// List segments
app.get('/api/winback/segments', (req, res) => {
  res.json({ ok: true, segments: winbackSegmentModel.listSegments() });
});
// Get segment by ID
app.get('/api/winback/segments/:id', (req, res) => {
  const segment = winbackSegmentModel.getSegment(req.params.id);
  if (!segment) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, segment });
});
// Update segment
app.put('/api/winback/segments/:id', (req, res) => {
  const segment = winbackSegmentModel.updateSegment(req.params.id, req.body || {});
  if (!segment) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, segment });
});
// Delete segment
app.delete('/api/winback/segments/:id', (req, res) => {
  const ok = winbackSegmentModel.deleteSegment(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// ---------- ABANDONED CHECKOUT WINBACK: ANALYTICS ENDPOINTS ----------
const winbackAnalyticsModel = require('./tools/abandoned-checkout-winback/analyticsModel.js');
// ---------- RETURNS/RMA AUTOMATION: ANALYTICS ENDPOINTS ----------
const rmaAnalyticsModel = require('./tools/returns-rma-automation/analyticsModel.js');
// Record analytics event
app.post('/api/rma/analytics', (req, res) => {
  try {
    const event = rmaAnalyticsModel.recordEvent(req.body || {});
    res.json({ ok: true, event });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// List analytics events (optionally filter by rmaId, type)
app.get('/api/rma/analytics', (req, res) => {
  const { rmaId, type } = req.query;
  const events = rmaAnalyticsModel.listEvents({ rmaId, type });
  res.json({ ok: true, events });
});
// Record analytics event
app.post('/api/winback/analytics', (req, res) => {
  try {
    const event = winbackAnalyticsModel.recordEvent(req.body || {});
    res.json({ ok: true, event });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// List analytics events (optionally filter by campaign, variant, etc.)
app.get('/api/winback/analytics', (req, res) => {
  const { campaignId, variantId, type } = req.query;
  const events = winbackAnalyticsModel.listEvents({ campaignId, variantId, type });
  res.json({ ok: true, events });
});

// ---------- ABANDONED CHECKOUT WINBACK: SHOPIFY ABANDONED CHECKOUTS ENDPOINT ----------
const winbackShopify = require('./tools/abandoned-checkout-winback/shopify.js');
// Fetch abandoned checkouts from Shopify for a given shop
app.get('/api/winback/shopify/abandoned-checkouts', async (req, res) => {
  const shop = req.query.shop;
  let token = req.query.token || process.env.SHOPIFY_ADMIN_TOKEN || '';
  try {
    const apiVersion = req.query.apiVersion || process.env.SHOPIFY_API_VERSION || '2023-10';
    const checkouts = await winbackShopify.fetchAbandonedCheckouts({ shop, token, apiVersion });
    res.json({ ok: true, abandonedCheckouts: checkouts });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- PRODUCT SEO SUGGESTION ENDPOINT ----------
app.post('/api/run/product-seo', async (req, res) => {
  try {
    const { productTitle, productDescription, brand, tone, useCases, prompt, language } = req.body || {};
    if (!productTitle || !productDescription) {
      return res.status(400).json({ ok: false, error: 'productTitle and productDescription are required' });
    }
    // Dynamically require the product-seo tool
    const productSeo = require('./tools/product-seo/index.js');
    const result = await productSeo.run({ productTitle, productDescription, brand, tone, useCases, prompt, language });
    return res.json(result);
  } catch (err) {
    console.error('Product SEO error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- SHOPIFY PRODUCT UPDATE ENDPOINT ----------
app.post('/api/shopify/update-product', async (req, res) => {
  const shop = req.query.shop;
  const token = req.query.token;
  const id = req.query.id;
  const { title, body_html, metafields, handle } = req.body || {};
  if (!shop || !token || !id || !title) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }
  try {
    // Update product title, body_html, handle
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2023-10';
    const url = `https://${shop}/admin/api/${apiVersion}/products/${id}.json`;
    const productPayload = {
      product: {
        id,
        title,
        body_html,
        handle,
      },
    };
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(productPayload),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ ok: false, error: `Shopify update failed: ${text}` });
    }
    // Update metafields (meta description, keywords)
    if (Array.isArray(metafields) && metafields.length > 0) {
      for (const mf of metafields) {
        const mfUrl = `https://${shop}/admin/api/${apiVersion}/products/${id}/metafields.json`;
        const mfPayload = {
          metafield: {
            namespace: mf.namespace,
            key: mf.key,
            value: mf.value,
            type: mf.value_type || 'single_line_text_field',
          },
        };
        const mfResp = await fetch(mfUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token,
          },
          body: JSON.stringify(mfPayload),
        });
        if (!mfResp.ok) {
          const mfText = await mfResp.text();
          return res.status(500).json({ ok: false, error: `Shopify metafield failed: ${mfText}` });
        }
      }
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Shopify update error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- STATIC CONSOLE (built React app) ----------


const consoleDist = path.join(__dirname, "..", "aura-console", "dist");
// Restrict static file serving to safe extensions only
const SAFE_STATIC_EXT = [
  '.js', '.css', '.ico', '.png', '.jpg', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.json', '.txt', '.html'
];
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const ext = path.extname(req.path).toLowerCase();
  if (ext && !SAFE_STATIC_EXT.includes(ext)) {
    return res.status(403).send('Forbidden');
  }
  next();
});
app.use(express.static(consoleDist));

// Fallback for Single Page App: serve index.html for any unmatched GET request.
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  res.sendFile(path.join(consoleDist, "index.html"));
});

// ---------- START SERVER ----------

const { initABTestingSuiteSocket } = require('./tools/ab-testing-suite/abTestingSuiteSocket');
const http = require('http');


if (require.main === module) {
  const http = require('http');
  server = http.createServer(app);

  // Attach WebSocket stub for /ws/abandoned-checkout-winback
  const WebSocket = require('ws');
  wss = new WebSocket.Server({ server, path: '/ws/abandoned-checkout-winback' });
  wss.on('connection', ws => {
    ws.send(JSON.stringify({ type: 'info', message: 'Stub WebSocket connection established.' }));
    ws.on('message', msg => {
      // Echo for debug
      ws.send(JSON.stringify({ type: 'echo', message: msg }));
    });
  });

  // Attach other sockets
  initABTestingSuiteSocket(server);
  server.listen(PORT, () => {
    console.log(
      `[Core] AURA Core API running on port ${PORT}\n` +
        `==> Available at ${
          process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
        }\n`
    );

    // Start background retry worker
    startFixQueueWorker();
  });
}

module.exports = app;