import React from "react";
import toolsMeta from "../toolMeta";
import GUIDES from "./guides";

// Side panel with the written steps and video for the tool the merchant is on. Opened from the header.
export default function HelpDrawer({ toolId, onClose, onMore }) {
  const guide = GUIDES[toolId];
  const tool = toolsMeta.find((t) => t.id === toolId);
  if (!guide || !tool) return null;
  return (
    <aside role="dialog" aria-label={`Help for ${tool.name}`} style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 340, maxWidth: "100%", background: "#fff", color: "#18181b", borderLeft: "1px solid #d4d4d8", boxShadow: "-8px 0 24px rgba(0,0,0,.12)", zIndex: 1000, padding: 20, overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{tool.name}</h2>
        <button type="button" onClick={onClose} aria-label="Close help" style={{ border: 0, background: "transparent", fontSize: 22, cursor: "pointer", color: "#3f3f46" }}>×</button>
      </div>
      <p style={{ color: "#52525b", marginTop: 0 }}>{tool.description}</p>
      {guide.video
        ? <a href={guide.video} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "#4f46e5", color: "#fff", textAlign: "center", borderRadius: 8, padding: "10px 0", fontWeight: 600, textDecoration: "none", marginBottom: 14 }}>Watch the video</a>
        : <p style={{ fontSize: 13, color: "#71717a", margin: "0 0 14px" }}>A video for this tool is coming soon.</p>}
      <h3 style={{ fontSize: 14, margin: "0 0 6px" }}>How to use it</h3>
      <ol style={{ paddingLeft: 20, color: "#3f3f46" }}>{guide.steps.map((s) => <li key={s} style={{ marginBottom: 6 }}>{s}</li>)}</ol>
      <button type="button" onClick={onMore} style={{ background: "#fff", color: "#18181b", border: "1px solid #a1a1aa", borderRadius: 8, padding: "8px 14px", fontWeight: 600, cursor: "pointer" }}>More help or contact us</button>
    </aside>
  );
}
