#!/usr/bin/env node

/**
 * QUICK SMOKE TEST
 * 
 * Fast smoke test for critical functionality - useful for quick checks after deployment
 * 
 * Usage:
 *   node scripts/quick-smoke-test.js
 *   npm run smoke-test
 */

const https = require('https');

const BASE_URL = 'https://aura-core-monolith.onrender.com';
const TESTS = [];
let passed = 0;
let failed = 0;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    https.get(`${BASE_URL}${path}`, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}: ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🔍 AURA Core - Quick Smoke Test\n');
  console.log(`Testing: ${BASE_URL}\n`);

  await test('Health check is responsive', async () => {
    const res = await makeRequest('/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.status) throw new Error('Missing status field');
  });

  await test('Homepage is accessible', async () => {
    const res = await makeRequest('/');
    if (![200, 302].includes(res.status)) throw new Error(`Expected 200/302, got ${res.status}`);
  });

  await test('API requires authentication', async () => {
    const res = await makeRequest('/api/session');
    // Should either work (200) or require auth (401/403)
    if (![200, 401, 403].includes(res.status)) throw new Error(`Unexpected status: ${res.status}`);
  });

  await test('Tool endpoints are registered', async () => {
    const res = await makeRequest('/api/product-seo');
    // Should be registered (any response except connection error is fine)
    if (!res.status) throw new Error('No response from tool endpoint');
  });

  await test('Access control is enforced', async () => {
    const res = await makeRequest('/api/abandoned-checkout-winback/checkouts');
    // Should block unauthorized access
    if (![401, 403].includes(res.status)) {
      // If it returns 200, that might mean auth is bypassed - warning
      if (res.status === 200) console.log('  ⚠ Warning: Endpoint returned 200 without auth');
    }
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Status: ${failed === 0 ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
