import React, { useEffect, useState } from "react";

const sanitizeShop = (shop) => {
  if (!shop) return "";
  return String(shop).trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
};

const getShopFromQuery = () => {
  try {
    const params = new URLSearchParams(window.location.search || "");
    return sanitizeShop(params.get("shop"));
  } catch (_) {
    return "";
  }
};

export default function ShopifyReconnectButton({ shopDomain }) {
  const [status, setStatus] = useState({ state: "checking", detail: "" });

  useEffect(() => {
    let cancelled = false;
    const loadStatus = async () => {
      try {
        const res = await fetch("/api/integration/shopify/status");
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        const connected = json.connected ?? json.ok ?? json.status === "ok";
        if (connected) {
          setStatus({ state: "connected", detail: "" });
        } else {
          setStatus({ state: "disconnected", detail: json.error || json.message || `HTTP ${res.status}` });
        }
      } catch (err) {
        if (!cancelled) setStatus({ state: "unknown", detail: err.message });
      }
    };
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReconnect = () => {
    const stored = sanitizeShop(localStorage.getItem("auraShopDomain"));
    const shop = sanitizeShop(shopDomain) || getShopFromQuery() || stored;
    const target = shop ? `/shopify/auth?shop=${encodeURIComponent(shop)}` : "/connect-shopify";
    if (typeof window !== "undefined") {
      if (window.top) window.top.location.href = target;
      else window.location.href = target;
    }
  };

  const badge = (() => {
    switch (status.state) {
      case "connected":
        return { label: "Shopify: Connected", color: "#22c55e" };
      case "disconnected":
        return { label: "Shopify: Not connected", color: "#ef4444" };
      case "unknown":
        return { label: "Shopify: Unknown", color: "#f59e0b" };
      default:
        return { label: "Shopify: Checking…", color: "#93c5fd" };
    }
  })();

  return (
    <div style={{ position: "fixed", left: 18, bottom: 70, zIndex: 9000, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
      <span style={{
        background: badge.color,
        color: "#0b0b0b",
        padding: "4px 10px",
        borderRadius: 12,
        fontWeight: 800,
        fontSize: 12,
        boxShadow: "0 3px 12px #0004",
        minWidth: 0,
      }} title={status.detail || badge.label} aria-live="polite">
        {badge.label}
      </span>
      <button
        onClick={handleReconnect}
        style={{
          background: "#0ea5e9",
          color: "#0b0b0b",
          border: "none",
          borderRadius: 14,
          padding: "10px 14px",
          fontWeight: 800,
          fontSize: 14,
          boxShadow: "0 4px 14px #0ea5e955",
          cursor: "pointer"
        }}
        aria-label="Reconnect Shopify"
        title="Reconnect Shopify"
      >
        Reconnect Shopify
      </button>
    </div>
  );
}
