const axios = require("axios");
const cheerio = require("cheerio");

// Simple site crawler for demo; production should use queue, depth, robots.txt, etc.
async function crawlSite(url) {
  const visited = new Set();
  const results = [];
  async function crawl(u, depth = 0) {
    if (visited.has(u) || depth > 1) return; // Limit depth for demo
    visited.add(u);
    try {
      const { data } = await axios.get(u, { timeout: 10000 });
      const $ = cheerio.load(data);
      const title = $("title").text();
      const links = [];
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.startsWith("http")) links.push(href);
      });
      results.push({ url: u, title, linksCount: links.length });
      // Crawl only first 3 links for demo
      for (const l of links.slice(0, 3)) {
        await crawl(l, depth + 1);
      }
    } catch (err) {
      results.push({ url: u, error: err.message });
    }
  }
  await crawl(url);
  return results;
}

module.exports = { crawlSite };
