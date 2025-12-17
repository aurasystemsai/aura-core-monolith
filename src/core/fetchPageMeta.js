// src/core/fetchPageMeta.js
// ----------------------------------------
// Fetch basic SEO metadata from a public URL
// - title (prefers <title>, falls back to og:title, then <h1>)
// - metaDescription (prefers meta[name=description], falls back to og:description)
// - h1 (first <h1> on page)
// ----------------------------------------

const DEFAULT_TIMEOUT_MS = 12000;

function stripTags(input) {
  return String(input || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(input) {
  // Lightweight decoding for the most common entities we encounter in titles/meta.
  // (No external dependencies.)
  const s = String(input || "");
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickFirstNonEmpty(...values) {
  for (const v of values) {
    const t = String(v || "").trim();
    if (t) return t;
  }
  return "";
}

function extractTagContent(html, tagName) {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const m = html.match(re);
  return m ? decodeHtmlEntities(stripTags(m[1])) : "";
}

function extractMetaByName(html, name) {
  // matches: <meta name="description" content="...">
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m ? decodeHtmlEntities(stripTags(m[1])) : "";
}

function extractMetaByProperty(html, property) {
  // matches: <meta property="og:title" content="...">
  const re = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m ? decodeHtmlEntities(stripTags(m[1])) : "";
}

async function fetchHtml(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // A normal UA reduces blocks from some hosts.
        "User-Agent":
          "AURAContentBot/1.0 (+https://aurasystemsai.com) NodeFetch",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const contentType = res.headers.get("content-type") || "";
    const isHtml =
      contentType.includes("text/html") || contentType.includes("application/xhtml+xml");

    // Even if CT is missing, still try to read text (some hosts omit it).
    const text = await res.text();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        statusText: res.statusText,
        html: text || "",
        isHtml,
      };
    }

    return {
      ok: true,
      status: res.status,
      statusText: res.statusText,
      html: text || "",
      isHtml,
    };
  } finally {
    clearTimeout(id);
  }
}

/**
 * Fetch SEO metadata from a URL.
 * @param {string} url
 * @returns {Promise<{ ok: boolean, url: string, title: string, metaDescription: string, h1: string, error?: string }>}
 */
async function fetchPageMeta(url) {
  const safeUrl = String(url || "").trim();
  if (!safeUrl) {
    return { ok: false, url: safeUrl, title: "", metaDescription: "", h1: "", error: "Missing url" };
  }

  let fetched;
  try {
    fetched = await fetchHtml(safeUrl);
  } catch (err) {
    return {
      ok: false,
      url: safeUrl,
      title: "",
      metaDescription: "",
      h1: "",
      error: err?.name === "AbortError" ? "Fetch timed out" : (err?.message || "Fetch failed"),
    };
  }

  const html = fetched.html || "";

  // Extract core signals
  const titleTag = extractTagContent(html, "title");
  const ogTitle = extractMetaByProperty(html, "og:title");
  const h1 = extractTagContent(html, "h1");

  const metaDesc = extractMetaByName(html, "description");
  const ogDesc = extractMetaByProperty(html, "og:description");

  // IMPORTANT: fallback rule for product UX:
  // If <title> is empty but <h1> exists, use h1 as title.
  const title = pickFirstNonEmpty(titleTag, ogTitle, h1);

  const metaDescription = pickFirstNonEmpty(metaDesc, ogDesc);

  // Normalise "empty" outputs
  const normalisedTitle = (title || "").trim();
  const normalisedMeta = (metaDescription || "").trim();
  const normalisedH1 = (h1 || "").trim();

  return {
    ok: true,
    url: safeUrl,
    title: normalisedTitle,
    metaDescription: normalisedMeta,
    h1: normalisedH1,
  };
}

module.exports = fetchPageMeta;
