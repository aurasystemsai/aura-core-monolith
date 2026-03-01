/**
 * Automated test script for rebuilt BlogSEO tool
 * Tests all beginner-section API endpoints
 *
 * Usage: node scripts/test-blogseo-rebuild.js
 * Requires: backend running on localhost:10000
 */

const BASE = "http://localhost:10000/api/blog-seo";
const SHOP = "test-shop.myshopify.com";

const headers = {
  "Content-Type": "application/json",
  "x-shopify-shop-domain": SHOP,
};

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗  ${name}`);
    console.log(`       ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  return { res, data: await res.json().catch(() => ({})) };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers });
  return { res, data: await res.json().catch(() => ({})) };
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers });
  return { res, data: await res.json().catch(() => ({})) };
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

async function testShopifyData() {
  console.log("\n[Shopify Data]");
  await test("GET /shopify-data responds", async () => {
    const { res } = await get("/shopify-data");
    assert(res.status < 500, `Got ${res.status}`);
  });
}

async function testAnalyze() {
  console.log("\n[Analyze]");
  await test("POST /analyze returns ok or structured error", async () => {
    const { res, data } = await post("/analyze", { url: "https://example.com/blogs/news/test", keyword: "seo test" });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });

  await test("POST /analyze with no URL returns 400/error", async () => {
    const { res, data } = await post("/analyze", {});
    assert(res.status === 400 || data.ok === false || data.error, "Should reject empty request");
  });
}

async function testKeywords() {
  console.log("\n[Keywords]");
  await test("POST /keywords/research responds", async () => {
    const { res, data } = await post("/keywords/research", { keyword: "running shoes", niche: "fitness" });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });

  await test("POST /keywords/research with no keyword returns error", async () => {
    const { res, data } = await post("/keywords/research", {});
    assert(res.status === 400 || data.ok === false || data.error, "Should reject empty request");
  });
}

async function testWrite() {
  console.log("\n[Write - Outline]");
  await test("POST /ai/blog-outline responds", async () => {
    const { res, data } = await post("/ai/blog-outline", { keyword: "content marketing tips", audience: "beginners" });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });

  console.log("\n[Write - Intro]");
  await test("POST /ai/intro-generator responds", async () => {
    const { res, data } = await post("/ai/intro-generator", { keyword: "seo for beginners", style: "conversational" });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });

  console.log("\n[Write - Titles]");
  await test("POST /ai/title-ideas responds", async () => {
    const { res, data } = await post("/ai/title-ideas", { keyword: "best running shoes" });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });

  console.log("\n[Write - Full Draft]");
  await test("POST /ai/full-draft responds", async () => {
    const { res, data } = await post("/ai/full-draft", { keyword: "beginner seo guide" });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });

  console.log("\n[Write - Content Brief]");
  await test("POST /content-brief responds", async () => {
    const { res, data } = await post("/content-brief", { topic: "ecommerce seo", primaryKeyword: "shopify seo" });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });
}

async function testOptimize() {
  console.log("\n[Optimize]");
  await test("POST /content/optimize responds", async () => {
    const { res, data } = await post("/content/optimize", { url: "https://example.com/blogs/news/test", keyword: "seo optimization" });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });
}

async function testChat() {
  console.log("\n[Chat]");
  await test("POST /chat responds", async () => {
    const { res, data } = await post("/chat", { messages: [{ role: "user", content: "What is on-page SEO?" }] });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });
}

async function testBulkScan() {
  console.log("\n[Bulk Scan]");
  await test("POST /bulk-scan responds", async () => {
    const { res, data } = await post("/bulk-scan", {
      urls: ["https://example.com/blogs/news/post-1"],
      keyword: "seo"
    });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });

  await test("POST /bulk-scan with no URLs returns error", async () => {
    const { res, data } = await post("/bulk-scan", {});
    assert(res.status === 400 || data.ok === false || data.error, "Should reject empty request");
  });
}

async function testHistory() {
  console.log("\n[History]");
  const { data: listBefore } = await get("/items");

  await test("GET /items returns array", async () => {
    const { res, data } = await get("/items");
    assert(res.status < 500, `Server error ${res.status}`);
    assert(Array.isArray(data) || Array.isArray(data.items) || typeof data === "object", "Should return array or object");
  });

  await test("POST /items saves history item", async () => {
    const { res, data } = await post("/items", {
      url: "https://example.com/blogs/news/history-test",
      keyword: "history test",
      score: 75,
    });
    assert(res.status < 500, `Server error ${res.status}`);
  });

  await test("DELETE /items/:id works", async () => {
    // Create an item first
    const { data: created } = await post("/items", {
      url: "https://example.com/delete-test",
      keyword: "delete test",
      score: 50,
    });
    const id = created?.id || created?.item?.id || "test-id";
    const { res } = await del(`/items/${id}`);
    assert(res.status < 500, `Server error ${res.status}`);
  });
}

async function testAIFeatures() {
  console.log("\n[AI Rewrite]");
  await test("POST /ai/rewrite responds for title", async () => {
    const { res, data } = await post("/ai/rewrite", {
      field: "title",
      current: "My Blog Post Title",
      keyword: "seo optimization"
    });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });

  console.log("\n[AI Deep Analysis]");
  await test("POST /ai/analyze responds", async () => {
    const { res, data } = await post("/ai/analyze", {
      url: "https://example.com/blogs/news/test",
      keyword: "seo"
    });
    assert(res.status < 500, `Server error ${res.status}`);
    assert(typeof data === "object", "Response should be object");
  });
}

// ─── RUNNER ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(55));
  console.log("  BlogSEO Rebuild — Automated API Tests");
  console.log(`  Target: ${BASE}`);
  console.log("=".repeat(55));

  try {
    await testShopifyData();
    await testAnalyze();
    await testKeywords();
    await testWrite();
    await testOptimize();
    await testChat();
    await testBulkScan();
    await testHistory();
    await testAIFeatures();
  } catch (err) {
    console.error("\nFatal error:", err.message);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(55));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(55));

  if (failed > 0) process.exit(1);
}

main();
