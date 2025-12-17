// src/core/fetchPageMeta.js
// --------------------------------------------------------
// Fetch a URL and extract <title> + meta description from HTML
// No external deps (works on Node 18+ / 20+ / 24+).
// --------------------------------------------------------

function decodeHtmlEntities(input) {
  if (!input) return "";
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function cleanText(input) {
  return decodeHtmlEntities(String(input || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagContent(html, regex) {
  const m = html.match(regex);
  return m && m[1] ? cleanText(m[1]) : "";
}

function extractMetaContent(html, nameOrProp) {
  // matches: <meta name="description" content="...">
  // matches: <meta property="og:description" content="...">
  const re = new RegExp(
    `<meta\\s+(?:[^>]*?)?(?:name|property)\\s*=\\s*["']${nameOrProp}["'](?:[^>]*?)content\\s*=\\s*["']([^"']*)["'][^>]*>`,
    "i"
  );
  return extractTagContent(html, re);
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "AURA-Core/1.0 (+https://aurasystemsai.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPageMeta(url, opts = {}) {
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 8000;

  if (!url || typeof url !== "string") {
    return {
      ok: false,
      url,
      title: "",
      metaDescription: "",
      error: "Invalid URL",
    };
  }

  if (!/^https?:\/\//i.test(url)) {
    return {
      ok: false,
      url,
      title: "",
      metaDescription: "",
      error: "URL must start with http:// or https://",
    };
  }

  try {
    const res = await fetchWithTimeout(url, timeoutMs);
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      return {
        ok: false,
        url,
        title: "",
        metaDescription: "",
        error: `Fetch failed (${res.status})`,
      };
    }

    if (!contentType.toLowerCase().includes("text/html")) {
      return {
        ok: true,
        url,
        title: "",
        metaDescription: "",
        note: `Non-HTML content-type: ${contentType}`,
      };
    }

    const html = await res.text();

    // Title: <title>...</title>
    let title = extractTagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);

    // Meta description priority
    let metaDescription =
      extractMetaContent(html, "description") ||
      extractMetaContent(html, "og:description") ||
      extractMetaContent(html, "twitter:description");

    // Fallback title
    if (!title) {
      title =
        extractMetaContent(html, "og:title") ||
        extractMetaContent(html, "twitter:title");
    }

    return {
      ok: true,
      url,
      title: title || "",
      metaDescription: metaDescription || "",
    };
  } catch (err) {
    const msg =
      err && err.name === "AbortError"
        ? "Timeout fetching URL"
        : err?.message || "Fetch error";
    return { ok: false, url, title: "", metaDescription: "", error: msg };
  }
}

module.exports = { fetchPageMeta };
