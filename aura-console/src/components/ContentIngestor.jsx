// aura-console/src/components/ContentIngestor.jsx
import React, { useMemo, useState } from "react";
import "./ContentIngestor.css";

/**
 * Content Ingestor
 * - Lets beginners paste URLs (pages/posts/products) into Core
 * - Calls: POST /projects/:projectId/content/batch
 * - Accepts flexible input formats:
 *   1) type|url|title|metaDescription
 *   2) url|title|metaDescription (type defaults to "other")
 *   3) just a url (title/meta empty)
 */

function normaliseType(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();

  if (!v) return "other";

  const allowed = new Set([
    "product",
    "blog",
    "page",
    "landing",
    "category",
    "docs",
    "other",
  ]);

  if (allowed.has(v)) return v;

  // small aliases
  if (v === "post") return "blog";
  if (v === "collection") return "category";

  return "other";
}

function looksLikeUrl(s) {
  const v = String(s || "").trim();
  return /^https?:\/\//i.test(v);
}

function parseLine(line) {
  const raw = String(line || "").trim();
  if (!raw) return null;

  const parts = raw.split("|").map((p) => (p ?? "").trim());

  // type|url|title|meta
  if (parts.length >= 2 && looksLikeUrl(parts[1])) {
    const type = normaliseType(parts[0]);
    const url = parts[1];
    const title = parts[2] || "";
    const metaDescription = parts[3] || "";
    return { type, url, title, metaDescription };
  }

  // url|title|meta
  if (parts.length >= 1 && looksLikeUrl(parts[0])) {
    const url = parts[0];
    const title = parts[1] || "";
    const metaDescription = parts[2] || "";
    return { type: "other", url, title, metaDescription };
  }

  // just url (space separated or pasted raw)
  if (looksLikeUrl(raw)) {
    return { type: "other", url: raw, title: "", metaDescription: "" };
  }

  return { __invalid: true, raw };
}

function ContentIngestor({ coreUrl, projectId }) {
  const [bulkText, setBulkText] = useState("");
  const [typeDefault, setTypeDefault] = useState("other");
  const [status, setStatus] = useState({ tone: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsed = useMemo(() => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const rows = lines.map(parseLine).filter(Boolean);

    const invalid = rows.filter((r) => r.__invalid);
    const valid = rows.filter((r) => !r.__invalid && r.url);

    return {
      totalLines: lines.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      valid,
      invalid,
      preview: valid.slice(0, 8),
    };
  }, [bulkText]);

  const chipClass =
    status.tone === "ok"
      ? "chip chip--ok"
      : status.tone === "error"
      ? "chip chip--error"
      : status.tone === "loading"
      ? "chip chip--loading"
      : "chip";

  const buildItemsPayload = () => {
    // Apply default type if the user used url|title|meta format
    // or just pasted URLs (type will be "other" from parse).
    return parsed.valid.map((r) => ({
      type: r.type && r.type !== "other" ? r.type : typeDefault,
      url: r.url,
      title: r.title || "",
      metaDescription: r.metaDescription || "",
      platform: null,
      externalId: null,
      h1: null,
      bodyExcerpt: null,
      raw: { source: "console-manual" },
    }));
  };

  const handleSubmit = async () => {
    if (!projectId) {
      setStatus({ tone: "error", message: "No project connected." });
      return;
    }
    if (!coreUrl) {
      setStatus({ tone: "error", message: "Core URL is missing." });
      return;
    }
    if (parsed.validCount === 0) {
      setStatus({
        tone: "error",
        message:
          "Nothing to ingest. Paste at least one URL (or type|url|title|meta).",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ tone: "loading", message: "Ingesting into Core…" });

    try {
      const items = buildItemsPayload();

      const res = await fetch(`${coreUrl}/projects/${projectId}/content/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const msg =
          json?.error ||
          `Core returned ${res.status}. Check Render logs + projectId.`;
        setStatus({ tone: "error", message: msg });
        return;
      }

      setStatus({
        tone: "ok",
        message: `Ingested ${json.inserted ?? items.length} item(s) into Core.`,
      });

      // Keep text there by default so beginners don’t lose it accidentally.
      // If you want auto-clear, uncomment:
      // setBulkText("");
    } catch (err) {
      setStatus({
        tone: "error",
        message: err?.message || "Failed to ingest content.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div className="content-ingest-card">
        <div className="card-header">
          <h2 className="card-title" title="Add new content for auditing">Content ingestion
            <span style={{
              display: 'inline-block',
              marginLeft: 8,
              fontSize: 18,
              color: '#6366f1',
              cursor: 'help',
            }}
            title="Paste your product, blog, or page URLs here to add them to the system for SEO and content health checks.">
              
            </span>
          </h2>
          <p className="card-subtitle">
            This pushes URLs into Core so the <strong>Content Health</strong> table can audit real pages/posts/products. Paste your URLs below and click ingest.
            <span style={{color:'#6366f1',marginLeft:8,cursor:'help'}} title="After ingesting, go to Content Health and hit Refresh to see your new items.">?</span>
          </p>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 220 }}>
              <div className="filters-label" title="Choose a default type for pasted URLs">Default type
                <span style={{color:'#6366f1',marginLeft:4,cursor:'help'}} title="If you only paste URLs, this type will be used for all of them. Change to 'product', 'blog', etc as needed.">?</span>
              </div>
              <select
                className="inspector-input"
                value={typeDefault}
                onChange={(e) => setTypeDefault(e.target.value)}
              >
                <option value="other">other</option>
                <option value="product">product</option>
                <option value="blog">blog</option>
                <option value="page">page</option>
                <option value="landing">landing</option>
                <option value="category">category</option>
                <option value="docs">docs</option>
              </select>
              <div className="field-help" style={{ marginTop: 6 }}>
                Used when you paste only URLs (or url|title|meta). Select the type that best matches your content.
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <div className="filters-label" title="Shows the current state of your input and ingestion">Status
                <span style={{color:'#6366f1',marginLeft:4,cursor:'help'}} title="See if your input is valid, and how many lines will be ingested.">?</span>
              </div>
              <div className={chipClass} style={{ marginTop: 4 }}>
                {status.message ||
                  `Ready • ${parsed.validCount} valid • ${parsed.invalidCount} invalid`}
              </div>
              <div className="field-help" style={{ marginTop: 6 }}>
                Tip: After ingesting, go to <strong>Content Health</strong> and hit Refresh to see your new items.
              </div>
            </div>
          </div>

          <textarea
            className="inspector-textarea"
            rows={10}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={
              "Paste one per line:\n" +
              "product|https://dtpjewellry.com/products/ring|Gold Ring|Waterproof, tarnish-free ring\n" +
              "blog|https://aurasystemsai.com/blog/seo-guide|SEO Guide|Improve rankings\n" +
              "https://aurasystemsai.com/automation\n" +
              "https://dtpjewellry.com/collections/bracelets|Bracelets|Shop waterproof bracelets"
            }
            title="Paste your URLs here, one per line. You can include type, title, and meta if you want."
          />

          <div style={{ fontSize: 12, opacity: 0.9 }}>
            <strong>Accepted formats</strong>
            <div style={{ marginTop: 6, opacity: 0.8 }}>
              <div>
                <code>type|url|title|metaDescription</code>
              </div>
              <div>
                <code>url|title|metaDescription</code>
              </div>
              <div>
                <code>url</code>
              </div>
            </div>
          </div>

          {parsed.preview.length > 0 && (
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              <strong>Preview (first {parsed.preview.length})</strong>
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                {parsed.preview.map((r, idx) => (
                  <div key={idx}>
                    {r.type} — {r.url}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsed.invalidCount > 0 && (
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              <strong>Invalid lines</strong>
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                {parsed.invalid.slice(0, 5).map((r, idx) => (
                  <div key={idx}>{r.raw}</div>
                ))}
                {parsed.invalidCount > 5 && (
                  <div>…and {parsed.invalidCount - 5} more</div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              className="button button--primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              title="Send your pasted URLs to Core for auditing."
            >
              {isSubmitting ? "Ingesting…" : "Ingest into Core"}
            </button>

            <div className="field-help" style={{ margin: 0 }}>
              Sends to: <code>/projects/{projectId}/content/batch</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentIngestor;
