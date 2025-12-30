// --- API Key Middleware ---
function requireApiKey(req, res, next) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return next(); // No API key set, allow all (dev mode)
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key === apiKey) return next();
  return res.status(401).json({ ok: false, error: 'Invalid or missing API key' });
}

// ...existing code...


const path = require("path");
const xss = require('xss');
// --- Input Sanitization Middleware ---
function sanitizeInputs(req, res, next) {
  // Sanitize all string fields in req.body, req.query, req.params
  function sanitize(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  }
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
}
// Warn if running with default secrets or insecure mode
if ((process.env.JWT_SECRET || '').startsWith('dev-secret') || !process.env.JWT_SECRET) {
  console.warn('[SECURITY] WARNING: Using default or missing JWT_SECRET. Set a strong secret in production!');
}
if (process.env.NODE_ENV !== 'production') {
  console.warn('[SECURITY] WARNING: Not running in production mode. Security features may be reduced.');
}
// ...existing code...
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const csurf = require("csurf");



const app = express();

// Add Referrer-Policy header for additional privacy
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Sanitize all incoming input
app.use(sanitizeInputs);
// XSS protection removed (xss-clean is not compatible with Express 5+)
// CSRF protection (cookie-based)
const csrfProtection = csurf({ cookie: true });


dotenv.config();

const { getTool } = require("./core/tools-registry.cjs");
const projectsCore = require("./core/projects");
const shopTokens = require("./core/shopTokens");
const contentCore = require("./core/content");

// Auto-fetch title/meta for ingestion
const { fetchPageMeta } = require("./core/fetchPageMeta");

// Draft Library API routes
const draftsRoutes = require("./routes/drafts");
// Fix Queue API routes
const fixQueueRoutes = require("./routes/fix-queue");
// Automation Scheduling API routes
const automationRoutes = require("./routes/automation");
// Make Integration routes (outbound to Make webhooks)
const makeRoutes = require("./routes/make");
// User and RBAC routes
const usersRoutes = require("./routes/users");
// User and RBAC API
app.use('/api/users', usersRoutes);

// SSO (OAuth2/SAML) API
const ssoRoutes = require('./routes/sso');
app.use('/sso', ssoRoutes);

// Fix Queue background worker (retry + DLQ)
const { startFixQueueWorker } = require("./core/fixQueueWorker");




const cookieParser = require('cookie-parser');
// Parse cookies for CSRF
app.use(cookieParser());

// Security: Set HTTP headers (allow Shopify embedding)
const defaultCsp = helmet.contentSecurityPolicy.getDefaultDirectives();
const cspDirectives = {};
for (const key in defaultCsp) {
  if (key !== 'frame-ancestors') cspDirectives[key] = defaultCsp[key];
}
cspDirectives['frame-ancestors'] = [
  "'self'",
  "https://admin.shopify.com",
  "https://*.myshopify.com"
];
app.use(
  helmet({
    frameguard: false, // Allow embedding in iframe (Shopify admin)
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
  })
);

// Security: Enhanced rate limiting for /api routes (100 requests per 10 minutes per IP)
// --- Audit Logging for Critical Actions ---
// Example: log all login attempts (see routes/users.js for more detailed logging)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/users/login')) {
    console.log(`[AUDIT] Login attempt: ip=${req.ip}, time=${new Date().toISOString()}`);
  }
  next();
});
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// ---------- PROJECT RUN HISTORY ROUTES ----------
app.get('/api/projects/:projectId/runs', (req, res) => {
  const projectId = req.params.projectId;
  try {
    const runs = require('./core/runs').listRuns({ projectId, limit: 50 });
    res.json({ ok: true, runs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/projects/:projectId/runs', (req, res) => {
  const projectId = req.params.projectId;
  try {
    const runs = require('./core/runs').listRuns({ projectId, limit: 50 });
    res.json({ ok: true, runs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// trust proxy only for local proxy (prevents spoofing X-Forwarded-For)
app.set("trust proxy", "127.0.0.1");
const PORT = process.env.PORT || 10000;


// ---------- HTTPS ENFORCEMENT (PROD) ----------
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, 'https://' + req.headers.host + req.url);
    }
    next();
  });
}
// ---------- MIDDLEWARE ----------

// Harden CORS: allow only trusted origins
const TRUSTED_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (TRUSTED_ORIGINS.length === 0 || TRUSTED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Not allowed by policy'), false);
  },
  credentials: true,
}));
app.use(
  bodyParser.json({
    limit: "1mb",
  })
);

// Protect all /api routes (except health) with API key
app.use('/api', requireApiKey);

// CSRF protection for all state-changing routes (POST, PUT, PATCH, DELETE)
app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// Expose CSRF token for frontend (GET /api/csrf-token)
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ ok: true, csrfToken: req.csrfToken() });
});
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


if (require.main === module) {
  app.listen(PORT, () => {
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