import React, { useEffect, useMemo, useState } from "react";
import "./FixQueue.css";

function normaliseCoreUrl(coreUrl) {
  return String(coreUrl || "").replace(/\/+$/, "");
}

function safeCopy(value) {
  const v = String(value || "");
  if (!v.trim()) return;
  navigator.clipboard.writeText(v).catch(() => {});
}

export default function FixQueue({ coreUrl, projectId }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  const normalizedCoreUrl = useMemo(
    () => normaliseCoreUrl(coreUrl),
    [coreUrl]
  );

  const endpoint = `${normalizedCoreUrl}/projects/${projectId}/fix-queue`;

  const loadQueue = async () => {
    setStatus("loading");
    setError("");

    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || res.statusText);
      }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e.message || "Failed to load Fix Queue");
      setItems([]);
    }
  };

  const removeItem = async (id) => {
    if (!window.confirm("Remove this item from the Fix Queue?")) return;

    try {
      await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      loadQueue();
    } catch {
      alert("Failed to remove item");
    }
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  return (
    <div className="fixq-wrap">
      <div className="fixq-header">
        <div>
          <h2 className="fixq-title">Fix Queue</h2>
          <p className="fixq-subtitle">
            Pages waiting to be fixed. Work top to bottom and clear them out.
          </p>
        </div>

        <button
          className="button button--ghost"
          onClick={loadQueue}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {status === "error" && (
        <div className="fixq-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <table className="fixq-table">
        <thead>
          <tr>
            <th>URL</th>
            <th>Issues</th>
            <th>Added</th>
            <th style={{ width: 200 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!items.length ? (
            <tr>
              <td colSpan={4} className="fixq-empty">
                Fix Queue is empty. Add items from Content Health.
              </td>
            </tr>
          ) : (
            items.map((row) => (
              <tr key={row.id}>
                <td>
                  <a href={row.url} target="_blank" rel="noreferrer">
                    {row.url}
                  </a>
                </td>
                <td>
                  {(row.issues || []).map((i) => (
                    <span key={i} className="fixq-issue">
                      {i.replace(/_/g, " ")}
                    </span>
                  ))}
                </td>
                <td>
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleString()
                    : "—"}
                </td>
                <td>
                  <div className="fixq-actions">
                    <button
                      className="button button--ghost button--tiny"
                      onClick={() => safeCopy(row.url)}
                    >
                      Copy URL
                    </button>
                    <button
                      className="button button--ghost button--tiny"
                      onClick={() => removeItem(row.id)}
                    >
                      Done
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
