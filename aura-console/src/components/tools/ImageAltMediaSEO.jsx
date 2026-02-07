import React, { useState, useRef, useEffect, useMemo } from "react";

export default function ImageAltMediaSEO() {
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [brandTerms, setBrandTerms] = useState("");
  const [tone, setTone] = useState("balanced");
  const [verbosity, setVerbosity] = useState("balanced");
  const [productTitle, setProductTitle] = useState("");
  const [attributes, setAttributes] = useState("");
  const [shotType, setShotType] = useState("front");
  const [variant, setVariant] = useState("");
  const [focus, setFocus] = useState("product");
  const [scene, setScene] = useState("");
  const [variantCount, setVariantCount] = useState(1);
  const [locale, setLocale] = useState("en-US");
  const [result, setResult] = useState("");
  const [lint, setLint] = useState(null);
  const [grade, setGrade] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [sanitized, setSanitized] = useState("");
  const [batchInput, setBatchInput] = useState("[]");
  const [chunkSize, setChunkSize] = useState(50);
  const [paceMs, setPaceMs] = useState(0);
  const [batchVariantCount, setBatchVariantCount] = useState(1);
  const [batchResults, setBatchResults] = useState([]);
  const [runs, setRuns] = useState([]);
  const [images, setImages] = useState([]);
  const [imageLimit, setImageLimit] = useState(20);
  const [imageOffset, setImageOffset] = useState(0);
  const [imageTotal, setImageTotal] = useState(0);
  const [imageSearch, setImageSearch] = useState("");
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [filterMode, setFilterMode] = useState("all");
  const [duplicateAltIds, setDuplicateAltIds] = useState(new Set());
  const [rewritingId, setRewritingId] = useState(null);
  const [sortMode, setSortMode] = useState("newest");
  const [undoBuffer, setUndoBuffer] = useState([]);
  const [role, setRole] = useState("editor");
  const [coverageGoals, setCoverageGoals] = useState({ missing: 0, duplicatesPct: 5, inRangePct: 95 });
  const [simulationResults, setSimulationResults] = useState([]);
  const [simulationSummary, setSimulationSummary] = useState(null);
  const [simulateVariants, setSimulateVariants] = useState(["balanced"]);
  const [translateLocale, setTranslateLocale] = useState("es");
  const [translationResults, setTranslationResults] = useState([]);
  const [visionResults, setVisionResults] = useState([]);
  const [visionFilter, setVisionFilter] = useState("all");
  const [shopDomain, setShopDomain] = useState("");
  const [shopifyMaxImages, setShopifyMaxImages] = useState(250);
  const [shopifyProductLimit, setShopifyProductLimit] = useState(400);
  const [shopifyImporting, setShopifyImporting] = useState(false);
  const [shopifyPushing, setShopifyPushing] = useState(false);
  const [shopifyImportSummary, setShopifyImportSummary] = useState(null);
  const [bulkAltText, setBulkAltText] = useState("");
  const [similarityQuery, setSimilarityQuery] = useState("");
  const [similarityLimit, setSimilarityLimit] = useState(5);
  const [similarityResults, setSimilarityResults] = useState([]);
  const [similarityDownloadUrl, setSimilarityDownloadUrl] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [meta, setMeta] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState("custom");
  const [captionResult, setCaptionResult] = useState("");
  const [captionLint, setCaptionLint] = useState(null);
  const [captionSanitized, setCaptionSanitized] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [missingReport, setMissingReport] = useState(null);
  const [lengthBands, setLengthBands] = useState(null);
  const [duplicates, setDuplicates] = useState(null);
  const [missingDownloadUrl, setMissingDownloadUrl] = useState("");
  const [lengthDownloadUrl, setLengthDownloadUrl] = useState("");
  const [duplicatesDownloadUrl, setDuplicatesDownloadUrl] = useState("");
  const [lintOnlyText, setLintOnlyText] = useState("");
  const [lintOnlyKeywords, setLintOnlyKeywords] = useState("");
  const [lintOnlyBrandTerms, setLintOnlyBrandTerms] = useState("");
  const [lintOnlyResult, setLintOnlyResult] = useState(null);
  const [lintOnlyGrade, setLintOnlyGrade] = useState(null);
  const [batchDownloadUrl, setBatchDownloadUrl] = useState("");
  const [importErrorDownloadUrl, setImportErrorDownloadUrl] = useState("");
  const [importErrorCount, setImportErrorCount] = useState(0);
  const [batchSummary, setBatchSummary] = useState(null);
  const [batchCopying, setBatchCopying] = useState(false);
  const [runsDownloadUrl, setRunsDownloadUrl] = useState("");
  const [batchProgress, setBatchProgress] = useState(0);
  const [exportFilename, setExportFilename] = useState("images.json");
  const batchProgressTimer = useRef(null);
  const lastWriteTsRef = useRef(0);
  const roleCanApply = role === "admin" || role === "editor";
  const roleCanApprove = role === "admin" || role === "editor" || role === "reviewer";
  const roleCanSimulate = role !== "viewer";
  const roleCanWrite = roleCanApply;
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [actionLog, setActionLog] = useState([]);
  const [webhookReplayStatus, setWebhookReplayStatus] = useState("");
  const [hookMetrics, setHookMetrics] = useState(null);
  const [hookMetricsAt, setHookMetricsAt] = useState(null);
  const [hookMetricsError, setHookMetricsError] = useState("");
  const [stateHydrated, setStateHydrated] = useState(false);
  const [visibleCount, setVisibleCount] = useState(120);
  const [imageRefreshedAt, setImageRefreshedAt] = useState(null);
  const simulationTones = [
    { key: "balanced", label: "Balanced" },
    { key: "descriptive", label: "Descriptive" },
    { key: "concise", label: "Concise" },
    { key: "brand", label: "Brand-heavy" },
  ];
  const localeStyleGuides = {
    "es": { tone: "Neutral/informative", formality: "Neutral", punctuation: "Standard", numerals: "Arabic" },
    "fr": { tone: "Warm, not flowery", formality: "Vous", punctuation: "Space before ; : ! ?", numerals: "Arabic" },
    "de": { tone: "Direct, precise", formality: "Sie", punctuation: "Standard", numerals: "Arabic" },
    "en-GB": { tone: "Concise, UK spelling", formality: "Light formal", punctuation: "Standard", numerals: "Arabic" },
    "en-US": { tone: "Concise, US spelling", formality: "Neutral", punctuation: "Standard", numerals: "Arabic" },
    "ja": { tone: "Polite (です/ます)", formality: "Polite", punctuation: "Full-width where natural", numerals: "Arabic" },
    "ko": { tone: "Polite (체)", formality: "Polite", punctuation: "Standard", numerals: "Arabic" },
    "zh": { tone: "Neutral, Mainland", formality: "Neutral", punctuation: "Full-width Chinese punctuation", numerals: "Arabic" },
  };

    const getShopFromQuery = () => {
      try {
        const params = new URLSearchParams(window.location.search || "");
        return (params.get("shop") || "").trim();
      } catch (_) {
        return "";
      }
    };

  const resetBatchState = () => {
    setBatchResults([]);
    setBatchSummary(null);
    setBatchDownloadUrl("");
    setBatchCopying(false);
    setBatchProgress(0);
    if (batchProgressTimer.current) {
      clearInterval(batchProgressTimer.current);
      batchProgressTimer.current = null;
    }
  };

  const handleDownloadRuns = async () => {
    try {
      const res = await fetch("/api/image-alt-media-seo/runs");
      const json = await res.json().catch(() => ({}));
      if (!json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const blob = new Blob([JSON.stringify(json.runs || [], null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      setRunsDownloadUrl(url);
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      showToast("Runs JSON ready");
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setInput("");
    setImageUrl("");
    setKeywords("");
    setBrandTerms("");
    setTone("balanced");
    setVerbosity("balanced");
    setProductTitle("");
    setAttributes("");
    setShotType("front");
    setVariant("");
    setFocus("product");
    setScene("");
    setVariantCount(1);
    setResult("");
    setLint(null);
    setGrade(null);
    setVariants([]);
    setSelectedVariantIdx(0);
    setSanitized("");
    setCaptionResult("");
    setCaptionLint(null);
    setCaptionSanitized("");
    setResultDownloadUrl("");
    setCopied(false);
    setError("");
    setToast("");
    setSelectedBundle("custom");
  };

  const retryFailedBatch = () => {
    const failed = (batchResults || []).filter(r => !r.ok && r.item);
    if (!failed.length) return;
    try {
      setBatchInput(JSON.stringify(failed.map(f => f.item), null, 2));
      showToast("Loaded failed items into batch input", 1800);
    } catch (err) {
      setError("Could not load failed items: " + err.message);
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [safeMode, setSafeMode] = useState(true);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Dark mode is always on for this tool
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [resultDownloadUrl, setResultDownloadUrl] = useState("");
  const fileInputRef = useRef();
  const searchReadyRef = useRef(false);
  const fetchImagesAbortRef = useRef(null);

  const showToast = (msg, timeout = 2200) => {
    setToast(msg);
    setTimeout(() => setToast(""), timeout);
  };

  const rateLimitMessage = retryAfter => {
    if (!retryAfter) return "Rate limit exceeded. Please wait a minute and retry.";
    return `Rate limit exceeded. Please wait ${retryAfter}s and retry.`;
  };

  const enforceWritePace = (label = "write") => {
    const now = Date.now();
    const delta = now - (lastWriteTsRef.current || 0);
    const minGap = 1200;
    if (delta < minGap) {
      const waitMs = Math.max(200, minGap - delta);
      const msg = `Write actions are throttled. Wait ${waitMs}ms before ${label}.`;
      setError(msg);
      showToast(msg, 1500);
      return false;
    }
    lastWriteTsRef.current = now;
    return true;
  };

  const recordAction = (action, count = 0, meta = {}) => {
    const entry = { action, count, role, ts: Date.now(), ...meta };
    setActionLog(prev => [...prev, entry].slice(-50));
  };

  const persistState = async (nextApprovals = approvalQueue, nextActions = actionLog) => {
    if (!roleCanWrite) return;
    try {
      await fetchJson("/api/image-alt-media-seo/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvals: nextApprovals.slice(0, 50), actionLog: nextActions.slice(-50) })
      });
    } catch (err) {
      setError(err.message || "Failed to persist state");
    }
  };

  const hydrateState = async () => {
    try {
      const res = await fetch("/api/image-alt-media-seo/state");
      const json = await res.json().catch(() => ({}));
      if (Array.isArray(json.approvals)) setApprovalQueue(json.approvals);
      if (Array.isArray(json.actionLog)) setActionLog(json.actionLog);
    } catch (_err) {
      // keep local state when server persistence is unavailable
    } finally {
      setStateHydrated(true);
    }
  };

  const handleFetchHookMetrics = async () => {
    try {
      const { data } = await fetchJson("/api/image-alt-media-seo/hooks/metrics");
      setHookMetrics(data.hookStats || null);
      setHookMetricsAt(Date.now());
      setHookMetricsError("");
      showToast("Hook metrics refreshed", 1400);
    } catch (err) {
      const msg = err.message || "Hook metrics failed";
      setHookMetricsError(msg);
      setError(msg);
    }
  };

  const handleResetHookMetrics = async () => {
    if (!ensureWriter("reset hook metrics")) return;
    if (!enforceWritePace("reset")) return;
    try {
      const { data } = await fetchJson("/api/image-alt-media-seo/hooks/metrics/reset", { method: "POST" });
      setHookMetrics(data.hookStats || null);
      setHookMetricsAt(Date.now());
      setWebhookReplayStatus("");
      setHookMetricsError("");
      showToast("Hook metrics reset", 1400);
    } catch (err) {
      const msg = err.message || "Reset failed";
      setHookMetricsError(msg);
      setError(msg);
    }
  };

  const handleReplayHooks = async () => {
    if (!ensureWriter("replay hooks")) return;
    if (!enforceWritePace("replay")) return;
    setWebhookReplayStatus("running");
    try {
      const { data } = await fetchJson("/api/image-alt-media-seo/hooks/replay", { method: "POST" });
      setWebhookReplayStatus(`ok: replayed ${data.replayed || 0}`);
      showToast(`Replayed ${data.replayed || 0}`);
      recordAction("hooks-replay", data.replayed || 0);
      fetchImages();
    } catch (err) {
      setWebhookReplayStatus(err.message || "Replay failed");
      setError(err.message || "Replay failed");
      recordAction("hooks-replay-error", 0, { error: err.message });
    }
  };

  const ensureWriter = (actionLabel = "write") => {
    if (roleCanWrite) return true;
    const msg = `Role ${role} cannot ${actionLabel}. Switch to editor or admin.`;
    setError(msg);
    showToast(msg, 2000);
    return false;
  };

  const enqueueApproval = (label, items) => {
    if (!roleCanApprove) {
      setError("Only reviewers/editors/admins can queue approvals");
      showToast("Switch role to reviewer/editor/admin", 1800);
      return false;
    }
    if (!items?.length) {
      setError("No items to queue for approval");
      return false;
    }
    const entry = {
      id: `appr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: label || "Alt update",
      items,
      status: "pending",
      requestedBy: role,
      requestedAt: Date.now(),
    };
    setApprovalQueue(prev => [entry, ...prev].slice(0, 50));
    recordAction("queue-approval", items.length, { label: entry.label });
    showToast(`Queued ${items.length} item(s) for approval`, 1600);
    return true;
  };

  const markApproval = (id, status) => {
    if (!roleCanApprove) {
      setError("Role cannot approve or reject.");
      return;
    }
    setApprovalQueue(prev => prev.map(entry => entry.id === id ? { ...entry, status, approvedBy: status === "approved" ? role : undefined, approvedAt: status === "approved" ? Date.now() : undefined } : entry));
    recordAction(status, 1, { id });
    showToast(`Marked ${status}`, 1200);
  };

  const applyApproval = async entry => {
    if (!ensureWriter("apply approved items")) return;
    if (!roleCanApply) return;
    if (entry.status !== "approved") {
      setError("Only approved requests can be applied.");
      return;
    }
    if (!enforceWritePace("apply")) return;
    const items = (entry.items || []).map(i => ({ id: i.id, altText: i.altText })).filter(i => i.id && i.altText);
    if (!items.length) {
      setError("No valid items to apply.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await fetchJson("/api/image-alt-media-seo/images/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      saveUndo("bulk", entry.items.map(i => ({ id: i.id, altText: resolveAlt(images.find(img => img.id === i.id) || {}) })));
      setApprovalQueue(prev => prev.filter(e => e.id !== entry.id));
      recordAction("apply-approved", items.length, { id: entry.id });
      showToast(`Applied ${items.length} approved item(s)`);
      fetchImages();
    } catch (err) {
      setError(err.message || "Failed to apply approval");
    } finally {
      setLoading(false);
    }
  };

  const buildFilterParams = () => {
    const params = new URLSearchParams();
    if (collectionFilter.trim()) params.set("collection", collectionFilter.trim());
    if (vendorFilter.trim()) params.set("vendor", vendorFilter.trim());
    return params;
  };

  const makeDownloadUrl = (data, filename, setter) => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      setter(url);
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const fetchJson = async (url, options = {}) => {
    const headers = { ...(options.headers || {}), "X-Role": role };
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.retryAfter = res.headers?.get?.("Retry-After") || null;
      throw err;
    }
    return { data, res };
  };

  // Fetch images
  const fetchImages = async (nextOffset = imageOffset, nextLimit = imageLimit, nextSearch = imageSearch) => {
    if (fetchImagesAbortRef.current) {
      fetchImagesAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchImagesAbortRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("limit", String(nextLimit || 20));
      params.set("offset", String(nextOffset || 0));
      if (nextSearch && nextSearch.trim()) params.set("search", nextSearch.trim());
      const qs = params.toString();
      const { data } = await fetchJson(`/api/image-alt-media-seo/images${qs ? `?${qs}` : ""}`, { signal: controller.signal });
      setImages(data.images || []);
      setImageLimit(data.limit || nextLimit || 20);
      setImageOffset(typeof data.offset === "number" ? data.offset : nextOffset || 0);
      setImageTotal(data.total || (data.images || []).length || 0);
      setImageRefreshedAt(Date.now());
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSearchSubmit = () => {
    const trimmed = imageSearch.trim();
    setImageOffset(0);
    fetchImages(0, imageLimit, trimmed);
  };

  const handleClearImageSearch = () => {
    setImageSearch("");
    setImageOffset(0);
    fetchImages(0, imageLimit, "");
  };

  const handleImageLimitChange = value => {
    const next = Math.min(Math.max(Number(value) || 10, 5), 200);
    setImageLimit(next);
    setImageOffset(0);
    fetchImages(0, next, imageSearch);
  };

  const lintAltText = alt => {
    const text = (alt || "").trim();
    if (!text) return { status: "missing", label: "Missing" };
    if (text.length < 15) return { status: "short", label: "Short" };
    if (text.length > 180) return { status: "long", label: "Long" };
    return { status: "ok", label: "OK" };
  };

  const handleImagePageChange = delta => {
    const maxOffset = Math.max(0, imageTotal - imageLimit);
    const nextOffset = Math.min(maxOffset, Math.max(0, imageOffset + delta * imageLimit));
    if (nextOffset === imageOffset) return;
    fetchImages(nextOffset, imageLimit, imageSearch);
  };

  const handleImportShopify = async () => {
    if (!ensureWriter("import from Shopify")) return;
    const derivedShop = shopDomain.trim() || getShopFromQuery();
    const shop = derivedShop.toLowerCase();
    if (!shop) {
      setError("Shop domain is required for Shopify import (e.g. yourstore.myshopify.com)");
      showToast("Add your shop domain (yourstore.myshopify.com)");
      return;
    }
    if (!shopDomain.trim()) setShopDomain(shop);
    setShopifyImporting(true);
    setError("");
    try {
      const payload = {
        shop,
        maxImages: shopifyMaxImages,
        productLimit: shopifyProductLimit,
        search: imageSearch.trim() || undefined,
      };
      const { data } = await fetchJson("/api/image-alt-media-seo/images/import-shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setShopifyImportSummary({
        imported: data.imported || 0,
        skipped: data.skipped || 0,
        total: data.total || 0,
        productCount: data.productCount || 0,
      });
      showToast(`Imported ${data.imported || 0} Shopify images`);
      await fetchImages(0, imageLimit, imageSearch);
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setShopifyImporting(false);
    }
  };

  const reconnectShopify = () => {
    const shop = shopDomain.trim() || getShopFromQuery() || '';
    const target = shop ? `/shopify/auth?shop=${encodeURIComponent(shop)}` : '/connect-shopify';
    if (typeof window !== 'undefined') {
      if (window.top) window.top.location.href = target;
      else window.location.href = target;
    }
  };

  const handlePushShopify = async () => {
    if (!ensureWriter("push to Shopify")) return;
    const shop = shopDomain.trim() || getShopFromQuery();
    if (!shop) {
      setError("Shop domain is required to push to Shopify (e.g. yourstore.myshopify.com)");
      showToast("Add your shop domain to push");
      return;
    }
    if (!selectedImageIds.length) {
      setError("Select at least one image to push to Shopify");
      return;
    }
    const selected = images.filter(img => selectedImageIds.includes(img.id));
    if (!selected.length) {
      setError("No matching images found for selection");
      return;
    }
    setShopifyPushing(true);
    setError("");
    try {
      const payload = {
        shop,
        items: selected.map(img => ({ url: img.url, altText: resolveAlt(img) })),
        productLimit: shopifyProductLimit,
      };
      const { data } = await fetchJson("/api/image-alt-media-seo/images/push-shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const okCount = data.synced || 0;
      const notFound = data.notFound || 0;
      const errs = data.errors || 0;
      showToast(`Pushed ${okCount} to Shopify; ${notFound} not found; ${errs} errors`, 2400);
      if (errs) setError("Some items failed to push to Shopify — check tokens and rate limits.");
      recordAction("shopify-push", okCount, { notFound, errors: errs, tokenSource: data.tokenSource });
      handleFetchHookMetrics();
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message || "Shopify push failed");
    } finally {
      setShopifyPushing(false);
    }
  };

  const handleImageSearchKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleImageSearchSubmit();
    }
  };

  const toggleSelectImage = id => {
    if (!id) return;
    setSelectedImageIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const selectPageImages = () => {
    const ids = images.map(img => img.id).filter(Boolean);
    if (!ids.length) return;
    setSelectedImageIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  const resolveAlt = img => {
    const raw = img?.altText || img?.alttext || img?.alt || img?.content || '';
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object') return raw.altText || raw.alttext || raw.alt || JSON.stringify(raw);
    return '';
  };

  const lintCache = useMemo(() => {
    const map = new Map();
    images.forEach(img => {
      map.set(img.id, lintAltText(resolveAlt(img)));
    });
    return map;
  }, [images]);

  const truncate = (text, max = 160) => {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  };

  const formatDate = val => {
    if (!val) return '';
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  const shortenUrl = url => {
    if (!url) return '';
    try {
      const u = new URL(url);
      const last = (u.pathname || '').split('/').filter(Boolean).pop() || '';
      return `${u.hostname}${last ? `/${last}` : ''}`;
    } catch (_) {
      return url;
    }
  };

  const saveUndo = (type, items) => {
    const timestamp = Date.now();
    setUndoBuffer(prev => [...prev.slice(-4), { type, items, timestamp }].slice(-5));
  };

  const handleUndo = async () => {
    if (!ensureWriter("undo changes")) return;
    if (!undoBuffer.length) return;
    const last = undoBuffer[undoBuffer.length - 1];
    setLoading(true);
    setError("");
    try {
      if (last.type === "bulk" || last.type === "ai") {
        await fetchJson("/api/image-alt-media-seo/images/bulk-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: last.items })
        });
        showToast("Undone");
        await fetchImages();
        setUndoBuffer(prev => prev.slice(0, -1));
      }
    } catch (err) {
      setError(err.message || "Undo failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKey = e => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a' && e.shiftKey) {
          e.preventDefault();
          const ids = filteredImages.map(img => img.id).filter(Boolean);
          setSelectedImageIds(ids);
        }
        if (e.key === 'z' && undoBuffer.length && !loading) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filteredImages, undoBuffer, loading]);

  const clearSelectedImages = () => setSelectedImageIds([]);

  const handleBulkApply = async () => {
    if (!ensureWriter("apply bulk updates")) return;
    if (!selectedImageIds.length) {
      setError("Select at least one image to bulk update");
      return;
    }
    if (!bulkAltText.trim()) {
      setError("Add alt text to apply");
      return;
    }
    if (!enforceWritePace("apply")) return;
    setLoading(true);
    setError("");
    try {
      const oldValues = images.filter(img => selectedImageIds.includes(img.id)).map(img => ({ id: img.id, altText: resolveAlt(img) }));
      const items = selectedImageIds.map(id => ({ id, altText: bulkAltText.trim() }));
      const { data } = await fetchJson("/api/image-alt-media-seo/images/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      const updatedCount = (data.updated || []).filter(u => u.ok).length;
      saveUndo("bulk", oldValues);
      recordAction("bulk-apply", updatedCount, { ids: selectedImageIds.slice(0, 20) });
      showToast(`Updated ${updatedCount} images`);
      fetchImages();
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQueueBulkApproval = () => {
    if (!roleCanApprove) {
      setError("Only reviewers/editors/admins can request approval");
      showToast("Switch role to reviewer/editor/admin", 1800);
      return;
    }
    if (!selectedImageIds.length) {
      setError("Select images before requesting approval");
      return;
    }
    if (!bulkAltText.trim()) {
      setError("Add alt text to queue");
      return;
    }
    const items = selectedImageIds.map(id => ({ id, altText: bulkAltText.trim() }));
    enqueueApproval("Bulk alt update", items);
  };

  useEffect(() => {
    // Recompute duplicates and filtered list when images or filter change
    const altCounts = new Map();
    images.forEach(img => {
      const alt = (resolveAlt(img) || "").trim().toLowerCase();
      if (!alt) return;
      altCounts.set(alt, (altCounts.get(alt) || 0) + 1);
    });
    const dupIds = new Set();
    images.forEach(img => {
      const alt = (resolveAlt(img) || "").trim().toLowerCase();
      if (alt && (altCounts.get(alt) || 0) > 1) dupIds.add(img.id);
    });
    setDuplicateAltIds(dupIds);

    let next = images.filter(img => {
      const altInfo = lintAltText(resolveAlt(img));
      if (filterMode === "all") return true;
      if (filterMode === "missing") return altInfo.status === "missing";
      if (filterMode === "short") return altInfo.status === "short";
      if (filterMode === "long") return altInfo.status === "long";
      if (filterMode === "duplicates") return dupIds.has(img.id);
      return true;
    });
    next = next.sort((a, b) => {
      if (sortMode === "newest") {
        return (new Date(b.createdAt || b.created_at || b.createdat || 0).getTime()) - (new Date(a.createdAt || a.created_at || a.createdat || 0).getTime());
      }
      if (sortMode === "oldest") {
        return (new Date(a.createdAt || a.created_at || a.createdat || 0).getTime()) - (new Date(b.createdAt || b.created_at || b.createdat || 0).getTime());
      }
      if (sortMode === "score") {
        return (b.score || 0) - (a.score || 0);
      }
      if (sortMode === "length") {
        return (resolveAlt(b)?.length || 0) - (resolveAlt(a)?.length || 0);
      }
      return 0;
    });
    setFilteredImages(next);
  }, [images, filterMode, sortMode]);

  useEffect(() => {
    const baseWindow = 120;
    setVisibleCount(Math.min(filteredImages.length || baseWindow, baseWindow));
  }, [filteredImages]);

  // Initial observability pull for hooks
  useEffect(() => {
    handleFetchHookMetrics();
  }, []);

  const handleAiImproveSelected = async () => {
    if (!ensureWriter("run AI updates")) return;
    if (!selectedImageIds.length) {
      setError("Select at least one image to improve");
      return;
    }
    if (!enforceWritePace("apply")) return;
    const selected = images.filter(img => selectedImageIds.includes(img.id));
    if (!selected.length) {
      setError("No matching images found for selection");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const oldValues = selected.map(img => ({ id: img.id, altText: resolveAlt(img) }));
      const items = selected.map(img => ({
        input: resolveAlt(img) || "Product image",
        url: img.url,
        locale,
        tone,
        verbosity,
        keywords: keywords || undefined,
        brandTerms: brandTerms || undefined,
        safeMode,
        variantCount: 1,
      }));

      const { data } = await fetchJson("/api/image-alt-media-seo/ai/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, locale, safeMode, keywords, brandTerms, tone, verbosity, variantCount: 1 })
      });

      const updates = (data.results || []).map((r, idx) => {
        const id = selected[idx]?.id || r.id;
        const altText = r.altText || r.result || r.output || r.text || r.raw || resolveAlt(r);
        return id && altText ? { id, altText } : null;
      }).filter(Boolean);

      if (updates.length) {
        await fetchJson("/api/image-alt-media-seo/images/bulk-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: updates })
        });
        saveUndo("ai", oldValues);
        showToast(`AI improved ${updates.length} images`);
        recordAction("ai-improve", updates.length, { ids: selectedImageIds.slice(0, 20) });
        await fetchImages();
      } else {
        setError("AI did not return any alt text");
      }
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message || "AI improve failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSelected = async (variantListOverride = null) => {
    if (!roleCanSimulate) {
      setError("Role cannot simulate. Switch to reviewer/editor/admin.");
      showToast("Switch role to simulate", 1600);
      return;
    }
    if (!selectedImageIds.length) {
      setError("Select at least one image to simulate");
      return;
    }
    const selected = images.filter(img => selectedImageIds.includes(img.id));
    if (!selected.length) {
      setError("No matching images found for selection");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const variantsToRun = (variantListOverride && variantListOverride.length) ? variantListOverride : [tone];
      const allResults = [];
      const summaries = [];
      for (const variantTone of variantsToRun) {
        const items = selected.map(img => ({
          input: resolveAlt(img) || "Product image",
          url: img.url,
          locale,
          tone: variantTone,
          verbosity,
          keywords: keywords || undefined,
          brandTerms: brandTerms || undefined,
          safeMode,
          variantCount: 1,
          originalAlt: resolveAlt(img),
        }));
        const { data } = await fetchJson("/api/image-alt-media-seo/ai/batch-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, locale, safeMode, keywords, brandTerms, tone: variantTone, verbosity, variantCount: 1, simulateOnly: true })
        });
        const variantResults = (data.results || []).map(r => ({ ...r, promptVariant: variantTone }));
        allResults.push(...variantResults);
        if (data.summary) summaries.push({ variant: variantTone, hitRateAvg: data.summary.hitRateAvg, hitRate: data.summary.hitRateAvg });
      }
      const avgHit = summaries.length ? Math.round(summaries.reduce((acc, s) => acc + (s.hitRateAvg || 0), 0) / summaries.length) : null;
      setSimulationResults(allResults);
      setSimulationSummary(summaries.length ? { variants: summaries, hitRateAvg: avgHit } : null);
      showToast("Simulation ready", 1800);
      recordAction("simulate", selected.length * variantsToRun.length, { ids: selectedImageIds.slice(0, 20), variants: variantsToRun });
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message || "Simulation failed");
      setSimulationResults([]);
      setSimulationSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateSelected = async apply => {
    if (!selectedImageIds.length) {
      setError("Select at least one image to translate");
      return;
    }
    const selected = images.filter(img => selectedImageIds.includes(img.id));
    if (!selected.length) {
      setError("No matching images found for selection");
      return;
    }
    if (apply && !ensureWriter("apply translations")) return;
    if (apply && !enforceWritePace("apply")) return;
    setLoading(true);
    setError("");
    try {
      const items = selected.map(img => ({ id: img.id, altText: resolveAlt(img), url: img.url }));
      const { data } = await fetchJson("/api/image-alt-media-seo/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLocale: translateLocale, items })
      });
      setTranslationResults(data.results || []);
      if (apply) {
        const updates = (data.results || []).filter(r => r.ok && r.id && r.altText).map(r => ({ id: r.id, altText: r.altText }));
        if (updates.length) {
          const oldValues = selected.map(img => ({ id: img.id, altText: resolveAlt(img) }));
          await fetchJson("/api/image-alt-media-seo/images/bulk-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: updates })
          });
          saveUndo("bulk", oldValues);
          recordAction("translate-apply", updates.length, { ids: selectedImageIds.slice(0, 20), locale: translateLocale });
          showToast(`Translated ${updates.length} alts`);
          await fetchImages();
        }
      } else {
        showToast("Translations preview ready", 1800);
      }
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message || "Translation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVisionCheck = async () => {
    if (!selectedImageIds.length) {
      setError("Select at least one image for QC");
      return;
    }
    const selected = images.filter(img => selectedImageIds.includes(img.id));
    if (!selected.length) {
      setError("No matching images found for selection");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const items = selected.map(img => ({ id: img.id, altText: resolveAlt(img), url: img.url }));
      const { data } = await fetchJson("/api/image-alt-media-seo/vision/qc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      const enriched = (data.results || []).map(r => ({
        ...r,
        risk: r.mismatch ? "mismatch" : "ok",
        overlapScore: typeof r.overlap === 'number' ? r.overlap : null,
      }));
      setVisionResults(enriched);
      showToast("QC results ready", 1600);
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message || "QC failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAiRewriteSingle = async img => {
    if (!ensureWriter("rewrite alt text")) return;
    if (!img?.id) return;
    const oldValue = { id: img.id, altText: resolveAlt(img) };
    setRewritingId(img.id);
    setError("");
    try {
      const payload = {
        input: resolveAlt(img) || "Product image",
        url: img.url,
        locale,
        tone,
        verbosity,
        keywords: keywords || undefined,
        brandTerms: brandTerms || undefined,
        safeMode,
        variantCount: 1,
      };
      const { data } = await fetchJson("/api/image-alt-media-seo/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const altText = data.altText || data.result || data.output || data.text || data.raw || resolveAlt(data);
      if (!altText) throw new Error("AI did not return alt text");
      await fetchJson("/api/image-alt-media-seo/images/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: img.id, altText }] })
      });
      saveUndo("ai", [oldValue]);
      showToast("AI rewrite applied");
      await fetchImages();
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message || "AI rewrite failed");
    } finally {
      setRewritingId(null);
    }
  };

  const handleSimilaritySearch = async () => {
    const q = similarityQuery.trim();
    if (!q) {
      setError("Enter text to find similar alt tags");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("limit", String(Math.min(Math.max(Number(similarityLimit) || 5, 1), 50)));
      const { data } = await fetchJson(`/api/image-alt-media-seo/images/similar?${params.toString()}`);
      setSimilarityResults(data.items || []);
      setSimilarityDownloadUrl("");
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSimilarCsv = async () => {
    const q = similarityQuery.trim();
    if (!q) {
      setError("Enter text to find similar alt tags");
      return;
    }
    try {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("limit", String(Math.min(Math.max(Number(similarityLimit) || 5, 1), 50)));
      params.set("format", "csv");
      const res = await fetch(`/api/image-alt-media-seo/images/similar?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setSimilarityDownloadUrl(url);
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      showToast("Similarity CSV ready", 1600);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildFilterParams();
      const qs = params.toString();
      const { data } = await fetchJson(`/api/image-alt-media-seo/analytics${qs ? `?${qs}` : ""}`);
      setAnalytics(data.analytics ? { ...data.analytics, cached: data.cached } : null);
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissing = async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildFilterParams();
      const qs = params.toString();
      const { data } = await fetchJson(`/api/image-alt-media-seo/analytics/missing${qs ? `?${qs}` : ""}`);
      setMissingReport(data);
      makeDownloadUrl(data, "missing.json", setMissingDownloadUrl);
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLengthBands = async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildFilterParams();
      const qs = params.toString();
      const { data } = await fetchJson(`/api/image-alt-media-seo/analytics/length-bands${qs ? `?${qs}` : ""}`);
      setLengthBands(data);
      makeDownloadUrl(data, "length-bands.json", setLengthDownloadUrl);
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDuplicates = async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildFilterParams();
      const qs = params.toString();
      const { data } = await fetchJson(`/api/image-alt-media-seo/analytics/duplicates${qs ? `?${qs}` : ""}`);
      setDuplicates(data);
      makeDownloadUrl(data, "duplicates.json", setDuplicatesDownloadUrl);
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch meta presets and limits
  const fetchMeta = async () => {
    try {
      const res = await fetch("/api/image-alt-media-seo/meta");
      const json = await res.json().catch(() => ({}));
      if (!json.ok) return;
      setMeta(json);
      if (json.presets?.tone?.includes(tone)) {
        // keep
      } else if (json.presets?.tone?.length) {
        setTone(json.presets.tone[0]);
      }
      if (json.presets?.verbosity?.includes(verbosity)) {
        // keep
      } else if (json.presets?.verbosity?.length) {
        setVerbosity(json.presets.verbosity[0]);
      }
      if (typeof json.presets?.safeModeDefault === "boolean") {
        setSafeMode(json.presets.safeModeDefault);
      }
    } catch (_) {
      // best-effort
    }
  };

  const handleBatchGenerate = async () => {
    setLoading(true);
    setError("");
    resetBatchState();
    try {
      let items;
      try {
        items = JSON.parse(batchInput);
      } catch (parseErr) {
        throw new Error("Batch input must be valid JSON array");
      }
      if (!Array.isArray(items) || !items.length) throw new Error("Provide at least one item");
      const totalItems = items.length;
      const step = Math.max(1, Math.round((chunkSize / totalItems) * 100));
      if (batchProgressTimer.current) {
        clearInterval(batchProgressTimer.current);
      }
      setBatchProgress(0);
      batchProgressTimer.current = setInterval(() => {
        setBatchProgress(prev => Math.min(95, prev + step));
      }, Math.max(300, paceMs || 400));

      const { data } = await fetchJson("/api/image-alt-media-seo/ai/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, locale, safeMode, keywords, brandTerms, tone, verbosity, chunkSize, paceMs, variantCount: batchVariantCount })
      });
      setBatchResults(data.results || []);
      setBatchSummary(data.summary || null);
      setBatchProgress(100);
      try {
        const blob = new Blob([JSON.stringify(data.results || [], null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        setBatchDownloadUrl(url);
        setTimeout(() => URL.revokeObjectURL(url), 120000);
      } catch (_) {
        setBatchDownloadUrl("");
      }
      showToast("Batch completed");
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
      setBatchProgress(0);
    } finally {
      setLoading(false);
      if (batchProgressTimer.current) {
        clearInterval(batchProgressTimer.current);
        batchProgressTimer.current = null;
      }
    }
  };

  const handleCopyBatchResults = async () => {
    if (!batchResults?.length) return;
    try {
      setBatchCopying(true);
      await navigator.clipboard.writeText(JSON.stringify(batchResults, null, 2));
      showToast("Batch results copied");
    } catch (err) {
      setError("Copy failed: " + err.message);
    } finally {
      setBatchCopying(false);
    }
  };

  const handleCopyText = async (text, label = "Copied") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch (err) {
      setError("Copy failed: " + err.message);
    }
  };

  const applyVariant = idx => {
    const v = (variants || [])[idx];
    if (!v) return;
    setSelectedVariantIdx(idx);
    const safeAlt = safeMode ? (v.lint?.redactedAlt || v.lint?.sanitizedAlt || v.altText) : (v.lint?.sanitizedAlt || v.altText);
    setResult(safeAlt || "");
    setLint(v.lint || null);
    setGrade(v.grade || null);
    setSanitized(v.lint?.sanitizedAlt || "");
    showToast(`Applied ${v.label || `Variant ${idx + 1}`}`);
  };

  const handleLintOnly = async () => {
    setLoading(true);
    setError("");
    setLintOnlyResult(null);
    setLintOnlyGrade(null);
    try {
      const { data } = await fetchJson("/api/image-alt-media-seo/lint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText: lintOnlyText, keywords: lintOnlyKeywords, brandTerms: lintOnlyBrandTerms, locale })
      });
      setLintOnlyResult(data.lint || null);
      setLintOnlyGrade(data.grade || null);
      showToast("Linted alt text");
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBatchItem = async (item, altOverride) => {
    const altToSave = altOverride || item?.result;
    if (!altToSave) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchJson("/api/image-alt-media-seo/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.meta?.url, altText: altToSave })
      });
      fetchImages();
      showToast("Saved batch item");
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // AI Generate
  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult("");
    setLint(null);
    setGrade(null);
    setSanitized("");
    setVariants([]);
    setSelectedVariantIdx(0);
    try {
      const { data } = await fetchJson("/api/image-alt-media-seo/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, url: imageUrl, keywords, brandTerms, tone, verbosity, locale, safeMode, productTitle, attributes, shotType, variant, focus, scene, variantCount })
      });
      setResult(data.result || "No alt text generated");
      setLint(data.lint || null);
      setGrade(data.grade || null);
      setVariants(data.variants || []);
      setSelectedVariantIdx(0);
      setSanitized(data.sanitized || "");
      fetchImages();
      showToast("Generated and linted alt text");
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCaption = async () => {
    setLoading(true);
    setError("");
    setCaptionResult("");
    setCaptionLint(null);
    setCaptionSanitized("");
    try {
      const { data } = await fetchJson("/api/image-alt-media-seo/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, url: imageUrl, keywords, brandTerms, locale, safeMode, productTitle, attributes, shotType, variant, focus, scene })
      });
      setCaptionResult(data.caption || "");
      setCaptionLint(data.lint || null);
      setCaptionSanitized(data.sanitized || "");
      showToast("Caption generated");
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // CRUD
  const handleAddImage = async () => {
    if (!ensureWriter("save alt text")) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchJson("/api/image-alt-media-seo/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl, altText: result })
      });
      fetchImages();
      showToast("Alt text saved");
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import/Export
  const handleImport = e => {
    if (!ensureWriter("import alt text")) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        setImportErrorDownloadUrl("");
        setImportErrorCount(0);
        const payload = JSON.parse(evt.target.result);
        const dryRes = await fetch("/api/image-alt-media-seo/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: payload, dryRun: true, errorExport: true })
        });
        const dryJson = await dryRes.json().catch(() => ({}));
        if (!dryJson.ok) {
          if (dryJson.errors) {
            try {
              const blob = new Blob([JSON.stringify(dryJson.errors, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              setImportErrorDownloadUrl(url);
              setImportErrorCount(dryJson.errors.length || 0);
              setTimeout(() => URL.revokeObjectURL(url), 120000);
            } catch (_) {}
            throw new Error("Import validation failed; download errors JSON for details");
          }
          throw new Error(dryJson.error || `HTTP ${dryRes.status}`);
        }
        const { data: dataApply } = await fetchJson("/api/image-alt-media-seo/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: payload })
        });
        setImported(file.name);
        setImportErrorCount(0);
        fetchImages();
        showToast(`Imported ${file.name}`);
      } catch (err) {
        if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
        else setError(err.message);
      }
    };
    reader.readAsText(file);
  };
  const handleExportJson = async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildFilterParams();
      const qs = params.toString();
      const res = await fetch(`/api/image-alt-media-seo/export${qs ? `?${qs}` : ""}`);
      const json = await res.json().catch(() => ({}));
      if (!json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const blob = new Blob([JSON.stringify(json.items || [], null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      setExported(url);
      setExportFilename("images.json");
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      showToast("Export ready");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (collectionFilter.trim()) params.set("collection", collectionFilter.trim());
      if (vendorFilter.trim()) params.set("vendor", vendorFilter.trim());
      params.set("includeHeaders", includeHeaders ? "true" : "false");
      const qs = params.toString();
      const res = await fetch(`/api/image-alt-media-seo/export/csv${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setExported(url);
      setExportFilename("image-alt-media.csv");
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      showToast("CSV export ready");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResult = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    setResultDownloadUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    showToast("Download link ready");
  };

  const handleCopyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      showToast("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Copy failed: " + err.message);
    }
  };

  const loadSampleBatch = () => {
    setBatchInput(`[
  { "input": "red leather tote on white background", "url": "https://cdn.shopify.com/red-tote.jpg", "keywords": "leather tote, handbag", "brandTerms": "aurawear", "tone": "balanced", "verbosity": "balanced" },
  { "input": "matte black smartwatch with silicone band, side view", "url": "https://cdn.shopify.com/black-watch.png", "keywords": "smartwatch, wearable", "brandTerms": "aurawear", "tone": "minimalist", "verbosity": "terse" }
]`);
  };

  const applyLocalePreset = value => {
    setLocale(value);
    showToast(`Locale set to ${value}`, 1800);
  };

  const applyBundle = key => {
    const bundle = (meta?.presets?.bundles || []).find(b => b.key === key);
    if (!bundle) {
      setSelectedBundle("custom");
      return;
    }
    setTone(bundle.tone);
    setVerbosity(bundle.verbosity);
    setSelectedBundle(bundle.key);
    showToast(`Applied ${bundle.description || bundle.key}`, 1800);
  };

  // Onboarding
  const onboardingContent = (
    <div style={{ padding: 24, background: "#23263a", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Image Alt Media SEO</h3>
      <ul style={{ margin: "16px 0 0 18px", color: "#a3e635", fontSize: 16 }}>
        <li>Generate, import, and manage image alt text with AI</li>
        <li>Analyze performance with real-time analytics</li>
        <li>Collaborate and share with your team</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#a3e635", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  React.useEffect(() => {
    hydrateState();
    fetchImages();
    fetchAnalytics();
    fetchMissing();
    fetchLengthBands();
    fetchDuplicates();
    fetchMeta();
    fetch("/api/image-alt-media-seo/runs")
      .then(r => r.json())
      .then(d => { if (d.ok) setRuns(d.runs || []); })
      .catch(() => {});
    return () => {
      if (batchProgressTimer.current) {
        clearInterval(batchProgressTimer.current);
      }
    };
  }, []);

  // Debounced search to avoid rapid network churn while typing
  useEffect(() => {
    const trimmed = imageSearch.trim();
    if (!searchReadyRef.current) {
      searchReadyRef.current = true;
      return () => {};
    }
    const timer = setTimeout(() => {
      fetchImages(0, imageLimit, trimmed);
    }, 420);
    return () => clearTimeout(timer);
  }, [imageSearch, imageLimit]);

  // Periodic hook metrics refresh for observability
  useEffect(() => {
    const id = setInterval(() => {
      handleFetchHookMetrics();
    }, 60000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (!shopDomain.trim()) {
      const fromUrl = getShopFromQuery();
      if (fromUrl) setShopDomain(fromUrl.toLowerCase());
    }
  }, [shopDomain]);

  useEffect(() => {
    if (!stateHydrated) return undefined;
    const timer = setTimeout(() => {
      persistState();
    }, 400);
    return () => clearTimeout(timer);
  }, [approvalQueue, actionLog, stateHydrated]);

  const totalImagePages = imageLimit ? Math.max(1, Math.ceil(imageTotal / imageLimit)) : 1;
  const currentImagePage = imageLimit ? Math.floor(imageOffset / imageLimit) + 1 : 1;
  const missingPct = analytics?.totalImages ? Math.round(((analytics?.missingAlt || 0) / analytics.totalImages) * 100) : 0;
  const duplicatePct = analytics?.totalImages ? Math.round(((analytics?.duplicateAlts || 0) / analytics.totalImages) * 100) : 0;
  const inRangePct = (() => {
    if (!lengthBands?.bands || !lengthBands?.total) return null;
    const bands = lengthBands.bands || [];
    const mid = bands.filter(b => b.label !== '0-24' && b.label !== '161+').reduce((acc, b) => acc + (b.count || 0), 0);
    return Math.round((mid / (lengthBands.total || 1)) * 100);
  })();
  const coverageProgress = [
    { label: 'Missing', value: missingPct, target: coverageGoals.missing, good: missingPct <= coverageGoals.missing },
    { label: 'Duplicates %', value: duplicatePct, target: coverageGoals.duplicatesPct, good: duplicatePct <= coverageGoals.duplicatesPct },
    { label: 'Length in range %', value: typeof inRangePct === 'number' ? inRangePct : analytics?.coveragePct ?? 0, target: coverageGoals.inRangePct, good: (typeof inRangePct === 'number' ? inRangePct : analytics?.coveragePct ?? 0) >= coverageGoals.inRangePct },
  ];
  const issueStats = (() => {
    const total = filteredImages.length || 1; // avoid divide-by-zero
    let missing = 0;
    let short = 0;
    let long = 0;
    let ok = 0;
    let duplicate = 0;
    filteredImages.forEach(img => {
      const info = lintAltText(resolveAlt(img));
      if (info.status === "missing") missing += 1;
      else if (info.status === "short") short += 1;
      else if (info.status === "long") long += 1;
      else ok += 1;
      if (duplicateAltIds.has(img.id)) duplicate += 1;
    });
    const toPct = (num) => Math.round((num / total) * 100);
    return {
      total: filteredImages.length,
      missing,
      short,
      long,
      ok,
      duplicate,
      missingPct: toPct(missing),
      shortPct: toPct(short),
      longPct: toPct(long),
      duplicatePct: toPct(duplicate),
      okPct: toPct(ok),
    };
  })();

  const visibleImages = filteredImages.slice(0, visibleCount);

  return (
    <div style={{ padding: 0, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)", padding: "32px 40px", marginBottom: 32, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.2)", letterSpacing: "-0.02em" }}>✨ Image Alt & SEO Autopilot</h2>
        <p style={{ fontSize: 14, margin: "8px 0 0 0", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>AI-powered alt text generation, translation & Shopify sync</p>
      </div>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 40px" }}>

      {(result || captionResult) && (
        <div style={{ display: "grid", gridTemplateColumns: captionResult ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 12 }}>
          {result ? (
            <div style={{ background: "#23263a", borderRadius: 10, padding: 16, color: "#a3e635" }} aria-live="polite">
              <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Alt Text</div>
              <div>{result}</div>
              {lint && (
                <div style={{ marginTop: 8, fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>Lint:</span> {lint.withinRange ? "Length OK" : `Length ${lint.length}`}
                  <div style={{ marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>Issues: {lint.issueCount ?? lint.issues?.length ?? 0}</span>
                    <span>Warnings: {lint.warningCount ?? lint.warnings?.length ?? 0}</span>
                    <span>Total: {lint.totalFindings ?? ((lint.issues?.length || 0) + (lint.warnings?.length || 0))}</span>
                  </div>
                  {lint.issues?.length ? <ul style={{ margin: "6px 0 0 18px" }}>{lint.issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <span style={{ marginLeft: 8 }}>No issues detected</span>}
                  {lint.redactedAlt && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 600 }}>Redacted suggestion:</span> {lint.redactedAlt}
                      <button onClick={() => setResult(lint.redactedAlt)} style={{ marginLeft: 8, background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>Apply</button>
                    </div>
                  )}
                  {sanitized && sanitized !== result && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 600 }}>Sanitized:</span> {sanitized}
                      <button onClick={() => setResult(sanitized)} style={{ marginLeft: 8, background: "#a3e635", color: "#23263a", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>Use sanitized</button>
                    </div>
                  )}
                </div>
              )}
              {grade && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700 }}>Grade:</span>
                  <span style={{ padding: "4px 10px", borderRadius: 8, background: grade.grade === 'A' ? '#22c55e' : grade.grade === 'B' ? '#84cc16' : grade.grade === 'C' ? '#fbbf24' : '#ef4444', color: '#0b0b0b', fontWeight: 800 }}>{grade.grade} ({grade.score})</span>
                </div>
              )}
              {variants?.length ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Variants ({variants.length})</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {variants.map((v, idx) => {
                      const issues = v.lint?.issueCount ?? v.lint?.issues?.length ?? 0;
                      const warnings = v.lint?.warningCount ?? v.lint?.warnings?.length ?? 0;
                      return (
                        <div key={`${v.label || 'v'}-${idx}`} style={{ border: selectedVariantIdx === idx ? "2px solid #0ea5e9" : "1px solid #555", borderRadius: 10, padding: 10, background: "#1f2937" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700 }}>{v.label || `Variant ${idx + 1}`}</span>
                            {v.grade ? <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 8, background: v.grade.grade === 'A' ? '#22c55e' : v.grade.grade === 'B' ? '#84cc16' : v.grade.grade === 'C' ? '#fbbf24' : '#ef4444', color: '#0b0b0b', fontWeight: 800 }}>{v.grade.grade} ({v.grade.score})</span> : null}
                          </div>
                          <div style={{ fontSize: 14, marginBottom: 6 }}>{v.altText}</div>
                          <div style={{ fontSize: 12, color: "#a3e635", marginBottom: 8 }}>Issues {issues}; Warnings {warnings}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button onClick={() => applyVariant(idx)} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Use</button>
                            <button onClick={() => handleCopyText(v.altText, "Variant copied") } style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Copy</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={handleCopyResult} disabled={!result} style={{ background: "#14b8a6", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{copied ? "Copied" : "Copy"}</button>
                <button onClick={handleDownloadResult} disabled={!result} style={{ background: "#e0f2fe", color: "#0f172a", border: "1px solid #bae6fd", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Download .txt</button>
                {resultDownloadUrl && <a href={resultDownloadUrl} download="alt-text.txt" style={{ alignSelf: "center", color: "#0ea5e9", fontWeight: 700 }}>Save file</a>}
              </div>
            </div>
          ) : null}

          {captionResult ? (
            <div style={{ background: "#1f2937", borderRadius: 10, padding: 16, color: "#a3e635" }} aria-live="polite">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>AI Caption</div>
              <div style={{ marginBottom: 6 }}>{captionResult}</div>
              {captionLint && (
                <div style={{ fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Length:</span> {captionLint.length}; Issues {captionLint.issueCount ?? captionLint.issues?.length ?? 0}; Warnings {captionLint.warningCount ?? captionLint.warnings?.length ?? 0}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => handleCopyText(captionResult, "Caption copied")} style={{ background: "#14b8a6", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Copy caption</button>
                {captionSanitized && captionSanitized !== captionResult ? (
                  <button onClick={() => setCaptionResult(captionSanitized)} style={{ background: "#e0f2fe", color: "#0f172a", border: "1px solid #bae6fd", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Use sanitized</button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
      <div>
        <input
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="Image URL (optional but recommended)"
          aria-label="Image URL"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}
        />

        {simulationResults?.length ? (
          <div style={{ marginBottom: 12, background: "#0f172a", borderRadius: 10, padding: 12, border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ fontWeight: 700 }}>Simulation ({simulationResults.length}) {simulationSummary?.hitRateAvg ? `· Hit rate ~${simulationSummary.hitRateAvg}%` : ''}</div>
              <button onClick={() => { setSimulationResults([]); setSimulationSummary(null); }} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Clear</button>
            </div>
            {simulationSummary?.variants?.length ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6, fontSize: 12, color: "#cbd5e1" }}>
                {simulationSummary.variants.map(v => (
                  <span key={v.variant} style={{ background: "#111827", border: "1px solid #334155", padding: "4px 8px", borderRadius: 8 }}>{v.variant}: {v.hitRate ?? v.hitRateAvg ?? "-"}%</span>
                ))}
              </div>
            ) : null}
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {simulationResults.slice(0, 10).map((r, idx) => (
                <li key={`sim-${idx}`} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{r.ok ? "OK" : "Error"} · {r.meta?.url ? shortenUrl(r.meta.url) : 'Item'} {typeof r.hitRate === 'number' ? `· Hit ${r.hitRate}%` : ''} {r.promptVariant ? `· ${r.promptVariant}` : ''}</div>
                  {r.error ? <div style={{ color: "#f87171" }}>{r.error}</div> : null}
                  {r.result ? <div style={{ fontSize: 13 }}>Suggested: {r.result}</div> : null}
                  {r.diff ? <div style={{ fontSize: 12, color: "#cbd5e1" }}>Δlen {r.diff.lengthDelta}; overlap {r.diff.overlap}</div> : null}
                </li>
              ))}
              {simulationResults.length > 10 ? <li style={{ fontSize: 12, color: "#94a3b8" }}>Showing first 10</li> : null}
            </ul>
          </div>
        ) : null}

        {translationResults?.length ? (
          <div style={{ marginBottom: 12, background: "#0f172a", borderRadius: 10, padding: 12, border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ fontWeight: 700 }}>Translations ({translationResults.length}) → {translateLocale}</div>
              <button onClick={() => setTranslationResults([])} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Clear</button>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {translationResults.slice(0, 10).map((t, idx) => (
                <li key={`tr-${idx}`} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 13 }}>{t.altText || t.error || '(none)'} {t.ok === false ? <span style={{ color: "#f87171" }}>error</span> : null}</div>
                  {t.lint ? <div style={{ fontSize: 12, color: "#cbd5e1" }}>Len {t.lint.length}; Issues {t.lint.issueCount}; Findings {t.lint.totalFindings}</div> : null}
                </li>
              ))}
              {translationResults.length > 10 ? <li style={{ fontSize: 12, color: "#94a3b8" }}>Showing first 10</li> : null}
            </ul>
          </div>
        ) : null}

        {visionResults?.length ? (
          <div style={{ marginBottom: 12, background: "#0f172a", borderRadius: 10, padding: 12, border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ fontWeight: 700 }}>Vision QC ({visionResults.length})</div>
              <button onClick={() => setVisionResults([])} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Clear</button>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8, fontSize: 12, color: "#cbd5e1" }}>
              <span>Filter</span>
              <select value={visionFilter} onChange={e => setVisionFilter(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "#e2e8f0" }}>
                <option value="all">All</option>
                <option value="mismatch">Mismatches</option>
                <option value="ok">Aligned</option>
                <option value="low-overlap">Low overlap (&lt;0.5)</option>
              </select>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {visionResults.filter(v => {
                if (visionFilter === "mismatch") return v.mismatch;
                if (visionFilter === "ok") return !v.mismatch;
                if (visionFilter === "low-overlap") return typeof v.overlapScore === 'number' && v.overlapScore < 0.5;
                return true;
              }).slice(0, 10).map((v, idx) => (
                <li key={`qc-${idx}`} style={{ marginBottom: 10, background: "#0b1220", borderRadius: 8, padding: 10, border: "1px solid #334155" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ flex: "0 0 120px" }}>
                      {v.url ? (
                        <img src={v.url} alt="Vision sample" loading="lazy" style={{ width: 120, height: 120, objectFit: "contain", borderRadius: 8, background: "#0b0b0b" }} />
                      ) : (
                        <div style={{ width: 120, height: 120, borderRadius: 8, background: "#111827", border: "1px dashed #555", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>
                          No image
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: v.mismatch ? "#f97316" : "#a3e635" }}>
                        {v.mismatch ? "Mismatch" : "Looks aligned"} · overlap {v.overlap}
                      </div>
                      <div style={{ fontSize: 12, color: "#cbd5e1" }}>{v.url ? shortenUrl(v.url) : '(no url)'}</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>{v.altText || '(none)'}</div>
                    </div>
                  </div>
                </li>
              ))}
              {visionResults.length > 10 ? <li style={{ fontSize: 12, color: "#94a3b8" }}>Showing first 10</li> : null}
            </ul>
          </div>
        ) : null}
        <input
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="Keywords (comma separated)"
          aria-label="Keywords"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635", marginTop: 10 }}
        />
        <input
          value={brandTerms}
          onChange={e => setBrandTerms(e.target.value)}
          placeholder="Brand vocabulary (comma separated)"
          aria-label="Brand terms"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635", marginTop: 10, marginBottom: 14 }}
        />
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8, color: "#a3e635", fontSize: 13 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Role
            <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}>
              <option value="admin">admin</option>
              <option value="editor">editor</option>
              <option value="reviewer">reviewer</option>
              <option value="viewer">viewer</option>
            </select>
          </label>
          <span style={{ fontSize: 12, color: roleCanWrite ? "#a3e635" : "#f97316" }}>
            {roleCanWrite ? "Write actions enabled" : roleCanApprove ? "Reviewer: approve only, no apply" : "Read-only"}
          </span>
        </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10, fontSize: 12, color: "#cbd5e1" }}>
            <span style={{ fontWeight: 700, color: "#e2e8f0" }}>Prompt variants for simulation</span>
            {simulationTones.map(opt => {
              const checked = simulateVariants.includes(opt.key);
              return (
                <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 4, background: checked ? "#0ea5e9" : "#1f2937", color: checked ? "#0b0b0b" : "#e2e8f0", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => {
                      if (e.target.checked) setSimulateVariants(prev => Array.from(new Set([...prev, opt.key])));
                      else setSimulateVariants(prev => prev.filter(k => k !== opt.key));
                    }}
                    aria-label={`Include ${opt.label} variant`}
                  />
                  {opt.label}
                </label>
              );
            })}
            <button onClick={() => handleSimulateSelected(simulateVariants.length ? simulateVariants : null)} aria-label="Simulate with selected prompt variants" disabled={!roleCanSimulate || !selectedImageIds.length || loading} style={{ background: roleCanSimulate ? "#e0e7ff" : "#334155", color: roleCanSimulate ? "#1e293b" : "#94a3b8", border: "1px solid #c7d2fe", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: (!roleCanSimulate || !selectedImageIds.length || loading) ? "not-allowed" : "pointer" }}>Run sim (variants)</button>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Runs each variant separately and aggregates.</span>
          </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Images</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={imageSearch}
                onChange={e => setImageSearch(e.target.value)}
                onKeyDown={handleImageSearchKeyDown}
                placeholder="Search URL or alt text"
                aria-label="Search images"
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635", minWidth: 180 }}
              />
              <button onClick={handleImageSearchSubmit} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Search</button>
              <button onClick={handleClearImageSearch} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Clear</button>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                Page size
                <select value={imageLimit} onChange={e => handleImageLimitChange(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}>
                  {[10, 20, 50, 100, 200].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <button onClick={() => fetchImages(imageOffset, imageLimit, imageSearch)} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Refresh</button>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{imageRefreshedAt ? `Updated ${new Date(imageRefreshedAt).toLocaleTimeString()}` : "Not loaded yet"}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={shopDomain}
                  onChange={e => setShopDomain(e.target.value)}
                  placeholder="shop.myshopify.com"
                  aria-label="Shopify shop domain"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635", minWidth: 180 }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  Max images
                  <input type="number" min={1} max={5000} value={shopifyMaxImages} onChange={e => setShopifyMaxImages(Math.min(Math.max(Number(e.target.value) || 1, 1), 5000))} style={{ width: 90, padding: "6px 8px", borderRadius: 8, border: "1px solid #555" }} />
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  Products
                  <input type="number" min={1} max={5000} value={shopifyProductLimit} onChange={e => setShopifyProductLimit(Math.min(Math.max(Number(e.target.value) || 1, 1), 5000))} style={{ width: 90, padding: "6px 8px", borderRadius: 8, border: "1px solid #555" }} />
                </label>
                <button onClick={handleImportShopify} disabled={shopifyImporting} style={{ background: "#10b981", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: shopifyImporting ? "wait" : "pointer" }}>{shopifyImporting ? "Importing..." : "Pull from Shopify"}</button>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={similarityQuery}
                  onChange={e => setSimilarityQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSimilaritySearch(); } }}
                  placeholder="Find similar alt text"
                  aria-label="Similarity search text"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635", minWidth: 200 }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  Top
                  <select value={similarityLimit} onChange={e => setSimilarityLimit(Math.min(Math.max(Number(e.target.value) || 5, 1), 50))} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}>
                    {[3, 5, 10, 20, 50].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <span>results</span>
                </label>
                <button onClick={handleSimilaritySearch} aria-label="Find similar alt text" style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Find similar</button>
              </div>
            </div>
          </div>
          {shopifyImportSummary ? (
            <div style={{ marginBottom: 10, fontSize: 13, color: "#a3e635" }}>
              <span>Shopify import:</span>
              <span style={{ marginLeft: 8 }}>Imported {shopifyImportSummary.imported}</span>
              <span style={{ marginLeft: 8 }}>Skipped {shopifyImportSummary.skipped}</span>
              <span style={{ marginLeft: 8 }}>Products scanned {shopifyImportSummary.productCount}</span>
            </div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10, fontSize: 13, color: "#a3e635" }}>
            <span>Showing {images.length} of {imageTotal} images</span>
            <span>Page {currentImagePage} / {totalImagePages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleImagePageChange(-1)} disabled={currentImagePage <= 1} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: currentImagePage <= 1 ? "not-allowed" : "pointer" }}>Prev</button>
              <button onClick={() => handleImagePageChange(1)} disabled={currentImagePage >= totalImagePages} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: currentImagePage >= totalImagePages ? "not-allowed" : "pointer" }}>Next</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10, fontSize: 13, color: "#a3e635" }}>
            <span role="status" aria-live="polite">Selected {selectedImageIds.length}</span>
            <button onClick={selectPageImages} aria-label="Select all images on this page" style={{ background: "#e0f2fe", color: "#0f172a", border: "1px solid #bae6fd", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: "pointer" }}>Select page</button>
            <button onClick={clearSelectedImages} aria-label="Clear selected images" disabled={!selectedImageIds.length} style={{ background: "#f8fafc", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: !selectedImageIds.length ? "not-allowed" : "pointer" }}>Clear selection</button>
            <button onClick={handlePushShopify} aria-label="Push selected alt text to Shopify" disabled={!selectedImageIds.length || shopifyPushing || loading} style={{ background: !selectedImageIds.length || shopifyPushing ? "#334155" : "#0ea5e9", color: "#f8fafc", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: (!selectedImageIds.length || shopifyPushing || loading) ? "not-allowed" : "pointer" }}>{shopifyPushing ? "Pushing…" : "Push to Shopify"}</button>
          </div>
          <div style={{ marginBottom: 24, background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", borderRadius: 20, padding: 24, border: "2px solid #475569", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 16, color: "#f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>🎯 Bulk Update</div>
            <textarea
              value={bulkAltText}
              onChange={e => setBulkAltText(e.target.value)}
              rows={3}
              aria-label="Bulk alt text"
              placeholder="Enter alt text to apply to selected images"
              style={{ width: "100%", fontSize: 14, padding: 16, borderRadius: 12, border: "2px solid #64748b", background: "#0f172a", color: "#e2e8f0", marginBottom: 12, transition: "all 0.2s", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "#8b5cf6"}
              onBlur={e => e.target.style.borderColor = "#64748b"}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={handleBulkApply} aria-label={`Apply alt text to ${selectedImageIds.length} selected images`} disabled={!roleCanApply || !selectedImageIds.length || !bulkAltText.trim() || loading} style={{ background: roleCanApply ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#334155", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: (!roleCanApply || !selectedImageIds.length || !bulkAltText.trim() || loading) ? "not-allowed" : "pointer", boxShadow: roleCanApply ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none", transition: "all 0.2s", transform: "translateY(0)" }} onMouseEnter={e => { if (roleCanApply && selectedImageIds.length && bulkAltText.trim() && !loading) e.target.style.transform = "translateY(-2px)"; }} onMouseLeave={e => e.target.style.transform = "translateY(0)"}>Apply to selected</button>
              <button onClick={handleAiImproveSelected} aria-label="Use AI to rewrite alt text for selected images" disabled={!roleCanApply || !selectedImageIds.length || loading} style={{ background: roleCanApply ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" : "#334155", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: (!roleCanApply || !selectedImageIds.length || loading) ? "not-allowed" : "pointer", boxShadow: roleCanApply ? "0 4px 12px rgba(139, 92, 246, 0.3)" : "none", transition: "all 0.2s", transform: "translateY(0)" }} onMouseEnter={e => { if (roleCanApply && selectedImageIds.length && !loading) e.target.style.transform = "translateY(-2px)"; }} onMouseLeave={e => e.target.style.transform = "translateY(0)"}>✨ AI improve</button>
              <button onClick={handleQueueBulkApproval} aria-label="Queue approval for bulk alt update" disabled={!roleCanApprove || !selectedImageIds.length || !bulkAltText.trim()} style={{ background: roleCanApprove ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "#334155", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: (!roleCanApprove || !selectedImageIds.length || !bulkAltText.trim()) ? "not-allowed" : "pointer", boxShadow: roleCanApprove ? "0 4px 12px rgba(245, 158, 11, 0.3)" : "none", transition: "all 0.2s" }}>📋 Request approval</button>
              <button onClick={handleUndo} aria-label="Undo last bulk or AI change" disabled={!undoBuffer.length || loading} title={undoBuffer.length ? `Undo (Ctrl+Z) - ${undoBuffer.length} action${undoBuffer.length > 1 ? 's' : ''} available` : "No actions to undo"} style={{ background: undoBuffer.length ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "#334155", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: (!undoBuffer.length || loading) ? "not-allowed" : "pointer", boxShadow: undoBuffer.length ? "0 4px 12px rgba(245, 158, 11, 0.3)" : "none", transition: "all 0.2s" }}>↩️ Undo ({undoBuffer.length})</button>
              {selectedImageIds.length ? <span style={{ fontSize: 12 }}>IDs: {selectedImageIds.slice(0, 6).join(', ')}{selectedImageIds.length > 6 ? '…' : ''}</span> : <span style={{ fontSize: 12 }}>Pick rows to enable bulk update</span>}
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Shortcuts: Ctrl+Shift+A (select all), Ctrl+Z (undo)</span>
            </div>
          </div>
          {similarityResults?.length ? (
            <div style={{ marginBottom: 12, background: "#111827", borderRadius: 10, padding: 12, border: "1px solid #555" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontWeight: 700 }}>Similar results for “{similarityQuery.trim()}” (top {similarityLimit})</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#a3e635" }}>Scores show token overlap</span>
                  <button onClick={handleDownloadSimilarCsv} aria-label="Download similar results as CSV" style={{ background: "#334155", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Download CSV</button>
                  {similarityDownloadUrl && <a href={similarityDownloadUrl} download="images-similar.csv" style={{ color: "#a3e635", fontWeight: 600 }}>Save CSV</a>}
                  <button onClick={() => setSimilarityResults([])} aria-label="Clear similar results" style={{ background: "#f8fafc", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Clear</button>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {similarityResults.map(item => (
                  <li key={item.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>Score {item.score}</span>
                      <button onClick={() => toggleSelectImage(item.id)} aria-pressed={selectedImageIds.includes(item.id)} aria-label={`Select image ${item.id} from similarity results`} style={{ background: selectedImageIds.includes(item.id) ? "#0ea5e9" : "#e2e8f0", color: selectedImageIds.includes(item.id) ? "#fff" : "#0b0b0b", border: selectedImageIds.includes(item.id) ? "none" : "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{selectedImageIds.includes(item.id) ? "Selected" : "Select"}</button>
                      <button onClick={() => setBulkAltText(item.altText || "")} style={{ background: "#fef9c3", color: "#0b0b0b", border: "1px solid #facc15", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Use alt for bulk</button>
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4 }}><b>ID:</b> {item.id}</div>
                    <div style={{ fontSize: 13 }}><b>Alt:</b> {item.altText || '(none)'}</div>
                    <div style={{ fontSize: 12, color: "#a3e635" }}><b>URL:</b> {item.url || '(none)'}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div style={{ marginBottom: 24, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 20, padding: 24, border: "2px solid #334155", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>📋 Approval Queue <span style={{ background: "#7c3aed", color: "#fff", fontSize: 12, padding: "2px 10px", borderRadius: 999, fontWeight: 700 }}>{approvalQueue.length}</span></div>
              <span style={{ fontSize: 12, color: "#cbd5e1" }}>{roleCanApply ? "Editors/Admins can apply" : roleCanApprove ? "Reviewers can approve; editors apply" : "View-only"}</span>
            </div>
            {approvalQueue.length ? (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {approvalQueue.slice(0, 15).map(entry => (
                  <li key={entry.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700 }}>{entry.label}</div>
                      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "#cbd5e1" }}>
                        <span>{entry.items.length} item(s)</span>
                        <span>Status: <span style={{ color: entry.status === "approved" ? "#22c55e" : entry.status === "rejected" ? "#f87171" : "#f59e0b" }}>{entry.status}</span></span>
                        <span>By {entry.requestedBy}</span>
                        <span>{new Date(entry.requestedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                      <button onClick={() => markApproval(entry.id, "approved")} disabled={!roleCanApprove || entry.status === "approved"} style={{ background: "#22c55e", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: (!roleCanApprove || entry.status === "approved") ? "not-allowed" : "pointer" }}>Approve</button>
                      <button onClick={() => markApproval(entry.id, "rejected")} disabled={!roleCanApprove} style={{ background: "#ef4444", color: "#f8fafc", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: !roleCanApprove ? "not-allowed" : "pointer" }}>Reject</button>
                      <button onClick={() => applyApproval(entry)} disabled={!roleCanApply || entry.status !== "approved" || loading} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: (!roleCanApply || entry.status !== "approved" || loading) ? "not-allowed" : "pointer" }}>Apply approved</button>
                      <span style={{ fontSize: 12, color: "#cbd5e1" }}>IDs: {entry.items.slice(0, 5).map(i => i.id).join(', ')}{entry.items.length > 5 ? '…' : ''}</span>
                    </div>
                  </li>
                ))}
                {approvalQueue.length > 15 ? <li style={{ fontSize: 12, color: "#94a3b8" }}>Showing first 15</li> : null}
              </ul>
            ) : (
              <div style={{ fontSize: 13, color: "#cbd5e1" }}>No approvals queued. Reviewers can approve; editors/admins can apply.</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#cbd5e1" }}>Filter</span>
              <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #555", background: "#111827", color: "#e2e8f0" }}>
                <option value="all">All</option>
                <option value="missing">Missing</option>
                <option value="short">Short</option>
                <option value="long">Long</option>
                <option value="duplicates">Duplicates</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#cbd5e1" }}>Sort</span>
              <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #555", background: "#111827", color: "#e2e8f0" }}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="score">Score</option>
                <option value="length">Alt length</option>
              </select>
            </div>
            <button onClick={() => {
              const ids = filteredImages.map(img => img.id).filter(Boolean);
              setSelectedImageIds(ids);
            }} style={{ background: "#0ea5e9", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Select all filtered ({filteredImages.length})
            </button>
            <button onClick={clearSelectedImages} style={{ background: "#1f2937", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 8, padding: "6px 10px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Clear selection
            </button>
          </div>
          <div style={{ marginBottom: 12, background: "#0b1220", borderRadius: 10, padding: 12, border: "1px solid #334155" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Action log (last 10)</div>
            {actionLog.length ? (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {actionLog.slice(-10).reverse().map((a, idx) => (
                  <li key={`${a.ts}-${idx}`} style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>{a.action}</span> · {a.count || 0} · role {a.role} · {new Date(a.ts).toLocaleTimeString()}
                    {a.label ? <> · {a.label}</> : null}
                  </li>
                ))}
              </ul>
            ) : <div style={{ fontSize: 12, color: "#94a3b8" }}>No actions yet.</div>}
          </div>
          <div style={{ marginBottom: 12, background: "#0b1220", borderRadius: 10, padding: 12, border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ fontWeight: 700 }}>Hooks observability</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={handleFetchHookMetrics} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Refresh</button>
                <button onClick={handleResetHookMetrics} disabled={!roleCanApply} style={{ background: roleCanApply ? "#f59e0b" : "#334155", color: roleCanApply ? "#0b0b0b" : "#94a3b8", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: roleCanApply ? "pointer" : "not-allowed" }}>Reset metrics</button>
                <button onClick={handleReplayHooks} disabled={!roleCanApply || webhookReplayStatus === "running"} style={{ background: roleCanApply ? "#0ea5e9" : "#334155", color: roleCanApply ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: (!roleCanApply || webhookReplayStatus === "running") ? "not-allowed" : "pointer" }}>{webhookReplayStatus === "running" ? "Replaying..." : "Replay last push"}</button>
              </div>
            </div>
            {hookMetrics ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "#cbd5e1" }}>
                <span style={{ background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px" }}>Push ok {hookMetrics.push?.success || 0} / err {hookMetrics.push?.error || 0}</span>
                <span style={{ background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px" }}>Pull ok {hookMetrics.pull?.success || 0} / err {hookMetrics.pull?.error || 0}</span>
                <span style={{ background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px" }}>AI improve ok {hookMetrics.aiImprove?.success || 0} / err {hookMetrics.aiImprove?.error || 0}</span>
                {hookMetrics.lastReplayAt ? <span style={{ background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px" }}>Last replay {new Date(hookMetrics.lastReplayAt).toLocaleTimeString()}</span> : null}
                {hookMetrics.lastPush ? <span style={{ background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px" }}>Last push items {hookMetrics.lastPush.length}</span> : null}
                {hookMetrics.persistedAt ? <span style={{ background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px" }}>Persisted {new Date(hookMetrics.persistedAt).toLocaleTimeString()}</span> : null}
              </div>
            ) : <div style={{ fontSize: 12, color: "#94a3b8" }}>Refresh to see hook metrics.</div>}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, fontSize: 12, color: "#cbd5e1" }}>
              {hookMetricsAt ? <span>Updated {new Date(hookMetricsAt).toLocaleTimeString()}</span> : <span>Not refreshed yet</span>}
              {hookMetricsError ? <span style={{ color: "#f87171" }}>Error: {hookMetricsError}</span> : null}
              {webhookReplayStatus ? <span>{webhookReplayStatus}</span> : null}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#cbd5e1", fontSize: 12, margin: "0 0 8px 0" }} aria-live="polite">
            <span>Showing {visibleImages.length} of {filteredImages.length} image(s)</span>
            {filteredImages.length > visibleImages.length ? (
              <button aria-label="Load 80 more images" onClick={() => setVisibleCount(c => Math.min(filteredImages.length, c + 80))} style={{ background: "#1f2937", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                Load 80 more
              </button>
            ) : null}
          </div>
          <ul style={{ paddingLeft: 18 }} aria-busy={loading} aria-live="polite">
            {visibleImages.map(img => {
              const lint = lintCache.get(img.id) || lintAltText(resolveAlt(img));
              return (
                <li key={img.id} style={{ marginBottom: 16, background: selectedImageIds.includes(img.id) ? "linear-gradient(135deg, #1e293b 0%, #334155 100%)" : "rgba(15, 23, 42, 0.5)", borderRadius: 16, padding: 16, border: selectedImageIds.includes(img.id) ? "2px solid #8b5cf6" : "1px solid #334155", color: "#e2e8f0", boxShadow: selectedImageIds.includes(img.id) ? "0 4px 16px rgba(139, 92, 246, 0.2)" : "0 2px 8px rgba(0,0,0,0.1)", transition: "all 0.2s", transform: "translateY(0)" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <input type="checkbox" checked={selectedImageIds.includes(img.id)} onChange={() => toggleSelectImage(img.id)} aria-label={`Select image ${img.id}`} />
                    <div style={{ position: "relative", flex: "0 0 140px", maxWidth: 160 }}>
                      {img.url ? (
                        <img
                          src={img.url}
                          alt={img.altText || "Shopify image"}
                          loading="lazy"
                          style={{ width: "100%", maxWidth: 150, maxHeight: 150, objectFit: "contain", borderRadius: 8, background: "#0b0b0b" }}
                        />
                      ) : (
                        <div style={{ width: 140, height: 120, borderRadius: 8, background: "#111827", border: "1px dashed #555", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>
                          No image
                        </div>
                      )}
                      <span style={{ position: "absolute", top: 6, left: 6, fontSize: 11, background: "#0ea5e9", color: "#0b0b0b", padding: "2px 6px", borderRadius: 999, fontWeight: 800 }}>{lint.label}</span>
                      {duplicateAltIds.has(img.id) ? <span style={{ position: "absolute", top: 6, right: 6, fontSize: 11, background: "#e11d48", color: "#f8fafc", padding: "2px 6px", borderRadius: 999, fontWeight: 800 }}>Dup</span> : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div><b>ID:</b> {img.id}</div>
                        {selectedImageIds.includes(img.id) ? <span style={{ fontSize: 11, background: "#0ea5e9", color: "#fff", padding: "2px 6px", borderRadius: 999 }}>Selected</span> : null}
                        {img.url ? <a href={img.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#38bdf8", textDecoration: "underline" }}>Open</a> : null}
                        <span style={{ fontSize: 11, background: lint.status === "ok" ? "#22c55e" : lint.status === "missing" ? "#ef4444" : lint.status === "short" ? "#f59e0b" : "#0ea5e9", color: "#0b0b0b", padding: "2px 8px", borderRadius: 999, fontWeight: 800 }}>{lint.label}</span>
                        {duplicateAltIds.has(img.id) ? <span style={{ fontSize: 11, background: "#e11d48", color: "#f8fafc", padding: "2px 8px", borderRadius: 999, fontWeight: 800 }}>Duplicate</span> : null}
                      </div>
                      <div style={{ fontSize: 12, color: "#cbd5e1", wordBreak: "break-all" }}>
                        <b>URL:</b> {shortenUrl(img.url) || "(none)"}
                        {img.url ? (
                          <button onClick={() => { navigator.clipboard?.writeText(img.url); showToast("URL copied"); }} style={{ marginLeft: 8, background: "#1f2937", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>Copy</button>
                        ) : null}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontWeight: 700, color: "#e5e7eb" }}>Alt</div>
                        <div style={{ fontSize: 13, color: "#e2e8f0" }} title={resolveAlt(img) || "(none)"}>
                          {truncate(resolveAlt(img), 220) || "(none)"}
                          {resolveAlt(img) ? (
                            <button onClick={() => { navigator.clipboard?.writeText(resolveAlt(img)); showToast("Alt copied"); }} style={{ marginLeft: 8, background: "#1f2937", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>Copy</button>
                          ) : null}
                        </div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8", display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {img.createdAt || img.created_at || img.createdat ? <span>Created: {formatDate(img.createdAt || img.created_at || img.createdat)}</span> : null}
                        {img.score ? <span>Score: {img.score}</span> : null}
                        <button onClick={() => handleAiRewriteSingle(img)} disabled={rewritingId === img.id || loading} style={{ background: rewritingId === img.id ? "#475569" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: rewritingId === img.id || loading ? "wait" : "pointer", boxShadow: rewritingId === img.id ? "none" : "0 4px 12px rgba(139, 92, 246, 0.3)", transition: "all 0.2s", transform: "translateY(0)" }} onMouseEnter={e => { if (rewritingId !== img.id && !loading) e.target.style.transform = "translateY(-2px)"; }} onMouseLeave={e => e.target.style.transform = "translateY(0)"}>
                          {rewritingId === img.id ? "⏳ Rewriting…" : "✨ AI rewrite"}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
            {!filteredImages.length ? <li style={{ color: "#a3e635" }}>No images yet.</li> : null}
          </ul>
        </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Tone</span>
          <select value={tone} onChange={e => setTone(e.target.value)} aria-label="Tone" style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}>
            {(meta?.presets?.tone || ["minimalist", "balanced", "expressive"]).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Verbosity</span>
          <select value={verbosity} onChange={e => setVerbosity(e.target.value)} aria-label="Verbosity" style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}>
            {(meta?.presets?.verbosity || ["terse", "balanced", "detailed"]).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Variants</span>
            <input type="number" min={1} max={5} value={variantCount} onChange={e => setVariantCount(Math.min(5, Math.max(1, Number(e.target.value) || 1)))} aria-label="Variant count" style={{ width: 80, padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }} />
            <span style={{ fontSize: 12, color: "#a3e635" }}>1-5 suggestions</span>
          </label>
          <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Preset bundle</span>
            <select value={selectedBundle} onChange={e => applyBundle(e.target.value)} aria-label="Preset bundle" style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}>
              <option value="custom">Custom</option>
              {(meta?.presets?.bundles || []).map(b => (
                <option key={b.key} value={b.key}>{b.key}</option>
              ))}
            </select>
            {selectedBundle !== "custom" && (
              <span style={{ fontSize: 12, color: "#a3e635" }}>{(meta?.presets?.bundles || []).find(b => b.key === selectedBundle)?.description || ""}</span>
            )}
          </label>
        </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <input
          value={productTitle}
          onChange={e => setProductTitle(e.target.value)}
          placeholder="Product title"
          aria-label="Product title"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}
        />
        <input
          value={variant}
          onChange={e => setVariant(e.target.value)}
          placeholder="Variant (e.g., red / size M)"
          aria-label="Variant"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Shot type</span>
          <select value={shotType} onChange={e => setShotType(e.target.value)} aria-label="Shot type" style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}>
            <option value="front">front</option>
            <option value="back">back</option>
            <option value="side">side</option>
            <option value="detail">detail close-up</option>
            <option value="lifestyle">lifestyle scene</option>
            <option value="packaging">packaging</option>
          </select>
        </label>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Focus</span>
          <select value={focus} onChange={e => setFocus(e.target.value)} aria-label="Focus" style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}>
            <option value="product">product</option>
            <option value="scene">scene</option>
            <option value="detail">detail</option>
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 16, background: "#1f2937", borderRadius: 12, padding: 14, border: "1px solid #555" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Lint existing alt text</div>
        <textarea
          value={lintOnlyText}
          onChange={e => setLintOnlyText(e.target.value)}
          rows={3}
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: "1px solid #555", marginBottom: 10, background: "#23263a", color: "#a3e635" }}
          placeholder="Paste alt text to lint"
          aria-label="Alt text to lint"
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
          <input
            value={lintOnlyKeywords}
            onChange={e => setLintOnlyKeywords(e.target.value)}
            placeholder="Keywords (comma separated)"
            aria-label="Lint keywords"
            style={{ width: "100%", fontSize: 14, padding: 10, borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}
          />
          <input
            value={lintOnlyBrandTerms}
            onChange={e => setLintOnlyBrandTerms(e.target.value)}
            placeholder={meta?.presets?.brandVocabHint || "Brand vocabulary (comma separated)"}
            aria-label="Lint brand vocabulary"
            style={{ width: "100%", fontSize: 14, padding: 10, borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}
          />
        </div>
        <button onClick={handleLintOnly} disabled={loading || !lintOnlyText.trim()} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}>Lint Now</button>
        {lintOnlyResult && (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            <div><b>Issues:</b> {lintOnlyResult.issueCount ?? lintOnlyResult.issues?.length ?? 0}</div>
            <div><b>Warnings:</b> {lintOnlyResult.warningCount ?? lintOnlyResult.warnings?.length ?? 0}</div>
            <div><b>Total findings:</b> {lintOnlyResult.totalFindings ?? ((lintOnlyResult.issues?.length || 0) + (lintOnlyResult.warnings?.length || 0))}</div>
            <div><b>Issue list:</b> {lintOnlyResult.issues?.length ? lintOnlyResult.issues.join('; ') : 'None'}</div>
            <div><b>Length:</b> {lintOnlyResult.length} ({lintOnlyResult.withinRange ? 'within recommended range' : 'outside recommended range'})</div>
            {lintOnlyResult.redactedAlt && <div><b>Redacted:</b> {lintOnlyResult.redactedAlt}</div>}
            {lintOnlyResult.sanitizedAlt && lintOnlyResult.sanitizedAlt !== lintOnlyText && <div><b>Sanitized:</b> {lintOnlyResult.sanitizedAlt}</div>}
          </div>
        )}
        {lintOnlyGrade && (
          <div style={{ marginTop: 8 }}>
            <b>Grade:</b> {lintOnlyGrade.grade} ({lintOnlyGrade.score})
          </div>
        )}
      </div>
      <textarea
        value={attributes}
        onChange={e => setAttributes(e.target.value)}
        rows={3}
        style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: "1px solid #555", marginBottom: 12, background: "#23263a", color: "#a3e635" }}
        placeholder="Attributes (comma or JSON: color, material, style, use-case)"
        aria-label="Attributes"
      />
      <input
        value={scene}
        onChange={e => setScene(e.target.value)}
        placeholder="Scene (e.g., studio on white, outdoor cafe)"
        aria-label="Scene"
        style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: "1px solid #555", marginBottom: 12, background: "#23263a", color: "#a3e635" }}
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Locale</span>
          <select value={locale} onChange={e => setLocale(e.target.value)} aria-label="Locale" style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}>
            <option value="en-US">en-US</option>
            <option value="en-GB">en-GB</option>
            <option value="de">de</option>
            <option value="fr">fr</option>
            <option value="es">es</option>
            <option value="ja">ja</option>
            <option value="ko">ko</option>
            <option value="zh">zh</option>
          </select>
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }} aria-label="Locale presets">
          <button onClick={() => applyLocalePreset("en-US")} style={{ background: "#e2e8f0", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: "pointer" }}>US</button>
          <button onClick={() => applyLocalePreset("en-GB")} style={{ background: "#e2e8f0", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: "pointer" }}>UK</button>
          <button onClick={() => applyLocalePreset("de")} style={{ background: "#e2e8f0", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: "pointer" }}>DE</button>
          <button onClick={() => applyLocalePreset("fr")} style={{ background: "#e2e8f0", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: "pointer" }}>FR</button>
        </div>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={safeMode} onChange={e => setSafeMode(e.target.checked)} />
          <span>Safe mode (PII/promo sanitization)</span>
        </label>
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #555", marginBottom: 18, background: "#23263a", color: "#a3e635" }}
        placeholder="Describe your image or alt text needs here..."
        aria-label="Image alt text input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={handleGenerate} disabled={loading || (!input && !imageUrl)} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Generating..." : "AI Generate"}</button>
        <button onClick={handleCaption} disabled={loading || (!input && !imageUrl)} style={{ background: "#f59e0b", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>AI Caption</button>
        <button onClick={handleAddImage} disabled={!result} style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Save Alt Text</button>
        <button onClick={handleCopyResult} disabled={!result} style={{ background: "#14b8a6", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{copied ? "Copied" : "Copy"}</button>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import images" />
        <button onClick={handleExportJson} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export JSON</button>
        <button onClick={handleExportCsv} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export CSV</button>
        {exported && <a href={exported} download={exportFilename || "export"} style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
        <button onClick={resetForm} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Reset form</button>
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {importErrorDownloadUrl && (
        <div style={{ color: "#ef4444", marginBottom: 8 }}>
          Validation errors detected{importErrorCount ? ` (${importErrorCount})` : ''}. <a href={importErrorDownloadUrl} download="import-errors.json" style={{ color: "#f87171", fontWeight: 700 }}>Download errors JSON</a>
        </div>
      )}
      {result && (
        <div style={{ background: "#23263a", borderRadius: 10, padding: 16, marginBottom: 12, color: "#a3e635" }} aria-live="polite">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Alt Text:</div>
          <div>{result}</div>
          {lint && (
            <div style={{ marginTop: 8, fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>Lint:</span> {lint.withinRange ? "Length OK" : `Length ${lint.length}`}
              <div style={{ marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span>Issues: {lint.issueCount ?? lint.issues?.length ?? 0}</span>
                <span>Warnings: {lint.warningCount ?? lint.warnings?.length ?? 0}</span>
                <span>Total: {lint.totalFindings ?? ((lint.issues?.length || 0) + (lint.warnings?.length || 0))}</span>
              </div>
              {lint.issues?.length ? <ul style={{ margin: "6px 0 0 18px" }}>{lint.issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <span style={{ marginLeft: 8 }}>No issues detected</span>}
              {lint.redactedAlt && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontWeight: 600 }}>Redacted suggestion:</span> {lint.redactedAlt}
                  <button onClick={() => setResult(lint.redactedAlt)} style={{ marginLeft: 8, background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>Apply</button>
                </div>
              )}
              {sanitized && sanitized !== result && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontWeight: 600 }}>Sanitized:</span> {sanitized}
                  <button onClick={() => setResult(sanitized)} style={{ marginLeft: 8, background: "#a3e635", color: "#23263a", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>Use sanitized</button>
                </div>
              )}
            </div>
          )}
          {grade && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700 }}>Grade:</span>
              <span style={{ padding: "4px 10px", borderRadius: 8, background: grade.grade === 'A' ? '#22c55e' : grade.grade === 'B' ? '#84cc16' : grade.grade === 'C' ? '#fbbf24' : '#ef4444', color: '#0b0b0b', fontWeight: 800 }}>{grade.grade} ({grade.score})</span>
            </div>
          )}
          {variants?.length ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Variants ({variants.length})</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {variants.map((v, idx) => {
                  const issues = v.lint?.issueCount ?? v.lint?.issues?.length ?? 0;
                  const warnings = v.lint?.warningCount ?? v.lint?.warnings?.length ?? 0;
                  return (
                    <div key={`${v.label || 'v'}-${idx}`} style={{ border: selectedVariantIdx === idx ? "2px solid #0ea5e9" : "1px solid #555", borderRadius: 10, padding: 10, background: "#1f2937" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700 }}>{v.label || `Variant ${idx + 1}`}</span>
                        {v.grade ? <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 8, background: v.grade.grade === 'A' ? '#22c55e' : v.grade.grade === 'B' ? '#84cc16' : v.grade.grade === 'C' ? '#fbbf24' : '#ef4444', color: '#0b0b0b', fontWeight: 800 }}>{v.grade.grade} ({v.grade.score})</span> : null}
                      </div>
                      <div style={{ fontSize: 14, marginBottom: 6 }}>{v.altText}</div>
                      <div style={{ fontSize: 12, color: "#a3e635", marginBottom: 8 }}>Issues {issues}; Warnings {warnings}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => applyVariant(idx)} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Use</button>
                        <button onClick={() => handleCopyText(v.altText, "Variant copied") } style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Copy</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleCopyResult} disabled={!result} style={{ background: "#14b8a6", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{copied ? "Copied" : "Copy"}</button>
            <button onClick={handleDownloadResult} disabled={!result} style={{ background: "#e0f2fe", color: "#0f172a", border: "1px solid #bae6fd", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Download .txt</button>
            {resultDownloadUrl && <a href={resultDownloadUrl} download="alt-text.txt" style={{ alignSelf: "center", color: "#0ea5e9", fontWeight: 700 }}>Save file</a>}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
              <button onClick={handleSimulateSelected} aria-label="Simulate AI for selected" disabled={!roleCanSimulate || !selectedImageIds.length || loading} style={{ background: roleCanSimulate ? "#e0e7ff" : "#334155", color: roleCanSimulate ? "#1e293b" : "#94a3b8", border: "1px solid #c7d2fe", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: (!roleCanSimulate || !selectedImageIds.length || loading) ? "not-allowed" : "pointer" }}>Simulate AI</button>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                Translate to
                <select value={translateLocale} onChange={e => setTranslateLocale(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635" }}>
                  {['es','fr','de','en-GB','en-US','ja','ko','zh'].map(code => <option key={code} value={code}>{code}</option>)}
                </select>
              </label>
              {localeStyleGuides[translateLocale] ? (
                <span style={{ fontSize: 11, color: "#cbd5e1", background: "#0b1220", border: "1px solid #334155", borderRadius: 8, padding: "6px 10px" }}>
                  Tone {localeStyleGuides[translateLocale].tone}; Formality {localeStyleGuides[translateLocale].formality}; Punct {localeStyleGuides[translateLocale].punctuation}; Numerals {localeStyleGuides[translateLocale].numerals}
                </span>
              ) : null}
              <button onClick={() => handleTranslateSelected(false)} aria-label="Translate selected (preview)" disabled={!roleCanSimulate || !selectedImageIds.length || loading} style={{ background: roleCanSimulate ? "#c084fc" : "#334155", color: roleCanSimulate ? "#0b0b0b" : "#94a3b8", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: (!roleCanSimulate || !selectedImageIds.length || loading) ? "not-allowed" : "pointer" }}>Translate (preview)</button>
              <button onClick={() => handleTranslateSelected(true)} aria-label="Translate and apply" disabled={!roleCanApply || !selectedImageIds.length || loading} style={{ background: roleCanApply ? "#a855f7" : "#334155", color: roleCanApply ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: (!roleCanApply || !selectedImageIds.length || loading) ? "not-allowed" : "pointer" }}>Translate + apply</button>
              <button onClick={handleVisionCheck} aria-label="Run vision QC for selected" disabled={!roleCanSimulate || !selectedImageIds.length || loading} style={{ background: roleCanSimulate ? "#38bdf8" : "#334155", color: roleCanSimulate ? "#0b0b0b" : "#94a3b8", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: (!roleCanSimulate || !selectedImageIds.length || loading) ? "not-allowed" : "pointer" }}>Vision QC</button>
            </div>
          </div>
        </div>
      )}
        {captionResult && (
          <div style={{ background: "#1f2937", borderRadius: 10, padding: 14, marginBottom: 12, color: "#a3e635" }} aria-live="polite">
            <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Caption:</div>
            <div>{captionResult}</div>
            {captionLint && (
              <div style={{ marginTop: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>Length:</span> {captionLint.length}; Issues {captionLint.issueCount ?? captionLint.issues?.length ?? 0}; Warnings {captionLint.warningCount ?? captionLint.warnings?.length ?? 0}
              </div>
            )}
            <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => handleCopyText(captionResult, "Caption copied")} style={{ background: "#14b8a6", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Copy caption</button>
              {captionSanitized && captionSanitized !== captionResult ? (
                <button onClick={() => setCaptionResult(captionSanitized)} style={{ background: "#e0f2fe", color: "#0f172a", border: "1px solid #bae6fd", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Use sanitized</button>
              ) : null}
            </div>
          </div>
        )}
      {error && (
        <div style={{ background: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)", color: "#7f1d1d", padding: "16px 20px", borderRadius: 16, marginBottom: 20, fontSize: 14, fontWeight: 600, border: "2px solid #dc2626", boxShadow: "0 4px 16px rgba(220, 38, 38, 0.2)" }} role="alert" aria-live="assertive">
          ❌ {error}
          <div style={{ marginTop: 12 }}>
            <button onClick={reconnectShopify} style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)" }}>
              🔗 Reconnect Shopify
            </button>
          </div>
        </div>
      )}
      {toast && <div style={{ background: "linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)", color: "#064e3b", padding: "16px 20px", borderRadius: 16, marginBottom: 20, fontSize: 14, fontWeight: 600, border: "2px solid #10b981", boxShadow: "0 4px 16px rgba(16, 185, 129, 0.2)" }} role="status" aria-live="polite">✅ {toast}</div>}
      {loading && <div role="status" aria-live="polite" style={{ fontSize: 14, color: "#fbbf24", fontWeight: 700, padding: "12px 20px", background: "rgba(251, 191, 36, 0.1)", borderRadius: 12, marginBottom: 16, border: "1px solid rgba(251, 191, 36, 0.3)" }}>⏳ Loading...</div>}

      <div style={{ marginTop: 24, background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", borderRadius: 20, padding: 24, border: "2px solid #475569", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16, color: "#f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>📝 Batch Generate (JSON array)</div>
        <textarea
          value={batchInput}
          onChange={e => setBatchInput(e.target.value)}
          rows={6}
          style={{ width: "100%", fontSize: 14, padding: 16, borderRadius: 12, border: "2px solid #64748b", background: "#0f172a", color: "#e2e8f0", fontFamily: 'Menlo, Consolas, monospace', transition: "all 0.2s", outline: "none" }}
          aria-label="Batch JSON"
          placeholder='[
  { "input": "red leather tote on white", "url": "https://...", "keywords": "leather tote" }
]'
        />
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={handleBatchGenerate} disabled={loading} style={{ background: "#10b981", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{loading ? "Working..." : "Run Batch"}</button>
          <button onClick={loadSampleBatch} disabled={loading} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Load sample batch</button>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#a3e635" }}>
            Chunk size
            <input type="number" min={1} max={100} value={chunkSize} onChange={e => setChunkSize(Number(e.target.value) || 1)} style={{ width: 70, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#a3e635" }}>
            Variants
            <input type="number" min={1} max={5} value={batchVariantCount} onChange={e => setBatchVariantCount(Math.min(5, Math.max(1, Number(e.target.value) || 1)))} style={{ width: 70, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#a3e635" }}>
            Pause ms
            <input type="number" min={0} max={2000} value={paceMs} onChange={e => setPaceMs(Math.max(0, Number(e.target.value) || 0))} style={{ width: 80, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
          </label>
          <span style={{ fontSize: 13, color: "#a3e635" }}>Sends to /ai/batch-generate; locale, safe mode, tone, verbosity, keywords, brand vocab, chunking, and pacing are applied.</span>
          {batchDownloadUrl && <a href={batchDownloadUrl} download="batch-results.json" style={{ color: "#a3e635", fontWeight: 600 }}>Download results JSON</a>}
          {batchResults?.length ? <button onClick={handleCopyBatchResults} disabled={batchCopying} style={{ background: "#c084fc", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>{batchCopying ? "Copying..." : "Copy results"}</button> : null}
          {batchResults?.length ? <button onClick={resetBatchState} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Clear batch state</button> : null}
        </div>
        {batchProgress > 0 && (
          <div style={{ marginTop: 10 }} aria-label="Batch progress" aria-live="polite">
            <div style={{ height: 10, background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, Math.round(batchProgress))}%`, height: "100%", background: "#10b981", transition: "width 0.2s ease" }} />
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: "#a3e635" }}>{Math.min(100, Math.round(batchProgress))}%</div>
          </div>
        )}
        {batchSummary && (
          <div style={{ marginTop: 12, padding: 12, background: "#111827", borderRadius: 10, fontSize: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Batch summary</div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span>Total {batchSummary.total}</span>
              <span>OK {batchSummary.ok}</span>
              <span>Errors {batchSummary.errors}</span>
              <span>Duration {batchSummary.durationMs}ms</span>
              {batchSummary.chunkSize ? <span>Chunk {batchSummary.chunkSize}</span> : null}
              {typeof batchSummary.paceMs === 'number' ? <span>Pace {batchSummary.paceMs}ms</span> : null}
            </div>
          </div>
        )}
        {batchResults?.some(r => !r.ok) ? (
          <div style={{ marginTop: 8 }}>
            <button onClick={retryFailedBatch} style={{ background: "#f59e0b", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Retry failed items</button>
          </div>
        ) : null}
        {batchResults?.length ? (
          <ul style={{ marginTop: 12, paddingLeft: 18 }}>
            {batchResults.map((r, idx) => (
              <li key={idx} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>Item {idx + 1}: {r.ok ? "OK" : "Error"}</div>
                {r.error && <div style={{ color: "#ef4444" }}>{r.error}</div>}
                {r.result && <div><b>Alt:</b> {r.result}</div>}
                {r.meta?.url && <div><b>URL:</b> {r.meta.url}</div>}
                {(r.meta?.tone || r.meta?.verbosity) && (
                  <div><b>Style:</b> {r.meta?.tone || "balanced"} · {r.meta?.verbosity || "balanced"}</div>
                )}
                {r.variants?.length ? (
                  <div>
                    <div style={{ fontWeight: 600 }}>Variants</div>
                    <ul style={{ margin: "4px 0 0 16px" }}>
                      {r.variants.map((v, vIdx) => (
                        <li key={`${v.label || 'v'}-${vIdx}`} style={{ marginBottom: 4 }}>
                          <div><b>{v.label || `Variant ${vIdx + 1}`}:</b> {v.altText}</div>
                          {v.grade ? <div style={{ fontSize: 12 }}>Grade {v.grade.grade} ({v.grade.score})</div> : null}
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                            <button onClick={() => handleCopyText(v.altText, "Variant copied")} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Copy</button>
                            <button onClick={() => handleSaveBatchItem({ ...r, meta: r.meta || {} }, v.altText)} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save this</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {r.meta?.brandTerms && <div><b>Brand vocab:</b> {r.meta.brandTerms}</div>}
                {r.grade && <div><b>Grade:</b> {r.grade.grade} ({r.grade.score})</div>}
                {r.lint?.issues?.length ? <div><b>Issues:</b> {r.lint.issues.join('; ')}</div> : null}
                {r.result && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <button onClick={() => handleSaveBatchItem(r)} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>Save to library</button>
                    <button onClick={() => handleCopyText(r.result, "Alt copied")} style={{ background: "#cbd5e1", color: "#0b0b0b", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>Copy alt</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {runs?.length ? (
        <div style={{ marginTop: 18, background: "#111827", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Recent Batch Runs</div>
          <div style={{ marginBottom: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={handleDownloadRuns} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Download runs JSON</button>
            {runsDownloadUrl && <a href={runsDownloadUrl} download="runs.json" style={{ color: "#a3e635", fontWeight: 600 }}>Save runs</a>}
          </div>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {runs.slice(-5).reverse().map(run => (
              <li key={run.id} style={{ marginBottom: 6, fontSize: 13 }}>
                <b>{run.total} items</b> · ok {run.ok} / err {run.errors} · {run.durationMs}ms · locale {run.locale} · safe {String(run.safeMode)}
                {run.tone || run.verbosity ? <> · {run.tone || 'balanced'} · {run.verbosity || 'balanced'}</> : null}
                {run.brandTerms ? <> · brand vocab</> : null}
                {run.chunkSize ? <> · chunk {run.chunkSize}</> : null}
                {typeof run.paceMs === 'number' && run.paceMs > 0 ? <> · pace {run.paceMs}ms</> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ marginTop: 24, background: "#334155", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Images</div>
        <ul style={{ paddingLeft: 18 }}>
          {images.map(img => (
            <li key={img.id} style={{ marginBottom: 10 }}>
              <div><b>ID:</b> {img.id}</div>
              <div><b>URL:</b> {img.url || "(none)"}</div>
              <div><b>Alt:</b> {img.altText || img.content || JSON.stringify(img)}</div>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 24, background: "#334155", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Analytics</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={collectionFilter}
              onChange={e => setCollectionFilter(e.target.value)}
              placeholder="Filter by collection (substring)"
              aria-label="Collection filter"
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635", minWidth: 180 }}
            />
            <input
              value={vendorFilter}
              onChange={e => setVendorFilter(e.target.value)}
              placeholder="Filter by vendor (substring)"
              aria-label="Vendor filter"
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #555", background: "#23263a", color: "#a3e635", minWidth: 180 }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={includeHeaders} onChange={e => setIncludeHeaders(e.target.checked)} />
              <span>CSV headers</span>
            </label>
            <button onClick={fetchAnalytics} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Refresh</button>
            <button onClick={fetchMissing} style={{ background: "#f59e0b", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Missing</button>
            <button onClick={fetchLengthBands} style={{ background: "#10b981", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Length bands</button>
            <button onClick={fetchDuplicates} style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Duplicates</button>
            <button onClick={handleExportCsv} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Export CSV</button>
            <button onClick={async () => { await fetchJson("/api/image-alt-media-seo/analytics/cache/clear", { method: "POST" }); showToast("Analytics cache cleared"); }} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Clear cache</button>
          </div>
        </div>
        <div style={{ fontSize: 15, color: "#a3e635" }}>
          {analytics ? (
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <div><b>Total:</b> {analytics.totalImages ?? 0}</div>
              <div><b>Avg length:</b> {analytics.avgLength ?? 0}</div>
              <div><b>Missing URL:</b> {analytics.missingUrl ?? 0}</div>
              <div><b>Missing alt:</b> {analytics.missingAlt ?? 0}</div>
              <div><b>Duplicate alts:</b> {analytics.duplicateAlts ?? 0}</div>
              <div><b>Unique alts:</b> {analytics.uniqueAlts ?? 0}</div>
              <div><b>Coverage %:</b> {analytics.coveragePct ?? 0}%</div>
              {typeof analytics.cached !== 'undefined' ? <div><b>Cached:</b> {String(analytics.cached)}</div> : null}
            </div>
          ) : <span>No analytics yet. Generate or import images to see results.</span>}
        </div>
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#1f2937", borderRadius: 10, padding: 12, border: "1px solid #555" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Coverage vs goals</div>
            {coverageProgress.map(p => {
              const pct = Math.min(100, Math.max(0, p.value));
              const target = p.target ?? 0;
              const good = p.good;
              return (
                <div key={p.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{p.label}</span>
                    <span>{p.value}% (goal {target}{p.label.includes('%') ? '%' : ''})</span>
                  </div>
                  <div style={{ position: "relative", height: 10, background: "#0b1220", borderRadius: 999 }}>
                    <div style={{ position: "absolute", left: `${Math.min(100, Math.max(0, target))}%`, top: 0, bottom: 0, width: 2, background: "#f59e0b", opacity: 0.7 }} />
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: good ? "#22c55e" : "#f97316" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background: "#1f2937", borderRadius: 10, padding: 12, border: "1px solid #555" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Needs attention (this view)</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13 }}>
              <span style={{ padding: "4px 8px", borderRadius: 8, background: "#0f172a", border: "1px solid #334155" }}>Missing {issueStats.missing} ({issueStats.missingPct}%)</span>
              <span style={{ padding: "4px 8px", borderRadius: 8, background: "#0f172a", border: "1px solid #334155" }}>Short {issueStats.short} ({issueStats.shortPct}%)</span>
              <span style={{ padding: "4px 8px", borderRadius: 8, background: "#0f172a", border: "1px solid #334155" }}>Long {issueStats.long} ({issueStats.longPct}%)</span>
              <span style={{ padding: "4px 8px", borderRadius: 8, background: "#0f172a", border: "1px solid #334155" }}>Duplicate {issueStats.duplicate} ({issueStats.duplicatePct}%)</span>
              <span style={{ padding: "4px 8px", borderRadius: 8, background: "#0f172a", border: "1px solid #334155", color: "#a3e635" }}>OK {issueStats.ok} ({issueStats.okPct}%)</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#cbd5e1" }}>Counts/percentages respect current filters and sort, so you can zoom into segments.</div>
          </div>
        </div>
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#1f2937", borderRadius: 10, padding: 12, border: "1px solid #555" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Missing</div>
            {missingReport ? (
              <div style={{ fontSize: 14 }}>
                <div>Missing alt: {missingReport.missingAlt?.length ?? missingReport.counts?.missingAlt ?? 0}</div>
                <div>Missing URL: {missingReport.missingUrl?.length ?? missingReport.counts?.missingUrl ?? 0}</div>
                <div>Total considered: {missingReport.counts?.total ?? '-'}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                  <button onClick={() => handleCopyText((missingReport.missingAlt || []).join(', '), "Alt IDs copied")} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Copy alt IDs</button>
                  <button onClick={() => handleCopyText((missingReport.missingUrl || []).join(', '), "URL IDs copied")} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Copy URL IDs</button>
                  {missingDownloadUrl && <a href={missingDownloadUrl} download="missing.json" style={{ color: "#a3e635", fontWeight: 600 }}>Download JSON</a>}
                </div>
                {(missingReport.missingAlt?.length || missingReport.missingUrl?.length) ? (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontWeight: 600 }}>IDs</div>
                    <div style={{ fontSize: 12, color: "#a3e635" }}>Alt: {(missingReport.missingAlt || []).slice(0, 50).join(', ') || 'none'}</div>
                    <div style={{ fontSize: 12, color: "#a3e635" }}>URL: {(missingReport.missingUrl || []).slice(0, 50).join(', ') || 'none'}</div>
                  </div>
                ) : null}
              </div>
            ) : <div style={{ fontSize: 14 }}>Load missing report to view.</div>}
          </div>
          <div style={{ background: "#1f2937", borderRadius: 10, padding: 12, border: "1px solid #555" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Length bands</div>
            {lengthBands ? (
              <div style={{ fontSize: 14 }}>
                <div>Total: {lengthBands.total ?? 0}</div>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  {(lengthBands.bands || []).map(b => (
                    <li key={b.label}>{b.label}: {b.count}</li>
                  ))}
                </ul>
                <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => handleCopyText(JSON.stringify(lengthBands.bands || []), "Bands copied")} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Copy bands</button>
                  {lengthDownloadUrl && <a href={lengthDownloadUrl} download="length-bands.json" style={{ color: "#a3e635", fontWeight: 600 }}>Download JSON</a>}
                </div>
              </div>
            ) : <div style={{ fontSize: 14 }}>Load length bands to view.</div>}
          </div>
        </div>
        <div style={{ marginTop: 12, background: "#1f2937", borderRadius: 10, padding: 12, border: "1px solid #555" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Duplicates</div>
          {duplicates ? (
            <div style={{ fontSize: 14 }}>
              <div>Total duplicate alts: {duplicates.totalDuplicates ?? 0}</div>
              {(duplicates.duplicates || []).length ? (
                <ul style={{ margin: "8px 0 0 16px" }}>
                  {(duplicates.duplicates || []).slice(0, 50).map((d, idx) => (
                    <li key={`${d.altText}-${idx}`} style={{ marginBottom: 4 }}>
                      <div><b>Alt</b>: {d.altText}</div>
                      <div>Count: {d.count}; IDs: {(d.ids || []).join(', ')}</div>
                    </li>
                  ))}
                </ul>
              ) : <div>No duplicates found.</div>}
              <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => handleCopyText(JSON.stringify(duplicates.duplicates || []), "Duplicates copied")} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Copy list</button>
                {duplicatesDownloadUrl && <a href={duplicatesDownloadUrl} download="duplicates.json" style={{ color: "#a3e635", fontWeight: 600 }}>Download JSON</a>}
              </div>
            </div>
          ) : <div style={{ fontSize: 14 }}>Load duplicates to view.</div>}
        </div>
      </div>
      </div>
      <div style={{ marginTop: 40, padding: "24px 40px", fontSize: 13, color: "#cbd5e1", textAlign: "center", background: "linear-gradient(90deg, #1e293b 0%, #334155 100%)", borderTop: "2px solid #475569" }}>
        <span>✨ Powered by AURA Systems AI · <a href="mailto:support@aura-core.ai" style={{ color: "#8b5cf6", textDecoration: "underline", fontWeight: 600 }}>Contact Support</a></span>
      </div>
    </div>
  );
}
