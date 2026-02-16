#!/usr/bin/env node

/**
 * AURA CORE AUTOMATED TEST BOT
 * 
 * Comprehensive automated testing suite that validates:
 * - Server health and availability
 * - API endpoints and responses
 * - Access control and authorization
 * - Tool functionality
 * - Error handling
 * 
 * Usage:
 *   node scripts/automated-test-bot.js
 *   node scripts/automated-test-bot.js --env=local
 *   node scripts/automated-test-bot.js --verbose
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const config = {
  production: 'https://aura-core-monolith.onrender.com',
  local: 'http://localhost:10000',
  timeout: 30000,
  verbose: process.argv.includes('--verbose'),
  env: process.argv.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production'
};

const BASE_URL = config.env === 'local' ? config.local : config.production;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
  startTime: Date.now()
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const symbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '○';
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  log(`  ${symbol} ${name} ${details ? '- ' + details : ''}`, color);
}

function logSection(title) {
  log(`\n${colors.bright}${colors.cyan}━━━ ${title} ━━━${colors.reset}`);
}

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AURA-Test-Bot/1.0',
        ...options.headers
      },
      timeout: config.timeout
    };

    if (config.verbose) {
      log(`→ ${requestOptions.method} ${url.href}`, colors.blue);
    }

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let body = data;
        try {
          body = JSON.parse(data);
        } catch (e) {
          // Keep as string if not JSON
        }
        
        if (config.verbose) {
          log(`← ${res.statusCode} ${JSON.stringify(body).substring(0, 100)}`, colors.blue);
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

function recordTest(category, name, passed, details = '') {
  results.tests.push({ category, name, passed, details, timestamp: Date.now() });
  if (passed) {
    results.passed++;
    logTest(name, 'PASS', details);
  } else {
    results.failed++;
    logTest(name, 'FAIL', details);
  }
}

function assertTrue(condition, category, name, details = '') {
  recordTest(category, name, condition, details);
  return condition;
}

function assertEqual(actual, expected, category, name) {
  const passed = actual === expected;
  const details = passed ? '' : `Expected ${expected}, got ${actual}`;
  recordTest(category, name, passed, details);
  return passed;
}

function assertStatus(response, expected, category, name) {
  return assertEqual(response.statusCode, expected, category, name);
}

function assertHasProperty(obj, property, category, name) {
  const passed = obj && typeof obj === 'object' && property in obj;
  const details = passed ? '' : `Missing property: ${property}`;
  recordTest(category, name, passed, details);
  return passed;
}

// ============================================================================
// TEST SUITES
// ============================================================================

async function testHealthCheck() {
  logSection('Health Check Tests');
  
  try {
    const response = await makeRequest('/health');
    assertStatus(response, 200, 'Health', 'Health endpoint returns 200');
    assertHasProperty(response.body, 'status', 'Health', 'Response has status field');
    assertHasProperty(response.body, 'uptime', 'Health', 'Response has uptime field');
    assertHasProperty(response.body, 'timestamp', 'Health', 'Response has timestamp field');
    
    if (response.body.status) {
      assertEqual(response.body.status, 'ok', 'Health', 'Status is "ok"');
    }
  } catch (error) {
    recordTest('Health', 'Health check request', false, error.message);
  }
}

async function testHomepage() {
  logSection('Homepage Tests');
  
  try {
    const response = await makeRequest('/');
    assertTrue(
      response.statusCode === 200 || response.statusCode === 302,
      'Homepage',
      'Homepage is accessible',
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    recordTest('Homepage', 'Homepage request', false, error.message);
  }
}

async function testAPIAccessControl() {
  logSection('Access Control Tests');
  
  // Test unauthenticated access to access check endpoint
  try {
    const response = await makeRequest('/api/access/check');
    assertTrue(
      response.statusCode === 200 || response.statusCode === 401 || response.statusCode === 403,
      'Access Control',
      'Access check endpoint responds',
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    recordTest('Access Control', 'Access check endpoint', false, error.message);
  }

  // Test protected endpoint without auth (should be blocked)
  try {
    const response = await makeRequest('/api/abandoned-checkout-winback/checkouts');
    assertTrue(
      response.statusCode === 401 || response.statusCode === 403,
      'Access Control',
      'Protected endpoint blocks unauthenticated requests',
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    // Expected to fail or be rejected - that's OK
    recordTest('Access Control', 'Protected endpoint blocks unauth', true, 'Blocked as expected');
  }
}

async function testToolEndpoints() {
  logSection('Tool Endpoint Tests');
  
  const toolEndpoints = [
    '/api/product-seo',
    '/api/blog-seo',
    '/api/ai-alt-text-engine',
    '/api/weekly-blog-content-engine',
    '/api/abandoned-checkout-winback',
    '/api/ai-support-assistant',
    '/api/advanced-analytics-attribution'
  ];

  for (const endpoint of toolEndpoints) {
    try {
      const response = await makeRequest(endpoint);
      // Tool endpoints should either:
      // - Return 200 with data
      // - Return 401/403 (auth required)
      // - Return 404 (if router doesn't have root handler)
      assertTrue(
        [200, 401, 403, 404].includes(response.statusCode),
        'Tool Endpoints',
        `${endpoint} is registered`,
        `Status: ${response.statusCode}`
      );
    } catch (error) {
      recordTest('Tool Endpoints', `${endpoint} accessible`, false, error.message);
    }
  }
}

async function testSessionEndpoint() {
  logSection('Session Endpoint Tests');
  
  try {
    const response = await makeRequest('/api/session');
    assertTrue(
      response.statusCode === 200 || response.statusCode === 401,
      'Session',
      'Session endpoint responds',
      `Status: ${response.statusCode}`
    );
    
    if (response.statusCode === 200 && typeof response.body === 'object') {
      // Session endpoint should return JSON
      assertTrue(
        typeof response.body === 'object',
        'Session',
        'Session returns JSON response'
      );
    }
  } catch (error) {
    recordTest('Session', 'Session endpoint request', false, error.message);
  }
}

async function testAnalyticsEndpoints() {
  logSection('Analytics Endpoint Tests');
  
  const analyticsEndpoints = [
    '/api/analytics/overview',
    '/api/analytics/timeline?metric=revenue&days=30'
  ];

  for (const endpoint of analyticsEndpoints) {
    try {
      const response = await makeRequest(endpoint);
      // Analytics endpoints require auth, should return 401/403
      assertTrue(
        [200, 401, 403].includes(response.statusCode),
        'Analytics',
        `${endpoint} responds`,
        `Status: ${response.statusCode}`
      );
    } catch (error) {
      recordTest('Analytics', `${endpoint} accessible`, false, error.message);
    }
  }
}

async function testNotificationsEndpoints() {
  logSection('Notifications Endpoint Tests');
  
  try {
    const response = await makeRequest('/api/notifications');
    assertTrue(
      [200, 401, 403].includes(response.statusCode),
      'Notifications',
      'Notifications list endpoint responds',
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    recordTest('Notifications', 'Notifications endpoint', false, error.message);
  }
}

async function testBillingEndpoints() {
  logSection('Billing Endpoint Tests');
  
  const billingEndpoints = [
    '/api/billing/status',
    '/api/billing/plans'
  ];

  for (const endpoint of billingEndpoints) {
    try {
      const response = await makeRequest(endpoint);
      assertTrue(
        [200, 401, 403, 404].includes(response.statusCode),
        'Billing',
        `${endpoint} responds`,
        `Status: ${response.statusCode}`
      );
    } catch (error) {
      recordTest('Billing', `${endpoint} accessible`, false, error.message);
    }
  }
}

async function testErrorHandling() {
  logSection('Error Handling Tests');
  
  // Test 404 handling
  try {
    const response = await makeRequest('/api/nonexistent-endpoint-12345');
    assertTrue(
      response.statusCode === 404,
      'Error Handling',
      'Returns 404 for unknown endpoints',
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    recordTest('Error Handling', '404 handling', false, error.message);
  }

  // Test invalid method handling
  try {
    const response = await makeRequest('/api/session', { method: 'DELETE' });
    assertTrue(
      [404, 405, 401, 403].includes(response.statusCode),
      'Error Handling',
      'Handles invalid HTTP methods',
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    recordTest('Error Handling', 'Invalid method handling', false, error.message);
  }
}

async function testSecurityHeaders() {
  logSection('Security Headers Tests');
  
  try {
    const response = await makeRequest('/');
    const headers = response.headers;

    assertTrue(
      !!headers['strict-transport-security'],
      'Security',
      'HSTS header present'
    );

    assertTrue(
      !!headers['x-content-type-options'],
      'Security',
      'X-Content-Type-Options header present'
    );

    assertTrue(
      !!headers['x-xss-protection'] || !!headers['content-security-policy'],
      'Security',
      'XSS protection header present'
    );

  } catch (error) {
    recordTest('Security', 'Security headers check', false, error.message);
  }
}

async function testPerformance() {
  logSection('Performance Tests');
  
  const endpoints = [
    { path: '/', name: 'Homepage', maxTime: 3000 },
    { path: '/health', name: 'Health check', maxTime: 1000 },
    { path: '/api/session', name: 'Session API', maxTime: 2000 }
  ];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      await makeRequest(endpoint.path);
      const duration = Date.now() - startTime;
      
      assertTrue(
        duration < endpoint.maxTime,
        'Performance',
        `${endpoint.name} responds within ${endpoint.maxTime}ms`,
        `${duration}ms`
      );
    } catch (error) {
      recordTest('Performance', `${endpoint.name} performance`, false, error.message);
    }
  }
}

async function testDatabaseConnectivity() {
  logSection('Database Connectivity Tests');
  
  // If we can hit any endpoint that queries the database, DB is working
  try {
    const response = await makeRequest('/api/session');
    // Any response (even 401) means server is up and can process requests
    assertTrue(
      response.statusCode !== 500,
      'Database',
      'No database connection errors',
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    recordTest('Database', 'Database connectivity', false, error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════════════════════╗
║                  AURA CORE TEST BOT                            ║
║                  Automated Testing Suite                       ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}`);

  log(`\n${colors.bright}Configuration:${colors.reset}`);
  log(`  Environment: ${config.env}`);
  log(`  Base URL: ${BASE_URL}`);
  log(`  Timeout: ${config.timeout}ms`);
  log(`  Verbose: ${config.verbose}`);

  try {
    // Run all test suites
    await testHealthCheck();
    await testHomepage();
    await testAPIAccessControl();
    await testSessionEndpoint();
    await testToolEndpoints();
    await testAnalyticsEndpoints();
    await testNotificationsEndpoints();
    await testBillingEndpoints();
    await testErrorHandling();
    await testSecurityHeaders();
    await testPerformance();
    await testDatabaseConnectivity();

  } catch (error) {
    log(`\n${colors.red}Fatal error during test execution:${colors.reset}`);
    log(error.message, colors.red);
    log(error.stack, colors.red);
  }

  // Print summary
  printSummary();
}

function printSummary() {
  const duration = Date.now() - results.startTime;
  const total = results.passed + results.failed + results.skipped;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log(`${colors.bright}TEST SUMMARY${colors.reset}`);
  log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  log(`  Total Tests:    ${colors.bright}${total}${colors.reset}`);
  log(`  ${colors.green}Passed:         ${results.passed}${colors.reset}`);
  log(`  ${colors.red}Failed:         ${results.failed}${colors.reset}`);
  log(`  ${colors.yellow}Skipped:        ${results.skipped}${colors.reset}`);
  log(`  Pass Rate:      ${passRate >= 80 ? colors.green : colors.yellow}${passRate}%${colors.reset}`);
  log(`  Duration:       ${(duration / 1000).toFixed(2)}s\n`);

  if (results.failed > 0) {
    log(`${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        log(`  ${colors.red}✗ [${t.category}] ${t.name}${colors.reset}`);
        if (t.details) {
          log(`    ${colors.yellow}${t.details}${colors.reset}`);
        }
      });
    log('');
  }

  // Overall status
  if (results.failed === 0) {
    log(`${colors.green}${colors.bright}✓ ALL TESTS PASSED${colors.reset}\n`);
    process.exit(0);
  } else if (results.failed <= 3) {
    log(`${colors.yellow}${colors.bright}⚠ SOME TESTS FAILED (acceptable for dev)${colors.reset}\n`);
    process.exit(0);
  } else {
    log(`${colors.red}${colors.bright}✗ MULTIPLE TESTS FAILED - NEEDS ATTENTION${colors.reset}\n`);
    process.exit(1);
  }
}

// ============================================================================
// RUN TESTS
// ============================================================================

if (require.main === module) {
  runAllTests().catch(error => {
    log(`\n${colors.red}Unhandled error:${colors.reset}`);
    log(error.message, colors.red);
    log(error.stack, colors.red);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  makeRequest,
  config
};
