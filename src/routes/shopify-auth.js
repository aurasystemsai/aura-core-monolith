// Shopify OAuth Authentication Flow
// Complete OAuth 2.0 implementation for Shopify App integration

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fetch = require('node-fetch');
const db = require('../core/db');

// Store for nonce/state verification (in production, use Redis)
const pendingAuths = new Map();

// Shopify App credentials (set in .env)
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory';
const APP_URL = process.env.APP_URL || 'https://app.aura-platform.com';

/**
 * Step 1: Initiate OAuth flow
 * GET /shopify/auth?shop=store.myshopify.com
 */
router.get('/auth', (req, res) => {
  const shop = req.query.shop;
  
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  // Validate shop domain
  if (!isValidShopDomain(shop)) {
    return res.status(400).json({ error: 'Invalid shop domain' });
  }

  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  const nonce = crypto.randomBytes(32).toString('hex');
  
  // Store for verification
  pendingAuths.set(state, { shop, nonce, timestamp: Date.now() });
  
  // Clean up old entries (older than 10 minutes)
  cleanupOldAuths();

  // Build Shopify OAuth URL
  const redirectUri = `${APP_URL}/shopify/callback`;
  const authUrl = `https://${shop}/admin/oauth/authorize?` + 
    `client_id=${SHOPIFY_API_KEY}&` +
    `scope=${SHOPIFY_SCOPES}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}&` +
    `grant_options[]=per-user`;

  res.redirect(authUrl);
});

/**
 * Step 2: Handle OAuth callback
 * GET /shopify/callback?code=xxx&hmac=xxx&shop=xxx&state=xxx
 */
router.get('/callback', async (req, res) => {
  const { code, hmac, shop, state } = req.query;

  // Verify required parameters
  if (!code || !hmac || !shop || !state) {
    return res.status(400).send('Missing required parameters');
  }

  // Verify state (CSRF protection)
  const authData = pendingAuths.get(state);
  if (!authData || authData.shop !== shop) {
    return res.status(403).send('Invalid state parameter');
  }
  pendingAuths.delete(state);

  // Verify HMAC
  if (!verifyHmac(req.query)) {
    return res.status(403).send('HMAC verification failed');
  }

  try {
    // Exchange code for access token
    const accessToken = await getAccessToken(shop, code);

    // Store token securely
    await storeShopifyToken(shop, accessToken);

    // Get shop info
    const shopInfo = await getShopInfo(shop, accessToken);

    // Create or update shop record
    await upsertShop(shop, shopInfo, accessToken);

    // Redirect to success page
    res.redirect(`${APP_URL}?shop=${shop}&installed=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Failed to complete OAuth flow: ' + error.message);
  }
});

/**
 * Exchange authorization code for access token
 */
async function getAccessToken(shop, code) {
  const url = `https://${shop}/admin/oauth/access_token`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code: code
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get shop information
 */
async function getShopInfo(shop, accessToken) {
  const url = `https://${shop}/admin/api/2024-01/shop.json`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get shop info');
  }

  const data = await response.json();
  return data.shop;
}

/**
 * Store Shopify credentials in database
 */
async function storeShopifyToken(shop, accessToken) {
  // In production, encrypt the token before storing
  const encryptedToken = encryptToken(accessToken);
  
  await db.query(`
    INSERT INTO shopify_stores (shop_domain, access_token, installed_at, status)
    VALUES ($1, $2, NOW(), 'active')
    ON CONFLICT (shop_domain) 
    DO UPDATE SET 
      access_token = $2,
      reinstalled_at = NOW(),
      status = 'active'
  `, [shop, encryptedToken]);

  console.log(`✓ Stored token for shop: ${shop}`);
}

/**
 * Create or update shop record with details
 */
async function upsertShop(shop, shopInfo, accessToken) {
  await db.query(`
    INSERT INTO shops (
      shop_domain,
      name,
      email,
      currency,
      timezone,
      country_code,
      plan_name,
      shop_owner,
      access_token,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    ON CONFLICT (shop_domain)
    DO UPDATE SET
      name = $2,
      email = $3,
      currency = $4,
      timezone = $5,
      country_code = $6,
      plan_name = $7,
      shop_owner = $8,
      access_token = $9,
      updated_at = NOW()
  `, [
    shop,
    shopInfo.name,
    shopInfo.email,
    shopInfo.currency,
    shopInfo.timezone,
    shopInfo.country_code,
    shopInfo.plan_name,
    shopInfo.shop_owner,
    encryptToken(accessToken)
  ]);

  console.log(`✓ Upserted shop: ${shopInfo.name}`);
}

/**
 * Verify Shopify HMAC signature
 */
function verifyHmac(query) {
  const { hmac, ...params } = query;
  
  // Sort parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Calculate HMAC
  const hash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest('hex');

  return hash === hmac;
}

/**
 * Validate shop domain format
 */
function isValidShopDomain(shop) {
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
}

/**
 * Encrypt access token (simple example - use proper encryption in production)
 */
function encryptToken(token) {
  // In production, use strong encryption like AES-256
  const cipher = crypto.createCipher('aes-256-cbc', SHOPIFY_API_SECRET);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/**
 * Decrypt access token
 */
function decryptToken(encryptedToken) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', SHOPIFY_API_SECRET);
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    return null;
  }
}

/**
 * Get stored access token for a shop
 */
async function getShopToken(shop) {
  const result = await db.query(
    'SELECT access_token FROM shopify_stores WHERE shop_domain = $1 AND status = $2',
    [shop, 'active']
  );

  if (result.rows.length === 0) {
    return null;
  }

  return decryptToken(result.rows[0].access_token);
}

/**
 * Clean up old pending authentications
 */
function cleanupOldAuths() {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  
  for (const [state, data] of pendingAuths.entries()) {
    if (data.timestamp < tenMinutesAgo) {
      pendingAuths.delete(state);
    }
  }
}

/**
 * Uninstall/disconnect shop
 * POST /shopify/disconnect
 */
router.post('/disconnect', async (req, res) => {
  const { shop } = req.body;

  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  try {
    await db.query(
      'UPDATE shopify_stores SET status = $1, uninstalled_at = NOW() WHERE shop_domain = $2',
      ['uninstalled', shop]
    );

    res.json({ success: true, message: 'Shop disconnected successfully' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect shop' });
  }
});

/**
 * Get shop connection status
 * GET /shopify/status?shop=store.myshopify.com
 */
router.get('/status', async (req, res) => {
  const shop = req.query.shop || req.headers['x-shopify-shop-domain'] || req.session?.shop;

  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  try {
    const result = await db.query(
      'SELECT shop_domain, status, installed_at FROM shopify_stores WHERE shop_domain = $1',
      [shop]
    );

    if (result.rows.length === 0) {
      return res.json({ connected: false });
    }

    const shopData = result.rows[0];
    res.json({
      connected: shopData.status === 'active',
      shop: shopData.shop_domain,
      installed_at: shopData.installed_at,
      status: shopData.status
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * Webhook verification middleware
 */
function verifyWebhook(req, res, next) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = req.rawBody; // Need raw body for HMAC verification

  const hash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  if (hash === hmac) {
    next();
  } else {
    res.status(403).send('Webhook verification failed');
  }
}

/**
 * Shopify webhook handlers
 */
router.post('/webhooks/app/uninstalled', verifyWebhook, async (req, res) => {
  const shop = req.get('X-Shopify-Shop-Domain');
  
  console.log(`App uninstalled from shop: ${shop}`);
  
  await db.query(
    'UPDATE shopify_stores SET status = $1, uninstalled_at = NOW() WHERE shop_domain = $2',
    ['uninstalled', shop]
  );

  res.status(200).send('OK');
});

router.post('/webhooks/shop/update', verifyWebhook, async (req, res) => {
  const shop = req.get('X-Shopify-Shop-Domain');
  const shopData = req.body;
  
  console.log(`Shop updated: ${shop}`);
  
  await db.query(`
    UPDATE shops SET
      name = $1,
      email = $2,
      plan_name = $3,
      updated_at = NOW()
    WHERE shop_domain = $4
  `, [shopData.name, shopData.email, shopData.plan_name, shop]);

  res.status(200).send('OK');
});

/**
 * Data sync endpoints — pull latest data from Shopify into local cache/DB
 * POST /shopify/sync/:dataType
 */
router.post('/sync/:dataType', async (req, res) => {
  const { dataType } = req.params;
  const shop = req.body.shop || req.session?.shop || req.headers['x-shopify-shop-domain'];

  if (!shop) return res.status(400).json({ error: 'Shop required' });

  const validTypes = ['products', 'orders', 'customers', 'inventory'];
  if (!validTypes.includes(dataType)) {
    return res.status(400).json({ error: `Invalid data type. Must be one of: ${validTypes.join(', ')}` });
  }

  try {
    const token = await getShopToken(shop);
    if (!token) return res.status(401).json({ error: 'No access token found for this shop. Please reconnect.' });

    const apiVersion = '2024-01';
    const endpoints = {
      products:  `https://${shop}/admin/api/${apiVersion}/products.json?limit=250&fields=id,title,status,variants,images`,
      orders:    `https://${shop}/admin/api/${apiVersion}/orders.json?limit=250&status=any&fields=id,name,total_price,financial_status,created_at`,
      customers: `https://${shop}/admin/api/${apiVersion}/customers.json?limit=250&fields=id,email,first_name,last_name,orders_count,total_spent`,
      inventory: `https://${shop}/admin/api/${apiVersion}/inventory_levels.json?limit=250`,
    };

    const response = await fetch(endpoints[dataType], {
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Shopify returned ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    const items = data[dataType] || data.inventory_levels || [];

    res.json({
      success: true,
      dataType,
      count: items.length,
      message: `Synced ${items.length} ${dataType} from Shopify`,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[Sync] ${dataType} error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Export helper functions for use in other modules
module.exports = router;
module.exports.getShopToken = getShopToken;
module.exports.verifyHmac = verifyHmac;
module.exports.isValidShopDomain = isValidShopDomain;
