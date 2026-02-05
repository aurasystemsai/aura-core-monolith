import React, { useState, useRef } from "react";

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
  const [shopDomain, setShopDomain] = useState("");
  const [shopifyMaxImages, setShopifyMaxImages] = useState(250);
  const [shopifyProductLimit, setShopifyProductLimit] = useState(400);
  const [shopifyImporting, setShopifyImporting] = useState(false);
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
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [resultDownloadUrl, setResultDownloadUrl] = useState("");
  const fileInputRef = useRef();

  const showToast = (msg, timeout = 2200) => {
    setToast(msg);
    setTimeout(() => setToast(""), timeout);
  };

  const rateLimitMessage = retryAfter => {
    if (!retryAfter) return "Rate limit exceeded. Please wait a minute and retry.";
    return `Rate limit exceeded. Please wait ${retryAfter}s and retry.`;
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
    const res = await fetch(url, options);
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
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("limit", String(nextLimit || 20));
      params.set("offset", String(nextOffset || 0));
      if (nextSearch && nextSearch.trim()) params.set("search", nextSearch.trim());
      const qs = params.toString();
      const { data } = await fetchJson(`/api/image-alt-media-seo/images${qs ? `?${qs}` : ""}`);
      setImages(data.images || []);
      setImageLimit(data.limit || nextLimit || 20);
      setImageOffset(typeof data.offset === "number" ? data.offset : nextOffset || 0);
      setImageTotal(data.total || (data.images || []).length || 0);
    } catch (err) {
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

  const handleImagePageChange = delta => {
    const maxOffset = Math.max(0, imageTotal - imageLimit);
    const nextOffset = Math.min(maxOffset, Math.max(0, imageOffset + delta * imageLimit));
    if (nextOffset === imageOffset) return;
    fetchImages(nextOffset, imageLimit, imageSearch);
  };

  const handleImportShopify = async () => {
    const shop = shopDomain.trim().toLowerCase();
    if (!shop) {
      setError("Shop domain is required for Shopify import");
      return;
    }
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

  const clearSelectedImages = () => setSelectedImageIds([]);

  const handleBulkApply = async () => {
    if (!selectedImageIds.length) {
      setError("Select at least one image to bulk update");
      return;
    }
    if (!bulkAltText.trim()) {
      setError("Add alt text to apply");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const items = selectedImageIds.map(id => ({ id, altText: bulkAltText.trim() }));
      const { data } = await fetchJson("/api/image-alt-media-seo/images/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      const updatedCount = (data.updated || []).filter(u => u.ok).length;
      showToast(`Updated ${updatedCount} images`);
      fetchImages();
    } catch (err) {
      if (err?.status === 429) setError(rateLimitMessage(err.retryAfter));
      else setError(err.message);
    } finally {
      setLoading(false);
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
    <div style={{ padding: 24, background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Image Alt Media SEO</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#334155", fontSize: 16 }}>
        <li>Generate, import, and manage image alt text with AI</li>
        <li>Analyze performance with real-time analytics</li>
        <li>Collaborate and share with your team</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  React.useEffect(() => {
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

  const totalImagePages = imageLimit ? Math.max(1, Math.ceil(imageTotal / imageLimit)) : 1;
  const currentImagePage = imageLimit ? Math.floor(imageOffset / imageLimit) + 1 : 1;

      {(result || captionResult) && (
        <div style={{ display: "grid", gridTemplateColumns: captionResult ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 12 }}>
          {result ? (
            <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 10, padding: 16, color: darkMode ? "#a3e635" : "#23263a" }} aria-live="polite">
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
                        <div key={`${v.label || 'v'}-${idx}`} style={{ border: selectedVariantIdx === idx ? `2px solid ${darkMode ? '#0ea5e9' : '#2563eb'}` : "1px solid #cbd5e1", borderRadius: 10, padding: 10, background: darkMode ? "#1f2937" : "#fff" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700 }}>{v.label || `Variant ${idx + 1}`}</span>
                            {v.grade ? <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 8, background: v.grade.grade === 'A' ? '#22c55e' : v.grade.grade === 'B' ? '#84cc16' : v.grade.grade === 'C' ? '#fbbf24' : '#ef4444', color: '#0b0b0b', fontWeight: 800 }}>{v.grade.grade} ({v.grade.score})</span> : null}
                          </div>
                          <div style={{ fontSize: 14, marginBottom: 6 }}>{v.altText}</div>
                          <div style={{ fontSize: 12, color: darkMode ? "#a3e635" : "#475569", marginBottom: 8 }}>Issues {issues}; Warnings {warnings}</div>
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
            <div style={{ background: darkMode ? "#1f2937" : "#eef2ff", borderRadius: 10, padding: 16, color: darkMode ? "#a3e635" : "#23263a" }} aria-live="polite">
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
        <input
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="Image URL (optional but recommended)"
          aria-label="Image URL"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        />
        <input
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="Keywords (comma separated)"
          aria-label="Keywords"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a", marginTop: 10 }}
        />
        <input
          value={brandTerms}
          onChange={e => setBrandTerms(e.target.value)}
          placeholder="Brand vocabulary (comma separated)"
          aria-label="Brand terms"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a", marginTop: 10, marginBottom: 14 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Images</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={imageSearch}
                onChange={e => setImageSearch(e.target.value)}
                onKeyDown={handleImageSearchKeyDown}
                placeholder="Search URL or alt text"
                aria-label="Search images"
                style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a", minWidth: 180 }}
              />
              <button onClick={handleImageSearchSubmit} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Search</button>
              <button onClick={handleClearImageSearch} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Clear</button>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                Page size
                <select value={imageLimit} onChange={e => handleImageLimitChange(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
                  {[10, 20, 50, 100, 200].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <button onClick={() => fetchImages(imageOffset, imageLimit, imageSearch)} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Refresh</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={shopDomain}
                  onChange={e => setShopDomain(e.target.value)}
                  placeholder="shop.myshopify.com"
                  aria-label="Shopify shop domain"
                  style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a", minWidth: 180 }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  Max images
                  <input type="number" min={1} max={5000} value={shopifyMaxImages} onChange={e => setShopifyMaxImages(Math.min(Math.max(Number(e.target.value) || 1, 1), 5000))} style={{ width: 90, padding: "6px 8px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1" }} />
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  Products
                  <input type="number" min={1} max={5000} value={shopifyProductLimit} onChange={e => setShopifyProductLimit(Math.min(Math.max(Number(e.target.value) || 1, 1), 5000))} style={{ width: 90, padding: "6px 8px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1" }} />
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
                  style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a", minWidth: 200 }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  Top
                  <select value={similarityLimit} onChange={e => setSimilarityLimit(Math.min(Math.max(Number(e.target.value) || 5, 1), 50))} style={{ padding: "6px 8px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
                    {[3, 5, 10, 20, 50].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <span>results</span>
                </label>
                <button onClick={handleSimilaritySearch} aria-label="Find similar alt text" style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Find similar</button>
              </div>
            </div>
          </div>
          {shopifyImportSummary ? (
            <div style={{ marginBottom: 10, fontSize: 13, color: darkMode ? "#a3e635" : "#0f172a" }}>
              <span>Shopify import:</span>
              <span style={{ marginLeft: 8 }}>Imported {shopifyImportSummary.imported}</span>
              <span style={{ marginLeft: 8 }}>Skipped {shopifyImportSummary.skipped}</span>
              <span style={{ marginLeft: 8 }}>Products scanned {shopifyImportSummary.productCount}</span>
            </div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10, fontSize: 13, color: darkMode ? "#a3e635" : "#475569" }}>
            <span>Showing {images.length} of {imageTotal} images</span>
            <span>Page {currentImagePage} / {totalImagePages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleImagePageChange(-1)} disabled={currentImagePage <= 1} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: currentImagePage <= 1 ? "not-allowed" : "pointer" }}>Prev</button>
              <button onClick={() => handleImagePageChange(1)} disabled={currentImagePage >= totalImagePages} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: currentImagePage >= totalImagePages ? "not-allowed" : "pointer" }}>Next</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10, fontSize: 13, color: darkMode ? "#a3e635" : "#475569" }}>
            <span role="status" aria-live="polite">Selected {selectedImageIds.length}</span>
            <button onClick={selectPageImages} aria-label="Select all images on this page" style={{ background: "#e0f2fe", color: "#0f172a", border: "1px solid #bae6fd", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: "pointer" }}>Select page</button>
            <button onClick={clearSelectedImages} aria-label="Clear selected images" disabled={!selectedImageIds.length} style={{ background: "#f8fafc", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 600, cursor: !selectedImageIds.length ? "not-allowed" : "pointer" }}>Clear selection</button>
          </div>
          <div style={{ marginBottom: 12, background: darkMode ? "#1f2937" : "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Bulk update selected alts</div>
            <textarea
              value={bulkAltText}
              onChange={e => setBulkAltText(e.target.value)}
              rows={2}
              aria-label="Bulk alt text"
              placeholder="Enter alt text to apply to selected images"
              style={{ width: "100%", fontSize: 14, padding: 10, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={handleBulkApply} aria-label={`Apply alt text to ${selectedImageIds.length} selected images`} disabled={!selectedImageIds.length || !bulkAltText.trim() || loading} style={{ background: "#10b981", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: (!selectedImageIds.length || !bulkAltText.trim() || loading) ? "not-allowed" : "pointer" }}>Apply to selected</button>
              {selectedImageIds.length ? <span style={{ fontSize: 12 }}>IDs: {selectedImageIds.slice(0, 6).join(', ')}{selectedImageIds.length > 6 ? '…' : ''}</span> : <span style={{ fontSize: 12 }}>Pick rows to enable bulk update</span>}
            </div>
          </div>
          {similarityResults?.length ? (
            <div style={{ marginBottom: 12, background: darkMode ? "#111827" : "#eef2ff", borderRadius: 10, padding: 12, border: "1px solid #cbd5e1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontWeight: 700 }}>Similar results for “{similarityQuery.trim()}” (top {similarityLimit})</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: darkMode ? "#a3e635" : "#475569" }}>Scores show token overlap</span>
                  <button onClick={handleDownloadSimilarCsv} aria-label="Download similar results as CSV" style={{ background: "#334155", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Download CSV</button>
                  {similarityDownloadUrl && <a href={similarityDownloadUrl} download="images-similar.csv" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>Save CSV</a>}
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
                    <div style={{ fontSize: 12, color: darkMode ? "#a3e635" : "#475569" }}><b>URL:</b> {item.url || '(none)'}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <ul style={{ paddingLeft: 18 }}>
            {images.map(img => (
              <li key={img.id} style={{ marginBottom: 10, background: selectedImageIds.includes(img.id) ? (darkMode ? "#0f172a" : "#e0f2fe") : "transparent", borderRadius: 10, padding: 10, border: "1px solid #cbd5e1" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <input type="checkbox" checked={selectedImageIds.includes(img.id)} onChange={() => toggleSelectImage(img.id)} aria-label={`Select image ${img.id}`} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div><b>ID:</b> {img.id}</div>
                      {selectedImageIds.includes(img.id) ? <span style={{ fontSize: 11, background: "#0ea5e9", color: "#fff", padding: "2px 6px", borderRadius: 999 }}>Selected</span> : null}
                    </div>
                    <div><b>URL:</b> {img.url || "(none)"}</div>
                    <div><b>Alt:</b> {img.altText || img.content || JSON.stringify(img)}</div>
                  </div>
                </div>
              </li>
            ))}
            {!images.length ? <li style={{ color: darkMode ? "#a3e635" : "#475569" }}>No images yet.</li> : null}
          </ul>
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Tone</span>
          <select value={tone} onChange={e => setTone(e.target.value)} aria-label="Tone" style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
            {(meta?.presets?.tone || ["minimalist", "balanced", "expressive"]).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Verbosity</span>
          <select value={verbosity} onChange={e => setVerbosity(e.target.value)} aria-label="Verbosity" style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
            {(meta?.presets?.verbosity || ["terse", "balanced", "detailed"]).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Variants</span>
            <input type="number" min={1} max={5} value={variantCount} onChange={e => setVariantCount(Math.min(5, Math.max(1, Number(e.target.value) || 1)))} aria-label="Variant count" style={{ width: 80, padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }} />
            <span style={{ fontSize: 12, color: darkMode ? "#a3e635" : "#475569" }}>1-5 suggestions</span>
          </label>
          <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Preset bundle</span>
            <select value={selectedBundle} onChange={e => applyBundle(e.target.value)} aria-label="Preset bundle" style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
              <option value="custom">Custom</option>
              {(meta?.presets?.bundles || []).map(b => (
                <option key={b.key} value={b.key}>{b.key}</option>
              ))}
            </select>
            {selectedBundle !== "custom" && (
              <span style={{ fontSize: 12, color: darkMode ? "#a3e635" : "#475569" }}>{(meta?.presets?.bundles || []).find(b => b.key === selectedBundle)?.description || ""}</span>
            )}
          </label>
        </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <input
          value={productTitle}
          onChange={e => setProductTitle(e.target.value)}
          placeholder="Product title"
          aria-label="Product title"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        />
        <input
          value={variant}
          onChange={e => setVariant(e.target.value)}
          placeholder="Variant (e.g., red / size M)"
          aria-label="Variant"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Shot type</span>
          <select value={shotType} onChange={e => setShotType(e.target.value)} aria-label="Shot type" style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
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
          <select value={focus} onChange={e => setFocus(e.target.value)} aria-label="Focus" style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
            <option value="product">product</option>
            <option value="scene">scene</option>
            <option value="detail">detail</option>
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 16, background: darkMode ? "#1f2937" : "#f8fafc", borderRadius: 12, padding: 14, border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Lint existing alt text</div>
        <textarea
          value={lintOnlyText}
          onChange={e => setLintOnlyText(e.target.value)}
          rows={3}
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", marginBottom: 10, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
          placeholder="Paste alt text to lint"
          aria-label="Alt text to lint"
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
          <input
            value={lintOnlyKeywords}
            onChange={e => setLintOnlyKeywords(e.target.value)}
            placeholder="Keywords (comma separated)"
            aria-label="Lint keywords"
            style={{ width: "100%", fontSize: 14, padding: 10, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
          />
          <input
            value={lintOnlyBrandTerms}
            onChange={e => setLintOnlyBrandTerms(e.target.value)}
            placeholder={meta?.presets?.brandVocabHint || "Brand vocabulary (comma separated)"}
            aria-label="Lint brand vocabulary"
            style={{ width: "100%", fontSize: 14, padding: 10, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
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
        style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 12, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        placeholder="Attributes (comma or JSON: color, material, style, use-case)"
        aria-label="Attributes"
      />
      <input
        value={scene}
        onChange={e => setScene(e.target.value)}
        placeholder="Scene (e.g., studio on white, outdoor cafe)"
        aria-label="Scene"
        style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 12, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Locale</span>
          <select value={locale} onChange={e => setLocale(e.target.value)} aria-label="Locale" style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
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
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
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
          Validation errors detected{importErrorCount ? ` (${importErrorCount})` : ''}. <a href={importErrorDownloadUrl} download="import-errors.json" style={{ color: darkMode ? "#f87171" : "#dc2626", fontWeight: 700 }}>Download errors JSON</a>
        </div>
      )}
      {result && (
        <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635" : "#23263a" }} aria-live="polite">
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
                    <div key={`${v.label || 'v'}-${idx}`} style={{ border: selectedVariantIdx === idx ? `2px solid ${darkMode ? '#0ea5e9' : '#2563eb'}` : "1px solid #cbd5e1", borderRadius: 10, padding: 10, background: darkMode ? "#1f2937" : "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700 }}>{v.label || `Variant ${idx + 1}`}</span>
                        {v.grade ? <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 8, background: v.grade.grade === 'A' ? '#22c55e' : v.grade.grade === 'B' ? '#84cc16' : v.grade.grade === 'C' ? '#fbbf24' : '#ef4444', color: '#0b0b0b', fontWeight: 800 }}>{v.grade.grade} ({v.grade.score})</span> : null}
                      </div>
                      <div style={{ fontSize: 14, marginBottom: 6 }}>{v.altText}</div>
                      <div style={{ fontSize: 12, color: darkMode ? "#a3e635" : "#475569", marginBottom: 8 }}>Issues {issues}; Warnings {warnings}</div>
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
      )}
        {captionResult && (
          <div style={{ background: darkMode ? "#1f2937" : "#eef2ff", borderRadius: 10, padding: 14, marginBottom: 12, color: darkMode ? "#a3e635" : "#23263a" }} aria-live="polite">
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
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }} role="alert" aria-live="assertive">{error}</div>}
      {toast && <div style={{ color: "#16a34a", marginBottom: 10 }} role="status" aria-live="polite">{toast}</div>}

      <div style={{ marginTop: 24, background: darkMode ? "#1f2937" : "#eef2ff", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Batch Generate (JSON array)</div>
        <textarea
          value={batchInput}
          onChange={e => setBatchInput(e.target.value)}
          rows={6}
          style={{ width: "100%", fontSize: 14, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a", fontFamily: 'Menlo, Consolas, monospace' }}
          aria-label="Batch JSON"
          placeholder='[
  { "input": "red leather tote on white", "url": "https://...", "keywords": "leather tote" }
]'
        />
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={handleBatchGenerate} disabled={loading} style={{ background: "#10b981", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{loading ? "Working..." : "Run Batch"}</button>
          <button onClick={loadSampleBatch} disabled={loading} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Load sample batch</button>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: darkMode ? "#a3e635" : "#475569" }}>
            Chunk size
            <input type="number" min={1} max={100} value={chunkSize} onChange={e => setChunkSize(Number(e.target.value) || 1)} style={{ width: 70, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: darkMode ? "#a3e635" : "#475569" }}>
            Variants
            <input type="number" min={1} max={5} value={batchVariantCount} onChange={e => setBatchVariantCount(Math.min(5, Math.max(1, Number(e.target.value) || 1)))} style={{ width: 70, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: darkMode ? "#a3e635" : "#475569" }}>
            Pause ms
            <input type="number" min={0} max={2000} value={paceMs} onChange={e => setPaceMs(Math.max(0, Number(e.target.value) || 0))} style={{ width: 80, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
          </label>
          <span style={{ fontSize: 13, color: darkMode ? "#a3e635" : "#475569" }}>Sends to /ai/batch-generate; locale, safe mode, tone, verbosity, keywords, brand vocab, chunking, and pacing are applied.</span>
          {batchDownloadUrl && <a href={batchDownloadUrl} download="batch-results.json" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>Download results JSON</a>}
          {batchResults?.length ? <button onClick={handleCopyBatchResults} disabled={batchCopying} style={{ background: "#c084fc", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>{batchCopying ? "Copying..." : "Copy results"}</button> : null}
          {batchResults?.length ? <button onClick={resetBatchState} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Clear batch state</button> : null}
        </div>
        {batchProgress > 0 && (
          <div style={{ marginTop: 10 }} aria-label="Batch progress" aria-live="polite">
            <div style={{ height: 10, background: darkMode ? "#0f172a" : "#e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, Math.round(batchProgress))}%`, height: "100%", background: "#10b981", transition: "width 0.2s ease" }} />
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: darkMode ? "#a3e635" : "#475569" }}>{Math.min(100, Math.round(batchProgress))}%</div>
          </div>
        )}
        {batchSummary && (
          <div style={{ marginTop: 12, padding: 12, background: darkMode ? "#111827" : "#e0f2fe", borderRadius: 10, fontSize: 14 }}>
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
        <div style={{ marginTop: 18, background: darkMode ? "#111827" : "#e0f2fe", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Recent Batch Runs</div>
          <div style={{ marginBottom: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={handleDownloadRuns} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Download runs JSON</button>
            {runsDownloadUrl && <a href={runsDownloadUrl} download="runs.json" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>Save runs</a>}
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

      <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
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
      <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Analytics</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={collectionFilter}
              onChange={e => setCollectionFilter(e.target.value)}
              placeholder="Filter by collection (substring)"
              aria-label="Collection filter"
              style={{ padding: "6px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a", minWidth: 180 }}
            />
            <input
              value={vendorFilter}
              onChange={e => setVendorFilter(e.target.value)}
              placeholder="Filter by vendor (substring)"
              aria-label="Vendor filter"
              style={{ padding: "6px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #cbd5e1", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a", minWidth: 180 }}
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
        <div style={{ fontSize: 15, color: darkMode ? "#a3e635" : "#23263a" }}>
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
          <div style={{ background: darkMode ? "#1f2937" : "#fff", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Missing</div>
            {missingReport ? (
              <div style={{ fontSize: 14 }}>
                <div>Missing alt: {missingReport.missingAlt?.length ?? missingReport.counts?.missingAlt ?? 0}</div>
                <div>Missing URL: {missingReport.missingUrl?.length ?? missingReport.counts?.missingUrl ?? 0}</div>
                <div>Total considered: {missingReport.counts?.total ?? '-'}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                  <button onClick={() => handleCopyText((missingReport.missingAlt || []).join(', '), "Alt IDs copied")} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Copy alt IDs</button>
                  <button onClick={() => handleCopyText((missingReport.missingUrl || []).join(', '), "URL IDs copied")} style={{ background: "#e2e8f0", color: "#0b0b0b", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Copy URL IDs</button>
                  {missingDownloadUrl && <a href={missingDownloadUrl} download="missing.json" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>Download JSON</a>}
                </div>
                {(missingReport.missingAlt?.length || missingReport.missingUrl?.length) ? (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontWeight: 600 }}>IDs</div>
                    <div style={{ fontSize: 12, color: darkMode ? "#a3e635" : "#475569" }}>Alt: {(missingReport.missingAlt || []).slice(0, 50).join(', ') || 'none'}</div>
                    <div style={{ fontSize: 12, color: darkMode ? "#a3e635" : "#475569" }}>URL: {(missingReport.missingUrl || []).slice(0, 50).join(', ') || 'none'}</div>
                  </div>
                ) : null}
              </div>
            ) : <div style={{ fontSize: 14 }}>Load missing report to view.</div>}
          </div>
          <div style={{ background: darkMode ? "#1f2937" : "#fff", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
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
                  {lengthDownloadUrl && <a href={lengthDownloadUrl} download="length-bands.json" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>Download JSON</a>}
                </div>
              </div>
            ) : <div style={{ fontSize: 14 }}>Load length bands to view.</div>}
          </div>
        </div>
        <div style={{ marginTop: 12, background: darkMode ? "#1f2937" : "#fff", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
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
                {duplicatesDownloadUrl && <a href={duplicatesDownloadUrl} download="duplicates.json" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>Download JSON</a>}
              </div>
            </div>
          ) : <div style={{ fontSize: 14 }}>Load duplicates to view.</div>}
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
