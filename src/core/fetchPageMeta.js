// src/core/fetchPageMeta.js
// -------------------------------------
// Fetch basic SEO meta from a URL (server-side)
// -------------------------------------

const { URL } = require("url");

function stripTags(html) {
  if (!html) return "";
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchOne(html, regex) {
  const m = regex.exec(html);
  return m && m[1] ? stripTags(m[1]) : null;
}

function decodeHtmlEntities(str) {
  if (!str) return str;
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchPageMeta(url) {
  const u = new URL(url);

  const res = await fetch(u.toString(), {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent":
        "AURA Content Auditor (+https://aurasystemsai.com) NodeFetch/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const html = await res.text();

  // If we did not get HTML, do not try to parse
  if (!contentType.includes("text/html") && !html.includes("<html")) {
    return {
      ok: false,
      url: u.toString(),
      status: res.status,
      contentType,
      title: null,
      metaDescription: null,
      h1: null,
      note: "Non-HTML response",
    };
  }

  // <title>
  let title = matchOne(html, /<title[^>]*>([\s\S]*?)<\/title>/i);

  // meta description
  let metaDescription =
    matchOne(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
    ) ||
    matchOne(
      html,
      /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i
    );

  // first H1
  let h1 = matchOne(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);

  title = decodeHtmlEntities(title);
  metaDescription = decodeHtmlEntities(metaDescription);
  h1 = decodeHtmlEntities(h1);

  return {
    ok: true,
    url: u.toString(),
    status: res.status,
    contentType,
    title: title || null,
    metaDescription: metaDescription || null,
    h1: h1 || null,
  };
}

module.exports = {
  fetchPageMeta,
};
