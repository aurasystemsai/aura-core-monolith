import React, { useEffect, useRef, useState } from "react";
import GUIDES from "./guides";

// A small "?" that opens a short explanation of the box it sits next to. Put it in the box's heading.
// `video` overrides the tool's tutorial video for this one box; `toolId` falls back to the tool's video.
export default function HelpTip({ title, children, video, toolId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (e.type === "keydown" ? e.key === "Escape" : ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const link = video || (toolId && GUIDES[toolId] && GUIDES[toolId].video);
  return (
    <span ref={ref} style={{ position: "relative", display: "inline-block", marginLeft: 6, verticalAlign: "middle" }}>
      <button type="button" aria-label={`Help: ${title}`} aria-expanded={open} onClick={() => setOpen(!open)}
        style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid #818cf8", background: "#eef2ff", color: "#4338ca", fontSize: 12, fontWeight: 700, cursor: "pointer", lineHeight: 1, padding: 0 }}>?</button>
      {open && (
        <div role="dialog" aria-label={title} style={{ position: "absolute", zIndex: 50, top: 26, left: 0, width: 280, background: "#fff", color: "#18181b", border: "1px solid #a1a1aa", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.18)", padding: 12, fontSize: 13, fontWeight: 400, textAlign: "left" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
          <div style={{ color: "#3f3f46" }}>{children}</div>
          {link && <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 8, color: "#4f46e5", fontWeight: 600 }}>Watch the video</a>}
        </div>
      )}
    </span>
  );
}
