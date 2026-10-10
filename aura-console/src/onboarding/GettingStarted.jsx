import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../api";

const KEY = "auraSetupSeen";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { return {}; } };

// First-run checklist for the dashboard. Steps tick themselves from real activity; the two "look at" steps
// tick when the merchant opens that page. Hides itself when finished or dismissed.
export default function GettingStarted({ setActiveSection }) {
  const [server, setServer] = useState(null);
  const [seen, setSeen] = useState(read);
  const [hidden, setHidden] = useState(() => localStorage.getItem(KEY + "Hidden") === "1");

  useEffect(() => {
    let live = true;
    apiFetchJSON("/api/help/setup").then((r) => { if (live && r.ok) setServer(r.steps); }).catch(() => {});
    return () => { live = false; };
  }, []);

  const go = (key, page) => {
    const next = { ...seen, [key]: true };
    setSeen(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setActiveSection(page);
  };

  const steps = [
    { key: "connected", label: "Connect your store", done: !!(server && server.connected), page: "settings", action: "Open settings" },
    { key: "seoFix", label: "Improve your first product with AI", done: !!(server && server.seoFix), page: "product-seo", action: "Open Product SEO", hint: "Pick a product, review what AI writes, apply it. You can undo it." },
    { key: "storefront", label: "Add something shoppers will see", done: !!(server && server.storefront), page: "popups", action: "Add a popup", hint: "A popup, size guide or back-in-stock alert." },
    { key: "credits", label: "See what AI actions cost", done: !!seen.credits, page: "credits", action: "View credits", hint: "Every price is shown before you confirm." },
    { key: "help", label: "Find the guides and contact form", done: !!seen.help, page: "help", action: "Open Help", hint: "Step-by-step guides for every tool, and a way to reach us." },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (hidden || !server || doneCount === steps.length) return null;

  const hide = () => { setHidden(true); localStorage.setItem(KEY + "Hidden", "1"); };
  return (
    <section aria-label="Getting started" style={{ background: "#fff", border: "1px solid #c7d2fe", borderRadius: 12, padding: 18, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 17, color: "#18181b" }}>Getting started <span style={{ fontWeight: 500, color: "#52525b", fontSize: 14 }}>{doneCount} of {steps.length} done</span></h2>
        <button type="button" onClick={hide} style={{ border: 0, background: "transparent", color: "#52525b", cursor: "pointer", fontSize: 13 }}>Hide</button>
      </div>
      <div style={{ height: 6, background: "#e4e4e7", borderRadius: 4, marginBottom: 12 }}><div style={{ height: 6, width: `${(doneCount / steps.length) * 100}%`, background: "#4f46e5", borderRadius: 4 }} /></div>
      {steps.map((s) => (
        <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid #f4f4f5" }}>
          <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${s.done ? "#15803d" : "#a1a1aa"}`, background: s.done ? "#15803d" : "#fff", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.done ? "✓" : ""}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "#18181b", textDecoration: s.done ? "line-through" : "none" }}>{s.label}<span style={{ position: "absolute", left: -9999 }}>{s.done ? " (done)" : ""}</span></div>
            {s.hint && !s.done && <div style={{ fontSize: 13, color: "#52525b" }}>{s.hint}</div>}
          </div>
          {!s.done && <button type="button" onClick={() => go(s.key, s.page)} style={{ background: "#4f46e5", color: "#fff", border: 0, borderRadius: 8, padding: "6px 12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{s.action}</button>}
        </div>
      ))}
    </section>
  );
}
