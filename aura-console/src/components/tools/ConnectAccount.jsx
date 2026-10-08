import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20, maxWidth: 640 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  row: { padding: "9px 10px", border: "1px solid #27272a", borderRadius: 8, marginBottom: 6, fontSize: 13 },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  muted: { color: "#71717a", fontSize: 12 },
};

// Shown for tools that need an outside account which is not connected yet. It displays no numbers.
export default function ConnectAccount({ api, title }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    apiFetchJSON(api + "/status").then((r) => (r.ok ? setInfo(r) : setError(r.error || "Could not load status."))).catch((e) => setError(e.message));
  }, [api]);
  return (
    <div style={S.root}>
      <h1 style={S.title}>{title}</h1>
      <p style={S.subtitle}>Not connected yet.</p>
      {error && <div style={S.error}>{error}</div>}
      {!info && !error && <div style={S.muted}>Loading…</div>}
      {info && (
        <div style={S.card}>
          <h2 style={S.h}>What this needs</h2>
          <p style={{ fontSize: 13, color: "#d4d4d8", marginTop: 0 }}>{info.description}</p>
          {info.needs.map((n) => <div key={n} style={S.row}>{n}</div>)}
          <p style={S.muted}>Until this is connected, nothing is shown here, so you never see made-up figures.</p>
        </div>
      )}
    </div>
  );
}